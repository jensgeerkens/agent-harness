---
name: freigabe-briefing
description: Phase 2 des Freigabe-Modus. Synthetisiert die Fragebogen-Antworten des Anforderers zu einem strukturierten briefing.json + briefing.md, prueft auf Widersprueche/Luecken und legt das Ergebnis dem Operator zur Freigabe vor (GATE 1). Danach STOP bis Freigabe via /freigabe-go.
disable-model-invocation: true
permissionMode: bypassPermissions
---

# /freigabe-briefing <slug>: Antworten → Briefing (GATE 1)

Macht aus den (laienhaften, evtl. lueckenhaften) Fragebogen-Antworten ein sauberes,
maschinenlesbares Briefing, und legt es dem Operator zur Freigabe vor.

## Eingabe

- `$ARGUMENTS` = `<slug>`.
- Antworten-Quelle (in dieser Reihenfolge):
  1. `~/projects/<slug>/intake/responses.md` (der Operator hat den Formspree-Mailinhalt hier gespeichert):
     bevorzugt.
  2. Falls die Datei fehlt: Den Operator bitten, den Mailinhalt einzufuegen oder in `intake/responses.md`
     zu speichern, dann erneut aufrufen. (Dieser Schritt ist Operator-facing, Rueckfrage hier erlaubt:
     anders als im autonomen Loop.)
- Kontext mitlesen: `intake/prompt.txt` und `intake/question-set.json` (Frage→Antwort-Zuordnung).

## Schritte

1. **Antworten parsen.** Ordne jede Antwort ihrer Frage zu (Feldnamen = `<section>__<id>`).

2. **Synthese** (*think*) → schreibe **`~/projects/<slug>/briefing.json`**:
   ```json
   {
     "name": "<slug>",
     "unternehmen": { "name": "...", "was": "...", "usp": "...", "standort": "..." },
     "ziele": ["primaeres Ziel", "..."],
     "zielgruppe": "...",
     "tonalitaet": "z. B. bodenstaendig-vertrauensvoll / premium-reduziert",
     "seiten": ["Start", "Leistungen", "Über uns", "Kontakt", "Impressum", "Datenschutz"],
     "inhalte": { "texte_vorhanden": false, "bilder_vorhanden": false, "logo": "...", "oeffnungszeiten": "..." },
     "design_wunsch": { "vorbilder": ["..."], "farben": "...", "gegenbeispiele": ["..."] },
     "funktionen": ["Kontaktformular", "Karte", "..."],
     "recht": { "firmierung": "...", "anschrift": "...", "inhaber": "...", "ust_id": "...", "telefon": "..." },
     "technik": { "domain": "...", "alte_seite": "...", "email": "..." },
     "deploy_mode": "<aus state.json uebernehmen>",
     "offene_punkte": [
       { "frage": "...", "warum_wichtig": "...", "annahme": "getroffene Default-Annahme (sichtbar markiert)" }
     ],
     "konflikte": [
       { "a": "...", "b": "...", "empfehlung": "wie aufloesen" }
     ]
   }
   ```
   - **Luecken**: fehlt etwas Wichtiges → in `offene_punkte` mit begruendeter Default-Annahme.
   - **Widersprueche**: z. B. „kleines Budget" + „aufwendige Animationen" → in `konflikte`
     mit Empfehlung. Erfinde keine Fakten (v. a. nicht bei `recht`: Impressum braucht echte Daten).

3. **`briefing.md`** schreiben, die menschenlesbare Fassung (Vorlage:
   `~/agent-harness/templates/docs/BRIEFING-template.md`), inkl. der offenen Punkte und
   Konflikte als sichtbare Liste.

4. **Committen:** `git add -A && git commit -m "freigabe <slug>: briefing synthetisiert (GATE 1)"`.

5. **GATE 1, dem Operator vorlegen & STOP.** Gib eine kompakte Zusammenfassung ans Terminal:
   - Was die Seite werden soll (3–5 Zeilen)
   - **Offene Punkte** + getroffene Annahmen (damit der Operator korrigieren kann)
   - **Konflikte** + Empfehlungen
   - Hinweis: „Briefing pruefen/korrigieren (briefing.json oder briefing.md direkt editieren).
     Wenn es passt: **`/freigabe-go <slug>`** gibt GATE 1 frei und startet Research + Design."

   `state.json.gates.briefing` bleibt `pending`: erst `/freigabe-go` setzt es auf `approved`.
