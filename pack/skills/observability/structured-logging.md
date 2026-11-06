# Structured Logging

> Prefer **JSON events** over free-form strings. Always include correlation.

## Levels

| Level | Use |
|-------|-----|
| **error** | Failures needing attention (include error code/class) |
| **warn** | Degraded / retryable / unexpected but handled |
| **info** | Business-significant milestones (order placed, deploy started) |
| **debug** | Local/dev or sampled diagnostics — off or sampled in prod |

## Required Fields (baseline)

| Field | Purpose |
|-------|---------|
| `timestamp` | ISO-8601 UTC |
| `level` | Severity |
| `message` | Short human summary |
| `service` | Service / app name |
| `env` | production / staging / … |
| `request_id` / `trace_id` | Correlation across hops |

Add domain fields only when they answer a question (`order_id`, `route`, `status_code`).

## Principles

1. **Structure first** — parsers beat regex on prose
2. **One event = one fact** — don't dump multi-line stack traces as the only message; attach `error.stack` as a field
3. **No secrets / PII** — tokens, passwords, full cards, raw emails/phones unless policy allows and fields are redacted
4. **Bound volume** — sample high-chatter paths; rotate and ship off-box
5. **Correlate** — propagate `trace_id` / `request_id` from edge to workers

## Anti-examples

| Bad | Better |
|-----|--------|
| `console.log(user)` | Log `user_id` + outcome fields only |
| String-concat SQL | Structured `query_name` + duration + row_count |
| Debug on in prod forever | Sample or feature-flag debug |
