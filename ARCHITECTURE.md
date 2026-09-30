# Architektur: agent-harness

Vollständige Topologie, Loop-Mechanik, Score-Formel und Autonomie-Konfiguration.

---

## 1. Topologie

```
agent-harness/                            # global, wird nicht pro Projekt verändert
├── README.md  ARCHITECTURE.md  FREIGABE-MODUS.md  CLAUDE.md
├── .claude/
│   ├── settings.json                     # bypassPermissions, Retry, Hook-Registrierung
│   ├── agents/                           # 9 Sub-Agents
│   │   ├── orchestrator.md               #   Root, ultrathink bei Decisions
│   │   ├── researcher-design.md          #   think bei Synthese
│   │   ├── researcher-industry.md
│   │   ├── researcher-legal-dsgvo.md
│   │   ├── researcher-tech-stack.md
│   │   ├── design-system-architect.md    #   Design-Optionen + Style-Tiles (/freigabe)
│   │   ├── code-writer.md                #   think hard bei Iter-001-Architektur
│   │   ├── validator.md                  #   Build + deterministische Gate-Kette
│   │   └── evaluator.md                  #   ultrathink bei Score + Gap-Diagnose
│   └── skills/                           # 18 Skills
│       ├── goal/  new-project/  iterate/  run-loop/  status/  deploy-pages/
│       ├── freigabe/  freigabe-briefing/  freigabe-go/  intake-form/  handoff/
│       └── astro-tailwind-static-site/  content-collections-pattern/  design-system/
│           dsgvo-compliance/  seo-jsonld-sitemap/  a11y-wcag-aa/  lighthouse-eval/
├── anchors/                              # eingefrorene Referenz-Screenshots für den Visual-Judge
├── config/intake.example.json            # Vorlage für den Intake-Fragebogen
├── examples/                             # fiktives Briefing + Frage-Set
├── research/                             # Toolchain-Recherche mit Entscheidungsbegründung
├── templates/
│   ├── astro-static-base/                # generisches Basis-Template
│   ├── intake/form-renderer.html         # zentraler Formular-Renderer
│   └── docs/                             # 4 Doc-Templates
├── scripts/
│   ├── init-project.sh  init-freigabe.sh  new-iteration.sh  score-aggregator.js
│   ├── deploy-pages.sh  healthcheck.sh  sync-global.sh  check-sitets-first.sh
│   ├── make-intake.mjs  intake-antworten.mjs  build-style-gallery.mjs
│   ├── test-hooks.sh  test-make-intake.mjs  test-score-aggregator.mjs  test-intake-renderer.mjs
│   ├── gates/axe-gate.mjs                # axe-core gegen dist/ über lokalen Server
│   └── hooks/                            # siehe §5b
│       ├── pre-bash-guard.sh             #   PreToolUse: destruktive Befehle blocken
│       ├── post-edit-format.sh           #   PostToolUse: prettier --write
│       └── stop-trajectory.sh            #   Stop: Transcript sichern
└── .harness-state/                       # Laufzeitdaten, gitignored
    └── trajectories/                     # Stop-Hook-Output, INDEX.tsv

~/projects/<projektname>/                 # pro Ziel ein eigenes Repo
├── briefing.md
├── state.json                            # current_iter, history, last_gaps
├── src/ ...                              # die eigentliche Astro-Site
├── research/iter-N/<topic>.md
├── validation/iter-N.json
├── evals/iter-N.json   evals/screenshots/
├── scores/iter-N.json
├── errors/iter-N.log
└── FINAL-REPORT.md
```

---

## 2. Agenten-Rollen

| Agent | Modell | Reasoning | Aufgabe |
|---|---|---|---|
| `orchestrator` | opus | **ultrathink** (Decision, Gap-Prio) | Koordiniert den Loop, verwaltet Git-Iterationen + State, delegiert |
| `researcher-design` | sonnet | think | Design-/UI-Pattern-Recherche → Brief |
| `researcher-industry` | sonnet | default | Branchen-/Content-Recherche → Brief |
| `researcher-legal-dsgvo` | sonnet | default | Impressum/Datenschutz-Pflichten → Brief |
| `researcher-tech-stack` | sonnet | default | Astro/Tailwind/CF-Pages-API-Recherche (context7) → Brief |
| `design-system-architect` | opus | **think hard** | Leitet aus Briefing + Design-Research mehrere Design-Optionen mit Style-Tile ab (nur `/freigabe`) |
| `code-writer` | opus | **think hard** (Iter 001) | Implementiert Astro+Tailwind, site.ts-First |
| `validator` | sonnet | default | `npm run build`, `tsc --noEmit`, Routen-Check, Gate-Kette (vnu, lychee, axe, impeccable) |
| `evaluator` | opus | **ultrathink** | 7-dim-Score via Lighthouse + Playwright, Gap-Liste |

