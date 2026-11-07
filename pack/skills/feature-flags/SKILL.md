---
name: feature-flags
description: Feature flag practice for safe delivery — flag types, OpenFeature-leaning evaluation, progressive rollout, lifecycle/cleanup, and security boundaries. Not vendor cookbooks.
when_to_use: "When introducing, reviewing, or cleaning up feature flags; progressive rollout; kill switches; targeting; stale-flag hygiene. NOT for full A/B analytics platforms, deploying without toggles (deployment-procedures), or app metrics (observability)."
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Feature Flags

> Decouple **deploy** from **release**. Prefer vendor-neutral evaluation (OpenFeature-leaning). Every flag needs an owner and an exit plan.

## Selective Reading

| File | Description | When to Read |
|------|-------------|--------------|
| `flag-types.md` | Release / experiment / ops / permission | Classifying a new flag |
| `evaluation-and-openfeature.md` | Vendor-neutral API, providers, tests | Choosing how to evaluate |
| `defaults-and-fallback.md` | Safe defaults when the service is down | Resilience design |
| `progressive-rollout.md` | Percentage, canary, kill switch | Shipping behind a toggle |
| `lifecycle-and-cleanup.md` | Owners, expiry, remove dead paths | Hygiene / stale flags |
| `security-boundaries.md` | Server-side sensitive flags, targeting PII | Authz / pricing / security |
| `anti-patterns.md` | Nested flags, permanent “temporary” toggles | Before merge |

## Related Skills

| Need | Skill |
|------|-------|
| Deploy / rollback / canary traffic | `deployment-procedures` |
| Correlate flag flips with incidents | `observability` |
| Authz models (permission toggles) | `auth-patterns` |
| Test both code paths | `testing-patterns` |

## Decision Checklist

- [ ] Flag type classified (release / experiment / ops / permission)?
- [ ] Owner + expected removal (or long-lived rationale) recorded?
- [ ] Safe default preserves current behavior when unset / offline?
- [ ] Sensitive controls evaluated server-side only?
- [ ] Single decision point per feature (not scattered `if`s)?
- [ ] Both variants tested; cleanup planned after full rollout?

## Core Rules

1. **Deploy ≠ release** — incomplete work ships behind a release toggle.
2. **Default safe** — usually `false` for new features; behave correctly if the flag service is unavailable.
3. **One evaluation site** — strategy/function near the entry point, not nested conditionals everywhere.
4. **Expire and delete** — remove flag checks and dead code after rollout; archive the flag.
5. **No secrets in client flags** — never guard authz, pricing, or security with client-visible toggles.
