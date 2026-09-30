# Sweep: Methodik der besten AI-Site-Builder (Stand Juli 2026)

Recherche-Kanal: Methodik kommerzieller AI-Builder (v0, Lovable, Framer, Onlook, Superdesign), publizierte Patterns/Papers zu agentischem Webdesign (Screenshot-Judging, iterative visuelle Verfeinerung), Evaluations-Methodik, Skill-/Tool-Oekosystem. Abgeglichen gegen die bestehende Harness-Pipeline (researcher-design, design-system-architect mit Style-Tiles + Judge-Panel, code-writer, validator, evaluator mit 7-Dimensionen-Score, Skills design-system/frontend-design/a11y/seo/lighthouse, MCPs playwright/chrome-devtools/context7).

Kernbefund vorab: Die kommerziellen Builder liefern methodisch wenig Neues, das wir nicht schon haben (Design-Mode, Registry-Tokens, Wireframe-first). Die substanziellen, messbar belegten Fortschritte kommen aus der Forschung 2025/26 zu **bewerteten Screenshot-Feedback-Loops mit Backtracking**, **sektionsweiser statt ganzseitiger Evaluation** und **strengen Akzeptanzregeln fuer Revisionen**, plus aus zwei sehr konkreten Oekosystem-Werkzeugen (deterministische Anti-Slop-Detektoren, Token-Extraktion von Referenzseiten).

---

## 1. Methodik der kommerziellen Builder

### v0 (Vercel)
- Stack-Lock als Qualitaetshebel: Next.js + Tailwind + shadcn/ui. v0 ist auf die Default-Implementierungen trainiert; Abweichungen verschlechtern die Ergebnisse messbar. Qualitaet kommt hier aus **Verengung des Ausgaberaums**, nicht aus besserem Geschmack.
- **shadcn Registry als Token-Pipeline**: Ein "Registry" ist eine Distributionsspezifikation, die Design-System-Kontext (Komponenten, Blocks, Tokens als CSS-Variablen) an das Modell uebergibt. v0 generiert dann on-brand ohne manuelle Overrides. Quelle: https://v0.app/docs/design-systems
- Prompt-Methodik (offizieller Blog "How to prompt v0"): Drei-Komponenten-Struktur "Build [Produkt-Oberflaeche: Komponenten, Daten, Aktionen]. Used by [wer], in [Moment], to [Ziel]" plus explizite Constraints (Plattform, visueller Ton, Layout). Belegte Effekte: weniger Code (-152 Zeilen im Test), schnellere Generierung. Quelle: https://vercel.com/blog/how-to-prompt-v0
- Trennung "Prompts fuer Logik/Struktur, Design Mode fuer visuelle Tweaks": direkte Element-Manipulation statt Re-Generierung fuer Farb-/Spacing-Aenderungen.

Uebertragbar: Die Registry-Idee ist bei uns funktional durch site.ts + @theme-Tokens abgedeckt. Der interessante Rest ist die Prompt-Struktur (Nutzer/Moment/Entscheidung als Pflichtfelder im Briefing), die unser researcher-design teilweise schon leistet.

### Lovable
- Full-Stack-Generator (React/TS/Tailwind/Supabase), Agent Mode mit autonomem Debugging. Design-Qualitaet laut unabhaengigen Reviews: "visuell akzeptabel fuer Prototypen", aber **kein zugrundeliegendes Design-System, zufaellige CSS-Klassen, nicht SEO-optimiert** (UI Bakery Deep-Dive). Methodisch fuer uns nichts zu holen; unsere Pipeline ist auf der Design-System-Ebene bereits weiter.

