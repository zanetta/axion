# Observability Anti-Patterns

> Fix these before adding another dashboard.

## Data Safety

| Anti-pattern | Why it hurts | Fix |
|--------------|--------------|-----|
| Tokens/passwords in logs | Credential leak | Redact; never log `Authorization` raw |
| Full PII in spans/logs | Compliance + blast radius | Hash or omit; minimize fields |
| Shipping prod dumps to shared Slack | Exposure | Private channels + retention policy |

## Cardinality & Cost

| Anti-pattern | Why it hurts | Fix |
|--------------|--------------|-----|
| Metric label = user ID / email | Time-series explosion | Labels low-cardinality only |
| 100% trace sample at scale | Bill shock | Tail/head sample; keep errors |
| Debug logging forever in prod | I/O + noise | Level gates + sampling |

## Alert & Process

| Anti-pattern | Why it hurts | Fix |
|--------------|--------------|-----|
| Alert fatigue | Pages ignored | Symptom + SLO burn; kill noisy rules |
| Tool sprawl without questions | Nobody looks | One stack per signal class; delete unused |
| Vendor cookbook as "architecture" | Lock-in / cargo cult | Principles → then vendor features |
| Confusing kit O-01 with app o11y | Wrong layer | Kit run log ≠ consumer instrumentation |

## Design Smells

- Measuring only CPU while users see 5xx
- No correlation IDs across services
- Dashboards without owners or links to runbooks
- "We'll add observability after launch" with no baseline
