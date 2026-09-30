#!/usr/bin/env node
/**
 * intake-antworten.mjs, macht aus einer Formspree-Einsendung ein lesbares Dokument.
 *
 * Die Mail von Formspree listet nur Feldnamen und Werte ("gebiet__orte: …"). Dieses
 * Skript legt das Frage-Set daneben und schreibt Frage, Antwort und Freitext-Ergaenzung
 * untereinander, in der Reihenfolge des Fragebogens. Unbeantwortete Pflichtfragen
 * werden markiert, damit man beim Nachfassen nichts uebersieht.
 *
 * Usage: node intake-antworten.mjs <frage-set.json> <roh-mail.txt> [<out.md>]
 */
import fs from 'node:fs';

const [setPath, rawPath, outPath] = process.argv.slice(2);
if (!setPath || !rawPath) {
  console.error('Usage: node intake-antworten.mjs <set.json> <roh.txt> [out.md]');
  process.exit(2);
}

const set = JSON.parse(fs.readFileSync(setPath, 'utf8'));
const raw = fs.readFileSync(rawPath, 'utf8');

// Formspree schreibt "feldname:\n\nwert\n\n", Werte koennen mehrzeilig sein.
function parse(text) {
  const values = {};
  const lines = text.split(/\r?\n/);
  let key = null, buf = [];
  const flush = () => { if (key) values[key] = buf.join('\n').trim(); buf = []; };
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*(?:\[\])?):$/);
    if (m) { flush(); key = m[1]; } else if (key) buf.push(line);
  }
  flush();
  return values;
}

const v = parse(raw);
const get = (n) => (v[n] || v[n + '[]'] || '').trim();

const out = [];
out.push('# Antworten: ' + (set.title || set.project));
out.push('');
out.push('Eingegangen ueber ' + (set.project || '') + '-Fragebogen. Reihenfolge wie im Formular.');
out.push('');

let beantwortet = 0, gesamt = 0, fehlendePflicht = [];
for (const sec of set.sections) {
  out.push('## ' + sec.title);
  out.push('');
  for (const q of sec.questions || []) {
    const name = sec.id + '__' + q.id;
    const val = get(name);
    const note = get(name + '__freitext');
    gesamt++;
    if (val || note) beantwortet++;
    else if (q.required) fehlendePflicht.push(sec.title + ': ' + q.label);

    out.push('**' + q.label + '**');
    out.push('');
    if (val) {
      out.push(val.split(', ').length > 3 && (q.type === 'checkbox')
        ? val.split(', ').map((x) => '- ' + x).join('\n')
        : val);
    } else {
      out.push('_(keine Angabe)_');
    }
    if (note) { out.push(''); out.push('> Eigene Ergaenzung: ' + note); }
    out.push('');
  }
}

out.splice(3, 0, `**Beantwortet:** ${beantwortet} von ${gesamt} Fragen.`
  + (fehlendePflicht.length ? ` **Offene Pflichtfragen:** ${fehlendePflicht.length}.` : ''), '');
if (fehlendePflicht.length) {
  out.splice(5, 0, '### Offen geblieben (Pflichtfragen)', '',
    ...fehlendePflicht.map((f) => '- ' + f), '');
}

const text = out.join('\n');
if (outPath) { fs.writeFileSync(outPath, text); console.log('OK: ' + outPath); }
else console.log(text);
console.log(`${beantwortet}/${gesamt} beantwortet, ${fehlendePflicht.length} Pflichtfragen offen`);
