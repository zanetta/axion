# Auth Pattern Selection

> Pick by client type and trust boundary — not by hype.

## Decision Tree

```
Who calls the API?
│
├── Browser (same-site web app)
│   └── Prefer session cookie (httpOnly, Secure, SameSite)
│       or BFF + short-lived access token
│
├── SPA / mobile talking to your API
│   └── Authorization Code + PKCE (OAuth/OIDC) or
│       httpOnly cookie via BFF (avoid long-lived tokens in JS)
│
├── Server-to-server (M2M)
│   └── API keys (scoped) or client credentials (OAuth)
│
├── Third-party login ("Sign in with X")
│   └── OAuth 2.0 / OIDC — do not invent crypto
│
└── Passwordless modern UX
    └── Passkeys (WebAuthn) as primary or step-up
```

## Pattern Cheat Sheet

| Pattern | Best For | Avoid When |
|---------|----------|------------|
| **Session cookie** | Traditional web, SSR, simple apps | Pure public API with no browser |
| **JWT (access)** | Stateless APIs, microservices | Storing secrets in payload; long TTL |
| **OAuth 2.0 / OIDC** | Delegated identity, social login | First-party password form would suffice |
| **API Keys** | M2M, public API quotas | End-user login |
| **Passkey** | Phishing-resistant passwordless | Legacy-only clients with no WebAuthn |

## Questions to Ask the User

1. Browser, mobile, SPA, or machine client?
2. First-party credentials or social/enterprise IdP?
3. Need revoke-on-logout everywhere (server session) or accept short JWT TTL?
4. Multi-tenant roles / orgs?
