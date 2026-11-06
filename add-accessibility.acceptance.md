---
id: AC-add-accessibility
title: "Adicionar skill accessibility"
status: verified
sdd_state: verify
spec: "SPEC-add-accessibility"
plan: "PLAN-add-accessibility"
created: "2026-11-06"
updated: "2026-11-06"
issue: "https://github.com/zanetta/axion/issues/24"
branch: "24-add-accessibility"
---

# ACCEPTANCE: Adicionar skill accessibility

> Linked from PLAN. `/verify` must produce **execution evidence** for each check.
> Direction: Option A (skill only). Pass unchecked until evidence is captured.

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `add-accessibility.spec.md` |
| PLAN | `add-accessibility.plan.md` |
| Trace | `.axion/trace/add-accessibility.json` |

## Criteria

| ID | Given / When / Then (or checklist) | Method | Command / evidence | Pass |
| --- | --- | --- | --- | --- |
| AC-1 | Given o pack, when a skill `accessibility` é adicionada, then existe `pack/skills/accessibility/SKILL.md` com `name: accessibility`; o content map cobre WCAG topics (scope/levels, keyboard/focus, semantics/ARIA, color/contrast, forms/errors, media/motion), light mobile, e anti-patterns; e referencia o path `frontend-design/scripts/accessibility_checker.py` (script **não** movido) | filesystem / grep | `test -f …/SKILL.md` + `rg '^name:\s*accessibility'` → L2; map files: `scope-and-levels.md`, `keyboard-and-focus.md`, `semantics-and-aria.md`, `color-and-contrast.md`, `forms-and-errors.md`, `media-and-motion.md`, `mobile-a11y.md`, `anti-patterns.md`; SKILL L33 refs `pack/skills/frontend-design/scripts/accessibility_checker.py`; `test -f pack/skills/frontend-design/scripts/accessibility_checker.py` OK | [x] |
| AC-2 | Given o wiring Option A, when os agents são atualizados, then `frontend-specialist`, `qa-automation-engineer` e `mobile-developer` listam `accessibility` no frontmatter `skills:`; and `accessibility` **não** está em `MINIMAL_CORE_SKILLS` (`cli/lib/profiles.js`) | grep | 3 hits: `frontend-specialist.md:6`, `qa-automation-engineer.md:6`, `mobile-developer.md:6` include `accessibility`; `rg accessibility cli/lib/profiles.js` → no match (not in MINIMAL_CORE) | [x] |
| AC-3 | Given skills relacionadas, when pointers são adicionados, then `frontend-design` e/ou `web-design-guidelines` apontam para a skill `accessibility` (Related Skills / link); opcional `design-guide` / `mobile-design` | grep | Related Skills: `frontend-design/SKILL.md:403` + `web-design-guidelines/SKILL.md:50` → `[accessibility](../accessibility/SKILL.md)`; Next Step L417 points to skill; script stays under frontend-design | [x] |
| AC-4 | Given docs + inventário, when regenerados/lintados, then `.axion/inventory.json` tem `counts.skills == 50` (agents 21); overview/docs coerentes (49→50); and `lint_paths`, `lint_contracts`, `lint_inventory` exit 0 | inventory / lint | `generate_inventory.py` → skills 50 agents 21; assert OK; `lint_paths` ✅; `lint_contracts` 63 files ✅; `lint_inventory` match ✅ — all exit 0 | [x] |
| AC-5 | Given smokes + E-01, when a suíte roda, then `npm test` (cli) passa; `eval_routing.py .` passa; and a linha **WEB** do Project Type Routing ainda tem agent `frontend-specialist` (skills column **may** include `accessibility`) | test / eval / grep | `cd cli && npm test` → 96 pass / 0 fail; `eval_routing.py .` → pass 18 exit 0; `AGENTS.md:87` WEB → `frontend-specialist` (+ accessibility in skills col); ARCHITECTURE L174/L440 keep frontend-specialist | [x] |

## Suggested verify hooks

```bash
# Inventory + lints (AC-4)
python3 .axion/scripts/generate_inventory.py .
python3 .axion/scripts/lint_paths.py .
python3 .axion/scripts/lint_contracts.py .
python3 .axion/scripts/lint_inventory.py .

# Smokes (AC-5)
cd cli && npm test
cd .. && python3 .axion/scripts/eval_routing.py .

# Gate
python3 .axion/scripts/checklist.py .
python3 .axion/scripts/verify_gate.py . --acceptance add-accessibility.acceptance.md
python3 .axion/scripts/session_manager.py log . --command-name verify --slug add-accessibility --exit $? --artifact add-accessibility.acceptance.md
```

## Traceability

| ACCEPTANCE ID | PLAN task | SPEC ID |
| --- | --- | --- |
| AC-1 | P1-1 | SPEC-add-accessibility-1 |
| AC-2 | P1-2 | SPEC-add-accessibility-2 |
| AC-3 | P1-3 | SPEC-add-accessibility-3 |
| AC-4 | P1-4 | SPEC-add-accessibility-4 |
| AC-5 | P1-5 | SPEC-add-accessibility-5 |

## Sign-off

- [x] All AC-* checked with evidence (not inspection-only)
- [x] Failures documented or fixed
