# Anti-Patterns

| Anti-pattern | Why | Do instead |
|--------------|-----|------------|
| Prompt roulette without a fixed set | Can’t tell if better | Golden set + regression gate |
| Optimize only BLEU/ROUGE | Poor fit for open RAG | Faithfulness + task success |
| Judge without rubric | Noisy scores | Explicit PASS/FAIL criteria |
| Commit production PII in eval fixtures | Compliance / breach | Placeholders; synthetic or redacted |
| Measure only generation | Misses bad retrieval | Split retrieval vs answer |
| Confuse with `eval_routing.py` | Wrong tool | Kit routing ≠ LLM app eval |
| Vendor as architecture | Lock-in | Principles first; tools optional |
| Ignore refuse / empty cases | Hallucination blind spot | Must-refuse cases in the set |

## Review gate

Before merge: suite version noted, retrieval+answer covered, thresholds or baseline frozen, no secrets in fixtures.
