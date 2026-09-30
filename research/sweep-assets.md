# Sweep: Asset-Pipeline Best-of 2026 für statische Sites

Stand: 2026-07-05. Kanal: Fonts (Subsetting/Fallbacks), Bild-Pipeline (astro:assets/sharp/AVIF), OG-Images, SVG/Icons, Favicons, Platzhalter (LQIP). Bewertungsmaßstab: messbar bessere Performance oder Optik gegenüber unserem Status quo (Astro 6 + Tailwind v4, Fontsource, Inline-SVG-Icons, sharp-Default, Cloudflare Pages, Windows 11).

---

## 1. Fonts

### 1.1 Astro 6 native Fonts API: WICHTIGSTER FUND

Astro 6 (Release 10.03.2026) hat die vorher experimentelle Fonts API **stabilisiert**. Sie ersetzt unser bisheriges Fontsource-Pattern aus dem Skill `astro-tailwind-static-site` fast vollständig und liefert dabei zwei Dinge, die wir bisher NICHT haben:

1. **Subset-Kontrolle in der Config**: `subsets: ["latin"]`, `weights: ["400 700"]` (Weight-Ranges bei Variable Fonts), `styles: ["normal"]`. Achtung: Der Default ist großzügig (cyrillic-ext, cyrillic, greek-ext, greek, vietnamese, latin-ext, latin): ohne explizite Einschränkung werden bis zu 14 Font-Dateien geladen (Beobachtung von vgarmes.github.io). Für deutsche Sites reicht `["latin", "latin-ext"]` (latin-ext wegen Umlauten in manchen Schnitten nicht nötig, Umlaute sind in latin; latin-ext nur bei osteuropäischen Namen).
2. **Automatisch optimierte Fallback-Fonts** (`optimizedFallbacks`, default an): Astro generiert `@font-face`-Regeln für den System-Fallback mit `size-adjust` / `ascent-override` / `descent-override` auf Basis der echten Font-Metriken (fontaine/capsize-Prinzip). Das eliminiert den Font-Swap-Layout-Shift, der laut DebugBear/Chrome-Team 2026 das größte verbliebene Font-Problem ist (nicht die Ladezeit). Direkt messbar im Lighthouse-CLS.

Provider: google, fontsource, adobe, bunny, fontshare, lokale Dateien. Fonts werden beim Build heruntergeladen, gecacht (`node_modules/.astro/fonts`) und self-hosted ausgeliefert, DSGVO-konform ohne manuelles Font-Datei-Management. `<Font preload />`-Komponente für gezieltes Preloading (sparsam einsetzen, nur der Body-Font in der kritischen Weight).

**Bewertung: adoptieren.** Ersetzt manuelle Fontsource-Installation + eigene @font-face-Pflege, bringt metric-adjusted Fallbacks gratis. Unser Skill sollte umgestellt werden. Quelle: https://docs.astro.build/en/reference/experimental-flags/fonts/ (in v6-Docs stabil), https://astro.build/blog/astro-570/ (Einführung), https://developer.chrome.com/blog/framework-tools-font-fallback

### 1.2 subfont (Munter/subfont): aggressives Content-Subsetting post-build

Aktiv gepflegt (v7.2.3, Release ~Juni 2026, 20 Contributor). Analysiert das fertige Build-HTML, extrahiert die tatsächlich verwendeten Glyphen, subsettet die Fonts darauf und schreibt @font-face + preload um. Ein Kommando gegen `dist/`. Dokumentierte Einsparungen: 60%+ gegenüber bereits WOFF2-komprimierten Full-Latin-Fonts (tomhazledine.com: >60% Reduktion). Bei unseren Sites mit fixem Content (Projekt-Sites, site.ts-first) ist das ideal: Content ändert sich nur bei Rebuild, und subfont läuft ja im Build.

Grenze: Astro-6-Fonts-API-Subsets (latin) liegen bei ~15-40 KB/Weight; subfont drückt das auf ~8-15 KB. Der Zusatzgewinn ist real, aber klein gegenüber dem Schritt "alle Subsets → latin". Reihenfolge: erst Fonts API richtig konfigurieren, subfont nur als optionale letzte Stufe, wenn Lighthouse-Font-Bytes noch auffallen. Pure-Node, läuft auf Windows.

