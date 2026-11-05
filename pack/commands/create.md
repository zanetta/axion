---
description: "Transition alias for /implement (Greenfield / new application mode). Follow implement.md."
name: create
contract_version: "1.0.0"
sdd_states:
  - implement
required_skills:
  - app-builder
  - plan-writing
  - brainstorming
required_agents:
  - project-planner
required_artifacts:
  - "{slug}.plan.md"
preconditions:
  - "Approved PLAN ({slug}.plan.md) or SPEC + ≥3 Socratic answers"
scripts: []
side_effects:
  - write-files
  - invoke-agents
  - run-shell
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /create — Transition Alias (`→ /implement`)

(texto livre após o comando)

> **Deprecated alias:** `/create` is a transition alias for **`/implement`** (Mode A — Greenfield / New Application).

## Instructions

Do not execute a separate workflow here. Load and follow the canonical command:

- Read and execute `.cursor/commands/implement.md` (or `.claude/commands/implement.md` in Claude Code) in **Mode A — Greenfield / New App**, enforcing the PLAN gate and `## Write allowlist` via `python3 .axion/scripts/side_effect_guard.py . --plan {slug}.plan.md --effect write-files --write <path>`.
