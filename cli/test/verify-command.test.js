import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import { fileURLToPath } from "url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

test("/verify tells the agent to run checklist.py before the hard gate", async () => {
    const command = await fse.readFile(path.join(repo, ".cursor/commands/verify.md"), "utf8");
    const skill = await fse.readFile(path.join(repo, ".agents/skills/verify-changes/SKILL.md"), "utf8");
    const checklist = "python3 .cursor/scripts/checklist.py .";

    const gate = "python3 .cursor/scripts/verify_gate.py . --acceptance {slug}.acceptance.md";

    for (const [name, text] of [["verify.md", command], ["SKILL.md", skill]]) {
        const checklistAt = text.indexOf(checklist);
        const gateAt = text.indexOf(gate);
        assert.ok(checklistAt >= 0, `${name} is missing the checklist command`);
        assert.ok(gateAt >= 0, `${name} is missing the verify gate command`);
        assert.ok(checklistAt < gateAt, `${name} runs the gate before checklist.py`);
        const gateLine = text.split("\n").find((line) => line.includes(gate));
        assert.ok(gateLine && !gateLine.includes("--skip-checklist"), `${name} skips checklist.py inside the gate`);
    }

    const skillOrder = [
        "### Step 3: Execute Verification",
        "### Step 4: Checklist (blocking)",
        checklist,
        "### Step 5: Hard gate (blocking)",
        gate,
        "### Step 6: Report Evidence",
    ];
    let previous = -1;
    for (const marker of skillOrder) {
        const at = skill.indexOf(marker);
        assert.ok(at > previous, `SKILL.md step out of order: ${marker}`);
        previous = at;
    }
});
