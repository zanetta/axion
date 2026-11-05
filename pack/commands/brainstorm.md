---
description: "Transition alias for /discover followed by /specify. Use /discover to explore options and /specify to lock {slug}.spec.md."
name: brainstorm
contract_version: "1.0.0"
sdd_states:
  - discover
  - specify
required_skills:
  - brainstorming
required_agents: []
required_artifacts:
  - "{slug}.spec.md"
preconditions:
  - "Do not write application code"
scripts: []
side_effects:
  - write-files
  - write-memory
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /brainstorm — Transition Alias (`→ /discover` then `/specify`)

(texto livre após o comando)

> **Deprecated alias:** `/brainstorm` is a transition alias for **`/discover`** (structured exploration and Socratic questioning) followed by **`/specify`** (writing `{slug}.spec.md`).

## Instructions

Do not execute a separate workflow here. Load and follow the canonical commands in order:

1. **Explore (`/discover`):** Read and execute `.cursor/commands/discover.md` (or `.claude/commands/discover.md` in Claude Code) — ask ≥3 Socratic questions, propose ≥3 options, and wait for user direction without closing `{slug}.spec.md`.
2. **Lock SPEC (`/specify`):** Once the user confirms a direction, read and execute `.cursor/commands/specify.md` (or `.claude/commands/specify.md`) to write `{slug}.spec.md` and hand off to `/plan {slug}`.
