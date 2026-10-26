// Interactive figures of the oil-market long read (/blog/2026/oil-market/), drawn as blueprint sheets in the look of the
// "Crude & Conflict" reels: navy paper, a faint grid, white line work, orange crude, green gasoline, blue diesel, red margin,
// and an engineering title block under every figure. Data: assets/oil-article/oil.json (EIA spot prices and weekly
// stocks, made by bin/oil_article/build.py, plus the curated facts of curated.py) and geo.json (Natural Earth, geo.py).
// Every figure is a <figure data-oil="kind"> filled when it scrolls into view; animations pause off screen and stay
// still under prefers-reduced-motion. Vanilla SVG, nothing is loaded from outside this site.
(function () {
  'use strict';
  const roots = [...document.querySelectorAll('[data-oil]')];
  if (!roots.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    paper: '#0b1424', grid: 'rgba(130,165,220,0.08)', line: '#dfe6f1', muted: '#8c9bb5', faint: 'rgba(223,230,241,0.18)',
    crude: '#e8913a', wti: '#e8913a', brent: '#8fb0f5', gas: '#a6c94a', diesel: '#4fa8e0', jet: '#e9edf4', resid: '#9b8670',
    red: '#e5533d', gold: '#f2c14e', teal: '#43c0a8', violet: '#b190f0', grey: '#5d6b85',
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

  // ------------------------------------------------------------------ the sheet: header, stage, controls, title block
  function sheet(root, o) {
    const i = roots.indexOf(root) + 1;
    root.classList.add('oil-sheet');
    const head = h('div', { class: 'os-head' },
      o.eyebrow ? h('div', { class: 'os-eyebrow' }, o.eyebrow) : null,
      h('div', { class: 'os-title', html: root.dataset.title || o.title || '' }),
      o.sub ? h('div', { class: 'os-sub' }, o.sub) : null);
    const stage = h('div', { class: 'os-stage' + (o.stageClass ? ' ' + o.stageClass : '') });
    const ctrl = h('div', { class: 'os-ctrl' });
    const legend = h('div', { class: 'os-legend' });
    const no = 'OIL-' + String(i).padStart(2, '0');
    const block = h('div', { class: 'os-block', 'aria-hidden': 'true' },
      h('div', { class: 'c a' }, h('i', {}, 'Drawing No.'), h('b', { class: 'no' }, no)),
      h('div', { class: 'c t' }, h('i', {}, 'Title'), h('b', {}, (o.short || (root.dataset.title || '').replace(/<[^>]+>/g, '')).toUpperCase())),
      h('div', { class: 'c s' }, h('i', {}, 'Sheet'), h('b', {}, String(i).padStart(2, '0') + ' / ' + String(TOTAL).padStart(2, '0'))),
      h('div', { class: 'c d' }, h('i', {}, 'Data to'), h('b', {}, o.date || '20.10.2026')),
      h('div', { class: 'c src' }, h('i', {}, 'Source'), h('b', {}, o.source || '')));
    const cap = root.dataset.caption ? h('figcaption', { html: root.dataset.caption }) : null;
    const inner = h('div', { class: 'os-paper' }, head, ctrl, stage, legend, block);
    root.replaceChildren(inner, cap || '');
    return { stage, ctrl, legend, head, inner };
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
    // the product stack on the right
    const sx = 410, sw = 140, unit = 5.1; // px per gallon
    const total = Y.items.reduce((a, b) => a + b.gal, 0);
    const stack = S('g', {});
    let yy = 330;
    const slabs = Y.items.map((it) => {
      const hgt = it.gal * unit; yy -= hgt;
      const g = S('g', { class: 'os-slab', opacity: 0 },
        S('path', { d: `M${sx},${yy + 6}l${sw * 0.62},-8l${sw * 0.38},8l-${sw * 0.62},8z`, fill: it.c, 'fill-opacity': 0.35, stroke: it.c }),
        S('rect', { x: sx, y: yy + 6, width: sw * 0.62, height: hgt, fill: it.c, 'fill-opacity': 0.22, stroke: it.c, transform: `skewY(0)` }),
        S('path', { d: `M${sx + sw * 0.62},${yy + 14 - 8 + 8}l${sw * 0.38},-8l0,${hgt}l-${sw * 0.38},8z`, fill: it.c, 'fill-opacity': 0.12, stroke: it.c }),
        S('text', { x: sx + sw + 14, y: yy + 6 + hgt / 2 + 4, class: 'os-lab', fill: it.c }, `${it.name} · ${it.gal.toFixed(1)} gal`));
      stack.append(g);
      return g;
    });
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
        : [{ name: 'Diesel − WTI', c: C.diesel, ...g('diesel_wti'), w: 2, area: 0.08 }, { name: 'Diesel − Brent', c: '#9fd0f0', ...g('diesel_brent'), w: 1.2 }, { name: 'Gasoline − Brent', c: C.gas, ...g('gasoline_brent'), w: 1.6 }];
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
    legend.append(chip('Brent − WTI (weekly mean to 2024, daily since 2025)', C.violet), chip('the usual range, $3 to $5', 'rgba(143,176,245,0.35)'));
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
    tc.insertBefore(S('rect', { x: 50, width: 694, y: yScale(ys[1]), height: yScale(ys[0]) - yScale(ys[1]), fill: 'rgba(143,176,245,0.16)' }), tc.firstChild);
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
      lines.push({ name: '2015–24 low', c: 'rgba(223,230,241,0.35)', x: band.map((b) => b[0]), y: band.map((b) => b[1]), w: 0.8, fmt: (v) => f1(v) + ' m bbl' });
      lines.push({ name: '2015–24 high', c: 'rgba(223,230,241,0.35)', x: band.map((b) => b[0]), y: band.map((b) => b[2]), w: 0.8, fmt: (v) => f1(v) + ' m bbl' });
      legend.replaceChildren(chip(name + ', 2026', col), chip('2025', C.muted), chip('2022', C.grey), chip('range of 2015–2024', 'rgba(223,230,241,0.3)'));
      const r = timeChart(stage, { w: 760, x0: Date.UTC(2026, 0, 1), x1: Date.UTC(2026, 11, 31), xticks: MON.map((m, i) => [Date.UTC(2026, i, 1), m]), panels: [{ h: 260, ymin: lo, ymax: hi, yfmt: (v) => v + ' m', series: lines }], hover: (x) => { const d = new Date(x); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }, aria: name + ' by week of the year' });
      const g = r.geo[0];
      const poly = band.map((b) => `${r.X(b[0]).toFixed(1)},${g.Y(b[2]).toFixed(1)}`).concat(band.slice().reverse().map((b) => `${r.X(b[0]).toFixed(1)},${g.Y(b[1]).toFixed(1)}`));
      r.svg.insertBefore(S('polygon', { points: poly.join(' '), fill: 'rgba(223,230,241,0.08)' }), r.svg.querySelector('g'));
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
  const FLOWC = () => ({ crude: C.crude, wti: '#f2b36b', urals: C.violet });

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
    legend.append(chip('Gulf, Africa, Brazil crude', C.crude), chip('US and Canadian crude', '#f2b36b'), chip('Russian and Caspian crude', C.violet), chip('chokepoint, ring area ∝ flow', C.line));
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
    // shipping lane through the strait (traffic separation scheme, schematic)
    const laneIn = lanePath(P, [[50.6, 27.6], [52.5, 26.95], [54.6, 26.55], [56.2, 26.62], [56.65, 26.35], [57.2, 25.75], [58.2, 24.9], [60.5, 23.5]]);
    const lane = S('path', { d: smoothD(laneIn), class: 'os-lane' });
    const laneLen = () => lane.getTotalLength();
    const ships = S('g', {});
    svg.append(pipes, lane, ships);
    // terminals
    const marks = S('g', {});
    for (const n of ['Ras Tanura', 'Abqaiq', 'Kharg Island', 'Basra (ABOT)', 'Mina al-Ahmadi', 'Habshan', 'Fujairah', 'Jask', 'Ras Laffan']) {
      const [x, y] = at(n), p = place(n);
      marks.append(S('g', { tabindex: 0, onpointermove: (ev) => showTip(ev, `<b>${n}</b><br>${p.role}`), onpointerleave: hideTip }, S('rect', { x: x - 3.5, y: y - 3.5, width: 7, height: 7, class: 'os-term' })));
      const right = ['Kharg Island', 'Fujairah', 'Jask', 'Habshan', 'Ras Laffan'].includes(n);
      marks.append(S('text', { x: x + (right ? 9 : -9), y: y + 4, 'text-anchor': right ? 'start' : 'end', class: 'os-place sm' }, n));
    }
    const [hx, hy] = P([56.45, 26.55]);
    marks.append(S('text', { x: hx + 14, y: hy - 26, class: 'os-place' }, 'Strait of Hormuz'));
    marks.append(S('text', { x: P([46.1, 25.3])[0], y: P([46.1, 25.3])[1] - 8, class: 'os-place sm' }, '← East–West line to Yanbu, Red Sea, 1,200 km'));
    marks.append(S('text', { x: P([54.0, 23.4])[0], y: P([54.0, 23.4])[1] + 22, class: 'os-place sm' }, 'Habshan–Fujairah line'));
    marks.append(S('text', { x: P([52.6, 28.4])[0] + 6, y: P([52.6, 28.4])[1] - 6, class: 'os-place sm' }, 'Goreh–Jask'));
    for (const [n, lon, lat] of [['IRAN', 53.5, 30.2], ['SAUDI ARABIA', 47.6, 23.0], ['UAE', 54.4, 23.1], ['OMAN', 57.6, 22.4], ['QATAR', 51.15, 25.0], ['IRAQ', 46.6, 30.6], ['KUWAIT', 47.3, 29.35]]) {
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
    legend.append(chip('pipeline', C.gold), chip('tanker in the shipping lane', C.crude), chip('export terminal', C.line));
    let flow = cu.hormuz[0].hormuz, ships0 = cu.hormuz[0].ships, t0 = 0;
    function go(i) {
      st.i = i; btns.forEach((b, j) => b.classList.toggle('on', j === i));
      const s = cu.hormuz[i];
      const bar = (v) => v == null ? '<span class="bar"></span>' : `<span class="bar"><span style="width:${(v / 25) * 100}%"></span></span>`;
      panel.innerHTML = `<div class="g"><i>Oil through the strait</i><b>${s.hormuz == null ? 'n/a' : s.hormuz + ' mb/d'}</b>${bar(s.hormuz)}</div>
        <div class="g"><i>Gulf exports, all routes</i><b>${s.exports == null ? 'n/a' : s.exports + ' mb/d'}</b>${bar(s.exports)}</div><div class="g"><i>Ships a day</i><b class="sm">${s.ships}</b></div><div class="g"><i>East–West line</i><b class="sm">${s.ew}</b></div><p>${s.text}</p>`;
      ew.classList.toggle('on', i > 0); ad.classList.toggle('on', i > 0); gj.classList.toggle('on', i > 0 && i < 3);
      ships0 = { prewar: 100, mar: 4, apr: 4, jun: 35, aug: 5, oct: 8 }[s.k];
    }
    go(0);
    // ships: dots spaced by the day's traffic
    const N = 40, dots = [];
    for (let i = 0; i < N; i++) { const c = S('g', {}, S('rect', { x: -5, y: -2, width: 10, height: 4, rx: 2, fill: '#f6d2a8', stroke: C.crude, 'stroke-width': 0.8 })); ships.append(c); dots.push(c); }
    let L = 0, ph = 0, auto = 0, density = 1;
    whenSeen(svg, () => { L = laneLen(); });
    looper(svg, (dt) => {
      if (!L) L = laneLen();
      if (st.auto) { auto += dt; if (auto > 5.5) { auto = 0; go((st.i + 1) % cu.hormuz.length); } }
      density += ((ships0 / 100) - density) * (1 - Math.exp(-dt / 0.8));
      ph = (ph + dt * 0.012) % 1;
      dots.forEach((c, i) => {
        const u = (ph + i / N) % 1, p = lane.getPointAtLength(u * L), q = lane.getPointAtLength(Math.min(L, u * L + 2));
        const show = (i / N) < density;
        c.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${(Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI).toFixed(0)})`);
        c.setAttribute('opacity', show ? 0.95 : 0);
      });
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

  // ---- crude grades: what each one yields in the first distillation
  FIG.assay = function (root) {
    const A = DATA.curated.assays;
    const { stage, legend } = sheet(root, { eyebrow: 'Straight-run yields by boiling range, weight %', short: 'Crude assays', source: 'TotalEnergies crude assays' });
    const CUTS = [['Gas and LPG', C.gold], ['Naphtha, 15–150 °C', C.gas], ['Kerosene, 150–230 °C', C.jet], ['Gasoil, 230–375 °C', C.diesel], ['Vacuum gasoil, 375–550 °C', '#b58a5e'], ['Vacuum residue, above 550 °C', '#5d4a3a']];
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
        if (v >= 7) svg.append(S('text', { x: X(acc + v / 2), y: y + 21, 'text-anchor': 'middle', class: 'os-segv', fill: k >= 4 ? '#f3f6fb' : '#0b1424' }, Math.round(v)));
        acc += v;
      });
    });
    stage.append(svg);
    whenSeen(svg, () => segs.forEach((r) => { r.style.transform = 'scaleX(1)'; }), '-40px 0px');
    legend.append(...CUTS.map(([n, c]) => chip(n, c)));
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
    const { stage, ctrl } = sheet(root, { eyebrow: 'Breakeven prices, $ per barrel', short: 'What a barrel costs', source: 'Rystad 2024 · Dallas Fed 2026 · IMF 2025' });
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

  // ---- spare capacity before the war, and what was shut in
  FIG.spare = function (root) {
    const cu = DATA.curated;
    const { stage, ctrl } = sheet(root, { eyebrow: 'OPEC+ effective spare capacity, February 2026, mb/d', short: 'Spare capacity', source: 'IEA OMR Mar 2026 · EIA STEO Oct 2026' });
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
    const { svg, P } = baseMap(m, { vb: [80, 200, 900, 860], aria: 'Map of the North Sea fields in the Brent basket', grat: true });
    svg.classList.add('os-zoom');
    const g = S('g', {}); svg.append(g);
    const R = (k) => 6 + Math.sqrt(k) * 2.2;
    for (const f of cu.northsea) {
      const [x, y] = P([f.lon, f.lat]), [tx, ty] = P([f.tlon, f.tlat]);
      g.append(S('path', { d: `M${x},${y}L${tx},${ty}`, class: 'os-pipe on', style: 'stroke-width:2.2' }));
      g.append(S('rect', { x: tx - 4, y: ty - 4, width: 8, height: 8, class: 'os-term' }), S('text', { x: tx + (tx > x ? 8 : -8), y: ty + 4, 'text-anchor': tx > x ? 'start' : 'end', class: 'os-place sm' }, f.term));
      g.append(S('g', { tabindex: 0, onpointermove: (ev) => showTip(ev, `<b>${f.n}</b><br>about ${f.kbd} kb/d loading (Sep 2026 programme${f.n === 'Brent' ? '; Brent field 2026 average' : ''})`), onpointerleave: hideTip },
        S('circle', { cx: x, cy: y, r: R(f.kbd), fill: C.brent, 'fill-opacity': 0.25, stroke: C.brent, 'stroke-width': 1.5 })));
      const left = f.n === 'Oseberg', lx = left ? x - R(f.kbd) - 6 : x + R(f.kbd) + 6, an = left ? 'end' : 'start', dy = f.n === 'Troll' ? -10 : 0;
      g.append(S('text', { x: lx, y: y - 2 + dy, 'text-anchor': an, class: 'os-place' }, f.n), S('text', { x: lx, y: y + 14 + dy, 'text-anchor': an, class: 'os-num' }, f.kbd + ' kb/d'));
    }
    // the Midland barrel arriving at Rotterdam
    const [rx, ry] = P([4.14, 51.94]);
    const arc = S('path', { d: `M${P([-8, 50.6])[0]},${P([-8, 50.6])[1]}C${P([-3, 50.2])[0]},${P([-3, 50.2])[1]} ${P([1, 51.4])[0]},${P([1, 51.4])[1]} ${rx},${ry}`, class: 'os-route', stroke: C.wti, 'stroke-width': 9, 'stroke-opacity': 0.35 });
    g.append(arc, S('rect', { x: rx - 5, y: ry - 5, width: 10, height: 10, class: 'os-term' }), S('text', { x: rx + 9, y: ry + 5, class: 'os-place' }, 'Rotterdam'),
      S('text', { x: P([-7.8, 50.9])[0], y: P([-7.8, 50.9])[1] - 12, class: 'os-place', fill: C.wti }, 'WTI Midland from Texas'), S('text', { x: P([-7.8, 50.9])[0], y: P([-7.8, 50.9])[1] + 6, class: 'os-num' }, `${cu.midlandNL} kb/d of US crude into the Netherlands`));
    const ship = S('g', {}, S('rect', { x: -7, y: -2.6, width: 14, height: 5.2, rx: 2.6, fill: '#f6d2a8', stroke: C.wti }));
    g.append(ship);
    stage.append(svg, h('div', { class: 'os-read', html: 'Five North Sea grades load about <b>470 kb/d</b>; the Brent field itself about 23 kb/d. One Texan grade landed in Rotterdam can set the price of all of them.' }));
    let L = 0, u = 0;
    looper(svg, (dt) => { if (!L) L = arc.getTotalLength(); u = (u + dt / 7) % 1; const p = arc.getPointAtLength(u * L), q = arc.getPointAtLength(Math.min(L, u * L + 2)); ship.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI})`); });
  };

  // ---- the futures curve: contango and backwardation from the cost of carry
  FIG.curve = function (root) {
    const cu = DATA.curated;
    const { stage, ctrl } = sheet(root, { eyebrow: 'Futures price by delivery month, $ per barrel', short: 'The curve', source: 'cost-of-carry model · market points from the text' });
    const st = { S: 100, r: 4, u: 6, y: 30, preset: 'oct2026' };
    const W = 760, H = 330, M = { l: 54, r: 20, t: 20, b: 34 };
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'os-svg', role: 'img', 'aria-label': 'Futures curve from the cost of carry' });
    const X = (mo) => M.l + (mo / 12) * (W - M.l - M.r), Y = (v) => H - M.b - ((v - 0) / 160) * (H - M.t - M.b);
    for (const t of [0, 40, 80, 120, 160]) svg.append(S('line', { x1: M.l, x2: W - M.r, y1: Y(t), y2: Y(t), class: 'os-gridh' }), S('text', { x: M.l - 7, y: Y(t) + 3.5, 'text-anchor': 'end', class: 'os-ax' }, '$' + t));
    for (let mo = 0; mo <= 12; mo += 2) svg.append(S('text', { x: X(mo), y: H - 12, 'text-anchor': 'middle', class: 'os-ax' }, mo === 0 ? 'spot' : '+' + mo + ' mo'));
    const area = S('path', { fill: C.red, 'fill-opacity': 0.08 }), line = S('path', { fill: 'none', stroke: C.red, 'stroke-width': 2.6 }), spot = S('circle', { r: 5, fill: C.crude });
    const mk = S('g', {}), lab = S('text', { x: W - M.r, y: M.t + 12, 'text-anchor': 'end', class: 'os-lab' });
    svg.append(area, line, spot, mk, lab);
    const read = h('div', { class: 'os-read' });
    const sS = slider('Spot', 20, 150, 1, st.S, (v) => { st.S = v; draw(); }, (v) => '$' + v);
    const sR = slider('Interest r', 0, 10, 0.5, st.r, (v) => { st.r = v; draw(); }, (v) => v + ' %/yr');
    const sU = slider('Storage u', 0, 40, 1, st.u, (v) => { st.u = v; draw(); }, (v) => v + ' %/yr');
    const sY = slider('Convenience y', 0, 60, 1, st.y, (v) => { st.y = v; draw(); }, (v) => v + ' %/yr');
    const presets = { oct2026: { S: 102, r: 4, u: 4, y: 30 }, apr2020: { S: 18, r: 1, u: 120, y: 0 }, calm: { S: 70, r: 4, u: 6, y: 8 } };
    ctrl.append(seg([['oct2026', 'Oct 2026: scarcity'], ['calm', 'A calm market'], ['apr2020', 'Apr 2020: full tanks']], st.preset, (v) => { st.preset = v; Object.assign(st, presets[v]); sS.set(st.S); sR.set(st.r); sU.set(Math.min(40, st.u)); sY.set(st.y); draw(); }));
    const ctrl2 = h('div', { class: 'os-ctrl' }, sS.el, sR.el, sU.el, sY.el);
    stage.append(svg, ctrl2, read);
    const tgt = { k: 0 }; let cur = null;
    function F(mo) { return st.S * Math.exp(((st.r + st.u - st.y) / 100) * (mo / 12)); }
    function draw() {
      const pts = []; for (let mo = 0; mo <= 12; mo += 0.25) pts.push([X(mo), Y(clamp(F(mo), 0, 170))]);
      cur = pts;
      line.setAttribute('d', dOf(pts)); area.setAttribute('d', dOf(pts) + `L${X(12)},${Y(st.S)}L${X(0)},${Y(st.S)}Z`);
      spot.setAttribute('cx', X(0)); spot.setAttribute('cy', Y(st.S));
      const carry = st.r + st.u - st.y, f12 = F(12);
      line.setAttribute('stroke', carry >= 0 ? C.diesel : C.red); area.setAttribute('fill', carry >= 0 ? C.diesel : C.red);
      lab.textContent = carry >= 0 ? 'CONTANGO · STORE IT' : 'BACKWARDATION · SELL IT NOW'; lab.setAttribute('fill', carry >= 0 ? C.diesel : C.red);
      mk.replaceChildren();
      const ref = st.preset === 'oct2026' ? cu.curves.oct2026 : st.preset === 'apr2020' ? cu.curves.apr2020 : null;
      if (ref) for (const [mo, v] of ref.pts) mk.append(S('circle', { cx: X(mo), cy: Y(v), r: 4.5, fill: 'none', stroke: C.line, 'stroke-width': 1.5 }, S('title', {}, ref.label + ': ' + v)));
      read.innerHTML = `$$F(T) = S\\,e^{(r + u - y)T}$$ <b>r + u − y = ${carry.toFixed(1)} % a year</b> → 12-month future <b>$${f12.toFixed(1)}</b> against spot $${st.S}` + (ref ? ` · rings: ${ref.label}` : '');
      read.innerHTML = read.innerHTML.replace(/\$\$F\(T\)[^$]*\$\$/, '<span class="os-eq">F(T) = S·e<sup>(r+u−y)T</sup></span>');
    }
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
    const ship = S('g', {}, S('rect', { x: -8, y: -3, width: 16, height: 6, rx: 3, fill: '#f6d2a8', stroke: C.wti }));
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
      for (const [n, v, c] of parts) { stack.append(S('rect', { x: sx(acc), y: 28, width: Math.max(0, sx(acc + v) - sx(acc) - 1), height: 34, fill: c, 'fill-opacity': 0.85 }, S('title', {}, `${n}: $${v.toFixed(1)}`))); if (v > 2.4) stack.append(S('text', { x: sx(acc + v / 2), y: 50, 'text-anchor': 'middle', class: 'os-segv', fill: '#0b1424' }, n.split(' ')[0])); acc += v; }
      stack.append(S('line', { x1: sx(6.4), x2: sx(6.4), y1: 18, y2: 72, stroke: C.brent, 'stroke-width': 2, 'stroke-dasharray': '4 3' }), S('text', { x: sx(6.4), y: 14, 'text-anchor': 'middle', class: 'os-small', fill: C.brent }, 'Feb 2026 spot gap $6.4'));
      stack.append(S('line', { x1: sx(25), x2: sx(25), y1: 18, y2: 72, stroke: C.red, 'stroke-width': 2, 'stroke-dasharray': '4 3' }), S('text', { x: sx(25), y: 14, 'text-anchor': 'middle', class: 'os-small', fill: C.red }, 'Oct 1–20 spot gap $25.0'));
      stack.append(S('text', { x: sx(tot) + 6, y: 50, class: 'os-lab', fill: '#f3f6fb' }, '= $' + tot.toFixed(1)));
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
        svg.append(S('text', { x: mid, y: 72, 'text-anchor': 'middle', class: 'os-segv', fill: '#0b1424' }, (100 * v / tot).toFixed(0) + '%'));
        svg.append(S('text', { x: mid, y: i % 2 ? 120 : 30, 'text-anchor': 'middle', class: 'os-small', fill: c }, n));
        acc += v;
      });
      stage.replaceChildren(svg, h('div', { class: 'os-read', html: `<b>${p.price.toFixed(3)} ${p.unit}</b> on ${p.date}. ${st.v === 'de_diesel' ? 'Taxes and levies are 38 % of the price; the refining spread (≈ 50 ct) is now about as large as the crude itself (≈ 62 ct).' : 'Taxes are about 11 % of a US gallon, so the same crack moves the US price by a larger share.'}` }));
    }
    draw();
  };

  // ------------------------------------------------------------------ boot
  const NEEDS_GEO = new Set(['flows', 'hormuz', 'producers', 'route', 'northsea']);
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
