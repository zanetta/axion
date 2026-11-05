import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { diffKit, installKit, isKitInstalled } from "../lib/install.js";
import { PROFILE_NAMES, parseAgentSkills } from "../lib/profiles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packRoot = path.resolve(__dirname, "..", "..");
const cliBin = path.join(__dirname, "..", "bin", "index.js");

const hasPythonDeps =
    spawnSync("python3", ["-c", "import yaml, jsonschema"], { stdio: "ignore" }).status === 0;

function runScript(projectRoot, script) {
    return spawnSync("python3", [path.join(projectRoot, ".axion", "scripts", script), projectRoot], {
        encoding: "utf8",
    });
}

async function danglingSkillRefs(projectRoot, skillsRel = ".agents/skills") {
    const agentsDir = path.join(projectRoot, ".claude", "agents");
    const dangling = [];
    for (const file of await fse.readdir(agentsDir)) {
        const skills = parseAgentSkills(await fse.readFile(path.join(agentsDir, file), "utf8"));
        for (const skill of skills) {
            if (!(await fse.pathExists(path.join(projectRoot, skillsRel, skill)))) {
                dangling.push(`${file}: ${skill} (${skillsRel})`);
            }
        }
    }
    return dangling;
}

async function withInstall(profile, fn, tool = "cursor") {
    const target = await fse.mkdtemp(path.join(os.tmpdir(), `axion-smoke-${profile}-`));
    try {
        await installKit(packRoot, target, {
            profile,
            tool,
            version: "0.0.0-smoke",
            packageName: "@zanetta/axion",
        });
        await fn(target);
    } finally {
        await fse.remove(target);
    }
}

for (const profile of PROFILE_NAMES) {
    test(`smoke: ${profile} install is complete and consistent`, async () => {
        await withInstall(profile, async (target) => {
            const manifest = await fse.readJson(path.join(target, ".axion", "kit.manifest.json"));
            assert.equal(manifest.profile, profile);
            assert.equal(manifest.version, "0.0.0-smoke");
            assert.equal(manifest.tool, "cursor");
            assert.ok(manifest.components.agents > 0 && manifest.components.skills > 0);
            assert.ok(manifest.components.commands > 0);

            for (const rel of [
                "AGENTS.md",
                ".cursor/commands/discover.md",
                ".cursor/commands/specify.md",
                ".cursor/commands/plan.md",
                ".cursor/commands/implement.md",
                ".cursor/commands/design.md",
                ".agents/skills/design/SKILL.md",
                ".agents/shared/ui-ux-pro-max/scripts/search.py",
                ".axion/scripts/lint_paths.py",
                ".agents/schemas/command-contract.schema.json",
                ".agents/skills/plan-writing/templates/PLAN.template.md",
                ".agents/skills/verify-changes/templates/ACCEPTANCE.template.md",
                ".claude/agents/orchestrator.md",
            ]) {
                assert.ok(await fse.pathExists(path.join(target, rel)), `missing ${rel}`);
            }
            assert.equal(await fse.pathExists(path.join(target, ".cursor", "scripts")), false);
            assert.equal(await fse.pathExists(path.join(target, ".cursor", "shared")), false);

            assert.deepEqual(await danglingSkillRefs(target), []);
            assert.equal(await isKitInstalled(target, "cursor"), true);

            const offensive = profile === "security";
            assert.equal(
                await fse.pathExists(path.join(target, ".claude", "agents", "penetration-tester.md")),
                offensive,
            );

            const lintPaths = runScript(target, "lint_paths.py");
            assert.equal(lintPaths.status, 0, lintPaths.stdout + lintPaths.stderr);
        });
    });
}

