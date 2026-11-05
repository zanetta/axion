# Memory Index

## User
- [user] Always respond in Portuguese → user-preferences.md

## Project
- [project] Always create a new dedicated branch for major code changes → project-conventions.md
- [project] GitHub issues may use branch {issue}-{slug} → project-conventions.md
- [project] Dual PLAN names; slugs upgrade-to-adnostic, axion-agnostico-fase-2/3/4 → project-conventions.md
- [project] trace_report PLAN-task cells must be a single P#-# or PV-# → project-conventions.md
- [project] After pack cutover, Cursor needs root symlinks to pack/ or skills will not load → project-conventions.md
- [project] pack/ is canonical; .axion/scripts/ is real; --tool cursor, claude-code, codex, or windsurf → tech-decisions.md
- [project] diffKit compares post-transform content; profiles/protect orthogonal; update --tool is additive → tech-decisions.md
- [project] Kit repo dogfoods via root symlinks to pack/; memory stays live at repo root → tech-decisions.md
- [project] Codex hybrid: AGENTS.md + .agents/skills + .codex/config.toml → tech-decisions.md
- [project] Windsurf hybrid: AGENTS.md + .agents/skills + .windsurf/mcp_config.json; close #11 after merge → tech-decisions.md
- [project] FSM commands 1:1: discover, specify, plan, implement, verify, remember → tech-decisions.md
- [project] Transition aliases not in pack; docs+skills canonical-only; commands=13; hide-transition-aliases verified → tech-decisions.md
- [project] Slug sdd-command-rename verified; ACCEPTANCE evidence cannot use bare braces → project-conventions.md
- [project] /design on Cursor+Claude Code; skill+search.py on all four IDEs via .agents/shared → tech-decisions.md
- [project] Slug design-all-tools verified; design data path is .agents/shared not .cursor/shared → tech-decisions.md

## Feedback
- [feedback] Issue 11: Option B single cutover, then Option A pack symlinks when skills vanished → feedback-history.md
- [feedback] Issue 11 fase 3: Codex first, hybrid, no kit dogfood, MCP TOML, id codex → feedback-history.md
- [feedback] Issue 11 fase 4: .windsurf/ only, omit commands/rules, id windsurf, mcp_config.json, close #11 → feedback-history.md
