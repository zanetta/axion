---
description: Implement new applications or enhance existing code following an approved PLAN. Unifies greenfield creation and iterative enhancements.
name: ax-implement
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
  - "For non-trivial work: approved PLAN ({slug}.plan.md) or SPEC + ≥3 Socratic answers"
scripts:
  - ".axion/scripts/session_manager.py"
  - ".axion/scripts/side_effect_guard.py"
  - ".axion/scripts/auto_preview.py"
side_effects:
  - write-files
  - invoke-agents
  - run-shell
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /ax-implement - Build or Update Application

(texto livre após o comando)

**FSM:** `plan` → **`implement`** → `/ax-verify`

---

## Task

This command unifies greenfield application creation and iterative updates to an existing codebase.

### 🛑 Gate (blocking)

Before writing application code on non-trivial or multi-file scope:

- [ ] `{slug}.plan.md` (or `{slug}.md`) exists **and** user approved, **or**
- [ ] Run `/ax-discover` → `/ax-specify` → `/ax-plan` first (SPEC **or** ≥3 Socratic answers → PLAN + ACCEPTANCE → user OK)
- [ ] Respect `## Write allowlist` in the active PLAN: before writing any file, run:
  ```bash
  python3 .axion/scripts/side_effect_guard.py . --plan {slug}.plan.md --effect write-files --write <path>
  ```
  Exit 1 refuses the write — do not write outside the allowlist.

Tiny single-file fixes may proceed after confirming impact with the user.

---

## Execution Modes

Detect whether the target is a greenfield project or an existing codebase and follow the corresponding mode:

### Mode A — Greenfield / New App

1. **Request Analysis & Planning Check**
   - Verify approved `{slug}.plan.md` exists (if not, stop and run `/ax-discover` → `/ax-specify` → `/ax-plan`)
2. **Application Building**
   - Load `.agents/skills/app-builder/SKILL.md`
   - Coordinate specialist agents in dependency order:
     - `database-architect` → Schema & migrations
     - `backend-specialist` → API & server logic
     - `frontend-specialist` → UI components & pages
3. **Preview & Hand-off**
   - Start preview when appropriate via `python3 .axion/scripts/auto_preview.py`
   - Hand off to `/ax-verify {slug}.acceptance.md`

### Mode B — Existing Codebase / Feature Update

1. **Inspect Current State**
   - Check project state with `python3 .axion/scripts/session_manager.py info`
   - Understand existing architecture, conventions, and dependencies
2. **Apply Incremental Changes per PLAN**
   - Enforce `side_effect_guard.py` against `## Write allowlist` before each file write
   - Invoke relevant domain specialist agents (`backend-specialist`, `frontend-specialist`, `database-architect`, `mobile-developer`, etc.)
   - Run relevant unit/integration tests
3. **Verify & Hand-off**
   - Hand off to `/ax-verify {slug}.acceptance.md`

---

## Usage Examples

```
/ax-implement follow plan in ecommerce-cart.plan.md
/ax-implement blog site from scratch
/ax-implement add dark mode to dashboard
/ax-implement add CSV export to orders table
```
