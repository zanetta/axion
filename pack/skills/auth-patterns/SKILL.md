---
name: auth-patterns
description: Authentication and authorization decision-making. Session vs JWT, OAuth/OIDC, API keys, Passkeys, cookies, refresh tokens, and RBAC/ABAC basics.
when_to_use: "When implementing or reviewing login, signup, sessions, JWT, OAuth, API keys, Passkeys, cookies/httpOnly, refresh tokens, or RBAC/ABAC. NOT for UI-only styling, pure network infra, or full enterprise SAML/IdP design."
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Auth Patterns

> Choose and apply auth for **this** app. Think in trade-offs, not vendor cookbooks.
> Canonical home for auth guidance. `api-patterns/auth.md` only points here.

## Selective Reading

Read **only** the file you need:

| File | Description | When to Read |
|------|-------------|--------------|
| `selection.md` | Decision tree: session / JWT / OAuth / API key / Passkey | Choosing a pattern |
| `tokens-and-sessions.md` | Cookies, httpOnly, refresh, JWT claims, expiry | Implementing tokens/sessions |
| `authorization.md` | Authn vs authz, RBAC, light ABAC | Permissions and roles |
| `anti-patterns.md` | Insecure defaults to refuse | Review or before merge |

## Related Skills

| Need | Skill |
|------|-------|
| API shape / OpenAPI | `api-patterns` |
| Payments / Stripe / PCI boundary | `payment-patterns` |
| Threat model / OWASP | `vulnerability-scanner` |
| Node/Python impl details | `nodejs-best-practices`, `python-patterns` |
| Offensive depth (opt-in) | `red-team-tactics` |

## Decision Checklist

Before shipping auth:

- [ ] Asked who the clients are (browser, mobile, M2M, third-party)?
- [ ] Chosen pattern for **this** context (not the default you like most)?
- [ ] Separated authentication from authorization?
- [ ] Planned token/session lifetime and revocation?
- [ ] Secrets only in env/secret store — never in repo or JWT claims?
- [ ] Failure modes: lockout, reset, stolen refresh, clock skew?

## Core Rules

1. **Verify, don't trust** — signatures, audience, issuer, expiry.
2. **Least privilege** — minimal claims and roles.
3. **Transport + storage** — HTTPS; prefer httpOnly Secure cookies for browsers.
4. **Short-lived access, rotatable refresh** — or server-side sessions with idle timeout.
5. **No real secrets in examples** — placeholders only (`YOUR_CLIENT_ID`, env vars).
