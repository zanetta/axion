# Evaluation & OpenFeature

Prefer a **vendor-neutral evaluation API** so providers and tests stay swappable.

## OpenFeature-leaning pattern

| Layer | Role |
|-------|------|
| Application | Calls a stable API (`boolValue`, `stringValue`, …) with flag key + context + **default** |
| SDK / abstraction | OpenFeature client (or thin wrapper with the same shape) |
| Provider | flagd, LaunchDarkly, Unleash, Flagsmith, cloud service, or in-memory for tests |

Providers are examples — pick what fits ops; do not hard-code one vendor’s SDK into every call site.

## Evaluation rules

1. Pass a **safe default** on every call (usually current behavior / `false` for new features).
2. Include only the targeting attributes you need (user id, tenant, plan) — see `security-boundaries.md`.
3. Keep evaluation at a **single decision point** per feature (factory, strategy, or gate function).
4. Cache / local snapshot so brief outages do not flap — see `defaults-and-fallback.md`.

## Testing both paths

| Layer | Approach |
|-------|----------|
| Unit / integration | In-memory provider; force `true` and `false` |
| E2E | Production-like default; optional override for the alternate path |
| Bug reports | Include flag key + evaluated value + default used |

## When not to use flags

Static config that never changes per user → env / config file. One-shot migrations → migration job, not a permanent toggle.