Bis zu 10 Agents parallel, die Researcher-Phase in Iter 001 nutzt das (4 parallel).

---

## 3. Loop

```
  /goal "<briefing>"
        │
        ▼
  ┌──────────────┐
  │  Goal-Skill  │  init project, klont template, schreibt state.json, git init iter-001
  └──────┬───────┘
         │
         ▼
  ┌─────────────┐
  │Orchestrator │ ◄──┐  ultrathink
  └──────┬──────┘    │
         ▼           │
  ┌──────────────┐   │
  │ Research     │   │  4 Researcher parallel (Iter 001) / nur Gap-Domains (Iter ≥ 2)
  │ research/    │   │
  └──────┬───────┘   │
         ▼           │
  ┌──────────────┐   │
  │ Code-Writer  │   │  think hard bei Iter 001
  │ src/         │   │
  └──────┬───────┘   │
         ▼           │
  ┌──────────────┐   │
  │ Validator    │   │  Gate-Kette (deterministisch, 0 Tokens): vnu · lychee · axe ·
  │  + Gates     │   │  impeccable detect · unlighthouse-Budget → JSONs. Build-/Gate-Fail
  └──┬────────┬──┘   │  → max 2 Retries an code-writer; 3. Fail → Score 0
 pass│      fail     │
     ▼               │
  ┌──────────────┐   │
  │ Evaluator    │   │  ultrathink → scores/iter-N.json (7 Dim, paarweise gegen anchors/,
  │  + StyleSeed │   │  + styleseed_review-Zweitmeinung) + evals/iter-N.json
  └──────┬───────┘   │
         ▼           │
  ┌──────────────┐   │  Akzeptanz: total > best_total ? → best_total/best_snapshot_ref updaten
  │ Decision     │   │  ultrathink (Select-Best)
  └──┬────┬────┬─┘   │
≥9.0 │ <9.0│   │stop │
     ▼    └───▶┘─────┘ (next iter mit aktualisierten Gaps)
  git checkout best_snapshot_ref → Deploy Pages   (bestbewerteter Stand, NICHT der letzte)
     │
     ▼
   Final-Report + Stop
```

### Decision-Logik (im Orchestrator, mit ultrathink: Select-Best)

Der Loop hat ein Gedächtnis über die beste bisherige Trajektorie (`state.json` führt `best_total`
+ `best_snapshot_ref`). Vor jeder Decision zuerst die **strikte Akzeptanzregel** prüfen:

- **Akzeptanz:** Ist `total > best_total` (bisheriges Trajektorien-Maximum, nicht nur letzter
  Score)? → neuer bester Stand: `best_total = total`, `best_snapshot_ref = iter-N`. Sonst bis zu
  3 Resamples auf denselben Gaps, dann terminieren/backtracken (5 Build-Fails in Folge →
  `git checkout best_snapshot_ref`).
- `best_total ≥ 9.0` → **Select-Best-Auslieferung**: `git checkout best_snapshot_ref` →
  `/deploy-pages` → merge → `main` → tag `v0.N` → Final-Report → **DONE**.
- `best_total < 9.0` UND `iter < 15` UND (`Δ ≥ 0.3` über letzte 2 Iter ODER `iter < 3`)
  → starte `iter-(N+1)` mit aktualisierten Gaps.
- Konvergenz-Stagnation (`Δ < 0.3` über 2 Iter) ODER `iter ≥ 15` ODER `Wall-Clock > 90 min`
  → `git checkout best_snapshot_ref` → Final-Report mit Diagnose → **STOP**.

**Ausgeliefert wird immer der bestbewertete Stand, nie automatisch der letzte** (der Politur-Pass
macht regelmäßig den Hero kaputt).

---

## 4. Score-Formel

`total = Σ(dim_score × weight)`, jede `dim_score ∈ [0.0, 10.0]`, ein Dezimal.

| # | Dimension | Gewicht | Messmethode |
|---|---|---|---|
| 1 | Visual Quality | 0.20 | Playwright-Screenshots (1440 + 390 px): Hierarchie, Whitespace, Typo-Skala, Wow-Faktor |
| 2 | Conversion | 0.20 | CTA above-the-fold, Tap-Target ≥ 44 px, Trust-Signale, persistenter Termin-CTA |
| 3 | Performance | 0.15 | LCP < 2.0 s = 10 / < 2.5 = 8 / < 4 = 5 / ≥ 4 = 0; CLS < 0.1 Pflicht; INP < 200 ms |
| 4 | SEO | 0.15 | Title/Meta je Seite, JSON-LD valide, Sitemap, Canonical, Robots, Viewport |
| 5 | Accessibility | 0.10 | axe-core: 0 Violations = 10 / ≤ 2 minor = 8 / ≤ 5 = 5 / > 5 = 0 |
| 6 | DSGVO | 0.10 | Impressum (§5 TMG), Datenschutz (Art. 13), keine externen Tracker/Fonts ohne Consent |
| 7 | Code-Quality | 0.10 | `tsc --noEmit` clean, kein `any`, Components < 150 LOC, site.ts-First |

