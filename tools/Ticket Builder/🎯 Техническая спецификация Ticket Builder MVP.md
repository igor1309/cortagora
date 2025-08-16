## 🎯 Техническая спецификация Ticket Builder MVP  
*(финальная, без метаданных файлов; готова для передачи AI-кодеру)*  

---

### 1. Назначение  

Сгенерировать неизменяемый Markdown-тикет, который служит промптом для LLM-«комнаты сценаристов».  
Процесс: **Upload файлов → Select опций → Download тикета** (один шаг, без черновиков).

---

### 2. Стек и архитектура  

| Слой | Технологии | Ключевые функции |
|------|------------|------------------|
| **UI (SPA)** | HTML + CSS (любая удобная библиотека) <br>Vanilla JS или маленький фреймворк (например Preact) | • Drag-and-drop и `input[type=file]` <br>• Формы выбора модальности/мастеров <br>• Отображение статистики (символы / слова / токены) |
| **Token Engine** | `tiktoken-wasm` (Web Worker) <br>Доп. опция — `llama-tokenizer-js` | • Подсчёт токенов для моделей `cl100k_base`, `o200k_base`, `llama-bpe` <br>• Детализация по секциям <br>• Fallback `Math.ceil(char/4)` при сбое |
| **Generator** | JS-модуль | • Построение YAML front-matter <br>• Инклюд выбранных текстов (полный протокол + модальность) <br>• Запись `token_stats` |
| **Persistence** | `FileSaver.js` или нативный `Blob` → `download` | • Скачивание `tb-YYYY-MM-DD-###.md` напрямую в браузере |

> **Нет БД, серверной части и метаданных файлов.** Всё локально в браузере.

---

### 3. Пользовательский поток  

```
1) Upload   — Modalities, Masters, Knowledge, Protocol
2) Select   — 1 Modality  +  (>=1) Masters  (room-runner auto)
3) Review   — Stats (read-only): Characters • Words • Tokens (model selector)
4) Download — Markdown-тикет
```

---

### 4. Формат итогового файла  

#### 4.1 YAML (front-matter)

```yaml
---
ticket_id: "tb-2025-08-07-001"
created_at: "2025-08-07T00:00:00Z"
task: "Краткая формулировка задания"
language: "ru"                # auto-детект → фиксируем ru | en
modality:
  name: "АНАЛИЗ"
  source: "modalities/analysis.md"
masters:
  - "room-runner"
  - "Имя мастера 1"
knowledge:
  - "knowledge/doc1.md"
  - "knowledge/research.pdf"
constraints:
  editable: false
artifact_policy: "final_only"
protocol_source: "THE BLACKCHAIN – WRITERS’ ROOM PROTOCOL (v5.0).md"

token_stats:
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

#### 4.2 Markdown-тело  

```
# Task
…

## Extra context
…

## Modality (full text)
…

## Masters (briefs)
- **room-runner** — …
- **Имя мастера 1** — …

## Knowledge (index)
- knowledge/doc1.md
- knowledge/research.pdf

## Room Protocol — FULL TEXT
…
```

---

### 5. Правила валидации (frontend)  

| Поле | Условие |
|------|---------|
| `task` | ≥ 5 символов |
| `modality.name` | обязательно; ровно одна |
| `masters` | ≥ 1; `room-runner` всегда в списке |
| `protocol_source` | выбран и загружен |
| `knowledge` | произвольный список путей |
| `constraints.editable` | всегда `false` |

---

### 6. Детали реализации  

1. **Web Worker** для токенизации  
   ```js
   // main thread
   const worker = new Worker('./tokenWorker.js', {type:'module'});
   worker.postMessage({text, model:'cl100k_base'});
   worker.onmessage = ({data}) => updateStats(data);
   ```

2. **Автоматический выбор языка**  
   ```js
   const isRu = /[\u0400-\u04FF]/.test(task + extraContext);
   yaml.language = isRu ? 'ru' : 'en';
   ```

3. **Формат `ticket_id`**  
   ```
   tb-YYYY-MM-DD-<incremental 3-digit>
   ```

4. **UI-скелет** (пример)  
   ```
   <input multiple id="fileDrop" />
   <select id="modalitySelect">…</select>
   <select id="mastersSelect" multiple>…</select>
   <select id="modelSelect">cl100k_base …</select>
   <pre id="statsBox">…</pre>
   <button id="downloadBtn">Download Markdown</button>
   ```

---

### 7. Acceptance Criteria  

| № | Критерий | Проверка |
|---|----------|----------|
| 1 | Файл создаётся за один проход Upload → Download | Мануальный smoke-тест |
| 2 | YAML валиден, все обязательные поля присутствуют | `yaml.parse` без ошибки |
| 3 | `token_stats.total = Σ sections` | Unit-тест |
| 4 | Подсчёт токенов не блокирует UI (Web Worker) | Lighthouse / Performance |
| 5 | Отсутствие метаданных файлов | Просмотр YAML |

---

### 8. Сроки и объём  

| Задача | Часы |
|--------|------|
| UI + drag-and-drop | 4 |
| Parser titles & lists | 2 |
| Token Worker (tiktoken-wasm) | 3 |
| Generator + download | 3 |
| Validation & tests | 2 |
| **Итого** | **14 ч** |

---

Готово для прямой передачи в работу.