---
type: project
created: 2026-11-03
updated: 2026-11-03
---

# Tech Decisions

## Tool-agnostic SDD (issue 9, v1)

- Axion is an SDD framework with install adapters, not a Cursor-only kit.
- CLI `--tool` accepts `cursor` (default) or `claude-code`. Unknown IDs exit 1.
- v1 keeps kit source in the current repo layout so path/contract/inventory linters stay frozen. Adapters project one-to-many at `init`/`update`. Physical `pack/` extraction and Codex/Windsurf adapters are v2.
- `diffKit` must compare adapter-transformed content. Without that, Claude Code installs show false drift on commands, MCP, and `CLAUDE.md`.
- Profiles and protect stay orthogonal to `--tool`. Profile filter runs on source paths before projection. `update --tool` is additive and does not delete the other tool tree.
- `ui-ux-pro-max` and Cursor rule files are Cursor-only; omitted from the `claude-code` adapter.
- `CLAUDE.md` is a stub pointing to `AGENTS.md` and `AGENT_FLOW.md`. Do not overwrite an existing `CLAUDE.md` without `--force`.
