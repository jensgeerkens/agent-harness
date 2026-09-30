# Sweep: Claude-Code-Skills/Plugins-Ökosystem für Frontend/Design (Stand Juli 2026)

Recherche-Kanal: Skills, Plugins, Marketplaces. Frage: Was ist besser oder ergänzend zu unserer
Harness-Pipeline (researcher-design, design-system-architect + Style-Tiles + Judge-Panel, code-writer,
validator, evaluator mit 7-Dimensionen-Score; Skills astro-tailwind-static-site, design-system,
frontend-design, a11y-wcag-aa, seo-jsonld-sitemap, lighthouse-eval; MCPs playwright, chrome-devtools, context7)?

Methode: 5 WebSearch-Runden, 8 Quellen per WebFetch im Volltext gelesen (GitHub-Repos, kuratierte
Toolkits, Reviews). Skeptischer Filter: Star-Zahlen im Ökosystem sind teils aufgebläht (Klon-Repos,
KI-generierte "27 Agents, 50 Commands"-Bloat-Repos existieren), und ein zitierter Befund sagt,
dass ~36 % getesteter Community-Skills Prompt-Injection-Muster enthalten. Konsequenz: Jede
SKILL.md vor Installation lesen, nichts blind per Marketplace ziehen.

---

## 1. Ökosystem-Lage Juli 2026

- **Offizielles Anthropic-Skills-Repo** (`anthropics/skills`, ~158k Stars): 17 Skills, darunter
  frontend-design, web-artifacts-builder, canvas-design, theme-factory, brand-guidelines,
  algorithmic-art, webapp-testing, skill-creator.
- **Offizieller Plugin-Marketplace**: ~101 Plugins (Stand März 2026), 33 von Anthropic.
  `frontend-design` ist mit ~830.000 Installationen (Juni 2026) das populärste Design-Plugin.
