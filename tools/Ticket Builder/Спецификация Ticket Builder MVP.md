## Спецификация **Ticket Builder MVP**  
*(v 2025-08-07)*  

---

### 1. Назначение  
Создать из загруженных файлов **одним действием** неизменяемый Markdown-тикет, который служит структурированным промптом для LLM-«комнаты сценаристов».

---

### 2. Пользовательский поток  

| Шаг | Действие | Детали |
|-----|----------|--------|
| **1. Upload** | Загрузка файлов четырёх типов: <br>• **Modality docs** (описания модальностей) <br>• **Masters** (профили персонажей-“мастеров”) <br>• **Knowledge** (любые вспомогательные материалы) <br>• **Protocol** (полный текст протокола Writers’ Room) | Drag-and-drop или выбор файлов. |
| **2. Select** | Выбрать **ровно одну** модальность из загруженных; <br>выбрать ≥ 1 мастера ( `room-runner` добавляется автоматически). | Списки формируются из загруженных заголовков/имён файлов. |
| **3. Stats & Download** | Справа отображается блок **Stats** (только чтение): <br>• Characters <br>• Words <br>• **Tokens** — модель выбирается в селекторе (`cl100k_base` по умолчанию). <br>Детализированные цифры по секциям. | Подсчёт пересчитывается при любом изменении полей/выборе модели. |
| **4. Download** | Кнопка **Download Markdown** → сохраняется файл `tb-YYYY-MM-DD-###.md`. | Тикет после создания **иммутабелен**. |

> **Нет**: кнопки копирования статистики, переключателя «Include protocol», создания пустой папки под артефакт.

---

### 3. Формат тикета  

#### 3.1 YAML-шапка (Front-matter)

```yaml
---
ticket_id: "tb-2025-08-07-001"        # формируется автоматически
created_at: "2025-08-07T00:00:00Z"    # ISO-8601, UTC
task: "Краткая формулировка задания"
language: "auto"                      # auto | ru | en
modality:
  name: "АНАЛИЗ"                      # из загруженного файла
  source: "modalities/analysis.md"    # относительный путь/имя файла
masters:
  - "room-runner"
  - "Имя мастера 1"
knowledge:
  - "knowledge/doc1.md"
  - "knowledge/research.pdf"
constraints:
  editable: false                     # всегда false
artifact_policy: "final_only"         # артефакт хранится отдельно вручную
protocol_source: "THE BLACKCHAIN – WRITERS’ ROOM PROTOCOL (v5.0).md"
protocol_version: "5.0"

token_stats:                          # добавляется автоматически
  model: "cl100k_base"
  total_tokens: 1234
  sections:
    task: 100
    extra_context: 200
    modality: 300
    masters: 50
    protocol: 584
---
```

#### 3.2 Тело тикета

```markdown
# Task
(1–3 абзаца: что нужно сделать, критерии успеха, границы.)

## Extra context
(контекст задания).

## Modality (full text)
(полный текст выбранной модальности).

## Masters (briefs)
- **room-runner** — краткая памятка.
- **Имя мастера 1** — краткая памятка.

## Knowledge (index)
- knowledge/doc1.md
- knowledge/research.pdf

## Room Protocol — FULL TEXT
(полный текст Writers’ Room Protocol).
```

---

### 4. Правила валидации  

| Поле | Условие |
|------|---------|
| `task` | ≥ 5 символов |
| `modality.name` | обязателен; `source` указывает на загруженный файл |
| `masters` | список не пуст; `room-runner` всегда присутствует |
| `protocol_source` | обязателен и существует среди загруженных |
| `knowledge` | произвольный список файлов/ссылок |
| `constraints.editable` | всегда `false` |

---

### 5. Подсчёт токенов  

- На фронтенде используется `tiktoken-wasm` (или аналог) с пресетом `cl100k_base`; дополнительно доступны `o200k_base`, `llama-bpe`.  
- Подсчёт ведётся **по секциям** (Task, Extra context, Modality, Masters, Protocol) и суммарно.  
- При недоступности токенизатора — fallback: `ceil(characters / 4)`.  
- Результат автоматически записывается в `token_stats` YAML.

---

### 6. JSON Schema (опционально для бэкенда)

```json
{
  "type": "object",
  "required": ["task", "language", "modality", "masters",
               "knowledge", "constraints", "artifact_policy",
               "protocol_source", "token_stats"],
  "properties": {
    "ticket_id": {"type": "string"},
    "created_at": {"type": "string", "format": "date-time"},
    "task": {"type": "string", "minLength": 5},
    "language": {"type": "string", "enum": ["auto","ru","en"]},
    "modality": {
      "type": "object",
      "required": ["name","source"],
      "properties": {
        "name": {"type": "string"},
        "source": {"type": "string"}
      }
    },
    "masters": {"type": "array", "minItems": 1, "items": {"type": "string"}},
    "knowledge": {"type": "array", "items": {"type": "string"}},
    "constraints": {
      "type": "object",
      "required": ["editable"],
      "properties": {"editable": {"type": "boolean", "const": false}}
    },
    "artifact_policy": {"type": "string", "enum": ["final_only"]},
    "protocol_source": {"type": "string"},
    "protocol_version": {"type": "string"},
    "token_stats": {
      "type": "object",
      "required": ["model","total_tokens","sections"],
      "properties": {
        "model": {"type": "string"},
        "total_tokens": {"type": "integer"},
        "sections": {"type": "object"}
      }
    }
  }
}
```

---

### 7. Зависимости фронтенда  

| Пакет | Назначение |
|-------|-----------|
| `tiktoken-wasm` | токенизация (`cl100k_base`, `o200k_base`) |
| `llama-tokenizer-js` | опция для LLaMA-BPE |
| `marked` *(или аналог)* | Markdown-парсинг заголовков |
| `file-saver` | скачивание итогового `.md` |

---

### 8. Файловая организация (локально)  

```
/tickets/                         # хранятся созданные тикеты
  tb-2025-08-07-001.md
/knowledge/                       # загруженные материалы (read-only)
/modalities/                      # тексты модальностей
/masters/                         # профили мастеров
/protocol/                        # Writers’ Room Protocol
```

*Автоматического создания папок под артефакты нет; финальный результат LLM размещается вручную по желанию.*

---

Конец спецификации.