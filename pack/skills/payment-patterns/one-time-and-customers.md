# One-time Payments & Customers

## One-time flow (happy path)

```
1. Server creates Checkout Session (mode=payment) with line_items / price
2. Redirect or embed Checkout
3. Customer pays on Stripe-managed UI
4. Success URL is UX only — do NOT grant entitlements from the redirect alone
5. Webhook checkout.session.completed (and async success/failure) drives fulfillment
```

## Customer object

- Create/reuse a Stripe `Customer` when you need history, saved methods, or subscriptions.
- Store `stripe_customer_id` on your user row — never store card numbers.
- Map your internal `user_id` in Session `client_reference_id` or metadata for webhook join.

## PaymentMethod lifecycle

```
First payment / save card
├── Checkout or SetupIntent collects PaymentMethod (Stripe.js — never raw PAN on your server)
├── Attach to Customer when saving for reuse
└── Later charge → PaymentIntent with customer + payment_method (off-session rules apply)
```

## Amounts & currency

- Amounts in the smallest currency unit (cents) unless using Checkout `price` / Price objects.
- Prefer Stripe Price / Product for catalog consistency.
- Never trust client-sent amounts for fulfillment — re-read Session / PaymentIntent from Stripe API or webhook payload after verify.

## Idempotency on create

- Use Stripe `Idempotency-Key` on create Session / PaymentIntent when the client may retry.
- Key = stable business id (order id), not a random UUID per click unless you accept duplicates.
