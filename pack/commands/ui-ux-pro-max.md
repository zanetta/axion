---
description: "Transition alias for /design (Cursor-only UI/UX design guide). Follow design.md."
name: ui-ux-pro-max
contract_version: "1.0.0"
side_effects:
  - run-shell
  - write-files
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /ui-ux-pro-max — Transition Alias (`→ /design`)

(texto livre após o comando)

> **Deprecated alias:** `/ui-ux-pro-max` is a transition alias for **`/design`** (Cursor-only).

## Instructions

Do not execute a separate workflow here. Load and follow the canonical command:

- Read and execute `.cursor/commands/design.md` (which searches `.cursor/shared/ui-ux-pro-max/scripts/search.py` and synthesizes the design system).
