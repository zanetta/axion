# Retrieval & Faithfulness

## Retrieval first

```
Quality issue?
│
├── Wrong sources in context → fix retrieval/chunking first
├── Right sources, wrong answer → prompt / grounding rules
├── Fluent but uncited → enforce cite-or-refuse
└── Flaky scores → enlarge eval set; freeze seeds where possible
```

## Retrieval metrics (examples, not mandates)

| Metric family | Use when |
|---------------|----------|
| Recall@k / Hit@k | Labeled relevant docs exist |
| MRR / nDCG | Rank order matters |
| Empty-hit rate | Index coverage / threshold tuning |

Principles beat library defaults — pick metrics your labels support.

## Faithfulness / groundedness

- Score whether claims are supported by **retrieved** context (not world knowledge).
- Pair with **cite-or-refuse**: uncited claims fail even if fluent.
- Don’t optimize only BLEU/ROUGE for open-ended RAG.

## Debugging order

1. Inspect top-k for failing queries  
2. Fix chunking / metadata / hybrid / rerank  
3. Only then change generation prompts  
