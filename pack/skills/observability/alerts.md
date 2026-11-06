# Alerts

> Every alert should be **actionable**. If nobody will wake up and do something different, it is not a page.

## Severity

| Level | Response | Example |
|-------|----------|---------|
| **Critical / page** | Immediate | SLO burn, total outage, data loss risk |
| **High / ticket** | Same business day | Elevated error rate with budget still OK |
| **Info** | Review in standup | Deploy marker, capacity forecast |

## Decision Tree

```
Symptom detected
│
├── User-facing + budget burning fast → page (critical)
├── Degraded but recoverable / business hours → ticket
└── Interesting but no action → dashboard / log only (no alert)
```

## Good Alert Properties

1. **Symptom-based** when possible (error rate, latency SLO) — not "CPU > 80%" alone
2. **Runbook linked** — first steps, owners, rollback hint
3. **Deduplicated** — flapping suppressed; related alerts grouped
4. **Tested** — fire in staging; confirm routing and silence windows for deploys
5. **Owned** — explicit team/on-call; no orphan pages

## Anti-patterns

| Bad | Better |
|-----|--------|
| Alert on every warning log | Aggregate + threshold on rate |
| 30 overlapping CPU alerts | One saturation + one latency SLO burn |
| No silence during deploy | Planned maintenance window |
| Page on staging noise | Separate routing by `env` |

## After Deploy

Align with `deployment-procedures`: watch critical SLIs for the first 15+ minutes; keep rollback path ready.
