#!/usr/bin/env python3
"""
Session Manager - Axion
=================================
Analyzes project state, detects tech stack, tracks file statistics, and provides
a summary of the current session.

Usage:
    python .cursor/scripts/session_manager.py status [path]
    python .cursor/scripts/session_manager.py info [path]
"""

import os
import json
import argparse
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List

TOKEN = re.compile(r"^[a-z0-9-]{1,40}$")

def get_project_root(path: str) -> Path:
    return Path(path).resolve()

def analyze_package_json(root: Path) -> Dict[str, Any]:
    pkg_file = root / "package.json"
    if not pkg_file.exists():
        return {"type": "unknown", "dependencies": {}}
    
    try:
        with open(pkg_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        deps = data.get("dependencies", {})
        dev_deps = data.get("devDependencies", {})
        all_deps = {**deps, **dev_deps}
        
        stack = []
        if "next" in all_deps: stack.append("Next.js")
        elif "react" in all_deps: stack.append("React")
        elif "vue" in all_deps: stack.append("Vue")
        elif "svelte" in all_deps: stack.append("Svelte")
        elif "express" in all_deps: stack.append("Express")
        elif "nestjs" in all_deps or "@nestjs/core" in all_deps: stack.append("NestJS")
        
        if "tailwindcss" in all_deps: stack.append("Tailwind CSS")
        if "prisma" in all_deps: stack.append("Prisma")
        if "typescript" in all_deps: stack.append("TypeScript")
        
        return {
            "name": data.get("name", "unnamed"),
            "version": data.get("version", "0.0.0"),
            "stack": stack,
            "scripts": list(data.get("scripts", {}).keys())
        }
    except Exception as e:
        return {"error": str(e)}

def count_files(root: Path) -> Dict[str, int]:
    stats = {"created": 0, "modified": 0, "total": 0}
    # Simple count for now, comprehensive tracking would require git diff or extensive history
    exclude = {".git", "node_modules", ".next", "dist", "build", ".agent", ".gemini", "__pycache__"}
    
    for root_dir, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in exclude]
        stats["total"] += len(files)
        
    return stats

def detect_features(root: Path) -> List[str]:
    # Heuristic: look at folder names in src/
    features = []
    src = root / "src"
    if src.exists():
        possible_dirs = ["components", "modules", "features", "app", "pages", "services"]
        for d in possible_dirs:
            p = src / d
            if p.exists() and p.is_dir():
                # List subdirectories as likely features
                for child in p.iterdir():
                    if child.is_dir():
                        features.append(child.name)
    return features[:10] # Limit to top 10

def print_status(root: Path):
    info = analyze_package_json(root)
    stats = count_files(root)
    features = detect_features(root)
    
    print("\n=== Project Status ===")
    print(f"\n📁 Project: {info.get('name', root.name)}")
    print(f"📂 Path: {root}")
    print(f"🏷️  Type: {', '.join(info.get('stack', ['Generic']))}")
    print(f"📊 Status: Active")
    
    print("\n🔧 Tech Stack:")
    for tech in info.get('stack', []):
        print(f"   • {tech}")
        
    print(f"\n✅ Detected Modules/Features ({len(features)}):")
    for feat in features:
        print(f"   • {feat}")
    if not features:
        print("   (No distinct feature modules detected)")
        
    print(f"\n📄 Files: {stats['total']} total files tracked")
    print("\n====================\n")

def runs_path(root: Path) -> Path:
    return root / ".axion" / "logs" / "runs.jsonl"


def safe_artifact(value: str) -> str:
    if not value or any(ch.isspace() for ch in value):
        raise ValueError("artifact must be a relative path")
    normalized = value.replace("\\", "/")
    if normalized.startswith("/") or ".." in normalized.split("/"):
        raise ValueError("artifact must be a relative path")
    return normalized


def append_run(root: Path, command: str, slug, exit_code, artifacts: List[str]) -> dict:
    if TOKEN.fullmatch(command) is None:
        raise ValueError("command must be a short token")
    if slug is not None and TOKEN.fullmatch(slug) is None:
        raise ValueError("slug must be a short token")
    record = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "command": command,
        "artifacts": [safe_artifact(item) for item in artifacts],
    }
    if slug:
        record["slug"] = slug
    if exit_code is not None:
        record["exit"] = exit_code
    dest = runs_path(root)
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=True) + "\n")
    return record


def last_verify(root: Path):
    path = runs_path(root)
    if not path.is_file():
        return None
    last = None
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            continue
        if record.get("command") == "verify":
            last = {key: record.get(key) for key in ("ts", "slug", "exit", "artifacts")}
    return last


def path_lint(root: Path) -> str:
    script = root / ".cursor" / "scripts" / "lint_paths.py"
    if not script.is_file():
        return "absent"
    result = subprocess.run([sys.executable, str(script), str(root)], capture_output=True, text=True)
    return "pass" if result.returncode == 0 else "fail"


def doctor(root: Path) -> dict:
    memory = root / ".agents" / "memory" / "MEMORY.md"
    lines = len(memory.read_text(encoding="utf-8").splitlines()) if memory.is_file() else 0
    return {
        "memory_index_lines": lines,
        "last_verify": last_verify(root),
        "path_lint": path_lint(root),
    }


def main():
    parser = argparse.ArgumentParser(description="Session Manager")
    parser.add_argument("command", choices=["status", "info", "log", "doctor"], help="Command to run")
    parser.add_argument("path", nargs="?", default=".", help="Project path")
    parser.add_argument("--command-name", dest="command_name", default=None)
    parser.add_argument("--slug", default=None)
    parser.add_argument("--exit", dest="exit_code", type=int, default=None)
    parser.add_argument("--artifact", action="append", default=[])

    args = parser.parse_args()
    root = get_project_root(args.path)

    if args.command == "status":
        print_status(root)
    elif args.command == "info":
        print(json.dumps(analyze_package_json(root), indent=2))
    elif args.command == "doctor":
        print(json.dumps(doctor(root)))
    elif args.command == "log":
        if not args.command_name:
            print("session_manager: --command-name is required", file=sys.stderr)
            sys.exit(2)
        try:
            append_run(root, args.command_name, args.slug, args.exit_code, args.artifact)
        except ValueError as exc:
            print(f"session_manager: {exc}", file=sys.stderr)
            sys.exit(2)
        print("session_manager: logged")

if __name__ == "__main__":
    main()
