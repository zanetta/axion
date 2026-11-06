# Authorization

> Authentication answers **who**. Authorization answers **what they may do**.

## Split the concerns

| Layer | Responsibility |
|-------|----------------|
| Authn | Prove identity (session, token, Passkey) |
| Authz | Enforce permissions on each action/resource |
| Policy | Roles, scopes, or attributes — evaluated server-side |

Never trust client-sent `isAdmin` flags without server checks.

## RBAC (default)

- Roles: coarse (`user`, `admin`, `billing`).
- Map routes/actions → required role or permission.
- Prefer **permissions** on roles rather than hard-coding role names in every handler.
- Deny by default; grant explicitly.

## Light ABAC

Use when the same role needs resource-scoped rules (e.g. `owner_id == user.id`, tenant id). Keep policies data-driven and testable — avoid scattered `if` forests.

## API scopes

For OAuth/M2M, scopes are the authz vocabulary (`read:orders`, `write:orders`). Validate required scopes on every protected route.

## Checklist

- [ ] Authz checked on **server** for every mutating and sensitive read path?
- [ ] Object-level checks (IDOR) — not only “logged in”?
- [ ] Admin paths isolated and audited?
- [ ] Token/session loss → access gone (no orphan grants)?
