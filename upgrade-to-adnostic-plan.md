---
id: PLAN-upgrade-to-adnostic
title: "Deixar o Axion agnóstico de ferramenta"
status: draft
sdd_state: plan
spec: "SPEC-upgrade-to-adnostic"
acceptance: "upgrade-to-adnostic.acceptance.md"
created: "2026-11-03"
updated: "2026-11-03"
---

# PLAN: Deixar o Axion agnóstico de ferramenta

> Produced by `/plan` + `project-planner`. **No application code** in this step.
> Requires: approved SPEC (or embedded Socratic Gate evidence below).
> Issue: [zanetta/axion#9](https://github.com/zanetta/axion/issues/9) · Branch: `9-upgrade-to-agnostic`

## Overview

O kit Axion SDD (`@zanetta/axion`) hoje **instala sempre o layout Cursor**: `INSTALL_PATHS` em `cli/lib/constants.js` copia `.claude`, `.agents`, `.cursor`, `AGENTS.md`, `AGENT_FLOW.md`, `.env.example`. O banner diz `AXION CLI (Cursor)`, `isKitInstalled` e `status` exigem `.cursor/commands`, e os docs descrevem o framework como exclusivo para o Cursor IDE.

O objetivo desta v1 é introduzir **adapters de instalação por ferramenta** (`--tool cursor|claude-code`) mantendo o **Axion dono do contrato SDD** — sem reescrever a FSM SDD, sem quebrar os linters do repo (`lint_paths.py`, `lint_contracts.py`, `lint_inventory.py`) e sem abandonar o Cursor.

**Default `--tool cursor`** = paridade byte-a-byte com o install atual. `claude-code` entra como segundo adapter completo. Codex/Windsurf e extração física de diretório `pack/` ficam para a v2 (roadmap).

## Project Type

**BACKEND/TOOLING** — CLI Node (`cli/`) + documentação e contratos do kit. Não é app web nem mobile (`frontend-specialist`, `mobile-developer`, Lighthouse e Playwright **não** se aplicam).

## Success Criteria

| # | Critério mensurável |
| --- | --- |
| 1 | `npx @zanetta/axion init` e `init --tool cursor` produzem exatamente os mesmos `INSTALL_PATHS` e arquivos de hoje |
| 2 | `init --tool claude-code` projeta commands em `.claude/commands/` (13, com `$ARGUMENTS`, sem `ui-ux-pro-max`), skills em `.agents/skills/` + `.claude/skills/`, `CLAUDE.md` stub, e `.mcp.json` sanitizado (sem `envFile`/`${workspaceFolder}` e com `${CONTEXT7_API_KEY}`) |
| 3 | `diffKit` aplica `adapter.transformContent` e `mapTemplateTargets`, resultando em `drifted = []` logo após `installKit` tanto em `cursor` quanto em `claude-code` |
| 4 | `manifest.js` (`tool`, `install_paths`, `components.commands`/`rules`), `isKitInstalled(targetDir, tool)` e `axion status` funcionam para ambos os adapters |
| 5 | Profiles (`minimal`…`mobile`) e `protect.js` continuam iguais nos dois tools; `cd cli && npm test` + `checklist.py` + `lint_*` + `trace_report.py` passam com exit 0 |

## Tech Stack

| Peça | Escolha | Por quê |
| --- | --- | --- |
| CLI | Node ≥18, `commander`, `fs-extra` (já em `cli/`) | Sem dependências novas; adapters são módulos ESM puros |
| Tests | `node --test` (`cli/package.json` → `test/*.test.js`) | Estender `install.test.js`, `manifest.test.js`, `smoke.test.js` + criar `adapters.test.js` |
| Kit source (v1) | Layout atual do repo (`.claude/agents`, `.agents/skills`, `.cursor/commands`, `.cursor/scripts`) | Faseado: mantém 100% de compatibilidade com `lint_paths.py`, `lint_contracts.py` e `lint_inventory.py` |
| Runtime scripts | `.cursor/scripts/*.py` (inalterados nos dois adapters) | Ambos os adapters copiam `.cursor/scripts/` e `.cursor/ARCHITECTURE.md` para que os hard gates Python rodem igual |

## File Structure

```plaintext
cli/lib/constants.js              # INSTALL_PATHS default Cursor + TOOL_NAMES / DEFAULT_TOOL
cli/lib/adapters/index.js         # TOOL_NAMES, DEFAULT_TOOL="cursor", isValidTool(), resolveAdapter()
cli/lib/adapters/cursor.js        # adapter cursor (identidade 1:1 com INSTALL_PATHS)
cli/lib/adapters/claude-code.js   # adapter claude-code (mapTemplateTargets 1→N + transformContent)
cli/lib/profiles.js               # resolveInstallSettings() passa a resolver `tool` também
cli/lib/install.js                # installKit(), diffKit(), isKitInstalled() guiados pelo adapter
cli/lib/manifest.js               # writeKitManifest() grava `tool`, `install_paths` e conta components por adapter
cli/bin/index.js                  # flag --tool, banner "AXION SDD CLI", printDryRun, statusCommand, next steps por tool
cli/test/adapters.test.js         # testes unitários AAA de contrato dos adapters + transformContent
cli/test/install.test.js          # regressão cursor + install/diff/update claude-code + protect
cli/test/manifest.test.js         # manifest.tool + collectComponentSummary para cursor e claude-code
cli/test/smoke.test.js            # smoke dos profiles (cursor) + smoke claude-code
```

## Architecture & Contrato dos Adapters (v1)

### 1. Interface de cada Adapter (`cli/lib/adapters/`)

| Propriedade / Método | `cursor` | `claude-code` |
| --- | --- | --- |
| `id` | `"cursor"` | `"claude-code"` |
| `label` | `"Cursor"` | `"Claude Code"` |
| `installPaths` (exibição / manifesto) | `[".claude", ".agents", ".cursor", "AGENTS.md", "AGENT_FLOW.md", ".env.example"]` | `[".claude", ".agents", ".cursor/scripts", ".cursor/ARCHITECTURE.md", ".mcp.json", "AGENTS.md", "CLAUDE.md", "AGENT_FLOW.md", ".env.example"]` |
| `mergeJsonFiles` | `new Set([".cursor/mcp.json"])` | `new Set([".mcp.json"])` |
| `markers` (`isKitInstalled` / `status`) | `["AGENTS.md", ".cursor/commands", ".claude/agents", ".agents/skills"]` | `["AGENTS.md", "CLAUDE.md", ".claude/commands", ".claude/agents", ".agents/skills", ".claude/skills"]` |
| `componentDirs` (`manifest.components`) | `{ agents: ".claude/agents", skills: ".agents/skills", commands: ".cursor/commands", rules: ".cursor/rules" }` | `{ agents: ".claude/agents", skills: ".agents/skills", commands: ".claude/commands", rules: null }` |
| `mapTemplateTargets(rel)` | `[rel]` | Projeção 1→N (tabela abaixo); retorna `[]` para itens excluídos |
| `transformContent(srcRel, destRel, text)` | `text` (identidade) | Transforma `.claude/commands/*.md`, `.mcp.json` e `CLAUDE.md` |

### 2. Tabela de Projeção `mapTemplateTargets(rel)` no Adapter `claude-code`

> **Ordem de execução crucial:** `isInProfile(srcRel, isDir, plan)` roda **sobre o path de origem (`srcRel`) antes** de `mapTemplateTargets(srcRel)`. Assim, uma skill excluída pelo profile (ex.: `red-team-tactics` no profile `standard`) é excluída tanto de `.agents/skills/` quanto de `.claude/skills/`.

| `srcRel` no template | `mapTemplateTargets(srcRel)` no `claude-code` | Transformação (`transformContent`) |
| --- | --- | --- |
| `.claude/agents/<name>.md` | `[".claude/agents/<name>.md"]` | Nenhuma |
| `.agents/skills/<skill>/<rest>` | `[".agents/skills/<skill>/<rest>", ".claude/skills/<skill>/<rest>"]` | Nenhuma (espelho 1→2 das skills permitidas pelo profile) |
| `.agents/memory/**`, `.agents/schemas/**` | `[srcRel]` | Nenhuma |
| `.cursor/commands/ui-ux-pro-max.md` | `[]` (omitido) | — |
| `.cursor/commands/<name>.md` | `[".claude/commands/<name>.md"]` | Substitui o bloco `> **Argumento livre:** ...` e `(texto livre após o comando)` por `$ARGUMENTS` |
| `.cursor/rules/**` | `[]` (omitido — `.mdc` é exclusivo Cursor) | — |
| `.cursor/shared/ui-ux-pro-max/**` | `[]` (omitido — Cursor-only) | — |
| `.cursor/scripts/**` | `[srcRel]` | Nenhuma (mantém path canônico dos scripts Python) |
| `.cursor/ARCHITECTURE.md` | `[".cursor/ARCHITECTURE.md"]` | Nenhuma (lido por `orchestrator.md` e `lint_inventory.py`) |
| `.cursor/mcp.json` | `[".mcp.json"]` | Remove `envFile` (`${workspaceFolder}/.env`) e converte `${env:CONTEXT7_API_KEY}` → `${CONTEXT7_API_KEY}` antes do `mergeMcpJson` |
| `AGENTS.md` | `["AGENTS.md", "CLAUDE.md"]` | Para `AGENTS.md`: identidade. Para `CLAUDE.md`: gera stub conciso que referencia `AGENTS.md` e `AGENT_FLOW.md` |
| `AGENT_FLOW.md`, `.env.example` | `[srcRel]` | Nenhuma |
| `.axion/trace/README.md` | `[".axion/trace/README.md"]` | Nenhuma |

### 3. Regra de `diffKit` e `update`

- `diffKit(templateRoot, targetRoot, { profile, enableOffensive, tool })`: para cada arquivo do template aceito pelo profile, obtém `targets = adapter.mapTemplateTargets(srcRel)`. Para cada `destRel` em `targets`, calcula o buffer esperado via `adapter.transformContent(srcRel, destRel, srcContent)` e compara com `path.join(targetRoot, destRel)`.
- `resolveInstallSettings(options, manifest)`: resolve `{ profile, enableOffensive, tool }` onde `tool = options.tool ?? manifest?.tool ?? DEFAULT_TOOL`.
- `isKitInstalled(targetRoot, tool)`: se `tool` não for informado, lê `manifest?.tool ?? "cursor"` e verifica `adapter.markers`.

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `upgrade-to-adnostic.spec.md` |
| PLAN (solicitado) | `upgrade-to-adnostic-plan.md` |
| PLAN (espelho SDD) | `upgrade-to-adnostic.plan.md` |
| ACCEPTANCE | `upgrade-to-adnostic.acceptance.md` |
| Issue | https://github.com/zanetta/axion/issues/9 |

## Gate checklist (blocking)

- [x] SPEC exists **or** ≥3 Socratic answers recorded below
- [x] User confirmed plan before `/create` or `/enhance`

### Socratic evidence (if no separate SPEC)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Qual é o propósito desta mudança? | Tornar o Axion um framework SDD agnóstico de ferramenta com adapters de instalação (`--tool`), mantendo Cursor como default. |
| 2 | Quem são os usuários? | Usuários Cursor (sem regressão), usuários Claude Code (`--tool claude-code`) e futuros usuários de outras ferramentas via novos adapters. |
| 3 | A fonte canônica mudará de diretório nesta v1? | Não: migração faseada; a v1 mantém os paths atuais no repo do kit para preservar `lint_paths`, `lint_contracts` e `lint_inventory`, projetando no install. |
| 4 | Como o adapter Claude Code trata skills, commands, MCP e `CLAUDE.md`? | Skills em `.agents/skills/` + `.claude/skills/`; commands em `.claude/commands/` com `$ARGUMENTS` (sem `ui-ux-pro-max`); MCP em `.mcp.json` sem `${workspaceFolder}`/`${env:...}`; stub `CLAUDE.md`. |
| 5 | Como evitar falso-positivo de drift e preservar contagens nos docs? | `diffKit` aplica `transformContent` antes de comparar; `ARCHITECTURE.md` mantém intactos os números da tabela Overview exigidos por `lint_inventory.py`. |

## Phases

### Phase 0 — Discovery / context

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P0-1 | Mapear acoplamentos em `cli/lib/`, `cli/bin/index.js`, `cli/test/` e `.cursor/scripts/` (`trace_report.py`, `lint_inventory.py`, `side_effect_guard.py`) | explorer-agent | — | — | Todos os pontos de acoplamento (`INSTALL_PATHS`, `MERGE_JSON_FILES`, `collectComponentSummary`, `diffKit`, `statusCommand`, `.mcp.json` vars) estão cobertos nas tasks P1-* |

### Phase 1 — Implementation

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P1-1 | Criar `cli/lib/adapters/{index,cursor}.js` + exportar `TOOL_NAMES`, `DEFAULT_TOOL`, `isValidTool`, `resolveAdapter`; garantir paridade 1:1 do adapter `cursor` com `INSTALL_PATHS` | backend-specialist | nodejs-best-practices, clean-code | P0-1 | `resolveAdapter()` retorna `cursor` por default; `cursor.installPaths` é igual a `INSTALL_PATHS`; `isValidTool("foo")` é `false` |
| P1-2 | Atualizar `cli/lib/profiles.js` (`resolveInstallSettings` com `tool`) e `cli/bin/index.js` (`--tool <name>` em `init`/`update`, validação com exit 1, banner `AXION SDD CLI`, `printDryRun`, `statusCommand` e Next Steps dinâmicos por adapter) | backend-specialist | nodejs-best-practices, clean-code | P1-1 | `--dry-run` e `status` usam `adapter`; `--tool foo` sai com exit 1 listando `cursor, claude-code`; `update` sem `--tool` herda `manifest.tool` |
| P1-3 | Implementar `cli/lib/adapters/claude-code.js` (`mapTemplateTargets` 1→N para `.claude/commands`, `.claude/skills`, `.mcp.json`, `CLAUDE.md`; exclusão de `.mdc` e `ui-ux-pro-max`; `transformContent` para `$ARGUMENTS`, `.mcp.json` sem `${env:}`/`envFile`, e stub `CLAUDE.md`) | backend-specialist | nodejs-best-practices, clean-code | P1-1 | `mapTemplateTargets` e `transformContent` cobrem todos os casos da tabela de projeção |
| P1-4 | Atualizar `cli/lib/install.js` (`installKit`, `diffKit`, `isKitInstalled`) e `cli/lib/manifest.js` (`writeKitManifest` com `tool`, `install_paths` do adapter e `collectComponentSummary` lendo `adapter.componentDirs`) | backend-specialist | nodejs-best-practices, clean-code | P1-1, P1-3 | `installKit` e `diffKit` funcionam para `cursor` e `claude-code` com `drifted = []` pós-install; `manifest.tool` e `manifest.components.commands` corretos nos dois tools |
| P1-5 | Criar `cli/test/adapters.test.js` e estender `cli/test/install.test.js` + `cli/test/manifest.test.js` (padrão AAA: paridade cursor, projeção claude-code, sanitização `.mcp.json`, `$ARGUMENTS`, `diffKit` sem falso drift, herança de `tool` no update, protect) | test-engineer | testing-patterns, tdd-workflow | P1-2, P1-4 | Testes unitários e de integração passam em `cd cli && npm test` |
| P1-6 | Atualizar documentação (`README.md`, `cli/README.md`, `AGENTS.md`, `AGENT_FLOW.md`, `.cursor/ARCHITECTURE.md`, `cli/package.json`) removendo afirmações de exclusividade Cursor e documentando `--tool cursor\|claude-code` **sem alterar os números/rótulos da tabela Overview de `ARCHITECTURE.md`** | documentation-writer | documentation-templates | P1-2 | Grep de exclusividade retorna 0 matches; `python3 .cursor/scripts/lint_inventory.py .` e `eval_routing.py .` continuam saindo 0 |
| P1-7 | Estender `cli/test/smoke.test.js` para testar install completo no pack real com `tool: "cursor"` (todos os profiles) e `tool: "claude-code"` (`standard` + `security`), validando `isKitInstalled`, `danglingSkillRefs` em `.claude/skills/`, `lint_paths.py` e `manifest.tool` | devops-engineer | deployment-procedures, testing-patterns | P1-4, P1-5 | `node --test test/smoke.test.js` sai 0 cobrindo ambos os adapters |

### Phase 2 — Verification (always last)

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| PV-1 | Executar todos os critérios `AC-1` a `AC-11` de `upgrade-to-adnostic.acceptance.md`, registrar evidência real, rodar `checklist.py`, `verify_gate.py` e `trace_report.py` | test-engineer | verify-changes, testing-patterns | P1-5, P1-6, P1-7 | Todos os `AC-*` marcados `[x]` com evidência, `verify_gate.py` exit 0 e `trace_report.py` exit 0 |

## Critical path

```plaintext
P0-1 → P1-1 → P1-3 → P1-4 → P1-5 → P1-7 → PV-1
              ↘ P1-2 ↗         ↘ P1-6 ↗
```

## Traceability

| SPEC ID | PLAN task | ACCEPTANCE ID |
| --- | --- | --- |
| SPEC-upgrade-to-adnostic-1 | P1-1 | AC-1 |
| SPEC-upgrade-to-adnostic-2 | P1-2 | AC-2 |
| SPEC-upgrade-to-adnostic-3 | P1-1 | AC-3 |
| SPEC-upgrade-to-adnostic-4 | P1-3 | AC-4 |
| SPEC-upgrade-to-adnostic-5 | P1-2 | AC-5 |
| SPEC-upgrade-to-adnostic-6 | P1-4 | AC-6 |
| SPEC-upgrade-to-adnostic-7 | P1-6 | AC-7 |
| SPEC-upgrade-to-adnostic-8 | P1-5 | AC-8 |
| SPEC-upgrade-to-adnostic-9 | PV-1 | AC-9 |
| SPEC-upgrade-to-adnostic-10 | P1-7 | AC-10 |
| SPEC-upgrade-to-adnostic-11 | P1-4 | AC-11 |

## Write allowlist

Paths the implement phase may create or modify. A write outside this list is refused, including a batch edit. `.env` and any path containing `credentials` stay refused even if listed.

| Path | Why |
| --- | --- |
| `cli/bin/index.js` | Flag `--tool`, banner agnóstico, `printDryRun`, `statusCommand`, next steps por adapter |
| `cli/lib/*.js` | `constants.js`, `profiles.js`, `install.js`, `manifest.js`, `merge.js`, `protect.js` |
| `cli/lib/adapters/*.js` | Módulos `index.js`, `cursor.js`, `claude-code.js` |
| `cli/test/**` | Testes unitários/smoke (`adapters.test.js`, `install.test.js`, `manifest.test.js`, `smoke.test.js`) e fixtures se necessário |
| `cli/package.json` | Descrição e keywords agnósticos de ferramenta |
| `cli/README.md` | Documentação de `--tool` e tabela de adapters |
| `README.md` | Posicionamento agnóstico + exemplos `--tool cursor\|claude-code` |
| `AGENTS.md` | Path awareness multi-tool |
| `AGENT_FLOW.md` | Fluxo e destinos por adapter |
| `.cursor/ARCHITECTURE.md` | Documentar adapters preservando a tabela Overview para `lint_inventory.py` |
| `upgrade-to-adnostic.spec.md` | Atualização de status/aprovação do SPEC |
| `upgrade-to-adnostic-plan.md` | Atualização de progresso das tasks e Phase X |
| `upgrade-to-adnostic.plan.md` | Espelho canônico para `trace_report.py` |
| `upgrade-to-adnostic.acceptance.md` | Registro de evidências `AC-*` e sign-off no `/verify` |
| `.axion/trace/upgrade-to-adnostic.json` | Traceability opcional se gerada |

## Out of scope

- Reescrever a FSM SDD (`discover → specify → plan → implement → verify → remember`)
- Mover fisicamente `.cursor/commands` ou `.cursor/scripts` do repo do kit nesta v1
- Adapters para Codex, Windsurf, Copilot, Aider
- Remoção destrutiva de arquivos de outro tool durante `update`
- Lighthouse, Playwright, `ux_audit.py` (projeto é CLI/Tooling, não Web UI)

## Rollback

| Falha | Recuperação |
| --- | --- |
| Regressão no adapter `cursor` | `cursor.js` delega 1:1 para `INSTALL_PATHS` e identidade em `transformContent` |
| `lint_inventory.py` ou `eval_routing.py` falhar após editar docs | Reverter edições nas tabelas de Overview/Routing em `.cursor/ARCHITECTURE.md` e `AGENTS.md` |
| Falso drift em `claude-code` | Garantir que `diffKit` passe exatamente pela mesma função `transformContent` que `installKit` |

## Phase X: Verification

Não marcar completo sem executar na fase `/verify`:

```bash
python3 .cursor/scripts/checklist.py .
python3 .cursor/scripts/lint_paths.py .
python3 .cursor/scripts/lint_contracts.py .
python3 .cursor/scripts/lint_inventory.py .
python3 .cursor/scripts/eval_routing.py .
python3 .cursor/scripts/eval_routing.py . --gates
python3 .cursor/scripts/trace_report.py . upgrade-to-adnostic
cd cli && npm test
node cli/bin/index.js init --dry-run
node cli/bin/index.js init --dry-run --tool cursor
node cli/bin/index.js init --dry-run --tool claude-code
```

- [ ] `checklist.py` exit 0
- [ ] `lint_paths.py` exit 0
- [ ] `lint_contracts.py` exit 0
- [ ] `lint_inventory.py` exit 0
- [ ] `eval_routing.py` (cases + `--gates` + `--plan`) exit 0
- [ ] `cd cli && npm test` exit 0
- [ ] `trace_report.py . upgrade-to-adnostic` exit 0
- [ ] `verify_gate.py . --acceptance upgrade-to-adnostic.acceptance.md` exit 0
