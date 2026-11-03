# Axion contract schemas (P0)

JSON Schema drafts for skill and command frontmatter.

| Schema | Applies to |
| --- | --- |
| `skill-contract.schema.json` | `.agents/skills/*/SKILL.md` |
| `command-contract.schema.json` | `.cursor/commands/*.md` |

**Pilot skills (contract_version 1.0.0):** `brainstorming`, `plan-writing`, `verify-changes`, `coordinator-mode`

**Pilot commands:** `/plan`, `/verify`, `/status`, `/orchestrate`

Full CI validation of all skills/commands is **P2 (Q-02)**.
