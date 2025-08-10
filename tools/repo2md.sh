#!/usr/bin/env bash
# =============================================================================
# repo2md.sh — Склеивает переданные файлы в единый Markdown "repo-content.md"
#
# НАЗНАЧЕНИЕ
#   Сформировать Markdown-документ строго в формате:
#
#   # REPO CONTENT
#
#   ## List
#   - <basename_1>
#   - <basename_2>
#   ...
#
#   ## <basename_1>
#   ```<last_extension_lowercased_or_empty>
#   <file_1 contents>
#   ```
#
#   ## <basename_2>
#   ```<last_extension_lowercased_or_empty>
#   <file_2 contents>
#   ```
#   ...
#
# ПРАВИЛА
#   - На вход подаются пути к файлам. Порядок в выходном документе соответствует
#     порядку аргументов.
#   - В списке и заголовках используется только базовое имя файла (без директорий).
#   - Язык код-фенса определяется по последнему расширению basename (в нижнем регистре).
#     Если расширения нет — язык не указывается (используется просто ```).
#   - Отсутствующие и нерегулярные файлы пропускаются с предупреждением в stderr.
#   - Выходной файл: ./repo-content.md (перезаписывается).
#
# СОВМЕСТИМОСТЬ
#   - Не использует фичи Bash 4+ (lowercasing делается через 'tr'), поэтому
#     работает на macOS с системным Bash 3.2.
#
# ИСПОЛЬЗОВАНИЕ
#   chmod +x repo2md.sh
#   ./repo2md.sh path/to/index.html src/script.js README.md
#
# =============================================================================

set -euo pipefail

OUT="repo-content.md"

usage() {
  echo "Usage: $(basename "$0") <file> [<file> ...]" >&2
}

if [[ $# -eq 0 ]]; then
  usage
  exit 2
fi

# Создадим временный файл и гарантированно удалим его при ошибке
TMP="$(mktemp "${OUT}.tmp.XXXXXXXX")"
cleanup() { rm -f "$TMP"; }
trap cleanup EXIT

declare -a VALID_PATHS=()
declare -a BASES=()

for p in "$@"; do
  # Пропускаем сам выходной файл, если его по ошибке передали на вход
  base_candidate="$(basename -- "$p" 2>/dev/null || true)"
  if [[ "$p" == "$OUT" || "$base_candidate" == "$OUT" ]]; then
    printf 'warning: skipping output file input "%s"\n' "$p" >&2
    continue
  fi

  if [[ -f "$p" ]]; then
    VALID_PATHS+=("$p")
    BASES+=("$(basename -- "$p")")
  else
    printf 'warning: not a regular file: %s\n' "$p" >&2
  fi
done

if [[ ${#VALID_PATHS[@]} -eq 0 ]]; then
  echo "No valid files to process." >&2
  exit 3
fi

# Заголовок и список
{
  printf '# REPO CONTENT\n\n'
  printf '## List\n'
  for base in "${BASES[@]}"; do
    printf -- '- %s\n' "$base"
  done
  printf '\n'
} > "$TMP"

# Контент по файлам
for i in "${!VALID_PATHS[@]}"; do
  p="${VALID_PATHS[$i]}"
  base="${BASES[$i]}"

  # Определяем язык по последнему расширению basename (lowercased)
  lang=""
  if [[ "$base" == *.* ]]; then
    ext="${base##*.}"
    lang="$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')"
  fi

  {
    printf '## %s\n\n' "$base"
    if [[ -n "$lang" ]]; then
      printf '```%s\n' "$lang"
    else
      printf '```\n'
    fi
    cat -- "$p"
    printf '\n```\n\n'
  } >> "$TMP"
done

# Атомарная замена
mv "$TMP" "$OUT"
trap - EXIT