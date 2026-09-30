#!/usr/bin/env bash
# check-sitets-first.sh: site.ts-First-Enforcement (Validator-Check #7)
#
# Flaggt hartkodierten, menschenlesbaren Text in der Markup-Region von
# src/pages/**/*.astro. Erlaubt ist ausschliesslich Text aus {...}-Ausdruecken
# (also site.ts-Felder, .map()-Renderings etc.).
#
# IGNORIERT (keine False-Positives):
#   - Frontmatter zwischen den ersten beiden ---  (Imports/TS leben hier)
#   - alles innerhalb von {...} (auch mehrzeilig, via Klammer-Tiefe)
#   - alle HTML-Tags <...> inkl. class-/href-/aria-Attributwerten (auch mehrzeilig)
#   - HTML-Kommentare <!-- ... --> (auch mehrzeilig)
#   - der GESAMTE Inhalt von <style>...</style> und <script>...</script>
#     (Tag + Inhalt, auch mehrzeilig): sonst wuerden CSS-Selektoren / JS-Bezeichner
#     wie 'main' oder '.card' faelschlich als hartkodierter Text geflaggt.
#   - reine Symbol-/Whitespace-Reste (—, ·, „", <br />: etc.)
#
# FAENGT: sichtbaren Elementtext wie >Leistungen<, Ueberschriften, Button-Labels,
#         und hartkodierten deutschen Text der in eine {...}-Zeile eingestreut ist
#         (z.B.  "{contact.note}: und das Rheinland.").
#
# Exit-Semantik (KEIN Security-Hook, normales CLI-Tool: exit 3 fuer Funde ist
# bewusst gewaehlt, damit es sich klar von Shell-Fehlern (1) und Nutzungsfehlern (2)
# unterscheidet und die exit-0/2-Regel der Security-Hooks unter scripts/hooks/ NICHT betrifft):
#   0  = sauber (keine Verstoesse)
#   3  = Verstoesse gefunden  (Findings nach stdout UND stderr, je Zeile: FILE:LINE: <text>)
#   2  = Nutzungs-/Umgebungsfehler (kein Argument, Verzeichnis fehlt)
#
# Aufruf:  scripts/check-sitets-first.sh <projekt-root>
#          scripts/check-sitets-first.sh <projekt-root> --json   # maschinenlesbar

set -u
export LC_ALL=C.UTF-8 2>/dev/null || true

ROOT="${1:-}"
JSON=0
[ "${2:-}" = "--json" ] && JSON=1

if [ -z "$ROOT" ] || [ ! -d "$ROOT" ]; then
  echo "usage: check-sitets-first.sh <projekt-root> [--json]" >&2
  exit 2
fi

PAGES_DIR="$ROOT/src/pages"
if [ ! -d "$PAGES_DIR" ]; then
  # Kein pages-Verzeichnis -> nichts zu pruefen, gilt als sauber.
  if [ "$JSON" -eq 1 ]; then echo '{"check":"sitets_first","status":"pass","violations":[]}'; fi
  exit 0
fi

