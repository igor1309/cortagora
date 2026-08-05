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

## Issue Tracking

Issues for this repository live in **Multica**, workspace `cortagora`, and are used via the installed `multica` CLI. Issue keys use the `COR-` prefix; commits that close an issue may lead with it (e.g. `COR-18: preserve Countess beyond a single explanation`).

The CLI's globally configured workspace is **not** cortagora, so every command must target the workspace explicitly — otherwise it silently operates on another workspace's issues:

```sh
export MULTICA_WORKSPACE_ID=f0ace115-39e3-445c-8853-5f07bfd4609a   # workspace "cortagora"
multica issue list
multica issue create --title "…" --description-stdin < body.md
```

Or pass `--workspace-id f0ace115-39e3-445c-8853-5f07bfd4609a` per command.

Notes:

- Verify the target before creating: `multica issue list --limit 5` must return `COR-*` keys.
- Multi-line or Russian descriptions: use `--description-stdin` (or `--description-file`), not `--description`.
- Agents available as assignees: `multica agent list`. There are no projects or labels defined in this workspace.

### Assigning to an agent

`multica issue assign <KEY> --to-id <agent-uuid>` **dispatches the agent immediately** — there is no queue-without-running step. So the issue must be complete before it is assigned: finish the description first, assign last. Editing the description afterwards does not reach a run already in flight.

To fix an issue that was assigned too early:

```sh
multica issue runs <KEY> --full-id                     # short prefixes are rejected
multica issue cancel-task <full-run-uuid> --issue <KEY>
multica issue update <KEY> --description-stdin < body.md
multica issue rerun <KEY>
```

### Source material goes inline

An agent runs in its own workdir and cannot be assumed to read paths outside the repository (iCloud, Desktop, another checkout), and the CLI has **no attachment support**. Paste the full source text into the description inside a fenced block rather than linking to a local path — the issue is the only carrier. Keep the original URL and date in the text so the eventual capture can cite them.

## Corpus

The `works/BLKCHN` corpus contains story materials (drafts, notes, world-building). Use corpus-scout MCP tools (`search`, `read_section`) to look up facts before answering questions or making changes. Never invent story details — check the corpus first.
