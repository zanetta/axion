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
