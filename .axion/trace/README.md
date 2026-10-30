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

## Leitor

`python3 .cursor/scripts/trace_report.py . {slug}` lê `{slug}.json` quando o arquivo existe e confere cada item de `links` (`spec_id`, `plan_task`, `acceptance_id`) com SPEC, PLAN e ACCEPTANCE. O script não reexecuta os checks. Exit 0 = cadeia coberta; exit 1 = gap (inclusive JSON que discorda dos links markdown); exit 2 = slug inválido. Linhas de rastreabilidade que ainda são `{placeholders}` são ignoradas. Detalhe dos gaps: `.cursor/scripts/README.md`.
