---
id: PLAN-sdd-command-rename
title: "Rename dos slash commands 1:1 com a FSM (seis estados)"
status: approved
sdd_state: plan
spec: "SPEC-sdd-command-rename"
acceptance: "sdd-command-rename.acceptance.md"
created: "2026-11-04"
updated: "2026-11-04"
approved: "2026-11-04"
---

# PLAN: Rename dos slash commands 1:1 com a FSM (seis estados)

> Produced by `/plan` + `project-planner`. **No application code** in this step.
> Requires: approved SPEC (or embedded Socratic Gate evidence below).
> Slug: `sdd-command-rename`. Separado da fase Windsurf (`axion-agnostico-fase-4`).
> Direção: seis estados; `/specify` fora de `/discover`; `/implement` une create/enhance; aliases de transição; `/design`.

## Overview

Alinhar slash commands aos estados da FSM sem mudar os nomes dos estados:
1. Criar canônicos `discover`, `specify`, `implement`, `design` em `pack/commands/`.
2. Transformar `brainstorm`, `create`, `enhance`, `coordinate`, `ui-ux-pro-max` em stubs de alias.
3. Atualizar docs, inventário (Workflows = 18) e omit Claude de `design.md`.
4. Testes + lints + eval verdes.

## Project Type

**DOCS/TOOLING** — commands Markdown + docs + adapter Claude omit. Sem Lighthouse/Playwright. `code-review-graph` não instalado; pular o grafo.

## Success Criteria

| # | Critério mensurável |
| --- | --- |
| 1 | Existem os 6 commands canônicos da FSM (`pack/commands/{discover,specify,plan,implement,verify,remember}.md`) com `name:` = filename e `sdd_states` 1:1 (`[discover]`, `[specify]`, `[plan]`, `[implement]`, `[verify]`, `[remember]`), mais o canônico de apoio `pack/commands/design.md` (`name: design`). |
| 2 | `/discover` (`sdd_states: [discover]`) explora opções e perguntas socráticas sem exigir/fechar `{slug}.spec.md`; `/specify` (`sdd_states: [specify]`) exige o gate socrático e escreve `{slug}.spec.md`; `/implement` (`sdd_states: [implement]`) unifica app novo (`create`) e código existente (`enhance`). |
| 3 | Os 5 stubs `brainstorm.md`, `create.md`, `enhance.md`, `coordinate.md`, `ui-ux-pro-max.md` têm `name:` = filename, passam em `lint_contracts.py` e apontam para o canônico (`/discover` + `/specify`, `/implement`, `/orchestrate`, `/design`) sem lógica paralela. |
| 4 | `.axion/inventory.json` + `pack/ARCHITECTURE.md` (Overview `Workflows: 18`, árvore `# 18 slash commands`, Statistics `Workflows: 18`) + `README.md` refletem **18** workflows; `lint_inventory.py` sai 0. |
| 5 | Claude Code: `mapTemplateTargets` retorna `[]` para `pack/commands/design.md` e `pack/commands/ui-ux-pro-max.md` (e equivalentes `.cursor/commands/`); smoke `claude-code` verifica que `design.md` e `ui-ux-pro-max.md` não existem em `.claude/commands/` enquanto `discover.md`, `specify.md` e `implement.md` existem. Codex/Windsurf continuam omitindo `pack/commands/**`. |
| 6 | `cd cli && npm test`, `lint_paths.py`, `lint_contracts.py` (63 arquivos), `eval_routing.py` (default e `--gates`) saem 0. Docs canônicas citam `/discover` → `/specify` → `/plan` → `/implement` → `/verify` → `/remember`. |

## Tech Stack

| Peça | Escolha | Por quê |
| --- | --- | --- |
| Commands | `pack/commands/*.md` (Cursor lê o filename) | Alias = arquivo stub extra |
| Inventário | `python3 .axion/scripts/generate_inventory.py .` | Q-03 conta todos os `.md` |
| Adapter | `cli/lib/adapters/claude-code.js` omit `design.md` | Cursor-only, igual `ui-ux-pro-max` |

## File Structure