# AWK macht das Heavy-Lifting: zustandsbehaftet ueber Frontmatter-Fence,
# Klammer-Tiefe ({...}), Tag-Tiefe (<...>), Kommentar-Zustand (<!-- -->) und
# <style>/<script>-Inhalt. Gibt je Verstoss eine Zeile  FILE\tLINE\tTEXT  aus.
run_awk() {
  awk '
  BEGIN { fm = 0 }            # fm: 0=vor FM, 1=in FM, 2=nach FM (Markup)
  FNR == 1 { fm = 0; depthBrace = 0; depthAngle = 0; inComment = 0; inSS = 0; ssTag = "" }

  {
    line = $0

    # --- Frontmatter-Fence (genau die ersten beiden --- auf eigener Zeile) ---
    if (fm < 2) {
      stripped = line
      gsub(/^[ \t]+|[ \t]+$/, "", stripped)
      if (stripped == "---") {
        fm = (fm == 0) ? 1 : 2
        next
      }
      if (fm == 1) next            # Zeile liegt im Frontmatter -> skip
      # fm==0 und keine Fence: Datei ohne Frontmatter -> behandle als Markup
      if (fm == 0) fm = 2
    }

    # --- zeichenweise Reduktion: entfernt {...}, <...>, <!-- -->, <style>/<script> ---
    out = ""
    n = length(line)
    i = 1
    while (i <= n) {
      c = substr(line, i, 1)

      # Innerhalb von <style>/<script>: alles verwerfen bis zum passenden Schluss-Tag.
      if (inSS) {
        rest = tolower(substr(line, i))
        closeTag = "</" ssTag
        pos = index(rest, closeTag)
        if (pos == 0) { i = n + 1; continue }   # ganzer Rest der Zeile liegt im Block
        # an "<" des Schluss-Tags springen, dann ueber "</tag" bis zum naechsten ">"
        i = i + pos - 1
        i = i + length(closeTag)
        while (i <= n && substr(line, i, 1) != ">") i++
        if (i <= n) i++                          # ">" konsumieren
        inSS = 0; ssTag = ""
        continue
      }

      if (inComment) {
        if (substr(line, i, 3) == "-->") { inComment = 0; i += 3; continue }
        i++; continue
      }
      if (depthBrace > 0) {
        if (c == "{") depthBrace++
        else if (c == "}") depthBrace--
        i++; continue
      }
      if (depthAngle > 0) {
        if (c == "<") depthAngle++          # verschachtelte/literale < innerhalb Tag tolerant
        else if (c == ">") depthAngle--
        i++; continue
      }

      # Start eines zu ignorierenden Spans?
      if (substr(line, i, 4) == "<!--") { inComment = 1; i += 4; continue }

      # <style ...> / <script ...> oeffnen?  (case-insensitive)
      lc6 = tolower(substr(line, i, 6))   # "<style"
      lc7 = tolower(substr(line, i, 7))   # "<script"
      if (lc6 == "<style") {
        inSS = 1; ssTag = "style"
        # bis zum Ende des oeffnenden Tags ">" vorspulen; Inhalt regelt naechste Iteration
        i += 6
        while (i <= n && substr(line, i, 1) != ">") i++
        if (i <= n) i++
        continue
      }
      if (lc7 == "<script") {
        inSS = 1; ssTag = "script"
        i += 7
        while (i <= n && substr(line, i, 1) != ">") i++
        if (i <= n) i++
        continue
      }

      if (c == "{") { depthBrace++; i++; continue }

      # "<" oeffnet nur dann ein Tag, wenn ihm [A-Za-z/!] folgt; sonst literaler Text
      # (z.B. "Preise < 100" wird nicht verschluckt).
      if (c == "<") {
        nx = substr(line, i + 1, 1)
        if (nx ~ /[A-Za-z\/!]/) { depthAngle++; i++; continue }
        out = out c; i++; continue
      }

      # Sichtbares Textzeichen (ausserhalb aller Spans)
      out = out c
      i++
    }

    # --- Bewertung des Rests ---
    # Hat der Rest einen Lauf von >=2 Buchstaben (ASCII + deutsche Umlaute)?
    # -> hartkodierter menschenlesbarer Text.
    if (out ~ /[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ]/) {
      gsub(/^[ \t]+|[ \t]+$/, "", out)
      printf "%s\t%d\t%s\n", FILENAME, FNR, out
    }
  }
  ' "$@"
}

# Alle .astro unter src/pages einsammeln (rekursiv).
mapfile -t FILES < <(find "$PAGES_DIR" -type f -name '*.astro' | sort)

if [ "${#FILES[@]}" -eq 0 ]; then
  if [ "$JSON" -eq 1 ]; then echo '{"check":"sitets_first","status":"pass","violations":[]}'; fi
  exit 0
fi

RESULTS="$(run_awk "${FILES[@]}")"

if [ -z "$RESULTS" ]; then
  if [ "$JSON" -eq 1 ]; then echo '{"check":"sitets_first","status":"pass","violations":[]}'; fi
  exit 0
fi

if [ "$JSON" -eq 1 ]; then
  # Minimaler JSON-Emitter (ohne jq-Abhaengigkeit).
  printf '{"check":"sitets_first","status":"fail","violations":['
  first=1
  while IFS=$'\t' read -r f l t; do
    # JSON-Escaping fuer text + relativen Pfad
    rel="${f#"$ROOT"/}"
    esc_t="${t//\\/\\\\}"; esc_t="${esc_t//\"/\\\"}"
    esc_f="${rel//\\/\\\\}"; esc_f="${esc_f//\"/\\\"}"
    [ $first -eq 1 ] || printf ','
    printf '{"file":"%s","line":%s,"text":"%s"}' "$esc_f" "$l" "$esc_t"
    first=0
  done <<< "$RESULTS"
  printf ']}\n'
else
  echo "site.ts-First-Verstoesse (hartkodierter Markup-Text):" >&2
  while IFS=$'\t' read -r f l t; do
    rel="${f#"$ROOT"/}"
    printf '%s:%s: %s\n' "$rel" "$l" "$t"
    printf '%s:%s: %s\n' "$rel" "$l" "$t" >&2
  done <<< "$RESULTS"
fi

exit 3
