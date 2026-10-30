import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const packRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const gate = path.join(packRoot, ".cursor", "scripts", "verify_gate.py");

const COMPLETE = `# ACCEPTANCE

| ID | Given / When / Then | Method | Command / evidence | Pass |
| --- | --- | --- | --- | --- |
| AC-1 | when the gate runs | unit | npm test: 18 passed | [x] |

## Sign-off

- [x] All AC-* checked with evidence
`;

function run(cwd, args) {
    return spawnSync("python3", [gate, cwd, ...args], { encoding: "utf8" });
}

async function withProject(files, fn) {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-gate-"));
    try {
        for (const [name, body] of Object.entries(files)) {
            await fse.outputFile(path.join(root, name), body);
        }
        await fn(root);
    } finally {
        await fse.remove(root);
    }
}

test("verify_gate fails when an AC row is unchecked", async () => {
    const open = COMPLETE.replace("[x] |", "[ ] |").replace("- [x]", "- [ ]");
    await withProject({ "feature.acceptance.md": open }, async (root) => {
        const result = run(root, ["--skip-checklist"]);
        assert.equal(result.status, 1);
        assert.match(result.stdout, /AC-1: Pass is '\[ \]'/);
        assert.match(result.stdout, /sign-off still open/);
    });
});

test("verify_gate fails when a checked AC has no evidence", async () => {
    const empty = COMPLETE.replace("npm test: 18 passed", "{curl / UI steps}");
    await withProject({ "feature.acceptance.md": empty }, async (root) => {
        const result = run(root, ["--skip-checklist"]);
        assert.equal(result.status, 1);
        assert.match(result.stdout, /checked without evidence/);
    });
});

test("verify_gate fails when no ACCEPTANCE file exists", async () => {
    await withProject({}, async (root) => {
        const result = run(root, ["--skip-checklist"]);
        assert.equal(result.status, 1);
        assert.match(result.stdout, /no ACCEPTANCE file/);
    });
});

test("verify_gate ignores the traceability table", async () => {
    const withTrace = `${COMPLETE}
## Traceability

| ACCEPTANCE ID | PLAN task | SPEC ID |
| --- | --- | --- |
| AC-1 | P1-1 | SPEC-feature-1 |
`;
    await withProject({ "feature.acceptance.md": withTrace }, async (root) => {
        const result = run(root, ["--skip-checklist"]);
        assert.equal(result.status, 0, result.stdout + result.stderr);
    });
});

test("verify_gate passes a complete ACCEPTANCE without running the checklist", async () => {
    await withProject({ "feature.acceptance.md": COMPLETE }, async (root) => {
        const result = run(root, ["--skip-checklist"]);
        assert.equal(result.status, 0, result.stdout + result.stderr);
    });
});

test("verify_gate fails when the checklist exits non-zero", async () => {
    await withProject({ "feature.acceptance.md": COMPLETE }, async (root) => {
        const stub = path.join(root, "failing_checklist.py");
        await fse.writeFile(stub, "import sys\nprint('CRITICAL: Lint Check failed')\nsys.exit(1)\n");
        const result = run(root, ["--checklist", stub]);
        assert.equal(result.status, 1);
        assert.match(result.stdout, /checklist.py failed \(exit 1\)/);
        assert.match(result.stdout, /CRITICAL: Lint Check failed/);
    });
});