### Framer (Wireframer + Workshop)
- Interessantes Pattern: **Trennung von Informationsarchitektur und visueller Politur**. Wireframer generiert nur Struktur (Sektionen, Layout, Roh-Copy) und loest damit "den haertesten Teil", die IA. Workshop generiert danach Komponenten, die das Projekt-Design-System erben.
- Prompt-Doktrin: "Sag nicht, wo Dinge hingehoeren, sag, was die Seite erreichen muss."
- Uebertragbar: IA-first als expliziter Zwischenschritt (Wireframe-Artefakt vor dem Style-Pass) ist eine saubere Idee, aber unser Ablauf researcher-design -> design-system-architect -> code-writer deckt das implizit ab. Kein Kandidat, nur Bestaetigung der Phasentrennung.

### Onlook
- Open-Source "Cursor for Designers": Browser-Container (CodeSandbox SDK), instrumentiert DOM-Elemente und synct sie mit dem Quellcode; visuelles Editieren schreibt direkt in JSX/Tailwind zurueck. Native Agent-Architektur mit Checkpointing.
- Fuer eine headless CLI-Pipeline auf Windows wenig relevant (der Wert liegt im interaktiven Editor). Das Checkpointing-Konzept (jeder Agent-Schritt als wiederherstellbarer Zustand) taucht staerker und messbar belegt in WebGen-Agent wieder auf (siehe unten).

### Superdesign (open source, MIT)
- Design-Agent im IDE: **forkt mehrere Design-Richtungen parallel** ("premium enterprise polish" vs "bold high-contrast") und rendert komplette Page-Flows nebeneinander auf einem Canvas; Nutzer waehlt, Coding-Agent implementiert. Quelle: https://github.com/superdesigndev/superdesign
- Relevanz: Unser Style-Tiles + Judge-Panel macht die Variantenauswahl auf Tile-Ebene. Superdesigns Punkt ist, dass **komplette gerenderte Varianten** (mindestens Hero + eine Sektion) verglichen werden, nicht nur Tiles. Das ist Best-of-N auf Design-Ebene und passt zum Select-Best-Befund aus der Forschung.

---

## 2. Forschung: agentisches Webdesign mit visuellem Feedback

Das ist der ergiebigste Kanal. Vier Arbeiten mit direkt uebertragbaren, quantifizierten Mechanismen:

### WebGen-Agent (arXiv 2509.22644, Sept 2025)
Der wichtigste Einzelfund. Multi-Step-Agent mit zwei Feedback-Kanaelen pro Iteration:
1. **Screenshot-Feedback**: Ein VLM bewertet den gerenderten Stand mit Beschreibung, **Appearance-Score 0-5** (Kriterien: erfolgreiches Rendering, Content-Relevanz, Layout-Harmonie, Modernitaet, Schoenheit) und konkreten Verbesserungsvorschlaegen.
2. **GUI-Agent-Test**: Ein Agent bedient die Seite autonom, liefert Pass/Fail plus Funktions-Score 1-5.

Orchestrierungs-Mechanik:
- Pro Schritt Reward r = Screenshot-Score + GUI-Score.
- **Backtracking**: Nach 5 aufeinanderfolgenden Ausfuehrungsfehlern Ruecksprung zum bestbewerteten frueheren Schritt.
- **Select-Best**: Am Ende wird nicht der letzte, sondern der **bestbewertete** Schritt als Output wiederhergestellt. Begruendung der Autoren: spaetere Edits verschlechtern fruehere Qualitaet regelmaessig. Das deckt sich mit unserer Praxiserfahrung (Politur-Pass macht Hero kaputt).

Zahlen: Claude-3.5-Sonnet mit diesem Workflow 26.4% -> 51.9% Accuracy, Appearance 3.0 -> 3.9. Schlaegt OpenHands/Aider/Bolt.diy um 20+ Prozentpunkte. Validierung der VLM-Scores gegen Menschen: 93-96% (Screenshot), 89-93% (GUI). **Der komplette Workflow ist ohne RL-Training uebernehmbar; die Prompts fuer Screenshot-Beschreibung und GUI-Instruktionen sind veroeffentlicht.**
Quelle: https://arxiv.org/html/2509.22644v1

