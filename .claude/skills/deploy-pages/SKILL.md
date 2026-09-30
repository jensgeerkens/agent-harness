---
name: deploy-pages
description: Deployt den aktuellen dist/-Build auf Cloudflare Pages (non-interactive). Erzeugt/aktualisiert ein Pages-Projekt und liefert die *.pages.dev Live-URL. Nie Cloudflare Workers.
disable-model-invocation: true
permissionMode: bypassPermissions
---

# /deploy-pages: Cloudflare Pages Deploy (non-interactive)

Deployt `dist/` des aktuellen Projekts auf **Cloudflare Pages** und liefert die Live-URL
`https://<projektname>.pages.dev`. **Nie Workers.** Voraussetzung: `wrangler whoami` ist eingeloggt.

## Schritte

1. **Projektname** = `name` aus `state.json` (Pages-Projektnamen sind a–z, 0–9, `-`; ggf. erneut slugifyen).
2. **Build sicherstellen:** `npm run build` (Exit 0, `dist/` muss existieren).
3. **Projekt idempotent anlegen** (non-interactive, schlägt nicht fehl wenn schon vorhanden):
   ```bash
   export MSYS_NO_PATHCONV=1
   npx wrangler pages project create "<name>" --production-branch=main 2>/dev/null || true
   ```
4. **Deployen** (non-interactive, Produktions-Deploy → liefert `<name>.pages.dev`):
   ```bash
   export MSYS_NO_PATHCONV=1
   npx wrangler pages deploy ./dist --project-name="<name>" --branch=main --commit-dirty=true
   ```
5. **Live-URL extrahieren** aus der wrangler-Ausgabe (Zeile mit `https://...pages.dev`).
   Diese URL geht in `state.json` (`live_url`) und in den Final-Report.
6. **Smoke-Test:** kurz die Live-URL per WebFetch/curl prüfen (HTTP 200), Ergebnis loggen.

## Verifizierte Flags (context7, Cloudflare Pages Docs)
- `wrangler pages deploy <dir> --project-name=<name>`: Direct-Upload, non-interactive.
- `--branch=main` → Produktions-Deploy (sonst Preview-URL).
- `--commit-dirty=true` → unterdrückt den „uncommitted changes"-Prompt.
- `wrangler pages project create <name> --production-branch=<b>` → legt Projekt non-interactive an.
- Optional `CLOUDFLARE_ACCOUNT_ID=<id>` als Env, falls mehrere Accounts.

## Regeln
- **Cloudflare Pages**, nie `wrangler deploy` (= Workers).
- Windows/Git-Bash: `MSYS_NO_PATHCONV=1` vor wrangler-Aufrufen mit `./`-Pfaden.
- Keine interaktiven Prompts, alle nötigen Flags mitgeben.
- Bei Deploy-Fehler: in `errors/` loggen, im Final-Report als Blockade vermerken, **nicht** fragen.
