# Semantics and ARIA

> Native HTML communicates name, role, and state. ARIA patches gaps — it does not replace structure.

## Prefer Native

| Need | Prefer |
|------|--------|
| Button | `<button>` |
| Link (navigation) | `<a href>` |
| Landmark | `<main>`, `<nav>`, `<header>`, `<footer>` |
| Heading hierarchy | `h1`–`h6` in order |
| List | `<ul>` / `<ol>` |
| Table data | `<table>` with headers |

## ARIA Rules of Thumb

1. **No ARIA is better than bad ARIA**
2. Don't change native role without understanding implications
3. Every interactive control needs an **accessible name**
4. Keep `aria-*` in sync with visual state
5. Live regions only when updates matter (`aria-live`)

## Decision Tree

```
Need custom widget?
│
├── Exists as native HTML? → use native
├── Pattern in APG with care → follow roles + keyboard map
└── Unsure → simplify UI instead of inventing roles
```

## Anti-example

`div` + `onClick` + no role/name/keyboard → use `<button>`.
