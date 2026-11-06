# Embeddings and Vector Stores

> Pick an embedding model and a store that match **latency, scale, and ops** — not the hype chart.

## Embedding Principles

1. **Same model for index and query** (or a documented compatible pair)
2. **Dimension and distance metric** fixed per index (cosine / IP / L2 — be consistent)
3. **Re-embed on model change** — never mix incompatible vectors in one collection
4. **Normalize text** the same way at ingest and query (casing, URL stripping, etc.)

## Store Selection

```
Constraints?
│
├── Already on Postgres + modest scale → pgvector (see database-design)
├── Managed / multi-cloud simplicity → hosted vector DB (Pinecone-class, etc.) as example
├── Local / embedded → sqlite-vss / local indexes for prototypes
└── Hybrid keyword + vector at scale → store that supports sparse+dense or BM25 sidecar
```

| Need | Prefer |
|------|--------|
| Transactional + vectors | Postgres + pgvector |
| Pure ANN at huge scale | Dedicated vector service |
| Strong keyword | Hybrid (BM25 + dense) |

Vendors are **examples**, not prescriptions. Schema/index design stays in `database-design`.

## Metadata Filters

Always plan filters: tenant, language, doc type, freshness. Filters beat “smarter” embeddings for wrong-corpus hits.