### ReLook (arXiv 2510.11498, Okt 2025)
RL-Framework mit MLLM-Kritiker als Tool. Der RL-Teil ist fuer uns irrelevant, zwei Regeln sind es nicht:
- **Zero-Reward-Regel**: Code, der keinen validen Screenshot produziert, bekommt automatisch Score 0. Verhindert, dass der Agent syntaktisch plausiblen, aber nicht rendernden Output als Fortschritt verbucht.
- **Strikte Akzeptanzregel**: Eine Revision wird nur angenommen, wenn sie den **bisher besten** Score der Trajektorie uebertrifft (nicht nur den letzten). Bis zu 10 Resamples pro Runde; ohne Verbesserung terminiert die Reflexion. Das ist eine direkt implementierbare Loop-Policy gegen Qualitaets-Oszillation.
- Screenshots werden zu drei Zeitpunkten genommen (post-load, +1s, +2s), um Animations-/Ladezustaende zu erfassen.
Quelle: https://arxiv.org/html/2510.11498

### WebGen-V Bench (arXiv 2510.15306, Okt 2025)
Kernthese mit starken Zahlen: **Ganzseiten-Screenshots sind ein schlechtes Evaluationssignal.** Stattdessen:
- Seite wird in Sektionen zerlegt (Hero, Pricing, Testimonials, Footer...), pro Sektion **Screenshot in Original-Aufloesung** plus strukturierte Metadaten (Texte als JSON, Bild-Assets mit semantischer Klassifikation, Style-Metadaten, Bounding-Boxes).
- Judge bewertet pro Sektion 9 Metriken in 3 Kategorien: Text (Accuracy, Placement, Readability), Media (Text-Bild-Zuordnung, Position, Groesse/Aspect), Layout (Overlap, Alignment-Konsistenz, Spacing-Konsistenz). Output pro Befund: Sektion, Metrik, Score 1-5, Begruendung, konkretes Refinement-Feedback.
- Refinement wird nur fuer Sektionen unter Schwellwert ausgeloest (lokalisierte Fixes statt Ganzseiten-Rewrite).
- Zahlen: Defekt-Erkennung F1 **0.78 vs 0.46** gegenueber unstrukturierter Ganzseiten-Evaluation (Layout-Defekte 0.90 vs 0.59). Ablation: Ganzseiten-Screenshots allein **verschlechtern** die Performance.
Quelle: https://arxiv.org/html/2510.15306v1

### ArtifactsBench (arXiv 2507.04952)
Automatisierte multimodale Evaluation von LLM-Web-Artefakten: Pipeline Code-Extraktion -> dynamisches Rendering + Capture (inkl. Interaktion) -> MLLM-Judge, **geleitet durch feingranulare, aufgabenspezifische Checklisten** statt generischer Rubrik. Ergebnis: >94% Korrelation mit menschlicher Praeferenz ueber 1.825 Tasks; Judge wurde vor Einsatz gegen menschliche Spot-Checks validiert (>90% Agreement). Lehre fuer uns: (a) pro Projekt eine konkrete Checkliste generieren, gegen die der Judge prueft, (b) den eigenen Judge einmalig gegen eigene menschliche Urteile kalibrieren.
Quellen: https://artifactsbenchmark.github.io/ , https://arxiv.org/html/2507.04952v2

Weitere, weniger zentral: WebGen-Bench (arXiv 2505.03733, MLLM-as-Judge mit 647 Testcases), "Coding with Eyes" (arXiv 2604.19750, visuelles Debugging von GUIs), "Vision-Guided Iterative Refinement" (arXiv 2604.05839). Alle bestaetigen dieselbe Richtung: gerenderte Wahrnehmung + strukturierte Kritik schlaegt Text-only-Iteration deutlich.

---

## 3. Evaluations-Methodik: absolut vs. paarweise, Checklisten

