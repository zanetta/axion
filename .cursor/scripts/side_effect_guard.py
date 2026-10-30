#!/usr/bin/env python3
"""
Refuse writes outside the PLAN write allowlist (P2 X-03).

Reads `## Write allowlist` from a plan file. A write is allowed only when it
matches one of those globs, is not a secret path, and (when --effect is passed)
the declared side_effects include the matching write kind.

    python3 .cursor/scripts/side_effect_guard.py . --plan {slug}.plan.md --write src/app.ts
    python3 .cursor/scripts/side_effect_guard.py . --plan {slug}.plan.md --effect write-files --write src/app.ts

Exit 0: every --write is allowed.
Exit 1: at least one write is refused (path and reason on stdout, never file contents).
Exit 2: usage error (missing plan, bad path). Nothing is written.
"""

from __future__ import annotations

import argparse
import fnmatch
import sys
from pathlib import Path

EFFECTS = {
    "none",
    "read-only",
    "write-files",
    "write-memory",
    "run-shell",
    "invoke-agents",
    "network",
}
def parse_allowlist(text: str):
    """Return glob strings, or None when the section is absent."""
    globs = []
    in_section = False
    for line in text.splitlines():
        if line.strip() == "## Write allowlist":
            in_section = True
            continue
        if not in_section:
            continue
        if line.startswith("## "):
            break
        stripped = line.strip()
        if stripped.startswith("- "):
            item = stripped[2:].strip().strip("`")
            if item:
                globs.append(item)
            continue
        if not stripped.startswith("|"):
            continue
        cell = stripped.strip("|").split("|")[0].strip().strip("`")
        if not cell or cell.lower() == "path" or set(cell) <= set("-: "):
            continue
        globs.append(cell)
    return globs if in_section else None


def safe_relative(value: str) -> str:
    """Canonical relative path. Rejects spaces, absolutes, and `..` segments.

    Drops `.` and empty segments (`//`, trailing slash) without str.lstrip("./"),
    which would delete the leading dot of `.env` and `.agents`.
    """
    if not value or any(ch.isspace() for ch in value):
        raise ValueError(f"path must be relative: {value!r}")
    normalized = value.replace("\\", "/")
    if normalized.startswith("/"):
        raise ValueError(f"path must be relative: {value!r}")
    parts = []
    for part in normalized.split("/"):
        if part == "..":
            raise ValueError(f"path must be relative: {value!r}")
        if part in ("", "."):
            continue
        parts.append(part)
    if not parts:
        raise ValueError(f"path must be relative: {value!r}")
    return "/".join(parts)


def glob_match(pattern: str, relative: str) -> bool:
    pat = pattern.replace("\\", "/").strip().strip("`")
    if not pat:
        return False
    if pat.endswith("/"):
        pat += "**"
    try:
        pat = safe_relative(pat)
        relative = safe_relative(relative)
    except ValueError:
        return False
    return _segments(pat.split("/"), relative.split("/"))


def _segments(pattern: list[str], relative: list[str]) -> bool:
    stack = [(0, 0)]
    seen = set()
    plen, rlen = len(pattern), len(relative)
    while stack:
        pi, ri = stack.pop()
        if (pi, ri) in seen:
            continue
        seen.add((pi, ri))
        if pi == plen:
            if ri == rlen:
                return True
            continue
        if pattern[pi] == "**":
            stack.append((pi + 1, ri))
            if ri < rlen:
                stack.append((pi, ri + 1))
            continue
        if ri < rlen and fnmatch.fnmatchcase(relative[ri], pattern[pi]):
            stack.append((pi + 1, ri + 1))
    return False


def is_sensitive(relative: str) -> bool:
    name = relative.split("/")[-1]
    if name == ".env" or (name.startswith(".env.") and not name.endswith(".example")):
        return True
    return any("credentials" in part.lower() for part in relative.split("/"))


def is_memory_path(relative: str) -> bool:
    return relative == ".agents/memory" or relative.startswith(".agents/memory/")


def effect_denies(relative: str, effects: set[str] | None) -> bool:
    if effects is None:
        return False
    needed = "write-memory" if is_memory_path(relative) else "write-files"
    return needed not in effects


def check_write(relative: str, allowlist, forbidden: list[str], effects: set[str] | None) -> str | None:
    """Return a refusal reason, or None when the write is allowed."""
    if allowlist is None or not allowlist:
        return "no-allowlist"
    if is_sensitive(relative) or any(glob_match(item, relative) for item in forbidden):
        return "forbidden"
    if effect_denies(relative, effects):
        return "effect-denied"
    if not any(glob_match(item, relative) for item in allowlist):
        return "outside-allowlist"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Check writes against a PLAN allowlist")
    parser.add_argument("project", nargs="?", default=".", help="Project root (accepted, unused)")
    parser.add_argument("--plan", required=True, help="Path to the plan markdown")
    parser.add_argument("--write", action="append", default=[], help="Relative path to check")
    parser.add_argument("--effect", action="append", default=[], help="Declared side_effect")
    parser.add_argument("--forbidden", action="append", default=[], help="Extra forbidden glob")
    args = parser.parse_args()

    plan = Path(args.plan)
    if not plan.is_file():
        print(f"side_effect_guard: plan not found: {plan}", file=sys.stderr)
        return 2
    if not args.write:
        print("side_effect_guard: --write is required", file=sys.stderr)
        return 2

    unknown = [item for item in args.effect if item not in EFFECTS]
    if unknown:
        print(f"side_effect_guard: unknown effect: {', '.join(unknown)}", file=sys.stderr)
        return 2

    try:
        writes = [safe_relative(item) for item in args.write]
        forbidden = [safe_relative(item) if ".." in item or item.startswith("/") else item for item in args.forbidden]
    except ValueError as exc:
        print(f"side_effect_guard: {exc}", file=sys.stderr)
        return 2

    allowlist = parse_allowlist(plan.read_text(encoding="utf-8"))
    effects = set(args.effect) if args.effect else None
    refused = 0
    for relative in writes:
        reason = check_write(relative, allowlist, forbidden, effects)
        if reason is None:
            print(f"side_effect_guard: allowed {relative}")
        else:
            refused += 1
            print(f"side_effect_guard: refused {relative} {reason}")
    return 1 if refused else 0


if __name__ == "__main__":
    sys.exit(main())
