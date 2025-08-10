# Knowledge Base Markdown Schema

This section describes a **scalable front matter schema** for Markdown-based knowledge bases.

It is:
- **Human-friendly** to edit in plain text.
- **Machine-readable** for scripts, generators, or APIs.
- **Compatible** with many static site generators and search indexers.

## Example

```yaml
---
id: ai-model-selection               # Stable unique ID (good for cross-links, migrations)
title: Choosing an AI Model for Text Summarization
summary: Key factors to consider when selecting a model for concise text summaries.
tags: [AI, NLP, Summarization]        # Array for consistency
category: Natural Language Processing # One main category (optional)
status: published                     # draft | review | published
created: 2025-08-10                   # ISO 8601 dates
updated: 2025-08-10
version: 1.2                          # Useful if documents are versioned
related:                              # Internal or external related resources
  - /ai/model-evaluation
  - /nlp/tokenization-guide
links:                                # External links for quick reference
  paper: https://arxiv.org/abs/1234.5678
  repo: https://github.com/example/ai-summary
author: Igor Malyarov                 # Or list of authors
---
```

## Field Reference

| Field         | Purpose | Why it matters long-term |
|---------------|---------|--------------------------|
| **id**        | Permanent reference key | Lets you change file paths/titles without breaking links. |
| **title**     | Human-friendly heading | Can be used for HTML `<title>` or TOCs. |
| **summary**   | Short description | Helps in search snippets, list views, and SEO metadata. |
| **tags**      | Multi-label classification | Enables multi-faceted search & filtering. |
| **category**  | Primary classification | Useful for hierarchical navigation. |
| **status**    | Workflow indicator | Lets you include/exclude drafts or WIP content. |
| **created/updated** | Content lifecycle tracking | Supports "Recently updated" lists and version control. |
| **version**   | Explicit doc version | Critical if the KB tracks changing specs/processes. |
| **related**   | Links to other KB entries | Improves discoverability and context. |
| **links**     | External references | Allows external resource mapping without cluttering the body. |
| **author**    | Attribution | Supports filtering or credits. |

## Benefits

- **Search indexing** → Export metadata into a search DB without parsing the body.
- **Cross-linking** → `related` entries allow auto-generated "See also" sections.
- **Status filtering** → Only publish `status: published` entries; keep drafts in repo.
- **Changelogs** → `updated` and `version` fields allow auto-generating update feeds.
