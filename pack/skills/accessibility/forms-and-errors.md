# Forms and Errors

> Every field needs a **programmatic label**; every error needs association and recovery help.

## Requirements

| Rule | Practice |
|------|----------|
| **Label** | `<label for>` or wrapping; not placeholder-only |
| **Required** | Visible + `required` / `aria-required` as appropriate |
| **Errors** | Text describing the problem; linked via `aria-describedby` / `aria-errormessage` |
| **Timing** | Don't expire sessions without warning + extension |
| **Autocomplete** | Use meaningful `autocomplete` tokens where applicable |

## Decision Tree

```
Form failing a11y?
│
├── No name for input → add label
├── Error only in color/border → add text + associate
├── Submit clears focus → move focus to first error summary
└── Inline validation noisy → announce thoughtfully; don't spam live regions
```

## Principles

1. Group related controls with `<fieldset>` / `<legend>` when helpful
2. Instructions before the field, not only after failure
3. Keep error text specific ("Enter a valid email") not vague ("Invalid")
