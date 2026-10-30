import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const sessionManager = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    ".cursor",
    "scripts",
    "session_manager.py",
);

function log(root, extra) {
    return spawnSync("python3", [sessionManager, "log", root, ...extra], { encoding: "utf8" });
}

test("orchestration counters are stored as integers and invalid counts are dropped", async () => {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-metrics-"));
    try {
        const ok = log(root, [
            "--command-name", "coordinate",
            "--slug", "cart",
            "--exit", "0",
            "--workers", "4",
            "--failures", "1",
            "--duration-ms", "120000",
            "--breaker-trips", "1",
            "--artifact", "cart.plan.md",
        ]);
        assert.equal(ok.status, 0, ok.stderr);

        const stored = JSON.parse(await fse.readFile(path.join(root, ".axion/logs/runs.jsonl"), "utf8"));
        assert.equal(stored.workers, 4);
        assert.equal(stored.failures, 1);
        assert.equal(stored.duration_ms, 120000);
        assert.equal(stored.breaker_trips, 1);
        assert.equal(stored.command, "coordinate");
        assert.equal("message" in stored, false);

        const rejected = log(root, ["--command-name", "coordinate", "--failures", "-1"]);
        assert.equal(rejected.status, 2);
        const lines = (await fse.readFile(path.join(root, ".axion/logs/runs.jsonl"), "utf8")).trim().split("\n");
        assert.equal(lines.length, 1);

        const huge = log(root, ["--command-name", "coordinate", "--workers", "1001"]);
        assert.equal(huge.status, 2);
        const still = (await fse.readFile(path.join(root, ".axion/logs/runs.jsonl"), "utf8")).trim().split("\n");
        assert.equal(still.length, 1);
    } finally {
        await fse.remove(root);
    }
});

test("a verify log without orchestration flags omits the counters", async () => {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-metrics-"));
    try {
        const ok = log(root, ["--command-name", "verify", "--slug", "cart", "--exit", "0", "--artifact", "cart.acceptance.md"]);
        assert.equal(ok.status, 0, ok.stderr);
        const stored = JSON.parse(await fse.readFile(path.join(root, ".axion/logs/runs.jsonl"), "utf8"));
        assert.equal("workers" in stored, false);
        assert.equal("failures" in stored, false);
        assert.equal("duration_ms" in stored, false);
        assert.equal("breaker_trips" in stored, false);
    } finally {
        await fse.remove(root);
    }
});
