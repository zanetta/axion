---
description: Save information to persistent memory for cross-session recall. Stores preferences, conventions, decisions, and context.
name: remember
contract_version: "1.0.0"
sdd_states:
  - remember
required_skills:
  - memory-system
required_agents: []
required_artifacts: []
preconditions: []
scripts: []
side_effects:
  - write-memory
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /remember — Persistent Memory Management

(texto livre após o comando)

**FSM:** final state after `verify` — persist decisions / conventions (no app code).

---

## 🔴 CRITICAL RULES

1. **Load memory-system skill** — Read `.agents/skills/memory-system/SKILL.md` first
2. **Never auto-delete memories** — Always ask user before pruning
3. **Keep index under 200 lines** — Warn if approaching limit
4. **Distill, don't copy** — Save insights, not full conversations

---

## Task

Use the `memory-system` skill to save information:

```
CONTEXT:
- User wants to remember: (texto livre após o comando)
- Memory location: .agents/memory/

WORKFLOW:
1. CLASSIFY the information type: user | feedback | project | reference
2. CHECK if relevant topic file exists in .agents/memory/
3. SAVE to appropriate topic file (create if needed)
4. UPDATE .agents/memory/MEMORY.md index with one-line pointer
5. CONFIRM to user what was saved

RULES:
1. Follow memory-system/SKILL.md taxonomy
2. Keep index entries under 150 characters
3. Topic files must have frontmatter (type, created, updated)
4. Don't save information derivable from code
5. Don't save temporary debug context
```

---

## Expected Output

```
[OK] Saved to memory

Type: [user/feedback/project/reference]
File: .agents/memory/[topic-file].md
Entry: [one-line summary of what was saved]

This will be available in future sessions.
```

---

## Usage Examples

```
/remember I prefer using bun instead of npm
/remember Our API uses JWT with httpOnly cookies
/remember The production server is at api.example.com:8080
/remember I like concise responses with tables
```
