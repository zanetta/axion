# Roles & Structure

## Typical roles

| Role | Owns |
|------|------|
| **System** (or developer) | Stable policy: persona, output format, safety, tool rules |
| **User** | Task + untrusted content (questions, pasted docs) |
| **Assistant** | Model output history |
| **Tool** | Structured tool results (not free-form instructions) |

## Decision tree

```
Need a new prompt?
│
├── Stable policy / format / safety → put in System
├── Per-request task or user paste → User (never promote to System)
├── Multi-turn agent → keep System fixed; append User/Tool turns
└── “Just dump everything in one string” → refuse; split roles
```

## Structure tips

- Lead with **goal**, then **constraints**, then **output schema**.
- Prefer JSON/schema or bullet fields over prose when parsing.
- Keep System short enough to re-read in review — long System = smell.
