#!/usr/bin/env python3
"""
Doc/inventory parity — Axion (P2 Q-03)
======================================

Fails when the component counts in .cursor/ARCHITECTURE.md or the committed
.axion/inventory.json differ from the filesystem.

The ARCHITECTURE overview table is the contract. These bold labels are parsed:

    Agents, Skills, Workflows, Regras por domínio, Scripts master, Schemas de contrato

Usage:
    python3 .cursor/scripts/lint_inventory.py .
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from generate_inventory import build_inventory  # noqa: E402

# Overview-table label → inventory key. "Workflows" counts slash commands.
TABLE_LABELS = {
    "Agents": "agents",
    "Skills": "skills",
    "Workflows": "commands",
    "Regras por domínio": "rules",
    "Scripts master": "scripts",
    "Schemas de contrato": "schemas",
}

TABLE_ROW = re.compile(r"^\|\s*\*\*(.+?)\*\*\s*\|\s*(\d+)\s*\|", re.MULTILINE)

# Counts repeated in the directory tree. Optional, checked when present.
TREE_COUNTS = (
    (re.compile(r"# (\d+) personas"), "agents"),
    (re.compile(r"# (\d+) skills top-level"), "skills"),
    (re.compile(r"# (\d+) slash commands"), "commands"),
    (re.compile(r"# (\d+) regras"), "rules"),
)


def documented_counts(architecture: str) -> dict[str, int]:
    found: dict[str, int] = {}
    for label, count in TABLE_ROW.findall(architecture):
        found.setdefault(label, int(count))
    missing = [label for label in TABLE_LABELS if label not in found]
    if missing:
        raise ValueError(
            "ARCHITECTURE.md overview table is missing: " + ", ".join(missing)
        )
    return {TABLE_LABELS[label]: found[label] for label in TABLE_LABELS}


def check(root: Path) -> list[str]:
    problems = []
    actual = build_inventory(root)["counts"]

    architecture_path = root / ".cursor" / "ARCHITECTURE.md"
    try:
        architecture = architecture_path.read_text(encoding="utf-8")
        documented = documented_counts(architecture)
    except (OSError, ValueError) as exc:
        return [str(exc)]

    for key, expected in documented.items():
        if actual[key] != expected:
            problems.append(
                f"ARCHITECTURE.md {key}: documents {expected}, filesystem has {actual[key]}"
            )

    for pattern, key in TREE_COUNTS:
        match = pattern.search(architecture)
        if match and int(match.group(1)) != actual[key]:
            problems.append(
                f"ARCHITECTURE.md tree '{match.group(0)}': filesystem has {actual[key]} {key}"
            )

    inventory_path = root / ".axion" / "inventory.json"
    try:
        committed = json.loads(inventory_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return problems + [f"inventory.json: {exc}"]

    if committed.get("counts") != actual:
        problems.append(
            f"inventory.json counts {committed.get('counts')} != filesystem {actual}"
            " — run: python3 .cursor/scripts/generate_inventory.py ."
        )
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description="Check ARCHITECTURE/inventory counts vs filesystem")
    parser.add_argument("project", nargs="?", default=".", help="Project root")
    root = Path(parser.parse_args().project).resolve()

    problems = check(root)
    if not problems:
        counts = build_inventory(root)["counts"]
        print(f"✅ lint_inventory: docs and inventory match the filesystem — {counts}")
        return 0

    print("❌ lint_inventory: doc/inventory drift\n")
    for problem in problems:
        print(f"  {problem}")
    print(f"\n{len(problems)} mismatch(es).")
    return 1


if __name__ == "__main__":
    sys.exit(main())
