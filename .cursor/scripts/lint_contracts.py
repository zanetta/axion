#!/usr/bin/env python3
"""
Lint skill/command contracts — Axion (P2 Q-02)
==============================================

Validates YAML frontmatter against the contract schemas:

    .agents/skills/*/SKILL.md   → .agents/schemas/skill-contract.schema.json
    .cursor/commands/*.md       → .agents/schemas/command-contract.schema.json

Extra rule: a skill's `name` must match its folder name.

Usage:
    python3 .cursor/scripts/lint_contracts.py .

Requires: pip install pyyaml jsonschema
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import yaml
    from jsonschema import Draft7Validator
except ImportError:
    print("❌ lint_contracts: missing dependencies — run: pip install pyyaml jsonschema")
    sys.exit(2)

FRONTMATTER = re.compile(r"\A---\r?\n(.*?)\r?\n---", re.DOTALL)

TARGETS = (
    (".agents/skills/*/SKILL.md", ".agents/schemas/skill-contract.schema.json"),
    (".cursor/commands/*.md", ".agents/schemas/command-contract.schema.json"),
)


def load_validator(schema_path: Path) -> Draft7Validator:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    # Schemas declare 2020-12 but only use draft-7 keywords; older jsonschema lacks 2020-12.
    return Draft7Validator(schema)


def parse_frontmatter(path: Path) -> tuple[dict | None, str | None]:
    match = FRONTMATTER.match(path.read_text(encoding="utf-8"))
    if not match:
        return None, "missing YAML frontmatter"
    try:
        data = yaml.safe_load(match.group(1))
    except yaml.YAMLError as exc:
        return None, f"invalid YAML: {exc}"
    if not isinstance(data, dict):
        return None, "frontmatter is not a mapping"
    return data, None


def lint_file(path: Path, validator) -> list[str]:
    data, error = parse_frontmatter(path)
    if error:
        return [error]

    errors = [
        f"{'.'.join(str(p) for p in err.absolute_path) or '<root>'}: {err.message}"
        for err in sorted(validator.iter_errors(data), key=lambda e: list(e.absolute_path))
    ]
    if path.name == "SKILL.md" and data.get("name") != path.parent.name:
        errors.append(f"name: '{data.get('name')}' must match folder '{path.parent.name}'")
    return errors


def lint(root: Path) -> tuple[int, list[tuple[Path, str]]]:
    checked = 0
    violations: list[tuple[Path, str]] = []
    for pattern, schema_rel in TARGETS:
        schema_path = root / schema_rel
        if not schema_path.is_file():
            violations.append((schema_path, "schema not found"))
            continue
        validator = load_validator(schema_path)
        for path in sorted(root.glob(pattern)):
            checked += 1
            violations.extend((path, message) for message in lint_file(path, validator))
    return checked, violations


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate skill/command frontmatter contracts")
    parser.add_argument("project", nargs="?", default=".", help="Project root")
    root = Path(parser.parse_args().project).resolve()

    checked, violations = lint(root)
    if not violations:
        print(f"✅ lint_contracts: {checked} file(s) match their contract schema")
        return 0

    print("❌ lint_contracts: contract violations\n")
    for path, message in violations:
        rel = path.relative_to(root) if path.is_relative_to(root) else path
        print(f"  {rel}: {message}")
    print(f"\n{len(violations)} violation(s) in {checked} file(s).")
    return 1


if __name__ == "__main__":
    sys.exit(main())
