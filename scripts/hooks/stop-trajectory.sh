#!/usr/bin/env bash
# stop-trajectory.sh: Stop-Hook
# Persistiert das Session-Transcript als Trajectory-Log. Goldmine für:
#   - Debugging fehlgeschlagener Iterationen
#   - Eval-Improvement (welche Tool-Calls korrelieren mit hohen Scores?)
#   - Episodic Memory (v0.4: wir bereiten den Boden vor)
#
# Aufruf: stdin = JSON wie:
#   { "session_id":"…", "transcript_path":"…", "stop_hook_active":bool }
#
# Strategie:
#   - Wenn der CWD ein Harness-Projekt ist (~/projects/<name>/state.json existiert)
#     → kopiere nach <project>/errors/iter-N.trajectory.jsonl
#   - Sonst → kopiere nach <harness>/.harness-state/trajectories/<timestamp>-<sessionId>.jsonl
#
# Exit-Code: 0 (Stop-Hooks dürfen nie blockieren: sonst hängt die Session)

set -uo pipefail

# Harness-Wurzel: explizit per HARNESS_DIR, sonst relativ zu diesem Skript (scripts/hooks/..).
HARNESS_ROOT="${HARNESS_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

INPUT="$(cat 2>/dev/null || echo '{}')"

if command -v jq >/dev/null 2>&1; then
  TRANSCRIPT="$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null || echo '')"
  SID="$(printf '%s' "$INPUT" | jq -r '.session_id // empty' 2>/dev/null || echo 'unknown')"
else
  TRANSCRIPT="$(printf '%s' "$INPUT" | grep -oE '"transcript_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"transcript_path"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"
  SID="$(printf '%s' "$INPUT" | grep -oE '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"session_id"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"
  [ -z "$SID" ] && SID="unknown"
fi

# Wenn kein Transcript → nur Stop-Marker schreiben, kein Abbruch
TS="$(date -u +%Y%m%dT%H%M%SZ)"

# Versuch 1: Projekt-CWD finden (state.json als Marker)
PROJECT_ROOT=""
DIR="$PWD"
for _ in 1 2 3 4 5; do
  if [ -f "$DIR/state.json" ] && [ -d "$DIR/.git" ]; then
    PROJECT_ROOT="$DIR"; break
  fi
  PARENT="$(dirname "$DIR")"
  [ "$PARENT" = "$DIR" ] && break
  DIR="$PARENT"
done

if [ -n "$PROJECT_ROOT" ]; then
  # Iter ableiten aus state.json (best effort)
  ITER="$(grep -oE '"current_iter"[[:space:]]*:[[:space:]]*[0-9]+' "$PROJECT_ROOT/state.json" 2>/dev/null | head -1 | grep -oE '[0-9]+$' || echo '0')"
  DEST_DIR="$PROJECT_ROOT/errors"
  mkdir -p "$DEST_DIR"
  DEST="$DEST_DIR/iter-$(printf '%03d' "$ITER").trajectory.${TS}.jsonl"
else
  DEST_DIR="$HARNESS_ROOT/.harness-state/trajectories"
  mkdir -p "$DEST_DIR"
  DEST="$DEST_DIR/${TS}-${SID:0:12}.jsonl"
fi

if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  cp -f "$TRANSCRIPT" "$DEST" 2>/dev/null || true
  # Minimalen Index-Eintrag schreiben (für späteres episodic-memory-Mining)
  IDX="$HARNESS_ROOT/.harness-state/trajectories/INDEX.tsv"
  mkdir -p "$(dirname "$IDX")"
  [ -f "$IDX" ] || printf 'timestamp\tsession_id\tproject_root\tdest\n' > "$IDX"
  printf '%s\t%s\t%s\t%s\n' "$TS" "$SID" "${PROJECT_ROOT:-}" "$DEST" >> "$IDX"
fi

exit 0
