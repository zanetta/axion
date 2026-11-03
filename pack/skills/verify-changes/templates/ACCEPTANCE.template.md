---
id: AC-{SLUG}
title: "{TITLE}"
status: draft
sdd_state: verify
spec: "SPEC-{SLUG}"
plan: "PLAN-{SLUG}"
created: "{ISO_DATE}"
updated: "{ISO_DATE}"
---

# ACCEPTANCE: {TITLE}

> Linked from PLAN. `/verify` must produce **execution evidence** for each check.

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `{slug}.spec.md` |
| PLAN | `{slug}.plan.md` |

## Criteria

| ID | Given / When / Then (or checklist) | Method | Command / evidence | Pass |
| --- | --- | --- | --- | --- |
| AC-1 | Given {context}, when {action}, then {result} | unit / e2e / manual | `npm test -- {pattern}` | [ ] |
| AC-2 | {criterion} | lint | `python3 .cursor/scripts/checklist.py .` | [ ] |
| AC-3 | {criterion} | runtime | `{curl / UI steps}` | [ ] |

## Suggested verify hooks

```bash
python3 .cursor/scripts/checklist.py .
# python3 .cursor/scripts/verify_all.py . --url http://localhost:3000
```

## Traceability

| ACCEPTANCE ID | PLAN task | SPEC ID |
| --- | --- | --- |
| AC-1 | P1-1 | SPEC-{SLUG}-1 |

## Sign-off

- [ ] All AC-* checked with evidence (not inspection-only)
- [ ] Failures documented or fixed
