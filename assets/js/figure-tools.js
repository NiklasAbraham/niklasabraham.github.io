// Long-read figures: a "PNG" button in every figure header (the number "Figure N" is a CSS counter, see _sass/_figure_tools.scss).
// The world maps of the food post have their own exporter (window.fdSavePng, which adds title, legend and source);
// every other figure is rasterised with html-to-image (MIT, self-hosted in assets/vendor/html-to-image/), loaded on the first click.
(function () {
  'use strict';
  const art = document.querySelector('article.da');
  if (!art) return;
  const SEL = 'figure.concept:not(.concept-formula), figure.ee';
  const base = document.currentScript ? new URL('../vendor/html-to-image/html-to-image.js', document.currentScript.src).href : null;
  let loading = null;
  const lib = () => (window.htmlToImage ? Promise.resolve(window.htmlToImage) : loading || (loading = new Promise((ok, no) => { const s = document.createElement('script'); s.src = base; s.onload = () => ok(window.htmlToImage); s.onerror = () => no(new Error('could not load the image library')); document.head.append(s); })));
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const figs = () => [...art.querySelectorAll(SEL)];

  async function save(f, btn) {
    const n = figs().indexOf(f) + 1, title = ((f.querySelector('.concept-title') || {}).textContent || 'figure').trim();
    const name = 'figure-' + String(n).padStart(2, '0') + '-' + slug(title) + '.png';
    const map = f.querySelector('svg.fd-map');
    if (map && window.fdSavePng) { window.fdSavePng(map, name, n); return; }
    const old = btn.textContent; btn.textContent = '…'; btn.disabled = true;
    try {
      const h2i = await lib();
      const bg = getComputedStyle(f).backgroundColor, opaque = bg && !/rgba?\(.*,\s*0\)$/.test(bg) && bg !== 'transparent';
      f.style.counterReset = 'figno ' + (n - 1); // the clone is rendered out of context: keep its number (this element also increments)
      const url = await h2i.toPng(f, { pixelRatio: 2, backgroundColor: opaque ? bg : '#ffffff', filter: (el) => !(el.classList && el.classList.contains('fig-dl')) });
      f.style.counterReset = '';
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    } catch (e) { f.style.counterReset = ''; console.error(e); btn.textContent = 'failed'; setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 2000); return; }
    btn.textContent = old; btn.disabled = false;
  }

  function ensure() {
    for (const f of figs()) {
      if (f.querySelector('video') && !f.querySelector('img, canvas, svg')) continue; // nothing to take a still of
      const head = f.querySelector(':scope > header');
      if (!head || head.querySelector('.fig-dl')) continue;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'fig-dl'; b.textContent = '↓ PNG'; b.title = 'Save this figure as a PNG image';
      b.addEventListener('click', () => save(f, b));
      head.append(b);
    }
  }
  ensure();
  new MutationObserver(ensure).observe(art, { childList: true, subtree: true });
})();
