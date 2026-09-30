#!/usr/bin/env node
/**
 * test-make-intake.mjs, Unit-Test fuer make-intake.mjs (ohne Browser).
 *
 * Prueft den Datenschutz-Fusstext: "kein Tracking" darf nur dort stehen,
 * wo wirklich nichts gezaehlt wird. Mit "analytics": "cloudflare" in der
 * Projekt-Config muss der Hinweis auf Cloudflare Web Analytics erscheinen.
 *
 * Usage: node --test scripts/test-make-intake.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAKE = path.join(__dirname, 'make-intake.mjs');

const SET = {
  project: 'testprojekt',
  title: 'Test',
  sections: [{ id: 'a', title: 'A', questions: [{ id: 'x', label: 'X', type: 'text' }] }],
};

function render(cfg) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'make-intake-'));
  const setPath = path.join(dir, 'set.json');
  const cfgPath = path.join(dir, 'cfg.json');
  const outPath = path.join(dir, 'out.html');
  fs.writeFileSync(setPath, JSON.stringify(SET));
  fs.writeFileSync(cfgPath, JSON.stringify({ formspree_id: 'abc', ...cfg }));
  execFileSync(process.execPath, [MAKE, setPath, outPath, '--config', cfgPath], { stdio: 'pipe' });
  return fs.readFileSync(outPath, 'utf8');
}

test('ohne analytics: Fusstext sagt "kein Tracking"', () => {
  const html = render({});
  assert.match(html, /Keine Cookies, kein Tracking auf dieser Seite\./);
  assert.doesNotMatch(html, /Cloudflare Web Analytics/);
});

test('analytics=cloudflare: Fusstext nennt die Zaehlung, behauptet kein "kein Tracking"', () => {
  const html = render({ analytics: 'cloudflare' });
  assert.match(html, /Cloudflare Web Analytics/);
  assert.match(html, /Keine Cookies/);
  assert.doesNotMatch(html, /kein Tracking/i);
});

test('kein Platzhalter bleibt unersetzt', () => {
  for (const cfg of [{}, { analytics: 'cloudflare' }]) {
    assert.doesNotMatch(render(cfg), /__TRACKING_NOTE__/);
  }
});

test('unbekannter analytics-Wert bricht ab statt still falsch zu beschriften', () => {
  assert.throws(() => render({ analytics: 'matomo' }));
});

test('Kontaktadresse kommt aus notify_email und steht nirgends fest im Renderer', () => {
  const html = render({ notify_email: 'kontakt@example.org' });
  assert.match(html, /const CONTACT_EMAIL = "kontakt@example\.org";/);
  assert.doesNotMatch(html, /__CONTACT_EMAIL__/);
});

test('ohne notify_email bleibt ein sichtbarer Platzhalter statt einer fremden Adresse', () => {
  const html = render({});
  assert.match(html, /const CONTACT_EMAIL = "REPLACE_WITH_CONTACT_EMAIL";/);
});

test('notify_email wird fuer den Script-Kontext escaped', () => {
  const html = render({ notify_email: 'a"</script><x>@example.org' });
  assert.doesNotMatch(html, /<\/script><x>/);
  assert.match(html, /const CONTACT_EMAIL = "a\\"\\u003c\/script>\\u003cx>@example\.org";/);
});
