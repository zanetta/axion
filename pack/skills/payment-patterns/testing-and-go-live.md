# Testing & Go-Live

## Test mode

- Use `sk_test_` / `pk_test_` only in non-prod.
- Trigger test cards / payment methods from Stripe docs (never real cards in test).
- Forward webhooks locally with Stripe CLI.

## What to automate

| Check | How |
| --- | --- |
| Session create fails closed without secret | Unit / integration with mocked Stripe |
| Webhook rejects bad signature | Send unsigned / wrong secret → 400 |
| Idempotent handler | Replay same `evt_` → one fulfillment |
| Success URL alone does not grant access | E2E: block webhook → no entitlement |

## Go-live principles

Checklist mindset (adapt to your stack):

- [ ] Live keys only in production secret store
- [ ] Live webhook endpoint registered; secret rotated into prod
- [ ] Idempotent fulfillment verified in staging
- [ ] Customer Portal / cancel path works if you offer self-serve
- [ ] Monitoring/alerts on webhook 4xx/5xx and payment_failed volume (`observability`)
- [ ] Support runbook: refunds, disputes, failed invoices

Official reference: [Go-live checklist](https://docs.stripe.com/get-started/checklist/go-live).
