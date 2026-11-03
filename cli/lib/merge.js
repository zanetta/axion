/**
 * Deep-merge MCP config: kit servers are added; existing project servers win on key conflict.
 */
export function mergeMcpJson(existing, incoming) {
    const base = incoming && typeof incoming === "object" ? incoming : {};
    const current = existing && typeof existing === "object" ? existing : {};

    return {
        ...base,
        ...current,
        mcpServers: {
            ...(base.mcpServers ?? {}),
            ...(current.mcpServers ?? {}),
        },
    };
}

/**
 * Convert pack/mcp.json into OpenAI Codex `.codex/config.toml` `[mcp_servers.<id>]` blocks.
 * Strips `envFile` and converts `${env:VAR}` to `${VAR}`.
 */
export function serializeCodexMcpToml(mcpJsonText) {
    const data = JSON.parse(mcpJsonText);
    const servers = data?.mcpServers ?? {};
    const blocks = [];

    for (const [serverName, rawConfig] of Object.entries(servers)) {
        if (!rawConfig || typeof rawConfig !== "object") continue;
        const lines = [`[mcp_servers.${serverName}]`];

        if (typeof rawConfig.command === "string") {
            lines.push(`command = ${JSON.stringify(rawConfig.command)}`);
        }
        if (Array.isArray(rawConfig.args)) {
            const args = rawConfig.args.map((arg) =>
                typeof arg === "string" ? arg.replace(/\$\{env:([^}]+)\}/g, "${$1}") : arg,
            );
            lines.push(`args = [${args.map((a) => JSON.stringify(a)).join(", ")}]`);
        }
        if (typeof rawConfig.url === "string") {
            lines.push(`url = ${JSON.stringify(rawConfig.url)}`);
        }
        if (rawConfig.env && typeof rawConfig.env === "object" && !Array.isArray(rawConfig.env)) {
            const envPairs = Object.entries(rawConfig.env).map(
                ([k, v]) => `${k} = ${JSON.stringify(String(v))}`,
            );
            lines.push(`env = { ${envPairs.join(", ")} }`);
        }

        blocks.push(lines.join("\n"));
    }

    return blocks.length > 0 ? `${blocks.join("\n\n")}\n` : "";
}

/**
 * Return the Set of `<id>` strings declared as `[mcp_servers.<id>]` in a TOML document.
 */
export function parseCodexMcpServerNames(tomlText) {
    const text = String(tomlText ?? "");
    const names = new Set();
    const re = /^\s*\[mcp_servers\.([A-Za-z0-9_-]+)\]\s*$/gm;
    for (const match of text.matchAll(re)) {
        names.add(match[1]);
    }
    return names;
}

/**
 * Extract `[mcp_servers.<id>]` blocks from a TOML string as a Map of `<id>` -> block text.
 */
export function extractCodexMcpBlocks(tomlText) {
    const lines = String(tomlText ?? "").split(/\r?\n/);
    const blocks = new Map();
    let currentName = null;
    let currentLines = [];

    const flush = () => {
        if (currentName !== null) {
            blocks.set(currentName, currentLines.join("\n").trim());
        }
        currentName = null;
        currentLines = [];
    };

    for (const line of lines) {
        const mcpHeader = line.match(/^\s*\[mcp_servers\.([A-Za-z0-9_-]+)\]\s*$/);
        if (mcpHeader) {
            flush();
            currentName = mcpHeader[1];
            currentLines = [line.trim()];
            continue;
        }
        if (/^\s*\[[^\]]+\]\s*$/.test(line)) {
            flush();
            continue;
        }
        if (currentName !== null) {
            currentLines.push(line);
        }
    }
    flush();

    return blocks;
}

/**
 * Additive merge for `.codex/config.toml`: preserves all existing content/tables
 * and appends only `[mcp_servers.<id>]` blocks from incomingText that are missing.
 */
export function mergeCodexToml(existingText, incomingText) {
    const existing = String(existingText ?? "");
    const incoming = String(incomingText ?? "");

    if (!existing.trim()) {
        return incoming;
    }

    const existingNames = parseCodexMcpServerNames(existing);
    const incomingBlocks = extractCodexMcpBlocks(incoming);
    const missingBlocks = [];

    for (const [name, block] of incomingBlocks.entries()) {
        if (!existingNames.has(name)) {
            missingBlocks.push(block);
        }
    }

    if (missingBlocks.length === 0) {
        return existing;
    }

    const base = existing.replace(/\s+$/, "");
    return `${base}\n\n${missingBlocks.join("\n\n")}\n`;
}
