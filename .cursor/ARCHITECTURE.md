# Axion — Architecture

> Framework de Spec-Driven Development para o Cursor IDE — **npm `@zanetta/axion@1.0.2`**

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
| **Scripts master** | 4 | `.cursor/scripts/` (+ npm CLI em `cli/`) |
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
├── .github/workflows/           # publish-npm.yml (release por tag v*)
├── .claude/agents/              # 20 personas especialistas
├── .agents/
│   ├── skills/                  # 45 skills top-level (+ sub-skills game-dev)
│   └── memory/                  # Memória cross-session (MEMORY.md + tópicos)
└── .cursor/
    ├── ARCHITECTURE.md          # Este arquivo
    ├── commands/                # 14 slash commands
    ├── rules/                   # 7 regras auto-attach por glob
    ├── scripts/                 # checklist, verify_all, sync_upstream, …
    ├── shared/ui-ux-pro-max/    # Dados e scripts de design (Cursor-only)
    └── mcp.json                 # MCP servers (Context7, Playwright, shadcn)
```

---

## 📦 Distribuição npm

| Item | Detalhe |
| --- | --- |
| Pacote | `@zanetta/axion@1.0.2` |
| Binário | `axion` |
| Comandos CLI | `init`, `update`, `status` |
| Install default | Full + merge (`mcp.json`, rules) |
| CI publish | `.github/workflows/publish-npm.yml` on tag `v*` |
| Docs CLI | [`cli/README.md`](../cli/README.md) |

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
---
```

---

## 🛠️ Scripts

| Script | Propósito |
| --- | --- |
| `checklist.py` | Validação core (dev, pre-commit) |
| `verify_all.py` | Suite completa (pre-deploy) |
| `sync_upstream.py` | Compare/sync com [zanetta/axion](https://github.com/zanetta/axion) |
| `@zanetta/axion` | CLI npm: `init`, `update`, `status` (pasta `cli/`) |
| `session_manager.py` | Gestão de sessão |
| `auto_preview.py` | Preview automático |

### Usage

```bash
# Validação rápida
python3 .cursor/scripts/checklist.py .

# Verificação completa
python3 .cursor/scripts/verify_all.py . --url http://localhost:3000

# Sync com zanetta/axion
python3 .cursor/scripts/sync_upstream.py --apply

# Instalar kit em outro projeto (CLI npm)
npx @zanetta/axion init
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
| Scripts em `.cursor/scripts/` | 5 |
| CLI npm | `@zanetta/axion` |
| Regras por domínio | 7 |
| Cobertura | ~95% web/mobile + orquestração |

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
