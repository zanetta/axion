# Anti-Patterns

| Anti-pattern | Why | Do instead |
|--------------|-----|------------|
| Nested flags (`if A then if B`) | Combinatorial explosion | One decision point; compose strategies |
| Reuse old flag name for new meaning | Wrong cohorts / stale targeting | New key; archive the old flag |
| Permanent “temporary” release toggle | Dead code forever | Expiry + cleanup after 100% |
| Authz / pricing checked only on client | Trivial bypass | Server-side evaluation |
| Scatter `if (flag)` across the codebase | Missed sites on cleanup | Gate/factory at the entry |
| Change prod flags with no audit | Impossible incident forensics | Provider audit + ticket link |
| Unbounded PII in targeting context | Privacy / retention risk | Opaque ids only |
| Skip testing the `false` path | Latent breakages | In-memory provider; both variants |
| Flag service hard dependency, no default | Outage = total failure | Safe default + cache |
| A/B platform as first step for a kill switch | Overkill | Ops toggle with clear owner |

## Review gate

Before merge: type + owner + expiry present; default documented; sensitive paths server-side; both variants tested or explicitly waived; cleanup ticket linked for release toggles.
