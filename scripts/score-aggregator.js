#!/usr/bin/env node
/**
 * score-aggregator.js, aggregiert die 7 Dimensions-Scores zu einem gewichteten Total.
 *
 * Usage:
 *   node score-aggregator.js <scores/iter-N.json> [scores/iter-(N-1).json]
 *
 * - Validiert die Gewichte (Summe muss 1.0 sein).
 * - Berechnet total = Σ(score × weight), rundet auf 2 Dezimalen.
 * - Schreibt total + delta_to_prev zurück in die Datei und gibt eine Zusammenfassung aus.
 * - Exit 0 bei Erfolg, 1 bei Schema-Fehler.
 */
const fs = require('fs');

const WEIGHTS = {
  visual_quality: 0.20,
  conversion: 0.20,
  performance: 0.15,
  seo: 0.15,
  accessibility: 0.10,
  dsgvo: 0.10,
  code_quality: 0.10,
};

function die(msg) { console.error('ERROR:', msg); process.exit(1); }

const file = process.argv[2];
const prevFile = process.argv[3];
if (!file) die('Pfad zu scores/iter-N.json fehlt.');
if (!fs.existsSync(file)) die(`Datei nicht gefunden: ${file}`);

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!data.dimensions || typeof data.dimensions !== 'object') die('Feld "dimensions" fehlt.');

let total = 0;
let weightSum = 0;
const missing = [];
for (const [dim, w] of Object.entries(WEIGHTS)) {
  const d = data.dimensions[dim];
  if (!d || typeof d.score !== 'number') { missing.push(dim); continue; }
  const weight = typeof d.weight === 'number' ? d.weight : w;
  d.weight = weight; // normalisieren
  total += d.score * weight;
  weightSum += weight;
}
if (missing.length) die(`Fehlende/ungültige Dimensionen: ${missing.join(', ')}`);
if (Math.abs(weightSum - 1.0) > 0.001) die(`Gewichtssumme ${weightSum} ≠ 1.0`);

total = Math.round(total * 100) / 100;
data.total = total;

let delta = 0;
if (prevFile && fs.existsSync(prevFile)) {
  try {
    const prev = JSON.parse(fs.readFileSync(prevFile, 'utf8'));
    if (typeof prev.total === 'number') delta = Math.round((total - prev.total) * 100) / 100;
  } catch { /* ignore */ }
}
data.delta_to_prev = delta;

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

const sign = delta > 0 ? '+' : '';
console.log(`total=${total.toFixed(2)} (Δ${sign}${delta.toFixed(2)})`);
for (const dim of Object.keys(WEIGHTS)) {
  const d = data.dimensions[dim];
  console.log(`  ${dim.padEnd(16)} ${d.score.toFixed(1)} × ${d.weight}`);
}
const topGap = Array.isArray(data.gaps) && data.gaps[0];
if (topGap) console.log(`  top gap: [${topGap.severity}] ${topGap.dimension}: ${topGap.action}`);
process.exit(0);
