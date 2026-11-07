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
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ax-plan.md"), [
        ".cursor/commands/ax-plan.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ax-discover.md"), [
        ".cursor/commands/ax-discover.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ax-design.md"), [
        ".cursor/commands/ax-design.md",
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
    assert.equal(isValidTool("antigravity"), true);
    assert.equal(isValidTool("foo"), false);
    assert.equal(isValidTool("devin"), false);
    assert.equal(isValidTool("openai-codex"), false);
    assert.equal(isValidTool("gemini"), false);
    assert.throws(
        () => resolveAdapter("foo"),
        /cursor, claude-code, codex, windsurf, antigravity/,
    );
    assert.deepEqual(TOOL_NAMES, [
        "cursor",
        "claude-code",
        "codex",
        "windsurf",
        "antigravity",
    ]);
});

test("claude-code maps pack/ commands, skills, MCP, .axion/scripts and omits cursor-only files", () => {
    const adapter = resolveAdapter("claude-code");
    assert.ok(adapter.installPaths.includes(".axion/scripts"));
    assert.equal(adapter.installPaths.includes(".cursor/scripts"), false);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ax-plan.md"), [
        ".claude/commands/ax-plan.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ax-discover.md"), [
        ".claude/commands/ax-discover.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ax-design.md"), [
        ".claude/commands/ax-design.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets(".cursor/commands/ax-design.md"), [
        ".claude/commands/ax-design.md",
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
        "pack/commands/ax-plan.md",
        ".claude/commands/ax-plan.md",
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
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ax-plan.md"), []);
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
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ax-plan.md"), []);
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

test("antigravity maps pack to ax-* skills, rules .md, MCP, GEMINI stub and omits agents", () => {
    const adapter = resolveAdapter("antigravity");
    assert.equal(adapter.id, "antigravity");
    assert.ok(adapter.installPaths.includes(".agents"));
    assert.ok(adapter.installPaths.includes(".axion/scripts"));
    assert.ok(adapter.installPaths.includes(".agents/mcp_config.json"));
    assert.ok(adapter.installPaths.includes("GEMINI.md"));
    assert.ok(adapter.installPaths.includes(".env.example"));
    assert.equal(adapter.installPaths.some((p) => p.startsWith(".claude")), false);
    assert.equal(adapter.installPaths.some((p) => p.startsWith(".cursor")), false);
    assert.equal(adapter.installPaths.some((p) => p.startsWith(".gemini")), false);
    assert.equal(adapter.installPaths.some((p) => p.startsWith("~")), false);
    assert.match(adapter.postInstallHints.join("\n"), /\/ax-plan/);

    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ax-plan.md"), [
        ".agents/skills/ax-plan/SKILL.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ax-design.md"), [
        ".agents/skills/ax-design/SKILL.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets(".cursor/commands/ax-plan.md"), []);
    assert.deepEqual(adapter.mapTemplateTargets("pack/rules/frontend.mdc"), [
        ".agents/rules/frontend.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/skills/clean-code/SKILL.md"), [
        ".agents/skills/clean-code/SKILL.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/mcp.json"), [".agents/mcp_config.json"]);
    assert.deepEqual(adapter.mapTemplateTargets("AGENTS.md"), ["AGENTS.md", "GEMINI.md"]);
    assert.deepEqual(adapter.mapTemplateTargets(".env.example"), [".env.example"]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/agents/orchestrator.md"), []);
    assert.deepEqual(adapter.mapTemplateTargets("pack/ARCHITECTURE.md"), []);
    assert.deepEqual(
        adapter.mapTemplateTargets("pack/shared/ui-ux-pro-max/scripts/search.py"),
        [".agents/shared/ui-ux-pro-max/scripts/search.py"],
    );

    for (const dest of adapter.mapTemplateTargets("pack/mcp.json")) {
        assert.equal(dest.startsWith("~"), false);
        assert.equal(dest.startsWith(".gemini/"), false);
    }
});

test("antigravity transformContent writes glob rules, model_decision fallback, MCP sanitize, GEMINI stub", () => {
    const adapter = resolveAdapter("antigravity");
    const packRule = [
        "---",
        "description: Frontend UI rules",
        "globs: **/*.tsx,**/*.jsx",
        "alwaysApply: false",
        "---",
        "",
        "# Frontend",
        "",
    ].join("\n");
    const globbed = adapter.transformContent(
        "pack/rules/frontend.mdc",
        ".agents/rules/frontend.md",
        packRule,
    );
    assert.match(globbed, /trigger: glob/);
    assert.match(globbed, /description: "Frontend UI rules"/);
    assert.match(globbed, /globs: "\*\*\/\*\.tsx,\*\*\/\*\.jsx"/);
    assert.equal(globbed.includes("alwaysApply"), false);

    const bare = adapter.transformContent(
        "pack/rules/backend.mdc",
        ".agents/rules/backend.md",
        "# backend rule from kit\n",
    );
    assert.match(bare, /trigger: model_decision/);
    assert.match(bare, /description: "Workspace rule: backend"/);

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
        adapter.transformContent("pack/mcp.json", ".agents/mcp_config.json", mcp),
    );
    assert.equal(sanitized.mcpServers.context7.envFile, undefined);
    assert.equal(sanitized.mcpServers.context7.args[1], "${CONTEXT7_API_KEY}");

    const stub = adapter.transformContent("AGENTS.md", "GEMINI.md", "# AGENTS\n");
    assert.match(stub, /@AGENTS\.md/);
    assert.match(stub, /AGENT_FLOW\.md/);
    assert.match(stub, /\.agents\/skills\/ax-\*/);
});
