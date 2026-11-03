import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { installKit, isKitInstalled } from "../lib/install.js";
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
                ".cursor/commands/plan.md",
                ".axion/scripts/lint_paths.py",
                ".agents/schemas/command-contract.schema.json",
                ".agents/skills/plan-writing/templates/PLAN.template.md",
                ".agents/skills/verify-changes/templates/ACCEPTANCE.template.md",
                ".claude/agents/orchestrator.md",
            ]) {
                assert.ok(await fse.pathExists(path.join(target, rel)), `missing ${rel}`);
            }
            assert.equal(await fse.pathExists(path.join(target, ".cursor", "scripts")), false);

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
                    ".claude/commands/plan.md",
                    ".claude/agents/orchestrator.md",
                    ".agents/skills/plan-writing/SKILL.md",
                    ".claude/skills/plan-writing/SKILL.md",
                    ".axion/scripts/lint_paths.py",
                    ".agents/schemas/command-contract.schema.json",
                    ".mcp.json",
                ]) {
                    assert.ok(await fse.pathExists(path.join(target, rel)), `missing ${rel}`);
                }
                assert.equal(await fse.pathExists(path.join(target, ".cursor", "scripts")), false);

                assert.equal(await fse.pathExists(path.join(target, ".cursor", "commands", "plan.md")), false);
                assert.equal(
                    await fse.pathExists(path.join(target, ".claude", "commands", "ui-ux-pro-max.md")),
                    false,
                );

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

test("CLI --tool foo exits non-zero and lists allowed tools", () => {
    const result = spawnSync(process.execPath, [cliBin, "init", "--tool", "foo", "--dry-run"], {
        encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /cursor, claude-code/);
});
