# Axion — Architecture

> Framework de Spec-Driven Development para o Cursor IDE — **npm `@zanetta/axion@1.1.0`**

---

## 📋 Overview

| Componente | Quantidade | Caminho canônico (Cursor) |
| --- | --- | --- |
| **Agents** | 20 | `.claude/agents/<name>.md` |
| **Skills** | 45 | `.agents/skills/<name>/SKILL.md` |
| **Workflows** | 14 | `.cursor/commands/<name>.md` |
| **Regras globais** | 1 | `AGENTS.md` |
| **Regras por domínio** | 7 | `.cursor/rules/*.mdc` |
| **Memória persistente** | — | `.agents/memory/MEMORY.md` |
| **Scripts master** | 13 | `.cursor/scripts/` (+ npm CLI em `cli/`) |
| **Schemas de contrato** | 2 | `.agents/schemas/` |
| **Manifesto do kit** | — | `.axion/kit.manifest.json` (escrito pelo CLI) |
| **Inventário** | — | `.axion/inventory.json` (`generate_inventory.py`) |
| **Templates SDD** | 3 | SPEC/PLAN + ACCEPTANCE (skills `plan-writing`, `verify-changes`) |
| **Traceability** | — | `.axion/trace/` (opcional `{slug}.json`) |
| **MCP** | — | `.cursor/mcp.json` |
| **Assets compartilhados** | — | `.cursor/shared/` (ex.: `ui-ux-pro-max`) |

---

## 🏗️ Directory Structure

```plaintext
axion/
├── AGENTS.md                    # Regras sempre-ativas
├── AGENT_FLOW.md                # Fluxo de agentes (adaptado ao Cursor)
├── README.md                    # Guia principal + fluxos de desenvolvimento
├── package.json                 # Monorepo (workspace cli/)
├── .npmrc                       # @zanetta → registry.npmjs.org
├── cli/                         # Pacote npm @zanetta/axion
├── .github/workflows/           # ci.yml (reusável) + publish-npm.yml (tag v*, gate pre-publish)
├── .axion/                      # Estado do kit (só trace/README.md é copiado ao consumidor)
│   ├── kit.manifest.json        # SemVer, profile, checksums (gerado pelo CLI no consumidor)
│   ├── inventory.json           # Contagens machine-readable (generate_inventory.py; paridade: lint_inventory.py; não copiado)
│   ├── logs/runs.jsonl          # Run log append-only (O-01); o .gitignore `logs` já ignora o diretório
│   └── trace/                   # Traceability opcional {slug}.json (protegido no update, exceto README.md)
├── .claude/agents/              # 20 personas especialistas
├── .agents/
│   ├── schemas/                 # Contratos JSON Schema (skill + command)
│   ├── skills/                  # 45 skills top-level (+ sub-skills game-dev)
│   │   ├── plan-writing/templates/   # SPEC.template.md, PLAN.template.md
│   │   └── verify-changes/templates/ # ACCEPTANCE.template.md
│   └── memory/                  # Memória cross-session (MEMORY.md + tópicos)
└── .cursor/
    ├── ARCHITECTURE.md          # Este arquivo
    ├── commands/                # 14 slash commands
    ├── rules/                   # 7 regras auto-attach por glob
    ├── scripts/                 # checklist, verify_gate, side_effect_guard, verify_all, lint_paths, lint_contracts, lint_inventory, …
    ├── shared/ui-ux-pro-max/    # Dados e scripts de design (Cursor-only)
    └── mcp.json                 # MCP servers (Context7, Playwright, shadcn)
```

---

## 📦 Distribuição npm

