---
description: Verify code changes work by running them. Proves through execution, not just inspection.
name: verify
contract_version: "1.0.0"
sdd_states:
  - verify
required_skills:
  - verify-changes
required_agents: []
required_artifacts:
  - verification_report
  - "{slug}.acceptance.md"
preconditions:
  - "Code changes exist to verify"
scripts:
  - ".cursor/scripts/checklist.py"
side_effects:
  - run-shell
  - read-only
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /verify — Prove Code Works

(texto livre após o comando)

**FSM:** `implement` → **`verify`** → `/remember`

---

## 🔴 CRITICAL RULES

1. **Load verify-changes skill** — Read `.agents/skills/verify-changes/SKILL.md` first
2. **Execute, don't inspect** — Run the code, don't just read it
3. **ACCEPTANCE first** — if `{slug}.acceptance.md` exists, check every AC-* with evidence
4. **Report evidence** — Show actual output, not assumptions
5. **Cover edge cases** — Test error paths, not just happy path

Template: `.agents/skills/verify-changes/templates/ACCEPTANCE.template.md`

---

## Task

Use the `verify-changes` skill to prove code works:

```
CONTEXT:
- What to verify: (texto livre após o comando)
- If empty: verify the most recent code changes in this session
- Prefer ACCEPTANCE file for the active slug when present

WORKFLOW:
1. LOAD {slug}.acceptance.md if present — map AC-* checks
2. IDENTIFY what changed (files, functions, behavior)
3. DETERMINE verification method (build, test, run, curl)
4. EXECUTE verification commands (include checklist.py when relevant)
5. REPORT evidence of success or failure per AC-*
6. FLAG anything that couldn't be verified automatically

RULES:
1. Follow verify-changes/SKILL.md protocol
2. "It should work" is NOT verification — run it
3. Test error paths, not just success paths
4. Report with actual command output as evidence
5. Do not mark orchestration "done" if required AC-* lack evidence
```

---

## Expected Output

```
## Verification Report

### Changes Verified
- [file/change 1]: ✅ Pass
- [file/change 2]: ✅ Pass

### Evidence
- Build: ✅ Compiled without errors
- Tests: ✅ [N]/[N] passing
- Runtime: ✅ [specific verification result]

### Not Verified
- [anything that needs manual testing]
```

---

## Usage Examples

```
/verify
/verify the login endpoint handles expired tokens
/verify build passes after refactoring
/verify the new component renders correctly
```
