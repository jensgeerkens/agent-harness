---
name: goal
description: End-to-End-Wrapper. Nimmt ein Briefing entgegen (als Text oder Pfad), erstellt das Projekt, startet den autonomen Loop, deployed bei Threshold. Eine Anweisung, ein fertiges Live-Projekt.
disable-model-invocation: true
permissionMode: bypassPermissions
---

# /goal "<Briefing>": End-to-End, vollautonom

Der Hauptweg. **Eine Anweisung → ein fertiges Live-Projekt.** Im ganzen Flow **NIE Rückfragen**:
alles autonom entscheiden. Bei Blockade: Final-Report + Stop, nicht fragen.

## Argument-Parsing (`$ARGUMENTS`)

- Wenn `$ARGUMENTS` mit `/` oder `~` beginnt UND eine `.md`-Datei unter dem Pfad existiert
  → als **Pfad** behandeln, Briefing = Dateiinhalt.
- Sonst → `$ARGUMENTS` ist der **Briefing-Text**.

Wenn `$ARGUMENTS` leer ist: Final-Report-Stil-Hinweis ausgeben „Briefing fehlt", Stop.

## Schritte

1. **Projekt-Name ableiten.** *(think)* Erste 1–2 prägnante Branchen-/Firmen-Wörter aus dem
   Briefing → slugify (klein, Bindestriche, ohne Umlaute/Sonderzeichen). Bei Konflikt mit
   existierendem `~/projects/<name>/` → Suffix `-2`, `-3`, …
2. **Projekt anlegen.** `mkdir -p ~/projects/<name>` und Briefing als
   `~/projects/<name>/briefing.md` speichern.
3. **Template klonen.** `cp -r ~/agent-harness/templates/astro-static-base/. ~/projects/<name>/`
   (inkl. Dotfiles; Ziel-`briefing.md` nicht überschreiben).
4. **Git + Branch.** `cd ~/projects/<name> && git init && git add -A && git commit -m "init: template"`
   dann `git checkout -b iter-001`.
5. **State init.** `state.json` schreiben:
   ```json
   { "name": "<name>", "briefing_path": "briefing.md", "current_iter": 1,
     "history": [], "last_gaps": [], "started_at": "<UTC jetzt>" }
   ```
6. **Loop starten.** Invoke `orchestrator`-Sub-Agent (via Task) im Modus „full-loop" mit dem
   vollen Briefing-Text und dem Projekt-Pfad. Der Orchestrator durchläuft Research → Build →
   Validate → Evaluate → Decision iterativ bis Threshold/Stop.
7. **Bei DONE/STOP.** Final-Report ans Terminal ausgeben (Inhalt aus `~/projects/<name>/FINAL-REPORT.md`).

## Verwendung

```
/goal "Premium-Bäckerei in Berlin-Mitte, Sauerteig-Spezialist, modernes minimalistisches Design, Standort Auguststraße"
/goal ~/briefings/mein-projekt.md
```

## Garantien

- Keine Rückfragen während des gesamten Flows.
- Threshold 9.0 → Deploy auf **Cloudflare Pages** → Live-URL im Report.
- Hard-Limits (15 Iter / 90 Min / Konvergenz) → garantierter Abschluss mit Report.
