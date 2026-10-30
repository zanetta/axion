# upgrade.md — Backlog SDD para Axion

Documento de engenharia: evoluir o **Axion** de um pack instalável de agents e skills para um framework de **Spec-Driven Development (SDD)** com contratos, gates e observabilidade.

| | |
| --- | --- |
| **Estado atual** | Pack de agents (`.claude/agents/`), skills (`.agents/skills/`), commands (`.cursor/commands/`), rules (`.cursor/rules/`), memória (`.agents/memory/`), scripts (`.cursor/scripts/`) e CLI npm `@zanetta/axion` (`cli/`) |
| **Já existe** | `coordinator-mode`, `memory-system`, `verify-changes`, `sync_upstream.py`, publish npm, merge no `init` |
| **Público** | Maintainers do kit e consumidores que instalam via `npx @zanetta/axion` |

### Objetivo

Tornar skills/commands **contratos verificáveis**, introduzir artefatos SPEC/PLAN/ACCEPTANCE, gates de qualidade reforçados e telemetria mínima do kit instalado — sem abandonar a compatibilidade com a estrutura Cursor nativa.

### Escopo

- Kernel/manifest do kit, contratos de skill/command, artefatos SDD, FSM de workflows, CI de paths/lint, DX/CLI (SemVer + profiles), observabilidade, hardening de segurança e harness de eval de roteamento.
- Paths canônicos já documentados em `AGENTS.md` e `.cursor/ARCHITECTURE.md`.

### Fora de escopo (non-goals)

- Reescrever o kit como produto SaaS ou runtime proprietário fora do Cursor.
- Substituir o Cursor Plan/Ask/Agent modes por um motor próprio.
- Auto-routing hard-enforced pelo IDE (limitação compat-first documentada em `AGENTS.md`).
- Features não listadas na análise de melhoria (ver § Anti-escopo).

---

## Legenda de prioridade

| Prioridade | Significado | Critério de inclusão |
| --- | --- | --- |
| **P0** | Fundação | Desbloqueia SemVer, contratos e correção de drift; sem isso o SDD não fecha |
| **P1** | Núcleo SDD | Spec → plan → acceptance → verify; gates e profiles de instalação |
| **P2** | Maturidade de engenharia | CI, lint de paths, observabilidade, scanner de segredos |
| **P3** | Avançado | Eval harness, circuit breaker, telemetria rica |

**Esforço:** S = ≤2 dias · M = ~1 semana · L = >1 semana / multi-PR.

---

## Backlog por tema

### 1. Kernel / Manifest

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| K-01 | P0 | Manifesto do kit instalado | Introduzir arquivo de manifesto com versão SemVer do kit, data de install/update, perfil aplicado e checksum/lista de componentes. Gravado no projeto consumidor pelo CLI. | Hoje `status`/`update` não têm fonte canônica de “qual kit está instalado”; SemVer npm ≠ estado no repo. | `.axion/kit.manifest.json` (ou `.cursor/axion.manifest.json`); escrita em `cli/lib/install.js`; leitura em `cli/bin/index.js` (`status`/`update`) | M | — |
| K-02 | P0 | Schema de contrato de skill | Definir frontmatter/schema obrigatório além do atual (`name`, `description`): `inputs`, `outputs`, `preconditions`, `postconditions`, `side_effects`, `forbidden_paths`, `verify_hooks`. Skills passam de procedimento para contrato. | Skills em `.agents/skills/*/SKILL.md` são narrativas; não há máquina de verificação. | `.agents/schemas/skill-contract.schema.json`; atualizar skills-piloto: `brainstorming`, `plan-writing`, `verify-changes`, `coordinator-mode` | M | — |
| K-03 | P0 | Schema de contrato de command | Espelhar contratos nos workflows `.cursor/commands/*.md`: estados permitidos, artefatos obrigatórios de saída, scripts canônicos (só `.cursor/scripts/`). | Commands misturam instrução e path legado (`.agents/scripts`). | `.agents/schemas/command-contract.schema.json`; alinhar `/plan`, `/verify`, `/status`, `/orchestrate` | M | K-02 |
| K-04 | P1 | Inventário versionado de componentes | Gerar inventário machine-readable de agents/skills/commands/rules/scripts a partir do repo, consumido por sync e status. | `.cursor/ARCHITECTURE.md` e counts driftam; `sync_upstream.py` precisa de fonte única. | `.axion/inventory.json` gerado por script; hook opcional no CI | M | K-01 |

