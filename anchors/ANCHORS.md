# Anker-Set für den paarweisen Visual-Judge

Eingefrorene Referenz-Screenshots für die Visual-Quality-Bewertung des evaluators
(siehe `research/TOOLCHAIN-2026-07.md` Abschnitt 5.3, Design-Arena-Methodik).
Der aktuelle Build wird nie absolut benotet, sondern paarweise gegen jeden Anker
verglichen: welches ist besser, warum, in einem Satz. Die Dateien sind eingefroren,
Änderungen nur mit bewusster Neu-Kalibrierung aller Noten.

Die Methode sieht 3 bis 5 Anker vor, die aus früheren, selbst benoteten Builds stammen.
Dieses Repository enthält einen davon (Note 8.0). Die übrigen Stufen werden pro
Installation aus eigenen Läufen ergänzt: Screenshot eines Builds einfrieren, Note und
Begründung hier eintragen. Nur Builds mit fiktiven Inhalten verwenden, keine Seiten realer Organisationen.
Fehlt das Anker-Set, markiert der evaluator das als `anchors_missing: true`.

Alle Anker sind Desktop-Shots (1440px), entweder Fold (1440x900) oder Full-Page. Beim
Paarvergleich immer den gleichartigen Shot des aktuellen Builds heranziehen (Fold gegen
Fold, Full gegen Full, notfalls Fold gegen den oberen Ausschnitt der Full-Page).

## Soll-Profil der Stufen

| Note | Profil |
|---|---|
| 6.0 | Handwerklich sauber, aber generischer Baukasten: Dark-Mode-Default, Gradient-Text im Hero, Pill-Buttons, symmetrisches 3er-Card-Grid mit Icon-Chips, keine eigene typografische Stimme. Entspricht dem Deckel des Distinctiveness-Malus. |
| 7.0 | Konsistente Farbwelt, klare Conversion-Elemente, ein eigenes Illustrations-Motiv. Struktur bleibt Template-typisch (gleichförmige Card-Grids, wenig typografische Spannung). |
| 8.0 | Erkennbar editoriale Handschrift, aber ein bekanntes Schema ohne echtes Signature-Element. |
| 9.0 | Eigenständige, konsequent durchgezogene Design-Sprache mit Signature-Element; der Fold trägt allein durch Typografie und Zurückhaltung. |

## Enthaltener Anker

### anchor-8.0-august-iter2.jpeg (Note 8.0)

Selbsttest-Build einer fiktiven Sauerteigbäckerei, Iteration 2, Full-Page Desktop
(Judge-Score der Iteration: visual_quality 8.7). Adresse und Telefonnummer sind
Platzhalter.

Erkennbar editoriale Handschrift: Serifen-Display mit Akzentwort, ruhige Papier-Palette,
nummerierte Stat-Zeile (36 h / 100 % / 6 / Bio), dunkles CTA-Band, viel diszipliniertes
Weiß. Es bleibt aber bei einem bekannten Editorial-Schema ohne echtes Signature-Element
und ohne Bildwelt (rein textuell), darum 8.0 statt 9.

## Interpolations-Regel

1. Vergleiche den aktuellen Build paarweise gegen JEDEN Anker (je Anker ein Urteil:
   besser, schlechter oder gleichwertig, mit je einem Begründungssatz).
2. Der Score liegt zwischen dem höchsten geschlagenen und dem niedrigsten
   ungeschlagenen Anker. Standardwert: Mitte des Intervalls.
   Beispiel: schlägt 6.0 und 7.0, verliert gegen 8.0 und 9.0, also Intervall 7.0 bis 8.0
   und Score 7.5. Knapp am ungeschlagenen Anker dran: oberes Drittel (7.7); klar über
   dem geschlagenen, aber weit unter dem nächsten: unteres Drittel (7.2).
3. "Gleichwertig" gegen einen Anker ergibt exakt dessen Note.
4. Ränder: schlechter als der niedrigste Anker ergibt 4.0 bis 5.9 nach Schwere (direkt
   begründen); besser als 9.0 ergibt 9.0 bis 9.5, über 9.5 nie ohne explizite Begründung,
   welche Qualität den 9.0-Anker konkret übertrifft.
5. Das Ranking muss konsistent sein (wer 8.0 schlägt, muss auch 7.0 und 6.0 schlagen).
   Bei Inkonsistenz Vergleiche wiederholen, nicht mitteln.
6. Der Distinctiveness-Malus aus dem design-system-Skill bleibt zusätzlich in Kraft:
   ein als generisch eingestufter Build wird auf max. 6.0 gedeckelt, unabhängig vom
   Anker-Ranking. Harte Checks (Kontrast, Overflow, A11y) bleiben Direktbewertung aus
   den deterministischen Gates.
