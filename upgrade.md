# upgrade.md — Backlog SDD para Axion

Documento de engenharia: evoluir o **Axion** de um pack instalável de agents e skills para um framework de **Spec-Driven Development (SDD)** com contratos, gates e observabilidade.

| | |
| --- | --- |
| **Estado atual** | Pack de agents (`.claude/agents/`), skills (`.agents/skills/`), commands (`.cursor/commands/`), rules (`.cursor/rules/`), memória (`.agents/memory/`), scripts (`.cursor/scripts/`) e CLI npm `@zanetta/axion` (`cli/`) |
| **Já existe** | `coordinator-mode`, `memory-system`, `verify-changes`, `sync_upstream.py`, publish npm, merge no `init`; **Fase 0 (P0) concluída** — manifesto, schemas, `lint_paths.py` + CI; **Fase 1 (P1) concluída** — templates SPEC/PLAN/ACCEPTANCE, FSM SDD, Socratic Gate, profiles CLI + offensive opt-in, inventário `.axion/inventory.json`; **Fase 2 (P2) em andamento** — `lint_contracts.py`, `lint_inventory.py` (Q-03), gate pre-publish, smoke pós-install |
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

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ✅ K-01 | P0 | Manifesto do kit instalado | Introduzir arquivo de manifesto com versão SemVer do kit, data de install/update, perfil aplicado e checksum/lista de componentes. Gravado no projeto consumidor pelo CLI. | Hoje `status`/`update` não têm fonte canônica de “qual kit está instalado”; SemVer npm ≠ estado no repo. | `.axion/kit.manifest.json` (ou `.cursor/axion.manifest.json`); escrita em `cli/lib/install.js`; leitura em `cli/bin/index.js` (`status`/`update`) | M | — | **DONE** — `cli/lib/manifest.js` grava `.axion/kit.manifest.json` no `init`/`update` |
| ✅ K-02 | P0 | Schema de contrato de skill | Definir frontmatter/schema obrigatório além do atual (`name`, `description`): `inputs`, `outputs`, `preconditions`, `postconditions`, `side_effects`, `forbidden_paths`, `verify_hooks`. Skills passam de procedimento para contrato. | Skills em `.agents/skills/*/SKILL.md` são narrativas; não há máquina de verificação. | `.agents/schemas/skill-contract.schema.json`; atualizar skills-piloto: `brainstorming`, `plan-writing`, `verify-changes`, `coordinator-mode` | M | — | **DONE** — schema + frontmatter piloto nas 4 skills |
| ✅ K-03 | P0 | Schema de contrato de command | Espelhar contratos nos workflows `.cursor/commands/*.md`: estados permitidos, artefatos obrigatórios de saída, scripts canônicos (só `.cursor/scripts/`). | Commands misturam instrução e path legado (`.agents/scripts`). | `.agents/schemas/command-contract.schema.json`; alinhar `/plan`, `/verify`, `/status`, `/orchestrate` | M | K-02 | **DONE** — schema + frontmatter piloto em `/plan`, `/verify`, `/status`, `/orchestrate` |
| ✅ K-04 | P1 | Inventário versionado de componentes | Gerar inventário machine-readable de agents/skills/commands/rules/scripts a partir do repo, consumido por sync e status. | `.cursor/ARCHITECTURE.md` e counts driftam; `sync_upstream.py` precisa de fonte única. | `.axion/inventory.json` gerado por script; hook opcional no CI | M | K-01 | **DONE** — `python3 .cursor/scripts/generate_inventory.py .` → `.axion/inventory.json` (saída determinística: sem `root`/`generated_at`, `schema_version` 1.1.0) |

