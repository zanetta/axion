import path from "path";
import fse from "fs-extra";
import { INSTALL_PATHS, KIT_AXION_FILES, MERGE_JSON_FILES } from "./constants.js";
import { mergeMcpJson } from "./merge.js";
import { writeKitManifest } from "./manifest.js";
import { DEFAULT_PROFILE, parseAgentSkills, resolveProfile } from "./profiles.js";

export const OFFENSIVE_NOTE = ".axion/OFFENSIVE_DISABLED.md";

const OFFENSIVE_NOTE_BODY = `# Offensive skills disabled

This install used a profile without offensive surface (\`red-team-tactics\`, \`penetration-tester\`).

To enable:

\`\`\`bash
npx @zanetta/axion update --enable-offensive
# or
npx @zanetta/axion update --profile security
\`\`\`
`;

function toPosixRelative(root, filePath) {
    return path.relative(root, filePath).split(path.sep).join("/");
}

async function readAgentSkills(templateRoot) {
    const agentsDir = path.join(templateRoot, ".claude", "agents");
    const agentSkills = new Map();
    if (!(await fse.pathExists(agentsDir))) return agentSkills;

    for (const file of await fse.readdir(agentsDir)) {
        if (!file.endsWith(".md")) continue;
        const markdown = await fse.readFile(path.join(agentsDir, file), "utf8");
        agentSkills.set(file.replace(/\.md$/, ""), parseAgentSkills(markdown));
    }
    return agentSkills;
}

/** False when the profile excludes this skill dir or agent file. */
function isInProfile(relativePath, isDirectory, plan) {
    const skill = relativePath.match(/^\.agents\/skills\/([^/]+)$/);
    if (skill && isDirectory) return plan.keepSkill(skill[1]);

    const agent = relativePath.match(/^\.claude\/agents\/([^/]+)\.md$/);
    if (agent && !isDirectory) return plan.keepAgent(agent[1]);

    return true;
}

async function copyFileWithMerge(srcFile, destFile, relativePath, force, log) {
    if (MERGE_JSON_FILES.has(relativePath)) {
        const incoming = await fse.readJson(srcFile).catch(() => ({}));
        const existing = (await fse.pathExists(destFile))
            ? await fse.readJson(destFile).catch(() => ({}))
            : {};
        const merged = mergeMcpJson(existing, incoming);
        await fse.ensureDir(path.dirname(destFile));
        await fse.writeJson(destFile, merged, { spaces: 4 });
        log(relativePath, "merged");
        return;
    }

    if (!force && (await fse.pathExists(destFile))) {
        log(relativePath, "skipped");
        return;
    }

    await fse.ensureDir(path.dirname(destFile));
    await fse.copy(srcFile, destFile, { overwrite: force });
    log(relativePath, force ? "overwritten" : "installed");
}

async function copyDirRecursive(srcDir, destDir, ctx) {
    const entries = await fse.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        const relativePath = toPosixRelative(ctx.targetRoot, destPath);

        if (!isInProfile(relativePath, entry.isDirectory(), ctx.plan)) {
            ctx.log(relativePath, "excluded");
            if (await fse.pathExists(destPath)) ctx.outsideProfile.push(relativePath);
            continue;
        }

        if (entry.isDirectory()) {
            await fse.ensureDir(destPath);
            await copyDirRecursive(srcPath, destPath, ctx);
            continue;
        }

        await copyFileWithMerge(srcPath, destPath, relativePath, ctx.force, ctx.log);
    }
}

async function copyInstallItem(itemName, ctx) {
    const srcPath = path.join(ctx.templateRoot, itemName);
    const destPath = path.join(ctx.targetRoot, itemName);

    if (!(await fse.pathExists(srcPath))) {
        throw new Error(`Template missing required path: ${itemName}`);
    }

    if ((await fse.stat(srcPath)).isDirectory()) {
        await fse.ensureDir(destPath);
        await copyDirRecursive(srcPath, destPath, ctx);
        return;
    }

    await copyFileWithMerge(srcPath, destPath, itemName, ctx.force, ctx.log);
}

async function syncOffensiveNote(targetRoot, includeOffensive) {
    const notePath = path.join(targetRoot, OFFENSIVE_NOTE);
    if (includeOffensive) {
        await fse.remove(notePath);
        return;
    }
    await fse.outputFile(notePath, OFFENSIVE_NOTE_BODY, "utf8");
}

/**
 * Copies the kit into targetRoot, honoring the profile at copy time.
 * Never deletes files in targetRoot: kit components outside the profile that
 * already exist are reported via `outsideProfile`.
 */
export async function installKit(templateRoot, targetRoot, options = {}) {
    const profile = options.profile ?? DEFAULT_PROFILE;
    const actions = [];
    const ctx = {
        templateRoot,
        targetRoot,
        force: options.force ?? false,
        plan: resolveProfile(profile, {
            enableOffensive: options.enableOffensive === true,
            agentSkills: await readAgentSkills(templateRoot),
        }),
        outsideProfile: [],
        log: (file, action) => {
            actions.push({ file, action });
            options.onAction?.(file, action);
        },
    };

    for (const item of INSTALL_PATHS) {
        await copyInstallItem(item, ctx);
    }

    for (const relativePath of KIT_AXION_FILES) {
        const src = path.join(templateRoot, relativePath);
        if (await fse.pathExists(src)) {
            await copyFileWithMerge(src, path.join(targetRoot, relativePath), relativePath, ctx.force, ctx.log);
        }
    }

    await syncOffensiveNote(targetRoot, ctx.plan.includeOffensive);

    if (options.writeManifest !== false && options.version) {
        const manifest = await writeKitManifest(targetRoot, {
            version: options.version,
            profile,
            enableOffensive: ctx.plan.includeOffensive,
            packageName: options.packageName,
            templateSource: options.templateSource ?? null,
            action: options.action ?? "init",
        });
        actions.push({ file: ".axion/kit.manifest.json", action: "installed" });
        options.onManifest?.(manifest);
    }

    return {
        actions,
        profile,
        includeOffensive: ctx.plan.includeOffensive,
        outsideProfile: ctx.outsideProfile,
    };
}

export async function isKitInstalled(targetRoot) {
    const markers = [
        path.join(targetRoot, "AGENTS.md"),
        path.join(targetRoot, ".cursor", "commands"),
        path.join(targetRoot, ".claude", "agents"),
        path.join(targetRoot, ".agents", "skills"),
    ];

    const checks = await Promise.all(markers.map((p) => fse.pathExists(p)));
    return checks.every(Boolean);
}
