export const PACKAGE_NAME = "@zanetta/axion";
export const BIN_NAME = "axion";
export const DEFAULT_REPO = "github:zanetta/axion";
export const TEMP_FOLDER = ".temp_axion";

/** Paths copied from template root into target project (full install). */
export const INSTALL_PATHS = [
    ".claude",
    ".agents",
    ".cursor",
    "AGENTS.md",
    "AGENT_FLOW.md",
    ".env.example",
];

export const MERGE_JSON_FILES = new Set([".cursor/mcp.json"]);

/** Env override: absolute path to repo root, or giget source (default github:zanetta/axion). */
export const REPO_ENV = "AXION_REPO";
