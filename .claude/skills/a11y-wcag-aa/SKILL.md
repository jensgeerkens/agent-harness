---
name: a11y-wcag-aa
description: Accessibility-Pattern nach WCAG 2.1 AA für statische Sites, Semantik, Kontrast, Fokus, Tastatur, Tap-Targets, ARIA. Lade bei A11y-Arbeit oder accessibility-Gaps.
---

# Accessibility: WCAG 2.1 AA

Ziel: **0 axe-Violations**. A11y ist auch SEO + Conversion (größere Tap-Targets konvertieren besser).

## Semantik & Struktur
- Eine `<h1>` pro Seite, dann lückenlose Hierarchie (`h2` → `h3`, kein Sprung).
- Landmarks: `<header>`, `<nav aria-label="...">`, `<main id="main">`, `<footer>`.
- **Skip-Link** als erstes fokussierbares Element:
  ```html
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-white">Zum Inhalt springen</a>
  ```
- Listen als `<ul>/<ol>`, nicht als `<div>`-Reihen.

## Kontrast (AA)
- Normaltext ≥ **4.5:1**, Großtext (≥ 24px / 19px bold) ≥ **3:1**, UI-/Grafik-Grenzen ≥ 3:1.
- Häufiger Gap: graue Footer-Links auf dunklem BG. Heller Text auf dunkler Sektion ≥ 4.5:1.
- Akzent-CTA: weiße Schrift auf gesättigtem Akzent prüfen (oft grenzwertig bei Gelb/Hellblau).

## Fokus & Tastatur
- Sichtbarer Fokus-Ring (`:focus-visible { outline:2px solid <accent>; outline-offset:2px; }`).
- Alles per Tab erreichbar, logische Reihenfolge, kein Fokus-Trap.
- Mobile-Menü: `aria-expanded` am Toggle pflegen, ESC schließt, Fokus-Management.

## Tap-Targets & Motion
- Interaktive Targets ≥ **44×44px** (Conversion + WCAG 2.5.5).
- `@media (prefers-reduced-motion: reduce)` respektieren (Animationen aus/minimal).

## Bilder & Icons
- Inhaltsbilder: aussagekräftiges `alt`. Dekorative: `alt=""` bzw. `aria-hidden="true"`.
- Icon-Only-Buttons/-Links: `aria-label` (z.B. „Jetzt anrufen"). Dekorative Icons `aria-hidden`.

## Formulare (Kontakt/Termin)
- Jedes Feld mit verknüpftem `<label for>`. Fehlermeldungen text + `aria-describedby`.
- Kein Placeholder als einziges Label.

## axe-Check (Evaluator nutzt das)
```js
await import('https://cdn.jsdelivr.net/npm/axe-core@4/axe.min.js');
const r = await axe.run();  // r.violations → 0 anstreben
```

## Häufige Gaps → Fix
| Violation | Fix |
|---|---|
| `color-contrast` | Token-Helligkeit anpassen (z.B. `#888`→`#555` auf weiß) |
| `link-name` / `button-name` | `aria-label` ergänzen |
| `image-alt` | `alt` setzen / dekorativ `alt=""` |
| `heading-order` | Hierarchie korrigieren |
| `landmark-*` | `main`/`nav`/`header`/`footer` ergänzen |
| `aria-expanded` fehlt | am Menü-Toggle pflegen |
