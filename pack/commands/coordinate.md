---
description: "Transition alias for /orchestrate with coordinator-mode skill. Follow orchestrate.md."
name: coordinate
contract_version: "1.0.0"
sdd_states:
  - orchestrate
required_skills:
  - coordinator-mode
  - parallel-agents
required_agents:
  - orchestrator
required_artifacts:
  - "{slug}.plan.md"
preconditions:
  - "SPEC or ≥3 Socratic answers and approved PLAN before implementation workers"
scripts: []
side_effects:
  - invoke-agents
  - write-files
  - run-shell
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /coordinate — Transition Alias (`→ /orchestrate`)

(texto livre após o comando)

> **Deprecated alias:** `/coordinate` is a transition alias for **`/orchestrate`** (with `.agents/skills/coordinator-mode/SKILL.md` loaded).

## Instructions

Do not execute a separate workflow here. Load and follow the canonical command:

1. Load `.agents/skills/coordinator-mode/SKILL.md`.
2. Read and execute `.cursor/commands/orchestrate.md` (or `.claude/commands/orchestrate.md` in Claude Code), enforcing `side_effect_guard.py` and `circuit_breaker.py`.
3. When logging run metrics via `session_manager.py log`, prefer `--command-name orchestrate` (or `--command-name coordinate` for backward compatibility).
