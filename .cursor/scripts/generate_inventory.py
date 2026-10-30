#!/usr/bin/env python3
"""
Generate .axion/inventory.json — machine-readable component inventory (P1 K-04).

Output is deterministic (no timestamps or absolute paths) so it can be diffed in CI.

Usage:
    python3 .cursor/scripts/generate_inventory.py .
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_SUFFIXES = {".py", ".sh", ".js"}


def list_files(directory: Path, suffixes: set[str], stem: bool = True) -> list[str]:
    if not directory.is_dir():
        return []
    return sorted(
        (p.stem if stem else p.name)
        for p in directory.iterdir()
        if p.is_file() and p.suffix in suffixes
    )


def list_skills(skills_root: Path) -> list[str]:
    if not skills_root.is_dir():
        return []
    return sorted(d.name for d in skills_root.iterdir() if (d / "SKILL.md").is_file())


def build_inventory(root: Path) -> dict:
    inventory = {
        "schema_version": "1.1.0",
        "agents": list_files(root / ".claude" / "agents", {".md"}),
        "skills": list_skills(root / ".agents" / "skills"),
        "commands": list_files(root / ".cursor" / "commands", {".md"}),
        "rules": list_files(root / ".cursor" / "rules", {".mdc"}),
        "scripts": list_files(root / ".cursor" / "scripts", SCRIPT_SUFFIXES, stem=False),
        "schemas": list_files(root / ".agents" / "schemas", {".json"}, stem=False),
    }
    counts = {key: len(value) for key, value in inventory.items() if isinstance(value, list)}
    return {"schema_version": inventory.pop("schema_version"), "counts": counts, **inventory}


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Axion component inventory")
    parser.add_argument("project", nargs="?", default=".", help="Project root")
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Output path (default: <root>/.axion/inventory.json)",
    )
    args = parser.parse_args()

    root = Path(args.project).resolve()
    inventory = build_inventory(root)

    out = Path(args.output) if args.output else root / ".axion" / "inventory.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    print(f"✅ Wrote {out} — {inventory['counts']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
