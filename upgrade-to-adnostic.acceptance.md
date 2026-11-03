---
id: AC-upgrade-to-adnostic
title: "Deixar o Axion agnóstico de ferramenta"
status: verified
sdd_state: verify
spec: "SPEC-upgrade-to-adnostic"
plan: "PLAN-upgrade-to-adnostic"
created: "2026-11-03"
updated: "2026-11-03"
---

# ACCEPTANCE: Deixar o Axion agnóstico de ferramenta

> Linked from PLAN. `/verify` must produce **execution evidence** for each check.
> Sem Lighthouse/Playwright (BACKEND/TOOLING, não app web).

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `upgrade-to-adnostic.spec.md` |
| PLAN (solicitado) | `upgrade-to-adnostic-plan.md` |
| PLAN (espelho SDD) | `upgrade-to-adnostic.plan.md` |

## Criteria

| ID | Given / When / Then (or checklist) | Method | Command / evidence | Pass |
| --- | --- | --- | --- | --- |
| AC-1 | Given o CLI, when `node cli/bin/index.js init --dry-run` e `node cli/bin/index.js init --dry-run --tool cursor`, then ambos saem 0, exibem `Tool: cursor` e listam os `INSTALL_PATHS` atuais (`.claude/`, `.agents/`, `.cursor/`, `AGENTS.md`, `AGENT_FLOW.md`, `.env.example`). | runtime | `node cli/bin/index.js init --dry-run` e `--tool cursor`: EXIT 0 / EXIT 0; ambos `Tool: cursor`; Copy: `.claude, .agents, .cursor, AGENTS.md, AGENT_FLOW.md, .env.example`; banner `AXION SDD CLI` | [x] |
| AC-2 | Given `--tool claude-code`, when `node cli/bin/index.js init --dry-run --tool claude-code`, then sai 0 e lista os destinos projetados do Claude Code (`.claude`, `.agents`, `.cursor/scripts`, `.mcp.json`, `AGENTS.md`, `CLAUDE.md`). | runtime | `node cli/bin/index.js init --dry-run --tool claude-code`: EXIT 0; `Tool: claude-code`; Copy: `.claude, .agents, .cursor/scripts, .cursor/ARCHITECTURE.md, .mcp.json, AGENTS.md, CLAUDE.md, AGENT_FLOW.md, .env.example` | [x] |
| AC-3 | Given `installKit` com `tool` omitido ou `tool: "cursor"`, when instala no destino, then faz merge de `.cursor/mcp.json`, preserva `.cursor/rules/*.mdc` existentes, cria `.cursor/commands/plan.md` e `diffKit` retorna `drifted: []`. | unit | `cd cli && npm test -- test/install.test.js test/adapters.test.js`: 77/77 pass, exit 0; inclui `installKit merges mcp.json and skips existing rules` | [x] |
| AC-4 | Given `installKit` com tool claude-code, when inspeciona o destino, then: (a) `.claude/commands/plan.md` existe com `$ARGUMENTS` e `ui-ux-pro-max.md` não existe; (b) skills existem em `.agents/skills/` e `.claude/skills/`; (c) `CLAUDE.md` existe; (d) `.mcp.json` não contém `envFile` nem a interpolação Cursor de CONTEXT7; (e) `.cursor/rules` e `.cursor/shared` não existem; (f) `diffKit` logo após o install retorna `drifted: []`. | unit | `cd cli && npm test -- test/adapters.test.js test/install.test.js`: 77/77 pass, exit 0; inclui `installKit projects claude-code paths and leaves no false drift` | [x] |
| AC-5 | Given um `--tool` inválido (ex.: `foo`), when `node cli/bin/index.js init --tool foo --dry-run`, then sai com código ≠ 0 e a mensagem de erro lista `cursor, claude-code`. | runtime | `node cli/bin/index.js init --tool foo --dry-run`: EXIT 1; stderr `Invalid tool "foo". Allowed: cursor, claude-code` | [x] |
| AC-6 | Given profiles (`minimal`…`mobile`) e `protect.js`, when instala com `cursor` ou `claude-code`, then o filtro de profile exclui `red-team-tactics`/`penetration-tester` fora de `security` (inclusive em `.claude/skills/`) e arquivos protegidos nunca são sobrescritos mesmo com `--force`. | unit / smoke | `cd cli && npm test -- test/profiles.test.js test/drift.test.js test/smoke.test.js`: 77/77 pass, exit 0; smoke cursor+claude-code e `force update keeps memory and spec` | [x] |
| AC-7 | Given docs e metadados atualizados, when buscamos pelas frases antigas de exclusividade, then não há matches de `"AXION CLI (Cursor)"` nem `"spec-driven development kit for Cursor IDE"`, e `--tool` está documentado em `README.md` e `cli/README.md`. | lint / grep | `rg` nas 6 paths-alvo: 0 matches, exit 1 do rg (sem hits); `--tool` presente em README.md e cli/README.md secao Tools | [x] |
| AC-8 | Given toda a suíte de testes do pacote `cli`, when `cd cli && npm test`, then todos os testes passam com exit 0. | unit | `cd cli && npm test`: 77/77 pass, fail 0, duration ~14s, exit 0 | [x] |
| AC-9 | Given os scripts de governança e validação do kit, when executados na raiz, then `checklist.py`, `lint_paths.py`, `lint_contracts.py`, `lint_inventory.py` e `eval_routing.py` (`default` + `--gates` + `--plan`) saem todos com exit 0. | lint | checklist 6/6 PASSED; lint_paths 0; lint_contracts 59 files; lint_inventory agents=20 skills=45 commands=14 rules=7 scripts=15 schemas=2; eval_routing pass 16; eval_gates pass 7; plan ready | [x] |
| AC-10 | Given `cli/test/smoke.test.js`, when roda o smoke pós-install para `cursor` e `claude-code`, then `isKitInstalled(target, tool)` retorna `true`, `manifest.components.commands > 0` em ambos os tools e não há referências penduradas de skills. | smoke | `cd cli && node --test test/smoke.test.js`: 10/10 pass, exit 0 (5 profiles cursor + standard/security claude-code + lint_contracts + --tool foo) | [x] |
| AC-11 | Given um projeto instalado com tool claude-code, when lê `.axion/kit.manifest.json` ou resolve settings de `update` sem passar `--tool`, then `manifest.tool` é claude-code, `manifest.components.commands > 0` e `resolveInstallSettings` herda o tool. | unit | `cd cli && npm test -- test/manifest.test.js test/profiles.test.js`: 77/77 pass, exit 0; inclui `writeKitManifest counts claude-code commands` e heranca de tool no manifesto | [x] |

