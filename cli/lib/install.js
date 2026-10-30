import path from "path";
import fse from "fs-extra";
import { INSTALL_PATHS, MERGE_JSON_FILES } from "./constants.js";
import { mergeMcpJson, shouldSkipExistingFile } from "./merge.js";
import { writeKitManifest } from "./manifest.js";

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

    if (options.writeManifest !== false && options.version) {
        const manifest = await writeKitManifest(targetRoot, {
            version: options.version,
            profile: options.profile ?? "standard",
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
