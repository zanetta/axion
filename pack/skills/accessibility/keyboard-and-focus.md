# Keyboard and Focus

> If it works with a mouse only, it is broken for many users.

## Requirements

| Rule | Practice |
|------|----------|
| **Tab order** | Matches visual reading order; no surprises |
| **Focus visible** | Clear indicator on all interactive controls |
| **No trap** | Modals/menus can close and restore focus |
| **Shortcuts** | Don't hijack browser/OS keys without escape |
| **Skip link** | Optional but valuable for long pages |

## Decision Tree

```
Keyboard issue?
│
├── Can't reach control → tabindex / wrong element (prefer <button>/<a>)
├── Focus ring missing → restore outline or custom :focus-visible
├── Focus lost on route/dialog → move focus to heading or first control; restore on close
└── Scrollable region only with wheel → make region focusable + arrow keys if needed
```

## Principles

1. Use native interactive elements
2. `tabindex="0"` sparingly; avoid positive tabindex
3. Manage focus for dialogs, drawers, menus
4. Test with keyboard only before SR deep-dives
