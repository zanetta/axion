# Webhooks

> Fulfillment source of truth. Client redirects are not enough.

## Always

1. Read the **raw** request body (do not JSON-parse before verify).
2. Verify `Stripe-Signature` with `STRIPE_WEBHOOK_SECRET` (`constructEvent` / equivalent).
3. Return **2xx** quickly after durable accept; heavy work async if needed.
4. Handle **at-least-once** delivery — handlers must be **idempotent**.

## Idempotency pattern

```
On event.id (or type + object.id + relevant status):
├── If already processed → return 200 (no-op)
├── Else apply business transition in a transaction
└── Record event.id as processed
```

## Common events (start here)

| Event | Typical action |
| --- | --- |
| `checkout.session.completed` | Grant one-time purchase / start subscription provisioning |
| `checkout.session.async_payment_succeeded` | Fulfill async methods (bank debits, etc.) |
| `checkout.session.async_payment_failed` | Mark order failed / notify |
| `customer.subscription.updated` | Sync plan/status |
| `customer.subscription.deleted` | Revoke access |
| `invoice.paid` / `invoice.payment_failed` | Extend or restrict SaaS access |

Subscribe only to what you handle; ignore the rest with 200 after verify.

## Ordering & races

- Events can arrive out of order — decide transitions from object status, not event arrival time alone.
- Retrieve the object from the API when the event payload is insufficient.

## Local dev

- Stripe CLI: `stripe listen --forward-to localhost:PORT/webhook`
- Use the CLI webhook signing secret in test env (`whsec_…` placeholder — never commit).
