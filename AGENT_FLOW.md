# 🔄 Agent Flow Architecture (Cursor)

> Fluxo de agentes, skills e validação do Axion no Cursor IDE.

---

## 📦 Instalação do kit

```bash
cd ~/dev/seu-projeto
NPM_CONFIG_MIN_RELEASE_AGE=0 npx @zanetta/axion init
cp .env.example .env   # opcional — MCP Context7
```

| Modo | Comportamento |
| --- | --- |
| `init` (padrão) | Profile do manifesto (senão **`standard`**) + **merge** (`mcp.json`, rules existentes preservados) |
| `init --profile <name>` | `minimal` \| `standard` \| `security` \| `fullstack` \| `mobile` (filtra na cópia; nunca apaga arquivos já instalados) |
| `init --enable-offensive` | Inclui `red-team-tactics` + `penetration-tester` (ou use `--profile security`) |
| `init --force` | Sobrescreve todos os arquivos do kit |
| `update` | Baixa template atual e faz merge; herda `profile`/`enable_offensive` do manifesto |
| `status` | Lê `.axion/kit.manifest.json` + verifica `.claude/`, `.agents/`, `.cursor/`, `AGENTS.md` |

Pacote: [`@zanetta/axion`](https://www.npmjs.com/package/@zanetta/axion) · troubleshooting: [`cli/README.md`](cli/README.md)

---

## 🔀 FSM SDD — commands ↔ estados

```plaintext
discover → specify → plan → implement → verify → remember
```

| Estado FSM | Command | Artefato / saída |
| --- | --- | --- |
| `discover` / `specify` | `/brainstorm` | SPEC (template em `.agents/skills/plan-writing/templates/SPEC.template.md`) |
| `plan` | `/plan` | PLAN (+ Traceability → SPEC/ACCEPTANCE) |
| `implement` | `/create` \| `/enhance` | código alinhado ao PLAN |
| `verify` | `/verify` | ACCEPTANCE + evidência de execução |
| `remember` | `/remember` | `.agents/memory/` |

Commands de apoio (fora da FSM linear): `/debug`, `/test`, `/preview`, `/status`, `/deploy`, `/orchestrate`, `/coordinate`, `/ui-ux-pro-max`.

### Socratic Gate (antes de `/plan`, `/create`, `/orchestrate`)

Exigir **um** dos seguintes:

1. Arquivo **SPEC** preenchido a partir do template, **ou**
2. ≥ **3** perguntas socráticas **respondidas** registradas no SPEC ou no PLAN.

Sem gate → **não** avançar para plan/implement/orquestração (instrução aos agents/commands; não há bloqueio por tooling — ver E-02 em `upgrade.md`). Detalhes: skill `brainstorming`, `AGENTS.md` § Socratic Gate.

Templates: `SPEC.template.md`, `PLAN.template.md`, `ACCEPTANCE.template.md`. Trace opcional: `.axion/trace/{slug}.json`.

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

| Comando | FSM | Skill / agent principal | Uso |
| --- | --- | --- | --- |
| `/brainstorm` | discover/specify | `brainstorming` | Explorar + produzir SPEC; alimenta o gate |
| `/plan` | plan | `plan-writing`, `architecture` | PLAN estruturado (**gate**) |
| `/create` | implement | `app-builder` | Nova feature/app (**gate**) |
| `/enhance` | implement | domain agents | Melhorar código existente |
| `/verify` | verify | `verify-changes` | Roda os AC-*, grava evidência, marca `[x]`; `verify_gate.py` exit 0 fecha a tarefa |
| `/remember` | remember | `memory-system` | Persistir em `.agents/memory/` |
| `/orchestrate` | — (multi) | `parallel-agents` + `orchestrator` | Multi-agente (mín. 3) (**gate**) |
| `/coordinate` | — (multi) | `coordinator-mode` + `orchestrator` | Orquestração avançada paralela |
| `/debug` | — | `systematic-debugging` | Debug baseado em evidência |
| `/deploy` | — | `deployment-procedures` | Pré-flight + deploy |
| `/preview` | — | `auto_preview.py` | Preview local |
| `/status` | — | — | Relatório de progresso |
| `/test` | — (apoio verify) | `testing-patterns`, `webapp-testing` | Testes |
| `/ui-ux-pro-max` | — | `.cursor/shared/ui-ux-pro-max` | **Cursor-only** — design |

> **Cursor:** argumentos são texto livre após o comando (ex.: `/plan auth JWT`), não `$ARGUMENTS`.
> **Gate:** `/plan`, `/create`, `/orchestrate` exigem SPEC **ou** ≥3 respostas socráticas no SPEC/PLAN.

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

## Convenções no Cursor

| Recurso | No Axion |
| --- | --- |
| Instalação | `npx @zanetta/axion init` |
| Roteamento de agents | Referência em `intelligent-routing`; o agente aplica manualmente |
| Regras | `AGENTS.md` + rules por glob |
| Argumentos de workflow | Texto livre após `/comando` |
| Agents | `.claude/agents/` |
| Slash commands | `.cursor/commands/` |

---

## 🔗 Referências

- Arquitetura: `.cursor/ARCHITECTURE.md`
- Regras globais: `AGENTS.md`
- CLI npm: `cli/README.md`
- Sync: `python3 .cursor/scripts/sync_upstream.py`
- Repositório: https://github.com/zanetta/axion

**Last Updated:** 2026-10-30 · **npm:** `@zanetta/axion@1.1.0` · FSM SDD P1
