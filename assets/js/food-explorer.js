// Interactive figures of the food long read: choropleth atlas, concentration, time machine, trade flows
// (map and matrix), diets and a country page. Data: assets/food-article/{food,trade,diet,world}.json, made by
// bin/food_article from FAOSTAT (production, detailed trade matrix, food balance sheets) and Natural Earth.
// Every figure is a <figure data-fd="..."> that this script fills when it scrolls into view; each data file is
// fetched once, on first use. Vanilla SVG/HTML, no library, nothing leaves the page.
(function () {
  'use strict';
  const roots = [...document.querySelectorAll('[data-fd]')];
  if (!roots.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#04204B', MUTED = '#6b7280', RULE = '#c9d0dc', BLUE = '#0b4fc0', WARM = '#b4552f', TEAL = '#138374';
  const RAMP = ['#E8EFFA', '#C3D6F1', '#8FB2E4', '#5489D2', '#2260BE', '#073A87'];
  const RAMP_W = ['#FBEEE7', '#F3CDB9', '#E5A07F', '#D07548', '#B4552F', '#7E3416'];
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BASE = roots[0].dataset.base;

  // ------------------------------------------------------------------ helpers
  function h(tag, attrs, ...kids) {
    const svg = tag.startsWith('svg:');
    const e = svg ? document.createElementNS(NS, tag.slice(4)) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.setAttribute('class', v);
      else if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
    return e;
  }
  const sum = (a) => a.reduce((x, y) => x + (y || 0), 0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const f0 = (v) => (v == null ? '–' : Math.round(v).toLocaleString('en-US'));
  const f1 = (v) => (v == null ? '–' : v.toFixed(1));
  const pct = (x) => (x == null ? '–' : x >= 10 ? Math.round(x) + ' %' : x >= 1 ? x.toFixed(1) + ' %' : x >= 0.1 ? x.toFixed(1) + ' %' : '< 0.1 %');
  const fmtT = (t) => (t == null ? '–' : t >= 1e9 ? (t / 1e9).toFixed(2) + ' bn t' : t >= 1e7 ? Math.round(t / 1e6) + ' Mt' : t >= 1e6 ? (t / 1e6).toFixed(1) + ' Mt' : t >= 1e4 ? Math.round(t / 1e3) + ' kt' : t >= 1e3 ? (t / 1e3).toFixed(1) + ' kt' : Math.round(t) + ' t');
  const fmtV = (k) => (k == null ? '–' : k >= 1e6 ? '$' + (k / 1e6).toFixed(k >= 1e7 ? 0 : 1) + ' bn' : k >= 1e3 ? '$' + Math.round(k / 1e3) + ' m' : '$' + Math.round(k) + ' k');
  const sig2 = (v) => { if (!v) return 0; const e = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.round(v / e) * e; };
  const el = (id, kids) => document.getElementById(id) || kids;

  // data files, fetched once
  const cache = {};
  const load = (name) => cache[name] || (cache[name] = fetch(BASE + name + '.json').then((r) => { if (!r.ok) throw new Error(name + ': ' + r.status); return r.json(); }));
  let F, T, D, W, NAME, GCOL, COMM, INFO;
  async function need(list) {
    const got = await Promise.all(list.map(load));
    list.forEach((k, i) => { if (k === 'food') F = got[i]; if (k === 'trade') T = got[i].trade; if (k === 'diet') D = got[i]; if (k === 'world') W = got[i]; });
    if (F && !COMM) {
      COMM = Object.fromEntries(F.comms.map((c) => [c.id, c]));
      GCOL = Object.fromEntries(F.groups.map((g) => [g.id, g.c]));
      INFO = Object.fromEntries(F.groups.map((g) => [g.id, g]));
      const tot = {};
      for (const c of F.comms) tot[c.id] = sum(Object.values(F.prod[c.id]).map((v) => v[0]));
      F.tot = tot;
    }
  }
  const nm = (m) => (F && F.countries[m] ? F.countries[m].n : W && W.c[m] ? W.c[m].n : m);
  const yi = () => F.years.indexOf(F.year);

  // ------------------------------------------------------------------ tooltip, frame, controls
  const tip = h('div', { class: 'bx-tip', hidden: true, role: 'tooltip' });
  document.body.append(tip);
  function showTip(ev, html) {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
    if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
  }
  const hideTip = () => { tip.hidden = true; };

  function frame(root, kind) {
    root.classList.add('concept', 'bx', 'fd');
    const title = root.dataset.title, cap = root.dataset.caption;
    root.innerHTML = '';
    const ctrl = h('div', { class: 'bx-ctrl' }), stage = h('div', { class: 'bx-stage' }), legend = h('div', { class: 'bx-legend' });
    root.append(h('header', {}, h('span', { class: 'concept-kind' }, kind), h('span', { class: 'concept-title' }, title)), ctrl, stage, legend);
    if (cap) root.append(h('figcaption', {}, cap));
    return { ctrl, stage, legend };
  }
  function seg(options, current, onPick) {
    const wrap = h('span', { class: 'bx-seg' });
    for (const [v, label, off] of options) {
      wrap.append(h('button', { type: 'button', class: v === current ? 'on' : '', 'aria-pressed': v === current ? 'true' : 'false', disabled: off || null, 'data-v': v, onclick: () => { onPick(v); setSeg(wrap, v); } }, label));
    }
    return wrap;
  }
  const setSeg = (wrap, v) => [...wrap.children].forEach((b) => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); });
  function commSelect(value, onPick, pool, label) {
    const sel = h('select', { class: 'bx-select', 'aria-label': label || 'commodity' });
    for (const g of F.groups) {
      const items = pool.filter((c) => c.g === g.id);
      if (!items.length) continue;
      const og = h('optgroup', { label: g.n });
      for (const c of items) og.append(h('option', { value: c.id }, c.n));
      sel.append(og);
    }
    sel.value = value;
    sel.addEventListener('change', () => onPick(sel.value));
    return sel;
  }
  function countrySelect(value, onPick, pool, placeholder) {
    const sel = h('select', { class: 'bx-select', 'aria-label': 'country' });
    if (placeholder) sel.append(h('option', { value: '' }, placeholder));
    const regions = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania', ''];
    for (const r of regions) {
      const og = h('optgroup', { label: r || 'Other' });
      pool.filter((m) => ((F.countries[m] || {}).r || '') === r).sort((a, b) => nm(a).localeCompare(nm(b))).forEach((m) => og.append(h('option', { value: m }, nm(m))));
      if (og.children.length) sel.append(og);
    }
    sel.value = value || '';
    sel.addEventListener('change', () => onPick(sel.value));
    return sel;
  }
  const lbl = (t) => h('span', { class: 'bx-lbl' }, t);
  function chips(items, active, onToggle) { // items: [id, label, colour]
    const wrap = h('div', { class: 'bx-chips' });
    for (const [id, label, col] of items) {
      wrap.append(h('button', { type: 'button', class: 'bx-chip' + (active.has(id) ? ' on' : ''), onclick: () => { onToggle(id); wrap.querySelectorAll('.bx-chip').forEach((b) => b.classList.toggle('on', active.has(b.dataset.id))); }, 'data-id': id }, h('i', { style: 'background:' + col }), label));
    }
    return wrap;
  }
  function observe(el, fn) {
    let w = 0;
    const ro = new ResizeObserver(() => { const nw = Math.round(el.getBoundingClientRect().width); if (nw && nw !== w) { w = nw; fn(w); } });
    ro.observe(el);
  }
  function lazy(root, fn) {
    const go = () => fn(root).catch((e) => { console.error(e); root.append(h('p', { class: 'bx-err' }, 'This figure failed to load: ' + e.message)); });
    if (!('IntersectionObserver' in window)) return go();
    root.classList.add('fd');
    root.append(h('div', { class: 'fd-wait' }, 'loading …'));
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: '700px 0px' });
    io.observe(root);
  }

  // ------------------------------------------------------------------ PNG download of a map
  // The live SVG is styled by CSS classes, which an image does not carry: copy the computed paint onto a clone,
  // draw it on a canvas under the figure's title and above its legend and caption, and save the canvas.
  const PAINT = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'paint-order', 'font-family', 'font-size', 'font-weight'];
  window.fdSavePng = savePng;
  function savePng(svg, fileName, figNo) {
    const fig = svg.closest('figure'), clone = svg.cloneNode(true), live = [svg, ...svg.querySelectorAll('*')], copy = [clone, ...clone.querySelectorAll('*')];
    live.forEach((el, i) => {
      const cs = getComputedStyle(el), c = copy[i];
      if (el.classList && el.classList.contains('fd-hit')) { c.remove(); return; }
      for (const k of PAINT) c.style.setProperty(k, cs.getPropertyValue(k));
      c.style.removeProperty('vector-effect');
    });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const vb = svg.viewBox.baseVal, MW = 2400, PAD = 72, mapW = MW - 2 * PAD, mapH = Math.round(mapW * vb.height / vb.width);
    clone.setAttribute('width', mapW); clone.setAttribute('height', mapH);
    const title = fig.querySelector('.concept-title').textContent, sub = (fig.querySelector('.fd-side h4') || {}).textContent || '';
    const sw = [...fig.querySelectorAll('.bx-legend .fd-sw')].map((e) => ({ col: getComputedStyle(e.querySelector('i')).backgroundColor, op: getComputedStyle(e.querySelector('i')).opacity, t: e.textContent.trim() }));
    const cap = (fig.querySelector('figcaption') || {}).textContent || '';
    const font = (px, w) => `${w || 400} ${px}px Inter, system-ui, sans-serif`;
    const probe = document.createElement('canvas').getContext('2d');
    const wrap = (text, px, maxW) => { probe.font = font(px); const lines = []; let cur = ''; for (const w of text.split(/\s+/)) { const t = cur ? cur + ' ' + w : w; if (probe.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; };
    const capLines = wrap(cap + '  niklas-abraham.de', 30, mapW), top = PAD + 70 + (sub ? 56 : 0) + 20, legY = top + mapH + 44;
    const legH = sw.length ? 70 : 0, H = legY + legH + capLines.length * 42 + PAD;
    const cv = document.createElement('canvas'); cv.width = MW; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, MW, H);
    ctx.fillStyle = '#04204b'; ctx.textBaseline = 'alphabetic'; ctx.font = font(60, 700); ctx.fillText((figNo ? 'Figure ' + figNo + ' · ' : '') + title, PAD, PAD + 52);
    if (sub) { ctx.fillStyle = '#6b7280'; ctx.font = font(38); ctx.fillText(sub, PAD, PAD + 52 + 56); }
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, PAD, top, mapW, mapH);
      let x = PAD; ctx.font = font(30);
      for (const e of sw) { ctx.globalAlpha = +e.op; ctx.fillStyle = e.col; ctx.fillRect(x, legY, 38, 26); ctx.globalAlpha = 1; ctx.strokeStyle = '#c9d0dc'; ctx.lineWidth = 1.5; ctx.strokeRect(x, legY, 38, 26); ctx.fillStyle = '#4a5a78'; ctx.fillText(e.t, x + 50, legY + 23); x += 50 + ctx.measureText(e.t).width + 36; if (x > MW - 300) break; }
      ctx.fillStyle = '#8a93a6'; ctx.font = font(30); capLines.forEach((l, i) => ctx.fillText(l, PAD, legY + legH + 34 + i * 42));
      cv.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fileName || ('world-food-' + (title + ' ' + sub).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png'); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
    };
    img.src = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
  }

  // ------------------------------------------------------------------ the world map
  function worldMap(stage, opts) {
    const o = Object.assign({ hover: null, click: null, label: 'World map' }, opts);
    const svg = h('svg:svg', { class: 'bx-svg fd-map', viewBox: `0 0 ${W.w} ${W.h}`, role: 'img', 'aria-label': o.label });
    svg.append(W.o ? h('svg:path', { d: W.o, fill: '#EEF2F8' }) : h('svg:rect', { x: 0, y: 0, width: W.w, height: W.h, fill: '#EEF2F8', rx: 8 }));
    const fig = stage.closest('.concept'); if (fig) fig.classList.add('fd-widefig');
    const land = h('svg:g', { class: 'fd-land' });
    const paths = {};
    for (const [m, c] of Object.entries(W.c)) {
      const p = h('svg:path', { d: c.d, class: 'fd-c', 'data-m': m, fill: '#fff' });
      paths[m] = p; land.append(p);
    }
    const over = h('svg:g', { class: 'fd-over' }), top = h('svg:g', { class: 'fd-top' });
    svg.append(land, over, top);
    stage.append(svg);
    svg.addEventListener('mousemove', (ev) => { if (ev.target.closest && ev.target.closest('.fd-arc')) return; const p = ev.target.closest && ev.target.closest('.fd-c'); if (p && o.hover) o.hover(p.dataset.m, ev); else hideTip(); });
    svg.addEventListener('mouseleave', hideTip);
    svg.addEventListener('click', (ev) => { const p = ev.target.closest && ev.target.closest('.fd-c'); if (o.click) o.click(p ? p.dataset.m : null); });
    return { svg, paths, over, top, land };
  }
  function classesOf(vals, n) {
    const a = vals.filter((v) => v > 0).sort((x, y) => x - y);
    if (a.length < 2) return [];
    const th = [];
    for (let i = 1; i < n; i++) {
      const v = sig2(a[Math.min(a.length - 1, Math.floor((a.length * i) / n))]);
      if (v > 0 && (!th.length || v > th[th.length - 1])) th.push(v);
    }
    return th;
  }
  const bin = (th, v) => { let i = 0; while (i < th.length && v >= th[i]) i++; return i; };
  function legendRow(th, ramp, fmt, noData) {
    const wrap = h('div', { class: 'fd-leg' });
    const lows = [0, ...th];
    lows.forEach((lo, i) => wrap.append(h('span', { class: 'fd-sw' }, h('i', { style: 'background:' + ramp[i] }), i === 0 ? '< ' + fmt(th[0] || lo) : i === lows.length - 1 ? '≥ ' + fmt(lo) : fmt(lo) + '–' + fmt(lows[i + 1]))));
    if (noData) wrap.append(h('span', { class: 'fd-sw' }, h('i', { class: 'nd' }), noData));
    return wrap;
  }
  function paintMap(map, valueOf, th, ramp) {
    for (const [m, p] of Object.entries(map.paths)) {
      const v = valueOf(m);
      p.setAttribute('fill', v == null || v <= 0 ? '#fff' : ramp[bin(th, v)]);
      p.classList.toggle('nd', v == null || v <= 0);
    }
  }

  // ================================================================== atlas: where is it grown
  async function atlasWidget(root) {
    await need(['food', 'world', 'diet']);
    const st = { comm: root.dataset.comm || 'wheat', metric: root.dataset.metric || 'tonnes', sel: root.dataset.sel || '' };
    const { ctrl, stage, legend } = frame(root, 'map');
    const pool = F.comms;
    const mset = [['tonnes', 'Tonnes'], ['share', 'Share of world'], ['yield', 'Yield per hectare'], ['pc', 'Per person']];
    const metricSeg = seg(mset, st.metric, (v) => { st.metric = v; draw(); });
    ctrl.append(lbl('Commodity'), commSelect(st.comm, (v) => { st.comm = v; draw(); }, pool), lbl('Show'), metricSeg);
    const split = h('div', { class: 'bx-split fd-split' }), mapBox = h('div', { class: 'fd-mapbox' }), side = h('div', { class: 'fd-side' });
    split.append(mapBox, side); stage.append(split);
    const map = worldMap(mapBox, { label: 'Map of production by country', hover: (m, ev) => tipFor(m, ev), click: (m) => { st.sel = m && m === st.sel ? '' : m || ''; draw(); } });
    let cur;
    function values() {
      const prod = F.prod[st.comm], tot = F.tot[st.comm], vals = {};
      const hasArea = Object.values(prod).some((v) => v[1]);
      metricSeg.children[2].disabled = !hasArea;
      if (st.metric === 'yield' && !hasArea) st.metric = 'tonnes';
      setSeg(metricSeg, st.metric);
      const area = sum(Object.values(prod).map((v) => v[1]));
      for (const [m, v] of Object.entries(prod)) {
        if (st.metric === 'tonnes') vals[m] = v[0];
        else if (st.metric === 'share') vals[m] = (v[0] / tot) * 100;
        else if (st.metric === 'yield') { if (v[1] && v[1] >= Math.max(1000, 0.001 * area)) vals[m] = v[0] / v[1]; }
        else if (D.c[m]) vals[m] = (v[0] * 1000) / D.c[m].pop;
      }
      return vals;
    }
    const fmtVal = () => (st.metric === 'tonnes' ? fmtT : st.metric === 'share' ? pct : st.metric === 'yield' ? (v) => (v >= 10 ? Math.round(v) : v.toFixed(1)) + ' t/ha' : (v) => (v >= 10 ? Math.round(v) : v.toFixed(1)) + ' kg');
    function tipFor(m, ev) {
      const v = cur.vals[m], p = F.prod[st.comm][m], tot = F.tot[st.comm];
      if (!W.c[m]) return hideTip();
      const rank = cur.order.indexOf(m) + 1;
      if (!p) return showTip(ev, `<b>${nm(m)}</b><br><span>no ${COMM[st.comm].n.toLowerCase()} production reported in ${F.year}</span>`);
      let rows = `<tr><td>Production</td><td>${fmtT(p[0])}</td></tr><tr><td>Share of world</td><td>${pct((p[0] / tot) * 100)}</td></tr>`;
      if (p[1]) rows += `<tr><td>Harvested area</td><td>${f0(p[1] / 1000)} kha</td></tr><tr><td>Yield</td><td>${f1(p[0] / p[1])} t/ha</td></tr>`;
      if (D.c[m]) rows += `<tr><td>Per person</td><td>${f1((p[0] * 1000) / D.c[m].pop)} kg</td></tr>`;
      showTip(ev, `<b>${nm(m)}</b> <span>${F.year}</span><table>${rows}</table>${v != null ? `<span>rank ${rank} of ${cur.order.length} by the metric shown</span>` : ''}`);
    }
    function draw() {
      const vals = values(), order = Object.keys(vals).sort((a, b) => vals[b] - vals[a]);
      const th = classesOf(Object.values(vals), 6), fmt = fmtVal();
      cur = { vals, order };
      paintMap(map, (m) => vals[m], th, RAMP);
      map.over.replaceChildren();
      for (const [m, p] of Object.entries(map.paths)) p.classList.toggle('sel', m === st.sel);
      if (st.sel && map.paths[st.sel]) map.top.replaceChildren(map.paths[st.sel].cloneNode(false)), map.top.firstChild.setAttribute('class', 'fd-selp'), map.top.firstChild.setAttribute('fill', 'none');
      else map.top.replaceChildren();
      legend.replaceChildren(th.length ? legendRow(th, RAMP, (v) => (st.metric === 'share' && v < 1 ? v.toFixed(v < 0.1 ? 3 : 2) + ' %' : fmt(v).replace(/ t$/, '')), 'none reported') : h('span', { class: 'bx-hint' }, ''));
      // side: ranking
      const prod = F.prod[st.comm], tot = F.tot[st.comm], c = COMM[st.comm];
      const shares = Object.keys(prod).sort((a, b) => prod[b][0] - prod[a][0]);
      let cum = 0, n50 = 0;
      for (const m of shares) { cum += prod[m][0]; n50++; if (cum >= tot / 2) break; }
      const max = vals[order[0]] || 1;
      const left = h('div', { class: 'fd-col' }, h('h4', {}, `${c.n}, ${F.year}`),
        h('div', { class: 'fd-meta' }, `${fmtT(tot)} from ${shares.length} countries; ${n50 === 1 ? 'one country grows' : 'the top ' + n50 + ' grow'} half.`));
      const right = h('div', { class: 'fd-col' }, ...order.slice(0, 10).map((m, i) => h('button', { type: 'button', class: 'fd-rank' + (m === st.sel ? ' on' : ''), onclick: () => { st.sel = m === st.sel ? '' : m; draw(); } },
          h('span', { class: 'n' }, i + 1), h('span', { class: 'nm' }, nm(m)), h('span', { class: 'bar' }, h('i', { style: `width:${(vals[m] / max) * 100}%;background:${GCOL[c.g]}` })), h('span', { class: 'v' }, fmt(vals[m])))));
      if (st.sel && vals[st.sel] != null) {
        const p = prod[st.sel];
        left.append(h('h4', { class: 'sp' }, nm(st.sel)), h('div', { class: 'fd-kv' }, h('span', {}, 'rank'), h('b', {}, '#' + (order.indexOf(st.sel) + 1))), h('div', { class: 'fd-kv' }, h('span', {}, 'production'), h('b', {}, fmtT(p[0]))), h('div', { class: 'fd-kv' }, h('span', {}, 'share of world'), h('b', {}, pct((p[0] / tot) * 100))));
        if (p[1]) left.append(h('div', { class: 'fd-kv' }, h('span', {}, 'yield'), h('b', {}, f1(p[0] / p[1]) + ' t/ha')));
      } else left.append(h('p', { class: 'bx-src' }, 'Click a country on the map or in the list to pin it. Countries too small to be drawn (Singapore, Malta, the Pacific islands) are in the data but not on the map.'));
      side.replaceChildren(left, right);
    }
    draw();
  }

  // ================================================================== plate: calories per person by country
  async function plateWidget(root) {
    await need(['food', 'diet']);
    const st = { set: root.dataset.set || 'big' };
    const { ctrl, stage, legend } = frame(root, 'bars');
    const P = D.plate, ids = Object.keys(D.c);
    const total = (m) => (m === 'world' ? D.world.kcal : D.c[m].kcal);
    const plateOf = (m) => (m === 'world' ? D.world.plate : D.c[m].plate);
    ctrl.append(lbl('Countries'), seg([['big', 'Most populous'], ['low', 'Fewest calories'], ['high', 'Most calories'], ['meat', 'Most from animals']], st.set, (v) => { st.set = v; draw(); }));
    legend.replaceChildren(...P.map((p) => h('span', { class: 'bx-chip static' }, h('i', { style: 'background:' + p.c }), p.n)));
    const big = ids.filter((m) => D.c[m].pop > 3e6);
    function rows() {
      let list;
      if (st.set === 'big') list = ids.slice().sort((a, b) => D.c[b].pop - D.c[a].pop).slice(0, 16);
      else if (st.set === 'low') list = big.sort((a, b) => D.c[a].kcal - D.c[b].kcal).slice(0, 14);
      else if (st.set === 'high') list = big.sort((a, b) => D.c[b].kcal - D.c[a].kcal).slice(0, 14);
      else list = big.sort((a, b) => D.c[b].animal - D.c[a].animal).slice(0, 14);
      return ['world', ...list];
    }
    function draw() {
      stage.replaceChildren();
      const max = 4200;
      const axis = h('div', { class: 'fd-axis' });
      [0, 1000, 2000, 3000, 4000].forEach((t) => axis.append(h('span', { style: `left:${(t / max) * 100}%` }, t ? f0(t) : '0 kcal')));
      const box = h('div', { class: 'fd-rows' });
      for (const m of rows()) {
        const pl = plateOf(m), kc = total(m);
        const bar = h('div', { class: 'fd-stack' });
        for (const p of P) { const v = pl[p.id] || 0; if (v > 0) bar.append(h('i', { style: `width:${(v / max) * 100}%;background:${p.c}` })); }
        const row = h('div', { class: 'fd-row' + (m === 'world' ? ' world' : '') }, h('span', { class: 'nm' }, m === 'world' ? 'World average' : nm(m)), h('div', { class: 'barwrap' }, bar), h('span', { class: 'v' }, f0(kc)));
        row.addEventListener('mousemove', (ev) => {
          const lines = P.filter((p) => pl[p.id] > 0).sort((a, b) => pl[b.id] - pl[a.id]).map((p) => `<tr><td><i style="background:${p.c}"></i>${p.n}</td><td>${f0(pl[p.id])}</td><td>${pct((pl[p.id] / kc) * 100)}</td></tr>`).join('');
          const extra = m === 'world' ? '' : `<span>${f0(D.c[m].pop / 1e6)} m people · data ${D.c[m].y}</span>`;
          showTip(ev, `<b>${m === 'world' ? 'World average' : nm(m)}</b> ${extra}<table><tr><th></th><th>kcal/day</th><th>share</th></tr>${lines}<tr class="t"><td>food supply</td><td>${f0(kc)}</td><td>100</td></tr></table>`);
        });
        row.addEventListener('mouseleave', hideTip);
        box.append(row);
      }
      stage.append(axis, box, h('p', { class: 'bx-note' }, 'Food supply = what is available for people to eat per day, after trade and non-food uses, before household waste. Not what is actually eaten. Population-weighted world average over the ' + ids.length + ' countries with a FAO food balance (' + f1(D.world.pop / 1e9) + ' bn people).'));
    }
    draw();
  }

  // ================================================================== scale: tonnes against calories
  async function scaleWidget(root) {
    await need(['food', 'diet']);
    const st = { view: root.dataset.view || 'tonnes' };
    const { ctrl, stage, legend } = frame(root, 'bars');
    ctrl.append(lbl('Count'), seg([['tonnes', 'Tonnes grown'], ['kcal', 'Calories eaten']], st.view, (v) => { st.view = v; draw(); }));
    // FBS leaf items -> colour group of the commodity palette
    const fgroup = (c) => (c <= 2520 ? 'cereals' : c <= 2535 ? 'roots' : c <= 2545 || c === 2745 ? 'sugar' : c <= 2549 ? 'pulses' : c === 2551 ? 'nuts' : c <= 2570 || (c >= 2571 && c <= 2586) ? 'oils' : c <= 2605 ? 'veg' : c <= 2625 ? 'fruit' : c <= 2635 ? 'stim' : c <= 2645 ? 'stim' : c >= 2655 && c <= 2659 ? 'alc' : c <= 2736 + 0 && c >= 2731 ? 'meat' : c === 2737 || c === 2740 || c === 2743 ? 'dairy' : c === 2744 ? 'eggs' : c === 2848 ? 'dairy' : c >= 2761 && c <= 2775 ? 'fish' : 'other');
    const GC = Object.assign({ alc: '#9A6AA0', fish: '#0B7C9E', other: '#8A9099' }, GCOL);
    const GN = Object.assign({ alc: 'Alcoholic drinks', fish: 'Fish and seafood', other: 'Other' }, Object.fromEntries(F.groups.map((g) => [g.id, g.n])));
    function draw() {
      let list;
      if (st.view === 'tonnes') list = F.comms.filter((c) => !c.d).map((c) => ({ n: c.n, v: F.tot[c.id], g: c.g, t: fmtT(F.tot[c.id]) })).sort((a, b) => b.v - a.v).slice(0, 24);
      else list = D.world.items.map(([code, n, v]) => ({ n: n.replace(' and products', '').replace(' - Excluding Butter', ''), v, g: fgroup(code), t: f0(v) + ' kcal' })).slice(0, 24);
      const max = list[0].v;
      stage.replaceChildren(h('div', { class: 'fd-rows tall' }, ...list.map((r, i) => h('div', { class: 'fd-row' }, h('span', { class: 'nm' }, r.n), h('div', { class: 'barwrap' }, h('div', { class: 'fd-stack' }, h('i', { style: `width:${(r.v / max) * 100}%;background:${GC[r.g]}` }))), h('span', { class: 'v wide' }, r.t)))));
      const seen = [...new Set(list.map((r) => r.g))];
      legend.replaceChildren(...seen.map((g) => h('span', { class: 'bx-chip static' }, h('i', { style: 'background:' + GC[g] }), GN[g])));
      stage.append(h('p', { class: 'bx-note' }, st.view === 'tonnes'
        ? `FAOSTAT production ${F.year}, in tonnes of the product as harvested (grain, tuber, cane, milk, carcass for meat). Sugar, vegetable oils and dairy products are left out because they are made from items in the list. Fish is not in this data set.`
        : `FAO food balance sheets: kilocalories per person per day available as food, world average, as the food is eaten (flour, oil, sugar, not wheat or palm fruit). The ${list.length} biggest of ${D.world.items.length} items.`));
    }
    draw();
  }

  // ================================================================== half: how few countries grow half of it
  async function halfWidget(root) {
    await need(['food']);
    const st = { sort: root.dataset.sort || 'n50', all: false, groups: new Set(F.groups.map((g) => g.id)) };
    const { ctrl, stage, legend } = frame(root, 'bars');
    const stats = F.comms.filter((c) => !c.d && F.tot[c.id] > 0).map((c) => {
      const p = F.prod[c.id], tot = F.tot[c.id], ms = Object.keys(p).sort((a, b) => p[b][0] - p[a][0]);
      let cum = 0, n50 = 0, n80 = 0;
      for (const m of ms) { cum += p[m][0]; n50 += cum - p[m][0] < tot / 2 ? 1 : 0; n80 += cum - p[m][0] < 0.8 * tot ? 1 : 0; }
      return { c, tot, ms, n50, n80, top: ms.slice(0, 5).map((m) => [m, p[m][0] / tot]) };
    });
    ctrl.append(lbl('Sort by'), seg([['n50', 'Countries for half'], ['top1', 'Biggest producer'], ['tot', 'World output']], st.sort, (v) => { st.sort = v; draw(); }));
    const active = h('div');
    const cbar = chips(F.groups.map((g) => [g.id, g.n, g.c]), st.groups, (id) => { if (st.groups.has(id)) { if (st.groups.size > 1) st.groups.delete(id); } else st.groups.add(id); draw(); });
    root.insertBefore(cbar, stage);
    function draw() {
      const all = stats.filter((s) => st.groups.has(s.c.g)).sort((a, b) => (st.sort === 'n50' ? a.n50 - b.n50 || b.top[0][1] - a.top[0][1] : st.sort === 'top1' ? b.top[0][1] - a.top[0][1] : b.tot - a.tot));
      const list = st.all ? all : all.slice(0, 22);
      stage.replaceChildren(h('div', { class: 'fd-rows half' }, ...list.map((s) => {
        const bar = h('div', { class: 'fd-stack' });
        const usedF = sum(s.top.map((t) => t[1]));
        s.top.forEach(([m, sh], i) => bar.append(h('i', { style: `width:${(sh / usedF) * 100}%;background:${GCOL[s.c.g]};opacity:${[1, 0.72, 0.52, 0.38, 0.27][i]}`, title: nm(m) + ' ' + pct(sh * 100) })));
        const first = s.top[0], used = sum(s.top.map((t) => t[1])) * 100;
        const row = h('div', { class: 'fd-row' }, h('span', { class: 'nm' }, s.c.n), h('div', { class: 'barwrap' }, h('div', { class: 'fd-stack', style: `width:${used * 0.74}%` }, ...bar.children), h('span', { class: 'in', style: `left:calc(${used * 0.74}% + 8px)` }, nm(first[0]) + ' ' + pct(first[1] * 100))), h('span', { class: 'v pill' }, s.n50));
        row.addEventListener('mousemove', (ev) => showTip(ev, `<b>${s.c.n}</b> <span>${fmtT(s.tot)} from ${s.ms.length} countries</span><table>${s.top.map(([m, sh]) => `<tr><td>${nm(m)}</td><td>${pct(sh * 100)}</td></tr>`).join('')}<tr class="t"><td>top ${s.n50} make half</td><td>${s.n80} make 80 %</td></tr></table>`));
        row.addEventListener('mouseleave', hideTip);
        return row;
      })));
      if (all.length > 22) stage.append(h('button', { type: 'button', class: 'bx-play fd-more', onclick: () => { st.all = !st.all; draw(); } }, st.all ? 'show fewer' : `show all ${all.length}`));
      stage.append(h('p', { class: 'bx-note' }, 'The bar shows the five biggest producers of ' + F.year + ' (darkest = largest), then the name and share of the biggest. The number on the right is how many countries it takes to reach 50 % of world output.'));
    }
    legend.remove();
    draw();
  }

  // ================================================================== time machine: production since 1961
  async function timeWidget(root) {
    await need(['food']);
    const st = { comm: root.dataset.comm || 'soy', mode: 'tonnes', y: F.year, playing: false };
    const { ctrl, stage, legend } = frame(root, 'time');
    const PAL = [BLUE, WARM, TEAL, '#C0841A', '#6A47C2', '#D9462B', '#2E9E4F', '#0B7C9E', '#A0522D', '#8A9099'];
    const comms = F.comms.filter((c) => Object.keys(F.series[c.id] || {}).length);
    legend.remove();
    const play = h('button', { type: 'button', class: 'bx-play' }, '▶ play');
    const range = h('input', { type: 'range', class: 'bx-range', min: F.years[0], max: F.years[F.years.length - 1], value: st.y, 'aria-label': 'year' });
    const yr = h('span', { class: 'bx-yr' }, st.y);
    ctrl.append(lbl('Commodity'), commSelect(st.comm, (v) => { st.comm = v; draw(); }, comms), seg([['tonnes', 'Tonnes'], ['share', 'Share']], st.mode, (v) => { st.mode = v; draw(); }), play, range, yr);
    const split = h('div', { class: 'bx-split fd-split' }), chart = h('div', { class: 'fd-chart' }), side = h('div', { class: 'fd-side' });
    split.append(chart, side); stage.append(split);
    let timer = null;
    const tick = () => { if (st.y >= F.years[F.years.length - 1]) return stop(); st.y++; range.value = st.y; update(); timer = setTimeout(tick, 140); };
    const stop = () => { clearTimeout(timer); st.playing = false; play.textContent = '▶ play'; };
    play.addEventListener('click', () => { if (st.playing) return stop(); st.playing = true; play.textContent = '❚❚ pause'; if (st.y >= F.years[F.years.length - 1]) { st.y = F.years[0]; range.value = st.y; } tick(); });
    range.addEventListener('input', () => { stop(); st.y = +range.value; update(); });
    let M = null;
    function series() {
      const ser = F.series[st.comm], world = F.world[st.comm];
      const keys = Object.keys(ser).sort((a, b) => (ser[b][F.years.length - 1] || ser[b].filter((v) => v).slice(-1)[0] || 0) - (ser[a][F.years.length - 1] || ser[a].filter((v) => v).slice(-1)[0] || 0));
      const rows = keys.map((m, i) => ({ k: m, name: nm(m), v: ser[m].map((v) => v || 0), col: PAL[i % 9] }));
      const rest = world.map((w, i) => Math.max(0, (w || 0) - sum(rows.map((r) => r.v[i]))));
      rows.push({ k: 'rest', name: 'All others', v: rest, col: '#c9d0dc' });
      return { rows, world };
    }
    function draw() {
      const { rows, world } = series();
      M = { rows, world };
      chart.replaceChildren();
      const W_ = 640, H_ = 330, m = { l: 46, r: 12, t: 12, b: 26 };
      const svg = h('svg:svg', { class: 'bx-svg', viewBox: `0 0 ${W_} ${H_}` });
      const n = F.years.length, X = (i) => m.l + (i / (n - 1)) * (W_ - m.l - m.r);
      const max = st.mode === 'share' ? 100 : Math.max(...world.map((w) => w || 0)) * 1.04;
      const Y = (v) => H_ - m.b - (v / max) * (H_ - m.t - m.b);
      const nice = (v) => { const e = Math.pow(10, Math.floor(Math.log10(v))), q = v / e; return (q <= 2 ? 2 : q <= 5 ? 5 : 10) * e / 5; };
      const step = st.mode === 'share' ? 25 : nice(max);
      for (let t = 0; t <= max + 1e-9; t += step) {
        svg.append(h('svg:line', { x1: m.l, x2: W_ - m.r, y1: Y(t), y2: Y(t), stroke: '#e9edf3' }), h('svg:text', { x: m.l - 6, y: Y(t) + 4, 'text-anchor': 'end', class: 'bx-t2' }, st.mode === 'share' ? t + ' %' : fmtT(t).replace(' bn t', ' bn').replace(' Mt', ' M').replace(' kt', ' k').replace(' t', '')));
      }
      for (let y = 1970; y <= 2020; y += 10) svg.append(h('svg:text', { x: X(y - F.years[0]), y: H_ - 8, 'text-anchor': 'middle', class: 'bx-t2' }, y));
      const base = new Array(n).fill(0);
      const stacks = rows.slice().reverse(); // draw others first (bottom) ... keep order top producer at the bottom
      const order = rows.slice();
      const lower = new Array(n).fill(0);
      for (const r of order) {
        const up = r.v.map((v, i) => lower[i] + (st.mode === 'share' ? (world[i] ? (v / world[i]) * 100 : 0) : v));
        let d = 'M' + up.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join('L');
        d += 'L' + lower.map((v, i) => X(n - 1 - i).toFixed(1) + ',' + Y(lower[n - 1 - i]).toFixed(1)).join('L') + 'Z';
        const p = h('svg:path', { d, fill: r.col, 'fill-opacity': r.k === 'rest' ? 0.55 : 0.88, stroke: '#fff', 'stroke-width': 0.6 });
        svg.append(p);
        up.forEach((v, i) => { lower[i] = v; });
      }
      const cur = h('svg:line', { class: 'fd-cursor', y1: m.t, y2: H_ - m.b, stroke: INK, 'stroke-width': 1.2 }), curT = h('svg:text', { class: 'bx-year', y: m.t + 38, 'text-anchor': 'end', x: W_ - m.r - 6 });
      svg.append(cur, curT);
      M.cur = cur; M.curT = curT; M.X = X;
      svg.addEventListener('mousemove', (ev) => { const r = svg.getBoundingClientRect(); const i = clamp(Math.round(((ev.clientX - r.left) / r.width * W_ - m.l) / (W_ - m.l - m.r) * (n - 1)), 0, n - 1); st.y = F.years[i]; range.value = st.y; stop(); update(); });
      chart.append(svg);
      update();
    }
    function update() {
      if (!M) return;
      const i = F.years.indexOf(st.y), { rows, world } = M;
      M.cur.setAttribute('x1', M.X(i)); M.cur.setAttribute('x2', M.X(i)); M.curT.textContent = st.y; yr.textContent = st.y;
      const tot = world[i] || 0;
      const list = rows.filter((r) => r.v[i] > 0).sort((a, b) => b.v[i] - a.v[i]);
      const c = COMM[st.comm];
      side.replaceChildren(h('div', { class: 'fd-col fd-wide' }, h('h4', {}, `${c.n} in ${st.y}`), h('div', { class: 'fd-meta' }, `world: ${fmtT(tot)}`)),
        h('div', { class: 'fd-col' }, ...list.slice(0, Math.ceil(list.length / 2)).map((r) => h('div', { class: 'fd-leg2' }, h('i', { style: 'background:' + r.col }), h('span', {}, r.name), h('b', {}, st.mode === 'share' ? pct((r.v[i] / tot) * 100) : fmtT(r.v[i]))))),
        h('div', { class: 'fd-col' }, ...list.slice(Math.ceil(list.length / 2)).map((r) => h('div', { class: 'fd-leg2' }, h('i', { style: 'background:' + r.col }), h('span', {}, r.name), h('b', {}, st.mode === 'share' ? pct((r.v[i] / tot) * 100) : fmtT(r.v[i]))))),
        h('p', { class: 'bx-src fd-wide' }, 'Drag the slider, press play or move over the chart. The USSR, Yugoslavia and Sudan (former) appear as their own series until they split; their successors start in 1992.'));
    }
    draw();
  }

  // ================================================================== traded: how much of the output crosses a border
  async function tradedWidget(root) {
    await need(['food']);
    const st = { sort: root.dataset.sort || 'share', all: false, groups: new Set(F.groups.map((g) => g.id)) };
    const { ctrl, stage, legend } = frame(root, 'bars');
    const rows = F.comms.filter((c) => c.cmp && c.tr && F.wtrade[c.id]).map((c) => {
      const prod = F.world[c.id][yi()], tr = F.wtrade[c.id][F.tyears.indexOf(F.year)];
      return { c, prod, tr, share: tr / prod };
    }).filter((r) => r.prod > 2e5);
    ctrl.append(lbl('Sort by'), seg([['share', 'Share traded'], ['tr', 'Tonnes traded']], st.sort, (v) => { st.sort = v; draw(); }));
    const cbar = chips(F.groups.map((g) => [g.id, g.n, g.c]), st.groups, (id) => { if (st.groups.has(id)) { if (st.groups.size > 1) st.groups.delete(id); } else st.groups.add(id); draw(); });
    root.insertBefore(cbar, stage);
    function spark(c) {
      const ws = F.world[c.id], ts = F.wtrade[c.id];
      const pts = F.tyears.map((y, i) => [y, ts[i] / ws[F.years.indexOf(y)]]).filter((p) => p[1] && isFinite(p[1]));
      if (!pts.length) return '';
      const mx = Math.max(...pts.map((p) => p[1]), 0.05) * 1.1, w = 170, hh = 46;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + ((p[0] - 1986) / 37 * w).toFixed(1) + ',' + (hh - (p[1] / mx) * hh).toFixed(1)).join('');
      return `<svg width="${w}" height="${hh + 4}" viewBox="0 0 ${w} ${hh + 4}"><path d="${d}" fill="none" stroke="${GCOL[c.g]}" stroke-width="2"/></svg><span>1986 ${pct(pts[0][1] * 100)} → ${F.year} ${pct(pts[pts.length - 1][1] * 100)}</span>`;
    }
    function draw() {
      const full = rows.filter((r) => st.groups.has(r.c.g)).sort((a, b) => (st.sort === 'share' ? b.share - a.share : b.tr - a.tr));
      const list = st.all ? full : full.slice(0, 24);
      if (!list.length) { stage.replaceChildren(h('p', { class: 'bx-note' }, 'None of the foods in the selected groups has a comparable trade figure. Switch another group on.')); return; }
      const max = st.sort === 'share' ? 1 : list[0].tr;
      stage.replaceChildren(h('div', { class: 'fd-rows' }, ...list.map((r) => {
        const w = st.sort === 'share' ? Math.min(r.share, 1) : r.tr / max;
        const row = h('div', { class: 'fd-row' }, h('span', { class: 'nm' }, r.c.n), h('div', { class: 'barwrap' }, h('div', { class: 'fd-stack' }, h('i', { style: `width:${w * 100}%;background:${GCOL[r.c.g]}` }))), h('span', { class: 'v wide' }, st.sort === 'share' ? pct(r.share * 100) : fmtT(r.tr)));
        row.addEventListener('mousemove', (ev) => showTip(ev, `<b>${r.c.n}</b> <span>${F.year}</span><table><tr><td>Grown</td><td>${fmtT(r.prod)}</td></tr><tr><td>Crossed a border</td><td>${fmtT(r.tr)}</td></tr><tr class="t"><td>Share</td><td>${pct(r.share * 100)}</td></tr></table>${spark(r.c)}`));
        row.addEventListener('mouseleave', hideTip);
        return row;
      })));
      if (full.length > 24) stage.append(h('button', { type: 'button', class: 'bx-play fd-more', onclick: () => { st.all = !st.all; draw(); } }, st.all ? 'show fewer' : `show all ${full.length}`));
      stage.append(h('p', { class: 'bx-note' }, 'Traded = what importers (or, failing that, exporters) report for ' + F.year + ', in tonnes, divided by what the world grew. Only commodities where trade and production are the same physical thing (grain against grain, not milled against paddy rice). Re-exports are counted each time a shipment crosses a border. Hover for the history since 1986.'));
    }
    legend.remove();
    draw();
  }

  // ================================================================== flows: who ships it to whom
  async function flowWidget(root) {
    await need(['food', 'trade', 'world', 'diet']);
    const st = { comm: root.dataset.comm || 'wheat', unit: root.dataset.unit || 't', view: root.dataset.view || 'map', focus: root.dataset.focus || '', dir: root.dataset.dir || 'exp' };
    const { ctrl, stage, legend } = frame(root, 'flows');
    const pool = F.comms.filter((c) => T[c.id]);
    const countries = new Set();
    Object.values(T).forEach((t) => { Object.keys(t.exp).forEach((m) => countries.add(m)); Object.keys(t.imp).forEach((m) => countries.add(m)); });
    const unitSeg = seg([['t', 'Tonnes'], ['v', 'US dollars']], st.unit, (v) => { st.unit = v; draw(); });
    const viewSeg = seg([['map', 'Map'], ['matrix', 'Matrix']], st.view, (v) => { st.view = v; draw(); });
    const dirSeg = seg([['exp', 'ships out'], ['imp', 'buys in']], st.dir, (v) => { st.dir = v; draw(); });
    const fsel = countrySelect(st.focus, (v) => { st.focus = v; draw(); }, [...countries].filter((m) => W.c[m] || F.countries[m]), 'All countries');
    ctrl.append(lbl('Commodity'), commSelect(st.comm, (v) => { st.comm = v; if (st.focus && !T[v].exp[st.focus] && !T[v].imp[st.focus]) st.focus = ''; fsel.value = st.focus; draw(); }, pool), lbl('Unit'), unitSeg, lbl('View'), viewSeg, lbl('Focus'), fsel, dirSeg);
    const split = h('div', { class: 'bx-split fd-split' }), box = h('div', { class: 'fd-mapbox' }), side = h('div', { class: 'fd-side' });
    split.append(box, side); stage.append(split);
    const ui = unitIdx();
    function unitIdx() { return () => (st.unit === 't' ? 0 : 1); }
    const val = (a) => a[ui()];
    let map = null;
    const anchor = (m) => W.c[m];
    function mapDraw(tr) {
      if (!map) { box.replaceChildren(); map = worldMap(box, { label: 'Map of trade flows', click: (m) => { if (!m) return; if (T[st.comm].exp[m] || T[st.comm].imp[m]) { st.focus = st.focus === m ? '' : m; if (st.focus) st.dir = (T[st.comm].exp[m] || [0])[0] >= (T[st.comm].imp[m] || [0])[0] ? 'exp' : 'imp'; fsel.value = st.focus; setSeg(dirSeg, st.dir); draw(); } }, hover: (m, ev) => {
        if (!W.c[m]) return hideTip();
        const t = T[st.comm]; const e = t.exp[m], i = t.imp[m];
        if (!e && !i) return showTip(ev, `<b>${nm(m)}</b><br><span>no ${COMM[st.comm].n.toLowerCase()} trade reported</span>`);
        showTip(ev, `<b>${nm(m)}</b> <span>${F.year}</span><table>${e ? `<tr><td>Ships out</td><td>${fmtT(e[0])}</td></tr>${e[1] != null ? `<tr><td></td><td>${fmtV(e[1])}</td></tr>` : ''}` : ''}${i ? `<tr><td>Buys in</td><td>${fmtT(i[0])}</td></tr>${i[1] != null ? `<tr><td></td><td>${fmtV(i[1])}</td></tr>` : ''}` : ''}</table><span>click to follow its flows</span>`);
      } }); }
      map.over.replaceChildren(); map.top.replaceChildren();
      for (const [m, p] of Object.entries(map.paths)) { p.setAttribute('fill', '#fff'); p.classList.remove('nd'); p.classList.toggle('sel', m === st.focus); }
      const u = ui();
      let fl = tr.flows.filter((f) => f[2 + u] != null && anchor(f[0]) && anchor(f[1]));
      let nodesE = {}, nodesI = {};
      const N = st.focus ? 16 : 26;
      if (st.focus) fl = fl.filter((f) => (st.dir === 'exp' ? f[0] === st.focus : f[1] === st.focus));
      fl = fl.sort((a, b) => b[2 + u] - a[2 + u]).slice(0, N);
      const vmax = Math.max(...fl.map((f) => f[2 + u]), 1);
      const col = st.focus ? (st.dir === 'exp' ? BLUE : WARM) : BLUE;
      const tot = st.focus ? (tr[st.dir][st.focus] || [0, 0])[u] : tr[u ? 'value' : 'total'];
      for (const f of fl) {
        const a = anchor(f[0]), b = anchor(f[1]);
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1;
        const k = 0.2 * dist, nx = dy / dist, ny = -dx / dist, sgn = ny > 0 ? -1 : 1;
        const cx = (a.x + b.x) / 2 + nx * k * sgn, cy = (a.y + b.y) / 2 + ny * k * sgn;
        const d = `M${a.x},${a.y}Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x},${b.y}`;
        const w = 1.2 + 9 * Math.sqrt(f[2 + u] / vmax);
        const g = h('svg:g', { class: 'fd-arc' }, h('svg:path', { d, fill: 'none', stroke: col, 'stroke-opacity': 0.5, 'stroke-width': w, 'stroke-linecap': 'round' }));
        if (!REDUCED) g.append(h('svg:path', { d, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.85, 'stroke-width': Math.min(1.4, w * 0.5 + 0.3), 'stroke-dasharray': '2 9', class: 'fd-flowdash' }));
        g.append(h('svg:path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': Math.max(w, 9), class: 'fd-hit' }));
        g.addEventListener('mousemove', (ev) => { g.classList.add('hot'); const ex = tr.exp[f[0]], im = tr.imp[f[1]]; showTip(ev, `<b>${nm(f[0])} → ${nm(f[1])}</b> <span>${F.year}</span><table><tr><td>${st.unit === 't' ? 'Tonnes' : 'Value'}</td><td>${st.unit === 't' ? fmtT(f[2]) : fmtV(f[3])}</td></tr>${st.unit === 't' && f[3] != null ? `<tr><td>Value</td><td>${fmtV(f[3])}</td></tr>` : ''}<tr><td>of ${nm(f[0])}'s exports</td><td>${ex ? pct((f[2 + u] / ex[u]) * 100) : '–'}</td></tr><tr><td>of ${nm(f[1])}'s imports</td><td>${im ? pct((f[2 + u] / im[u]) * 100) : '–'}</td></tr></table>`); });
        g.addEventListener('mouseleave', () => { g.classList.remove('hot'); hideTip(); });
        map.over.append(g);
        nodesE[f[0]] = (nodesE[f[0]] || 0) + f[2 + u]; nodesI[f[1]] = (nodesI[f[1]] || 0) + f[2 + u];
      }
      // bubbles: the countries behind the arcs
      const nm_ = (m, v, c, vm) => { const a = anchor(m); return h('svg:circle', { cx: a.x, cy: a.y, r: 3 + 11 * Math.sqrt(v / vm), fill: c, 'fill-opacity': 0.3, stroke: c, 'stroke-width': 1.3, 'pointer-events': 'none' }); };
      const em = Math.max(...Object.values(nodesE), 1), im = Math.max(...Object.values(nodesI), 1);
      if (!st.focus || st.dir === 'imp') for (const [m, v] of Object.entries(nodesE)) map.top.append(nm_(m, v, BLUE, em));
      if (!st.focus || st.dir === 'exp') for (const [m, v] of Object.entries(nodesI)) map.top.append(nm_(m, v, WARM, im));
      if (st.focus) { const a = anchor(st.focus); if (a) map.top.append(h('svg:circle', { cx: a.x, cy: a.y, r: 5, fill: INK, 'pointer-events': 'none' })); }
      // labels for the biggest ends
      const lab = {};
      fl.slice(0, 8).forEach((f) => { lab[f[0]] = 1; lab[f[1]] = 1; });
      Object.keys(lab).slice(0, 14).forEach((m) => { const a = anchor(m); map.top.append(h('svg:text', { x: a.x + 6, y: a.y - 6, class: 'fd-lab' }, nm(m))); });
      legend.replaceChildren(h('div', { class: 'fd-leg' }, h('span', { class: 'fd-sw' }, h('i', { style: `background:${BLUE};opacity:.5` }), 'ships out'), h('span', { class: 'fd-sw' }, h('i', { style: `background:${WARM};opacity:.5` }), 'buys in'), h('span', { class: 'bx-hint' }, !fl.length ? `No flow of ${nm(st.focus)} is among the 220 biggest of this food; pick another country or food.` : `Arc width = ${st.unit === 't' ? 'tonnes' : 'dollars'}; the ${fl.length} biggest ${st.focus ? 'flows of ' + nm(st.focus) : 'flows in the world'} shown, ${pct((sum(fl.map((f) => f[2 + u])) / (tot || 1)) * 100)} of ${st.focus ? 'its' : 'all'} trade. Dashes run from seller to buyer.`)));
    }
    function matrixDraw(tr) {
      box.replaceChildren(); map = null;
      const u = ui();
      const ex = Object.entries(tr.exp).filter((e) => e[1][u] != null).sort((a, b) => b[1][u] - a[1][u]).slice(0, 12).map((e) => e[0]);
      const im = Object.entries(tr.imp).filter((e) => e[1][u] != null).sort((a, b) => b[1][u] - a[1][u]).slice(0, 12).map((e) => e[0]);
      const cell = {};
      let cmax = 0;
      for (const f of tr.flows) if (f[2 + u] != null) { const key = f[0] + '|' + f[1]; cell[key] = (cell[key] || 0) + f[2 + u]; }
      for (const e of ex) for (const i of im) cmax = Math.max(cmax, cell[e + '|' + i] || 0);
      const fmtN = (v) => (st.unit === 't' ? (v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + ' M' : v >= 1e3 ? Math.round(v / 1e3) + ' k' : Math.round(v)) : (v >= 1e6 ? (v / 1e6).toFixed(1) + ' bn' : v >= 1e3 ? Math.round(v / 1e3) + ' m' : Math.round(v) + ' k'));
      const tbl = h('table', { class: 'fd-mx' });
      tbl.append(h('thead', {}, h('tr', {}, h('th', { class: 'corner' }, 'seller ↓  buyer →'), ...im.map((i) => h('th', { class: 'col' }, h('span', {}, nm(i)))), h('th', { class: 'col' }, h('span', {}, 'all other')), h('th', { class: 'col tot' }, h('span', {}, 'total sold')))));
      const body = h('tbody');
      for (const e of ex) {
        const row = h('tr', {}, h('th', { class: 'rowh' }, nm(e)));
        let shown = 0;
        for (const i of im) {
          const v = cell[e + '|' + i] || 0; shown += v;
          const td = h('td', { style: v ? `background:rgba(11,79,192,${(0.08 + 0.85 * Math.sqrt(v / cmax)).toFixed(2)});color:${Math.sqrt(v / cmax) > 0.8 ? '#fff' : INK}` : '' }, v ? fmtN(v) : '');
          if (v) { td.addEventListener('mousemove', (ev) => showTip(ev, `<b>${nm(e)} → ${nm(i)}</b><table><tr><td>${st.unit === 't' ? 'Tonnes' : 'Value'}</td><td>${st.unit === 't' ? fmtT(v) : fmtV(v)}</td></tr><tr><td>of ${nm(e)}'s exports</td><td>${pct((v / tr.exp[e][u]) * 100)}</td></tr><tr><td>of ${nm(i)}'s imports</td><td>${pct((v / tr.imp[i][u]) * 100)}</td></tr></table>`)); td.addEventListener('mouseleave', hideTip); }
          row.append(td);
        }
        const other = Math.max(0, tr.exp[e][u] - shown);
        row.append(h('td', { class: 'oth' }, other > 0 ? fmtN(other) : ''), h('td', { class: 'tot' }, fmtN(tr.exp[e][u])));
        body.append(row);
      }
      const foot = h('tr', { class: 'foot' }, h('th', { class: 'rowh' }, 'total bought'));
      for (const i of im) foot.append(h('td', {}, fmtN(tr.imp[i][u])));
      foot.append(h('td', {}, ''), h('td', { class: 'tot' }, fmtN(tr[u ? 'value' : 'total'])));
      body.append(foot);
      tbl.append(body);
      box.append(h('div', { class: 'fd-mxwrap' }, tbl));
      legend.replaceChildren(h('span', { class: 'bx-hint' }, `The 12 biggest sellers and the 12 biggest buyers of ${COMM[st.comm].n.toLowerCase()}, ${F.year}; ${st.unit === 't' ? 'millions (M) and thousands (k) of tonnes' : 'US dollars (bn = billion, m = million)'}. Darker = bigger flow.`));
    }
    function sideDraw(tr) {
      const u = ui(), c = COMM[st.comm];
      const top = (obj, dirKey, colr) => {
        const es = Object.entries(obj).filter((e) => e[1][u] != null).sort((a, b) => b[1][u] - a[1][u]).slice(0, 8), mx = es.length ? es[0][1][u] : 1;
        const totv = tr[u ? 'value' : 'total'];
        return es.map(([m, v]) => h('button', { type: 'button', class: 'fd-rank' + (m === st.focus && st.dir === dirKey ? ' on' : ''), onclick: () => { st.focus = m === st.focus && st.dir === dirKey ? '' : m; st.dir = dirKey; fsel.value = st.focus; setSeg(dirSeg, st.dir); draw(); } },
          h('span', { class: 'nm w' }, nm(m)), h('span', { class: 'bar' }, h('i', { style: `width:${(v[u] / mx) * 100}%;background:${colr}` })), h('span', { class: 'v' }, pct((v[u] / (totv || 1)) * 100))));
      };
      const prod = F.world[c.id] ? F.world[c.id][yi()] : null;
      const lead = `${c.n}: ${fmtT(tr.total)} crossed a border in ${F.year}, worth ${fmtV(tr.value)}.` + (c.cmp && prod ? ` That is ${pct((tr.total / prod) * 100)} of the world's output.` : '');
      side.replaceChildren(h('div', { class: 'fd-col' }, h('h4', {}, 'Who ships it'), h('div', { class: 'fd-meta' }, lead), ...top(tr.exp, 'exp', BLUE)),
        h('div', { class: 'fd-col' }, h('h4', {}, 'Who buys it'), h('div', { class: 'fd-meta' }, 'Share of world trade in the unit chosen. Click a name to follow its flows.'), ...top(tr.imp, 'imp', WARM)));
    }
    function draw() {
      const tr = T[st.comm];
      if (st.focus) {
        if (!tr[st.dir][st.focus]) { const other = st.dir === 'exp' ? 'imp' : 'exp'; if (tr[other][st.focus]) { st.dir = other; setSeg(dirSeg, st.dir); } else { st.focus = ''; } }
        fsel.value = st.focus;
      }
      for (const o of fsel.options) if (o.value) o.disabled = !(tr.exp[o.value] || tr.imp[o.value]);
      dirSeg.style.display = st.focus && st.view === 'map' ? '' : 'none';
      if (st.view === 'map') mapDraw(tr); else matrixDraw(tr);
      sideDraw(tr);
    }
    draw();
  }

  // ================================================================== diet map: who depends on imported grain
  async function dietWidget(root) {
    await need(['food', 'world', 'diet']);
    const st = { metric: root.dataset.metric || 'dep', sel: root.dataset.sel || '' };
    const { ctrl, stage, legend } = frame(root, 'map');
    ctrl.append(lbl('Show'), seg([['dep', 'Cereals from abroad'], ['kcal', 'Calories per person'], ['animal', 'Protein from animals']], st.metric, (v) => { st.metric = v; draw(); }));
    const split = h('div', { class: 'bx-split fd-split' }), mapBox = h('div', { class: 'fd-mapbox' }), side = h('div', { class: 'fd-side' });
    split.append(mapBox, side); stage.append(split);
    const dep = (m) => { const c = D.c[m]; return c && c.cer.dom > 0 ? (c.cer.imp / c.cer.dom) * 100 : null; };
    const METRICS = {
      dep: { f: dep, fmt: (v) => Math.round(v) + ' %', ramp: RAMP_W, th: [10, 25, 50, 75, 100], name: 'cereals bought abroad, % of domestic supply', clamp: 100 },
      kcal: { f: (m) => (D.c[m] ? D.c[m].kcal : null), fmt: f0, ramp: RAMP, th: [2200, 2500, 2800, 3100, 3400], name: 'kcal per person per day' },
      animal: { f: (m) => (D.c[m] ? D.c[m].animal * 100 : null), fmt: (v) => Math.round(v) + ' %', ramp: RAMP, th: [15, 30, 45, 60, 70], name: 'share of protein from animal products' },
    };
    const map = worldMap(mapBox, { label: 'Map of diets', click: (m) => { st.sel = m && m === st.sel ? '' : m || ''; draw(); }, hover: (m, ev) => {
      const c = D.c[m];
      if (!W.c[m]) return hideTip();
      if (!c) return showTip(ev, `<b>${nm(m)}</b><br><span>no FAO food balance</span>`);
      showTip(ev, `<b>${nm(m)}</b> <span>${c.y}</span><table><tr><td>Food supply</td><td>${f0(c.kcal)} kcal</td></tr><tr><td>Protein</td><td>${f0(c.prot)} g, ${Math.round(c.animal * 100)} % animal</td></tr><tr><td>Cereals grown</td><td>${fmtT(c.cer.prod * 1000)}</td></tr><tr><td>Cereals bought</td><td>${fmtT(c.cer.imp * 1000)}</td></tr><tr class="t"><td>Imports / domestic supply</td><td>${dep(m) == null ? '–' : Math.round(dep(m)) + ' %'}</td></tr></table>`);
    } });
    function draw() {
      const M = METRICS[st.metric];
      paintMap(map, (m) => { const v = M.f(m); return v == null ? null : Math.min(v, M.clamp || 1e9) || 0.0001; }, M.th, M.ramp);
      for (const [m, p] of Object.entries(map.paths)) p.classList.toggle('sel', m === st.sel);
      legend.replaceChildren(legendRow(M.th, M.ramp, M.fmt, 'no FAO balance'), h('span', { class: 'bx-hint' }, M.name + ', latest year ≤ 2023.'));
      const ids = Object.keys(D.c).filter((m) => D.c[m].pop > 2e6 && M.f(m) != null).sort((a, b) => M.f(b) - M.f(a));
      const rows = (list) => list.map((m) => h('button', { type: 'button', class: 'fd-rank' + (m === st.sel ? ' on' : ''), onclick: () => { st.sel = m === st.sel ? '' : m; draw(); } }, h('span', { class: 'nm w' }, nm(m)), h('span', { class: 'v' }, M.fmt(M.f(m)))));
      side.replaceChildren(h('div', { class: 'fd-col' }, h('h4', {}, 'Highest'), ...rows(ids.slice(0, 7))), h('div', { class: 'fd-col' }, h('h4', {}, 'Lowest'), ...rows(ids.slice(-7).reverse())),
        h('p', { class: 'bx-src fd-wide' }, 'Countries above 2 million people. Cereal dependency = imports ÷ (production + imports − exports − stock change), capped at 100 % for the colours; re-exporters such as Singapore exceed it.'));
    }
    draw();
  }

  // ================================================================== country page
  async function countryWidget(root) {
    await need(['food', 'trade', 'world', 'diet']);
    const st = { sel: root.dataset.sel || '156' };
    const { ctrl, stage, legend } = frame(root, 'country');
    const pool = Object.keys(F.countries).filter((m) => !F.countries[m].f && (D.c[m] || Object.values(F.prod).some((p) => p[m])));
    ctrl.append(lbl('Country'), countrySelect(st.sel, (v) => { st.sel = v; draw(); }, pool));
    legend.remove();
    const grid = h('div', { class: 'fd-cgrid' });
    stage.append(grid);
    const card = (title, kids, cls) => h('div', { class: 'fd-card ' + (cls || '') }, h('h4', {}, title), kids);
    const barList = (items, color, fmt) => { const mx = items.length ? items[0].v : 1; return h('div', { class: 'fd-mini' }, ...items.map((r) => h('div', { class: 'fd-mrow' }, h('span', { class: 'nm' }, r.n), h('span', { class: 'bar' }, h('i', { style: `width:${(r.v / mx) * 100}%;background:${r.c || color}` })), h('span', { class: 'v' }, fmt(r))))); };
    function draw() {
      const m = st.sel, name = nm(m);
      const grows = F.comms.filter((c) => !c.d && F.prod[c.id][m]).map((c) => {
        const t = F.prod[c.id][m][0], order = Object.keys(F.prod[c.id]).sort((a, b) => F.prod[c.id][b][0] - F.prod[c.id][a][0]);
        return { id: c.id, n: c.n, v: t, c: GCOL[c.g], share: (t / F.tot[c.id]) * 100, rank: order.indexOf(m) + 1, of: order.length };
      });
      const top = grows.slice().sort((a, b) => b.v - a.v).slice(0, 8);
      const podium = grows.filter((r) => r.rank <= 3).sort((a, b) => a.rank - b.rank || b.share - a.share);
      const exps = [], imps = [];
      for (const c of F.comms) { const t = T[c.id]; if (!t) continue; if (t.exp[m] && t.exp[m][1] != null) exps.push({ n: c.n, v: t.exp[m][1], t: t.exp[m][0], c: GCOL[c.g] }); if (t.imp[m] && t.imp[m][1] != null) imps.push({ n: c.n, v: t.imp[m][1], t: t.imp[m][0], c: GCOL[c.g] }); }
      exps.sort((a, b) => b.v - a.v); imps.sort((a, b) => b.v - a.v);
      const d = D.c[m];
      grid.replaceChildren(
        card('What it grows', top.length ? [barList(top.map((r) => Object.assign({}, r, { v: r.share })), BLUE, (r) => `${fmtT(top.find((x) => x.id === r.id).v)} · ${pct(r.share)} of world`), podium.length ? h('p', { class: 'fd-pod' }, h('b', {}, 'On the podium: '), podium.slice(0, 10).map((r) => `${r.n} #${r.rank}`).join(', ')) : null] : h('p', { class: 'bx-src' }, 'Nothing from the listed commodities is reported for this country.')),
        card('What it sells abroad', exps.length ? [barList(exps.slice(0, 8), WARM, (r) => fmtV(r.v)), h('p', { class: 'bx-src' }, `Among the ${F.comms.filter((c) => T[c.id]).length} listed commodities; they add up to ${fmtV(sum(exps.map((r) => r.v)))}.`)] : h('p', { class: 'bx-src' }, 'No exports of the listed commodities reported.')),
        card('What it buys abroad', imps.length ? [barList(imps.slice(0, 8), TEAL, (r) => fmtV(r.v)), h('p', { class: 'bx-src' }, `Among the same commodities; they add up to ${fmtV(sum(imps.map((r) => r.v)))}.`)] : h('p', { class: 'bx-src' }, 'No imports of the listed commodities reported.')),
        card('What people eat', d ? [
          h('div', { class: 'fd-stack tall' }, ...D.plate.map((p) => (d.plate[p.id] > 0 ? h('i', { style: `width:${(d.plate[p.id] / 4200) * 100}%;background:${p.c}`, title: `${p.n}: ${f0(d.plate[p.id])} kcal` }) : null))),
          h('p', { class: 'fd-pod' }, `${f0(d.kcal)} kcal per person per day (${d.y}); ${f0(d.prot)} g of protein, ${Math.round(d.animal * 100)} % of it from animals. Biggest sources: ${D.plate.filter((p) => d.plate[p.id] > 0).sort((a, b) => d.plate[b.id] - d.plate[a.id]).slice(0, 3).map((p) => `${p.n.toLowerCase()} ${Math.round((d.plate[p.id] / d.kcal) * 100)} %`).join(', ')}.`),
          h('p', { class: 'fd-pod' }, `Cereals: grown ${fmtT(d.cer.prod * 1000)}, bought ${fmtT(d.cer.imp * 1000)}, sold ${fmtT(d.cer.exp * 1000)}` + (d.cer.dom > 0 ? ` — imports are ${Math.round((d.cer.imp / d.cer.dom) * 100)} % of what the country uses.` : '.')),
        ] : h('p', { class: 'bx-src' }, 'FAO publishes no food balance for ' + name + '.')));
      grid.insertBefore(h('h3', { class: 'fd-cname' }, name, d ? h('small', {}, ` ${f1(d.pop / 1e6)} million people`) : null), grid.firstChild);
    }
    draw();
  }


  // ================================================================== use: what happens to a crop
  async function useWidget(root) {
    await need(['food', 'diet']);
    const st = { sort: root.dataset.sort || 'food' };
    const { ctrl, stage, legend } = frame(root, 'bars');
    const KEYS = [['food', 'Eaten as food', BLUE], ['feed', 'Animal feed', WARM], ['proc', 'Processed (crushing, starch, sugar, beer)', TEAL], ['other', 'Fuel and other non-food', '#6A47C2'], ['seed', 'Seed', '#C0841A'], ['loss', 'Lost on the way', '#8A9099']];
    ctrl.append(lbl('Sort by'), seg([['food', 'Food share'], ['feed', 'Feed share'], ['dom', 'Quantity']], st.sort, (v) => { st.sort = v; draw(); }));
    legend.replaceChildren(...KEYS.map(([, n, c]) => h('span', { class: 'bx-chip static' }, h('i', { style: 'background:' + c }), n)));
    const rows = D.use.map((u) => { const t = sum(KEYS.map(([k]) => u[k])); return Object.assign({ t }, u); });
    function draw() {
      const list = rows.slice().sort((a, b) => (st.sort === 'dom' ? b.dom - a.dom : b[st.sort] / b.t - a[st.sort] / a.t));
      stage.replaceChildren(h('div', { class: 'fd-rows' }, ...list.map((r) => {
        const bar = h('div', { class: 'fd-stack' });
        KEYS.forEach(([k, , c]) => { if (r[k] > 0) bar.append(h('i', { style: `width:${(r[k] / r.t) * 100}%;background:${c}` })); });
        const row = h('div', { class: 'fd-row' }, h('span', { class: 'nm' }, r.n), h('div', { class: 'barwrap' }, bar), h('span', { class: 'v wide' }, fmtT(r.dom)));
        row.addEventListener('mousemove', (ev) => showTip(ev, `<b>${r.n}</b> <span>world supply ${fmtT(r.dom)}</span><table>${KEYS.map(([k, n, c]) => `<tr><td><i style="background:${c}"></i>${n.split(' (')[0]}</td><td>${fmtT(r[k])}</td><td>${pct((r[k] / r.t) * 100)}</td></tr>`).join('')}</table>`));
        row.addEventListener('mouseleave', hideTip);
        return row;
      })), h('p', { class: 'bx-note' }, 'FAO food balance sheets, latest year per country (2023 for most), summed over the ' + Object.keys(D.c).length + ' countries that publish one; each bar shows the six uses as shares of their sum (the small unallocated residual in FAO\u2019s tables is left out). Supply = production + imports − exports ± stocks. Oils depend on how FAO books biodiesel and oleochemicals ("non-food"). Maize is a feed and fuel crop first, rice and potatoes are food first.'));
    }
    draw();
  }

  // ------------------------------------------------------------------ boot
  const WIDGETS = { atlas: atlasWidget, plate: plateWidget, scale: scaleWidget, half: halfWidget, time: timeWidget, traded: tradedWidget, flow: flowWidget, diet: dietWidget, country: countryWidget, use: useWidget };
  for (const r of roots) { const w = WIDGETS[r.dataset.fd]; if (w) lazy(r, w); }
})();
