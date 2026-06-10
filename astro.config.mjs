// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// L'image Open Graph est versionnée en base64 (scripts/og-default.jpg.b64,
// générée par scripts/build-og-image.py) et matérialisée ici au lancement de
// dev/build. Le jour où un binaire peut être committé directement, committer
// public/images/og-default.jpg et supprimer ce bloc + le .b64.
if (!existsSync('./public/images/og-default.jpg')) {
  mkdirSync('./public/images', { recursive: true });
  writeFileSync(
    './public/images/og-default.jpg',
    Buffer.from(readFileSync('./scripts/og-default.jpg.b64', 'utf8'), 'base64'),
  );
}

// https://astro.build/config
export default defineConfig({
  site: 'https://thefrenchbot.com',
  output: 'static',
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/dashboard'),
    }),
  ],
  redirects: {
    '/formation': '/formations',
    // Sessions passées retirées de src/data/sessions.ts — on redirige leurs
    // anciennes URLs (indexées / partagées) vers le catalogue.
    '/formations/maitriser-claude-mai-2026': '/formations',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
