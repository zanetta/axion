---
id: PLAN-add-accessibility
title: "Adicionar skill accessibility"
status: draft
sdd_state: plan
spec: "SPEC-add-accessibility"
acceptance: "add-accessibility.acceptance.md"
created: "2026-11-06"
updated: "2026-11-06"
issue: "https://github.com/zanetta/axion/issues/24"
branch: "24-add-accessibility"
---

# PLAN: Adicionar skill accessibility

> Produced by `/plan` + `project-planner`. **No application code** in this step.
> Requires: approved SPEC (or embedded Socratic Gate evidence below).
> Issue: [axion#24](https://github.com/zanetta/axion/issues/24) (epic P0 slice) · Branch: `24-add-accessibility`
> Direction: **Option A** locked (skill only).

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `add-accessibility.spec.md` |
| ACCEPTANCE | `add-accessibility.acceptance.md` |
| Trace (optional) | `.axion/trace/add-accessibility.json` |

## Overview

| Field | Value |
| --- | --- |
| **What** | Nova skill de primeira classe `accessibility` (WCAG 2.2 web + mobile leve) no pack; wiring em 3 agents; ponte leve a partir de skills relacionadas; inventário 49→50 |
| **Why** | A11y está fragmentada (`frontend-design` + script, `web-design-guidelines`, flags); pedidos WCAG/ARIA/keyboard não têm canônico |
| **Project type** | **KIT** (pack Axion) — não é app WEB/MOBILE/BACKEND do consumidor |
| **Success** | Skill `name: accessibility` com content map; 3 agents listam a skill; **não** em `MINIMAL_CORE_SKILLS`; pointers; inventory skills=50 agents=21; lints + `npm test` + `eval_routing`; linha WEB do Project Type Routing permanece `frontend-specialist` (E-01) |

## Tech stack / conventions

| Choice | Rationale |
| --- | --- |
| Pack canônico `pack/skills/accessibility/` | Dogfood via symlink `.agents/skills` → `pack/skills` |
| Decision trees, inglês | Clean-code / Axion style; não cookbook de um vendor |
| Script permanece em `frontend-design/scripts/accessibility_checker.py` | Fatia P0; skill só referencia o path |
| Profile via agent deps | Não adicionar a `MINIMAL_CORE_SKILLS`; medir `resolveProfile` no implement |

## Proposed file structure (implement)

```text
pack/skills/accessibility/
  SKILL.md                 # name: accessibility + content map + script pointer
  scope-and-levels.md      # WCAG 2.2 A/AA defaults
  keyboard-and-focus.md
  semantics-and-aria.md    # use ARIA sparingly
  color-and-contrast.md
  forms-and-errors.md
  media-and-motion.md      # reduced-motion
  mobile-a11y.md           # Dynamic Type, VO/TalkBack, touch — light only
  anti-patterns.md
```

## Gate checklist (blocking)

- [x] SPEC exists **or** ≥3 Socratic answers recorded below — `add-accessibility.spec.md` present; §7 answers copied below
- [x] User confirmed plan before `/implement`

### Socratic evidence (from SPEC §7)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Qual direção? | **Option A**: skill `accessibility` only; sem agent novo. |
| 2 | Wiring? | `frontend-specialist` + `qa-automation-engineer` + `mobile-developer`. |
| 3 | Escopo? | WCAG 2.2 **web** + **mobile leve**. |
| 4 | Script? | Manter `accessibility_checker.py` em `frontend-design`; ponte na skill. |
| 5 | Branch / issue? | Issue [axion#24](https://github.com/zanetta/axion/issues/24); branch `24-add-accessibility`. |

## Phases

### Phase 0 — Discovery / context

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P0-1 | Confirmar pack paths, contagem atual skills=49/agents=21, path do script, agents a wirear, e que `MINIMAL_CORE_SKILLS` não deve incluir `accessibility` | explorer-agent / project-planner | plan-writing | — | Paths e constraints do SPEC verificados; sem código de skill ainda |

### Phase 1 — Implementation

| ID | Task | Agent | Skills | Deps | INPUT → OUTPUT → VERIFY |
| --- | --- | --- | --- | --- | --- |
| P1-1 | **Skill content map** — criar `pack/skills/accessibility/` (`name: accessibility`) com SKILL.md + decision trees (scope/levels, keyboard/focus, semantics/ARIA, color/contrast, forms/errors, media/motion, light mobile, anti-patterns); referenciar `pack/skills/frontend-design/scripts/accessibility_checker.py` (não mover) | documentation-writer (or frontend-specialist) | clean-code, frontend-design, plan-writing | P0-1 | **I:** SPEC §§3–5 · **O:** pasta + content map · **V:** `name:` = folder; map cobre tópicos SPEC; path do script explícito → **AC-1** |
| P1-2 | **Wire agents** — adicionar `accessibility` ao frontmatter `skills:` de `frontend-specialist`, `qa-automation-engineer`, `mobile-developer`; **não** adicionar a `MINIMAL_CORE_SKILLS` em `cli/lib/profiles.js` | frontend-specialist (+ check mobile/qa frontmatter) | clean-code | P1-1 | **I:** 3 agent files · **O:** `skills:` atualizados · **V:** grep nos 3 agents; `accessibility` ∉ `MINIMAL_CORE_SKILLS` → **AC-2** |
| P1-3 | **Pointers** — ponte leve em `frontend-design` e/ou `web-design-guidelines` (Related Skills → `accessibility`); opcional `design-guide` / `mobile-design` | frontend-specialist / mobile-developer | frontend-design, web-design-guidelines | P1-1 | **I:** skills existentes · **O:** links curtos (canônico WCAG = skill nova) · **V:** pointer visível sem duplicar cookbook → **AC-3** |
| P1-4 | **Docs + inventory + lints** — atualizar counts 49→50 (`pack/ARCHITECTURE.md`, `README.md`, `cli/README.md` approx profiles se necessário, Quick Reference / Project Type Routing: **pode** acrescentar `accessibility` nas colunas de skills WEB/Mobile; **não** trocar agent WEB); `generate_inventory.py`; `lint_paths` / `lint_contracts` / `lint_inventory` | documentation-writer + devops-engineer | documentation-templates, lint-and-validate | P1-1, P1-2, P1-3 | **I:** docs + FS · **O:** inventory skills=50 agents=21 · **V:** lints exit 0 → **AC-4** |
| P1-5 | **Smokes + E-01** — `npm test` (cli); `eval_routing.py`; confirmar linha **WEB** Project Type Routing ainda aponta agent `frontend-specialist`; medir profile approx com `resolveProfile` e ajustar `cli/README.md` se drift | test-engineer | testing-patterns, verify-changes | P1-4 | **I:** suite + AGENTS/ARCHITECTURE routing · **O:** testes verdes; profile docs coerentes · **V:** npm + eval exit 0; WEB agent inalterado → **AC-5** |

### Phase V — Verification (always last)

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| PV-1 | Executar `add-accessibility.acceptance.md` (AC-1..AC-5) com evidência; `verify_gate` / checklist conforme `/verify` | test-engineer | verify-changes, testing-patterns | P1-1..P1-5 | Todos AC-* `[x]` com evidência executável |

## Critical path

```text
P0-1 → P1-1 → P1-2 → P1-3 → P1-4 → P1-5 → PV-1
         └──────────→ (P1-2 ∥ P1-3 após P1-1 OK)
```

P1-2 e P1-3 podem rodar em paralelo após P1-1 (arquivos distintos). P1-4 bloqueia em ambos.

## Traceability

| SPEC ID | PLAN task | ACCEPTANCE ID |
| --- | --- | --- |
| SPEC-add-accessibility-1 | P1-1 | AC-1 |
| SPEC-add-accessibility-2 | P1-2 | AC-2 |
| SPEC-add-accessibility-3 | P1-3 | AC-3 |
| SPEC-add-accessibility-4 | P1-4 | AC-4 |
| SPEC-add-accessibility-5 | P1-5 | AC-5 |

## Write allowlist

Paths the implement phase may create or modify. A write outside this list is refused, including a batch edit. `.env` and any path containing `credentials` stay refused even if listed.

| Path | Why |
| --- | --- |
| `pack/skills/accessibility/` | Nova skill (SKILL.md + content map files) |
| `pack/skills/accessibility/SKILL.md` | Frontmatter `name: accessibility` + map + script ref |
| `pack/skills/accessibility/*.md` | Decision-tree modules listados na estrutura |
| `pack/agents/frontend-specialist.md` | Wire `accessibility` em `skills:` |
| `pack/agents/qa-automation-engineer.md` | Wire `accessibility` em `skills:` |
| `pack/agents/mobile-developer.md` | Wire `accessibility` em `skills:` |
| `pack/skills/frontend-design/SKILL.md` | Pointer Related Skills (script path unchanged) |
| `pack/skills/web-design-guidelines/SKILL.md` | Pointer Related Skills |
| `pack/skills/design-guide/SKILL.md` | Pointer opcional |
| `pack/skills/mobile-design/SKILL.md` | Pointer opcional |
| `pack/ARCHITECTURE.md` | Skills 49→50; lista skill; routing skills column (E-01: agent WEB intacto) |
| `README.md` | Contagem skills / árvore |
| `cli/README.md` | Approx profile counts após `resolveProfile` |
| `AGENTS.md` | Project Type Routing skills column (+ Quick Reference se necessário); agent WEB = `frontend-specialist` |
| `.axion/inventory.json` | Regenerar via `generate_inventory.py` (skills=50) |
| `.agents/memory/tech-decisions.md` | Decisão Option A / inventory (se `/remember`) |
| `.agents/memory/MEMORY.md` | Nota de projeto (se `/remember`) |
| `add-accessibility.plan.md` | Atualizar status / checkboxes no fluxo SDD |
| `add-accessibility.acceptance.md` | Evidência AC no `/verify` |
| `.axion/trace/add-accessibility.json` | Traceability machine-readable |

**Explicitly refused (even if tempting):**

| Path | Why refused |
| --- | --- |
| `pack/skills/frontend-design/scripts/accessibility_checker.py` | Não mover/renomear nesta fatia |
| `cli/lib/profiles.js` (`MINIMAL_CORE_SKILLS`) | Não adicionar `accessibility` ao core |
| Novo `pack/agents/*accessibility*` | Option C out of scope |
| Commands / FSM (`pack/commands`, counts=13) | Non-goal |

## Out of scope

- Novo agent (ex.: `accessibility-specialist`) — Option C
- Só expandir `web-design-guidelines` sem skill nova — Option B
- Colocar `accessibility` em `MINIMAL_CORE_SKILLS`
- Mover/renomear `accessibility_checker.py`
- Cookbook de um único vendor (só axe / só Lighthouse / só AccessLint)
- Certificação legal formal (ADA lawsuit playbook)
- Deep mobile platform cert (App Store a11y review E2E)
- Outras fatias do epic #24 (payments, ADR, LLM eval, …)
- Mudar commands=13, agents=21, ou FSM; npm publish obrigatório
- Trocar o agent da linha **WEB** no Project Type Routing (E-01)

## Risks (carry from SPEC)

| Risk | Plan mitigation |
| --- | --- |
| Duplicar web-design-guidelines | Pointers curtos; conteúdo WCAG só na skill nova |
| Scope mobile explodir | Um arquivo `mobile-a11y.md` “light only” |
| Cookbook axe-only | Princípios + tools como exemplos no anti-patterns / checklist |
| Script path confusion | SKILL.md cita path sob `frontend-design/scripts/` |
| Profile count drift | P1-5: `resolveProfile` + update `cli/README.md` |

## Phase X reminder (post-implement)

Não marcar completo até AC-* com evidência e, no `/verify`:

```bash
python3 .axion/scripts/checklist.py .
python3 .axion/scripts/verify_gate.py . --acceptance add-accessibility.acceptance.md
python3 .axion/scripts/session_manager.py log . --command-name verify --slug add-accessibility --exit <exit> --artifact add-accessibility.acceptance.md
```
