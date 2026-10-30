# AGENTS.md

> Regras sempre-ativas deste workspace.
> Para o índice completo de agentes, skills, workflows e scripts, veja `.cursor/ARCHITECTURE.md`.

---

## 🌐 Language Handling

Quando o prompt do usuário NÃO estiver em inglês:

1. Traduza internamente para melhor compreensão.
2. **Responda no idioma do usuário** — corresponda à comunicação dele.
3. Comentários de código e nomes de variáveis permanecem em inglês.

---

## 🧹 Clean Code (Global Mandatory)

Todo código DEVE seguir as regras de `.agents/skills/clean-code/SKILL.md`. Sem exceções.

- **Código**: conciso, direto, sem over-engineering, auto-documentado.
- **Testes**: obrigatórios. Pirâmide (Unit > Int > E2E) + padrão AAA.
- **Performance**: medir primeiro. Aderir aos padrões 2025 (Core Web Vitals).
- **Infra/Segurança**: deploy em 5 fases. Verificar segredos.

---

## 📁 File Dependency Awareness

Antes de modificar QUALQUER arquivo:

1. Verifique `CODEBASE.md` (se existir) → File Dependencies.
2. Identifique arquivos dependentes (quem importa o alvo? o que ele importa?).
3. Atualize TODOS os arquivos afetados juntos.

> 🔴 Edite o arquivo + todos os dependentes na MESMA tarefa. Nunca deixe imports quebrados.

---

## 🗺️ Path Awareness (caminhos pós-migração)

| Recurso             | Caminho canônico                           |
| ------------------- | ------------------------------------------ |
| **Agents/Personas** | `.claude/agents/<name>.md`                 |
| **Skills**          | `.agents/skills/<name>/SKILL.md`           |
| **Workflows**       | `.cursor/commands/<name>.md` (`/<name>`)   |
| **MCP**             | `.cursor/mcp.json`                         |
| **Runtime scripts** | `.cursor/scripts/` (master: `checklist.py`, `verify_gate.py`, `verify_all.py`, `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py`, …) e `.agents/skills/<x>/scripts/` (por skill) |
| **Shared assets**   | `.cursor/shared/` (ex.: `ui-ux-pro-max`)   |
| **Rules globais**   | `AGENTS.md` (este arquivo) — sempre aplicado |
| **Rules por glob**  | `.cursor/rules/*.mdc` — Auto-Attached por domínio (frontend, backend, database, testing, security, mobile, devops) |
| **Memória persistente** | `.agents/memory/MEMORY.md` — `memory_secret_scan.py` antes de gravar |
| **Estado do kit (`.axion/`)** | `.axion/kit.manifest.json` — SemVer + profile; gravado no `init`/`update`; lido pelo `status` |
| **Inventário** | `.axion/inventory.json` — `python3 .cursor/scripts/generate_inventory.py .` |
| **Templates SDD** | SPEC/PLAN: `.agents/skills/plan-writing/templates/`; ACCEPTANCE: `.agents/skills/verify-changes/templates/` |
| **Traceability** | `.axion/trace/` — opcional `{slug}.json`; leitor `python3 .cursor/scripts/trace_report.py . {slug}` |
| **Contratos (schemas)** | `.agents/schemas/` — `skill-contract.schema.json`, `command-contract.schema.json` |
| **CLI npm (instalar kit)** | `npx @zanetta/axion init [--profile …] [--enable-offensive]` · código em `cli/` |
| **Doc do kit**      | `.cursor/ARCHITECTURE.md`, `AGENT_FLOW.md`, `README.md`, `upgrade.md` |
| **MCP env vars**    | `.env` (no `.gitignore`); template em `.env.example` |

> O Cursor lê `.agents/skills/`, `.claude/agents/`, `.cursor/commands/`, `.cursor/rules/`, `.cursor/mcp.json` e `AGENTS.md` nativamente.

---

## 🧠 Read → Understand → Apply

```text
❌ ERRADO:    Ler arquivo do agent → começar a codificar
✅ CORRETO:   Ler → entender o PORQUÊ → aplicar PRINCÍPIOS → codificar
```

Antes de codificar, responda:

1. Qual é o OBJETIVO deste agent/skill?
2. Quais PRINCÍPIOS devo aplicar?
3. Como isso DIFERE de uma saída genérica?

---

## 🤖 Project Type Routing

