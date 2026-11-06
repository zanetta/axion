# What to Measure

## Layers

| Layer | Question | Example signals |
|-------|----------|-----------------|
| **Retrieval** | Did we fetch the right evidence? | Recall@k, MRR, nDCG on labeled `doc_id`s |
| **Answer** | Is the reply grounded and relevant? | Faithfulness / groundedness; answer relevance |
| **End-to-end** | Did the user task succeed? | Human rubrics; task success rate |
| **Ops** | Is it operable? | Latency, cost/query, empty-hit rate, error rate |

## Decision tree

```
What failed in production / demo?
│
├── Wrong or missing sources → measure Retrieval first
├── Right sources, wrong answer → Answer / prompt / grounding
├── Fluent but uncited / invented → Faithfulness + cite-or-refuse
├── Slow / expensive → Ops (cache, top-k, model tier)
└── “Feels worse” with no numbers → build Offline golden set first
```

## Scope this skill

- Classic RAG, agentic RAG, and general LLM apps with measurable contracts.
- Agentic loops: also measure tool-choice correctness and step budgets (pair with `rag-patterns` agentic guidance).
