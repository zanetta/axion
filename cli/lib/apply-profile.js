import path from "path";
import fse from "fs-extra";
import { resolveProfileExclusions } from "./profiles.js";

/**
 * Prune installed kit to match profile (runs after full copy).
 * @returns {Promise<{ removed: string[] }>}
 */
export async function applyProfile(targetRoot, profile, opts = {}) {
    const resolved = resolveProfileExclusions(profile, opts);
    const removed = [];

    const skillsRoot = path.join(targetRoot, ".agents", "skills");
    const agentsRoot = path.join(targetRoot, ".claude", "agents");

    if (await fse.pathExists(skillsRoot)) {
        const dirs = await fse.readdir(skillsRoot, { withFileTypes: true });
        for (const entry of dirs) {
            if (!entry.isDirectory()) continue;
            const name = entry.name;
            let drop = false;

            if (resolved.mode === "allowlist") {
                drop = !resolved.allowSkills.has(name);
                if (resolved.forceExcludeSkills.includes(name)) drop = true;
            } else {
                drop = resolved.excludeSkillDirs.includes(name);
            }

            if (drop) {
                await fse.remove(path.join(skillsRoot, name));
                removed.push(`.agents/skills/${name}`);
            }
        }
    }

    if (await fse.pathExists(agentsRoot)) {
        const files = await fse.readdir(agentsRoot);
        for (const file of files) {
            if (!file.endsWith(".md")) continue;
            const stem = file.replace(/\.md$/, "");
            let drop = false;

            if (resolved.mode === "allowlist") {
                drop = !resolved.allowAgents.has(stem);
                if (!resolved.includeOffensive && resolved.excludeAgentFiles.includes(file)) {
                    drop = true;
                }
            } else {
                drop = resolved.excludeAgentFiles.includes(file);
            }

            if (drop) {
                await fse.remove(path.join(agentsRoot, file));
                removed.push(`.claude/agents/${file}`);
            }
        }
    }

    // Note in security rule when offensive disabled
    if (!resolved.includeOffensive) {
        const notePath = path.join(targetRoot, ".axion", "OFFENSIVE_DISABLED.md");
        await fse.ensureDir(path.dirname(notePath));
        await fse.writeFile(
            notePath,
            [
                "# Offensive skills disabled",
                "",
                "This install used a profile without offensive surface (`red-team-tactics`, `penetration-tester`).",
                "",
                "To enable:",
                "",
                "```bash",
                "npx @zanetta/axion init --profile security --force",
                "# or",
                "npx @zanetta/axion init --enable-offensive --force",
                "```",
                "",
            ].join("\n"),
            "utf8",
        );
        removed.push("(wrote .axion/OFFENSIVE_DISABLED.md)");
    } else {
        const notePath = path.join(targetRoot, ".axion", "OFFENSIVE_DISABLED.md");
        if (await fse.pathExists(notePath)) {
            await fse.remove(notePath);
        }
    }

    return { removed, includeOffensive: resolved.includeOffensive };
}
