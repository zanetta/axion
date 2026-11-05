---
description: "Transition alias for /implement (Existing codebase / feature enhancement mode). Follow implement.md."
name: enhance
contract_version: "1.0.0"
sdd_states:
  - implement
required_skills:
  - plan-writing
  - brainstorming
required_agents: []
required_artifacts: []
preconditions:
  - "For major changes: PLAN approved or ≥3 Socratic answers"
scripts: []
side_effects:
  - write-files
  - invoke-agents
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /enhance — Transition Alias (`→ /implement`)

(texto livre após o comando)

> **Deprecated alias:** `/enhance` is a transition alias for **`/implement`** (Mode B — Existing Codebase / Feature Update).

## Instructions

Do not execute a separate workflow here. Load and follow the canonical command:

- Read and execute `.cursor/commands/implement.md` (or `.claude/commands/implement.md` in Claude Code) in **Mode B — Existing Codebase / Feature Update**, enforcing the PLAN gate and `## Write allowlist` via `python3 .axion/scripts/side_effect_guard.py . --plan {slug}.plan.md --effect write-files --write <path>`.
