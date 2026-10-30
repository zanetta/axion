---
description: Display agent and project status. Progress tracking and status board.
name: status
contract_version: "1.0.0"
sdd_states:
  - status
required_skills: []
required_agents: []
required_artifacts: []
preconditions: []
scripts:
  - ".cursor/scripts/session_manager.py"
  - ".cursor/scripts/auto_preview.py"
side_effects:
  - read-only
  - run-shell
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /status - Show Status

(texto livre após o comando)

---

## Task

Show current project and agent status.

### What It Shows

1. **Project Info**
   - Project name and path
   - Tech stack
   - Current features

2. **Agent Status Board**
   - Which agents are running
   - Which tasks are completed
   - Pending work

3. **File Statistics**
   - Files created count
   - Files modified count

4. **Preview Status**
   - Is server running
   - URL
   - Health check

---

## Example Output

```
=== Project Status ===

📁 Project: my-ecommerce
📂 Path: C:/projects/my-ecommerce
🏷️ Type: nextjs-ecommerce
📊 Status: active

🔧 Tech Stack:
   Framework: next.js
   Database: postgresql
   Auth: clerk
   Payment: stripe

✅ Features (5):
   • product-listing
   • cart
   • checkout
   • user-auth
   • order-history

⏳ Pending (2):
   • admin-panel
   • email-notifications

📄 Files: 73 created, 12 modified

=== Agent Status ===

✅ database-architect → Completed
✅ backend-specialist → Completed
🔄 frontend-specialist → Dashboard components (60%)
⏳ test-engineer → Waiting

=== Preview ===

🌐 URL: http://localhost:3000
💚 Health: OK
```

---

## Technical

Status uses these scripts:
- `python3 .cursor/scripts/session_manager.py status`
- `python3 .cursor/scripts/auto_preview.py status`
