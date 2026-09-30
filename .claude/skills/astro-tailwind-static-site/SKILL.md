---
name: astro-tailwind-static-site
description: Pattern für statische Astro-6-Websites mit Tailwind v4 (CSS-first @theme), Fontsource, Inline-SVG-Icons und Cloudflare-Pages-Deploy. Lade dieses Skill bei jeder Astro/Tailwind-Code-Arbeit im Harness.
---

# Astro 6 + Tailwind v4: Static-Site-Pattern

Bewährter Stack (aus einem früheren Werkstatt-Projekt abstrahiert). Cloudflare-Pages-Target, `output: 'static'`.

## package.json (Kern)

```json
{
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.7.2",
    "@fontsource-variable/inter": "^5.2.8",
    "@tailwindcss/vite": "^4.3.0",
    "astro": "^6.3.6",
    "tailwindcss": "^4.3.0"
  }
}
```

## astro.config.mjs

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://example.pages.dev'; // pro Projekt setzen

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

## tsconfig.json

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

## Tailwind v4: CSS-first (kein tailwind.config.js!)

`src/styles/global.css`:
```css
@import '@fontsource-variable/inter';
@import 'tailwindcss';

@theme {
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
  --color-ink-900: #0b1220;
  --color-ink-500: #64748b;
  --color-accent-600: #0c5cff;   /* projektabhängig */
  --color-hair: #e6e9ef;
  --radius-card: 14px;
  --shadow-card: 0 1px 2px rgba(11,18,32,.04), 0 8px 24px -12px rgba(11,18,32,.12);
}

@layer base {
  body { background:#fff; color:var(--color-ink-900); font-family:var(--font-sans);
         -webkit-font-smoothing:antialiased; }
  :focus-visible { outline:2px solid var(--color-accent-600); outline-offset:2px; }
  h1,h2,h3 { letter-spacing:-.02em; text-wrap:balance; }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation-duration:.001ms!important; transition-duration:.001ms!important; }
  }
}

@layer components {
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:.55rem;
         font-weight:600; border-radius:10px; padding:.95rem 1.4rem; white-space:nowrap; }
  .btn-primary { background:var(--color-accent-600); color:#fff; }
}

@utility container-page { width:100%; margin-inline:auto; max-width:76rem; padding-inline:1.25rem; }
@media (min-width:768px){ .container-page{ padding-inline:2rem; } }
```

Tokens (`--color-ink-900`) sind in Tailwind automatisch als `text-ink-900`, `bg-ink-900` nutzbar.

## Verzeichnis-Layout

```
src/
├── components/  Header.astro Footer.astro Icon.astro <Section>.astro
├── content/     site.ts            ← einzige Content-Quelle (siehe content-collections-pattern)
├── layouts/     BaseLayout.astro   ← <head>, JSON-LD, Skip-Link, Header/Footer
├── lib/         helpers (z.B. opening.ts)
├── pages/       index.astro leistungen.astro kontakt.astro impressum.astro datenschutz.astro 404.astro
└── styles/      global.css
public/          favicon.svg favicon.ico
```

## Icon.astro (Inline-SVG, workerd-sicher)

```astro
---
interface Props { name: string; class?: string; size?: number; 'aria-label'?: string; }
const { name, class: c = '', size = 24, 'aria-label': al } = Astro.props;
const paths: Record<string,string> = {
  phone: '<path d="M5 4h3.2l1.3 4-2 1.4a12 12 0 0 0 5.1 5.1l1.4-2 4 1.3V20a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  // ... pro Projekt erweitern
};
const dec = !al;
---
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}
     fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
     stroke-linejoin="round" class={c} aria-hidden={dec ? 'true' : undefined}
     role={dec ? undefined : 'img'} aria-label={al} set:html={paths[name] ?? ''} />
```

## Astro-6-Fonts-API (bevorzugt vor Fontsource-Import)

Astro 6 bringt eine eingebaute Fonts-API, die Self-Hosting + Preload + metric-adjusted
Fallbacks (gegen Font-Swap-CLS) nativ uebernimmt. Sie ist DSGVO-konform (keine externen
Requests zur Laufzeit, die Dateien werden zur Build-Zeit lokal gebacken). Bevorzugt vor dem
manuellen `@fontsource-variable/...`-Import.

```js
// astro.config.mjs
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  experimental: {
    fonts: [{
      provider: fontProviders.fontsource(),
      name: 'Fraunces',
      cssVariable: '--font-display',
      subsets: ['latin'],
      weights: ['300 900'],          // variable weight-range statt Einzelschnitte
      styles: ['normal', 'italic'],
      optimizedFallbacks: true,       // metric-adjusted Fallback → 0 CLS beim Swap
    }],
  },
});
```
```astro
--- 
// BaseLayout.astro <head>
import { Font } from 'astro:assets';
---
<Font cssVariable="--font-display" preload />
```
Im `@theme`: `--font-display: var(--font-display), ui-serif, Georgia, serif;`. Eine variable
Serif mit echtem opsz (Fraunces/Newsreader/Source Serif 4) latin-subsetted (~30–60 kB woff2)
traegt 2–5 statische Schnitte ab.

## Responsive Images (AVIF-first, constrained)

