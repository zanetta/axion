# Template & Timeline

Keep sections short. Prefer tables and timestamps over narrative essays.

## Suggested sections

1. **Summary** — what happened, customer impact, duration (2–4 sentences)
2. **Impact** — users/tenants, revenue/SLO, data/security if any
3. **Timeline** — UTC (or stated TZ); detection → mitigation → resolution
4. **Detection** — how we knew (alert, customer, dashboards)
5. **Root / contributing factors** — see `contributing-factors.md`
6. **What went well** — keep morale and reuse good moves
7. **What to improve** — systems, process, tooling
8. **Action items** — see `action-items.md`
9. **Appendix** — links to dashboards, PRs, tickets (no secrets)

## Timeline rules

| Do | Don't |
|----|-------|
| Fact: “12:04 UTC — p95 latency > 2s; alert X fired” | “Alice broke prod” |
| Record decisions and by which role/team | Mix speculation into the timestamp row |
| Note when customer impact started/ended | Paste entire log dumps |

## Minimal timeline row

| Time (UTC) | Event | Source |
|------------|-------|--------|
| HH:MM | What changed or was observed | Alert / deploy / human |
