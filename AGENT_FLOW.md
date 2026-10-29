# 🔄 Agent Flow Architecture (Cursor)

> Port do [AG Kit](https://github.com/vudovn/ag-kit) para Cursor IDE — fluxo de agentes, skills e validação.

---

## 📦 Instalação do kit

```bash
cd ~/dev/seu-projeto
NPM_CONFIG_MIN_RELEASE_AGE=0 npx @zanetta/axion init
cp .env.example .env   # opcional — MCP Context7
```

| Modo | Comportamento |
| --- | --- |
| `init` (padrão) | Full install + **merge** (`mcp.json`, rules existentes preservados) |
| `init --force` | Sobrescreve todos os arquivos do kit |
| `update` | Baixa template atual e faz merge |
| `status` | Verifica `.claude/`, `.agents/`, `.cursor/`, `AGENTS.md` |

Pacote: [`@zanetta/axion`](https://www.npmjs.com/package/@zanetta/axion) · troubleshooting: [`cli/README.md`](cli/README.md)

---

## 📊 Overview Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              AGENTS.md + .cursor/rules/*.mdc                     │
│              (regras sempre-ativas + auto-attach por glob)       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REQUEST CLASSIFICATION                        │
│  • Intent (build, debug, test, deploy)                          │
│  • Domain (frontend, backend, mobile, …)                        │
│  • Complexity (simple, medium, complex)                         │
│  • Skill intelligent-routing (referência — aplicar manualmente)   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────┐      ┌──────────────────┐
    │ SLASH COMMAND     │      │  DIRECT AGENT    │
    │ .cursor/commands/ │      │  .claude/agents/ │
    └─────────┬─────────┘      └────────┬─────────┘
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │       AGENT + SKILL LOADING         │
         │  • Persona (.claude/agents/*.md)    │
         │  • Skills (.agents/skills/*/SKILL)  │
         │  • Memória (.agents/memory/)        │
         └──────────────┬──────────────────────┘
                        │
                        ▼
         ┌─────────────────────────────────────┐
         │         TASK EXECUTION              │
         └──────────────┬──────────────────────┘
                        │
                        ▼
         ┌─────────────────────────────────────┐
         │      VALIDATION (.cursor/scripts/)  │
         │  checklist.py  |  verify_all.py      │
         └──────────────┬──────────────────────┘
                        │
                        ▼
         ┌─────────────────────────────────────┐
         │         RESULT DELIVERY             │
         └─────────────────────────────────────┘
```

---

## 🎯 Slash Commands (`.cursor/commands/`)

| Comando | Skill / agent principal | Uso |
| --- | --- | --- |
| `/brainstorm` | `brainstorming` | Explorar opções antes de codar |
| `/coordinate` | `coordinator-mode` + `orchestrator` | Orquestração avançada paralela |
| `/create` | `app-builder` | Nova feature ou app |
| `/debug` | `systematic-debugging` | Debug baseado em evidência |
| `/deploy` | `deployment-procedures` | Pré-flight + deploy |
| `/enhance` | domain agents | Melhorar código existente |
| `/orchestrate` | `parallel-agents` + `orchestrator` | Multi-agente (mín. 3) |
| `/plan` | `plan-writing`, `architecture` | Plano estruturado |
| `/preview` | `auto_preview.py` | Preview local |
| `/remember` | `memory-system` | Persistir em `.agents/memory/` |
| `/status` | — | Relatório de progresso |
| `/test` | `testing-patterns`, `webapp-testing` | Testes |
| `/verify` | `verify-changes` | Executar e provar |
| `/ui-ux-pro-max` | `.cursor/shared/ui-ux-pro-max` | **Cursor-only** — design |

> **Cursor:** argumentos são texto livre após o comando (ex.: `/plan auth JWT`), não `$ARGUMENTS`.

---

## 🤖 Agent Selection Matrix

| Domínio | Agent | Skills típicas |
| --- | --- | --- |
| UI/UX Web | `frontend-specialist` | `nextjs-react-expert`, `frontend-design`, `tailwind-patterns` |
| API | `backend-specialist` | `api-patterns`, `nodejs-best-practices` |
| Database | `database-architect` | `database-design` |
| Mobile | `mobile-developer` | `mobile-design` |
| Game | `game-developer` | `game-development` |
| DevOps | `devops-engineer` | `deployment-procedures`, `server-management` |
| Security | `security-auditor` | `vulnerability-scanner` |
| Testing | `test-engineer` | `testing-patterns`, `webapp-testing` |
| Debug | `debugger` | `systematic-debugging` |
| Multi-domínio | `orchestrator` | `coordinator-mode`, `parallel-agents`, `memory-system` |
| Planejamento | `project-planner` | `brainstorming`, `plan-writing` |

**Checklist antes de codar:**

1. Identificar agent correto (ver `AGENTS.md` → Project Type Routing)
2. Ler `.claude/agents/<agent>.md`
3. Carregar skills do frontmatter ou da tabela acima
4. MOBILE → `mobile-developer` (nunca `frontend-specialist` para UI nativa)

---

## 🧠 Memória persistente

```
.agents/memory/
├── MEMORY.md              ← Índice (max ~200 linhas)
├── project-conventions.md ← Convenções do projeto
└── [topic].md             ← Tópicos adicionais
```

Ativar com `/remember <informação>` — ver skill `memory-system`.

---

## ✅ Validation Pipeline

**Durante desenvolvimento:**

```bash
python3 .cursor/scripts/checklist.py .
```

**Pre-deploy:**

```bash
python3 .cursor/scripts/verify_all.py . --url http://localhost:3000
```

| Checklist | verify_all (extra) |
| --- | --- |
| Security scan | Lighthouse |
| Lint / types | Playwright E2E |
| Schema | Bundle analysis |
| Tests | Mobile audit |
| UX audit | i18n check |
| SEO | |

---

## ⚠️ Diferenças Cursor vs AG Kit original

| Recurso original | No Cursor |
| --- | --- |
| `npx @vudovn/ag-kit init` | `npx @zanetta/axion init` |
| Auto-routing silencioso | Referência em `intelligent-routing`; agente aplica manualmente |
| `GEMINI.md` tier P0/P1/P2 | `AGENTS.md` + rules por glob |
| `$ARGUMENTS` | Texto livre após `/comando` |
| `.agents/agent/` | `.claude/agents/` |
| `.agents/workflows/` | `.cursor/commands/` |

---

## 🔗 Referências

- Arquitetura: `.cursor/ARCHITECTURE.md`
- Regras globais: `AGENTS.md`
- CLI npm: `cli/README.md`
- Sync upstream: `python3 .cursor/scripts/sync_upstream.py`
- Upstream: https://github.com/vudovn/ag-kit

**Last Updated:** 2026-06-17 · **npm:** `@zanetta/axion@1.0.0`
