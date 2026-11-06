# Error Tracking

> Grouped exceptions answer **what broke** and **since which release**. Complements logs; does not replace SLIs.

## When to Use

- Unhandled exceptions / crash reports (web, API, mobile)
- Release health ("did v1.4.2 increase crash-free sessions?")
- Fingerprinted duplicates so one fix closes N events

## Tool Class (examples)

Sentry, Bugsnag, Rollbar, Cloud provider Error Reporting — same job: capture, group, notify, attach release/environment.

## Decision Tree

```
Need exception grouping + stack + release?
│
├── Yes → error tracking SDK + source maps / debug symbols
├── Only aggregate 5xx rate → metrics/SLI may suffice
└── Need full request body forensics → structured logs (scrubbed), not the error tracker dump
```

## Principles

1. **Attach release** (`release` / git SHA) and `environment`
2. **Scrub PII** before send (headers, cookies, form fields)
3. **Sample** high-volume expected errors (4xx validation) if they drown signal
4. **Link** `trace_id` / `request_id` on events for hop into traces/logs
5. **Own triage** — assign, regress with a test, don't just silence

## Not a Substitute For

| Need | Prefer |
|------|--------|
| Availability SLO | Metrics success rate |
| Latency | Histograms / traces |
| Audit trail | Structured / access logs |
