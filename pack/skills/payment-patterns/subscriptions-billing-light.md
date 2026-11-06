# Subscriptions & Billing (Light)

> SaaS-shaped recurring revenue. Prefer **Checkout + Billing**, not raw PaymentIntent loops.

## Default SaaS path

```
1. Define Product + recurring Price in Stripe (or API)
2. Checkout Session mode=subscription (or Billing Customer Portal for self-serve changes)
3. Webhooks sync subscription status → your entitlements table
4. Gate product features on local status (active / past_due / canceled) — refreshed by webhooks
```

## When this file applies

- Monthly/yearly plans, trials, simple seat tiers.
- Customer self-serve cancel/upgrade via Customer Portal.

## When to stop and escalate

- Usage-based metering, complex proration, multi-entity invoicing → read Stripe Billing docs; keep decision logic here thin.
- **Connect / marketplace splits** → out of scope (epic later).

## Entitlements model (app side)

| Store locally | Source of truth |
| --- | --- |
| `stripe_subscription_id`, status, price/plan id, period end | Stripe + webhooks |
| Feature flags / plan limits | Your DB, updated on subscription events |

Never grant paid features only because Checkout redirected to `/success`.

## Trials & failures

- Trial end → `customer.subscription.trial_will_end` / status change.
- `past_due` / `unpaid` → soft-lock vs hard-lock is a product decision; document it.
- `invoice.payment_failed` → notify user; retry is Stripe’s; sync status via webhooks.
