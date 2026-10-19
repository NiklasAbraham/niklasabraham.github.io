// Diffusion architecture gallery: filter, search, timeline, compare view, detail dialog.
(function () {
  const root = document.querySelector('.dg');
  if (!root) return;
  const data = JSON.parse(document.getElementById('dg-data').textContent);
  const glossEl = document.getElementById('dg-gloss');
  const gloss = glossEl ? JSON.parse(glossEl.textContent) : { role: {}, key: {} };
  const byId = Object.fromEntries(data.map((m) => [m.id, m]));
  const cards = [...root.querySelectorAll('.dg-card')];
  const rows = [...root.querySelectorAll('.dg-table tbody tr')];
  const state = { domain: 'all', q: '' };

  // ---------------------------------------------------------------- timeline
  const axis = root.querySelector('.dg-axis');
  const y0 = 2020, y1 = 2026;
  const pos = (y) => 6 + ((y - y0) / (y1 - y0)) * 88;
  for (let y = y0; y <= y1; y++) {
    const t = document.createElement('span');
    t.className = 'tick';
    t.style.left = pos(y) + '%';
    t.textContent = y;
    axis.appendChild(t);
  }
  const perYear = {};
  const pins = data.map((m) => {
    const k = (perYear[m.year] = (perYear[m.year] || 0) + 1) - 1;
    const b = document.createElement('button');
    b.className = 'pin ' + m.domain;
    b.innerHTML = '<i></i>' + m.name;
    b.style.left = pos(m.year) + (k % 2 ? 4.2 : -4.2) * (k > 0 || perYear[m.year] > 1 ? 1 : 0) + '%';
    b.style.bottom = 6 + Math.floor(k / 2) * 23 + 'px';
    b.dataset.id = m.id;
    b.addEventListener('click', () => {
      const c = document.getElementById(m.id);
      if (c.hidden) return;
      if (state.view === 'table') setView('grid');
      c.scrollIntoView({ behavior: 'smooth', block: 'start' });
      c.classList.add('hit');
      setTimeout(() => c.classList.remove('hit'), 1400);
    });
    axis.appendChild(b);
    return b;
  });
  // spread same-year pins evenly once all are known
  Object.entries(perYear).forEach(([year, n]) => {
    const group = pins.filter((p) => byId[p.dataset.id].year === +year);
    group.forEach((p, i) => {
      const off = n === 1 ? 0 : (i % 2 ? 1 : -1) * 4.4;
      p.style.left = pos(+year) + (n === 1 ? 0 : off) + '%';
      p.style.bottom = 6 + Math.floor(i / 2) * 23 + 'px';
    });
  });
  const maxStack = Math.max(...Object.values(perYear).map((n) => Math.ceil(n / 2)));
  axis.style.height = 18 + maxStack * 23 + 'px';

  // ---------------------------------------------------------------- filtering
  function visible(id) {
    const m = byId[id];
    if (state.domain !== 'all' && m.domain !== state.domain) return false;
    if (!state.q) return true;
    const card = document.getElementById(id);
    return card.dataset.search.toLowerCase().includes(state.q);
  }
  function apply() {
    cards.forEach((c) => (c.hidden = !visible(c.dataset.id)));
    rows.forEach((r) => (r.hidden = !visible(r.dataset.id)));
    pins.forEach((p) => p.classList.toggle('off', !visible(p.dataset.id)));
  }
  root.querySelectorAll('[data-filter]').forEach((b) =>
    b.addEventListener('click', () => {
      root.querySelectorAll('[data-filter]').forEach((x) => x.classList.toggle('on', x === b));
      state.domain = b.dataset.filter;
      apply();
    })
  );
  root.querySelector('.dg-search input').addEventListener('input', (e) => {
    state.q = e.target.value.trim().toLowerCase();
    apply();
  });

  // ---------------------------------------------------------------- views
  function setView(v) {
    state.view = v;
    root.querySelectorAll('[data-view]').forEach((x) => x.classList.toggle('on', x.dataset.view === v));
    root.querySelectorAll('[data-view-panel]').forEach((p) => (p.hidden = p.dataset.viewPanel !== v));
  }
  root.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  rows.forEach((r) =>
    r.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      open(r.dataset.id);
    })
  );

  // ---------------------------------------------------------------- dialog
  const dlg = root.querySelector('.dg-modal');
  const fig = dlg.querySelector('.dg-modal-svg');
  const figWrap = dlg.querySelector('.dg-modal-fig');
  const tip = dlg.querySelector('.dg-tip');
  const insp = dlg.querySelector('.dg-insp');
  const body = dlg.querySelector('.dg-modal-body');
  const count = dlg.querySelector('.dg-modal-count');
  const ROLE = {
    io: 'input / output', embed: 'embedding / projection', attn: 'attention', mlp: 'MLP / transition',
    norm: 'norm / modulation', conv: 'convolution / ResBlock', cond: 'conditioning', latent: 'autoencoder',
    pair: 'pair representation',
  };
  let current = null;
  let pinned = null;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ext = (u, label) => `<a href="${esc(u)}" target="_blank" rel="noopener">${label} <span aria-hidden="true">↗</span></a>`;

  const EMPTY = '<p class="dg-insp-empty"><strong>Explore the drawing.</strong> Hover a block for its tensor shapes; ' +
    'click it to pin the full explanation and the paper it comes from.</p>';

  // "What this kind of layer does": the same words wherever that layer type appears. Opening it
  // once is a preference, so it stays open for the next block and the next visit.
  const GLOSS_KEY = 'dg-gloss-open';
  let glossOpen = false;
  try { glossOpen = localStorage.getItem(GLOSS_KEY) === '1'; } catch (e) { /* private mode */ }
  const glossFor = (b, k) => gloss.key[k] || gloss.role[b.role] || '';

  function renderInspector(k) {
    const m = byId[current];
    const b = k && m.blocks[k];
    if (!b) { insp.innerHTML = EMPTY; insp.classList.remove('on'); return; }
    insp.classList.add('on');
    const g = glossFor(b, k);
    insp.innerHTML =
      `<div class="dg-insp-head"><span class="dg-role ${b.role}"><i></i>${ROLE[b.role] || b.role}</span>` +
      `<button class="dg-insp-x" aria-label="Clear selection">✕</button></div>` +
      `<h3>${b.title}</h3>` + (b.sub ? `<p class="dg-insp-sub">${b.sub}</p>` : '') +
      (b.dims ? `<div class="dg-insp-dims"><span>shape</span><code>${b.dims}</code></div>` : '') +
      (b.text ? `<p class="dg-insp-text">${b.text}</p>` : '') +
      (g ? `<details class="dg-gloss"${glossOpen ? ' open' : ''}>` +
           `<summary>What this kind of layer does</summary><p>${g}</p></details>` : '') +
      (b.refs.length ? `<p class="dg-insp-refs"><span>Read more</span>${b.refs.map((r) => ext(r.url, esc(r.label))).join('')}</p>` : '');
    insp.querySelector('.dg-insp-x').addEventListener('click', () => select(null));
    const det = insp.querySelector('.dg-gloss');
    if (det) det.addEventListener('toggle', () => {
      glossOpen = det.open;
      try { localStorage.setItem(GLOSS_KEY, glossOpen ? '1' : '0'); } catch (e) { /* private mode */ }
    });
  }

  function mark(k, cls) {
    fig.querySelectorAll('.blk').forEach((g) => g.classList.toggle(cls, g.dataset.k === k));
  }

  // Hover intent: sweeping the pointer across the drawing should not flash every block it
  // crosses. Entering waits a moment before anything changes; leaving waits longer still, so
  // moving between two blocks does not blank the panel in between.
  const ENTER_MS = 110, LEAVE_MS = 240;
  let hoverTimer = null, hovered = null;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hover(k, ev) {
    if (ev && k && k === hovered) { moveTip(ev); return; }  // same block: just follow the pointer
    clearTimeout(hoverTimer);
    const run = () => { hovered = k; applyHover(k, ev); };
    if (reduceMotion || (k && hovered)) run();              // block → block switches at once
    else hoverTimer = setTimeout(run, k ? ENTER_MS : LEAVE_MS);
  }

  function applyHover(k, ev) {
    mark(k, 'hl');
    figWrap.classList.toggle('focus', !!(k || pinned));
    if (!k) { tip.hidden = true; if (pinned) mark(pinned, 'hl'); return; }
    const b = byId[current].blocks[k];
    tip.innerHTML = `<strong>${b.title}</strong>${b.dims ? `<code>${b.dims}</code>` : b.sub ? `<span>${b.sub}</span>` : ''}`;
    tip.hidden = false;
    if (ev) moveTip(ev);
    if (!pinned) renderInspector(k);
  }
  function moveTip(ev) {
    const r = figWrap.getBoundingClientRect();
    const x = Math.min(ev.clientX - r.left + 14, r.width - tip.offsetWidth - 8);
    const y = ev.clientY - r.top + figWrap.scrollTop + 16;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = y + 'px';
  }
  function select(k) {
    pinned = pinned === k ? null : k;
    mark(pinned, 'sel');
    mark(pinned, 'hl');
    figWrap.classList.toggle('focus', !!pinned);
    renderInspector(pinned);
    history.replaceState(null, '', '#' + current + (pinned ? '/' + pinned : ''));
  }

  function open(id, block) {
    const m = byId[id];
    current = id;
    pinned = null;
    // re-id the cloned SVG's markers so they do not collide with the card's
    fig.innerHTML = document.getElementById(id).querySelector('.dg-svg').outerHTML
      .replaceAll(`id="${id}-`, `id="${id}-m-`).replaceAll(`#${id}-`, `#${id}-m-`)
      .replaceAll(`aria-labelledby="${id}-`, `aria-labelledby="${id}-m-`);
    fig.querySelectorAll('.blk').forEach((g) => {
      const k = g.dataset.k;
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', m.blocks[k] ? m.blocks[k].title.replace(/<[^>]+>/g, '') : k);
      g.addEventListener('mouseenter', (e) => hover(k, e));
      g.addEventListener('mousemove', moveTip);
      g.addEventListener('mouseleave', () => hover(null));
      g.addEventListener('focus', () => { if (!pinned) renderInspector(k); });
      g.addEventListener('click', (e) => { e.stopPropagation(); tip.hidden = true; select(k); });
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(k); } });
    });
    figWrap.classList.remove('focus');
    renderInspector(null);

    const facts = [
      ['Works on', m.space], ['Backbone', m.backbone], ['Parameters', m.params],
      ['Conditioning', m.conditioning], ['Objective', m.objective], ['Sampling steps', m.steps],
    ];
    const links = m.links.length ? m.links : m.url ? [{ label: m.paper, url: m.url }] : [];
    body.innerHTML =
      `<h2>${esc(m.name)}</h2>` +
      `<p class="dg-org"><span class="dg-dom ${m.domain}">${m.domain === 'bio' ? 'biomolecules' : 'images'}</span>${esc(m.org)} · ${m.year}</p>` +
      (links.length ? `<p class="dg-linkrow">${links.map((l) => ext(l.url, esc(l.label))).join('')}</p>` : '') +
      `<p class="dg-novelty">${esc(m.novelty)}</p>` +
      (m.vs ? `<p class="dg-vs"><i aria-hidden="true"></i>Magenta outlines: new relative to ${esc(m.vs)}.</p>` : '') +
      (m.overview.length ? `<h4>How it works</h4>${m.overview.map((t) => `<p>${t}</p>`).join('')}` : '') +
      (m.flow.length ? `<h4>Shapes through one forward pass</h4><table class="dg-flow"><tbody>${m.flow.map((r) =>
        `<tr><th>${r.stage}</th><td><code>${r.shape}</code></td></tr>`).join('')}</tbody></table>` : '') +
      `<h4>At a glance</h4><dl class="dg-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` +
      `<h4>Details</h4><ul>${m.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` +
      `<p class="dg-paper">${m.url ? ext(m.url, esc(m.paper)) : esc(m.paper)}</p>`;
    dlg.querySelector('.dg-modal-side').scrollTop = 0;
    figWrap.scrollTop = 0;
    const list = order();
    count.textContent = `${list.indexOf(id) + 1} / ${list.length}`;
    if (!dlg.open) dlg.showModal();
    history.replaceState(null, '', '#' + id);
    if (block && m.blocks[block]) select(block);
  }
  const order = () => cards.filter((c) => !c.hidden).map((c) => c.dataset.id);
  function step(d) {
    const list = order();
    const i = list.indexOf(current);
    open(list[(i + d + list.length) % list.length]);
  }
  function close() {
    dlg.close();
  }
  // ---------------------------------------------------------------- PNG export
  // The drawings carry only class names, so a standalone copy needs the stylesheet, the resolved
  // colour tokens and the fonts inlined: an SVG rendered through an <img> loads no external
  // resources of its own.
  const PNG_SCALE = 2;
  const FONTS = [['/assets/vendor/fonts/inter/files/inter-latin-400-normal.woff2', 400],
                 ['/assets/vendor/fonts/inter/files/inter-latin-600-normal.woff2', 600],
                 ['/assets/vendor/fonts/inter/files/inter-latin-700-normal.woff2', 700],
                 ['/assets/vendor/fonts/inter/files/inter-greek-400-normal.woff2', 400],
                 ['/assets/vendor/fonts/inter/files/inter-greek-600-normal.woff2', 600]];
  let fontCss = null;

  async function inlineFonts() {
    if (fontCss !== null) return fontCss;
    try {
      const faces = await Promise.all(FONTS.map(async ([url, weight]) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(url + ': ' + r.status);
        const buf = new Uint8Array(await r.arrayBuffer());
        let s = '';
        for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
        return `@font-face{font-family:'Inter';font-style:normal;font-weight:${weight};` +
               `src:url(data:font/woff2;base64,${btoa(s)}) format('woff2');}`;
      }));
      fontCss = faces.join('');
    } catch (e) {
      fontCss = '';  // fall back to the system sans rather than failing the download
    }
    return fontCss;
  }

  // Every rule the drawings depend on, read back out of the page's own stylesheet so the export
  // cannot drift from what is on screen.
  function svgCss() {
    const rules = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch (e) { continue; }  // a cross-origin sheet, if ever
      if (!list) continue;
      for (const rule of list) {
        if (rule.selectorText && /(^|,)\s*\.dg-svg\b/.test(rule.selectorText)) rules.push(rule.cssText);
      }
    }
    const css = rules.join('\n');
    const style = getComputedStyle(document.documentElement);
    const vars = [...new Set(css.match(/--dg-[\w-]+/g) || [])]
      .map((v) => `${v}:${style.getPropertyValue(v).trim()};`).join('');
    return `:root{${vars}}\n${css}`;
  }

  async function downloadPng() {
    const src = fig.querySelector('svg');
    if (!src) return;
    const btn = dlg.querySelector('.dg-png');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = '…';
    try {
      const svg = src.cloneNode(true);
      // export the drawing as it is drawn, not as it is currently being explored
      svg.querySelectorAll('.blk').forEach((g) => {
        g.classList.remove('hl', 'sel');
        g.removeAttribute('tabindex');
        g.removeAttribute('role');
      });
      const [, , vw, vh] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
      svg.setAttribute('width', vw);
      svg.setAttribute('height', vh);
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.textContent = (await inlineFonts()) + svgCss();
      svg.insertBefore(style, svg.firstChild);

      const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>' + new XMLSerializer().serializeToString(svg)],
                            { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise((ok, fail) => {
        img.onload = ok;
        img.onerror = () => fail(new Error('the drawing could not be rasterised'));
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(vw * PNG_SCALE);
      canvas.height = Math.round(vh * PNG_SCALE);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--dg-panel').trim() || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const png = await new Promise((ok) => canvas.toBlob(ok, 'image/png'));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(png);
      a.download = `${current}-architecture.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      btn.textContent = 'failed';
      setTimeout(() => { btn.textContent = label; btn.disabled = false; }, 1600);
      return;
    }
    btn.textContent = label;
    btn.disabled = false;
  }
  dlg.querySelector('.dg-png').addEventListener('click', downloadPng);

  figWrap.addEventListener('click', () => { if (pinned) select(pinned); });
  dlg.addEventListener('close', () => history.replaceState(null, '', location.pathname));
  dlg.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => step(+b.dataset.step)));
  dlg.querySelector('.dg-close').addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  document.addEventListener('keydown', (e) => {
    if (!dlg.open) return;
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  cards.forEach((c) => {
    c.querySelector('.dg-figure').addEventListener('click', () => open(c.dataset.id));
    const ex = c.querySelector('.dg-explore');
    if (ex) ex.addEventListener('click', () => open(c.dataset.id));
  });

  function fromHash() {
    const [hid, hblk] = location.hash.slice(1).split('/');
    if (hid && byId[hid] && !(dlg.open && current === hid && pinned === (hblk || null))) open(hid, hblk);
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