```plaintext
pack/commands/discover.md          # novo canônico (exploração)
pack/commands/specify.md           # novo canônico (SPEC)
pack/commands/implement.md         # novo canônico (create + enhance)
pack/commands/design.md            # rename de ui-ux-pro-max (corpo canônico)
pack/commands/brainstorm.md        # stub → /discover então /specify
pack/commands/create.md            # stub → /implement
pack/commands/enhance.md           # stub → /implement
pack/commands/coordinate.md        # stub → /orchestrate
pack/commands/ui-ux-pro-max.md     # stub → /design
pack/commands/plan.md, orchestrate.md, …  # refs internas
cli/lib/adapters/claude-code.js    # omit design.md
.axion/inventory.json              # commands = 18
pack/ARCHITECTURE.md, AGENTS.md, AGENT_FLOW.md, README.md
```

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `sdd-command-rename.spec.md` |
| PLAN (espelho) | `sdd-command-rename-plan.md` |
| ACCEPTANCE | `sdd-command-rename.acceptance.md` |

## Gate checklist (blocking)

- [x] SPEC exists **or** ≥3 Socratic answers recorded below
- [x] User confirmed plan before `/implement`

### Socratic evidence (copied from SPEC)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Seis estados ou specify unificado com discover? | Seis estados; specify fora de discover |
| 2 | Nomes 1:1 com a FSM? | Sim: discover specify plan implement verify remember |
| 3 | create e enhance? | Um command: implement |
| 4 | Aliases dos nomes antigos? | Sim — stubs |
| 5 | coordinate e ui-ux-pro-max neste corte? | Sim — alias orchestrate; rename design |

## Phases

### Phase 0 — Discovery / context

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P0-1 | Listar refs a `/brainstorm` `/create` `/enhance` `/coordinate` `/ui-ux-pro-max` em pack/, AGENTS, AGENT_FLOW, README, cli/, `.axion/scripts/sync_upstream.py` e testes | explorer-agent | — | — | Lista coberta em P1-1..P1-4 |

### Phase 1 — Implementation

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P1-1 | Criar `discover.md` (`sdd_states: [discover]`), `specify.md` (`sdd_states: [specify]`), `implement.md` (`sdd_states: [implement]`), `design.md` (`name: design`, corpo de `ui-ux-pro-max`) e atualizar refs internas de `plan.md` e `orchestrate.md` para `/discover`, `/specify` e `/implement` | documentation-writer | documentation-templates, brainstorming, clean-code | P0-1 | Frontmatter `name` = filename; `sdd_states` da SPEC §5; `/discover` não fecha SPEC; `/specify` escreve SPEC; `/implement` ramifica novo vs existente |
| P1-2 | Converter `brainstorm.md`, `create.md`, `enhance.md`, `coordinate.md`, `ui-ux-pro-max.md` em stubs de alias com frontmatter válido (`name:` = filename) apontando o canônico | documentation-writer | documentation-templates, clean-code | P1-1 | Cada stub tem `name:` = filename, passa em `lint_contracts.py` e aponta o canônico da SPEC §3 sem duplicar instruções |
| P1-3 | Atualizar docs (`AGENTS.md` preservando intacta a tabela `Project Type Routing` usada pelo E-01, `AGENT_FLOW.md`, `README.md` nas 2 contagens + tabelas, `pack/ARCHITECTURE.md` nas 3 contagens `14 → 18` + tabelas, `cli/README.md`, templates SPEC/PLAN, skills `brainstorming`/`app-builder`/`plan-writing`/`coordinator-mode`/`parallel-agents`/`behavioral-modes`, `pack/agents/orchestrator.md`, `.axion/scripts/README.md`) e regenerar `.axion/inventory.json` (18 commands) | documentation-writer | documentation-templates, clean-code | P1-2 | Docs citam a FSM falada `/discover` → `/specify` → `/plan` → `/implement` → `/verify` → `/remember`; `lint_inventory.py` e `eval_routing.py` saem 0 |
| P1-4 | Omitir `pack/commands/design.md` (e `.cursor/commands/design.md`) em `cli/lib/adapters/claude-code.js`; atualizar `cli/test/adapters.test.js` e `cli/test/smoke.test.js` (testar presença de `discover/specify/implement`, presença de `design.md` no Cursor e ausência de `design.md` + `ui-ux-pro-max.md` no Claude); atualizar `CURSOR_COMMANDS` em `.axion/scripts/sync_upstream.py` | backend-specialist | nodejs-best-practices, testing-patterns, clean-code | P1-3 | `cd cli && npm test`, `lint_paths.py`, `lint_contracts.py` (63 arquivos) e `eval_routing.py --gates` saem com exit 0 |

