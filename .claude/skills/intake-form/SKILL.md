---
name: intake-form
description: Generiert pro Projekt einen laienverstaendlichen Fragenkatalog als versandfertiges Web-Formular. Erzeugt ein Frage-Set-JSON (projekt-spezifisch, einfache Sprache) und rendert es ueber den zentralen Renderer zu intake/<slug>.html. Formular schickt Antworten per Formspree an die konfigurierte Betreiber-Adresse. Wird von /freigabe genutzt.
---

# intake-form: projekt-spezifischer Fragebogen als Web-Formular

Erzeugt aus einem kurzen Projekt-Prompt einen **vollstaendigen, auf genau dieses Projekt
zugeschnittenen** Fragenkatalog, als hübsches statisches HTML-Formular, das die fachliche Ansprechperson im
Browser ausfuellt. Antworten gehen per Formspree an die in `config/intake.json` hinterlegte **`notify_email`**.

## Prinzip „zentraler Renderer"

EINE Quelle der Wahrheit ist `templates/intake/form-renderer.html`. Du erzeugst NICHT
jedes Mal neues HTML, sondern nur ein **Frage-Set-JSON** pro Projekt. `make-intake.mjs`
giesst es in den Renderer → versandfertiges `intake/<slug>.html`. Ein DSGVO-Pfad, eine
Formspree-Anbindung, ein wartbares Layout.

## Schritte

1. **Frage-Set entwerfen** (*think*, projekt-spezifisch, NICHT generisch). Schreibe
   `~/projects/<slug>/intake/question-set.json` nach diesem Schema:
   ```json
   {
     "project": "<slug>",
     "title": "Website-Fragebogen, <Firma/Branche>",
     "intro": "1-2 freundliche Saetze, was die ausfuellende Person erwartet.",
     "sections": [
       { "id": "vorhaben", "title": "Worum es geht",
         "help": "optionaler Block-Hinweis",
         "questions": [
           { "id": "name", "label": "Wie heißt Ihr Betrieb?", "type": "text",
             "required": true, "placeholder": "z. B. …", "help": "kurze Erklaerung/Beispiel" }
         ] }
     ]
   }
   ```
   Feldtypen: `text | email | tel | textarea | radio | checkbox | select`.

2. **Rendern:**
   ```bash
   node ~/agent-harness/scripts/make-intake.mjs \
     ~/projects/<slug>/intake/question-set.json \
     ~/projects/<slug>/intake/<slug>.html
   ```
   (Formspree-ID kommt aus `config/intake.json`, oder `--formspree <id>` mitgeben.)

3. **Ausliefern.** Gib dem Operator den Pfad `intake/<slug>.html`. Optionen: der fachlichen Ansprechperson direkt
   schicken ODER auf der eigenen Domain unter `/intake/<slug>.html` hochladen und den Link senden.

## Fragen-Design: Regeln (wer ausfuellt, hat KEIN IT-Wissen)

- **Alltagssprache, kein Fachjargon.** Nicht „Welche CMS-Integration?", sondern
  „Wollen Sie Texte/Bilder spaeter selbst aendern koennen?".
- **Je Frage bei Bedarf ein `help`** mit Beispiel ODER warum du fragst.
- **Pflicht (`required:true`) sparsam**: nur was die Seite wirklich braucht. Rest optional,
  damit niemand ueberfordert wird.
- **Sinnvolle Vorgaben**: bei Auswahl-Fragen die haeufigste/empfohlene Option zuerst.
- **Immer abdecken (Bloecke):**
  1. Worum es geht (Name, Zweck, was das Vorhaben besonders macht)
  2. Ziele der Seite (was soll sie bewirken: Anrufe? Termine? Gefunden werden?)
  3. Zielgruppe (wer soll die Seite nutzen?)
  4. Inhalte (Texte/Bilder vorhanden? Logo? Oeffnungszeiten? Standorte?)
  5. Wunsch-Look & Vorbilder (Seiten/Stile, die gefallen; Farben; Gegenbeispiele)
  6. Gewuenschte Funktionen (Kontaktformular, Karte, Galerie, Online-Termin…)
  7. Rechtliche Pflichtangaben (Firmierung, Anschrift, Inhaber, USt-IdNr, Telefon)
  8. Domain/Technik/Bestehendes (vorhandene Domain? alte Seite? E-Mail?)
- **Branche einarbeiten.** Eine Kfz-Werkstatt bekommt andere Fragen als eine Steuerkanzlei
  (z. B. „Bieten Sie Hol-/Bringservice an?" vs. „Welche Rechtsgebiete?").

## Hinweis Formspree

Das Formular postet an `https://formspree.io/f/<id>`. Ist die ID noch der Platzhalter,
zeigt das Formular einen klaren Hinweis statt zu senden. Der Operator setzt die ID einmalig in
`config/intake.json` (kostenloser Formspree-Account, Ziel-Mail = eigene Betreiber-Adresse).
