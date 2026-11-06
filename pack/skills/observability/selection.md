# Signal Selection

> Start from the **question**, then pick the signal. Tools come last.

## Decision Tree

```
What are you trying to answer?
│
├── Did this request fail / who was affected?
│   └── Error tracking (+ structured logs with request_id)
│
├── Where did latency go across services?
│   └── Distributed traces (OpenTelemetry)
│
├── Is the service healthy vs SLO over time?
│   └── Metrics + SLIs (rate, errors, duration, saturation)
│
├── What exactly happened for one incident?
│   └── Structured logs (correlated by trace_id / request_id)
│
└── Is the host/process up?
    └── Infrastructure checks (see server-management) — not a substitute for app signals
```

## The Three Pillars (plus errors)

| Signal | Strength | Weakness |
|--------|----------|----------|
| **Logs** | High detail, forensic | Costly at volume; hard to aggregate |
| **Metrics** | Cheap aggregates, alerting | Low context; label cardinality risk |
| **Traces** | Causal path across hops | Sampling required; setup cost |
| **Error events** | Grouped exceptions + release | Not a substitute for SLIs |

## Minimum Viable Stack

| Stage | Prefer |
|-------|--------|
| Solo / early | Structured logs + error tracking + basic uptime |
| Growing API | + RED/USE metrics + one dashboard |
| Multi-service | + OTel traces with sane sampling |
| Reliability focus | + SLOs and burn-rate alerts |

## Vendor Examples (not prescriptions)

Grafana/Prometheus, Datadog, New Relic, CloudWatch, Honeycomb, Sentry — pick for fit (budget, stack, team), not brand.
