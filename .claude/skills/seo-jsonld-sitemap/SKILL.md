---
name: seo-jsonld-sitemap
description: SEO-Pattern für statische Astro-Sites, natives <head>, JSON-LD (LocalBusiness/Schema.org), @astrojs/sitemap, Canonical, Open Graph. Lade bei SEO-/Meta-/Structured-Data-Arbeit.
---

# SEO: <head>, JSON-LD, Sitemap

Kein Extra-SEO-Paket nötig. Alles über natives `<head>` im `BaseLayout`, `@astrojs/sitemap`
und Inline-JSON-LD.

## BaseLayout-<head> (Muster)

```astro
---
import { company, contact } from '../content/site';
interface Props { title?: string; description?: string; path?: string; ogType?: string; }
const { title, description = company.tagline, path = '', ogType = 'website' } = Astro.props;
const fullTitle = title ? `${title} · ${company.legalName}` : `${company.legalName} · ${contact.city}`;
const canonical = new URL(path, Astro.site).href;
---
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta name="robots" content="index, follow" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <meta property="og:type" content={ogType} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:locale" content="de_DE" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="sitemap" href="/sitemap-index.xml" />
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} is:inline />
</head>
```

### Title/Description-Regeln
- Title ≤ 60 Zeichen, einzigartig pro Seite, Marke am Ende.
- Description ≤ 160 Zeichen, handlungsorientiert, lokal.
- Genau **ein** `<h1>` pro Seite (≈ Title, nicht identisch).

## JSON-LD (LocalBusiness: Subtyp je Branche)

Subtyp nach Branche wählen: `Bakery`, `AutoRepair`, `Restaurant`, `Dentist`, `HairSalon`,
sonst `LocalBusiness`. Beispiel Bäckerei:

```js
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Bakery',
  '@id': `${Astro.site}#business`,
  name: company.legalName,
  url: Astro.site?.href,
  telephone: contact.phone.link.replace('tel:', ''),
  email: contact.email.main,
  address: { '@type': 'PostalAddress', streetAddress: contact.street,
             postalCode: contact.zip, addressLocality: contact.city, addressCountry: 'DE' },
  geo: { '@type': 'GeoCoordinates', latitude: contact.geo.lat, longitude: contact.geo.lng },
  openingHoursSpecification: openingHours.filter(d => d.open).map(d => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: `https://schema.org/${dayMap[d.day]}`, opens: d.open, closes: d.close,
  })),
};
```
**Nur belegbare Aggregate-Ratings** angeben (sonst weglassen, keine erfundenen Bewertungszahlen
als Tatsache; Brief-Annahmen klar markieren). Validierung gedanklich gegen `validator.schema.org`.

## Sitemap

`@astrojs/sitemap` in `integrations: [sitemap()]` + `site:`-URL gesetzt → erzeugt
`dist/sitemap-index.xml` + `sitemap-0.xml` automatisch beim Build. `<link rel="sitemap">` im head.

## Checkliste (Evaluator-Sicht)
- [ ] Title/Desc je Seite, Längen ok
- [ ] genau ein `<h1>` je Seite
- [ ] Canonical absolut + korrekt
- [ ] JSON-LD parsebar, Typ passend, keine Fake-Fakten
- [ ] `dist/sitemap-index.xml` existiert
- [ ] OG-Tags + Viewport vorhanden
