# When to Write an ADR

## Write an ADR when **most** of these are true

```
Significant if:
├── Cross-cutting (affects >1 domain / team / service)
├── Hard or expensive to reverse later
├── Real alternatives were considered (not a single obvious path)
├── Newcomers will ask “why did we…?”
└── The choice constrains `/plan` or `/implement` work
```

Examples that usually deserve an ADR: framework/runtime, primary datastore, auth model, sync vs async boundary, multi-tenant strategy, public API style (REST vs GraphQL).

## Skip an ADR when

| Situation | Prefer |
| --- | --- |
| Trivial naming / file layout | Code review comment |
| Temporary spike / throwaway prototype | Spike notes; promote to ADR if kept |
| Pure bug fix with no design change | PR description |
| Already covered by an Accepted ADR | Link the existing ADR |
| Preference with no alternatives | Don’t invent fake options |

## Timing

```
Discover / Specify → optional Proposed ADR for big forks
Plan → Accepted ADR before implement when the decision is locked
Implement → don’t invent silent architecture; open/update ADR first
Remember → pointer to ADR id for cross-session recall (not a full copy)
```

## Threshold heuristic

If you can reverse the choice in a day with low risk → usually **no** ADR.  
If reversing means a migration, rewrite, or multi-team coordination → **yes** ADR.
