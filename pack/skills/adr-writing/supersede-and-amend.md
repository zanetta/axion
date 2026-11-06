# Supersede & Amend

## Supersede (replace a decision)

```
1. Write ADR-YYY with full Context / Decision / Rationale
2. Set ADR-YYY Status = Accepted
3. Set ADR-XXX Status = Superseded by ADR-YYY
4. In ADR-YYY Context, link “Supersedes ADR-XXX”
5. Update docs/adr/README index
```

Keep ADR-XXX readable — it explains past systems and migrations.

## Amend (clarify without changing the decision)

Use a short **Amendments** section at the bottom of the same ADR:

```markdown
## Amendments
- YYYY-MM-DD: Clarified that Redis is cache-only, not source of truth.
```

Amend when:
- Wording was ambiguous but the choice is unchanged
- You add operational detail that doesn’t reopen options

Do **not** amend to flip the Decision — that is a supersede.

## Forbidden

| Action | Why |
| --- | --- |
| Silent rewrite of Accepted Decision | Erases history |
| Delete old ADR file | Breaks links and archaeology |
| New ADR that contradicts an Accepted one without superseding | Two truths |
