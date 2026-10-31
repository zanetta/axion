#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { downloadTemplate } from "giget";
import path from "path";
import fse from "fs-extra";
import readline from "readline";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import {
    BIN_NAME,
    DEFAULT_REPO,
    PACKAGE_NAME,
    REPO_ENV,
    TEMP_FOLDER,
} from "../lib/constants.js";
import { diffKit, installKit, isKitInstalled } from "../lib/install.js";
import { readKitManifest } from "../lib/manifest.js";
import {
    isOffensiveEnabled,
    isValidProfile,
    PROFILE_NAMES,
    resolveInstallSettings,
} from "../lib/profiles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = await fse.readJson(path.join(__dirname, "..", "package.json"));

const repoSource = process.env[REPO_ENV] ?? DEFAULT_REPO;

async function fetchTemplate(source, tempDir, branch) {
    const resolved = branch && !path.isAbsolute(source) && !source.startsWith("file:")
        ? `${source}#${branch}`
        : source;

    if (path.isAbsolute(resolved) || resolved.startsWith("file:")) {
        const localPath = resolved.startsWith("file:")
            ? fileURLToPath(resolved)
            : resolved;
        const skipDirs = new Set([".git", "node_modules", TEMP_FOLDER, "cli"]);
        await fse.copy(localPath, tempDir, {
            filter: (src) => {
                const rel = path.relative(localPath, src);
                if (!rel) return true;
                return !rel.split(path.sep).some((part) => skipDirs.has(part));
            },
        });
        return;
    }

    await downloadTemplate(resolved, { dir: tempDir, force: true });
}

const showBanner = (quiet = false) => {
    if (quiet) return;
    console.log(
        chalk.blueBright(`
    ╔════════════════════════════╗
    ║    AXION CLI (Cursor)      ║
    ╚════════════════════════════╝
    `),
    );
};

const log = (message, quiet = false) => {
    if (!quiet) console.log(message);
};

const confirm = (question) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.on("SIGINT", () => {
            rl.close();
            console.log(chalk.gray("\nOperation aborted by user."));
            process.exit(0);
        });

        rl.question(chalk.yellow(`? ${question} (y/N) `), (answer) => {
            rl.close();
            const val = answer.trim().toLowerCase();
            resolve(val === "y" || val === "yes");
        });
    });
};

const checkUpdate = async (quiet = false) => {
    if (quiet) return null;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const res = await fetch(
            `https://registry.npmjs.org/${PACKAGE_NAME.replace("/", "%2F")}/latest`,
            { signal: controller.signal },
        );
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data.version && data.version !== pkg.version) {
                return data.version;
            }
        }
    } catch {
        // ignore
    }
    return null;
};

const showUpdateNotification = (latestVersion) => {
    if (!latestVersion) return;
    console.log(
        chalk.yellow(`
  ┌────────────────────────────────────────────────────────────┐
  │  Update available: ${chalk.red(pkg.version)} → ${chalk.green(latestVersion)}                     │
  │  Run: ${chalk.cyan(`npm install -g ${PACKAGE_NAME}`)}              │
  └────────────────────────────────────────────────────────────┘
  `),
    );
};

const cleanup = async (tempDir) => {
    if (await fse.pathExists(tempDir)) {
        await fse.remove(tempDir);
    }
};

process.on("SIGINT", async () => {
    console.log(chalk.gray("\n\nOperation aborted by user. Cleaning up..."));
    const tempDir = path.join(path.resolve(process.cwd()), TEMP_FOLDER);
    await cleanup(tempDir);
    process.exit(0);
});

