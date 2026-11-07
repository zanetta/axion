# Safety & Prompt Injection

## Threat sketch

```
Untrusted input (user, web page, email, tool payload)
        │
        ▼
Can it override System instructions?
Can it exfiltrate secrets / other users’ data?
Can it coerce disallowed tools?
```

## Defenses (principles)

| Defense | Practice |
|---------|----------|
| Isolation | Keep instructions in System; treat user/tool text as **data** |
| Delimiters | Clear boundaries; don’t instruct “ignore previous” patterns in user content |
| Allowlists | Tools and URLs restricted server-side — not only in prose |
| Least privilege | Model never sees raw secrets; use server-side fetches |
| Output filters | Validate schema; strip unexpected tool calls |
| Logging | Redact prompts that may contain user PII |

## Never

- Put API keys, passwords, or PANs in prompts  
- Trust “you are now DAN / ignore policies” from user text  
- Pass tool results back as new System messages without review  

Security depth: pair with `vulnerability-scanner` / `auth-patterns` for app boundaries.
