# Flag Types

Classify every flag before creating it. Type drives lifetime and ownership.

| Type | Purpose | Typical lifetime | Owner |
|------|---------|------------------|-------|
| **Release** | Hide unfinished work; merge to trunk safely | Days–weeks | Feature team |
| **Experiment** | Compare variants (A/B) | Experiment window | Product / data |
| **Ops / kill switch** | Instantly disable a risky behavior | Long-lived, documented | On-call / SRE |
| **Permission** | Entitlement / plan gate | Long-lived, product-managed | Product + eng |

## Required metadata

For each flag record:

- Type
- Owner (person or team)
- Ticket / ADR link
- Expected removal date (or “permanent ops/permission” + review cadence)

## Decision tree

```
Is this unfinished work on trunk?
├── Yes → Release toggle (short life)
└── No
    ├── Comparing UX/metrics variants? → Experiment
    ├── Need instant off in prod? → Ops / kill switch
    └── Gate by plan/role? → Permission (prefer real authz when possible)
```

## Prefer authz for permissions

Permission toggles are fine for gradual entitlement rollouts. Once stable, move durable rules into `auth-patterns` (RBAC/ABAC) and delete the flag.
