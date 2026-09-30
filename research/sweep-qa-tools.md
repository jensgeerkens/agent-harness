# Sweep: QA- und Evaluations-Tooling für den Agent-Harness (Stand Juli 2026)

Recherche-Kanal: Qualitätssicherung, a11y-Testing, Lighthouse/Performance, Visual Regression, Browser-Automation-MCPs, HTML-Validierung, Link-Checking, CLS/LCP-Messung headless.
Kontext: Astro 6 + Tailwind v4, Cloudflare Pages, Windows 11, Claude Code. Vorhandene Pipeline: evaluator (7 Dimensionen via Lighthouse/Playwright), MCPs playwright + chrome-devtools + context7, Skills u. a. lighthouse-eval, a11y-wcag-aa.

---

## 1. Browser-Automation für agentische Site-Evaluation

### Kernbefund: Das Feld hat sich 2026 von MCP zu CLI+Skill verschoben

Die wichtigste Entwicklung des Halbjahres: **Microsoft hat Anfang 2026 `playwright-cli` als Companion zum Playwright-MCP-Server gelauncht**: ein token-effizienter CLI-Modus mit installierbaren Skills statt fetter Tool-Schemas. Gemessener Effekt: eine typische 10-Schritt-Browser-Aufgabe kostet **~27k Tokens via CLI vs. ~114k Tokens via MCP, also ~4x Reduktion** (Quelle: playwright.dev/docs/getting-started-cli, bestätigt durch unabhängigen Benchmark auf ytyng.com). Architektur: Per-Session-Daemon hält den Browser offen, Befehle sind kurze CLI-Aufrufe, Output ist kompakt.

Warum das für unseren Harness messbar relevant ist: Der evaluator verbrennt heute pro Seite große Mengen Kontext an Accessibility-Snapshots und Tool-Schemas. 4x weniger Tokens heißt konkret: mehr Seiten pro Eval-Lauf, mehr Iterationen im Build-Loop bevor der Kontext kippt, weniger Context-Rot bei Multi-Page-Sites. Das ist kein Hype, das ist ein offizielles Microsoft-Tool mit reproduzierbarem Benchmark.

Noch aggressiver: **agent-browser (Vercel Labs)**: natives Rust-CLI, Windows-x64-Binary, Accessibility-Snapshots mit Refs (@e1, @e2), **200-400 Tokens pro Seite** durch kompakte Ausgabe und `snapshot -i` (filtert auf interaktive Elemente). Install: `npm i -g agent-browser`, Claude-Code-Skill via `npx skills add vercel-labs/agent-browser`. Im ytyng-Benchmark der Token-Sieger; Playwright CLI war der Zuverlässigkeits-Sieger (präzise A11y-Tree-Refs). Empfehlung des Benchmarks: agent-browser als Default, Playwright CLI für komplexe Abläufe.

### playwright-mcp vs. chrome-devtools-mcp: klare Rollentrennung, kein Entweder-Oder

Konsens über mehrere unabhängige Quellen (Steve Kinney, mcp.directory, test-lab.ai):

- **Playwright MCP/CLI = Fahren.** Accessibility-Tree-Snapshots mit Refs, deterministisch, cross-browser, sauberer Clean-Room. Richtig für: Interaktions-Checks, Navigation, Screenshots, reproduzierbare Verifikation.
- **chrome-devtools-mcp = Debuggen/Messen.** Direkter CDP-Zugriff, `performance_start_trace` liefert LCP/CLS/INP aus echtem Trace, `performance_analyze_insight` erklärt Bottlenecks (welche Ressource blockte First Paint, welches Element shiftete). Nichts anderes exponiert CDP so direkt. Schwach für Interaktions-Workflows.

Unser bestehendes Dual-Setup ist also grundsätzlich richtig; der Hebel liegt im Umstieg der Playwright-Seite auf den CLI-Modus.

**browser-use / Stagehand / Vision-Agents:** Benchmarks 2026 zeigen DOM-getriebene Ansätze bei ~89-92% Zuverlässigkeit, Vision-getriebene (Computer Use, CUA) 75-78%. Für unseren Use-Case (bekannte, selbst gebaute Seiten, keine fremden UIs) gibt es keinen Grund für die Agent-Loop-Frameworks, sie lösen ein Problem (unbekannte, sich ändernde UIs), das wir nicht haben. **Keine Adoption.**

---

## 2. Accessibility-Testing