| Tipo de projeto                          | Subagent / persona indicado            | Skills relevantes                |
| ---------------------------------------- | -------------------------------------- | -------------------------------- |
| **MOBILE** (iOS, Android, RN, Flutter)   | `mobile-developer`                     | `mobile-design`                  |
| **WEB** (Next.js, React web)             | `frontend-specialist`                  | `frontend-design`, `nextjs-react-expert`, `tailwind-patterns` |
| **BACKEND** (API, server, DB)            | `backend-specialist`                   | `api-patterns`, `database-design`, `nodejs-best-practices`    |
| **Database**                             | `database-architect`                   | `database-design`                |
| **Segurança / Auditoria**                | `security-auditor`, `penetration-tester` | `vulnerability-scanner`, `red-team-tactics` |
| **Testing / QA**                         | `test-engineer`, `qa-automation-engineer` | `testing-patterns`, `tdd-workflow`, `webapp-testing` |
| **Debug**                                | `debugger`                             | `systematic-debugging`           |
| **DevOps / Deploy**                      | `devops-engineer`                      | `deployment-procedures`, `server-management` |
| **Planejamento / Discovery**             | `project-planner`                      | `brainstorming`, `plan-writing`, `architecture` |
| **Multi-domínio / complexo**             | `orchestrator`                         | `coordinator-mode`, `parallel-agents`, `memory-system`, `verify-changes` |

> Mobile + frontend-specialist = **ERRADO**. Mobile → `mobile-developer`.

---

## 🛑 Socratic Gate (para tarefas complexas)

FSM: `discover → specify → plan → implement → verify → remember` (commands: `/brainstorm` → `/plan` → `/create`\|`/enhance` → `/verify` → `/remember`).

| Tipo de pedido            | Ação obrigatória                                                  |
| ------------------------- | ----------------------------------------------------------------- |
| **Nova feature / Build**  | Faça mín. 3 perguntas estratégicas antes de codar                 |
| **Edit / Bug fix**        | Confirme entendimento + faça perguntas sobre impacto              |
| **Vago / Simples**        | Esclareça Propósito, Usuários e Escopo                            |
| **Orquestração total**    | **PAUSE** subagents até o usuário confirmar o plano               |
| **"Proceed" direto**      | Mesmo com respostas, faça 2 perguntas de Edge Case antes de iniciar |

**Gate (instrução ao agent, sem enforcement por tooling):** antes de `/plan`, `/create` ou `/orchestrate` — exigir arquivo **SPEC** **ou** ≥3 perguntas respondidas registradas no SPEC/PLAN (templates em `plan-writing` / `verify-changes`).

Protocolo:

1. **Nunca presuma.** Se 1% estiver obscuro, pergunte.
2. **Não pule a porta** mesmo quando o usuário dá uma lista de respostas — pergunte sobre trade-offs e edge cases.
3. **Espere.** Não invoque subagents nem escreva código até a porta liberar.
4. Referência completa: `.agents/skills/brainstorming/SKILL.md`.

---

## 🏁 Final Checklist (auditoria de tarefa)

Quando o usuário disser "finalize", "rode os checks", "valida tudo" ou similar:

| Estágio          | Comando                                                | Propósito                    |
| ---------------- | ------------------------------------------------------ | ---------------------------- |
| **Auditoria**    | `python3 .cursor/scripts/checklist.py .`                | Auditoria por prioridade     |
| **Pre-Deploy**   | `python3 .cursor/scripts/checklist.py . --url <URL>`    | Suite completa + Performance |
| **Verify All**   | `python3 .cursor/scripts/verify_all.py .`               | Auditoria abrangente         |
| **Sync**         | `python3 .cursor/scripts/sync_upstream.py --apply`      | Paridade com zanetta/axion   |
| **Path lint**    | `python3 .cursor/scripts/lint_paths.py .`               | Drift `.agents/scripts/`     |
| **Contract lint** | `python3 .cursor/scripts/lint_contracts.py .`          | Frontmatter vs schemas (requer `pyyaml` + `jsonschema`) |
| **Inventory parity** | `python3 .cursor/scripts/lint_inventory.py .`       | Contagens da overview e do `inventory.json` vs filesystem |

**Ordem de prioridade**: Segurança → Lint → Schema → Tests → UX → SEO → Lighthouse/E2E.

**Regras**:

