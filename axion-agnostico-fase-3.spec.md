---
id: SPEC-axion-agnostico-fase-3
title: "Axion agnóstico fase 3 (adapter Codex)"
status: approved
sdd_state: specify
created: "2026-11-03"
updated: "2026-11-03"
approved: "2026-11-03"
---

# SPEC: Axion agnóstico fase 3 (adapter Codex)

> Fill after Socratic Gate (`/brainstorm`). Do not implement until SPEC is accepted.

Origem: [zanetta/axion#11](https://github.com/zanetta/axion/issues/11) frente 3.
Base: branch `11-axion-agnostico-fase-3` a partir de `main` (pós PR #12).
Predecessor: v2 (`axion-agnostico-fase-2`) — `pack/` canônico + `.axion/scripts/` + adapters `cursor` | `claude-code`.

## 1. Problem

A fonte do kit já é neutra (`pack/` + `.axion/scripts/`), mas o CLI ainda só projeta **Cursor** e **Claude Code**. Quem usa **OpenAI Codex** (CLI / IDE extension) não tem `--tool` válido: ids desconhecidos saem 1.

Codex **não** lê `.cursor/commands/`, `.cursor/rules/` nem `.claude/agents/`. O que ele carrega de fato no repo:

| Camada | Path nativo Codex |
| --- | --- |
| Instruções | `AGENTS.md` na raiz (e nested) |
| Skills | `.agents/skills/**/SKILL.md` |
| MCP / config de projeto | `.codex/config.toml` (`[mcp_servers.<id>]`, só em projeto trusted) |
| Gates Axion | `.axion/scripts/` (já canônico na v2) |

Projetar o layout Cursor inteiro num consumidor Codex seria ruído. Esta fatia adiciona **um** adapter (`codex`) com projeção **híbrida**: só o que Codex + o runtime SDD realmente usam. **Windsurf fica para o próximo corte** na mesma issue #11.

## 2. Actors / Users

| Actor | Goals |
| --- | --- |
| Usuário Codex | `npx @zanetta/axion init --tool codex` instala um repo que Codex lê (`AGENTS.md`, skills, MCP TOML, gates). |
| Maintainer do kit | Terceiro adapter no mesmo contrato (`mapTemplateTargets` + `transformContent` + markers + `componentDirs` + smoke); kit repo continua dogfood Cursor. |
| Usuário Cursor / Claude Code | Regressão zero: default `--tool cursor`; `claude-code` intacto. |
| CLI / CI | `--tool codex` válido; `windsurf` e o resto continuam exit 1; testes/smoke verdes. |

## 3. Scope

### In scope

- Novo adapter `codex` em `cli/lib/adapters/codex.js`, registrado em `cli/lib/adapters/index.js` (`TOOL_NAMES = ["cursor", "claude-code", "codex"]`).
- `--tool codex` em `init` / `update` / `status` (`manifest.tool: "codex"`). Default permanece `cursor`.
- Ajuste em `cli/lib/manifest.js`: `collectComponentSummary` deve guardar `dirs.agents ? await countMarkdown(...) : 0` (hoje chama `path.join(targetRoot, dirs.agents)` sem guard e lança `TypeError` quando `dirs.agents === null`).
- Projeção híbrida a partir de `pack/` + `.axion/scripts/` (tabela na §5), com suporte a `pack/...` e fallback legado.
- `transformContent`: `pack/mcp.json` → `.codex/config.toml` com blocos `[mcp_servers.<id>]` (`command` + `args`), removendo `envFile` e convertendo `${env:VAR}` → `${VAR}`.
- Merge aditivo de `.codex/config.toml` em `cli/lib/merge.js` (`mergeCodexToml`) e `cli/lib/install.js` (`mergeTomlFiles` ou handler equivalente + comparação sem falso drift em `diffKit`): preserva configurações/tabelas existentes do usuário e só adiciona `[mcp_servers.<id>]` ausentes; nunca escreve em `~/.codex/`.
- Profiles, protect, `--enable-offensive` e `update` aditivo permanecem ortogonais a `--tool`:
  - `resolveProfile` / `readAgentSkills` continuam lendo `pack/agents/` do template para calcular `requiredSkills` das skills mantidas no profile, mesmo que `pack/agents/` seja omitido na projeção final do Codex.
  - Em `install.js` (`walkAndInstall`), quando `adapter.mapTemplateTargets(srcRel)` retornar `[]` (ex.: `pack/agents/*.md` no Codex), não registrar falso `excluded` em caminhos da fonte que o adapter nem projeta.
- Testes unitários (`adapters`, `merge`, `manifest`, `install`) + smoke `codex` em `standard` e `security` + docs (`README.md`, `cli/README.md`, `AGENTS.md`, `AGENT_FLOW.md`, `pack/ARCHITECTURE.md`) listando `cursor`, `claude-code`, `codex`.
- Issue #11 permanece aberta: esta SPEC não fecha a frente Windsurf.

### Non-goals

- Adapter `windsurf` (próximo corte na #11).
- Copilot, Aider, Gemini CLI.
- Trocar o default de `--tool`.
- Dogfood Codex neste repo (sem `.codex/` na raiz do kit; sem novos symlinks).
- Projetar `pack/commands/`, `pack/rules/`, `pack/shared/`, `pack/agents/` ou `.cursor/**` no destino Codex (Codex não carrega esses dirs).
- Converter slash commands em skills extras.
- Stub `CLAUDE.md` (isso é Claude Code).
- Reescrever a FSM SDD.
- Apagar a árvore da tool anterior no `update`.
- Publicar npm / bump de versão (fora desta SPEC; release é passo separado).

## 4. Constraints

- **Contrato de adapter v2:** `codexAdapter` exporta `id`, `label`, `installPaths`, `mergeJsonFiles`, `mergeTomlFiles` (ou equivalente para `.codex/config.toml`), `markers`, `componentDirs`, `mapTemplateTargets`, `transformContent`, `postInstallHints`.
- **Null-safety no manifesto:** `manifest.js` trata `componentDirs.agents === null` igual a `commands` e `rules` (retorna `0` sem quebrar `path.join`).
- **Híbrido = o que a tool lê + runtime SDD.** Skills em `.agents/skills/` (Codex e Axion). Personas `.claude/agents/` e commands `.cursor/commands/` **não** entram.
- **MCP é TOML, não JSON.** Destino `.codex/config.toml`, não `.mcp.json` nem `.cursor/mcp.json`. Zero dependências npm externas para serializar/mesclar os blocos `[mcp_servers.<id>]`.
- **Kit repo intacto:** `pack/` e dogfood Cursor (symlinks) não mudam por causa deste adapter.
- **Regressão:** `init` sem `--tool` e `--tool cursor` / `--tool claude-code` continuam com `diffKit` `drifted: []` nos smokes existentes.
- **Ids inválidos:** `windsurf`, `foo`, `openai-codex` saem 1 e listam `cursor, claude-code, codex`.

## 5. Interfaces / Contracts

| Interface | Notes |
| --- | --- |
| `--tool` | IDs desta fatia: `cursor` \| `claude-code` \| `codex`. Default `cursor`. Desconhecido: exit 1. |
| Adapter `codex` | `id: "codex"`, `label: "OpenAI Codex"`. `componentDirs = { agents: null, skills: ".agents/skills", commands: null, rules: null }`. |
| Markers | `["AGENTS.md", ".agents/skills", ".axion/scripts", ".codex/config.toml"]`. |
| `installPaths` (dry-run Copy) | `[".agents", ".axion/scripts", ".codex/config.toml", "AGENTS.md", "AGENT_FLOW.md", ".env.example"]`. Sem `.cursor/commands`, sem `.claude/`, sem `CLAUDE.md`. |
| MCP TOML | Origem `pack/mcp.json` → destino `.codex/config.toml`. Formato por servidor: `[mcp_servers.<id>]` + `command = "..."` + `args = [...]` (sem `envFile`; `${env:VAR}` → `${VAR}`). |
| Merge `.codex/config.toml` | `mergeCodexToml(existingText, incomingText)`: se o arquivo existir, mantém todo o conteúdo local e anexa apenas as tabelas `[mcp_servers.<id>]` do kit que ainda não existirem no arquivo local. |
| `diffKit` | Para `.codex/config.toml`, um destino que contenha todas as tabelas `[mcp_servers.<id>]` esperadas pelo kit (ou cujo merge com o esperado seja idêntico ao atual) não é reportado em `drifted`. Install Codex limpo → `drifted: []`. |
| `update --tool codex` | Aditivo: não apaga `.cursor/` nem `.claude/` se já existirem no consumidor. |

### Mapeamento `pack/` → destino Codex

| Origem | Destino Codex | Ação |
| --- | --- | --- |
| `pack/skills/**` | `.agents/skills/**` | copiar (uma via; sem `.claude/skills`) |
| `pack/schemas/**` | `.agents/schemas/**` | copiar |
| `pack/memory/**` | `.agents/memory/**` | copiar (protect no update) |
| `.axion/scripts/**` | `.axion/scripts/**` | copiar |
| `AGENTS.md`, `AGENT_FLOW.md`, `.env.example` | iguais | copiar |
| `pack/mcp.json` | `.codex/config.toml` | transformar JSON → TOML `[mcp_servers.<id>]` + merge aditivo |
| `.axion/trace/README.md` | `.axion/trace/README.md` | copiar (`KIT_AXION_FILES`) |
| `pack/agents/**` | `[]` | omitir |
| `pack/commands/**` | `[]` | omitir |
| `pack/rules/**` | `[]` | omitir |
| `pack/shared/**` | `[]` | omitir |
| `pack/ARCHITECTURE.md` | `[]` | omitir |

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| `collectComponentSummary` em `manifest.js` quebra com `dirs.agents === null` | Guardar `dirs.agents ? await countMarkdown(...) : 0` e cobrir em `manifest.test.js`. |
| `.codex/config.toml` do usuário tem outras configurações TOML (`model`, `approval_policy`, etc.) e é sobrescrito | `mergeCodexToml` opera sobre texto/seções preservando o arquivo existente e anexando apenas `[mcp_servers.<id>]` ausentes; nunca toca `~/.codex/`. |
| `diffKit` acusa falso drift quando o usuário tem servers extras em `.codex/config.toml` | Comparar equivalência pós-merge (`mergeCodexToml(actual, expected) === actual`), análogo ao contrato sem falso drift. |
| `walkAndInstall` loga `excluded` para `pack/agents/*.md` que o adapter Codex omite | Só logar/registrar `excluded` quando `adapter.mapTemplateTargets(srcRel).length > 0`. |
| Sem slash commands, a FSM some para o usuário Codex | `AGENTS.md` + `AGENT_FLOW.md` + skills (`.agents/skills/`) descrevem o fluxo; documentar em `postInstallHints`. |
| Windsurf atrasado deixa a #11 aberta | Explicitar que esta SPEC cobre Codex; Windsurf é o próximo ciclo na mesma issue #11. |

## 7. Socratic Gate evidence

| # | Question | Answer |
| --- | --- | --- |
| 1 | Fatia: os dois adapters juntos ou em sequência? | **B** — Codex primeiro; Windsurf depois (mesma issue #11). |
| 2 | Projeção: nativo completo, mínimo, ou híbrido? | **C** — Híbrido: só o que Codex carrega + runtime SDD. |
| 3 | Dogfood Codex neste repo? | **A** — Só no consumidor; kit continua dogfood Cursor. |
| 4 | MCP nesta fatia? | **1** — Incluir: `pack/mcp.json` → `.codex/config.toml` com merge aditivo. |
| 5 | Id do `--tool`? | **1** — `codex`. `openai-codex` e `windsurf` saem 1. |

## 8. Traceability

| SPEC ID | Related PLAN | Related ACCEPTANCE |
| --- | --- | --- |
| SPEC-axion-agnostico-fase-3-1 | P1-1 | AC-1 |
| SPEC-axion-agnostico-fase-3-2 | P1-2 | AC-2 |
| SPEC-axion-agnostico-fase-3-3 | P1-3 | AC-3 |
| SPEC-axion-agnostico-fase-3-4 | P1-4 | AC-4 |
| SPEC-axion-agnostico-fase-3-5 | PV-1 | AC-5 |

## 9. Acceptance of SPEC

- [x] User approved this SPEC
- [x] Ready for `/plan`