### Deque Axe MCP Server: paid, daher raus

Deques offizieller Axe MCP Server (analyze + remediate, mit Deque-University-Wissensbasis) klingt attraktiv, **setzt aber ein bezahltes Axe-DevTools-for-Web-Abo + API-Key + Docker voraus** (github.com/dequelabs/axe-mcp-server-public). Für unsere Zwecke bringt der Remediate-Teil wenig Mehrwert: Claude kennt die axe-Regeln, was fehlt ist der deterministische Scan, und den bekommt man kostenlos. **Keine Adoption.**

### Der kostenlose Weg: @axe-core/playwright als Script-Gate

`@axe-core/playwright` (MIT, offiziell von Deque, axe-core 4.11) läuft als normales Playwright-Script über jede Seite des dist-Builds: navigate → `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()` → Violations als JSON mit Selektoren, Severity, Fix-Hinweisen. Playwright dokumentiert das als offizielles Pattern (playwright.dev/docs/accessibility-testing).

Messbarer Vorteil gegenüber unserem heutigen Zustand: Der a11y-wcag-aa-Skill gibt Claude Wissen, aber kein deterministisches Messinstrument. Ein Script-Gate liefert eine harte, reproduzierbare Zahl (Violations pro Regel pro Seite), die der evaluator direkt in den Score einrechnen kann, ohne dass ein LLM den Seiteninhalt interpretiert. Kostet null Tokens im Scan selbst (nur das JSON-Ergebnis geht in den Kontext).

### pa11y-ci als Zweit-Engine

pa11y 9.1 (2026): Node 20/22/24, Puppeteer 24, axe-core 4.11 + HTML_CodeSniffer als pluggable Engines, Sitemap-Modus (`pa11y-ci --sitemap <url>`). Der empirische Kern (Craig Abbott / DWP Accessibility Manual): **axe und HTML_CodeSniffer finden je unterschiedliche Issues; kombiniert erwischt man ~35% der bekannten Probleme statt ~20-30% mit einer Engine.** Da wir axe schon via Playwright hätten, ist der Zusatznutzen von pa11y-ci konkret der HTML_CodeSniffer-Durchlauf (WCAG-Techniques-basiert, findet z. B. andere Kontrast- und Struktur-Fälle). Geringer Aufwand: eine npm-Dependency, ein JSON-Config, läuft gegen die Sitemap des Preview-Servers.

Skeptische Einordnung: Automatisierte Tools decken zusammen nur gut ein Drittel echter a11y-Probleme ab. Das Gate ersetzt nicht den Claude-Review (Fokus-Reihenfolge, sinnvolle Alt-Texte, Tastatur-UX), es macht nur die maschinenprüfbare Teilmenge deterministisch.

---

## 3. Performance: Lighthouse CI vs. chrome-devtools-MCP

Zwei komplementäre Werkzeuge, nicht Konkurrenten:

**@lhci/cli (Lighthouse CI, Google, ~2M Downloads/Monat, LHCI 0.15.x mit Lighthouse 12.6.1):**
- `staticDistDir: './dist'` → LHCI startet selbst einen Server über den Astro-Build, kein eigener Preview-Server nötig.
- `numberOfRuns: 3` → nimmt den **Median**, was das größte Problem unseres heutigen Setups adressiert: Einzel-Lighthouse-Läufe (auch via chrome-devtools-mcp) streuen stark, der 7-Dimensionen-Score bewertet also teilweise Rauschen.
- Assertions als deklarative Budgets (`categories:performance >= 0.95`, `cumulative-layout-shift <= 0.1`, Ressourcen-Größen) → hartes Pass/Fail ohne LLM-Interpretation, null Token-Kosten.
- Achtung: Lighthouse 13 braucht Node 22.19+ und wird von LHCI noch nicht unterstützt; PWA-Kategorie seit LH12 entfernt.

**chrome-devtools-mcp bleibt für die Diagnose-Phase:** Wenn LHCI ein Budget reißt, ist `performance_start_trace` + `performance_analyze_insight` der schnellste Weg, damit Claude versteht *warum* (LCP-Element, render-blocking Ressource, Shift-Verursacher). Der dokumentierte Agent-Workflow (Continue-Guide, Sitebulb-Guide) ist genau unser Loop: Trace → CWV lesen → Insight drillen → Fix.

