import { INSTALL_PATHS, MERGE_JSON_FILES } from "../constants.js";

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
    mapTemplateTargets(rel) {
        return [rel];
    },
    transformContent(_srcRel, _destRel, text) {
        return text;
    },
    postInstallHints: [
        "Open in Cursor and use /plan, /debug, etc.",
        "Inventory: python3 .cursor/scripts/generate_inventory.py .",
    ],
};