for (const profile of ["standard", "security"]) {
    test(`smoke: claude-code ${profile} install projects native paths`, async () => {
        await withInstall(
            profile,
            async (target) => {
                const manifest = await fse.readJson(path.join(target, ".axion", "kit.manifest.json"));
                assert.equal(manifest.tool, "claude-code");
                assert.ok(manifest.components.commands > 0);
                assert.equal(manifest.components.rules, 0);

                for (const rel of [
                    "AGENTS.md",
                    "CLAUDE.md",
                    ".claude/commands/discover.md",
                    ".claude/commands/specify.md",
                    ".claude/commands/plan.md",
                    ".claude/commands/implement.md",
                    ".claude/agents/orchestrator.md",
                    ".agents/skills/plan-writing/SKILL.md",
                    ".claude/skills/plan-writing/SKILL.md",
                    ".axion/scripts/lint_paths.py",
                    ".agents/schemas/command-contract.schema.json",
                    ".mcp.json",
                    ".claude/commands/design.md",
                    ".agents/skills/design/SKILL.md",
                    ".claude/skills/design/SKILL.md",
                    ".agents/shared/ui-ux-pro-max/scripts/search.py",
                ]) {
                    assert.ok(await fse.pathExists(path.join(target, rel)), `missing ${rel}`);
                }
                assert.equal(await fse.pathExists(path.join(target, ".cursor", "scripts")), false);
                assert.equal(await fse.pathExists(path.join(target, ".cursor", "shared")), false);

                assert.equal(await fse.pathExists(path.join(target, ".cursor", "commands", "plan.md")), false);
                assert.equal(
                    await fse.pathExists(path.join(target, ".claude", "commands", "ui-ux-pro-max.md")),
                    false,
                );

                const design = await fse.readFile(
                    path.join(target, ".claude", "commands", "design.md"),
                    "utf8",
                );
                assert.match(design, /\$ARGUMENTS/);

                const plan = await fse.readFile(path.join(target, ".claude", "commands", "plan.md"), "utf8");
                assert.match(plan, /\$ARGUMENTS/);

                const mcp = await fse.readJson(path.join(target, ".mcp.json"));
                assert.equal(mcp.mcpServers.context7.envFile, undefined);
                assert.ok(mcp.mcpServers.context7.args.includes("${CONTEXT7_API_KEY}"));

                assert.deepEqual(await danglingSkillRefs(target), []);
                assert.deepEqual(await danglingSkillRefs(target, ".claude/skills"), []);
                assert.equal(await isKitInstalled(target, "claude-code"), true);

                const offensive = profile === "security";
                assert.equal(
                    await fse.pathExists(path.join(target, ".claude", "skills", "red-team-tactics", "SKILL.md")),
                    offensive,
                );

                const lintPaths = runScript(target, "lint_paths.py");
                assert.equal(lintPaths.status, 0, lintPaths.stdout + lintPaths.stderr);
            },
            "claude-code",
        );
    });
}

for (const profile of ["standard", "security"]) {
    test(`smoke: codex ${profile} install projects hybrid paths`, async () => {
        await withInstall(
            profile,
            async (target) => {
                const manifest = await fse.readJson(path.join(target, ".axion", "kit.manifest.json"));
                assert.equal(manifest.tool, "codex");
                assert.equal(manifest.components.agents, 0);
                assert.equal(manifest.components.commands, 0);
                assert.equal(manifest.components.rules, 0);
                assert.ok(manifest.components.skills > 0);

                for (const rel of [
                    "AGENTS.md",
                    ".agents/skills/plan-writing/SKILL.md",
                    ".agents/skills/design/SKILL.md",
                    ".agents/shared/ui-ux-pro-max/scripts/search.py",
                    ".axion/scripts/lint_paths.py",
                    ".agents/schemas/command-contract.schema.json",
                    ".codex/config.toml",
                ]) {
                    assert.ok(await fse.pathExists(path.join(target, rel)), `missing ${rel}`);
                }

                for (const absent of [
                    ".claude/agents",
                    ".claude/commands",
                    ".claude/skills",
                    ".cursor/commands",
                    ".cursor/rules",
                    ".cursor/scripts",
                    ".cursor/shared",
                    "CLAUDE.md",
                ]) {
                    assert.equal(await fse.pathExists(path.join(target, absent)), false, `unexpected ${absent}`);
                }

                const toml = await fse.readFile(path.join(target, ".codex", "config.toml"), "utf8");
                assert.match(toml, /\[mcp_servers\.context7\]/);
                assert.match(toml, /\$\{CONTEXT7_API_KEY\}/);
                assert.equal(toml.includes("envFile"), false);

                assert.equal(await isKitInstalled(target, "codex"), true);

                const offensive = profile === "security";
                assert.equal(
                    await fse.pathExists(path.join(target, ".agents", "skills", "red-team-tactics", "SKILL.md")),
                    offensive,
                );

                const lintPaths = runScript(target, "lint_paths.py");
                assert.equal(lintPaths.status, 0, lintPaths.stdout + lintPaths.stderr);

                if (hasPythonDeps) {
                    const lintContracts = runScript(target, "lint_contracts.py");
                    assert.equal(lintContracts.status, 0, lintContracts.stdout + lintContracts.stderr);
                }
            },
            "codex",
        );
    });
}

