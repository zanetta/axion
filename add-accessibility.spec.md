---
id: SPEC-add-accessibility
title: "Adicionar skill accessibility"
status: draft
sdd_state: specify
created: "2026-11-06"
updated: "2026-11-06"
issue: "https://github.com/zanetta/axion/issues/24"
branch: "24-add-accessibility"
---

# SPEC: Adicionar skill accessibility

> SPEC after Socratic Gate. Do not implement until SPEC is accepted.
> Issue: [axion#24](https://github.com/zanetta/axion/issues/24) (épico catálogo) · Branch: `24-add-accessibility`
> Direction: **Option A** (skill only) — P0 do epic

## 1. Problem

Acessibilidade aparece fragmentada no kit (`frontend-design` + `accessibility_checker.py`, `web-design-guidelines`, busca UX em `design-guide`, flag `--a11y` em `webapp-testing`), mas **não há skill de primeira classe** com decision trees WCAG. Pedidos de audit/a11y/keyboard/ARIA não têm canônico — agentes improvisam ou diluem o tema em guidelines genéricas.

## 2. Actors / Users

| Actor | Goals |
| --- | --- |
| Maintainer Axion | Skill `accessibility` no pack; inventário e contratos ok |
| Consumidor do kit | Orientação WCAG 2.2 (web) + mobile leve, sem cookbook de um único scanner |
| `frontend-specialist` | Lista `accessibility`; audita/implementa UI acessível |
| `qa-automation-engineer` | Lista `accessibility`; inclui a11y em estratégia de teste |
| `mobile-developer` | Lista `accessibility`; Dynamic Type / VoiceOver / TalkBack básicos |
| Routing / `/design` `/verify` `/test` | Pedidos a11y/WCAG/ARIA apontam para agents + skill |

## 3. Scope

### In scope

- Nova skill `pack/skills/accessibility/` (`name: accessibility`) com content map / decision trees:
  - scope & WCAG 2.2 levels (A/AA defaults)
  - keyboard & focus
  - semantics / ARIA (use sparingly)
  - color & contrast
  - forms & errors
  - media / motion / reduced-motion
  - light **mobile** a11y (Dynamic Type, screen readers, touch targets)
  - anti-padrões (icon-only without name, trap focus, contrast failures, aria-abuse)
- Frontmatter: adicionar `accessibility` em `frontend-specialist`, `qa-automation-engineer`, `mobile-developer`.
- Ponte leve: `frontend-design`, `web-design-guidelines` (e opcional `design-guide` / `mobile-design`) apontam para a skill.
- Script: **manter** `pack/skills/frontend-design/scripts/accessibility_checker.py`; a skill nova referencia o script (sem mover nesta fatia).
- Docs + inventário: skills **49→50** (agents **21** inalterados); `pack/ARCHITECTURE.md`, `README.md`, `cli/README.md` approx profiles; Quick Reference / Project Type Routing — pode acrescentar skill na coluna WEB/Mobile **sem** mudar agents da linha WEB (E-01).
- Smokes / `lint_contracts` / `lint_inventory` / `generate_inventory.py` / `eval_routing.py`.
- Profile: **não** entra em `MINIMAL_CORE_SKILLS`; chega via deps dos agents (frontend está no minimal → skill pode entrar no minimal por fechamento).

### Non-goals

- Novo agent (ex.: `accessibility-specialist`) — Option C.
- Só expandir `web-design-guidelines` sem skill nova — Option B.
- Colocar `accessibility` em `MINIMAL_CORE_SKILLS`.
- Mover/renomear `accessibility_checker.py` nesta fatia.
- Cookbook de um único vendor (só axe / só Lighthouse / só AccessLint).
- Certificação legal formal (ADA lawsuit playbook); conformidade jurídica fora do kit.
- Deep mobile platform cert (App Store a11y review end-to-end).
- Outras fatias do epic #24 (payments, ADR, LLM eval, etc.).
- Mudar commands=13 ou FSM; npm publish obrigatório.

## 4. Constraints

- Pack canônico; dogfood via symlinks.
- `lint_contracts`: `name` = folder.
- Clean-code: princípios e decision trees; conteúdo da skill em inglês.
- E-01: linha **WEB** em Project Type Routing — **não** trocar o agent `frontend-specialist`; skills da coluna podem incluir `accessibility`.
- Issue 24; branch `24-add-accessibility`.
- Inspiração AAS (`wcag-audit-patterns` / similar) = referência; reescrever no estilo Axion (não dump verbatim se license/formato divergir).

## 5. Interfaces / Contracts

| Interface | Notes |
| --- | --- |
| Skill id | Pasta + `name:` = `accessibility` |
| Agent deps | `frontend-specialist`, `qa-automation-engineer`, `mobile-developer` listam `accessibility` |
| Related | Pointers de/para `frontend-design`, `web-design-guidelines`, `mobile-design`, script `accessibility_checker.py` |
| Inventory | skills=50; array inclui `accessibility` |
| Routing | Keywords a11y / WCAG / ARIA / screen reader → agents existentes + skill |
| Profiles | Via agent deps; medir approx com `resolveProfile` no implement |

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| Duplicar web-design-guidelines | Ponte curta; canônico WCAG na skill nova |
| Scope mobile explodir | “Light mobile” só; deep platform = non-goal |
| Cookbook axe-only | Princípios + tools como exemplos |
| Script path confusion | Explicit: script stays under frontend-design |
| Profile count drift | resolveProfile after wire; update cli/README |

## 7. Socratic Gate evidence

| # | Question | Answer |
| --- | --- | --- |
| 1 | Qual direção? | **Option A**: skill `accessibility` only; sem agent novo. |
| 2 | Wiring? | `frontend-specialist` + `qa-automation-engineer` + `mobile-developer`. |
| 3 | Escopo? | WCAG 2.2 **web** + **mobile leve**. |
| 4 | Script? | Manter `accessibility_checker.py` em `frontend-design`; ponte na skill. |
| 5 | Branch / issue? | Issue [axion#24](https://github.com/zanetta/axion/issues/24); branch `24-add-accessibility` (defaults confirmados). |

## 8. Traceability

| SPEC ID | Related PLAN | Related ACCEPTANCE |
| --- | --- | --- |
| SPEC-add-accessibility-1 | add-accessibility.plan.md P1-1 | AC-1 |
| SPEC-add-accessibility-2 | add-accessibility.plan.md P1-2 | AC-2 |
| SPEC-add-accessibility-3 | add-accessibility.plan.md P1-3 | AC-3 |
| SPEC-add-accessibility-4 | add-accessibility.plan.md P1-4 | AC-4 |
| SPEC-add-accessibility-5 | add-accessibility.plan.md P1-5 | AC-5 |

## 9. Acceptance of SPEC

- [ ] User approved this SPEC
- [ ] Ready for `/plan`
