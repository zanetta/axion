---
description: Structured brainstorming for projects and features. Explores multiple options before implementation.
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

# /brainstorm - Structured Idea Exploration

(texto livre após o comando)

**FSM:** **`discover` → `specify`** → then `/plan`

---

## Purpose

Explore options and lock a **SPEC** before planning. Uses Socratic Gate (≥3 questions). Template: `.agents/skills/plan-writing/templates/SPEC.template.md`.

---

## Behavior

When `/brainstorm` is triggered:

1. **Socratic Gate**
   - Ask ≥3 clarifying questions (Purpose / Users / Scope) unless already answered in `.agents/memory/`
   - WAIT for answers before recommending

2. **Generate options**
   - At least 3 approaches with pros/cons

3. **Compare and recommend**
   - Summarize tradeoffs + recommendation

4. **Write SPEC** (after user picks a direction)
   - Create `{slug}.spec.md` from SPEC.template.md
   - Record answered questions in the SPEC Gate / Risks section

---

## Output Format

```markdown
## 🧠 Brainstorm: [Topic]

### Context
[Brief problem statement]

---

### Option A: [Name]
[Description]

✅ **Pros:**
- [benefit 1]
- [benefit 2]

❌ **Cons:**
- [drawback 1]

📊 **Effort:** Low | Medium | High

---

### Option B: [Name]
[Description]

✅ **Pros:**
- [benefit 1]

❌ **Cons:**
- [drawback 1]
- [drawback 2]

📊 **Effort:** Low | Medium | High

---

### Option C: [Name]
[Description]

✅ **Pros:**
- [benefit 1]

❌ **Cons:**
- [drawback 1]

📊 **Effort:** Low | Medium | High

---

## 💡 Recommendation

**Option [X]** because [reasoning].

What direction would you like to explore?
```

---

## Examples

```
/brainstorm authentication system
/brainstorm state management for complex form
/brainstorm database schema for social app
/brainstorm caching strategy
```

---

## Key Principles

- **No code** - ideas + SPEC only
- **Visual when helpful** - use diagrams for architecture
- **Honest tradeoffs** - don't hide complexity
- **Defer to user** - present options, let them decide
- **Hand-off** - after SPEC: tell user to run `/plan {slug}`
