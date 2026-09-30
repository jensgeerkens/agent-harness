#!/usr/bin/env bash
# healthcheck.sh: prüft Voraussetzungen für den Harness.
# Node ≥20, npm, git, wrangler-Login, MCPs (chrome-devtools/playwright/context7).
# Exit 0 wenn alle harten Voraussetzungen erfüllt, sonst 1 (mit Liste).
set -uo pipefail
export MSYS_NO_PATHCONV=1

FAIL=0
ok()   { echo "  ✅ $1"; }
warn() { echo "  ⚠️  $1"; }
bad()  { echo "  ❌ $1"; FAIL=1; }

echo "== Node/npm/git =="
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
[ "$NODE_MAJOR" -ge 20 ] && ok "Node $(node -v)" || bad "Node ≥20 nötig (ist: $(node -v 2>/dev/null || echo fehlt))"
command -v npm >/dev/null && ok "npm $(npm -v)" || bad "npm fehlt"
command -v git >/dev/null && ok "git $(git --version | awk '{print $3}')" || bad "git fehlt"

echo "== wrangler =="
if npx wrangler whoami 2>/dev/null | grep -qi 'logged in\|associated with'; then
  ok "wrangler login aktiv"
else
  warn "wrangler nicht eingeloggt, Deploy/Live-URL nicht möglich (Build/Loop laufen trotzdem)"
fi

echo "== MCP-Server =="
MCP_OUT=$(claude mcp list 2>/dev/null || echo "")
for m in chrome-devtools playwright context7; do
  if echo "$MCP_OUT" | grep -qi "$m" && echo "$MCP_OUT" | grep -i "$m" | grep -qi 'connected\|✓'; then
    ok "MCP $m connected"
  else
    warn "MCP $m nicht verbunden, Evaluator-Dimensionen (Lighthouse/Visual/a11y) eingeschränkt"
  fi
done

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "HEALTHCHECK: OK (harte Voraussetzungen erfüllt)"
else
  echo "HEALTHCHECK: FAIL (siehe ❌ oben)"
fi
exit $FAIL