**Unlighthouse (harlan-zw, MIT, Node >= 22.18):** `npx unlighthouse --site <url>` crawlt die ganze Site (robots.txt, sitemap.xml, interne Links), fährt Lighthouse parallel über alle Seiten, sampelt ähnliche Seiten, aggregiert in ein Dashboard/CI-Report (`unlighthouse-ci` mit Budget-Assertions). Für mehrsprachige Multi-Page-Sites (etwa 3 Sprachen x n Seiten) deutlich effizienter als seitenweise Einzelläufe. Overlap mit LHCI ist real; Entscheidungslogik: LHCI = präzises Budget-Gate mit Median-Läufen auf Kernseiten, Unlighthouse = Breiten-Scan über alle Seiten. Für den Harness reicht vermutlich eines von beiden; LHCI ist das robustere Gate, Unlighthouse der bessere Ganz-Site-Überblick.

---

## 4. Visual Regression

**Lost Pixel: Repo am 22. April 2026 archiviert, read-only.** Trotz MIT-Lizenz und guter Doku damit tot für Neuadoption. **Raus.**

**BackstopJS:** Ein Jahrzehnt Produktionsreife, guter Before/After-Scrubber im Report, aber: manuelle Szenario-Configs pro Seite, Puppeteer-basiert, kein Playwright-Ökosystem. Für einen Harness, der Sites generiert (also die Szenarien selbst schreiben müsste), reine Mehrarbeit gegenüber Playwright-eigenem Tooling. **Keine Adoption.**

**Playwright `toHaveScreenshot()`:** eingebaut, pixelmatch-basiert, Baselines im Repo. Bekannte Schwächen ab ~einem Dutzend Screenshots: Font-Rendering-False-Positives, OS-abhängige Baselines (Windows-Baseline ≠ CI-Linux-Baseline), kein Review-UI. Für unseren Use-Case ist die ehrliche Einschätzung: **Visual Regression löst ein Problem, das der Harness kaum hat.** Wir bauen Sites einmalig neu; es gibt keine lange Baseline-Historie zu schützen. Wo es nützt: (a) Selbst-Konsistenz innerhalb eines Build-Loops (hat der letzte Fix etwas anderes zerschossen?), (b) Pflege ausgelieferter Seiten nach der Übergabe. Dafür reicht `toHaveScreenshot` mit festen Fonts + `maxDiffPixelRatio`, ohne Zusatz-Tool. Neu in Playwright 2026 außerdem: `toMatchAriaSnapshot()` mit YAML-Dateien, strukturelle Regression (Semantik statt Pixel), robuster gegen Rendering-Rauschen und für den evaluator besser lesbar. Kein neues Tool nötig, nur Nutzung des vorhandenen.

---

## 5. HTML-Validierung und Link-Checking (heute komplett fehlende Gates)

**Nu Html Checker (vnu):** der W3C-Referenz-Validator, als vorkompiliertes Windows-Binary ohne Java verfügbar (vnu.jar bräuchte Java 17+). `vnu --skip-non-html --format json dist/` validiert den kompletten Astro-Output offline. Vergleich (Meiert, 2025/26): npm-Alternativen wie html-validate sind gut für Fragmente/Linting, aber **nicht auf Parität mit dem W3C-Validator** (optionale Tags falsch behandelt u. a.). Für ein Ganz-Dokument-Gate ist vnu der Standard. Astro kann durchaus invalides HTML emittieren (verschachtelte Komponenten, Slot-Fehler); heute prüft das niemand.

**lychee (Rust, MIT):** async Link-Checker, prüft Markdown + HTML + Websites, Windows-Binary via scoop/cargo/GitHub-Releases. 2026 mit überarbeiteter Rekursion (Host-Pool, Rate-Limiting pro Host). Findet tote interne Links (Astro-Routing-Fehler, umbenannte Slugs), kaputte Anker, tote externe Links vor dem Deploy. Alternative linkinator (npm, TypeScript) wäre im Node-Harness minimal einfacher zu integrieren, ist aber single-threaded und langsamer; lychee ist der robustere Standard und als ein Binary trivial installierbar.

Beide sind reine Exit-Code-Gates: null Token-Kosten, deterministisch, blitzschnell auf statischen Sites.

---

## 6. Empfohlenes Zielbild für den Harness