| Item | Detalhe |
| --- | --- |
| Pacote | `@zanetta/axion@1.1.0` |
| Binário | `axion` |
| Comandos CLI | `init`, `update`, `status` |
| Install default | Profile do manifesto (senão `standard`) + merge (`mcp.json`, rules); ver `--profile` |
| Manifesto | `.axion/kit.manifest.json` (SemVer, profile, components) |
| Profiles | `minimal` \| `standard` \| `security` \| `fullstack` \| `mobile` (`cli/lib/profiles.js`; filtro na cópia em `cli/lib/install.js`, nunca apaga no alvo) |
| Offensive | Só com `--profile security` ou `--enable-offensive` |
| Contratos | `.agents/schemas/skill-contract.schema.json`, `command-contract.schema.json` |
| Observabilidade SemVer | `init`/`update` gravam o manifesto, listam drift e não sobrescrevem paths protegidos (SPEC/PLAN/ACCEPTANCE, `.agents/memory/`, `.axion/logs/`, `.axion/trace/*` exceto `README.md`) mesmo com `--force`; `status` compara installed vs latest e, se `session_manager.py` existir, imprime o doctor (memory index, path lint, último verify em `.axion/logs/runs.jsonl`) |
| CI | `.github/workflows/ci.yml` (lint_paths + lint_contracts + lint_inventory + CLI tests + smoke pós-install) · publish on tag `v*` gated por `ci.yml` (tag deve = versão de `cli/package.json`) |
| Docs CLI | [`cli/README.md`](../cli/README.md) |

---

## 📜 Contratos, manifesto e path lint (P0)

### `.axion/kit.manifest.json`

Gerado no projeto consumidor por `npx @zanetta/axion init|update` (`cli/lib/manifest.js`). Fonte canônica da versão do kit **instalada no repo** (independente da versão do binário npm em uso na máquina).

Campos principais: `schema_version`, `package`, `version`, `profile`, `installed_at`, `updated_at`, `last_action`, `template_source`, `components`, `install_paths`, `checksums`.

### `.agents/schemas/`

| Schema | Uso |
| --- | --- |
| `skill-contract.schema.json` | Frontmatter de `.agents/skills/*/SKILL.md` — `inputs`, `outputs`, `preconditions`, `postconditions`, `side_effects`, `forbidden_paths`, `verify_hooks` |
| `command-contract.schema.json` | Frontmatter de `.cursor/commands/*.md` — `sdd_states`, `required_artifacts`, `scripts` (só `.cursor/scripts/` ou scripts da skill) |

Piloto P0: skills `brainstorming`, `plan-writing`, `verify-changes`, `coordinator-mode`; commands `/plan`, `/verify`, `/status`, `/orchestrate`. Validação CI de 100% das skills/commands via `lint_contracts.py` (Q-02).

### `lint_paths.py`

Scanner de drift de path: falha se docs/commands/skills referenciam o legado `.agents/scripts/` em vez do canônico `.cursor/scripts/`.

```bash
python3 .cursor/scripts/lint_paths.py .
python3 .cursor/scripts/lint_paths.py . --fix   # reescreve só .cursor/commands/
```

Job CI: `.github/workflows/ci.yml`.

### `lint_contracts.py`

Valida o frontmatter YAML de todas as skills/commands contra os schemas acima (Draft 7) + regra: `name` da skill = nome da pasta. Requer `pip install pyyaml jsonschema`.

```bash
python3 .cursor/scripts/lint_contracts.py .
```

Job CI: `.github/workflows/ci.yml` (também roda no gate `pre-publish` de `publish-npm.yml`).

### `lint_inventory.py`

Paridade doc/inventário (P2 Q-03): falha se as contagens da tabela overview (rótulos em negrito — o texto é o contrato do script), os comentários de contagem da árvore quando presentes, ou o `.axion/inventory.json` commitado divergirem do filesystem. Sem dependências extras.

```bash
python3 .cursor/scripts/lint_inventory.py .
```

Contagem da overview ou de um comentário (`# N personas`, `# N skills top-level`, `# N slash commands`, `# N regras`) desatualizada: edite o número no doc. Só o JSON desatualizado: `python3 .cursor/scripts/generate_inventory.py .`. Rótulos e como corrigir: [scripts/README.md](scripts/README.md).

Job CI: `.github/workflows/ci.yml`, passo "Lint doc/inventory parity (Q-03)", depois de `lint_contracts`.

---

## 🔀 FSM SDD (P1)

Estados canônicos:

```plaintext
discover → specify → plan → implement → verify → remember
```

| Estado | Command(s) | Artefato esperado |
| --- | --- | --- |
| `discover` / `specify` | `/brainstorm` | SPEC (a partir de `SPEC.template.md`) |
| `plan` | `/plan` | PLAN (+ links SPEC/ACCEPTANCE) |
| `implement` | `/create`, `/enhance` | código alinhado ao PLAN |
| `verify` | `/verify` | ACCEPTANCE + evidência; `verify_gate.py` exit 0 (W-03) |
| `remember` | `/remember` | entradas em `.agents/memory/` só com `memory_secret_scan.py` limpo (X-02) |

