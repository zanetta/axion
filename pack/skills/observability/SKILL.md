---
name: observability
description: Observability principles for consumer apps. Structured logs, OpenTelemetry/traces, metrics and SLIs, alerts, error tracking. Teaches signal selection, not vendor cookbooks.
when_to_use: "When instrumenting apps, choosing logs vs metrics vs traces, defining SLIs/alerts, integrating error tracking (Sentry-class), or debugging with production signals. NOT for Axion kit run-log telemetry (O-01)."
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Observability

> Instrument so you can **see**, **diagnose**, and **act** — without drowning in noise.
> **Learn to THINK about signals, not memorize a vendor UI.**

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

---

## 📑 Content Map

| File | Description | When to Read |
|------|-------------|--------------|
| `selection.md` | What to measure; logs vs metrics vs traces | Choosing the signal stack |
| `structured-logging.md` | Levels, JSON fields, correlation IDs | App logging design |
| `tracing.md` | OpenTelemetry, spans, propagation | Request path / latency debug |
| `metrics-and-slos.md` | Counters/histograms, SLIs, SLOs | Capacity and reliability goals |
| `alerts.md` | Severity, actionable alerts, runbooks | Alert design after deploy |
| `error-tracking.md` | Sentry-class grouping, release health | Unhandled errors / crash reports |
| `anti-patterns.md` | PII in logs, cardinality bombs, alert fatigue | Review / harden existing setup |

---

## 🔗 Related Skills

| Need | Skill |
|------|-------|
| Host/process monitoring, PM2 | `@[skills/server-management]` |
| Deploy + post-deploy watch | `@[skills/deployment-procedures]` |
| Root-cause process | `@[skills/systematic-debugging]` |
| Frontend/perf RUM & CWV | `@[skills/performance-profiling]` |

---

## ✅ Decision Checklist

Before adding observability:

- [ ] **Clear question?** (What decision will this signal support?)
- [ ] **Right signal?** (log / metric / trace / error event — not all four by default)
- [ ] **PII/secrets scrubbed?**
- [ ] **Cardinality bounded?** (no unbounded user IDs as metric labels)
- [ ] **Alert actionable?** (who pages, what to do)
- [ ] **Not kit O-01?** (this skill is for **consumer apps**, not `.axion/logs/runs.jsonl`)

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Log everything at debug in prod | Sample; raise level; use traces for detail |
| Alert on every 5xx spike without baseline | SLO + burn rate or relative thresholds |
| Metric label = request ID / email | High-cardinality → drop or use logs/traces |
| Only vendor dashboards, no principles | Start from questions → signals → tools |
