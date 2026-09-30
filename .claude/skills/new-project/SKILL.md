---
name: new-project
description: Legt ein neues Zielprojekt an, Template klonen, Git initialisieren, state.json schreiben. Ohne Loop. Für granulare Kontrolle (danach /run-loop oder /iterate).
disable-model-invocation: true
permissionMode: bypassPermissions
---

# /new-project "<Briefing>": nur Projekt anlegen

Wie `/goal` Schritte 1–5, **ohne** den Loop zu starten. Danach manuell `/iterate` oder `/run-loop`.

## Argument-Parsing (`$ARGUMENTS`)
- Pfad (beginnt mit `/` oder `~`, `.md` existiert) → Briefing = Dateiinhalt.
- Sonst → Briefing-Text.

## Schritte
1. Projekt-Name aus Briefing ableiten (slugify, Konflikt → `-2`/`-3`).
2. `mkdir -p ~/projects/<name>`, Briefing als `briefing.md` speichern.
3. `cp -r ~/agent-harness/templates/astro-static-base/. ~/projects/<name>/`.
4. `cd ~/projects/<name> && git init && git add -A && git commit -m "init: template" && git checkout -b iter-001`.
5. `state.json`: `{ "name", "briefing_path": "briefing.md", "current_iter": 1, "history": [], "last_gaps": [], "started_at": "<UTC>" }`.
6. `npm install` (damit `/iterate` direkt bauen kann).

## Output
Eine Zeile: `Projekt <name> angelegt unter ~/projects/<name> (branch iter-001). Weiter mit /run-loop oder /iterate.`
Keine Rückfragen.
