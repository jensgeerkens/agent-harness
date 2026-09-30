#!/usr/bin/env node
// axe-gate.mjs, deterministisches A11y-Gate (TOOLCHAIN-2026-07, Abschnitt 2.2)
// Scannt alle HTML-Seiten eines dist-Ordners mit @axe-core/playwright
// (Tags: wcag2a, wcag2aa, wcag21a, wcag21aa) ueber einen lokalen File-Server.
// Output: Violations-JSON nach stdout. Exit-Code 1 bei Violations, 0 bei Zero-Violations.
// Usage: node scripts/gates/axe-gate.mjs <dist-Pfad>

import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

const distArg = process.argv[2];
if (!distArg) {
  console.error("Usage: node axe-gate.mjs <dist-Pfad>");
  process.exit(2);
}
const distDir = resolve(distArg);
try {
  const s = await stat(distDir);
  if (!s.isDirectory()) throw new Error("not a directory");
} catch {
  console.error(`dist-Pfad nicht gefunden oder kein Ordner: ${distDir}`);
  process.exit(2);
}

// Alle .html-Dateien rekursiv einsammeln
async function collectHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectHtml(full)));
    else if (entry.isFile() && /\.html?$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const htmlFiles = await collectHtml(distDir);
if (htmlFiles.length === 0) {
  console.error(`Keine HTML-Dateien in ${distDir} gefunden.`);
  process.exit(2);
}

// Minimaler statischer File-Server ueber dem dist-Ordner
const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let filePath = resolve(join(distDir, urlPath));
    if (!filePath.startsWith(distDir + sep) && filePath !== distDir) {
      res.writeHead(403).end();
      return;
    }
    let s = await stat(filePath).catch(() => null);
    if (s?.isDirectory()) {
      filePath = join(filePath, "index.html");
      s = await stat(filePath).catch(() => null);
    }
    if (!s?.isFile()) {
      res.writeHead(404).end();
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(500).end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const pages = [];
let totalViolations = 0;

for (const file of htmlFiles) {
  const rel = relative(distDir, file).split(sep).join("/");
  const url = `${baseUrl}/${rel}`;
  try {
    await page.goto(url, { waitUntil: "load", timeout: 30_000 });
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    totalViolations += results.violations.length;
    pages.push({
      page: rel,
      url,
      violationCount: results.violations.length,
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map((n) => ({ target: n.target, html: n.html, failureSummary: n.failureSummary })),
      })),
    });
  } catch (err) {
    totalViolations += 1;
    pages.push({ page: rel, url, error: String(err?.message ?? err), violationCount: null, violations: [] });
  }
}

await browser.close();
server.close();

const report = {
  tool: "axe-gate",
  tags: TAGS,
  dist: distDir,
  scannedPages: htmlFiles.length,
  totalViolations,
  pass: totalViolations === 0,
  pages,
};
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
process.exit(totalViolations === 0 ? 0 : 1);
