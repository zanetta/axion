---
description: Create new application command. Triggers App Builder skill and starts interactive dialogue with user.
name: create
contract_version: "1.0.0"
sdd_states:
  - implement
required_skills:
  - app-builder
  - brainstorming
  - plan-writing
required_agents:
  - project-planner
required_artifacts:
  - "{slug}.plan.md"
preconditions:
  - "Approved PLAN (or SPEC + Socratic evidence if planning inline)"
scripts:
  - ".cursor/scripts/auto_preview.py"
side_effects:
  - write-files
  - invoke-agents
  - run-shell
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /create - Create Application

(texto livre após o comando)

**FSM:** `plan` → **`implement`** (blocked without PLAN / gate)

---

## Task

This command starts a new application creation process.

### Gate (blocking)

Before writing application code:

- [ ] `{slug}.plan.md` (or `{slug}.md`) exists **and** user approved, **or**
- [ ] Run inline `/plan` flow first: SPEC **or** ≥3 Socratic answers → PLAN + ACCEPTANCE → user OK

If gate fails → `/brainstorm` then `/plan`. Do **not** skip to `app-builder`.

### Steps:

1. **Request Analysis**
   - Understand what the user wants
   - If unclear: `brainstorming` skill (≥3 questions) + optional `{slug}.spec.md`

2. **Project Planning** (if no approved PLAN)
   - `project-planner` + PLAN/ACCEPTANCE templates
   - STOP for user approval

3. **Application Building (After Approval)**
   - Orchestrate with `app-builder` skill
   - Coordinate expert agents:
     - `database-architect` → Schema
     - `backend-specialist` → API
     - `frontend-specialist` → UI

4. **Verify + Preview**
   - Prefer `/verify` against `{slug}.acceptance.md`
   - Start with `.cursor/scripts/auto_preview.py` when complete

---

## Usage Examples

```
/create blog site
/create e-commerce app with product listing and cart
/create todo app
```
