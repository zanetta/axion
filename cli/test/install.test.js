import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { fileURLToPath } from "url";
import { installKit } from "../lib/install.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(__dirname, "fixtures", "template");

test("installKit merges mcp.json and skips existing rules", async () => {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "ag4c-test-"));

    try {
        await fse.copy(fixtureRoot, tmp);

        const target = path.join(tmp, "project");
        await fse.ensureDir(target);
        await fse.ensureDir(path.join(target, ".cursor", "rules"));
        await fse.writeJson(
            path.join(target, ".cursor", "mcp.json"),
            { mcpServers: { context7: { command: "custom" } } },
            { spaces: 2 },
        );
        await fse.writeFile(
            path.join(target, ".cursor", "rules", "frontend.mdc"),
            "# my custom rule",
        );

        const { actions } = await installKit(fixtureRoot, target, { force: false });
        const merged = actions.find((a) => a.file === ".cursor/mcp.json");
        assert.strictEqual(merged?.action, "merged");

        const mcp = await fse.readJson(path.join(target, ".cursor", "mcp.json"));
        assert.strictEqual(mcp.mcpServers.context7.command, "custom");
        assert.ok(mcp.mcpServers.shadcn);

        const rule = await fse.readFile(
            path.join(target, ".cursor", "rules", "frontend.mdc"),
            "utf8",
        );
        assert.strictEqual(rule, "# my custom rule");

        assert.ok(await fse.pathExists(path.join(target, ".cursor", "commands", "plan.md")));
        assert.ok(await fse.pathExists(path.join(target, "AGENTS.md")));
    } finally {
        await fse.remove(tmp);
    }
});
