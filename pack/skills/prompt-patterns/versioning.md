# Prompt Versioning

## Minimum practice

| Artifact | Store |
|----------|-------|
| `prompt_id` | Stable name (`support.reply.v3`) |
| Content | Git or prompt store (not only Dashboard UI) |
| Changelog | Why it changed |
| Linked eval | Golden set version / gate in `llm-eval` |

## When to bump

- System policy / safety change  
- Output schema change  
- Tool list or agent stop rules change  
- Few-shot set change that alters behavior  

## Ship checklist

1. Diff the prompt like code  
2. Run offline eval suite (`llm-eval`)  
3. Fail release on relative regression  
4. Record model id + prompt id in logs (no secret payloads)
