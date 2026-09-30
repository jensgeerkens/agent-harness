---
name: status
description: Zeigt den aktuellen Score-State und die Iterations-Historie des aktuellen Zielprojekts. Read-only, kein Loop.
disable-model-invocation: true
permissionMode: bypassPermissions
---

# /status: Score-State & Historie

Read-only. CWD = `~/projects/<name>/` mit `state.json`.

## Schritte
1. `state.json` lesen → Name, `current_iter`, `started_at`, `last_gaps`.
2. Alle `scores/iter-*.json` einlesen → Progressions-Tabelle.
3. Git: aktueller Branch, vorhandene `iter-*`-Branches, Tags.

## Output
```
Projekt: <name>   |  Branch: iter-N  |  Wall-Clock: Xm
Iter | Total | Δ     | Top-Gap
001  | 5.2   |,     | <action>
002  | 7.1   | +1.9  | <action>
...
Offene Top-Gaps (letzte Iter):
- [high] <dimension>: <action>
- ...
Threshold 9.0: <erreicht? / Differenz>
```
Falls noch keine Scores: „Noch keine Iteration gelaufen." Keine Rückfragen.