### 2. Spec artifacts

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S-01 | P1 | Template SPEC | Artefato `SPEC.md` (ou `{slug}.spec.md`) com problema, actors, constraints, non-goals, interfaces, riscos. Produzido após Socratic Gate. | Sem spec, `/plan` gera plano solto e agents improvisam. | `.agents/skills/plan-writing/templates/SPEC.template.md`; referência em `.cursor/commands/brainstorm.md` e `.cursor/commands/plan.md` | S | K-02 |
| S-02 | P1 | Template PLAN estruturado | Substituir `{task-slug}.md` livre por schema: fases, deps, agents, skills, critérios de done, links para SPEC/ACCEPTANCE. Manter naming dinâmico do `project-planner`. | `plan.md` / plans atuais são checklist narrativo; difícil gatear. | `.agents/skills/plan-writing/templates/PLAN.template.md`; atualizar `.claude/agents/project-planner.md`, `.cursor/commands/plan.md` | M | S-01 |
| S-03 | P1 | Template ACCEPTANCE | Critérios testáveis (Given/When/Then ou checklist verificável) + comandos de verify sugeridos (`checklist.py`, `verify_all.py`). | Verify-changes existe, mas não há contrato de aceite amarrado ao plano. | `.agents/skills/verify-changes/templates/ACCEPTANCE.template.md`; link em `/verify` | S | S-02 |
| S-04 | P1 | Traceability matrix leve | IDs SPEC ↔ tasks PLAN ↔ checks ACCEPTANCE; referência cruzada obrigatória no orchestrator antes de codar. | Sem rastreio, “done” é subjetivo e doc drift aumenta. | Seção `Traceability` nos templates; opcional `.axion/trace/{slug}.json` | M | S-01, S-02, S-03 |

### 3. Workflows / FSM

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W-01 | P1 | FSM SDD mínima | Estados: `discover → specify → plan → implement → verify → remember`. Commands mapeados (`/brainstorm`, `/plan`, `/create`\|`/enhance`, `/verify`, `/remember`). Transições bloqueadas sem artefato predecessor. | Socratic Gate e fases existem em prosa (`AGENTS.md`, agents) mas não são enforceable. | Documentar FSM em `.cursor/ARCHITECTURE.md` + `AGENT_FLOW.md`; checklist de transição nos commands | M | S-01..S-03 |
| W-02 | P1 | Enforce Socratic Gate | Antes de `/plan`, `/create`, `/orchestrate`: exigir evidência de ≥3 perguntas respondidas (arquivo de discovery ou seção no SPEC). Orchestrator não despacha workers sem gate. | Gate documentado em `brainstorming`, `orchestrator`, `project-planner` é frequentemente pulado. | Atualizar `.cursor/commands/{brainstorm,plan,create,orchestrate}.md`; `.agents/skills/brainstorming/SKILL.md`; `.claude/agents/orchestrator.md` | M | W-01, S-01 |
| W-03 | P2 | Verify como gate hard | `/verify` e skill `verify-changes` passam a falhar a tarefa se ACCEPTANCE incompleto ou `checklist.py` retornar crítico. | Final Checklist em `AGENTS.md` é política; falta amarração ao workflow. | `.cursor/commands/verify.md`; `.agents/skills/verify-changes/SKILL.md`; integrar exit codes de `.cursor/scripts/checklist.py` | M | S-03, W-01 |
| W-04 | P3 | Circuit breaker na orquestração | Em `coordinator-mode` / `/coordinate` / `/orchestrate`: limite de retries, cancelamento se N workers falham no mesmo domínio, fallback para síntese parcial + relatório. | Orquestração paralela pode loopar custo/tokens sem critério de parada. | `.agents/skills/coordinator-mode/SKILL.md`; `.agents/skills/parallel-agents/SKILL.md`; `.cursor/commands/coordinate.md` | M | W-01, O-01 |

### 4. Quality / CI

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Q-01 | P0 | Lint de path drift | Scanner CI que falha se docs/commands/skills referenciam `.agents/scripts/` em vez de `.cursor/scripts/` (exceto menção histórica em ARCHITECTURE). Corrigir ocorrências atuais (`enhance.md`, `preview.md`, `status.md`). | Drift já conhecido; `sync_upstream.py` remapeia no sync, mas o pack shippa paths quebrados. | `.cursor/scripts/lint_paths.py`; job em `.github/workflows/`; fix nos commands afetados | S | — |
| Q-02 | P2 | Validador de contratos | CI valida frontmatter das skills/commands contra schemas K-02/K-03; falha em skills-piloto, depois em 100%. | Contratos sem CI viram doc morta. | Extensão de `lint_paths.py` ou `.cursor/scripts/lint_contracts.py`; testes em `cli/test/` | M | K-02, K-03 |
| Q-03 | P2 | Doc-inventory parity | Diff ARCHITECTURE counts vs filesystem (agents/skills/commands/rules/scripts); falha se divergir. | Doc drift é fraqueza explícita. | Script + referência a `.cursor/ARCHITECTURE.md` | S | K-04 |
| Q-04 | P2 | Hook pre-publish | Antes de tag `v*`, rodar lint paths + contracts + `cli` tests (além do workflow publish atual). | Publish npm já existe; falta gate de conteúdo do pack. | `.github/workflows/publish-npm.yml` ou workflow `ci.yml` | S | Q-01, Q-02 |

