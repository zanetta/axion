# Anti-Patterns

| Anti-pattern | Why | Do instead |
|--------------|-----|------------|
| Instruction soup (huge System) | Model ignores middle; hard to review | Short rules + schema |
| Secrets in prompts | Leak via logs/completions | Server secrets; placeholders in templates |
| Untrusted text fused into System | Injection | User/tool roles only |
| Unbounded tools | Cost / abuse | Allowlist + max steps |
| Prompt change without eval | Silent regressions | `llm-eval` gate |
| Few-shots that contradict policy | Confuses model | Align or delete |
| Vendor cookbook as architecture | Lock-in | Principles + optional vendor links |
| “Retrieval bad? Add more prompt” | Wrong layer | Fix `rag-patterns` first |

## Review gate

Roles split, injection considered, tools bounded, version id set, eval run or explicitly waived.
