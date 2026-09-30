#!/usr/bin/env node
/**
 * build-style-gallery.mjs, sammelt ALLE Design-Entwuerfe aller Projekte zu einer
 * durchsuchbaren Style-Template-Gallery.
 *
 * Scannt ~/projects/<projekt>/design-system/options/<X>/{system.json,style-tile.html}
 * und erzeugt ~/projects/_style-gallery/index.html, eine Galerie mit Live-Vorschau
 * (skalierte iframes), Palette, Konzept, Typo und "✓ gewaehlt"-Badge (Abgleich mit
 * dem finalen design-system/system.json des jeweiligen Projekts).
 *
 * Usage: node build-style-gallery.mjs [--projects <dir>] [--out <file>]
 * Wird von /freigabe-go nach der Options-Erzeugung und nach der Auswahl aufgerufen.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function flag(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : def; }

const PROJECTS = flag('projects', path.join(os.homedir(), 'projects'));
const OUT_DIR = path.join(PROJECTS, '_style-gallery');
const OUT = flag('out', path.join(OUT_DIR, 'index.html'));

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

if (!fs.existsSync(PROJECTS)) { console.error('Kein projects-Verzeichnis:', PROJECTS); process.exit(1); }

const projects = fs.readdirSync(PROJECTS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
  .map((d) => d.name);

const entries = [];
for (const proj of projects) {
  const optDir = path.join(PROJECTS, proj, 'design-system', 'options');
  if (!fs.existsSync(optDir)) continue;
  const chosen = readJSON(path.join(PROJECTS, proj, 'design-system', 'system.json'));
  const chosenConcept = chosen?.concept || null;
  for (const letter of fs.readdirSync(optDir).sort()) {
    const sys = readJSON(path.join(optDir, letter, 'system.json'));
    const tile = path.join(optDir, letter, 'style-tile.html');
    if (!sys || !fs.existsSync(tile)) continue;
    entries.push({
      project: proj, letter,
      concept: sys.concept || `${proj} ${letter}`,
      palette: sys.palette || {},
      display: sys.type_pairing?.display?.family || '',
      body: sys.type_pairing?.body?.family || '',
      signature: sys.signature_element || '',
      tileRel: path.relative(OUT_DIR, tile).split(path.sep).join('/'),
      chosen: chosenConcept && sys.concept && chosenConcept === sys.concept,
    });
  }
}

// Gruppieren nach Projekt
const byProject = {};
for (const e of entries) (byProject[e.project] ||= []).push(e);

function swatches(pal) {
  const keys = ['bg', 'surface', 'text', 'muted', 'accent'];
  return keys.filter((k) => pal[k]).map((k) =>
    `<span class="sw" title="${k}: ${esc(pal[k])}" style="background:${esc(pal[k])}"></span>`).join('');
}

function card(e) {
  return `<article class="card${e.chosen ? ' chosen' : ''}">
    <div class="preview"><iframe loading="lazy" src="${esc(e.tileRel)}" title="${esc(e.concept)}"></iframe>
      <a class="open" href="${esc(e.tileRel)}" target="_blank" rel="noopener">Vollansicht öffnen ↗</a></div>
    <div class="meta">
      <div class="row"><span class="letter">${esc(e.letter)}</span>
        <h3>${esc(e.concept)}</h3>${e.chosen ? '<span class="badge">✓ gewählt</span>' : ''}</div>
      <div class="sws">${swatches(e.palette)}</div>
      <p class="typo">${esc(e.display)}${e.body ? ' × ' + esc(e.body) : ''}</p>
      ${e.signature ? `<p class="sig">${esc(e.signature)}</p>` : ''}
    </div>
  </article>`;
}

const sections = Object.keys(byProject).sort().map((proj) =>
  `<section class="project"><h2>${esc(proj)}</h2><div class="grid">${byProject[proj].map(card).join('')}</div></section>`
).join('\n');

const html = `<!doctype html>
<html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Style-Template-Gallery</title>
<style>
  :root{--bg:#0e1014;--panel:#171a21;--line:#262c39;--text:#e8edf4;--muted:#97a3b6;--accent:#9bdcc7}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.5}
  header{padding:32px 28px 8px;border-bottom:1px solid var(--line)}
  h1{margin:0 0 6px;font-size:1.7rem;letter-spacing:-.02em}
  header p{margin:0;color:var(--muted)}
  .wrap{padding:24px 28px 80px;max-width:1500px;margin:0 auto}
  .project{margin:36px 0}
  .project h2{font-size:1.05rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;
    border-bottom:1px solid var(--line);padding-bottom:8px;margin:0 0 18px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:22px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;
    transition:border-color .15s}
  .card:hover{border-color:var(--accent)}
  .card.chosen{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
  .preview{position:relative;height:280px;overflow:hidden;background:#fff;border-bottom:1px solid var(--line)}
  .preview iframe{position:absolute;top:0;left:0;width:1280px;height:933px;border:0;
    transform:scale(.36);transform-origin:top left;pointer-events:none}
  .preview .open{position:absolute;right:10px;bottom:10px;background:rgba(10,12,16,.82);color:#fff;
    font-size:.78rem;padding:6px 11px;border-radius:999px;text-decoration:none;border:1px solid var(--line)}
  .preview .open:hover{background:#0a0c10}
  .meta{padding:14px 16px 18px}
  .row{display:flex;align-items:center;gap:10px}
  .letter{display:grid;place-items:center;width:26px;height:26px;border-radius:7px;background:#222a37;
    font-weight:700;font-size:.85rem}
  .row h3{margin:0;font-size:1.05rem;flex:1}
  .badge{background:var(--accent);color:#06241f;font-weight:700;font-size:.72rem;padding:3px 9px;border-radius:999px}
  .sws{display:flex;gap:6px;margin:12px 0 8px}
  .sw{width:26px;height:26px;border-radius:6px;border:1px solid rgba(255,255,255,.14)}
  .typo{margin:0;color:var(--muted);font-size:.86rem}
  .sig{margin:6px 0 0;color:var(--muted);font-size:.8rem;opacity:.85}
  .empty{color:var(--muted);padding:40px 0}
</style></head>
<body>
<header><h1>Style-Template-Gallery</h1>
<p>Alle Design-Entwürfe aller Website-Projekte. ${entries.length} Entwürfe in ${Object.keys(byProject).length} Projekt(en). Vorschau ist live, Klick öffnet die Style-Tile.</p></header>
<div class="wrap">
${sections || '<p class="empty">Noch keine Design-Entwürfe gefunden. Sie entstehen bei /freigabe-go (Gate 2).</p>'}
</div></body></html>`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`OK: ${OUT} (${entries.length} Entwürfe, ${Object.keys(byProject).length} Projekte)`);
