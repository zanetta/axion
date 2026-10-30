# Traceability (P1 S-04)

Optional machine-readable links between SPEC ↔ PLAN ↔ ACCEPTANCE.

## File naming

`.axion/trace/{slug}.json`

## Schema (minimal)

```json
{
  "slug": "example-feature",
  "spec": "example-feature.spec.md",
  "plan": "example-feature.plan.md",
  "acceptance": "example-feature.acceptance.md",
  "links": [
    { "spec_id": "SPEC-example-1", "plan_task": "P1-1", "acceptance_id": "AC-1" }
  ]
}
```

Create/update when `/plan` finishes; `/verify` and `/orchestrate` should refuse "done" if required IDs are missing from PLAN Traceability section.
