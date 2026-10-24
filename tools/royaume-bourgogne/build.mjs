// Assembles royaume.html from src/ per SPEC section 4.
// Order: <title>, viewport-fit-sides meta, Google Fonts links, <style>ui.css</style>, ui.html,
//        <script>art.js</script>, <script>logic.js</script>, <script>ui.js</script>.
// No doctype/html/head/body tags (the publisher wraps the page). Fails loudly on any violation.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = dirname(fileURLToPath(import.meta.url));
const SRC = join(W, 'src');
const OUT = join(W, 'royaume.html');

const read = (f) => readFileSync(join(SRC, f), 'utf8').replace(/^﻿/, '');

const FONTS = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,700;1,400&family=Jacquarda+Bastarda+9&family=Pixelify+Sans:wght@400;500;600;700&display=swap">',
  // Pixelify Sans draws 5 like an S and € like an e: digits and € come from a Tiny5 subset instead.
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tiny5&text=0123456789%E2%82%AC&display=swap">'
].join('\n');

const errors = [];

// Inline <script> safety: a literal "</script" ends the element early, and "<!--" can switch the
// HTML tokenizer into the script-data-escaped state. Both are rewritten into JS-equivalent text.
function safeScript(name, js) {
  let n = 0;
  const out = js
    .replace(/<\/(script)/gi, (m, s) => { n++; return '<\\/' + s; })
    .replace(/<!--/g, () => { n++; return '<\\!--'; });
  if (n) console.log(`  ${name}: escaped ${n} script-breaking sequence(s)`);
  return out;
}
function safeStyle(name, css) {
  if (/<\/style/i.test(css)) errors.push(`${name} contains "</style"`);
  return css;
}

const css = safeStyle('ui.css', read('ui.css'));
const html = read('ui.html');
const art = safeScript('art.js', read('art.js'));
const logic = safeScript('logic.js', read('logic.js'));
const ui = safeScript('ui.js', read('ui.js'));

if (/<\/?script\b/i.test(html)) errors.push('ui.html must not contain <script> tags');
if (/<\/?style\b/i.test(html)) errors.push('ui.html must not contain <style> tags');

const page = [
  '<title>Royaume de Bourgogne</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  FONTS,
  '<style>\n' + css.trim() + '\n</style>',
  html.trim(),
  '<script>\n' + art.trim() + '\n</script>',
  '<script>\n' + logic.trim() + '\n</script>',
  '<script>\n' + ui.trim() + '\n</script>',
  ''
].join('\n');

// Contract checks on the assembled page.
const forbiddenTags = [/<!doctype/i, /<html[\s>]/i, /<\/html>/i, /<head[\s>]/i, /<\/head>/i, /<body[\s>]/i, /<\/body>/i];
for (const re of forbiddenTags) {
  const m = page.match(re);
  if (m) {
    const at = page.indexOf(m[0]);
    errors.push(`forbidden tag ${JSON.stringify(m[0])} near: ${JSON.stringify(page.slice(Math.max(0, at - 60), at + 40))}`);
  }
}
if (!page.startsWith('<title>Royaume de Bourgogne</title>\n<meta name="claude:viewport-fit-sides" content="cover">')) {
  errors.push('page must start with the title and the viewport-fit-sides meta');
}
const scriptOpen = (page.match(/<script\b/gi) || []).length;
const scriptClose = (page.match(/<\/script>/gi) || []).length;
if (scriptOpen !== 3 || scriptClose !== 3) errors.push(`expected exactly 3 <script> blocks, got ${scriptOpen} open / ${scriptClose} close`);
if ((page.match(/<style\b/gi) || []).length !== 1) errors.push('expected exactly one <style> block');
if (/stardew/i.test(page)) errors.push('the word "Stardew" must not appear in the page');
if (/Automatisation oui, abdication non|anti-blabla/i.test(page)) errors.push('forbidden slogan in page');
// Only Google Fonts may be loaded from outside.
const ext = page.match(/(?:src|href)\s*=\s*["']https?:\/\/[^"']+/gi) || [];
for (const u of ext) {
  if (!/https:\/\/fonts\.(googleapis|gstatic)\.com/.test(u) && !/calendly\.com|app\.hubspot\.com|mail\.google\.com/.test(u)) {
    errors.push('unexpected external resource: ' + u);
  }
}
if (/<script[^>]+src=/i.test(page)) errors.push('external <script src> is not allowed');

if (errors.length) {
  console.error('BUILD FAILED:\n - ' + errors.join('\n - '));
  process.exit(1);
}
writeFileSync(OUT, page);
const bytes = Buffer.byteLength(page, 'utf8');
console.log(`built ${OUT}`);
console.log(`size: ${bytes} bytes (${(bytes / 1024).toFixed(1)} KiB)`);
