# Agentic RAG

> When the model must **retrieve, call tools, and act** in a loop — not only paste top-k into one prompt.

## When Agentic Beats Classic

| Signal | Prefer |
|--------|--------|
| Single corpus Q&A | Classic RAG |
| Need live APIs, DB queries, or multi-hop fetch | Agentic + tools |
| User asks to “find then update / create ticket” | Agentic with action tools |
| Strict cite-from-KB only | Classic (simpler, safer) |

## Loop Pattern

```
plan → retrieve and/or tool call → observe → (repeat until done or budget) → answer + citations
```

## Tool Design (with mcp-builder)

- **Retrieval as a tool** (`search_kb`) separate from **action tools** (`create_issue`)
- Clear schemas; least privilege; no “run arbitrary SQL” without guards
- MCP servers: design tools in `mcp-builder`; wire RAG policy here

## Safety Bounds (required)

| Bound | Why |
|-------|-----|
| **Max steps** | Stop infinite tool loops |
| **Tool allowlist** | Per-task / per-role |
| **Timeout / budget** | Cost and latency |
| **Cite-or-refuse** | Still required after tools |
| **Human confirm** | Destructive actions |

## Anti-pattern

Unscoped “agent can call anything” with RAG as afterthought → treat tools as a product surface, not a demo.
