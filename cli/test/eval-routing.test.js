import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runner = path.join(repo, ".cursor/scripts/eval_routing.py");

function run(args) {
    return spawnSync("python3", [runner, ...args], { encoding: "utf8" });
}

test("golden routing cases match AGENTS.md and intelligent-routing", () => {
    const result = run([repo]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /eval_routing: pass 16/);
});

test("a row that lists a banned agent fails, and a broken case file exits 2", async () => {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-route-"));
    try {
        await fse.outputFile(
            path.join(root, "AGENTS.md"),
            "| **MOBILE** | `frontend-specialist` | `mobile-design` |\n",
        );
        await fse.outputFile(
            path.join(root, ".agents/skills/intelligent-routing/SKILL.md"),
            "| **Mobile UI** | touch | `mobile-developer` |\n",
        );
        await fse.outputFile(path.join(root, ".claude/agents/mobile-developer.md"), "# agent\n");
        await fse.outputFile(path.join(root, ".claude/agents/frontend-specialist.md"), "# agent\n");
        await fse.outputFile(path.join(root, ".agents/skills/mobile-design/SKILL.md"), "# skill\n");
        const cases = {
            cases: [
                {
                    id: "mobile-not-frontend",
                    source: "agents",
                    match: "**MOBILE**",
                    agents: ["mobile-developer"],
                    skills: ["mobile-design"],
                    not_agents: ["frontend-specialist"],
                },
            ],
        };
        const casesPath = path.join(root, "cases.json");
        await fse.writeJson(casesPath, cases);
        const banned = run([root, "--cases", casesPath]);
        assert.equal(banned.status, 1);
        assert.match(banned.stdout, /row lists frontend-specialist/);

        await fse.writeFile(casesPath, "{");
        const broken = run([root, "--cases", casesPath]);
        assert.equal(broken.status, 2);
    } finally {
        await fse.remove(root);
    }
});

test("dashed rows, escaped names, and non-JSON constants do not pass", async () => {
    const root = await fse.mkdtemp(path.join(os.tmpdir(), "axion-route-"));
    const casesPath = path.join(root, "cases.json");
    const valid = {
        cases: [
            {
                id: "mobile-not-frontend",
                source: "agents",
                match: "**MOBILE**",
                agents: ["mobile-developer"],
                skills: ["mobile-design"],
            },
        ],
    };
    try {
        await fse.outputFile(path.join(root, ".claude/agents/mobile-developer.md"), "# agent\n");
        await fse.outputFile(path.join(root, ".agents/skills/mobile-design/SKILL.md"), "# skill\n");
        await fse.outputFile(path.join(root, ".agents/skills/intelligent-routing/SKILL.md"), "| x |\n");
        await fse.writeJson(casesPath, valid);

        await fse.outputFile(
            path.join(root, "AGENTS.md"),
            [
                "| **MOBILE** --- real | `mobile-developer` | `mobile-design` |",
                "| **MOBILE** | `mobile-developer` | `mobile-design` |",
                "",
            ].join("\n"),
        );
        const ambiguous = run([root, "--cases", casesPath]);
        assert.equal(ambiguous.status, 1, ambiguous.stdout + ambiguous.stderr);
        assert.match(ambiguous.stdout, /found 2/);

        await fse.outputFile(
            path.join(root, "AGENTS.md"),
            "| **MOBILE** --- real | `mobile-developer` | `mobile-design` |\n",
        );
        const dashed = run([root, "--cases", casesPath]);
        assert.equal(dashed.status, 0, dashed.stdout + dashed.stderr);

        await fse.outputFile(
            path.join(root, "AGENTS.md"),
            "| **MOBILE** | `../../AGENTS` | `mobile-design` |\n",
        );
        await fse.writeJson(casesPath, {
            cases: [
                {
                    id: "escaped-agent",
                    source: "agents",
                    match: "**MOBILE**",
                    agents: ["../../AGENTS"],
                    skills: ["mobile-design"],
                },
            ],
        });
        const escaped = run([root, "--cases", casesPath]);
        assert.equal(escaped.status, 1, escaped.stdout + escaped.stderr);
        assert.match(escaped.stdout, /missing \.claude\/agents\/\.\.\/\.\.\/AGENTS\.md/);

        await fse.outputFile(
            path.join(root, "AGENTS.md"),
            "| **MOBILE** | `mobile-developer` | `..` |\n",
        );
        await fse.outputFile(path.join(root, ".agents/SKILL.md"), "# not a skill\n");
        await fse.writeJson(casesPath, {
            cases: [
                {
                    id: "escaped-skill",
                    source: "agents",
                    match: "**MOBILE**",
                    agents: ["mobile-developer"],
                    skills: [".."],
                },
            ],
        });
        const escapedSkill = run([root, "--cases", casesPath]);
        assert.equal(escapedSkill.status, 1, escapedSkill.stdout + escapedSkill.stderr);
        assert.match(escapedSkill.stdout, /missing skill \.\./);

        await fse.outputFile(
            path.join(root, "AGENTS.md"),
            "| **MOBILE** | `mobile-developer` | `mobile-design` |\n",
        );
        await fse.writeFile(
            casesPath,
            '{"note": NaN, "cases": [{"id": "mobile-not-frontend", "source": "agents", "match": "**MOBILE**", "agents": ["mobile-developer"], "skills": ["mobile-design"]}]}',
        );
        const nan = run([root, "--cases", casesPath]);
        assert.equal(nan.status, 2, nan.stdout + nan.stderr);

        await fse.writeFile(
            casesPath,
            '{"cases": [{"id": "bad id", "id": "mobile-not-frontend", "source": "agents", "match": "**MOBILE**", "agents": ["mobile-developer"], "skills": ["mobile-design"]}]}',
        );
        const duplicate = run([root, "--cases", casesPath]);
        assert.equal(duplicate.status, 2, duplicate.stdout + duplicate.stderr);
    } finally {
        await fse.remove(root);
    }
});
