import { test } from "node:test";
import assert from "node:assert";
import { mergeMcpJson } from "../lib/merge.js";

test("mergeMcpJson keeps existing servers on conflict", () => {
    const incoming = {
        mcpServers: {
            context7: { command: "npx", args: ["context7-kit"] },
            playwright: { command: "npx", args: ["playwright"] },
        },
    };
    const existing = {
        mcpServers: {
            context7: { command: "npx", args: ["my-custom-context7"] },
        },
    };

    const merged = mergeMcpJson(existing, incoming);

    assert.deepStrictEqual(merged.mcpServers.context7.args, ["my-custom-context7"]);
    assert.ok(merged.mcpServers.playwright);
});

test("mergeMcpJson adds kit servers when missing locally", () => {
    const incoming = { mcpServers: { shadcn: { command: "npx" } } };
    const existing = { mcpServers: {} };

    const merged = mergeMcpJson(existing, incoming);
    assert.ok(merged.mcpServers.shadcn);
});
