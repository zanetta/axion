# ADR Template (canonical)

> Moved from `architecture/trade-off-analysis.md`. Use this shape for every new ADR.

```markdown
# ADR-[XXX]: [Decision Title]

## Status
Proposed | Accepted | Deprecated | Superseded by [ADR-YYY]

## Context
[What problem? What constraints? Team size, scale, timeline, compliance.]

## Decision
[What we chose — be specific]

## Rationale
[Why — tie to requirements and constraints]

## Options Considered

| Option | Pros | Cons | Complexity | When Valid |
|--------|------|------|------------|-----------|
| Option A | … | … | Low | … |
| Option B | … | … | High | … |

## Trade-offs
[What we're giving up — be honest]

## Consequences
- **Positive**: [Benefits]
- **Negative**: [Costs / risks]
- **Mitigation**: [How to address negatives]

## Revisit Trigger
[When to reconsider this decision]
```

## Filling tips

- Title = decision, not topic (`Use Postgres` not `Database`).
- Number `XXX` from the repo index (`001`, `002`, …) — see `storage-and-index.md`.
- Keep the body short; link SPEC/PLAN for long narrative.
- Options table may be omitted only when a prior Proposed ADR already listed them and this ADR just Accepts.
