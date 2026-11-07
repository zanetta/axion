# Triggers & When to Write

Write a postmortem when learning value exceeds the cost of the writeup.

## Typical triggers

| Trigger | Examples |
|---------|----------|
| High severity | SEV1 / SEV2 (or your org’s top two tiers) |
| Customer impact | Outage or major degradation beyond agreed SLO burn |
| Data / security | Loss, corruption, unauthorized access |
| Near-miss | Could have been severe; luck or fast luck-based save |
| Novel failure | New mode, surprising interaction, first occurrence |
| Unusual intervention | Manual heroics, rare runbook, emergency flag flip |

## When **not** to force a full postmortem

- Trivial self-healed blip already covered by an existing ticket and no new learning
- Still actively firefighting — finish mitigation; take notes for later
- Pure feature request dressed as an “incident”

## Timing (guideline)

```
Day 0     Incident + mitigation
Day 1–2   Draft timeline + impact
Day 3–5   Review meeting (blameless)
Day 5–7   Finalize + create action tickets
Week 2+   Complete actions; spot-check recurrence signals
```

Adapt to your severity policy; SEV1 may require a faster first draft.
