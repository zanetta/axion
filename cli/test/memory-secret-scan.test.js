import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const packRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = path.join(packRoot, ".cursor", "scripts", "memory_secret_scan.py");
const TOKEN = `ghp_${"a".repeat(36)}`;

function run(args, input) {
    return spawnSync("python3", [script, ...args], { encoding: "utf8", input });
}

test("memory scan accepts a normal preference", () => {
    const result = run(["--text", "Prefers bun instead of npm"]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /clean/);
});

test("memory scan ignores a placeholder secret", () => {
    for (const text of [
        "password: example",
        "API_KEY=example.",
        "API_KEY=changeme.",
        "API_KEY=your-token.",
        "API_KEY=<...>.",
        "API_KEY={...}.",
    ]) {
        const result = run(["--text", text]);
        assert.equal(result.status, 0, `${text}\n${result.stdout}${result.stderr}`);
    }
});

test("memory scan refuses a token and does not echo it", () => {
    const result = run(["--text", `API token: ${TOKEN}`]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /refused/);
    assert.match(result.stdout, /github-token/);
    assert.equal(result.stdout.includes(TOKEN), false);
    assert.equal(result.stderr.includes(TOKEN), false);
});

test("memory scan refuses a private key header and an aws key", () => {
    const text = `-----BEGIN PRIVATE KEY-----\nAKIA${"0".repeat(16)}\n`;
    const result = run(["--text", text]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /private-key/);
    assert.match(result.stdout, /aws-access-key/);
});

test("memory scan redacts without printing the secret", () => {
    const result = run(["--redact", "--text", `token=${TOKEN}`]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /token=\[REDACTED\]/);
    assert.equal(result.stdout.includes(TOKEN), false);
    assert.match(result.stderr, /redacted 1 secret/);
});

test("memory scan refuses a directory that contains a secret", async () => {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-memory-"));
    try {
        await fse.outputFile(path.join(root, "notes.md"), `npm_${"b".repeat(36)}\n`);
        const result = run([root]);
        assert.equal(result.status, 1);
        assert.match(result.stdout, /npm-token/);
        assert.equal(result.stdout.includes("b".repeat(36)), false);
    } finally {
        await fse.remove(root);
    }
});
