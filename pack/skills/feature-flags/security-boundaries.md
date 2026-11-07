# Security Boundaries

## Server-side vs client-side

| Flag guards… | Where to evaluate |
|--------------|-------------------|
| Authorization, roles, entitlements | **Server only** |
| Pricing, discounts, billing gates | **Server only** |
| Security controls / crypto / secrets | **Server only** |
| UI copy, layout, non-sensitive UX | Client OK (expect users to flip it) |

Client-side flags are visible and modifiable. Never treat them as a security boundary.

## Targeting context

Include the minimum attributes needed:

- Prefer opaque ids (user id, tenant id, plan code)
- Avoid email, phone, free-text PII in flag context payloads
- Do not log full targeting context at info in production

## Audit

- Record who changed a flag, when, from→to, and why (ticket)
- Correlate with deploy and incident timelines (`observability`)
- Prefer provider audit logs over ad-hoc Slack lore

## Secrets

Never embed API keys, tokens, or real customer data in flag names, descriptions, or example payloads in docs/code.
