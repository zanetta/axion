const CLAUDE_STUB = `# Axion

This project uses the Axion spec-driven development kit.

Read @AGENTS.md and AGENT_FLOW.md for routing, FSM, skills, and verification gates.

Slash commands are in \`.claude/commands/\`. Skills are in \`.claude/skills/\` and \`.agents/skills/\`.
`;

function posix(rel) {
    return rel.split("\\").join("/");
}

function sanitizeMcp(text) {
    const data = JSON.parse(text);
    const servers = data.mcpServers ?? {};
    for (const server of Object.values(servers)) {
        if (!server || typeof server !== "object") continue;
        delete server.envFile;
        if (Array.isArray(server.args)) {
            server.args = server.args.map((arg) =>
                typeof arg === "string" ? arg.replace(/\$\{env:([^}]+)\}/g, "${$1}") : arg,
            );
        }
    }
    return `${JSON.stringify(data, null, 4)}\n`;
}

function adaptCommand(text) {
    return text
        .replace(/^> \*\*Argumento livre:\*\*.*$/m, "> $ARGUMENTS")
        .replace(/\(texto livre após o comando\)/g, "$ARGUMENTS");
}

export function mapTemplateTargets(rel) {
    const src = posix(rel);
    if (src === ".cursor/commands/ui-ux-pro-max.md") return [];
    if (src.startsWith(".cursor/commands/ui-ux-pro-max/")) return [];
    if (src === ".cursor/rules" || src.startsWith(".cursor/rules/")) return [];
    if (src.startsWith(".cursor/shared/ui-ux-pro-max")) return [];
    if (src === ".cursor/mcp.json") return [".mcp.json"];
    if (src === ".cursor/commands" || src.startsWith(".cursor/commands/")) {
        return [src.replace(".cursor/commands", ".claude/commands")];
    }
    if (src === ".agents/skills" || src.startsWith(".agents/skills/")) {
        return [src, src.replace(".agents/skills", ".claude/skills")];
    }
    if (src === "AGENTS.md") return ["AGENTS.md", "CLAUDE.md"];
    return [src];
}

export function transformContent(srcRel, destRel, text) {
    const dest = posix(destRel);
    if (dest === "CLAUDE.md") return CLAUDE_STUB;
    if (dest === ".mcp.json") return sanitizeMcp(text);
    if (dest.startsWith(".claude/commands/") && dest.endsWith(".md")) return adaptCommand(text);
    return text;
}

export const claudeCodeAdapter = {
    id: "claude-code",
    label: "Claude Code",
    installPaths: [
        ".claude",
        ".agents",
        ".cursor/scripts",
        ".cursor/ARCHITECTURE.md",
        ".mcp.json",
        "AGENTS.md",
        "CLAUDE.md",
        "AGENT_FLOW.md",
        ".env.example",
    ],
    mergeJsonFiles: new Set([".mcp.json"]),
    markers: [
        "AGENTS.md",
        "CLAUDE.md",
        ".claude/commands",
        ".claude/agents",
        ".agents/skills",
        ".claude/skills",
    ],
    componentDirs: {
        agents: ".claude/agents",
        skills: ".agents/skills",
        commands: ".claude/commands",
        rules: null,
    },
    mapTemplateTargets,
    transformContent,
    postInstallHints: [
        "Open in Claude Code. Commands live in .claude/commands/ ($ARGUMENTS).",
        "Inventory: python3 .cursor/scripts/generate_inventory.py .",
    ],
};
