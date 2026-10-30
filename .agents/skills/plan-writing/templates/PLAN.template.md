---
id: PLAN-{SLUG}
title: "{TITLE}"
status: draft
sdd_state: plan
spec: "SPEC-{SLUG}"
acceptance: "{slug}.acceptance.md"
created: "{ISO_DATE}"
updated: "{ISO_DATE}"
---

# PLAN: {TITLE}

> Produced by `/plan` + `project-planner`. **No application code** in this step.
> Requires: approved SPEC (or embedded Socratic Gate evidence below).

## Links

| Artifact | Path |
| --- | --- |
| SPEC | `{slug}.spec.md` (or section in this file) |
| ACCEPTANCE | `{slug}.acceptance.md` |
| Trace (optional) | `.axion/trace/{slug}.json` |

## Gate checklist (blocking)

- [ ] SPEC exists **or** ≥3 Socratic answers recorded below
- [ ] User confirmed plan before `/create` or `/enhance`

### Socratic evidence (if no separate SPEC)

| # | Question | Answer |
| --- | --- | --- |
| 1 | | |
| 2 | | |
| 3 | | |

## Phases

### Phase 0 — Discovery / context

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P0-1 | {task} | explorer-agent | — | — | {criterion} |

### Phase 1 — Implementation

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| P1-1 | {task} | {agent} | {skills} | P0-1 | {criterion} |

### Phase 2 — Verification (always last)

| ID | Task | Agent | Skills | Deps | Done when |
| --- | --- | --- | --- | --- | --- |
| PV-1 | Run ACCEPTANCE checks | test-engineer | verify-changes, testing-patterns | P1-* | All AC-* pass |

## Critical path

{P0-1 → P1-1 → PV-1}

## Traceability

| SPEC ID | PLAN task | ACCEPTANCE ID |
| --- | --- | --- |
| SPEC-{SLUG}-1 | P1-1 | AC-1 |

## Write allowlist

Paths the implement phase may create or modify. A write outside this list is refused, including a batch edit. `.env` and any path containing `credentials` stay refused even if listed.

| Path | Why |
| --- | --- |
| `{path}` | {reason} |

## Out of scope

- {item}
