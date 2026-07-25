---
date: 2026-01-29
model: gpt-5.2
description: "Contributor guide for the cortagora repository"
---

# Repository Guidelines

## Project Structure & Module Organization
Repository structure — layers, scope, presence‑based folders, nearest‑wins, and the `research/` · `inspo/` · `sandbox/` distinction — is defined authoritatively in `ARCHITECTURE.md`; workflow overview is in `README.md`. Read `ARCHITECTURE.md` before placing files or reasoning about structure. It is the single source of truth and is intentionally not paraphrased here.

## Build, Test, and Development Commands
There is no build or test system. Most work is Markdown and assets.
- Snapshot helper: `chmod +x tools/repo2md.sh` then `./tools/repo2md.sh README.md ARCHITECTURE.md` to generate `repo-content.md`.

## Coding Style & Naming Conventions
- Markdown docs should include front‑matter with `date`, `model`, and `description`.
- Use real Markdown headings: exactly one `#` title per file, then `##`/`###`.
- Prefer `kebab-case` for new directories and “navigation” files; Russian filenames are acceptable inside project content.
- Use co‑located underscore folders for WIP (`_ideas/`, `_research/`, `_archive/`, `_inspo/`).

## Testing Guidelines
No automated tests are defined. Validation is manual: ensure files are placed under the correct scope, links resolve, and `_inbox/` items are triaged or moved.

## Commit & Pull Request Guidelines
Recent history uses short, descriptive subject lines (often just the file/topic); both English and Russian are used. No strict prefixing or ticket format is evident.
For PRs, include: a brief summary, affected scopes (e.g., `works/deceptor/s01`), and any canon decisions or structural changes. Add examples or screenshots if you introduce new templates or workflows.

## Corpus

The `works/BLKCHN` corpus contains story materials (drafts, notes, world-building). Use corpus-scout MCP tools (`search`, `read_section`) to look up facts before answering questions or making changes. Never invent story details — check the corpus first.
