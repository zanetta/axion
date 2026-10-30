import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { installKit } from "../lib/install.js";
import { PROFILE_NAMES, parseAgentSkills } from "../lib/profiles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packRoot = path.resolve(__dirname, "..", "..");

const hasPythonDeps =
    spawnSync("python3", ["-c", "import yaml, jsonschema"], { stdio: "ignore" }).status === 0;

function runScript(projectRoot, script) {
    return spawnSync("python3", [path.join(projectRoot, ".cursor", "scripts", script), projectRoot], {
        encoding: "utf8",
    });
}

async function danglingSkillRefs(projectRoot) {
    const agentsDir = path.join(projectRoot, ".claude", "agents");
    const dangling = [];
    for (const file of await fse.readdir(agentsDir)) {
        const skills = parseAgentSkills(await fse.readFile(path.join(agentsDir, file), "utf8"));
        for (const skill of skills) {
            if (!(await fse.pathExists(path.join(projectRoot, ".agents", "skills", skill)))) {
                dangling.push(`${file}: ${skill}`);
            }
        }
    }
    return dangling;
}

async function withInstall(profile, fn) {
    const target = await fse.mkdtemp(path.join(os.tmpdir(), `axion-smoke-${profile}-`));
    try {
        await installKit(packRoot, target, {
            profile,
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
            assert.ok(manifest.components.agents > 0 && manifest.components.skills > 0);

            for (const rel of [
                "AGENTS.md",
                ".cursor/commands/plan.md",
                ".cursor/scripts/lint_paths.py",
                ".agents/skills/plan-writing/templates/PLAN.template.md",
                ".agents/skills/verify-changes/templates/ACCEPTANCE.template.md",
                ".claude/agents/orchestrator.md",
            ]) {
                assert.ok(await fse.pathExists(path.join(target, rel)), `missing ${rel}`);
            }

            assert.deepEqual(await danglingSkillRefs(target), []);

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
        assert.match(result.stdout, /broken-skill\/SKILL\.md: name: 'other-name' must match folder/);
        assert.match(result.stdout, /description: 'too short' is too short/);
    });
});