**Bewertung: Kandidat zweiter Ordnung** (postbuild-Schritt im Harness, messbar per Font-Transfer-Bytes). Quelle: https://github.com/munter/subfont

### 1.3 glyphhanger: nicht adoptieren

Filament Group, verlangt Python + fonttools + Puppeteer-Spidering, auf Windows fummelig, seit Jahren kaum Weiterentwicklung. subfont macht dasselbe rein in Node und integrierter. Quelle: https://github.com/filamentgroup/glyphhanger

### 1.4 Variable Fonts

Bleiben Best Practice, wenn mehr als 2-3 Weights gebraucht werden (eine Datei statt vieler). Bei nur 400+700 ist ein Variable Font oft GRÖSSER als zwei statische Subsets. Die Fonts API unterstützt Weight-Ranges (`"400 700"`) für Variable Fonts direkt. Regel für den design-system-architect: Weights zählen; ≥3 → Variable Font, sonst statisch. Keine neue Tool-Adoption nötig.

---

## 2. Bild-Pipeline (astro:assets / sharp / AVIF)

### 2.1 Responsive-Images-Defaults sind seit Astro 5.10 stabil: wir nutzen sie vermutlich nicht voll

Seit Astro 5.10 (Flag entfernt, Commit withastro/astro#13917) gibt es stabile Config:

```js
image: {
  layout: 'constrained',        // automatisch korrektes srcset + sizes für JEDES <Image>
  responsiveStyles: true,       // globale Styles, damit Bilder korrekt skalieren
}
```

Damit erzeugt jedes `<Image>`/`<Picture>` ohne manuelle `widths`/`sizes`-Angaben ein Best-Practice-srcset. Das ist der Unterschied zwischen "ein 1600px-Bild für alle" und echten Breakpoint-Varianten, auf Mobile regelmäßig 50-80% weniger Bild-Bytes, direkt messbar im LCP.

### 2.2 AVIF-First mit sharp-Service-Config

Konsens 2026: `<Picture formats={['avif', 'webp']} fallbackFormat="jpg">` für Fotos. AVIF ist 20-30% kleiner als WebP bei gleicher visueller Qualität (crystallize.com, mehrere Quellen). Encode-Zeit pro Bild sind bei statischen Builds irrelevant ("AVIF for static" ist die Faustregel).

Empfohlene sharp-Settings (openaviffile.com, sharp-Issue #4227, dev.to-Benchmarks):
- AVIF Fotos: quality 60-75, effort 5-6 (effort 9 bringt marginal/unvorhersehbar, kostet massiv Buildzeit), chromaSubsampling '4:2:0'
- AVIF Grafik/Text im Bild: quality 80-85, chromaSubsampling '4:4:4'
- JPEG-Fallback: mozjpeg aktivieren (5-10% kleiner als Default-Encoder)

In Astro konfigurierbar über `image.service.config` in astro.config.mjs. Das ist reine Config, kein neues Tool, gehört als Soll-Vorgabe in den astro-tailwind-static-site-Skill und als Prüfpunkt in den evaluator.

### 2.3 @unpic/astro: geprüft, NICHT adoptieren

Schönes API (CDN-Erkennung, Layout-Modi, Placeholder), ABER: Placeholder (blurhash/dominantColor/lqip) funktionieren **nicht für lokale Bilder**, nur remote. Unsere Sites nutzen fast ausschließlich lokale Bilder aus src/assets. astro:assets mit layout='constrained' deckt den Rest ab. Kein Mehrwert für uns. Quelle: https://unpic.pics/img/astro/

### 2.4 LQIP: CSS-only-Platzhalter nach Lean Rada: kleiner, feiner Optik-Gewinn

Technik (leanrada.com, April 2025, breit rezipiert via Simon Willison, Frontend Masters, Hackaday): Ein einziges CSS-Custom-Property-Integer (`style="--lqip:567213"`) kodiert Grundfarbe + 3x2-Helligkeitsraster in 20 Bit; reines CSS dekodiert es zu einem blurry Placeholder. **Null JavaScript, null Markup-Bloat, null externe Dependency**: nur ein kleines sharp-Build-Skript (Oklab, 3x2-Resize) + einmalige CSS-Regeln. Alternativen (blurhash/thumbhash) brauchen Client-JS zum Dekodieren; astro-lqip u.ä. erzeugen Data-URIs (mehr HTML-Bytes). Für Hero-/Galerie-Bilder verbessert das die wahrgenommene Ladequalität sichtbar (kein weißes Aufblitzen), ohne CLS und ohne JS-Kosten. Passt perfekt zu unserer "hochwertig ohne Ballast"-Linie. Quelle: https://leanrada.com/notes/css-only-lqip/

---

## 3. OG-Image-Generierung

Status quo bei uns: vermutlich statisches OG-Bild oder gar keins pro Seite. Best Practice 2026 für statische Sites:

### 3.1 Satori + resvg-js zur Build-Zeit: adoptieren

Satori (Vercel, aktiv gepflegt) rendert JSX/HTML+CSS zu SVG, resvg-js (Rust, prebuilt Windows-Binaries) rastert zu PNG. In Astro als statische Route `/blog/[slug].png.ts` bzw. `og/[slug].png.ts` mit getStaticPaths: alle OG-Images entstehen beim Build, kein Server, keine Kosten, läuft auf Cloudflare Pages als reine statische Assets. Unterstützt eigene Fonts (unsere Site-Fonts!) und Flexbox-Layout, d.h. der design-system-architect kann ein OG-Template im Site-Design (Farben, Typo aus site.ts/@theme) definieren, und jede Seite bekommt ein markenkonsistentes Share-Bild.

Messbarer Mehrwert: nicht Lighthouse, sondern Klickrate/professioneller Eindruck beim Teilen (WhatsApp/LinkedIn/Google Discover): für die gebauten Sites ein sichtbares Qualitätsmerkmal, das der evaluator heute gar nicht prüft. Aufwand: ~1 Template + 1 Endpoint, einmal als Skill-Pattern gegossen.

Alternative astro-og-canvas (delucis, wird von Astro-Docs selbst genutzt): einfacher, aber hart vordefiniertes Layout, widerspricht unserer Distinctiveness-Rubrik. Satori-Variante bevorzugen. Quellen: https://dietcode.io/p/astro-og/, https://github.com/kevinzunigacuellar/astro-satori, https://github.com/delucis/astro-og-canvas

---

## 4. SVG & Icons

### 4.1 astro-icon + @iconify-json/* (offline) + auto-SVGO: moderates Upgrade

Wir machen Inline-SVG per Hand. astro-icon (natemoo-re, reif, Astro-offiziell-nah) bringt drei konkrete Verbesserungen:
1. **Automatisches SVGO** auf alle lokalen Icons in src/icons/ (konfigurierbar), kein manueller Optimierungsschritt mehr.
2. **Iconify-Sets als lokale npm-Pakete** (@iconify-json/lucide etc., 275k+ Icons): volle Offline-/DSGVO-Tauglichkeit, kein Runtime-Fetch, konsistente Icon-Familie pro Projekt statt zusammengesuchter SVGs, das zahlt direkt auf Design-Konsistenz ein.
3. **Sprite-Modus**: mehrfach verwendete Icons werden per `<use>` dedupliziert statt n-fach inline, kleinere HTML-Payload auf icon-lastigen Seiten (Feature-Grids, Footer).

Kein Hype, seit Jahren stabil. Quelle: https://github.com/natemoo-re/astro-icon, https://iconify.design/docs/usage/svg/astro/

### 4.2 Standalone-SVGO für Nicht-Icon-SVGs (Logos, Illustrationen)

`svgo --multipass` als Build-/Precommit-Schritt für alles in src/assets/*.svg bleibt sinnvoll (typisch 30-60% kleiner bei Export-SVGs aus Figma/Illustrator). Wenn astro-icon adoptiert wird, deckt es Icons ab; Logos/Illustrationen brauchen den separaten Durchlauf. Kein neues Tool, nur Pipeline-Disziplin.

---

## 5. Favicons

Konsens 2026 (Evil Martians "How to Favicon", weiterhin DER Referenztext; bestätigt von webtoolkit.tech u.a.): **Minimal-Set statt Generator-Bloat**:

- `favicon.ico` (multi-size 16/32/48, für Legacy + Tools, im Root)
- `icon.svg` (skaliert überall; Dark-Mode via `@media (prefers-color-scheme)`: Achtung: Safari ignoriert das Stand 2026, daher neutrale Basisfarbe wählen)
- `apple-touch-icon.png` (180x180, mit ~20px Padding + Hintergrund)
- `icon-192.png` + `icon-512.png` + minimales `manifest.webmanifest` (nur wenn PWA/Android-Homescreen relevant; bei reinen Firmen-Sites optional)

Das sind 3-5 Dateien und 3-4 head-Tags. Die Integration **astro-favicons** (erzeugt 71 Assets + 65 Tags) ist genau das Anti-Pattern: aufgeblähter head, Cache-Müll, null messbarer Nutzen, nicht adoptieren. RealFaviconGenerator (weiterhin kostenlos) taugt als einmaliger Checker/Generator der PNGs, nicht als Pipeline-Dependency. Empfehlung: Minimal-Set als festes Pattern in den Skill + Checkliste in validator. Quellen: https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs, https://realfavicongenerator.net/

---

## 6. Sonstiges geprüft und verworfen

- **@playform/compress / astro-compress** (HTML/CSS/JS-Minify postbuild): Stand März 2026 **inkompatibel mit Astro 6** (gebundeltes astro@5.x); Nutzen gering, da Astro selbst minifiziert und Cloudflare Brotli-komprimiert. Beobachten, nicht adoptieren. https://github.com/PlayForm/Compress/issues
- **Blurhash/Thumbhash klassisch**: brauchen Client-JS zum Dekodieren, die CSS-only-LQIP-Technik (4.2) dominiert sie für unsere Zwecke.
- **Precompression (brotli .br-Dateien)**: Cloudflare Pages komprimiert selbst on-the-fly; kein Gewinn.
- **AI-Favicon-Generatoren**: reine Content-Farm-Empfehlungen, kein Substanznachweis.

---

## Priorisierte Empfehlung

| Prio | Maßnahme | Messgröße |
|---|---|---|
| 1 | Astro 6 Fonts API mit subsets:["latin"], Weight-Ranges, optimizedFallbacks | Font-Bytes, CLS |
| 2 | image.layout='constrained' + responsiveStyles + Picture AVIF/WebP + sharp-Quality-Config | LCP, Bild-Bytes mobil |
| 3 | Satori-OG-Pipeline als Skill-Pattern (Build-Zeit, markenkonsistent) | Share-Optik, SEO-Vollständigkeit |
| 4 | astro-icon + @iconify-json (offline) + SVGO-Disziplin | HTML-Bytes, Design-Konsistenz |
| 5 | Favicon-Minimal-Set als Pattern (statt Generator) | head-Hygiene, Dark-Mode-Korrektheit |
| 6 | CSS-only-LQIP für Hero/Galerie | wahrgenommene Ladequalität, 0 JS |
| 7 | (optional) subfont als letzte Build-Stufe | Font-Bytes -50%+ zusätzlich |

## Quellen (Auswahl)

- https://docs.astro.build/en/reference/experimental-flags/fonts/ (Fonts API, in Astro 6 stabil)
- https://astro.build/blog/astro-5100/ (Responsive Images stabil)
- https://developer.chrome.com/blog/framework-tools-font-fallback (Metrik-Fallbacks/CLS)
- https://github.com/munter/subfont (v7.2.3, aktiv)
- https://github.com/lovell/sharp/issues/4227 + https://openaviffile.com/best-settings-for-avif-encoding/ (AVIF-Settings)
- https://dietcode.io/p/astro-og/ + https://github.com/kevinzunigacuellar/astro-satori (Build-Zeit-OG)
- https://github.com/natemoo-re/astro-icon (Icons/SVGO)
- https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs (Favicon-Minimal-Set)
- https://leanrada.com/notes/css-only-lqip/ (CSS-only LQIP)
- https://unpic.pics/img/astro/ (geprüft, verworfen für lokale Bilder)
- https://tomhazledine.com/subsetting-my-fonts-reduced-their-size-by-sixty-percent/ (Subsetting-Messung)
