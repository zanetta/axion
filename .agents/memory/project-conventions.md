---
type: project
created: 2026-05-25
updated: 2026-11-04
---

# Project Conventions

## Git Workflow
- Always create a new dedicated branch for major code changes.
- Branch name format should follow: `feature/[task-slug]` or `fix/[bug-slug]`.
- GitHub issues also use `{issue}-{slug}` (example: `9-upgrade-to-agnostic`).

## SDD artifacts
- Keep both a user-requested hyphenated PLAN file and the `{slug}.plan.md` mirror required by `trace_report.py`.
- Slug for the tool-agnostic v1 work: `upgrade-to-adnostic` (intentional spelling kept).
- Slug for pack extract v2: `axion-agnostico-fase-2`.
- Slug for Codex adapter v3: `axion-agnostico-fase-3`.
- Slug for Windsurf adapter v4: `axion-agnostico-fase-4`.
- `trace_report.py` PLAN-task cells must be a single `P#-#` or `PV-#`. A comma list fails the chain.

## Kit-repo dogfooding after pack/
- After the pack cutover, Cursor in this repo only loads skills/commands/rules/agents if root paths are symlinks into `pack/`.
- ACCEPTANCE must use `test -L` for those dogfood links and `test ! -e .cursor/scripts`, not `test ! -d` on `.cursor/commands`.