**Socratic Gate (W-02):** antes de `/plan`, `/create` ou `/orchestrate`, exigir SPEC **ou** ≥3 perguntas socráticas respondidas registradas no SPEC/PLAN. Orchestrator não despacha workers sem o gate. FSM e Socratic Gate são instruções em commands/agents (advisory), sem enforcement por tooling — eval mecânico planejado em E-02 ([`upgrade.md`](../upgrade.md)). O `/verify` é checagem executável: `verify_gate.py` devolve exit code real (W-03).

**Verify hard gate (W-03):** `/verify` roda os AC-*, grava a evidência, marca `[x]` e só conclui se `python3 .cursor/scripts/verify_gate.py . --acceptance {slug}.acceptance.md` sair 0. O script não reexecuta os comandos. Exit 1 (ACCEPTANCE incompleto, sign-off aberto ou `checklist.py` ≠ 0) impede reportar a tarefa como concluída.

**Paths P1:**

| Recurso | Path |
| --- | --- |
| Template SPEC | `.agents/skills/plan-writing/templates/SPEC.template.md` |
| Template PLAN | `.agents/skills/plan-writing/templates/PLAN.template.md` |
| Template ACCEPTANCE | `.agents/skills/verify-changes/templates/ACCEPTANCE.template.md` |
| Traceability | `.axion/trace/README.md` · opcional `.axion/trace/{slug}.json` |
| Inventário | `python3 .cursor/scripts/generate_inventory.py .` → `.axion/inventory.json` · paridade: `python3 .cursor/scripts/lint_inventory.py .` |

Fluxo detalhado e matriz command↔estado: [`AGENT_FLOW.md`](../AGENT_FLOW.md). Backlog: [`upgrade.md`](../upgrade.md) (Fase 1 ✅).

---

## 🤖 Agents (20)

| Agent | Foco | Skills principais |
| --- | --- | --- |
| `orchestrator` | Coordenação multi-agente | `parallel-agents`, `coordinator-mode`, `memory-system`, `context-compression`, `verify-changes` |
| `project-planner` | Discovery, planejamento | `brainstorming`, `plan-writing`, `architecture` |
| `frontend-specialist` | Web UI/UX | `frontend-design`, `nextjs-react-expert`, `tailwind-patterns` |
| `backend-specialist` | API, lógica de negócio | `api-patterns`, `nodejs-best-practices`, `database-design` |
| `database-architect` | Schema, SQL | `database-design` |
| `mobile-developer` | iOS, Android, RN | `mobile-design` |
| `game-developer` | Mecânicas de jogo | `game-development` |
| `devops-engineer` | CI/CD, deploy | `deployment-procedures`, `server-management` |
| `security-auditor` | Compliance, OWASP | `vulnerability-scanner`, `red-team-tactics` |
| `penetration-tester` | Segurança ofensiva | `red-team-tactics` |
| `test-engineer` | Estratégias de teste | `testing-patterns`, `tdd-workflow`, `webapp-testing` |
| `debugger` | Root cause analysis | `systematic-debugging` |
| `performance-optimizer` | Web Vitals, speed | `performance-profiling` |
| `seo-specialist` | SEO, visibilidade | `seo-fundamentals`, `geo-fundamentals` |
| `documentation-writer` | Docs, manuais | `documentation-templates` |
| `product-manager` | Requisitos, stories | `plan-writing`, `brainstorming` |
| `product-owner` | Backlog, MVP | `plan-writing`, `brainstorming` |
| `qa-automation-engineer` | E2E, CI | `webapp-testing`, `testing-patterns` |
| `code-archaeologist` | Legacy, refactor | `clean-code`, `code-review-checklist` |
| `explorer-agent` | Análise de codebase | — |

---

## 🧩 Skills (45)

Cada skill pode declarar `when_to_use` no frontmatter para carregamento condicional.

### Frontend & UI

