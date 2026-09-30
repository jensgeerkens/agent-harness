---
name: run-loop
description: Startet den vollautonomen Loop im aktuellen Zielprojekt bis Threshold 9.0, Konvergenz-Stagnation oder Hard-Limit. Setzt ein bereits angelegtes Projekt voraus.
disable-model-invocation: true
permissionMode: bypassPermissions
---

# /run-loop: autonomer Loop bis Threshold/Stop

Setzt ein bereits angelegtes Projekt voraus (CWD = `~/projects/<name>/` mit `state.json`).
Wie `/goal` ab Schritt 6, startet den Orchestrator im „full-loop"-Modus.

## Schritte
1. `state.json` lesen (Name, `current_iter`, `history`, `last_gaps`, `started_at`).
   Falls `started_at` fehlt: jetzt setzen (Wall-Clock-Basis).
2. Invoke `orchestrator` im Modus **„full-loop"** mit Briefing (`briefing.md`) + Projekt-Pfad.
   Iteriert Research → Build → Validate → Evaluate → **Decision** bis:
   - `total ≥ 9.0` → Deploy (Cloudflare Pages) → Merge → Tag `v0.N` → Final-Report → DONE.
   - Konvergenz-Stagnation / Iter ≥ 15 / Wall-Clock > 90 min → Final-Report → STOP.
3. Final-Report ans Terminal ausgeben.

## Garantien
- Keine Rückfragen. Garantierter Abschluss durch Hard-Limits. Resume-fähig (vorhandene
  `iter-N`-Branches werden ge-checkout-et, nicht überschrieben).
