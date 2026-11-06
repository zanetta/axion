---
type: project
created: 2026-11-03
updated: "2026-11-05T21:52:00-03:00"
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

- `--tool antigravity` only (no `gemini` alias). Native, not Codex-thin: `pack/commands` → `.agents/workflows/`, `pack/rules` `.mdc` → `.agents/rules/*.md` (`trigger: glob` on pack rules; `model_decision` if no Cursor frontmatter). Skills/shared/memory/schemas under `.agents/`. MCP `.agents/mcp_config.json` (JSON merge like Windsurf).
- `GEMINI.md` stub like `CLAUDE.md` (no clobber without `--force`). Omit `pack/agents` and `ARCHITECTURE.md`. Never write `~/.gemini/`. Kit repo does not dogfood Antigravity.
- `writeKitManifest` uses `adapter.rulesExt` (`.md` here; default `.mdc`). Pack smoke: commands=13, rules=7.
- Slash `/design` collides (workflow + skill). Document in `postInstallHints`; do not probe the IDE in CI. No npm version bump in this cut.
- Copilot, Aider, and Gemini CLI stay separate issues.
- Verify of slug `antigravity-adapter` passed 2026-11-05 (GitHub issue 17, branch `17-antigravity-adapter`).

## SDD command names (six states)

- Slash commands match FSM states one to one: `/discover` → `/specify` → `/plan` → `/implement` → `/verify` → `/remember`. State names did not change. `/specify` stays outside `/discover`.
- `/discover` explores and asks; it does not close `{slug}.spec.md`. `/specify` holds the Socratic gate and writes the SPEC.
- `/implement` unifies greenfield (Mode A) and existing-code (Mode B). Gate for non-trivial work is the greenfield-strength gate.
- Canonical design command is `/design`. The `brainstorming` skill and the data folder name `ui-ux-pro-max` keep those names. See "Design on all tools" for where `/design` installs.
- Transition aliases are maintainer-personal only and are not in `pack/`. Public docs, skill `when_to_use`, and `PLAN.template` name only canonical slashes. Inventory `commands=13`. Optional overlay: user-level Cursor commands outside git. Verify of slug `hide-transition-aliases` passed 2026-11-04 (Option C).
- Verify of slug `sdd-command-rename` passed 2026-11-04.

## Design on all tools

- Direction (discover 1A / 2A / 3B): the agent runs the design workflow and `search.py` on all install tools. Slash `/design` is the command/workflow on Cursor, Claude Code, and Antigravity. Codex and Windsurf get the skill only.
- One data path: `.agents/shared/ui-ux-pro-max/`, projected from `pack/shared/` by all adapters. Cursor no longer maps that tree to `.cursor/shared/`. `update` is additive, so an old `.cursor/shared/` tree may remain on disk unused.
- Skill id is `design-guide` (`MINIMAL_CORE_SKILLS`). CSVs stay in shared data, not inside the skill. Command `/design` is a different id.
- Verify of slug `rename-design-skill` passed 2026-11-05 (Option A global): pack `design` → `design-guide` on all five adapters, no per-adapter transform, no leftover stub. Additive `update` may leave unused `skills/design/`. E-01 WEB row stays without `design`/`design-guide`. Accept = smokes paths, not IDE slash probe.
- Kit dogfood: `.agents/shared` → `pack/shared`.
- Verify of slug `design-all-tools` passed 2026-11-04. Inventory skills = 46. Antigravity hint: `/design` is the SDD workflow; the searchable guide is skill `design-guide`.

## Observability skill (issue 20)

- Option A: skill `observability` only — no new agent. Not in `MINIMAL_CORE_SKILLS` (arrives via agent deps).
- Wire via `devops-engineer` and `debugger`. Decision trees (logs, OTel, metrics, alerts, error tracking) — not vendor cookbooks. Light pointers from `server-management` / `deployment-procedures` / `systematic-debugging`.
- Slug `add-observability`; branch `20-add-observability`. Kit run-log (O-01 / `.axion/logs/runs.jsonl`) is out of scope for this skill (consumer apps only).
- Inventory skills = 47 after this cut (base was 46 on main without auth). Profile approx: minimal 37 / standard 46 / security 47.
- Parallel track: auth skill (`add-auth-patterns`, issue 19) on branch `19-add-auth-patterns` — rebase inventory if both merge.
- Verify of slug `add-observability` passed 2026-11-05 (checklist + verify_gate + trace 5/5).
- Verify of slug `design-all-tools` passed 2026-11-04. Inventory skills was 46 then; Antigravity hint: `/design` is the SDD workflow; the searchable guide is skill `design-guide`.

## Auth patterns skill (issue 19)

- Chose Option A over observability and rag-patterns. Skill only — no new agent.
- Not in `MINIMAL_CORE_SKILLS`; wired via `backend-specialist` and `security-auditor` frontmatter deps.
- Canonical content in `pack/skills/auth-patterns/`; `api-patterns/auth.md` is a short pointer.
- Verify of slug `add-auth-patterns` passed 2026-11-05 (branch `19-add-auth-patterns`). Inventory skills = 47.
