import { test } from "node:test";
import assert from "node:assert";
import { INSTALL_PATHS } from "../lib/constants.js";
import {
    DEFAULT_TOOL,
    isValidTool,
    resolveAdapter,
    TOOL_NAMES,
} from "../lib/adapters/index.js";

test("resolveAdapter defaults to cursor and maps pack/ to Cursor paths + .axion/scripts", () => {
    const adapter = resolveAdapter();
    assert.equal(adapter.id, "cursor");
    assert.equal(DEFAULT_TOOL, "cursor");
    assert.deepEqual(adapter.installPaths, INSTALL_PATHS);
    assert.ok(adapter.installPaths.includes(".axion/scripts"));
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/plan.md"), [
        ".cursor/commands/plan.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/discover.md"), [
        ".cursor/commands/discover.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/design.md"), [
        ".cursor/commands/design.md",
    ]);
    assert.deepEqual(
        adapter.mapTemplateTargets("pack/shared/ui-ux-pro-max/scripts/search.py"),
        [".agents/shared/ui-ux-pro-max/scripts/search.py"],
    );
    assert.deepEqual(adapter.mapTemplateTargets("pack/rules/frontend.mdc"), [
        ".cursor/rules/frontend.mdc",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/skills/clean-code/SKILL.md"), [
        ".agents/skills/clean-code/SKILL.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/schemas/skill-contract.schema.json"), [
        ".agents/schemas/skill-contract.schema.json",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/memory/MEMORY.md"), [
        ".agents/memory/MEMORY.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/agents/orchestrator.md"), [
        ".claude/agents/orchestrator.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/mcp.json"), [".cursor/mcp.json"]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/ARCHITECTURE.md"), [
        ".cursor/ARCHITECTURE.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets(".axion/scripts/checklist.py"), [
        ".axion/scripts/checklist.py",
    ]);
    assert.equal(adapter.transformContent("a", "a", "hello"), "hello");
});

test("isValidTool rejects unknown ids", () => {
    assert.equal(isValidTool("cursor"), true);
    assert.equal(isValidTool("claude-code"), true);
    assert.equal(isValidTool("codex"), true);
    assert.equal(isValidTool("windsurf"), true);
    assert.equal(isValidTool("foo"), false);
    assert.equal(isValidTool("devin"), false);
    assert.equal(isValidTool("openai-codex"), false);
    assert.throws(() => resolveAdapter("foo"), /cursor, claude-code, codex, windsurf/);
    assert.deepEqual(TOOL_NAMES, ["cursor", "claude-code", "codex", "windsurf"]);
});

test("claude-code maps pack/ commands, skills, MCP, .axion/scripts and omits cursor-only files", () => {
    const adapter = resolveAdapter("claude-code");
    assert.ok(adapter.installPaths.includes(".axion/scripts"));
    assert.equal(adapter.installPaths.includes(".cursor/scripts"), false);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/plan.md"), [
        ".claude/commands/plan.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/discover.md"), [
        ".claude/commands/discover.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/design.md"), [
        ".claude/commands/design.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets(".cursor/commands/design.md"), [
        ".claude/commands/design.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/rules/frontend.mdc"), []);
    assert.deepEqual(
        adapter.mapTemplateTargets("pack/shared/ui-ux-pro-max/scripts/search.py"),
        [".agents/shared/ui-ux-pro-max/scripts/search.py"],
    );
    assert.deepEqual(
        adapter.mapTemplateTargets(".cursor/shared/ui-ux-pro-max/scripts/search.py"),
        [],
    );
    assert.deepEqual(adapter.mapTemplateTargets("pack/mcp.json"), [".mcp.json"]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/skills/clean-code/SKILL.md"), [
        ".agents/skills/clean-code/SKILL.md",
        ".claude/skills/clean-code/SKILL.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/schemas/command-contract.schema.json"), [
        ".agents/schemas/command-contract.schema.json",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("AGENTS.md"), ["AGENTS.md", "CLAUDE.md"]);
    assert.deepEqual(adapter.mapTemplateTargets(".axion/scripts/checklist.py"), [
        ".axion/scripts/checklist.py",
    ]);
});

test("claude-code transformContent restores $ARGUMENTS and sanitizes MCP", () => {
    const adapter = resolveAdapter("claude-code");
    const command = [
        "> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.",
        "",
        "(texto livre após o comando)",
        "",
    ].join("\n");
    const adapted = adapter.transformContent(
        "pack/commands/plan.md",
        ".claude/commands/plan.md",
        command,
    );
    assert.match(adapted, /\$ARGUMENTS/);
    assert.equal(adapted.includes("Argumento livre"), false);
    assert.equal(adapted.includes("texto livre após o comando"), false);

    const mcp = JSON.stringify({
        mcpServers: {
            context7: {
                command: "npx",
                args: ["--api-key", "${env:CONTEXT7_API_KEY}"],
                envFile: "${workspaceFolder}/.env",
            },
        },
    });
    const sanitized = JSON.parse(
        adapter.transformContent("pack/mcp.json", ".mcp.json", mcp),
    );
    assert.equal(sanitized.mcpServers.context7.envFile, undefined);
    assert.equal(sanitized.mcpServers.context7.args[1], "${CONTEXT7_API_KEY}");

    const stub = adapter.transformContent("AGENTS.md", "CLAUDE.md", "# AGENTS\n");
    assert.match(stub, /@AGENTS\.md/);
    assert.match(stub, /AGENT_FLOW\.md/);
});

