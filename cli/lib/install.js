import path from "path";
import fse from "fs-extra";
import { INSTALL_PATHS, KIT_AXION_FILES, SOURCE_PATHS } from "./constants.js";
import { mergeCodexToml, mergeMcpJson } from "./merge.js";
import { writeKitManifest, readKitManifest } from "./manifest.js";
import { DEFAULT_PROFILE, parseAgentSkills, resolveProfile } from "./profiles.js";
import { isProtected } from "./protect.js";
import { DEFAULT_TOOL, resolveAdapter } from "./adapters/index.js";

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
    let agentsDir = path.join(templateRoot, "pack", "agents");
    if (!(await fse.pathExists(agentsDir))) {
        agentsDir = path.join(templateRoot, ".claude", "agents");
    }
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
export function isInProfile(relativePath, isDirectory, plan) {
    const skill = relativePath.match(/^(?:pack\/|\.agents\/)?skills\/([^/]+)$/);
    if (skill && isDirectory) return plan.keepSkill(skill[1]);

    const agent = relativePath.match(/^(?:pack\/|\.claude\/)?agents\/([^/]+)\.md$/);
    if (agent && !isDirectory) return plan.keepAgent(agent[1]);

    return true;
}

function isIgnoredEntry(name) {
    return name === "__pycache__" || name.endsWith(".pyc");
}

async function resolveSourcePaths(templateRoot) {
    if (await fse.pathExists(path.join(templateRoot, "pack"))) {
        return SOURCE_PATHS;
    }
    return INSTALL_PATHS.filter((p) => p !== ".axion/scripts");
}

async function writeMappedFile(ctx, srcFile, srcRel, destRel, srcText) {
    const destFile = path.join(ctx.targetRoot, destRel);
    const transformed = ctx.adapter.transformContent(srcRel, destRel, srcText);

    if (ctx.adapter.mergeJsonFiles.has(destRel)) {
        const incoming = JSON.parse(transformed);
        const existing = (await fse.pathExists(destFile))
            ? await fse.readJson(destFile).catch(() => ({}))
            : {};
        const merged = mergeMcpJson(existing, incoming);
        await fse.ensureDir(path.dirname(destFile));
        await fse.writeJson(destFile, merged, { spaces: 4 });
        ctx.log(destRel, "merged");
        return;
    }

    if (ctx.adapter.mergeTomlFiles?.has(destRel)) {
        const existing = (await fse.pathExists(destFile))
            ? await fse.readFile(destFile, "utf8").catch(() => "")
            : "";
        const merged = mergeCodexToml(existing, transformed);
        await fse.ensureDir(path.dirname(destFile));
        await fse.writeFile(destFile, merged, "utf8");
        ctx.log(destRel, "merged");
        return;
    }

    if (isProtected(destRel) && (await fse.pathExists(destFile))) {
        ctx.log(destRel, "protected");
        return;
    }

    if (!ctx.force && (await fse.pathExists(destFile))) {
        ctx.log(destRel, "skipped");
        return;
    }

    await fse.ensureDir(path.dirname(destFile));
    if (destRel === srcRel && transformed === srcText) {
        await fse.copy(srcFile, destFile, { overwrite: ctx.force });
    } else {
        await fse.writeFile(destFile, transformed, "utf8");
    }
    ctx.log(destRel, ctx.force ? "overwritten" : "installed");
}

async function installMapped(srcFile, srcRel, ctx) {
    const targets = ctx.adapter.mapTemplateTargets(srcRel);
    if (targets.length === 0) return;
    const srcText = await fse.readFile(srcFile, "utf8");
    for (const destRel of targets) {
        await writeMappedFile(ctx, srcFile, srcRel, destRel, srcText);
    }
}

async function walkAndInstall(srcDir, ctx) {
    const entries = await fse.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        if (isIgnoredEntry(entry.name)) continue;
        const srcPath = path.join(srcDir, entry.name);
        const srcRel = toPosixRelative(ctx.templateRoot, srcPath);

        if (!isInProfile(srcRel, entry.isDirectory(), ctx.plan)) {
            const mappedTargets = ctx.adapter.mapTemplateTargets(srcRel);
            if (mappedTargets.length === 0) {
                continue;
            }
            ctx.log(mappedTargets[0], "excluded");
            for (const destRel of mappedTargets) {
                if (await fse.pathExists(path.join(ctx.targetRoot, destRel))) {
                    ctx.outsideProfile.push(destRel);
                }
            }
            continue;
        }

        if (entry.isDirectory()) {
            await walkAndInstall(srcPath, ctx);
            continue;
        }

        await installMapped(srcPath, srcRel, ctx);
    }
}

