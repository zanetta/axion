# Retrieval

> Retrieve the **right** chunks before generating. Top-k alone is rarely enough.

## Baseline Flow

```
query → (optional rewrite) → dense search [+ sparse/BM25] → merge → rerank → top-n context
```

## Techniques

| Technique | When |
|-----------|------|
| **Top-k dense** | MVP; semantic similarity |
| **Hybrid** | Names, IDs, exact phrases matter |
| **Rerank** | Precision after a wider candidate set |
| **Query rewrite / HyDE** | Short/ambiguous queries (measure; can hurt) |
| **MMR / diversity** | Reduce near-duplicate chunks |

## Decision Tree

```
Retrieval failures?
│
├── Misses keyword/IDs → add sparse/hybrid
├── Right docs, wrong passages → chunking / rerank
├── Wrong tenant or stale → metadata filters + freshness
└── Empty index / ACL deny → explicit empty path (refuse)
```

## Principles

1. **Tune k with eval** — not vibes
2. **Cap context tokens** — more chunks ≠ better answers
3. **Log retrieval** — query, hit IDs, scores (no PII)
4. **Fail open to refuse** — empty hits → no hallucinated fill
