---
date: 2026-01-29
model: gpt-5.2
description: "Contributor guide for the cortagora repository"
---

# Repository Guidelines

## Project Structure & Module Organization
This repository is a knowledge base for creative projects and AI‑assistant materials. Core layers:
- `works/` — individual projects/works (primary unit of responsibility).
- `world/` — global world‑material (not canon).
- `research/` — cross‑project references, studies, digests.
- `framework/` — reusable thinking tools: `domains/`, `protocols/`, `modalities/`, `personas/`, `writing/`.
- `_inbox/` — temporary intake for unsorted material (must be triaged).
- `semi-RAG/` — workshop tickets/experiments.
- `tools/` — utilities/scripts; `docs/`, `brand/`, `logs/` are supporting areas.

Authoritative structure rules live in `ARCHITECTURE.md`; workflow overview is in `README.md`.

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

## Architecture Notes
Scope is defined by the nearest `Work.md` (project/season/other). Presence‑based folders mean “data exists here”; absence means “no data at this level.” When resolving conflicts, nearest scope wins.
