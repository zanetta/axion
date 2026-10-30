#!/usr/bin/env python3
"""
Verify hard gate — Axion (P2 W-03)
==================================

Fails the task (exit 1) when:

- an ACCEPTANCE file has an AC-* row still open, without evidence, or no AC-* rows
- checklist.py exits non-zero (required checks stop the checklist; any failure exits 1)

The gate does not re-run each AC command. /verify must run them and record the
result before this script is invoked.

Usage:
    python3 .cursor/scripts/verify_gate.py . --acceptance feature.acceptance.md
    python3 .cursor/scripts/verify_gate.py . --skip-checklist
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

CHECKED = {"[x]", "[X]", "✅"}
PASS_CELL = re.compile(r"\[[ xX]\]|✅")
PLACEHOLDER = ("{", "}")


def split_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def acceptance_problems(text: str) -> list[str]:
    problems = []
    rows = []
    for line in text.splitlines():
        if not line.startswith("|"):
            continue
        cells = split_row(line)
        if len(cells) < 3 or not cells[0].startswith("AC-"):
            continue
        if cells[0] in {"AC-ID", "ACCEPTANCE ID"} or not PASS_CELL.fullmatch(cells[-1]):
            continue
        rows.append(cells)

    if not rows:
        return ["no AC-* rows in the criteria table"]

    for cells in rows:
        ac_id, evidence, passed = cells[0], cells[-2], cells[-1]
        if any(marker in ac_id for marker in PLACEHOLDER):
            problems.append(f"{ac_id}: id is still a template placeholder")
            continue
        if passed not in CHECKED:
            problems.append(f"{ac_id}: Pass is '{passed or 'empty'}' — expected [x] after the check ran")
            continue
        if not evidence or any(marker in evidence for marker in PLACEHOLDER):
            problems.append(f"{ac_id}: checked without evidence (command output is missing)")

    sign_off = text.split("## Sign-off", 1)
    if len(sign_off) == 2:
        for line in sign_off[1].splitlines():
            if line.strip().startswith("- [ ]"):
                problems.append(f"sign-off still open: {line.strip()}")
    return problems


def find_acceptance_files(root: Path, given: list[str]) -> list[Path]:
    if given:
        return [Path(path) if Path(path).is_absolute() else root / path for path in given]
    return sorted(root.glob("*.acceptance.md"))


def run_checklist(root: Path, script: Path) -> tuple[int, str]:
    if not script.is_file():
        return 1, f"checklist not found: {script}"
    result = subprocess.run(
        [sys.executable, str(script), str(root)],
        capture_output=True,
        text=True,
    )
    tail = (result.stdout + result.stderr).strip().splitlines()
    summary = "\n".join(tail[-8:])
    return result.returncode, summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Fail verify when ACCEPTANCE or checklist is incomplete")
    parser.add_argument("project", nargs="?", default=".", help="Project root")
    parser.add_argument("--acceptance", action="append", default=[], help="ACCEPTANCE file (repeatable)")
    parser.add_argument(
        "--allow-missing-acceptance",
        action="store_true",
        help="Pass the acceptance check when no file exists (checklist still runs)",
    )
    parser.add_argument("--skip-checklist", action="store_true", help="Do not run checklist.py")
    parser.add_argument("--checklist", default=None, help="Checklist script (default: .cursor/scripts/checklist.py)")
    args = parser.parse_args()

    root = Path(args.project).resolve()
    problems = []

    files = find_acceptance_files(root, args.acceptance)
    if not files and not args.allow_missing_acceptance:
        problems.append("no ACCEPTANCE file (*.acceptance.md or --acceptance)")
    for path in files:
        if not path.is_file():
            problems.append(f"ACCEPTANCE not found: {path}")
            continue
        for problem in acceptance_problems(path.read_text(encoding="utf-8")):
            problems.append(f"{path.name}: {problem}")

    checklist_note = "skipped"
    if not args.skip_checklist:
        script = Path(args.checklist) if args.checklist else root / ".cursor" / "scripts" / "checklist.py"
        code, summary = run_checklist(root, script)
        checklist_note = f"exit {code}"
        if code != 0:
            problems.append(f"checklist.py failed ({checklist_note})\n{summary}")

    if problems:
        print("❌ verify_gate: task is not verified\n")
        for problem in problems:
            print(f"  {problem}")
        print(f"\n{len(problems)} failure(s). Do not mark /verify done.")
        return 1

    print(f"✅ verify_gate: ACCEPTANCE complete, checklist {checklist_note}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
