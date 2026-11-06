---
name: adr-writing
description: Architecture Decision Records — when to write, canonical template, status lifecycle, storage/index, supersede/amend, and anti-patterns. Companion to architecture (context and trade-offs).
when_to_use: "When writing or reviewing an ADR, documenting a significant architecture choice, changing ADR status, superseding a decision, or setting up docs/adr/. NOT for implementing application code or full system design from scratch (use architecture)."
allowed-tools: Read, Write, Edit, Glob, Grep
---

# ADR Writing

> Capture **why** we chose X over Y. Keep ADRs short, dated, and status-aware.
> System context and pattern selection stay in `architecture`. **This skill owns the ADR artifact.**

## Selective Reading

Read **only** the file you need:

| File | Description | When to Read |
|------|-------------|--------------|
| `when-to-write.md` | Significance threshold | Deciding if an ADR is worth it |
| `template.md` | Canonical ADR markdown | Authoring a new ADR |
| `lifecycle-and-status.md` | Proposed → Accepted → Deprecated → Superseded | Status changes |
| `storage-and-index.md` | `docs/adr/`, numbering, links from PLAN/SPEC | Repo layout |
| `supersede-and-amend.md` | Replace or clarify without rewriting history | Evolving decisions |
| `anti-patterns.md` | Trivial ADRs, missing status, code dumps | Review before merge |

## Related Skills

| Need | Skill |
|------|-------|
| Context, patterns, trade-off tables | `architecture` |
| Task breakdown / PLAN | `plan-writing` |
| Persist cross-session decisions | `memory-system` |
| API / DB / deploy choices | `api-patterns`, `database-design`, `deployment-procedures` |

## Decision Checklist

Before shipping an ADR:

- [ ] Decision is significant (cross-cutting, hard to reverse, or multi-option)?
- [ ] Status set (usually Proposed → Accepted)?
- [ ] Context, decision, rationale, trade-offs, consequences filled?
- [ ] Revisit trigger or supersede link when relevant?
- [ ] File lives under agreed `docs/adr/` (or project equivalent)?
- [ ] Linked from PLAN/SPEC/memory when it drives implementation?

## Core Rules

1. **One decision per ADR** — not a design dump.
2. **Status is mandatory** — Proposed / Accepted / Deprecated / Superseded.
3. **Be honest about trade-offs** — what you gave up belongs in the record.
4. **Don’t rewrite history** — supersede or amend; keep the old ADR readable.
5. **Link, don’t bury** — index + pointers from PLAN/SPEC when the decision gates work.
