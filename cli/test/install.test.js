import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { fileURLToPath } from "url";
import { diffKit, installKit, isKitInstalled } from "../lib/install.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(__dirname, "fixtures", "template");

test("installKit merges mcp.json and skips existing rules", async () => {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "ag4c-test-"));

    try {
        await fse.copy(fixtureRoot, tmp);

        const target = path.join(tmp, "project");
        await fse.ensureDir(target);
        await fse.ensureDir(path.join(target, ".cursor", "rules"));
        await fse.writeJson(
            path.join(target, ".cursor", "mcp.json"),
            { mcpServers: { context7: { command: "custom" } } },
            { spaces: 2 },
        );
        await fse.writeFile(
            path.join(target, ".cursor", "rules", "frontend.mdc"),
            "# my custom rule",
        );

        const { actions } = await installKit(fixtureRoot, target, { force: false });
        const merged = actions.find((a) => a.file === ".cursor/mcp.json");
        assert.strictEqual(merged?.action, "merged");

        const mcp = await fse.readJson(path.join(target, ".cursor", "mcp.json"));
        assert.strictEqual(mcp.mcpServers.context7.command, "custom");
        assert.ok(mcp.mcpServers.shadcn);

        const rule = await fse.readFile(
            path.join(target, ".cursor", "rules", "frontend.mdc"),
            "utf8",
        );
        assert.strictEqual(rule, "# my custom rule");

        assert.ok(await fse.pathExists(path.join(target, ".cursor", "commands", "ax-plan.md")));
        assert.ok(await fse.pathExists(path.join(target, "AGENTS.md")));

        assert.equal(await isKitInstalled(target, "cursor"), true);
    } finally {
        await fse.remove(tmp);
    }
});

test("installKit projects claude-code paths and leaves no false drift", async () => {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "ag4c-claude-"));

    try {
        const target = path.join(tmp, "project");
        await fse.ensureDir(target);

        await installKit(fixtureRoot, target, {
            force: false,
            tool: "claude-code",
            version: "0.0.0-test",
            packageName: "@zanetta/axion",
        });

        assert.ok(await fse.pathExists(path.join(target, ".claude", "commands", "ax-plan.md")));
        assert.equal(await fse.pathExists(path.join(target, ".cursor", "commands", "ax-plan.md")), false);
        assert.equal(await fse.pathExists(path.join(target, ".cursor", "shared")), false);
        assert.ok(await fse.pathExists(path.join(target, ".agents", "skills", "test-skill", "SKILL.md")));
        assert.ok(await fse.pathExists(path.join(target, ".claude", "skills", "test-skill", "SKILL.md")));
        assert.ok(await fse.pathExists(path.join(target, "CLAUDE.md")));
        assert.ok(await fse.pathExists(path.join(target, ".mcp.json")));
        assert.equal(await fse.pathExists(path.join(target, ".cursor", "rules", "backend.mdc")), false);

        const mcp = await fse.readJson(path.join(target, ".mcp.json"));
        assert.equal(mcp.mcpServers.context7?.envFile, undefined);

        const drift = await diffKit(fixtureRoot, target, { tool: "claude-code" });
        assert.deepEqual(drift.drifted, []);
        assert.equal(await isKitInstalled(target, "claude-code"), true);

        const manifest = await fse.readJson(path.join(target, ".axion", "kit.manifest.json"));
        assert.equal(manifest.tool, "claude-code");
        assert.ok(manifest.components.commands > 0);
    } finally {
        await fse.remove(tmp);
    }
});

test("installKit projects codex hybrid paths, merges .codex/config.toml, and leaves no false drift", async () => {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "ag4c-codex-"));

    try {
        const target = path.join(tmp, "project");
        await fse.ensureDir(path.join(target, ".codex"));
        await fse.writeFile(
            path.join(target, ".codex", "config.toml"),
            'model = "o3"\n\n[mcp_servers.custom]\ncommand = "node"\nargs = ["server.js"]\n',
            "utf8",
        );

        await installKit(fixtureRoot, target, {
            force: false,
            tool: "codex",
            version: "0.0.0-test",
            packageName: "@zanetta/axion",
        });

        assert.ok(await fse.pathExists(path.join(target, ".agents", "skills", "test-skill", "SKILL.md")));
        assert.ok(await fse.pathExists(path.join(target, ".axion", "scripts", "checklist.py")));
        assert.ok(await fse.pathExists(path.join(target, ".codex", "config.toml")));
        assert.ok(await fse.pathExists(path.join(target, "AGENTS.md")));

        assert.equal(await fse.pathExists(path.join(target, ".claude", "agents")), false);
        assert.equal(await fse.pathExists(path.join(target, ".claude", "commands")), false);
        assert.equal(await fse.pathExists(path.join(target, ".cursor", "commands")), false);
        assert.equal(await fse.pathExists(path.join(target, ".cursor", "rules")), false);
        assert.equal(await fse.pathExists(path.join(target, "CLAUDE.md")), false);

        const toml = await fse.readFile(path.join(target, ".codex", "config.toml"), "utf8");
        assert.match(toml, /model = "o3"/);
        assert.match(toml, /\[mcp_servers\.custom\]/);
        assert.match(toml, /\[mcp_servers\.shadcn\]/);

        const drift = await diffKit(fixtureRoot, target, { tool: "codex" });
        assert.deepEqual(drift.drifted, []);
        assert.deepEqual(drift.missing, []);
        assert.equal(await isKitInstalled(target, "codex"), true);
    } finally {
        await fse.remove(tmp);
    }
});