- **Design Arena** (designarena.ai, YC S25): groesstes Crowdsourcing-Benchmark fuer AI-Design. Methode: identischer Prompt an mehrere Modelle, anonyme Seite-an-Seite-Votes, Bradley-Terry/Elo-Aggregation. Stand Juli 2026 fuehren GLM-5.2 (1357), Claude Opus 4.6 (1338), Opus 4.7 Adaptive (1336) die Website-Kategorie an; die Spitze liegt eng beieinander. Fuer uns zweifach nutzbar: (a) Modellwahl-Referenz (Claude-Spitzenmodelle sind fuer den Visual-Pass konkurrenzfaehig, kein Modellwechsel noetig), (b) die **paarweise Methodik selbst**.
- LLM-as-Judge-Forschung (eugeneyan.com/writing/llm-evaluators, Confident AI, OpenReview uyX5Vnow3U): Fuer **subjektive** Qualitaeten (Aesthetik, Ton, Kohaerenz) sind paarweise Vergleiche stabiler und naeher an menschlichen Urteilen als absolute Skalen; absolute Scores sind anfaellig fuer Prompt-Varianz und Kalibrierungsdrift. Fuer objektive Checks (Kontrast, Overflow, A11y) bleibt Direktbewertung richtig. Einschraenkung (OpenReview): paarweise Protokolle sind manipulierbarer durch oberflaechliche Attribute; also paarweise nur fuer die Visual-/Distinctiveness-Dimension, nicht fuer harte Checks.
- Konsequenz fuer unseren evaluator: Die Visual-Quality-Dimension von "gib eine Note 1-10" auf "vergleiche paarweise gegen ein festes Anker-Set" umstellen. Anker-Set: 3-5 eingefrorene Screenshots bekannter Qualitaetsstufen (z.B. eine 6er-, eine 8er-, eine 9.5er-Referenz aus frueheren Builds oder kuratierten Vorbildern). Score ergibt sich aus der Position im Anker-Ranking. Das macht das 9.0-Gate reproduzierbar statt tagesformabhaengig.

---

## 4. Oekosystem: Skills und Tools (frei/guenstig, Windows-tauglich)

### Impeccable (pbakaus, open source)
Nachfolger-Upgrade zu Anthropics frontend-design-Skill, von Paul Bakaus (Ex-Google, jQuery-UI-Erfinder), ~36k Stars. Substanz statt Hype:
- **45 deterministische Detektor-Regeln** (maschinell pruefbar, kein LLM noetig) plus LLM-Critique-Checks fuer die bekannten AI-Tells: Inter ueberall, Purple-Gradients, Cards-in-Cards, Icon-Kachel ueber jeder Heading usw.
- **Zwei Register**: brand (Marketing, Portfolio, Editorial) vs product (App-UI, Dashboards) mit PRODUCT.md/DESIGN.md als Kontextdateien.
- 23 Design-Kommandos als gemeinsames Vokabular (polish, audit, critique, distill, bolder, quieter...), jedes Kommando laedt 7 Referenzdateien (Typo, Farbe, Motion, Spatial, Interaction, Responsive, UX-Writing).
- Ansatz: nicht Output nachtraeglich fixen, sondern dem Modell eine andere Referenzverteilung geben, damit Slop gar nicht erst entsteht.
Quellen: https://github.com/pbakaus/impeccable , https://impeccable.style/

### Anti-Slop-Kataloge
- Developers Digest "16 Patterns That Out Your App as Vibe-Coded": konkreter, aktueller Tell-Katalog (u.a. farbige Card-Border als "zuverlaessigstes AI-Tell", Badge ueber H1, Stat-Banner-Rows, Serif-Italic-Akzentwoerter, "VibeCode Purple"). Befund der "sauberen 46%": eigene Palette, Nicht-Inter-Typo, **ein** Layout-Primitiv konsequent wiederholt statt Stil-Mix. Quelle: https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it
- hallmark (Nutlope): weiterer Anti-Slop-Skill, https://github.com/nutlope/hallmark (duenner als Impeccable).
- 925studios "AI Slop Web Design Guide": erklaert das Grundproblem als "distributional convergence"; Typografie als schnellster Ausweg.

