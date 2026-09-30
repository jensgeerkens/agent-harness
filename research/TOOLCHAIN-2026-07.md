# TOOLCHAIN-Report Juli 2026: Was ist besser oder ergänzend zu unserem Stack?

Stand: 2026-07-05. Basis: 6 Recherche-Sweeps (`research/sweep-*.md`) plus adversariale
Verifikation von 20 Kandidaten (Existenz, Windows-Tauglichkeit, Kosten, Live-Tests auf dieser
Maschine). Kontext: Harness-Pipeline mit researcher-design, design-system-architect
(Style-Tiles + Judge-Panel), code-writer, validator, evaluator (7-Dimensionen-Score),
Skills (astro-tailwind-static-site, design-system, frontend-design, a11y-wcag-aa,
seo-jsonld-sitemap, lighthouse-eval), MCPs (playwright, chrome-devtools, context7).

---

## 1. Executive Summary: Wo stehen wir wirklich?

### Schon Stand der Technik (keine Baustelle)

- **Orchestrierung als Ganzes.** Kein kommerzieller Builder (v0, Lovable, Framer) und kein
  Community-Projekt ersetzt unsere Pipeline. Style-Tiles + Judge-Panel + Distinctiveness-Malus
  + 7-Dimensionen-Evaluator liegen über dem Marktstandard. Lovable hat unter der Haube kein
  Design-System, v0s Registry-Idee leisten wir mit site.ts + @theme bereits.
- **Screenshot-Feedback-Loop.** Die Claude-Code-Community konvergiert 2026 auf genau den
  Loop, den wir fahren (rendern, screenshotten, iterieren). Die Basis stimmt.
- **Modellwahl.** Design Arena (Juli 2026): Claude-Spitzenmodelle liegen mit GLM-5.2 innerhalb
  weniger Elo-Punkte gleichauf. Kein Modellwechsel nötig.
- **Rollentrennung der Browser-Tools.** Playwright zum Fahren, chrome-devtools zum
  Messen/Debuggen ist der 2026er-Konsens. Unser Dual-Setup ist richtig, nur die
  Playwright-Seite ist token-ineffizient (siehe 2.1).

### Ehrlich NICHT Stand der Technik (echte Lücken)

1. **Kein deterministisches Gate-Layer.** Wir haben null maschinelle Pass/Fail-Checks:
   kein HTML-Validator, kein Link-Checker, kein axe-Scan als harte Zahl, kein Anti-Slop-Lint.
   Alles läuft heute durch den LLM-Judge (stochastisch, teuer, spät im Loop). Das ist die
   größte und am billigsten schließbare Lücke.
2. **Loop ohne Gedächtnis.** Unser Iterations-Loop vergleicht nicht gegen den besten früheren
   Stand. Forschung (WebGen-Agent, ReLook) zeigt: Select-Best + strikte Akzeptanzregel sind
   der größte belegte Einzelhebel (+25pp Accuracy für ein Claude-Modell, ohne Training).
3. **Evaluator bewertet ganzseitig.** WebGen-V belegt mit F1 0.78 vs 0.46, dass sektionsweise
   Screenshots + strukturierte Metadaten die Defekterkennung fast verdoppeln, und dass
   Ganzseiten-Shots allein sogar schaden.
4. **Visual-Score absolut statt verankert.** Das 9.0-Gate ist tagesformabhängig
   (Kalibrierungsdrift des LLM-Judges). Paarweise Vergleiche gegen ein Anker-Set sind bei
   subjektiven Kriterien nachweislich stabiler.
5. **Token-Verbrauch der Browser-Schicht.** Playwright-MCP kostet ~114k Tokens pro
   10-Schritt-Task, der CLI-Skill-Modus ~26k (offizieller Microsoft-Benchmark, unabhängig
   bestätigt). Wir verbrennen Kontext fürs Messen statt fürs Designurteil.
6. **Design-Grounding ist Modell-Erinnerung.** researcher-design arbeitet ohne extrahierte
   Token-Fakten echter Referenzseiten. Werkzeuge dafür existieren (dembrandt, live getestet).
