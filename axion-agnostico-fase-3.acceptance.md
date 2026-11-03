---
id: AC-axion-agnostico-fase-3
title: "Axion agnóstico fase 3 (adapter Codex)"
status: verified
sdd_state: verify
spec: "SPEC-axion-agnostico-fase-3"
plan: "PLAN-axion-agnostico-fase-3"
created: "2026-11-03"
updated: "2026-11-03"
---

# ACCEPTANCE: Axion agnóstico fase 3 (adapter Codex)

> Linked from PLAN. `/verify` must produce **execution evidence** for each check.
> Sem Lighthouse/Playwright (BACKEND/TOOLING).

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `axion-agnostico-fase-3.spec.md` |
| PLAN | `axion-agnostico-fase-3.plan.md` |
| PLAN (espelho) | `axion-agnostico-fase-3-plan.md` |

## Criteria

| ID | Given / When / Then (or checklist) | Method | Command / evidence | Pass |
| --- | --- | --- | --- | --- |
| AC-1 | Given o CLI com adapter Codex registrado e `manifest.js` null-safe, when roda `init --dry-run --tool codex` e `init --dry-run`, then ambos saem 0, o primeiro imprime `Tool: codex` e `Copy: .agents, .axion/scripts, .codex/config.toml, AGENTS.md, AGENT_FLOW.md, .env.example` (sem `.claude`, `.cursor` ou `CLAUDE.md`), e o default sem `--tool` continua `Tool: cursor`. | runtime / unit | `node cli/bin/index.js init --dry-run --tool codex && node cli/bin/index.js init --dry-run` — CODEX_DRY:0 Tool: codex Copy: .agents, .axion/scripts, .codex/config.toml, AGENTS.md, AGENT_FLOW.md, .env.example (no .claude, no .cursor, no CLAUDE.md); DEFAULT_DRY:0 Tool: cursor | [x] |
| AC-2 | Given `pack/mcp.json`, `mergeCodexToml` e `installKit` com `tool: "codex"`, when transforma e mescla `.codex/config.toml`, then gera tabelas TOML mcp_servers sem envFile, preserva configuracoes/servers locais existentes em conflito, e `diffKit` retorna drifted vazio. | unit | `cd cli && node --test test/adapters.test.js test/merge.test.js test/manifest.test.js test/install.test.js` — tests 15 pass 15 fail 0 duration_ms 801 SUBSET:0; includes codex maps pack skills/schemas/memory/MCP TOML; transformContent serializes sanitized .codex/config.toml; installKit projects codex hybrid paths and leaves no false drift; writeKitManifest handles codex null componentDirs; mergeCodexToml keeps existing servers and user config | [x] |
| AC-3 | Given toda a suíte de testes e smoke (`cursor`, `claude-code` e `codex` em `standard` e `security`), when roda `cd cli && npm test`, then todos passam com exit 0; no destino Codex existem `AGENTS.md`, `.agents/skills/plan-writing/SKILL.md`, `.axion/scripts/lint_paths.py`, `.codex/config.toml` e não existem `.claude/agents`, `.claude/commands`, `.cursor/commands`, `.cursor/rules`, `CLAUDE.md`. | unit / smoke | `cd cli && npm test` — tests 84 pass 84 fail 0 cancelled 0 skipped 0 duration_ms 18135 NPM:0; smoke: cursor all profiles + claude-code standard/security + codex standard/security all pass | [x] |
| AC-4 | Given docs atualizadas e validação de `--tool`, when testa `--tool windsurf`, `--tool openai-codex` e `--tool foo` e inspeciona docs/linters, then os três ids inválidos saem com exit 1 listando `cursor, claude-code, codex`, as docs citam `--tool codex`, e `lint_paths.py`, `lint_contracts.py` e `lint_inventory.py` saem com exit 0. | runtime / lint | `node cli/bin/index.js init --dry-run --tool windsurf` e `python3 .axion/scripts/lint_paths.py . && python3 .axion/scripts/lint_contracts.py . && python3 .axion/scripts/lint_inventory.py .` — Invalid tool "windsurf". Allowed: cursor, claude-code, codex WINDSURF:1; Invalid tool "openai-codex". Allowed: cursor, claude-code, codex OPENAI:1; Invalid tool "foo". Allowed: cursor, claude-code, codex FOO:1; lint_paths: no legacy script path references found; lint_contracts: 59 file(s) match their contract schema; lint_inventory: agents 20, skills 45, commands 14, rules 7, scripts 15, schemas 2 LINTS:0; README.md, cli/README.md and AGENTS.md cite --tool codex | [x] |
| AC-5 | Given todos os gates SDD da fase 3, when executa `checklist.py`, `eval_routing.py` (default, `--gates` e `--plan`), `verify_gate.py` e `trace_report.py`, then todos saem com exit 0 e 0 gaps na cadeia de rastreabilidade. | gate | `python3 .axion/scripts/checklist.py . && python3 .axion/scripts/eval_routing.py . && python3 .axion/scripts/eval_routing.py . --gates && python3 .axion/scripts/eval_routing.py . --plan axion-agnostico-fase-3.plan.md && python3 .axion/scripts/verify_gate.py . --acceptance axion-agnostico-fase-3.acceptance.md && python3 .axion/scripts/trace_report.py . axion-agnostico-fase-3` — checklist: Total Checks 6 Passed 6 Failed 0 Skipped 0 All checks PASSED CHECKLIST:0; eval_routing: pass 16 EVAL:0; eval_gates: pass 7 GATES:0; eval_routing: plan ready PLAN:0; verify_gate: ACCEPTANCE complete, checklist exit 0 GATE:0; trace_report: 5/5 checks passed, 0 gap(s), chain covered TRACE:0 | [x] |

## Suggested verify hooks

```bash
python3 .axion/scripts/checklist.py .
python3 .axion/scripts/lint_paths.py .
python3 .axion/scripts/lint_contracts.py .
python3 .axion/scripts/lint_inventory.py .
python3 .axion/scripts/eval_routing.py .
python3 .axion/scripts/eval_routing.py . --gates
python3 .axion/scripts/eval_routing.py . --plan axion-agnostico-fase-3.plan.md
python3 .axion/scripts/trace_report.py . axion-agnostico-fase-3
cd cli && npm test
node cli/bin/index.js init --dry-run --tool codex
```

Após o gate: `python3 .axion/scripts/session_manager.py log . --command-name verify --slug axion-agnostico-fase-3 --exit 0 --artifact axion-agnostico-fase-3.acceptance.md`

## Traceability

| ACCEPTANCE ID | PLAN task | SPEC ID |
| --- | --- | --- |
| AC-1 | P1-1 | SPEC-axion-agnostico-fase-3-1 |
| AC-2 | P1-2 | SPEC-axion-agnostico-fase-3-2 |
| AC-3 | P1-3 | SPEC-axion-agnostico-fase-3-3 |
| AC-4 | P1-4 | SPEC-axion-agnostico-fase-3-4 |
| AC-5 | PV-1 | SPEC-axion-agnostico-fase-3-5 |

## Sign-off

- [x] All AC-* checked with evidence (not inspection-only)
- [x] Failures documented or fixed