test("smoke: installed contracts pass lint_contracts", { skip: !hasPythonDeps }, async () => {
    await withInstall("standard", async (target) => {
        const result = runScript(target, "lint_contracts.py");
        assert.equal(result.status, 0, result.stdout + result.stderr);
    });
});

test("lint_contracts fails on a broken skill frontmatter", { skip: !hasPythonDeps }, async () => {
    await withInstall("minimal", async (target) => {
        await fse.outputFile(
            path.join(target, ".agents", "skills", "broken-skill", "SKILL.md"),
            "---\nname: other-name\ndescription: too short\n---\n# broken\n",
        );

        const result = runScript(target, "lint_contracts.py");

        assert.equal(result.status, 1);
        assert.match(result.stdout, /broken-skill\/SKILL.md: name: 'other-name' must match folder/);
        assert.match(result.stdout, /description: 'too short' is too short/);
    });
});

for (const profile of ["standard", "security"]) {
    test(`smoke: windsurf ${profile} install projects hybrid paths`, async () => {
        await withInstall(
            profile,
            async (target) => {
                const manifest = await fse.readJson(path.join(target, ".axion", "kit.manifest.json"));
                assert.equal(manifest.tool, "windsurf");
                assert.equal(manifest.components.agents, 0);
                assert.equal(manifest.components.commands, 0);
                assert.equal(manifest.components.rules, 0);
                assert.ok(manifest.components.skills > 0);

                for (const rel of [
                    "AGENTS.md",
                    ".agents/skills/plan-writing/SKILL.md",
                    ".agents/skills/design/SKILL.md",
                    ".agents/shared/ui-ux-pro-max/scripts/search.py",
                    ".axion/scripts/lint_paths.py",
                    ".agents/schemas/command-contract.schema.json",
                    ".windsurf/mcp_config.json",
                ]) {
                    assert.ok(await fse.pathExists(path.join(target, rel)), `missing ${rel}`);
                }

                for (const absent of [
                    ".claude/agents",
                    ".claude/commands",
                    ".claude/skills",
                    ".cursor/commands",
                    ".cursor/rules",
                    ".cursor/scripts",
                    ".cursor/shared",
                    "CLAUDE.md",
                    ".devin",
                ]) {
                    assert.equal(await fse.pathExists(path.join(target, absent)), false, `unexpected ${absent}`);
                }

                const mcp = await fse.readJson(path.join(target, ".windsurf", "mcp_config.json"));
                assert.equal(mcp.mcpServers.context7.envFile, undefined);
                assert.ok(mcp.mcpServers.context7.args.includes("${CONTEXT7_API_KEY}"));
                assert.equal(JSON.stringify(mcp).includes("envFile"), false);

                assert.equal(await isKitInstalled(target, "windsurf"), true);

                const drift = await diffKit(packRoot, target, { tool: "windsurf" });
                assert.deepEqual(drift.drifted, []);

                const offensive = profile === "security";
                assert.equal(
                    await fse.pathExists(path.join(target, ".agents", "skills", "red-team-tactics", "SKILL.md")),
                    offensive,
                );

                const lintPaths = runScript(target, "lint_paths.py");
                assert.equal(lintPaths.status, 0, lintPaths.stdout + lintPaths.stderr);

                if (hasPythonDeps) {
                    const lintContracts = runScript(target, "lint_contracts.py");
                    assert.equal(lintContracts.status, 0, lintContracts.stdout + lintContracts.stderr);
                }
            },
            "windsurf",
        );
    });
}

