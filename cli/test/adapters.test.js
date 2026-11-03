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
    assert.equal(isValidTool("foo"), false);
    assert.equal(isValidTool("codex"), false);
    assert.throws(() => resolveAdapter("foo"), /cursor, claude-code/);
    assert.deepEqual(TOOL_NAMES, ["cursor", "claude-code"]);
});

test("claude-code maps pack/ commands, skills, MCP, .axion/scripts and omits cursor-only files", () => {
    const adapter = resolveAdapter("claude-code");
    assert.ok(adapter.installPaths.includes(".axion/scripts"));
    assert.equal(adapter.installPaths.includes(".cursor/scripts"), false);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/plan.md"), [
        ".claude/commands/plan.md",
    ]);
    assert.deepEqual(adapter.mapTemplateTargets("pack/commands/ui-ux-pro-max.md"), []);
    assert.deepEqual(adapter.mapTemplateTargets("pack/rules/frontend.mdc"), []);
    assert.deepEqual(adapter.mapTemplateTargets("pack/shared/ui-ux-pro-max/SKILL.md"), []);
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
