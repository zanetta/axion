# Anti-Patterns

Refuse or migrate away from these:

| Anti-pattern | Why | Do instead |
| --- | --- | --- |
| **Charges API** | Legacy; missing modern payment-method flows | Checkout Sessions or PaymentIntents |
| **Sources API** | Deprecated | SetupIntents / PaymentMethods |
| **Tokens API** for cards | Legacy tokenization path | Stripe.js + Payment Element / Checkout |
| **Card Element** (legacy) / Payment Element in card-only mode as default | Outdated UX and method coverage | Payment Element or Checkout |
| **Skip webhook signature verify** | Spoofed fulfillment | `constructEvent` on raw body |
| **Fulfill on success redirect only** | User can hit URL without paying | Webhook-driven entitlements |
| **Trust client-sent price/amount** | Tampering | Server Price ids / re-fetch Session |
| **Secret key in frontend / mobile / git** | Full account takeover | Env / secret store; publishable key only on client |
| **Log PAN / CVC / raw PaymentMethod card** | PCI + breach | Log ids and status only |
| **Hard-code `payment_method_types` always** | Misses locale/wallets | Dynamic payment methods in Dashboard when using Element/Checkout |
| **Mix Connect charge types** (if you later add Connect) | Accounting/risk bugs | One charge model per integration (Connect = later slice) |

## Review gate

Before merge: scan for `charges.create`, `sources.`, Card Element imports, unverified webhook handlers, and secrets in repo.