### Design-Grounding-Tools
- **dembrandt** (MIT, npm, Node 18+, laeuft auf Windows): `npx dembrandt <url>` extrahiert das komplette Design-System einer Live-Site aus DOM/CSSOM (nicht aus Screenshots): Farben inkl. CSS-Variablen und Gradients, Typo, Spacing-Skala, Radii, Shadows, Motion-Tokens, Breakpoints, Komponenten. Output u.a. als W3C-DTCG-JSON und als **DESIGN.md fuer AI-Agenten**. 2.1k Stars, v0.22.0 Juli 2026, aktiv gepflegt. Quelle: https://github.com/dembrandt/dembrandt
- Alternativen: extract-design-system (arvindrk, als Claude-Skill + CLI), DesignMD (designmd.cc, hosted).
- **awesome-design-md** (VoltAgent, 71k Stars): 57 fertige DESIGN.md-Dateien bekannter Marken (Stripe, Linear, Notion, Apple...). Vorsicht: als direkte Vorlage genau das Gegenteil von Distinctiveness (alle Nutzer konvergieren auf dieselben 57 Looks) und markenrechtlich heikel fuer echte Projekte. Nutzbar allenfalls als Format-Referenz dafuer, wie ein gutes maschinenlesbares Design-Spec aussieht. Quelle: https://github.com/VoltAgent/awesome-design-md

### Screenshot-Loop-Praxis (Community)
Die Claude-Code-Community konvergiert 2026 auf genau den Loop, den wir schon fahren (Playwright-MCP, Screenshot, Diff gegen Referenz, iterieren; "zwei Passes sind der Sweet Spot"). Kein Neuland fuer uns; Bestaetigung, dass die Basis stimmt. Quellen: aidesigner.ai/blog/claude-code-frontend-design, composio.dev/content/top-design-skills

---

## 5. Abgleich mit unserer Pipeline: Luecken

Bereits abgedeckt und konkurrenzfaehig: Style-Tiles + Judge-Panel (entspricht Superdesign-Varianten, nur frueher in der Pipeline), Distinctiveness-Rubrik mit Visual-Cap, 7-Dimensionen-Evaluator, Playwright/Lighthouse-Messung, Token-System via @theme, IA-Trennung ueber Agent-Phasen.

Echte Luecken, gemessen an Forschung + Oekosystem:
1. **Kein Score pro Iterationsschritt, kein Gedaechtnis ueber Schritte**: Unser Loop iteriert, aber vergleicht nicht systematisch gegen den besten frueheren Stand. WebGen-Agent/ReLook zeigen, dass Select-Best + strikte Akzeptanzregel den groessten Einzeleffekt haben.
2. **Evaluator arbeitet ganzseitig**: WebGen-V belegt, dass sektionsweise Screenshots + strukturierte Metadaten die Defekt-Erkennung fast verdoppeln (F1 0.78 vs 0.46) und Ganzseiten-Shots allein sogar schaden.
3. **Visual-Score ist absolut statt paarweise verankert**: Kalibrierungsdrift beim 9.0-Gate.
4. **Anti-Pattern-Pruefung ist LLM-only**: Impeccable zeigt, dass ein grosser Teil der Tells deterministisch aus DOM/CSS pruefbar ist (schnell, kostenlos, reproduzierbar). Unser validator koennte einen Slop-Lint bekommen.
5. **Design-Grounding aus Referenzseiten ist manuell**: dembrandt macht daraus einen Ein-Kommando-Schritt fuer researcher-design (Wettbewerber- und Vorbild-Tokens als strukturierte Fakten statt Screenshot-Eindruecke).
6. **Kein funktionaler GUI-Agent-Score**: Wir testen mit Playwright, aber nicht als bewertetes Feedback-Signal im Loop (Navigation, Links, Formulare, Mobile-Menue autonom bedienen und 1-5 scoren).

