// Reading aids for the architecture gallery (/projects/diffusion-architectures/), in the same style as
// the long read's (assets/js/da-guide.js), and reusing its #da-rail / #da-railbtn / #da-veil / #da-zoom
// styles from _sass/_diffusion_article.scss:
//  - a contents rail on the left listing the gallery's parts and its fourteen models, the one in view
//    marked; models hidden by the filter or the search are dimmed; on narrow screens the rail opens
//    from a "Contents" button as an overlay;
//  - click-to-enlarge for every drawing (the card's "⤢ enlarge" button).
(function () {
  'use strict';
  const root = document.querySelector('.dg');
  if (!root) return;
  const cards = [...root.querySelectorAll('.dg-card')];
  const LI = root.dataset.contact || '';
  const LONG = root.dataset.longread || '';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------------------------------------------------------------- the rail
  const link = (id, n, title, extra) =>
    `<a href="#${id}" data-id="${id}"><span class="tn">${n}</span><span>${esc(title)}</span>${extra ? `<span class="ty">${extra}</span>` : ''}</a>`;
  const part = (label, title) => `<div class="rpart"><span>${label}</span>${title}</div>`;
  let html = '<div class="rprog"><span></span></div>'
    + '<div class="tbrand">Architecture gallery</div>'
    + `<div class="tsub">${cards.length} diffusion models · one drawing language</div>`
    + '<div class="tlabel">Contents</div><nav>'
    + part('Start', 'Before the drawings')
    + link('dg-top', '', 'About this gallery')
    + link('dg-intro', '', 'The interface and the legend');
  const groups = [['image', 'Part I', 'Images'], ['bio', 'Part II', 'Biomolecules']];
  groups.forEach(([dom, label, title]) => {
    const list = cards.filter((c) => c.dataset.domain === dom);
    if (!list.length) return;
    html += part(label, title);
    list.forEach((c) => { html += link(c.id, c.dataset.n, c.dataset.name, c.dataset.year); });
  });
  html += part('After the gallery', 'Comparisons and sources')
    + '<a href="#dg-toolbar" data-id="dg-compare" data-compare="1"><span class="tn"></span><span>All fourteen in one table</span></a>'
    + link('dg-readings', '', 'What the drawings make visible')
    + link('dg-sources', '', 'Sources and notes')
    + '</nav><div class="tfoot">';
  if (LONG) html += `Why each block is there: <a href="${LONG}">the long read</a>.<br>`;
  if (LI) html += `Found a mistake? <a href="${LI}" target="_blank" rel="noopener">Message me on LinkedIn</a>.`;
  html += '</div>';

  const rail = document.createElement('aside');
  rail.id = 'da-rail';
  rail.className = 'dg-rail';
  rail.setAttribute('aria-label', 'Contents');
  rail.innerHTML = html;
  document.body.appendChild(rail);
  document.body.classList.add('dg-has-rail');

  const btn = document.createElement('button');
  btn.id = 'da-railbtn';
  btn.type = 'button';
  btn.setAttribute('aria-controls', 'da-rail');
  btn.setAttribute('aria-label', 'Contents');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<i></i><i></i><i></i><span>Contents</span>';
  document.body.appendChild(btn);
  const veil = document.createElement('div');
  veil.id = 'da-veil';
  document.body.appendChild(veil);
  const setOpen = (o) => { document.body.classList.toggle('da-rail-open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); };
  btn.addEventListener('click', () => setOpen(!document.body.classList.contains('da-rail-open')));
  veil.addEventListener('click', () => setOpen(false));

  const navbar = document.getElementById('navbar');
  const place = () => {
    const top = navbar ? navbar.getBoundingClientRect().bottom : 0;
    rail.style.top = Math.max(0, top) + 'px';
    btn.style.top = Math.max(0, top) + 12 + 'px';
  };
  place();
  window.addEventListener('resize', place);

  // A rail link to a card the filter or the search hides, or while the compare table is shown:
  // reset the view first, then scroll.
  const press = (sel) => { const b = root.querySelector(sel); if (b && !b.classList.contains('on')) b.click(); };
  rail.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    setOpen(false);
    if (a.dataset.compare) {
      e.preventDefault();
      press('[data-view="table"]');
      document.getElementById('dg-toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const card = document.getElementById(a.dataset.id);
    if (!card || !card.classList.contains('dg-card')) return;
    e.preventDefault();
    press('[data-view="grid"]');
    if (card.hidden) {
      press('[data-filter="all"]');
      const q = root.querySelector('.dg-search input');
      if (q && q.value) { q.value = ''; q.dispatchEvent(new Event('input')); }
    }
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', location.pathname);
  });

  // ---------------------------------------------------------------- scrollspy
  const links = [...rail.querySelectorAll('nav a')];
  const prog = rail.querySelector('.rprog span');
  const targets = links.map((a) => [a, document.getElementById(a.dataset.compare ? 'dg-toolbar' : a.dataset.id)])
    .filter(([, el]) => el && !el.closest('[data-view-panel="table"]'));
  let current = null;
  const spy = () => {
    const y = 160;
    // the last target above the line; of two cards side by side in a row, the first
    let cur = targets[0], curTop = -Infinity;
    for (const t of targets) {
      const el = t[1];
      if (el.hidden || el.offsetParent === null) continue;
      const top = el.getBoundingClientRect().top;
      if (top >= y) break;
      if (Math.abs(top - curTop) > 8) { cur = t; curTop = top; }
    }
    const r = root.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (y - r.top) / (r.height - window.innerHeight * 0.6)));
    prog.style.width = (frac * 100).toFixed(1) + '%';
    if (!cur || cur[0] === current) return;
    current = cur[0];
    links.forEach((a) => a.classList.toggle('on', a === current));
    if (!document.body.classList.contains('da-rail-open')) {
      const rr = rail.getBoundingClientRect(), ar = current.getBoundingClientRect();
      if (ar.top < rr.top + 80 || ar.bottom > rr.bottom - 40) rail.scrollTop += ar.top - rr.top - rr.height / 2;
    }
  };
  let ticking = false;
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; spy(); }); } }, { passive: true });
  spy();

  // dim the models the filter or the search hides
  const dim = () => links.forEach((a) => {
    const c = document.getElementById(a.dataset.id);
    a.classList.toggle('off', !!(c && c.classList.contains('dg-card') && c.hidden));
  });
  cards.forEach((c) => new MutationObserver(dim).observe(c, { attributes: true, attributeFilter: ['hidden'] }));
  root.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { current = null; requestAnimationFrame(spy); }));

  // ---------------------------------------------------------------- enlarge
  const box = document.createElement('div');
  box.id = 'da-zoom';
  box.className = 'dg-zoombox';
  box.innerHTML = '<div class="zbar"><span class="zt"></span><span class="zh">click the drawing for full size · Esc to close</span><button type="button" class="zx" aria-label="Close">✕</button></div><div class="zstage"></div>';
  document.body.appendChild(box);
  const stage = box.querySelector('.zstage');
  const close = () => { box.classList.remove('open'); document.body.classList.remove('da-zoom-open'); stage.innerHTML = ''; };
  box.querySelector('.zx').addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); setOpen(false); } });
  stage.addEventListener('click', () => stage.classList.toggle('full'));
  const open = (card) => {
    const src = card.querySelector('.dg-figure svg');
    if (!src) return;
    const node = src.cloneNode(true);
    // fresh ids so the clone's arrow markers do not clash with the card's
    const sfx = '-z' + Math.random().toString(36).slice(2, 7);
    node.querySelectorAll('[id]').forEach((el) => {
      const old = el.id;
      el.id = old + sfx;
      node.querySelectorAll(`[marker-end="url(#${old})"]`).forEach((p) => p.setAttribute('marker-end', `url(#${old}${sfx})`));
    });
    node.setAttribute('aria-labelledby', (node.getAttribute('aria-labelledby') || '') + sfx);
    stage.innerHTML = '';
    stage.classList.remove('full');
    stage.appendChild(node);
    box.querySelector('.zt').textContent = card.dataset.name || '';
    box.classList.add('open');
    document.body.classList.add('da-zoom-open');
  };
  cards.forEach((c) => {
    const b = c.querySelector('[data-zoom]');
    if (b) b.addEventListener('click', (e) => { e.stopPropagation(); open(c); });
  });
})();