- Tarefa NÃO está concluída até `checklist.py` retornar sucesso.
- **Hard gate (W-03):** `/verify` só fecha com `python3 .cursor/scripts/verify_gate.py . --acceptance {slug}.acceptance.md` em exit 0 (AC-* em `[x]` com evidência, sign-off fechado, `checklist.py` ok). Exit 1 = tarefa não verificada.
- **Run log (O-01):** depois do gate, `python3 .cursor/scripts/session_manager.py log . --command-name verify --slug {slug} --exit <exit-do-gate> --artifact {slug}.acceptance.md` (append-only em `.axion/logs/runs.jsonl`). O número é o exit do gate: se não for 0, registre-o e pare o relatório. Token ou path inválido → exit 2, nada gravado.
- **Write allowlist (X-03):** antes de gravar, `python3 .cursor/scripts/side_effect_guard.py . --plan {slug}.plan.md --effect write-files --write <path>`; exit 1 recusa — mantenha a allowlist e honre o exit code.
- Se falhar, corrija os blockers **Críticos** primeiro (Segurança/Lint).

**Scripts disponíveis** (caminho: `.agents/skills/<skill>/scripts/`):

| Script                     | Skill                   | Quando usar           |
| -------------------------- | ----------------------- | --------------------- |
| `security_scan.py`         | `vulnerability-scanner` | Sempre no deploy      |
| `dependency_analyzer.py`   | `vulnerability-scanner` | Semanal / Deploy      |
| `lint_runner.py`           | `lint-and-validate`     | Toda mudança de código |
| `test_runner.py`           | `testing-patterns`      | Após mudança de lógica |
| `schema_validator.py`      | `database-design`       | Após mudança de DB    |
| `ux_audit.py`              | `frontend-design`       | Após mudança de UI    |
| `accessibility_checker.py` | `frontend-design`       | Após mudança de UI    |
| `seo_checker.py`           | `seo-fundamentals`      | Após mudança de página |
| `bundle_analyzer.py`       | `performance-profiling` | Antes do deploy       |
| `mobile_audit.py`          | `mobile-design`         | Após mudança mobile   |
| `lighthouse_audit.py`      | `performance-profiling` | Antes do deploy       |
| `playwright_runner.py`     | `webapp-testing`        | Antes do deploy       |

---

## 🎨 Design Rules (Web/Mobile)

Regras de design estão dentro dos arquivos de cada subagent — **não aqui**.

| Tarefa        | Leia                                              |
| ------------- | ------------------------------------------------- |
| Web UI/UX     | `.claude/agents/frontend-specialist.md`           |
| Mobile UI/UX  | `.claude/agents/mobile-developer.md`              |

Esses agents contêm:

- **Purple Ban** (sem tons de roxo/violeta)
- **Template Ban** (sem layouts padronizados)
- Regras anti-clichê
- Protocolo de Deep Design Thinking

> Para trabalho de design: ABRA e LEIA o arquivo do agent.

---

## 📚 Quick Reference

**Subagents principais** (em `.claude/agents/`):
`orchestrator`, `project-planner`, `security-auditor`, `backend-specialist`, `frontend-specialist`, `mobile-developer`, `debugger`, `game-developer`.

**Skills-chave** (em `.agents/skills/`):
`clean-code`, `brainstorming`, `app-builder`, `frontend-design`, `mobile-design`, `plan-writing`, `coordinator-mode`, `memory-system`, `verify-changes`, `parallel-agents`.

**CLI npm:** `@zanetta/axion` — `init [--profile minimal|standard|security|fullstack|mobile] [--enable-offensive]`, `update`, `status` ([`cli/README.md`](cli/README.md)).

**Slash commands** (em `.cursor/commands/`):
`/brainstorm`, `/coordinate`, `/create`, `/debug`, `/deploy`, `/enhance`, `/orchestrate`, `/plan`, `/preview`, `/remember`, `/status`, `/test`, `/ui-ux-pro-max`, `/verify`.

---

## ⚠️ Limitações no Cursor

| Recurso | Status no Cursor |
| ----------------------------- | ---------------- |
| **Tier system** (P0/P1/P2)    | Não aplicado — Cursor usa precedência Enterprise→Team→Project→User |
| **Auto agent routing** ("🤖 Applying knowledge of @agent…") | Não automático — o Cursor delega subagents apenas quando o modelo decide ou o usuário usa `/agent` |
| **`$ARGUMENTS` em workflows** | Substituído — argumentos vão como texto livre após o `/comando` |
| **Modo Plan/Edit/Ask** declarado em arquivo | Cursor tem modos nativos (Plan, Ask, Agent, Debug) — não configuráveis por arquivo |
| **Skill `intelligent-routing`** auto-aplicada | Vira apenas referência; o Cursor não força roteamento por palavras-chave |

Para reativar auto-routing equivalente, considere:

- Adicionar mais regras em `.cursor/rules/*.mdc` com `globs:` apontando para diretórios de cada domínio (ex.: `src/components/**/*.tsx` → frontend rules).
- Criar Skills com `paths:` no frontmatter para auto-attach por arquivo.
