// Headless check of the post: console errors, one screenshot per figure (cache/shots/NN_kind.png).
//   node bin/food_article/shots.mjs [url]   (Playwright from ~/code/Website/node_modules; preview on :4000)
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
const require = createRequire(os.homedir() + '/code/Website/node_modules/');
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://127.0.0.1:4000/blog/2026/world-food/';
const out = new URL('./cache/shots/', import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('requestfailed', (r) => errs.push('requestfailed: ' + r.url()));
const t0 = Date.now();
await p.goto(url, { waitUntil: 'load' });
const figs = await p.$$('figure[data-fd]');
console.log('figures', figs.length);
let i = 0;
for (const f of figs) {
  await f.scrollIntoViewIfNeeded();
  await p.waitForTimeout(1500);
  const kind = await f.getAttribute('data-fd');
  const ok = await f.evaluate((e) => !!e.querySelector('.bx-stage'));
  const box = await f.boundingBox();
  console.log(String(i).padStart(2, '0'), kind, ok ? 'ok' : 'NOT RENDERED', box ? Math.round(box.width) + 'x' + Math.round(box.height) : '');
  await f.screenshot({ path: `${out}${String(i).padStart(2, '0')}_${kind}.png` });
  i++;
}
console.log('seconds', (Date.now() - t0) / 1000);
console.log(errs.length ? errs.join('\n') : 'no console errors');
await b.close();
