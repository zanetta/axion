import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const guard = path.resolve(__dirname, "..", "..", ".cursor", "scripts", "side_effect_guard.py");

const PLAN = `# PLAN

## Write allowlist

| Path | Why |
| --- | --- |
| \`cli/lib/**\` | kit library |
| \`.agents/memory/**\` | memory |
| \`.env\` | should still be refused |

- src/app.ts

## Out of scope
`;

function run(root, extra) {
    return spawnSync("python3", [guard, root, "--plan", path.join(root, "feature.plan.md"), ...extra], {
        encoding: "utf8",
    });
}

test("allowlist permits listed paths and refuses the rest, secrets, and read-only effects", async () => {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-allow-"));
    try {
        await fse.writeFile(path.join(root, "feature.plan.md"), PLAN);

        const allowed = run(root, ["--effect", "write-files", "--write", "cli/lib/install.js", "--write", "src/app.ts"]);
        assert.equal(allowed.status, 0, allowed.stdout + allowed.stderr);

        const outside = run(root, ["--write", "src/other.ts"]);
        assert.equal(outside.status, 1);
        assert.match(outside.stdout, /refused src\/other.ts outside-allowlist/);

        const secret = run(root, ["--write", ".env"]);
        assert.equal(secret.status, 1);
        assert.match(secret.stdout, /refused \.env forbidden/);

        const credentials = run(root, ["--write", "config/credentials.json"]);
        assert.equal(credentials.status, 1);
        assert.match(credentials.stdout, /forbidden/);

        const readOnly = run(root, ["--effect", "read-only", "--write", "src/app.ts"]);
        assert.equal(readOnly.status, 1);
        assert.match(readOnly.stdout, /effect-denied/);

        const memory = run(root, ["--effect", "write-memory", "--write", ".agents/memory/MEMORY.md"]);
        assert.equal(memory.status, 0, memory.stdout + memory.stderr);

        const memoryAsFiles = run(root, ["--effect", "write-files", "--write", ".agents/memory/MEMORY.md"]);
        assert.equal(memoryAsFiles.status, 1);
        assert.match(memoryAsFiles.stdout, /effect-denied/);

        const traversal = run(root, ["--write", "..\\secret.env"]);
        assert.equal(traversal.status, 2);
        assert.equal(traversal.stdout.includes("secret.env"), false);

        const secretSlash = run(root, ["--write", ".env/"]);
        assert.equal(secretSlash.status, 1);
        assert.match(secretSlash.stdout, /refused \.env forbidden/);

        const secretDot = run(root, ["--write", "./.env"]);
        assert.equal(secretDot.status, 1);
        assert.match(secretDot.stdout, /refused \.env forbidden/);

        const memoryDot = run(root, ["--effect", "write-memory", "--write", ".agents/./memory/MEMORY.md"]);
        assert.equal(memoryDot.status, 0, memoryDot.stdout + memoryDot.stderr);

        const memorySlash = run(root, ["--effect", "write-files", "--write", ".agents//memory/MEMORY.md"]);
        assert.equal(memorySlash.status, 1);
        assert.match(memorySlash.stdout, /refused \.agents\/memory\/MEMORY.md effect-denied/);

        const memoryRoot = run(root, ["--effect", "write-files", "--write", ".agents/memory"]);
        assert.equal(memoryRoot.status, 1);
        assert.match(memoryRoot.stdout, /refused \.agents\/memory effect-denied/);

        const memoryRootWrite = run(root, ["--effect", "write-memory", "--write", ".agents/memory/"]);
        assert.equal(memoryRootWrite.status, 0, memoryRootWrite.stdout + memoryRootWrite.stderr);

        const dottedSrc = run(root, ["--effect", "write-files", "--write", ".//src/app.ts"]);
        assert.equal(dottedSrc.status, 0, dottedSrc.stdout + dottedSrc.stderr);
    } finally {
        await fse.remove(root);
    }
});

test("canonical paths cannot bypass secrets, memory effects, or listed globs", async () => {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-allow-"));
    try {
        await fse.writeFile(
            path.join(root, "feature.plan.md"),
            `# PLAN

## Write allowlist

- foo/**
- .agents/memory/**
- .agents/memory-backup/**
- ./src/app.ts
- .env.example
- .env.local
`,
        );

        const envFile = run(root, ["--effect", "write-files", "--write", "foo/.env/"]);
        assert.equal(envFile.status, 1);
        assert.match(envFile.stdout, /refused foo\/\.env forbidden/);

        const envLocal = run(root, ["--write", ".env.local/."]);
        assert.equal(envLocal.status, 1);
        assert.match(envLocal.stdout, /refused \.env\.local forbidden/);

        const example = run(root, ["--effect", "write-files", "--write", ".env.example"]);
        assert.equal(example.status, 0, example.stdout + example.stderr);

        const listed = run(root, ["--effect", "write-files", "--write", "src/app.ts"]);
        assert.equal(listed.status, 0, listed.stdout + listed.stderr);

        const backup = run(root, ["--effect", "write-files", "--write", ".agents/memory-backup/x"]);
        assert.equal(backup.status, 0, backup.stdout + backup.stderr);

        const backupMemory = run(root, ["--effect", "write-memory", "--write", ".agents/memory-backup/x"]);
        assert.equal(backupMemory.status, 1);
        assert.match(backupMemory.stdout, /effect-denied/);

        const nested = run(root, ["--write", "foo/..\\secret.env"]);
        assert.equal(nested.status, 2);
        assert.equal(nested.stdout.includes("secret.env"), false);
    } finally {
        await fse.remove(root);
    }
});

test("a plan without a write allowlist refuses every write", async () => {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-allow-"));
    try {
        await fse.writeFile(path.join(root, "feature.plan.md"), "# PLAN\n\n## Phases\n");
        const result = run(root, ["--write", "src/app.ts"]);
        assert.equal(result.status, 1);
        assert.match(result.stdout, /no-allowlist/);
    } finally {
        await fse.remove(root);
    }
});
