#!/usr/bin/env node
/**
 * test-score-aggregator.mjs: Unit-Tests fuer score-aggregator.js.
 *
 * Referenzwerte: Dimensions-Scores der zweiten Iteration des Selbsttests
 * (siehe README, Beispiel-Output). Erwartetes Total 9.31.
 *
 * Usage: node --test scripts/test-score-aggregator.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGG = path.join(__dirname, 'score-aggregator.js');

const SELBSTTEST = {
  visual_quality: 8.7, conversion: 9.0, performance: 9.9, seo: 9.5,
  accessibility: 9.7, dsgvo: 9.5, code_quality: 9.4,
};

function dims(scores, weights = {}) {
  return Object.fromEntries(Object.entries(scores).map(([k, v]) =>
    [k, weights[k] === undefined ? { score: v } : { score: v, weight: weights[k] }]));
}

function run(data, prev) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'score-agg-'));
  const file = path.join(dir, 'iter-002.json');
  fs.writeFileSync(file, JSON.stringify(data));
  const args = [AGG, file];
  if (prev) {
    const prevFile = path.join(dir, 'iter-001.json');
    fs.writeFileSync(prevFile, JSON.stringify(prev));
    args.push(prevFile);
  }
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  const written = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  return { code: r.status, out: r.stdout, err: r.stderr, written };
}

test('gewichtetes Total entspricht dem Selbsttest (9.31)', () => {
  const r = run({ dimensions: dims(SELBSTTEST) });
  assert.equal(r.code, 0, r.err);
  assert.equal(r.written.total, 9.31);
});

test('Delta zur Vorrunde wird berechnet und zurueckgeschrieben', () => {
  const r = run({ dimensions: dims(SELBSTTEST) }, { total: 8.8 });
  assert.equal(r.code, 0, r.err);
  assert.equal(r.written.delta_to_prev, 0.51);
  assert.match(r.out, /total=9\.31 \(Δ\+0\.51\)/);
});

test('fehlende Dimension bricht mit Exit 1 ab', () => {
  const { seo, ...ohneSeo } = SELBSTTEST;
  const r = run({ dimensions: dims(ohneSeo) });
  assert.equal(r.code, 1);
  assert.match(r.err, /seo/);
});

test('Gewichtssumme ungleich 1.0 bricht mit Exit 1 ab', () => {
  const r = run({ dimensions: dims(SELBSTTEST, { visual_quality: 0.5 }) });
  assert.equal(r.code, 1);
  assert.match(r.err, /Gewichtssumme/);
});
