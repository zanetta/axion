---
type: project
created: 2026-11-03
updated: "2026-11-06"
---

# Tech Decisions

## Tool-agnostic SDD (issue 9, v1)

- Axion is an SDD framework with install adapters, not a Cursor-only kit.
- CLI `--tool` accepts `cursor` (default), `claude-code`, `codex`, `windsurf`, or `antigravity`. Unknown IDs exit 1.
- `diffKit` must compare adapter-transformed content. Without that, Claude Code installs show false drift on commands, MCP, and `CLAUDE.md`.
- Profiles and protect stay orthogonal to `--tool`. Profile filter runs on source paths before projection. `update --tool` is additive and does not delete the other tool tree.
- Cursor rules stay Cursor-only. The design workflow does not: see "Design on all tools" below.
- `CLAUDE.md` is a stub pointing to `AGENTS.md` and `AGENT_FLOW.md`. Do not overwrite an existing `CLAUDE.md` without `--force`.

## Pack extract (issue 11, v2, Option B)

- `pack/` is the canonical kit tree. `.axion/scripts/` is a real directory of 15 master scripts in the kit repo and in consumers (not a git symlink).
- Dual-layout: Python masters resolve `pack/` when present at the scanned root, else installed `.agents` / `.claude` / `.cursor` paths.
- Cursor adapter is not identity: it maps `pack/` onto Cursor native layout plus `.axion/scripts/`.
- Claude Code adapter maps `pack/` plus `.axion/scripts/`; omits `pack/rules`; writes the `CLAUDE.md` stub. `/design` and `.agents/shared/` are installed.
- CLI walks `SOURCE_PATHS` (`pack`, `.axion/scripts`, `AGENTS.md`, `AGENT_FLOW.md`, `.env.example`) so dogfood root symlinks are not copied as extra source.
- `update` remains additive and does not delete leftover `.cursor/scripts/` from v1 installs.
- Kit repo dogfoods via root symlinks to `pack/`. `.agents/memory/` stays live at repo root; `pack/memory` is consumer seed.
- Verify of slug `axion-agnostico-fase-2` passed 2026-11-03 (GitHub issue 11, fronts 1–2).

## Codex adapter (issue 11, v3, Codex-first)

- `--tool codex` is hybrid: `AGENTS.md`, `.agents/skills/`, `.agents/schemas/`, `.agents/memory/`, `.agents/shared/`, `.axion/scripts/`, `.codex/config.toml`. Omits agents, commands, rules, `ARCHITECTURE.md`, and `CLAUDE.md`.
- MCP: `pack/mcp.json` becomes `.codex/config.toml` with additive merge of `mcp_servers` tables. Never write the user-home Codex config. `diffKit` treats extra local tables as non-drift when kit servers are present.
- `writeKitManifest` must null-guard `componentDirs.agents` when an adapter sets `agents` to null.
- Kit repo does not dogfood Codex.
- Verify of slug `axion-agnostico-fase-3` passed 2026-11-03.

## Windsurf adapter (issue 11, v4, Codex-thin)

- `--tool windsurf` is hybrid like Codex: `AGENTS.md`, `.agents/skills/`, `.agents/schemas/`, `.agents/memory/`, `.agents/shared/`, `.axion/scripts/`, `.windsurf/mcp_config.json`. Omits agents, commands, rules, `ARCHITECTURE.md`, `CLAUDE.md`, and `.devin/`.
- MCP stays JSON (`mcpServers`), not TOML. Destination is `.windsurf/mcp_config.json`. Never write `~/.codeium/` or `~/.config/devin/`.
- `diffKit` JSON equality is post-merge (`mergeMcpJson(actual, expected)` equivalent to `actual`), matching Codex TOML, so extra local servers are not false drift.
- Kit repo does not dogfood Windsurf. Tool id is `windsurf` (not `devin`). Issue 11 closes after this cut; Copilot/Aider/Gemini are new issues.
- Verify of slug `axion-agnostico-fase-4` passed 2026-11-04.

## Antigravity adapter (issue 17, Option B native)

