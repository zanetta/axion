---
name: payment-patterns
description: Stripe-first payment decision trees. Checkout Sessions vs PaymentIntents, webhooks, light Billing/subscriptions, PCI boundary, and anti-patterns — not a multi-PSP cookbook.
when_to_use: "When implementing or reviewing Stripe checkout, PaymentIntents, SetupIntents, subscriptions/Billing, payment webhooks, or PCI/card-data boundaries. NOT for Stripe Connect/marketplaces, Terminal/in-person, Issuing/Treasury, or full multi-provider (Adyen/PayPal) design."
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Payment Patterns

> Move money safely with **Stripe-first** defaults. Prefer Checkout Sessions; never touch raw card data.
> Identity/session auth lives in `auth-patterns`. This skill owns **payment flows + PCI boundary**.

## Selective Reading

Read **only** the file you need:

| File | Description | When to Read |
|------|-------------|--------------|
| `integration-selection.md` | Checkout Sessions vs PaymentIntents / SetupIntents; Checkout vs Payment Element | Choosing the integration |
| `one-time-and-customers.md` | One-time pay, Customer + PaymentMethod lifecycle | Checkout / save card |
| `webhooks.md` | Signature verify, idempotency, ordering | Fulfillment / sync |
| `subscriptions-billing-light.md` | SaaS-shaped Billing + Checkout | Recurring revenue |
| `secrets-and-pci.md` | Keys, env vars, PCI boundary | Security review |
| `testing-and-go-live.md` | Test mode, CLI forward, go-live | Before production |
| `anti-patterns.md` | Charges, Sources, Card Element, skip verify | Review / before merge |

## Related Skills

| Need | Skill |
|------|-------|
| API shape / errors | `api-patterns` |
| Login / sessions / JWT | `auth-patterns` |
| Threat model / OWASP | `vulnerability-scanner` |
| Webhook ops / alerts | `observability` |
| Node/Python impl | `nodejs-best-practices`, `python-patterns` |

## Decision Checklist

Before shipping payments:

- [ ] Chose Checkout Sessions unless you must own every checkout step?
- [ ] Prefer Stripe-hosted or embedded Checkout / Payment Element (no Card Element)?
- [ ] Webhook signature verified on **raw** body; handlers idempotent?
- [ ] Secret key + webhook secret only in env/secret store?
- [ ] No PAN / raw card / CVC in logs, DB, or analytics?
- [ ] Test mode + go-live checklist reviewed?

## Core Rules

1. **Prefer Checkout Sessions** — taxes, discounts, subscriptions, hosted UI.
2. **PaymentIntents** when you fully own checkout or need off-session charges you model yourself.
3. **SetupIntents** to save a method for later — not Sources/Tokens.
4. **Verify webhooks** — never trust unsigned JSON; fulfill from events, not only client redirects.
5. **No real secrets in examples** — placeholders only (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