### 2. Spec artifacts

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ✅ S-01 | P1 | Template SPEC | Artefato `SPEC.md` (ou `{slug}.spec.md`) com problema, actors, constraints, non-goals, interfaces, riscos. Produzido após Socratic Gate. | Sem spec, `/plan` gera plano solto e agents improvisam. | `.agents/skills/plan-writing/templates/SPEC.template.md`; referência em `.cursor/commands/brainstorm.md` e `.cursor/commands/plan.md` | S | K-02 | **DONE** — `SPEC.template.md` |
| ✅ S-02 | P1 | Template PLAN estruturado | Substituir o plano livre por schema (`{slug}.plan.md` + `{slug}.acceptance.md`; legado `{slug}.md` aceito): fases, deps, agents, skills, critérios de done, links para SPEC/ACCEPTANCE. Manter naming dinâmico do `project-planner`. | `plan.md` / plans atuais são checklist narrativo; difícil gatear. | `.agents/skills/plan-writing/templates/PLAN.template.md`; atualizar `.claude/agents/project-planner.md`, `.cursor/commands/plan.md` | M | S-01 | **DONE** — `PLAN.template.md` |
| ✅ S-03 | P1 | Template ACCEPTANCE | Critérios testáveis (Given/When/Then ou checklist verificável) + comandos de verify sugeridos (`checklist.py`, `verify_all.py`). | Verify-changes existe, mas não há contrato de aceite amarrado ao plano. | `.agents/skills/verify-changes/templates/ACCEPTANCE.template.md`; link em `/verify` | S | S-02 | **DONE** — `ACCEPTANCE.template.md` |
| ✅ S-04 | P1 | Traceability matrix leve | IDs SPEC ↔ tasks PLAN ↔ checks ACCEPTANCE; referência cruzada obrigatória no orchestrator antes de codar. | Sem rastreio, “done” é subjetivo e doc drift aumenta. | Seção `Traceability` nos templates; opcional `.axion/trace/{slug}.json` | M | S-01, S-02, S-03 | **DONE** — seção Traceability + `.axion/trace/README.md` |

### 3. Workflows / FSM

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ✅ W-01 | P1 | FSM SDD mínima | Estados: `discover → specify → plan → implement → verify → remember`. Commands mapeados (`/brainstorm`, `/plan`, `/create`\|`/enhance`, `/verify`, `/remember`). Commands instruem o agent a não avançar sem artefato predecessor. | Socratic Gate e fases existem em prosa (`AGENTS.md`, agents) mas não são enforceable. | Documentar FSM em `.cursor/ARCHITECTURE.md` + `AGENT_FLOW.md`; checklist de transição nos commands | M | S-01..S-03 | **DONE (advisory)** — FSM documentada + commands mapeados; transições são instruções em commands/agents, sem enforcement mecânico (enforcement real: E-02) |
| ✅ W-02 | P1 | Enforce Socratic Gate | Antes de `/plan`, `/create`, `/orchestrate`: exigir evidência de ≥3 perguntas respondidas (arquivo de discovery ou seção no SPEC). Orchestrator não despacha workers sem gate. | Gate documentado em `brainstorming`, `orchestrator`, `project-planner` é frequentemente pulado. | Atualizar `.cursor/commands/{brainstorm,plan,create,orchestrate}.md`; `.agents/skills/brainstorming/SKILL.md`; `.claude/agents/orchestrator.md` | M | W-01, S-01 | **DONE (advisory)** — gate: SPEC **ou** ≥3 perguntas no SPEC/PLAN; instrução em commands/agents, sem enforcement mecânico (enforcement real: E-02) |
| W-03 | P2 | Verify como gate hard | `/verify` e skill `verify-changes` passam a falhar a tarefa se ACCEPTANCE incompleto ou `checklist.py` retornar crítico. | Final Checklist em `AGENTS.md` é política; falta amarração ao workflow. | `.cursor/commands/verify.md`; `.agents/skills/verify-changes/SKILL.md`; integrar exit codes de `.cursor/scripts/checklist.py` | M | S-03, W-01 | — |
| W-04 | P3 | Circuit breaker na orquestração | Em `coordinator-mode` / `/coordinate` / `/orchestrate`: limite de retries, cancelamento se N workers falham no mesmo domínio, fallback para síntese parcial + relatório. | Orquestração paralela pode loopar custo/tokens sem critério de parada. | `.agents/skills/coordinator-mode/SKILL.md`; `.agents/skills/parallel-agents/SKILL.md`; `.cursor/commands/coordinate.md` | M | W-01, O-01 | — |

