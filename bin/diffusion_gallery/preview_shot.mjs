// Screenshot the gallery preview page, light and dark, one PNG per card and theme.
//   node preview_shot.mjs <preview/index.html> <out dir> <id> [<id> …]
// Prints console errors and text that runs out of its box (rect.bx / .pl / .rep) or out of the drawing.
// Playwright comes from DG_PLAYWRIGHT, else the Website project's node_modules.
const pw = process.env.DG_PLAYWRIGHT || '/home/niklas/code/Website/node_modules/playwright/index.mjs';
const { chromium } = await import(pw);
const [page_path, out, ...ids] = process.argv.slice(2);

const b = await chromium.launch();
for (const theme of ['light', 'dark']) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('requestfailed', r => errs.push('failed: ' + r.url()));
  await p.goto(`file://${page_path}?theme=${theme}`);
  await p.evaluate(() => document.fonts.ready);
  for (const id of ids) {
    const f = `${out}/gallery_${id}_${theme}.png`;
    await p.locator(`#${id} .dg-figure`).screenshot({ path: f });
    console.log(f);
  }
  if (theme === 'light') {
    // a text belongs to the smallest box that contains its centre; same geometry in both themes
    const over = await p.evaluate(ids => ids.flatMap(id => {
      const svg = document.querySelector(`#${id} svg.dg-svg`), S = svg.getBoundingClientRect();
      const boxes = [...svg.querySelectorAll('rect.bx, rect.pl, rect.rep')].map(r => r.getBoundingClientRect());
      const k = S.width / svg.viewBox.baseVal.width, tol = 0.5 * k, bad = [];
      for (const t of svg.querySelectorAll('text')) {
        const r = t.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
        const host = boxes.filter(q => q.left <= cx && cx <= q.right && q.top <= cy && cy <= q.bottom)
          .sort((a, c) => a.width * a.height - c.width * c.height)[0] || S;
        const d = Math.max(host.left - r.left, r.right - host.right, host.top - r.top, r.bottom - host.bottom);
        if (d > tol) bad.push(`${id}: "${t.textContent}" ${host === S ? 'leaves the drawing' : 'overflows its box'} by ${(d / k).toFixed(1)} units`);
      }
      return bad;
    }), ids);
    console.log(over.length ? 'text overflow:\n  ' + over.join('\n  ') : 'text overflow: none');
  }
  console.log(`${theme} errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  await p.close();
}
await b.close();
