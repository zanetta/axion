# Secrets & PCI Boundary

## Env vars (placeholders only)

| Variable | Role |
| --- | --- |
| `STRIPE_SECRET_KEY` | Server SDK (`sk_test_…` / `sk_live_…`) |
| `STRIPE_PUBLISHABLE_KEY` | Client Stripe.js (`pk_test_…` / `pk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Endpoint signing secret (`whsec_…`) |

Never commit real keys. Do not put secret keys in frontend bundles, mobile apps, or git.

## PCI boundary

```
Your servers
├── MAY: create Sessions / PaymentIntents, verify webhooks, store customer/subscription ids
└── MUST NOT: accept raw PAN, CVC, or full track data unless you are PCI certified for that SAQ

Browser / app
└── Card data only via Stripe.js / Checkout / Payment Element — never post PAN to your API
```

Prefer Stripe-hosted or embedded Checkout to minimize PCI scope.

## Logging & analytics

- Redact: secret keys, webhook secrets, Authorization headers, full PaymentMethod payloads with card numbers.
- Safe to log: Stripe object ids (`cus_`, `pi_`, `cs_`, `sub_`, `evt_`), amounts, currency, status.

## Key rotation

- Rotate compromised keys in Dashboard; update secret store; redeploy.
- Separate test and live keys; never mix live webhook secret with test endpoint.
