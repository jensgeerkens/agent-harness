#!/usr/bin/env bash
# sync-global.sh: spiegelt die Harness-Agents + -Skills nach ~/.claude/,
# damit /goal & Co. aus JEDER Session (beliebiges CWD) verfügbar sind.
#
# Quelle der Wahrheit bleibt <harness>/.claude/: nach Änderungen dort
# einfach dieses Script erneut laufen lassen. NICHT settings.json spiegeln
# (bypassPermissions darf nicht global werden: das entsichert die ganze Umgebung).
#
# Symlinks gehen in Git-Bash ohne Developer-Mode nicht → wir kopieren.
set -euo pipefail

SRC="${HARNESS_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}/.claude"
DST="$HOME/.claude"

mkdir -p "$DST/agents" "$DST/skills"

echo "→ Agents spiegeln ($SRC/agents → $DST/agents)"
cp -f "$SRC/agents/"*.md "$DST/agents/"
ls -1 "$SRC/agents/" | sed 's/^/   • /'

echo "→ Skills spiegeln ($SRC/skills → $DST/skills)"
cp -rf "$SRC/skills/"* "$DST/skills/"
ls -1 "$SRC/skills/" | sed 's/^/   • /'

echo
echo "✓ Sync fertig. $(ls -1 "$SRC/agents/"*.md | wc -l | tr -d ' ') Agents, $(ls -1d "$SRC/skills/"*/ | wc -l | tr -d ' ') Skills global verfügbar."
echo "  Hinweis: neue Agents/Skills sind erst nach Claude-Code-Neustart aufrufbar (Registry lädt beim Start)."
echo "  settings.json wurde bewusst NICHT gespiegelt (bypassPermissions bleibt projekt-lokal)."