```js
// astro.config.mjs
export default defineConfig({
  image: { layout: 'constrained', responsiveStyles: true },
});
```
```astro
---
import { Picture } from 'astro:assets';
import heroImg from '../assets/hero.jpg';
---
<Picture src={heroImg} formats={['avif', 'webp']} alt="…"
  widths={[400, 800, 1200]} sizes="(max-width:768px) 100vw, 800px" />
```
sharp-Quality-Config (aus dem Asset-Sweep): **Fotos q60–75 / effort 5–6**, **Grafik/Text
q80–85 / 4:4:4-Chroma**, mozjpeg als Fallback. AVIF zuerst, WebP als Fallback, Original als
letzter Fallback. `<img>` mit explizitem `width`/`height` bzw. `layout:'constrained'` gegen CLS.

## Favicon-Minimal-Set (Evil-Martians-Muster, kein Generator)

Nur 3–5 Dateien statt 71-Asset-Generator-Bloat:
```
public/favicon.ico            (32×32, Legacy)
public/icon.svg               (skalierbar, prefers-color-scheme fähig)
public/apple-touch-icon.png   (180×180)
public/manifest.webmanifest   (+ 192/512 maskable PNG bei PWA-Wunsch)
```
```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

## Satori-OG-Pattern (Build-Zeit-Share-Bilder)

Markenkonsistente OG-Images zur Build-Zeit statt Handarbeit. Endpoint pro Slug, Tokens aus
`site.ts` / `@theme` (Farben, Schrift), 0 externe Requests:
```ts
// src/pages/og/[slug].png.ts
import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { site } from '../../content/site';

export function getStaticPaths() {
  return site.pages.map((p) => ({ params: { slug: p.slug }, props: { page: p } }));
}

export const GET: APIRoute = async ({ props }) => {
  const svg = await satori(
    { type: 'div', props: { style: { /* Tokens aus site.ts/@theme */ }, children: props.page.title } },
    { width: 1200, height: 630, fonts: [/* dieselbe Schrift wie die Site */] },
  );
  const png = new Resvg(svg).render().asPng();
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
```
`<meta property="og:image" content={new URL(`/og/${slug}.png`, site.url)}>`. Der evaluator
prueft OG-Images als eigenen Punkt.

## Webtech-Baseline (0 kB JS, degradiert sauber): Default fuer den code-writer

Ergebnis eines Webtech-Recherche-Sweeps (Stand 2026). Diese Features sind die glaubwuerdige „der Browser kann das
nativ"-Demonstration, alle Progressive Enhancement:

- **Cross-document View Transitions (MPA):** `@view-transition { navigation: auto; }` global,
  NICHT `<ClientRouter />` (der macht die MPA faktisch zur SPA). `view-transition-name`
  eindeutig pro Seite; Wordmark/Logo als persistentes shared element. Ohne Support = normale
  Navigation, kein Bruch. 0 kB JS.
- **Speculation Rules / Prerender:** Astro `prefetch` + `experimental.clientPrerender` →
  instant Navigation in Chromium, unsichtbar degradierend. Kombiniert mit VT doppelt stark.
- **CSS Scroll-driven Animations:** `animation-timeline: scroll()/view()`: IMMER hinter
  `@supports (animation-timeline: view())` gaten, Default-Zustand voll sichtbar (nie Inhalt
  per Default auf `opacity:0`!), plus `@media (prefers-reduced-motion: reduce)`.
- **`@starting-style` + `transition-behavior: allow-discrete`:** weiche Entry-Animationen fuer
  Popover/Mobilnav/Dialog (als reine Verschoenerung behandeln).
- **Popover API + Anchor Positioning:** ersetzt Floating-UI komplett (Fussnoten/Glossar/Tooltip).
  `popovertarget` (breiter) statt Invoker-Commands, Fallback = zentriertes Popover.
- **`text-wrap: balance`** auf Headlines (≤6 Zeilen), **`text-wrap: pretty`** global auf
  Fliesstext (keine Hurenkinder). 0 kB.
- **Container Queries (Size):** Tailwind v4 `@container`: Karten passen sich ihrem Slot an
  (3er-Grid vs. Featured). Style Queries noch NICHT.

### Motion-/3D-Grenzen (hart)

- **GSAP-frei per Default.** CSS-SDA deckt ~90%. Nur bei echtem SplitText-Zeilen-Bedarf GSAP
  Core + SplitText (kein ScrollTrigger, Scroll macht CSS). Sonst **Motion.dev mini (~2.6 kB)
  nur als Akzent** (Hero-Stagger, Zahl-Counter), lazy nach LCP.
- **Max EIN handgeschriebener WebGL2-Fragment-Shader-Moment** (~2–5 kB, 0 Deps), **lazy nach
  LCP** geladen (Canvas nicht im LCP-Pfad), Start per IntersectionObserver, aus bei
  `prefers-reduced-motion`, CSS-Fallback (statischer Gradient/Textur) darunter. KEIN three.js,
  KEIN WebGPU, KEIN Rive/Lottie/Houdini, KEIN Lenis (kollidiert mit CSS-SDA).

## Regeln

- `output: 'static'`, **kein** SSR-Adapter, **kein** `@astrojs/cloudflare`.
- **Kein** Google Fonts / keine externen Requests. Fonts via Astro-6-Fonts-API (bevorzugt) oder
  Fontsource self-hosted.
- **Inline-SVG**, kein `astro-icon`.
- TypeScript strict, kein `any`.
- Komponenten < 150 LOC.
- Jede Animation mit `prefers-reduced-motion`-Pfad; LCP < 1.5s trotz Show-Effekten
  (Progressive Enhancement: Basis-Inhalt sofort, Effekte laden nach).
- Build-Check vor Abgabe: `npm run build` (Exit 0).
- Deploy: siehe `deploy-pages`-Skill, **Cloudflare Pages**, nie Workers.
