#!/usr/bin/env bash
# =============================================================================
# repo2md.sh — формирует единый Markdown «repo-content.md» для LLM-контекста.
#
# ЧТО ДЕЛАЕТ
#   Собирает переданные на вход файлы в один Markdown со структурой:
#     # REPO CONTENT
#     ## List
#     Files: N · Total: X · Est. tokens: ~Y
#     | # | File | Size | Lines |
#     ...
#     ## Files
#     ### <basename>
#     _Path: <relative/path>_
#     ```<language>        # безопасный код-фенс (длина бэктиков подбирается)
#     <содержимое файла / при необходимости head + tail>
#     ```
#     <!-- END OF SNAPSHOT -->
#
# ОСОБЕННОСТИ
#   • «List» — таблица с ссылками-якорями на секции, сводка (Files/Total/Tokens)
#     вынесена сразу под заголовок «## List».
#   • «Files» — секции по файлам с заголовками уровня H3 (###) и относительным
#     путём (от текущего каталога).
#   • Подсветка кода по последнему расширению файла (маппинг популярных языков).
#   • Безопасные код-фенсы: длина бэктиков выбирается как (максимум подряд в
#     содержимом + 1), минимум 3. Открытие/закрытие одинаковой длины.
#   • Встроенный «repo2mdignore» — набор shell-glob паттернов внутри скрипта,
#     сопоставляемых с относительными путями; совпавшие файлы игнорируются.
#   • Опциональное усечение крупных файлов по схеме head+tail переменными окружения:
#       LINES_HEAD=200 LINES_TAIL=80 ./repo2md.sh <files>
#     При усечении в центре вставляется маркер с числом пропущенных строк.
#
# ИСПОЛЬЗОВАНИЕ
#   chmod +x repo2md.sh
#   ./repo2md.sh path/to/index.html src/script.js README.md
#
# ЗАМЕТКИ
#   • Порядок файлов в выходном документе соответствует порядку аргументов.
#   • Предупреждения об отсутствующих/не-регулярных файлах и об игноре печатаются в stderr.
#   • Выходной файл всегда перезаписывается: ./repo-content.md
# =============================================================================

set -euo pipefail

OUT="repo-content.md"
TMP="$(mktemp "${OUT}.tmp.XXXXXXXX")"
cleanup() { rm -f "$TMP"; }
trap cleanup EXIT

usage() { echo "Usage: $(basename "$0") <file> [<file> ...]" >&2; }
[[ $# -eq 0 ]] && { usage; exit 2; }

# --- Helpers -----------------------------------------------------------------

lower() { tr '[:upper:]' '[:lower:]'; }

slugify() {
  # якорь из basename: разрешаем [a-z0-9._-], прочее -> -
  printf '%s' "$1" | lower | sed -E 's/[^a-z0-9._-]+/-/g; s/-{2,}/-/g; s/^-+//; s/-+$//'
}

human_size() {
  # bytes -> B/KB/MB с 1 знаком после запятой
  local b="$1"
  if (( b < 1024 )); then
    printf "%d B" "$b"
  elif (( b < 1024*1024 )); then
    awk -v n="$b" 'BEGIN{printf "%.1f KB", n/1024}'
  else
    awk -v n="$b" 'BEGIN{printf "%.1f MB", n/1048576}'
  fi
}

ext_of() {
  # последнее расширение basename (case-insensitive), спец-случаи без точки
  local base="$1" lowbase
  lowbase="$(printf '%s' "$base" | lower)"
  case "$lowbase" in
    makefile)  echo "makefile"; return;;
    dockerfile) echo "dockerfile"; return;;
  esac
  if [[ "$base" == *.* ]]; then
    printf '%s\n' "${base##*.}" | lower
  else
    echo ""
  fi
}

lang_of_ext() {
  # маппинг расширений к «языкам» fenced-код блока
  local ext="${1:-}"
  case "$ext" in
    js) echo "javascript" ;;
    ts) echo "typescript" ;;
    jsx) echo "jsx" ;;
    tsx) echo "tsx" ;;
    sh|bash) echo "bash" ;;
    zsh) echo "zsh" ;;
    py) echo "python" ;;
    rb) echo "ruby" ;;
    php) echo "php" ;;
    java) echo "java" ;;
    c|h) echo "c" ;;
    cc|cxx|cpp|hpp|hh|hxx) echo "cpp" ;;
    m) echo "objectivec" ;;
    mm) echo "objectivecpp" ;;
    swift) echo "swift" ;;
    kt|kts) echo "kotlin" ;;
    go) echo "go" ;;
    rs) echo "rust" ;;
    cs) echo "csharp" ;;
    scala) echo "scala" ;;
    sql) echo "sql" ;;
    yaml|yml) echo "yaml" ;;
    json) echo "json" ;;
    html|htm) echo "html" ;;
    css) echo "css" ;;
    md|markdown) echo "markdown" ;;
    toml) echo "toml" ;;
    makefile) echo "makefile" ;;
    dockerfile) echo "dockerfile" ;;
    txt|"") echo "" ;;
    *) echo "$ext" ;;  # по умолчанию — как есть
  esac
}

repeat_ticks() {
  # без зависимости от seq (совместимо с bash 3.2)
  local n="$1" i=0 out=""
  while [ "$i" -lt "$n" ]; do out="${out}\`"; i=$((i+1)); done
  printf '%s' "$out"
}

