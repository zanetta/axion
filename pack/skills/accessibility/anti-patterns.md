# Accessibility Anti-Patterns

> Refuse these in review.

## Structure & Interaction

| Anti-pattern | Fix |
|--------------|-----|
| Icon-only control with no name | Visible text or `aria-label` / SR label |
| `div`/`span` click handlers | `<button>` / `<a href>` |
| `outline: none` without `:focus-visible` style | Restore visible focus |
| Focus trap in modal without Escape/restore | Focus management + close |
| Positive `tabindex` soup | Natural order; `0`/`-1` only when needed |

## Perception

| Anti-pattern | Fix |
|--------------|-----|
| Error state by color alone | Text + icon |
| Low-contrast body / UI chrome | Meet AA targets |
| Text baked into images | Real text or adequate alt |
| Auto-playing audio | User gesture / mute / stop |

## ARIA & Content

| Anti-pattern | Fix |
|--------------|-----|
| ARIA on everything | Prefer native; delete redundant ARIA |
| Mismatched `aria-checked` / visual | Sync state |
| Empty links ("click here") | Descriptive name |
| Skipping heading levels randomly | Logical outline |

## Process

| Anti-pattern | Fix |
|--------------|-----|
| "Lighthouse 100 = done" | Journey keyboard + SR smoke + forms |
| One scanner vendor as law | Principles first; tools as evidence |
| A11y only at the end | Bake into design and PR checks |
