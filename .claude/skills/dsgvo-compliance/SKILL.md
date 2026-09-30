---
name: dsgvo-compliance
description: DSGVO/Impressum-Pflichten für deutsche Geschäfts-Webseiten, Impressum §5 DDG/TMG, Datenschutz Art. 13 DSGVO, keine externen Tracker/Fonts ohne Consent. Lade bei rechtlichen Pflichtseiten.
---

# DSGVO & Impressum (DE): Compliance-Pattern

Keine Rechtsberatung, branchenübliche, korrekte Standard-Struktur mit klar markierten
Platzhaltern (`{{...}}` / `// TODO: bestätigen`). Finale Prüfung durch Inhaber/Anwalt empfohlen.

## Goldene Regel für diesen Stack

Die Seite ist **statisch + ohne Tracker**:
- **Fontsource self-hosted** → kein Google-Fonts-CDN → keine IP-Übertragung an Google.
- **Kein** Google Analytics, **kein** Google Maps iframe, **kein** YouTube-Embed ohne Consent.
- → **Kein Cookie-Banner nötig**, da nur technisch notwendige Auslieferung. Das ist ein
  DSGVO-Vorteil und gehört als Stärke in die Datenschutzerklärung.

Wenn eine Karte gewünscht ist: statisches Bild + Link zu Maps, **kein** eingebettetes iframe.

## /impressum: Pflichtangaben (§ 5 DDG, ehem. TMG)

- Name / Firma (mit Rechtsform)
- Anschrift (kein Postfach)
- Vertretungsberechtigte Person (bei Gesellschaften)
- Kontakt: Telefon **und** E-Mail
- USt-IdNr. (§ 27a UStG), falls vorhanden
- Bei reglementierten Berufen: zuständige Kammer/Aufsichtsbehörde, gesetzliche
  Berufsbezeichnung + Staat der Verleihung (z.B. Kfz-Meister: Handwerkskammer)
- Verbraucherstreitschlichtung-Hinweis (§ 36 VSBG)

## /datenschutz: Pflichtinhalte (Art. 13 DSGVO)

1. Verantwortlicher (Name, Anschrift, Kontakt)
2. Zwecke + Rechtsgrundlagen der Verarbeitung
3. Hosting & Server-Logfiles (Art. 6 Abs. 1 lit. f, berechtigtes Interesse; IP, Zeitstempel,
   abgerufene Datei; Speicherdauer)
4. Kontaktaufnahme (E-Mail/Telefon/Formular, Art. 6 Abs. 1 lit. b/a)
5. Betroffenenrechte: Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit,
   Widerspruch (Art. 15–21)
6. Beschwerderecht bei der Aufsichtsbehörde (Art. 77)
7. Klarstellung: **keine Cookies/kein Tracking/keine externen Fonts/keine Analyse-Tools**

## Umsetzung

- Texte in `site.ts` (`legal`-Objekt) + zwei Seiten `impressum.astro` / `datenschutz.astro`,
  die diese rendern. Im Footer auf beide verlinken.
- Datums-/Stand-Angabe der Datenschutzerklärung.
- E-Mail-Adressen nicht roh als Spam-Falle, `mailto:` ist ok, ggf. einfache Maskierung.

## Anti-Pattern (sofort als DSGVO-Verstoß werten)

- `<link href="https://fonts.googleapis.com/...">` → ❌ ersetzen durch Fontsource.
- Google-Analytics-/GTM-Snippet ohne Consent → ❌ entfernen.
- `<iframe src="google.com/maps...">` ohne Consent → ❌ statisches Bild + Link.
- Fehlendes Impressum oder fehlende Datenschutzseite → ❌ kritischer Gap.
