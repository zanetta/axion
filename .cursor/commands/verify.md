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
  - ".cursor/scripts/verify_gate.py"
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
3. **ACCEPTANCE first** — record every AC-* with the command that ran and its result, then mark Pass `[x]`
4. **Hard gate** — `verify_gate.py` must exit 0. A non-zero exit fails the task; do not report it as done
5. **Report evidence** — Show actual output, not assumptions
6. **Cover edge cases** — Test error paths, not just happy path

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
1. LOAD {slug}.acceptance.md — one AC-* row per check
2. IDENTIFY what changed (files, functions, behavior)
3. RUN each AC command and write the result in the evidence column; set Pass to [x]
4. RUN the hard gate and stop if it fails:

python3 .cursor/scripts/verify_gate.py . --acceptance {slug}.acceptance.md

5. REPORT evidence per AC-* only after the gate exits 0

RULES:
1. Follow verify-changes/SKILL.md protocol
2. "It should work" is NOT verification — run it
3. Exit 1 from verify_gate.py means the task failed (open AC-*, missing evidence, or checklist.py non-zero)
4. Do not check an AC box before the command has run; the gate rejects placeholders like {curl}
5. Ad-hoc verify with no ACCEPTANCE file: pass --allow-missing-acceptance; the checklist still runs
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
