---
description: Structured idea exploration and Socratic questioning before writing a SPEC. Explores options and tradeoffs without locking a SPEC or writing code.
name: ax-discover
contract_version: "1.0.0"
sdd_states:
  - discover
required_skills:
  - brainstorming
required_agents: []
required_artifacts: []
preconditions:
  - "Do not write application code"
  - "Do not close {slug}.spec.md in this state (hand off to /ax-specify)"
scripts: []
side_effects:
  - read-only
  - write-memory
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /ax-discover - Structured Idea Exploration

(texto livre após o comando)

**FSM:** **`discover`** → `/ax-specify` → `/ax-plan`

---

## Purpose

Explore ideas, clarify requirements through Socratic questioning, and evaluate options and trade-offs before locking a formal specification.

> **Do not write `{slug}.spec.md` or application code during `/ax-discover`.** Once the user chooses a direction, hand off to `/ax-specify {slug}`.

---

## Behavior

When `/ax-discover` is triggered:

1. **Load Skill & Check Memory**
   - Read `.agents/skills/brainstorming/SKILL.md`
   - Check `.agents/memory/MEMORY.md` for existing project conventions and past decisions (skip questions already answered in memory)

2. **Socratic Gate**
   - Ask ≥3 clarifying questions covering **Purpose**, **Users**, and **Scope** (plus edge cases/trade-offs)
   - WAIT for answers before locking a direction

3. **Generate Options**
   - Propose at least 3 viable approaches with **Pros**, **Cons**, and **Effort** (Low | Medium | High)

4. **Compare and Recommend**
   - Summarize trade-offs and recommend one option with clear reasoning

5. **Hand-off**
   - Once the user chooses a direction, hand off to `/ax-specify {slug}` to lock `{slug}.spec.md`
   - **Do not write `{slug}.spec.md` or application code during `/ax-discover`.**

---

## Output Format

```markdown
## 🧠 Discover: [Topic]

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

Which direction would you like to take? Next step: `/ax-specify {slug}`
```

---

## Examples

```
/ax-discover authentication system
/ax-discover state management for complex form
/ax-discover database schema for social app
/ax-discover caching strategy
```

---

## Key Principles

- **Exploration only** — Do not write `{slug}.spec.md` or application code during `/ax-discover`
- **Visual when helpful** — Use diagrams for architecture options
- **Honest trade-offs** — Do not hide complexity
- **Defer to user** — Present options, let them choose, then hand off to `/ax-specify {slug}`
