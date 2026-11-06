# 🔄 Agent Flow Architecture

> Fluxo de agentes, skills e validação do Axion. Cursor é o adapter default (`--tool cursor`); Claude Code (`--tool claude-code`), OpenAI Codex (`--tool codex`), Windsurf (`--tool windsurf`) e Google Antigravity (`--tool antigravity`) também são suportados.

---

## 📦 Instalação do kit

```bash
cd ~/dev/seu-projeto
NPM_CONFIG_MIN_RELEASE_AGE=0 npx @zanetta/axion init
cp .env.example .env   # opcional — MCP Context7
```

| Modo | Comportamento |
| --- | --- |
| `init` (padrão) | Profile do manifesto (senão **`standard`**) + **`--tool cursor`** + **merge** (`mcp.json`, rules existentes preservados) |
| `init --tool <id>` | `cursor` (default) \| `claude-code` \| `codex` \| `windsurf` \| `antigravity` — projeta o pack nos paths nativos da ferramenta (`--tool codex` faz projeção híbrida: `.agents/skills/`, `.agents/shared/`, `.codex/config.toml`, `AGENTS.md`, `.axion/scripts/`; `--tool windsurf` faz projeção híbrida: `.agents/skills/`, `.agents/shared/`, `.windsurf/mcp_config.json`, `AGENTS.md`, `.axion/scripts/`; `--tool antigravity` faz projeção nativa: `.agents/workflows/`, `.agents/rules/`, `.agents/skills/`, `.agents/mcp_config.json`, `AGENTS.md`, `GEMINI.md`) |
| `init --profile <name>` | `minimal` \| `standard` \| `security` \| `fullstack` \| `mobile` (filtra na cópia; nunca apaga arquivos já instalados) |
| `init --enable-offensive` | Inclui `red-team-tactics` + `penetration-tester` (ou use `--profile security`) |
| `init --force` | Sobrescreve todos os arquivos do kit |
| `update` | Baixa template atual e faz merge; herda `profile`/`enable_offensive`/`tool` do manifesto |
| `status` | Lê `.axion/kit.manifest.json` + verifica os markers do adapter (`tool`) |

Pacote: [`@zanetta/axion`](https://www.npmjs.com/package/@zanetta/axion) · troubleshooting: [`cli/README.md`](cli/README.md)

---

## 🔀 FSM SDD — commands ↔ estados

```plaintext
discover → specify → plan → implement → verify → remember
```

| Estado FSM | Command | Artefato / saída |
| --- | --- | --- |
| `discover` | `/discover` | Notas de exploração + opções (sem fechar `{slug}.spec.md`) |
| `specify` | `/specify` | `{slug}.spec.md` (template em `.agents/skills/plan-writing/templates/SPEC.template.md`) |
| `plan` | `/plan` | `{slug}.plan.md` + `{slug}.acceptance.md` (+ Traceability → SPEC/ACCEPTANCE) |
| `implement` | `/implement` | Código alinhado ao PLAN (unifica app novo e código existente) |
| `verify` | `/verify` | ACCEPTANCE + evidência de execução |
| `remember` | `/remember` | `.agents/memory/` |

Commands de apoio (fora da FSM linear): `/debug`, `/test`, `/preview`, `/status`, `/deploy`, `/orchestrate`, `/design`.

### Socratic Gate (antes de `/plan`, `/implement`, `/orchestrate`)

Exigir **um** dos seguintes:

1. Arquivo **SPEC** preenchido a partir do template, **ou**
2. ≥ **3** perguntas socráticas **respondidas** registradas no SPEC ou no PLAN.

Sem gate → **não** avançar para plan/implement/orquestração (instrução aos agents/commands; o IDE não bloqueia a transição). O eval E-02 (`python3 .axion/scripts/eval_routing.py . --gates`) regressa essa regra. Detalhes: skill `brainstorming`, `AGENTS.md` § Socratic Gate.

Templates: `SPEC.template.md`, `PLAN.template.md`, `ACCEPTANCE.template.md`. Trace opcional: `.axion/trace/{slug}.json` — leitor `python3 .axion/scripts/trace_report.py . {slug}` (não reexecuta os checks).

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
         │      VALIDATION (.axion/scripts/)  │
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
| `/discover` | discover | `brainstorming` | Explorar opções e perguntas socráticas (sem fechar SPEC) |
| `/specify` | specify | `brainstorming`, `plan-writing` | Fechar `{slug}.spec.md` após o Socratic Gate |
| `/plan` | plan | `plan-writing`, `architecture` | PLAN estruturado (**gate**) |
| `/implement` | implement | `app-builder`, `plan-writing`, domain agents | Construir app novo ou evoluir código existente (**gate**) |
| `/verify` | verify | `verify-changes` | Roda os AC-*, grava evidência, marca `[x]`; roda `python3 .axion/scripts/checklist.py .` antes do gate; o gate roda o checklist de novo; exit 0 fecha a tarefa |
| `/remember` | remember | `memory-system` | Persistir em `.agents/memory/` |
| `/orchestrate` | — (multi) | `parallel-agents`, `coordinator-mode` + `orchestrator` | Multi-agente (mín. 3) e coordenação paralela (**gate**) |
| `/debug` | — | `systematic-debugging` | Debug baseado em evidência |
| `/deploy` | — | `deployment-procedures` | Pré-flight + deploy |
| `/preview` | — | `auto_preview.py` | Preview local |
| `/status` | — | — | Relatório de progresso |
| `/test` | — (apoio verify) | `testing-patterns`, `webapp-testing` | Testes |
| `/design` | — | `.agents/shared/ui-ux-pro-max` | Design system (slash no Cursor, Claude Code e workflows Antigravity; skill `design-guide` nos cinco tools) |

> **Cursor:** argumentos são texto livre após o comando (ex.: `/plan auth JWT`), não `$ARGUMENTS`.
> **Gate:** `/plan`, `/implement`, `/orchestrate` exigem SPEC **ou** ≥3 respostas socráticas no SPEC/PLAN.

---

## 🤖 Agent Selection Matrix

| Domínio | Agent | Skills típicas |
| --- | --- | --- |
| UI/UX Web | `frontend-specialist` | `nextjs-react-expert`, `frontend-design`, `tailwind-patterns`, `design-guide` |
| API | `backend-specialist` | `api-patterns`, `auth-patterns`, `nodejs-best-practices` |
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
python3 .axion/scripts/checklist.py .
```

**Pre-deploy:**

```bash
python3 .axion/scripts/verify_all.py . --url http://localhost:3000
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
- Sync: `python3 .axion/scripts/sync_upstream.py`
- Repositório: https://github.com/zanetta/axion

**Last Updated:** 2026-11-04 · **npm:** `@zanetta/axion@1.1.3` · FSM SDD P1
