import { antigravityAdapter } from "./antigravity.js";
import { claudeCodeAdapter } from "./claude-code.js";
import { codexAdapter } from "./codex.js";
import { cursorAdapter } from "./cursor.js";
import { windsurfAdapter } from "./windsurf.js";

export const DEFAULT_TOOL = "cursor";

const ADAPTERS = {
    cursor: cursorAdapter,
    "claude-code": claudeCodeAdapter,
    codex: codexAdapter,
    windsurf: windsurfAdapter,
    antigravity: antigravityAdapter,
};

export const TOOL_NAMES = Object.keys(ADAPTERS);

export function isValidTool(name) {
    return Object.hasOwn(ADAPTERS, name);
}

export function resolveAdapter(name = DEFAULT_TOOL) {
    const id = name ?? DEFAULT_TOOL;
    const adapter = ADAPTERS[id];
    if (!adapter) {
        throw new Error(`Invalid tool "${id}". Allowed: ${TOOL_NAMES.join(", ")}`);
    }
    return adapter;
}