test("codex maps pack/ skills, schemas, memory, shared data, MCP TOML, .axion/scripts and omits agents/commands/rules", () => {
    const adapter = resolveAdapter("codex");
    assert.equal(adapter.id, "codex");
    assert.ok(adapter.installPaths.includes(".agents"));
    assert.ok(adapter.installPaths.includes(".axion/scripts"));
    assert.ok(adapter.installPaths.includes(".codex/config.toml"));
    assert.equal(
        adapter.installPaths.some((p) => p.startsWith(".claude")),
        false,
    );
    assert.equal(
        adapter.installPaths.some((p) => p.startsWith(".cursor")),
        false,
    );

    assert.deepEqual(adapter.mapTemplateTargets("pack/skills/clean-code/SKILL.md"), [
        ".agents/skills/clean-code/SKILL.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/schemas/command-contract.schema.json"), [
        ".agents/schemas/command-contract.schema.json",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/memory/MEMORY.md"), [
        ".agents/memory/MEMORY.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/mcp.json"), [".codex/config.toml"]);
    assert.deepEqual(adapter.mapTemplateTargets(".axion/scripts/checklist.py"), [
        ".axion/scripts/checklist.py",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("AGENTS.md"), ["AGENTS.md"]);

    assert.deepEqual(adapter.mapTemplateTargets("pack/agents/orchestrator.md"), []);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/plan.md"), []);
    assert.deepEqual(adapter.mapTemplateTargets("pack/rules/frontend.mdc"), []);
    assert.deepEqual(
        adapter.mapTemplateTargets("pack/shared/ui-ux-pro-max/scripts/search.py"),
        [".agents/shared/ui-ux-pro-max/scripts/search.py"],
    );
    assert.deepEqual(
        adapter.mapTemplateTargets(".cursor/shared/ui-ux-pro-max/scripts/search.py"),
        [],
    );
    assert.deepEqual(adapter.mapTemplateTargets("pack/ARCHITECTURE.md"), []);
});

test("codex transformContent serializes MCP JSON into sanitized .codex/config.toml", () => {
    const adapter = resolveAdapter("codex");
    const mcp = JSON.stringify({
        mcpServers: {
            context7: {
                command: "npx",
                args: ["--api-key", "${env:CONTEXT7_API_KEY}"],
                envFile: "${workspaceFolder}/.env",
            },
        },
    });
    const toml = adapter.transformContent("pack/mcp.json", ".codex/config.toml", mcp);
    assert.match(toml, /\[mcp_servers\.context7\]/);
    assert.match(toml, /command = "npx"/);
    assert.match(toml, /args = \["--api-key", "\$\{CONTEXT7_API_KEY\}"\]/);
    assert.equal(toml.includes("envFile"), false);
});

test("windsurf maps pack/ skills, schemas, memory, shared data, MCP JSON, .axion/scripts and omits agents/commands/rules", () => {
    const adapter = resolveAdapter("windsurf");
    assert.equal(adapter.id, "windsurf");
    assert.ok(adapter.installPaths.includes(".agents"));
    assert.ok(adapter.installPaths.includes(".axion/scripts"));
    assert.ok(adapter.installPaths.includes(".windsurf/mcp_config.json"));
    assert.equal(
        adapter.installPaths.some((p) => p.startsWith(".claude")),
        false,
    );
    assert.equal(
        adapter.installPaths.some((p) => p.startsWith(".cursor")),
        false,
    );
    assert.equal(
        adapter.installPaths.some((p) => p.startsWith(".devin")),
        false,
    );

    assert.deepEqual(adapter.mapTemplateTargets("pack/skills/clean-code/SKILL.md"), [
        ".agents/skills/clean-code/SKILL.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/schemas/command-contract.schema.json"), [
        ".agents/schemas/command-contract.schema.json",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/memory/MEMORY.md"), [
        ".agents/memory/MEMORY.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/mcp.json"), [".windsurf/mcp_config.json"]);
    assert.deepEqual(adapter.mapTemplateTargets(".axion/scripts/checklist.py"), [
        ".axion/scripts/checklist.py",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("AGENTS.md"), ["AGENTS.md"]);

    assert.deepEqual(adapter.mapTemplateTargets("pack/agents/orchestrator.md"), []);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/plan.md"), []);
    assert.deepEqual(adapter.mapTemplateTargets("pack/rules/frontend.mdc"), []);
    assert.deepEqual(
        adapter.mapTemplateTargets("pack/shared/ui-ux-pro-max/scripts/search.py"),
        [".agents/shared/ui-ux-pro-max/scripts/search.py"],
    );
    assert.deepEqual(
        adapter.mapTemplateTargets(".cursor/shared/ui-ux-pro-max/scripts/search.py"),
        [],
    );
    assert.deepEqual(adapter.mapTemplateTargets("pack/ARCHITECTURE.md"), []);
});

test("windsurf transformContent sanitizes MCP JSON without envFile or TOML", () => {
    const adapter = resolveAdapter("windsurf");
    const mcp = JSON.stringify({
        mcpServers: {
            context7: {
                command: "npx",
                args: ["--api-key", "${env:CONTEXT7_API_KEY}"],
                envFile: "${workspaceFolder}/.env",
            },
        },
    });
    const raw = adapter.transformContent("pack/mcp.json", ".windsurf/mcp_config.json", mcp);
    const sanitized = JSON.parse(raw);
    assert.equal(sanitized.mcpServers.context7.envFile, undefined);
    assert.equal(sanitized.mcpServers.context7.args[1], "${CONTEXT7_API_KEY}");
    assert.ok(Object.hasOwn(sanitized, "mcpServers"));
    assert.equal(raw.includes("envFile"), false);
    assert.equal(raw.includes("[mcp_servers"), false);
});
