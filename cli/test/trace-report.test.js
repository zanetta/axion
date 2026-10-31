import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const packRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = path.join(packRoot, ".cursor", "scripts", "trace_report.py");

const SPEC = `# SPEC

## 8. Traceability

| SPEC ID | Related PLAN | Related ACCEPTANCE |
| --- | --- | --- |
| SPEC-cart-1 | cart.plan.md | cart.acceptance.md |
`;

const PLAN = `# PLAN

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P1-1 | add cart | backend-specialist | api-patterns | — | tests pass |

## Traceability

| SPEC ID | PLAN task | ACCEPTANCE ID |
| --- | --- | --- |
| SPEC-cart-1 | P1-1 | AC-1 |
`;

const ACCEPTANCE = `# ACCEPTANCE

## Criteria

| ID | Given / When / Then | Method | Command / evidence | Pass |
| --- | --- | --- | --- | --- |
| AC-1 | when an item is added | unit | npm test: 4 passed | [x] |

## Traceability

| ACCEPTANCE ID | PLAN task | SPEC ID |
| --- | --- | --- |
| AC-1 | P1-1 | SPEC-cart-1 |

## Sign-off

- [x] All AC-* checked with evidence
`;

function run(root, slug) {
    return spawnSync("python3", [script, root, slug], { encoding: "utf8" });
}

async function withSlug(files, fn) {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-trace-"));
    try {
        for (const [name, body] of Object.entries(files)) {
            await fse.outputFile(path.join(root, name), body);
        }
        await fn(root);
    } finally {
        await fse.remove(root);
    }
}

const chain = {
    "cart.spec.md": SPEC,
    "cart.plan.md": PLAN,
    "cart.acceptance.md": ACCEPTANCE,
};

test("trace_report passes a covered slug", async () => {
    await withSlug(chain, async (root) => {
        const result = run(root, "cart");
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.match(result.stdout, /SPEC-cart-1\s+P1-1\s+AC-1\s+pass/);
        assert.match(result.stdout, /1\/1 checks passed, 0 gap/);
    });
});

test("trace_report fails when the only check is still open", async () => {
    await withSlug(
        { ...chain, "cart.acceptance.md": ACCEPTANCE.replace("[x]", "[ ]") },
        async (root) => {
            const result = run(root, "cart");
            assert.equal(result.status, 1);
            assert.match(result.stdout, /AC-1: open/);
        },
    );
});

test("trace_report fails when a SPEC id has no acceptance link", async () => {
    const extra = SPEC.replace(
        "| SPEC-cart-1 | cart.plan.md | cart.acceptance.md |",
        "| SPEC-cart-1 | cart.plan.md | cart.acceptance.md |\n| SPEC-cart-2 | cart.plan.md | cart.acceptance.md |",
    );
    await withSlug({ ...chain, "cart.spec.md": extra }, async (root) => {
        const result = run(root, "cart");
        assert.equal(result.status, 1);
        assert.match(result.stdout, /SPEC-cart-2: no ACCEPTANCE link/);
    });
});

test("trace_report reads a legacy slug.md plan", async () => {
    const files = { ...chain };
    files["cart.md"] = files["cart.plan.md"];
    delete files["cart.plan.md"];
    await withSlug(files, async (root) => {
        const result = run(root, "cart");
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.match(result.stdout, /plan: cart\.md/);
    });
});

test("trace_report fails when the trace json disagrees", async () => {
    await withSlug(
        {
            ...chain,
            ".axion/trace/cart.json": JSON.stringify({
                slug: "cart",
                links: [{ spec_id: "SPEC-cart-9", plan_task: "P1-1", acceptance_id: "AC-1" }],
            }),
        },
        async (root) => {
            const result = run(root, "cart");
            assert.equal(result.status, 1);
            assert.match(result.stdout, /trace json SPEC-cart-9\/P1-1 conflicts/);
        },
    );
});

test("trace_report rejects a slug that is not a file name", async () => {
    await withSlug(chain, async (root) => {
        const result = run(root, "../cart");
        assert.equal(result.status, 2);
    });
});

test("trace_report accepts a spaced checkbox when the evidence is real", async () => {
    const acceptance = ACCEPTANCE.replace("| [x] |", "| [ x ] | |");
    await withSlug({ ...chain, "cart.acceptance.md": acceptance }, async (root) => {
        const result = run(root, "cart");
        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.match(result.stdout, /AC-1\s+pass/);
    });
});

test("trace_report fails when checked evidence is only backticks", async () => {
    const acceptance = ACCEPTANCE.replace("npm test: 4 passed", "` `");
    await withSlug({ ...chain, "cart.acceptance.md": acceptance }, async (root) => {
        const result = run(root, "cart");
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.match(result.stdout, /AC-1: no-evidence/);
    });
});

test("trace_report does not read Traceability from inside another heading", async () => {
    const spec = `# SPEC

## Non-Traceability

| SPEC ID | Related PLAN | Related ACCEPTANCE |
| --- | --- | --- |
| SPEC-cart-1 | cart.plan.md | cart.acceptance.md |

## 8. Traceability

| SPEC ID | Related PLAN | Related ACCEPTANCE |
| --- | --- | --- |
| SPEC-cart-2 | cart.plan.md | cart.acceptance.md |
`;
    await withSlug({ ...chain, "cart.spec.md": spec }, async (root) => {
        const result = run(root, "cart");
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.match(result.stdout, /SPEC-cart-1 is not in the SPEC traceability table/);
        assert.match(result.stdout, /SPEC-cart-2: no ACCEPTANCE link/);
    });
});
