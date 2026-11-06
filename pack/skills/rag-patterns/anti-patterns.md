# RAG Anti-Patterns

> Fix these before adding another embedding model.

## Index and Data

| Anti-pattern | Fix |
|--------------|-----|
| Secrets/PII in the index | Scrub at ingest; ACL; retention |
| One giant blob per doc | Structure-aware chunking |
| Never reindex after edits | Versioned ingest pipeline |
| Mix embedding models in one collection | Separate indexes; migrate cleanly |

## Retrieval and Answers

| Anti-pattern | Fix |
|--------------|-----|
| Prompt stuffing the whole corpus | Retrieve; cap tokens |
| Answer with zero hits | Refuse / ask clarifying question |
| Citations that don't match hits | Enforce ID mapping |
| “Feels good” only | Offline eval set |

## Agentic

| Anti-pattern | Fix |
|--------------|-----|
| Unbounded tool loops | Max steps + timeout |
| Tools without allowlist | Role-scoped tools |
| Silent side effects | Confirm destructive actions |
| Ignoring MCP/tool design | Use `mcp-builder` for server/tool shape |

## Process

| Anti-pattern | Fix |
|--------------|-----|
| Vendor cookbook as architecture | Principles → then library |
| RAG for tone/style problems | Prompt or fine-tune instead |
| Skipping empty-query tests | Eval out-of-scope questions |
