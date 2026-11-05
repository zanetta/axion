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

export function mapTemplateTargets(rel) {
    const src = posix(rel);
    const sub = src.startsWith("pack/") ? src.slice("pack/".length) : src;

    if (
        sub === "agents" ||
        sub.startsWith("agents/") ||
        sub === ".claude/agents" ||
        sub.startsWith(".claude/agents/")
    ) {
        return [];
    }
    if (
        sub === "commands" ||
        sub.startsWith("commands/") ||
        sub === ".cursor/commands" ||
        sub.startsWith(".cursor/commands/")
    ) {
        return [];
    }
    if (
        sub === "rules" ||
        sub.startsWith("rules/") ||
        sub === ".cursor/rules" ||
        sub.startsWith(".cursor/rules/")
    ) {
        return [];
    }
    if (sub === ".cursor/shared" || sub.startsWith(".cursor/shared/")) {
        return [];
    }
    if (sub === "shared" || sub.startsWith("shared/")) {
        return [sub.replace(/^shared/, ".agents/shared")];
    }
    if (sub === "ARCHITECTURE.md" || sub === ".cursor/ARCHITECTURE.md") {
        return [];
    }

    if (sub === "skills" || sub.startsWith("skills/")) {
        return [sub.replace(/^skills/, ".agents/skills")];
    }
    if (sub === ".agents/skills" || sub.startsWith(".agents/skills/")) {
        return [sub];
    }
    if (sub === "schemas" || sub.startsWith("schemas/")) {
        return [sub.replace(/^schemas/, ".agents/schemas")];
    }
    if (sub === "memory" || sub.startsWith("memory/")) {
        return [sub.replace(/^memory/, ".agents/memory")];
    }
    if (
        sub === "scripts" ||
        sub.startsWith("scripts/") ||
        sub === ".cursor/scripts" ||
        sub.startsWith(".cursor/scripts/")
    ) {
        return [sub.replace(/^(?:\.cursor\/)?scripts/, ".axion/scripts")];
    }
    if (sub === "mcp.json" || sub === ".cursor/mcp.json") {
        return [".windsurf/mcp_config.json"];
    }

    return [src];
}

export function transformContent(_srcRel, destRel, text) {
    const dest = posix(destRel);
    if (dest === ".windsurf/mcp_config.json") {
        return sanitizeMcp(text);
    }
    return text;
}

export const windsurfAdapter = {
    id: "windsurf",
    label: "Windsurf",
    installPaths: [
        ".agents",
        ".axion/scripts",
        ".windsurf/mcp_config.json",
        "AGENTS.md",
        "AGENT_FLOW.md",
        ".env.example",
    ],
    mergeJsonFiles: new Set([".windsurf/mcp_config.json"]),
    markers: ["AGENTS.md", ".agents/skills", ".axion/scripts", ".windsurf/mcp_config.json"],
    componentDirs: {
        agents: null,
        skills: ".agents/skills",
        commands: null,
        rules: null,
    },
    mapTemplateTargets,
    transformContent,
    postInstallHints: [
        "Open in Windsurf Cascade; instructions load from AGENTS.md and skills from .agents/skills/.",
        "MCP servers: .windsurf/mcp_config.json. Devin Desktop prefers .devin/, which this install does not write.",
        "Inventory: python3 .axion/scripts/generate_inventory.py .",
    ],
};
