---
id: SPEC-axion-agnostico-fase-2
title: "Axion agnóstico fase 2"
status: approved
sdd_state: specify
created: "2026-11-03"
updated: "2026-11-03"
approved: "2026-11-03"
---

# SPEC: Axion agnóstico fase 2

> Fill after Socratic Gate (`/brainstorm`). Do not implement until SPEC is accepted.

Origem: [zanetta/axion#11](https://github.com/zanetta/axion/issues/11).
Base: branch `11-axion-agnostico-fase-2` a partir de `9-upgrade-to-agnostic`.
Predecessor: v1 (`upgrade-to-adnostic`, issue #9) — adapters `--tool cursor|claude-code` projetando o layout Cursor do repo.

## 1. Problem

A v1 tornou o **install** agnóstico, mas a **fonte do kit** continua sendo o layout Cursor: commands em `.cursor/commands/`, scripts de gate em `.cursor/scripts/`, rules em `.cursor/rules/`, MCP em `.cursor/mcp.json`. O adapter `cursor` é identidade 1:1; `claude-code` projeta a partir desses paths. `lint_paths.py` trata `.cursor/scripts/` como canônico e recusa `.agents/scripts/`. `lint_inventory.py` conta o filesystem nas pastas da IDE e a tabela Overview de `.cursor/ARCHITECTURE.md`.

Isso trava a v2:

1. **O dono dos artefatos ainda é a pasta da IDE**, não o framework. Adicionar Codex/Windsurf exigiria mapear de um layout Cursor, não de um pack neutro.
2. **Runtime dos gates está preso ao Cursor.** Consumers (e o próprio Claude Code) instalam e invocam `python3 .cursor/scripts/checklist.py .`. Mover o pack sem um path estável quebra Q-01 e os hard gates.
3. **Linters e contratos congelam o layout v1.** O schema de commands só aceita scripts em `.cursor/scripts/` ou `.agents/skills/<x>/scripts/`. Extração física sem migrar esses contratos deixa o CI vermelho.

O problema a resolver: o Axion passa a **possuir** o pack em `pack/` (árvore neutra) e os scripts master de gate em `.axion/scripts/` (tanto no repo do kit quanto instalados em todos os tools). Cursor continua o default de `--tool`. Adapters Codex/Windsurf **não** entram nesta issue.

## 2. Actors / Users

| Actor | Goals |
| --- | --- |
| Maintainer do kit | Fonte única em `pack/` + `.axion/scripts/`; linters/CI funcionam no repo do kit e no projeto consumidor; adapters projetam no install. |
| Usuário Cursor (base instalada) | `init`/`update` default continua Cursor; commands/rules/MCP seguem em `.cursor/`; scripts passam a `.axion/scripts/` (breaking documentado). |
| Usuário Claude Code | Mesmo pack; scripts em `.axion/scripts/` (deixa de copiar `.cursor/scripts/`); resto da projeção v1 intacta. |
| Agente SDD (qualquer ferramenta) | Invocar `python3 .axion/scripts/...` para gates; FSM inalterada. |
| CLI / CI | `lint_paths`, `lint_contracts`, `lint_inventory`, `eval_routing`, `checklist.py`, schemas e smoke verdes sobre `pack/` + `.axion/scripts/`. |

## 3. Scope

### In scope

- Extrair a fonte canônica de componentes do kit para `pack/` com árvore neutra (`agents/`, `skills/`, `commands/`, `rules/`, `shared/`, `schemas/`, `memory/`, `mcp.json`, `ARCHITECTURE.md`).
- Mover os scripts master de `.cursor/scripts/` para **`.axion/scripts/`** no repo do kit (evitando symlinks de diretório que quebram em Windows/Git) e copiá-los de `.axion/scripts/` (ou `pack/scripts/` se espelhado) para `.axion/scripts/` em **todos** os adapters (`cursor` e `claude-code`).
- Manter `.agents/memory/` na raiz do repo do kit como memória viva do próprio Axion, enquanto `pack/memory/` guarda o seed inicial instalado em `.agents/memory/` nos consumidores (protegido por `isProtected`).
- Reescrever referências em `pack/`, `AGENTS.md`, `AGENT_FLOW.md`, `README.md`, `cli/README.md`, commands, skills, agents, CLI, CI, schemas e evals: canônico = `.axion/scripts/`. `lint_paths.py` passa a recusar drift para `.cursor/scripts/` e `.agents/scripts/` (exceto linhas históricas).
- Tornar `checklist.py`, `verify_all.py`, `lint_contracts.py`, `lint_paths.py` e `eval_routing.py` **dual-layout aware**: funcionam tanto na raiz do repo do kit (`pack/{agents,skills,commands,schemas}`) quanto num projeto consumidor instalado (`.claude/agents`, `.agents/skills`, `.cursor/commands` ou `.claude/commands`, `.agents/schemas`).
- Reescrever adapters (`cursor` e `claude-code`) para ler `pack/` via `mapTemplateTargets`. O adapter `cursor` deixa de ser identidade 1:1.
- Atualizar `install.js` para walk de `pack/` + `.axion/scripts/` + arquivos raiz (`AGENTS.md`, `AGENT_FLOW.md`, `.env.example`, `.axion/trace/README.md`). `diffKit` continua comparando conteúdo pós-`transformContent`.
- Atualizar `cli/bin/index.js` (`statusCommand`) para procurar `.axion/scripts/session_manager.py` (com fallback para `.cursor/scripts/session_manager.py`).
- Migrar `lint_inventory.py` / `generate_inventory.py` para suportar `pack/` (no repo do kit) ou layout instalado, lendo Overview em `pack/ARCHITECTURE.md` ou `.cursor/ARCHITECTURE.md` (rótulos em negrito e contagens permanecem o contrato).
- Atualizar `command-contract.schema.json` (`scripts[]`) e `skill-contract.schema.json` (`verify_hooks[]`) para aceitar `^(\.axion/scripts/|\.agents/skills/.+/scripts/)` e rejeitar `.cursor/scripts/`.
- Documentar a quebra: invocações `python3 .cursor/scripts/...` deixam de ser o contrato. Default `--tool cursor` produz a mesma árvore observável de commands/rules/MCP, **exceto** scripts em `.axion/scripts/`.
- `update` permanece **aditivo**: grava `.axion/scripts/`; **não** apaga `.cursor/scripts/` residual em projetos já instalados.
- Profiles, protect, merge MCP e `--enable-offensive` permanecem ortogonais a `--tool`.
- Testes unitários, smoke (`cursor` + `claude-code`) e `checklist.py` / `lint_*` / `eval_routing` / `trace_report` verdes.

### Non-goals

- Adapters `codex`, `windsurf`, Copilot, Aider, Gemini CLI.
- Reescrever a FSM SDD.
- Trocar o default de `--tool` (continua `cursor`).
- `update --tool` apagando a árvore da tool anterior ou apagando `.cursor/scripts/` residual.
- Portar `/ui-ux-pro-max` para Claude Code (continua Cursor-only, omitido no adapter `claude-code`).
- Publicar um segundo pacote npm.
- Smoke manual em um repo Claude Code de usuário.

## 4. Constraints

- **Breaking só no path de scripts:** commands Cursor, rules `.mdc`, MCP `.cursor/mcp.json`, schemas `.agents/schemas/` e agents/skills nos destinos v1 não mudam para o consumidor Cursor.
- **Cutover único sem symlink frágil:** `pack/` vira fonte dos componentes e `.axion/scripts/` vira a casa real dos scripts master no repo e nos consumidores (zero symlink de diretório para não quebrar Windows/`core.symlinks=false`). Árvores antigas (`.cursor/commands`, `.cursor/rules`, `.cursor/scripts`, `.cursor/shared`, `.cursor/mcp.json`, `.cursor/ARCHITECTURE.md`, `.claude/agents`, `.agents/skills`, `.agents/schemas`) saem da raiz do repo do kit.
- **Dual-layout nos scripts Python:** como `checklist.py`, `lint_contracts.py`, `lint_paths.py` e `eval_routing.py` rodam tanto no CI do kit (`pack/...`) quanto dentro de projetos instalados (`smoke.test.js` → `.agents/skills/...`), eles resolvem automaticamente `pack/` quando presente ou os paths instalados caso contrário.
- **Regressão Cursor:** `init` sem `--tool` = adapter `cursor` projetando `pack/` → layout Cursor + `.axion/scripts/`. Qualquer drift de command/rule/MCP é blocker.
- **Protect inalterado:** `*.spec.md`, `*.plan.md`, `*.acceptance.md`, `.agents/memory/`, `.axion/logs/`, `.axion/trace/*` (exceto `README.md`).
- **Compat v1 de adapter:** `transformContent` do `claude-code` (`$ARGUMENTS`, sanitização MCP, stub `CLAUDE.md`) permanece.

## 5. Interfaces / Contracts

| Interface | Notes |
| --- | --- |
| Fonte `pack/` + `.axion/scripts/` | `pack/` guarda `agents/`, `skills/`, `commands/`, `rules/`, `shared/`, `schemas/`, `memory/`, `mcp.json`, `ARCHITECTURE.md`. `.axion/scripts/` guarda os 15 scripts master. Raiz guarda `AGENTS.md`, `AGENT_FLOW.md`, `.env.example`, `.axion/trace/README.md`. |
| Runtime scripts | Local no repo e no destino instalado: `.axion/scripts/`. Invocação: `python3 .axion/scripts/<name>.py`. |
| `lint_paths.py` | `CANONICAL = ".axion/scripts/"`; `FORBIDDEN = (".agents/scripts/", ".cursor/scripts/")` (exceto linhas históricas/migração). Varre `pack/` (se existir) e paths instalados. `--fix` reescreve commands. |
| `command-contract.schema.json` & `skill-contract.schema.json` | Pattern de `scripts[]` e `verify_hooks[]`: `^(\.axion/scripts/|\.agents/skills/.+/scripts/)`. |
| `checklist.py` & `verify_all.py` | Resolvem scripts de skill em `.agents/skills/<s/scripts/...` se existir no `project_path`, senão em `pack/skills/<s>/scripts/...`. |
| `lint_contracts.py` & `eval_routing.py` | Resolvem skills/commands/agents/schemas em `pack/` quando `root / "pack"` existir, senão nos paths instalados (`.agents/skills`, `.cursor/commands`, `.claude/commands`, `.claude/agents`, `.agents/schemas`). |
| `lint_inventory.py` & `generate_inventory.py` | Contam a partir de `pack/` + `.axion/scripts/` (quando `pack/` existir) ou layout instalado; leem Overview em `pack/ARCHITECTURE.md` (ou `.cursor/ARCHITECTURE.md`). |
| Adapter `cursor` | Mapeia `pack/...` → destinos Cursor + `.axion/scripts/**`. `installPaths` exibe `[".claude", ".agents", ".cursor", ".axion/scripts", "AGENTS.md", "AGENT_FLOW.md", ".env.example"]`. |
| Adapter `claude-code` | Mapeia `pack/...` → destinos Claude Code + `.axion/scripts/**` (sem `.cursor/scripts`). `installPaths` exibe `[".claude", ".agents", ".axion/scripts", ".cursor/ARCHITECTURE.md", ".mcp.json", "AGENTS.md", "CLAUDE.md", "AGENT_FLOW.md", ".env.example"]`. |
| `axion status` | Procura `.axion/scripts/session_manager.py` (fallback `.cursor/scripts/session_manager.py`) para rodar `doctor`. |
| `axion update` | Aditivo: cria `.axion/scripts/`; não remove `.cursor/scripts/` antigo no consumidor. |
| `--tool` | IDs v2: `cursor` \| `claude-code`. Desconhecido: exit 1. |

### Mapeamento Fonte → Destino (v2)

| Origem no repo do kit (`srcRel`) | Adapter `cursor` | Adapter `claude-code` |
| --- | --- | --- |
| `pack/agents/<name>.md` | `.claude/agents/<name>.md` | `.claude/agents/<name>.md` |
| `pack/skills/<name>/**` | `.agents/skills/<name>/**` | `.agents/skills/<name>/**` e `.claude/skills/<name>/**` |
| `pack/schemas/<name>.json` | `.agents/schemas/<name>.json` | `.agents/schemas/<name>.json` |
| `pack/memory/<name>.md` | `.agents/memory/<name>.md` | `.agents/memory/<name>.md` |
| `pack/commands/ui-ux-pro-max.md` | `.cursor/commands/ui-ux-pro-max.md` | *(omitido)* |
| `pack/commands/<name>.md` | `.cursor/commands/<name>.md` | `.claude/commands/<name>.md` (`$ARGUMENTS`) |
| `pack/rules/*.mdc` | `.cursor/rules/*.mdc` | *(omitido)* |
| `pack/shared/ui-ux-pro-max/**` | `.cursor/shared/ui-ux-pro-max/**` | *(omitido)* |
| `pack/ARCHITECTURE.md` | `.cursor/ARCHITECTURE.md` | `.cursor/ARCHITECTURE.md` |
| `pack/mcp.json` | `.cursor/mcp.json` (merge) | `.mcp.json` (merge + sanitização) |
| `.axion/scripts/**` | `.axion/scripts/**` | `.axion/scripts/**` |
| `.axion/trace/README.md` | `.axion/trace/README.md` | `.axion/trace/README.md` |
| `AGENTS.md` | `AGENTS.md` | `AGENTS.md` + `CLAUDE.md` stub |
| `AGENT_FLOW.md`, `.env.example` | `AGENT_FLOW.md`, `.env.example` | `AGENT_FLOW.md`, `.env.example` |

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| `checklist.py`, `lint_contracts.py` ou `eval_routing.py` falharem no repo do kit vs. no consumidor instalado | Todos os scripts master resolvem dual-layout (`pack/` quando presente na raiz analisada, ou paths instalados `.agents/`, `.claude/`, `.cursor/`). |
| Symlink de diretório quebrar em Windows / Git | Não usar symlink: `.axion/scripts/` é diretório real tanto no repo do kit quanto no destino instalado. |
| Consumidores com docs/scripts apontando `.cursor/scripts/` | Breaking documentado no README/cli README; `update` instala `.axion/scripts/` e deixa o antigo (aditivo); `axion status` tem fallback para `.cursor/scripts/session_manager.py`. |
| `lint_inventory` / Overview desalinhados | Migrar parser para `pack/ARCHITECTURE.md` (fallback `.cursor/ARCHITECTURE.md`); manter os 6 rótulos em negrito e as 6 contagens (`20`, `45`, `14`, `7`, `15`, `2`). |
| Adapter `cursor` com bug de mapeamento | Smoke `tool: cursor` em todos os profiles; `diffKit` `drifted: []` pós-install; validar `schemas` e `memory` mapeados. |
| Memória do próprio repo Axion ser perdida ao mover `.agents/` | `.agents/memory/` permanece na raiz do repo do kit (não é deletada); `pack/memory/` contém o seed de template para consumidores. |

## 7. Socratic Gate evidence

| # | Question | Answer |
| --- | --- | --- |
| 1 | Qual o escopo desta issue #11? | Scripts em `.axion/scripts/` + extração física `pack/` (sem adapters Codex/Windsurf neste corte). |
| 2 | Como tratar os scripts hoje em `.cursor/scripts/`? | Mover de verdade: canônico `.axion/scripts/` no repo e no destino; atualizar todas as referências (breaking). |
| 3 | Qual o layout da fonte canônica? | `pack/` único com árvore neutra + `.axion/scripts/` real (sem overlays e sem symlinks frágeis). |
| 4 | Adapters Codex/Windsurf nesta issue? | Nenhum. `--tool` continua recusando IDs desconhecidos. |
| 5 | `update` apaga `.cursor/scripts/` residual no consumidor? | Não. `update` é aditivo (herdado da v1); só documenta a migração. |
| 6 | Cutover duplicado ou único? | Único: `pack/` + `.axion/scripts/` viram fonte e as árvores antigas da IDE saem do git do kit neste trabalho (preservando `.agents/memory/` do próprio repo). |

## 8. Traceability

| SPEC ID | Related PLAN | Related ACCEPTANCE |
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

## 9. Acceptance of SPEC

- [x] User approved this SPEC
- [x] Ready for `/plan`

Direction: **Option B** (cutover único — `pack/` + `.axion/scripts/` viram fonte; scripts instalam em `.axion/scripts/`; árvores antigas da IDE saem do git do kit).
