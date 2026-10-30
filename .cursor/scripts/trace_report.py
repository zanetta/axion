#!/usr/bin/env python3
"""
Traceability report — Axion (P2 O-02)
=====================================

Prints SPEC → PLAN → ACCEPTANCE coverage for one slug and exits 1 when the
chain has a gap. It does not re-run checks; Pass comes from the ACCEPTANCE file.

Usage:
    python3 .cursor/scripts/trace_report.py . my-feature
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SPEC_ID = re.compile(r"^SPEC-[A-Za-z0-9][\w.-]*$")
PLAN_TASK = re.compile(r"^(?:P\d+-\d+|PV-\d+)$")
AC_ID = re.compile(r"^AC-[\w.-]+$")
CHECKED_CELL = re.compile(r"\[(?:\s*[xX]\s*)\]|✅")
PASS_CELL = re.compile(r"\[(?:\s+|\s*[xX]\s*)\]|✅")


def split_row(line: str) -> list[str]:
    cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
    while cells and cells[-1] == "":
        cells.pop()
    return cells


def section(text: str, title: str) -> str:
    match = re.search(rf"^##\s+(?:\d+\.\s+)?{re.escape(title)}\s*$", text, re.M)
    if not match:
        return ""
    rest = text[match.end():]
    nxt = re.search(r"^##\s+", rest, re.M)
    return rest[: nxt.start()] if nxt else rest


def table_rows(text: str) -> list[list[str]]:
    rows = []
    for line in text.splitlines():
        if not line.startswith("|"):
            continue
        cells = split_row(line)
        if len(cells) < 2 or cells[0].startswith("---") or set(cells[0]) <= {"-"}:
            continue
        rows.append(cells)
    return rows


def is_placeholder(value: str) -> bool:
    return "{" in value or "}" in value


def evidence_missing(value: str) -> bool:
    return is_placeholder(value) or re.fullmatch(r"[`\s]*", value) is not None


def criteria(acceptance: str) -> dict[str, str]:
    """AC id → pass | open | no-evidence. Traceability rows are not criteria."""
    found = {}
    for cells in table_rows(section(acceptance, "Criteria") or acceptance):
        if not AC_ID.match(cells[0]) or not PASS_CELL.fullmatch(cells[-1]):
            continue
        evidence = cells[-2] if len(cells) >= 3 else ""
        if not CHECKED_CELL.fullmatch(cells[-1]):
            found[cells[0]] = "open"
        elif evidence_missing(evidence):
            found[cells[0]] = "no-evidence"
        else:
            found[cells[0]] = "pass"
    return found


def spec_ids(spec: str) -> list[str]:
    ids = []
    for cells in table_rows(section(spec, "Traceability")):
        if SPEC_ID.match(cells[0]) and not is_placeholder(cells[0]):
            ids.append(cells[0])
    return ids


def plan_tasks(plan: str) -> set[str]:
    return {cells[0] for cells in table_rows(plan) if PLAN_TASK.match(cells[0])}


def links_from_plan(plan: str) -> list[tuple[str, str, str]]:
    links = []
    for cells in table_rows(section(plan, "Traceability")):
        if len(cells) < 3 or not SPEC_ID.match(cells[0]) or not AC_ID.match(cells[2]):
            continue
        if is_placeholder(cells[0]) or is_placeholder(cells[2]):
            continue
        links.append((cells[0], cells[1], cells[2]))
    return links


def links_from_acceptance(acceptance: str) -> list[tuple[str, str, str]]:
    links = []
    for cells in table_rows(section(acceptance, "Traceability")):
        if len(cells) < 3 or not AC_ID.match(cells[0]) or not SPEC_ID.match(cells[2]):
            continue
        if is_placeholder(cells[0]) or is_placeholder(cells[2]):
            continue
        links.append((cells[2], cells[1], cells[0]))
    return links


def links_from_json(path: Path) -> tuple[list[tuple[str, str, str]], str | None]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [], f"trace json: {exc}"
    links = []
    for item in data.get("links", []):
        spec_id = str(item.get("spec_id", ""))
        task = str(item.get("plan_task", ""))
        ac_id = str(item.get("acceptance_id", ""))
        if SPEC_ID.match(spec_id) and AC_ID.match(ac_id):
            links.append((spec_id, task, ac_id))
    return links, None


def locate(root: Path, slug: str) -> dict[str, Path | None]:
    spec = root / f"{slug}.spec.md"
    plan = root / f"{slug}.plan.md"
    if not plan.is_file() and (root / f"{slug}.md").is_file():
        plan = root / f"{slug}.md"
    acceptance = root / f"{slug}.acceptance.md"
    trace = root / ".axion" / "trace" / f"{slug}.json"
    return {
        "spec": spec if spec.is_file() else None,
        "plan": plan if plan.is_file() else None,
        "acceptance": acceptance if acceptance.is_file() else None,
        "trace": trace if trace.is_file() else None,
    }


def report(root: Path, slug: str) -> tuple[list[str], list[str]]:
    found = locate(root, slug)
    lines = [f"trace_report: {slug}"]
    gaps = []
    for name in ("spec", "plan", "acceptance"):
        path = found[name]
        if path is None:
            lines.append(f"  {name}: MISSING ({slug}.{name if name != 'plan' else 'plan.md'})")
            gaps.append(f"missing {name} file")
        else:
            lines.append(f"  {name}: {path.name}")
    lines.append(f"  trace json: {found['trace'].name if found['trace'] else 'absent'}")

    if gaps:
        return lines, gaps

    spec = found["spec"].read_text(encoding="utf-8")
    plan = found["plan"].read_text(encoding="utf-8")
    acceptance = found["acceptance"].read_text(encoding="utf-8")
    checks = criteria(acceptance)
    tasks = plan_tasks(plan)
    declared = spec_ids(spec)

    merged: dict[str, tuple[str, str]] = {}
    for source, triples in (
        ("plan", links_from_plan(plan)),
        ("acceptance", links_from_acceptance(acceptance)),
    ):
        for spec_id, task, ac_id in triples:
            previous = merged.get(ac_id)
            if previous and previous != (spec_id, task):
                gaps.append(f"{ac_id}: {source} link {spec_id}/{task} conflicts with {previous[0]}/{previous[1]}")
            merged.setdefault(ac_id, (spec_id, task))

    if found["trace"]:
        json_links, error = links_from_json(found["trace"])
        if error:
            gaps.append(error)
        for spec_id, task, ac_id in json_links:
            current = merged.get(ac_id)
            if current and current != (spec_id, task):
                gaps.append(f"{ac_id}: trace json {spec_id}/{task} conflicts with {current[0]}/{current[1]}")
            merged.setdefault(ac_id, (spec_id, task))

    lines.append("")
    lines.append(f"{'SPEC':<22} {'PLAN':<8} {'AC':<8} check")
    linked_specs = set()
    for ac_id in sorted(set(checks) | set(merged)):
        spec_id, task = merged.get(ac_id, ("—", "—"))
        status = checks.get(ac_id, "not a criterion")
        lines.append(f"{spec_id:<22} {task:<8} {ac_id:<8} {status}")
        if spec_id != "—":
            linked_specs.add(spec_id)
        if ac_id not in checks:
            gaps.append(f"{ac_id}: linked but has no criteria row")
        elif status != "pass":
            gaps.append(f"{ac_id}: {status}")
        if ac_id not in merged:
            gaps.append(f"{ac_id}: no SPEC/PLAN link")
        elif not PLAN_TASK.match(task) or task not in tasks:
            gaps.append(f"{ac_id}: plan task '{task}' is not in the plan")
        elif spec_id not in declared and declared:
            gaps.append(f"{ac_id}: {spec_id} is not in the SPEC traceability table")

    for spec_id in declared:
        if spec_id not in linked_specs:
            gaps.append(f"{spec_id}: no ACCEPTANCE link")
            lines.append(f"{spec_id:<22} {'—':<8} {'—':<8} missing")

    passed = sum(1 for status in checks.values() if status == "pass")
    lines.append("")
    lines.append(f"{passed}/{len(checks)} checks passed, {len(gaps)} gap(s)")
    return lines, gaps


def main() -> int:
    parser = argparse.ArgumentParser(description="Print SPEC→ACCEPTANCE coverage for a slug")
    parser.add_argument("project", help="Project root")
    parser.add_argument("slug", help="Feature slug, e.g. my-feature")
    args = parser.parse_args()

    if not SLUG.match(args.slug):
        print(f"❌ trace_report: invalid slug '{args.slug}'", file=sys.stderr)
        return 2

    lines, gaps = report(Path(args.project).resolve(), args.slug)
    print("\n".join(lines))
    if gaps:
        print("\nGaps")
        for gap in gaps:
            print(f"  {gap}")
        return 1
    print("✅ trace_report: chain covered")
    return 0


if __name__ == "__main__":
    sys.exit(main())