### Phase 2 — Verification (always last)

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| PV-1 | Executar AC-1..AC-5 em `sdd-command-rename.acceptance.md`, `checklist.py`, `verify_gate.py`, `trace_report.py`, `session_manager.py log` | test-engineer | verify-changes, testing-patterns | P1-3, P1-4 | Todos os AC-* `[x]` com evidência; gate e trace exit 0 |

## Critical path

P0-1 → P1-1 → P1-2 → P1-3 → P1-4 → PV-1

## Traceability

| SPEC ID | PLAN task | ACCEPTANCE ID |
| --- | --- | --- |
| SPEC-sdd-command-rename-1 | P1-1 | AC-1 |
| SPEC-sdd-command-rename-2 | P1-2 | AC-2 |
| SPEC-sdd-command-rename-3 | P1-3 | AC-3 |
| SPEC-sdd-command-rename-4 | P1-4 | AC-4 |
| SPEC-sdd-command-rename-5 | PV-1 | AC-5 |

## Write allowlist

| Path | Why |
| --- | --- |
| `pack/commands/**` | Canônicos novos, stubs de alias, refs internas |
| `pack/skills/brainstorming/SKILL.md` | when_to_use aponta `/discover` `/specify` |
| `pack/skills/app-builder/SKILL.md` | when_to_use aponta `/implement` |
| `pack/skills/plan-writing/SKILL.md` | Refs de command |
| `pack/skills/plan-writing/templates/**` | SPEC/PLAN templates |
| `pack/skills/verify-changes/templates/**` | ACCEPTANCE se citar commands |
| `pack/skills/coordinator-mode/SKILL.md` | `/orchestrate` (alias `/coordinate`) |
| `pack/skills/parallel-agents/SKILL.md` | Idem |
| `pack/skills/behavioral-modes/SKILL.md` | Exemplo `/discover` |
| `pack/agents/orchestrator.md` | Gate `/specify` / `/implement` |
| `pack/ARCHITECTURE.md` | Workflows 18 + tabela FSM |
| `.cursor/ARCHITECTURE.md` | Symlink para pack |
| `AGENTS.md` | FSM falada + lista de commands |
| `AGENT_FLOW.md` | Tabela command ↔ estado |
| `README.md` | Fluxos e exemplos |
| `cli/README.md` | `/design` omit Codex/Windsurf |
| `cli/lib/adapters/claude-code.js` | Omit `design.md` |
| `cli/test/adapters.test.js` | Assert omit design |
| `cli/test/smoke.test.js` | Claude smoke sem design |
| `.axion/inventory.json` | Contagem commands 18 |
| `.axion/scripts/README.md` | `/orchestrate` + alias |
| `.axion/scripts/sync_upstream.py` | `CURSOR_COMMANDS` |
| `sdd-command-rename.spec.md` | SPEC |
| `sdd-command-rename.plan.md` | PLAN canônico |
| `sdd-command-rename-plan.md` | Espelho PLAN |
| `sdd-command-rename.acceptance.md` | ACCEPTANCE |

## Out of scope

- Renomear estados da FSM; skill `brainstorming`; pasta `.cursor/shared/ui-ux-pro-max/`
- Fundir discover+specify; remover `/test`
- Copilot/Aider/Gemini; bump npm; fechar #11
- Campo `aliases:` no schema de command

## Rollback

| Falha | Recuperação |
| --- | --- |
| Cursor não acha `/brainstorm` | Stubs de alias no mesmo dir |
| `lint_inventory` Q-03 | Conferir 18 files vs overview |
| Claude instala `/design` | Omit no adapter + teste |

## Phase X: Verification

```bash
python3 .axion/scripts/checklist.py .
python3 .axion/scripts/lint_paths.py .
python3 .axion/scripts/lint_contracts.py .
python3 .axion/scripts/lint_inventory.py .
python3 .axion/scripts/eval_routing.py .
python3 .axion/scripts/eval_routing.py . --gates
python3 .axion/scripts/eval_routing.py . --plan sdd-command-rename.plan.md
python3 .axion/scripts/trace_report.py . sdd-command-rename
cd cli && npm test
test -f pack/commands/discover.md && test -f pack/commands/specify.md && test -f pack/commands/implement.md && test -f pack/commands/design.md
```

- [ ] `checklist.py` exit 0
- [ ] `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py` exit 0
- [ ] `cd cli && npm test` exit 0
- [ ] `verify_gate.py . --acceptance sdd-command-rename.acceptance.md` exit 0
- [ ] `trace_report.py . sdd-command-rename` exit 0
