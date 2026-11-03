import { INSTALL_PATHS, MERGE_JSON_FILES } from "../constants.js";

function posix(rel) {
    return rel.split("\\").join("/");
}

export function mapTemplateTargets(rel) {
    const src = posix(rel);
    const sub = src.startsWith("pack/") ? src.slice("pack/".length) : src;

    if (sub === "agents" || sub.startsWith("agents/")) {
        return [sub.replace(/^agents/, ".claude/agents")];
    }
    if (sub === "skills" || sub.startsWith("skills/")) {
        return [sub.replace(/^skills/, ".agents/skills")];
    }
    if (sub === "schemas" || sub.startsWith("schemas/")) {
        return [sub.replace(/^schemas/, ".agents/schemas")];
    }
    if (sub === "memory" || sub.startsWith("memory/")) {
        return [sub.replace(/^memory/, ".agents/memory")];
    }
    if (sub === "commands" || sub.startsWith("commands/")) {
        return [sub.replace(/^commands/, ".cursor/commands")];
    }
    if (sub === "rules" || sub.startsWith("rules/")) {
        return [sub.replace(/^rules/, ".cursor/rules")];
    }
    if (sub === "shared" || sub.startsWith("shared/")) {
        return [sub.replace(/^shared/, ".cursor/shared")];
    }
    if (sub === "scripts" || sub.startsWith("scripts/")) {
        return [sub.replace(/^scripts/, ".axion/scripts")];
    }
    if (sub === "ARCHITECTURE.md") return [".cursor/ARCHITECTURE.md"];
    if (sub === "mcp.json") return [".cursor/mcp.json"];
    return [src];
}

export const cursorAdapter = {
    id: "cursor",
    label: "Cursor",
    installPaths: INSTALL_PATHS,
    mergeJsonFiles: MERGE_JSON_FILES,
    markers: ["AGENTS.md", ".cursor/commands", ".claude/agents", ".agents/skills"],
    componentDirs: {
        agents: ".claude/agents",
        skills: ".agents/skills",
        commands: ".cursor/commands",
        rules: ".cursor/rules",
    },
    mapTemplateTargets,
    transformContent(_srcRel, _destRel, text) {
        return text;
    },
    postInstallHints: [
        "Open in Cursor and use /plan, /debug, etc.",
        "Inventory: python3 .axion/scripts/generate_inventory.py .",
    ],
};
