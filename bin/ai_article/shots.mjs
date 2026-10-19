// Headless check of the running preview (http://127.0.0.1:4000/blog/2026/ai-money/): console errors and one screenshot per figure.
// node shots.mjs   (needs playwright, e.g. NODE_PATH=~/code/Website/node_modules)
import { createRequire } from 'module';
const require = createRequire(process.env.HOME + '/code/Website/node_modules/');
const { chromium } = require('playwright');
import fs from 'fs';
const out = new URL('./cache/shots/', import.meta.url).pathname; fs.mkdirSync(out, { recursive: true });
const url = process.argv[2] || 'http://127.0.0.1:4000/blog/2026/ai-money/';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
await p.goto(url, { waitUntil: 'networkidle' });
const figs = await p.$$('figure[data-ai]');
for (const f of figs) {
  const kind = await f.getAttribute('data-ai');
  await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
  await f.screenshot({ path: out + kind + '.png' });
  console.log('shot', kind, (await f.boundingBox()).height | 0);
}
console.log('errors:', errs.length, errs.slice(0, 8));
await b.close();
