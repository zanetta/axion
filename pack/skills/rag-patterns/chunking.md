# Chunking and Document Prep

> Retrieval quality starts at ingest. Bad chunks cannot be fixed by a clever prompt.

## Goals

| Goal | Practice |
|------|----------|
| **Semantic units** | Prefer headings/sections over blind fixed windows |
| **Stable IDs** | `doc_id` + `chunk_id` for citations and reindex |
| **Metadata** | source, title, updated_at, ACL/tenant if multi-tenant |
| **Overlap** | Small overlap when splitting mid-section (tune; don't overdo) |

## Decision Tree

```
Document type?
│
├── Markdown / HTML with headings → split on headings; keep breadcrumb path in metadata
├── Code → symbol/function-level chunks; path + language metadata
├── Tables / CSV → row or logical group; keep headers with each chunk
└── Scanned PDF → OCR quality gate first; then page/section chunks
```

## Principles

1. **Chunk for the query** — FAQ vs narrative need different sizes
2. **Preserve context** — section title in the chunk or metadata
3. **Dedupe** — identical boilerplate pollutes retrieval
4. **Version** — reindex when source changes; don't mix stale embeddings silently

## Anti-examples

| Bad | Better |
|-----|--------|
| 2k-token random windows | Structure-aware splits |
| No source URL/path | Always attach citeable locator |
| Mix tenants in one index without ACL | Filter by tenant at query time |
