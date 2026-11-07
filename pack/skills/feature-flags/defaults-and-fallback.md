# Defaults & Fallback

Flags must fail **safe**, not fail **open**.

## Defaults

| Scenario | Default guidance |
|----------|------------------|
| New feature release toggle | `false` (old behavior) |
| Kill switch for risky path | `true` = feature on; flipping to `false` disables risk |
| Experiment | Control variant |
| Permission rollout | Deny / old entitlement until explicitly granted |

Document the default next to the flag key. Code must behave correctly when the key is **missing**.

## When the flag service is down

1. Use last-known cached config if the SDK supports it.
2. Else apply the compile-time / config default.
3. Never block the entire request path waiting indefinitely on the flag service.
4. Log/metric a fallback event (bounded cardinality — flag key, not user PII).

## Consistency

- Prefer a **stable targeting key** (user or tenant id) so the same actor does not flip mid-session across nodes.
- Avoid evaluating the same flag with different defaults in different modules.
