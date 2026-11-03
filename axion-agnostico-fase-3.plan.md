---
id: PLAN-axion-agnostico-fase-3
title: "Axion agnóstico fase 3 (adapter Codex)"
status: approved
sdd_state: plan
spec: "SPEC-axion-agnostico-fase-3"
acceptance: "axion-agnostico-fase-3.acceptance.md"
created: "2026-11-03"
updated: "2026-11-03"
---

# PLAN: Axion agnóstico fase 3 (adapter Codex)

> Produced by `/plan` + `project-planner`. **No application code** in this step.
> Requires: approved SPEC (or embedded Socratic Gate evidence below).
> Issue: [zanetta/axion#11](https://github.com/zanetta/axion/issues/11) frente 3 · Branch: `11-axion-agnostico-fase-3`
> Predecessor: v2 (`axion-agnostico-fase-2`, PR #12). Direção: Codex primeiro, híbrido, sem dogfood no kit.

## Overview

Adicionar o adapter `--tool codex` sobre a base `pack/` + `.axion/scripts/` da v2:
1. Registrar `codex` em `cli/lib/adapters/codex.js` e `cli/lib/adapters/index.js` (`TOOL_NAMES = ["cursor", "claude-code", "codex"]`).
2. Projetar layout híbrido para Codex: `AGENTS.md`, `AGENT_FLOW.md`, `.env.example`, `.agents/skills/**`, `.agents/schemas/**`, `.agents/memory/**`, `.axion/scripts/**`, `.axion/trace/README.md` e `.codex/config.toml` — omitindo `pack/agents`, `pack/commands`, `pack/rules`, `pack/shared` e `pack/ARCHITECTURE.md`.
3. Transformar `pack/mcp.json` em TOML `[mcp_servers.<id>]` sanitizado (sem `envFile`, `${env:VAR}` → `${VAR}`) e fazer merge aditivo em `.codex/config.toml` sem sobrescrever servers/configs locais do usuário.
4. Tornar `collectComponentSummary` (`cli/lib/manifest.js`) null-safe quando `componentDirs.agents === null` e evitar log de `excluded` em `install.js` para arquivos omitidos pelo adapter.

## Project Type

**BACKEND/TOOLING** — CLI Node (`cli/`). Sem Lighthouse/Playwright. `code-review-graph` não instalado; pular o grafo (igual v2).

## Success Criteria

| # | Critério mensurável |
| --- | --- |
| 1 | `isValidTool("codex")` é `true`; `TOOL_NAMES` = `["cursor", "claude-code", "codex"]`. Default continua `cursor`. |
| 2 | `init --dry-run --tool codex` sai 0, exibe `Tool: codex`, `Copy:` lista `.agents, .axion/scripts, .codex/config.toml, AGENTS.md, AGENT_FLOW.md, .env.example` — sem `.claude`, sem `.cursor`, sem `CLAUDE.md`. |
| 3 | `mapTemplateTargets` omite `pack/agents/**`, `pack/commands/**`, `pack/rules/**`, `pack/shared/**`, `pack/ARCHITECTURE.md`; mapeia `pack/skills/**` apenas para `.agents/skills/**` e `pack/mcp.json` para `.codex/config.toml`. |
| 4 | `transformContent` emite TOML `[mcp_servers.<id>]` sem `envFile` e com `${VAR}`. `mergeCodexToml` preserva config/servers locais em `.codex/config.toml` e adiciona servers ausentes do kit; nunca toca `~/.codex/`. |
| 5 | `writeKitManifest` grava `tool: "codex"` e `components: { agents: 0, commands: 0, rules: 0, skills: N }` sem erro quando `componentDirs.agents` é `null`. |
| 6 | Smoke `codex` (`standard` e `security`): destinos esperados existem, omitidos não existem, `diffKit` retorna `drifted: []`, `lint_paths.py` e `lint_contracts.py` saem 0. `--tool windsurf`, `--tool openai-codex` e `--tool foo` saem 1 listando `cursor, claude-code, codex`. |

## Tech Stack

| Peça | Escolha | Por quê |
| --- | --- | --- |
| Adapter | `cli/lib/adapters/codex.js` no mesmo contrato de `cursor` / `claude-code` | Zero dependências novas |
| MCP TOML + merge | Serializador/merger focado em `[mcp_servers.<id>]` em `cli/lib/merge.js` + suporte em `install.js` | Evita dependência externa de parser TOML completo |
| Manifesto | Null-guard em `cli/lib/manifest.js` para `dirs.agents` | Codex é o primeiro adapter com `agents: null` |
| Tests | `node --test` (`adapters`, `merge`, `manifest`, `install`, `smoke`) | Mesmo runner do CI |

## File Structure

```plaintext
cli/lib/adapters/codex.js     # novo adapter Codex (mapTemplateTargets, transformContent, markers, componentDirs)
cli/lib/adapters/index.js     # registra codex em ADAPTERS / TOOL_NAMES
cli/lib/merge.js              # serializeCodexMcpToml / mergeCodexToml (aditivo, local vence)
cli/lib/manifest.js           # null-guard para dirs.agents em collectComponentSummary
cli/lib/install.js            # mergeTomlFiles (.codex/config.toml), payloadsEqual e guard de mapTemplateTargets vazio
cli/test/adapters.test.js     # testes unitários do adapter codex e TOOL_NAMES
cli/test/merge.test.js        # testes unitários de mergeCodexToml
cli/test/manifest.test.js     # teste de writeKitManifest com tool: "codex" (agents: 0)
cli/test/install.test.js      # installKit + diffKit + merge .codex/config.toml para codex
cli/test/smoke.test.js        # smoke codex (standard + security) e CLI --tool inválido
README.md, cli/README.md, AGENTS.md, AGENT_FLOW.md, pack/ARCHITECTURE.md
```

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `axion-agnostico-fase-3.spec.md` |
| PLAN (espelho) | `axion-agnostico-fase-3-plan.md` |
| ACCEPTANCE | `axion-agnostico-fase-3.acceptance.md` |

## Gate checklist (blocking)

- [x] SPEC exists **or** ≥3 Socratic answers recorded below
- [x] User confirmed plan before `/create` or `/enhance`

### Socratic evidence (copied from SPEC)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Fatia: os dois adapters juntos ou em sequência? | B — Codex primeiro; Windsurf depois |
| 2 | Projeção: nativo completo, mínimo, ou híbrido? | C — Híbrido |
| 3 | Dogfood Codex neste repo? | A — Só no consumidor |
| 4 | MCP nesta fatia? | 1 — `pack/mcp.json` → `.codex/config.toml` |
| 5 | Id do `--tool`? | 1 — `codex` |

## Phases

### Phase 0 — Discovery / context

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P0-1 | Mapear acoplamentos em `adapters/index.js`, `manifest.js` (`dirs.agents` null), `merge.js`, `install.js` (`mergeJsonFiles`, `payloadsEqual`, `walkAndInstall`) e testes que assumem `["cursor", "claude-code"]` | explorer-agent | — | — | Todos os pontos cobertos em P1-1..P1-4 |

### Phase 1 — Implementation

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P1-1 | Criar `cli/lib/adapters/codex.js` (contrato completo + `mapTemplateTargets` híbrido omitindo `agents`, `commands`, `rules`, `shared`, `ARCHITECTURE.md` e mapeando `pack/mcp.json` → `.codex/config.toml`), registrar em `cli/lib/adapters/index.js` e adicionar null-guard `dirs.agents` em `cli/lib/manifest.js` | backend-specialist | nodejs-best-practices, clean-code | P0-1 | `isValidTool("codex")` é `true`, `init --dry-run --tool codex` sai 0 e `mapTemplateTargets` atende toda a tabela da SPEC §5 |
| P1-2 | Implementar serialização MCP JSON → TOML (`[mcp_servers.<id>]` sem `envFile` e com `${VAR}`) no `transformContent` do Codex, `mergeCodexToml` aditivo em `cli/lib/merge.js` e suporte a `mergeTomlFiles` / `diffKit` / `walkAndInstall` em `cli/lib/install.js` | backend-specialist | nodejs-best-practices, clean-code | P1-1 | `installKit` com `tool: "codex"` gera/mescla `.codex/config.toml`, preserva servers locais e `diffKit` retorna `drifted: []` |
| P1-3 | Atualizar `cli/test/adapters.test.js`, `cli/test/merge.test.js`, `cli/test/manifest.test.js`, `cli/test/install.test.js` e `cli/test/smoke.test.js` (incluindo smoke `codex` em `standard` e `security` e rejeição de `windsurf`/`openai-codex`/`foo`) | test-engineer | testing-patterns, clean-code | P1-2 | Toda a suíte `cd cli && npm test` passa com exit 0 |
| P1-4 | Atualizar documentação (`README.md`, `cli/README.md`, `AGENTS.md`, `AGENT_FLOW.md`, `pack/ARCHITECTURE.md`) para documentar `--tool codex` e a projeção `.codex/config.toml` + `.agents/skills/` | documentation-writer | documentation-templates, clean-code | P1-2 | Docs consistentes e `lint_paths.py`, `lint_contracts.py` e `lint_inventory.py` saem com exit 0 |

### Phase 2 — Verification (always last)

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| PV-1 | Executar AC-1..AC-5 em `axion-agnostico-fase-3.acceptance.md`, rodar `checklist.py`, `verify_gate.py`, `trace_report.py` e `session_manager.py log` | test-engineer | verify-changes, testing-patterns | P1-3, P1-4 | Todos os AC-* marcados `[x]` com evidência e `verify_gate.py` + `trace_report.py` exit 0 |

## Critical path

P0-1 → P1-1 → P1-2 → P1-3 → P1-4 → PV-1

## Traceability

| SPEC ID | PLAN task | ACCEPTANCE ID |
| --- | --- | --- |
| SPEC-axion-agnostico-fase-3-1 | P1-1 | AC-1 |
| SPEC-axion-agnostico-fase-3-2 | P1-2 | AC-2 |
| SPEC-axion-agnostico-fase-3-3 | P1-3 | AC-3 |
| SPEC-axion-agnostico-fase-3-4 | P1-4 | AC-4 |
| SPEC-axion-agnostico-fase-3-5 | PV-1 | AC-5 |

## Write allowlist

| Path | Why |
| --- | --- |
| `cli/lib/adapters/codex.js` | Novo adapter Codex |
| `cli/lib/adapters/index.js` | Registrar `codex` em `ADAPTERS` |
| `cli/lib/manifest.js` | Null-guard para `dirs.agents` quando `agents: null` |
| `cli/lib/merge.js` | `mergeCodexToml` e helpers TOML de MCP |
| `cli/lib/install.js` | Merge/diff de `.codex/config.toml` e guard de `mapTemplateTargets` vazio |
| `cli/test/adapters.test.js` | Unit tests de `codex` (`mapTemplateTargets`, `transformContent`, `TOOL_NAMES`) |
| `cli/test/merge.test.js` | Unit tests de `mergeCodexToml` |
| `cli/test/manifest.test.js` | Unit test de `writeKitManifest` para `codex` |
| `cli/test/install.test.js` | Install + merge + `diffKit` para `codex` |
| `cli/test/smoke.test.js` | Smoke `codex` (`standard` + `security`) e lista de `--tool` |
| `README.md` | Documentar `--tool codex` |
| `cli/README.md` | Tabela de tools + paths instalados pelo `codex` |
| `AGENTS.md` | Atualizar linha do CLI e nota de adapters |
| `AGENT_FLOW.md` | Mencionar adapter `codex` |
| `pack/ARCHITECTURE.md` | Atualizar referência de `--tool` |
| `.cursor/ARCHITECTURE.md` | Espelho via symlink para `pack/ARCHITECTURE.md` |
| `axion-agnostico-fase-3.spec.md` | SPEC da fase 3 |
| `axion-agnostico-fase-3.plan.md` | PLAN canônico da fase 3 |
| `axion-agnostico-fase-3-plan.md` | Espelho do PLAN |
| `axion-agnostico-fase-3.acceptance.md` | ACCEPTANCE da fase 3 |

## Out of scope

- Adapter `windsurf`; Copilot, Aider, Gemini CLI
- Trocar default `--tool`; dogfood `.codex/` no kit
- Projetar commands/rules/agents/shared; converter commands em skills
- Stub `CLAUDE.md`; apagar árvore da tool anterior no `update`
- Bump/publish npm; nova dep npm para TOML

## Rollback

| Falha | Recuperação |
| --- | --- |
| Merge TOML corrompe config do usuário | Só merge aditivo de `[mcp_servers.<id>]`; local vence; não tocar `~/.codex/` |
| Smoke Cursor/Claude quebra | Reverter `index.js`; adapter Codex isolado em `cli/lib/adapters/codex.js` |
| `diffKit` marca falso drift em TOML | Comparar equivalência pós-merge (`mergeCodexToml(actual, expected) === actual`) |

## Phase X: Verification

```bash
python3 .axion/scripts/checklist.py .
python3 .axion/scripts/lint_paths.py .
python3 .axion/scripts/lint_contracts.py .
python3 .axion/scripts/lint_inventory.py .
python3 .axion/scripts/eval_routing.py .
python3 .axion/scripts/eval_routing.py . --gates
python3 .axion/scripts/eval_routing.py . --plan axion-agnostico-fase-3.plan.md
python3 .axion/scripts/trace_report.py . axion-agnostico-fase-3
cd cli && npm test
node cli/bin/index.js init --dry-run --tool codex
node cli/bin/index.js init --dry-run --tool windsurf
node cli/bin/index.js init --dry-run --tool openai-codex
```

- [ ] `checklist.py` exit 0
- [ ] `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py` exit 0
- [ ] `cd cli && npm test` exit 0
- [ ] `verify_gate.py . --acceptance axion-agnostico-fase-3.acceptance.md` exit 0
- [ ] `trace_report.py . axion-agnostico-fase-3` exit 0
