# 🎯 Final Report: <projektname>

<!--
H1-Titel-Hinweis: Wenn Mess-Methode = HEURISTIK oder GEMISCHT, bekommt der H1 oben das
Präfix `[HEURISTISCHE SCORES]` und den Suffix ` (Scores sind Schätzwerte, kein
verifiziertes Lighthouse/axe)`. Quelle: `evals/iter-N.json` → `method`.
Beispiel: `# [HEURISTISCHE SCORES] 🎯 Final Report: <projektname> (Scores sind Schätzwerte, kein verifiziertes Lighthouse/axe)`
-->

## Ergebnis
- **Status:** SHIPPED / STAGNATED / TIMEOUT
- **Iterationen:** N
- **Final Score:** X.XX / 10.0
- **Mess-Methode:** GEMESSEN (Lighthouse + axe-core) / HEURISTIK (statische dist-Analyse, keine echten Tool-Zahlen) / GEMISCHT, Quelle: `evals/iter-N.json` → `method`
- **Live-URL:** https://<name>.pages.dev (nur bei SHIPPED)
- **Wall-Clock:** Xm Ys
- **Git Tag:** v0.N (nur bei SHIPPED)

## Score-Progression
| Iter | Total | Δ | Top-Gap (resolved) |
|------|-------|------|--------------------|
| 001  | 5.2   |,    | … |
| 002  | 7.1   | +1.9 | … |
| 003  | 8.7   | +1.6 | … |
| 004  | 9.2   | +0.5 | … |

## Dimensionen (final)

> Heuristisch geschätzte Dimensionen (keine echten Tool-Zahlen) MÜSSEN inline mit `[HEURISTIK]`
> markiert werden, z.B. `- Performance: X.X/10 (LCP Xs) [HEURISTIK]`.

- Visual Quality: X.X/10
- Conversion: X.X/10
- Performance: X.X/10 (LCP Xs)
- SEO: X.X/10
- Accessibility: X.X/10
- DSGVO: X.X/10
- Code-Quality: X.X/10

## Verbleibende Optimierungs-Empfehlungen (Phase 2)
- [Konkrete Action], geschätzter Impact: +0.X
- …

## Artefakte
- Code: ~/projects/<name>/ (main branch + iter-001..N branches)
- Research-Briefs: ~/projects/<name>/research/
- Eval-Reports: ~/projects/<name>/evals/
- Screenshots: ~/projects/<name>/evals/screenshots/
