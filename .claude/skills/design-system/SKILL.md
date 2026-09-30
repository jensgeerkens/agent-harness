---
name: design-system
description: Distinctiveness-Rubrik + Anti-Pattern-Katalog fuer eigenstaendige Web-Designs. Geladen von design-system-architect (Soll-Vorgabe) UND evaluator (Distinctiveness-Malus auf Visual Quality). Definiert, wann ein Design als generischer AI-Baukasten gilt und Visual auf max 6.0 gedeckelt wird.
---

# Design-System: Distinctiveness-Rubrik & Anti-Pattern-Katalog

Dieses Skill ist die **gemeinsame Quelle der Wahrheit** fuer „eigenstaendiges Design".
Der `design-system-architect` baut DAGEGEN (Soll), der `evaluator` prueft DAGEGEN (Ist).
So bewerten beide konsistent.

## Grundsatz

Eine professionelle Website ist nicht nur sauber, sie ist **unverwechselbar**. Technische
Perfektion ohne Eigenstaendigkeit = teurer Baukasten. Eigenstaendigkeit ist Abnahme-Kriterium,
nicht Kuer.

## Anti-Pattern-Katalog (generischer AI-Baukasten-Fingerprint)

Trifft eines oder mehrere dieser Muster sichtbar zu, gilt das Design als generisch:

1. **Default-Sans ohne Pairing**: Inter/system-ui als einzige Schrift, kein Display-Kontrast.
2. **Lila/Teal-Gradient-Hero**: der „AI-Startup"-Verlauf (indigo→teal/purple) als Held.
3. **Perfekt zentriertes 3er-Card-Grid**: drei gleich grosse Karten mit Icon-Titel-Text,
   mittig, als Haupt-Inhaltsmuster.
4. **Generische Stock-/Lucide-Iconografie** ohne eigene Linienfuehrung oder Konzeptbezug.
5. **Fehlendes Signature-Element**: nichts, das man wiedererkennt; alles ist „sauber-aber-beliebig".
6. **Symmetrie-Monotonie**: jede Sektion gleicher Rhythmus, alles zentriert, keine Spannung.
7. **Floskel-Headline**: „Sie haben eine Idee, wir setzen sie um" / „Ihr Partner fuer X"
   ohne konkrete, markeneigene Sprache.
8. **Akzent-Konfetti**: viele Farben/Verlaeufe statt eines disziplinierten Signaltons.

## Die 16 AI-Tells (Developers-Digest-Katalog, verbindlich)

Die zuverlaessigsten maschinellen wie visuellen Fingerabdruecke generierter Seiten. Trifft
einer sichtbar zu, ist es ein AI-Tell (mehrere → sicher generisch, Malus greift):

1. **Farbige Card-Border**: der zuverlaessigste AI-Tell. 1px Border in Akzentfarbe/Verlauf
   rund um Karten. Sauberes Design nutzt Flaeche, Schatten oder Hairline in Neutralton.
2. **Badge/Pill ueber der H1**: „✨ AI-Powered", „New", „v2.0"-Kapsel als erstes Element
   ueber der Headline. Fast immer generiert.
3. **Stat-Banner-Rows**: „10k+ Users · 99.9% Uptime · 24/7 Support" als 3-4-Spalten-Zahlenband,
   oft ohne echte Datengrundlage.
4. **Serif-Italic-Akzentwoerter**: einzelne Woerter mitten im Sans-Fliesstext in kursiver
   Serif als „Eleganz"-Signal. Aufgesetzt, ohne typografisches System.
