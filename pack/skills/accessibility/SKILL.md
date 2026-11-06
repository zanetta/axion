---
name: accessibility
description: Accessibility principles for web and light mobile. WCAG 2.2 decision trees for keyboard, focus, ARIA, contrast, forms, media, and screen readers — not a single-scanner cookbook.
when_to_use: "When auditing or implementing accessibility (a11y), WCAG, keyboard navigation, focus, ARIA, contrast, forms errors, reduced motion, or light mobile a11y (Dynamic Type, VoiceOver/TalkBack). NOT for legal certification playbooks or deep App Store a11y review."
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Accessibility

> Make UIs **perceivable, operable, understandable, robust** (POUR). Prefer native semantics over ARIA.
> Canonical home for WCAG-oriented guidance in this kit.

## Selective Reading

Read **only** the file you need:

| File | Description | When to Read |
|------|-------------|--------------|
| `scope-and-levels.md` | WCAG 2.2 A/AA scope, what to audit | Starting an audit |
| `keyboard-and-focus.md` | Tab order, focus visible, traps | Keyboard / focus bugs |
| `semantics-and-aria.md` | Headings, landmarks, ARIA sparingly | Structure / screen readers |
| `color-and-contrast.md` | Contrast, non-color cues | Visual design / themes |
| `forms-and-errors.md` | Labels, errors, instructions | Forms and validation UX |
| `media-and-motion.md` | Captions, reduced motion | Video / animation |
| `mobile-a11y.md` | Dynamic Type, SR, touch targets | RN / iOS / Android light |
| `anti-patterns.md` | Common failures to refuse | Review before merge |

## Runtime Script (kit)

Focused checks live under **frontend-design** (not moved):

```bash
python3 pack/skills/frontend-design/scripts/accessibility_checker.py <project_path>
# dogfood install: python3 .agents/skills/frontend-design/scripts/accessibility_checker.py <project_path>
```

Use the script for contrast/ARIA/focus heuristics; this skill owns **decision trees** and remediation priorities. For E2E a11y probes see `webapp-testing` (`--a11y`).

## Related Skills

| Need | Skill |
|------|-------|
| Build UI components | `frontend-design` |
| Post-build UI guidelines audit | `web-design-guidelines` |
| Mobile layout / typography | `mobile-design` |
| Design tokens search | `design-guide` |
| Playwright / a11y flag | `webapp-testing` |

## Decision Checklist

Before shipping UI:

- [ ] Keyboard-only path works for primary flows?
- [ ] Focus visible and not trapped?
- [ ] Name, role, value exposed (prefer native HTML)?
- [ ] Contrast meets AA for text / UI (or documented exception)?
- [ ] Forms: labels + associated errors?
- [ ] Motion respects `prefers-reduced-motion`?
- [ ] Mobile: hit targets and text scaling considered?

## Core Rules

1. **Semantic HTML first** — ARIA is a last resort.
2. **Keyboard parity** — if mouse can, keyboard must.
3. **Visible focus** — never `outline: none` without a replacement.
4. **Don't rely on color alone** — pair with text/icon/pattern.
5. **Tools are examples** — axe / Lighthouse / AccessLint inform; they do not define architecture.