async function copyInstallItem(itemName, ctx) {
    const srcPath = path.join(ctx.templateRoot, itemName);

    if (!(await fse.pathExists(srcPath))) {
        throw new Error(`Template missing required path: ${itemName}`);
    }

    if ((await fse.stat(srcPath)).isDirectory()) {
        await walkAndInstall(srcPath, ctx);
        return;
    }

    await installMapped(srcPath, itemName, ctx);
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
    const adapter = resolveAdapter(options.tool ?? DEFAULT_TOOL);
    const actions = [];
    const ctx = {
        templateRoot,
        targetRoot,
        force: options.force ?? false,
        adapter,
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

    const sourceItems = await resolveSourcePaths(templateRoot);
    for (const item of sourceItems) {
        await copyInstallItem(item, ctx);
    }

    for (const relativePath of KIT_AXION_FILES) {
        const src = path.join(templateRoot, relativePath);
        if (await fse.pathExists(src)) {
            await installMapped(src, relativePath, ctx);
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
            tool: adapter.id,
        });
        actions.push({ file: ".axion/kit.manifest.json", action: "installed" });
        options.onManifest?.(manifest);
    }

    return {
        actions,
        profile,
        tool: adapter.id,
        includeOffensive: ctx.plan.includeOffensive,
        outsideProfile: ctx.outsideProfile,
    };
}

async function visitTemplateFiles(templateRoot, plan, visit) {
    async function walk(srcDir) {
        const entries = await fse.readdir(srcDir, { withFileTypes: true });
        for (const entry of entries) {
            if (isIgnoredEntry(entry.name)) continue;
            const src = path.join(srcDir, entry.name);
            const rel = toPosixRelative(templateRoot, src);
            if (entry.isDirectory()) {
                if (!isInProfile(rel, true, plan)) continue;
                await walk(src);
                continue;
            }
            if (!isInProfile(rel, false, plan)) continue;
            await visit(src, rel);
        }
    }

    const sourceItems = await resolveSourcePaths(templateRoot);
    for (const item of [...sourceItems, ...KIT_AXION_FILES]) {
        const src = path.join(templateRoot, item);
        if (!(await fse.pathExists(src))) continue;
        if ((await fse.stat(src)).isDirectory()) await walk(src);
        else await visit(src, item);
    }
}

function payloadsEqual(expected, actual, { asJson = false, asToml = false } = {}) {
    if (asToml) {
        return mergeCodexToml(actual, expected) === actual;
    }
    if (!asJson) return expected === actual;
    try {
        return JSON.stringify(JSON.parse(expected)) === JSON.stringify(JSON.parse(actual));
    } catch {
        return expected === actual;
    }
}

/** Files the next update would add, overwrite, or leave because they differ. */
export async function diffKit(templateRoot, targetRoot, options = {}) {
    const adapter = resolveAdapter(options.tool ?? DEFAULT_TOOL);
    const plan = resolveProfile(options.profile ?? DEFAULT_PROFILE, {
        enableOffensive: options.enableOffensive === true,
        agentSkills: await readAgentSkills(templateRoot),
    });
    const report = { missing: [], drifted: [], protected: [] };

    await visitTemplateFiles(templateRoot, plan, async (src, rel) => {
        const srcText = await fse.readFile(src, "utf8");
        for (const destRel of adapter.mapTemplateTargets(rel)) {
            const dest = path.join(targetRoot, destRel);
            if (!(await fse.pathExists(dest))) {
                report.missing.push(destRel);
                continue;
            }
            if (isProtected(destRel)) {
                report.protected.push(destRel);
                continue;
            }
            const expected = adapter.transformContent(rel, destRel, srcText);
            const actual = await fse.readFile(dest, "utf8");
            if (
                !payloadsEqual(expected, actual, {
                    asJson: adapter.mergeJsonFiles.has(destRel),
                    asToml: Boolean(adapter.mergeTomlFiles?.has(destRel)),
                })
            ) {
                report.drifted.push(destRel);
            }
        }
    });

    for (const key of Object.keys(report)) report[key].sort();
    return report;
}

export async function isKitInstalled(targetRoot, tool) {
    let resolved = tool;
    if (resolved === undefined) {
        const manifest = await readKitManifest(targetRoot);
        resolved = manifest?.tool ?? DEFAULT_TOOL;
    }
    const adapter = resolveAdapter(resolved);
    const checks = await Promise.all(
        adapter.markers.map((rel) => fse.pathExists(path.join(targetRoot, rel))),
    );
    return checks.every(Boolean);
}
