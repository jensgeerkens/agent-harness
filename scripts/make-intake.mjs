#!/usr/bin/env node
/**
 * make-intake.mjs, rendert aus einer projekt-spezifischen Frage-Set-JSON
 * ein versandfertiges, eigenstaendiges HTML-Formular (zentraler Renderer inline).
 *
 * "Zentral" = der Renderer (templates/intake/form-renderer.html) ist die EINE
 * Quelle der Wahrheit. Pro Projekt wird das Frage-Set hineingegossen -> ein
 * self-contained .html, das der Operator an die fachliche Ansprechperson schicken kann (oder auf der
 * eigenen Domain unter /intake/<slug>.html hochlaedt). Ein DSGVO-Pfad, eine Formspree-Anbindung.
 *
 * Usage:
 *   node make-intake.mjs <frage-set.json> <out.html> [--formspree <id>] [--config <intake.json>]
 *
 * Das Frage-Set hat die Form:
 *   { "project": "slug", "title": "...", "intro": "...",
 *     "sections": [ { "id","title","help?","questions":[
 *        { "id","label","type","required?","help?","placeholder?","options?":[] } ] } ] }
 *   type ∈ text | email | tel | textarea | radio | checkbox | select
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HARNESS = path.resolve(__dirname, '..');

function die(m) { console.error('ERROR:', m); process.exit(1); }

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const setPath = positional[0] || die('Frage-Set-JSON-Pfad fehlt.');
const outPath = positional[1] || die('Output-HTML-Pfad fehlt.');
function flag(name) { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : undefined; }

const cfgPath = flag('config') || path.join(HARNESS, 'config', 'intake.json');
const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
const formspreeId = flag('formspree') || cfg.formspree_id || 'REPLACE_WITH_FORMSPREE_ID';
const contactEmail = cfg.notify_email || 'REPLACE_WITH_CONTACT_EMAIL';

const rendererPath = path.join(HARNESS, 'templates', 'intake', 'form-renderer.html');
if (!fs.existsSync(rendererPath)) die(`Renderer-Template fehlt: ${rendererPath}`);
if (!fs.existsSync(setPath)) die(`Frage-Set nicht gefunden: ${setPath}`);

const set = JSON.parse(fs.readFileSync(setPath, 'utf8'));
if (!Array.isArray(set.sections) || set.sections.length === 0) die('Frage-Set hat keine sections.');

let html = fs.readFileSync(rendererPath, 'utf8');
const title = set.title || `Website-Fragebogen, ${set.project || ''}`.trim();
const accent = (cfg.brand && cfg.brand.accent) || '#5eead4';
const privacy = cfg.privacy_note || 'Ihre Angaben werden ausschliesslich zur Erstellung Ihrer Website verwendet.';

// Fusstext muss zur Wahrheit passen: "kein Tracking" nur, wenn wirklich nichts gezaehlt wird.
// "analytics": "cloudflare" = Cloudflare Web Analytics ist fuer das Pages-Projekt eingeschaltet.
const TRACKING_NOTES = {
  none: 'Keine Cookies, kein Tracking auf dieser Seite.',
  cloudflare: 'Keine Cookies. Seitenaufrufe werden anonym gezaehlt (Cloudflare Web Analytics, ohne Cookies und ohne Profilbildung).',
};
const analytics = cfg.analytics || 'none';
if (!TRACKING_NOTES[analytics]) die(`Unbekannter analytics-Wert "${analytics}" (erlaubt: ${Object.keys(TRACKING_NOTES).join(', ')}).`);

html = html
  .replaceAll('__TRACKING_NOTE__', TRACKING_NOTES[analytics])
  .replaceAll('__PAGE_TITLE__', escapeHtml(title))
  .replaceAll('__ACCENT__', accent)
  .replaceAll('__FORMSPREE_ID__', formspreeId)
  .replaceAll('__PRIVACY_NOTE__', escapeHtml(privacy))
  .replaceAll('__CONTACT_EMAIL__', jsString(contactEmail))
  .replace('/*__QUESTION_SET__*/ null', JSON.stringify(set, null, 2));

// Wert landet in einem JS-String-Literal im <script>: JSON-escapen und '<' neutralisieren.
function jsString(s) {
  return JSON.stringify(String(s)).slice(1, -1).replace(/</g, '\\u003c');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);

const qCount = set.sections.reduce((n, s) => n + (s.questions?.length || 0), 0);
console.log(`OK: ${outPath} (${set.sections.length} Bloecke, ${qCount} Fragen, Formspree=${formspreeId})`);
if (contactEmail === 'REPLACE_WITH_CONTACT_EMAIL') {
  console.log('HINWEIS: notify_email fehlt in config/intake.json, das Formular zeigt einen Platzhalter als Kontaktadresse.');
}
if (formspreeId === 'REPLACE_WITH_FORMSPREE_ID') {
  console.log('HINWEIS: Formspree-ID noch nicht gesetzt, in config/intake.json eintragen oder --formspree nutzen.');
}
