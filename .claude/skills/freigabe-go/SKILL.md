---
name: freigabe-go
description: Treibt ein Projekt im Freigabe-Modus durch die Gates. Laeuft im MAIN-Loop (nicht als Subagent), delegiert via Task an Researcher, design-system-architect, code-writer, validator, evaluator. Jeder Aufruf gibt das aktuelle Gate frei und faehrt bis zum naechsten. GATE2=Design, GATE3=Deploy. Reuse der orchestrator.md-Loop-Mechanik.
disable-model-invocation: true
permissionMode: bypassPermissions
---

# /freigabe-go <slug>: Gate fuer Gate bis Live

**WICHTIG (Finding-A-Fix):** Dieses Skill laeuft im **Main-Loop** der Session, NICHT als
Subagent. Nur so funktioniert `Task` zum Spawnen der Leaf-Agents (ein Subagent kann keine
weiteren Subagents starten, genau daran scheiterte die alte orchestrator-als-Subagent-Kette).
Du, das Hauptmodell, BIST hier der Orchestrator. Lies `~/.claude/agents/orchestrator.md`
fuer die Loop-Mechanik (Branches, Retries, Decision, Commit) und wende sie an, ergaenzt
um die Gates und die Design-Phase unten.

## Arbeitsverzeichnis & Resume

`cd ~/projects/<slug>`. Lies `state.json` → `gates {briefing, design, deploy}` + `deploy_mode`.
**Jeder Aufruf gibt genau das aktuell offene Gate frei und faehrt bis zum naechsten Stop.**
Bestimme die Phase aus dem Gate-Zustand:

| gates.briefing | gates.design | gates.deploy | → diese Invocation macht |
|---|---|---|---|
| pending | pending | pending | **A) GATE 1 freigeben** → Research + Design → Stop an GATE 2 |
| approved | pending | pending | **B) GATE 2 freigeben** → Build-Loop bis ≥9.0 → Stop an GATE 3 |
| approved | approved | pending | **C) GATE 3 freigeben** → Deploy (je deploy_mode) → Handoff → DONE |
| approved | approved | approved | bereits fertig → Final-Report erneut ausgeben |

Setze das jeweilige Gate VOR Phasenbeginn auf `approved` und committe state.json.

---

## A) Research + Design  (nach GATE-1-Freigabe → Stop an GATE 2)

1. **Wall-Clock init** (falls `started_at` fehlt) und `mkdir -p research/iter-1 design-system`.
2. **Branch:** auf `iter-001` bleiben/auschecken.
3. **Research, 4 Researcher PARALLEL via Task** (alle in EINER Nachricht), mit dem vollen
   `briefing.md` + `briefing.json`:
   `researcher-design`, `researcher-industry`, `researcher-legal-dsgvo`, `researcher-tech-stack`.
   Jeder schreibt `research/iter-1/<domain>.md`. **Alle 4 MUESSEN fertig sein**, bevor es weitergeht.
4. **Design-Optionen, via Task an `design-system-architect`** mit `briefing.json` +
   `research/iter-1/design.md`. Output: **mehrere** Optionen unter
   `design-system/options/<A|B|C>/` (je `system.json` + `style-tile.html`) + `design-system/concept.md`.
5. **Style-Gallery aktualisieren:** `node ~/agent-harness/scripts/build-style-gallery.mjs`
   (sammelt alle Design-Entwuerfe aller Projekte → `~/projects/_style-gallery/index.html`).
   **Commit:** `git add -A && git commit -m "freigabe <slug>: research + design-optionen (GATE 2)"`.
6. **GATE 2, Stop (Design-Auswahl).** Setze `gates.design = pending`. Gib dem Operator die Optionen
   kompakt aus (je Option: Buchstabe, Konzept-Name in einem Satz, distinctiveness_claims) und
   verweise auf die **Style-Tiles** zum Ansehen (`design-system/options/<X>/style-tile.html`).
   Hinweis: „Option waehlen: **`/freigabe-go <slug> --design <A|B|C>`** kopiert die gewaehlte
   Option nach `design-system/system.json`, gibt GATE 2 frei und baut die Seite. (Einzelne
   Werte vorher editierbar.)" **Hier STOP.**

   Beim naechsten Aufruf mit `--design <X>`: `cp design-system/options/<X>/system.json
   design-system/system.json`, dann `node ~/agent-harness/scripts/build-style-gallery.mjs`
   (markiert die gewaehlte Option in der Galerie), dann weiter zu Phase B. Fehlt `--design`,
   frage einmal nach der Option (Operator-facing, Rueckfrage hier erlaubt) statt blind zu waehlen.

