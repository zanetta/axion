# Scope and WCAG Levels

> Decide **what** you are claiming before how you test.

## Default Target

| Level | Use when |
|-------|----------|
| **WCAG 2.2 AA** | Default product bar for web |
| **A only** | Explicit temporary baseline (document gaps) |
| **AAA** | Rare; don't claim casually |

## Decision Tree

```
What are you shipping?
│
├── Public marketing / SaaS app UI → WCAG 2.2 AA
├── Internal tool → AA for critical flows; document exceptions
└── Embedded widget → Same as host page; name/role/focus still required
```

## Audit Scope

1. Pick **user journeys** (login, checkout, settings) — not only the homepage
2. Cover **keyboard**, **screen reader smoke**, **contrast**, **forms**
3. Record environment (browser, OS, zoom 200%)
4. Prefer issues that block tasks over cosmetic nitpicks

## Out of This Skill

Legal ADA lawsuit strategy, full AAA conformance claims, deep App Store accessibility review — see SPEC non-goals.
