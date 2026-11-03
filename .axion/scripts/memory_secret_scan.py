#!/usr/bin/env python3
"""
Memory secret scanner — Axion (P2 X-02)
=======================================

Scans text before it is written to .agents/memory/. Exit 1 means do not write.
Findings name the pattern and the line, never the secret. --redact prints a
safe copy to stdout instead of refusing.

Usage:
    python3 .cursor/scripts/memory_secret_scan.py note.md
    python3 .cursor/scripts/memory_secret_scan.py .agents/memory
    python3 .cursor/scripts/memory_secret_scan.py --text "token: ..."
    python3 .cursor/scripts/memory_secret_scan.py --redact note.md
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

PLACEHOLDER = re.compile(
    r"^(?:example|changeme|change-me|your[-_]?[a-z]+|placeholder|todo|x{3,}|redacted|none|null|password|secret|token|<[^>]+>|\{[^}]+\})$",
    re.I,
)

PATTERNS = (
    ("private-key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("aws-access-key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("github-token", re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b")),
    ("npm-token", re.compile(r"\bnpm_[A-Za-z0-9]{36}\b")),
    ("openai-key", re.compile(r"\bsk-[A-Za-z0-9]{20,}\b")),
    ("slack-token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}")),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")),
    ("bearer", re.compile(r"\bBearer\s+[A-Za-z0-9\-._~+/]{20,}")),
    ("url-credential", re.compile(r"://[^\s/:@]+:[^\s/@]{4,}@")),
    (
        "assignment",
        re.compile(
            r"(?i)\b(?:api[_-]?key|secret|token|password|passwd|pwd|private[_-]?key)\b\s*[=:]\s*['\"]?([A-Za-z0-9+/=_\-]{8,})"
        ),
    ),
    (
        "env-secret",
        re.compile(r"(?i)^[A-Z][A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD|PASSWD)\s*=\s*['\"]?(\S+)"),
    ),
)


def is_placeholder(value: str) -> bool:
    cleaned = value.strip().strip("'\"")
    if PLACEHOLDER.match(cleaned) or cleaned.endswith("..."):
        return True
    trimmed = cleaned.rstrip(".,;:!?")
    return trimmed != cleaned and bool(PLACEHOLDER.match(trimmed))


def matches_in_line(line: str) -> list[tuple[str, int, int]]:
    found = []
    for name, pattern in PATTERNS:
        for match in pattern.finditer(line):
            secret = match.group(1) if match.lastindex else match.group(0)
            if is_placeholder(secret):
                continue
            start = match.start(1) if match.lastindex else match.start()
            end = match.end(1) if match.lastindex else match.end()
            found.append((name, start, end))
    return sorted(found, key=lambda item: item[1])


def redact_spans(line: str) -> list[tuple[str, int, int]]:
    kept = []
    cursor = -1
    for item in matches_in_line(line):
        if item[1] < cursor:
            continue
        kept.append(item)
        cursor = item[2]
    return kept


def scan(text: str) -> list[tuple[int, str]]:
    hits = []
    for number, line in enumerate(text.splitlines(), start=1):
        seen = set()
        for name, _start, _end in matches_in_line(line):
            if name in seen:
                continue
            seen.add(name)
            hits.append((number, name))
    return hits


def redact(text: str) -> str:
    lines = []
    for line in text.splitlines(keepends=True):
        body = line[:-1] if line.endswith("\n") else line
        newline = "\n" if line.endswith("\n") else ""
        spans = redact_spans(body)
        for _name, start, end in reversed(spans):
            body = body[:start] + "[REDACTED]" + body[end:]
        lines.append(body + newline)
    return "".join(lines)


def load_inputs(path: str | None, text: str | None) -> list[tuple[str, str]]:
    if text is not None:
        return [("<text>", text)]
    if path is None:
        return [("<stdin>", sys.stdin.read())]
    target = Path(path)
    if target.is_dir():
        files = sorted(item for item in target.rglob("*") if item.is_file())
        return [(str(item), item.read_text(encoding="utf-8", errors="replace")) for item in files]
    return [(str(target), target.read_text(encoding="utf-8", errors="replace"))]


def main() -> int:
    parser = argparse.ArgumentParser(description="Refuse or redact secrets before writing memory")
    parser.add_argument("path", nargs="?", help="File or directory to scan")
    parser.add_argument("--text", help="Scan this string instead of a file")
    parser.add_argument("--redact", action="store_true", help="Print redacted text to stdout")
    args = parser.parse_args()

    if args.redact and args.path and Path(args.path).is_dir():
        print("memory_secret_scan: --redact does not rewrite a directory", file=sys.stderr)
        return 2

    chunks = load_inputs(args.path, args.text)
    hits = [(label, number, name) for label, text in chunks for number, name in scan(text)]

    if args.redact:
        sys.stdout.write("".join(redact(text) for _label, text in chunks))
        replaced = sum(len(redact_spans(line)) for _label, text in chunks for line in text.splitlines())
        if replaced:
            print(f"memory_secret_scan: redacted {replaced} secret(s)", file=sys.stderr)
        return 0

    if not hits:
        print("memory_secret_scan: clean")
        return 0

    print("memory_secret_scan: refused — do not write this to .agents/memory/")
    for label, number, name in hits:
        print(f"  {label}:{number}: {name}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