| Skill | Descrição |
| --- | --- |
| `nextjs-react-expert` | Performance React/Next.js (Vercel, 58 regras) |
| `web-design-guidelines` | Auditoria UI (100+ regras a11y/UX) |
| `tailwind-patterns` | Tailwind CSS v4 |
| `frontend-design` | UI/UX, design systems |

### Backend & API

| Skill | Descrição |
| --- | --- |
| `api-patterns` | REST, GraphQL, tRPC |
| `nodejs-best-practices` | Node.js async, módulos |
| `python-patterns` | Python, FastAPI |
| `rust-pro` | Rust async, type system |

### Database

| Skill | Descrição |
| --- | --- |
| `database-design` | Schema, otimização, migrations |

### Cloud & Infra

| Skill | Descrição |
| --- | --- |
| `deployment-procedures` | CI/CD, deploy |
| `server-management` | Infra, processos |

### Testing & Quality

| Skill | Descrição |
| --- | --- |
| `testing-patterns` | Jest, Vitest |
| `webapp-testing` | E2E, Playwright |
| `tdd-workflow` | TDD RED-GREEN-REFACTOR |
| `code-review-checklist` | Padrões de review |
| `lint-and-validate` | Lint, types |

### Security

| Skill | Descrição |
| --- | --- |
| `vulnerability-scanner` | OWASP, secrets |
| `red-team-tactics` | Táticas ofensivas |

### Architecture & Planning

| Skill | Descrição |
| --- | --- |
| `app-builder` | Scaffolding full-stack |
| `architecture` | System design |
| `plan-writing` | Breakdown de tarefas |
| `brainstorming` | Porta socrática |

### Mobile / Game / SEO / Shell

| Grupo | Skills |
| --- | --- |
| Mobile | `mobile-design` |
| Game | `game-development` (+ sub-skills 2D/3D/web/…) |
| SEO | `seo-fundamentals`, `geo-fundamentals` |
| Shell | `bash-linux`, `powershell-windows` |

### Orchestration & Memory (2026.5.13+)

| Skill | Descrição |
| --- | --- |
| `coordinator-mode` | Orquestração paralela + síntese |
| `memory-system` | Memória persistente (`MEMORY.md`) |
| `context-compression` | Compactação em sessões longas |
| `verify-changes` | Verificar executando, não só lendo |
| `batch-operations` | Edições multi-arquivo |
| `simplify-code` | Reduzir over-engineering |
| `skillify` | Criar skills de workflows repetitivos |
| `code-review-graph` | Review via AST + MCP |

### Other

| Skill | Descrição |
| --- | --- |
| `clean-code` | Padrões globais (obrigatório) |
| `behavioral-modes` | Modos operacionais |
| `parallel-agents` | Padrões multi-agente |
| `intelligent-routing` | Roteamento (referência; não auto no Cursor) |
| `mcp-builder` | MCP servers |
| `documentation-templates` | Formatos de doc |
| `i18n-localization` | i18n/l10n |
| `performance-profiling` | Profiling, Lighthouse |

---

## 🔄 Workflows / Slash Commands

| Comando | Descrição |
| --- | --- |
| `/brainstorm` | Exploração socrática antes de codar |
| `/coordinate` | Coordenação avançada (coordinator-mode) |
| `/create` | Nova feature ou app |
| `/debug` | Debug sistemático |
| `/deploy` | Pré-flight + deploy |
| `/enhance` | Melhorar código existente |
| `/orchestrate` | Multi-agente (mín. 3 agents) |
| `/plan` | Plano estruturado |
| `/preview` | Servidor de preview local |
| `/remember` | Salvar em `.agents/memory/` |
| `/status` | Relatório de progresso |
| `/test` | Gerar e rodar testes |
| `/verify` | Provar que funciona (execução) |
| `/ui-ux-pro-max` | **Cursor-only** — design system (50 estilos) |

---

## 🎯 Skill Loading Protocol

```plaintext
User Request → when_to_use match? → Load SKILL.md
                                        ↓
                                references/ (se necessário)
                                        ↓
                                scripts/ (se necessário)
```

```yaml
---
name: skill-name
description: O que a skill faz
when_to_use: "Quando ativar. NOT for X."
allowed-tools: Read, Grep, Glob
# Contrato (ver .agents/schemas/skill-contract.schema.json)
contract_version: "1.0.0"
inputs: []
outputs: []
side_effects: [read-only]
---
```