Deterministische Gates (Script-Layer, keine LLM-Beteiligung, laufen nach jedem Build):
1. `astro build` → **vnu** über dist/ (HTML valide)
2. **lychee** über dist/ + Preview-URL (keine toten Links)
3. **@axe-core/playwright**-Script über alle Seiten (WCAG-Violations = 0) + optional **pa11y-ci** (HTML_CodeSniffer-Zweitmeinung)
4. **@lhci/cli** mit staticDistDir, 3 Runs, Budget-Assertions (Perf >= 0.95, CLS <= 0.1, LCP-Budget)

Agentische Schicht (Token-Budget dort, wo Urteilskraft nötig ist):
5. **playwright-cli** (statt playwright-mcp) für Interaktions-Checks, Screenshots, Responsive-Durchgänge, 4x Token-Ersparnis; optional agent-browser für Snapshot-lastige Durchgänge
6. **chrome-devtools-mcp** nur noch als Diagnose-Werkzeug, wenn Gate 4 reißt (Trace → Insight → Fix)
7. Evaluator bewertet dann nur noch die Dimensionen, die Maschinen nicht können: Distinctiveness, Design-Qualität, Content, gefüttert mit den harten Zahlen aus 1-4 statt eigener Messversuche.

Effekt-These: Die 7-Dimensionen-Scores werden reproduzierbarer (Median statt Einzellauf, Exit-Codes statt LLM-Ablesen), der Build-Loop bekommt hartes maschinelles Feedback fast sofort statt teurer MCP-Runden, und das Token-Budget wandert von Messen zu Designurteil.

## 7. Bewusst NICHT empfohlen

| Tool | Grund |
|---|---|
| Deque Axe MCP Server | Paid-Abo + Docker; Scan-Funktion kostenlos via @axe-core/playwright replizierbar |
| Lost Pixel | Repo April 2026 archiviert |
| BackstopJS | Reif, aber manuelle Szenario-Configs + Puppeteer; kein Mehrwert ggü. Playwright-Bordmitteln für unseren Use-Case |
| browser-use / Stagehand | Lösen "unbekannte fremde UIs"; unsere Seiten sind selbst gebaut, DOM-Refs via Playwright sind zuverlässiger (92% vs. 75-78% bei Vision) |
| html-validate als Haupt-Gate | Nicht auf W3C-Parität für Ganz-Dokumente; ok als Editor-Linter, vnu bleibt das Gate |
| puppeteer-mcp | Von chrome-devtools-mcp (gleiches CDP, offiziell vom Chrome-Team) praktisch abgelöst |

## Quellen (Auswahl)

- https://playwright.dev/docs/getting-started-cli und https://github.com/microsoft/playwright-cli (playwright-cli, Token-Zahlen)
- https://www.ytyng.com/en/blog/ai-browser-automation-tools-comparison-2026 (Token-Benchmark playwright-cli vs. agent-browser vs. Claude in Chrome)
- https://github.com/vercel-labs/agent-browser (agent-browser, Windows x64)
- https://stevekinney.com/courses/self-testing-ai-agents/runtime-tools-compared und https://stevekinney.com/writing/driving-vs-debugging-the-browser (MCP-Rollentrennung)
- https://github.com/dequelabs/axe-mcp-server-public (Axe MCP = paid)
- https://playwright.dev/docs/accessibility-testing (@axe-core/playwright)
- https://accessibility-manual.dwp.gov.uk/best-practice/automated-testing-using-axe-core-and-pa11y und https://craigabbott.co.uk/blog/axe-core-vs-pa11y/ (Engine-Kombination ~35%)
- https://unlighthouse.dev/learn-lighthouse/lighthouse-ci und https://github.com/GoogleChrome/lighthouse-ci (LHCI, staticDistDir, Median-Runs, Versionsstand)
- https://unlighthouse.dev/ und https://github.com/harlan-zw/unlighthouse (Ganz-Site-Scan)
- https://docs.continue.dev/guides/chrome-devtools-mcp-performance und https://sitebulb.com/resources/guides/auditing-core-web-vitals-with-chrome-devtools-mcp/ (CWV-Trace-Workflow)
- https://github.com/lost-pixel/lost-pixel (archiviert 22.04.2026)
- https://lastest.cloud/blog/best-open-source-visual-regression-testing-playwright und https://playwright.dev/docs/test-snapshots (Visual-Regression-Lage)
- https://meiert.com/blog/html-validator-packages/ und https://github.com/validator/validator (vnu vs. npm-Validatoren)
- https://github.com/lycheeverse/lychee und https://endler.dev/2026/how-other-link-checkers-recurse/ (Link-Checker-Vergleich)
