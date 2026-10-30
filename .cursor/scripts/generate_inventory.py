#!/usr/bin/env python3
"""
Generate .axion/inventory.json — machine-readable component inventory (P1 K-04).

Usage:
    python3 .cursor/scripts/generate_inventory.py .
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def list_md_stems(directory: Path, suffix: str = ".md") -> list[str]:
    if not directory.is_dir():
        return []
    return sorted(p.stem for p in directory.glob(f"*{suffix}") if p.is_file())


def list_top_level_skills(skills_root: Path) -> list[str]:
    if not skills_root.is_dir():
        return []
    names = []
    for d in sorted(skills_root.iterdir()):
        if d.is_dir() and (d / "SKILL.md").exists():
            names.append(d.name)
    return names


def list_scripts(scripts_root: Path) -> list[str]:
    if not scripts_root.is_dir():
        return []
    return sorted(p.name for p in scripts_root.iterdir() if p.is_file() and p.suffix in {".py", ".sh", ".js"})


def build_inventory(root: Path) -> dict:
    return {
        "schema_version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "root": str(root),
        "counts": {},
        "agents": list_md_stems(root / ".claude" / "agents"),
        "skills": list_top_level_skills(root / ".agents" / "skills"),
        "commands": list_md_stems(root / ".cursor" / "commands"),
        "rules": list_md_stems(root / ".cursor" / "rules", suffix=".mdc"),
        "scripts": list_scripts(root / ".cursor" / "scripts"),
        "schemas": sorted(
            p.name
            for p in (root / ".agents" / "schemas").glob("*.json")
            if (root / ".agents" / "schemas").is_dir() and p.is_file()
        )
        if (root / ".agents" / "schemas").is_dir()
        else [],
    }


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
    inv = build_inventory(root)
    inv["counts"] = {
        "agents": len(inv["agents"]),
        "skills": len(inv["skills"]),
        "commands": len(inv["commands"]),
        "rules": len(inv["rules"]),
        "scripts": len(inv["scripts"]),
        "schemas": len(inv["schemas"]),
    }

    out = Path(args.output) if args.output else root / ".axion" / "inventory.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(inv, indent=2) + "\n", encoding="utf-8")
    print(f"✅ Wrote {out.relative_to(root)} — {inv['counts']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
