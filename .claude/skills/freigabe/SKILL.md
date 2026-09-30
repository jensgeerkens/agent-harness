---
name: freigabe
description: Startet ein Projekt im Freigabe-Modus. Nimmt einen kurzen Prompt (worum es geht), legt das Projekt an und erzeugt einen projekt-spezifischen, laienverstaendlichen Fragebogen als Web-Formular zur Anforderungserhebung bei der fachlichen Ansprechperson. Danach STOP bis die Antworten da sind. Halbautonomer Betrieb mit 3 menschlichen Freigabe-Gates (Briefing/Design/Deploy).
disable-model-invocation: true
permissionMode: bypassPermissions
---

# /freigabe "<Worum geht es>": Projekt im Freigabe-Modus starten

Der Einstieg in den halbautonomen Freigabe-Modus. **Eine Idee → fertiger Fragebogen zum
Versenden.** Anders als `/goal` (vollautonomer Schnell-Loop) hat dieser Modus **3 Gates**
zur Freigabe durch den Operator.

## Argument-Parsing (`$ARGUMENTS`)

- Haupttext = worum es geht (z. B. `"Kfz-Werkstatt, Familienbetrieb im ländlichen Raum"`).
- Optional `--deploy auto` → am Ende automatisch deployen. Default `--deploy manual`
  (Stopp beim geprueften Build, Deploy bewusst spaeter).
- Leer → Hinweis „Briefing fehlt", Stop.

## Schritte

1. **Slug ableiten** (*think*): 1–2 praegnante Branchen-/Firmen-Woerter → slugify
   (klein, Bindestriche, keine Umlaute). Konflikt mit `~/projects/<slug>/` → `-2`, `-3`.

2. **Projekt anlegen** (erweitertes state.json mit gates + deploy_mode):
   ```bash
   bash ~/agent-harness/scripts/init-freigabe.sh <slug> <manual|auto>
   ```
   Den Original-Prompt zusaetzlich als `~/projects/<slug>/intake/prompt.txt` ablegen
   (Kontext fuer die Fragebogen-Generierung).

3. **Fragebogen erzeugen**: lade das Skill **`intake-form`** und folge ihm:
   - Entwirf das projekt-spezifische `intake/question-set.json` (laienverstaendlich,
     Branche eingearbeitet, Pflicht sparsam).
   - Rendere: `node ~/agent-harness/scripts/make-intake.mjs
     ~/projects/<slug>/intake/question-set.json ~/projects/<slug>/intake/<slug>.html`

4. **Committen** (auf iter-001): `git add -A && git commit -m "freigabe <slug>: intake-formular"`.

5. **An den Operator uebergeben & STOP.** Gib aus:
   - Pfad zum Formular: `~/projects/<slug>/intake/<slug>.html`
   - Hinweis: an die fachliche Ansprechperson geben ODER auf der eigenen Domain unter `/intake/<slug>.html` hochladen.
   - Naechster Schritt sobald die Antworten (per Mail an die Betreiber-Adresse) da sind:
     Antworten in `~/projects/<slug>/intake/responses.md` speichern, dann
     **`/freigabe-briefing <slug>`**.
   - Falls die Formspree-ID noch fehlt: einmalig in `~/agent-harness/config/intake.json` setzen.

   **Hier ist Schluss.** Nicht weiterbauen, der Modus wartet auf den Ruecklauf der Antworten.

## Garantien

- Fragebogen ist projekt-spezifisch und laienverstaendlich.
- Antworten gehen DSGVO-konform per Formspree an die Betreiber-Adresse (`notify_email`) (kein Tracking).
- Danach: 3 Gates (Briefing → Design → Deploy), jeweils Freigabe durch den Operator.
