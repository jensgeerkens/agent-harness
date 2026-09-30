---
name: iterate
description: Führt genau EINE Loop-Runde im aktuellen Zielprojekt aus (Research → Build → Validate → Evaluate), ohne Decision/Deploy. Für granulare Kontrolle.
disable-model-invocation: true
permissionMode: bypassPermissions
---

# /iterate: genau eine Loop-Runde

Führt im **aktuellen** Projekt (CWD muss ein `~/projects/<name>/` mit `state.json` sein) genau
eine Iteration aus, **ohne** die Decision/Deploy-Phase. Für manuelle Schritt-für-Schritt-Kontrolle.

## Schritte
1. `state.json` lesen → `current_iter = N`.
2. Branch `iter-N` anlegen/auschecken (Basis: `iter-(N-1)` oder initialer Commit).
   `mkdir -p research/iter-N evals/screenshots scores validation errors`.
3. Invoke `orchestrator` im Modus **„single-iter"**: er führt nur Phase 3–6 + 8–9 aus
   (Research → Build → Validate → Evaluate → Commit → Mini-Status), **überspringt** die
   Decision (kein Deploy, kein Auto-Weiter).
4. Score von `scores/iter-N.json` ausgeben, `current_iter` auf `N+1` erhöhen, `last_gaps` setzen.

## Output
`Iter N: total=X.XX (Δ+0.YY) | top gap: <severity> <action>`: danach Stopp.
Keine Rückfragen.
