#!/usr/bin/env python3
"""
Static golden cases for agent routing (P3 E-01).

Does not call a model. Each case names a unique snippet of a routing table.
The runner checks that the one matching row lists the expected agents and
skills, and that the named agent and skill files exist.

    python3 .cursor/scripts/eval_routing.py .
    python3 .cursor/scripts/eval_routing.py . --gates
    python3 .cursor/scripts/eval_routing.py . --plan feature.plan.md

Exit 0: every case matches.
Exit 1: one or more cases diverge, or a plan has neither a SPEC nor 3 answers.
Exit 2: the case file, a source document, or a required script is missing or invalid.

`--gates` (E-02) runs the FSM checks in temporary projects: a plan without a
SPEC and without 3 answered Socratic rows is not ready; verify_gate fails
with no ACCEPTANCE; lint_paths fails on `.agents/scripts/`.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

TOKEN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
SEPARATOR_CELL = re.compile(r":?-{3,}:?")
SECTION_BOUNDARY = re.compile(r"^#{1,3}\s+\S")
SOURCES = {
    "agents": "AGENTS.md",
    "routing": ".agents/skills/intelligent-routing/SKILL.md",
}


def reject_duplicate_keys(pairs: list[tuple[str, object]]) -> dict:
    data: dict[str, object] = {}
    for key, value in pairs:
        if key in data:
            raise ValueError(f"duplicate key {key!r}")
        data[key] = value
    return data


def reject_constant(token: str) -> None:
    raise ValueError(f"invalid JSON constant {token}")


def load_cases(path: Path) -> list[dict]:
    try:
        data = json.loads(
            path.read_text(encoding="utf-8"),
            object_pairs_hook=reject_duplicate_keys,
            parse_constant=reject_constant,
        )
    except (OSError, ValueError) as exc:
        raise ValueError(f"cases: {exc}") from exc
    cases = data.get("cases") if isinstance(data, dict) else None
    if not isinstance(cases, list) or not cases:
        raise ValueError("cases: expected a non-empty cases array")
    seen = set()
    for case in cases:
        if not isinstance(case, dict):
            raise ValueError("cases: each case must be an object")
        case_id = case.get("id")
        if not isinstance(case_id, str) or TOKEN.fullmatch(case_id) is None:
            raise ValueError(f"cases: bad id {case_id!r}")
        if case_id in seen:
            raise ValueError(f"cases: duplicate id {case_id}")
        seen.add(case_id)
        if case.get("source") not in SOURCES:
            raise ValueError(f"{case_id}: source must be agents or routing")
        match = case.get("match")
        if not isinstance(match, str) or not match or any(ch.isspace() and ch != " " for ch in match):
            raise ValueError(f"{case_id}: match must be a single-line snippet")
        agents = case.get("agents")
        if not isinstance(agents, list) or not agents or any(not isinstance(item, str) for item in agents):
            raise ValueError(f"{case_id}: agents must be a non-empty list")
        for key in ("skills", "not_agents"):
            value = case.get(key, [])
            if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
                raise ValueError(f"{case_id}: {key} must be a list of strings")
    return cases


def is_separator_row(line: str) -> bool:
    cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
    return bool(cells) and all(SEPARATOR_CELL.fullmatch(cell) for cell in cells)


def is_single_segment(name: str) -> bool:
    return bool(name) and name not in {".", ".."} and "/" not in name and "\\" not in name


def table_rows(text: str, needle: str) -> list[str]:
    hits = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("|") and not is_separator_row(stripped) and needle in stripped:
            hits.append(stripped)
    return hits


def agent_file_exists(root: Path, agent: str) -> bool:
    if not is_single_segment(agent):
        return False
    base = (root / ".claude" / "agents").resolve()
    path = (base / f"{agent}.md").resolve()
    return path.is_file() and path.parent == base


def skill_file_exists(root: Path, skill: str) -> bool:
    if not is_single_segment(skill):
        return False
    base = (root / ".agents" / "skills").resolve()
    path = (base / skill / "SKILL.md").resolve()
    return path.is_file() and path.parent.parent == base


def check_case(root: Path, case: dict, documents: dict[str, str]) -> list[str]:
    case_id = case["id"]
    rows = table_rows(documents[case["source"]], case["match"])
    if len(rows) != 1:
        return [f"{case_id}: expected 1 table row for {case['match']!r}, found {len(rows)}"]
    row = rows[0]
    problems = []
    for agent in case["agents"]:
        if f"`{agent}`" not in row and agent not in row:
            problems.append(f"{case_id}: row does not list agent {agent}")
        if not agent_file_exists(root, agent):
            problems.append(f"{case_id}: missing .claude/agents/{agent}.md")
    for skill in case.get("skills", []):
        if f"`{skill}`" not in row and skill not in row:
            problems.append(f"{case_id}: row does not list skill {skill}")
        if not skill_file_exists(root, skill):
            problems.append(f"{case_id}: missing skill {skill}")
    for banned in case.get("not_agents", []):
        if banned in row:
            problems.append(f"{case_id}: row lists {banned}")
    return problems


def evaluate(root: Path, cases_path: Path) -> tuple[list[str], int]:
    if not cases_path.is_file():
        return [f"cases not found: {cases_path}"], 2
    try:
        cases = load_cases(cases_path)
    except ValueError as exc:
        return [str(exc)], 2
    documents = {}
    for key, relative in SOURCES.items():
        path = root / relative
        if not path.is_file():
            return [f"missing {relative}"], 2
        documents[key] = path.read_text(encoding="utf-8")
    problems = []
    for case in cases:
        problems.extend(check_case(root, case, documents))
    return problems, (1 if problems else 0)


def filled_cell(cell: str) -> bool:
    text = cell.strip().strip("`")
    if not text or set(text) <= set("-: "):
        return False
    if text in {"#", "Question", "Answer"}:
        return False
    if "{" in text or "}" in text:
        return False
    return True


def socratic_answers(plan_text: str) -> int:
    count = 0
    in_section = False
    for line in plan_text.splitlines():
        stripped = line.strip()
        if stripped.startswith("### Socratic evidence"):
            in_section = True
            continue
        if in_section and SECTION_BOUNDARY.match(stripped):
            in_section = False
            continue
        if not in_section or not stripped.startswith("|"):
            continue
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        if len(cells) >= 3 and filled_cell(cells[1]) and filled_cell(cells[2]):
            count += 1
    return count


def spec_path_for(plan: Path) -> Path:
    name = plan.name
    if name.endswith(".plan.md"):
        slug = name[: -len(".plan.md")]
    elif name.endswith(".md"):
        slug = name[:-3]
    else:
        slug = plan.stem
    return plan.with_name(f"{slug}.spec.md")


def plan_is_ready(plan: Path) -> bool:
    spec = spec_path_for(plan)
    if spec.is_file() and spec.read_text(encoding="utf-8").strip():
        return True
    if not plan.is_file():
        return False
    return socratic_answers(plan.read_text(encoding="utf-8")) >= 3


def run_tool(script: Path, args: list[str]) -> int:
    result = subprocess.run([sys.executable, str(script), *args], capture_output=True, text=True)
    return result.returncode


ACCEPTANCE_OK = """# ACCEPTANCE

