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

### TL;DR for long captures

A captured note (clipping, interview, transcript, research digest) whose body runs longer than roughly 60 lines or four `##` sections opens with a `## TL;DR` section. Shorter notes do not — for those the `why` front‑matter field already does the job, and a second layer of summary is noise.

Placement and content:

- `## TL;DR` is the first `##` section: after the `#` title and the one‑paragraph lead saying who said this, to whom and when — before the body.
- It carries **only what the source states**. Keep your own reading in a separate trailing section (e.g. `## Мои выводы (не источник)`), and say so in one line inside the TL;DR.
- It does not replace `why`. `why` is why this material matters to us; TL;DR is what the material says. The two are written from different angles on purpose.
- Bullets, not prose. Numbers, dates and direct quotes belong here — that is what gets re‑read.

This applies to new captures. Do not retrofit existing files just to satisfy the rule; add a TL;DR when you are editing such a file for other reasons anyway.

Worked example: `works/zero-day-censorship/inspo/ркн-против-amnezia-vpn-2026.md`.

## Testing Guidelines
No automated tests are defined. Validation is manual: ensure files are placed under the correct scope, links resolve, and `_inbox/` items are triaged or moved.

## Commit & Pull Request Guidelines
Recent history uses short, descriptive subject lines (often just the file/topic); both English and Russian are used. No strict prefixing or ticket format is evident.
For PRs, include: a brief summary, affected scopes (e.g., `works/deceptor/s01`), and any canon decisions or structural changes. Add examples or screenshots if you introduce new templates or workflows.

## Corpus

The `works/BLKCHN` corpus contains story materials (drafts, notes, world-building). Use corpus-scout MCP tools (`search`, `read_section`) to look up facts before answering questions or making changes. Never invent story details — check the corpus first.
