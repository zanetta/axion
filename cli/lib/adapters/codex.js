import { serializeCodexMcpToml } from "../merge.js";

function posix(rel) {
    return rel.split("\\").join("/");
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
        return [".codex/config.toml"];
    }

    return [src];
}

export function transformContent(_srcRel, destRel, text) {
    const dest = posix(destRel);
    if (dest === ".codex/config.toml") {
        return serializeCodexMcpToml(text);
    }
    return text;
}

export const codexAdapter = {
    id: "codex",
    label: "OpenAI Codex",
    installPaths: [
        ".agents",
        ".axion/scripts",
        ".codex/config.toml",
        "AGENTS.md",
        "AGENT_FLOW.md",
        ".env.example",
    ],
    mergeJsonFiles: new Set(),
    mergeTomlFiles: new Set([".codex/config.toml"]),
    markers: ["AGENTS.md", ".agents/skills", ".axion/scripts", ".codex/config.toml"],
    componentDirs: {
        agents: null,
        skills: ".agents/skills",
        commands: null,
        rules: null,
    },
    mapTemplateTargets,
    transformContent,
    postInstallHints: [
        "Open in Codex CLI / IDE extension; instructions load from AGENTS.md and skills from .agents/skills/.",
        "Inventory: python3 .axion/scripts/generate_inventory.py .",
    ],
};
