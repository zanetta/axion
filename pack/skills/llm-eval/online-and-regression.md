# Online Signals & Regression Gates

## Online (light)

| Signal | Why |
|--------|-----|
| Latency / p95 | UX and cost |
| Cost per query | Model / context bloat |
| Empty-hit rate | Retrieval health |
| Explicit user feedback thumbs | Weak but cheap |
| Tool-error rate (agentic) | Loop health |

Online ≠ replace offline golden sets. Use online to **detect**; offline to **localize**.

## Regression gates (`/ax-verify` mindset)

Treat eval like tests:

```
On PR / release that touches prompts, index, or models:
├── Run offline suite (retrieval + faithfulness minimum)
├── Fail build if Recall@k or faithfulness drops beyond threshold
├── Attach report artifact (counts, failed case ids — redacted)
└── Optional: judge sample on open-ended subset
```

Pair with skill `verify-changes`: evidence = command output, not “looks fine”.

## Thresholds

- Start with **no absolute perfection** — freeze a baseline, fail on **relative** regressions.  
- Document thresholds next to the eval set version.
