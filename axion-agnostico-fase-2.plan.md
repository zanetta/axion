---
id: PLAN-axion-agnostico-fase-2
title: "Axion agnóstico fase 2"
status: approved
sdd_state: plan
spec: "SPEC-axion-agnostico-fase-2"
acceptance: "axion-agnostico-fase-2.acceptance.md"
created: "2026-11-03"
updated: "2026-11-03"
---

# PLAN: Axion agnóstico fase 2

> Produced by `/plan` + `project-planner`. **No application code** in this step.
> Requires: approved SPEC (or embedded Socratic Gate evidence below).
> Issue: [zanetta/axion#11](https://github.com/zanetta/axion/issues/11) · Branch: `11-axion-agnostico-fase-2`
> Predecessor: v1 (`upgrade-to-adnostic`, issue #9). Direção travada: **Option B — cutover único**.

## Overview

A v1 tornou o **install** agnóstico (`--tool cursor|claude-code`), mas a **fonte do kit** ainda usa o layout Cursor (`.cursor/commands/`, `.cursor/scripts/`, `.cursor/rules/`, `.cursor/mcp.json`, `.claude/agents/`, `.agents/skills/`).

Esta v2 executa o **cutover único (Option B)**:
1. Move os componentes do template para **`pack/`** (`agents/`, `skills/`, `commands/`, `rules/`, `shared/`, `schemas/`, `memory/`, `mcp.json`, `ARCHITECTURE.md`).
2. Move os 15 scripts master de `.cursor/scripts/` para **`.axion/scripts/`** (diretório real no repo e no destino instalado em qualquer tool — zero symlink).
3. Mantém `.agents/memory/` na raiz do repo como memória viva do próprio Axion, enquanto `pack/memory/` serve de seed inicial para consumidores.
4. Torna os scripts master (`checklist.py`, `verify_all.py`, `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py`, `generate_inventory.py`, `eval_routing.py`) **dual-layout aware** para funcionarem tanto na raiz do repo do kit (`pack/...`) quanto dentro de um projeto consumidor instalado (`.agents/...`, `.claude/...`, `.cursor/...`).
5. Atualiza os adapters `cursor` e `claude-code` para projetarem a partir de `pack/` + `.axion/scripts/`.

## Project Type

**BACKEND/TOOLING** — CLI Node (`cli/`) + contratos Python do kit. Não é app web nem mobile (`frontend-specialist`, `mobile-developer`, Lighthouse e Playwright **não** se aplicam). `code-review-graph` **não** está instalado; pular o grafo.

## Success Criteria

| # | Critério mensurável |
| --- | --- |
| 1 | Fonte no git do kit = `pack/` + `.axion/scripts/` + raiz (`AGENTS.md`, `AGENT_FLOW.md`, `.env.example`, `.axion/trace/README.md`). Não existem mais `.cursor/commands/`, `.cursor/rules/`, `.cursor/scripts/`, `.cursor/shared/`, `.cursor/mcp.json`, `.cursor/ARCHITECTURE.md`, `.claude/agents/`, `.agents/skills/`, `.agents/schemas/` na raiz do repo |
| 2 | Destino instalado dos scripts master = `.axion/scripts/**` em `cursor` **e** `claude-code`. Invocação canônica: `python3 .axion/scripts/<name>.py`. `.cursor/scripts/` e `.agents/scripts/` são recusados por `lint_paths.py` (exceto histórico) |
| 3 | `init` sem `--tool` e `init --tool cursor` projetam `pack/` → layout Cursor (commands/rules/MCP/ARCHITECTURE/schemas/memory iguais à v1) e scripts em `.axion/scripts/`. `diffKit` pós-install: `drifted: []` |
| 4 | `init --tool claude-code` projeta `pack/` → layout Claude Code + scripts em `.axion/scripts/`; `transformContent` v1 intacto (`$ARGUMENTS`, MCP sanitize, stub `CLAUDE.md`); sem `.cursor/scripts/` |
| 5 | `checklist.py`, `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py` (Overview em `pack/ARCHITECTURE.md`, 6 rótulos em negrito + 6 contagens), `eval_routing.py` (cases + `--gates` + `--plan`), `trace_report.py`, CI e `cd cli && npm test` saem todos com exit 0 |
| 6 | `update` é aditivo: grava `.axion/scripts/`; **não** apaga `.cursor/scripts/` residual no consumidor. `axion status` usa `.axion/scripts/session_manager.py` (fallback `.cursor/scripts/session_manager.py`). `--tool` continua só `cursor` \| `claude-code` |

## Tech Stack

| Peça | Escolha | Por quê |
| --- | --- | --- |
| CLI | Node ≥18, `commander`, `fs-extra` (já em `cli/`) | Sem deps novas; adapters ESM |
| Tests | `node --test` (`cli/test/*.test.js`) | Atualizar fixtures, adapters, install, smoke e eval tests |
| Kit source (v2) | `pack/` + `.axion/scripts/` | Fonte neutra sem symlinks frágeis em Windows/Git |
| Runtime scripts | `.axion/scripts/*.py` (dual-layout aware) | Mesmo path canônico no repo do kit, no CI e nos projetos consumidores |

## File Structure

### Fonte canônica após o cutover

```plaintext
pack/
├── ARCHITECTURE.md              # Overview: 6 rótulos em negrito + 6 contagens (contrato lint_inventory)
├── mcp.json                     # MCP template (merge no destino)
├── agents/                      # 20 personas
├── skills/                      # 45 skills
├── commands/                    # 14 slash commands
├── rules/                       # 7 regras .mdc
├── shared/                      # ui-ux-pro-max (Cursor-only no adapter)
├── schemas/                     # 2 JSON Schema (skill-contract, command-contract)
└── memory/                      # Seed inicial (MEMORY.md, project-conventions.md) para consumidores
.axion/
├── scripts/                     # 15 scripts master (canônico no repo e copiado para consumidores)
├── trace/README.md              # Copiado para consumidores
└── inventory.json               # Gerado por generate_inventory.py (não copiado para consumidores)
.agents/
└── memory/                      # Memória persistente viva deste repo (protegida, não deletada)
AGENTS.md                        # Raiz (maintainer + copiado para consumidores)
AGENT_FLOW.md                    # Raiz (maintainer + copiado para consumidores)
.env.example                     # Raiz (copiado para consumidores)
```

### Tabela de Projeção `mapTemplateTargets(srcRel)` (v2)

> **Ordem de execução:** `isInProfile(srcRel, isDir, plan)` roda sobre `srcRel` (`pack/skills/<name>` e `pack/agents/<name>.md`) **antes** de `mapTemplateTargets(srcRel)`.

| `srcRel` no template | Adapter `cursor` | Adapter `claude-code` |
| --- | --- | --- |
| `pack/agents/<name>.md` | `[".claude/agents/<name>.md"]` | `[".claude/agents/<name>.md"]` |
| `pack/skills/<skill>/<rest>` | `[".agents/skills/<skill>/<rest>"]` | `[".agents/skills/<skill>/<rest>", ".claude/skills/<skill>/<rest>"]` |
| `pack/schemas/<name>.json` | `[".agents/schemas/<name>.json"]` | `[".agents/schemas/<name>.json"]` |
| `pack/memory/<name>.md` | `[".agents/memory/<name>.md"]` | `[".agents/memory/<name>.md"]` |
| `pack/commands/ui-ux-pro-max.md` | `[".cursor/commands/ui-ux-pro-max.md"]` | `[]` (omitido) |
| `pack/commands/<name>.md` | `[".cursor/commands/<name>.md"]` | `[".claude/commands/<name>.md"]` (`$ARGUMENTS`) |
| `pack/rules/<name>.mdc` | `[".cursor/rules/<name>.mdc"]` | `[]` (omitido) |
| `pack/shared/<rest>` | `[".cursor/shared/<rest>"]` | `[]` (omitido) |
| `pack/ARCHITECTURE.md` | `[".cursor/ARCHITECTURE.md"]` | `[".cursor/ARCHITECTURE.md"]` |
| `pack/mcp.json` | `[".cursor/mcp.json"]` (merge) | `[".mcp.json"]` (merge + sanitização) |
| `.axion/scripts/<rest>` | `[".axion/scripts/<rest>"]` | `[".axion/scripts/<rest>"]` |
| `.axion/trace/README.md` | `[".axion/trace/README.md"]` | `[".axion/trace/README.md"]` |
| `AGENTS.md` | `["AGENTS.md"]` | `["AGENTS.md", "CLAUDE.md"]` |
| `AGENT_FLOW.md`, `.env.example` | `[srcRel]` | `[srcRel]` |

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `axion-agnostico-fase-2.spec.md` |
| PLAN | `axion-agnostico-fase-2.plan.md` |
| PLAN (espelho) | `axion-agnostico-fase-2-plan.md` |
| ACCEPTANCE | `axion-agnostico-fase-2.acceptance.md` |
| Issue | https://github.com/zanetta/axion/issues/11 |

## Gate checklist (blocking)

- [x] SPEC exists **or** ≥3 Socratic answers recorded below
- [x] User confirmed plan before `/create` or `/enhance`

### Socratic evidence (if no separate SPEC)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Qual o escopo desta issue #11? | Scripts em `.axion/scripts/` + extração física `pack/` (sem adapters Codex/Windsurf neste corte). |
| 2 | Como tratar os scripts hoje em `.cursor/scripts/`? | Mover de verdade: canônico `.axion/scripts/` no repo e no destino; atualizar todas as referências (breaking). |
| 3 | Qual o layout da fonte canônica? | `pack/` único com árvore neutra + `.axion/scripts/` real (sem overlays e sem symlinks frágeis). |
| 4 | Adapters Codex/Windsurf nesta issue? | Nenhum. `--tool` continua recusando IDs desconhecidos. |
| 5 | `update` apaga `.cursor/scripts/` residual no consumidor? | Não. `update` é aditivo (herdado da v1); só documenta a migração. |
| 6 | Cutover duplicado ou único? | Único: `pack/` + `.axion/scripts/` viram fonte e as árvores antigas da IDE saem do git do kit neste trabalho (preservando `.agents/memory/` do próprio repo). |

## Phases

### Phase 0 — Discovery / context

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P0-1 | Mapear todos os pontos de acoplamento (`install.js`, `constants.js`, `adapters/*.js`, `manifest.js`, `cli/bin/index.js`, scripts Python em `.cursor/scripts/`, schemas e testes em `cli/test/`) | explorer-agent | — | — | Todos os pontos de acoplamento cobertos nas tasks P1-1 a P1-7 |

### Phase 1 — Implementation

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P1-1 | Mover `.cursor/scripts/**` para `.axion/scripts/**` e atualizar os scripts master (`checklist.py`, `verify_all.py`, `verify_gate.py`, `session_manager.py`, `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py`, `generate_inventory.py`, `eval_routing.py`, `sync_upstream.py`, `README.md` etc.) para o path canônico `.axion/scripts/` e resolução **dual-layout** (`pack/` quando existir na raiz analisada, senão paths instalados `.agents/`, `.claude/`, `.cursor/`) | backend-specialist | python-patterns, clean-code | P0-1 | Todos os 15 scripts vivem em `.axion/scripts/` e funcionam tanto contra layout `pack/` quanto contra layout instalado |
| P1-2 | Extrair fisicamente a árvore do kit para `pack/` (`agents/`, `skills/`, `commands/`, `rules/`, `shared/`, `schemas/`, `memory/` seed, `mcp.json`, `ARCHITECTURE.md`), remover as árvores antigas da IDE da raiz do repo (preservando `.agents/memory/` vivo do repo), atualizar `command-contract.schema.json` + `skill-contract.schema.json` para `.axion/scripts/`, e reescrever referências `.cursor/scripts/` → `.axion/scripts/` nos commands, skills e agents dentro de `pack/` | backend-specialist | python-patterns, clean-code | P1-1 | `pack/` contém os componentes; `.cursor/commands`, `.cursor/rules`, `.cursor/scripts`, `.claude/agents`, `.agents/skills`, `.agents/schemas` não existem mais na raiz; `python3 .axion/scripts/lint_paths.py .`, `lint_contracts.py .` e `lint_inventory.py .` saem 0 |
| P1-3 | Atualizar `cli/lib/constants.js` (`SOURCE_PATHS = ["pack", ".axion/scripts", "AGENTS.md", "AGENT_FLOW.md", ".env.example"]`) e `cli/lib/adapters/cursor.js` (`mapTemplateTargets` mapeando `pack/...` → destinos Cursor e `.axion/scripts/**` → `.axion/scripts/**`; `installPaths` exibindo `.axion/scripts`; `postInstallHints` com `.axion/scripts/`) | backend-specialist | nodejs-best-practices, clean-code | P1-2 | `cursorAdapter.mapTemplateTargets("pack/commands/plan.md")` retorna `[".cursor/commands/plan.md"]` e `".axion/scripts/checklist.py"` retorna `[".axion/scripts/checklist.py"]` |
| P1-4 | Atualizar `cli/lib/adapters/claude-code.js` para mapear `pack/...` → destinos Claude Code e `.axion/scripts/**` → `.axion/scripts/**` (removendo `.cursor/scripts` de `installPaths`, mantendo `$ARGUMENTS`, sanitização `.mcp.json` e stub `CLAUDE.md`) | backend-specialist | nodejs-best-practices, clean-code | P1-2, P1-3 | `claudeCodeAdapter.mapTemplateTargets("pack/commands/plan.md")` retorna `[".claude/commands/plan.md"]`, omite `ui-ux-pro-max` e `pack/rules/*`, e mapeia `pack/skills/*` para `.agents/skills/*` + `.claude/skills/*` |
| P1-5 | Atualizar `cli/lib/install.js` (`readAgentSkills` lendo `pack/agents` com fallback `.claude/agents`; `isInProfile` casando `pack/skills/<x>` e `pack/agents/<x>.md` além dos paths legados; walk de `SOURCE_PATHS` + `KIT_AXION_FILES`) e `cli/bin/index.js` (`statusCommand` procurando `.axion/scripts/session_manager.py` com fallback `.cursor/scripts/session_manager.py`) | backend-specialist | nodejs-best-practices, clean-code | P1-3, P1-4 | `installKit` e `diffKit` instalam a partir de `pack/` + `.axion/scripts/` sem falso drift (`drifted: []`) para `cursor` e `claude-code` |
| P1-6 | Atualizar fixture `cli/test/fixtures/template` e toda a suíte `cli/test/*.test.js` (`adapters.test.js`, `install.test.js`, `smoke.test.js`, `eval-routing.test.js`, `eval-gates.test.js`, `verify-command.test.js`, `session-log.test.js`, `verify-gate.test.js`, `side-effect-guard.test.js`, `circuit-breaker.test.js`, `memory-secret-scan.test.js`, `trace-report.test.js`) para usar `.axion/scripts/` e `pack/` | test-engineer | testing-patterns, tdd-workflow | P1-5 | `cd cli && npm test` passa 100% com exit 0 |
| P1-7 | Atualizar `.github/workflows/ci.yml`, `README.md`, `cli/README.md`, `AGENTS.md`, `AGENT_FLOW.md` e `pack/ARCHITECTURE.md` (documentando `.axion/scripts/`, `pack/`, breaking de path de scripts e `update` aditivo, mantendo intactos os 6 rótulos/contagens da tabela Overview e mantendo `--tool` restrito a `cursor\|claude-code`) e regenerar `.axion/inventory.json` | documentation-writer | documentation-templates | P1-2, P1-5 | CI workflow e docs usam `.axion/scripts/`; `lint_inventory.py`, `lint_paths.py` e `eval_routing.py` saem 0 |

### Phase 2 — Verification (always last)

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| PV-1 | Executar todos os critérios `AC-1` a `AC-8` de `axion-agnostico-fase-2.acceptance.md`, registrar evidência real, rodar `checklist.py`, `verify_gate.py`, `trace_report.py` e `session_manager.py log` | test-engineer | verify-changes, testing-patterns | P1-6, P1-7 | Todos os `AC-*` marcados `[x]` com evidência, `verify_gate.py` exit 0 e `trace_report.py` exit 0 |

## Critical path

```plaintext
P0-1 → P1-1 → P1-2 → P1-3 → P1-4 → P1-5 → P1-6 → PV-1
                                       ↘ P1-7 ↗
```

## Traceability

| SPEC ID | PLAN task | ACCEPTANCE ID |
| --- | --- | --- |
| SPEC-axion-agnostico-fase-2-1 | P1-1 | AC-1 |
| SPEC-axion-agnostico-fase-2-2 | P1-2 | AC-2 |
| SPEC-axion-agnostico-fase-2-3 | P1-3 | AC-3 |
| SPEC-axion-agnostico-fase-2-4 | P1-4 | AC-4 |
| SPEC-axion-agnostico-fase-2-5 | P1-5 | AC-5 |
| SPEC-axion-agnostico-fase-2-6 | P1-6 | AC-6 |
| SPEC-axion-agnostico-fase-2-7 | P1-7 | AC-7 |
| SPEC-axion-agnostico-fase-2-8 | PV-1 | AC-8 |

Issue: [zanetta/axion#11](https://github.com/zanetta/axion/issues/11).

## Write allowlist

Paths the implement phase may create or modify. A write outside this list is refused, including a batch edit. `.env` and any path containing `credentials` stay refused even if listed.

| Path | Why |
| --- | --- |
| `pack/**` | Árvore neutra canônica (`agents`, `skills`, `commands`, `rules`, `shared`, `schemas`, `memory`, `mcp.json`, `ARCHITECTURE.md`) |
| `.axion/scripts/**` | Scripts master canônicos no repo do kit |
| `.axion/inventory.json` | Inventário regenerado por `generate_inventory.py` |
| `.axion/trace/README.md` | Documentação de trace com `.axion/scripts/` |
| `.axion/trace/axion-agnostico-fase-2.json` | Trace opcional |
| `.claude/agents/**` | Remoção ao mover para `pack/agents/**` |
| `.agents/skills/**` | Remoção ao mover para `pack/skills/**` |
| `.agents/schemas/**` | Remoção ao mover para `pack/schemas/**` |
| `.cursor/**` | Remoção ao mover para `pack/**` e `.axion/scripts/**` |
| `cli/bin/index.js` | `statusCommand` procurando `.axion/scripts/session_manager.py` (com fallback) |
| `cli/lib/*.js` | `constants.js`, `install.js`, `manifest.js`, `profiles.js` |
| `cli/lib/adapters/*.js` | `cursor.js`, `claude-code.js`, `index.js` |
| `cli/test/**` | Testes e fixtures atualizados para `pack/` e `.axion/scripts/` |
| `cli/README.md` | Documentação de `.axion/scripts/` e migração v2 |
| `README.md` | Documentação de `.axion/scripts/` e `pack/` |
| `AGENTS.md` | Path awareness atualizado para `.axion/scripts/` e `pack/` |
| `AGENT_FLOW.md` | Fluxo e comandos atualizados para `.axion/scripts/` |
| `.github/workflows/ci.yml` | Steps de lint invocando `python3 .axion/scripts/...` |
| `axion-agnostico-fase-2.spec.md` | SPEC da fase 2 |
| `axion-agnostico-fase-2.plan.md` | PLAN canônico da fase 2 |
| `axion-agnostico-fase-2-plan.md` | Espelho do PLAN (convenção do projeto) |
| `axion-agnostico-fase-2.acceptance.md` | ACCEPTANCE da fase 2 |

## Out of scope

- Adapters `codex`, `windsurf`, Copilot, Aider, Gemini CLI; novos `--tool` ids
- Trocar o default de `--tool` (continua `cursor`)
- Reescrever a FSM SDD
- `update --tool` apagando a árvore da tool anterior ou apagando `.cursor/scripts/` residual no consumidor
- Portar `/ui-ux-pro-max` para Claude Code
- Segundo pacote npm
- Lighthouse, Playwright, `ux_audit.py` (CLI/tooling, não Web UI)

## Rollback

| Falha | Recuperação |
| --- | --- |
| `checklist.py` ou `lint_contracts.py` falhar em projeto instalado vs. repo do kit | Verificar helper dual-layout (`pack/` quando existir na raiz, senão `.agents/`, `.claude/`, `.cursor/`) |
| Adapter `cursor` mapear mal algum path de `pack/` | Validar contra `smoke.test.js` (5 profiles) e `diffKit` (`drifted: []`) |
| `lint_inventory.py` falhar após mover `ARCHITECTURE.md` | Manter os 6 rótulos em negrito e contagens (`20`, `45`, `14`, `7`, `15`, `2`) em `pack/ARCHITECTURE.md` |

## Phase X: Verification

Não marcar completo sem executar na fase `/verify` (pós-implement):

```bash
python3 .axion/scripts/checklist.py .
python3 .axion/scripts/lint_paths.py .
python3 .axion/scripts/lint_contracts.py .
python3 .axion/scripts/lint_inventory.py .
python3 .axion/scripts/eval_routing.py .
python3 .axion/scripts/eval_routing.py . --gates
python3 .axion/scripts/eval_routing.py . --plan axion-agnostico-fase-2.plan.md
python3 .axion/scripts/trace_report.py . axion-agnostico-fase-2
cd cli && npm test
node cli/bin/index.js init --dry-run
node cli/bin/index.js init --dry-run --tool cursor
node cli/bin/index.js init --dry-run --tool claude-code
```

- [ ] `checklist.py` exit 0
- [ ] `lint_paths.py` exit 0
- [ ] `lint_contracts.py` exit 0
- [ ] `lint_inventory.py` exit 0
- [ ] `eval_routing.py` (cases + `--gates` + `--plan axion-agnostico-fase-2.plan.md`) exit 0
- [ ] `cd cli && npm test` exit 0
- [ ] `trace_report.py . axion-agnostico-fase-2` exit 0
- [ ] `verify_gate.py . --acceptance axion-agnostico-fase-2.acceptance.md` exit 0