### 5. DX / CLI

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D-01 | P0 | SemVer do kit no projeto | `init`/`update` gravam versão do pacote npm + git SHA do template no manifesto; `status` exibe installed vs latest registry. | Usuário não sabe se o projeto está atrás do registry. | `cli/lib/install.js`, `cli/bin/index.js`; campo em K-01 | S | K-01 |
| D-02 | P1 | Profiles no `init` | Profiles: `minimal` (AGENTS + core skills + rules), `standard` (atual full), `security` (inclui offensive sob opt-in), `fullstack` / `mobile` (subsets). Default: `standard`. | Install full sempre aumenta superfície (red-team sempre disponível). | `cli/lib/profiles.js`; flags `--profile`; docs em `cli/README.md` | L | K-01, X-01 |
| D-03 | P2 | `update` consciente de manifesto | `update` compara manifesto, lista drift de arquivos locais vs pack, oferece merge/force por path; não sobrescreve SPEC/PLAN do usuário. | Update atual é cópia/merge grosseiro. | `cli/lib/install.js`; testes `cli/test/` | M | K-01, D-01 |
| D-04 | P2 | Doctor / status enriquecido | `/status` + CLI `status`: versão kit, profile, path lint summary, memory index size, último verify. | Observabilidade do kit instalado é fraca. | `.cursor/commands/status.md`; `cli/bin/index.js`; `.cursor/scripts/session_manager.py` | M | K-01, O-01 |

### 6. Observability

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O-01 | P2 | Session / run log estruturado | Append-only log local de runs de command (command, slug, artefatos tocados, exit verify). Sem PII. | Pouca observabilidade entre sessões além de `.agents/memory/`. | `.axion/logs/runs.jsonl`; integração leve em `/verify` e `session_manager.py` | M | K-01 |
| O-02 | P2 | Traceability report | Comando/script que imprime cobertura SPEC→ACCEPTANCE→checks para um slug. | Fecha o loop SDD para humanos e CI local. | `.cursor/scripts/trace_report.py`; menção em `/verify` | S | S-04 |
| O-03 | P3 | Métricas de orquestração | Contadores: workers lançados, falhas, tempo estimado, circuit-breaker trips — no run log. | Necessário para calibrar W-04 e custo. | Extensão de O-01 + `coordinator-mode` | M | O-01, W-04 |

### 7. Security

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| X-01 | P1 | Profile / flag para skills ofensivas | `red-team-tactics`, agent `penetration-tester` (e refs em `security-auditor`) só instalam ou só ativam com `--profile security` ou `--enable-offensive`. Default off em `minimal`/`standard`. | Superfície ofensiva sempre disponível no pack full. | Profiles D-02; `.agents/skills/red-team-tactics/`; `.claude/agents/penetration-tester.md`; nota em `.cursor/rules/security.mdc` | M | D-02 |
| X-02 | P2 | Memory secret scanner | Antes de escrever em `.agents/memory/**`, scanear padrões de secrets (tokens, keys, `.env` values); recusar ou redigir. | Memory persiste texto livre (`/remember`, `memory-system`). | `.agents/skills/memory-system/`; script `.cursor/scripts/memory_secret_scan.py`; `.cursor/commands/remember.md` | M | — |
| X-03 | P2 | Allowlist de side_effects | Contratos K-02 declaram side effects; orchestrator/coordinator não grava fora de allowlist do PLAN. | Reduz blast radius de batch-operations / skills de write. | Convenção nos contracts + texto em `coordinator-mode` | S | K-02, S-02 |

### 8. Eval

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E-01 | P3 | Golden cases de roteamento | Suite de prompts → agent/skill esperado (ex.: mobile ≠ frontend-specialist), assert contra `intelligent-routing` / tabelas `AGENTS.md`. | Sem eval, regressões de routing são invisíveis. | `.axion/eval/routing.cases.json`; runner `.cursor/scripts/eval_routing.py` (checagem estática de regras + fixtures) | L | K-04 |
| E-02 | P3 | Eval de FSM / gates | Casos: plan sem SPEC → fail; verify sem ACCEPTANCE → fail; path `.agents/scripts` → fail lint. | Garante que P0/P1 não regredam. | Extensão do harness E-01; CI job opcional | M | W-01, Q-01, S-03 |
| E-03 | P3 | Smoke do pack pós-install | Após `init --profile standard` em temp dir: inventário mínimo presente, manifesto válido, lint paths clean. | Protege consumidores npm. | `cli/test/install.test.js` + fixtures em `cli/test/fixtures/` | M | D-01, D-02, Q-01 |

