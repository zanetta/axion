import path from "path";
import fse from "fs-extra";
import { createHash } from "crypto";
import { INSTALL_PATHS } from "./constants.js";

export const MANIFEST_DIR = ".axion";
export const MANIFEST_FILE = "kit.manifest.json";

export function manifestPath(targetRoot) {
    return path.join(targetRoot, MANIFEST_DIR, MANIFEST_FILE);
}

async function hashPath(filePath) {
    const data = await fse.readFile(filePath);
    return createHash("sha256").update(data).digest("hex").slice(0, 16);
}

async function collectComponentSummary(targetRoot) {
    const summary = {
        agents: 0,
        skills: 0,
        commands: 0,
        rules: 0,
    };

    const agentsDir = path.join(targetRoot, ".claude", "agents");
    if (await fse.pathExists(agentsDir)) {
        summary.agents = (await fse.readdir(agentsDir)).filter((f) => f.endsWith(".md")).length;
    }

    const skillsDir = path.join(targetRoot, ".agents", "skills");
    if (await fse.pathExists(skillsDir)) {
        for (const entry of await fse.readdir(skillsDir, { withFileTypes: true })) {
            if (entry.isDirectory() && (await fse.pathExists(path.join(skillsDir, entry.name, "SKILL.md")))) {
                summary.skills += 1;
            }
        }
    }

    const commandsDir = path.join(targetRoot, ".cursor", "commands");
    if (await fse.pathExists(commandsDir)) {
        summary.commands = (await fse.readdir(commandsDir)).filter((f) => f.endsWith(".md")).length;
    }

    const rulesDir = path.join(targetRoot, ".cursor", "rules");
    if (await fse.pathExists(rulesDir)) {
        summary.rules = (await fse.readdir(rulesDir)).filter((f) => f.endsWith(".mdc")).length;
    }

    return summary;
}

/**
 * Write kit.manifest.json after install/update (P0 K-01 + D-01).
 */
export async function writeKitManifest(targetRoot, options = {}) {
    const {
        version,
        profile = "standard",
        packageName,
        templateSource = null,
        action = "init",
    } = options;

    const now = new Date().toISOString();
    const components = await collectComponentSummary(targetRoot);

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
        installed_at: installedAt,
        updated_at: now,
        last_action: action,
        template_source: templateSource,
        components,
        install_paths: INSTALL_PATHS,
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
