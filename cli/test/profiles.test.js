import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { fileURLToPath } from "url";
import { installKit, OFFENSIVE_NOTE } from "../lib/install.js";
import {
    isValidProfile,
    parseAgentSkills,
    resolveInstallSettings,
    resolveProfile,
} from "../lib/profiles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(__dirname, "fixtures", "template");

async function withTemplate(fn) {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "axion-prof-"));
    const template = path.join(tmp, "template");
    const target = path.join(tmp, "project");
    try {
        await fse.copy(fixtureRoot, template);
        const write = (rel, body) => fse.outputFile(path.join(template, rel), body);
        await write(".agents/skills/red-team-tactics/SKILL.md", "# red\n");
        await write(".agents/skills/clean-code/SKILL.md", "# clean\n");
        await write(".agents/skills/api-patterns/SKILL.md", "# api\n");
        await write(".agents/skills/game-development/SKILL.md", "# game\n");
        await write(".agents/skills/doc.md", "# skills index\n");
        await write(".claude/agents/penetration-tester.md", "# pentest\n");
        await write(".claude/agents/game-developer.md", "# game\n");
        await write(
            ".claude/agents/backend-specialist.md",
            "---\nname: backend-specialist\nskills: clean-code, api-patterns\n---\n# backend\n",
        );
        await write(".axion/trace/README.md", "# trace\n");
        await write(".axion/inventory.json", "{}\n");
        await write(".axion/kit.manifest.json", "{}\n");
        await fn({ template, target, exists: (rel) => fse.pathExists(path.join(target, rel)) });
    } finally {
        await fse.remove(tmp);
    }
}

const install = (template, target, options) =>
    installKit(template, target, { version: "0.0.0-test", packageName: "@zanetta/axion", ...options });

test("isValidProfile accepts only known names", () => {
    assert.equal(isValidProfile("minimal"), true);
    assert.equal(isValidProfile("nope"), false);
});

test("parseAgentSkills reads the frontmatter skills list", () => {
    const md = "---\nname: x\nskills: clean-code, api-patterns ,  rust-pro\n---\nskills: ignored";
    assert.deepEqual(parseAgentSkills(md), ["clean-code", "api-patterns", "rust-pro"]);
    assert.deepEqual(parseAgentSkills("# no frontmatter"), []);
});

test("parseAgentSkills does not read the next key when skills is empty", () => {
    assert.deepEqual(parseAgentSkills("---\nskills:\ntools: Read\n---\n"), []);
});

test("resolveProfile drops offensive surface unless enabled", () => {
    const standard = resolveProfile("standard");
    assert.equal(standard.keepSkill("red-team-tactics"), false);
    assert.equal(standard.keepAgent("penetration-tester"), false);

    const security = resolveProfile("security");
    assert.equal(security.keepSkill("red-team-tactics"), true);
    assert.equal(security.keepAgent("penetration-tester"), true);
});

test("resolveProfile minimal keeps skills required by kept agents", () => {
    const agentSkills = new Map([
        ["frontend-specialist", ["nextjs-react-expert"]],
        ["game-developer", ["game-development"]],
    ]);
    const plan = resolveProfile("minimal", { agentSkills });

    assert.equal(plan.keepSkill("nextjs-react-expert"), true);
    assert.equal(plan.keepSkill("game-development"), false);
    assert.equal(plan.keepSkill("clean-code"), true);
});

test("resolveProfile mobile keeps an excluded skill still required by a kept agent", () => {
    const agentSkills = new Map([["backend-specialist", ["nextjs-react-expert"]]]);
    assert.equal(resolveProfile("mobile", { agentSkills }).keepSkill("nextjs-react-expert"), true);
});

test("resolveInstallSettings inherits profile and offensive flag from manifest", () => {
    const manifest = { profile: "minimal", enable_offensive: true };
    assert.deepEqual(resolveInstallSettings({}, manifest), {
        profile: "minimal",
        enableOffensive: true,
    });
});

test("resolveInstallSettings resets offensive when --profile is explicit", () => {
    const manifest = { profile: "minimal", enable_offensive: true };
    assert.deepEqual(resolveInstallSettings({ profile: "standard" }, manifest), {
        profile: "standard",
        enableOffensive: false,
    });
    assert.deepEqual(
        resolveInstallSettings({ profile: "standard", enableOffensive: true }, manifest),
        { profile: "standard", enableOffensive: true },
    );
});

test("resolveInstallSettings defaults to standard without manifest", () => {
    assert.deepEqual(resolveInstallSettings({}, null), {
        profile: "standard",
        enableOffensive: false,
    });
});

test("installKit never deletes user skills or agents outside the profile", async () => {
    await withTemplate(async ({ template, target, exists }) => {
        await fse.outputFile(path.join(target, ".agents/skills/my-company-skill/SKILL.md"), "# mine");
        await fse.outputFile(path.join(target, ".claude/agents/my-agent.md"), "# mine");

        await install(template, target, { profile: "minimal" });

        assert.ok(await exists(".agents/skills/my-company-skill/SKILL.md"));
        assert.ok(await exists(".claude/agents/my-agent.md"));
    });
});

test("installKit does not copy components excluded by the profile", async () => {
    await withTemplate(async ({ template, target, exists }) => {
        const { actions } = await install(template, target, { profile: "minimal" });

        assert.equal(await exists(".agents/skills/red-team-tactics"), false);
        assert.equal(await exists(".agents/skills/game-development"), false);
        assert.equal(await exists(".claude/agents/game-developer.md"), false);
        assert.ok(await exists(".agents/skills/api-patterns/SKILL.md"));
        assert.ok(await exists(".claude/agents/backend-specialist.md"));
        assert.ok(await exists(".agents/skills/doc.md"));
        assert.ok(actions.some((a) => a.action === "excluded"));
    });
});

test("installKit reports existing kit components outside the profile and keeps them", async () => {
    await withTemplate(async ({ template, target, exists }) => {
        await install(template, target, { profile: "standard", enableOffensive: true });
        const result = await install(template, target, { profile: "standard" });

        assert.ok(result.outsideProfile.includes(".agents/skills/red-team-tactics"));
        assert.ok(await exists(".agents/skills/red-team-tactics/SKILL.md"));
    });
});

test("installKit writes offensive note and manifest flag", async () => {
    await withTemplate(async ({ template, target, exists }) => {
        await install(template, target, { profile: "standard" });
        assert.ok(await exists(OFFENSIVE_NOTE));
        let manifest = await fse.readJson(path.join(target, ".axion/kit.manifest.json"));
        assert.equal(manifest.enable_offensive, false);

        await install(template, target, { profile: "standard", enableOffensive: true });
        assert.equal(await exists(OFFENSIVE_NOTE), false);
        assert.ok(await exists(".claude/agents/penetration-tester.md"));
        manifest = await fse.readJson(path.join(target, ".axion/kit.manifest.json"));
        assert.equal(manifest.enable_offensive, true);
    });
});

test("installKit copies only trace/README.md from the template .axion/", async () => {
    await withTemplate(async ({ template, target, exists }) => {
        await install(template, target, { profile: "standard" });

        assert.ok(await exists(".axion/trace/README.md"));
        assert.equal(await exists(".axion/inventory.json"), false);
        const manifest = await fse.readJson(path.join(target, ".axion/kit.manifest.json"));
        assert.equal(manifest.version, "0.0.0-test");
    });
});
