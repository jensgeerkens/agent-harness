# /freigabe: Freigabe-Modus (halbautonom, 3 Gates)

Der Freigabe-Modus ergänzt den vollautonomen `/goal`-Loop um eine Anforderungserhebung per
Web-Fragebogen, ein projektspezifisches Design-System, drei menschliche Freigabe-Gates
(Briefing, Design, Deploy) und einen Deploy-Schalter. Gedacht für Projekte, bei denen ein
Mensch an festen Punkten entscheidet, statt den Loop komplett autonom laufen zu lassen.

## Überblick

```
/freigabe "<Worum geht es>" [--deploy auto|manual]
        │  legt Projekt an, generiert projektspezifischen Fragebogen als Web-Formular
        ▼
   intake/<slug>.html  ──►  an die fachliche Ansprechperson geben / auf der eigenen Domain hochladen
        │  Anforderer füllt aus → Formspree-Mail an die Betreiber-Adresse (`notify_email`)
        ▼  (Antworten in intake/responses.md speichern)
/freigabe-briefing <slug>
        │  Antworten → briefing.json + briefing.md, Konflikt-/Lücken-Check
        ▼  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  GATE 1: Operator gibt Briefing frei
/freigabe-go <slug>         (1. Aufruf: gibt GATE 1 frei)
        │  4 Researcher parallel → design-system-architect
        ▼  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  GATE 2: Operator gibt Design-System frei
/freigabe-go <slug>         (2. Aufruf: gibt GATE 2 frei)
        │  autonomer Loop: code-writer → validator → evaluator(+Malus) → decision  bis Score ≥ 9.0
        ▼  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  GATE 3: Operator gibt Deploy frei
/freigabe-go <slug>         (3. Aufruf: gibt GATE 3 frei)
        │  Deploy (je deploy_mode) → handoff → FINAL-REPORT
        ▼
   SHIPPED / READY-FOR-DEPLOY
```

**Jeder `/freigabe-go`-Aufruf gibt genau das aktuell offene Gate frei und fährt bis zum
nächsten.** Gesteuert über `state.json.gates {briefing, design, deploy}`.

## Die 6 Design-Entscheidungen (fixiert)

1. **Deploy-Schalter**: `--deploy manual` (Default, Stopp beim geprüften Build) oder `auto`.
2. **Web-Formular**, Antworten per **Formspree-Mail an die Betreiber-Adresse (`notify_email`)** (zentraler Renderer).
3. **Eigenständiges Design pro Projekt**: `design-system-architect` + `design-system`-Skill.
4. **3 harte Gates** (Briefing / Design / Deploy), blockierend, Freigabe nur durch den Operator.
5. **KI-Text-Entwurf, die fachliche Ansprechperson korrigiert**: Texte als `[zu bestätigen]` in `content-drafts/`.
6. **7-Dim-Score ≥ 9.0** (unverändert) **+ Distinctiveness-Malus**: generisches Design →
   Visual Quality max 6.0 → Score ≥ 9.0 ohne Eigenständigkeit unerreichbar.

## Neue Bausteine

| Datei | Zweck |
|---|---|
| `.claude/agents/design-system-architect.md` | Erzeugt `design-system/system.json` (eigenständig pro Projekt) |
| `.claude/skills/design-system/` | Distinctiveness-Rubrik + Anti-Pattern-Katalog (Architect **und** Evaluator) |
| `.claude/skills/intake-form/` | Generiert projektspezifischen Fragebogen → Web-Formular |
| `.claude/skills/freigabe/` | Einstieg: Projekt + Fragebogen |
| `.claude/skills/freigabe-briefing/` | Antworten → Briefing (GATE 1) |
| `.claude/skills/freigabe-go/` | Main-Loop-Orchestrator mit Gates (Finding-A-Fix) |
| `.claude/skills/handoff/` | Übergabe-Dokumentation (technisch + Kurzfassung) |
| `scripts/init-freigabe.sh` | Projekt mit gates + deploy_mode anlegen |
| `scripts/make-intake.mjs` | Frage-Set-JSON → versandfertiges `intake/<slug>.html` |
| `scripts/build-style-gallery.mjs` | Sammelt alle Design-Entwürfe aller Projekte → `~/projects/_style-gallery/index.html` (Live-Vorschau, „✓ gewählt") |
| `templates/intake/form-renderer.html` | Zentraler Formular-Renderer (eine Quelle) |
| `config/intake.example.json` | Vorlage für `config/intake.json` (gitignored): Formspree-ID, Mail-Ziel, Privacy-Hinweis |

## Wiederverwendet (unverändert bis auf Andockung)

`orchestrator` (Loop-Spec, jetzt im Main-Loop gefahren statt als Subagent), `code-writer`
(+ design-system als Input), `validator` (+ site.ts-First-Check #7), `evaluator`
(+ Distinctiveness-Malus), die 4 Researcher (`researcher-industry` + content-drafts).

## Einmal-Setup

1. **Formspree** (kostenlos): Formular anlegen, eigene Ziel-Mail hinterlegen, Form-ID kopieren.
   `config/intake.example.json` nach `config/intake.json` kopieren und `formspree_id` sowie
   `notify_email` eintragen. Die Datei ist gitignored, echte IDs landen so nicht im Repo.
2. Nach jeder Änderung an Agents/Skills: `bash scripts/sync-global.sh` + Claude-Code-Neustart.

## Finding-A-Fix (warum /freigabe-go im Main-Loop läuft)

Der alte `/goal`-Weg startete den `orchestrator` als Subagent via Task. Subagents können in
Claude Code **keine** weiteren Subagents spawnen → der orchestrator hätte nie an Researcher/
code-writer delegieren können. `/freigabe-go` läuft deshalb im **Main-Loop**: das Hauptmodell
ist der Orchestrator und kann `Task` für die Leaf-Agents nutzen. Belastbare Messungen statt
nur Heuristik.
