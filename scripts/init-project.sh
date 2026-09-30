#!/usr/bin/env bash
# init-project.sh: legt ein neues Zielprojekt aus dem Template an.
# Usage: init-project.sh <projektname> [briefing-pfad]
# Erstellt ~/projects/<name>/, klont Template, git init, state.json. Idempotent-ish.
set -euo pipefail
export MSYS_NO_PATHCONV=1

NAME="${1:?Projektname fehlt}"
BRIEFING_SRC="${2:-}"
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$HARNESS_DIR/templates/astro-static-base"
DEST="${PROJECTS_DIR:-$HOME/projects}/$NAME"

if [ -d "$DEST" ]; then
  echo "WARN: $DEST existiert bereits, nehme an, Resume. Überspringe Klonen." >&2
else
  mkdir -p "$DEST"
  cp -r "$TEMPLATE/." "$DEST/"
  echo "Template geklont nach $DEST"
fi

cd "$DEST"

# Briefing übernehmen
if [ -n "$BRIEFING_SRC" ] && [ -f "$BRIEFING_SRC" ]; then
  cp "$BRIEFING_SRC" "$DEST/briefing.md"
elif [ ! -f "$DEST/briefing.md" ]; then
  printf "# Briefing, %s\n\n(Briefing-Text hier)\n" "$NAME" > "$DEST/briefing.md"
fi

# state.json (VOR git init, damit es mit-committed wird)
STARTED="$(date -u +%FT%TZ)"
if [ ! -f state.json ]; then
  cat > state.json <<EOF
{
  "name": "$NAME",
  "briefing_path": "briefing.md",
  "current_iter": 1,
  "history": [],
  "last_gaps": [],
  "started_at": "$STARTED"
}
EOF
fi

# Projekt-lokale .claude/settings.json mit Hooks, die per ABSOLUTEM Pfad auf den
# Harness verweisen. So greifen die Hooks auch wenn Claude direkt aus dem Projekt-
# Dir gestartet wird (`cd ~/projects/<name> && claude`).
# Bewusst KEIN bypassPermissions hier: das bleibt Harness-only. Nur Hooks.
mkdir -p .claude
if [ ! -f .claude/settings.json ]; then
  cat > .claude/settings.json <<EOF
{
  "\$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{"type": "command", "command": "bash $HARNESS_DIR/scripts/hooks/pre-bash-guard.sh"}]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{"type": "command", "command": "bash $HARNESS_DIR/scripts/hooks/post-edit-format.sh"}]
      }
    ],
    "Stop": [
      {
        "hooks": [{"type": "command", "command": "bash $HARNESS_DIR/scripts/hooks/stop-trajectory.sh"}]
      }
    ]
  }
}
EOF
fi

# Git initialisieren (Default-Branch explizit main, damit Merge-Target konsistent ist)
# Erst jetzt: damit state.json + .claude/settings.json mit-committed werden.
if [ ! -d .git ]; then
  git init -q -b main 2>/dev/null || { git init -q; git branch -m main 2>/dev/null || true; }
  git add -A
  git commit -q -m "init: template astro-static-base + state.json + harness-hooks"
fi
# Iter-001-Branch
git rev-parse --verify iter-001 >/dev/null 2>&1 || git checkout -q -b iter-001

echo "OK: Projekt '$NAME' bereit unter $DEST (branch $(git rev-parse --abbrev-ref HEAD))"
