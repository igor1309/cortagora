---
date: 2026-01-09
model: gpt-5.2
description: "repo root README.md"
---

# cortagora

Монорепозиторий знаний и материалов для разработки художественных проектов и AI-ассистентов сценариста.

Правила структуры и терминология: `ARCHITECTURE.md`. Ниже — краткий обзор и workflow.

## Quick navigation

- `works/` — проекты/произведения (в идеале slug-имена: `winter-shadow`, `deceptor`, `blackchain`, …; легаси-исключения возможны)
- `world/` — глобальный world-material (надпроектный; не канон)
- `research/` — надпроектный reference (исследования, инструменты, обзоры, выжимки)
- `framework/domains/` — предметные области и рамки (например: архетипы, Пропп, переговоры)
- `framework/protocols/` — протоколы взаимодействия и рабочие стандарты
- `framework/modalities/` — режимы работы (analysis/brainstorm/…)
- `framework/personas/` — персоны и стилевые профили
- `framework/writing/` — методички по нарративу/сценарной технике
- `semi-RAG/` — “workshop”: временные тикеты/сборки/эксперименты retrieval
- `_inbox/` — входящее (сырьё до разборки)
- `logs/` — логирование и заметки процесса

Подробные правила структуры: `ARCHITECTURE.md`.

## Knowledge workflow

Этот репозиторий следует простому циклу: capture → triage → co-location.

### Phase 1: Frictionless capture (`_inbox/`)

`_inbox/` — временная landing zone для новых, неразобранных материалов.

- Purpose: фиксировать идеи, ссылки, заметки, выжимки без трения.
- Rule: сначала создать файл, позже довести имя/место.

### Phase 2: Triage & co-location

`_inbox/` не является постоянным домом. Во время ревью каждый элемент получает одно из действий:
1) Delete — больше не актуально
2) Merge — небольшое добавление в существующий документ
3) Move — ценный самостоятельный WIP

### Phase 3: Co-located WIP folders (underscore folders)

Переносите материал рядом с тем контекстом, к которому он относится, используя underscore-папки (см. `ARCHITECTURE.md`).

**Example (Deceptor S01):**
1) Capture: `/_inbox/note-about-character-secret.md`
2) Move:
   - как идея: `/works/deceptor/s01/_ideas/secret-backstory.md`
   - как world-material: `/works/deceptor/s01/world/_ideas/secret-backstory.md`
   - как зафиксированное решение: `/works/deceptor/s01/canon/characters.md`
