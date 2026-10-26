// Interactive figures of the oil-market long read (/blog/2026/oil-market/), in the site's figure card (.concept.bx, as in
// the food and AI posts): white stage, ink line work, warm crude, blue Brent, teal gasoline, violet diesel. Data: assets/oil-article/oil.json (EIA spot prices and weekly
// stocks, made by bin/oil_article/build.py, plus the curated facts of curated.py) and geo.json (Natural Earth, geo.py).
// Every figure is a <figure data-oil="kind"> filled when it scrolls into view; animations pause off screen and stay
// still under prefers-reduced-motion. Vanilla SVG, nothing is loaded from outside this site.
(function () {
  'use strict';
  const roots = [...document.querySelectorAll('[data-oil]')];
  if (!roots.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    paper: '#ffffff', grid: 'rgba(4,32,75,0.06)', line: '#04204b', muted: '#6b7280', faint: 'rgba(4,32,75,0.14)',
    crude: '#b4552f', wti: '#b4552f', brent: '#0b4fc0', gas: '#138374', diesel: '#6a47c2', jet: '#8a93a6', resid: '#7a5c45',
    red: '#c0392b', gold: '#c99a1e', teal: '#138374', violet: '#8e4fb3', grey: '#a3acbd',
  };
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BASE = roots[0].dataset.base;
  const TOTAL = roots.length;
  let DATA = null, GEO = null, loading = null, geoLoading = null;

  // ------------------------------------------------------------------ helpers
  function h(tag, attrs, ...kids) {
    const svg = tag.startsWith('svg:');
    const e = svg ? document.createElementNS(NS, tag.slice(4)) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.setAttribute('class', v);
      else if (k === 'style') e.style.cssText = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
    return e;
  }
  const S = (tag, attrs, ...kids) => h('svg:' + tag, attrs, ...kids);
  // label colour on a filled segment: white on dark fills, ink on light ones
  const onFill = (c) => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return '#04204b'; const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return 0.299 * r + 0.587 * g + 0.114 * b < 150 ? '#ffffff' : '#04204b'; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const f0 = (v) => (v == null ? '–' : Math.round(v).toLocaleString('en-GB'));
  const f1 = (v) => (v == null ? '–' : v.toFixed(1));
  const usd = (v, d = 1) => (v == null ? '–' : (v < 0 ? '−$' : '$') + Math.abs(v).toFixed(d));
  const ts = (d) => Date.parse(d.length === 7 ? d + '-01T00:00:00Z' : d + 'T00:00:00Z');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fdate = (t) => { const d = new Date(t); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  const fmon = (t) => { const d = new Date(t); return MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  const yearTicks = (y0, y1, step) => { const o = []; for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) o.push([Date.UTC(y, 0, 1), String(y)]); return o; };
  function niceTicks(lo, hi, n) {
    const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag, out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  const series = (block, key) => { const x = [], y = []; block.t.forEach((t, i) => { x.push(ts(t)); y.push(block[key][i]); }); return { x, y }; };

  function load() {
    if (!loading) loading = fetch(BASE + 'oil.json').then((r) => r.json()).then((d) => (DATA = d));
    return loading;
  }
  function loadGeo() {
    if (!geoLoading) geoLoading = fetch(BASE + 'geo.json').then((r) => r.json()).then((d) => (GEO = d));
    return geoLoading;
  }

  // tooltip, shared
  const tip = h('div', { class: 'oil-tip', role: 'status' });
  document.body.append(tip);
  function showTip(ev, html) {
    tip.innerHTML = html; tip.style.display = 'block';
    const r = tip.getBoundingClientRect(), pad = 14;
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - pad;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  const hideTip = () => { tip.style.display = 'none'; };

  // ------------------------------------------------------------------ the frame: the site's figure card (.concept.bx)
  // header with the figure number and title, the unit line, controls, stage, legend, caption below the card
  function sheet(root, o) {
    const MAPS = ['flows', 'hormuz', 'northsea', 'route', 'producers', 'pipes'];
    root.classList.add('concept', 'bx', 'oil-fig');
    const head = h('header', {}, h('span', { class: 'concept-kind' }, MAPS.includes(root.dataset.oil) ? 'Map' : 'Chart'), h('span', { class: 'concept-title', html: root.dataset.title || o.title || '' }));
    const unit = h('div', { class: 'os-unit' }, o.eyebrow || '', o.sub ? ' · ' + o.sub : '');
    const stage = h('div', { class: 'os-stage' + (o.stageClass ? ' ' + o.stageClass : '') });
    const ctrl = h('div', { class: 'os-ctrl bx-ctrl' });
    const legend = h('div', { class: 'os-legend' });
    const body = h('div', { class: 'bx-stage os-body' }, unit, stage, legend);
    const cap = root.dataset.caption ? h('figcaption', { html: root.dataset.caption }) : null;
    root.replaceChildren(head, ctrl, body, cap || '');
    return { stage, ctrl, legend, head, inner: root };
  }
  const chip = (label, color) => h('span', { class: 'os-key' }, h('i', { style: 'background:' + color }), label);
  function seg(options, value, on) {
    const wrap = h('div', { class: 'os-seg', role: 'group' });
    const btns = options.map(([v, label]) => h('button', { type: 'button', class: v === value ? 'on' : '', 'aria-pressed': v === value ? 'true' : 'false', onclick: () => { btns.forEach((b) => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }); btn(v).classList.add('on'); btn(v).setAttribute('aria-pressed', 'true'); on(v); } }, label));
    const btn = (v) => btns[options.findIndex((o) => o[0] === v)];
    wrap.append(...btns);
    return wrap;
  }
  function slider(label, min, max, step, value, on, fmt) {
    const out = h('output', {}, fmt ? fmt(value) : value);
    const inp = h('input', { type: 'range', min, max, step, value, 'aria-label': label, oninput: (e) => { const v = +e.target.value; out.textContent = fmt ? fmt(v) : v; on(v); } });
    return { el: h('label', { class: 'os-slider' }, h('span', {}, label), inp, out), inp, out, set(v) { inp.value = v; out.textContent = fmt ? fmt(v) : v; } };
  }

  // run a loop only while the figure is on screen
  function looper(el, frame) {
    let on = false, raf = 0, last = 0;
    const tick = (now) => { const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016; last = now; frame(dt, now / 1000); raf = on ? requestAnimationFrame(tick) : 0; };
    const io = new IntersectionObserver((es) => { on = es[es.length - 1].isIntersecting && !REDUCED; if (on && !raf) { last = 0; raf = requestAnimationFrame(tick); } }, { rootMargin: '80px 0px' });
    io.observe(el);
    if (REDUCED) frame(0, 0);
    return { kick() { if (!raf && on) { last = 0; raf = requestAnimationFrame(tick); } } };
  }
  function whenSeen(el, fn, margin = '0px') {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: margin });
    io.observe(el);
  }
  // draw a path in on first sight
  function drawIn(paths, ms = 1600) {
    if (REDUCED) return;
    for (const p of paths) {
      const L = p.getTotalLength ? p.getTotalLength() : 0;
      if (!L) continue;
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      p.getBoundingClientRect();
      p.style.transition = `stroke-dashoffset ${ms}ms cubic-bezier(.3,.6,.2,1)`;
      requestAnimationFrame(() => { p.style.strokeDashoffset = 0; });
      setTimeout(() => { p.style.strokeDasharray = ''; p.style.transition = ''; }, ms + 100);
    }
  }

  // ------------------------------------------------------------------ a blueprint time chart
  // o: { w, panels:[{h, ymin, ymax, ticks, yfmt, title, zero, bands:[[x0,x1,label]], series:[{name,c,x,y,w,dash,area,fmt}]}],
  //      x0, x1, xticks, events:[[x, n, label]], hover(x), aria }
  function timeChart(stage, o) {
    const W = o.w || 760, M = { l: 50, r: 16, t: (o.events || []).length ? 34 : 10, b: 26 }, GAP = 18, iw = W - M.l - M.r;
    const H = o.panels.reduce((a, p) => a + p.h, 0) + GAP * (o.panels.length - 1) + M.t + M.b;
    const X = (x) => M.l + ((x - o.x0) / (o.x1 - o.x0)) * iw;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': o.aria || 'chart' });
    let y0 = M.t; const geo = [], drawn = [];
    for (const [x, label] of o.xticks) {
      if (x < o.x0 || x > o.x1) continue;
      svg.append(S('line', { x1: X(x), x2: X(x), y1: M.t, y2: H - M.b, class: 'os-gridv' }), S('text', { x: X(x), y: H - M.b + 16, 'text-anchor': 'middle', class: 'os-ax' }, label));
    }
    o.panels.forEach((p) => {
      const top = y0, bot = y0 + p.h, lo = p.ymin, hi = p.ymax;
      const Y = (v) => bot - ((v - lo) / (hi - lo)) * p.h;
      const g = S('g', {});
      for (const [a, b, label] of p.bands || []) {
        g.append(S('rect', { x: X(a), y: top, width: Math.max(1, X(b) - X(a)), height: p.h, class: 'os-band' }));
        if (label) g.append(S('text', { x: X(a) + 4, y: top + 11, class: 'os-bandl' }, label));
      }
      for (const t of p.ticks || niceTicks(lo, hi, 4)) {
        if (t < lo - 1e-9 || t > hi + 1e-9) continue;
        g.append(S('line', { x1: M.l, x2: W - M.r, y1: Y(t), y2: Y(t), class: t === 0 && p.zero ? 'os-zero' : 'os-gridh' }), S('text', { x: M.l - 7, y: Y(t) + 3.5, 'text-anchor': 'end', class: 'os-ax' }, p.yfmt ? p.yfmt(t) : t));
      }
      if (p.title) g.append(S('text', { x: M.l, y: top - 5, class: 'os-pt' }, p.title));
      const clipId = 'oc' + Math.random().toString(36).slice(2, 8);
      g.append(S('clipPath', { id: clipId }, S('rect', { x: M.l, y: top - 3, width: iw, height: p.h + 6 })));
      const lines = S('g', { 'clip-path': `url(#${clipId})` });
      for (const s of p.series) {
        let d = '', pen = false, first = null, lastX = null;
        for (let i = 0; i < s.x.length; i++) {
          if (s.y[i] == null || s.x[i] < o.x0 || s.x[i] > o.x1) { pen = false; continue; }
          const px = X(s.x[i]).toFixed(1), py = Y(clamp(s.y[i], lo - (hi - lo), hi + (hi - lo))).toFixed(1);
          d += (pen ? 'L' : 'M') + px + ' ' + py; pen = true; if (first == null) first = px; lastX = px;
        }
        if (s.area && d) lines.append(S('path', { d: d + `L${lastX} ${Y(Math.max(lo, 0))}L${first} ${Y(Math.max(lo, 0))}Z`, fill: s.c, 'fill-opacity': s.area }));
        const path = S('path', { d, fill: 'none', stroke: s.c, 'stroke-width': s.w || 1.7, 'stroke-dasharray': s.dash || null, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
        lines.append(path);
        if (!s.dash) drawn.push(path);
      }
      g.append(lines);
      geo.push({ p, top, bot, Y });
      svg.append(g);
      y0 = bot + GAP;
    });
    let lastX = -99, row = 0;
    for (const [x, n, label] of o.events || []) {
      if (x < o.x0 || x > o.x1) continue;
      row = X(x) - lastX < 20 ? (row + 1) % 2 : 0; lastX = X(x);
      const cy = M.t - 22 + row * 15;
      svg.append(S('line', { x1: X(x), x2: X(x), y1: cy + 6, y2: H - M.b, class: 'os-evl' }));
      svg.append(S('g', { class: 'os-ev', tabindex: 0, onmousemove: (ev) => showTip(ev, `<b>${n} · ${fdate(x)}</b><br>${label}`), onmouseleave: hideTip, onfocus: (ev) => { const r = ev.target.getBoundingClientRect(); showTip({ clientX: r.right, clientY: r.bottom }, `<b>${n} · ${fdate(x)}</b><br>${label}`); }, onblur: hideTip },
        S('rect', { x: X(x) - 7, y: cy - 6, width: 14, height: 13, rx: 1.5 }), S('text', { x: X(x), y: cy + 3.6, 'text-anchor': 'middle' }, n)));
    }
    const cross = S('line', { y1: M.t, y2: H - M.b, class: 'os-cross', visibility: 'hidden' });
    const dots = S('g', {});
    svg.append(cross, dots);
    const overlay = S('rect', { x: M.l, y: M.t, width: iw, height: H - M.t - M.b, fill: 'transparent' });
    const move = (ev) => {
      const r = svg.getBoundingClientRect(), px = ((ev.clientX - r.left) / r.width) * W;
      const x = o.x0 + ((px - M.l) / iw) * (o.x1 - o.x0);
      dots.replaceChildren();
      let first = null; const rows = [];
      geo.forEach((gp) => gp.p.series.forEach((s) => {
        if (s.noTip) return;
        let a = 0, b = s.x.length - 1;
        while (b - a > 1) { const m = (a + b) >> 1; if (s.x[m] < x) a = m; else b = m; }
        const i = Math.abs(s.x[a] - x) < Math.abs(s.x[b] - x) ? a : b;
        if (s.y[i] == null || Math.abs(s.x[i] - x) > (o.x1 - o.x0) * 0.03) return;
        if (first == null) first = s.x[i];
        dots.append(S('circle', { cx: X(s.x[i]), cy: gp.Y(s.y[i]), r: 3.4, fill: s.c, stroke: C.paper, 'stroke-width': 1.4 }));
        rows.push(`<tr><td><i style="background:${s.c}"></i>${s.name}</td><td>${s.fmt ? s.fmt(s.y[i]) : gp.p.yfmt ? gp.p.yfmt(s.y[i]) : s.y[i]}</td></tr>`);
      }));
      if (first == null) { hideTip(); cross.setAttribute('visibility', 'hidden'); return; }
      cross.setAttribute('x1', X(first)); cross.setAttribute('x2', X(first)); cross.setAttribute('visibility', 'visible');
      showTip(ev, `<b>${(o.hover || fdate)(first)}</b><table>${rows.join('')}</table>`);
    };
    overlay.addEventListener('pointermove', move);
    overlay.addEventListener('pointerleave', () => { hideTip(); cross.setAttribute('visibility', 'hidden'); dots.replaceChildren(); });
    svg.append(overlay);
    stage.replaceChildren(svg);
    whenSeen(svg, () => drawIn(drawn), '-60px 0px');
    return { svg, X, geo, H, M };
  }

  // join the long weekly history with the daily data of 2025-26
  function joined(key) {
    const a = series(DATA.weekly, key), b = series(DATA.daily, key);
    return { x: a.x.concat(b.x), y: a.y.concat(b.y) };
  }
  const EV = () => (DATA.curated && DATA.curated.events ? DATA.curated.events.map((e) => [ts(e.d), e.n, e.t]) : []);

  // ================================================================== FIGURES
  const FIG = {};

  // ---- 01 the barrel: one 42-gallon barrel cracks open into what a US refinery makes of it
  FIG.barrel = function (root) {
    const Y = DATA.curated.yields;  // [{k, name, gal, c}]
    const { stage, legend } = sheet(root, { eyebrow: 'What is in a barrel', short: 'The barrel', source: Y.source, date: Y.date });
    const W = 760, H = 380;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'A 42-gallon barrel of crude splits into the products a US refinery makes from it' });
    // isometric barrel: ellipses + sides
    const bx = 170, by = 70, bw = 140, bh = 230, ry = 22;
    const crack = 'M' + [[0, 0], [8, 22], [-6, 46], [10, 74], [-4, 100], [12, 128], [-8, 156], [6, 186], [-4, 210], [4, bh]].map(([dx, dy]) => `${bx + bw / 2 + dx},${by + dy}`).join('L');
    const half = (side) => {
      const g = S('g', { class: 'os-barrel-half' });
      const x0 = side < 0 ? bx : bx + bw / 2, x1 = side < 0 ? bx + bw / 2 : bx + bw;
      const clipId = 'bh' + side + Math.random().toString(36).slice(2, 6);
      g.append(S('clipPath', { id: clipId }, S('path', { d: side < 0 ? crack + `L${bx - 30},${by + bh + 40}L${bx - 30},${by - 40}Z` : crack + `L${bx + bw + 30},${by + bh + 40}L${bx + bw + 30},${by - 40}Z` })));
      const body = S('g', { 'clip-path': `url(#${clipId})` },
        S('path', { d: `M${bx},${by}L${bx},${by + bh}A${bw / 2},${ry} 0 0 0 ${bx + bw},${by + bh}L${bx + bw},${by}`, class: 'os-solid' }),
        S('ellipse', { cx: bx + bw / 2, cy: by, rx: bw / 2, ry, class: 'os-solid top' }),
        ...[0.33, 0.66].map((f) => S('path', { d: `M${bx},${by + bh * f}A${bw / 2},${ry} 0 0 0 ${bx + bw},${by + bh * f}`, class: 'os-rib' })),
        S('path', { d: `M${bx + (side < 0 ? 12 : bw - 12)},${by + 14}L${bx + (side < 0 ? 12 : bw - 12)},${by + bh - 6}`, class: 'os-hatch' }));
      g.append(body, S('path', { d: crack, class: 'os-crackline', 'clip-path': `url(#${clipId})` }));
      return g;
    };
    const left = half(-1), right = half(1);
    const glow = S('path', { d: crack, class: 'os-crackglow' });
    // the product stack on the right: solid boxes at the barrel's scale (bh = 42 gallons), drawn bottom to top
    const sx = 380, fw = 100, dx = 40, dy = 14, unit = bh / 42, y0 = by + bh + ry; // px per gallon; base level with the barrel's front rim
    const total = Y.items.reduce((a, b) => a + b.gal, 0);
    const tint = (hex, k) => { const n = parseInt(hex.slice(1), 16), m = (v) => Math.round(255 - (255 - v) * k); return `rgb(${m(n >> 16)},${m((n >> 8) & 255)},${m(n & 255)})`; };
    const stack = S('g', {});
    // the 42-gallon line: where the barrel's volume ends (drawn over the stack, see below)
    const in42 = y0 - 42 * unit;
    const mark42 = S('g', { class: 'os-slab', opacity: 0 },
      S('path', { d: `M${sx - 8},${in42}h${fw + 8}l${dx},${-dy}`, class: 'os-rib', stroke: '#04204b', 'stroke-dasharray': '4 3' }),
      S('text', { x: sx + 6, y: in42 + 18, class: 'os-small' }, '42 gallons'));
    // labels: centred on their slab, pushed apart so thin slabs do not collide
    let yy = y0;
    const rows = Y.items.map((it) => { const y1 = yy - it.gal * unit; const r = { it, y0: yy, y1, mid: (yy + y1) / 2 - dy / 2 }; yy = y1; return r; });
    let last = Infinity;
    rows.forEach((r) => { r.ly = Math.min(r.mid, last - 15); last = r.ly; });
    const lx = sx + fw + dx + 22;
    const slabs = rows.map(({ it, y0: a, y1: b, mid, ly }) => {
      const g = S('g', { class: 'os-slab', opacity: 0 },
        S('rect', { x: sx, y: b, width: fw, height: a - b, fill: tint(it.c, 0.32), stroke: it.c }),
        S('path', { d: `M${sx + fw},${b}l${dx},${-dy}V${a - dy}l${-dx},${dy}Z`, fill: tint(it.c, 0.2), stroke: it.c }),
        S('path', { d: `M${sx},${b}h${fw}l${dx},${-dy}h${-fw}Z`, fill: tint(it.c, 0.5), stroke: it.c }),
        S('path', { d: `M${sx + fw + dx + 4},${mid}L${lx - 12},${mid}L${lx - 4},${ly}`, class: 'os-rib' }),
        S('text', { x: lx, y: ly + 4, class: 'os-lab' }, `${it.name} · ${it.gal.toFixed(1)} gal`));
      stack.append(g);
      return g;
    });
    stack.append(mark42); slabs.push(mark42);
    const cap = S('text', { x: sx, y: 352, class: 'os-small' }, `${total.toFixed(1)} gallons out of 42 in: the processing gain`);
    const head = S('text', { x: bx + bw / 2, y: 345, 'text-anchor': 'middle', class: 'os-small' }, '1 barrel = 42 US gallons = 159 litres');
    svg.append(left, right, glow, stack, cap, head);
    stage.append(svg);
    legend.append(...Y.items.map((it) => chip(it.name, it.c)));
    let t = REDUCED ? 10 : 0, played = false;
    const L = looper(svg, (dt) => {
      if (!played) return;
      t += dt;
      const open = ease(clamp((t - 0.6) / 1.4, 0, 1));
      left.setAttribute('transform', `translate(${-open * 26},0) rotate(${-open * 4} ${bx} ${by + bh})`);
      right.setAttribute('transform', `translate(${open * 26},0) rotate(${open * 4} ${bx + bw} ${by + bh})`);
      glow.style.opacity = clamp(Math.sin(clamp(t / 0.9, 0, 1) * Math.PI) * 1.2, 0, 1) * (1 - open * 0.6);
      slabs.forEach((g, i) => { const k = ease(clamp((t - 1.6 - i * 0.28) / 0.7, 0, 1)); g.setAttribute('opacity', k); g.setAttribute('transform', `translate(0,${(1 - k) * -26})`); });
    });
    whenSeen(svg, () => { played = true; L.kick(); }, '-120px 0px');
    if (REDUCED) { played = true; slabs.forEach((g) => g.setAttribute('opacity', 1)); }
  };

  // ---- price history: Brent and WTI since 1986, with the 2026 war marked
  FIG.prices = function (root) {
    const { stage, ctrl, legend } = sheet(root, { eyebrow: 'Brent and WTI, spot, $ per barrel', short: 'Price history', source: 'EIA via FRED' });
    const st = { range: root.dataset.range || 'all', real: false };
    const brent = joined('brent'), wti = joined('wti');
    const R = { all: [1986, 2026.9], y20: [2006, 2026.9], war: [2025.0, 2026.85] };
    ctrl.append(seg([['all', '1986–2026'], ['y20', '2006–2026'], ['war', '2025–2026']], st.range, (v) => { st.range = v; draw(); }));
    legend.append(chip('Brent (North Sea, waterborne)', C.brent), chip('WTI (Cushing, Oklahoma)', C.wti));
    function draw() {
      const [a, b] = R[st.range];
      const x0 = Date.UTC(Math.floor(a), Math.round((a % 1) * 12), 1), x1 = Date.UTC(Math.floor(b), Math.round((b % 1) * 12), 1);
      const hi = st.range === 'war' ? 140 : 160;
      timeChart(stage, {
        w: 760, x0, x1, xticks: st.range === 'war' ? DATA.daily.t.filter((t) => t.endsWith('-01') || /-0[1-4]$/.test(t)).reduce((o, t) => { const m = t.slice(0, 7); if (!o.some((q) => q[2] === m)) o.push([ts(m), MON[+m.slice(5) - 1] + (m.endsWith('01') ? ' ' + m.slice(0, 4) : ''), m]); return o; }, []).map(([x, l]) => [x, l]) : yearTicks(a, b, st.range === 'all' ? 5 : 2),
        events: st.range === 'all' ? (DATA.curated.history || []).map((e) => [ts(e.d), e.n, e.t]) : st.range === 'war' ? EV() : (DATA.curated.history || []).filter((e) => e.d >= '2006').map((e) => [ts(e.d), e.n, e.t]),
        panels: [{ h: 300, ymin: 0, ymax: hi, ticks: [0, 20, 40, 60, 80, 100, 120, 140, 160], yfmt: (v) => '$' + Math.round(v), series: [
          { name: 'Brent', c: C.brent, ...brent, w: st.range === 'war' ? 1.6 : 1.3 }, { name: 'WTI', c: C.wti, ...wti, w: st.range === 'war' ? 1.6 : 1.3 }] }],
        hover: fdate, aria: 'Brent and WTI spot prices',
      });
    }
    draw();
  };

  // ---- the crack: what a refinery earns per barrel, 2006-2026
  FIG.crack = function (root) {
    const { stage, ctrl, legend } = sheet(root, { eyebrow: 'Crack spreads, $ per barrel of crude, monthly', short: 'The crack', source: 'EIA spot prices via FRED · own calculation' });
    const st = { view: root.dataset.view || '321' };
    ctrl.append(seg([['321', 'The 3-2-1, three ways'], ['parts', 'Diesel against gasoline']], st.view, (v) => { st.view = v; draw(); }));
    const m = DATA.monthly, g = (k) => series(m, k);
    function draw() {
      const ser = st.view === '321'
        ? [{ name: 'NY Harbor products vs WTI', c: C.red, ...g('crack321_nyw'), w: 2.1, area: 0.1 }, { name: 'Gulf Coast products vs WTI', c: C.gold, ...g('crack321_usg'), w: 1.2 }, { name: 'NY Harbor products vs Brent', c: C.brent, ...g('crack321_nyh'), w: 1.2 }]
        : [{ name: 'Diesel − WTI', c: C.diesel, ...g('diesel_wti'), w: 2, area: 0.08 }, { name: 'Diesel − Brent', c: '#a58fd8', ...g('diesel_brent'), w: 1.2 }, { name: 'Gasoline − Brent', c: C.gas, ...g('gasoline_brent'), w: 1.6 }];
      legend.replaceChildren(...ser.map((x) => chip(x.name, x.c)));
      timeChart(stage, {
        w: 760, x0: Date.UTC(2006, 5, 1), x1: Date.UTC(2026, 10, 1), xticks: yearTicks(2006, 2026, 2),
        events: (DATA.curated.history || []).filter((e) => e.d >= '2006-06').map((e) => [ts(e.d), e.n, e.t]),
        panels: [{ h: 280, ymin: st.view === '321' ? -10 : -20, ymax: st.view === '321' ? 80 : 120, zero: true, yfmt: (v) => '$' + v, series: ser }],
        hover: fmon, aria: 'Monthly crack spreads 2006 to 2026',
      });
    }
    draw();
  };

  // ---- 2026 day by day: crude against the products, the war year
  FIG.war = function (root) {
    const { stage, ctrl, legend } = sheet(root, { eyebrow: 'Daily spot, $ per barrel, 2026', short: 'The war year', source: 'EIA spot prices via FRED · events: see text' });
    const d = DATA.daily, st = { view: root.dataset.view || 'all' };
    const get = (k) => series(d, k);
    ctrl.append(seg([['all', 'Crude and products'], ['cracks', 'The gaps']], st.view, (v) => { st.view = v; draw(); }));
    function draw() {
      const all = st.view === 'all';
      const ser = all ? [
        { name: 'Diesel, NY Harbor', c: C.diesel, ...get('dist_nyh'), w: 1.7 }, { name: 'Jet, Gulf Coast', c: C.jet, ...get('jet_usg'), w: 1.1 },
        { name: 'Gasoline, NY Harbor', c: C.gas, ...get('gas_nyh'), w: 1.5 }, { name: 'Brent', c: C.brent, ...get('brent'), w: 1.5 }, { name: 'WTI', c: C.wti, ...get('wti'), w: 1.5 }]
        : [{ name: 'Diesel − Brent', c: C.diesel, ...get('diesel_brent'), w: 1.7 }, { name: '3-2-1 USGC vs WTI', c: C.red, ...get('crack321_usg'), w: 1.7 },
          { name: 'Gasoline − Brent', c: C.gas, ...get('gasoline_brent'), w: 1.5 }, { name: 'Brent − WTI', c: C.violet, ...get('brent_wti'), w: 1.5 }];
      legend.replaceChildren(...ser.map((s) => chip(s.name, s.c)));
      timeChart(stage, {
        w: 760, x0: Date.UTC(2026, 0, 1), x1: Date.UTC(2026, 9, 25),
        xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((mm) => [Date.UTC(2026, mm, 1), MON[mm]]), events: EV(),
        panels: [{ h: 300, ymin: all ? 0 : -20, ymax: all ? 260 : 140, zero: !all, yfmt: (v) => '$' + v, series: ser }],
        hover: fdate, aria: 'Daily prices of crude and products in 2026',
      });
    }
    draw();
  };

  // ---- Brent minus WTI since 1986
  FIG.gap = function (root) {
    const { stage, legend } = sheet(root, { eyebrow: 'Brent minus WTI, spot, $ per barrel', short: 'The gap', source: 'EIA spot prices via FRED' });
    const s = joined('brent_wti');
    legend.append(chip('Brent − WTI (weekly mean to 2024, daily since 2025)', C.violet), chip('the usual range, $3 to $5', 'rgba(11,79,192,0.25)'));
    timeChart(stage, {
      w: 760, x0: Date.UTC(2000, 0, 1), x1: Date.UTC(2026, 10, 1), xticks: yearTicks(2000, 2026, 2),
      events: (DATA.curated.gapEvents || []).map((e) => [ts(e.d), e.n, e.t]),
      panels: [{ h: 260, ymin: -15, ymax: 35, zero: true, yfmt: (v) => '$' + v, bands: [], series: [{ name: 'Brent − WTI', c: C.violet, ...s, w: 1.2 }] }],
      hover: fdate, aria: 'Brent minus WTI spread',
    });
    const svg = stage.querySelector('svg');
    // shade the usual band
    const tc = svg; const ys = [3, 5];
    const yScale = (v) => { const top = 10 + 34, hgt = 260; return top + hgt - ((v + 15) / 50) * hgt; };
    tc.insertBefore(S('rect', { x: 50, width: 694, y: yScale(ys[1]), height: yScale(ys[0]) - yScale(ys[1]), fill: 'rgba(11,79,192,0.08)' }), tc.firstChild);
  };

  // ---- US weekly stocks: distillate, Cushing, SPR
  FIG.stocks = function (root) {
    const { stage, ctrl, legend } = sheet(root, { eyebrow: 'US stocks, million barrels, weekly', short: 'The tanks', source: 'EIA Weekly Petroleum Status Report' });
    const st = { k: root.dataset.view || 'distillate_stocks' };
    const KEYS = { distillate_stocks: ['Distillate (diesel, heating oil)', C.diesel], cushing: ['Crude at Cushing, Oklahoma', C.wti], spr: ['Strategic Petroleum Reserve', C.gold], us_crude_stocks: ['Commercial crude, US', C.crude], gasoline_stocks: ['Gasoline', C.gas] };
    ctrl.append(seg(Object.entries(KEYS).map(([k, [n]]) => [k, n.split(' (')[0].split(',')[0]]), st.k, (v) => { st.k = v; draw(); }));
    const sk = DATA.stocks;
    function draw() {
      const [name, col] = KEYS[st.k];
      // seasonal view: each year a line over the calendar, 2015-2024 range as a band, 2025 and 2026 bold
      const byYear = {};
      sk.t.forEach((t, i) => { const v = sk[st.k][i]; if (v == null) return; const y = +t.slice(0, 4); (byYear[y] = byYear[y] || []).push([ts('2026' + t.slice(4)), v / 1000]); });
      const lines = [];
      const band = [];
      for (let wk = 0; wk < 53; wk++) {
        const x = Date.UTC(2026, 0, 1) + wk * 7 * 864e5; const vals = [];
        for (let y = 2015; y <= 2024; y++) { const a = byYear[y]; if (!a) continue; const p = a.reduce((b, q) => (Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b), a[0]); if (Math.abs(p[0] - x) < 5 * 864e5) vals.push(p[1]); }
        if (vals.length) band.push([x, Math.min(...vals), Math.max(...vals)]);
      }
      const all = Object.values(byYear).flat().filter((p) => p).map((p) => p[1]);
      const lo = Math.floor(Math.min(...all.slice(-600)) * 0.9 / 10) * 10, hi = Math.ceil(Math.max(...all.slice(-600)) * 1.08 / 10) * 10;
      for (const y of [2022, 2025, 2026]) if (byYear[y]) lines.push({ name: String(y), c: y === 2026 ? col : y === 2025 ? C.muted : C.grey, x: byYear[y].map((p) => p[0]), y: byYear[y].map((p) => p[1]), w: y === 2026 ? 2.4 : 1.2, dash: y === 2022 ? '4 3' : null, fmt: (v) => f1(v) + ' m bbl' });
      lines.push({ name: '2015–24 low', c: 'rgba(4,32,75,0.3)', x: band.map((b) => b[0]), y: band.map((b) => b[1]), w: 0.8, fmt: (v) => f1(v) + ' m bbl' });
      lines.push({ name: '2015–24 high', c: 'rgba(4,32,75,0.3)', x: band.map((b) => b[0]), y: band.map((b) => b[2]), w: 0.8, fmt: (v) => f1(v) + ' m bbl' });
      legend.replaceChildren(chip(name + ', 2026', col), chip('2025', C.muted), chip('2022', C.grey), chip('range of 2015–2024', 'rgba(4,32,75,0.18)'));
      const r = timeChart(stage, { w: 760, x0: Date.UTC(2026, 0, 1), x1: Date.UTC(2026, 11, 31), xticks: MON.map((m, i) => [Date.UTC(2026, i, 1), m]), panels: [{ h: 260, ymin: lo, ymax: hi, yfmt: (v) => v + ' m', series: lines }], hover: (x) => { const d = new Date(x); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }, aria: name + ' by week of the year' });
      const g = r.geo[0];
      const poly = band.map((b) => `${r.X(b[0]).toFixed(1)},${g.Y(b[2]).toFixed(1)}`).concat(band.slice().reverse().map((b) => `${r.X(b[0]).toFixed(1)},${g.Y(b[1]).toFixed(1)}`));
      r.svg.insertBefore(S('polygon', { points: poly.join(' '), fill: 'rgba(4,32,75,0.07)' }), r.svg.querySelector('g'));
    }
    draw();
  };

  // ---- US supply: field production and exports, weekly
  FIG.us = function (root) {
    const { stage, legend } = sheet(root, { eyebrow: 'United States, thousand barrels a day, weekly', short: 'Shale and exports', source: 'EIA Weekly Petroleum Status Report' });
    const sk = DATA.stocks;
    const P = series(sk, 'crude_prod'), E = series(sk, 'crude_exports');
    legend.append(chip('Crude oil field production', C.crude), chip('Crude exports', C.brent));
    timeChart(stage, {
      w: 760, x0: Date.UTC(2004, 0, 1), x1: Date.UTC(2026, 10, 1), xticks: yearTicks(2004, 2026, 2),
      events: (DATA.curated.usEvents || []).map((e) => [ts(e.d), e.n, e.t]),
      panels: [{ h: 260, ymin: 0, ymax: 14500, ticks: [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000], yfmt: (v) => (v / 1000).toFixed(0) + ' m', series: [
        { name: 'Production', c: C.crude, ...P, w: 1.7, fmt: (v) => (v / 1000).toFixed(2) + ' mb/d' }, { name: 'Exports', c: C.brent, ...E, w: 1.2, fmt: (v) => (v / 1000).toFixed(2) + ' mb/d' }] }],
      hover: fdate, aria: 'US crude production and exports',
    });
  };


  // ================================================================== MAPS
  function projector(m) {
    if (m.proj === 'equalearth') {
      const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, D = Math.PI / 180;
      return ([lon, lat]) => {
        let l = lon - m.lon0; if (l > 180) l -= 360; if (l < -180) l += 360;
        const th = Math.asin((Math.sqrt(3) / 2) * Math.sin(lat * D)), t2 = th * th, t6 = t2 * t2 * t2;
        const x = (2 * Math.sqrt(3) * l * D * Math.cos(th)) / (3 * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
        const y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
        return [m.cx + m.s * x, m.cy - m.s * y];
      };
    }
    return ([lon, lat]) => [(lon - m.lon0) * m.kx, (m.lat1 - lat) * m.ky];
  }
  function baseMap(m, o = {}) {
    const vb = o.vb || [0, 0, m.w, m.h];
    const svg = S('svg', { viewBox: vb.join(' '), class: 'os-svg os-map', role: 'img', 'aria-label': o.aria || 'map' });
    svg.append(S('rect', { x: vb[0], y: vb[1], width: vb[2], height: vb[3], class: 'os-sea' }));
    // graticule
    const P = projector(m), g = S('g', { class: 'os-grat' });
    for (let lon = -180; lon <= 180; lon += 15) { const pts = []; for (let lat = -60; lat <= 85; lat += 5) pts.push(P([lon, lat])); g.append(S('path', { d: 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L'), class: 'os-gratl' })); }
    for (let lat = -60; lat <= 80; lat += 15) { const pts = []; for (let lon = -180; lon <= 180; lon += 5) pts.push(P([lon, lat])); g.append(S('path', { d: 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L'), class: 'os-gratl' })); }
    if (m.proj === 'equalearth' || o.grat) svg.append(g);
    const land = S('g', {});
    for (const [k, f] of Object.entries(m.c)) land.append(S('path', { d: f.d, class: 'os-land' + (o.hi && o.hi.includes(k.slice(0, 3)) ? ' hi' : ''), 'data-iso': k }, S('title', {}, f.n)));
    svg.append(land);
    return { svg, P };
  }
  // a polyline of lon/lat points -> SVG path, densified so long legs bend with the projection
  function lanePath(P, pts) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      if (i) { const [a, b] = [pts[i - 1], pts[i]]; const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3); for (let k = 1; k < n; k++) out.push(P([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)])); }
      out.push(P(pts[i]));
    }
    return out;
  }
  const dOf = (xy) => 'M' + xy.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');
  // smooth a screen polyline with a Catmull-Rom spline
  function smoothD(xy) {
    if (xy.length < 3) return dOf(xy);
    let d = `M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`;
    for (let i = 0; i < xy.length - 1; i++) {
      const p0 = xy[i - 1] || xy[i], p1 = xy[i], p2 = xy[i + 1], p3 = xy[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }
  const FLOWC = () => ({ crude: C.crude, wti: '#d98a52', urals: C.violet });

  // ---- the world's oil on the move: 2025 crude flows on their sea lanes, the chokepoints, and October 2026
  FIG.flows = function (root) {
    const m = GEO.world, cu = DATA.curated;
    const { stage, ctrl, legend } = sheet(root, { eyebrow: 'Crude oil at sea, million barrels a day', short: 'World flows', source: 'EIA chokepoints 2026 · Energy Institute 2026', date: '2025 / 2026' });
    const st = { mode: root.dataset.view || 'normal' };
    const { svg, P } = baseMap(m, { vb: [20, 40, 960, 420], aria: 'Map of crude oil flows and chokepoints' });
    const routes = S('g', {}), ships = S('g', {}), marks = S('g', {}), labels = S('g', {});
    svg.append(routes, ships, marks, labels);
    const FC = FLOWC();
    const flows = cu.flows.map((f) => {
      const xy = f.lanes.flatMap((k, i) => { const p = lanePath(P, cu.lanes[k]); return i ? p.slice(1) : p; });
      const d = smoothD(xy);
      const w = 0.8 + f.mbd * 0.55;
      const path = S('path', { d, class: 'os-route', stroke: FC[f.c], 'stroke-width': w, 'stroke-opacity': 0.22, 'stroke-dasharray': f.pipe ? '2 3' : null });
      const core = S('path', { d, class: 'os-route', stroke: FC[f.c], 'stroke-width': 0.8, 'stroke-opacity': 0.75 });
      const hit = S('path', { d, class: 'os-route', stroke: 'transparent', 'stroke-width': Math.max(10, w + 6), style: 'pointer-events:stroke',
        onpointermove: (ev) => showTip(ev, `<b>${f.from} → ${f.to}</b><br>${f.mbd.toFixed(1)} million barrels a day of crude in 2025${f.pipe ? ' (by pipeline)' : ''}${f.hormuz ? '<br>passes the Strait of Hormuz' : ''}`), onpointerleave: hideTip });
      routes.append(path, core, hit);
      const len = path.getTotalLength ? 0 : 0;
      const n = Math.max(2, Math.round(f.mbd * 3));
      const dots = []; for (let i = 0; i < n; i++) { const c = S('circle', { r: f.pipe ? 1.3 : 1.9, fill: FC[f.c] }); ships.append(c); dots.push(c); }
      return { f, path, core, dots, phase: Math.random(), len };
    });
    const R = (mbd) => 3 + Math.sqrt(mbd) * 3.2;
    const choke = cu.chokepoints.map((c) => {
      const [x, y] = P([c.lon, c.lat]);
      const ring = S('circle', { cx: x, cy: y, r: R(c.mbd), class: 'os-choke' });
      const pulse = S('circle', { cx: x, cy: y, r: R(c.mbd), class: 'os-chokep' });
      const g = S('g', { tabindex: 0, onpointermove: (ev) => showTip(ev, `<b>${c.name}</b><br>${c.mbd} mb/d of crude and products, first half of 2025 (EIA)`), onpointerleave: hideTip }, pulse, ring);
      marks.append(g);
      const lx = { malacca: 8, hormuz: 8, cape: 10, suez: -8, danish: -8, babel: 8, turkish: 8, panama: -8 }[c.k], anchor = lx < 0 ? 'end' : 'start';
      const ly = { suez: -6, turkish: -6, danish: -4, hormuz: -6, babel: 10 }[c.k] || 4;
      labels.append(S('text', { x: x + lx + (lx < 0 ? -R(c.mbd) : R(c.mbd)), y: y + ly, 'text-anchor': anchor, class: 'os-place sm' }, `${c.name.replace('Strait of ', '').replace(' Canal and SUMED', '').replace(' of Good Hope', '')} ${c.mbd}`));
      return { c, ring, pulse };
    });
    ctrl.append(seg([['normal', '2025: a normal year'], ['war', 'October 2026: Hormuz and the Red Sea']], st.mode, (v) => { st.mode = v; restyle(); }));
    legend.append(chip('Gulf, Africa, Brazil crude', C.crude), chip('US and Canadian crude', '#d98a52'), chip('Russian and Caspian crude', C.violet), chip('chokepoint, ring area ∝ flow', C.line));
    const read = h('div', { class: 'os-read' });
    stage.append(svg, read);
    function restyle() {
      const war = st.mode === 'war';
      for (const r of flows) {
        const hit = war && (r.f.hormuz || r.f.lanes.includes('suez_south') || r.f.lanes.includes('arab_to_redsea'));
        r.path.setAttribute('stroke-opacity', hit ? 0.08 : 0.22); r.core.setAttribute('stroke-opacity', hit ? 0.25 : 0.75);
        r.speed = hit ? 0.25 : 1; r.dim = hit;
      }
      for (const k of choke) {
        const bad = war && ['hormuz', 'babel', 'suez'].includes(k.c.k);
        k.ring.classList.toggle('bad', bad); k.pulse.classList.toggle('bad', bad);
      }
      read.innerHTML = war ? '<b>Oct 2026</b> · Hormuz: about 5 ship transits a day against ~100 before the war, yet ~11.7 mb/d of oil leaves the Gulf, mostly dark · Bab el-Mandeb 2.6 mb/d (Sep) after the Houthi blockade · Cape of Good Hope passages up sharply'
        : '<b>2025</b> · 44 mb/d of crude crosses borders; 79.8 mb/d of crude and products moves by sea, 76 % of world supply · hover a route or a ring';
    }
    restyle();
    // ships move along their lane
    let ready = false;
    whenSeen(svg, () => { flows.forEach((r) => { r.len = r.path.getTotalLength(); }); ready = true; });
    looper(svg, (dt) => {
      if (!ready) return;
      for (const r of flows) {
        r.phase = (r.phase + (dt * (r.f.pipe ? 18 : 32) * (r.speed || 1)) / r.len) % 1;
        r.dots.forEach((c, i) => { const p = r.path.getPointAtLength(((r.phase + i / r.dots.length) % 1) * r.len); c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1)); c.setAttribute('opacity', r.dim ? 0.25 : 0.95); });
      }
    });
  };

  // ---- the Gulf: Hormuz, the bypass pipelines, the terminals, and 2026 stage by stage
  FIG.hormuz = function (root) {
    const m = GEO.gulf, cu = DATA.curated;
    const { stage, ctrl, legend } = sheet(root, { eyebrow: 'The Strait of Hormuz and its bypasses', short: 'Hormuz 2026', source: 'EIA · Kpler · IMF PortWatch · press (see text)', date: '2026' });
    const st = { i: 0, auto: !REDUCED };
    const { svg, P } = baseMap(m, { vb: [20, 20, 950, 640], aria: 'Map of the Persian Gulf, the Strait of Hormuz and the bypass pipelines', grat: true });
    svg.classList.add('os-zoom');
    const place = (n) => cu.places.find((p) => p.n === n);
    const at = (n) => P([place(n).lon, place(n).lat]);
    // pipelines
    const pipes = S('g', {});
    const ew = S('path', { d: dOf([at('Abqaiq'), P([46.0, 24.9])]), class: 'os-pipe' });
    const ad = S('path', { d: smoothD([at('Habshan'), P([54.8, 24.3]), P([55.8, 24.9]), at('Fujairah')]), class: 'os-pipe' });
    const gj = S('path', { d: smoothD([P([50.6, 29.9]), P([53.5, 28.6]), P([56.0, 27.2]), at('Jask')]), class: 'os-pipe thin' });
    pipes.append(ew, ad, gj);
    // shipping lane through the strait (traffic separation scheme, schematic): its width is the day's flow
    const laneIn = lanePath(P, [[49.2, 29.25], [50.3, 28.3], [51.4, 27.5], [52.5, 26.95], [54.6, 26.55], [56.2, 26.62], [56.65, 26.35], [57.2, 25.75], [58.2, 24.9], [60.5, 23.5]]);
    const laneD = smoothD(laneIn);
    const band = S('path', { d: laneD, class: 'os-hzband' });
    const lane = S('path', { d: laneD, class: 'os-hzsep' });
    const laneLen = () => lane.getTotalLength();
    const ships = S('g', {});
    // the closure: a bar across the narrows
    const [hx, hy] = P([56.45, 26.55]);
    const shut = S('g', { class: 'os-hzshut', transform: `translate(${hx},${hy}) rotate(-62)` },
      S('line', { x1: -30, x2: 30, y1: 0, y2: 0 }));
    const shutLab = S('text', { x: hx - 22, y: hy + 34, 'text-anchor': 'end', class: 'os-hzshut' }, 'CLOSED');
    svg.append(pipes, band, lane, ships, shut, shutLab);
    // terminals
    const marks = S('g', {});
    const lab = { 'Ras Tanura': 'l', Abqaiq: 'l', 'Kharg Island': 'r', 'Basra (ABOT)': 'r', 'Mina al-Ahmadi': 'b', Habshan: 'b', Fujairah: 'r', Jask: 'r', 'Ras Laffan': 'r' };
    for (const n of Object.keys(lab)) {
      const [x, y] = at(n), p = place(n), sd = lab[n];
      marks.append(S('g', { tabindex: 0, onpointermove: (ev) => showTip(ev, `<b>${n}</b><br>${p.role}`), onpointerleave: hideTip }, S('rect', { x: x - 4, y: y - 4, width: 8, height: 8, class: 'os-term' })));
      marks.append(S('text', { x: x + (sd === 'r' ? 10 : sd === 'l' ? -10 : 0), y: y + (sd === 'b' ? 20 : 4), 'text-anchor': sd === 'r' ? 'start' : sd === 'l' ? 'end' : 'middle', class: 'os-place sm' }, n));
    }
    marks.append(S('text', { x: hx + 18, y: hy - 30, class: 'os-place' }, 'Strait of Hormuz'));
    const flowLab = S('text', { x: P([59.4, 25.6])[0], y: P([59.4, 25.6])[1], 'text-anchor': 'middle', class: 'os-hzflow os-desk' });
    const flowSub = S('text', { x: P([59.4, 25.6])[0], y: P([59.4, 25.6])[1] + 18, 'text-anchor': 'middle', class: 'os-num os-desk' }, 'through the strait');
    marks.append(flowLab, flowSub);
    const [ewx, ewy] = P([46.6, 25.05]);
    marks.append(S('text', { x: ewx - 14, y: ewy - 12, class: 'os-place sm' }, '← to Yanbu, Red Sea'), S('text', { x: ewx - 14, y: ewy + 4, class: 'os-num os-desk' }, 'East–West line, 5–7 mb/d'));
    const [adx, ady] = P([55.1, 24.75]);
    marks.append(S('text', { x: adx, y: ady, 'text-anchor': 'end', class: 'os-num os-desk' }, 'Habshan–Fujairah, 1.5–1.8 mb/d'));
    marks.append(S('text', { x: P([53.0, 28.4])[0] + 6, y: P([53.0, 28.4])[1] - 8, class: 'os-place sm' }, 'Goreh–Jask'));
    for (const [n, lon, lat] of [['IRAN', 53.5, 30.1], ['SAUDI ARABIA', 48.8, 23.0], ['UAE', 53.2, 23.1], ['OMAN', 57.8, 22.6], ['QATAR', 51.2, 25.25], ['IRAQ', 47.2, 30.3], ['KUWAIT', 47.5, 29.45]]) {
      const [x, y] = P([lon, lat]); marks.append(S('text', { x, y, 'text-anchor': 'middle', class: 'os-country' }, n));
    }
    svg.append(marks);
    // gauge panel
    const panel = h('div', { class: 'os-hz' });
    const tl = h('div', { class: 'os-steps' });
    const btns = cu.hormuz.map((s, i) => h('button', { type: 'button', onclick: () => { st.auto = false; go(i); } }, h('i', {}, s.d), s.title));
    tl.append(...btns);
    ctrl.append(tl);
    stage.append(svg, panel);
    legend.append(chip('bypass pipeline', C.gold), chip('laden tanker, outbound', C.crude), chip('shipping lane: width is the flow', 'rgba(180,85,47,0.3)'), chip('export terminal', C.line));
    let ships0 = 100, flowT = 20, flowW = 20;
    function go(i) {
      st.i = i; btns.forEach((b, j) => b.classList.toggle('on', j === i));
      const s = cu.hormuz[i];
      const bar = (v) => v == null ? '<span class="bar"></span>' : `<span class="bar"><span style="width:${(v / 25) * 100}%"></span></span>`;
      panel.innerHTML = `<div class="g"><i>Oil through the strait</i><b>${s.hormuz == null ? 'n/a' : s.hormuz + ' mb/d'}</b>${bar(s.hormuz)}</div>
        <div class="g"><i>Gulf exports, all routes</i><b>${s.exports == null ? 'n/a' : s.exports + ' mb/d'}</b>${bar(s.exports)}</div><div class="g"><i>Ships a day</i><b class="sm">${s.ships}</b></div><div class="g"><i>East–West line</i><b class="sm">${s.ew}</b></div><p>${s.text}</p>`;
      ew.classList.toggle('on', i > 0); ad.classList.toggle('on', i > 0); gj.classList.toggle('on', i > 0 && i < 3);
      ships0 = { prewar: 100, mar: 4, apr: 9, jun: 16, aug: 6, oct: 5 }[s.k]; // PortWatch transits relative to February (78 a day)
      flowT = s.hormuz == null ? 9 : s.hormuz;
      flowLab.textContent = s.hormuz == null ? 'n/a' : s.hormuz + ' mb/d';
      shut.classList.toggle('on', ['mar', 'apr'].includes(s.k)); shutLab.classList.toggle('on', shut.classList.contains('on'));
      ships.classList.toggle('dark', s.k === 'oct');
      // in October most of the 11.6 mb/d sailed dark: draw the counted ships plus faint ghosts
      ships0 = s.k === 'oct' ? 45 : ships0;
    }
    go(0);
    // ships: two streams (laden outbound south of the separation line, empty inbound north), unevenly spaced
    const N = 30, dots = [];
    const jit = Array.from({ length: N }, (_, i) => ((i * 0.6180339) % 1) * 0.5 / N);
    for (let i = 0; i < N; i++) {
      const out = i % 2 === 0;
      const c = S('g', { class: out ? 'os-ship out' : 'os-ship in' }, S('path', { d: 'M-6,-2.2h9l3,2.2l-3,2.2h-9z' }));
      ships.append(c); dots.push({ c, out, u0: i / N + jit[i] });
    }
    let L = 0, ph = 0, auto = 0, density = 1, uS = 0.7;
    const measure = () => { L = laneLen(); let best = 1e9; for (let k = 0; k <= 200; k++) { const p = lane.getPointAtLength((k / 200) * L), d = Math.hypot(p.x - hx, p.y - hy); if (d < best) { best = d; uS = k / 200; } } };
    whenSeen(svg, measure);
    const draw = (dt) => {
      if (!L) measure();
      const closed = shut.classList.contains('on');
      density += ((ships0 / 100) - density) * (1 - Math.exp(-dt / 0.8));
      flowW += (flowT - flowW) * (1 - Math.exp(-dt / 0.5));
      band.style.strokeWidth = (3 + flowW * 1.1).toFixed(1);
      const off = 2 + flowW * 0.3;
      ph = (ph + dt * 0.01) % 1;
      dots.forEach(({ c, out, u0 }, i) => {
        let u = (u0 + ph) % 1; if (!out) u = 1 - u;
        const p = lane.getPointAtLength(u * L), q = lane.getPointAtLength(Math.min(L, u * L + 2)), r = lane.getPointAtLength(Math.max(0, u * L - 2));
        const ang = Math.atan2(q.y - r.y, q.x - r.x), nx = -Math.sin(ang), ny = Math.cos(ang), o = out ? off : -off;
        c.setAttribute('transform', `translate(${(p.x + nx * o).toFixed(1)},${(p.y + ny * o).toFixed(1)}) rotate(${((ang * 180) / Math.PI + (out ? 0 : 180)).toFixed(0)})`);
        c.setAttribute('opacity', (i / N) < density && !(closed && u > uS - 0.02) ? 1 : 0);
      });
    };
    draw(1);
    looper(svg, (dt) => {
      if (st.auto) { auto += dt; if (auto > 5.5) { auto = 0; go((st.i + 1) % cu.hormuz.length); } }
      draw(dt);
    });
  };


  // ================================================================== bars and small multiples
  // horizontal bar rows in SVG: rows [{label, value, color, note, hi}], o: {max, fmt, w, rowH, labelW}
  function barRows(rows, o) {
    const W = o.w || 760, LW = o.labelW || 230, RW = 90, rh = o.rowH || 26, H = rows.length * rh + 26;
    const X = (v) => LW + (v / o.max) * (W - LW - RW);
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': o.aria || 'bar chart' });
    for (const t of o.ticks || niceTicks(0, o.max, 5)) svg.append(S('line', { x1: X(t), x2: X(t), y1: 4, y2: H - 18, class: 'os-gridv' }), S('text', { x: X(t), y: H - 4, 'text-anchor': 'middle', class: 'os-ax' }, o.tickFmt ? o.tickFmt(t) : t));
    const bars = [];
    rows.forEach((r, i) => {
      const y = 6 + i * rh;
      svg.append(S('text', { x: LW - 10, y: y + rh / 2 + 1, 'text-anchor': 'end', class: 'os-rowl' + (r.hi ? ' hi' : '') }, r.label));
      const b = S('rect', { x: LW, y: y + 4, width: 0, height: rh - 10, fill: r.color || C.crude, 'fill-opacity': r.dim ? 0.35 : 0.85, rx: 1 });
      const v = S('text', { x: LW + 6, y: y + rh / 2 + 1, class: 'os-rowv' }, o.fmt ? o.fmt(r.value) : r.value);
      const hit = S('rect', { x: 0, y, width: W, height: rh, fill: 'transparent', onpointermove: (ev) => r.note && showTip(ev, `<b>${r.label}</b><br>${r.note}`), onpointerleave: hideTip });
      svg.append(b, v, hit);
      bars.push([b, v, r]);
    });
    const grow = () => bars.forEach(([b, v, r], i) => {
      const w = Math.max(0, X(r.value) - LW);
      b.style.transition = REDUCED ? '' : `width 900ms cubic-bezier(.3,.6,.2,1) ${i * 40}ms`;
      b.setAttribute('width', w); v.setAttribute('x', LW + w + 6);
    });
    whenSeen(svg, grow, '-40px 0px');
    return svg;
  }

  // ---- boiling point against molecule size, with the product cuts and the cracking limit; optional vacuum
  const CUTC = ['#c99a1e', '#5fb3a5', '#138374', '#8a93a6', '#6a47c2', '#b58a5e', '#4e3b2c'];
  FIG.boil = function (root) {
    const D = DATA.curated.distill;
    const { stage, ctrl, legend } = sheet(root, { eyebrow: 'Normal boiling point, °C, against the number of carbon atoms', short: 'Size sets the boiling point', source: 'NIST WebBook · CRC via Wikipedia · ASTM D2887 · TotalEnergies cut points', date: 'reference data' });
    const st = { vac: false, shapes: true };
    const W = 760, H = 380, M = { l: 52, r: 150, t: 16, b: 34 };
    const X = (c) => M.l + ((c - 0) / 41) * (W - M.l - M.r), Y = (t) => H - M.b - ((t + 180) / 760) * (H - M.t - M.b);
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'Boiling point of hydrocarbons against carbon number' });
    for (const t of [-150, -50, 50, 150, 250, 350, 450, 550]) svg.append(S('line', { x1: M.l, x2: W - M.r, y1: Y(t), y2: Y(t), class: 'os-gridh' }), S('text', { x: M.l - 7, y: Y(t) + 3.5, 'text-anchor': 'end', class: 'os-ax' }, t + '°'));
    for (const c of [1, 5, 10, 15, 20, 25, 30, 35, 40]) svg.append(S('text', { x: X(c), y: H - 12, 'text-anchor': 'middle', class: 'os-ax' }, 'C' + c));
    // product bands: the temperature range each cut collects
    D.cuts.forEach(([n, lo, hi], i) => {
      const a = lo == null ? -180 : lo, b = hi == null ? 580 : hi;
      svg.append(S('rect', { x: M.l, y: Y(b), width: W - M.l - M.r, height: Y(a) - Y(b), fill: CUTC[i], 'fill-opacity': 0.1 }),
        S('rect', { x: W - M.r + 6, y: Y(b) + 1, width: 5, height: Y(a) - Y(b) - 2, fill: CUTC[i] }),
        S('text', { x: W - M.r + 16, y: (Y(a) + Y(b)) / 2 + 4, class: 'os-small', style: 'fill:#04204b' }, n));
    });
    // thermal cracking begins (OSHA 343-371 °C, PSU up to 399 °C)
    svg.append(S('rect', { x: M.l, y: Y(371), width: W - M.l - M.r, height: Y(343) - Y(371), fill: C.red, 'fill-opacity': 0.12 }),
      S('line', { x1: M.l, x2: W - M.r, y1: Y(360), y2: Y(360), stroke: C.red, 'stroke-width': 1.2, 'stroke-dasharray': '5 3' }),
      S('text', { x: M.l + 6, y: Y(371) - 5, class: 'os-small', style: `fill:${C.red}` }, 'above ~350–370 °C the molecules start to crack'));
    const atm = S('path', { fill: 'none', stroke: C.line, 'stroke-width': 2.2 }), vac = S('path', { fill: 'none', stroke: C.brent, 'stroke-width': 2.2, 'stroke-dasharray': '6 3' });
    const dots = S('g', {}), shp = S('g', {}), vlab = S('text', { class: 'os-lab', style: `fill:${C.brent}` });
    svg.append(atm, vac, dots, shp, vlab);
    const ptsA = D.alkanes.map(([c, , t]) => [X(c), Y(t)]);
    atm.setAttribute('d', dOf(ptsA));
    D.alkanes.forEach(([c, n, t]) => dots.append(S('circle', { cx: X(c), cy: Y(t), r: 3.2, fill: C.line, onpointermove: (ev) => showTip(ev, `<b>${n}</b>, C${c}<br>boils at ${t} °C at 1 atm`), onpointerleave: hideTip })));
    const FC = { aromatic: C.red, naphthene: C.teal, branched: C.gold };
    D.shapes.forEach(([n, c, f, t]) => shp.append(S('path', { d: `M${X(c)},${Y(t) - 5}l5,8.5h-10z`, fill: FC[f], onpointermove: (ev) => showTip(ev, `<b>${n}</b>, C${c}, ${f}<br>boils at ${t} °C (the straight chain C${c}: ${(D.alkanes.find((a) => a[0] === c) || [0, 0, '–'])[2]} °C)`), onpointerleave: hideTip })));
    // Clausius-Clapeyron at 50 mmHg with the entropy of vaporisation fitted to heavy alkanes (112 J/mol/K): derived, approximate
    const vacT = (tb) => (tb + 273.15) / (1 - (8.314 / 112) * Math.log(50 / 760)) - 273.15;
    const ptsV = D.alkanes.filter(([c]) => c >= 10).map(([c, , t]) => [X(c), Y(vacT(t))]);
    vac.setAttribute('d', dOf(ptsV));
    const read = h('div', { class: 'os-read' });
    function draw() {
      vac.style.opacity = st.vac ? 1 : 0; vlab.style.opacity = st.vac ? 1 : 0;
      const c40 = vacT(522);
      vlab.setAttribute('x', X(40) - 4); vlab.setAttribute('y', Y(c40) + 18); vlab.setAttribute('text-anchor', 'end'); vlab.textContent = 'at 50 mmHg';
      shp.style.opacity = st.shapes ? 1 : 0;
      read.innerHTML = st.vac
        ? 'Under a vacuum of 50 mmHg (a fifteenth of an atmosphere) every boiling point drops by about 130–150 °C: a wax that boils at 500 °C now boils near <b>370 °C</b>, so the heavy gasoil can be distilled off before it cracks. Approximate (Clausius–Clapeyron, fitted to measured heavy-alkane data).'
        : 'Each extra carbon atom adds about the same surface, so the boiling point climbs with size: about <b>+30 °C per carbon</b> at C5–C8, +17 at C15, +7 at C35. The triangles are rings and branched molecules: a ring boils higher than a chain of the same size, a branched one lower.';
    }
    ctrl.append(seg([['atm', 'At 1 atmosphere'], ['vac', 'Under vacuum']], 'atm', (v) => { st.vac = v === 'vac'; draw(); }));
    legend.append(chip('straight-chain alkanes', C.line), chip('aromatics', C.red), chip('naphthenes (rings)', C.teal), chip('branched', C.gold), chip('thermal cracking zone', 'rgba(192,57,43,0.4)'));
    stage.append(svg, read);
    draw();
  };

  // ---- true boiling point curves: how much of each crude has boiled off at a given temperature
  FIG.tbp = function (root) {
    const D = DATA.curated.distill;
    const { stage, ctrl, legend } = sheet(root, { eyebrow: 'Cumulative weight per cent distilled, against temperature', short: 'TBP curves', source: 'TotalEnergies and Equinor assays · crudemonitor.ca (WCS SimDist)', date: 'assays 2006–2026' });
    const CR = Object.keys(D.tbp), COL = ['#0b4fc0', '#b4552f', '#138374', '#6a47c2', '#4e3b2c'];
    const st = { cut: 4 };
    const W = 760, H = 360, M = { l: 48, r: 18, t: 14, b: 54 };
    const X = (t) => M.l + (t / 700) * (W - M.l - M.r), Y = (v) => H - M.b - (v / 100) * (H - M.t - M.b);
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'True boiling point curves of five crude oils' });
    for (const v of [0, 20, 40, 60, 80, 100]) svg.append(S('line', { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v), class: 'os-gridh' }), S('text', { x: M.l - 7, y: Y(v) + 3.5, 'text-anchor': 'end', class: 'os-ax' }, v + ' %'));
    for (let t = 0; t <= 700; t += 100) svg.append(S('text', { x: X(t), y: H - M.b + 15, 'text-anchor': 'middle', class: 'os-ax' }, t + ' °C'));
    const bandG = S('g', {}); svg.append(bandG);
    D.cuts.forEach(([n, lo, hi], i) => {
      const a = lo == null ? 0 : lo, b = hi == null ? 700 : hi;
      svg.append(S('rect', { x: X(a), y: H - M.b + 24, width: X(b) - X(a) - 1, height: 8, fill: CUTC[i], style: 'cursor:pointer', onclick: () => segc.querySelectorAll('button')[i].click() }, S('title', {}, n)));
    });
    const interp = (pts, t) => { if (t <= pts[0][0]) return t < pts[0][0] && pts[0][0] > 60 ? null : pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return va + (vb - va) * (t - a) / (b - a); } return null; };
    CR.forEach((k, i) => {
      const pts = D.tbp[k];
      svg.append(S('path', { d: dOf(pts.map(([t, v]) => [X(t), Y(v)])), fill: 'none', stroke: COL[i], 'stroke-width': 2.2, 'stroke-dasharray': /SimDist/.test(k) ? '5 3' : null }));
      const [lt, lv] = pts[pts.length - 1];
      svg.append(S('text', { x: X(lt) + 5, y: Y(lv) + 4 + ({ Grane: -6, Oman: 5 }[k.split(' ')[0]] || 0), class: 'os-small', style: `fill:${COL[i]}` }, k.split(' ')[0]));
    });
    const read = h('div', { class: 'os-read' });
    function draw() {
      const [n, lo, hi] = D.cuts[st.cut], a = lo == null ? 0 : lo, b = hi == null ? 700 : hi;
      bandG.replaceChildren(S('rect', { x: X(a), y: M.t, width: X(Math.min(b, 700)) - X(a), height: H - M.b - M.t, fill: CUTC[st.cut], 'fill-opacity': 0.12 }));
      const parts = CR.map((k) => { const ya = lo == null ? 0 : interp(D.tbp[k], a), yb = interp(D.tbp[k], b); return ya == null || yb == null ? `${k.split(' ')[0]} –` : `${k.split(' ')[0]} <b>${(yb - ya).toFixed(0)} %</b>`; });
      read.innerHTML = `${n}, ${lo == null ? 'below ' + hi : hi == null ? 'above ' + lo : lo + '–' + hi} °C: ${parts.join(' · ')} of the crude by weight. The steeper and further left a curve, the lighter the crude.`;
    }
    const segc = seg(D.cuts.map(([n], i) => [String(i), n.replace(' / jet', '').replace('Gas and LPG', 'LPG')]), String(st.cut), (v) => { st.cut = +v; draw(); });
    ctrl.append(segc);
    legend.append(...CR.map((k, i) => chip(k, COL[i])));
    stage.append(svg, read);
    draw();
  };

  // ---- one tray is one small still: the Raoult staircase of a two-component mixture
  FIG.stages = function (root) {
    const D = DATA.curated.distill;
    const { stage, ctrl } = sheet(root, { eyebrow: 'Composition and temperature on each equilibrium stage, total reflux', short: 'Tray by tray', source: 'own calculation: Raoult’s law with NIST Antoine constants', date: 'derived' });
    const st = { pair: 'C7/C8' };
    const box = h('div', {}), read = h('div', { class: 'os-read' });
    stage.append(box, read);
    const NAMES = { 'C7/C8': ['heptane', 'octane', C.gas, '#b58a5e'], 'C10/C12': ['decane', 'dodecane', C.jet, C.diesel] };
    function draw() {
      const rows = D.stages[st.pair], [ln, hn, lc, hc] = NAMES[st.pair];
      const W = 760, rh = 52, H = (rows.length + 1) * rh + 20, bx = 210, bw = 420;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'Composition on successive distillation stages' });
      // stage 0 at the bottom: the liquid we start from; each step up is the vapour of the stage below
      const all = [[-1, rows[0][1], rows[0][2]], ...rows.map(([k, x, T, a, y]) => [k, y, null])];
      all.forEach(([k, frac], i) => {
        const y = H - 20 - (i + 1) * rh, last = i === all.length - 1;
        svg.append(S('text', { x: bx - 12, y: y + 18, 'text-anchor': 'end', class: 'os-rowl' + (last ? ' hi' : '') }, last ? `vapour leaving stage ${i}` : `liquid on stage ${i + 1}`));
        if (!last) svg.append(S('text', { x: bx - 12, y: y + 32, 'text-anchor': 'end', class: 'os-small' }, `boils at ${rows[i][2].toFixed(1)} °C`));
        const r1 = S('rect', { x: bx, y: y + 6, width: 0, height: 24, fill: lc }), r2 = S('rect', { x: bx, y: y + 6, width: bw, height: 24, fill: hc, 'fill-opacity': 0.75 });
        svg.append(r2, r1, S('text', { x: bx + bw + 10, y: y + 23, class: 'os-lab' }, `${(frac * 100).toFixed(0)} % ${ln}`));
        setTimeout(() => { r1.style.transition = REDUCED ? '' : 'width 700ms ease'; r1.setAttribute('width', bw * frac); }, REDUCED ? 0 : 80 + i * 160);
        if (i) svg.append(S('path', { d: `M${bx + bw / 2},${y + rh + 4}v-${rh - 32}`, stroke: C.muted, 'stroke-width': 1 }), S('text', { x: bx + bw / 2 + 6, y: y + rh - 2, class: 'os-small' }, '↑ its vapour, condensed'));
      });
      box.replaceChildren(svg);
      const one = rows[0][4], top = rows[rows.length - 1][4];
      read.innerHTML = `Start from a 50/50 liquid of ${ln} and ${hn}. One boiling gives a vapour of only <b>${(one * 100).toFixed(0)} %</b> ${ln}; condense it and boil it again, and again: after ${rows.length} stages the vapour is <b>${(top * 100).toFixed(0)} %</b> ${ln}, and each stage boils a little cooler, ${rows[0][2].toFixed(0)} → ${rows[rows.length - 1][2].toFixed(0)} °C. A column does this on every tray at once; that is its temperature gradient.`;
    }
    ctrl.append(seg([['C7/C8', 'Heptane and octane'], ['C10/C12', 'Decane and dodecane']], st.pair, (v) => { st.pair = v; draw(); }));
    draw();
  };

  // ---- crude grades: what each one yields in the first distillation
  FIG.assay = function (root) {
    const A = DATA.curated.assays;
    const { stage, legend } = sheet(root, { eyebrow: 'Straight-run yields by boiling range, weight %', short: 'Crude assays', source: 'TotalEnergies crude assays', date: 'assays 2006–21' });
    const CUTS = [['Gas and LPG', C.gold], ['Naphtha, 15–150 °C', C.gas], ['Kerosene, 150–230 °C', C.jet], ['Gasoil, 230–375 °C', C.diesel], ['Vacuum gasoil, 375–550 °C', '#b58a5e'], ['Vacuum residue, above 550 °C', '#4e3b2c']];
    const W = 760, LW = 200, rh = 44, H = A.length * rh + 30;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'Straight-run yields of six crude oils' });
    const X = (v) => LW + (v / 100) * (W - LW - 20);
    for (const t of [0, 25, 50, 75, 100]) svg.append(S('line', { x1: X(t), x2: X(t), y1: 4, y2: H - 20, class: 'os-gridv' }), S('text', { x: X(t), y: H - 5, 'text-anchor': 'middle', class: 'os-ax' }, t + ' %'));
    const segs = [];
    A.forEach((a, i) => {
      const y = 8 + i * rh, lpg = Math.max(0, 100 - a.cuts.reduce((p, q) => p + q, 0));
      const vals = [lpg, ...a.cuts];
      svg.append(S('text', { x: LW - 12, y: y + 15, 'text-anchor': 'end', class: 'os-rowl hi' }, a.n), S('text', { x: LW - 12, y: y + 29, 'text-anchor': 'end', class: 'os-small' }, `${a.api}° API${a.s != null ? ' · ' + a.s + ' % S' : ''}`));
      let acc = 0;
      vals.forEach((v, k) => {
        const r = S('rect', { x: X(acc), y: y + 4, width: Math.max(0, X(acc + v) - X(acc) - 1), height: 26, fill: CUTS[k][1], 'fill-opacity': 0.88,
          onpointermove: (ev) => showTip(ev, `<b>${a.n}</b><br>${CUTS[k][0]}: ${v.toFixed(1)} %`), onpointerleave: hideTip });
        if (!REDUCED) { r.style.transformOrigin = `${X(0)}px 0`; r.style.transform = 'scaleX(0)'; r.style.transition = `transform 900ms cubic-bezier(.3,.6,.2,1) ${i * 90}ms`; }
        svg.append(r); segs.push(r);
        if (v >= 7) svg.append(S('text', { x: X(acc + v / 2), y: y + 21, 'text-anchor': 'middle', class: 'os-segv', fill: onFill(CUTS[k][1]) }, Math.round(v)));
        acc += v;
      });
    });
    stage.append(svg);
    whenSeen(svg, () => segs.forEach((r) => { r.style.transform = 'scaleX(1)'; }), '-40px 0px');
    legend.append(...CUTS.map(([n, c]) => chip(n, c)));
  };

  // ---- the world's crude pipelines, by region, with the attacks of 2022-2026
  FIG.pipes = function (root) {
    const m = GEO.world, cu = DATA.curated;
    const { stage, ctrl, legend } = sheet(root, { eyebrow: 'Major crude oil pipelines, line width by capacity, and attacks 2022–2026', short: 'Pipelines', source: 'operators · EIA · Wikipedia coordinates · press (see text)', date: 'Oct 2026' });
    const { svg, P } = baseMap(m, { vb: [20, 40, 960, 420], aria: 'World map of major crude oil pipelines' });
    svg.classList.add('os-pipemap');
    const REG = {
      world: [[-165, -40], [180, 72], 'The big lines run where no tanker can: from Russia and the Caspian to Europe and China, across Arabia to the Red Sea, and from Canada and west Texas to the American coasts. Hover a line or a dot.'],
      eurasia: [[2, 36], [136, 66], 'Ukraine’s drones went for the pumping stations, not the buried pipe: Unecha, Nikolskoye, Andreapol, Kropotkinskaya, and in February 2026 Kaleykino, after which Transneft cut intake by 250,000 b/d. A Russian strike on the Brody hub in Ukraine on 27 January 2026 stopped Druzhba oil to Hungary and Slovakia until 23 April. CPC’s Black Sea moorings were hit by sea drones.'],
      gulf: [[27, 12], [62, 42], 'The bypasses of Hormuz: Saudi Arabia’s East–West line, converted to 7 mb/d in March 2026, the UAE’s line to Fujairah and Iran’s little-used line to Jask. The East–West line was hit on 9 April (attributed to Iran) and on 10–11 September by drones launched from Iraq, according to Baghdad; it restarted on 22 September. Kirkuk–Ceyhan reopened in March.'],
      americas: [[-160, 2], [-55, 70], 'The Permian’s four lines to Corpus Christi carry 2.64 mb/d and ran about 94 % full in 2025; Trans Mountain’s expansion to 890,000 b/d opened in May 2024. American outages were failures, not attacks: Keystone cracked and spilled in Kansas in 2022 and North Dakota in 2025. Colombia’s Caño Limón line is bombed several times a year.'],
      africa: [[-20, -14], [52, 24], 'Africa’s lines carry less oil and more risk: Sudan’s civil war cut the Petrodar line in 2024 and the RSF took Heglig in 2025; thieves tap Nigeria’s Trans Niger line; the heated EACOP line from Uganda to Tanga was 92.7 % built in September 2026.'],
    };
    const st = { reg: root.dataset.view || 'world', vb: [20, 40, 960, 420] };
    const boxOf = ([a, b]) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let lon = a[0]; lon <= b[0]; lon += (b[0] - a[0]) / 12) for (let lat = a[1]; lat <= b[1]; lat += (b[1] - a[1]) / 12) { const [x, y] = P([lon, lat]); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      let w = x1 - x0, hh = y1 - y0; const asp = 960 / 420; if (w / hh < asp) { const nw = hh * asp; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / asp; y0 -= (nh - hh) / 2; hh = nh; } return [x0, y0, w, hh]; };
    const COLS = { op: C.crude, idle: C.grey, build: C.brent, dead: C.grey };
    const lines = S('g', {}), flow = S('g', {}), dots = S('g', {}), labs = S('g', {});
    svg.append(lines, flow, dots, labs);
    const hitNames = new Set(cu.pipeEvents.filter((e) => /attack|sabotage|war|explosion/.test(e.type) && e.d >= '2022').map((e) => e.pipe));
    const items = cu.pipes.map((p) => {
      const xy = p.pts.map(P), d = smoothD(xy), w = p.kbd ? 0.9 + Math.sqrt(p.kbd / 100) * 0.75 : 1.1;
      const col = p.kind === 'products' ? C.teal : COLS[p.c];
      const tip = (ev) => showTip(ev, `<b>${p.n}</b>${p.km ? ' · ' + p.km.toLocaleString('en-GB') + ' km' : ''}${p.kbd ? ' · ' + p.kbd.toLocaleString('en-GB') + ' kb/d' + (p.n.startsWith('Trans-Alaska') ? ' (2025 flow)' : '') : ''}<br>${p.st}${p.kind === 'products' ? '<br>refined products' : ''}`);
      const base = S('path', { d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-opacity': p.c === 'op' ? 0.55 : 0.6, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke', 'stroke-dasharray': p.c === 'dead' || p.c === 'build' ? '4 3' : null });
      const hit = S('path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': Math.max(10, w + 6), 'vector-effect': 'non-scaling-stroke', style: 'pointer-events:stroke', onpointermove: tip, onpointerleave: hideTip });
      lines.append(base, hit);
      if (p.c === 'op') flow.append(S('path', { d, class: 'os-pflow', 'vector-effect': 'non-scaling-stroke', stroke: p.kind === 'products' ? C.teal : '#7a3a1e', 'stroke-width': Math.max(0.8, w * 0.35) }));
      const mid = xy[Math.floor(xy.length / 2)];
      return { p, mid, w };
    });
    const TC = { attack: C.red, 'attack (tanker at terminal)': C.red, 'war damage': C.red, 'sabotage/theft': C.gold, explosion: C.gold, accident: C.line, political: C.violet, cyber: C.violet };
    const evDots = cu.pipeEvents.filter((e) => e.lon != null).map((e) => {
      const [x, y] = P([e.lon, e.lat]), c = TC[e.type] || TC[e.type.split(' ')[0]] || C.red;
      const g = S('circle', { cx: x, cy: y, r: 3, fill: c, 'fill-opacity': 0.85, stroke: '#fff', 'stroke-width': 0.8, 'vector-effect': 'non-scaling-stroke', tabindex: 0,
        onpointermove: (ev) => showTip(ev, `<b>${fdate(ts(e.d))}</b> · ${e.pipe}<br>${e.t}`), onpointerleave: hideTip });
      dots.append(g); return { g, e };
    });
    const read = h('div', { class: 'os-read' });
    function labels(z) {
      labs.replaceChildren();
      const big = st.reg === 'world' ? 1200 : 300;
      const seen = [];
      for (const it of items) {
        if (!it.p.kbd || it.p.kbd < big || it.p.c === 'dead') continue;
        const [x, y] = it.mid; if (seen.some(([a, b]) => Math.hypot(a - x, b - y) < 40 / z)) continue; seen.push([x, y]);
        labs.append(S('text', { x: x + 4 / z, y: y - 4 / z, class: 'os-place sm', style: `font-size:${(st.reg === 'world' ? 10 : 11) / z}px;stroke-width:${3 / z}px` }, it.p.n.replace(' Pipeline System', '').replace(' Pipeline', '')));
      }
    }
    let anim = null;
    function go(reg) {
      st.reg = reg; const to = reg === 'world' ? [20, 40, 960, 420] : boxOf(REG[reg]), from = st.vb.slice(), t0 = performance.now();
      read.innerHTML = REG[reg][2];
      const z = 960 / to[2];
      evDots.forEach(({ g }) => g.setAttribute('r', 3.2 / z * (reg === 'world' ? 1 : 1.3)));
      labels(z);
      cancelAnimationFrame(anim);
      const step = (now) => { const k = REDUCED ? 1 : ease(clamp((now - t0) / 700, 0, 1)); st.vb = from.map((v, i) => v + (to[i] - v) * k); svg.setAttribute('viewBox', st.vb.join(' ')); if (k < 1) anim = requestAnimationFrame(step); };
      anim = requestAnimationFrame(step);
    }
    ctrl.append(seg([['world', 'World'], ['eurasia', 'Russia and Europe'], ['gulf', 'Middle East'], ['americas', 'North America'], ['africa', 'Africa']], st.reg, go));
    legend.append(chip('crude line, width ∝ capacity', C.crude), chip('refined products', C.teal), chip('under construction / proposed', C.brent), chip('idle or defunct', C.grey), chip('attack', C.red), chip('theft, sabotage, explosion', C.gold), chip('failure', C.line), chip('politics, cyber', C.violet));
    stage.append(svg, read);
    go(st.reg);
  };

  // ---- who pumps and who burns: the world map with bubbles
  FIG.producers = function (root) {
    const m = GEO.world, cu = DATA.curated;
    const { stage, ctrl, legend } = sheet(root, { eyebrow: 'Thousand barrels a day, 2025', short: 'Who pumps, who burns', source: 'Energy Institute Statistical Review 2026', date: '2025' });
    const st = { v: root.dataset.view || 'production' };
    const { svg, P } = baseMap(m, { vb: [20, 40, 960, 420], aria: 'World map of oil production and consumption' });
    const g = S('g', {}); svg.append(g);
    const read = h('div', { class: 'os-read' });
    stage.append(svg, read);
    const R = (v) => Math.sqrt(v / 1000) * 9;
    function draw() {
      g.replaceChildren();
      const key = st.v === 'production' ? 2 : 3, col = st.v === 'production' ? C.crude : C.diesel;
      const rows = cu.countries.filter((c) => c[key] != null).sort((a, b) => b[key] - a[key]);
      rows.forEach((c, i) => {
        const [x, y] = P([c[4], c[5]]), r = R(c[key]);
        const circ = S('circle', { cx: x, cy: y, r: REDUCED ? r : 0, fill: col, 'fill-opacity': 0.28, stroke: col, 'stroke-width': 1.2, class: 'os-bub',
          onpointermove: (ev) => showTip(ev, `<b>${c[1]}</b><br>production ${c[2] != null ? f0(c[2]) + ' kb/d' : 'small'}<br>consumption ${c[3] != null ? f0(c[3]) + ' kb/d' : 'not in the top list'}`), onpointerleave: hideTip });
        g.append(circ);
        if (!REDUCED) setTimeout(() => { circ.style.transition = 'r 700ms cubic-bezier(.3,.6,.2,1)'; circ.setAttribute('r', r); }, 30 + i * 35);
        if (i < 10 && !['IRN', 'IRQ', 'ARE', 'KWT', 'QAT'].includes(c[0])) g.append(S('text', { x, y: y + 4, 'text-anchor': 'middle', class: 'os-num' }, (c[key] / 1000).toFixed(1)));
      });
      const tot = st.v === 'production' ? cu.world.production : cu.world.consumption;
      read.innerHTML = st.v === 'production'
        ? `<b>World ${f0(tot)} kb/d</b> of crude, condensate and NGLs · the United States alone ${f0(cu.countries[0][2])}, almost Saudi Arabia and Russia together · bubble area ∝ volume, labels in million b/d`
        : `<b>World ${f0(tot)} kb/d</b> of liquids · the US burns 20.6 m b/d, China 17.4, the EU 11.1 (not drawn as one bubble), India 5.8`;
    }
    ctrl.append(seg([['production', 'Who pumps'], ['consumption', 'Who burns']], st.v, (v) => { st.v = v; draw(); }));
    legend.append(chip('production, crude + condensate + NGLs', C.crude), chip('consumption, total liquids', C.diesel));
    whenSeen(svg, draw, '-40px 0px');
  };

  // ---- demand: what the barrels become, and how much each person burns
  FIG.demand = function (root) {
    const cu = DATA.curated;
    const { stage, ctrl } = sheet(root, { eyebrow: 'World oil demand', short: 'Demand', source: 'IEA OMR Feb 2026 · EIA international statistics', date: '2025' });
    const st = { v: root.dataset.view || 'product' };
    ctrl.append(seg([['product', 'By product, 2025'], ['percap', 'Barrels per person a year']], st.v, (v) => { st.v = v; draw(); }));
    function draw() {
      if (st.v === 'product') {
        const tot = cu.products.reduce((a, b) => a + b[1], 0);
        stage.replaceChildren(barRows(cu.products.map(([n, v, c]) => ({ label: n, value: v / 1000, color: c, note: `${(v / 1000).toFixed(1)} million b/d, ${(100 * v / tot).toFixed(1)} % of ${(tot / 1000).toFixed(1)}` })), { max: 30, fmt: (v) => v.toFixed(1) + ' mb/d', tickFmt: (t) => t + ' mb/d', aria: 'World demand by product' }));
      } else {
        stage.replaceChildren(barRows(cu.percap.map(([n, v]) => ({ label: n, value: v, color: n === 'World' ? C.line : C.crude, hi: n === 'World', note: `${v} barrels per person per year (2024)` })), { max: 40, fmt: (v) => v.toFixed(1) + ' bbl', tickFmt: (t) => t, rowH: 24, aria: 'Barrels per person per year' }));
      }
    }
    draw();
  };

  // ---- cost of a barrel: breakevens against the price
  FIG.cost = function (root) {
    const cu = DATA.curated;
    const { stage, ctrl } = sheet(root, { eyebrow: 'Breakeven prices, $ per barrel', short: 'What a barrel costs', source: 'Rystad 2024 · Dallas Fed 2026 · IMF 2025', date: '2024–2026' });
    const st = { v: root.dataset.view || 'supply', price: 69 };
    const read = h('div', { class: 'os-read' });
    const sl = slider('Oil price', 20, 170, 1, st.price, (v) => { st.price = v; mark(); }, (v) => '$' + v);
    ctrl.append(seg([['supply', 'New supply'], ['fiscal', 'State budgets']], st.v, (v) => { st.v = v; draw(); }), sl.el,
      h('button', { type: 'button', class: 'os-btn', onclick: () => { sl.set(69); st.price = 69; mark(); } }, 'Feb 2026'), h('button', { type: 'button', class: 'os-btn', onclick: () => { sl.set(125); st.price = 125; mark(); } }, 'Oct 2026'));
    let svgEl = null, rowsNow = [], max = 100;
    function draw() {
      rowsNow = st.v === 'supply' ? cu.costs.map((c) => ({ label: c.n, value: c.be, color: /Dallas/.test(c.n) ? C.gold : C.crude, note: c.ref === 'dallasfed' ? 'Average WTI price US operators say they need to drill a new well profitably, survey of March 2026' : 'Average full-cycle breakeven of new projects, Rystad Energy, September 2024' }))
        : cu.fiscal.map(([n, v]) => ({ label: n, value: v, color: C.violet, note: `Oil price at which the 2026 budget balances (IMF, May 2025), at pre-war export volumes` }));
      max = st.v === 'supply' ? 100 : 180;
      svgEl = barRows(rowsNow, { max, fmt: (v) => '$' + v, tickFmt: (t) => '$' + t, aria: 'Breakeven prices' });
      stage.replaceChildren(svgEl, read);
      mark();
    }
    function mark() {
      if (!svgEl) return;
      svgEl.querySelectorAll('.os-pricel').forEach((e) => e.remove());
      const W = 760, LW = 230, x = LW + (Math.min(st.price, max) / max) * (W - LW - 90), H = +svgEl.getAttribute('viewBox').split(' ')[3];
      svgEl.append(S('line', { x1: x, x2: x, y1: 0, y2: H - 18, class: 'os-pricel', stroke: C.red, 'stroke-width': 2 }), S('text', { x: x + 4, y: 12, class: 'os-pricel os-small', fill: C.red }, '$' + st.price));
      const under = rowsNow.filter((r) => r.value <= st.price).length;
      read.innerHTML = st.v === 'supply' ? `At <b>$${st.price}</b>, ${under} of ${rowsNow.length} kinds of new supply pay for themselves.` : `At <b>$${st.price}</b>, ${under} of ${rowsNow.length} Gulf budgets balance, if the barrels can be shipped. In 2026 most of them could not.`;
    }
    draw();
  };

  // ---- three ways out of the ground: what a barrel costs, split
  FIG.upcost = function (root) {
    const U = DATA.curated.upstream;
    const { stage, ctrl, legend } = sheet(root, { eyebrow: '$ per barrel: operating cost, capital cost and the breakeven', short: 'Cost by field type', source: 'Aramco 2025 · Equinor · Petrobras · Diamondback · Rystad · Dallas Fed', date: '2024–2026' });
    const st = { price: 69 };
    const W = 760, LW = 190, RW = 40, rh = 62, H = U.length * rh + 34, MAX = 130;
    const X = (v) => LW + (v / MAX) * (W - LW - RW);
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'Cost of a barrel by type of oil field' });
    for (const t of [0, 20, 40, 60, 80, 100, 120]) svg.append(S('line', { x1: X(t), x2: X(t), y1: 4, y2: H - 20, class: 'os-gridv' }), S('text', { x: X(t), y: H - 6, 'text-anchor': 'middle', class: 'os-ax' }, '$' + t));
    const grow = [];
    U.forEach((u, i) => {
      const y = 8 + i * rh;
      svg.append(S('text', { x: LW - 12, y: y + 16, 'text-anchor': 'end', class: 'os-rowl hi' }, u.n), S('text', { x: LW - 12, y: y + 31, 'text-anchor': 'end', class: 'os-small' }, u.eg));
      const tip = (ev) => showTip(ev, `<b>${u.n} (${u.eg})</b><br>operating cost $${u.opex.toFixed(2)} · capital cost about $${u.capex} a barrel<br>breakeven $${u.be}: ${u.be_l}<br>state's share: ${u.take}<br>first oil after ${u.first}`);
      const a = S('rect', { x: X(0), y: y + 6, width: 0, height: 16, fill: u.c, onpointermove: tip, onpointerleave: hideTip });
      const b = S('rect', { x: X(u.opex), y: y + 6, width: 0, height: 16, fill: u.c, 'fill-opacity': 0.45, onpointermove: tip, onpointerleave: hideTip });
      const rest = S('rect', { x: X(u.opex + u.capex), y: y + 10, width: 0, height: 8, fill: 'url(#os-hatch)', stroke: u.c, 'stroke-opacity': 0.5, 'stroke-width': 0.8 });
      const be = S('g', { opacity: 0 }, S('path', { d: `M${X(u.be)},${y + 2}v24`, stroke: C.line, 'stroke-width': 2 }),
        S('text', { x: X(u.be) + 5, y: y + 40, class: 'os-small' }, `breakeven $${u.be.toFixed(0)}`));
      const lab = S('text', { x: X(u.opex + u.capex) + 4, y: y + 0, class: 'os-small', opacity: 0 }, `$${(u.opex + u.capex).toFixed(1)} to lift and build`);
      svg.append(a, b, rest, be, lab);
      grow.push(() => { a.setAttribute('width', X(u.opex) - X(0)); b.setAttribute('width', X(u.opex + u.capex) - X(u.opex)); rest.setAttribute('width', Math.max(0, X(u.be) - X(u.opex + u.capex))); be.setAttribute('opacity', 1); lab.setAttribute('opacity', 1); });
    });
    svg.prepend(S('defs', {}, S('pattern', { id: 'os-hatch', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, S('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: 'rgba(4,32,75,0.3)', 'stroke-width': 1.2 }))));
    const pl = S('g', {}); svg.append(pl);
    const read = h('div', { class: 'os-read' });
    function mark() {
      pl.replaceChildren(S('line', { x1: X(st.price), x2: X(st.price), y1: 0, y2: H - 20, stroke: C.red, 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }), S('text', { x: X(st.price) + 4, y: H - 24, class: 'os-small', style: `fill:${C.red}` }, `oil at $${st.price}`));
      const m = U.map((u) => { const d = st.price - u.be; return `${u.sh} ${d >= 0 ? '+' : '−'}$${Math.abs(d).toFixed(Math.abs(d) < 10 ? 1 : 0)}`; });
      read.innerHTML = `At <b>$${st.price}</b> a barrel, the price less the breakeven: ${m.join(' · ')}. The hatched gap between building cost and breakeven is royalties, taxes, transport and the return on capital.`;
    }
    ctrl.append(seg([['69', 'Feb 2026: $69'], ['125', 'Oct 2026: $125']], '69', (v) => { st.price = +v; mark(); }));
    stage.append(svg, read);
    legend.append(chip('operating (lifting) cost', C.line), chip('capital cost per barrel', 'rgba(4,32,75,0.4)'), chip('royalty, tax, transport, return', 'rgba(4,32,75,0.15)'));
    mark();
    whenSeen(svg, () => grow.forEach((f, i) => setTimeout(f, REDUCED ? 0 : i * 120)), '-40px 0px');
    if (!REDUCED) svg.querySelectorAll('rect').forEach((r) => { r.style.transition = 'width 900ms cubic-bezier(.3,.6,.2,1)'; });
  };

  // ---- wells: one shale well's decline, how many wells make 100 kb/d, whole fields over decades
  FIG.wells = function (root) {
    const cu = DATA.curated, U = cu.upstream, A = cu.shaleArps;
    const { stage, ctrl } = sheet(root, { eyebrow: 'Barrels a day', short: 'Wells and fields', source: 'API/Rystad · OGJ Arps fits · Sodir · Aramco · Wikipedia', date: '1951–2026' });
    const st = { v: root.dataset.view || 'well' };
    const W = 760, H = 330, M = { l: 62, r: 24, t: 24, b: 34 };
    const read = h('div', { class: 'os-read' });
    const box = h('div', {});
    stage.append(box, read);
    const q = (t) => A.qi / Math.pow(1 + A.b * A.Di * t, 1 / A.b);
    function well() {
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'Decline of one Permian shale well' });
      const X = (t) => M.l + (t / 10) * (W - M.l - M.r), Y = (v) => H - M.b - (v / 800) * (H - M.t - M.b);
      for (const v of [0, 200, 400, 600, 800]) svg.append(S('line', { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v), class: 'os-gridh' }), S('text', { x: M.l - 8, y: Y(v) + 3.5, 'text-anchor': 'end', class: 'os-ax' }, v));
      for (let t = 0; t <= 10; t += 1) svg.append(S('text', { x: X(t), y: H - 12, 'text-anchor': 'middle', class: 'os-ax' }, t === 0 ? 'start' : 'yr ' + t));
      const pts = []; for (let t = 0; t <= 10; t += 0.02) pts.push([X(t), Y(q(t))]);
      const pts2 = pts.filter(([x]) => x <= X(2) + 0.1);
      svg.append(S('path', { d: dOf(pts2) + `L${X(2)},${Y(0)}L${X(0)},${Y(0)}Z`, fill: C.diesel, 'fill-opacity': 0.18 }),
        S('path', { d: dOf(pts) + `L${X(10)},${Y(0)}L${X(2)},${Y(0)}Z`, fill: C.diesel, 'fill-opacity': 0.07 }));
      const line = S('path', { d: dOf(pts), fill: 'none', stroke: C.diesel, 'stroke-width': 2.6 });
      svg.append(line);
      for (const [t, lab] of [[0, '730 b/d on day one'], [1, '200 b/d after a year'], [5, '70 b/d after five']]) svg.append(S('circle', { cx: X(t), cy: Y(q(t)), r: 4, fill: C.paper, stroke: C.diesel, 'stroke-width': 2 }), S('text', { x: X(t) + 9, y: Y(q(t)) - 8, class: 'os-lab' }, lab));
      svg.append(S('text', { x: X(0.9), y: Y(40), class: 'os-small' }, 'first two years: 181,000 bbl'), S('text', { x: X(4.2), y: Y(25), class: 'os-small' }, 'next eight years: 201,000 bbl'));
      return svg;
    }
    function count() {
      const rows = U.map((u) => ({ u, n: Math.ceil(100000 / u.well) }));
      const svg = S('svg', { viewBox: `0 0 ${W} ${rows.length * 64 + 20}`, class: 'os-svg', role: 'img', 'aria-label': 'Wells needed for 100,000 barrels a day' });
      rows.forEach(({ u, n }, i) => {
        const y = 10 + i * 64;
        svg.append(S('text', { x: 180, y: y + 16, 'text-anchor': 'end', class: 'os-rowl hi' }, u.n), S('text', { x: 180, y: y + 31, 'text-anchor': 'end', class: 'os-small' }, `${u.well.toLocaleString('en-GB')} b/d a well`));
        const per = Math.min(n, 140), cols = 35;
        for (let k = 0; k < per; k++) svg.append(S('rect', { x: 196 + (k % cols) * 15, y: y + 2 + Math.floor(k / cols) * 13, width: 10, height: 10, rx: 2, fill: u.c, 'fill-opacity': 0.8 }));
        const wrap = per > cols, rows = Math.ceil(per / cols);
        svg.append(S('text', { x: wrap ? 196 + (per % cols || cols) * 15 + 6 : 196 + per * 15 + 6, y: y + 12 + (rows - 1) * 13, class: 'os-lab' }, `${n} well${n > 1 ? 's' : ''}`));
      });
      return svg;
    }
    function fields() {
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'Output of four oil fields over time' });
      const X = (y) => M.l + ((y - 1950) / 77) * (W - M.l - M.r), lg = (v) => Math.log10(Math.max(v, 8));
      const Y = (v) => H - M.b - ((lg(v) - 1) / 3) * (H - M.t - M.b);
      for (const v of [10, 100, 1000, 10000]) svg.append(S('line', { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v), class: 'os-gridh' }), S('text', { x: M.l - 8, y: Y(v) + 3.5, 'text-anchor': 'end', class: 'os-ax' }, v >= 1000 ? v / 1000 + ' mb/d' : v + ' kb/d'));
      for (let y = 1950; y <= 2020; y += 10) svg.append(S('text', { x: X(y), y: H - 12, 'text-anchor': 'middle', class: 'os-ax' }, y));
      const F = [['ghawar', 'Ghawar', '#b4552f'], ['forties', 'Forties', '#8a93a6'], ['brent', 'Brent field', '#04204b'], ['sverdrup', 'Johan Sverdrup', '#0b4fc0']];
      for (const [k, n, c] of F) {
        const p = cu.fieldHist[k].filter(([, v]) => v > 0), all = cu.fieldHist[k].map(([y, v]) => [y, Math.max(v, 10)]);  // zero (first oil, shut-in) drawn at the axis floor
        svg.append(S('path', { d: dOf(all.map(([y, v]) => [X(y), Y(v)])), fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-dasharray': k === 'sverdrup' ? null : '5 3' }));
        p.forEach(([y, v]) => svg.append(S('circle', { cx: X(y), cy: Y(v), r: 3, fill: c }, S('title', {}, `${n} ${y}: ${v} kb/d`))));
        const [ly, lv] = k === 'ghawar' ? p[1] : k === 'forties' ? p[1] : k === 'brent' ? p[0] : p[p.length - 1];
        svg.append(S('text', { x: X(ly) + (k === 'sverdrup' ? -8 : 6), y: Y(lv) - 8, 'text-anchor': k === 'sverdrup' ? 'end' : 'start', class: 'os-lab', style: `fill:${c}` }, n));
      }
      return svg;
    }
    const views = {
      well: [well, 'One Permian well, modelled through the published 730 → 200 b/d first year (Arps, b = 1.4; illustrative): <b>47 %</b> of its first ten years of oil comes in the first two. A shale field must drill all the time just to stand still.'],
      count: [count, 'Wells needed for <b>100,000 barrels a day</b> at the rates of one good well of each kind: a Sverdrup producer flows like 66 new Permian wells, and a Permian well loses most of that within a year.'],
      fields: [fields, 'Whole fields, log scale. Ghawar has produced since 1951 and still makes about 3.8 mb/d; Forties and Brent peaked within five years of first oil and faded; Johan Sverdrup came off its plateau in 2025. Points are sourced years, lines join them.'],
    };
    function draw() { box.replaceChildren(views[st.v][0]()); read.innerHTML = views[st.v][1]; }
    ctrl.append(seg([['well', 'One shale well'], ['count', 'Wells for 100 kb/d'], ['fields', 'Whole fields']], st.v, (v) => { st.v = v; draw(); }));
    draw();
  };


  // ---- spare capacity before the war, and what was shut in
  FIG.spare = function (root) {
    const cu = DATA.curated;
    const { stage, ctrl } = sheet(root, { eyebrow: 'OPEC+ effective spare capacity, February 2026, mb/d', short: 'Spare capacity', source: 'IEA OMR Mar 2026 · EIA STEO Oct 2026', date: 'Feb–Sep 2026' });
    const st = { v: root.dataset.view || 'spare' };
    ctrl.append(seg([['spare', 'Spare capacity, Feb 2026'], ['shut', 'Shut in by the war']], st.v, (v) => { st.v = v; draw(); }));
    function draw() {
      if (st.v === 'spare') stage.replaceChildren(barRows(cu.spare.map(([n, v, hz]) => ({ label: n + (hz ? ' ⚓' : ''), value: v, color: hz ? C.red : C.crude, note: hz ? 'exports pass the Strait of Hormuz' : 'outside the Gulf' })), { max: 2, fmt: (v) => v.toFixed(1) + ' mb/d', tickFmt: (t) => t, aria: 'Spare capacity' }), h('div', { class: 'os-read', html: '<b>3.9 mb/d</b> of spare capacity, <b>3.0</b> of it in four Gulf states whose exports pass Hormuz (red). The cushion sat behind the chokepoint.' }));
      else {
        const rows = cu.shutins.rows.map(([n, feb, avg, aug, sep]) => ({ label: n, value: avg / 1000, color: C.red, note: `February output ${f0(feb)} kb/d · shut in on average Mar–Jul ${f0(avg)} kb/d · August ${f0(aug)} · September ${f0(sep)}` }));
        stage.replaceChildren(barRows(rows, { max: 3, fmt: (v) => v.toFixed(2) + ' mb/d', tickFmt: (t) => t, aria: 'Crude shut in by country' }), h('div', { class: 'os-read', html: 'Average crude <b>shut in</b>, March to July 2026: <b>8.5 mb/d</b> in total; peak 10.9 mb/d in May; 4.8 mb/d in September.' }));
      }
    }
    draw();
  };

  // ---- the North Sea: the Brent basket, and the American barrel that sets it
  FIG.northsea = function (root) {
    const m = GEO.northsea, cu = DATA.curated;
    const { stage } = sheet(root, { eyebrow: 'The Dated Brent basket, loadings in thousand barrels a day', short: 'What Brent is', source: 'Platts methodology · Reuters loading programmes · S&P', date: 'Sep 2026' });
    const { svg, P } = baseMap(m, { vb: [60, 110, 900, 1060], aria: 'Map of the North Sea fields in the Brent basket', grat: true });
    svg.classList.add('os-zoom');
    const g = S('g', {}); svg.append(g);
    const R = (k) => 6 + Math.sqrt(k) * 2.2;
    for (const f of cu.northsea) {
      const [x, y] = P([f.lon, f.lat]), [tx, ty] = P([f.tlon, f.tlat]);
      g.append(S('path', { d: `M${x},${y}L${tx},${ty}`, class: 'os-pipe on', style: 'stroke-width:2.2' }));
      g.append(S('rect', { x: tx - 4, y: ty - 4, width: 8, height: 8, class: 'os-term' }), S('text', { x: tx + (tx > x ? 8 : -8), y: ty + 4, 'text-anchor': tx > x ? 'start' : 'end', class: 'os-place sm' }, f.term));
      g.append(S('g', { tabindex: 0, onpointermove: (ev) => showTip(ev, `<b>${f.n}</b><br>about ${f.kbd} kb/d loading (Sep 2026 programme${f.n === 'Brent' ? '; Brent field 2026 average' : ''})`), onpointerleave: hideTip },
        S('circle', { cx: x, cy: y, r: R(f.kbd), fill: C.brent, 'fill-opacity': 0.25, stroke: C.brent, 'stroke-width': 1.5 })));
      // label side per field: the northern fields sit close together, so Brent and Oseberg go left, Troll on top
      const side = { Brent: 'l', Oseberg: 'l', Troll: 't' }[f.n] || 'r', r = R(f.kbd);
      const lx = side === 'l' ? x - r - 6 : side === 't' ? x : x + r + 6, an = side === 'l' ? 'end' : side === 't' ? 'middle' : 'start', ly = side === 't' ? y - r - 22 : y;
      g.append(S('text', { x: lx, y: ly - 2, 'text-anchor': an, class: 'os-place' }, f.n, S('tspan', { x: lx, dy: '1.3em', class: 'os-num' }, f.kbd + ' kb/d')));
    }
    // the Midland barrel arriving at Rotterdam
    const [rx, ry] = P([4.14, 51.94]);
    const a0 = P([-6.6, 50.2]), a1 = P([-2, 50.0]), a2 = P([1.6, 51.1]);
    const arc = S('path', { d: `M${a0[0]},${a0[1]}C${a1[0]},${a1[1]} ${a2[0]},${a2[1]} ${rx},${ry}`, class: 'os-route', stroke: C.wti, 'stroke-width': 9, 'stroke-opacity': 0.35 });
    g.append(arc, S('rect', { x: rx - 5, y: ry - 5, width: 10, height: 10, class: 'os-term' }), S('text', { x: rx + 9, y: ry + 5, class: 'os-place' }, 'Rotterdam'),
      S('text', { x: a0[0] + 4, y: a0[1] - 30, class: 'os-place', fill: C.wti }, 'WTI Midland from Texas'), S('text', { x: a0[0] + 4, y: a0[1] - 14, class: 'os-num' }, `${cu.midlandNL} kb/d of US crude into the Netherlands`));
    const ship = S('g', {}, S('rect', { x: -7, y: -2.6, width: 14, height: 5.2, rx: 2.6, fill: '#ffffff', stroke: C.wti }));
    g.append(ship);
    stage.append(svg, h('div', { class: 'os-read', html: 'Five North Sea grades load about <b>470 kb/d</b>; the Brent field itself about 23 kb/d. One Texan grade landed in Rotterdam can set the price of all of them.' }));
    let L = 0, u = 0;
    looper(svg, (dt) => { if (!L) L = arc.getTotalLength(); u = (u + dt / 7) % 1; const p = arc.getPointAtLength(u * L), q = arc.getPointAtLength(Math.min(L, u * L + 2)); ship.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI})`); });
  };

  // ---- the futures curve: contango and backwardation from the cost of carry
  FIG.curve = function (root) {
    const cu = DATA.curated;
    const { stage, ctrl } = sheet(root, { eyebrow: 'Futures price by delivery month, $ per barrel', short: 'The curve', source: 'cost-of-carry model · market points from the text', date: 'Oct 2026' });
    const presets = { oct2026: { S: 106, r: 4, u: 4, y: 30 }, apr2020: { S: 18, r: 1, u: 120, y: 0 }, calm: { S: 70, r: 4, u: 6, y: 8 } };
    const st = { ...presets.oct2026, preset: 'oct2026' }, tg = { ...presets.oct2026 };
    const W = 760, H = 360, M = { l: 54, r: 150, t: 58, b: 34 };
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'Futures curve from the cost of carry' });
    const X = (mo) => M.l + (mo / 12) * (W - M.l - M.r);
    let lo = 0, hi = 160;
    const Y = (v) => H - M.b - ((v - lo) / (hi - lo)) * (H - M.t - M.b);
    const grid = S('g', {}), area = S('path', { 'fill-opacity': 0.1 }), stems = S('g', {}), spotLine = S('line', { class: 'os-cvspot' }), line = S('path', { fill: 'none', 'stroke-width': 2.6, 'stroke-linejoin': 'round' });
    const mk = S('g', {}), brk = S('g', {}), labs = S('g', {}), bal = S('g', {});
    for (let mo = 0; mo <= 12; mo += 2) svg.append(S('text', { x: X(mo), y: H - 12, 'text-anchor': 'middle', class: 'os-ax' }, mo === 0 ? 'spot' : '+' + mo + ' mo'));
    svg.append(grid, area, spotLine, stems, line, mk, brk, labs, bal);
    const read = h('div', { class: 'os-read' });
    const sS = slider('Spot', 10, 150, 1, st.S, (v) => { st.S = tg.S = v; draw(); }, (v) => '$' + v);
    const sR = slider('Interest r', 0, 10, 0.5, st.r, (v) => { st.r = tg.r = v; draw(); }, (v) => v + ' %/yr');
    const sU = slider('Storage u', 0, 120, 1, st.u, (v) => { st.u = tg.u = v; draw(); }, (v) => v + ' %/yr');
    const sY = slider('Convenience y', 0, 60, 1, st.y, (v) => { st.y = tg.y = v; draw(); }, (v) => v + ' %/yr');
    ctrl.append(seg([['oct2026', 'Oct 2026: scarcity'], ['calm', 'A calm market'], ['apr2020', 'Apr 2020: full tanks']], st.preset, (v) => {
      st.preset = v; Object.assign(tg, presets[v]); sS.set(tg.S); sR.set(tg.r); sU.set(tg.u); sY.set(tg.y); if (REDUCED) { Object.assign(st, tg); draw(); } else L.kick();
    }));
    const ctrl2 = h('div', { class: 'os-ctrl' }, sS.el, sR.el, sU.el, sY.el);
    stage.append(svg, ctrl2, read);
    const F = (mo) => st.S * Math.exp(((st.r + st.u - st.y) / 100) * (mo / 12));
    function draw() {
      const carry = st.r + st.u - st.y, f12 = F(12), up = carry >= 0, col = up ? C.diesel : C.red;
      const ref = st.preset === 'oct2026' ? cu.curves.oct2026 : st.preset === 'apr2020' ? cu.curves.apr2020 : null;
      // the axis follows the curve, so a gentle slope is not flattened against a fixed $0-160 scale
      const vals = [st.S, f12, ...(ref ? ref.pts.map((p) => p[1]) : [])];
      const pad = Math.max(4, (Math.max(...vals) - Math.min(...vals)) * 0.25);
      const t0 = niceTicks(Math.max(0, Math.min(...vals) - pad), Math.max(...vals) + pad, 4), step = t0[1] - t0[0];
      lo = Math.max(0, Math.floor((Math.min(...vals) - pad / 2) / step) * step); hi = Math.ceil((Math.max(...vals) + pad / 2) / step) * step;
      const tk = []; for (let v = lo; v <= hi + 1e-9; v += step) tk.push(+v.toFixed(6));
      grid.replaceChildren(...tk.flatMap((t) => [S('line', { x1: M.l, x2: X(12), y1: Y(t), y2: Y(t), class: 'os-gridh' }), S('text', { x: M.l - 7, y: Y(t) + 3.5, 'text-anchor': 'end', class: 'os-ax' }, '$' + t)]));
      const pts = []; for (let mo = 0; mo <= 12; mo += 0.25) pts.push([X(mo), Y(F(mo))]);
      line.setAttribute('d', dOf(pts)); line.setAttribute('stroke', col);
      area.setAttribute('d', dOf(pts) + `L${X(12)},${Y(st.S)}L${X(0)},${Y(st.S)}Z`); area.setAttribute('fill', col);
      spotLine.setAttribute('x1', X(0)); spotLine.setAttribute('x2', X(12)); spotLine.setAttribute('y1', Y(st.S)); spotLine.setAttribute('y2', Y(st.S));
      // one stem per monthly contract: how far each delivery month sits from spot
      stems.replaceChildren();
      for (let mo = 1; mo <= 12; mo++) {
        const v = F(mo);
        stems.append(S('line', { x1: X(mo), x2: X(mo), y1: Y(st.S), y2: Y(v), stroke: col, 'stroke-opacity': 0.45, 'stroke-width': 1.4 }),
          S('circle', { cx: X(mo), cy: Y(v), r: 3.2, fill: C.paper, stroke: col, 'stroke-width': 1.6 }, S('title', {}, `+${mo} months: $${v.toFixed(1)}`)));
      }
      stems.append(S('circle', { cx: X(0), cy: Y(st.S), r: 5.5, fill: C.crude }));
      mk.replaceChildren();
      if (ref) for (const [mo, v] of ref.pts) mk.append(S('circle', { cx: X(mo), cy: Y(v), r: 7, fill: 'none', stroke: C.line, 'stroke-width': 1.4, 'stroke-dasharray': '2 2' }, S('title', {}, ref.label + ': $' + v)));
      // bracket: the 12-month spread
      const bx = X(12) + 14, d = f12 - st.S;
      brk.replaceChildren(S('path', { d: `M${bx - 5},${Y(st.S)}h5V${Y(f12)}h-5`, fill: 'none', stroke: col, 'stroke-width': 1.3 }),
        S('text', { x: bx + 8, y: (Y(st.S) + Y(f12)) / 2 - 4, class: 'os-lab', fill: col, style: `fill:${col}` }, (d >= 0 ? '+$' : '−$') + Math.abs(d).toFixed(1)),
        S('text', { x: bx + 8, y: (Y(st.S) + Y(f12)) / 2 + 11, class: 'os-small' }, 'in 12 months,'),
        S('text', { x: bx + 8, y: (Y(st.S) + Y(f12)) / 2 + 24, class: 'os-small' }, `from spot $${st.S.toFixed(0)}`));
      labs.replaceChildren(S('text', { x: M.l, y: 18, class: 'os-cvreg', style: `fill:${col}` }, up ? 'CONTANGO' : 'BACKWARDATION'),
        S('text', { x: M.l, y: 34, class: 'os-small' }, up ? 'futures above spot: the market pays you to store' : 'futures below spot: oil now is worth more than oil later'));
      // carry balance: what pushes the curve up (interest + storage) against what pulls it down (convenience yield)
      const bx0 = W - 196, sc = 120 / Math.max(60, st.r + st.u, st.y);
      bal.replaceChildren(
        S('text', { x: bx0, y: 14, class: 'os-small' }, `interest + storage ${(st.r + st.u).toFixed(0)} %/yr`),
        S('rect', { x: bx0, y: 19, width: Math.max(1, (st.r + st.u) * sc), height: 8, rx: 2, fill: C.diesel }),
        S('text', { x: bx0, y: 42, class: 'os-small' }, `convenience yield ${st.y.toFixed(0)} %/yr`),
        S('rect', { x: bx0, y: 47, width: Math.max(1, st.y * sc), height: 8, rx: 2, fill: C.red }));
      read.innerHTML = `<span class="os-eq">F(T) = S·e<sup>(r+u−y)T</sup></span> <b>r + u − y = ${carry.toFixed(1)} % a year</b> → 12-month future <b>$${f12.toFixed(1)}</b> against spot $${st.S.toFixed(0)}` + (ref ? ` · dashed rings: ${ref.label}` : '');
    }
    const L = looper(svg, (dt) => {
      let moving = false;
      for (const k of ['S', 'r', 'u', 'y']) { const d = tg[k] - st[k]; if (Math.abs(d) > 0.01) { st[k] += d * (1 - Math.exp(-dt / 0.18)); moving = true; } else st[k] = tg[k]; }
      if (moving) draw();
    });
    draw();
  };


  // ---- the Atlantic: why Brent minus WTI is the price of the journey
  FIG.route = function (root) {
    const m = GEO.atlantic, cu = DATA.curated;
    const { stage, ctrl } = sheet(root, { eyebrow: 'From Cushing to Rotterdam, $ per barrel', short: 'Brent minus WTI', source: 'IEA · Platts · EIA spot (see text)' });
    const st = { fr: 24 };
    const { svg, P } = baseMap(m, { vb: [0, 60, 1000, 470], aria: 'Map of the route from Cushing and Midland to Rotterdam', grat: true });
    svg.classList.add('os-zoom');
    const place = (n) => cu.places.find((p) => p.n === n), at = (n) => P([place(n).lon, place(n).lat]);
    const pipe1 = S('path', { d: smoothD([at('Midland'), P([-99, 30.5]), at('Houston')]), class: 'os-pipe on' });
    const pipe2 = S('path', { d: smoothD([at('Cushing'), P([-96, 33]), at('Houston')]), class: 'os-pipe on thin' });
    const sea = lanePath(P, cu.lanes.usgc_to_rotterdam);
    const lane = S('path', { d: smoothD(sea), class: 'os-route', stroke: C.wti, 'stroke-width': 2, 'stroke-dasharray': '1 6', 'stroke-linecap': 'round' });
    svg.append(pipe1, pipe2, lane);
    for (const n of ['Cushing', 'Midland', 'Houston', 'Rotterdam']) { const [x, y] = at(n); svg.append(S('rect', { x: x - 5, y: y - 5, width: 10, height: 10, class: 'os-term' }), S('text', { x: x + (n === 'Midland' ? -9 : 9), y: y - 8, 'text-anchor': n === 'Midland' ? 'end' : 'start', class: 'os-place' }, n)); }
    const ship = S('g', {}, S('rect', { x: -8, y: -3, width: 16, height: 6, rx: 3, fill: '#ffffff', stroke: C.wti }));
    svg.append(ship);
    // cost stack
    const W = 760, H = 120;
    const stack = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'Cost stack from WTI to Brent' });
    const read = h('div', { class: 'os-read' });
    const sl = slider('Freight, US Gulf → Rotterdam', 1, 30, 0.5, st.fr, (v) => { st.fr = v; draw(); }, (v) => '$' + v.toFixed(1) + '/bbl');
    ctrl.append(sl.el, h('button', { type: 'button', class: 'os-btn', onclick: () => { st.fr = 3; sl.set(3); draw(); } }, 'Early 2026'), h('button', { type: 'button', class: 'os-btn', onclick: () => { st.fr = 24; sl.set(24); draw(); } }, 'Mid-Oct 2026'));
    stage.append(svg, stack, read);
    function draw() {
      const parts = [['Pipeline Cushing → Houston', 1.0, C.gold], ['Dock, loss, insurance', 0.7, C.grey], ['Freight', st.fr, C.wti]];
      const tot = parts.reduce((a, b) => a + b[1], 0), sx = (v) => 40 + (v / 32) * (W - 80);
      stack.replaceChildren();
      for (const t of [0, 5, 10, 15, 20, 25, 30]) stack.append(S('line', { x1: sx(t), x2: sx(t), y1: 18, y2: 76, class: 'os-gridv' }), S('text', { x: sx(t), y: 92, 'text-anchor': 'middle', class: 'os-ax' }, '$' + t));
      let acc = 0;
      for (const [n, v, c] of parts) { stack.append(S('rect', { x: sx(acc), y: 28, width: Math.max(0, sx(acc + v) - sx(acc) - 1), height: 34, fill: c, 'fill-opacity': 0.85 }, S('title', {}, `${n}: $${v.toFixed(1)}`))); if (v > 2.4) stack.append(S('text', { x: sx(acc + v / 2), y: 50, 'text-anchor': 'middle', class: 'os-segv', fill: '#04204b' }, n.split(' ')[0])); acc += v; }
      stack.append(S('line', { x1: sx(6.4), x2: sx(6.4), y1: 18, y2: 72, stroke: C.brent, 'stroke-width': 2, 'stroke-dasharray': '4 3' }), S('text', { x: sx(6.4), y: 14, 'text-anchor': 'middle', class: 'os-small', fill: C.brent }, 'Feb 2026 spot gap $6.4'));
      stack.append(S('line', { x1: sx(25), x2: sx(25), y1: 18, y2: 72, stroke: C.red, 'stroke-width': 2, 'stroke-dasharray': '4 3' }), S('text', { x: sx(25), y: 14, 'text-anchor': 'middle', class: 'os-small', fill: C.red }, 'Oct 1–20 spot gap $25.0'));
      stack.append(S('text', { x: sx(tot) + 6, y: 50, class: 'os-lab', fill: '#04204b' }, '= $' + tot.toFixed(1)));
      read.innerHTML = `WTI at Cushing <b>+ $${tot.toFixed(1)}</b> to get it to Rotterdam ≈ what a North Sea barrel must cost there, so <b>Brent − WTI ≈ $${tot.toFixed(1)}</b>. Pipeline and dock costs are round estimates.`;
    }
    draw();
    let L = 0, u = 0;
    looper(svg, (dt) => { if (!L) L = lane.getTotalLength(); u = (u + dt / 12) % 1; const p = lane.getPointAtLength(u * L), q = lane.getPointAtLength(Math.min(L, u * L + 2)); ship.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI})`); });
  };

  // ---- what a litre costs
  FIG.pump = function (root) {
    const cu = DATA.curated.pump;
    const { stage, ctrl } = sheet(root, { eyebrow: 'One unit of diesel at the pump, taken apart', short: 'At the pump', source: 'ADAC · EIA · own calculation (see text)', date: 'Oct 2026' });
    const st = { v: root.dataset.view || 'de_diesel' };
    ctrl.append(seg([['de_diesel', 'Germany, € per litre'], ['us_diesel', 'United States, $ per gallon']], st.v, (v) => { st.v = v; draw(); }));
    function draw() {
      const p = cu[st.v], W = 760, H = 150, tot = p.parts.reduce((a, b) => a + b[1], 0), sx = (v) => 20 + (v / tot) * (W - 40);
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'Price breakdown at the pump' });
      let acc = 0;
      p.parts.forEach(([n, v, c], i) => {
        const r = S('rect', { x: sx(acc), y: 40, width: Math.max(0, sx(acc + v) - sx(acc) - 2), height: 54, fill: c, 'fill-opacity': 0.88, onpointermove: (ev) => showTip(ev, `<b>${n}</b><br>${v.toFixed(3)} ${p.unit.split(' ')[0]} · ${(100 * v / tot).toFixed(0)} %`), onpointerleave: hideTip });
        svg.append(r);
        const mid = sx(acc + v / 2);
        svg.append(S('text', { x: mid, y: 72, 'text-anchor': 'middle', class: 'os-segv', fill: onFill(c) }, (100 * v / tot).toFixed(0) + '%'));
        svg.append(S('text', { x: mid, y: i % 2 ? 120 : 30, 'text-anchor': 'middle', class: 'os-small', fill: c }, n));
        acc += v;
      });
      stage.replaceChildren(svg, h('div', { class: 'os-read', html: `<b>${p.price.toFixed(3)} ${p.unit}</b> on ${p.date}. ${st.v === 'de_diesel' ? 'Taxes and levies are 38 % of the price; the refining spread (≈ 50 ct) is now about as large as the crude itself (≈ 62 ct).' : 'Taxes are about 11 % of a US gallon, so the same crack moves the US price by a larger share.'}` }));
    }
    draw();
  };

  // ------------------------------------------------------------------ boot
  const NEEDS_GEO = new Set(['pipes', 'flows', 'hormuz', 'producers', 'route', 'northsea']);
  for (const root of roots) {
    root.classList.add('oil-sheet');
    root.append(h('div', { class: 'os-wait' }, 'drawing sheet ' + (roots.indexOf(root) + 1) + ' …'));
    whenSeen(root, () => {
      const kind = root.dataset.oil;
      const go = () => { try { (FIG[kind] || (() => { root.textContent = 'unknown figure ' + kind; }))(root); } catch (e) { console.error(kind, e); root.textContent = 'figure failed: ' + kind; } };
      (NEEDS_GEO.has(kind) ? Promise.all([load(), loadGeo()]) : load()).then(go);
    }, '600px 0px');
  }
  window.addEventListener('message', (e) => { const d = e.data || {}; if (!d.oilFig || !d.h) return; document.querySelectorAll(`[data-anat="${d.oilFig}"] iframe`).forEach((f) => { f.style.height = Math.ceil(d.h) + 'px'; }); });
  window.__oilFIG = FIG;
})();
