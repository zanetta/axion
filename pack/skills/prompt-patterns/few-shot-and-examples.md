# Few-shot & Examples

## When few-shot helps

- Output format is tricky (labels, JSON shape)
- Domain jargon needs demonstration
- Edge cases need concrete “do this / not that”

## When to skip or cut

| Situation | Prefer |
|-----------|--------|
| Examples contradict System rules | Fix System; drop examples |
| Examples leak PII or secrets | Synthetic placeholders only |
| Task is already clear + schema | Zero-shot |
| Examples dominate context window | 1–3 tight shots |

## Principles

1. Examples must match the **target distribution** (not only happy path).  
2. Include at least one **negative / refuse** example when safety matters.  
3. After changing examples, run `llm-eval` — few-shots regress silently.
