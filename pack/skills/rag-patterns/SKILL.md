---
name: rag-patterns
description: RAG design principles for consumer apps. Classic retrieve-then-generate and agentic RAG with tool-calling. Chunking, embeddings, retrieval, grounding, evaluation — decision trees, not vendor cookbooks.
when_to_use: "When designing or reviewing RAG, knowledge bases, embeddings, vector search, citations/grounding, retrieval eval, or agentic RAG with tool-calling/MCP tools. NOT for training models, GPU ops, or pure MCP server scaffolding (use mcp-builder)."
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# RAG Patterns

> Ground answers in **retrieved evidence**. Prefer principles over framework cookbooks.
> Covers classic RAG **and** agentic RAG (retrieve / act / tool loops).

## Selective Reading

Read **only** the file you need:

| File | Description | When to Read |
|------|-------------|--------------|
| `selection.md` | RAG vs fine-tune vs long-context | Choosing the approach |
| `chunking.md` | Document prep, chunk size, overlap | Ingest pipeline |
| `embeddings-and-stores.md` | Embedding models + vector stores (pgvector-class) | Index / store choice |
| `retrieval.md` | Top-k, hybrid, rerank | Search quality |
| `grounding-and-citations.md` | Cite sources, refuse without evidence | Trustworthy answers |
| `evaluation.md` | Faithfulness, retrieval metrics | Measuring quality |
| `agentic-rag.md` | Tool-calling loops, planner/retrieve/act, MCP | Agents that fetch then act |
| `anti-patterns.md` | Stuffing, uncited answers, unbounded loops, PII | Review / harden |

## Related Skills

| Need | Skill |
|------|-------|
| Vector / index in Postgres | `database-design` |
| MCP tool/server design | `mcp-builder` |
| API shape around RAG endpoints | `api-patterns` |
| Backend impl languages | `nodejs-best-practices`, `python-patterns` |

## Decision Checklist

Before shipping RAG:

- [ ] Clear question types the system must answer?
- [ ] RAG (or agentic RAG) justified vs long-context / fine-tune?
- [ ] Chunking and metadata match query patterns?
- [ ] Retrieval evaluated (not just “feels good”)?
- [ ] Answers cite or refuse when evidence is weak?
- [ ] Agentic loops bounded (max steps, tool allowlist)?
- [ ] No secrets/PII dumped into the index?

## Core Rules

1. **Evidence first** — generate from retrieved context, not vibes.
2. **Measure retrieval** — bad chunks beat any prompt trick.
3. **Cite or refuse** — ungrounded claims are failures.
4. **Bound agentic loops** — tools are power and cost/risk.
5. **Libraries are examples** — LangChain / LlamaIndex / etc. are optional, not architecture.
