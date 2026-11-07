---
name: postmortem
description: Blameless postmortem practice — triggers, timeline template, contributing factors, action items, and anti-patterns. Learning after the incident is stable; not live incident response.
when_to_use: "When writing or facilitating a blameless postmortem, SEV review, or post-incident learning doc. NOT for live IR / war room / paging (separate concern), routine deploy checklists (deployment-procedures), or root-cause debugging while still firefighting (systematic-debugging during the incident)."
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Postmortem

> After the system is **stable**, turn the incident into **shared learning**. Blame the conditions, not the people.

## Selective Reading

| File | Description | When to Read |
|------|-------------|--------------|
| `blameless-culture.md` | Systems over individuals | Setting the tone |
| `triggers-and-when.md` | When a writeup is required | Severity / near-miss calls |
| `template-and-timeline.md` | Structure + factual timeline | Drafting the doc |
| `contributing-factors.md` | Multi-factor RCA, 5 whys-style | Analysis section |
| `action-items.md` | Owners, deadlines, verification | Closing the loop |
| `anti-patterns.md` | Blame, no actions, PII dumps | Before publish |

## Related Skills

| Need | Skill |
|------|-------|
| Deploy / rollback context | `deployment-procedures` |
| Signals for the timeline | `observability` |
| Structured RCA while debugging | `systematic-debugging` |
| Authz / security incident follow-up | `auth-patterns` / `vulnerability-scanner` |

## Decision Checklist

- [ ] Incident stable (mitigated / resolved) before deep writeup?
- [ ] Blameless framing (conditions, not villains)?
- [ ] Timeline facts separated from analysis?
- [ ] Contributing factors (not a single scapegoat cause)?
- [ ] Action items with owner + deadline + how we'll know it's done?
- [ ] No secrets / raw PII in the published doc?

## Core Rules

1. **Stable first** — mitigate before the learning document.
2. **Blameless** — ask what allowed the failure, not who to punish.
3. **Facts then analysis** — timeline without speculation mixed in.
4. **Actions or it did not happen** — every meaningful finding needs a tracked follow-up.
5. **Share safely** — redact secrets and personal data.
