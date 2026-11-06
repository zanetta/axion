# Storage & Index

## Default layout

```text
docs/
└── adr/
    ├── README.md                 # optional index table
    ├── 001-use-nextjs.md
    ├── 002-postgresql-over-mongodb.md
    └── 003-adopt-repository-pattern.md
```

Prefer `docs/adr/` (flat, numbered). Legacy `docs/architecture/adr-00N-*.md` is fine if the repo already uses it — **don’t rename en masse** in a drive-by.

## Naming

| Part | Rule |
| --- | --- |
| Number | Zero-padded integer, unique, never reuse |
| Slug | kebab-case decision summary |
| Extension | `.md` |

Filename number should match `ADR-[XXX]` in the title when practical.

## Index (README)

Maintain a short table:

| ID | Title | Status | Date |
| --- | --- | --- | --- |
| 001 | Use Next.js | Accepted | 2026-11-06 |
| 002 | … | Superseded by 004 | … |

## Links from SDD artifacts

| Artifact | How to link |
| --- | --- |
| SPEC / PLAN | “Decision: see `docs/adr/00N-….md`” in Constraints or Risks |
| ACCEPTANCE | Only if an AC asserts the ADR exists (rare) |
| Memory | One-line pointer to ADR id — not a full paste |

## Kit repo note

Axion itself may keep ADRs for the kit under `docs/adr/` when maintainers choose; consumer apps follow the same convention.