### 4. Quality / CI

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ✅ Q-01 | P0 | Lint de path drift | Scanner CI que falha se docs/commands/skills referenciam `.agents/scripts/` em vez de `.cursor/scripts/` (exceto menção histórica em ARCHITECTURE). Corrigir ocorrências atuais (`enhance.md`, `preview.md`, `status.md`). | Drift já conhecido; `sync_upstream.py` remapeia no sync, mas o pack shippa paths quebrados. | `.cursor/scripts/lint_paths.py`; job em `.github/workflows/`; fix nos commands afetados | S | — | **DONE** — `lint_paths.py` + `.github/workflows/ci.yml` |
| ✅ Q-02 | P2 | Validador de contratos | CI valida frontmatter das skills/commands contra schemas K-02/K-03; falha em skills-piloto, depois em 100%. | Contratos sem CI viram doc morta. | Extensão de `lint_paths.py` ou `.cursor/scripts/lint_contracts.py`; testes em `cli/test/` | M | K-02, K-03 | **DONE** — `.cursor/scripts/lint_contracts.py` (Draft 7 + `name` = pasta) em 100% das skills/commands (59 arquivos); corrigiu YAML inválido em `lint-and-validate` e frontmatter ausente em `/ui-ux-pro-max`; job em `ci.yml` |
| ✅ Q-03 | P2 | Doc-inventory parity | Diff ARCHITECTURE counts vs filesystem (agents/skills/commands/rules/scripts); falha se divergir. | Doc drift é fraqueza explícita. | Script + referência a `.cursor/ARCHITECTURE.md` | S | K-04 | **DONE** — `.cursor/scripts/lint_inventory.py` (sem deps extras) falha se a tabela overview de `.cursor/ARCHITECTURE.md` ou `.axion/inventory.json` divergir do filesystem; passo "Lint doc/inventory parity (Q-03)" em `ci.yml`, após `lint_contracts` |
| ✅ Q-04 | P2 | Hook pre-publish | Antes de tag `v*`, rodar lint paths + contracts + `cli` tests (além do workflow publish atual). | Publish npm já existe; falta gate de conteúdo do pack. | `.github/workflows/publish-npm.yml` ou workflow `ci.yml` | S | Q-01, Q-02 | **DONE** — `ci.yml` reusável (`workflow_call`); `publish-npm.yml` job `pre-publish` → `publish` (`needs`); publish falha se tag ≠ versão de `cli/package.json` |

### 5. DX / CLI

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ✅ D-01 | P0 | SemVer do kit no projeto | `init`/`update` gravam versão do pacote npm + git SHA do template no manifesto; `status` exibe installed vs latest registry. | Usuário não sabe se o projeto está atrás do registry. | `cli/lib/install.js`, `cli/bin/index.js`; campo em K-01 | S | K-01 | **DONE** — manifesto + `status` com versão vs registry |
| ✅ D-02 | P1 | Profiles no `init` | Profiles: `minimal` (AGENTS + core skills + rules), `standard` (atual full), `security` (inclui offensive sob opt-in), `fullstack` / `mobile` (subsets). Default: `standard`. | Install full sempre aumenta superfície (red-team sempre disponível). | `cli/lib/profiles.js`; flags `--profile`; docs em `cli/README.md` | L | K-01, X-01 | **DONE** — filtro no momento da cópia (`cli/lib/install.js` + `cli/lib/profiles.js`; nunca apaga no alvo); `--profile` herdado do manifesto |
| D-03 | P2 | `update` consciente de manifesto | `update` compara manifesto, lista drift de arquivos locais vs pack, oferece merge/force por path; não sobrescreve SPEC/PLAN do usuário. | Update atual é cópia/merge grosseiro. | `cli/lib/install.js`; testes `cli/test/` | M | K-01, D-01 | — |
| D-04 | P2 | Doctor / status enriquecido | `/status` + CLI `status`: versão kit, profile, path lint summary, memory index size, último verify. | Observabilidade do kit instalado é fraca. | `.cursor/commands/status.md`; `cli/bin/index.js`; `.cursor/scripts/session_manager.py` | M | K-01, O-01 | — |