---

## 🛠️ Scripts

| Script | Propósito |
| --- | --- |
| `checklist.py` | Validação core (dev, pre-commit) |
| `verify_gate.py` | Gate hard do `/verify`: ACCEPTANCE + exit de `checklist.py`; não reexecuta os AC-* |
| `trace_report.py` | Cobertura SPEC → PLAN → ACCEPTANCE de um slug (O-02); não reexecuta os checks |
| `verify_all.py` | Suite completa (pre-deploy) |
| `sync_upstream.py` | Compare/sync com upstream |
| `lint_paths.py` | Fail CI se path legado `.agents/scripts/` |
| `lint_contracts.py` | Fail CI se frontmatter de skill/command viola o schema |
| `lint_inventory.py` | Fail CI se counts da overview ou do `inventory.json` divergirem do filesystem |
| `generate_inventory.py` | Gera `.axion/inventory.json` (agents/skills/commands/…) |
| `@zanetta/axion` | CLI npm: `init`, `update`, `status` (pasta `cli/`) |
| `session_manager.py` | Gestão de sessão; `doctor` (JSON) e `log` append-only em `.axion/logs/runs.jsonl` |
| `side_effect_guard.py` | Allowlist de escrita do PLAN (X-03); o agente honra o exit |
| `auto_preview.py` | Preview automático |

### Usage

```bash
# Validação rápida
python3 .cursor/scripts/checklist.py .

# Gate hard do /verify (P2 W-03) — depois de gravar evidência e [x]
python3 .cursor/scripts/verify_gate.py . --acceptance {slug}.acceptance.md

# Verificação completa
python3 .cursor/scripts/verify_all.py . --url http://localhost:3000

# Sync com upstream
python3 .cursor/scripts/sync_upstream.py --apply

# Lint de path drift (P0)
python3 .cursor/scripts/lint_paths.py .

# Lint de contratos skill/command (P2 Q-02)
python3 .cursor/scripts/lint_contracts.py .

# Paridade doc/inventário (P2 Q-03)
python3 .cursor/scripts/lint_inventory.py .

# Inventário versionado (P1 K-04)
python3 .cursor/scripts/generate_inventory.py .

# Instalar kit (grava .axion/kit.manifest.json) e inspecionar SemVer
npx @zanetta/axion init --profile standard
npx @zanetta/axion status

# Doctor do kit (D-04) — path lint local; não reexecuta o verify
python3 .cursor/scripts/session_manager.py doctor .

# Allowlist de escrita (P2 X-03) — antes de gravar; o agente honra o exit
python3 .cursor/scripts/side_effect_guard.py . --plan {slug}.plan.md --effect write-files --write path/to/file
```

Skill-level scripts ficam em `.agents/skills/<skill>/scripts/`.

Detalhes: [scripts/README.md](scripts/README.md)

---

## 📊 Statistics

| Métrica | Valor |
| --- | --- |
| Agents | 20 |
| Skills | 45 |
| Workflows | 14 |
| Scripts em `.cursor/scripts/` | 13 |
| Schemas (`.agents/schemas/`) | 2 |
| Templates SDD | 3 (SPEC, PLAN, ACCEPTANCE) |
| CLI npm | `@zanetta/axion` |
| Regras por domínio | 7 |
| Cobertura | ~95% web/mobile + orquestração |
| Fonte de counts | `.axion/inventory.json` (paridade: `lint_inventory.py`) |

---

## 🔗 Quick Reference

| Necessidade | Agent | Skills |
| --- | --- | --- |
| Web App | `frontend-specialist` | `nextjs-react-expert`, `frontend-design` |
| API | `backend-specialist` | `api-patterns`, `nodejs-best-practices` |
| Mobile | `mobile-developer` | `mobile-design` |
| Database | `database-architect` | `database-design` |
| Security | `security-auditor` | `vulnerability-scanner` |
| Testing | `test-engineer` | `testing-patterns`, `webapp-testing` |
| Debug | `debugger` | `systematic-debugging` |
| Plan | `project-planner` | `brainstorming`, `plan-writing` |
| Orquestração | `orchestrator` | `coordinator-mode`, `parallel-agents` |
| Memória | — | `memory-system` + `/remember` |
