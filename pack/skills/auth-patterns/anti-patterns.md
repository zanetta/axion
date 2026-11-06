# Auth Anti-Patterns

## Refuse

| Anti-pattern | Why it fails |
|--------------|--------------|
| JWT in `localStorage` for high-value sessions | XSS steals long-lived access |
| `alg: none` or skipping signature verify | Trivial forgery |
| Secrets or passwords inside JWT claims | Readable / leakable |
| Multi-day access tokens without revoke path | Stolen token lives forever |
| Trusting `role` from request body | Privilege escalation |
| Same cookie without `Secure`/`HttpOnly` on HTTPS apps | Theft and XSS |
| Logging tokens, passwords, or Authorization headers | Credential leak in logs |
| Copy-paste Auth0/Cognito tutorials as the only design | Wrong fit; no threat model |
| Disabling CSRF “temporarily” on cookie sessions | Account takeover |

## Prefer

- Short-lived access + rotating refresh or server sessions
- httpOnly Secure cookies for browsers when possible
- Server-side authz on every sensitive operation
- Explicit deny-by-default permissions
- Placeholder secrets only in docs and fixtures

## Pair with

- `vulnerability-scanner` for OWASP-style review
- `security-auditor` agent for design review
- Never invent crypto — use platform libraries
