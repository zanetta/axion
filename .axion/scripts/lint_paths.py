#!/usr/bin/env python3
"""
Lint path drift — Axion / antigravity4cursor
============================================

Fails if docs/commands/skills reference legacy `.agents/scripts/` instead of
canonical `.cursor/scripts/`.

Usage:
    python3 .cursor/scripts/lint_paths.py .
    python3 .cursor/scripts/lint_paths.py . --fix   # rewrite matches (commands only)

Exceptions: lines that mention the legacy path only as historical mapping
(ARCHITECTURE sync tables, sync_upstream.py source strings).
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

FORBIDDEN = ".agents/scripts/"
CANONICAL = ".cursor/scripts/"

SCAN_GLOBS = (
    ".cursor/commands/**/*.md",
    ".agents/skills/**/*.md",
    ".claude/agents/**/*.md",
    "AGENTS.md",
    "AGENT_FLOW.md",
    "README.md",
    "cli/README.md",
)

# Allow historical documentation of the remapping itself
ALLOW_SUBSTRINGS = (
    "`.agents/scripts/` → `.cursor/scripts/`",
    '(".agents/scripts/", ".cursor/scripts/")',
    "python .agents/scripts/",  # only in sync_upstream replacement tuples — handled by path filter
)

def is_allowed_line(line: str) -> bool:
    if FORBIDDEN not in line:
        return True
    for marker in ALLOW_SUBSTRINGS:
        if marker in line:
            return True
    # Explicit historical callout
    lower = line.lower()
    if any(
        k in lower
        for k in ("histórico", "legacy", "remapeia", "drift", "forbidden", "anti-pattern", "legado")
    ):
        return True
    if "vs." in line and CANONICAL in line:
        return True
    # Table cells documenting the lint itself
    if "lint_paths" in lower:
        return True
    return False


def collect_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for pattern in SCAN_GLOBS:
        files.extend(root.glob(pattern))
    # Always include sync_upstream for awareness but allow its mapping tuples
    return sorted({f.resolve() for f in files if f.is_file()})


def lint(root: Path) -> list[tuple[Path, int, str]]:
    violations: list[tuple[Path, int, str]] = []
    for path in collect_files(root):
        # sync_upstream may contain the old string as replacement source
        if path.name == "sync_upstream.py":
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        for i, line in enumerate(text.splitlines(), start=1):
            if FORBIDDEN in line and not is_allowed_line(line):
                violations.append((path, i, line.strip()))
    return violations


def fix_commands(root: Path) -> int:
    """Rewrite forbidden paths inside .cursor/commands only."""
    fixed = 0
    for path in (root / ".cursor" / "commands").glob("*.md"):
        text = path.read_text(encoding="utf-8")
        new = text.replace("python .agents/scripts/", "python3 .cursor/scripts/")
        new = new.replace(".agents/scripts/", ".cursor/scripts/")
        if new != text:
            path.write_text(new, encoding="utf-8")
            fixed += 1
    return fixed


def main() -> int:
    parser = argparse.ArgumentParser(description="Lint legacy .agents/scripts/ path drift")
    parser.add_argument("project", nargs="?", default=".", help="Project root")
    parser.add_argument("--fix", action="store_true", help="Auto-fix .cursor/commands/")
    args = parser.parse_args()

    root = Path(args.project).resolve()
    if args.fix:
        n = fix_commands(root)
        print(f"Fixed {n} command file(s)")

    violations = lint(root)
    if not violations:
        print("✅ lint_paths: no legacy .agents/scripts/ references found")
        return 0

    print("❌ lint_paths: legacy path drift detected\n")
    for path, line_no, line in violations:
        rel = path.relative_to(root) if path.is_relative_to(root) else path
        print(f"  {rel}:{line_no}: {line}")
    print(f"\n{len(violations)} violation(s). Use --fix to rewrite commands, or edit manually.")
    print(f"Canonical path: {CANONICAL}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