test("installKit projects windsurf hybrid paths, merges .windsurf/mcp_config.json, and leaves no false drift", async () => {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "ag4c-windsurf-"));

    try {
        const target = path.join(tmp, "project");
        await fse.ensureDir(path.join(target, ".windsurf"));
        await fse.writeJson(
            path.join(target, ".windsurf", "mcp_config.json"),
            { mcpServers: { custom: { command: "node" } } },
            { spaces: 4 },
        );

        await installKit(fixtureRoot, target, {
            force: false,
            tool: "windsurf",
            version: "0.0.0-test",
            packageName: "@zanetta/axion",
        });

        assert.ok(await fse.pathExists(path.join(target, ".agents", "skills", "test-skill", "SKILL.md")));
        assert.ok(await fse.pathExists(path.join(target, ".axion", "scripts", "checklist.py")));
        assert.ok(await fse.pathExists(path.join(target, ".windsurf", "mcp_config.json")));
        assert.ok(await fse.pathExists(path.join(target, "AGENTS.md")));

        assert.equal(await fse.pathExists(path.join(target, ".claude", "agents")), false);
        assert.equal(await fse.pathExists(path.join(target, ".cursor", "commands")), false);
        assert.equal(await fse.pathExists(path.join(target, ".cursor", "rules")), false);
        assert.equal(await fse.pathExists(path.join(target, "CLAUDE.md")), false);
        assert.equal(await fse.pathExists(path.join(target, ".devin")), false);

        const mcp = await fse.readJson(path.join(target, ".windsurf", "mcp_config.json"));
        assert.strictEqual(mcp.mcpServers.custom.command, "node");
        assert.ok(mcp.mcpServers.shadcn);
        for (const server of Object.values(mcp.mcpServers)) {
            assert.equal(server.envFile, undefined);
        }

        const drift = await diffKit(fixtureRoot, target, { tool: "windsurf" });
        assert.deepEqual(drift.drifted, []);
        assert.deepEqual(drift.missing, []);
        assert.equal(await isKitInstalled(target, "windsurf"), true);
    } finally {
        await fse.remove(tmp);
    }
});

test("installKit projects antigravity native paths, merges MCP, and leaves no false drift", async () => {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "ag4c-antigravity-"));

    try {
        const target = path.join(tmp, "project");
        await fse.ensureDir(path.join(target, ".agents"));
        await fse.writeJson(
            path.join(target, ".agents", "mcp_config.json"),
            { mcpServers: { custom: { command: "node" } } },
            { spaces: 4 },
        );

        await installKit(fixtureRoot, target, {
            force: false,
            tool: "antigravity",
            version: "0.0.0-test",
            packageName: "@zanetta/axion",
        });

        assert.ok(await fse.pathExists(path.join(target, ".agents", "skills", "ax-plan", "SKILL.md")));
        assert.ok(await fse.pathExists(path.join(target, ".agents", "rules", "backend.md")));
        assert.ok(await fse.pathExists(path.join(target, ".agents", "skills", "test-skill", "SKILL.md")));
        assert.ok(await fse.pathExists(path.join(target, ".axion", "scripts", "checklist.py")));
        assert.ok(await fse.pathExists(path.join(target, ".agents", "mcp_config.json")));
        assert.ok(await fse.pathExists(path.join(target, "AGENTS.md")));
        assert.ok(await fse.pathExists(path.join(target, "GEMINI.md")));
        assert.ok(await fse.pathExists(path.join(target, ".env.example")));

        assert.equal(await fse.pathExists(path.join(target, ".claude", "agents")), false);
        assert.equal(await fse.pathExists(path.join(target, ".cursor", "commands")), false);
        assert.equal(await fse.pathExists(path.join(target, ".cursor", "rules")), false);
        assert.equal(await fse.pathExists(path.join(target, "CLAUDE.md")), false);
        assert.equal(await fse.pathExists(path.join(target, "pack", "ARCHITECTURE.md")), false);

        const rule = await fse.readFile(path.join(target, ".agents", "rules", "backend.md"), "utf8");
        assert.match(rule, /trigger: model_decision/);

        const gemini = await fse.readFile(path.join(target, "GEMINI.md"), "utf8");
        assert.match(gemini, /@AGENTS\.md/);

        const mcp = await fse.readJson(path.join(target, ".agents", "mcp_config.json"));
        assert.strictEqual(mcp.mcpServers.custom.command, "node");
        assert.ok(mcp.mcpServers.shadcn);
        for (const server of Object.values(mcp.mcpServers)) {
            assert.equal(server.envFile, undefined);
        }

        const manifest = await fse.readJson(path.join(target, ".axion", "kit.manifest.json"));
        assert.equal(manifest.tool, "antigravity");
        assert.equal(manifest.components.agents, 0);
        assert.ok(manifest.components.commands >= 1);
        assert.ok(manifest.components.rules >= 1);

        const drift = await diffKit(fixtureRoot, target, { tool: "antigravity" });
        assert.deepEqual(drift.drifted, []);
        assert.deepEqual(drift.missing, []);
        assert.equal(await isKitInstalled(target, "antigravity"), true);
    } finally {
        await fse.remove(tmp);
    }
});
