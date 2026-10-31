import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const breaker = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    ".cursor",
    "scripts",
    "circuit_breaker.py",
);

function run(args) {
    return spawnSync("python3", [breaker, ...args], { encoding: "utf8" });
}

function decision(args) {
    const result = run(args);
    return { status: result.status, body: JSON.parse(result.stdout) };
}

test("a fresh worker is dispatched and a failed one retries twice", () => {
    const fresh = decision(["--domain", "backend", "--domain-failures", "0", "--worker-failures", "0"]);
    assert.equal(fresh.status, 0);
    assert.equal(fresh.body.action, "dispatch");

    const retry = decision(["--domain", "backend", "--domain-failures", "1", "--worker-failures", "2"]);
    assert.equal(retry.status, 0);
    assert.equal(retry.body.action, "retry");

    const exhausted = decision(["--domain", "backend", "--domain-failures", "1", "--worker-failures", "3"]);
    assert.equal(exhausted.status, 1);
    assert.equal(exhausted.body.action, "stop-worker");
    assert.equal(exhausted.body.reason, "retry-limit");
});

test("three failures in one domain open the breaker without affecting another domain", () => {
    const opened = decision(["--domain", "backend", "--domain-failures", "3", "--worker-failures", "1"]);
    assert.equal(opened.status, 1);
    assert.equal(opened.body.action, "open");
    assert.equal(opened.body.fallback, "partial-synthesis");

    const other = decision(["--domain", "frontend", "--domain-failures", "0", "--worker-failures", "0"]);
    assert.equal(other.status, 0);
    assert.equal(other.body.action, "dispatch");
});

test("invalid domain or a negative count exits 2 and writes nothing", () => {
    const domain = run(["--domain", "Backend team", "--domain-failures", "0", "--worker-failures", "0"]);
    assert.equal(domain.status, 2);
    assert.equal(domain.stdout, "");

    const negative = run(["--domain", "backend", "--domain-failures", "-1", "--worker-failures", "0"]);
    assert.equal(negative.status, 2);
    assert.equal(negative.stdout, "");
});
