---
name: architecture
description: Architectural decision-making framework. Requirements analysis, trade-off evaluation, pattern selection. For formal ADRs use adr-writing.
when_to_use: "When making architecture decisions, evaluating trade-offs, or analyzing system design. For writing/status/storage of Architecture Decision Records use adr-writing. NOT for direct code implementation."
allowed-tools: Read, Glob, Grep
---

# Architecture Decision Framework

> "Requirements drive architecture. Trade-offs inform decisions. ADRs capture rationale."

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

| File | Description | When to Read |
|------|-------------|--------------|
| `context-discovery.md` | Questions to ask, project classification | Starting architecture design |
| `trade-off-analysis.md` | Trade-off framework (+ pointer to adr-writing) | Comparing options before an ADR |
| `pattern-selection.md` | Decision trees, anti-patterns | Choosing patterns |
| `examples.md` | MVP, SaaS, Enterprise examples | Reference implementations |
| `patterns-reference.md` | Quick lookup for patterns | Pattern comparison |

---

## 🔗 Related Skills

| Skill | Use For |
|-------|---------|
| `@[skills/adr-writing]` | Formal ADRs (template, lifecycle, storage) |
| `@[skills/database-design]` | Database schema design |
| `@[skills/api-patterns]` | API design patterns |
| `@[skills/deployment-procedures]` | Deployment architecture |

---

## Core Principle

**"Simplicity is the ultimate sophistication."**

- Start simple
- Add complexity ONLY when proven necessary
- You can always add patterns later
- Removing complexity is MUCH harder than adding it

---

## Validation Checklist

Before finalizing architecture:

- [ ] Requirements clearly understood
- [ ] Constraints identified
- [ ] Each decision has trade-off analysis
- [ ] Simpler alternatives considered
- [ ] Significant decisions recorded via `adr-writing`
- [ ] Team expertise matches chosen patterns
