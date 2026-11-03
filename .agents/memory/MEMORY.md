# Memory Index

## User
- [user] Always respond in Portuguese → user-preferences.md

## Project
- [project] Always create a new dedicated branch for major code changes → project-conventions.md
- [project] GitHub issues may use branch {issue}-{slug} → project-conventions.md
- [project] Dual PLAN names; slugs upgrade-to-adnostic, axion-agnostico-fase-2, axion-agnostico-fase-3 → project-conventions.md
- [project] trace_report PLAN-task cells must be a single P#-# or PV-# → project-conventions.md
- [project] After pack cutover, Cursor needs root symlinks to pack/ or skills will not load → project-conventions.md
- [project] pack/ is canonical; .axion/scripts/ is real; --tool cursor, claude-code, or codex → tech-decisions.md
- [project] diffKit compares post-transform content; profiles/protect orthogonal; update --tool is additive → tech-decisions.md
- [project] Kit repo dogfoods via root symlinks to pack/; memory stays live at repo root → tech-decisions.md
- [project] Codex hybrid: AGENTS.md + .agents/skills + .codex/config.toml; Windsurf still open on #11 → tech-decisions.md

## Feedback
- [feedback] Issue 11: Option B single cutover, then Option A pack symlinks when skills vanished → feedback-history.md
- [feedback] Issue 11 fase 3: Codex first, hybrid, no kit dogfood, MCP TOML, id codex → feedback-history.md
