#!/usr/bin/env python3
"""
Sync Axion with upstream ag-kit (https://github.com/vudovn/ag-kit).

Usage:
    python3 .cursor/scripts/sync_upstream.py              # Compare only (default)
    python3 .cursor/scripts/sync_upstream.py --apply      # Apply safe sync (skills + agents)
    python3 .cursor/scripts/sync_upstream.py --apply --clone  # Clone upstream first

Cursor path adaptations are applied automatically when copying agents.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
UPSTREAM_URL = "https://github.com/vudovn/ag-kit.git"

SKILL_DIRS = [
    "batch-operations",
    "code-review-graph",
    "context-compression",
    "coordinator-mode",
    "memory-system",
    "simplify-code",
    "skillify",
    "verify-changes",
]

CURSOR_COMMANDS = [
    "brainstorm",
    "coordinate",
    "create",
    "debug",
    "deploy",
    "enhance",
    "orchestrate",
    "plan",
    "preview",
    "remember",
    "status",
    "test",
    "verify",
]

AGENT_PATH_REPLACEMENTS = [
    (".agents/scripts/", ".cursor/scripts/"),
    ("python .agents/scripts/", "python3 .cursor/scripts/"),
    ("`ARCHITECTURE.md`", "`.cursor/ARCHITECTURE.md`"),
    (
        "> 💡 **Script paths are relative to `.agents/` directory**",
        "> 💡 **Master scripts:** `.cursor/scripts/` · skill scripts: `.agents/skills/<name>/scripts/`",
    ),
]


def clone_upstream(target: Path) -> None:
    if target.exists():
        shutil.rmtree(target)
    subprocess.run(
        ["git", "clone", "--depth", "1", UPSTREAM_URL, str(target)],
        check=True,
    )


def adapt_agent_content(content: str) -> str:
    for old, new in AGENT_PATH_REPLACEMENTS:
        content = content.replace(old, new)
    return content


def adapt_command_content(content: str) -> str:
    header = (
        "> **Argumento livre:** A tarefa do usuário será fornecida em texto livre "
        "após o comando. Use esse texto como entrada principal deste workflow.\n\n"
    )
    content = content.replace("$ARGUMENTS", "(texto livre após o comando)")
    content = content.replace(
        "- User Request: (texto livre após o comando)",
        "- User Request: (texto livre após o comando)",
    )
    if "Argumento livre" not in content and content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            content = f"---{parts[1]}---\n\n{header}{parts[2].lstrip()}"
    return content


def list_top_level_skills(skills_root: Path) -> set[str]:
    if not skills_root.exists():
        return set()
    return {
        d.name
        for d in skills_root.iterdir()
        if d.is_dir() and (d / "SKILL.md").exists()
    }


def compare(upstream: Path) -> dict[str, list[str]]:
    local_skills = list_top_level_skills(REPO_ROOT / ".agents" / "skills")
    upstream_skills = list_top_level_skills(upstream / ".agents" / "skills")

    local_cmds = {f.stem for f in (REPO_ROOT / ".cursor" / "commands").glob("*.md")}
    upstream_cmds = {f.stem for f in (upstream / ".agents" / "workflows").glob("*.md")}

    local_agents = {f.stem for f in (REPO_ROOT / ".claude" / "agents").glob("*.md")}
    upstream_agents = {f.stem for f in (upstream / ".agents" / "agent").glob("*.md")}

    memory_ok = (REPO_ROOT / ".agents" / "memory" / "MEMORY.md").exists()

    return {
        "skills_missing": sorted(upstream_skills - local_skills),
        "skills_extra": sorted(local_skills - upstream_skills),
        "commands_missing": sorted(upstream_cmds - local_cmds),
        "commands_extra": sorted(local_cmds - upstream_cmds),
        "agents_missing": sorted(upstream_agents - local_agents),
        "agents_extra": sorted(local_agents - upstream_agents),
        "memory_ok": memory_ok,
    }


def sync_agents(upstream: Path) -> int:
    src_dir = upstream / ".agents" / "agent"
    dst_dir = REPO_ROOT / ".claude" / "agents"
    count = 0
    for src in sorted(src_dir.glob("*.md")):
        content = adapt_agent_content(src.read_text(encoding="utf-8"))
        (dst_dir / src.name).write_text(content, encoding="utf-8")
        count += 1
    return count


def sync_skills(upstream: Path, skill_names: list[str] | None = None) -> int:
    src_root = upstream / ".agents" / "skills"
    dst_root = REPO_ROOT / ".agents" / "skills"
    names = skill_names or sorted(d.name for d in src_root.iterdir() if d.is_dir())
    count = 0
    for name in names:
        src = src_root / name
        if not (src / "SKILL.md").exists():
            continue
        dst = dst_root / name
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        count += 1
    return count


def sync_memory(upstream: Path) -> None:
    src = upstream / ".agents" / "memory"
    dst = REPO_ROOT / ".agents" / "memory"
    dst.mkdir(parents=True, exist_ok=True)
    for f in src.glob("*"):
        if f.is_file():
            shutil.copy2(f, dst / f.name)


def sync_commands_from_upstream(upstream: Path, only: list[str] | None = None) -> int:
    """Sync upstream workflows — skips Cursor-only commands like ui-ux-pro-max."""
    src_dir = upstream / ".agents" / "workflows"
    dst_dir = REPO_ROOT / ".cursor" / "commands"
    names = only or CURSOR_COMMANDS
    count = 0
    for name in names:
        src = src_dir / f"{name}.md"
        if not src.exists():
            continue
        content = adapt_command_content(src.read_text(encoding="utf-8"))
        (dst_dir / f"{name}.md").write_text(content, encoding="utf-8")
        count += 1
    return count


def print_report(report: dict[str, object]) -> None:
    print("\n=== Axion ↔ ag-kit sync report ===\n")
    for key in [
        "skills_missing",
        "skills_extra",
        "commands_missing",
        "commands_extra",
        "agents_missing",
        "agents_extra",
    ]:
        value = report[key]
        label = key.replace("_", " ").title()
        status = "✅" if not value else "⚠️"
        print(f"{status} {label}: {value or 'none'}")
    mem = "✅" if report["memory_ok"] else "❌"
    print(f"{mem} Memory (.agents/memory/MEMORY.md): {'ok' if report['memory_ok'] else 'missing'}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare/sync with upstream ag-kit")
    parser.add_argument("--apply", action="store_true", help="Apply sync (agents, skills, memory)")
    parser.add_argument("--clone", action="store_true", help="Clone upstream before compare/apply")
    parser.add_argument(
        "--upstream-path",
        type=Path,
        default=None,
        help="Local path to ag-kit clone (default: /tmp/ag-kit-compare or temp clone)",
    )
    args = parser.parse_args()

    upstream: Path
    temp_dir: tempfile.TemporaryDirectory[str] | None = None

    if args.upstream_path:
        upstream = args.upstream_path.resolve()
    elif args.clone or not Path("/tmp/ag-kit-compare").exists():
        temp_dir = tempfile.TemporaryDirectory(prefix="ag-kit-")
        upstream = Path(temp_dir.name)
        print(f"Cloning upstream to {upstream}...")
        clone_upstream(upstream)
    else:
        upstream = Path("/tmp/ag-kit-compare")

    if not (upstream / ".agents").exists():
        print(f"ERROR: Invalid upstream path: {upstream}", file=sys.stderr)
        return 1

    report = compare(upstream)
    print_report(report)

    if not args.apply:
        print("\nDry run only. Use --apply to sync agents/skills/memory/commands.")
        return 0 if not report["skills_missing"] and not report["commands_missing"] else 1

    agents = sync_agents(upstream)
    skills = sync_skills(upstream)
    sync_memory(upstream)
    commands = sync_commands_from_upstream(upstream)

    print(f"\nApplied: {agents} agents, {skills} skills, {commands} commands, memory synced.")
    print_report(compare(upstream))
    return 0


if __name__ == "__main__":
    sys.exit(main())
