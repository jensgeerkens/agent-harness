---
name: handoff
description: Letzte Phase des Freigabe-Modus. Erzeugt die Uebergabe-Dokumentation (HANDOFF.md) fuer den Operator und eine laienverstaendliche Kurzfassung fuer die Stakeholder, plus FINAL-REPORT.md. Erklaert site.ts-Pflege, Seiten ergaenzen, Credentials, offene Punkte. Wird von /freigabe-go am Ende geladen.
---

# handoff: Uebergabe-Dokumentation

Schliesst ein Projekt sauber ab: was wurde gebaut, wie pflegt man es, was ist offen.

## Erzeuge `~/projects/<slug>/HANDOFF.md` (fuer den Operator: technisch)

Struktur:
1. **Was gebaut wurde**: Seiten/Routen, Hauptfunktionen, erreichter Score je Dimension.
2. **Pflege**: konkret:
   - Texte/Daten aendern: **ausschliesslich `src/content/site.ts`** (site.ts-First): mit
     2–3 Beispielen (Telefon aendern, Leistung ergaenzen, Oeffnungszeiten).
   - Neue Seite anlegen: Datei in `src/pages/`, Daten in `site.ts`, Link ergaenzen.
   - Lokal ansehen: `npm install && npm run dev`. Bauen: `npm run build`.
   - Neu deployen: `bash ~/agent-harness/scripts/deploy-pages.sh <slug>`.
3. **Design-System**: Verweis auf `design-system/system.json` (Farben/Typo/Signature),
   damit spaetere Aenderungen stilkonsistent bleiben.
4. **Inhalte zu bestaetigen**: Liste der KI-Text-Entwuerfe aus `content-drafts/` bzw. der
   `TODO: fachlich bestaetigen`-Marker, die die fachliche Ansprechperson noch freigeben/korrigieren muss.
5. **Recht**: Stand Impressum/Datenschutz; welche echten Daten noch fehlen und wer sie liefert.
6. **Credentials/Domain**: Cloudflare-Pages-Projektname, Custom-Domain-Schritte (DNS),
   keine Passwoerter im Klartext ablegen, nur Hinweise, wo sie liegen.
7. **Offene Punkte**: aus `briefing.json.offene_punkte` + verbleibende Gaps falls Score < 9.0.

## Erzeuge `~/projects/<slug>/UEBERGABE-KURZFASSUNG.md` (fuer die Stakeholder: laienverstaendlich)

Kurz, ohne Fachjargon:
- Was die neue Seite kann (in Alltagssprache).
- Was noch zu tun/zu liefern ist (Texte bestaetigen, echte Fotos, Impressums-Daten).
- Wie Aenderungswuensche laufen (einfach an die Betreiber-Adresse).
- Link zur (Vorschau-/Live-)Seite.

## FINAL-REPORT.md

Nutze `~/agent-harness/templates/docs/FINAL-REPORT-template.md`. Ergaenze:
- Status: `SHIPPED` (deployed) / `READY-FOR-DEPLOY` (manual, gebaut & geprueft) /
  `STAGNATED` (Score < 9.0 nach Limits).
- Score-Tabelle (7 Dimensionen) inkl. ob `distinctiveness_capped` gegriffen hat.
- Live-URL oder Vorschau-Hinweis.
- Verweis auf HANDOFF.md + UEBERGABE-KURZFASSUNG.md.

Gib den FINAL-REPORT zusaetzlich ans Terminal aus.