7. **Site-Breite unbeobachtet.** lighthouse-eval misst Einzelseiten; bei 3-Sprachen-Sites
   bleiben Ausreißer-Unterseiten unentdeckt.
8. **Asset-Pipeline hinkt Astro 6 hinterher** (nicht adversarial verifiziert, aber reine
   Config): Astro-6-Fonts-API (Subsets + metric-adjusted Fallbacks gegen CLS), stabile
   Responsive-Images-Defaults, AVIF-first, Build-Zeit-OG-Images via Satori fehlen im
   astro-tailwind-static-site-Skill.

Kernbotschaft: Nicht die Design-Intelligenz ist unsere Schwäche, sondern das Fehlen einer
deterministischen Mess-Schicht darunter und einer Loop-Policy darüber. Beides ist kostenlos
nachrüstbar.

---

## 2. Sofort-Adoptions (7 Stück, alle 0 EUR, alle Windows-verifiziert)

### 2.1 playwright-cli (Microsoft, Skill-Modus)

- **Was:** Drop-in-Ersatz des Playwright-MCP, ~4x weniger Tokens (Snapshots als YAML auf
  Platte statt im Kontext). v0.1.15, aktiv, Claude Code offiziell unterstützt.
- **Install:** `npm install -g @playwright/cli@latest && playwright-cli install --skills`
- **Einbau-Ort:** **evaluator** und **validator**. Beide Agent-Prompts anweisen, für
  Browser-Interaktion (Navigation, Screenshots, Responsive-Durchgänge) die playwright-cli-Skills
  statt der Playwright-MCP-Tools zu nutzen. Playwright-MCP bleibt vorerst parallel installiert
  (Fallback), chrome-devtools-MCP bleibt unverändert für Lighthouse/Traces.
- **Messgröße:** Kontext-Verbrauch pro Eval-Lauf, Zahl der Seiten pro Lauf vor Context-Rot.

### 2.2 @axe-core/playwright als deterministisches A11y-Gate

- **Was:** ~30 Zeilen Node-Script: AxeBuilder mit wcag2a/2aa/21a/21aa-Tags gegen alle
  dist-Seiten, Violations-JSON mit Selektoren, Exit-Code als Gate. MPL-2.0, v4.12.1, Deque.
- **Install:** `npm i -D @axe-core/playwright playwright` im Harness, Script nach
  `scripts/gates/axe-gate.mjs`.
- **Einbau-Ort:** **validator** ruft das Script nach jedem Build auf; Zero-Violations als
  hartes Gate. **evaluator** bekommt das Violations-JSON als Fakteninput statt selbst zu
  prüfen. Der a11y-wcag-aa-Skill bleibt für die nicht maschinenprüfbaren ~60-70%
  (Fokus-Reihenfolge, Alt-Text-Sinn, Tastatur-UX).

### 2.3 vnu (Nu Html Checker, W3C)

- **Was:** HTML-Konformitäts-Gate auf Parser-Ebene, empirisch auf dieser Maschine verifiziert
  (Windows-Zip mit embedded JRE, kein Java nötig, JSON-Output, Exit-Code).
