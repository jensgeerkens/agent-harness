/**
 * Zentrale Content-Datei (site.ts-First).
 *
 * TEMPLATE: Generischer Platzhalter-Content. Der code-writer ersetzt diese Werte
 * anhand des Projekt-Briefings und der Researcher-Briefs. Struktur bleibt stabil.
 * Unbestätigte Annahmen mit `// TODO: bestätigen` markieren.
 */

export const company = {
  legalName: 'Musterbetrieb GmbH',
  shortName: 'Musterbetrieb',
  tagline: 'Hier steht Ihr Leistungsversprechen.',
  foundedSince: 'seit vielen Jahren', // TODO: bestätigen
  region: 'in Ihrer Region',
} as const;

export const contact = {
  street: 'Musterstraße 1',
  zip: '00000',
  city: 'Musterstadt',
  phone: { display: '01234 / 567890', link: 'tel:+491234567890' }, // TODO: bestätigen
  email: { main: 'info@example.org', info: 'info@example.org' }, // TODO: bestätigen
  geo: { lat: 52.52, lng: 13.405 }, // TODO: exakte Koordinaten
  whatsapp: '+491234567890', // TODO: bestätigen
} as const;

export const openingHours = [
  { day: 'Montag', open: '09:00', close: '18:00', pause: null },
  { day: 'Dienstag', open: '09:00', close: '18:00', pause: null },
  { day: 'Mittwoch', open: '09:00', close: '18:00', pause: null },
  { day: 'Donnerstag', open: '09:00', close: '18:00', pause: null },
  { day: 'Freitag', open: '09:00', close: '18:00', pause: null },
  { day: 'Samstag', open: '09:00', close: '13:00', pause: null },
  { day: 'Sonntag', open: null, close: null, pause: null },
] as const;

// Wochentag-Index 0=Sonntag … 6=Samstag (passend zu JS Date.getDay())
export const openingByWeekday: Array<{ from: number; to: number } | null> = [
  null,
  { from: 9 * 60, to: 18 * 60 },
  { from: 9 * 60, to: 18 * 60 },
  { from: 9 * 60, to: 18 * 60 },
  { from: 9 * 60, to: 18 * 60 },
  { from: 9 * 60, to: 18 * 60 },
  { from: 9 * 60, to: 13 * 60 },
];

export const services = [
  {
    slug: 'leistung-1',
    title: 'Leistung 1',
    short: 'Kurzbeschreibung der Leistung',
    description:
      'Ausführliche Beschreibung der ersten Leistung. Der code-writer ersetzt diesen Text anhand des Briefings.',
    duration: 'ca. 30 Min.',
    icon: 'sparkle',
    highlight: true,
  },
  {
    slug: 'leistung-2',
    title: 'Leistung 2',
    short: 'Kurzbeschreibung der Leistung',
    description:
      'Ausführliche Beschreibung der zweiten Leistung. Branchenecht formulieren, keine Floskeln.',
    duration: 'ca. 1 Std.',
    icon: 'check-circle',
    highlight: true,
  },
  {
    slug: 'leistung-3',
    title: 'Leistung 3',
    short: 'Kurzbeschreibung der Leistung',
    description:
      'Ausführliche Beschreibung der dritten Leistung. Konkret, nutzerorientiert, vertrauensbildend.',
    duration: 'individuell',
    icon: 'award',
    highlight: true,
  },
] as const;

export const valueProps = [
  { title: 'Vorteil 1', text: 'Warum Menschen Ihnen vertrauen.', icon: 'award' },
  { title: 'Vorteil 2', text: 'Ihr zweites Alleinstellungsmerkmal.', icon: 'handshake' },
  { title: 'Vorteil 3', text: 'Persönlich, verlässlich, regional.', icon: 'phone' },
] as const;

export const testimonials = [
  { text: 'Beispiel-Stimme, durch echte/freigegebene Stimme ersetzen.', author: 'Name, Ort', rating: 5 }, // TODO: bestätigen
] as const;

export const faq = [
  {
    question: 'Beispiel-Frage, die Kundschaft häufig stellt?',
    answer: 'Klare, hilfreiche Antwort. Der Researcher liefert branchenechte FAQs.',
  },
] as const;

export const serviceArea = {
  primary: 'Musterstadt',
  cities: ['Musterstadt', 'Nachbarort', 'Umland'],
} as const;

export const legal = {
  responsible: 'Vorname Nachname', // Impressum §5, TODO: bestätigen
  vatId: undefined as string | undefined, // TODO: falls vorhanden
  supervisoryAuthority: undefined as string | undefined, // bei reglementierten Berufen
  register: undefined as string | undefined, // Handelsregister, falls vorhanden
} as const;

export const social = {
  facebook: undefined as string | undefined,
  instagram: undefined as string | undefined,
} as const;

export type Service = (typeof services)[number];
export type Testimonial = (typeof testimonials)[number];
export type FaqItem = (typeof faq)[number];
