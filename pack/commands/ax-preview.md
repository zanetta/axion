---
description: Preview server start, stop, and status check. Local development server management.
name: ax-preview
---

> **Argumento livre:** A tarefa do usuário será fornecida em texto livre após o comando. Use esse texto como entrada principal deste workflow.

# /ax-preview - Preview Management

(texto livre após o comando)

---

## Task

Manage preview server: start, stop, status check.

### Commands

```
/ax-preview           - Show current status
/ax-preview start     - Start server
/ax-preview stop      - Stop server
/ax-preview restart   - Restart
/ax-preview check     - Health check
```

---

## Usage Examples

### Start Server
```
/ax-preview start

Response:
🚀 Starting preview...
   Port: 3000
   Type: Next.js

✅ Preview ready!
   URL: http://localhost:3000
```

### Status Check
```
/ax-preview

Response:
=== Preview Status ===

🌐 URL: http://localhost:3000
📁 Project: C:/projects/my-app
🏷️ Type: nextjs
💚 Health: OK
```

### Port Conflict
```
/ax-preview start

Response:
⚠️ Port 3000 is in use.

Options:
1. Start on port 3001
2. Close app on 3000
3. Specify different port

Which one? (default: 1)
```

---

## Technical

Auto preview uses `auto_preview.py` script:

```bash
python3 .axion/scripts/auto_preview.py start [port]
python3 .axion/scripts/auto_preview.py stop
python3 .axion/scripts/auto_preview.py status
```

