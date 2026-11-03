---
type: project
created: 2026-11-03
updated: 2026-11-03
---

# Tech Decisions

## Tool-agnostic SDD (issue 9, v1)

- Axion is an SDD framework with install adapters, not a Cursor-only kit.
- CLI `--tool` accepts `cursor` (default) or `claude-code`. Unknown IDs exit 1.
- `diffKit` must compare adapter-transformed content. Without that, Claude Code installs show false drift on commands, MCP, and `CLAUDE.md`.
- Profiles and protect stay orthogonal to `--tool`. Profile filter runs on source paths before projection. `update --tool` is additive and does not delete the other tool tree.
- `ui-ux-pro-max` and Cursor rule files are Cursor-only; omitted from the `claude-code` adapter.
- `CLAUDE.md` is a stub pointing to `AGENTS.md` and `AGENT_FLOW.md`. Do not overwrite an existing `CLAUDE.md` without `--force`.

## Pack extract (issue 11, v2, Option B)

- `pack/` is the canonical kit tree. `.axion/scripts/` is a real directory of 15 master scripts in the kit repo and in consumers (not a git symlink).
- Dual-layout: Python masters resolve `pack/` when present at the scanned root, else installed `.agents` / `.claude` / `.cursor` paths.
- Cursor adapter is not identity: it maps `pack/` onto Cursor native layout plus `.axion/scripts/`.
- Claude Code adapter maps `pack/` plus `.axion/scripts/`; omits `pack/rules` and `ui-ux-pro-max`; writes the `CLAUDE.md` stub.
- CLI walks `SOURCE_PATHS` (`pack`, `.axion/scripts`, `AGENTS.md`, `AGENT_FLOW.md`, `.env.example`) so dogfood root symlinks are not copied as extra source.
- `update` remains additive and does not delete leftover `.cursor/scripts/` from v1 installs.
- Codex and Windsurf adapters stayed out of this cutover.
- Kit repo dogfoods via root symlinks to `pack/`. `.agents/memory/` stays live at repo root; `pack/memory` is consumer seed.
- Verify of slug `axion-agnostico-fase-2` passed 2026-11-03 (GitHub issue 11).