- **Install:** Zip von validator/validator-Releases nach `C:\tools\vnu` entpacken.
- **Einbau-Ort:** **validator**, direkt nach `astro build`:
  `vnu-runtime-image\bin\vnu.bat --skip-non-html --format json dist\`. Im Gate nur
  type=error werten (Info/Warn-Rauschen per Filter raus).

### 2.4 lychee (Link-/Anker-Checker)

- **Was:** Rust-CLI, prüft tote interne Links und Anker im dist-Output. v0.24.2, aktiv.
- **Install:** `scoop install lychee` (alternativ winget/choco).
- **Einbau-Ort:** **validator**, Pre-Deploy-Gate:
  `lychee --offline --include-fragments "dist/**/*.html"`. Externe Links nur gelegentlich
  manuell (CI-Flakiness durch Host-Rate-Limits). Besonders wertvoll bei i18n-Slugs
  (mehrsprachige Sites).

### 2.5 Unlighthouse (Site-weiter Lighthouse-Scan)

- **Was:** Sitemap-Crawl + Lighthouse über alle Seiten, Score als Verteilung statt
  Einzelseiten-Stichprobe. MIT, v0.18.0, Node-Voraussetzung erfüllt (v24 lokal).
- **Install:** Keine, npx.
- **Einbau-Ort:** **evaluator**, als Breiten-Gate gegen `astro preview`:
  `npx unlighthouse-ci --site http://localhost:4321 --budget 90 --reporter jsonExpanded`.
  Der lighthouse-eval-Skill behält die Tiefen-Diagnose der Kernseiten (chrome-devtools-Trace),
  Unlighthouse findet die Ausreißer-Unterseiten.

### 2.6 Impeccable (nur Detector-CLI + Edit-Hook)

