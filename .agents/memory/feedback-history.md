---
type: feedback
created: 2026-11-03
updated: "2026-11-06"
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
- Verified 2026-11-05: no `gemini` alias, no `~/.gemini/`, no kit dogfood, no version bump. `/design` collision was hint-only until the skill rename.

## Rename design skill (all adapters)

- Rediscover: Option A global, not an Antigravity-only transform. Command `/design` stays. No leftover stub. Accept = smokes on five tools, not IDE slash probe.
- Verified 2026-11-05 as slug `rename-design-skill`.

## Observability skill (issue 20)

- Defaults locked like auth: skill-only, not MINIMAL_CORE, wire `devops-engineer` + `debugger`. Branch `20-add-observability`.
- Verified 2026-11-05 as slug `add-observability` (gate + trace covered).

## Accessibility (issue 24 P0)

- Defaults: Option A skill-only; wire frontend-specialist + qa-automation-engineer + mobile-developer; WCAG web + light mobile; script stays in frontend-design with pointer.
- Verified 2026-11-06 as slug `add-accessibility` (gate + trace 5/5; skills=50).

## RAG patterns (issue 23)

- Chose Option C (skill + new agent), not skill-only. Agentic RAG + tool-calling in scope. Wire backend-specialist, database-architect, and relate mcp-builder skill.
- Verified 2026-11-06 as slug `add-rag-patterns` (gate + trace 5/5).
## Next skill after gap analysis (issue 19)

- Chose auth-patterns over observability and rag-patterns. Skill only; deps via agents, not MINIMAL_CORE.
- Verified 2026-11-05 as slug `add-auth-patterns`: pointer from `api-patterns/auth.md`; skills inventory 47.
