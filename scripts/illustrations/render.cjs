// Régénère les illustrations du site à partir de scenes.html.
//   node scripts/illustrations/render.cjs
// Nécessite Playwright + Chromium. Sortie : src/assets/illustrations/<scène>-<format>.png
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

const SCENES = ['claude', 'prompt', 'nocode', 'product', 'ethique', 'projets'];
const FORMATS = { wide: { width: 1200, height: 560 }, square: { width: 1000, height: 1000 } };

(async () => {
  const out = path.resolve(__dirname, '../../src/assets/illustrations');
  fs.mkdirSync(out, { recursive: true });
  const html = 'file://' + path.resolve(__dirname, 'scenes.html');
  const browser = await chromium.launch();
  for (const [format, viewport] of Object.entries(FORMATS)) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    for (const scene of SCENES) {
      await page.goto(`${html}?s=${scene}&f=${format}`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(out, `${scene}-${format}.png`) });
    }
    await page.close();
  }
  await browser.close();
})();
