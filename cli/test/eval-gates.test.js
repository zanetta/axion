import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runner = path.join(repo, ".cursor/scripts/eval_routing.py");

function run(args) {
    return spawnSync("python3", [runner, ...args], { encoding: "utf8" });
}

test("gate fixtures reject a plan without SPEC, a verify without ACCEPTANCE, and a legacy path", () => {
    const result = run([repo, "--gates"]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /eval_gates: pass 7/);
});

test("one plan is ready only with a SPEC or three real Socratic answers", async () => {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-plan-"));
    try {
        const plan = path.join(root, "cart.plan.md");
        await fse.writeFile(
            plan,
            ["# PLAN", "", "### Socratic evidence", "", "| # | Question | Answer |", "| --- | --- | --- |", "| 1 | Who? | Cashiers |", "| 2 | | |", "| 3 | | |", ""].join("\n"),
        );
        const two = run([repo, "--plan", plan]);
        assert.equal(two.status, 1);

        await fse.writeFile(path.join(root, "cart.spec.md"), "# SPEC\n\nOffline cart for cashiers.\n");
        const withSpec = run([repo, "--plan", plan]);
        assert.equal(withSpec.status, 0, withSpec.stdout + withSpec.stderr);

        await fse.remove(path.join(root, "cart.spec.md"));
        await fse.writeFile(
            plan,
            ["# PLAN", "", "### Socratic evidence", "", "| # | Question | Answer |", "| --- | --- | --- |", "| 1 | Who? | Cashiers |", "| 2 | Failure? | Offline |", "| 3 | Out of scope? | {payments} |", ""].join("\n"),
        );
        const placeholder = run([repo, "--plan", plan]);
        assert.equal(placeholder.status, 1);

        await fse.writeFile(
            plan,
            ["# PLAN", "", "### Socratic evidence", "", "| # | Question | Answer |", "| --- | --- | --- |", "| 1 | Who? | Cashiers |", "| 2 | Failure? | Offline |", "| 3 | Out of scope? | Payments |", ""].join("\n"),
        );
        const ready = run([repo, "--plan", plan]);
        assert.equal(ready.status, 0, ready.stdout + ready.stderr);

        await fse.writeFile(
            plan,
            [
                "# PLAN",
                "",
                "### Socratic evidence",
                "",
                "| # | Question | Answer |",
                "| --- | --- | --- |",
                "| 1 | Who? | Cashiers |",
                "",
                "#### Detail",
                "",
                "| # | Question | Answer |",
                "| --- | --- | --- |",
                "| 2 | Failure? | Offline |",
                "| 3 | Out of scope? | Payments |",
                "",
                "## Later",
                "",
                "| # | Question | Answer |",
                "| --- | --- | --- |",
                "| 1 | Ignored? | Outside the section |",
                "",
            ].join("\n"),
        );
        const nested = run([repo, "--plan", plan]);
        assert.equal(nested.status, 0, nested.stdout + nested.stderr);

        await fse.writeFile(
            plan,
            [
                "# PLAN",
                "",
                "### Socratic evidence",
                "",
                "| # | Question | Answer |",
                "| --- | --- | --- |",
                "| 1 | Who? | Cashiers |",
                "",
                "## Later",
                "",
                "| # | Question | Answer |",
                "| --- | --- | --- |",
                "| 1 | Failure? | Offline |",
                "| 2 | Out of scope? | Payments |",
                "",
            ].join("\n"),
        );
        const leaked = run([repo, "--plan", plan]);
        assert.equal(leaked.status, 1, leaked.stdout + leaked.stderr);
    } finally {
        await fse.remove(root);
    }
});
