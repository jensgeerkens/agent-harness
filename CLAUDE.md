# CLAUDE.md: agent-harness

Wird bei jedem Session-Start aus dem Harness-Verzeichnis automatisch geladen.

## Pflichten

- **Bei jeder Hook-Änderung** muss `bash scripts/test-hooks.sh` vollständig grün bleiben.
- **Niemals exit 1 in einem Security-Hook.** Exit 1 ist non-blocking, das Modell sieht den
  Grund nicht. Entweder 0 (ok) oder 2 (Block, stderr geht ans Modell).
- **`/goal` und Sub-Loops laufen autonom mit `bypassPermissions`.** Bei Blockade keine
  Rückfrage stellen, sondern Final-Report schreiben und stoppen.
- **Keine echten Zugangsdaten im Repo.** `config/intake.json` ist gitignored, Vorlage ist
  `config/intake.example.json`.
- Vor Commits `npm test` laufen lassen (Unit-Tests + Hook-Suite).

## Stack-Anchors (nicht ändern ohne Versionssprung)

- Astro 6.3.6 exakt, neuere Patches ziehen rolldown-vite und brechen `@tailwindcss/vite`
- `@tailwindcss/vite` 4.3.0 exakt
- Cloudflare **Pages**, nie Workers
- site.ts-First: niemals harte Texte in `.astro`-Dateien

## Dokumentations-Karte

| Datei | Zweck |
|---|---|
| `README.md` | Überblick, Voraussetzungen, Aufruf, Grenzen |
| `ARCHITECTURE.md` | Topologie, Loop, Score-Formel, Hard-Limits, Hooks (§5b) |
| `FREIGABE-MODUS.md` | Freigabe-Modus `/freigabe`: Intake, Design-System, 3 Gates, Deploy-Schalter |
| `anchors/ANCHORS.md` | Kalibrierung des Visual-Judge |
| `research/TOOLCHAIN-2026-07.md` | Toolchain-Entscheidungen mit Begründung |