- **skills.sh / `npx skills`** (Vercel Labs, `vercel-labs/skills`): hat sich als de-facto
  Paketmanager für Agent-Skills etabliert. `npx skills add <owner/repo>` installiert in
  `.claude/skills/` (bzw. `~/.agents/skills/` mit Symlinks, dort gab es Windows-relevante
  Symlink-Bugs, Issue #744, vor Nutzung prüfen). Unterstützt Claude Code, Cursor, Codex u. a.
  skills.sh ist zugleich Verzeichnis + Leaderboard.
- **Kuratierte Meta-Quelle**: `wilwaldon/Claude-Code-Frontend-Design-Toolkit` sammelt 70+ Tools
  in 10 Kategorien mit ehrlicher Bewertung ("what works fast vs. comprehensive vs. specialized").
  Beste Einzelquelle für diesen Kanal, lohnt als Bookmark/Abo.

**Token-Budget-Warnung aus dem Toolkit** (deckt sich mit unserer Erfahrung): MCPs kosten
Session-Kontext (Playwright ~5,3k, Chrome DevTools ~5-6k Tokens). Empfehlung dort: Skills
gegenüber MCPs bevorzugen, ungenutzte MCPs deaktivieren. Für unsere Pipeline heißt das:
neue Fähigkeiten möglichst als Skill, nicht als weiteren MCP.

---

## 2. Offizielle Anthropic-Skills: Bewertung gegen unsere Pipeline

| Skill | Was | Urteil |
|---|---|---|
| **frontend-design** | Aesthetik-Richtung vor Code, Anti-Slop-Regeln (kein Inter, keine lila Gradients) | **Haben wir schon.** Wichtig: Die internen Instruktionen wurden Feb 2026 neu geschrieben (explizite Verbotslisten für "von KI überstrapazierte" Fonts/Muster). Prüfen, ob unsere installierte Version aktuell ist: `claude plugin add anthropic/frontend-design` re-installieren. |
| **theme-factory** | 10 Preset-Themes (Farbpalette + Font-Pairing) für Artefakte/Slides/Landing-Pages | **Skip.** Presets widersprechen unserer Distinctiveness-Rubrik; genau das Baukasten-Muster, das unser evaluator abstraft. |
| **brand-guidelines** | Brand-Konsistenz-Enforcement | Nur relevant, wenn ein Projekt eine fertige CI mitbringt. Nice-to-know, kein Adoption-Kandidat. |
| **web-artifacts-builder** | React/shadcn-Artefakte für claude.ai | **Skip.** Falscher Stack (wir: Astro statisch, kein React-Runtime). |
| **canvas-design / algorithmic-art** | PDF/PNG-Kunst, generative Grafik | Randnutzen: könnte Hero-Grafiken/OG-Images liefern. Beobachten, kein Kandidat. |
| **webapp-testing** | Browser-Testing-Patterns | Überlappt mit unserem validator + Playwright-MCP. Skip. |

---

## 3. Community-Kandidaten im Detail (geprüft)

### 3.1 Impeccable (pbakaus/impeccable): stärkster Fund
- **Was**: "Design guidance for AI coding agents". 23 Kommandos (`/impeccable audit`, `polish`,
  `critique`, `bolder`, `quieter`, `typeset`, `colorize`, `layout`, `shape` …), dazu
  **45 deterministische Detector-Regeln** und ein **Design-Hook**, der bei jedem Edit von
  UI-Dateien Anti-Pattern-Detection fährt und Findings in den Agent-Loop zurückspielt.
  `init` schreibt PRODUCT.md + DESIGN.md als persistenten Design-Kontext. Live-Browser-Iteration.
- **Herkunft/Reife**: Paul Bakaus (jQuery-UI-Erfinder, Ex-Google-Chrome-DevRel), aus Anthropics
  frontend-design-Skill weiterentwickelt. Apache 2.0, ~43k Stars, Release 3.9.1 (01.07.2026),
  855 Commits. Explizit für "brand (marketing, landing, portfolio)"-Surfaces gebaut, also genau
  unser Anwendungsfall.
- **Install**: `npx impeccable install` (erkennt `~/.claude` bzw. Projekt-`.claude/`).
- **Warum besser als unser Selbstbau**: Unser evaluator ist ein LLM-Judge (stochastisch, teuer,
  läuft am Ende). Impeccables Detector-Regeln sind deterministisch und laufen als Hook zur
  Edit-Zeit: gequetschtes Padding, zu kleine Touch-Targets, übersprungene Heading-Ebenen,
  überstrapazierte Fonts werden gefangen, bevor der evaluator überhaupt läuft. Weniger
  Iterationsrunden bis Score ≥9.0 = direkt messbar.
- **Risiko**: 23 Kommandos sind viel Oberfläche; wir brauchen v. a. Hook + audit/polish/critique.
  Selektiv adoptieren, nicht den kompletten Workflow ersetzen.

### 3.2 UI/UX Pro Max (nextlevelbuilder/ui-ux-pro-max-skill)
- **Was**: Durchsuchbare Design-Datenbanken statt Prosa-Guidance: 67 UI-Styles, 161 Farbpaletten,
  57 Font-Pairings (Google Fonts), 161 branchenspezifische Reasoning-Regeln, 99 UX-Guidelines,
  25 Chart-Typen. BM25-Suche über Python-Skript (`scripts/search.py`), CSV-Datenbanken.
  v2.x: "Design System Generator", der aus Projektanforderungen ein Design-System ableitet.
  Verbietet explizit Inter/Roboto/Space Grotesk als "von KI überstrapaziert".
- **Reife**: MIT, ~101k Stars, v2.10.1 (04.07.2026), 28 Releases. Windows explizit unterstützt
  (winget-Python, keine Linux-Abhängigkeiten). Bekannte Macken: Symlink-Probleme vor v2.5.1,
  Feld-Trunkierung ohne `--max-length 0`.
- **Install**: `npm install -g ui-ux-pro-max-cli && uipro init --ai claude` oder
  `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` + `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`.
- **Warum ergänzend**: Unser design-system-architect erfindet Richtungen frei, mit dem Risiko,
  dass das Modell zu seinen statistischen Defaults konvergiert (genau was unsere
  Distinctiveness-Rubrik bestraft). Eine gegroundete Auswahl aus 161 Paletten/57 Pairings pro
  Branche gibt dem Style-Tile-Schritt konkretes, variantenreiches Rohmaterial. Nutzung als
  **Datenquelle für den Architekten**, nicht als Ersatz des Judge-Panels.
- **Skepsis**: Der "Design System Generator" selbst produziert Genre-Durchschnitt (Datenbank-
  Sameness statt KI-Sameness). Wert liegt in den Datenbanken, nicht im Generator.

### 3.3 Vercel Agent Skills: web-design-guidelines (vercel-labs/agent-skills)
- **Was**: 8 Skills; für uns relevant ist `web-design-guidelines`: 100+ Regeln zu Accessibility,
  Performance und UX (aria-labels, semantisches HTML, Keyboard-Handler …), framework-neutral.
  `react-best-practices` etc. sind Next.js/React-lastig und für uns irrelevant.
- **Reife**: ~28k Stars, aktiv, von Vercel Labs gepflegt.
- **Install**: `npx skills add vercel-labs/agent-skills` (selektiv nur web-design-guidelines).
- **Warum ergänzend**: Unser a11y-wcag-aa-Skill deckt WCAG ab; die Vercel-Liste ist breiter
  (UX-Details, Interaktionsmuster, Performance-Mikroregeln) und als kompakte Audit-Checkliste
  formuliert, gut als zusätzliche Regelquelle für den validator.

### 3.4 Addy Osmani: web-quality-skills (addyosmani/web-quality-skills)
- **Was**: Agent-Skills auf Basis Lighthouse + Core Web Vitals, gebaut mit Chrome-DevTools-Team-
  Wissen: CWV-Skill (LCP/INP/CLS-Diagnose + Fixes, Image-Preloading, Main-Thread, web-vitals-
  Feldmesse), Accessibility (WCAG), technisches SEO + Structured Data, Best Practices, plus ein
  Orchestrator-Skill (`web-quality-audit`) für Komplett-Audits. Framework-agnostisch.
- **Install**: `npx add-skill addyosmani/web-quality-skills` (bzw. `npx skills add`).
- **Warum ergänzend**: Überlappt mit unseren lighthouse-eval- und seo-Skills, aber Autorität
  (Chrome-Team) + laufende Pflege gegen Lighthouse-Änderungen, die wir selbst nachziehen müssten.
  Kandidat als Ersatz/Upgrade für lighthouse-eval-Innereien; A/B-Vergleich am evaluator-Score
  billig machbar.

### 3.5 StyleSeed (bitjaru/styleseed)
- **Was**: "Design engine": 74 kodifizierte Design-Urteils-Regeln in 6 Kategorien mit konkreten
  Zahlen ("refined black = #2A2A2A, nie #000", "Schatten ≤8 % Opacity", "eine Akzentfarbe,
  Rest Graustufen", "tabular numerals für Werte"), 7 Brand-Skins (Toss/Stripe/Linear/Notion/
  Raycast/Arc/Vercel als theme.css), benanntes Motion-System, 15 `/ss-*`-Skills, darunter
  **`/ss-score`** (UI-Rating 0-100 mit Kategorie-Breakdown) und `/ss-review`/`/ss-lint`.
- **Reife**: MIT, 644 Stars, v2.6.0 (02.07.2026), aktiv. Tailwind v4 ja, **Astro nicht
  dokumentiert** (Stack: React/Vite); die Regeln und theme.css-Variablen sind aber
  framework-neutral übertragbar.
- **Install**: `npx skills add bitjaru/styleseed`.
- **Warum ergänzend**: (a) Die 74 Regeln sind präziser/numerischer als unsere Rubrik und
  direkt in den design-system-Skill einarbeitbar. (b) `/ss-score` ist ein unabhängiger
  Zweit-Scorer neben unserem evaluator, Divergenz zwischen beiden ist ein Review-Signal.
- **Skepsis**: Brand-Skins = fertige Looks fremder Marken, für echte Projekte nur als
  Referenz, nie 1:1 (Distinctiveness!). Kleinste Community der Kandidaten.

### 3.6 awesome-claude-design (rohitg00/awesome-claude-design)
- **Was**: ~30 komplette DESIGN.md-Dateien realer Marken, nach Ästhetik-Familien organisiert
  (Editorial Minimalism, Terminal-Core, Warm Editorial, Data-Dense Pro, Cinematic Dark,
  Playful Color, Glass/Soft-Futurism, Neon Brutalist, Cult/Indie), je mit Farb-Swatches,
  Typo-Specs, Referenz-URLs und Preview-Screenshots. MIT, 821 Stars, entstanden zum Launch
  von Anthropics "Claude Design"-Produkt (April 2026).
- **Nutzung**: Kein Install, Repo klonen, DESIGN.md als Referenzkorpus.
- **Warum ergänzend**: Perfektes Kalibriermaterial für Style-Tiles und Judge-Panel: 9 benannte
  Ästhetik-Familien als gemeinsames Vokabular; researcher-design kann Briefings auf Familien
  mappen statt frei zu assoziieren. Kostenlos, null Risiko.

### 3.7 Skills-CLI / skills.sh (vercel-labs/skills)
- **Was**: `npx skills add <owner/repo>` als standardisierter Installations- und Update-Weg,
  Verzeichnis + Leaderboard auf skills.sh. Unterstützt globale (`-g`) und projektweise
  Installation, agent-spezifisch (`--agent claude-code`), CI-tauglich.
- **Warum adoptieren**: Wir verwalten Skills heute manuell. Der CLI macht Versionierung/Updates
  der externen Skills (Vercel, Osmani, StyleSeed) reproduzierbar. Windows-Symlink-Issue #744
  vorher prüfen; notfalls Kopie statt Symlink.

---

## 4. Geprüft, aber (noch) kein Kandidat

- **freshtechbro/claudedesignskills** (GSAP/ScrollTrigger, Three.js, Framer Motion; 22 Skills,
  Marketplace-Install): Motion ist real unsere schwächste Dimension und das kuratierte Toolkit
  nennt es "the biggest gap". ABER: Repo zeigt Bloat-Signale (27 Plugins, 50+ Commands,
  27+ Agents), es kursieren Klon-Repos, Substanz pro Skill nicht verifiziert. Empfehlung:
  nur die einzelne `gsap-scrolltrigger`-SKILL.md manuell lesen und ggf. destillieren,
  nicht den Marketplace installieren.
- **Taste Skill (Leonxlnx/taste-skill)**: 3 Regler (Varianz/Motion/Dichte). Nette Idee,
  aber dünn; die Funktion können unsere Briefing-Parameter selbst abdecken.
- **Bencium UX Designer**: 830 Zeilen A11y + 600 Zeilen Responsive-Patterns, Dual-Mode.
  Solide, aber redundant zu a11y-wcag-aa + frontend-design.
- **Designer Skills (Owl-Listener, 63 Skills)** und ähnliche Sammel-Repos: klassischer
  Quantitäts-Hype, keine Einzelqualität nachweisbar. Skip.
- **theme-factory, web-artifacts-builder, canvas-design** (offiziell): siehe Abschnitt 2, Skip.
- **CLAUDE.md-Theme-Blocks** (5-Zeilen-Presets wie "Dark OLED Luxury"): schnell, aber Preset-
  Ästhetik = Distinctiveness-Verstoß. Nur als Notbehelf für Wegwerf-Prototypen.
- **Figma MCP / Code to Canvas** (Feb 2026, bidirektional): stark, aber nur relevant, wenn
  ein Projekt Figma-Designs mitbringt. Merken, nicht installieren.

---

## 5. Gap-Analyse: unsere Pipeline vs. Ökosystem

| Dimension | Wir heute | Ökosystem-Antwort |
|---|---|---|
| Design-Richtung/Anti-Slop | frontend-design + design-system-Rubrik (LLM-Prosa) | Impeccable: deterministische Detector + Edit-Hook (früher im Loop) |
| Design-Rohmaterial | Architekt erfindet frei | UI/UX Pro Max: 161 Paletten / 57 Pairings / Branchen-Regeln als DB |
| Bewertung | 1 LLM-Judge-Panel + Lighthouse | + /ss-score (StyleSeed) als unabhängiger Zweit-Scorer; + Osmani-Audit-Orchestrator |
| A11y/UX-Regeln | a11y-wcag-aa | + Vercel web-design-guidelines (100+ Regeln, breiter als WCAG) |
| Perf/SEO | lighthouse-eval, seo-jsonld-sitemap | Osmani web-quality-skills als gepflegtes Upstream-Upgrade |
| Referenz-Ästhetiken | Style-Tiles ad hoc | awesome-claude-design: 9 Familien, 30 DESIGN.md als Vokabular |
| Motion | (Lücke) | freshtechbro gsap-scrolltrigger, nur destilliert übernehmen |
| Skill-Verwaltung | manuell | npx skills (Vercel) |

**Fazit**: Nichts im Ökosystem ersetzt die Pipeline als Ganzes; unser Orchestrierungs-Ansatz
(Style-Tiles + Judge-Panel + 7-Dimensionen-Evaluator) ist weiterhin über dem Marktstandard.
Die messbaren Hebel sind: (1) deterministische Checks früher im Loop (Impeccable-Hook),
(2) gegroundetes Design-Rohmaterial gegen Modell-Konvergenz (Pro-Max-Datenbanken),
(3) unabhängige Zweit-Scorer (ss-score, Osmani-Audit) zur Kalibrierung des eigenen Evaluators,
(4) gepflegte Upstream-Regelwerke statt selbst nachgezogener Lighthouse/WCAG-Details.
Alles kostenlos (MIT/Apache 2.0), alles Windows-tauglich (Pro Max braucht Python 3.x, vorhanden).

**Empfohlene Reihenfolge**: Impeccable (Hook + audit) → UI/UX Pro Max (nur DBs an Architekt
anbinden) → Vercel web-design-guidelines + Osmani (validator/evaluator-Regelquellen) →
StyleSeed-Regeln destillieren → awesome-claude-design als Korpus ablegen. Jede Adoption per
A/B am evaluator-Score verifizieren (gleiche Briefings, mit/ohne Skill).

---

## Quellen

- https://github.com/anthropics/skills (offizielle 17 Skills)
- https://github.com/anthropics/skills/tree/main/skills/frontend-design
- https://github.com/anthropics/skills/blob/main/skills/theme-factory/SKILL.md
- https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design
- https://claude.com/plugins/frontend-design (Install-Zahlen)
- https://github.com/wilwaldon/Claude-Code-Frontend-Design-Toolkit (kuratierte Meta-Quelle)
- https://github.com/pbakaus/impeccable
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/vercel-labs/agent-skills
- https://github.com/vercel-labs/skills (npx skills CLI) + https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem
- https://github.com/addyosmani/web-quality-skills
- https://github.com/bitjaru/styleseed
- https://github.com/rohitg00/awesome-claude-design
- https://github.com/freshtechbro/claudedesignskills
- https://pasqualepillitteri.it/en/news/576/claude-code-skills-design-uiux-guide (18er-Liste, Prompt-Injection-Warnung)
- https://buildtolaunch.substack.com/p/best-claude-code-plugins-tested-review (skeptischer Plugin-Test)
- https://composio.dev/content/top-claude-code-plugins
- https://thomas-wiegold.com/blog/claude-code-frontend-design-plugin/