---

## 6. Adoption-Kandidaten (priorisiert)

### K1: Select-Best + Backtracking-Loop (WebGen-Agent-Mechanik)
Jeder Iterationsschritt des code-writer/Politur-Passes bekommt einen VLM-Appearance-Score (0-5, Kriterien aus dem Paper) plus Validator-Status; Snapshot (git commit oder Ordnerkopie) pro Schritt. Bei N Fehlschlaegen Ruecksprung zum besten Schritt; am Ende wird der bestbewertete, nicht der letzte Stand ausgeliefert. Aufwand: klein (Orchestrator-Logik + ein Judge-Prompt, Prompts sind publiziert). Messbarkeit: Paper zeigt +25pp Accuracy und +0.9 Appearance fuer ein Claude-Modell; bei uns direkt am Evaluator-Score vorher/nachher messbar.

### K2: Sektionsweise Evaluation (WebGen-V-Pattern)
Evaluator zerlegt die Seite per Playwright in Sektions-Screenshots in nativer Aufloesung (scrollIntoView + clip pro <section>), bewertet pro Sektion die 9 Metriken und gibt lokalisierte Fixes an den code-writer zurueck; Refinement nur fuer Sektionen unter Schwellwert. Aufwand: mittel (Screenshot-Zerlegung ist mit Playwright trivial, Judge-Prompt-Umbau). Messbarkeit: F1-Verdopplung bei Defekterkennung im Paper; bei uns weniger uebersehene Layout-Fehler pro Build.

### K3: Strikte Akzeptanzregel + Zero-Score (ReLook-Policy)
Loop-Policy: Revision wird nur uebernommen, wenn Score > bisheriges Maximum; nicht rendernder Code = Score 0; max. K Resamples, dann Terminierung. Screenshots zu 2-3 Zeitpunkten (Animations-Endzustand). Aufwand: sehr klein, reine Orchestrator-Regel. Verhindert Qualitaets-Oszillation und Endlos-Politur.

### K4: Deterministischer Anti-Slop-Lint (Impeccable-Detektoren)
Impeccable als Skill evaluieren bzw. die 45 deterministischen Detektor-Regeln als DOM/CSS-Checks in den validator uebernehmen (farbige Card-Border, Badge-ueber-H1, Inter/Standard-Font, Icon-Kachel-Grids, Purple-Gradient, Stat-Rows...). Ergaenzt um den 16-Tells-Katalog von Developers Digest als Update der design-system-Rubrik. Aufwand: klein bis mittel. Messbarkeit: Slop-Findings pro Build als Zaehlmetrik, reproduzierbar ohne LLM-Kosten.

### K5: Token-Extraktion von Referenzseiten (dembrandt)
`npx dembrandt <vorbild-url> --design-md` als Standardschritt im researcher-design: Wettbewerber- und Vorbild-Design-Systeme als DTCG-JSON/DESIGN.md, damit der design-system-architect gegen echte Token-Fakten differenziert ("Wettbewerber nutzen alle blau + Inter, wir gehen woandershin") statt gegen Screenshot-Eindruecke. MIT, npm, Windows-ok. Aufwand: sehr klein.

### K6: Paarweiser Visual-Judge mit Anker-Set (Design-Arena-Methodik)
Visual-Quality-Dimension des evaluators auf paarweise Vergleiche gegen 3-5 eingefrorene Anker-Screenshots umstellen (Bradley-Terry-artige Einordnung statt absoluter Note). Nur fuer subjektive Dimensionen; harte Checks bleiben direkt. Aufwand: klein. Effekt: stabileres, reproduzierbares 9.0-Gate; belegt durch LLM-Judge-Forschung (paarweise stabiler bei subjektiven Kriterien).

