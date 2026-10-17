// Render frames of a 2d-anim concept spec at fixed times, headless, into one contact sheet PNG.
//   node bin/energy_article/animframes.mjs SPEC.json OUT.png [t1,t2,...]
// The draw function is called with t directly (the sandbox passes seconds since start), and with
// every intermediate step at 1/30 s so that stateful animations reach the same state.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/home/niklas/code/Website/node_modules/');
const { chromium } = require('playwright');
const [spec, out, ts] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(spec, 'utf8'));
const code = (d.spec || d).setup_code;
const times = (ts || '1,3,5,7,9,11,13,15,17,19,21,23').split(',').map(Number);
const W = 760, H = 400;
const html = `<!doctype html><html><body style="margin:0;background:#fff">
<div id="grid" style="display:grid;grid-template-columns:repeat(3,${W}px);gap:6px;background:#ccc"></div>
<script>
window.run = (code, times) => {
  const grid = document.getElementById('grid');
  const errs = [];
  for (const T of times) {
    const c = document.createElement('canvas'); c.width = ${W}; c.height = ${H};
    const wrap = document.createElement('div'); wrap.style.position='relative'; wrap.style.background='#fff';
    const lab = document.createElement('div'); lab.textContent = 't=' + T + 's';
    lab.style.cssText = 'position:absolute;right:4px;top:2px;font:11px monospace;color:#c00';
    wrap.appendChild(c); wrap.appendChild(lab); grid.appendChild(wrap);
    const ctx = c.getContext('2d');
    try {
      const ret = new Function('api', 'var ctx = api.ctx, width = api.width, height = api.height;\\n' + code)({ ctx, width: ${W}, height: ${H} });
      let t = 0; const dt = 1/30;
      while (t < T) { ctx.save(); ret.draw(ctx, ${W}, ${H}, t, dt); ctx.restore(); t += dt; }
      ret.draw(ctx, ${W}, ${H}, T, dt);
    } catch (e) { errs.push(T + ': ' + e.message); }
  }
  return errs;
};
</script></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 3 * W + 12, height: 1200 } });
await page.setContent(html);
const errs = await page.evaluate(([c, t]) => window.run(c, t), [code, times]);
if (errs.length) console.log('errors:', errs);
await page.locator('#grid').screenshot({ path: out });
await browser.close();
console.log('wrote', out);
