# Offline Golden Sets

## Minimal set (start here)

1. **20–50** real questions with expected `doc_id`s and/or reference answers  
2. **Hard negatives** (lookalike docs that should *not* win)  
3. **Out-of-scope / empty** questions (must refuse or say insufficient evidence)  
4. **Regression** run on every chunking, embedding, prompt, or model change  

## Structure (conceptual)

```text
eval/
  cases.jsonl          # id, query, expected_doc_ids[], must_refuse?, tags[]
  README.md            # version, index hash, model ids under test
```

Use placeholders only in git — never commit production user text with PII.

## Versioning

| Change | Action |
|--------|--------|
| New chunking / index | Re-run retrieval slice; bump eval set version note |
| Prompt-only tweak | Re-run answer/faithfulness; keep retrieval baseline |
| Model swap | Full suite + cost/latency spot check |

## Freeze what you can

- Fixed seeds where APIs allow  
- Pin model + embedding versions in the report  
- Store retrieved context snapshots for failed cases (redacted)
