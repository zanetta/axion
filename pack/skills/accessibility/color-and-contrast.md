# Color and Contrast

> Color can reinforce meaning; it must not be the **only** cue.

## Targets (WCAG 2.2 AA typical)

| Content | Contrast |
|---------|----------|
| Normal text | ≥ 4.5:1 |
| Large text | ≥ 3:1 |
| UI components / graphics | ≥ 3:1 against adjacent colors |

Exact thresholds depend on size/weight — verify with a contrast tool; don't guess.

## Principles

1. **Don't convey state only by color** (error = red + text/icon)
2. Check **dark and light** themes
3. Placeholder text often fails contrast — don't rely on it as the only label
4. Focus indicators need sufficient contrast too

## Decision Tree

```
Design uses color for meaning?
│
├── Add text / icon / pattern → OK
└── Color alone → fail AA intent
```

## Kit Helper

`frontend-design/scripts/accessibility_checker.py` includes contrast heuristics — use as a signal, not sole proof.
