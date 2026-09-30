// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Pro Projekt setzen: finale Domain oder *.pages.dev. Default = Pages-Subdomain.
// code-writer ersetzt dies anhand des Projektnamens (state.json).
const SITE = 'https://astro-static-base.pages.dev';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
