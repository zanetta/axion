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

/** Files copied from the template's .axion/ (everything else there belongs to the kit repo itself). */
export const KIT_AXION_FILES = [".axion/trace/README.md"];

/** Written by CLI after install (not copied from template). */
export const MANIFEST_RELATIVE = ".axion/kit.manifest.json";

export const MERGE_JSON_FILES = new Set([".cursor/mcp.json"]);

/** Env override: absolute path to repo root, or giget source (default github:zanetta/axion). */
export const REPO_ENV = "AXION_REPO";
