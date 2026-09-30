#!/usr/bin/env bash
# pre-bash-guard.sh: PreToolUse-Hook für Bash
# Blockt destruktive/gefährliche Commands BEVOR sie laufen.
# Ergänzt bypassPermissions um eine harte Enforcement-Ebene.
#
# Aufruf: Claude Code reicht JSON via stdin durch:
#   { "session_id":"…", "tool_name":"Bash", "tool_input":{"command":"…", …} }
#
# Exit-Codes:
#   0  → ok, Tool läuft
#   2  → BLOCK, stderr wird ans Modell zurückgegeben (Modell sieht den Grund)
#   1  → non-blocking Warning (geht NICHT ans Modell: vermeiden für Sicherheit)
#
# Known limitation: Variable-Expansion vor Ausführung wird NICHT interpretiert.
#   `P=/opt; rm -rf $P` kommt durch: wir checken statisch.
#   Das ist akzeptabel: ein bewusst verschleierndes Modell ist Out-of-Scope.

set -euo pipefail

INPUT="$(cat 2>/dev/null || echo '{}')"

if command -v jq >/dev/null 2>&1; then
  CMD="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || echo '')"
else
  CMD="$(printf '%s' "$INPUT" | grep -oE '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*"command"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"
fi

[ -z "$CMD" ] && exit 0

block() {
  echo "BLOCKED by pre-bash-guard: $1" >&2
  echo "  Command war: $CMD" >&2
  echo "  Wenn das wirklich gewollt ist, ändere ~/agent-harness/scripts/hooks/pre-bash-guard.sh." >&2
  exit 2
}

# Helper: prüft ob Substring im Command ODER innerhalb von eval/bash -c-Quotes vorkommt.
# Wir extrahieren erst alle inner-quoted Strings und mergen sie mit dem Outer-Command,
# damit `eval "rm -rf /opt"` und `bash -c 'rm -rf /opt'` auch gegriffen werden.
EFFECTIVE="$CMD"
# Inner-Quoted Strings UND command-substitution-Inhalte extrahieren und anhängen,
# damit `eval "rm -rf /opt"`, `bash -c "..."`, `$(rm -rf /opt)`, `` `rm -rf /opt` ``
# alle erkannt werden.
while IFS= read -r line; do
  EFFECTIVE="$EFFECTIVE  $line"
done < <(printf '%s\n' "$CMD" | grep -oE '"[^"]*"|'"'"'[^'"'"']*'"'"'|\$\([^)]*\)|`[^`]*`' 2>/dev/null \
  | sed -E 's/^["'"'"'`]//; s/["'"'"'`]$//; s/^\$\(//; s/\)$//')

# Anker für "Command-Beginn": space, ;, &, |, (, $, `, newline, start-of-string
ANCHOR='(^|[[:space:];&|(\$\`])'
ANCHOR_END='([[:space:]]|$)'

# Helper-Funktionen: statt monolithisches Regex, mehrere klare Checks
has() { echo "$EFFECTIVE" | grep -qE "$1"; }

# --- Hard-Blocks ---

# 1) rm: Befehl + (irgendwo) Flag -r + -f + (irgendwo) gefährlicher Pfad
#    Robust gegen Reihenfolge: `rm -rf /opt`, `rm /opt -rf`, `rm -r -f /opt`
#    Achtung: \b matcht nicht vor `-` (beide non-word). Daher (^|[[:space:]]) als Anker.
RM_FLAGS='(^|[[:space:]])-([a-zA-Z]*rf[a-zA-Z]*|[a-zA-Z]*fr[a-zA-Z]*|r[[:space:]]+-f|f[[:space:]]+-r)([[:space:]]|$)'
DANGER_PATH='(^|[[:space:]])(/(etc|opt|usr|bin|var|home|Users|root|sys|boot|lib)([/[:space:]]|$)|/[[:space:]]|/\*|~/|~$|\$HOME|\$\{HOME\}|C:/|c:/|/c/[Uu]sers([/[:space:]]|$)|/[A-Za-z]:/)'

