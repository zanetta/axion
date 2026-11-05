---
id: SPEC-sdd-command-rename
title: "Rename dos slash commands 1:1 com a FSM (seis estados)"
status: approved
sdd_state: specify
created: "2026-11-04"
updated: "2026-11-04"
approved: "2026-11-04"
---

# SPEC: Rename dos slash commands 1:1 com a FSM (seis estados)

> Fill after Socratic Gate (`/discover` → `/specify`). Do not implement until SPEC is accepted.

Os nomes dos **estados** da FSM não mudam: `discover → specify → plan → implement → verify → remember`. Mudam os **slash commands** para repetir esses nomes. `specify` é um comando próprio, fora de `discover`.

## 1. Problem

A FSM já tem seis estados, mas os commands não batem:

| Estado | Command hoje | Problema |
| --- | --- | --- |
| `discover` + `specify` | `/brainstorm` | Um verbo de método cobre dois estados; o SPEC nasce misturado com a exploração. |
| `plan` | `/plan` | Ok. |
| `implement` | `/create` \| `/enhance` | Dois verbos para o mesmo estado (app novo vs código existente). |
| `verify` | `/verify` | Ok. |
| `remember` | `/remember` | Ok. |

Fora da linha: `/coordinate` compete com `/orchestrate`; `/ui-ux-pro-max` é nome de produto, não de fluxo.

Quem usa o kit precisa traduzir estado → comando. Esta fatia alinha os nomes e parte `discover` de `specify`.

## 2. Actors / Users

| Actor | Goals |
| --- | --- |
| Usuário do kit | Dizer `/discover` … `/remember` na mesma ordem da FSM, sem adivinhar `/brainstorm` vs `/create`. |
| Maintainer | Um arquivo canônico por command; aliases de transição; `lint_inventory` / contratos / eval verdes. |
| Adapter Cursor / Claude Code | Cursor projeta todos os commands; Claude Code continua omitindo o command de design (hoje `ui-ux-pro-max`). Codex/Windsurf continuam sem `pack/commands/`. |

## 3. Scope

### In scope

- Commands canônicos da FSM (um arquivo em `pack/commands/<name>.md`, `name:` = filename):

| Estado | Command | Origem |
| --- | --- | --- |
| `discover` | `/discover` | Parte exploração de `/brainstorm`. Perguntas, direção, **sem** fechar `{slug}.spec.md`. |
| `specify` | `/specify` | Parte SPEC de `/brainstorm`. Escreve `{slug}.spec.md`. Gate socrático (≥3 respostas) mora aqui. |
| `plan` | `/plan` | Sem rename. Textos passam a apontar `/specify` (não `/brainstorm`) e `/implement` (não `/create`/`/enhance`). |
| `implement` | `/implement` | Une `/create` e `/enhance`. App novo vs código existente é argumento/contexto, não command distinto. Gate = o de `/create` para mudança não trivial. |
| `verify` | `/verify` | Sem rename de arquivo. |
| `remember` | `/remember` | Sem rename de arquivo. |

- Apoio neste corte:

| Hoje | Novo | Ação |
| --- | --- | --- |
| `/orchestrate` | `/orchestrate` | Canônico. |
| `/coordinate` | alias → `/orchestrate` | Stub de transição. |
| `/ui-ux-pro-max` | `/design` | Rename. Cursor-only; Claude Code omite `pack/commands/design.md` (mesmo omit de `ui-ux-pro-max.md`). |
| `/debug` `/deploy` `/preview` `/status` `/test` | iguais | Só atualizar menções ao fluxo. |

