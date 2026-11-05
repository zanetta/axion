---
type: feedback
created: 2026-11-03
updated: 2026-11-05
---

# Feedback History

## Issue 11 (axion agnostico fase 2)

- Chose Option B: single cutover to `pack/` + `.axion/scripts/`, not an incremental extract.
- After the cutover, skills stopped loading in this repo. Chose Option A: create root symlinks to `pack/` rather than keep a duplicate native tree.

## Issue 11 (axion agnostico fase 3)

- Codex first, Windsurf later on the same issue. Hybrid projection. No Codex dogfood in the kit repo.
- Include MCP as `.codex/config.toml`. Tool id is `codex` (not `openai-codex`).

## Issue 11 (axion agnostico fase 4)

- Dest only `.windsurf/` (not `.devin/`, not dual-write). Omit commands and rules (Codex-thin). Id `windsurf`; skills only `.agents/skills/`.
- MCP path `.windsurf/mcp_config.json` (not `mcp.json`). Close issue 11 after this cut; Copilot/Aider/Gemini get new issues.

## Issue 17 (Antigravity adapter)

- Discover: Option B native, id `antigravity`, map workflows, no kit dogfood. Specify locked those plus MCP `.agents/mcp_config.json`, rules transform, GEMINI stub, omit personas.
- Verified 2026-11-05: no `gemini` alias, no `~/.gemini/`, no kit dogfood, no version bump. `/design` collision is hint-only.