const printDryRun = async (targetDir, options) => {
    console.log(chalk.blueBright("\n[Dry Run] No changes will be made\n"));
    console.log(chalk.white("Would perform the following actions:"));
    console.log(chalk.gray("────────────────────────────────────────"));
    console.log(
        `  1. Download from: ${chalk.cyan(repoSource)}${options.branch ? "#" + options.branch : ""}`,
    );
    console.log(`  2. Install to: ${chalk.cyan(targetDir)}`);
    console.log(`  3. Profile: ${chalk.cyan(options.profile)}`);
    console.log(
        `  4. Offensive skills: ${
            isOffensiveEnabled(options.profile, options.enableOffensive)
                ? chalk.yellow("ON")
                : chalk.gray("OFF")
        }`,
    );
    console.log("  5. Copy: .claude/, .agents/, .cursor/, AGENTS.md, AGENT_FLOW.md, .env.example");
    console.log(
        `  6. Merge mode: ${options.force ? chalk.red("OFF (--force overwrite)") : chalk.green("ON (mcp.json merge, rules skip if exist)")}`,
    );

    if (await isKitInstalled(targetDir)) {
        console.log(`  7. ${chalk.yellow("Kit partially or fully present — merge/skip unless --force")}`);
    }

    console.log(chalk.gray("────────────────────────────────────────\n"));
};

const runInstall = async (options) => {
    const quiet = options.quiet ?? false;
    const dryRun = options.dryRun ?? false;
    const force = options.force ?? false;
    const targetDir = path.resolve(options.path || process.cwd());
    const { profile, enableOffensive } = resolveInstallSettings(
        options,
        await readKitManifest(targetDir),
    );

    if (!isValidProfile(profile)) {
        const origin = options.profile === undefined ? " (from .axion/kit.manifest.json; pass --profile to override)" : "";
        console.error(
            chalk.red(`Invalid profile "${profile}"${origin}. Allowed: ${PROFILE_NAMES.join(", ")}`),
        );
        process.exit(1);
    }

    showBanner(quiet);
    const updatePromise = checkUpdate(quiet);

    const tempDir = path.join(targetDir, TEMP_FOLDER);
    const source = options.branch && !path.isAbsolute(repoSource)
        ? `${repoSource}#${options.branch}`
        : repoSource;

    if (dryRun) {
        await printDryRun(targetDir, {
            ...options,
            branch: options.branch,
            profile,
            enableOffensive,
        });
        return;
    }

    const installed = await isKitInstalled(targetDir);
    if (installed && !force) {
        log(
            chalk.yellow(
                "Warning: Axion appears already installed. Running in merge mode (existing files kept).",
            ),
            quiet,
        );
        log(chalk.gray("Use --force to overwrite all kit files."), quiet);
    } else if (installed && force) {
        log(chalk.yellow("Overwriting existing kit files (--force)..."), quiet);
    }

    const spinner = quiet
        ? null
        : ora({ text: "Downloading template...", color: "cyan" }).start();

    try {
        await fetchTemplate(repoSource, tempDir, options.branch);

        if (spinner) spinner.text = `Installing (profile: ${profile})...`;

        const drift = await diffKit(tempDir, targetDir, { profile, enableOffensive });
        if (!quiet) printDrift(drift, force);

        const summary = { installed: 0, merged: 0, skipped: 0, overwritten: 0, excluded: 0, protected: 0 };

        const result = await installKit(tempDir, targetDir, {
            force,
            version: pkg.version,
            packageName: PACKAGE_NAME,
            profile,
            enableOffensive,
            templateSource: source,
            action: installed ? "update" : "init",
            onAction: (_file, action) => {
                if (summary[action] !== undefined) summary[action] += 1;
            },
        });

        await cleanup(tempDir);

        if (spinner) {
            spinner.succeed(chalk.green("Installation successful!"));
        }

        if (!quiet) {
            console.log(chalk.gray("\n────────────────────────────────────────"));
            console.log(chalk.white("Summary:"));
            console.log(`   Installed:   ${chalk.green(summary.installed)}`);
            console.log(`   Merged:      ${chalk.cyan(summary.merged)}`);
            console.log(`   Skipped:     ${chalk.yellow(summary.skipped)}`);
            console.log(`   Overwritten: ${chalk.red(summary.overwritten)}`);
            console.log(`   Excluded:    ${chalk.gray(summary.excluded)} (outside profile)`);
            console.log(`   Protected:   ${chalk.green(summary.protected)} (user SPEC/PLAN/memory)`);
            console.log(`   Profile:     ${chalk.cyan(profile)}`);
            console.log(
                `   Offensive:   ${
                    result.includeOffensive ? chalk.yellow("enabled") : chalk.gray("disabled")
                }`,
            );
            if (result.outsideProfile.length > 0) {
                console.log(
                    chalk.yellow(
                        `\n   ${result.outsideProfile.length} existing kit component(s) are outside the "${profile}" profile and were kept (remove manually if unwanted):`,
                    ),
                );
                for (const item of result.outsideProfile) {
                    console.log(chalk.gray(`     - ${item}`));
                }
            }
            console.log(`   Manifest:    ${chalk.cyan(".axion/kit.manifest.json")} @ ${pkg.version}`);
            console.log(chalk.gray("────────────────────────────────────────"));
            console.log(chalk.white("\nNext steps:"));
            console.log(`   1. ${chalk.cyan("cp .env.example .env")} and set CONTEXT7_API_KEY (optional)`);
            console.log(`   2. Open in Cursor and use ${chalk.cyan("/plan")}, ${chalk.cyan("/debug")}, etc.`);
            console.log(
                chalk.gray(
                    `   3. Inventory: ${chalk.cyan("python3 .cursor/scripts/generate_inventory.py .")}`,
                ),
            );
            console.log(chalk.green("\nHappy coding!\n"));
        }

        const latestVersion = await updatePromise;
        showUpdateNotification(latestVersion);
    } catch (error) {
        let errorMsg = error.message;
        if (error.code === "ENOTFOUND" || error.message.includes("fetch failed")) {
            errorMsg =
                "Network connection failed. Check your internet connection and try again.";
        }

        if (spinner) {
            spinner.fail(chalk.red(`Error: ${errorMsg}`));
        } else {
            console.error(chalk.red(`Error: ${errorMsg}`));
        }

        await cleanup(tempDir);
        process.exit(1);
    }
};

