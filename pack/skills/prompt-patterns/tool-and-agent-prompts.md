# Tool & Agent Prompts

## Tool prompts

```
For each tool:
├── Name + one-line purpose
├── Parameter schema (required vs optional)
├── When to call / when NOT to call
└── How to handle errors (retry, ask user, abort)
```

Prefer provider tool/function APIs over asking the model to invent XML call syntax when the stack supports it.

## Agent loops

| Control | Why |
|---------|-----|
| Max steps / budget | Cost and runaway loops |
| Allowlist of tools | Least privilege |
| Stop conditions | Done / need user / failed |
| Observation format | Tool results as Tool role, not new System text |

## Failure modes to spell out

- Tool timeout / empty result  
- Conflicting tool outputs  
- User asks for disallowed tool → refuse  

Pair agentic retrieval design with `rag-patterns`; measure with `llm-eval`.
