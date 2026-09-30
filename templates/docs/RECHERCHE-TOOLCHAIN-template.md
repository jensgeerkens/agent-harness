# Recherche & Toolchain: <Projektname>

> Konsolidiert die vier Researcher-Briefs (`research/iter-N/*.md`) und die verifizierten
> Tech-Entscheidungen. Quelle der Wahrheit für den code-writer.

## Design (researcher-design)
- **Referenzen:** <…>
- **Pattern-Empfehlungen:** Farbsystem, Typo-Skala, Hero-Konzept, Sektions-Reihenfolge
- **Aktionen:** <Liste>

## Branche/Content (researcher-industry)
- **Leistungs-/Produktkatalog:** <…>
- **Tonalität & Trust-Hebel:** <…>
- **FAQ & SEO-Keywords:** <…>

## Recht/DSGVO (researcher-legal-dsgvo)
- **Impressum-Pflichtfelder:** <…>
- **Datenschutz-Variante:** statisch, keine externen Dienste
- **Besonderheiten reglementierter Berufe:** <…>

## Tech-Stack (researcher-tech-stack, via context7)
- **Astro 6:** <verifizierte Punkte>
- **Tailwind v4:** CSS-first `@theme`, `@tailwindcss/vite`
- **Cloudflare Pages Deploy (non-interactive):**
  ```bash
  export MSYS_NO_PATHCONV=1
  npx wrangler pages project create "<name>" --production-branch=main 2>/dev/null || true
  npx wrangler pages deploy ./dist --project-name="<name>" --branch=main --commit-dirty=true
  ```
- **Fontsource:** `@import '@fontsource-variable/<font>'` in `global.css`

## Pin-Hinweis (wichtig)
- `astro` exakt `6.3.6`, `@tailwindcss/vite`/`tailwindcss` exakt `4.3.0` halten
  (neuere Astro-Patch-Releases ziehen rolldown-vite/vite 8 → `@tailwindcss/vite`-Bruch
  `Missing field tsconfigPaths`). `package-lock.json` aus dem Template nicht verwerfen.

## Toolchain-Status (Healthcheck)
- Node, npm, git, wrangler-Login, MCPs (chrome-devtools/playwright/context7): siehe Harness-`README.md` (Voraussetzungen)
