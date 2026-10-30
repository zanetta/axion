import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { fileURLToPath } from "url";
import { installKit } from "../lib/install.js";
import { isValidProfile, resolveProfileExclusions } from "../lib/profiles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(__dirname, "fixtures", "template");

test("isValidProfile accepts known names", () => {
    assert.equal(isValidProfile("standard"), true);
    assert.equal(isValidProfile("minimal"), true);
    assert.equal(isValidProfile("nope"), false);
});

test("resolveProfileExclusions strips offensive by default", () => {
    const r = resolveProfileExclusions("standard", { enableOffensive: false });
    assert.equal(r.includeOffensive, false);
    assert.ok(r.excludeSkillDirs.includes("red-team-tactics"));
    assert.ok(r.excludeAgentFiles.includes("penetration-tester.md"));
});

test("resolveProfileExclusions keeps offensive for security profile", () => {
    const r = resolveProfileExclusions("security");
    assert.equal(r.includeOffensive, true);
    assert.ok(!r.excludeSkillDirs.includes("red-team-tactics"));
});

test("installKit with standard profile prunes offensive skill/agent", async () => {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "axion-prof-"));
    try {
        const template = path.join(tmp, "template");
        await fse.copy(fixtureRoot, template);
        await fse.ensureDir(path.join(template, ".agents", "skills", "red-team-tactics"));
        await fse.writeFile(
            path.join(template, ".agents", "skills", "red-team-tactics", "SKILL.md"),
            "# red\n",
        );
        await fse.writeFile(
            path.join(template, ".claude", "agents", "penetration-tester.md"),
            "# pentest\n",
        );
        await fse.ensureDir(path.join(template, ".agents", "skills", "clean-code"));
        await fse.writeFile(
            path.join(template, ".agents", "skills", "clean-code", "SKILL.md"),
            "# clean\n",
        );

        const target = path.join(tmp, "project");
        await fse.ensureDir(target);

        await installKit(template, target, {
            force: true,
            profile: "standard",
            enableOffensive: false,
            version: "0.0.0-test",
            packageName: "@zanetta/axion",
        });

        assert.equal(
            await fse.pathExists(path.join(target, ".agents", "skills", "red-team-tactics")),
            false,
        );
        assert.equal(
            await fse.pathExists(path.join(target, ".claude", "agents", "penetration-tester.md")),
            false,
        );
        assert.ok(await fse.pathExists(path.join(target, ".agents", "skills", "test-skill")));
        assert.ok(await fse.pathExists(path.join(target, ".axion", "OFFENSIVE_DISABLED.md")));

        const manifest = await fse.readJson(path.join(target, ".axion", "kit.manifest.json"));
        assert.equal(manifest.profile, "standard");
        assert.equal(manifest.enable_offensive, false);
    } finally {
        await fse.remove(tmp);
    }
});

test("installKit --enable-offensive keeps red-team skill", async () => {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "axion-off-"));
    try {
        const template = path.join(tmp, "template");
        await fse.copy(fixtureRoot, template);
        await fse.ensureDir(path.join(template, ".agents", "skills", "red-team-tactics"));
        await fse.writeFile(
            path.join(template, ".agents", "skills", "red-team-tactics", "SKILL.md"),
            "# red\n",
        );
        await fse.writeFile(
            path.join(template, ".claude", "agents", "penetration-tester.md"),
            "# pentest\n",
        );

        const target = path.join(tmp, "project");
        await installKit(template, target, {
            force: true,
            profile: "standard",
            enableOffensive: true,
            version: "0.0.0-test",
            packageName: "@zanetta/axion",
        });

        assert.ok(
            await fse.pathExists(path.join(target, ".agents", "skills", "red-team-tactics")),
        );
        assert.ok(
            await fse.pathExists(path.join(target, ".claude", "agents", "penetration-tester.md")),
        );
        assert.equal(await fse.pathExists(path.join(target, ".axion", "OFFENSIVE_DISABLED.md")), false);

        const manifest = await fse.readJson(path.join(target, ".axion", "kit.manifest.json"));
        assert.equal(manifest.enable_offensive, true);
    } finally {
        await fse.remove(tmp);
    }
});