- **Was:** 45 deterministische Anti-Slop-Regeln (farbige Card-Border, Badge über H1,
  Font-Overuse, Touch-Targets, Heading-Sprünge) als Edit-Zeit-Hook + Standalone-CLI.
  Apache 2.0, 43.6k Stars, Release 01.07.2026, Windows-Bugs gefixt (Restrisiko: Issue #326).
- **Install:** `npx impeccable install`; Standalone: `npx impeccable detect --json dist/`.
- **Einbau-Ort:** Zweigleisig. (a) Edit-Hook in die Harness-`.claude/`-Config, damit Findings
  schon während der code-writer-Phase in den Loop zurückfließen. (b) `impeccable detect --json`
  als zusätzliches Gate im **validator**, Finding-Count als Zählmetrik in den Score.
  **Wichtig:** Die 23 Guidance-Kommandos und PRODUCT.md/DESIGN.md NICHT parallel zum
  vorhandenen frontend-design-Skill laden (Impeccable ist dessen Fork, Trigger-Kollision).
  Nach Install `bash scripts/test-hooks.sh` laufen lassen (50/50 muss grün bleiben).

### 2.7 StyleSeed (Regeln destillieren + /ss-score als Zweit-Scorer)

- **Was:** 74 numerische Design-Regeln (refined black #2A2A2A, Schatten 4-8% Opacity,
  Card-Padding 24/32px, tabular numerals) plus /ss-score als evidenzbasiertes
  100-Punkte-Abzugsmodell mit Zeilenzitat. MIT, v2.6.0, aktiv.
- **Install:** `npx skills add bitjaru/styleseed`.
- **Einbau-Ort:** (a) Die numerischen Regeln selektiv in den **design-system-Skill**
  einarbeiten (unsere Rubrik ist Prosa, StyleSeed liefert Zahlen). (b) `/ss-score` als
  unabhängigen Zweit-Scorer neben dem **evaluator** einhängen; Divergenz > 1.5 Punkte
  zwischen beiden Scorern = Review-Signal. **Ignorieren:** Brand-Skins (Toss/Linear/Stripe,
  Distinctiveness-Risiko) und React/Radix-Teile. App/Dashboard-Bias der Regeln beachten
  (max-w-430px, KPI-Cards passen nicht auf Marketing-Sites).

### 2.8 Skill-Updates ohne neues Tool (aus Asset-/Webtech-Sweep, nicht adversarial geprüft, reine Config)

Kein Fremd-Tool-Risiko, gehört in die eigenen Skills:

- **astro-tailwind-static-site-Skill:** Astro-6-Fonts-API statt Fontsource-Pattern
  (`subsets: ["latin"]`, Weight-Ranges, `optimizedFallbacks` gegen Font-Swap-CLS);
  `image.layout: 'constrained'` + `responsiveStyles: true`; `<Picture formats={['avif','webp']}>`
  mit sharp-Quality-Config (Fotos q60-75/effort 5-6, Grafik q80-85/4:4:4, mozjpeg-Fallback);
  Favicon-Minimal-Set (3-5 Dateien nach Evil-Martians-Muster) statt Generator.
- **Neues Skill-Pattern Satori-OG:** Build-Zeit-OG-Images (`og/[slug].png.ts` mit Satori +
  resvg-js), Template aus site.ts/@theme-Tokens, markenkonsistente Share-Bilder. Prüfpunkt
  im evaluator ergänzen (heute prüft niemand OG-Images).
- **Webtech-Baseline in den code-writer-Kontext:** Cross-document View Transitions,
  Speculation Rules (Astro `prefetch` + `experimental.clientPrerender`), CSS Scroll-driven
  Animations hinter `@supports`, `@starting-style`, Popover/Anchor, `text-wrap: balance/pretty`,
  Container Queries. Alles 0 kB JS, degradiert sauber.

---

## 3. Optionale Adoptions mit Trigger-Bedingung

| Kandidat | Was es brächte | Trigger für Adoption |
|---|---|---|
| **Claude Design + /design-sync** | Canvas-Varianten-Exploration VOR dem code-writer, Design-System-Roundtrip. Im Claude-Abo enthalten, aber Beta, quota-hungrig, Effekt unbelegt. | Pilot an EINEM kleinen Projekt (z.B. eine Unterseite): @theme/site.ts-Import-Drift prüfen und Erst-Pass-Visual-Score gegen Baseline messen. Nur bei nachgewiesenem Effekt fest in die Pipeline. |
| **dembrandt (CLI, ohne den toten MCP-Server)** | Token-Extraktion echter Referenzseiten (Farben, Typo, Spacing als DESIGN.md/DTCG-JSON) für researcher-design. Live getestet, 0 EUR. | Beim nächsten Projekt als Bash-Schritt in researcher-design einbauen (`dembrandt <url> --json-only`, lokal installiert, NICHT via npx wegen Browser-Mismatch). A/B: Distinctiveness-Score mit/ohne Grounding. |
| **Google Stitch MCP** | Fremd-Modell-Kandidat (Gemini) im Style-Tile-Wettbewerb, bricht Claude-Priors. | Nur wenn GCP-Billing-Hürde akzeptiert wird: zeitlich begrenztes A/B (1 Stitch-Kandidat pro Tile-Runde, Judge-Panel blind). Behalten nur bei messbar höherer Gewinner-Distinctiveness. Achtung: Paketname `@google/stitch-mcp` existiert nicht, realer Weg über inoffizielle Bridge `@_davideast/stitch-mcp`. |
| **@lhci/cli (Median-Runs + Budgets)** | Median aus 3 Läufen statt verrauschter Einzelläufe. Idee richtig, ABER: auf dieser Maschine 3x reproduziert kaputt (chrome-launcher EPERM, Upstream-Bug #355, jeder Run als failed gewertet). | Erst wenn der Attach-Workaround (Chrome manuell headless + `--collect.settings.port`) verifiziert ist. Pragmatische Alternative: eigenes ~50-Zeilen-Skript mit lighthouse-Node-API, 3 Läufe, Median, Budget-Check. Die IDEE (Median + Budgets) in jedem Fall übernehmen. |
| **agent-browser (Vercel)** | Noch aggressivere Token-Reduktion (~200-400/Snapshot) für snapshot-lastige Responsive-Checks. | Wenn nach playwright-cli-Umstieg der Eval-Loop weiterhin am Kontext-Limit kratzt (Multi-Page-Responsive-Durchgänge). In 10 Minuten nachrüstbar. |
| **pa11y-ci (HTML_CodeSniffer-Zweitmeinung)** | Kleiner Delta-Fund über axe hinaus, aber Engine seit 2021 unmaintained, kein WCAG 2.2. | Als nicht-blockierender Zusatz-Check, falls ein Projekt explizite A11y-Anforderungen hat (öffentliche Hand). Fehlschlag nie build-blockend. |
| **UI/UX Pro Max (NUR colors.csv)** | 161 branchenspezifische komplette Token-Paletten als Grounding für Style-Tiles. Font-DB dagegen kontraproduktiv (Inter 8x gelistet). | Wenn Style-Tile-Runden erkennbar zu Claude-Default-Paletten konvergieren: colors.csv + search.py an den design-system-architect anbinden, Rest (7 Skills, typography.csv) weglassen. |
| **web-design-guidelines (Vercel, gevendort)** | ~70-80 UX-/Perf-Mikroregeln über WCAG hinaus (Forms/autocomplete, compositor-freundliche Animation). | command.md als Snapshot vendoren (NICHT den Live-Fetch-Wrapper) und dem validator beilegen, wenn der nächste Validator-Umbau ansteht. |
| **web-quality-skills (Osmani)** | Tiefe bei INP-Phasen, Speculation Rules, Feldmessung. ~70% redundant zu unserem Stack. | Nur bei hartnäckigem CWV-Problem, das lighthouse-eval + chrome-devtools nicht knacken. |
| **Open Design (nexu-io, nur Repo-Clone)** | 100+ DESIGN.md-Referenzsysteme als Struktur-Vorbild für die eigene design-system-Skill-Sprache. | Beim nächsten design-system-Skill-Refactoring als Fundgrube klonen. Brand-Systeme NIE als Stilquelle (Trademark-Nachbauten ohne Disclaimer, Distinctiveness-Malus). |
| **Figma MCP (Remote)** | Code-to-Canvas als Stakeholder-Review-Kanal. | Erst wenn ein Stakeholder tatsächlich Figma nutzt oder Figma-Vorlagen liefert. In 5 Minuten nachrüstbar. |
| **Mobbin MCP** | Kuratierte echte Screens statt Modell-Erinnerung. Paid (ab ~10-16 USD/Monat), App-UI-lastig. | Erst wenn die Gratis-Inspiration-Route (WebSearch/WebFetch + dembrandt) nachweislich nicht reicht UND ein Projekt die Kosten rechtfertigt. |
| **awesome-claude-design** | 9 Ästhetik-Familien als Vokabular fürs Briefing-Mapping. Seit April 2026 tot, AI-Rekonstruktionen statt echter Specs. | Als Vokabular-Referenz klonen, wenn researcher-design ein Familien-Schema bekommen soll. Judges NICHT darauf ankern (Marken-Imitations-Risiko). |
| **subfont (Post-Build-Subsetting)** | Font-Bytes nochmal -50% nach der Fonts-API. | Nur wenn Lighthouse-Font-Bytes nach Fonts-API-Umstellung noch auffallen. |

---

## 4. Explizite NICHT-Adoptions (damit die Frage nicht jede Session neu aufkommt)

### Design-Tools / MCPs

- **21st.dev Magic MCP:** unmaintained seit Feb 2026, ungefixte Prompt-Injection-Lücke, React-only.
- **shadcn MCP / shadcn-Registry:** React-Komponenten-Ökosystem, Komponenten-Baukasten ist
  exakt unser Anti-Pattern; site.ts + @theme leisten das Registry-Äquivalent.
- **Stagewise:** kein Astro-Support, 20 EUR/Monat, eigener Agent statt Claude-Code-Anbindung.
- **Onlook:** Wert liegt im interaktiven React-Editor, kein Fit für headless CLI-Pipeline.
- **v0 (Vercel):** Credits-Paid, React/Next-Output, kein Astro-Pfad.
- **Builder.io Fusion:** Team-Bezahlprodukt, für Solo-Pipeline Overkill.
- **Framer MCP:** community-gepflegt, proprietäres Hosting, kollidiert mit Cloudflare Pages.
- **Magic Patterns MCP:** Paid-Pflicht, React-Fokus.
- **Superdesign (Vollversion):** Use-Case durch Claude Design im Claude-Abo abgedeckt; die
  Best-of-N-Idee übernehmen wir methodisch (siehe 5), nicht das Produkt.
- **Frontman / Tidewave:** zu früh bzw. Backend-orientiert. Beobachten, nicht adoptieren.
- **design-inspiration-mcp-server (YonasValentin):** Eintages-Projekt, tot; Such-Hälfte
  redundant zu WebSearch. Nur der Wertkern dembrandt wird (optional) genutzt.
- **awesome-design-md (VoltAgent):** 57 Marken-DESIGN.md als Stilquelle = Konvergenz auf
  bekannte Looks + markenrechtlich heikel. Höchstens Format-Referenz.

### Skills

- **theme-factory (Anthropic):** Preset-Themes widersprechen der Distinctiveness-Rubrik.
- **web-artifacts-builder, webapp-testing (Anthropic):** falscher Stack bzw. redundant.
- **freshtechbro/claudedesignskills:** Bloat-Signale (27 Agents, 50+ Commands), Substanz
  unverifiziert. Höchstens die gsap-scrolltrigger-SKILL.md einzeln lesen und destillieren.
- **Taste Skill, Bencium UX Designer, Owl-Listener-Sammelrepos:** dünn oder redundant.
- **CLAUDE.md-Theme-Blocks ("Dark OLED Luxury"):** Preset-Ästhetik, nur für Wegwerf-Prototypen.

### QA-Tools

- **Deque Axe MCP Server:** Paid-Abo + Docker; Scan kostenlos via @axe-core/playwright.
- **Lost Pixel:** Repo April 2026 archiviert.
- **BackstopJS:** manuelle Szenario-Configs, kein Mehrwert gegenüber Playwright-Bordmitteln.
- **Visual Regression generell als neues Tool:** löst ein Problem (Baseline-Historie), das
  ein Einmal-Build-Harness kaum hat. Wo nötig: eingebautes `toHaveScreenshot()` /
  `toMatchAriaSnapshot()`.
- **browser-use / Stagehand / Vision-Agents:** lösen "fremde unbekannte UIs" (75-78%
  Zuverlässigkeit); unsere selbstgebauten Seiten fahren wir mit DOM-Refs zuverlässiger (~92%).
- **html-validate als Haupt-Gate:** keine W3C-Parität, vnu bleibt das Gate.
- **puppeteer-mcp:** von chrome-devtools-mcp abgelöst.

### Assets / Webtech

- **@unpic/astro:** Placeholder funktionieren nicht für lokale Bilder, unser Hauptfall.
- **astro-favicons:** 71 Assets + 65 Tags = Generator-Bloat ohne Nutzen.
- **@playform/compress:** inkompatibel mit Astro 6; Astro minifiziert, Cloudflare komprimiert.
- **glyphhanger:** Python+Puppeteer-Gefummel, subfont macht dasselbe in Node.
- **Lenis Smooth-Scroll:** kollidiert mit CSS Scroll-driven Animations, Scroll-Hijacking
  ist für unsere Zielgruppen das falsche Signal.
- **three.js / Rive / Lottie / Houdini Paint Worklets:** Runtime-Kosten (60-500+ kB) für
  Akzent-Momente nicht amortisierbar bzw. Chromium-only. Signatur-Momente als Inline-SVG+CSS
  oder ein handgeschriebener WebGL2-Shader (<5 kB).
- **GSAP als Default:** seit 2025 zwar komplett kostenlos, aber 40-50 kB gzip; CSS-SDA deckt
  90% ab. Nur bei echtem SplitText-Bedarf (Zeilen-Choreografie), sonst Motion.dev mini (2.6 kB).

### Strategie

- **Modellwechsel Richtung GLM-5.2:** Elo-Abstand minimal, Wechselkosten dagegen.
- **RL-Training (Step-GRPO/ReLook-Training):** wirksam, aber Infrastruktur außer Verhältnis.
  Die Inference-Time-Mechaniken (Abschnitt 5) holen den übertragbaren Teil ab.

---

## 5. Methodik-Erkenntnisse (Kanal 5) und konkrete Prompt-Änderungen

Der ergiebigste Sweep. Vier quantifiziert belegte Mechanismen aus der 2025/26-Forschung,
alle ohne Training übernehmbar. Priorität in dieser Reihenfolge:

### 5.1 Select-Best + strikte Akzeptanzregel (WebGen-Agent + ReLook), Orchestrator + evaluator

Der größte belegte Einzelhebel (+25pp Accuracy, +0.9 Appearance für ein Claude-Modell).

**Orchestrator-Änderung (/goal-Loop, ARCHITECTURE.md §Loop):**
- Pro Iterationsschritt: Snapshot (git commit oder Ordnerkopie) + Score persistieren.
- Akzeptanzregel: Revision wird nur übernommen, wenn Score > bisheriges MAXIMUM der
  Trajektorie (nicht nur > letzter Score). Max. K Resamples (Vorschlag: 3), dann Terminierung.
- Backtracking: nach 5 aufeinanderfolgenden Build-/Render-Fehlern Rücksprung zum
  bestbewerteten früheren Schritt.
- Select-Best: Am Loop-Ende wird der BESTBEWERTETE Stand ausgeliefert, nicht der letzte.
  (Deckt sich mit unserer Praxiserfahrung: der Politur-Pass macht regelmäßig den Hero kaputt.)

**evaluator-Prompt, neuer Absatz (Zero-Reward-Regel):**
> "Wenn die Seite nicht baut oder der Screenshot leer/kaputt rendert, ist der Gesamt-Score
> dieses Schritts 0. Bewerte niemals Code-Plausibilität als Ersatz für gerenderten Output.
> Nimm Screenshots zu 2 Zeitpunkten (post-load und +2s), damit Animations-Endzustände
> erfasst sind."

### 5.2 Sektionsweise Evaluation (WebGen-V), evaluator

F1 der Defekterkennung 0.78 vs 0.46; Ganzseiten-Shots allein verschlechtern die Erkennung.

**evaluator-Prompt-Umbau:**
> "Bewerte NICHT anhand eines Ganzseiten-Screenshots. Zerlege die Seite per Playwright in
> Sektions-Screenshots in nativer Auflösung (scrollIntoView + clip pro <section>). Bewerte
> pro Sektion 9 Metriken in 3 Kategorien: Text (Accuracy, Placement, Readability), Media
> (Text-Bild-Zuordnung, Position, Größe/Aspect-Ratio), Layout (Overlap, Alignment-Konsistenz,
> Spacing-Konsistenz), je 1-5 mit Begründung. Output pro Befund: Sektion, Metrik, Score,
> konkretes Refinement-Feedback. Gib an den code-writer NUR die Sektionen unter Schwellwert
> (< 4) zurück, als lokalisierte Fixes, kein Ganzseiten-Rewrite."

### 5.3 Paarweiser Visual-Judge mit Anker-Set (Design-Arena-Methodik), evaluator

Absolute Skalen driften; paarweise Vergleiche sind bei subjektiven Kriterien stabiler.

**evaluator-Prompt, Visual-Quality-Dimension ersetzen:**
> "Bewerte Visual Quality und Distinctiveness nicht als absolute Note. Vergleiche den
> aktuellen Stand paarweise gegen das eingefrorene Anker-Set (anchors/: 3-5 Screenshots
> bekannter Qualitätsstufen, z.B. 6.0er-, 8.0er-, 9.5er-Referenz aus früheren Builds).
> Für jedes Anker-Paar: welches ist besser, warum, in einem Satz. Der Score ergibt sich
> aus der Position im Anker-Ranking (Interpolation zwischen den geschlagenen und den
> ungeschlagenen Ankern). Harte Checks (Kontrast, Overflow, A11y) bleiben Direktbewertung
> und kommen aus den deterministischen Gates."

**Einmalige Vorarbeit:** anchors/-Ordner mit 3-5 eingefrorenen Referenz-Screenshots anlegen
(aus alten Builds selbst benoten). Macht das 9.0-Gate reproduzierbar statt tagesformabhängig.

### 5.4 Projektspezifische Judge-Checklisten + Human-Kalibrierung (ArtifactsBench), Orchestrator + evaluator

>94% Human-Korrelation mit feingranularen Task-Checklisten statt generischer Rubrik.

**Orchestrator:** Nach dem Briefing eine Checkliste generieren (Muss-Elemente, Interaktionen,
Brand-Vorgaben, Sektionen) und dem evaluator als Pflicht-Prüfliste mitgeben.

**evaluator-Prompt-Zusatz:**
> "Prüfe zuerst die projektspezifische Checkliste Punkt für Punkt (erfüllt/nicht
> erfüllt/teilweise, mit Beleg-Screenshot-Referenz), DANN die generische Rubrik."

**Einmalig:** 10-20 eigene Builds selbst benoten, gegen Judge-Scores korrelieren,
Schwellwerte justieren.

### 5.5 design-system-architect: drei kleinere Prompt-Änderungen

1. **Briefing-Pflichtstruktur (v0-Muster):** Style-Tile-Prompts bekommen drei Pflichtfelder:
   "Genutzt von [wer], im Moment [wann/Kontext], um [Entscheidung/Ziel] zu erreichen."
   Belegt: präzisere, schlankere Outputs.
2. **Best-of-N auf Renderebene (Superdesign-Muster):** Nach der Tile-Entscheidung rendert
   der Gewinner-Kandidat mindestens Hero + eine Content-Sektion als echte Variante(n), bevor
   der code-writer die Vollseite baut. Judge-Panel entscheidet auf gerenderten Varianten,
   nicht nur auf Tiles.
3. **Anti-Slop-Katalog aktualisieren (design-system-Skill):** Die 16 Tells aus dem
   Developers-Digest-Katalog in die Distinctiveness-Rubrik einarbeiten (farbige Card-Border
   als zuverlässigstes AI-Tell, Badge über H1, Stat-Banner-Rows, Serif-Italic-Akzentwörter,
   "VibeCode Purple"). Positiv-Muster der "sauberen 46%": eigene Palette, Nicht-Inter-Typo,
   EIN Layout-Primitiv konsequent wiederholt statt Stil-Mix. Dazu die StyleSeed-Zahlenregeln
   aus 2.7.

### Zielbild des Loops nach Umbau

```
astro build
  -> Gates (deterministisch, 0 Tokens): vnu, lychee, axe, impeccable detect, unlighthouse-Budget
  -> evaluator (LLM, sektionsweise, Checkliste, paarweise Anker): nur noch Urteilskraft-Dimensionen
  -> Akzeptanz nur bei Score > bisheriges Maximum; Snapshot pro Schritt
  -> am Ende: Select-Best, nicht Last
```

Effekt-These, messbar am nächsten Projekt: reproduzierbarere Scores (Exit-Codes + Median statt
LLM-Ablesen), weniger übersehene Layout-Defekte (sektionsweise), stabileres 9.0-Gate (Anker),
weniger Iterationen bis Ziel-Score (Edit-Zeit-Detektoren + Select-Best), und das Token-Budget
wandert vom Messen zum Designurteil.

---

## Umsetzungsreihenfolge (Vorschlag)

1. Gates verdrahten (2.2-2.4 + Impeccable-Detect): ein Nachmittag, sofort wirksam.
2. Loop-Policy (5.1): reine Orchestrator-Logik, sehr klein.
3. playwright-cli-Umstieg (2.1) + Unlighthouse (2.5).
4. evaluator-Prompt-Umbau (5.2-5.4) + Anker-Set anlegen.
5. design-system-Skill-Update (5.5 + StyleSeed-Destillat) + astro-Skill-Update (2.8).
6. Optionale nach Trigger (Abschnitt 3), jeweils als A/B am evaluator-Score.

Jede Adoption per A/B verifizieren: gleiches Briefing, mit/ohne Änderung, Evaluator-Score
und Iterationszahl vergleichen. Ohne Messung keine dauerhafte Aufnahme in die Pipeline.