function printDrift(drift, force) {
    const show = (label, items) => {
        if (items.length === 0) return;
        console.log(chalk.white(`\n${label} (${items.length})`));
        for (const item of items.slice(0, 20)) console.log(chalk.gray(`  ${item}`));
        if (items.length > 20) console.log(chalk.gray(`  … ${items.length - 20} more`));
    };
    show(force ? "Drift, will overwrite" : "Drift, kept (pass --force to overwrite kit files)", drift.drifted);
    show("Protected, never overwritten", drift.protected);
    if (drift.missing.length > 0) {
        console.log(chalk.white(`\nMissing from project: ${drift.missing.length} kit file(s) will be added`));
    }
}

async function readDoctor(targetDir) {
    const script = path.join(targetDir, ".cursor", "scripts", "session_manager.py");
    if (!(await fse.pathExists(script))) return null;
    const result = spawnSync("python3", [script, "doctor", targetDir], { encoding: "utf8" });
    if (result.status !== 0) return null;
    try {
        return JSON.parse(result.stdout);
    } catch {
        return null;
    }
}

const statusCommand = async (options) => {
    const targetDir = path.resolve(options.path || process.cwd());
    const updatePromise = checkUpdate(options.quiet);

    console.log(chalk.blueBright("\nAxion Status\n"));
    console.log(`CLI version: ${chalk.cyan(pkg.version)}`);
    console.log(`Target:      ${chalk.gray(targetDir)}`);

    const installed = await isKitInstalled(targetDir);

    if (!installed) {
        console.log(chalk.red("\n[X] Kit not installed (or incomplete)"));
        console.log(
            chalk.yellow(`Run ${chalk.cyan(`npx ${PACKAGE_NAME} init`)} to install.\n`),
        );
        const latestVersion = await updatePromise;
        if (latestVersion) showUpdateNotification(latestVersion);
        return;
    }

    console.log(chalk.green("\n[OK] Kit installed"));
    console.log(chalk.gray("────────────────────────────────────────"));
    for (const p of [
        ".claude/agents",
        ".agents/skills",
        ".cursor/commands",
        "AGENTS.md",
        ".axion/kit.manifest.json",
    ]) {
        const full = path.join(targetDir, p);
        const ok = await fse.pathExists(full);
        console.log(`  ${ok ? chalk.green("✓") : chalk.red("✗")} ${p}`);
    }

    const manifest = await readKitManifest(targetDir);
    if (manifest) {
        console.log(chalk.gray("────────────────────────────────────────"));
        console.log(`Installed kit: ${chalk.cyan(manifest.version)} (profile: ${manifest.profile})`);
        console.log(
            `Offensive:     ${
                manifest.enable_offensive ? chalk.yellow("enabled") : chalk.gray("disabled")
            }`,
        );
        console.log(`Updated at:    ${chalk.gray(manifest.updated_at)}`);
        if (manifest.components) {
            console.log(
                `Components:    agents=${manifest.components.agents} skills=${manifest.components.skills} commands=${manifest.components.commands} rules=${manifest.components.rules}`,
            );
        }
    } else {
        console.log(chalk.yellow("  (no .axion/kit.manifest.json — re-run init/update to create)"));
    }

    const doctor = await readDoctor(targetDir);
    if (doctor) {
        console.log(`Memory index:  ${chalk.cyan(doctor.memory_index_lines)} lines`);
        console.log(`Path lint:     ${chalk.cyan(doctor.path_lint)}`);
        const last = doctor.last_verify;
        console.log(
            `Last verify:   ${
                last
                    ? chalk.cyan(`${last.ts} slug=${last.slug ?? "-"} exit=${last.exit}`)
                    : chalk.gray("none")
            }`,
        );
    }
    console.log(chalk.gray("────────────────────────────────────────\n"));

    const latestVersion = await updatePromise;
    if (latestVersion) {
        if (manifest && latestVersion !== manifest.version) {
            console.log(
                chalk.yellow(
                    `Update available: installed ${manifest.version} → registry ${latestVersion}\n`,
                ),
            );
        }
        showUpdateNotification(latestVersion);
    } else if (!options.quiet) {
        console.log(chalk.green("[OK] CLI / kit appear up to date with registry.\n"));
    }
};