| ID | Given / When / Then | Method | Command / evidence | Pass |
| --- | --- | --- | --- | --- |
| AC-1 | when the gate runs | unit | npm test passed | [x] |

## Sign-off

- [x] All AC-* checked with evidence
"""

PLAN_EMPTY = """# PLAN

### Socratic evidence (if no separate SPEC)

| # | Question | Answer |
| --- | --- | --- |
| 1 | | |
| 2 | | |
| 3 | | |
"""

PLAN_ANSWERED = """# PLAN

### Socratic evidence (if no separate SPEC)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Who uses it? | Cashiers |
| 2 | What fails closed? | Offline carts |
| 3 | What is out of scope? | Payments |
"""


def evaluate_gates(root: Path) -> tuple[list[str], int]:
    gate = root / ".cursor" / "scripts" / "verify_gate.py"
    linter = root / ".cursor" / "scripts" / "lint_paths.py"
    if not gate.is_file() or not linter.is_file():
        return ["verify_gate.py and lint_paths.py must both exist"], 2

    problems = []
    with tempfile.TemporaryDirectory(prefix="axion-gates-") as tmp:
        base = Path(tmp)
        bare = base / "bare"
        bare.mkdir()
        plan = bare / "cart.plan.md"
        plan.write_text(PLAN_EMPTY, encoding="utf-8")
        if plan_is_ready(plan):
            problems.append("plan-without-spec: expected not ready")

        speced = base / "speced"
        speced.mkdir()
        (speced / "cart.plan.md").write_text(PLAN_EMPTY, encoding="utf-8")
        (speced / "cart.spec.md").write_text("# SPEC\n\nCashiers need an offline cart.\n", encoding="utf-8")
        if not plan_is_ready(speced / "cart.plan.md"):
            problems.append("plan-with-spec: expected ready")

        answered = base / "answered"
        answered.mkdir()
        (answered / "cart.plan.md").write_text(PLAN_ANSWERED, encoding="utf-8")
        if not plan_is_ready(answered / "cart.plan.md"):
            problems.append("plan-with-answers: expected ready")

        missing = base / "no-acceptance"
        missing.mkdir()
        if run_tool(gate, [str(missing), "--skip-checklist"]) != 1:
            problems.append("verify-without-acceptance: expected exit 1")

        done = base / "acceptance"
        done.mkdir()
        (done / "cart.acceptance.md").write_text(ACCEPTANCE_OK, encoding="utf-8")
        if run_tool(gate, [str(done), "--acceptance", "cart.acceptance.md", "--skip-checklist"]) != 0:
            problems.append("verify-with-acceptance: expected exit 0")

        legacy = base / "legacy"
        (legacy / ".cursor" / "commands").mkdir(parents=True)
        (legacy / ".cursor" / "commands" / "plan.md").write_text(
            "Run python3 .agents/scripts/foo.py\n", encoding="utf-8"
        )
        if run_tool(linter, [str(legacy)]) != 1:
            problems.append("legacy-agents-scripts: expected exit 1")

        clean = base / "clean"
        (clean / ".cursor" / "commands").mkdir(parents=True)
        (clean / ".cursor" / "commands" / "plan.md").write_text(
            "Run python3 .cursor/scripts/foo.py\n", encoding="utf-8"
        )
        if run_tool(linter, [str(clean)]) != 0:
            problems.append("canonical-scripts: expected exit 0")

    return problems, (1 if problems else 0)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check routing golden cases against the docs")
    parser.add_argument("project", nargs="?", default=".")
    parser.add_argument("--cases", default=None, help="Override .axion/eval/routing.cases.json")
    parser.add_argument("--gates", action="store_true", help="Run FSM gate fixtures (E-02)")
    parser.add_argument("--plan", default=None, help="Check one plan for a SPEC or 3 Socratic answers")
    args = parser.parse_args()
    root = Path(args.project).resolve()

    if args.gates:
        problems, code = evaluate_gates(root)
        if code == 0:
            print("eval_gates: pass 7")
            return 0
        print("eval_gates: FAIL")
        for problem in problems:
            print(f"  {problem}")
        return code

    if args.plan:
        plan = Path(args.plan)
        if not plan.is_file():
            print(f"eval_routing: plan not found: {plan}", file=sys.stderr)
            return 2
        if plan_is_ready(plan):
            print("eval_routing: plan ready")
            return 0
        print("eval_routing: plan not ready (need a non-empty SPEC or 3 Socratic answers)")
        return 1

    cases_path = Path(args.cases) if args.cases else root / ".axion" / "eval" / "routing.cases.json"
    problems, code = evaluate(root, cases_path)
    if code == 0:
        count = len(json.loads(cases_path.read_text(encoding="utf-8"))["cases"])
        print(f"eval_routing: pass {count}")
        return 0
    print("eval_routing: FAIL")
    for problem in problems:
        print(f"  {problem}")
    return code


if __name__ == "__main__":
    sys.exit(main())
