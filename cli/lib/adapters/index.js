import { claudeCodeAdapter } from "./claude-code.js";
import { cursorAdapter } from "./cursor.js";

export const DEFAULT_TOOL = "cursor";

const ADAPTERS = {
    cursor: cursorAdapter,
    "claude-code": claudeCodeAdapter,
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