### 6. Observability

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- |
| O-01 | P2 | Session / run log estruturado | Append-only log local de runs de command (command, slug, artefatos tocados, exit verify). Sem PII. | Pouca observabilidade entre sessões além de `.agents/memory/`. | `.axion/logs/runs.jsonl`; integração leve em `/verify` e `session_manager.py` | M | K-01 |
| O-02 | P2 | Traceability report | Comando/script que imprime cobertura SPEC→ACCEPTANCE→checks para um slug. | Fecha o loop SDD para humanos e CI local. | `.cursor/scripts/trace_report.py`; menção em `/verify` | S | S-04 |
| O-03 | P3 | Métricas de orquestração | Contadores: workers lançados, falhas, tempo estimado, circuit-breaker trips — no run log. | Necessário para calibrar W-04 e custo. | Extensão de O-01 + `coordinator-mode` | M | O-01, W-04 |

### 7. Security

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ✅ X-01 | P1 | Profile / flag para skills ofensivas | `red-team-tactics`, agent `penetration-tester` (e refs em `security-auditor`) só instalam ou só ativam com `--profile security` ou `--enable-offensive`. Default off em `minimal`/`standard`. | Superfície ofensiva sempre disponível no pack full. | Profiles D-02; `.agents/skills/red-team-tactics/`; `.claude/agents/penetration-tester.md`; nota em `.cursor/rules/security.mdc` | M | D-02 | **DONE** — `--enable-offensive` / profile `security`; senão não copiados (filtro em `cli/lib/install.js` + `profiles.js`) + `.axion/OFFENSIVE_DISABLED.md` |
| X-02 | P2 | Memory secret scanner | Antes de escrever em `.agents/memory/**`, scanear padrões de secrets (tokens, keys, `.env` values); recusar ou redigir. | Memory persiste texto livre (`/remember`, `memory-system`). | `.agents/skills/memory-system/`; script `.cursor/scripts/memory_secret_scan.py`; `.cursor/commands/remember.md` | M | — | — |
| X-03 | P2 | Allowlist de side_effects | Contratos K-02 declaram side effects; orchestrator/coordinator não grava fora de allowlist do PLAN. | Reduz blast radius de batch-operations / skills de write. | Convenção nos contracts + texto em `coordinator-mode` | S | K-02, S-02 | — |

### 8. Eval

| ID | Priority | Title | Description | Rationale | Suggested artifacts/paths | Effort | Dependencies | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E-01 | P3 | Golden cases de roteamento | Suite de prompts → agent/skill esperado (ex.: mobile ≠ frontend-specialist), assert contra `intelligent-routing` / tabelas `AGENTS.md`. | Sem eval, regressões de routing são invisíveis. | `.axion/eval/routing.cases.json`; runner `.cursor/scripts/eval_routing.py` (checagem estática de regras + fixtures) | L | K-04 | — |
| E-02 | P3 | Eval de FSM / gates | Casos: plan sem SPEC → fail; verify sem ACCEPTANCE → fail; path `.agents/scripts` → fail lint. | Garante que P0/P1 não regredam. | Extensão do harness E-01; CI job opcional | M | W-01, Q-01, S-03 | — |
| ✅ E-03 | P3 | Smoke do pack pós-install | Após `init --profile standard` em temp dir: inventário mínimo presente, manifesto válido, lint paths clean. | Protege consumidores npm. | `cli/test/install.test.js` + fixtures em `cli/test/fixtures/` | M | D-01, D-02, Q-01 | **DONE** (antecipado da Fase 3) — `cli/test/smoke.test.js`: instala o pack real em temp dir para todos os profiles; valida manifesto, arquivos-chave, zero refs agent→skill quebradas, offensive só em `security`, `lint_paths.py` e `lint_contracts.py` limpos (25 testes no CLI) |

---

## Roadmap recomendado (fases)

### Fase 0 — Fundação (P0) — ✅ CONCLUÍDA (2026-10-30)

1. **Q-01** ✅ — `lint_paths.py` + CI (`.github/workflows/ci.yml`); commands `enhance`/`preview`/`status` corrigidos.
2. **K-01 + D-01** ✅ — `.axion/kit.manifest.json` via `cli/lib/manifest.js`; `init`/`update` gravam; `status` exibe versão/profile vs registry.
3. **K-02 + K-03** ✅ — schemas em `.agents/schemas/`; piloto: skills `brainstorming`, `plan-writing`, `verify-changes`, `coordinator-mode` + commands `/plan`, `/verify`, `/status`, `/orchestrate`.

