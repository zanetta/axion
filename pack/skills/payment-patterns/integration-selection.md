# Integration Selection

> Default: **Checkout Sessions**. Drop to PaymentIntents only when you must own the full checkout state.

## Decision tree

```
Need a complete checkout (line items, tax, discounts, shipping, subscriptions)?
├── YES → Checkout Sessions API
│         ├── Prefer Stripe-hosted Checkout page (lowest PCI / fastest)
│         ├── Or embedded Checkout if you need on-site UX
│         └── Payment Element + Checkout Sessions when you need advanced UI customization
└── NO — you own every checkout step / custom amount updates yourself
          ├── On-session custom UI → PaymentIntents + Payment Element
          ├── Save a card for later (no charge yet) → SetupIntents
          └── Off-session charge later → SetupIntent (save) then PaymentIntent (confirm off-session)
```

## Checkout Sessions vs PaymentIntents

| Prefer Checkout Sessions when… | Prefer PaymentIntents when… |
| --- | --- |
| You want built-in tax, coupons, shipping, receipts | You build the entire checkout UX/state yourself |
| Subscriptions via Checkout + Billing | You need low-level control over confirmation |
| Hosted or embedded Stripe UI is acceptable | Custom payment methods / exotic flows require PI |

Official comparison: [Checkout Sessions and Payment Intents](https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison).

## UI surfaces

| Surface | Use |
| --- | --- |
| Stripe-hosted Checkout | Default for most SaaS / e-commerce |
| Embedded Checkout | Stay on your domain with Stripe-managed form |
| Payment Element | Advanced customization; prefer with Checkout Sessions when possible |
| Card Element (legacy) | **Refuse** — migrate to Payment Element |

## Dynamic payment methods

Prefer Dashboard dynamic payment methods over hard-coding `payment_method_types` so Stripe can adapt to locale/wallets.

## Out of this tree

- **Connect / platforms** — later slice (non-goal here).
- **Charges / Sources / Tokens APIs** — see `anti-patterns.md`.
