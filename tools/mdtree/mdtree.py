#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

# ================= CONFIG =================

MAX_DEPTH = 6
MAX_FILES_PER_DIR = 5

EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "DerivedData",
    "build",
    ".build",
    "dist",
    "Pods",
}

# ==========================================

def is_hidden(path: Path) -> bool:
    return path.name.startswith(".")

def is_excluded_dir(path: Path) -> bool:
    return (
        path.name in EXCLUDE_DIRS
        or is_hidden(path)
    )

def list_dir(path: Path):
    dirs = []
    files = []

    try:
        for p in path.iterdir():
            if p.is_dir():
                if not is_excluded_dir(p):
                    dirs.append(p)
            elif p.is_file():
                if not is_hidden(p):
                    files.append(p)
    except PermissionError:
        return [], [], True

    dirs.sort(key=lambda x: x.name.lower())
    files.sort(key=lambda x: x.name.lower())

    return dirs, files, False

def print_tree(path: Path, depth: int, prefix: str = ""):
    if depth >= MAX_DEPTH:
        return

    dirs, files, denied = list_dir(path)
    if denied:
        print(f"{prefix}└── (permission denied)")
        return

    shown_files = files[:MAX_FILES_PER_DIR]
    omitted_files = len(files) - len(shown_files)

    entries = [(d, "dir") for d in dirs] + [(f, "file") for f in shown_files]
    if omitted_files > 0:
        entries.append((omitted_files, "more"))

    for index, (entry, kind) in enumerate(entries):
        is_last = index == len(entries) - 1
        branch = "└── " if is_last else "├── "
        next_prefix = prefix + ("    " if is_last else "│   ")

        if kind == "dir":
            print(f"{prefix}{branch}{entry.name}/")
            print_tree(entry, depth + 1, next_prefix)
        elif kind == "file":
            print(f"{prefix}{branch}{entry.name}")
        else:
            print(f"{prefix}{branch}… (+{entry} more files)")

def main():
    root = Path(".").resolve()
    print(f"{root.name}/")
    print_tree(root, 0)

if __name__ == "__main__":
    main()