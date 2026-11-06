# Grounding and Citations

> Users should see **where** an answer came from — or a clear refusal.

## Rules

1. **Cite chunk/doc IDs** (or URLs) that support each claim
2. **Refuse** when retrieval is empty or confidence/support is below threshold
3. **Separate** model opinion from quoted evidence
4. **Don't invent** sources — citations must map to retrieved hits

## Prompt Shape (conceptual)

```
System: Answer ONLY using the Context. If insufficient, say you don't know.
Context: [chunk text + source locators]
User: [question]
```

## UX Patterns

| Pattern | Use |
|---------|-----|
| Inline footnotes | Docs / research UIs |
| Source cards | Chat with browseable snippets |
| “No sources” state | Explicit empty retrieval |

## Multi-tenant / ACL

Never cite or return chunks the user cannot access. Filter **before** generation.
