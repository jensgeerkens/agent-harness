#!/usr/bin/env node
/**
 * test-intake-renderer.mjs, Smoke-Test fuer den zentralen Intake-Renderer.
 *
 * Prueft ein gerendertes Formular im echten Browser:
 *   1. alle Fragen aus dem Frage-Set sind da
 *   2. Freitext-Zusatzfeld bei Auswahlfragen vorhanden, bei "note": false nicht
 *   3. Fortschrittsanzeige zaehlt beantwortete Fragen
 *   4. Autosave + Wiederherstellung nach Reload
 *   5. Pflichtfeld-Validierung blockt das Absenden
 *   6. Absenden: Inhalt + neutrale Benachrichtigung (Schutz gegen Formspree-Spamfilter)
 *   7. keine JS-Fehler in der Konsole
 *
 * Usage: node test-intake-renderer.mjs <frage-set.json> <gerendertes.html>
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const [setPath, htmlPath] = process.argv.slice(2);
if (!setPath || !htmlPath) { console.error('Usage: node test-intake-renderer.mjs <set.json> <out.html>'); process.exit(2); }

const set = JSON.parse(fs.readFileSync(setPath, 'utf8'));
const html = fs.readFileSync(htmlPath, 'utf8');
const allQ = set.sections.flatMap((s) => s.questions.map((q) => ({ ...q, sec: s.id })));

let failed = 0;
function check(name, cond, detail = '') {
  if (cond) { console.log('  PASS  ' + name); }
  else { console.log('  FAIL  ' + name + (detail ? ' -> ' + detail : '')); failed++; }
}

// localStorage braucht echtes http://, file:// reicht nicht
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = 'http://127.0.0.1:' + server.address().port + '/' + path.basename(htmlPath);

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded' });

console.log('\n1) Struktur');
const renderedQ = await page.locator('.q').count();
check('alle ' + allQ.length + ' Fragen gerendert', renderedQ === allQ.length, 'gefunden: ' + renderedQ);
check('alle ' + set.sections.length + ' Bloecke gerendert',
  (await page.locator('fieldset').count()) === set.sections.length);
const missing = [];
for (const q of allQ) {
  const n = q.sec + '__' + q.id;
  if (!(await page.locator('[name="' + n + '"], [name="' + n + '[]"]').count())) missing.push(n);
}
check('kein Feld fehlt', missing.length === 0, missing.join(', '));

console.log('\n2) Freitext-Zusatzfelder');
const expectNote = allQ.filter((q) => q.note === undefined
  ? ['radio', 'checkbox', 'select'].includes(q.type) : !!q.note);
const noteCount = await page.locator('details.note textarea').count();
check(expectNote.length + ' Fragen mit Freitextfeld', noteCount === expectNote.length, 'gefunden: ' + noteCount);
const noNote = allQ.find((q) => q.note === false);
if (noNote) {
  check('"note": false unterdrueckt das Feld (' + noNote.id + ')',
    (await page.locator('[name="' + noNote.sec + '__' + noNote.id + '__freitext"]').count()) === 0);
}
check('Freitextfeld ist optional (kein required)',
  (await page.locator('details.note textarea[required]').count()) === 0);

console.log('\n3) Fortschritt');
const before = await page.locator('#progTxt').textContent();
check('Fortschritt startet bei 0 %', /\b0 %/.test(before), before);
await page.locator('.q .opt input').first().check();
await page.waitForTimeout(150);
const after = await page.locator('#progTxt').textContent();
check('Fortschritt steigt nach Antwort', after !== before, after);
const width = await page.locator('#progBar').evaluate((e) => e.style.width);
check('Balken hat Breite', width && width !== '0%', width);

console.log('\n4) Autosave und Wiederherstellung');
// irgendein Textfeld im Frage-Set, nicht zwingend im ersten Block
const firstText = allQ.find((q) => (q.type || 'text') === 'text');
if (!firstText) { console.log('  SKIP  kein Textfeld im Frage-Set'); }
const textName = firstText ? firstText.sec + '__' + firstText.id : null;
if (textName) await page.fill('[name="' + textName + '"]', 'Testbetrieb Mustermann');
const noteQ = expectNote[0];
const noteField = '[name="' + noteQ.sec + '__' + noteQ.id + '__freitext"]';
check('Freitextfeld ist zunaechst eingeklappt', !(await page.locator(noteField).isVisible()));
await page.locator(noteField).evaluate((t) => { t.closest('details').open = true; });
await page.fill(noteField, 'Eigene Ergaenzung');
await page.waitForTimeout(700);
await page.reload({ waitUntil: 'domcontentloaded' });
if (textName) check('Texteingabe ueberlebt Reload',
  (await page.inputValue('[name="' + textName + '"]')) === 'Testbetrieb Mustermann');
check('Auswahl ueberlebt Reload', await page.locator('.q .opt input').first().isChecked());
check('Freitext ueberlebt Reload',
  (await page.inputValue('[name="' + noteQ.sec + '__' + noteQ.id + '__freitext"]')) === 'Eigene Ergaenzung');
check('wiederhergestellter Freitext ist aufgeklappt',
  await page.locator('[name="' + noteQ.sec + '__' + noteQ.id + '__freitext"]').isVisible());
check('Hinweis auf wiederhergestellten Entwurf sichtbar',
  await page.locator('.draft-hint').isVisible());

console.log('\n5) Validierung');
await page.locator('#consent').check();
await page.locator('button.submit').click();
await page.waitForTimeout(300);
check('Absenden ohne Pflichtfelder wird geblockt',
  (await page.locator('.q.invalid').count()) > 0);
check('Fehlermeldung erscheint', /Pflichtfelder/i.test(await page.locator('#status').textContent()));
await page.locator('button.submit').evaluate((b) => b.disabled === false);
check('Formular wurde nicht abgeschickt', (await page.locator('.done').count()) === 0);

console.log('\n6) Absenden + neutrale Benachrichtigung');
// Hintergrund: Formspree markiert Einsendungen mit Geldbetraegen als Spam, meldet "ok"
// und verschickt KEINE Mail. Deshalb folgt auf jede Einsendung ein zweiter, inhaltsfreier POST,
// der den Filter sicher passiert und den Operator auf das Dashboard hinweist.
const posts = [];
let failPing = false;
await page.route('**/formspree.io/**', async (route) => {
  const body = route.request().postDataBuffer()?.toString('utf8') || '';
  posts.push(body);
  if (failPing && posts.length % 2 === 0) return route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false}' });
  return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
});
const MARK = 'GEHEIMER-TESTINHALT 500 Euro';
async function fillRequired() {
  for (const q of allQ.filter((x) => x.required)) {
    const n = q.sec + '__' + q.id;
    const t = q.type || 'text';
    if (t === 'radio') await page.locator('[name="' + n + '"]').first().check();
    else if (t === 'checkbox') await page.locator('[name="' + n + '[]"]').first().check();
    else if (t === 'select') await page.locator('[name="' + n + '"]').selectOption({ index: 1 });
    else await page.locator('[name="' + n + '"]').fill(t === 'email' ? 'test@example.org' : MARK);
  }
  await page.locator('#consent').check();
}
await fillRequired();
await page.locator('button.submit').click();
await page.waitForSelector('.done', { timeout: 5000 }).catch(() => {});
await page.waitForTimeout(500);
check('Danke-Seite erscheint', (await page.locator('.done').count()) === 1);
check('genau 2 POSTs an Formspree (Inhalt + Benachrichtigung)', posts.length === 2, 'gezaehlt: ' + posts.length);
check('1. POST enthaelt die Antworten', (posts[0] || '').includes(MARK));
check('2. POST enthaelt KEINE Antworten', posts.length > 1 && !posts[1].includes(MARK) && !/Euro/.test(posts[1]));
check('2. POST hat eigenen Betreff "Eingang:"', /name="_subject"\r\n\r\nEingang: /.test(posts[1] || ''));
check('2. POST nennt das Projekt', posts.length > 1 && posts[1].includes(set.project || ''));
check('2. POST verweist auf den Spam-Tab', /Spam/.test(posts[1] || ''));
check('2. POST traegt Zeitstempel (sonst verwirft Formspree identische Benachrichtigungen als Duplikat)', /name="zeit"/.test(posts[1] || '') && /20[0-9]{2}-[0-9]{2}-[0-9]{2}T/.test(posts[1] || ''));

// Sicherungskopie: die Antworten duerfen durch das Absenden nicht verloren gehen,
// weil der Formspree-Spamfilter Einsendungen still verwerfen kann.
check('Sicherungs-Knopf auf der Danke-Seite', (await page.locator('.done button.submit').count()) === 1);
check('Hinweis auf die Sicherungskopie', /Datei/i.test(await page.locator('.done').textContent()));
const kept = await page.evaluate((k) => localStorage.getItem(k),
  'intake-draft-' + (set.project || 'projekt'));
check('Entwurf bleibt nach dem Absenden erhalten', !!kept && kept.includes(MARK), kept ? 'ohne Antworten' : 'geloescht');
check('Entwurf ist als abgeschickt markiert', !!kept && JSON.parse(kept).sent === true);
await page.reload({ waitUntil: 'domcontentloaded' });
check('nach dem Absenden erscheint der Hinweis "bereits abgeschickt"',
  /bereits abgeschickt/i.test(await page.locator('.draft-hint').textContent()));
check('die abgeschickten Antworten stehen wieder im Formular',
  (await page.inputValue('[name="' + allQ.find((q) => q.required && !['radio','checkbox','select','email'].includes(q.type || 'text')).sec
    + '__' + allQ.find((q) => q.required && !['radio','checkbox','select','email'].includes(q.type || 'text')).id + '"]')) === MARK);
await page.evaluate((k) => localStorage.removeItem(k), 'intake-draft-' + (set.project || 'projekt'));

// Benachrichtigung darf das Absenden nie kaputt machen
posts.length = 0; failPing = true;
await page.goto(url, { waitUntil: 'domcontentloaded' });
await fillRequired();
await page.locator('button.submit').click();
await page.waitForSelector('.done', { timeout: 5000 }).catch(() => {});
check('Danke-Seite erscheint auch bei fehlgeschlagener Benachrichtigung', (await page.locator('.done').count()) === 1);

console.log('\n7) Konsole');
const realErrors = errors.filter((e) => !/status of 500/.test(e)); // der absichtliche 500er aus Block 6
check('keine JS-Fehler', realErrors.length === 0, realErrors.join(' | '));

await browser.close();
server.close();
console.log('\n' + (failed ? 'FEHLGESCHLAGEN: ' + failed + ' Checks' : 'ALLE CHECKS GRUEN'));
process.exit(failed ? 1 : 0);