5. **VibeCode Purple**: der Indigo/Violett-Default (`#6366f1`-Familie), meist als Gradient.
6. **Gradient-Text-Headline**: Verlauf per `background-clip:text` auf der H1.
7. **Emoji als Feature-Icons**: 🚀⚡🔒 statt eigener Iconsprache.
8. **Glassmorphism-Karten**: `backdrop-blur` + Halbtransparenz als Default-Deko ohne Konzept.
9. **Generisches 3er-Feature-Grid** mit Icon-Titel-Text, perfekt zentriert (= Katalog #3).
10. **Symmetrie-Monotonie**: jede Sektion gleicher zentrierter Rhythmus (= Katalog #6).
11. **Uebergrosse abgerundete Ecken ueberall**: `rounded-2xl`/`3xl` uniform auf allem.
12. **Default-Sans ohne Pairing**: Inter/Geist/system-ui solo (= Katalog #1).
13. **Dark-Hero-mit-Glow**: dunkler Hero + radialer Akzent-Glow/Spotlight hinter der Typo.
14. **„Trusted by"-Logo-Wall** aus Platzhalter-/generischen Logos ohne echte Referenzen.
15. **Floskel-Microcopy**: „Get started in seconds", „Ihr Partner fuer X" (= Katalog #7).
16. **Akzent-Konfetti / Regenbogen-Verlauf** statt eines Signaltons (= Katalog #8).

## Positiv-Muster (die „sauberen 46%")

Woran man ein NICHT-generiertes Design erkennt, mindestens diese drei:

- **Eigene Palette**: bewusst gewaehlte Farbwelt, nicht der Framework-Default.
- **Nicht-Inter-Typografie**: eine Schrift mit Charakter (Serif/Grotesk/Variable mit opsz),
  bewusst gepairt statt Default-Sans.
- **EIN Layout-Primitiv konsequent wiederholt** statt Stil-Mix, ein tragendes Struktur-Motiv
  (z.B. asymmetrisches Raster, durchlaufende Hairline-Spalten) ueber die ganze Seite, nicht
  drei verschiedene Karten-/Grid-Ideen nebeneinander.

## StyleSeed-Zahlenregeln (messbare Ergaenzung der Prosa-Rubrik)

Selektiv destilliert (App/Dashboard-Bias der Quelle ignoriert, kein `max-w-430px`, keine
KPI-Cards fuer Marketing-Sites). Diese Zahlen machen „Craft" pruefbar:

- **Refined Black statt reinem Schwarz:** Text-/Tiefton `#2A2A2A` (nie `#000`).
- **Schatten-Disziplin:** Schatten-Opacity **4–8%**, weich und tief statt hart und dunkel.
- **Card-Padding:** **24px** (kompakt) bis **32px** (grosszuegig), konsistent gehalten.
- **Tabular numerals** (`font-variant-numeric: tabular-nums`) fuer alle Zahlen/Preise/Stats,
  damit Ziffern in Spalten fluchten.

## Distinctiveness-Rubrik (Soll: was Eigenstaendigkeit ausmacht)

Ein eigenstaendiges System hat nachweisbar:

- **Ein tragendes Konzept**, das aus DIESER Marke kommt (nicht auf jede Branche uebertragbar).
- **Typo-Pairing mit Charakter**: Display + Body bewusst kontrastierend, selbst-gehostet.
- **Disziplinierte Farbe**: eine durchdachte Palette, Akzent sparsam als Signal.
- **Ein Signature-Element**: ein wiedererkennbares Detail (asymmetrisches Raster, Schnittkante,
  eigene Icon-Sprache, ungewoehnliche Marken-/Layout-Anordnung).
- **Rhythmische Spannung**: bewusster Wechsel von Dichte/Weite, nicht Symmetrie-Monotonie.
- **Markeneigene Sprache**: Headlines, die konkret und nur zu dieser Marke passen.

## Malus-Regel (fuer den evaluator: verbindlich)

Beim Bewerten von **Dimension 1 (Visual Quality)**:

1. Lies `design-system/system.json` → `distinctiveness_claims`.
2. Prüfe auf den Desktop- + Mobile-Screenshots: **Wurde jeder Claim im Rendering realisiert?**
   Und: **trifft ein Anti-Pattern aus dem Katalog oben sichtbar zu?**
3. Deckelung:
   ```
   if (anti_pattern_sichtbar) OR (mehrheit der distinctiveness_claims NICHT realisiert):
       visual_quality = min(visual_quality, 6.0)
       scores.dimensions.visual_quality.distinctiveness_capped = true
       notes += "DISTINCTIVENESS-MALUS: <welches Anti-Pattern / welche Claims fehlen>"
   ```
4. Bei Gewicht 0.20 zieht das den Total um ≥0.8, Score ≥9.0 ist ohne echte Eigenstaendigkeit
   praktisch unerreichbar. Das ist Absicht.

**Hart, nicht abgestuft:** Cap ist exakt 6.0 (bewusste Festlegung). Keine 7.5-Zwischenstufe:
generisch ist generisch.

## Anwendung im design-system-architect

Jede Design-Entscheidung muss einem Anti-Pattern aktiv ausweichen UND mindestens ein
Rubrik-Merkmal erfuellen. Das Feld `anti_patterns_avoided` in `system.json` dokumentiert das.