---

## Roadmap recomendado (fases)

### Fase 0 — Fundação (P0)

1. **Q-01** — Corrigir path drift e adicionar `lint_paths.py` + CI.
2. **K-01 + D-01** — Manifesto + SemVer do kit instalado no `status`/`update`.
3. **K-02 + K-03** — Schemas de contrato (skills/commands) e piloto em 4 skills + 4 commands.

*Saída:* pack com paths corretos, versão observável, contratos versionados.

### Fase 1 — Núcleo SDD (P1)

1. **S-01 → S-02 → S-03 → S-04** — Templates SPEC/PLAN/ACCEPTANCE + traceability.
2. **W-01 + W-02** — FSM documentada + Socratic Gate enforceable via artefatos.
3. **D-02 + X-01** — Profiles no `init` e offensive opt-in.
4. **K-04** — Inventário gerado (alimenta sync/status).

*Saída:* fluxo discover→specify→plan→verify com artefatos; install por perfil.

### Fase 2 — Maturidade (P2)

1. **W-03** — Verify hard-gate.
2. **Q-02, Q-03, Q-04** — Contracts CI, parity docs, pre-publish.
3. **O-01, O-02, D-03, D-04** — Logs, trace report, update/status ricos.
4. **X-02, X-03** — Secret scan na memory + allowlist de side effects.

*Saída:* kit “shippable” com CI de conteúdo e observabilidade local.

### Fase 3 — Avançado (P3)

1. **W-04 + O-03** — Circuit breaker + métricas de orquestração.
2. **E-01 → E-02 → E-03** — Eval de routing, gates e smoke pós-install.

*Saída:* regressão automática de routing/gates e orquestração resiliente.

---

## Anti-escopo (não fazer em breve)

| Não fazer | Por quê |
| --- | --- |
| Runtime/agent host fora do Cursor | Sai do modelo compat-first; custo alto, pouco alinhado ao port |
| Tier system P0/P1/P2 de agents no IDE | Cursor não aplica; já documentado como limitação em `AGENTS.md` |
| Auto-routing hard pelo produto | IDE não força; eval (E-01) é o substituto honesto |
| Dashboard web / telemetria cloud | Observabilidade deve ser local (`.axion/logs`) primeiro |
| Renomear em massa `.claude/agents` → outro tree | Quebra os paths que o Cursor e o sync já usam |
| Unificar todos os scripts de skill em um monólito | Manter master em `.cursor/scripts/` + per-skill em `.agents/skills/<name>/scripts/` |
| Gerar apps completos “SDD magic” além de `app-builder` | Escopo é framework de processo, não novo codegen |
| Remover `penetration-tester` / `red-team-tactics` do monorepo | Preferir profile opt-in (X-01), não apagar capacidade de quem precisa |
| Substituir `MEMORY.md` por vector DB | Over-engineering; scanner (X-02) basta no P2 |
| Expandir MCP surface sem contrato | Fora da análise; `.cursor/mcp.json` permanece merge-only |

---

## Referência rápida de paths existentes

| Recurso | Path |
| --- | --- |
| Agents | `.claude/agents/` |
| Skills | `.agents/skills/<name>/SKILL.md` |
| Memory | `.agents/memory/MEMORY.md` |
| Commands | `.cursor/commands/` |
| Rules | `.cursor/rules/*.mdc` |
| Scripts master | `.cursor/scripts/` (`checklist.py`, `verify_all.py`, `sync_upstream.py`, `session_manager.py`, `auto_preview.py`) |
| Arquitetura | `.cursor/ARCHITECTURE.md`, `AGENT_FLOW.md`, `AGENTS.md` |
| CLI | `cli/` → `@zanetta/axion` (`init`, `update`, `status`) |
| Publish | `.github/workflows/publish-npm.yml` |

---

## Como usar este backlog

1. Abrir issue/PR por **ID** (ex.: `Q-01`).
2. Não iniciar Fase 1 sem fechar **Q-01, K-01, D-01** e schemas piloto **K-02/K-03**.
3. Toda mudança de path ou contrato deve atualizar este arquivo só se prioridade/escopo mudar — senão atualizar inventário/manifesto gerados.