- Aliases de transição (stubs em `pack/commands/` que declaram `name:` igual ao filename do alias, passam em `command-contract.schema.json` e mandam seguir o canônico sem duplicar workflow): `/brainstorm` → `/discover` então `/specify`; `/create` e `/enhance` → `/implement`; `/coordinate` → `/orchestrate`; `/ui-ux-pro-max` → `/design`.
- Docs: `AGENTS.md`, `AGENT_FLOW.md`, `README.md`, `pack/ARCHITECTURE.md` (e o symlink `.cursor/ARCHITECTURE.md`), `cli/README.md`, templates SPEC/PLAN, skills (`brainstorming`, `app-builder`, `plan-writing`, `coordinator-mode`, `parallel-agents`, `behavioral-modes`), agents (`orchestrator`), `.axion/scripts/README.md`.
- Inventário / contratos / testes: regenerar `.axion/inventory.json` (18 commands); atualizar as **3** ocorrências da contagem de commands em `pack/ARCHITECTURE.md` (tabela Overview `Workflows: 18`, árvore `# 18 slash commands`, tabela Statistics `Workflows: 18`) e as **2** ocorrências em `README.md`; atualizar `CURSOR_COMMANDS` em `.axion/scripts/sync_upstream.py`; em `cli/lib/adapters/claude-code.js` e testes (`adapters.test.js`, `smoke.test.js`), omitir `design.md` além de `ui-ux-pro-max.md`. (`command-contract.schema.json` já possui todos os 6 estados em `sdd_states` e `.axion/eval/routing.cases.json` não cita slash commands.)
- Socratic Gate passa a ser exigido antes de `/plan`, `/implement` e `/orchestrate` (substitui `/create`).
- `session_manager.py log --command-name` já valida tokens via regex `^[a-z0-9-]{1,40}$` (aceita `discover`, `specify`, `implement`, `design`, `orchestrate` sem alterar `session_manager.py`); aliases orientam logar o nome canônico.

### Non-goals

- Mudar os **nomes dos estados** da FSM.
- Renomear a skill `brainstorming` ou a pasta `.cursor/shared/ui-ux-pro-max/` (só o slash command vira `/design`).
- Fundir `/discover` e `/specify` de volta num command.
- Remover `/test` (suíte ≠ gate `/verify`).
- Adapter `devin`, Copilot, Aider, Gemini CLI.
- Bump/publish npm; fechar issue #11 (é da fase Windsurf).
- Traduzir slash commands para português.

## 4. Constraints

- **Cursor:** o slash é o filename (`pack/commands/specify.md` → `/specify`). Alias = arquivo stub extra, não um campo `aliases:` no schema (o contrato atual não tem esse campo; esta SPEC não o adiciona).
- **Inventário:** `lint_inventory.py` conta **todos** os `pack/commands/*.md`, inclusive stubs, e valida `pack/ARCHITECTURE.md` (Overview `Workflows` + árvore `# N slash commands`). Docs (`pack/ARCHITECTURE.md` nas 3 tabelas/árvore + `README.md`) e `.axion/inventory.json` devem bater com o filesystem (**18** commands; `lint_contracts.py` passa a validar **63** arquivos: 45 skills + 18 commands).
  - Canônicos FSM: 6 (`discover`, `specify`, `plan`, `implement`, `verify`, `remember`). Apoio: 7 (`orchestrate`, `debug`, `deploy`, `preview`, `status`, `test`, `design`). Aliases: 5 (`brainstorm`, `create`, `enhance`, `coordinate`, `ui-ux-pro-max`). **Total: 18.**
- **Proteção do E-01 (`eval_routing.py`):** `.axion/eval/routing.cases.json` faz match literal na tabela `## 🤖 Project Type Routing` de `AGENTS.md` (ex.: `"Planejamento / Discovery"`, `"Multi-domínio / complexo"`). Não alterar essas chaves na tabela de roteamento de `AGENTS.md`.
- **Claude Code:** continua sem command de design e sem `pack/shared/`. Mapear `design.md` no mesmo omit de `ui-ux-pro-max.md`.
- **Codex / Windsurf:** `mapTemplateTargets` de `pack/commands/**` já devolve `[]`. Sem dogfood desses layouts.
- **Compat:** aliases não implementam lógica paralela; o corpo aponta o canônico e o agente executa esse workflow.
- **Regressão:** `cd cli && npm test`, `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py`, `eval_routing.py` (default e `--gates`) saem 0.

