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
- **Superseded 2026-11-06:** commands no longer use workflows — see `ax-prefix-commands` (skills `ax-*`).

## Rename design skill (all adapters)

- Rediscover: Option A global, not an Antigravity-only transform. Command was `/design` then; now `/ax-design` after ax-prefix. No leftover stub. Accept = smokes on five tools, not IDE slash probe.
- Verified 2026-11-05 as slug `rename-design-skill`.

## ax- prefix commands

- Locked: Option C/S3 + G1 global rename + prefix `ax-` + dry cutover; all 13 commands; own issue (not #24).
- Antigravity: skills `.agents/skills/ax-*/SKILL.md`, not workflows. FSM state names unchanged; slash `/ax-*`.
- Verified 2026-11-06 as slug `ax-prefix-commands` (gate + trace 5/5; commands=13, skills=56). Branch `bugfix/antigravity-commands`.

## Observability skill (issue 20)

- Defaults locked like auth: skill-only, not MINIMAL_CORE, wire `devops-engineer` + `debugger`. Branch `20-add-observability`.
- Verified 2026-11-05 as slug `add-observability` (gate + trace covered).

## Accessibility (issue 24 P0)

- Defaults: Option A skill-only; wire frontend-specialist + qa-automation-engineer + mobile-developer; WCAG web + light mobile; script stays in frontend-design with pointer.
- Verified 2026-11-06 as slug `add-accessibility` (gate + trace 5/5; skills=50).

## Payment patterns (issue 24 P0)

- Defaults: Option A skill-only Stripe-first; wire backend-specialist + security-auditor; no Connect this slice; ADR later as new skill.
- Verified 2026-11-06 as slug `add-payment-patterns` (gate + trace 5/5; skills=51).

## ADR writing (issue 24 P0)

- Defaults: Option A skill `adr-writing`; wire planner+orchestrator+backend+explorer; move template from architecture; not MINIMAL_CORE.
- Verified 2026-11-06 as slug `add-adr-writing` (gate + trace 5/5; skills=52).

## LLM eval (issue 24 P0)

- Defaults: Option A skill `llm-eval`; wire ai-specialist + test-engineer; move from rag-patterns/evaluation.md; broad scope (judge + online); ≠ eval_routing.py.
- Verified 2026-11-06 as slug `add-llm-eval` (gate + trace 5/5; skills=53).

## Prompt patterns (issue 24 P0)

- Defaults: Option A skill-only `prompt-patterns`; wire ai-specialist + backend-specialist; pointers from rag-patterns + llm-eval; not MINIMAL_CORE.
- Verified 2026-11-06 as slug `add-prompt-patterns` (gate + trace 5/5; skills=54).

## Feature flags (issue 24 P0)

- Defaults: Option A skill-only `feature-flags`; wire devops-engineer + backend-specialist (D1); S1 OpenFeature-leaning; pointers from deployment-procedures + observability; not MINIMAL_CORE.
- Verified 2026-11-06 as slug `add-feature-flags` (gate + trace 5/5; skills=55).

## Postmortem (issue 24 P0)

- Defaults: Option A skill-only `postmortem` (I1); wire devops-engineer + debugger (D1); S1 blameless+template+actions; pointers from deploy/observability/systematic-debugging; not MINIMAL_CORE; not live IR.
- Verified 2026-11-06 as slug `add-postmortem` (gate + trace 5/5; skills=56). Epic #24 P0 catalog complete.

## RAG patterns (issue 23)

- Chose Option C (skill + new agent), not skill-only. Agentic RAG + tool-calling in scope. Wire backend-specialist, database-architect, and relate mcp-builder skill.
- Verified 2026-11-06 as slug `add-rag-patterns` (gate + trace 5/5).
## Next skill after gap analysis (issue 19)

- Chose auth-patterns over observability and rag-patterns. Skill only; deps via agents, not MINIMAL_CORE.
- Verified 2026-11-05 as slug `add-auth-patterns`: pointer from `api-patterns/auth.md`; skills inventory 47.
