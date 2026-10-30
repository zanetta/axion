import path from "path";
import fse from "fs-extra";
import { INSTALL_PATHS, MERGE_JSON_FILES } from "./constants.js";
import { mergeMcpJson, shouldSkipExistingFile } from "./merge.js";
import { writeKitManifest } from "./manifest.js";
import { applyProfile } from "./apply-profile.js";

function toPosixRelative(root, filePath) {
    return path.relative(root, filePath).split(path.sep).join("/");
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
        log?.(relativePath, "merged");
        return;
    }

    if (!force && (await fse.pathExists(destFile))) {
        if (shouldSkipExistingFile(relativePath, force)) {
            log?.(relativePath, "skipped");
            return;
        }
        log?.(relativePath, "skipped");
        return;
    }

    await fse.ensureDir(path.dirname(destFile));
    await fse.copy(srcFile, destFile, { overwrite: force });
    log?.(relativePath, force ? "overwritten" : "installed");
}

async function copyDirRecursive(srcDir, destDir, projectRoot, force, log) {
    const entries = await fse.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        const relativePath = toPosixRelative(projectRoot, destPath);

        if (entry.isDirectory()) {
            await fse.ensureDir(destPath);
            await copyDirRecursive(srcPath, destPath, projectRoot, force, log);
            continue;
        }

        await copyFileWithMerge(srcPath, destPath, relativePath, force, log);
    }
}

async function copyInstallItem(templateRoot, targetRoot, itemName, force, log) {
    const srcPath = path.join(templateRoot, itemName);
    const destPath = path.join(targetRoot, itemName);

    if (!(await fse.pathExists(srcPath))) {
        throw new Error(`Template missing required path: ${itemName}`);
    }

    const stat = await fse.stat(srcPath);

    if (stat.isDirectory()) {
        await fse.ensureDir(destPath);
        await copyDirRecursive(srcPath, destPath, targetRoot, force, log);
        return;
    }

    const relativePath = toPosixRelative(targetRoot, destPath);
    await copyFileWithMerge(srcPath, destPath, relativePath, force, log);
}

export async function installKit(templateRoot, targetRoot, options = {}) {
    const force = options.force ?? false;
    const actions = [];

    const log = (file, action) => {
        actions.push({ file, action });
        options.onAction?.(file, action);
    };

    for (const item of INSTALL_PATHS) {
        await copyInstallItem(templateRoot, targetRoot, item, force, log);
    }

    // Optional kit extras under .axion/ (trace README, inventory) — never overwrite consumer SPEC/PLAN
    const axionSrc = path.join(templateRoot, ".axion");
    if (await fse.pathExists(axionSrc)) {
        const skipNames = new Set(["kit.manifest.json", "logs"]);
        const entries = await fse.readdir(axionSrc, { withFileTypes: true });
        for (const entry of entries) {
            if (skipNames.has(entry.name)) continue;
            const src = path.join(axionSrc, entry.name);
            const dest = path.join(targetRoot, ".axion", entry.name);
            if (entry.isDirectory()) {
                await fse.copy(src, dest, {
                    overwrite: force,
                    filter: (s) => !s.endsWith("kit.manifest.json"),
                });
                log(`.axion/${entry.name}`, force ? "overwritten" : "installed");
            } else if (force || !(await fse.pathExists(dest))) {
                await fse.copy(src, dest, { overwrite: force });
                log(`.axion/${entry.name}`, force ? "overwritten" : "installed");
            } else {
                log(`.axion/${entry.name}`, "skipped");
            }
        }
    }

    const profile = options.profile ?? "standard";
    const enableOffensive = options.enableOffensive === true;
    const profileResult = await applyProfile(targetRoot, profile, { enableOffensive });
    for (const rem of profileResult.removed) {
        if (!rem.startsWith("(")) {
            actions.push({ file: rem, action: "skipped" });
            options.onAction?.(rem, "skipped");
        }
    }
    options.onProfile?.(profileResult);

    if (options.writeManifest !== false && options.version) {
        const manifest = await writeKitManifest(targetRoot, {
            version: options.version,
            profile,
            enableOffensive: profileResult.includeOffensive,
            packageName: options.packageName,
            templateSource: options.templateSource ?? null,
            action: options.action ?? "init",
        });
        actions.push({ file: ".axion/kit.manifest.json", action: "installed" });
        options.onManifest?.(manifest);
    }

    return actions;
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
