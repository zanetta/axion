# Trade-off Analysis

> Document options and consequences when designing. For the **canonical ADR artifact** (template, status, storage), use skill **`adr-writing`**.

## Decision Framework

For EACH architectural component under discussion, capture:

```markdown
### Context
- **Problem**: [What problem are we solving?]
- **Constraints**: [Team size, scale, timeline, budget]

### Options Considered

| Option | Pros | Cons | Complexity | When Valid |
|--------|------|------|------------|-----------|
| Option A | Benefit 1 | Cost 1 | Low | [Conditions] |
| Option B | Benefit 2 | Cost 2 | High | [Conditions] |

### Tentative choice
**Leaning**: [Option B]

### Trade-offs Accepted
- [What we're giving up]
- [Why this is acceptable]

### Revisit Trigger
- [When to reconsider]
```

When the choice is significant, **promote** this analysis into a formal ADR via `adr-writing` (`template.md`, lifecycle, `docs/adr/`).

## Related

| Need | Skill |
|------|-------|
| ADR template / status / supersede | [`adr-writing`](../adr-writing/SKILL.md) |
