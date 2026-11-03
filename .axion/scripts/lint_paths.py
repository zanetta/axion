#!/usr/bin/env python3
"""
Lint path drift — Axion
=======================

Fails if docs/commands/skills reference legacy `.agents/scripts/` or
`.cursor/scripts/` instead of canonical `.axion/scripts/`.

Usage:
    python3 .axion/scripts/lint_paths.py .
    python3 .axion/scripts/lint_paths.py . --fix   # rewrite matches (commands only)

Exceptions: lines that mention legacy paths only as historical mapping,
migration notes, or fallback descriptions.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

FORBIDDEN_PATHS = (".agents/scripts/", ".cursor/scripts/")
CANONICAL = ".axion/scripts/"

SCAN_GLOBS = (
    "pack/commands/**/*.md",
    "pack/skills/**/*.md",
    "pack/agents/**/*.md",
    ".cursor/commands/**/*.md",
    ".claude/commands/**/*.md",
    ".agents/skills/**/*.md",
    ".claude/agents/**/*.md",
    "AGENTS.md",
    "AGENT_FLOW.md",
    "README.md",
    "cli/README.md",
)

ALLOW_SUBSTRINGS = (
    "`.agents/scripts/` → `.cursor/scripts/`",
    "`.agents/scripts/` → `.axion/scripts/`",
    "`.cursor/scripts/` → `.axion/scripts/`",
    '(".agents/scripts/", ".cursor/scripts/")',
    '(".agents/scripts/", ".axion/scripts/")',
    '(".cursor/scripts/", ".axion/scripts/")',
    "python .agents/scripts/",
)


def is_allowed_line(line: str) -> bool:
    if not any(forbidden in line for forbidden in FORBIDDEN_PATHS):
        return True
    for marker in ALLOW_SUBSTRINGS:
        if marker in line:
            return True
    lower = line.lower()
    if any(
        k in lower
        for k in (
            "histórico",
            "legacy",
            "remapeia",
            "drift",
            "forbidden",
            "anti-pattern",
            "legado",
            "breaking",
            "residual",
            "fallback",
            "migra",
            "substitu",
            "anterior",
            "v1",
            "deixa de",
            "não apaga",
        )
    ):
        return True
    if "vs." in line and CANONICAL in line:
        return True
    if "lint_paths" in lower:
        return True
    return False


def collect_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for pattern in SCAN_GLOBS:
        files.extend(root.glob(pattern))
    return sorted({f.resolve() for f in files if f.is_file()})


def lint(root: Path) -> list[tuple[Path, int, str]]:
    violations: list[tuple[Path, int, str]] = []
    for path in collect_files(root):
        if path.name == "sync_upstream.py":
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        for i, line in enumerate(text.splitlines(), start=1):
            if any(f in line for f in FORBIDDEN_PATHS) and not is_allowed_line(line):
                violations.append((path, i, line.strip()))
    return violations


def fix_commands(root: Path) -> int:
    """Rewrite forbidden paths inside command markdown files."""
    fixed = 0
    for cmd_dir in (root / "pack" / "commands", root / ".cursor" / "commands", root / ".claude" / "commands"):
        if not cmd_dir.is_dir():
            continue
        for path in cmd_dir.glob("*.md"):
            text = path.read_text(encoding="utf-8")
            new = text.replace("python .agents/scripts/", "python3 .axion/scripts/")
            new = new.replace("python .cursor/scripts/", "python3 .axion/scripts/")
            new = new.replace(".agents/scripts/", ".axion/scripts/")
            new = new.replace(".cursor/scripts/", ".axion/scripts/")
            if new != text:
                path.write_text(new, encoding="utf-8")
                fixed += 1
    return fixed


def main() -> int:
    parser = argparse.ArgumentParser(description="Lint legacy script path drift")
    parser.add_argument("project", nargs="?", default=".", help="Project root")
    parser.add_argument("--fix", action="store_true", help="Auto-fix command files")
    args = parser.parse_args()

    root = Path(args.project).resolve()
    if args.fix:
        n = fix_commands(root)
        print(f"Fixed {n} command file(s)")

    violations = lint(root)
    if not violations:
        print("✅ lint_paths: no legacy script path references found")
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
