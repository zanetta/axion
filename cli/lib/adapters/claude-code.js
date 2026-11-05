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
    const sub = src.startsWith("pack/") ? src.slice("pack/".length) : src;

    if (sub === "commands/ui-ux-pro-max.md" || sub === ".cursor/commands/ui-ux-pro-max.md") return [];
    if (sub.startsWith("commands/ui-ux-pro-max/") || sub.startsWith(".cursor/commands/ui-ux-pro-max/")) return [];
    if (sub === "commands/design.md" || sub === ".cursor/commands/design.md") return [];
    if (sub.startsWith("commands/design/") || sub.startsWith(".cursor/commands/design/")) return [];
    if (sub === "rules" || sub.startsWith("rules/") || sub === ".cursor/rules" || sub.startsWith(".cursor/rules/")) {
        return [];
    }
    if (sub === "shared" || sub.startsWith("shared/") || sub.startsWith(".cursor/shared/")) {
        return [];
    }
    if (sub === "mcp.json" || sub === ".cursor/mcp.json") return [".mcp.json"];
    if (sub === "ARCHITECTURE.md" || sub === ".cursor/ARCHITECTURE.md") return [".cursor/ARCHITECTURE.md"];

    if (sub === "agents" || sub.startsWith("agents/")) {
        return [sub.replace(/^agents/, ".claude/agents")];
    }
    if (sub === "commands" || sub.startsWith("commands/")) {
        return [sub.replace(/^commands/, ".claude/commands")];
    }
    if (sub === ".cursor/commands" || sub.startsWith(".cursor/commands/")) {
        return [sub.replace(/^\.cursor\/commands/, ".claude/commands")];
    }
    if (sub === "skills" || sub.startsWith("skills/")) {
        return [
            sub.replace(/^skills/, ".agents/skills"),
            sub.replace(/^skills/, ".claude/skills"),
        ];
    }
    if (sub === ".agents/skills" || sub.startsWith(".agents/skills/")) {
        return [sub, sub.replace(/^\.agents\/skills/, ".claude/skills")];
    }
    if (sub === "schemas" || sub.startsWith("schemas/")) {
        return [sub.replace(/^schemas/, ".agents/schemas")];
    }
    if (sub === "memory" || sub.startsWith("memory/")) {
        return [sub.replace(/^memory/, ".agents/memory")];
    }
    if (sub === "scripts" || sub.startsWith("scripts/") || sub === ".cursor/scripts" || sub.startsWith(".cursor/scripts/")) {
        return [sub.replace(/^(?:\.cursor\/)?scripts/, ".axion/scripts")];
    }
    if (src === "AGENTS.md") return ["AGENTS.md", "CLAUDE.md"];
    return [src];
}

export function transformContent(_srcRel, destRel, text) {
    const dest = posix(destRel);
    if (dest === "CLAUDE.md") return CLAUDE_STUB;
    if (dest === ".mcp.json") return sanitizeMcp(text);
    if (dest.startsWith(".claude/commands/") && dest.endsWith(".md")) {
        return adaptCommand(text);
    }
    return text;
}

export const claudeCodeAdapter = {
    id: "claude-code",
    label: "Claude Code",
    installPaths: [
        ".claude",
        ".agents",
        ".axion/scripts",
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
        "Open in Claude Code and use /plan, /debug, etc.",
        "Inventory: python3 .axion/scripts/generate_inventory.py .",
    ],
};
