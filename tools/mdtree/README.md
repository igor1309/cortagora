# mdtree

`mdtree` — утилита для генерации читаемого дерева структуры репозитория  
с ограничением глубины и количества файлов в каждой папке.

Предназначена в первую очередь для вставки в `README.md`.

---

## Возможности

- Ограничение глубины обхода директорий
- Показ **не более 5 файлов** в каждой папке
- Исключение служебных и мусорных директорий:
  - `node_modules`
  - `.git`
  - `DerivedData`
  - `Pods`
  - `build`, `.build`, `dist`
  - все скрытые файлы и папки (`.*`)
- Детеминированный и стабильный вывод
- Подходит для macOS (Python 3)

---

## Структура

```text
tools/
└── mdtree/
    ├── mdtree.py
    └── README.md
```

---

## Требования

- macOS
- Python 3.9+ (стандартная поставка macOS подходит)

Никаких внешних зависимостей.

---

## Использование

### Печать в stdout

```bash
python3 tools/mdtree/mdtree.py
```

### Генерация структуры для README

```bash
echo '```text' > STRUCTURE.md
python3 tools/mdtree/mdtree.py >> STRUCTURE.md
echo '```' >> STRUCTURE.md
```

Полученный файл `STRUCTURE.md` можно напрямую вставлять в `README.md`.

---

## Настройка

Все параметры задаются в начале `mdtree.py`:

```python
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
```

Изменения не требуют правки логики скрипта.

---

## Пример вывода

```text
project/
├── README.md
├── Package.swift
├── Sources/
│   ├── App/
│   │   ├── App.swift
│   │   └── SceneDelegate.swift
│   └── Core/
│       ├── Logger.swift
│       ├── Network.swift
│       └── … (+4 more files)
└── Tests/
    └── CoreTests.swift
```

---

## Зачем не `tree`

`tree` и аналоги:
- не умеют ограничивать количество файлов на директорию
- требуют сложных пайпов для фильтрации
- плохо подходят для стабильных README

`mdtree` решает именно задачу **документирования структуры**, а не навигации по ФС.

---