*Saída:* pack com paths corretos, versão observável, contratos versionados.

### Fase 1 — Núcleo SDD (P1) — ✅ CONCLUÍDA (2026-10-30)

1. **S-01 → S-02 → S-03 → S-04** ✅ — Templates SPEC/PLAN/ACCEPTANCE + traceability (`.axion/trace/`).
2. **W-01 + W-02** ✅ (advisory) — FSM documentada + Socratic Gate (SPEC **ou** ≥3 perguntas no SPEC/PLAN); enforcement mecânico fica para E-02.
3. **D-02 + X-01** ✅ — Profiles no `init` e offensive opt-in (`--enable-offensive` / `security`).
4. **K-04** ✅ — Inventário gerado (`generate_inventory.py` → `.axion/inventory.json`).

*Saída:* fluxo discover→specify→plan→verify com artefatos; install por perfil.

### Fase 2 — Maturidade (P2) — 🚧 EM ANDAMENTO

**Primeiro bloco ✅ (2026-10-30):** **Q-04 + Q-02 + E-03** — pre-publish gate, lint de contratos em 100% do pack e smoke pós-install (E-03 antecipado da Fase 3). Release `v1.1.0`. **Q-03** ✅ — paridade doc/inventário (`lint_inventory.py`).

1. **W-03** — Verify hard-gate.
2. **Q-02** ✅, **Q-03** ✅, **Q-04** ✅ — Contracts CI, parity docs, pre-publish.
3. **O-01, O-02, D-03, D-04** — Logs, trace report, update/status ricos.
4. **X-02, X-03** — Secret scan na memory + allowlist de side effects.

*Saída:* kit “shippable” com CI de conteúdo e observabilidade local.

### Fase 3 — Avançado (P3)

1. **W-04 + O-03** — Circuit breaker + métricas de orquestração.
2. **E-01 → E-02** — Eval de routing e gates (**E-03** ✅ antecipado para a Fase 2).

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
| Scripts master | `.cursor/scripts/` (`checklist.py`, `verify_all.py`, `sync_upstream.py`, `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py`, `generate_inventory.py`, `session_manager.py`, `auto_preview.py`) |
| Schemas de contrato | `.agents/schemas/` (`skill-contract.schema.json`, `command-contract.schema.json`) |
| Templates SDD | `.agents/skills/plan-writing/templates/` (SPEC, PLAN); `.agents/skills/verify-changes/templates/ACCEPTANCE.template.md` |
| Manifesto instalado | `.axion/kit.manifest.json` (escrito pelo CLI) |
| Inventário | `.axion/inventory.json` (via `generate_inventory.py`) |
| Traceability | `.axion/trace/README.md` + opcional `{slug}.json` |
| Arquitetura | `.cursor/ARCHITECTURE.md`, `AGENT_FLOW.md`, `AGENTS.md` |
| CLI | `cli/` → `@zanetta/axion` (`init`, `update`, `status`; `--profile`, `--enable-offensive`) |
| CI | `.github/workflows/ci.yml` (path lint + contract lint + inventory parity + CLI tests + smoke pós-install; reusável via `workflow_call`) |
| Publish | `.github/workflows/publish-npm.yml` (gated por `ci.yml`; tag `vX.Y.Z` deve = `cli/package.json`) |

---

## Como usar este backlog

1. Abrir issue/PR por **ID** (ex.: `Q-01`).
2. ✅ Fase 0 fechada (**Q-01, K-01, D-01, K-02, K-03**). ✅ Fase 1 fechada (**S-01..S-04, W-01, W-02, D-02, X-01, K-04**). 🚧 Fase 2: primeiro bloco fechado (**Q-04, Q-02, E-03**); **Q-03** ✅. Próximo: **W-03 → O-02 → X-02 → D-03/D-04/O-01 → X-03**.
3. Toda mudança de path ou contrato deve atualizar este arquivo só se prioridade/escopo mudar — senão atualizar inventário/manifesto gerados.
