---
name: llm-eval
description: Evaluate LLM and RAG systems — golden sets, retrieval/faithfulness metrics, LLM-as-judge, online signals, and regression gates. Not vendor cookbooks; not Axion kit eval_routing.py.
when_to_use: "When measuring LLM/RAG quality, building golden sets, faithfulness/retrieval metrics, LLM-as-judge rubrics, online eval signals, or regression gates before shipping prompt/index/model changes. NOT for designing RAG pipelines (use rag-patterns), prompt craft alone (future prompt-engineering), or Axion kit routing eval (eval_routing.py)."
allowed-tools: Read, Write, Edit, Glob, Grep
---

# LLM Eval

> Measure before you tweak. Prompt changes without a fixed eval set are roulette.
> **Not** the same as Axion’s `eval_routing.py` (kit SDD routing smoke) — this skill is for **consumer LLM/RAG apps**.

## Selective Reading

Read **only** the file you need:

| File | Description | When to Read |
|------|-------------|--------------|
| `what-to-measure.md` | Retrieval / answer / e2e / ops layers | Scoping an eval |
| `offline-golden-sets.md` | Labeled queries, hard negatives, refuse cases | Building the suite |
| `retrieval-and-faithfulness.md` | Recall@k-class + groundedness principles | Debugging quality |
| `llm-as-judge.md` | Rubrics, bias, cost | Automated grading |
| `online-and-regression.md` | Prod signals + gates (`/verify` mindset) | CI / shipping |
| `anti-patterns.md` | Prompt roulette, BLEU-only, PII in logs | Review before merge |

## Related Skills

| Need | Skill |
|------|-------|
| RAG / agentic design | `rag-patterns` |
| Prompt craft / versioning | `prompt-patterns` |
| Test pyramid / AAA | `testing-patterns` |
| Prove changes by running | `verify-changes` |
| Vector / DB choices | `database-design` |
| MCP tools in agentic loops | `mcp-builder` |

## Decision Checklist

Before shipping an LLM/RAG change:

- [ ] Golden set exists (or expanded) for the change class?
- [ ] Retrieval measured separately from generation?
- [ ] Faithfulness / cite-or-refuse covered?
- [ ] Judge rubrics explicit if using LLM-as-judge?
- [ ] Regression gate defined (what fails the build)?
- [ ] No real PII/secrets in committed eval fixtures?

## Core Rules

1. **Retrieval before generation** when debugging wrong answers.
2. **Version** eval sets with index / prompt / model ids.
3. **Refuse cases** belong in the set — not only happy paths.
4. **Judges need rubrics** — free-form “score 1–5” without criteria is noise.
5. **Examples ≠ architecture** — LangSmith / Phoenix / DeepEval are optional tools.
