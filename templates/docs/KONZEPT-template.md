# Konzept: <Projektname>

> Wird in Iter 001 vom Orchestrator/code-writer aus den Researcher-Briefs verdichtet.
> Hält die tragenden Design- und Struktur-Entscheidungen fest, damit spätere Iterationen
> konsistent bleiben.

## 1. Positionierung
- **Kernbotschaft:** <ein Satz>
- **Tonalität:** <…>
- **Differenzierung:** <warum diese Seite, nicht generisch>

## 2. Informationsarchitektur
| Route | Zweck | H1 |
|---|---|---|
| `/` | Startseite, Conversion | <…> |
| `/leistungen` | Leistungen im Detail | <…> |
| `/kontakt` | Kontakt + Öffnungszeiten | <…> |
| `/impressum` | Pflicht | Impressum |
| `/datenschutz` | Pflicht | Datenschutzerklärung |
| <weitere> | <…> | <…> |

## 3. Startseiten-Sektionen (Reihenfolge)
1. Hero (H1 + primärer CTA)
2. Value Props / Trust
3. Leistungen (Highlights)
4. Testimonials
5. FAQ
6. CTA-Band
<projektabhängig anpassen>

## 4. Design-System
- **Akzentfarbe:** `--color-accent-600: #…`
- **Neutral/Tinte:** ink-Skala (Default beibehalten oder anpassen)
- **Font:** <Fontsource-Familie>, self-hosted
- **Radius/Shadow:** Default-Tokens oder Anpassung

## 5. Conversion-Strategie
- Primärer CTA: <Label> → <Route/Aktion>
- Persistenz: Header-CTA + Mobile-Sticky-Leiste
- Trust-Signale: <Erfahrung / Bewertungen / Standort / Garantie>

## 6. Technische Eckpunkte
- Astro 6 static, Tailwind v4, Fontsource, Sitemap, JSON-LD (`<Subtyp>`)
- Deploy: Cloudflare Pages → `https://<name>.pages.dev`

## 7. Offene Annahmen (`// TODO: bestätigen`)
- <Liste der erfundenen/angenommenen Fakten>
