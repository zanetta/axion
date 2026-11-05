---
id: AC-sdd-command-rename
title: "Rename dos slash commands 1:1 com a FSM (seis estados)"
status: draft
sdd_state: verify
spec: "SPEC-sdd-command-rename"
plan: "PLAN-sdd-command-rename"
created: "2026-11-04"
updated: "2026-11-04"
---

# ACCEPTANCE: Rename dos slash commands 1:1 com a FSM (seis estados)

> Linked from PLAN. `/verify` must produce **execution evidence** for each check.
> Sem Lighthouse/Playwright (DOCS/TOOLING).

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `sdd-command-rename.spec.md` |
| PLAN | `sdd-command-rename.plan.md` |
| PLAN (espelho) | `sdd-command-rename-plan.md` |

## Criteria

| ID | Given / When / Then (or checklist) | Method | Command / evidence | Pass |
| --- | --- | --- | --- | --- |
| AC-1 | Given o pack de commands, when inspeciona os 6 canônicos da FSM (`discover`, `specify`, `plan`, `implement`, `verify`, `remember`) e o canônico de apoio `design`, then todos existem em `pack/commands/*.md` com `name:` igual ao filename, os 6 da FSM têm `sdd_states` 1:1 (`[discover]`, `[specify]`, `[plan]`, `[implement]`, `[verify]`, `[remember]`), `/discover` não exige SPEC, `/specify` produz `{slug}.spec.md` e `/implement` cobre greenfield e enhance. | runtime / contract | `python3 .axion/scripts/lint_contracts.py . && test -f pack/commands/discover.md && test -f pack/commands/specify.md && test -f pack/commands/implement.md && test -f pack/commands/design.md` | [ ] |
| AC-2 | Given aliases de transição, when inspeciona os 5 stubs (`brainstorm.md`, `create.md`, `enhance.md`, `coordinate.md`, `ui-ux-pro-max.md`), then todos têm `name:` igual ao filename e apontam para o command canônico (`/discover` + `/specify`, `/implement`, `/orchestrate`, `/design`) sem lógica paralela. | runtime / contract | `test -f pack/commands/brainstorm.md && test -f pack/commands/create.md && test -f pack/commands/enhance.md && test -f pack/commands/coordinate.md && test -f pack/commands/ui-ux-pro-max.md` | [ ] |
| AC-3 | Given docs e inventário, when roda `generate_inventory.py` e `lint_inventory.py` e inspeciona `AGENTS.md`, `AGENT_FLOW.md`, `README.md` e `pack/ARCHITECTURE.md`, then `commands` = 18 nas 3 seções do ARCHITECTURE e no `inventory.json`, a FSM falada é `/discover` → `/specify` → `/plan` → `/implement` → `/verify` → `/remember`, e `lint_inventory.py` sai 0. | lint | `python3 .axion/scripts/generate_inventory.py . && python3 .axion/scripts/lint_inventory.py .` | [ ] |
| AC-4 | Given adapter Claude Code e a suíte CLI, when mapeia `pack/commands/design.md` e `pack/commands/ui-ux-pro-max.md` e roda testes/lints, then ambos retornam `[]` no Claude Code, smoke Claude instala `discover/specify/implement` mas não `design.md` nem `ui-ux-pro-max.md`, `lint_paths.py` + `lint_contracts.py` (63 arquivos) + `eval_routing.py` (default e `--gates`) saem 0 e `cd cli && npm test` passa. | unit / lint | `cd cli && npm test` e `python3 .axion/scripts/lint_paths.py . && python3 .axion/scripts/lint_contracts.py . && python3 .axion/scripts/eval_routing.py . && python3 .axion/scripts/eval_routing.py . --gates` | [ ] |
| AC-5 | Given os gates SDD deste slug, when executa checklist, eval `--plan`, verify_gate e trace_report, then todos saem 0 e a cadeia SPEC/PLAN/AC tem 0 gaps. | gate | `python3 .axion/scripts/checklist.py . && python3 .axion/scripts/eval_routing.py . --plan sdd-command-rename.plan.md && python3 .axion/scripts/verify_gate.py . --acceptance sdd-command-rename.acceptance.md && python3 .axion/scripts/trace_report.py . sdd-command-rename` | [ ] |

## Suggested verify hooks

```bash
python3 .axion/scripts/checklist.py .
python3 .axion/scripts/lint_paths.py .
python3 .axion/scripts/lint_contracts.py .
python3 .axion/scripts/lint_inventory.py .
python3 .axion/scripts/eval_routing.py .
python3 .axion/scripts/eval_routing.py . --gates
python3 .axion/scripts/eval_routing.py . --plan sdd-command-rename.plan.md
python3 .axion/scripts/trace_report.py . sdd-command-rename
cd cli && npm test
```

Após o gate: `python3 .axion/scripts/session_manager.py log . --command-name verify --slug sdd-command-rename --exit 0 --artifact sdd-command-rename.acceptance.md`

## Traceability

| ACCEPTANCE ID | PLAN task | SPEC ID |
| --- | --- | --- |
| AC-1 | P1-1 | SPEC-sdd-command-rename-1 |
| AC-2 | P1-2 | SPEC-sdd-command-rename-2 |
| AC-3 | P1-3 | SPEC-sdd-command-rename-3 |
| AC-4 | P1-4 | SPEC-sdd-command-rename-4 |
| AC-5 | PV-1 | SPEC-sdd-command-rename-5 |

## Sign-off

- [ ] All AC-* checked with evidence (not inspection-only)
- [ ] Failures documented or fixed
