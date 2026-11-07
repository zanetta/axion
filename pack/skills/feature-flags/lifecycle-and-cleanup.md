# Lifecycle & Cleanup

A flag that survives its purpose becomes permanent debt.

## Lifecycle

```
Propose → Create (type, owner, expiry) → Roll out → Stabilize → Remove code path → Archive flag
```

| Stage | Exit criterion |
|-------|----------------|
| Create | Metadata complete (type, owner, ticket, expiry) |
| Roll out | Metrics OK at target % |
| Stabilize | 100% on intended variant for agreed soak time |
| Remove | Flag checks + dead branch deleted in code |
| Archive | Flag retired in the management system |

## Stale-flag hygiene

Treat as stale when:

- Past expected removal date, or
- Unchanged longer than the type’s normal lifetime (release ≫ weeks), or
- Always `true`/`false` for everyone with no experiment running

Actions: ticket to delete, CI warning / inventory report, or alert on age.

## Removal checklist

- [ ] Delete evaluation call sites and unused branches
- [ ] Remove tests that only existed for the discarded variant (keep coverage for remaining behavior)
- [ ] Archive/disable the flag in the provider UI/API
- [ ] Note removal in changelog / ticket

## Long-lived exceptions

Ops kill switches and mature permission toggles may stay — document review cadence (e.g. quarterly) so they do not become forgotten release toggles.