const program = new Command();

program
    .name(BIN_NAME)
    .description("Install Axion, a spec-driven development kit for Cursor IDE")
    .version(pkg.version, "-v, --version", "Display version number");

const profileOption = [
    "--profile <name>",
    `Install profile: ${PROFILE_NAMES.join("|")} (default: installed profile, else standard)`,
];

program
    .command("init")
    .description("Full install: .claude, .agents, .cursor, AGENTS.md (merge by default)")
    .option("-f, --force", "Overwrite existing kit files", false)
    .option("-p, --path <dir>", "Target project directory", process.cwd())
    .option("-b, --branch <name>", "Git branch of the template repository")
    .option("-q, --quiet", "Minimal output (CI/CD)", false)
    .option("--dry-run", "Preview actions without writing files", false)
    .option(...profileOption)
    .option(
        "--enable-offensive",
        "Install red-team-tactics + penetration-tester (implied by --profile security)",
    )
    .action(runInstall);

program
    .command("update")
    .description("Update kit from template (merge by default; --force to overwrite)")
    .option("-f, --force", "Overwrite all kit files", false)
    .option("-p, --path <dir>", "Target project directory", process.cwd())
    .option("-b, --branch <name>", "Git branch of the template repository")
    .option("-q, --quiet", "Minimal output", false)
    .option("--dry-run", "Preview only", false)
    .option(...profileOption)
    .option(
        "--enable-offensive",
        "Install red-team-tactics + penetration-tester (implied by --profile security)",
    )
    .action(async (options) => {
        if (!options.force && !options.quiet && !options.dryRun) {
            const ok = await confirm(
                "Update will merge new kit files. Use --force to overwrite. Continue?",
            );
            if (!ok) {
                log(chalk.gray("Operation cancelled."));
                process.exit(0);
            }
        }
        await runInstall(options);
    });

program
    .command("status")
    .description("Check kit installation and CLI version")
    .option("-p, --path <dir>", "Target project directory", process.cwd())
    .option("-q, --quiet", "Skip update check", false)
    .action(statusCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
