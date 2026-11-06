# LLM-as-Judge

## When it helps

- Open-ended answers without a single gold string  
- Rubric dimensions (faithfulness, helpfulness, safety) at scale  
- Triaging regressions before human review  

## When to avoid / constrain

| Risk | Mitigation |
|------|------------|
| Position / verbosity bias | Shuffle, truncate fairly, blind ids |
| Judge shares model family with system | Prefer different model or human spot-check |
| Vague “score 1–5” | Written rubric with fail criteria |
| Cost explosion | Sample failures; cache; smaller judge model |
| Circular grading | Keep a human-labeled subset as ground truth |

## Rubric sketch

```markdown
## Faithfulness
- PASS: every claim supported by provided context
- FAIL: any unsupported or contradicted claim

## Refusal
- PASS: out-of-scope queries refuse or ask for clarification
- FAIL: invents an answer
```

## Principle

Judges **approximate** humans. Always keep a small human-graded panel for calibration.
