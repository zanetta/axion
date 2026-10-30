import { test } from "node:test";
import assert from "node:assert";
import path from "path";
import fse from "fs-extra";
import os from "os";
import { writeKitManifest, readKitManifest, MANIFEST_FILE } from "../lib/manifest.js";

test("writeKitManifest creates .axion/kit.manifest.json with SemVer", async () => {
    const tmp = await fse.mkdtemp(path.join(os.tmpdir(), "axion-manifest-"));
    try {
        await fse.writeFile(path.join(tmp, "AGENTS.md"), "# test\n");
        await fse.ensureDir(path.join(tmp, ".claude", "agents"));
        await fse.writeFile(path.join(tmp, ".claude", "agents", "a.md"), "x");
        await fse.ensureDir(path.join(tmp, ".agents", "skills", "foo"));
        await fse.writeFile(path.join(tmp, ".agents", "skills", "foo", "SKILL.md"), "x");
        await fse.ensureDir(path.join(tmp, ".cursor", "commands"));
        await fse.writeFile(path.join(tmp, ".cursor", "commands", "plan.md"), "x");
        await fse.ensureDir(path.join(tmp, ".cursor", "rules"));
        await fse.writeFile(path.join(tmp, ".cursor", "rules", "frontend.mdc"), "x");

        const written = await writeKitManifest(tmp, {
            version: "1.0.2",
            packageName: "@zanetta/axion",
            profile: "standard",
            action: "init",
            templateSource: "github:zanetta/axion",
        });

        assert.strictEqual(written.version, "1.0.2");
        assert.strictEqual(written.profile, "standard");
        assert.strictEqual(written.components.agents, 1);
        assert.strictEqual(written.components.skills, 1);
        assert.strictEqual(written.components.commands, 1);
        assert.strictEqual(written.components.rules, 1);
        assert.ok(written.checksums["AGENTS.md"]);

        const read = await readKitManifest(tmp);
        assert.strictEqual(read.version, "1.0.2");
        assert.ok(await fse.pathExists(path.join(tmp, ".axion", MANIFEST_FILE)));
    } finally {
        await fse.remove(tmp);
    }
});
