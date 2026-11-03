import { test } from "node:test";
import assert from "node:assert";
import { mergeCodexToml, mergeMcpJson, serializeCodexMcpToml } from "../lib/merge.js";

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

test("mergeCodexToml keeps existing servers and user config while appending missing kit servers", () => {
    const incoming = serializeCodexMcpToml(
        JSON.stringify({
            mcpServers: {
                context7: {
                    command: "npx",
                    args: ["--api-key", "${env:CONTEXT7_API_KEY}"],
                    envFile: "${workspaceFolder}/.env",
                },
                shadcn: {
                    command: "npx",
                    args: ["shadcn@latest", "mcp"],
                },
            },
        }),
    );

    const existing = [
        'model = "o3"',
        "",
        "[mcp_servers.context7]",
        'command = "custom-context7"',
        'args = ["--local"]',
        "",
    ].join("\n");

    const merged = mergeCodexToml(existing, incoming);

    assert.match(merged, /model = "o3"/);
    assert.match(merged, /command = "custom-context7"/);
    assert.equal(merged.includes("${CONTEXT7_API_KEY}"), false);
    assert.match(merged, /\[mcp_servers\.shadcn\]/);
    assert.match(merged, /args = \["shadcn@latest", "mcp"\]/);
    assert.equal(mergeCodexToml("", incoming), incoming);
});
