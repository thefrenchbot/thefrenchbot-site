// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

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

// Date de publication de chaque article, lue dans son en-tête, pour renseigner
// <lastmod> dans le sitemap (Google s'en sert pour prioriser le crawl).
const blogDates = new Map();
for (const file of readdirSync('./src/content/blog')) {
  if (!file.endsWith('.md')) continue;
  const match = /^pubDate:\s*["']?([^"'\n]+)/m.exec(readFileSync(`./src/content/blog/${file}`, 'utf8'));
  const date = match ? new Date(match[1].trim()) : null;
  if (date && !Number.isNaN(date.getTime())) blogDates.set(file.replace(/\.md$/, ''), date.toISOString());
}

// https://astro.build/config
export default defineConfig({
  site: 'https://thefrenchbot.com',
  output: 'static',
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/dashboard'),
      serialize(item) {
        const slug = /\/blog\/([^/]+)\/?$/.exec(item.url)?.[1];
        const lastmod = slug && blogDates.get(slug);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  redirects: {
    '/formation': '/formations',
    // Sessions passées retirées de src/data/sessions.ts — on redirige leurs
    // anciennes URLs (indexées / partagées) vers le catalogue.
    '/formations/maitriser-claude-mai-2026': '/formations',
  },
  // Précharge une page au survol ou au toucher de son lien : la navigation devient quasi instantanée.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: {
    plugins: [tailwindcss()],
  },
});
