---
description: Create project plan using project-planner agent. No code writing - only plan file generation.
name: plan
contract_version: "1.0.0"
sdd_states:
  - plan
required_skills:
  - plan-writing
  - brainstorming
required_agents:
  - project-planner
required_artifacts:
  - "{slug}.plan.md"
  - "{slug}.acceptance.md"
preconditions:
  - "SPEC exists OR ≥3 Socratic answers recorded"
scripts: []
side_effects:
  - write-files
  - invoke-agents
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /plan - Project Planning Mode

(texto livre após o comando)

**FSM:** `specify` → **`plan`** (blocked without SPEC / Socratic evidence)

---

## 🔴 CRITICAL RULES

1. **NO CODE WRITING** - Plan / ACCEPTANCE only
2. **Use project-planner agent** - not the editor's native Plan mode
3. **Socratic Gate (blocking)** - refuse to write PLAN until SPEC exists **or** ≥3 answered questions are recorded
4. **Templates** - base on `.agents/skills/plan-writing/templates/PLAN.template.md` + `verify-changes/templates/ACCEPTANCE.template.md`
5. **Traceability** - fill SPEC ↔ PLAN ↔ ACCEPTANCE IDs (optional `.axion/trace/{slug}.json`)

---

## Gate checklist (before writing)

- [ ] `{slug}.spec.md` exists, **or** Socratic Q&A (≥3) embedded in PLAN Gate section
- [ ] User direction confirmed (from `/brainstorm` or explicit answers)

If gate fails → run `/brainstorm` or ask 3 questions; **do not** invent a plan.

---

## Task

Use the `project-planner` agent with this context:

```
CONTEXT:
- User Request: (texto livre após o comando)
- Mode: PLANNING ONLY (no code)
- Templates:
  - .agents/skills/plan-writing/templates/PLAN.template.md
  - .agents/skills/verify-changes/templates/ACCEPTANCE.template.md
- Output:
  - {slug}.plan.md (or {slug}.md for backward compat)
  - {slug}.acceptance.md

NAMING RULES:
1. Extract 2-3 key words from request
2. Lowercase, hyphen-separated
3. Max 30 characters
4. Example: "e-commerce cart" → ecommerce-cart.plan.md

RULES:
1. Follow project-planner.md Phase -1 (Context Check)
2. Enforce Socratic Gate / SPEC precondition
3. Create PLAN + ACCEPTANCE with Traceability table
4. DO NOT write any application code
5. REPORT the exact file names created
```

---

## Expected Output

| Deliverable | Location |
|-------------|----------|
| PLAN | `{slug}.plan.md` (or `{slug}.md`) |
| ACCEPTANCE | `{slug}.acceptance.md` |
| Trace (optional) | `.axion/trace/{slug}.json` |

---

## After Planning

Tell user:
```
[OK] Plan: {slug}.plan.md
[OK] Acceptance: {slug}.acceptance.md

Next steps:
- Review + approve
- `/create` or `/enhance` for implementation
- `/verify` against ACCEPTANCE
```

---

## Naming Examples

| Request | Plan File |
|---------|-----------|
| `/plan e-commerce site with cart` | `ecommerce-cart.md` |
| `/plan mobile app for fitness` | `fitness-app.md` |
| `/plan add dark mode feature` | `dark-mode.md` |
| `/plan fix authentication bug` | `auth-fix.md` |
| `/plan SaaS dashboard` | `saas-dashboard.md` |

---

## Usage

```
/plan e-commerce site with cart
/plan mobile app for fitness tracking
/plan SaaS dashboard with analytics
```