## 5. Interfaces / Contracts

| Interface | Notes |
| --- | --- |
| FSM falada | `/discover` → `/specify` → `/plan` → `/implement` → `/verify` → `/remember` |
| `/discover` | `sdd_states: [discover]`. Artefato: notas/perguntas (não SPEC fechado). Skill `brainstorming`. Sem código de aplicação. |
| `/specify` | `sdd_states: [specify]`. Artefato: `{slug}.spec.md`. Exige direção de `/discover` ou respostas já dadas. Skill `brainstorming` + template SPEC. |
| `/plan` | Sem mudança de id. Gate: SPEC **ou** ≥3 respostas no SPEC/PLAN. Next step: `/implement`. |
| `/implement` | `name: implement`, `sdd_states: [implement]`. Skills: `app-builder`, `brainstorming`, `plan-writing`. Gate igual ao `/create` atual para escopo não trivial; ramifica entre **New Application / Feature (greenfield)** e **Existing Application (enhance)** no mesmo arquivo. |
| `/design` | `name: design`, `contract_version: "1.0.0"`. Cursor-only (fora da FSM linear, sem `sdd_states` obrigatório). Mesmo corpo/comportamento do antigo `/ui-ux-pro-max`. |
| Stubs de alias | `brainstorm.md` (`name: brainstorm`, `sdd_states: [discover, specify]`), `create.md` (`name: create`, `sdd_states: [implement]`), `enhance.md` (`name: enhance`, `sdd_states: [implement]`), `coordinate.md` (`name: coordinate`, `sdd_states: [orchestrate]`), `ui-ux-pro-max.md` (`name: ui-ux-pro-max`). Cada stub declara que é alias deprecado e instrui carregar/executar o command canônico correspondente. |
| Gate W-02 | Antes de `/plan`, `/implement`, `/orchestrate`. |
| Omit Claude | `pack/commands/design.md`, `pack/commands/ui-ux-pro-max.md` (e subpastas/prefixos `.cursor/commands/`) → `[]`. |

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| Usuários e chats antigos chamam `/brainstorm` / `/enhance` | Stubs de alias; README lista deprecação. |
| Inventário / ARCHITECTURE com “14 slash commands” quebra Q-03 | Atualizar overview + tree + `inventory.json` para 18 na mesma tarefa. |
| Claude Code passa a instalar `/design` | Omit explícito no adapter, teste unitário. |
| Duas lógicas (`create` vs `enhance`) mal fundidas | `/implement` ramifica por contexto (repo vazio vs código existente), um arquivo só. |

## 7. Socratic Gate evidence

| # | Question | Answer |
| --- | --- | --- |
| 1 | Seis estados ou specify unificado com discover? | Seis estados; **`specify` fora de `discover`**. |
| 2 | Nomes 1:1 com a FSM? | Sim: `/discover` `/specify` `/plan` `/implement` `/verify` `/remember`. |
| 3 | `/create` e `/enhance`? | Um command: **`/implement`**. |
| 4 | Aliases dos nomes antigos? | **Sim** — stubs de transição (`/brainstorm`, `/create`, `/enhance`, `/coordinate`, `/ui-ux-pro-max`). |
| 5 | `/coordinate` e `/ui-ux-pro-max` neste corte? | **Sim** — alias para `/orchestrate`; rename para `/design`. |

## 8. Traceability

| SPEC ID | Related PLAN | Related ACCEPTANCE |
| --- | --- | --- |
| SPEC-sdd-command-rename-1 | P1-1 | AC-1 |
| SPEC-sdd-command-rename-2 | P1-2 | AC-2 |
| SPEC-sdd-command-rename-3 | P1-3 | AC-3 |
| SPEC-sdd-command-rename-4 | P1-4 | AC-4 |
| SPEC-sdd-command-rename-5 | PV-1 | AC-5 |

## 9. Acceptance of SPEC

- [x] User approved this SPEC
- [x] Ready for `/plan`