### K7: Aufgabenspezifische Judge-Checklisten + einmalige Human-Kalibrierung (ArtifactsBench)
Pro Projekt generiert der Orchestrator aus dem Briefing eine feingranulare Checkliste (Muss-Elemente, Interaktionen, Brand-Vorgaben), gegen die der MLLM-Judge prueft, statt nur gegen die generische Rubrik. Einmalig: 10-20 eigene Builds selbst benoten und gegen den Judge korrelieren, Schwellwerte danach justieren. Aufwand: mittel. Effekt: ArtifactsBench erreicht damit >94% Human-Korrelation.

Ausserdem pruefenswert, aber kein Top-Kandidat: GUI-Agent-Funktions-Score als zweiter Reward-Kanal (Teil von K1, mit vorhandenem Playwright-MCP umsetzbar); Superdesign-artiges Fan-out kompletter Hero-Varianten zusaetzlich zu Style-Tiles.

---

## 7. Verworfen (Hype oder fuer uns irrelevant)

- **Lovable-Methodik**: Kein Design-System unter der Haube, Qualitaet unter unserem Stand. Marketing-Volumen, methodisch nichts uebernehmbar.
- **awesome-design-md als Stil-Quelle**: 71k Stars, aber als Vorlage direkt distinctiveness-schaedlich (Konvergenz auf 57 bekannte Marken-Looks) und rechtlich heikel. Nur als Formatreferenz fuer DESIGN.md-Struktur.
- **Onlook fuer die Pipeline**: Wert liegt im interaktiven visuellen Editor, nicht in der headless-Automatisierung. Kein Fit fuer den Harness.
- **Modellwechsel Richtung GLM-5.2** wegen Design-Arena-Spitze: Abstand zu Claude Opus 4.6/4.7 liegt innerhalb weniger Elo-Punkte, Wechselkosten und Abo-Situation (Claude Max) sprechen dagegen.
- **shadcn-Registry-Uebernahme**: React/shadcn-spezifisch, unser Astro+@theme-Ansatz leistet das Aequivalent bereits.
- **RL-Training (Step-GRPO, ReLook-Training)**: Belegt wirksam, aber Trainings-Infrastruktur steht in keinem Verhaeltnis; die Inference-Time-Mechaniken (K1, K3) holen den uebertragbaren Teil ab.

---

## Quellen (Auswahl)

- WebGen-Agent: https://arxiv.org/html/2509.22644v1
- ReLook: https://arxiv.org/html/2510.11498
- WebGen-V Bench: https://arxiv.org/html/2510.15306v1
- ArtifactsBench: https://artifactsbenchmark.github.io/ , https://arxiv.org/html/2507.04952v2
- WebGen-Bench: https://arxiv.org/html/2505.03733v2
- Coding with Eyes: https://arxiv.org/html/2604.19750
- v0 Prompting: https://vercel.com/blog/how-to-prompt-v0 ; Design Systems/Registry: https://v0.app/docs/design-systems
- Framer Wireframer: https://www.framer.com/wireframer/ ; https://framer.university/blog/the-new-ai-workflow-for-building-websites
- Onlook: https://github.com/onlook-dev/onlook
- Superdesign: https://github.com/superdesigndev/superdesign
- Impeccable: https://github.com/pbakaus/impeccable ; https://impeccable.style/
- Anti-Slop 16 Tells: https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it
- AI-Slop-Guide: https://www.925studios.co/blog/ai-slop-web-design-guide
- dembrandt: https://github.com/dembrandt/dembrandt
- awesome-design-md: https://github.com/VoltAgent/awesome-design-md
- Design Arena: https://www.designarena.ai/ ; https://benchlm.ai/benchmarks/designArenaWebsite
- LLM-Judge pairwise vs pointwise: https://eugeneyan.com/writing/llm-evaluators/ ; https://openreview.net/forum?id=uyX5Vnow3U
- Lovable Deep-Dive: https://uibakery.io/blog/what-is-lovable-ai
- Skill-Oekosystem: https://composio.dev/content/top-design-skills