## Suggested verify hooks

```bash
python3 .cursor/scripts/checklist.py .
python3 .cursor/scripts/lint_paths.py .
python3 .cursor/scripts/lint_contracts.py .
python3 .cursor/scripts/lint_inventory.py .
python3 .cursor/scripts/eval_routing.py .
python3 .cursor/scripts/eval_routing.py . --gates
python3 .cursor/scripts/trace_report.py . upgrade-to-adnostic
cd cli && npm test
```

Após o gate: `python3 .cursor/scripts/session_manager.py log . --command-name verify --slug upgrade-to-adnostic --exit <exit-do-gate> --artifact upgrade-to-adnostic.acceptance.md`

## Traceability

| ACCEPTANCE ID | PLAN task | SPEC ID |
| --- | --- | --- |
| AC-1 | P1-1 | SPEC-upgrade-to-adnostic-1 |
| AC-2 | P1-2 | SPEC-upgrade-to-adnostic-2 |
| AC-3 | P1-1 | SPEC-upgrade-to-adnostic-3 |
| AC-4 | P1-3 | SPEC-upgrade-to-adnostic-4 |
| AC-5 | P1-2 | SPEC-upgrade-to-adnostic-5 |
| AC-6 | P1-4 | SPEC-upgrade-to-adnostic-6 |
| AC-7 | P1-6 | SPEC-upgrade-to-adnostic-7 |
| AC-8 | P1-5 | SPEC-upgrade-to-adnostic-8 |
| AC-9 | PV-1 | SPEC-upgrade-to-adnostic-9 |
| AC-10 | P1-7 | SPEC-upgrade-to-adnostic-10 |
| AC-11 | P1-4 | SPEC-upgrade-to-adnostic-11 |

## Sign-off

- [x] All AC-* checked with evidence (not inspection-only)
- [x] Failures documented or fixed
