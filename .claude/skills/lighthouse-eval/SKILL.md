---
name: lighthouse-eval
description: Performance-Mess- und Optimierungs-Pattern für statische Astro-Sites, Lighthouse via chrome-devtools-MCP, Core Web Vitals (LCP/CLS/INP), Bild-/Font-Optimierung. Lade bei performance-Gaps oder Evaluation.
---

# Lighthouse / Core Web Vitals: Mess- & Optimierungs-Pattern

## Messung (Evaluator)

1. Build + Preview: `npm run build && npx astro preview --port 4321 &` → `sleep 3`.
2. chrome-devtools-MCP:
   - `new_page` / `navigate_page` auf `http://localhost:4321`.
   - `lighthouse_audit` (Kategorien: performance, seo, accessibility, best-practices):
     falls verfügbar; sonst `performance_start_trace` → navigieren → `performance_stop_trace`
     und LCP/CLS/INP aus dem Trace lesen.
3. Mobil **und** Desktop messen (Mobile ist die strengere Bewertung).

## Score-Mapping (Dimension Performance, Gewicht 0.15)

| Metrik | Schwellen |
|---|---|
| **LCP** | < 2.0s = 10 · < 2.5s = 8 · < 4s = 5 · ≥ 4s = 0 |
| **CLS** | < 0.1 Pflicht (sonst −2 auf die Dim) |
| **INP** | < 200ms Pflicht |
| Gesamt-Heuristik | LCP-Score, dann CLS/INP als Malus |

## Optimierungs-Hebel (statische Astro-Site)

- **Bilder:** Astro `<Image />` / `astro:assets`, moderne Formate (AVIF/WebP), `width`/`height`
  gesetzt (CLS!), `loading="lazy"` außer Hero, Hero ggf. `fetchpriority="high"`.
- **Fonts:** Fontsource self-hosted, `font-display: swap`, nur benötigte Achsen/Subsets.
  Variable Font sparsam. `font-synthesis-weight: none`.
- **CSS:** Tailwind v4 purged automatisch. Kein ungenutztes CSS, kein Render-Blocking-3rd-Party.
- **JS:** Astro liefert 0 JS by default, Insel-Skripte nur wo nötig (`<script>`), klein halten.
- **CLS:** feste Dimensionen für Bilder/Embeds, kein Layout-Shift durch spät ladende Fonts/Badges.
- **Preconnect/Preload** nur für wirklich kritische Ressourcen (bei self-hosted meist unnötig).

## Typische Gaps → Action
| Befund | Action für code-writer |
|---|---|
| LCP > 2.5s, Hero-Bild groß | Hero als `astro:assets` `<Image>`, AVIF, `fetchpriority="high"`, Größe begrenzen |
| CLS > 0.1 | width/height an allen Bildern, Font-Swap, reservierter Platz für dynamische Badges |
| Unused CSS | nichts manuell, Tailwind v4 purged; ggf. Custom-CSS prüfen |
| Render-blocking 3rd-party | externe Skripte entfernen/defer (DSGVO ohnehin) |

Ziel für 9.0+: **LCP < 2.0s, CLS < 0.1, INP < 200ms** auf Mobile.
