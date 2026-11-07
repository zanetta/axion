import path from "path";
import fse from "fs-extra";
import { createHash } from "crypto";
import { DEFAULT_TOOL, resolveAdapter } from "./adapters/index.js";

export const MANIFEST_DIR = ".axion";
export const MANIFEST_FILE = "kit.manifest.json";

export function manifestPath(targetRoot) {
    return path.join(targetRoot, MANIFEST_DIR, MANIFEST_FILE);
}

async function hashPath(filePath) {
    const data = await fse.readFile(filePath);
    return createHash("sha256").update(data).digest("hex").slice(0, 16);
}

async function countMarkdown(dir, ext) {
    if (!(await fse.pathExists(dir))) return 0;
    return (await fse.readdir(dir)).filter((f) => f.endsWith(ext)).length;
}

async function countSkills(dir) {
    if (!(await fse.pathExists(dir))) return 0;
    let count = 0;
    for (const entry of await fse.readdir(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && (await fse.pathExists(path.join(dir, entry.name, "SKILL.md")))) {
            count += 1;
        }
    }
    return count;
}

/** Count Axion SDD command skills (ax-* dirs with SKILL.md) under a skills tree. */
async function countAxCommandSkills(dir) {
    if (!(await fse.pathExists(dir))) return 0;
    let count = 0;
    for (const entry of await fse.readdir(dir, { withFileTypes: true })) {
        if (
            entry.isDirectory() &&
            entry.name.startsWith("ax-") &&
            (await fse.pathExists(path.join(dir, entry.name, "SKILL.md")))
        ) {
            count += 1;
        }
    }
    return count;
}

async function collectComponentSummary(targetRoot, adapter) {
    const dirs = adapter.componentDirs;
    let commands = 0;
    if (dirs.commands) {
        commands = adapter.commandsAsSkills
            ? await countAxCommandSkills(path.join(targetRoot, dirs.commands))
            : await countMarkdown(path.join(targetRoot, dirs.commands), ".md");
    }
    return {
        agents: dirs.agents ? await countMarkdown(path.join(targetRoot, dirs.agents), ".md") : 0,
        skills: await countSkills(path.join(targetRoot, dirs.skills)),
        commands,
        rules: dirs.rules
            ? await countMarkdown(
                  path.join(targetRoot, dirs.rules),
                  adapter.rulesExt ?? ".mdc",
              )
            : 0,
    };
}

/**
 * Write kit.manifest.json after install/update (P0 K-01 + D-01).
 */
export async function writeKitManifest(targetRoot, options = {}) {
    const {
        version,
        profile = "standard",
        enableOffensive = false,
        packageName,
        templateSource = null,
        action = "init",
        tool = DEFAULT_TOOL,
    } = options;

    const adapter = resolveAdapter(tool);
    const now = new Date().toISOString();
    const components = await collectComponentSummary(targetRoot, adapter);

    let agentsHash = null;
    const agentsMd = path.join(targetRoot, "AGENTS.md");
    if (await fse.pathExists(agentsMd)) {
        agentsHash = await hashPath(agentsMd);
    }

    const existing = await readKitManifest(targetRoot);
    const installedAt = existing?.installed_at ?? now;

    const manifest = {
        schema_version: "1.0.0",
        package: packageName,
        version,
        profile,
        tool: adapter.id,
        enable_offensive: Boolean(enableOffensive),
        installed_at: installedAt,
        updated_at: now,
        last_action: action,
        template_source: templateSource,
        components,
        install_paths: adapter.installPaths,
        checksums: {
            "AGENTS.md": agentsHash,
        },
    };

    const dest = manifestPath(targetRoot);
    await fse.ensureDir(path.dirname(dest));
    await fse.writeJson(dest, manifest, { spaces: 2 });
    return manifest;
}

export async function readKitManifest(targetRoot) {
    const dest = manifestPath(targetRoot);
    if (!(await fse.pathExists(dest))) {
        return null;
    }
    try {
        return await fse.readJson(dest);
    } catch {
        return null;
    }
}
