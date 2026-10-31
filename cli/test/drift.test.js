import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { diffKit, installKit } from "../lib/install.js";
import { isProtected } from "../lib/protect.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(__dirname, "fixtures", "template");
const sessionManager = path.resolve(__dirname, "..", "..", ".cursor", "scripts", "session_manager.py");

test("isProtected covers user spec, memory, logs, and trace json", () => {
    assert.equal(isProtected("cart.spec.md"), true);
    assert.equal(isProtected(".agents/memory/MEMORY.md"), true);
    assert.equal(isProtected(".axion/logs/runs.jsonl"), true);
    assert.equal(isProtected(".axion/trace/cart.json"), true);
    assert.equal(isProtected(".axion/trace/README.md"), false);
    assert.equal(isProtected(".cursor/commands/plan.md"), false);
});

test("force update keeps memory and spec, and reports drifted kit files", async () => {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "axion-drift-"));
    try {
        const template = path.join(tmp, "template");
        const target = path.join(tmp, "project");
        await fse.copy(fixtureRoot, template);
        await fse.copy(fixtureRoot, target);
        await fse.outputFile(path.join(template, ".agents/memory/MEMORY.md"), "# kit example\n");
        await fse.writeFile(path.join(target, ".cursor/commands/plan.md"), "# local edit\n");
        await fse.outputFile(path.join(target, ".agents/memory/MEMORY.md"), "# user memory\n");
        await fse.writeFile(path.join(target, "cart.spec.md"), "# user spec\n");

        const drift = await diffKit(template, target, { profile: "standard" });
        assert.ok(drift.drifted.includes(".cursor/commands/plan.md"));
        assert.ok(drift.protected.includes(".agents/memory/MEMORY.md"));

        await installKit(template, target, { force: true, profile: "standard", writeManifest: false });

        assert.equal(await fse.readFile(path.join(target, ".agents/memory/MEMORY.md"), "utf8"), "# user memory\n");
        assert.equal(await fse.readFile(path.join(target, "cart.spec.md"), "utf8"), "# user spec\n");
        assert.notEqual(await fse.readFile(path.join(target, ".cursor/commands/plan.md"), "utf8"), "# local edit\n");
    } finally {
        await fse.remove(tmp);
    }
});

test("session log stores paths and exit, and doctor reads the last verify", async () => {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-log-"));
    try {
        const log = (extra) =>
            spawnSync("python3", [sessionManager, "log", root, ...extra], { encoding: "utf8" });

        assert.equal(log(["--command-name", "verify", "--slug", "cart", "--exit", "0", "--artifact", "cart.acceptance.md"]).status, 0);
        const rejected = log(["--command-name", "verify", "--artifact", "../secret.env"]);
        assert.equal(rejected.status, 2);
        assert.equal(log(["--command-name", "verify", "--artifact", "..\\secret.env"]).status, 2);
        assert.equal(log(["--command-name", "verify", "--artifact", "user typed free text"]).status, 2);

        const doctor = spawnSync("python3", [sessionManager, "doctor", root], { encoding: "utf8" });
        const report = JSON.parse(doctor.stdout);
        assert.equal(report.memory_index_lines, 0);
        assert.equal(report.path_lint, "absent");
        assert.equal(report.last_verify.slug, "cart");
        assert.equal(report.last_verify.exit, 0);
        assert.deepEqual(report.last_verify.artifacts, ["cart.acceptance.md"]);

        const stored = await fse.readFile(path.join(root, ".axion/logs/runs.jsonl"), "utf8");
        assert.equal(stored.includes("secret"), false);
        assert.equal(stored.includes("free text"), false);
    } finally {
        await fse.remove(root);
    }
});