if has "${ANCHOR}rm${ANCHOR_END}" && has "$RM_FLAGS"; then
  if has "$DANGER_PATH"; then
    block "rm -r -f auf System-/Home-Pfad"
  fi
fi

# 2) Fork-Bomb
if has ':\(\)[[:space:]]*\{[[:space:]]*:\|:&[[:space:]]*\};:'; then
  block "Fork-Bomb-Pattern"
fi

# 3) curl|sh / wget|sh: Remote-Code-Execution ohne Audit
if has '(curl|wget)[[:space:]]+[^|]*\|[[:space:]]*(sh|bash|zsh|ksh|dash)\b'; then
  block "Pipe von Remote-Download in Shell, keine Audit-Spur"
fi

# 4) Git Force-Push auf main/master: alle Varianten:
#    --force, -f, --force-with-lease, +refspec (Plus-Push = force)
if has 'git[[:space:]]+push'; then
  HAS_MAIN='(^|[[:space:]/+])(main|master)([[:space:]/]|$)'
  HAS_FORCE='(--force([[:space:]]|=|$)|--force-with-lease|(^|[[:space:]])-f([[:space:]]|$))'
  if has "$HAS_FORCE" && has "$HAS_MAIN"; then
    block "git push --force/--force-with-lease auf main/master"
  fi
  if has 'git[[:space:]]+push.*[[:space:]]\+(main|master)([[:space:]/]|$)'; then
    block "git push +refspec auf main/master (Plus-Refspec = Force)"
  fi
fi

# 5) Globaler npm/pip-Install
if has '\bnpm[[:space:]]+install[[:space:]]+(-g\b|--global\b)'; then
  block "npm install -g, bitte pro-Projekt nutzen"
fi
if has '\bpip[[:space:]]+install\b'; then
  if ! has '(--user\b|--break-system-packages\b|venv|\.venv|virtualenv|pipx)'; then
    block "pip install ohne venv/--user, bitte in venv installieren"
  fi
fi

# 6) Schreiben in System-Configs
if has '>[[:space:]]*/(etc|usr|bin|var|sys|boot)/'; then
  block "Redirect in System-Config-Pfad"
fi

# 7) chmod 777 auf System
if has '\bchmod[[:space:]]+(-R[[:space:]]+)?7?77[[:space:]]+(/|/etc|/opt|/usr|/var|/home|~|C:/|/c/)'; then
  block "chmod 777 auf System-Pfad"
fi

# 8) PowerShell: Remove-Item & Aliase mit -Recurse -Force auf System-/Home-Pfad.
#    Der Hook wird global auch für das PowerShell-Tool registriert (matcher Bash|PowerShell);
#    PS ist case-insensitive, daher eigener hasi-Helper.
hasi() { echo "$EFFECTIVE" | grep -qiE "$1"; }

PS_RM_CMD='(^|[[:space:];&|(])(remove-item|rm|ri|del|erase|rmdir|rd)([[:space:]]|$)'
PS_RECURSE='(^|[[:space:]])-(recurse|r)([[:space:]]|$)'
PS_FORCE='(^|[[:space:]])-(force|f|fo)([[:space:]]|$)'
# Windows-Pfade: Laufwerk mit Backslash (C:\...), UNC (\\server), $env:USERPROFILE/$HOME
WIN_DANGER_PATH='(^|[[:space:]])([a-z]:\\|\\\\|\$env:(userprofile|home|systemroot|programfiles[^[:space:]]*)|\$home)'

if hasi "$PS_RM_CMD" && hasi "$PS_RECURSE" && hasi "$PS_FORCE"; then
  if has "$DANGER_PATH" || hasi "$WIN_DANGER_PATH"; then
    block "Remove-Item/-Recurse -Force auf System-/Home-Pfad (PowerShell)"
  fi
fi

exit 0
