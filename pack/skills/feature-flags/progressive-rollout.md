# Progressive Rollout

Use flags to widen exposure while watching errors and business metrics (`observability`).

## Sequence

1. **Internal / dogfood** — staff or allowlisted tenants
2. **Canary cohort** — small % on a stable key (user or tenant id)
3. **Ramp** — increase percentage while SLOs hold
4. **Full on** — then **remove** the flag (see `lifecycle-and-cleanup.md`)

## Percentage rollouts

- Hash a stable key; do not use random per request (session flap).
- Keep a **kill switch** (ops flag or the same flag turned off) to stop exposure in seconds.
- Correlate flag changes with deploy and incident timelines.

## Flags vs deploy strategies

| Concern | Prefer |
|---------|--------|
| Incomplete feature on trunk | Release flag |
| Binary environment cutover | Blue-green (`deployment-procedures`) |
| Traffic shift by instance | Canary deploy |
| Per-user/tenant exposure | Flag percentage / targeting |

Canary **deploy** and canary **flag** are complementary — do not treat them as the same control.

## Watch while ramping

- Error rate / latency for the new path
- Business KPI that the change should affect
- Support volume / kill-switch readiness
