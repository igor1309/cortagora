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
TMP="$(mktemp "${OUT}.tmp.XXXXXXXX")"
cleanup() { rm -f "$TMP"; }
trap cleanup EXIT

usage() { echo "Usage: $(basename "$0") <file> [<file> ...]" >&2; }
[[ $# -eq 0 ]] && { usage; exit 2; }

# --- Helpers -----------------------------------------------------------------
lower() { tr '[:upper:]' '[:lower:]'; }
slugify(){ printf '%s' "$1"|lower|sed -E 's/[^a-z0-9._-]+/-/g; s/-{2,}/-/g; s/^-+//; s/-+$//'; }
human_size(){ local b="$1"; if((b<1024));then printf "%d B" "$b"; elif((b<1048576));then awk -v n="$b" 'BEGIN{printf "%.1f KB",n/1024}'; else awk -v n="$b" 'BEGIN{printf "%.1f MB",n/1048576}'; fi; }
ext_of(){ local base="$1" low; low="$(printf '%s' "$base"|lower)"; case "$low" in makefile)echo makefile;return;; dockerfile)echo dockerfile;return;; esac; [[ "$base" == *.* ]]&&{ printf '%s\n' "${base##*.}"|lower; }||echo ""; }
lang_of_ext(){ case "${1:-}" in js)echo javascript;;ts)echo typescript;;jsx)echo jsx;;tsx)echo tsx;;sh|bash)echo bash;;zsh)echo zsh;;py)echo python;;rb)echo ruby;;php)echo php;;java)echo java;;c|h)echo c;;cc|cxx|cpp|hpp|hh|hxx)echo cpp;;m)echo objectivec;;mm)echo objectivecpp;;swift)echo swift;;kt|kts)echo kotlin;;go)echo go;;rs)echo rust;;cs)echo csharp;;scala)echo scala;;sql)echo sql;;yaml|yml)echo yaml;;json)echo json;;html|htm)echo html;;css)echo css;;md|markdown)echo markdown;;toml)echo toml;;makefile)echo makefile;;dockerfile)echo dockerfile;;txt|"")echo "";;*)echo "$1";; esac; }
repeat_ticks(){ local n="$1" i out=""; for i in $(seq 1 "$n"); do out="${out}\`"; done; printf '%s' "$out"; }
max_backticks_in_file_plus1(){ awk '{line=$0;cnt=0;for(i=1;i<=length(line);i++){ch=substr(line,i,1);if(ch=="`"){cnt++}else{if(cnt>max){max=cnt};cnt=0}}if(cnt>max){max=cnt}} END{m=max+1;if(m<3)m=3;print m}' "$1"; }
safe_fence_for_file(){ local n; n="$(max_backticks_in_file_plus1 "$1")"; repeat_ticks "$n"; }
wc_bytes(){ wc -c < "$1" | tr -d '[:space:]'; }
wc_lines(){ wc -l < "$1" | tr -d '[:space:]'; }
relpath(){ local p="$1" pwdp; pwdp="$(pwd -P)"; case "$p" in "$OUT")echo "$OUT";; /*) [[ "$p" == "$pwdp/"* ]]&&printf '%s\n' "${p#"$pwdp"/}" || printf '%s\n' "$p";; ./*) printf '%s\n' "${p#./}";; *) printf '%s\n' "$p";; esac; }

# --- Collect inputs ----------------------------------------------------------
declare -a PATHS=() BASES=() SLUGS=() SIZES=() LINES=() RELS=()
total_bytes=0

for p in "$@"; do
  base="$(basename -- "$p" 2>/dev/null || true)"
  [[ "$base" == "$OUT" ]] && { printf 'warning: skipping output file "%s"\n' "$p" >&2; continue; }
  if [[ -f "$p" ]]; then
    PATHS+=("$p"); BASES+=("$base"); SLUGS+=("$(slugify "$base")"); RELS+=("$(relpath "$p")")
    b=$(wc_bytes "$p"); l=$(wc_lines "$p"); SIZES+=("$b"); LINES+=("$l"); total_bytes=$((total_bytes+b))
  else
    printf 'warning: not a regular file: %s\n' "$p" >&2
  fi
done

[[ ${#PATHS[@]} -eq 0 ]] && { echo "No valid files to process." >&2; exit 3; }

files_count="${#PATHS[@]}"
est_tokens=$(( (total_bytes + 3) / 4 ))

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
      printf '%s%s\n' "$fence" "$lang"
    else
      printf '%s\n' "$fence"
    fi

    if (( HEAD>0 || TAIL>0 )); then
      if (( total_l > HEAD + TAIL && HEAD>0 && TAIL>0 )); then
        sed -n "1,${HEAD}p" -- "$p"
        printf '\n... [truncated %d lines]\n\n' "$(( total_l - HEAD - TAIL ))"
        tail -n "$TAIL" -- "$p"
      else
        cat -- "$p"
      fi
    else
      cat -- "$p"
    fi

    printf '\n%s\n\n' "$fence"
  } >> "$TMP"
done

printf '<!-- END OF SNAPSHOT -->\n' >> "$TMP"

# --- Finalize ----------------------------------------------------------------
mv "$TMP" "$OUT"
trap - EXIT