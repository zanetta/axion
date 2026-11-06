# Anti-Patterns

| Anti-pattern | Why | Do instead |
| --- | --- | --- |
| ADR for every rename / lint tweak | Noise; nobody reads the log | PR description |
| No Status line | Readers can’t tell if it’s binding | Always set status |
| Fake options (only one real choice) | Theater | Skip ADR or document constraint honestly |
| Dump entire design doc into ADR | Unreadable | Short ADR + link SPEC/PLAN |
| Rewrite Accepted Decision in place | Loses history | Supersede or amend |
| Delete superseded ADRs | Breaks links / onboarding | Keep + status Superseded |
| Code samples as the Decision | Couples ADR to API churn | Describe choice; link example PR |
| ADR without revisit trigger on risky bets | Stale forever | Add Revisit Trigger |
| Duplicate template under `architecture` | Two canons | Canonical template only in this skill |

## Review gate

Before merge: status present, one clear Decision, trade-offs honest, file under `docs/adr/` (or project convention), index updated if you keep one.
