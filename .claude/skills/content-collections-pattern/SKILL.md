---
name: content-collections-pattern
description: site.ts-First-Pattern, alle Texte, Daten und Kontaktinfos zentral und typisiert in src/content/site.ts. Komponenten importieren, nie harte Texte. Lade bei jeder Content-/Daten-Arbeit.
---

# site.ts-First: zentrale, typisierte Content-Quelle

**Prinzip:** Content-Editing = **eine Datei**. Keine harten Texte/Adressen/Telefonnummern in
`.astro`-Komponenten. Alles kommt aus `src/content/site.ts`, typisiert mit `as const`.

> Für reine Marketing-Sites ist ein einzelnes typisiertes `site.ts` simpler und schneller
> als Astro Content Collections (kein Glob, kein Schema-Overhead). Bei vielen Blog-/News-Items
> kann zusätzlich eine echte Content Collection sinnvoll sein, Default hier: `site.ts`.

## Struktur (Beispiel-Schema)

```ts
// src/content/site.ts
export const company = {
  legalName: 'Firma XY',
  shortName: 'XY',
  tagline: '...',
  foundedSince: 'seit über 20 Jahren', // TODO: vom Inhaber bestätigen
  region: '...',
} as const;

export const contact = {
  street: '...', zip: '...', city: '...',
  phone: { display: '0123 / 456789', link: 'tel:+49123456789' },
  email: { main: '...', info: '...' },
  geo: { lat: 0, lng: 0 }, // TODO: exakte Koordinaten
  whatsapp: '+49123456789',
} as const;

export const openingHours = [
  { day: 'Montag', open: '08:00', close: '18:00', pause: '12:00–13:00' },
  // ...
  { day: 'Sonntag', open: null, close: null, pause: null },
] as const;

export const services = [
  { slug: 'xy', title: '...', short: '...', description: '...', duration: '...', icon: 'wrench', highlight: true },
  // ...
] as const;

export const valueProps = [ { title: '...', text: '...', icon: 'award' } ] as const;
export const testimonials = [ { text: '...', author: '...', rating: 5 } ] as const;
export const faq = [ { question: '...', answer: '...' } ] as const;

export const legal = {
  responsible: '...',          // Impressum §5
  vatId: undefined,            // TODO falls vorhanden
  supervisoryAuthority: undefined,
} as const;

export const social = { facebook: undefined, instagram: undefined } as const;

// Abgeleitete Typen für Komponenten
export type Service = (typeof services)[number];
export type Testimonial = (typeof testimonials)[number];
export type FaqItem = (typeof faq)[number];
```

## Verwendung in Komponenten

```astro
---
import { company, contact, services } from '../content/site';
import type { Service } from '../content/site';
---
<h1>{company.legalName}</h1>
<a href={contact.phone.link}>{contact.phone.display}</a>
{services.map((s: Service) => <ServiceCard service={s} />)}
```

## Regeln

- **Niemals** harte Texte/Telefon/Adresse in `.astro`: immer aus `site.ts`.
- `as const` für Literal-Typen + Autovervollständigung.
- Abgeleitete Types (`type Service = (typeof services)[number]`) statt Doppel-Definition.
- Unbestätigte Annahmen mit `// TODO: bestätigen` markieren (Researcher liefert diese Marker).
- Helper-Logik (z.B. „jetzt geöffnet?") in `src/lib/*.ts`, nicht in `site.ts`.
- Ein einzelner `import { ... } from '../content/site'` pro Komponente, keine verstreuten Konstanten.
