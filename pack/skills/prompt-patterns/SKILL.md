---
name: prompt-patterns
description: Prompt design decision trees — roles/structure, few-shot, tool/agent prompts, versioning, and prompt-injection safety. Not vendor cookbooks; measure changes with llm-eval.
when_to_use: "When designing or reviewing system/user prompts, few-shot examples, tool-calling prompts, prompt versioning, or prompt-injection defenses. NOT for RAG retrieval design (rag-patterns), eval harnesses (llm-eval), or model training/fine-tune."
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Prompt Patterns

> Structure prompts so models do the job **and** stay within bounds. Version every change; measure with `llm-eval`.
> Retrieval quality still beats clever wording — fix RAG first when evidence is wrong.

## Selective Reading

| File | Description | When to Read |
|------|-------------|--------------|
| `roles-and-structure.md` | System / user / tool message roles | Scaffolding a prompt |
| `few-shot-and-examples.md` | When examples help or hurt | Adding demonstrations |
| `tool-and-agent-prompts.md` | Tool schemas, agent loop prompts | Function calling / agents |
| `versioning.md` | Ids, change control, pair with eval | Shipping prompt edits |
| `safety-and-injection.md` | Injection, exfiltration, untrusted input | Security review |
| `anti-patterns.md` | Secrets in prompts, instruction soup | Before merge |

## Related Skills

| Need | Skill |
|------|-------|
| RAG / grounding | `rag-patterns` |
| Measure / regress prompts | `llm-eval` |
| MCP tool design | `mcp-builder` |
| API around LLM endpoints | `api-patterns` |

## Decision Checklist

- [ ] Roles clear (what is system vs user vs tool)?
- [ ] Untrusted user text isolated from instructions?
- [ ] Tools allowlisted and failure modes specified?
- [ ] Prompt id/version recorded; eval set touched if behavior changes?
- [ ] No secrets or real PII in prompt templates?

## Core Rules

1. **Separate instructions from data** — never concatenate untrusted text into the system prompt blindly.
2. **Prefer structure over essays** — short rules + schemas beat walls of text.
3. **Version prompts** like code — id + changelog; regress with `llm-eval`.
4. **Bound tools** — names, args, max steps; refuse unknown tools.
5. **Examples are optional** — bad few-shots teach the wrong pattern.
