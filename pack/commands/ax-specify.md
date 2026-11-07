---
description: Lock a formal SPEC ({slug}.spec.md) after discovery and Socratic Gate answers. Bridges /ax-discover and /ax-plan without writing application code.
name: ax-specify
contract_version: "1.0.0"
sdd_states:
  - specify
required_skills:
  - brainstorming
  - plan-writing
required_agents: []
required_artifacts:
  - "{slug}.spec.md"
preconditions:
  - "Direction chosen or ≥3 Socratic questions answered"
  - "Do not write application code"
scripts: []
side_effects:
  - write-files
  - write-memory
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /ax-specify - Lock Specification (SPEC)

(texto livre após o comando)

**FSM:** `discover` → **`specify`** → `/ax-plan`

---

## Purpose

Formalize and lock `{slug}.spec.md` after exploration and Socratic Gate answers, bridging `/ax-discover` and `/ax-plan` without writing application code.

---

## 🛑 Gate (blocking)

Before writing `{slug}.spec.md`, verify that:

- [ ] At least **3 Socratic questions** (Purpose, Users, Scope, Edge cases) have been answered (in `/ax-discover`, in the current session, or in `.agents/memory/`)
- [ ] User has confirmed the chosen direction

If not answered yet: **ask the ≥3 Socratic questions now and WAIT** for user responses before writing the SPEC. Do not invent answers or write `{placeholder}` cells.

---

## Steps

1. **Load Template**
   - Read `.agents/skills/plan-writing/templates/SPEC.template.md`
   - Read `.agents/skills/brainstorming/SKILL.md` if questions are still needed

2. **Write `{slug}.spec.md`** in the project root with:
   - **1. Problem** — Clear problem statement
   - **2. Actors / Users** — Target actors and goals
   - **3. Scope** — In scope and Non-goals
   - **4. Constraints** — Technical, timeline, compliance, or brand constraints
   - **5. Interfaces / Contracts** — API, UI, CLI, or event shapes
   - **6. Risks** — Key risks and mitigations
   - **7. Socratic Gate evidence** — Table with ≥3 answered questions (no `{placeholder}` tokens)
   - **8. Traceability** — `SPEC-{slug}-1..N` mapped to PLAN tasks and ACCEPTANCE IDs
   - **9. Acceptance of SPEC** — Sign-off checklist

3. **Hand-off**
   - Present `{slug}.spec.md` to the user for approval
   - Tell user to run `/ax-plan {slug}` next
   - **Do not write application code** in `/ax-specify`

---

## After Specifying

Tell user:
```
[OK] SPEC: {slug}.spec.md

Next steps:
- Review + approve SPEC
- `/ax-plan {slug}` to generate PLAN and ACCEPTANCE
```

---

## Examples

```
/ax-specify auth-jwt
/ax-specify ecommerce-cart
/ax-specify saas-dashboard
```
