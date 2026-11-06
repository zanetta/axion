# Metrics and SLOs

> Metrics are for **aggregates and trends**. Use them to define SLIs and drive alerts — not to store per-request stories.

## Metric Types

| Type | Use |
|------|-----|
| **Counter** | Events that only increase (requests, errors) |
| **Gauge** | Point-in-time value (queue depth, connections) |
| **Histogram / summary** | Distributions (latency) — prefer histograms for SLOs |

## Golden Signals / RED / USE

| Model | Focus |
|-------|-------|
| **RED** (request) | Rate, Errors, Duration |
| **USE** (resources) | Utilization, Saturation, Errors |
| **Golden** | Latency, Traffic, Errors, Saturation |

Start with RED for HTTP/APIs; add USE for nodes/pools when capacity matters.

## SLI → SLO

| Term | Meaning |
|------|---------|
| **SLI** | Measured indicator (e.g. % of requests < 300ms) |
| **SLO** | Target over a window (e.g. 99.9% over 30d) |
| **Error budget** | 1 − SLO; spend consciously on change velocity |

### Choosing an SLI

```
User-visible failure mode?
│
├── Too slow → latency SLI (histogram bucket or trace-derived)
├── Wrong / 5xx → availability / success-rate SLI
└── Stale data → freshness SLI (job lag, replication delay)
```

## Label / Tag Rules

- Prefer low-cardinality: `route_template`, `method`, `status_class`, `region`
- Avoid: `user_id`, `email`, raw `url`, `request_id` as metric labels
- High-cardinality dimensions belong in **logs/traces**, not metrics

## Principles

1. Measure what users feel, not only CPU
2. One dashboard per service tier beats 50 orphaned charts
3. Histograms enable percentile SLOs; averages hide pain