max_backticks_in_file_plus1() {
  # Возвращает (макс-длина подряд идущих ` в файле + 1), минимум 3
  awk '
    {
      line=$0; cnt=0;
      for(i=1;i<=length(line);i++){
        ch=substr(line,i,1);
        if(ch=="`"){cnt++} else { if(cnt>max){max=cnt}; cnt=0 }
      }
      if(cnt>max){max=cnt}
    }
    END{
      m = (max+1); if (m < 3) m = 3; print m
    }
  ' "$1"
}

safe_fence_for_file() {
  local path="$1" n
  n="$(max_backticks_in_file_plus1 "$path")"
  repeat_ticks "$n"
}

wc_bytes() { wc -c < "$1" | tr -d '[:space:]'; }
wc_lines() { wc -l < "$1" | tr -d '[:space:]'; }

relpath() {
  # относительный путь от физического PWD; если вне — вернуть как есть
  local p="$1" pwdp
  pwdp="$(pwd -P)"
  case "$p" in
    "$OUT") echo "$OUT" ;;
    /*)
      if [[ "$p" == "$pwdp/"* ]]; then
        printf '%s\n' "${p#"$pwdp"/}"
      else
        printf '%s\n' "$p"
      fi
      ;;
    ./*) printf '%s\n' "${p#./}" ;;
    *)   printf '%s\n' "$p" ;;
  esac
}

# --- Inline repo2mdignore ----------------------------------------------------
# Сопоставление выполняется с ОТНОСИТЕЛЬНЫМИ путями.
IGNORE_PATTERNS=(
  ".git/*" "*/.git/*"
  "node_modules/*" "*/node_modules/*"
  "dist/*" "*/dist/*"
  "build/*" "*/build/*"
  "coverage/*" "*/coverage/*"
  "target/*" "*/target/*"
  ".next/*" "*/.next/*"
  ".DS_Store"
  "*.map"
  "*.min.js"
)

ignore_match() {
  local rel="$1" pat
  for pat in "${IGNORE_PATTERNS[@]}"; do
    [[ "$rel" == $pat ]] && return 0
  done
  return 1
}

# --- Collect inputs ----------------------------------------------------------

declare -a PATHS=() BASES=() SLUGS=() SIZES=() LINES=() RELS=()
total_bytes=0

for p in "$@"; do
  base="$(basename "$p" 2>/dev/null || true)"
  [[ "$base" == "$OUT" ]] && { printf 'warning: skipping output file "%s"\n' "$p" >&2; continue; }

  if [[ -f "$p" ]]; then
    rel="$(relpath "$p")"
    if ignore_match "$rel"; then
      printf 'info: ignored by repo2mdignore: %s\n' "$rel" >&2
      continue
    fi

    PATHS+=("$p")
    BASES+=("$base")
    SLUGS+=("$(slugify "$base")")
    RELS+=("$rel")

    b=$(wc_bytes "$p")
    l=$(wc_lines "$p")
    SIZES+=("$b")
    LINES+=("$l")
    total_bytes=$(( total_bytes + b ))
  else
    printf 'warning: not a regular file: %s\n' "$p" >&2
  fi
done

[[ ${#PATHS[@]} -eq 0 ]] && { echo "No valid files to process." >&2; exit 3; }

files_count="${#PATHS[@]}"
est_tokens=$(( (total_bytes + 3) / 4 ))  # грубая оценка (~4 байта на токен)

# --- Header & List (table) ---------------------------------------------------

{
  printf '# REPO CONTENT\n\n'
  printf '## List\n'
  printf 'Files: %d · Total: %s · Est. tokens: ~%d\n\n' \
    "$files_count" "$(human_size "$total_bytes")" "$est_tokens"

  printf '| # | File | Size | Lines |\n'
  printf '|---:|:-----|----:|-----:|\n'
  for i in "${!PATHS[@]}"; do
    base="${BASES[$i]}"; slug="${SLUGS[$i]}"; size="${SIZES[$i]}"; lines="${LINES[$i]}"
    printf '| %d | [`%s`](#%s) | %s | %s |\n' \
      "$((i+1))" "$base" "$slug" "$(human_size "$size")" "$lines"
  done
  printf '\n'

  printf '## Files\n\n'
} > "$TMP"

# --- Sections ----------------------------------------------------------------

HEAD="${LINES_HEAD:-0}"
TAIL="${LINES_TAIL:-0}"

for i in "${!PATHS[@]}"; do
  p="${PATHS[$i]}"; base="${BASES[$i]}"; slug="${SLUGS[$i]}"; rel="${RELS[$i]}"
  ext="$(ext_of "$base")"; lang="$(lang_of_ext "$ext")"
  fence="$(safe_fence_for_file "$p")"
  total_l="${LINES[$i]}"

  {
    printf '<a id="%s"></a>\n' "$slug"
    printf '### %s\n\n' "$base"
    printf '_Path: %s_\n\n' "$rel"

    if [[ -n "$lang" ]]; then
      # Открывающий фенс той же длины, что и закрывающий; язык — через пробел
      printf '%s %s\n' "$fence" "$lang"
    else
      printf '%s\n' "$fence"
    fi

    if (( HEAD>0 || TAIL>0 )); then
      if (( total_l > HEAD + TAIL && HEAD>0 && TAIL>0 )); then
        sed -n "1,${HEAD}p" "$p"
        printf '\n... [truncated %d lines]\n\n' "$(( total_l - HEAD - TAIL ))"
        tail -n "$TAIL" "$p"
      else
        cat "$p"
      fi
    else
      cat "$p"
    fi

    printf '\n%s\n\n' "$fence"
  } >> "$TMP"
done

printf '<!-- END OF SNAPSHOT -->\n' >> "$TMP"

# --- Finalize ----------------------------------------------------------------
mv "$TMP" "$OUT"
trap - EXIT