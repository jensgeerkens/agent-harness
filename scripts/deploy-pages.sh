#!/usr/bin/env bash
# deploy-pages.sh: Build + Cloudflare PAGES Deploy (non-interactive). NIE Workers.
# Usage (im Projekt-Root): deploy-pages.sh <projektname>
# Gibt die Live-URL (https://<name>.pages.dev) auf stdout aus.
set -euo pipefail
export MSYS_NO_PATHCONV=1

NAME="${1:?Projektname fehlt}"
# Pages-Projektnamen: a-z 0-9 - (slugify)
NAME=$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9-]+/-/g; s/^-+|-+$//g')

echo ">> Build…"
npm run build

echo ">> Pages-Projekt sicherstellen ($NAME)…"
npx wrangler pages project create "$NAME" --production-branch=main 2>/dev/null || true

echo ">> Deploy…"
DEPLOY_OUT=$(npx wrangler pages deploy ./dist --project-name="$NAME" --branch=main --commit-dirty=true 2>&1)
echo "$DEPLOY_OUT"

# Produktions-URL ist immer https://<name>.pages.dev (die geparsten URLs aus der Ausgabe
# sind deployment-spezifische Aliasse wie https://<hash>.<name>.pages.dev).
PROD_URL="https://$NAME.pages.dev"
ALIAS_URL=$(echo "$DEPLOY_OUT" | grep -oE 'https://[a-z0-9]+\.'"$NAME"'\.pages\.dev' | tail -1 || true)

echo ">> Smoke-Test $PROD_URL"
sleep 3  # kurze Propagation
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "$PROD_URL")
echo "HTTP ${CODE:-000}"

echo "LIVE_URL=$PROD_URL"
[ -n "$ALIAS_URL" ] && echo "ALIAS_URL=$ALIAS_URL"
