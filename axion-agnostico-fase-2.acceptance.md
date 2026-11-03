---
id: AC-axion-agnostico-fase-2
title: "Axion agnóstico fase 2"
status: verified
sdd_state: verify
spec: "SPEC-axion-agnostico-fase-2"
plan: "PLAN-axion-agnostico-fase-2"
created: "2026-11-03"
updated: "2026-11-03"
---

# ACCEPTANCE: Axion agnóstico fase 2

> Linked from PLAN. `/verify` must produce **execution evidence** for each check.
> Sem Lighthouse/Playwright (BACKEND/TOOLING, não app web).

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `axion-agnostico-fase-2.spec.md` |
| PLAN | `axion-agnostico-fase-2.plan.md` |
| PLAN (espelho) | `axion-agnostico-fase-2-plan.md` |

## Criteria

| ID | Given / When / Then (or checklist) | Method | Command / evidence | Pass |
| --- | --- | --- | --- | --- |
| AC-1 | Given o repo do kit após o cutover, when inspeciona os scripts master, then todos os 15 scripts vivem em `.axion/scripts/`, não existe `.cursor/scripts/`, e `checklist.py` funciona tanto no repo do kit (`pack/skills/...`) quanto num projeto instalado (`.agents/skills/...`). | runtime | `test -f .axion/scripts/checklist.py && test -f .axion/scripts/lint_paths.py && test ! -e .cursor/scripts` — CHECKLIST:yes LINT_PATHS:yes NO_CURSOR_SCRIPTS:yes; ls .axion/scripts/*.py counted 15 files (auto_preview, checklist, circuit_breaker, eval_routing, generate_inventory, lint_contracts, lint_inventory, lint_paths, memory_secret_scan, session_manager, side_effect_guard, sync_upstream, trace_report, verify_all, verify_gate); AC1 exit 0 | [x] |
| AC-2 | Given a extração Option B para `pack/`, when inspeciona a árvore do repo e roda os linters de contrato/inventário/paths, then `pack/{agents,skills,commands,rules,shared,schemas,memory,mcp.json,ARCHITECTURE.md}` existem como fonte real, os caminhos da raiz (`.cursor/commands`, `.cursor/rules`, `.claude/agents`, `.agents/skills`, `.agents/schemas`) são symlinks dogfooding apontando para `pack/`, `.cursor/scripts` não existe, e `lint_paths.py`, `lint_contracts.py` e `lint_inventory.py` saem com exit 0. | lint | `test -d pack/skills && test -L .agents/skills && test -L .cursor/commands && test -L .claude/agents && test ! -e .cursor/scripts && python3 .axion/scripts/lint_paths.py . && python3 .axion/scripts/lint_contracts.py . && python3 .axion/scripts/lint_inventory.py .` — PACK_SKILLS:yes LINK_SKILLS:../pack/skills LINK_COMMANDS:../pack/commands LINK_AGENTS:../pack/agents LINK_SCHEMAS:../pack/schemas NO_CURSOR_SCRIPTS:yes; lint_paths: no legacy script path references found; lint_contracts: 59 file(s) match their contract schema; lint_inventory: docs and inventory match the filesystem — agents 20, skills 45, commands 14, rules 7, scripts 15, schemas 2; AC2 exit 0 | [x] |
| AC-3 | Given o adapter `cursor` (default), when roda `init --dry-run` sem `--tool` e com `--tool cursor`, then ambos saem 0, exibem `Tool: cursor`, listam `.axion/scripts` e mapeiam `pack/*` para `.claude/agents`, `.agents/skills`, `.agents/schemas`, `.agents/memory`, `.cursor/commands`, `.cursor/rules`, `.cursor/shared`, `.cursor/ARCHITECTURE.md` e `.cursor/mcp.json`. | runtime / unit | `node cli/bin/index.js init --dry-run && node cli/bin/index.js init --dry-run --tool cursor` — DRY_DEFAULT:0 DRY_CURSOR:0; both prints Tool: cursor; Copy: .claude, .agents, .cursor, .axion/scripts, AGENTS.md, AGENT_FLOW.md, .env.example | [x] |
| AC-4 | Given o adapter `claude-code`, when roda `init --dry-run --tool claude-code`, then sai 0, exibe `Tool: claude-code`, lista `.axion/scripts` (sem `.cursor/scripts`), mapeia `pack/commands/*` para `.claude/commands/*` com `$ARGUMENTS` (omitindo `ui-ux-pro-max` e `pack/rules/*`), `pack/skills/*` para `.agents/skills/*` e `.claude/skills/*`, `pack/mcp.json` sanitizado para `.mcp.json` e gera stub `CLAUDE.md`. | runtime / unit | `node cli/bin/index.js init --dry-run --tool claude-code` — DRY_CLAUDE:0; Tool: claude-code; Copy: .claude, .agents, .axion/scripts, .cursor/ARCHITECTURE.md, .mcp.json, AGENTS.md, CLAUDE.md, AGENT_FLOW.md, .env.example; Copy list has no .cursor/scripts | [x] |
| AC-5 | Given `installKit` e `diffKit` lendo de `pack/` + `.axion/scripts/`, when instala em um destino limpo para `cursor` ou `claude-code`, then `diffKit` retorna `drifted: []`, profiles continuam filtrando `pack/skills/*` e `pack/agents/*` antes da projeção, e `isProtected` protege `.agents/memory/` e SDD files. | unit | `cd cli && node --test test/adapters.test.js test/install.test.js test/drift.test.js` — tests 9 pass 9 fail 0 duration_ms 943 SUBSET:0; includes resolveAdapter maps pack/ to Cursor paths + .axion/scripts; claude-code maps pack/ and omits cursor-only files; installKit merges mcp.json; installKit projects claude-code paths and leaves no false drift; isProtected covers user spec, memory, logs, and trace json | [x] |
| AC-6 | Given toda a suíte de testes e smoke do CLI no pack real, when roda `cd cli && npm test`, then todos os testes unitários e de smoke (`cursor` em todos os profiles + `claude-code` em `standard`/`security`) passam com exit 0 e validam `.axion/scripts/lint_paths.py` e `lint_contracts.py` dentro do projeto instalado. | unit / smoke | `cd cli && npm test` — tests 77 pass 77 fail 0 cancelled 0 skipped 0 duration_ms 12372 NPM:0; smoke: minimal/standard/security/fullstack/mobile cursor + claude-code standard/security all pass; installed contracts pass lint_contracts | [x] |
| AC-7 | Given docs, CI e CLI atualizados, when verifica `.github/workflows/ci.yml`, docs e valores inválidos de `--tool` (`foo`, `codex`), then o CI invoca `python3 .axion/scripts/...`, as docs referenciam `.axion/scripts/` e `pack/`, e `--tool foo` / `--tool codex` saem com exit 1 listando `cursor, claude-code`. | runtime / grep | `node cli/bin/index.js init --dry-run --tool foo` e `grep -n "python3 .axion/scripts" .github/workflows/ci.yml` — Invalid tool "foo". Allowed: cursor, claude-code FOO:1; Invalid tool "codex". Allowed: cursor, claude-code CODEX:1; ci.yml lines 33/36/39/42/45 invoke python3 .axion/scripts lint_paths, lint_contracts, lint_inventory, eval_routing, eval_routing --gates (5 hits); AGENTS.md: fonte canônica vive em pack/ + .axion/scripts/ | [x] |
| AC-8 | Given todos os gates de governança do kit, when executados na raiz, then `checklist.py`, `eval_routing.py` (default, `--gates` e `--plan`), `verify_gate.py` e `trace_report.py` saem todos com exit 0. | lint / gate | `python3 .axion/scripts/checklist.py . && python3 .axion/scripts/eval_routing.py . && python3 .axion/scripts/eval_routing.py . --gates && python3 .axion/scripts/eval_routing.py . --plan axion-agnostico-fase-2.plan.md && python3 .axion/scripts/verify_gate.py . --acceptance axion-agnostico-fase-2.acceptance.md && python3 .axion/scripts/trace_report.py . axion-agnostico-fase-2` — checklist: Total Checks 6 Passed 6 Failed 0 Skipped 0 All checks PASSED CHECKLIST:0; eval_routing: pass 16 EVAL:0; eval_gates: pass 7 GATES:0; eval_routing: plan ready PLAN:0; verify_gate: ACCEPTANCE complete, checklist exit 0 GATE:0; trace_report: 8/8 checks passed, 0 gap(s), chain covered TRACE:0 | [x] |

## Suggested verify hooks

```bash
python3 .axion/scripts/checklist.py .
python3 .axion/scripts/lint_paths.py .
python3 .axion/scripts/lint_contracts.py .
python3 .axion/scripts/lint_inventory.py .
python3 .axion/scripts/eval_routing.py .
python3 .axion/scripts/eval_routing.py . --gates
python3 .axion/scripts/eval_routing.py . --plan axion-agnostico-fase-2.plan.md
python3 .axion/scripts/trace_report.py . axion-agnostico-fase-2
cd cli && npm test
```

Após o gate: `python3 .axion/scripts/session_manager.py log . --command-name verify --slug axion-agnostico-fase-2 --exit 0 --artifact axion-agnostico-fase-2.acceptance.md`

## Traceability

| ACCEPTANCE ID | PLAN task | SPEC ID |
| --- | --- | --- |
| AC-1 | P1-1 | SPEC-axion-agnostico-fase-2-1 |
| AC-2 | P1-2 | SPEC-axion-agnostico-fase-2-2 |
| AC-3 | P1-3 | SPEC-axion-agnostico-fase-2-3 |
| AC-4 | P1-4 | SPEC-axion-agnostico-fase-2-4 |
| AC-5 | P1-5 | SPEC-axion-agnostico-fase-2-5 |
| AC-6 | P1-6 | SPEC-axion-agnostico-fase-2-6 |
| AC-7 | P1-7 | SPEC-axion-agnostico-fase-2-7 |
| AC-8 | PV-1 | SPEC-axion-agnostico-fase-2-8 |

## Sign-off

- [x] All AC-* checked with evidence (not inspection-only)
- [x] Failures documented or fixed
