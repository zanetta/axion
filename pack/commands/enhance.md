---
description: Add or update features in existing application. Used for iterative development.
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
scripts:
  - ".cursor/scripts/session_manager.py"
side_effects:
  - write-files
  - invoke-agents
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /enhance - Update Application

(texto livre após o comando)

**FSM:** `plan` → **`implement`** (same gate as `/create` for non-trivial scope)

---

## Task

This command adds features or makes updates to existing application.

### Gate

Major / multi-file changes: require `{slug}.plan.md` (or inline `/plan` with SPEC **or** ≥3 Socratic answers) + user OK before coding. Tiny fixes may proceed after confirming impact.

### Steps:

1. **Understand Current State**
   - Load project state with `python3 .cursor/scripts/session_manager.py info`
   - Understand existing features, tech stack

2. **Plan Changes**
   - Prefer PLAN/ACCEPTANCE templates for non-trivial work
   - Determine what will be added/changed
   - Detect affected files
   - Check dependencies

3. **Present Plan to User** (for major changes)
   ```
   "To add admin panel:
   - New files: admin routes, components, and access control
   - Updates: navigation, auth middleware
   - Scope: moderate (touches auth + routing)
   
   Should I start?"
   ```

4. **Apply**
   - Call relevant agents
   - Make changes
   - Test

5. **Update Preview**
   - Hot reload or restart

---

## Usage Examples

```
/enhance add dark mode
/enhance build admin panel
/enhance integrate payment system
/enhance add search feature
/enhance edit profile page
/enhance make responsive
```

---

## Caution

- Get approval for major changes
- Warn on conflicting requests (e.g., "use Firebase" when project uses PostgreSQL)
- Commit each change with git
