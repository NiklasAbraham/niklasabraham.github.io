// Headless check of the running preview (http://127.0.0.1:4000/blog/2026/oil-market/): console errors and one screenshot
// per figure, at desktop width and (with --phone) at 390 px.   node shots.mjs [url] [--phone] [--only=kind,kind]
import { createRequire } from 'module';
const require = createRequire(process.env.HOME + '/code/Website/node_modules/');
const { chromium } = require('playwright');
import fs from 'fs';
const phone = process.argv.includes('--phone');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const out = new URL('./cache/shots/' + (phone ? 'phone/' : ''), import.meta.url).pathname; fs.mkdirSync(out, { recursive: true });
const url = process.argv.slice(2).find((a) => a.startsWith('http')) || 'http://127.0.0.1:4000/blog/2026/oil-market/';
const b = await chromium.launch(); const p = await b.newPage({ viewport: phone ? { width: 390, height: 840 } : { width: 1280, height: 900 }, deviceScaleFactor: phone ? 2 : 1 });
const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
p.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url()));
await p.goto(url, { waitUntil: 'networkidle' });
const figs = await p.$$('figure[data-oil], figure.oil-anat');
const seen = {};
for (const f of figs) {
  let kind = (await f.getAttribute('data-oil')) || 'anat-' + (await f.getAttribute('data-anat'));
  if (only.length && !only.includes(kind)) continue;
  seen[kind] = (seen[kind] || 0) + 1; if (seen[kind] > 1) kind += '-' + seen[kind];
  await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(3200);
  await f.screenshot({ path: out + kind + '.png' });
  const bb = await f.boundingBox(); const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log('shot', kind, bb.height | 0, sw > (phone ? 390 : 1280) ? 'OVERFLOW ' + sw : '');
}
console.log('errors:', errs.length, errs.slice(0, 10));
await b.close();