- `--tool antigravity` only (no `gemini` alias). Native, not Codex-thin. Rules: `pack/rules` `.mdc` → `.agents/rules/*.md` (`trigger: glob` / `model_decision`). Skills/shared/memory/schemas under `.agents/`. MCP `.agents/mcp_config.json` (JSON merge like Windsurf).
- **Superseded for commands (2026-11-06):** see "ax- prefix commands" — no longer maps to `.agents/workflows/`.
- `GEMINI.md` stub like `CLAUDE.md` (no clobber without `--force`). Omit `pack/agents` and `ARCHITECTURE.md`. Never write `~/.gemini/`. Kit repo does not dogfood Antigravity.
- `writeKitManifest` uses `adapter.rulesExt` (`.md` here; default `.mdc`). Pack smoke: commands=13, rules=7.
- Copilot, Aider, and Gemini CLI stay separate issues.
- Verify of slug `antigravity-adapter` passed 2026-11-05 (GitHub issue 17, branch `17-antigravity-adapter`).

## ax- prefix commands (G1 + Antigravity skills)

- Direction: **G1** global rename + **S3** Antigravity commands-as-skills; prefix `ax-`; **dry cutover** (no stubs / redirects).
- Pack: 13 files `pack/commands/ax-*.md`; frontmatter `name: ax-*`. Inventory `commands=13` (rename only). Skills of domain and `{slug}.plan.md` / CLI `--plan` unchanged.
- Public slash is `/ax-discover` … `/ax-design`. FSM **state names** stay `discover → specify → plan → …`; only the slash is prefixed.
- Cursor → `.cursor/commands/ax-*.md`; Claude Code → `.claude/commands/ax-*.md`.
- Antigravity → `.agents/skills/ax-*/SKILL.md` (`commandsAsSkills` + `countAxCommandSkills`). Not `.agents/workflows/`. `update` is additive: consumers remove stale workflows manually.
- Do **not** `axion init --force --tool antigravity` into the kit repo: `.agents/skills` → `pack/skills` and unprefixed remote commands pollute `pack/skills/`. Prove with local `installKit` / smoke; CLI dry-run still downloads `github:zanetta/axion` until publish.
- Slug `ax-prefix-commands` verified 2026-11-06 (checklist + gate + trace 5/5). Branch `bugfix/antigravity-commands`. Own GitHub issue TBD (not #24).

## SDD command names (six states)

- FSM states one to one: discover → specify → plan → implement → verify → remember. Slash canonical (after ax-prefix): `/ax-discover` → `/ax-specify` → `/ax-plan` → `/ax-implement` → `/ax-verify` → `/ax-remember`.
- `/ax-discover` explores and asks; it does not close `{slug}.spec.md`. `/ax-specify` holds the Socratic gate and writes the SPEC.
- `/ax-implement` unifies greenfield (Mode A) and existing-code (Mode B). Gate for non-trivial work is the greenfield-strength gate.
- Canonical design command is `/ax-design`. Skill id `design-guide` and folder `ui-ux-pro-max` keep those names.
- Transition aliases are maintainer-personal only and are not in `pack/`. Public docs name only `/ax-*`. Inventory `commands=13`. Verify of slug `hide-transition-aliases` passed 2026-11-04 (Option C); superseded slash strings by `ax-prefix-commands`.
- Verify of slug `sdd-command-rename` passed 2026-11-04 (pre-prefix names).

## Design on all tools

- Direction (discover 1A / 2A / 3B): the agent runs the design workflow and `search.py` on all install tools. Slash `/ax-design` is the command on Cursor, Claude Code, and Antigravity (as skill). Codex and Windsurf get the skill only.
- One data path: `.agents/shared/ui-ux-pro-max/`, projected from `pack/shared/` by all adapters. Cursor no longer maps that tree to `.cursor/shared/`. `update` is additive, so an old `.cursor/shared/` tree may remain on disk unused.
- Skill id is `design-guide` (`MINIMAL_CORE_SKILLS`). CSVs stay in shared data, not inside the skill. Command `/ax-design` is a different id.
- Verify of slug `rename-design-skill` passed 2026-11-05 (Option A global): pack `design` → `design-guide` on all five adapters, no per-adapter transform, no leftover stub. Additive `update` may leave unused `skills/design/`. E-01 WEB row stays without `design`/`design-guide`. Accept = smokes paths, not IDE slash probe.
- Kit dogfood: `.agents/shared` → `pack/shared`.
- Verify of slug `design-all-tools` passed 2026-11-04. Inventory skills was 46 then. Antigravity: `/ax-design` SDD skill; searchable guide remains `design-guide`.

## Observability skill (issue 20)

- Option A: skill `observability` only — no new agent. Not in `MINIMAL_CORE_SKILLS` (arrives via agent deps).
- Wire via `devops-engineer` and `debugger`. Decision trees (logs, OTel, metrics, alerts, error tracking) — not vendor cookbooks. Light pointers from `server-management` / `deployment-procedures` / `systematic-debugging`.
- Slug `add-observability`; branch `20-add-observability`. Kit run-log (O-01 / `.axion/logs/runs.jsonl`) is out of scope for this skill (consumer apps only).
- Inventory skills = 47 after this cut (base was 46 on main without auth). Profile approx: minimal 37 / standard 46 / security 47.
- Parallel track: auth skill (`add-auth-patterns`, issue 19) on branch `19-add-auth-patterns` — rebase inventory if both merge.
- Verify of slug `add-observability` passed 2026-11-05 (checklist + verify_gate + trace 5/5).
- Verify of slug `design-all-tools` passed 2026-11-04. Inventory skills was 46 then; Antigravity hint: `/design` is the SDD workflow; the searchable guide is skill `design-guide`.

## Accessibility skill (issue 24, P0)

- Option **A**: skill `accessibility` only — no new agent. Not in `MINIMAL_CORE_SKILLS`.
- Wire via `frontend-specialist`, `qa-automation-engineer`, and `mobile-developer`.
- Scope: WCAG 2.2 web + **light** mobile a11y (Dynamic Type / screen readers), not a full mobile-a11y cookbook.
- Keep `accessibility_checker.py` under `frontend-design/scripts/`; skill points to it (no move).
- Light pointers from `frontend-design` / `web-design-guidelines` / optionally `design-guide` / `mobile-design`.
- Slug `add-accessibility`; branch `24-add-accessibility`. Epic issue https://github.com/zanetta/axion/issues/24.
- Inventory after cut: skills **50**, agents **21**. WEB E-01 agent stays `frontend-specialist` (skills col may list `accessibility`).
- Verify of slug `add-accessibility` passed 2026-11-06 (checklist + verify_gate + trace 5/5).

## Payment patterns skill (issue 24, P0)

- Option **A**: skill `payment-patterns` only — no new agent. Not in `MINIMAL_CORE_SKILLS`.
- Wire via `backend-specialist` and `security-auditor`. Stripe-first (prefer Checkout Sessions; ban Charges/Sources).
- Scope: one-time + webhooks + Billing **light** + PCI boundary; **not** Connect/multi-PSP this slice.
- Pointers from `api-patterns` / `auth-patterns` (auth = identity; payments = money + PCI).
- Slug `add-payment-patterns`; branch `24-add-payment-patterns` (stacked on accessibility). Epic #24.
- Inventory after cut: skills **51**, agents **21**. Profile approx: minimal 41 / standard 50 / security 51.
- Verify of slug `add-payment-patterns` passed 2026-11-06 (checklist + verify_gate + trace 5/5).

## ADR writing skill (issue 24, P0)

- Option **A**: skill `adr-writing` only — no new agent. Not in `MINIMAL_CORE_SKILLS` (`architecture` remains in core).
- Wire via `project-planner`, `orchestrator`, `backend-specialist`, `explorer-agent`.
- **Move** canonical ADR template out of `architecture/trade-off-analysis.md` into `adr-writing`; architecture keeps generic trade-off framework + pointer.
- Scope: when-to-write, template, lifecycle/status, storage/index (`docs/adr/`), supersede/amend, anti-patterns.
- Slug `add-adr-writing`; branch `24-add-adr-writing` (stacked on payments). Epic #24. Id “ad-writing” → canonical `adr-writing`.
- Inventory after cut: skills **52**, agents **21**. Profile approx: minimal 42 / standard 51 / security 52.
- Verify of slug `add-adr-writing` passed 2026-11-06 (checklist + verify_gate + trace 5/5).

## LLM eval skill (issue 24, P0)

- Option **A**: skill `llm-eval` only — no new agent. Not in `MINIMAL_CORE_SKILLS`.
- Wire via `ai-specialist` and `test-engineer`.
- **Move** canonical eval content from `rag-patterns/evaluation.md` into `llm-eval`; RAG keeps a short pointer. Broad scope: offline golden sets, retrieval/faithfulness, LLM-as-judge, online/regression gates, anti-patterns.
- Name distinct from kit `eval_routing.py` (SDD routing smoke ≠ consumer LLM eval).
- Slug `add-llm-eval`; branch `24-add-llm-eval` (stacked on ADR). Epic #24. AAS id was `llm-evaluation` → Axion `llm-eval`.
- Inventory after cut: skills **53**, agents **21**. Profile approx: minimal 43 / standard 52 / security 53.
- Verify of slug `add-llm-eval` passed 2026-11-06 (checklist + verify_gate + trace 5/5).

## Prompt patterns skill (issue 24, P0)

- Option **A**: skill `prompt-patterns` only — no new agent. Not in `MINIMAL_CORE_SKILLS`.
- Wire via `ai-specialist` and `backend-specialist`.
- Content map: roles/structure, few-shot, tool/agent prompts, versioning, safety/injection, anti-patterns. No vendor cookbooks; measure prompt changes via `llm-eval`.
- Related Skills pointers from `rag-patterns` and `llm-eval` (prompt ≠ retrieval; prompt ≠ eval harness).
- Slug `add-prompt-patterns`; branch `24-add-prompt-patterns` (stacked on llm-eval). Epic #24. AAS id `prompt-engineering` → Axion `prompt-patterns`.
- Inventory after cut: skills **54**, agents **21**. Profile approx: minimal ~44 / standard ~53 / security ~54.
- Verify of slug `add-prompt-patterns` passed 2026-11-06 (checklist + verify_gate + trace 5/5).

## Feature flags skill (issue 24, P0)

- Option **A**: skill `feature-flags` only — no new agent. Not in `MINIMAL_CORE_SKILLS`.
- Wire via `devops-engineer` and `backend-specialist` (D1).
- Content S1: flag types, OpenFeature-leaning evaluation, defaults/fallback, progressive rollout, lifecycle/cleanup, security boundaries, anti-patterns. No vendor cookbooks; no flag service in the kit.
- Related Skills pointers from `deployment-procedures` and `observability`.
- Slug `add-feature-flags`; branch `24-add-feature-flags` (stacked on prompt-patterns). Epic #24. AAS id `feature-flags` → Axion `feature-flags`.
- Inventory after cut: skills **55**, agents **21**. Profile approx: minimal 45 / standard 54 / security 55 / fullstack 52 / mobile 49.
- Verify of slug `add-feature-flags` passed 2026-11-06 (checklist + verify_gate + trace 5/5).

## Postmortem skill (issue 24, P0)

- Option **A**: skill `postmortem` only — no new agent. Not in `MINIMAL_CORE_SKILLS`. Id **I1** `postmortem` (not AAS `postmortem-writing`).
- Wire via `devops-engineer` and `debugger` (D1).
- Content S1: blameless culture, triggers/when, template/timeline, contributing factors, action items, anti-patterns. Not live IR / ICS.
- Related Skills pointers from `deployment-procedures`, `observability`, and `systematic-debugging`.
- Slug `add-postmortem`; branch `24-add-postmortem` (stacked on feature-flags). Epic #24.
- Inventory after cut: skills **56**, agents **21**. Profile approx: minimal 46 / standard 55 / security 56 / fullstack 53 / mobile 50.
- Verify of slug `add-postmortem` passed 2026-11-06 (checklist + verify_gate + trace 5/5). Epic #24 **P0 catalog slices complete** (accessibility → payment → adr → llm-eval → prompt-patterns → feature-flags → postmortem). Issue may stay open for follow-ups.

## Auth patterns skill (issue 19)

- Chose Option A over observability and rag-patterns. Skill only — no new agent.
- Not in `MINIMAL_CORE_SKILLS`; wired via `backend-specialist` and `security-auditor` frontmatter deps.
- Canonical content in `pack/skills/auth-patterns/`; `api-patterns/auth.md` is a short pointer.
- Verify of slug `add-auth-patterns` passed 2026-11-05 (branch `19-add-auth-patterns`). Inventory skills = 47.

## RAG patterns (issue 23)

- Option **C**: skill `rag-patterns` **plus** agent `ai-specialist` (not in `MINIMAL_AGENTS`; skill not in `MINIMAL_CORE`).
- Wire `rag-patterns` into `backend-specialist` and `database-architect`; relate skill `mcp-builder` (pointer + agent deps). mcp-builder is a **skill**, not an agent.
- Scope includes **agentic RAG** / tool-calling loops, not only classic retrieve-then-generate. Project Type row **AI / RAG** added; WEB E-01 unchanged.
- Inventory after cut: agents **21**, skills **49**. Profile approx: minimal 39 / standard 48 / security 49. `eval_routing` golden cases = 18.
- Verify of slug `add-rag-patterns` passed 2026-11-06 (branch `23-add-rag-patterns`, issue 23).
