# Memory Index

## User
- [user] Always respond in Portuguese → user-preferences.md

## Project
- [project] Always create a new dedicated branch for major code changes → project-conventions.md
- [project] GitHub issues may use branch {issue}-{slug} → project-conventions.md
- [project] Dual PLAN names; slugs upgrade-to-adnostic, axion-agnostico-fase-2/3/4 → project-conventions.md
- [project] trace_report PLAN-task cells must be a single P#-# or PV-# → project-conventions.md
- [project] After pack cutover, Cursor needs root symlinks to pack/ or skills will not load → project-conventions.md
- [project] pack/ is canonical; .axion/scripts/ is real; --tool cursor, claude-code, codex, windsurf, or antigravity → tech-decisions.md
- [project] diffKit compares post-transform content; profiles/protect orthogonal; update --tool is additive → tech-decisions.md
- [project] Kit repo dogfoods via root symlinks to pack/; memory stays live at repo root → tech-decisions.md
- [project] Codex hybrid: AGENTS.md + .agents/skills + .codex/config.toml → tech-decisions.md
- [project] Windsurf hybrid: AGENTS.md + .agents/skills + .windsurf/mcp_config.json; close #11 after merge → tech-decisions.md
- [project] FSM commands 1:1: discover, specify, plan, implement, verify, remember → tech-decisions.md
- [project] Transition aliases not in pack; docs+skills canonical-only; commands=13; hide-transition-aliases verified → tech-decisions.md
- [project] Slug sdd-command-rename verified; ACCEPTANCE evidence cannot use bare braces → project-conventions.md
- [project] /design is the command/workflow; skill design-guide + search.py on all five tools via .agents/shared → tech-decisions.md
- [project] Slug design-all-tools verified; design data path is .agents/shared not .cursor/shared → tech-decisions.md
- [project] Slug antigravity-adapter verified 2026-11-05: native, id antigravity, no kit dogfood, issue 17 → tech-decisions.md
- [project] Slug rename-design-skill verified 2026-11-05: design-guide on all five adapters; command /design stays; no stub → tech-decisions.md
- [project] Slug add-observability verified 2026-11-05: skill observability, devops+debugger, not MINIMAL_CORE, skills=47 → tech-decisions.md
- [project] Slug add-rag-patterns verified 2026-11-06: rag-patterns+ai-specialist; agents=21 skills=49; not MINIMAL; issue 23 → tech-decisions.md
- [project] Slug add-accessibility verified 2026-11-06: skill accessibility Option A; frontend+QA+mobile; not MINIMAL; skills=50; issue 24 → tech-decisions.md
- [project] Slug add-payment-patterns verified 2026-11-06: payment-patterns Stripe-first; backend+security; not MINIMAL; skills=51; issue 24 → tech-decisions.md
- [project] Slug add-adr-writing verified 2026-11-06: adr-writing; planner+orch+backend+explorer; template moved; skills=52; issue 24 → tech-decisions.md
- [project] Slug add-llm-eval verified 2026-11-06: llm-eval; ai+test; moved from rag evaluation; ≠ eval_routing; skills=53; issue 24 → tech-decisions.md
- [project] Slug add-auth-patterns verified 2026-11-05: skill auth-patterns; issue 19; skills=47; not MINIMAL_CORE → tech-decisions.md

## Feedback
- [feedback] Issue 11: Option B single cutover, then Option A pack symlinks when skills vanished → feedback-history.md
- [feedback] Issue 11 fase 3: Codex first, hybrid, no kit dogfood, MCP TOML, id codex → feedback-history.md
- [feedback] Issue 11 fase 4: .windsurf/ only, omit commands/rules, id windsurf, mcp_config.json, close #11 → feedback-history.md
- [feedback] Issue 17 verified: native Antigravity, workflows mapped, GEMINI stub, /design hint-only, no dogfood → feedback-history.md
- [feedback] Rename skill: Option A global, keep /design, no stub, smokes-only on five tools → feedback-history.md
- [feedback] Issue 20: skill-only observability, not MINIMAL_CORE, wire devops+debugger → feedback-history.md
- [feedback] Issue 23: Option C rag+ai-specialist, agentic RAG, wire backend/DB + mcp-builder → feedback-history.md
- [feedback] Issue 24: Option A skill-only accessibility; wire frontend+QA+mobile; script stays frontend-design → feedback-history.md
- [feedback] Issue 24 payments: Option A Stripe-first payment-patterns; wire backend+security; Connect later; ADR=new skill → feedback-history.md
- [feedback] Issue 24 ADR: Option A adr-writing; move template from architecture; wire planner+orch+backend+explorer → feedback-history.md
- [feedback] Issue 24 llm-eval: Option A; wire ai+test; move from rag-patterns; broad judge+online; ≠ eval_routing → feedback-history.md