---

## B) Build-Loop  (nach GATE-2-Freigabe → Stop an GATE 3)

Jetzt der autonome Loop, **identisch zur orchestrator.md-Mechanik**, mit diesen Andockungen:

- **code-writer** bekommt zusaetzlich `design-system/system.json` als **verbindlichen** Input
  (Farben/Typo/Spacing/Signature 1:1 umsetzen) + die Gap-Liste der Vor-Iter. In Iter 001
  Marker **„think hard"**. Texte: erste Entwuerfe schreiben und im Code als
  `{/* TODO: fachlich bestaetigen */}` bzw. in `content-drafts/` kennzeichnen.
- **validator** wie gehabt (inkl. site.ts-First-Check #7).
- **evaluator** bekommt den Hinweis, das **`design-system`-Skill + `design-system/system.json`**
  zu laden und den **Distinctiveness-Malus** auf Visual Quality anzuwenden (generisch →
  visual_quality = min(.,6.0), `distinctiveness_capped:true`).
- **Decision (ultrathink)** wie orchestrator.md: `total ≥ 9.0` → Loop fertig (NICHT direkt
  deployen, erst GATE 3). `< 9.0` & innerhalb Limits → naechste Iter mit Gaps. Stagnation/
  15 Iter/90 Min → Stop mit Diagnose (dann GATE 3 mit „nicht abnahmefaehig"-Hinweis).
- Pro Iter committen + Mini-Status-Zeile (`Iter N: total=X.XX (Δ…) | top gap: …`).

Nach Loop-Ende:
- **Commit** + **GATE 3, Stop.** `gates.deploy = pending`. Gib dem Operator aus: erreichter Score,
  Top-Gaps falls < 9.0, und **lokale Vorschau** starten lassen (`npm run preview`) zum Ansehen.
  Hinweis: „Wenn ok: **`/freigabe-go <slug>`** gibt GATE 3 frei und deployed (je deploy_mode)."
  **Hier STOP.**

---

## C) Deploy + Handoff  (nach GATE-3-Freigabe → DONE)

1. **Default-Branch mergen:** `DEF=$(git show-ref --verify -q refs/heads/main && echo main || echo master)`;
   `git checkout $DEF && git merge --no-ff iter-N && git tag v0.N`.
2. **Deploy je `deploy_mode`:**
   - `auto` → `bash ~/agent-harness/scripts/deploy-pages.sh <slug>` → Live-URL `https://<slug>.pages.dev`
     (+ Custom-Domain-Hinweis).
   - `manual` → KEIN Push. Stattdessen: Build sicherstellen (`npm run build`), Hinweis auf
     `npm run preview` + „bereit fuer Deploy: `bash scripts/deploy-pages.sh <slug>` wenn gewuenscht".
3. **Handoff**: lade Skill **`handoff`** und folge ihm (HANDOFF.md fuer den Operator + laienverstaendliche
   Kurzfassung + FINAL-REPORT.md).
4. `gates.deploy = approved`, finalen Commit, **Final-Report ans Terminal** (Status
   `SHIPPED` / `READY-FOR-DEPLOY` / `STAGNATED`).

---

## Regeln (aus ARCHITECTURE.md, gelten weiter)

- Nie `main` direkt ueberschreiben (immer via Merge von verifiziertem `iter-N`).
- Nie Cloudflare Workers (immer Pages). Nie Google Fonts/Tracker ohne Consent.
- **Innerhalb einer Phase** (zwischen den Gates) laeuft der Loop autonom, KEINE Rueckfragen.
  An den Gates wird gestoppt, das ist der einzige Halt. Bei Blockade: Final-Report + Stop.
- Hard-Limits: 15 Iter / 90 Min / Konvergenz Δ<0.3 über 2 Iter.
