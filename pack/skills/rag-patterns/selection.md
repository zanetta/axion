# When to Use RAG

> Start from the **job**: grounded answers over a corpus you control or can index.

## Decision Tree

```
Need answers grounded in specific docs / data?
│
├── Corpus small + fits model context reliably
│   └── Long-context / stuff curated docs (watch cost + attention)
│
├── Need new facts often / large or changing corpus
│   └── RAG (index → retrieve → generate)
│
├── Need style/behavior change, not new facts
│   └── Fine-tune or system prompt — not RAG
│
└── Need multi-step fetch + actions (APIs, DB, browse)
    └── Agentic RAG / tool-calling (see agentic-rag.md)
```

## Compare

| Approach | Strength | Weakness |
|----------|----------|----------|
| **Long-context** | Simple; no index | Cost; lost-in-middle; stale paste |
| **Classic RAG** | Scalable corpus; citeable | Chunking/retrieval quality critical |
| **Fine-tune** | Tone/format | Expensive; stale knowledge |
| **Agentic RAG** | Dynamic tools + retrieval | Loops, cost, safety bounds |

## Minimum Viable RAG

1. Clean ingest + chunking with stable IDs
2. Embeddings + vector store (or hybrid later)
3. Retrieve top-k → prompt with citations → refuse if empty
4. One offline eval set before production prompts
