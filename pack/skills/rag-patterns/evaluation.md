# Evaluation

> Ship RAG only with a **measurable** loop. Prompt tweaks without eval are roulette.

## What to Measure

| Layer | Metrics (examples) |
|-------|--------------------|
| **Retrieval** | Recall@k, MRR, nDCG on labeled queries |
| **Answer** | Faithfulness / groundedness; answer relevance |
| **End-to-end** | Human rubrics; task success rate |
| **Ops** | Latency, cost/query, empty-hit rate |

## Minimal Eval Set

1. 20–50 real questions with expected `doc_id`s / answers
2. Hard negatives (lookalike docs)
3. Empty-corpus / out-of-scope questions (must refuse)
4. Regression run on every chunking or model change

## Decision Tree

```
Quality issue?
│
├── Wrong sources in context → fix retrieval/chunking first
├── Right sources, wrong answer → prompt / grounding rules
├── Fluent but uncited → enforce cite-or-refuse
└── Flaky scores → enlarge eval set; freeze random seeds where possible
```

## Principles

1. **Retrieval before generation** when debugging
2. **Version** eval sets with the index
3. **Don't optimize only BLEU/ROUGE** for open-ended RAG
