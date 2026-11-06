# Tokens and Sessions

> Principles only — adapt to the stack (Express, Next.js, FastAPI, etc.).

## Sessions (server-side)

- Store session id in an **httpOnly**, **Secure**, **SameSite** cookie.
- Server holds user id + roles; revoke by deleting the session record.
- Idle timeout + absolute max lifetime.
- Rotate session id on login and privilege change.

## JWT access tokens

```
Always:
├── Verify signature with the right key/alg (reject "none")
├── Check exp, nbf, iss, aud
├── Keep claims minimal (sub, roles/scopes — no passwords/PII dumps)
├── Short TTL (minutes), not days
└── Prefer opaque refresh or server session for revocation
```

Never put API secrets or passwords in the JWT payload.

## Refresh tokens

- Long-lived, **rotating**, stored hashed server-side when possible.
- Bind to client/family id; reuse of an old refresh → revoke family.
- Send to browser only via httpOnly cookie or secure native storage — not `localStorage` for high-risk apps.

## Cookies (browser)

| Flag | Why |
|------|-----|
| `HttpOnly` | Block JS exfiltration |
| `Secure` | HTTPS only |
| `SameSite=Lax` or `Strict` | CSRF reduction (Strict may break OAuth return) |
| Short path / dedicated cookie name | Limit blast radius |

CSRF: for cookie sessions, use SameSite and/or anti-CSRF tokens on state-changing requests.

## Placeholders

Use env names in docs and code samples, never real values:

- `AUTH_SECRET`, `JWT_PRIVATE_KEY`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`
