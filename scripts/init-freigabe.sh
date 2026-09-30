#!/usr/bin/env bash
# init-freigabe.sh: legt ein neues Projekt im Freigabe-Modus (/freigabe) an.
# Wie init-project.sh, aber mit erweitertem state.json: gates{} + deploy_mode + mode.
#
# Usage: init-freigabe.sh <projektname> [deploy_mode: manual|auto]
# Erstellt ~/projects/<name>/, klont Template, git init, erweitertes state.json,
# intake/-Ordner. Idempotent-ish (Resume-fest).
set -euo pipefail
export MSYS_NO_PATHCONV=1

NAME="${1:?Projektname fehlt}"
DEPLOY_MODE="${2:-manual}"
case "$DEPLOY_MODE" in manual|auto) ;; *) echo "deploy_mode muss manual|auto sein" >&2; exit 2;; esac

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$HARNESS_DIR/templates/astro-static-base"
DEST="${PROJECTS_DIR:-$HOME/projects}/$NAME"

if [ -d "$DEST" ]; then
  echo "WARN: $DEST existiert bereits, Resume, ueberspringe Klonen." >&2
else
  mkdir -p "$DEST"
  cp -r "$TEMPLATE/." "$DEST/"
  echo "Template geklont nach $DEST"
fi

cd "$DEST"
mkdir -p intake content-drafts design-system gates

# Briefing-Platzhalter (wird spaeter von /freigabe-briefing aus den Formular-Antworten erzeugt)
[ -f briefing.md ] || printf "# Briefing, %s\n\n(wird aus den Fragebogen-Antworten erzeugt: /freigabe-briefing %s)\n" "$NAME" "$NAME" > briefing.md

# Erweitertes state.json (nur anlegen, wenn nicht vorhanden: Resume-fest)
STARTED="$(date -u +%FT%TZ)"
if [ ! -f state.json ]; then
  cat > state.json <<EOF
{
  "name": "$NAME",
  "mode": "freigabe",
  "briefing_path": "briefing.md",
  "current_iter": 1,
  "history": [],
  "last_gaps": [],
  "started_at": "$STARTED",
  "deploy_mode": "$DEPLOY_MODE",
  "gates": { "briefing": "pending", "design": "pending", "deploy": "pending" }
}
EOF
fi

# Projekt-lokale Hooks (per absolutem Pfad auf den Harness), KEIN bypassPermissions hier.
mkdir -p .claude
if [ ! -f .claude/settings.json ]; then
  cat > .claude/settings.json <<EOF
{
  "\$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{"type": "command", "command": "bash $HARNESS_DIR/scripts/hooks/pre-bash-guard.sh"}] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write|MultiEdit", "hooks": [{"type": "command", "command": "bash $HARNESS_DIR/scripts/hooks/post-edit-format.sh"}] }
    ],
    "Stop": [
      { "hooks": [{"type": "command", "command": "bash $HARNESS_DIR/scripts/hooks/stop-trajectory.sh"}] }
    ]
  }
}
EOF
fi

if [ ! -d .git ]; then
  git init -q -b main 2>/dev/null || { git init -q; git branch -m main 2>/dev/null || true; }
  git add -A
  git commit -q -m "init: freigabe-projekt $NAME (deploy_mode=$DEPLOY_MODE)"
fi
git rev-parse --verify iter-001 >/dev/null 2>&1 || git checkout -q -b iter-001

echo "OK: Projekt '$NAME' (Freigabe-Modus) bereit unter $DEST (branch $(git rev-parse --abbrev-ref HEAD), deploy_mode=$DEPLOY_MODE)"
