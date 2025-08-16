## The Library's Layout

```code
/
├── protocols/
│   └── CORE_PROTOCOL.md￼
│
├── modalities/
│   └── Brainstorming prompt (5).md
│   └── ... (other modality files)
│
├── personas/
│   └── ПЕРСОНЫ Тони Гилрой.md
│   └── ... (other persona files)
│
├── lore/
│   ├── project-alpha/
│   │   ├── bible.md          (Core rules, tone, themes)
│   │   ├── characters/
│   │   │   └── main_character.md
│   │   ├── locations/
│   │   └── timeline.md
│   └── project-beta/
│       └── ... (similar structure for another world)
│
├── domains/
│   ├── 01-character-theory/
│   │   ├── the-hero-journey.md
│   │   └── moral-compromise-framework.md
│   ├── 02-structure-and-pacing/
│   │   ├── three-act-structure.md
│   │   └── non-linear-narratives.md
│   ├── 03-dialogue/
│   │   └── subtext-in-conversation.md
│   ├── 04-marketing/
│   │   └── crafting-a-logline.md
│
└── semi-RAG/  (The "Workshop" table, where you assemble things)
    └── ... (Your temporary ticket folders go here)
```

---

## Knowledge Management Workflow

This repository follows a structured, two-stage process for managing information, designed to balance frictionless idea capture with long-term organization.

### Phase 1: Frictionless Capture (`_inbox`)

The `_inbox` folder at the root of the repository is the designated, temporary landing zone for all new, unprocessed information.

*   **Purpose:** To capture ideas, notes, links, and research with zero friction.
*   **Workflow:** When an idea strikes, especially on the go, create a new file in `_inbox`. Do not worry about perfect naming or placement. The goal is to get the information out of your head and into the system quickly.

### Phase 2: Triage & Co-location

The `_inbox` is not a permanent home for files. On a regular basis, its contents must be triaged and processed.

*   **Purpose:** To ensure every piece of information is evaluated and moved to a context-aware location.
*   **Workflow:** During a review session, each item in the `_inbox` is handled with one of three actions:
    1.  **Delete:** If the idea is no longer relevant.
    2.  **Merge:** If the content is a small addition to an existing canonical document.
    3.  **Move:** If the item is a valuable, standalone piece of work-in-progress.

### Phase 3: Structured Placement (WIP Folders)

Items moved from the `_inbox` are placed in staging folders co-located with the canonical documents they relate to. We use a consistent naming convention for these folders, prefixed with an underscore (`_`):

*   `_ideas`: For nascent concepts and brainstorming notes.
*   `_research`: For supporting articles, data, and external links.
*   `_archive`: For deprecated versions of documents or obsolete ideas that should be preserved.

These folders exist within the primary directories (`lore`, `domains`, `brand`, etc.), ensuring that work-in-progress materials are always kept in context.

**Example:** An unprocessed idea about a character in Project Alpha would follow this path:
1.  **Capture:** `/_inbox/note-about-character-secret.md`
2.  **Triage & Move:** ` /lore/project-alpha/characters/_ideas/secret-backstory.md`