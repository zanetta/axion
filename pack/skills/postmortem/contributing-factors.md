# Contributing Factors

Prefer **multiple contributing factors** over a single “root cause” scapegoat.

## Method (lightweight)

1. State the **proximate** failure (what broke in the moment).
2. Ask **why** that was possible (process, design, tooling, incentives) — 3–5 layers is enough.
3. Separate **trigger** (spark) from **latent conditions** (fuel).
4. Map to categories: change, capacity, dependency, config, human factors, detection gaps.

## 5 whys-style (use carefully)

- Stop when answers leave the org’s control or become speculative.
- Avoid landing on “human error” as the final answer — ask what made the error easy or invisible.

## Output shape

| Factor | Type (trigger / latent) | Evidence | Related action |
|--------|-------------------------|----------|----------------|
| … | … | link / metric | AI-… |

Use `observability` evidence (dashboards, traces, error groups) and deploy history from `deployment-procedures` / flag audits from `feature-flags` when relevant.
