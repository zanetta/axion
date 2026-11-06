# Lifecycle & Status

## Allowed statuses

| Status | Meaning |
| --- | --- |
| **Proposed** | Under discussion; not binding for implement yet |
| **Accepted** | Team agreed; implement against this decision |
| **Deprecated** | No longer recommended; still historical; may lack a replacement |
| **Superseded by ADR-YYY** | Replaced by a newer ADR; keep file, point forward |

## Transitions

```
Proposed ──accept──► Accepted
    │                   │
    │                   ├──deprecate──► Deprecated
    │                   └──supersede──► Superseded by ADR-YYY
    └──withdraw──► Deprecated (optional; rare)
```

- Do **not** delete Accepted ADRs when wrong — supersede or deprecate.
- Changing the Decision body of an Accepted ADR without status change = anti-pattern (see `supersede-and-amend.md`).

## Who flips status

| Event | Typical owner |
| --- | --- |
| Proposed → Accepted | `/plan` approval / tech lead / orchestrator synthesis |
| → Superseded | New ADR Accepted that replaces it |
| → Deprecated | Explicit abandon without replacement |

## Checklist on status change

- [ ] Status line updated in the ADR file
- [ ] Index / README in `docs/adr/` updated if you maintain one
- [ ] Downstream PLAN/SPEC links still valid
- [ ] If Superseded: both ADRs cross-link
