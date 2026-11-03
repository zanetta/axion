---
type: project
created: 2026-05-25
updated: 2026-11-03
---

# Project Conventions

## Git Workflow
- Always create a new dedicated branch for major code changes.
- Branch name format should follow: `feature/[task-slug]` or `fix/[bug-slug]`.
- GitHub issues also use `{issue}-{slug}` (example: `9-upgrade-to-agnostic`).

## SDD artifacts
- Keep both a user-requested hyphenated PLAN file and the `{slug}.plan.md` mirror required by `trace_report.py`.
- Slug for the tool-agnostic work: `upgrade-to-adnostic` (intentional spelling kept).
