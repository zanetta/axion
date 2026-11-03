---
id: SPEC-upgrade-to-adnostic
title: "Deixar o Axion agnóstico de ferramenta"
status: draft
sdd_state: specify
created: "2026-11-03"
updated: "2026-11-03"
---

# SPEC: Deixar o Axion agnóstico de ferramenta

> Fill after Socratic Gate (`/brainstorm`). Do not implement until SPEC is accepted.

Origem: [zanetta/axion#9](https://github.com/zanetta/axion/issues/9).

## 1. Problem

O Axion é um framework de Spec-Driven Development, mas a superfície instalada vive nativamente no Cursor: slash commands em `.cursor/commands/`, regras em `.cursor/rules/`, MCP em `.cursor/mcp.json`, scripts de gate em `.cursor/scripts/`, e o CLI se apresenta como “Axion CLI (Cursor)”. Agents em `.claude/agents/` e `AGENTS.md` já vazam para outras ferramentas, então Claude Code e leitores de `AGENTS.md` conseguem usar o kit — só que de forma incompleta e acidental.

Isso cria três falhas:

1. **O dono dos artefatos é a pasta da IDE, não o framework.** Fluxos, agents e skills não têm projeção explícita por ferramenta; o CLI copia 1:1 o layout Cursor.
2. **Instalar “o Axion” é instalar “o Cursor pack”.** Não existe `init` por ferramenta. Quem usa Claude Code recebe paths que a ferramenta não lê (`.cursor/commands/`, `.cursor/rules/*.mdc`, `.cursor/mcp.json`) e deixa de receber os paths que ela lê (commands em `.claude/commands/`, skills em `.claude/skills/`, instruções em `CLAUDE.md`, MCP em `.mcp.json`).
3. **Evoluir para Codex, Windsurf ou outros leitores de `AGENTS.md` exige reescrever o instalador**, em vez de acrescentar um adapter.

O problema a resolver: o Axion passa a **projetar** seus fluxos, agents, skills, regras, catálogo MCP e scripts de gate no layout de cada ferramenta via **adapters de instalação** (`--tool`). Cursor deixa de ser o único destino; continua sendo o adapter padrão (`--tool cursor`). A migração é **faseada**: na **v1** os adapters leem o layout atual do repositório (zero quebra de CI/linters) e projetam por ferramenta; na **v2 (roadmap)** o pack físico pode ser extraído para um diretório neutro se necessário.

## 2. Actors / Users

| Actor | Goals |
| --- | --- |
| Usuário Cursor (base instalada) | Continuar com `npx @zanetta/axion init` sem regressão: mesmos paths, profiles, merge/protect, slash commands, rules, MCP e gates. |
| Usuário Claude Code | Instalar o kit com `--tool claude-code` e obter agents (`.claude/agents/`), skills (`.claude/skills/` + `.agents/skills/`), commands (`.claude/commands/` com `$ARGUMENTS`), `CLAUDE.md` + `AGENTS.md` e `.mcp.json` sanitizado. |
| Usuário futuro (Codex, Windsurf, outros leitores de `AGENTS.md`) | Ter um contrato de adapter (`--tool`) pronto para extensão; **não** um adapter completo na v1. |
| Maintainer do kit Axion | Manter uma única fonte de verdade no repo (sem duplicar arquivos no git) e deixar o adapter transformar/projetar destinos no install/update/diff. |
| CLI / CI (`@zanetta/axion`) | `init` / `update` / `status` com `--tool`, gravar `tool` no manifesto, calcular `diffKit` com conteúdo transformado pelo adapter e preservar profiles + protect. |
| Agente SDD (qualquer ferramenta) | Seguir a FSM `discover → specify → plan → implement → verify → remember` e rodar os scripts Python de gate fora do IDE. |

## 3. Scope

### In scope (v1)

- Introduzir **adapters de instalação** em `cli/lib/adapters/` que projetam o template do kit nos paths e formatos nativos da ferramenta escolhida (`mapTemplateTargets` 1→N + `transformContent` para copy e diff).
- **Fonte única na v1 (migração faseada):** o repositório do kit mantém os arquivos nos paths atuais (`.claude/agents/`, `.agents/skills/`, `.cursor/commands/`, `.cursor/scripts/`, etc.) como fonte única para não quebrar `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py` e E-02; os adapters leem essa fonte e projetam a árvore do consumidor.
- **Adapter `cursor` (v1, paridade):** projetar o pack no layout atual (`.claude/agents/`, `.agents/skills/`, `.cursor/commands/`, `.cursor/rules/`, `.cursor/mcp.json`, `.cursor/scripts/`, `AGENTS.md`, `AGENT_FLOW.md`, `.env.example`). Default de `--tool`.
- **Adapter `claude-code` (v1):** projetar o mesmo pack no layout nativo do Claude Code:
  - Agents → `.claude/agents/`
  - Skills → `.agents/skills/` (referências internas/scripts) **e** `.claude/skills/` (auto-load nativo do Claude Code), respeitando o filtro do profile
  - Flows/Commands → `.claude/commands/*.md` (omitindo `ui-ux-pro-max.md` e restaurando `$ARGUMENTS` no lugar da nota de texto livre do Cursor)
  - Instruções globais → `AGENTS.md` + criação de stub `CLAUDE.md` (referenciando `@AGENTS.md` e `AGENT_FLOW.md`) se não existir no alvo
  - MCP → `.mcp.json` na raiz (com merge de `mcpServers`, removendo `envFile: "${workspaceFolder}/.env"` e convertendo `"${env:CONTEXT7_API_KEY}"` para `"${CONTEXT7_API_KEY}"`)
  - Runtime/Gates → `.cursor/scripts/` mantido no destino para que `python3 .cursor/scripts/...` funcione sem reescrever comandos/skills nesta v1
  - Exclusões → `.cursor/rules/*.mdc` e `.cursor/shared/ui-ux-pro-max/` não são copiados no `--tool claude-code`
- Estender o CLI (`init`, `update`, `status`) com `--tool <id>`. Default `cursor`. Valor omitido no `update` herda `manifest.tool`; sem manifesto ou sem campo `tool`, assume `cursor`.
- Gravar `tool` em `.axion/kit.manifest.json`, registrar `install_paths` do adapter ativo e contar `components.commands` / `components.rules` nos diretórios do adapter ativo.
- Ajustar `isKitInstalled`, `diffKit`, `printDryRun`, `statusCommand` e mensagens pós-install para usarem os metadados do adapter (`markers`, `installPaths`, `transformContent`), evitando falso-positivo de drift quando o adapter transforma arquivos.
- Manter **profiles** (`minimal` \| `standard` \| `security` \| `fullstack` \| `mobile`) e `--enable-offensive` ortogonais a `--tool`: o filtro de profile roda sobre o path de origem do template antes da projeção 1→N do adapter.
- Preservar merge/protect atuais: `*.spec.md`, `*.plan.md`, `*.acceptance.md`, `.agents/memory/`, `.axion/logs/`, `.axion/trace/*` (exceto `README.md`) não são sobrescritos, mesmo com `--force`.
- Documentar em `README.md`, `cli/README.md`, `AGENTS.md`, `AGENT_FLOW.md`, `.cursor/ARCHITECTURE.md` e `cli/package.json` que o Axion é um framework SDD agnóstico de ferramenta com adapters (`cursor` default, `claude-code`).

### Non-goals

- Reescrever a FSM SDD (`discover → specify → plan → implement → verify → remember`) ou o Socratic Gate / verify hard gate (W-02, W-03).
- Abandonar o Cursor, remover o adapter Cursor, ou tornar outro tool o default.
- Mover fisicamente os diretórios do próprio repo do kit para `pack/` ou `.axion/scripts/` nesta v1 (fica para a v2 no roadmap, preservando `lint_paths.py` e `lint_inventory.py` intactos).
- Adapters v1 para Codex, Windsurf, Copilot, Aider, Gemini CLI — ficam no **roadmap** (`--tool` recusa IDs desconhecidos com exit ≠ 0).
- Apagar automaticamente arquivos de um tool anterior quando o usuário roda `update --tool <outro>` (o CLI continua aditivo / não-destrutivo).
- Tornar `/ui-ux-pro-max` portável para Claude Code (é marcado como Cursor-only e omitido no adapter `claude-code`).
- Publicar um segundo pacote npm (continua `@zanetta/axion`).
- Auto-detectar a IDE no `cwd` por heurística de pastas.

### Roadmap (fora da v1)

| Item | Notas |
| --- | --- |
| Extração física `pack/` (v2) | Mover a fonte do repo do kit para um diretório neutro quando os linters e CI forem migrados. |
| Adapter `codex` / `windsurf` | Projetar regras e workflows nos formatos nativos dessas ferramentas. |
| Path runtime tool-neutral | `.axion/scripts/` como path estável com wrapper ou atualização de `lint_paths.py`. |

## 4. Constraints

- **Compatibilidade Cursor:** `npx @zanetta/axion init` sem `--tool` produz exatamente a mesma árvore observável de hoje (profile `standard`, merge default, protect intacto). Regressão de path no adapter Cursor é blocker.
- **CLI atual permanece:** comandos `init`, `update`, `status`; flags `--profile`, `--enable-offensive`, `--force`, `--dry-run`, `--path`, `--branch`, `--quiet`; herança de `profile`, `enable_offensive` e agora `tool` pelo manifesto.
- **Merge/protect:** `*.spec.md`, `*.plan.md`, `*.acceptance.md`, `.agents/memory/`, `.axion/logs/`, `.axion/trace/*` (exceto `README.md`) continuam protegidos mesmo com `--force`. `CLAUDE.md` existente no projeto do usuário não deve ser sobrescrito sem `--force`.
- **Profiles:** `minimal` / `standard` / `security` / `fullstack` / `mobile` e o fechamento de dependências agent→skill aplicam-se tanto a `.agents/skills/` quanto ao espelho `.claude/skills/` no adapter Claude Code.
- **Drift consistente:** `diffKit` deve comparar o conteúdo **pós-transformação** do adapter com o arquivo no destino, para que um install `--tool claude-code` recém-feito tenha `drifted = []`.
- **Não quebrar eval/CI:** `checklist.py`, `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py`, E-01/E-02 (`eval_routing.py`) e `npm test` seguem verdes.

## 5. Interfaces / Contracts

| Interface | Notes |
| --- | --- |
| CLI `--tool <id>` | `init` e `update` aceitam `--tool <id>`. IDs v1: `cursor` \| `claude-code`. Default: `cursor`. Omitido no `update`: herda `manifest.tool ?? "cursor"`. ID desconhecido: exit ≠ 0 e lista `cursor, claude-code`. |
| Contrato de Adapter (`cli/lib/adapters/`) | `{ id, label, installPaths, mergeJsonFiles, markers, mapTemplateTargets(rel), transformContent(rel, destRel, content), componentDirs, postInstallHints }` |
| `mapTemplateTargets(rel)` | Recebe path POSIX relativo ao template e devolve `string[]` (0, 1 ou mais destinos relativos no projeto alvo). No `cursor`: `[rel]`. No `claude-code`: `.cursor/rules/*` e `.cursor/shared/ui-ux-pro-max/*` e `.cursor/commands/ui-ux-pro-max.md` → `[]`; `.cursor/commands/<x>.md` → `[".claude/commands/<x>.md"]`; `.cursor/mcp.json` → `[".mcp.json"]`; `.agents/skills/<rest>` → `[".agents/skills/<rest>", ".claude/skills/<rest>"]`; `AGENTS.md` → `["AGENTS.md", "CLAUDE.md"]`. |
| `transformContent(srcRel, destRel, text)` | No `cursor`: identidade. No `claude-code`: (1) para `destRel === "CLAUDE.md"`, gera stub conciso apontando para `AGENTS.md` e `AGENT_FLOW.md`; (2) para `.claude/commands/*.md`, substitui a nota de argumento livre do Cursor por `$ARGUMENTS`; (3) para `.mcp.json`, remove `envFile` com `${workspaceFolder}` e troca `${env:CONTEXT7_API_KEY}` por `${CONTEXT7_API_KEY}`. |
| `.axion/kit.manifest.json` | Adiciona `tool` (`"cursor"` \| `"claude-code"`), `install_paths` = `adapter.installPaths`, e `collectComponentSummary(targetRoot, adapter)` conta `commands` em `.cursor/commands` (Cursor) ou `.claude/commands` (Claude Code). |
| `axion status` | Usa `resolveTool(manifest?.tool)` (ou detecta pelos markers se não houver manifesto) para validar os `adapter.markers` corretos e exibe `tool` no resumo. |

### Mapeamento de Origem (Kit) → Projetado (v1)

| Origem no repo do kit | Adapter `cursor` (default) | Adapter `claude-code` |
| --- | --- | --- |
| `.claude/agents/<name>.md` | `.claude/agents/<name>.md` | `.claude/agents/<name>.md` |
| `.agents/skills/<name>/**` | `.agents/skills/<name>/**` | `.agents/skills/<name>/**` **e** `.claude/skills/<name>/**` |
| `.agents/memory/**`, `.agents/schemas/**` | `.agents/memory/**`, `.agents/schemas/**` | `.agents/memory/**`, `.agents/schemas/**` |
| `.cursor/commands/<name>.md` | `.cursor/commands/<name>.md` (14) | `.claude/commands/<name>.md` (13, sem `ui-ux-pro-max`, com `$ARGUMENTS`) |
| `AGENTS.md` | `AGENTS.md` | `AGENTS.md` + `CLAUDE.md` (stub, skip se existir sem `--force`) |
| `AGENT_FLOW.md`, `.env.example` | `AGENT_FLOW.md`, `.env.example` | `AGENT_FLOW.md`, `.env.example` |
| `.cursor/rules/*.mdc` | `.cursor/rules/*.mdc` | *(omitido — formato proprietário Cursor)* |
| `.cursor/shared/ui-ux-pro-max/**` | `.cursor/shared/ui-ux-pro-max/**` | *(omitido — Cursor-only)* |
| `.cursor/scripts/**` | `.cursor/scripts/**` | `.cursor/scripts/**` (runtime Python / hard gates) |
| `.cursor/ARCHITECTURE.md` | `.cursor/ARCHITECTURE.md` | `.cursor/ARCHITECTURE.md` (referenciado por `orchestrator.md` e scripts) |
| `.cursor/mcp.json` | `.cursor/mcp.json` (merge) | `.mcp.json` (merge + sanitização de vars Cursor) |
| `.axion/trace/README.md` | `.axion/trace/README.md` | `.axion/trace/README.md` |

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| Regressão no Cursor (paths, profiles, protect, smoke) | Adapter `cursor` é default e preserva `INSTALL_PATHS` 1:1. Suite atual continua rodando sobre o default. |
| Falso-positivo de drift no `axion update` para `claude-code` | `diffKit` aplica `adapter.transformContent` antes de comparar buffers entre template e destino, e compara contra todos os destinos de `mapTemplateTargets`. |
| `${env:CONTEXT7_API_KEY}` e `${workspaceFolder}` quebrarem MCP no Claude Code | `transformContent` do adapter `claude-code` sanitiza o JSON antes do merge em `.mcp.json`. |
| `collectComponentSummary` ou `status` contarem `commands=0` / falharem no Claude Code | `manifest.js`, `isKitInstalled` e `statusCommand` passam a ler `adapter.markers` e `adapter.componentDirs`. |
| `lint_inventory.py` falhar se as tabelas de `.cursor/ARCHITECTURE.md` mudarem de rótulo | Manter intocados os rótulos em negrito e contagens (`20`, `45`, `14`, `7`, `15`, `2`) da tabela Overview de `.cursor/ARCHITECTURE.md`. |
| Manifesto antigo sem campo `tool` | `resolveInstallSettings` trata `manifest?.tool ?? "cursor"`. |

## 7. Socratic Gate evidence

| # | Question | Answer |
| --- | --- | --- |
| 1 | Qual é o propósito desta mudança? | Tornar o Axion um framework SDD agnóstico de ferramenta com adapters de instalação (`--tool`), deixando o Cursor como adapter default e não como única ferramenta suportada. |
| 2 | Quem são os usuários e o que cada um precisa? | Quem já usa Cursor (zero regressão); quem usa Claude Code (commands em `.claude/commands/`, skills em `.claude/skills/`, `CLAUDE.md`, `.mcp.json`); futuros usuários de Codex/Windsurf via novos adapters. |
| 3 | A fonte canônica será movida de pasta agora? | Não na v1 (migração faseada): o repo mantém os paths atuais para não quebrar `lint_paths.py`, `lint_contracts.py` e `lint_inventory.py`; os adapters projetam 1→N no momento do `init`/`update`. |
| 4 | O que entra na v1 e o que fica no roadmap? | v1: adapters `cursor` (default) e `claude-code`, flag `--tool` em `init`/`update`, campo `tool` no manifesto e no `status`, docs sem exclusividade Cursor. Roadmap: extração física `pack/` (v2) e adapters Codex/Windsurf. |
| 5 | Como ficam `diffKit`, profiles, protect e troca de tool? | Filtro de profile roda antes da projeção 1→N; `diffKit` usa o conteúdo transformado pelo adapter; `protect.js` permanece intocado; `update --tool` é aditivo (não apaga árvore antiga). |

## 8. Traceability

| SPEC ID | Related PLAN | Related ACCEPTANCE |
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

Issue: [zanetta/axion#9](https://github.com/zanetta/axion/issues/9).

## 9. Acceptance of SPEC

- [x] User approved this SPEC
- [x] Ready for `/plan`
