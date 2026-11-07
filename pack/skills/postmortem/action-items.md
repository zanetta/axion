# Action Items

A postmortem without tracked follow-ups is a diary entry.

## Quality bar

Each action item needs:

| Field | Requirement |
|-------|-------------|
| **What** | Concrete change (system, process, test, alert, doc) |
| **Owner** | Named person or team (not “eng”) |
| **Deadline** | Date or sprint |
| **Done when** | Verifiable exit (merged PR, alert live, drill run) |
| **Priority** | Prevent recurrence vs nice-to-have |

## Types

| Type | Examples |
|------|----------|
| Prevent | Fix bug, add guardrail, remove risky default |
| Detect | Alert, SLO, dashboard, synthetic check |
| Respond | Runbook, on-call tip, feature-flag kill switch |
| Learn | Training, architecture note, share-out |

## Follow-through

- Create tickets the same day the doc is finalized.
- Link tickets back to the postmortem.
- Review open actions in the next ops/retro meeting.
- Close only when “done when” is met — not when someone “looked at it”.
