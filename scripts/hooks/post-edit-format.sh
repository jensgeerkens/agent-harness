#!/usr/bin/env bash
# post-edit-format.sh: PostToolUse-Hook für Edit/Write
# Formatiert TS/TSX/Astro/JS/JSON/CSS nach jeder Edit, wenn Prettier verfügbar.
# Spart Code-Writer-Prompts (formatieren ist deterministisch: gehört nicht in den LLM-Context).
#
# Aufruf: stdin = JSON wie:
#   { "tool_name":"Edit", "tool_input":{"file_path":"…"}, "tool_response":{…} }
#
# Exit-Code:
#   0  → ok (immer; Format-Fehler sind kein Showstopper)

set -uo pipefail   # KEIN -e: wir wollen niemals den Code-Writer blockieren wegen Format

INPUT="$(cat 2>/dev/null || echo '{}')"

if command -v jq >/dev/null 2>&1; then
  FILE="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo '')"
else
  FILE="$(printf '%s' "$INPUT" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"file_path"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"
fi

[ -z "$FILE" ] && exit 0
[ ! -f "$FILE" ] && exit 0

# Nur formatierbare Endungen
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.astro|*.json|*.jsonc|*.css|*.scss|*.html|*.md) ;;
  *) exit 0 ;;
esac

# Nur in Projekt-Workspaces formatieren (vermeidet Hook-Loops in System-Dirs)
case "$FILE" in
  */projects/*|*/agent-harness/*) ;;
  *) exit 0 ;;
esac

# Working-Dir ableiten: wir formatieren mit dem Projekt-eigenen prettier wenn vorhanden
DIR="$(dirname "$FILE")"

# Walk up bis package.json oder bis 5 Ebenen
ROOT=""
for _ in 1 2 3 4 5; do
  if [ -f "$DIR/package.json" ]; then ROOT="$DIR"; break; fi
  PARENT="$(dirname "$DIR")"
  [ "$PARENT" = "$DIR" ] && break
  DIR="$PARENT"
done

if [ -z "$ROOT" ]; then
  # Kein Node-Projekt → silently skip
  exit 0
fi

# Prettier nur wenn es im Projekt installiert ist (verhindert globalen npx-Download)
if [ -x "$ROOT/node_modules/.bin/prettier" ]; then
  ( cd "$ROOT" && ./node_modules/.bin/prettier --write --log-level=warn "$FILE" ) >/dev/null 2>&1 || true
elif [ -x "$ROOT/node_modules/.bin/prettier.cmd" ]; then
  ( cd "$ROOT" && ./node_modules/.bin/prettier.cmd --write --log-level=warn "$FILE" ) >/dev/null 2>&1 || true
fi

exit 0