Threshold zum Deploy: **9.0**.

---

## 5. Autonomie

### Schichten

1. **`.claude/settings.json`**: `permissionMode: bypassPermissions`, `autoCompact: true`,
   Retry-Policy (3 Versuche, exponential backoff), **Hooks** (siehe §5b).
2. **Sub-Agent-Frontmatter**: jeder Agent trägt `permissionMode: bypassPermissions`.
3. **Hard-Limits im Orchestrator** (siehe Tabelle).
4. **Hooks** (seit v0.2): deterministische Enforcement-Schicht, vom Modell nicht überspringbar.

### 5b. Hooks (seit v0.2)

Drei Hooks unter `scripts/hooks/`, registriert in `.claude/settings.json`. Sie laufen
ohne dass das Modell sie sehen oder umgehen kann. Begründung jedes einzelnen:

| Hook | Event | Matcher | Zweck |
|---|---|---|---|
| `pre-bash-guard.sh` | PreToolUse | `Bash` | Blockt `rm -rf` auf System-Pfade, `git push --force` auf main/master, `curl\|sh`, Fork-Bombs, globales pip/npm install. Exit 2 → Modell sieht den Grund. |
| `post-edit-format.sh` | PostToolUse | `Edit\|Write\|MultiEdit` | Formatiert TS/TSX/Astro/JS/CSS/JSON nach Edit mit projekt-lokalem Prettier. Spart Tokens (Format gehört nicht in LLM-Prompts). |
| `stop-trajectory.sh` | Stop | (keiner) | Persistiert das Session-Transcript als `iter-N.trajectory.<ts>.jsonl`. Goldmine für Debugging + Episodic Memory (v0.4). |

**Exit-Codes (Anthropic-Konvention):**
- `0` → ok, Tool/Stop läuft weiter
- `2` → BLOCK, stderr geht ans Modell zurück (Modell sieht den Grund und kann reagieren)
- `1, 3+` → non-blocking Warning, geht NICHT ans Modell

**Wirksamkeits-Voraussetzung:** Hooks greifen nur für Sessions, die `.claude/settings.json` des Harness laden, also bei Start aus dem Harness-Verzeichnis (`cd agent-harness && claude`). Von `init-project.sh` angelegte Zielprojekte bekommen eine eigene `.claude/settings.json`, die dieselben Hooks registriert. Bei Start aus einem anderen Verzeichnis ohne diese Settings greifen sie nicht (Settings werden CWD-basiert geladen).

**Erweitern:**
1. Neues Hook-Script unter `scripts/hooks/`, exit 0/2-Semantik beachten
2. In `.claude/settings.json` unter `hooks.<EventName>` registrieren
3. Smoke-Test mit `printf '%s' '<json>' | bash scripts/hooks/<name>.sh`

### Hard-Limits

| Limit | Wert | Verhalten beim Überschreiten |
|---|---|---|
| Iterationen / Projekt | 15 | Stop + Final-Report mit Diagnose |
| Validator-Retries / Iter | 2 | Abort Iter, gilt als Failed-Attempt (Score 0) |
| Tool-Call-Retries | 3 (backoff 1s/3s/10s) | Log in `errors/iter-N.log`, weiter |
| Konvergenz-Schwelle | Δ < 0.3 über 2 Iter | Stop + Report mit Empfehlung |
| Wall-Clock / Iter | 10 Min Soft-Cap | Warning, aber weiter |
| Wall-Clock gesamt | 90 Min Hard-Cap | Stop + Report |

**Niemals:** User-Confirmation während des Loops einholen. Kann der Loop nicht weiter:
Final-Report schreiben und stoppen, nicht fragen.

---

## 6. Harte Regeln (NIE verletzen)

- Nie existierende Branches überschreiben, immer neuer `iter-N`.
- Nie Cloudflare Workers, immer Pages.
- Nie interaktive CLI-Tools ohne non-interactive Workaround (`--yes`, Flags).
- Nie harte Texte in `.astro`: immer via `site.ts`.
- Nie Google Fonts / externe Tracker ohne Consent-Layer.
- Nie User-Input während Loop, bei Blockade: Final-Report + Stop.
- Windows/Git-Bash: `export MSYS_NO_PATHCONV=1` vor `curl`/`wrangler` mit Pfaden.
- Recherche vor Code: in Iter 001 müssen alle 4 Researcher gelaufen sein, bevor `code-writer` startet.
- Niemals Hooks-Scripts (`scripts/hooks/*.sh`) auf exit 1 setzen, entweder 0 (ok) oder 2 (block). Exit 1 ist eine non-blocking Warning, die das Modell NICHT sieht.
