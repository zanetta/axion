# Tracing (OpenTelemetry)

> Traces answer **where time went** across services. Prefer OpenTelemetry APIs so exporters are swappable.

## When Traces Win

- Multi-hop latency (API → DB → queue → worker)
- "Works in staging, slow in prod" with unknown bottleneck
- Fan-out / parallel calls where logs alone don't show order

## Core Concepts

| Concept | Meaning |
|---------|---------|
| **Trace** | One end-to-end request / job |
| **Span** | Timed unit of work (HTTP handler, DB query, publish) |
| **Context propagation** | W3C `traceparent` (or equivalent) across process boundaries |
| **Sampling** | Keep a fraction of traces to control cost |

## Decision Tree

```
Need causal latency view?
│
├── Single process, simple app
│   └── Structured logs + timers may be enough
│
├── ≥2 services or async jobs
│   └── OTel SDK + auto-instrumentation first
│
└── High QPS
    └── Head-based or tail-based sampling; never 100% forever
```

## Principles

1. **Name spans by operation**, not URL templates with IDs (`GET /orders/{id}`, not raw UUID in span name)
2. **Attributes > span explosion** — put `http.status_code`, `db.system` on spans; don't create a span per log line
3. **Propagate context** into queues and background jobs
4. **Link errors** — record exceptions on the failing span; keep `trace_id` in logs
5. **Sample with intent** — always-on for errors/slow requests if using tail sampling

## Related

- Frontend RUM / CWV: `performance-profiling`
- Host-only metrics: `server-management`
