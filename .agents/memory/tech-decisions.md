---
type: project
created: 2026-11-03
updated: "2026-11-04"
---

# Tech Decisions

## Tool-agnostic SDD (issue 9, v1)

- Axion is an SDD framework with install adapters, not a Cursor-only kit.
- CLI `--tool` accepts `cursor` (default), `claude-code`, `codex`, or `windsurf`. Unknown IDs exit 1.
- `diffKit` must compare adapter-transformed content. Without that, Claude Code installs show false drift on commands, MCP, and `CLAUDE.md`.
- Profiles and protect stay orthogonal to `--tool`. Profile filter runs on source paths before projection. `update --tool` is additive and does not delete the other tool tree.
- Cursor rules stay Cursor-only. The design workflow does not: see "Design on all tools" below.
- `CLAUDE.md` is a stub pointing to `AGENTS.md` and `AGENT_FLOW.md`. Do not overwrite an existing `CLAUDE.md` without `--force`.

## Pack extract (issue 11, v2, Option B)

- `pack/` is the canonical kit tree. `.axion/scripts/` is a real directory of 15 master scripts in the kit repo and in consumers (not a git symlink).
- Dual-layout: Python masters resolve `pack/` when present at the scanned root, else installed `.agents` / `.claude` / `.cursor` paths.
- Cursor adapter is not identity: it maps `pack/` onto Cursor native layout plus `.axion/scripts/`.
- Claude Code adapter maps `pack/` plus `.axion/scripts/`; omits `pack/rules` and the `/ui-ux-pro-max` alias; writes the `CLAUDE.md` stub. `/design` and `.agents/shared/` are installed.
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

## SDD command names (six states)

- Slash commands match FSM states one to one: `/discover` → `/specify` → `/plan` → `/implement` → `/verify` → `/remember`. State names did not change. `/specify` stays outside `/discover`.
- `/discover` explores and asks; it does not close `{slug}.spec.md`. `/specify` holds the Socratic gate and writes the SPEC.
- `/implement` unifies former `/create` (greenfield) and `/enhance` (existing code). Gate for non-trivial work is the old `/create` gate.
- Canonical design command is `/design`. The `brainstorming` skill and the data folder name `ui-ux-pro-max` keep their names. See "Design on all tools" for where `/design` installs.
- Transition stubs, with no parallel workflow: `/brainstorm`, `/create`, `/enhance`, `/coordinate`, `/ui-ux-pro-max`. Inventory counts every command file, including stubs (18).
- Verify of slug `sdd-command-rename` passed 2026-11-04.

## Design on all tools

- Direction (discover 1A / 2A / 3B): the agent runs the design workflow and `search.py` on all four IDEs. Slash `/design` exists on Cursor and Claude Code only. Alias `/ui-ux-pro-max` stays Cursor-only.
- One data path: `.agents/shared/ui-ux-pro-max/`, projected from `pack/shared/` by all four adapters. Cursor no longer maps that tree to `.cursor/shared/`. `update` is additive, so an old `.cursor/shared/` tree may remain on disk unused.
- Skill `design` is in `MINIMAL_CORE_SKILLS` so profile `minimal` also gets it. CSVs stay in shared data, not inside the skill.
- Kit dogfood: `.agents/shared` → `pack/shared`.
- Verify of slug `design-all-tools` passed 2026-11-04. Inventory skills = 46.