for (const profile of ["standard", "security"]) {
    test(`smoke: antigravity ${profile} install projects native paths`, async () => {
        await withInstall(
            profile,
            async (target) => {
                const manifest = await fse.readJson(path.join(target, ".axion", "kit.manifest.json"));
                assert.equal(manifest.tool, "antigravity");
                assert.equal(manifest.components.agents, 0);
                assert.equal(manifest.components.commands, 13);
                assert.equal(manifest.components.rules, 7);
                assert.ok(manifest.components.skills > 0);

                for (const rel of [
                    "AGENTS.md",
                    "GEMINI.md",
                    ".env.example",
                    ".agents/workflows/discover.md",
                    ".agents/workflows/design.md",
                    ".agents/rules/frontend.md",
                    ".agents/skills/plan-writing/SKILL.md",
                    ".agents/skills/design/SKILL.md",
                    ".agents/shared/ui-ux-pro-max/scripts/search.py",
                    ".axion/scripts/lint_paths.py",
                    ".agents/schemas/command-contract.schema.json",
                    ".agents/mcp_config.json",
                ]) {
                    assert.ok(await fse.pathExists(path.join(target, rel)), `missing ${rel}`);
                }

                const frontend = await fse.readFile(
                    path.join(target, ".agents", "rules", "frontend.md"),
                    "utf8",
                );
                assert.match(frontend, /trigger: glob/);

                for (const absent of [
                    ".claude/agents",
                    ".claude/commands",
                    ".claude/skills",
                    ".cursor/commands",
                    ".cursor/rules",
                    ".cursor/scripts",
                    ".cursor/shared",
                    "CLAUDE.md",
                    ".codex",
                    ".windsurf",
                    ".gemini",
                ]) {
                    assert.equal(await fse.pathExists(path.join(target, absent)), false, `unexpected ${absent}`);
                }

                const mcp = await fse.readJson(path.join(target, ".agents", "mcp_config.json"));
                assert.equal(mcp.mcpServers.context7.envFile, undefined);
                assert.ok(mcp.mcpServers.context7.args.includes("${CONTEXT7_API_KEY}"));
                assert.equal(JSON.stringify(mcp).includes("envFile"), false);

                assert.equal(await isKitInstalled(target, "antigravity"), true);

                const drift = await diffKit(packRoot, target, { tool: "antigravity" });
                assert.deepEqual(drift.drifted, []);

                const offensive = profile === "security";
                assert.equal(
                    await fse.pathExists(path.join(target, ".agents", "skills", "red-team-tactics", "SKILL.md")),
                    offensive,
                );

                const lintPaths = runScript(target, "lint_paths.py");
                assert.equal(lintPaths.status, 0, lintPaths.stdout + lintPaths.stderr);

                if (hasPythonDeps) {
                    const lintContracts = runScript(target, "lint_contracts.py");
                    assert.equal(lintContracts.status, 0, lintContracts.stdout + lintContracts.stderr);
                }
            },
            "antigravity",
        );
    });
}

test("CLI --tool foo exits non-zero and lists allowed tools", () => {
    for (const invalidTool of ["foo", "devin", "openai-codex", "gemini"]) {
        const result = spawnSync(
            process.execPath,
            [cliBin, "init", "--tool", invalidTool, "--dry-run"],
            { encoding: "utf8" },
        );
        assert.notEqual(result.status, 0);
        assert.match(
            `${result.stdout}\n${result.stderr}`,
            /cursor, claude-code, codex, windsurf, antigravity/,
        );
    }
});
