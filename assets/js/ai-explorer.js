// Interactive figures of the AI-money long read: capex, the labs, the web of deals, commitments against revenue, bond
// spread curves, the cost-of-money ladder, the deals table, rates and spreads, a break-even calculator, Nasdaq then and
// now, and sovereign yields. Data: assets/ai-article/ai.json, made by bin/ai_article (FRED series + curated.py).
// Every figure is a <figure data-ai="..."> that this script fills when it scrolls into view. Vanilla SVG/HTML, no
// library, nothing leaves the page.
(function () {
  'use strict';
  const roots = [...document.querySelectorAll('[data-ai]')];
  if (!roots.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#04204B', MUTED = '#6b7280', RULE = '#dfe4ee', BLUE = '#0b4fc0', WARM = '#b4552f', TEAL = '#138374', VIOLET = '#6a47c2', GREY = '#8a93a6', GOLD = '#a47a00';
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
  const S = (tag, attrs, ...kids) => h('svg:' + tag, attrs, ...kids);
  const sum = (a) => a.reduce((x, y) => x + (y || 0), 0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const f0 = (v) => (v == null ? '–' : Math.round(v).toLocaleString('en-US'));
  const f1 = (v) => (v == null ? '–' : v.toFixed(1));
  const f2 = (v) => (v == null ? '–' : v.toFixed(2));
  const usd = (v) => (v == null ? '–' : v >= 1000 ? '$' + (v / 1000).toFixed(2) + ' trn' : v >= 100 ? '$' + Math.round(v) + ' bn' : '$' + (+v.toFixed(1)) + ' bn');
  const ts = (d) => Date.parse(d.length === 7 ? d + '-01T00:00:00Z' : d + 'T00:00:00Z');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fdate = (t) => { const d = new Date(t); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  const fmon = (t) => { const d = new Date(t); return MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
  const sh = (k) => ((DATA && DATA.refs && DATA.refs[k]) || k.replace(/-/g, ' '));
  const ref = (k) => `<a href="#r-${k}">[${sh(k)}]</a>`;
  function niceTicks(lo, hi, n) {
    const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag, out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(+v.toFixed(10));
    return out;
  }

  let DATA = null;
  const load = () => DATA ? Promise.resolve(DATA) : (load.p = load.p || fetch(BASE + 'ai.json').then((r) => { if (!r.ok) throw new Error('ai.json: ' + r.status); return r.json(); }).then((d) => (DATA = d)));

  // tooltip, frame, controls (the budget article's .bx-* styles)
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
    root.classList.add('concept', 'bx', 'ai');
    const title = root.dataset.title, cap = root.dataset.caption;
    root.innerHTML = '';
    const ctrl = h('div', { class: 'bx-ctrl' }), stage = h('div', { class: 'bx-stage' }), legend = h('div', { class: 'bx-legend' });
    root.append(h('header', {}, h('span', { class: 'concept-kind' }, kind), h('span', { class: 'concept-title' }, title)), ctrl, stage, legend);
    if (cap) root.append(h('figcaption', {}, cap));
    return { ctrl, stage, legend };
  }
  const lbl = (t) => h('span', { class: 'bx-lbl' }, t);
  function seg(options, current, onPick) {
    const wrap = h('span', { class: 'bx-seg' });
    for (const [v, label] of options) {
      wrap.append(h('button', { type: 'button', class: v === current ? 'on' : '', 'aria-pressed': v === current ? 'true' : 'false', 'data-v': v, onclick: () => { onPick(v); setSeg(wrap, v); } }, label));
    }
    return wrap;
  }
  const setSeg = (wrap, v) => [...wrap.children].forEach((b) => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); });
  function chips(items, active, onToggle) { // items: [id, label, colour]
    const wrap = h('div', { class: 'bx-chips' });
    for (const [id, label, col] of items) {
      wrap.append(h('button', { type: 'button', class: 'bx-chip' + (active.has(id) ? ' on' : ''), onclick: (ev) => { onToggle(id); ev.currentTarget.classList.toggle('on', active.has(id)); } }, h('i', { style: 'background:' + col }), label));
    }
    return wrap;
  }
  function observe(el, fn) {
    let w = 0;
    const ro = new ResizeObserver(() => { const nw = Math.round(el.getBoundingClientRect().width); if (nw && nw !== w) { w = nw; fn(w); } });
    ro.observe(el);
  }
  function lazy(root, fn) {
    const go = () => load().then(() => fn(root)).catch((e) => { console.error(e); root.append(h('p', { class: 'bx-err' }, 'This figure failed to load: ' + e.message)); });
    if (!('IntersectionObserver' in window)) return go();
    root.classList.add('ai');
    root.append(h('div', { class: 'ai-wait' }, 'loading …'));
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: '700px 0px' });
    io.observe(root);
  }
  const note = (t) => h('p', { class: 'bx-note' }, t);
  const swatch = (items) => items.map(([n, c]) => h('span', { class: 'bx-chip static' }, h('i', { style: 'background:' + c }), n));

  // ------------------------------------------------------------------ a generic multi-panel time chart
  // o: { panels:[{h, log, ymin, ymax, yfmt, series:[{k,name,c,x[],y[],dash,w,fmt}], zero}], x0, x1, xticks:[[x,label]], events:[[x,label,n]], hover(x)->string, w }
  function timeChart(stage, o) {
    const W = o.w, M = { l: 46, r: 14, t: (o.events || []).length ? 40 : 10, b: 24 }, GAP = 14, iw = W - M.l - M.r;
    const H = sum(o.panels.map((p) => p.h)) + GAP * (o.panels.length - 1) + M.t + M.b;
    const X = (x) => M.l + ((x - o.x0) / (o.x1 - o.x0)) * iw;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'ai-svg', role: 'img', 'aria-label': o.aria || 'chart' });
    let y0 = M.t; const geo = [];
    o.panels.forEach((p, pi) => {
      const top = y0, bot = y0 + p.h;
      let lo = p.ymin, hi = p.ymax;
      const Y = p.log ? (v) => bot - ((Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * p.h : (v) => bot - ((v - lo) / (hi - lo)) * p.h;
      const ticks = p.ticks || (p.log ? p.ticksLog : niceTicks(lo, hi, 4));
      const g = S('g', {});
      for (const t of ticks) {
        if (t < lo - 1e-9 || t > hi + 1e-9) continue;
        g.append(S('line', { x1: M.l, x2: W - M.r, y1: Y(t), y2: Y(t), stroke: RULE, 'stroke-width': 1 }), S('text', { x: M.l - 6, y: Y(t) + 3.5, 'text-anchor': 'end', class: 'ai-ax' }, p.yfmt ? p.yfmt(t) : t));
      }
      if (p.title) g.append(S('text', { x: M.l, y: top - 1, class: 'ai-pt' }, p.title));
      const clipId = 'c' + Math.random().toString(36).slice(2, 8);
      g.append(S('clipPath', { id: clipId }, S('rect', { x: M.l, y: top - 2, width: iw, height: p.h + 4 })));
      const lines = S('g', { 'clip-path': `url(#${clipId})` });
      for (const s of p.series) {
        let d = '', pen = false;
        for (let i = 0; i < s.x.length; i++) {
          if (s.y[i] == null || s.x[i] < o.x0 - 1 || s.x[i] > o.x1 + 1) { pen = false; continue; }
          d += (pen ? 'L' : 'M') + X(s.x[i]).toFixed(1) + ' ' + Y(s.y[i]).toFixed(1); pen = true;
        }
        lines.append(S('path', { d, fill: 'none', stroke: s.c, 'stroke-width': s.w || 1.8, 'stroke-dasharray': s.dash || null, 'stroke-linejoin': 'round' }));
      }
      g.append(lines);
      geo.push({ p, top, bot, Y });
      svg.append(g);
      y0 = bot + GAP;
    });
    // x axis
    const axY = H - M.b + 14;
    for (const [x, label] of o.xticks) {
      if (x < o.x0 || x > o.x1) continue;
      svg.append(S('line', { x1: X(x), x2: X(x), y1: M.t, y2: H - M.b, stroke: '#eef1f6' }), S('text', { x: X(x), y: axY, 'text-anchor': 'middle', class: 'ai-ax' }, label));
    }
    // events
    let lastX = -99, row = 0;
    for (const [x, label, n] of o.events || []) {
      if (x < o.x0 || x > o.x1) continue;
      row = X(x) - lastX < 19 ? (row + 1) % 2 : 0; lastX = X(x);
      const cy = M.t + 6 + row * 17;
      svg.append(S('line', { x1: X(x), x2: X(x), y1: cy, y2: H - M.b, stroke: WARM, 'stroke-dasharray': '3 3', 'stroke-opacity': 0.55 }));
      const c = S('g', { class: 'ai-ev', onmousemove: (ev) => showTip(ev, `<b>${n}</b> ${label}`), onmouseleave: hideTip },
        S('circle', { cx: X(x), cy, r: 8, fill: WARM }), S('text', { x: X(x), y: cy + 3.5, 'text-anchor': 'middle', class: 'ai-evn' }, n));
      svg.append(c);
    }
    // hover
    const cross = S('line', { y1: M.t, y2: H - M.b, stroke: INK, 'stroke-opacity': 0.5, visibility: 'hidden' });
    const dots = S('g', {});
    svg.append(cross, dots);
    const overlay = S('rect', { x: M.l, y: M.t, width: iw, height: H - M.t - M.b, fill: 'transparent' });
    overlay.addEventListener('mousemove', (ev) => {
      const r = svg.getBoundingClientRect(), px = ((ev.clientX - r.left) / r.width) * W;
      const x = o.x0 + ((px - M.l) / iw) * (o.x1 - o.x0);
      dots.replaceChildren();
      let first = null, rows = [];
      geo.forEach((gp) => gp.p.series.forEach((s) => {
        let lo = 0, hi = s.x.length - 1;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s.x[m] < x) lo = m; else hi = m; }
        const i = Math.abs(s.x[lo] - x) < Math.abs(s.x[hi] - x) ? lo : hi;
        if (s.y[i] == null || Math.abs(s.x[i] - x) > (o.x1 - o.x0) * 0.04) return;
        if (first == null) first = s.x[i];
        dots.append(S('circle', { cx: X(s.x[i]), cy: gp.Y(s.y[i]), r: 3.6, fill: s.c, stroke: '#fff', 'stroke-width': 1.2 }));
        rows.push(`<tr><td><i style="background:${s.c}"></i>${s.name}</td><td>${s.fmt ? s.fmt(s.y[i]) : (gp.p.yfmt ? gp.p.yfmt(s.y[i]) : s.y[i])}</td></tr>`);
      }));
      if (first == null) { hideTip(); cross.setAttribute('visibility', 'hidden'); return; }
      cross.setAttribute('x1', X(first)); cross.setAttribute('x2', X(first)); cross.setAttribute('visibility', 'visible');
      showTip(ev, `<b>${o.hover(first)}</b><table>${rows.join('')}</table>`);
    });
    overlay.addEventListener('mouseleave', () => { hideTip(); cross.setAttribute('visibility', 'hidden'); dots.replaceChildren(); });
    svg.append(overlay);
    stage.replaceChildren(svg);
    return svg;
  }

  // ================================================================== capex
  function capexWidget(root) {
    const D = DATA.capex, st = { view: root.dataset.view || 'guide' };
    const { ctrl, stage, legend } = frame(root, 'bars');
    const COL = { Amazon: WARM, Alphabet: TEAL, Microsoft: BLUE, Meta: VIOLET };
    ctrl.append(lbl('Show'), seg([['guide', '2026 guidance, as revised'], ['q2', 'Latest quarter (Q2 2026)']], st.view, (v) => { st.view = v; draw(); }));
    legend.replaceChildren(...swatch(Object.entries(COL)));
    const mid = (r) => (r[0] + r[1]) / 2;
    function draw() {
      const rows = [];
      if (st.view === 'guide') {
        for (const [k, name] of [['Jan', 'January 2026'], ['Apr', 'April 2026'], ['Jul', 'July 2026']]) rows.push({ name, segs: D.companies.map((c) => ({ c, v: mid(D.guidance[c][k]), r: D.guidance[c][k] })) });
        rows.unshift({ name: '2025, the four together', segs: [{ c: 'All four', v: D.total_2025, col: '#c9d0dc' }], base: true });
      } else {
        rows.push({ name: 'Q2 2026', segs: D.companies.map((c) => ({ c, v: D.q2[c], yoy: D.q2_yoy[c] })) });
      }
      const tot = (r) => sum(r.segs.map((s) => s.v)), mx = Math.max(...rows.map(tot)) * 1.12;
      const box = h('div', { class: 'ai-rows' });
      for (const r of rows) {
        const bar = h('div', { class: 'ai-stack' });
        for (const s of r.segs) {
          const seg1 = h('i', { style: `width:${(s.v / mx) * 100}%;background:${s.col || COL[s.c]}` }, h('span', {}, (s.v / mx) > 0.07 ? (r.base ? '≈ ' : '') + f0(s.v) : ''));
          seg1.addEventListener('mousemove', (ev) => showTip(ev, `<b>${s.c}</b> <span>${r.name}</span><table><tr><td>${st.view === 'guide' ? (s.r && s.r[0] !== s.r[1] ? 'guided range' : 'guided') : 'capex in the quarter'}</td><td>${s.r && s.r[0] !== s.r[1] ? '$' + s.r[0] + '–' + s.r[1] + ' bn' : usd(s.v)}</td></tr>${s.yoy ? `<tr><td>against Q2 2025</td><td>+${s.yoy} %</td></tr>` : ''}</table>${D.note[s.c] && st.view === 'guide' ? `<span>${D.note[s.c]}</span>` : ''}`));
          seg1.addEventListener('mouseleave', hideTip);
          bar.append(seg1);
        }
        box.append(h('div', { class: 'ai-row' }, h('span', { class: 'nm' }, r.name), h('div', { class: 'barwrap' }, bar), h('span', { class: 'v' }, (r.base ? '≈ ' : '') + usd(tot(r)))));
      }
      stage.replaceChildren(box, note(st.view === 'guide'
        ? 'Calendar-2026 capital expenditure guidance of the four, as announced with each quarter\'s results; ranges are drawn at their midpoint (hover for the range). The 2025 row is an approximate total from press tallies. Source: Platformonomics scoreboard of 31 July 2026; see references.'
        : 'Capital expenditure including finance leases in the quarter. Together about $172 bn in one quarter, 77 % more than a year earlier. Source: Platformonomics, 31 July 2026.'));
    }
    draw();
  }

  // ================================================================== labs
  function labsWidget(root) {
    const L = DATA.labs, st = { m: 'valuation' };
    const { ctrl, stage, legend } = frame(root, 'bars');
    const M = {
      valuation: ['Valuation', (l) => l.valuation, usd, BLUE], rev: ['Revenue', (l) => l.rev, usd, TEAL],
      mult: ['Valuation ÷ revenue', (l) => l.valuation / l.rev, (v) => f1(v) + '×', WARM], raised: ['Equity raised in the latest round', (l) => l.raised, usd, VIOLET],
    };
    ctrl.append(lbl('Metric'), seg(Object.entries(M).map(([k, v]) => [k, v[0]]), st.m, (v) => { st.m = v; draw(); }));
    legend.replaceChildren(h('span', { class: 'bx-hint' }, 'Different bases: OpenAI revenue is a 2026 forecast, Anthropic\'s a run rate, xAI\'s one quarter annualised. Hover a bar.'));
    function draw() {
      const [name, fn, fmt, col] = M[st.m], rows = L.filter((l) => fn(l) != null && !(st.m === 'raised' && l.raised == null)), mx = Math.max(...rows.map(fn)) * 1.1;
      const box = h('div', { class: 'ai-rows' });
      for (const l of rows) {
        const v = fn(l), row = h('div', { class: 'ai-row' }, h('span', { class: 'nm' }, l.name),
          h('div', { class: 'barwrap' }, h('div', { class: 'ai-stack' }, h('i', { style: `width:${(v / mx) * 100}%;background:${col}` }))), h('span', { class: 'v' }, fmt(v)));
        row.addEventListener('mousemove', (ev) => showTip(ev, `<b>${l.name}</b><table><tr><td>valuation</td><td>${usd(l.valuation)}</td></tr><tr><td>revenue</td><td>${usd(l.rev)}</td></tr><tr><td colspan="2"><span>${l.rev_basis}</span></td></tr>${l.raised ? `<tr><td>latest round</td><td>${usd(l.raised)}</td></tr>` : ''}${l.burn ? `<tr><td>forecast cash burn</td><td>${usd(l.burn)}</td></tr><tr><td colspan="2"><span>${l.burn_basis}</span></td></tr>` : `<tr><td colspan="2"><span>${l.burn_basis}</span></td></tr>`}<tr><td colspan="2"><span>${l.when}</span></td></tr></table>`));
        row.addEventListener('mouseleave', hideTip);
        box.append(row);
      }
      stage.replaceChildren(box);
    }
    draw();
  }

  // ================================================================== the web of deals
  function webWidget(root) {
    const NODES = DATA.nodes, EDGES = DATA.edges;
    const GC = { supplier: VIOLET, hyper: BLUE, cloud: TEAL, lab: WARM, investor: GOLD, finance: GREY };
    const TC = { equity: BLUE, compute: WARM, chips: VIOLET, debt: TEAL };
    const TN = { equity: 'Equity: ownership bought', compute: 'Compute: a customer\'s contract or commitment', chips: 'Chips: who buys the GPUs', debt: 'Debt: money lent' };
    const st = { sel: root.dataset.sel || '', on: new Set(['equity', 'compute', 'chips', 'debt']) };
    const { ctrl, stage, legend } = frame(root, 'network');
    ctrl.append(lbl('Show'));
    ctrl.append(chips(Object.keys(TC).map((k) => [k, k[0].toUpperCase() + k.slice(1), TC[k]]), st.on, (k) => { st.on.has(k) ? st.on.delete(k) : st.on.add(k); draw(); }));
    legend.replaceChildren(h('span', { class: 'bx-hint' }, 'Arrows point in the direction the money or the obligation runs. Width grows with the dollar amount; thin dashed lines are deals whose size the sources do not give. Click a company to isolate it.'));
    const order = ['nvidia', 'amd', 'broadcom', 'msft', 'amzn', 'goog', 'meta', 'orcl', 'crwv', 'openai', 'anth', 'xai', 'sbg', 'banks', 'credit'];
    const byId = Object.fromEntries(NODES.map((n) => [n[0], n]));
    const side = h('div', { class: 'ai-side' });
    stage.append(h('div', { class: 'ai-webbox' }), side);
    const box = stage.firstChild;
    function draw(w) {
      w = w || draw.w || 700; draw.w = w;
      const W = Math.max(w, 480), Hh = Math.min(W * 0.92, 640), cx = W / 2, cy = Hh / 2, R = Math.min(W, Hh) / 2 - 62;
      const pos = {};
      order.forEach((id, i) => { const a = -Math.PI / 2 + (i + 0.5) * (2 * Math.PI / order.length); pos[id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a }; });
      const svg = S('svg', { viewBox: `0 0 ${W} ${Hh}`, width: W, height: Hh, class: 'ai-svg', role: 'img', 'aria-label': 'Who invests in, lends to and sells to whom' });
      const defs = S('defs', {});
      for (const [t, c] of Object.entries(TC)) defs.append(S('marker', { id: 'ar-' + t, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 9, markerHeight: 9, markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse' }, S('path', { d: 'M0 0L8 4L0 8z', fill: c })));
      svg.append(defs);
      const mxA = Math.max(...EDGES.map((e) => e[3] || 0));
      const wd = (a) => (a == null ? 1.1 : 1.2 + Math.sqrt(a / mxA) * 7);
      const edges = EDGES.map((e, i) => ({ e, i })).filter(({ e }) => st.on.has(e[2]));
      edges.sort((a, b) => (b.e[3] || 0) - (a.e[3] || 0));
      const eg = S('g', {});
      for (const { e, i } of edges) {
        const a = pos[e[0]], b = pos[e[1]];
        const mxx = (a.x + b.x) / 2, myy = (a.y + b.y) / 2, k = 0.62;
        const qx = cx + (mxx - cx) * (1 - k), qy = cy + (myy - cy) * (1 - k);
        // shorten the ends so arrows do not sit under the node discs
        const sh = (p, q, d) => { const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1; return { x: p.x + (dx / l) * d, y: p.y + (dy / l) * d }; };
        const a2 = sh(a, { x: qx, y: qy }, 24), b2 = sh(b, { x: qx, y: qy }, 26);
        const hot = !st.sel || e[0] === st.sel || e[1] === st.sel;
        const p = S('path', { d: `M${a2.x.toFixed(1)} ${a2.y.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${b2.x.toFixed(1)} ${b2.y.toFixed(1)}`, fill: 'none', stroke: TC[e[2]], 'stroke-width': wd(e[3]), 'stroke-opacity': hot ? (e[3] == null ? 0.8 : st.sel ? 0.75 : 0.4) : 0.05, 'stroke-dasharray': e[3] == null ? '4 3' : null, 'marker-end': hot ? `url(#ar-${e[2]})` : null, class: 'ai-edge' });
        const hit = S('path', { d: p.getAttribute('d'), fill: 'none', stroke: 'transparent', 'stroke-width': Math.max(10, wd(e[3]) + 6), style: 'cursor:pointer' });
        hit.addEventListener('mousemove', (ev) => showTip(ev, `<b>${byId[e[0]][1]} → ${byId[e[1]][1]}</b> <span>${e[2]}</span><br>${e[3] != null ? '<b>' + usd(e[3]) + '</b> · ' : ''}${e[4]}<br><span>${ref(e[5])}</span>`));
        hit.addEventListener('mouseleave', hideTip);
        eg.append(p, hit);
      }
      svg.append(eg);
      for (const id of order) {
        const n = byId[id], p = pos[id], on = !st.sel || st.sel === id || EDGES.some((e) => st.on.has(e[2]) && ((e[0] === st.sel && e[1] === id) || (e[1] === st.sel && e[0] === id)));
        const right = Math.cos(p.a) > 0.2, left = Math.cos(p.a) < -0.2;
        const g = S('g', { class: 'ai-node' + (st.sel === id ? ' sel' : ''), style: 'cursor:pointer', opacity: on ? 1 : 0.28, tabindex: 0, role: 'button', 'aria-label': n[1] });
        g.append(S('circle', { cx: p.x, cy: p.y, r: 15, fill: GC[n[2]], stroke: '#fff', 'stroke-width': 2.5 }),
          S('text', { x: p.x + (right ? 22 : left ? -22 : 0), y: p.y + (right || left ? 4 : (Math.sin(p.a) > 0 ? 32 : -22)), 'text-anchor': right ? 'start' : left ? 'end' : 'middle', class: 'ai-nl' }, n[1].replace('Bond and credit investors', 'Bond & credit investors')));
        g.addEventListener('click', () => { st.sel = st.sel === id ? '' : id; draw(); panel(); });
        g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); g.dispatchEvent(new Event('click')); } });
        svg.append(g);
      }
      box.replaceChildren(svg);
    }
    function panel() {
      if (!st.sel) {
        side.replaceChildren(h('p', { class: 'bx-note' }, 'Colour of a company: ', ...[['supplier', 'chip makers'], ['hyper', 'the big four clouds'], ['cloud', 'AI clouds'], ['lab', 'AI labs'], ['investor', 'SoftBank'], ['finance', 'lenders']].map(([k, n]) => h('span', { class: 'bx-chip static' }, h('i', { style: 'background:' + GC[k] }), n)), '  ·  Line colour: ', ...Object.entries(TN).map(([k, n]) => h('span', { class: 'bx-chip static' }, h('i', { style: 'background:' + TC[k] }), n))));
        return;
      }
      const n = byId[st.sel], rel = EDGES.filter((e) => (e[0] === st.sel || e[1] === st.sel) && st.on.has(e[2]));
      const out = rel.filter((e) => e[0] === st.sel), inn = rel.filter((e) => e[1] === st.sel);
      const list = (title, es, dir) => es.length ? h('div', { class: 'ai-col' }, h('h4', {}, title), ...es.map((e) => h('div', { class: 'ai-edge-row' },
        h('span', { class: 'dot', style: 'background:' + TC[e[2]] }), h('div', {}, h('b', {}, `${dir === 'out' ? '→ ' + byId[e[1]][1] : byId[e[0]][1] + ' →'}`), e[3] != null ? h('span', { class: 'amt' }, ' ' + usd(e[3])) : null, h('br'), e[4], ' ', h('a', { class: 'rf', href: '#r-' + e[5] }, '[' + sh(e[5]) + ']'))))) : null;
      side.replaceChildren(h('h3', { class: 'ai-sel' }, n[1], h('button', { class: 'bx-play', type: 'button', onclick: () => { st.sel = ''; draw(); panel(); } }, 'clear')),
        h('div', { class: 'ai-cols' }, list('Money and obligations going out', out, 'out'), list('Coming in', inn, 'in')));
    }
    observe(stage, (w) => draw(w));
    panel();
  }

  // ================================================================== commitments against revenue
  function commitWidget(root) {
    const D = DATA.commit;
    const { ctrl, stage, legend } = frame(root, 'bars');
    ctrl.remove();
    const PAL = [WARM, BLUE, TEAL, VIOLET, GOLD];
    const cps = [...new Set(D.flatMap((l) => l.items.map((i) => i[0])))];
    const col = Object.fromEntries(cps.map((c, i) => [c, PAL[i % PAL.length]]));
    legend.replaceChildren(...swatch([...cps.map((c) => [c, col[c]]), ['Revenue', '#04204B'], ['Equity raised in the latest round', '#9db3d6']]));
    const mx = Math.max(...D.map((l) => sum(l.items.map((i) => i[1])))) * 1.08;
    const box = h('div', { class: 'ai-commit' });
    for (const l of D) {
      const stack = (items) => h('div', { class: 'ai-stack' }, ...items.map(([n, v, basis, rk, color, who]) => {
        const s = h('i', { style: `width:${(v / mx) * 100}%;background:${color || col[n]}` }, h('span', {}, v / mx > 0.07 ? f0(v) : ''));
        s.addEventListener('mousemove', (ev) => showTip(ev, `<b>${who || l.lab + ' → ' + n}</b><br><b>${usd(v)}</b> <span>${basis}</span><br><span>${ref(rk)}</span>`));
        s.addEventListener('mouseleave', hideTip);
        return s;
      }));
      const tot = sum(l.items.map((i) => i[1]));
      box.append(h('div', { class: 'ai-cgrp' }, h('h4', {}, l.lab),
        h('div', { class: 'ai-row' }, h('span', { class: 'nm' }, 'Spending commitments with a price'), h('div', { class: 'barwrap' }, stack(l.items)), h('span', { class: 'v' }, usd(tot))),
        h('div', { class: 'ai-row' }, h('span', { class: 'nm' }, 'Revenue (' + l.revenue_basis + ')'), h('div', { class: 'barwrap' }, stack([['Revenue', l.revenue, l.revenue_basis, l.lab === 'OpenAI' ? 'lds-openai' : 'anthropic-seriesH', '#04204B', l.lab + ' revenue']])), h('span', { class: 'v' }, usd(l.revenue))),
        h('div', { class: 'ai-row' }, h('span', { class: 'nm' }, 'Equity raised, latest round'), h('div', { class: 'barwrap' }, stack([['Equity', l.equity, 'latest equity round', l.lab === 'OpenAI' ? 'cnbc-openai' : 'anthropic-seriesH', '#9db3d6', l.lab + ' equity raised']])), h('span', { class: 'v' }, usd(l.equity))),
        h('p', { class: 'bx-note' }, l.unpriced)));
    }
    stage.replaceChildren(box);
  }

  // ================================================================== spread curves
  function curvesWidget(root) {
    const C = DATA.curves, st = { m: root.dataset.metric || 'sp', on: new Set(C.map((c) => c.id)) };
    const { ctrl, stage, legend } = frame(root, 'chart');
    ctrl.append(lbl('Show'), seg([['sp', 'Spread over Treasuries (bp)'], ['cpn', 'Coupon (%)']], st.m, (v) => { st.m = v; draw(); }));
    ctrl.append(chips(C.map((c) => [c.id, c.label, c.color]), st.on, () => draw()));
    function draw(w) {
      w = w || draw.w || 640; draw.w = w;
      const H = 330, M = { l: 50, r: 22, t: 14, b: 40 }, iw = w - M.l - M.r, ih = H - M.t - M.b;
      const pts = C.flatMap((c) => c.pts).map((p) => p[st.m]).filter((v) => v != null);
      const lo = st.m === 'sp' ? 0 : 3, hi = st.m === 'sp' ? 140 : 6.4;
      const X = (t) => M.l + ((t - 3) / 37) * iw, Y = (v) => M.t + ih - ((v - lo) / (hi - lo)) * ih;
      const svg = S('svg', { viewBox: `0 0 ${w} ${H}`, width: w, height: H, class: 'ai-svg' });
      for (const t of niceTicks(lo, hi, 5)) svg.append(S('line', { x1: M.l, x2: w - M.r, y1: Y(t), y2: Y(t), stroke: RULE }), S('text', { x: M.l - 6, y: Y(t) + 3.5, 'text-anchor': 'end', class: 'ai-ax' }, st.m === 'sp' ? t : t.toFixed(1)));
      for (const t of [3, 5, 7, 10, 20, 30, 40]) svg.append(S('text', { x: X(t), y: H - 22, 'text-anchor': 'middle', class: 'ai-ax' }, t + 'y'));
      svg.append(S('text', { x: M.l + iw / 2, y: H - 6, 'text-anchor': 'middle', class: 'ai-axt' }, 'time to maturity at issue'));
      for (const c of C) {
        if (!st.on.has(c.id)) continue;
        const p = c.pts.filter((q) => q[st.m] != null);
        if (p.length < 1) continue;
        const known = p.length === c.pts.length;
        svg.append(S('path', { d: p.map((q, i) => (i ? 'L' : 'M') + X(q.t).toFixed(1) + ' ' + Y(q[st.m]).toFixed(1)).join(''), fill: 'none', stroke: c.color, 'stroke-width': 2.2, 'stroke-dasharray': known ? null : '5 4' }));
        for (const q of p) {
          const dot = S('circle', { cx: X(q.t), cy: Y(q[st.m]), r: 5, fill: c.color, stroke: '#fff', 'stroke-width': 1.5, style: 'cursor:pointer' });
          dot.addEventListener('mousemove', (ev) => showTip(ev, `<b>${c.label}</b><table><tr><td>maturity</td><td>${q.mat} (${q.t}y)</td></tr><tr><td>spread</td><td>${q.sp != null ? '+' + q.sp + ' bp' : 'not in sources read'}</td></tr><tr><td>coupon</td><td>${q.cpn != null ? q.cpn.toFixed(3) + ' %' : 'not in sources read'}</td></tr></table><span>${ref(c.ref)}</span>`));
          dot.addEventListener('mouseleave', hideTip);
          svg.append(dot);
        }
      }
      stage.replaceChildren(svg, note(st.m === 'sp' ? 'New-issue spread of each tranche over the matching Treasury at pricing. Alphabet\'s intermediate tenors are not in the sources I could read, so its line is dashed between the two tenors that are. Note the order: the same 40-year paper cost +110 bp for Meta in October 2025, +95 bp for Alphabet in February and +125 bp for Amazon in July.' : 'Fixed coupons in per cent. Amazon\'s coupons are not in the sources I could read. Because the Treasury curve moved between the deals, coupons are not comparable across dates: use the spread view for that.'));
    }
    observe(stage, (w) => draw(w));
  }

  // ================================================================== the ladder
  function ladderWidget(root) {
    const L = DATA.ladder;
    const { stage, legend, ctrl } = frame(root, 'dot plot');
    ctrl.remove();
    legend.replaceChildren(...[['●', 'coupon fixed at issue'], ['◆', 'market yield at the date given'], ['■', 'floating: SOFR + margin']].map(([s, n]) => h('span', { class: 'bx-chip static' }, h('b', { style: 'margin-right:.2rem;color:' + INK }, s), n)),
      h('span', { class: 'bx-hint' }, 'Rates are from different dates (hover for each); the line joins a bond\'s coupon at issue to its yield now.'));
    const tiers = [...new Set(L.map((r) => r.tier))];
    const TCOL = { 'The state': INK, 'Hyperscaler, on its own name': BLUE, 'Off balance sheet': TEAL, 'Neocloud and lab-adjacent': WARM };
    function draw(w) {
      w = w || draw.w || 640; draw.w = w;
      const narrow = w < 560, rowH = narrow ? 42 : 27, M = { l: narrow ? 14 : Math.min(290, w * 0.5), r: 56, t: 18, b: 34 }, rowsN = L.length + tiers.length;
      const H = M.t + M.b + rowsN * rowH + 6, iw = w - M.l - M.r, lo = 4, hi = 16;
      const X = (v) => M.l + ((v - lo) / (hi - lo)) * iw;
      const svg = S('svg', { viewBox: `0 0 ${w} ${H}`, width: w, height: H, class: 'ai-svg' });
      for (const t of [4, 6, 8, 10, 12, 14, 16]) svg.append(S('line', { x1: X(t), x2: X(t), y1: M.t, y2: H - M.b, stroke: RULE }), S('text', { x: X(t), y: H - M.b + 16, 'text-anchor': 'middle', class: 'ai-ax' }, t + ' %'));
      svg.append(S('line', { x1: X(5.10), x2: X(5.10), y1: M.t, y2: H - M.b, stroke: INK, 'stroke-dasharray': '4 3', 'stroke-opacity': 0.5 }), S('text', { x: X(5.10) + 4, y: M.t - 5, class: 'ai-ax', fill: INK }, '10-year Treasury 5.10 %'));
      let y = M.t; const pos = {};
      for (const tier of tiers) {
        svg.append(S('rect', { x: 0, y: y + 2, width: w, height: rowH - 4, fill: '#f4f6fb' }), S('text', { x: 8, y: y + rowH / 2 + 4, class: 'ai-tier', fill: TCOL[tier] }, tier));
        y += rowH;
        for (const r of L.filter((q) => q.tier === tier)) { pos[r.id] = y + rowH / 2; y += rowH; }
      }
      for (const r of L) {
        const yy = pos[r.id];
        svg.append(S('text', { x: narrow ? 8 : M.l - 10, y: narrow ? yy - 5 : yy + 4, 'text-anchor': narrow ? 'start' : 'end', class: 'ai-rl' }, r.name)); const my = narrow ? yy + 9 : yy;
        if (r.pair && pos[r.pair]) { const p = L.find((q) => q.id === r.pair); svg.append(S('line', { x1: X(p.rate), x2: X(r.rate), y1: pos[p.id] + (narrow ? 9 : 0), y2: my, stroke: TCOL[r.tier], 'stroke-width': 2, 'stroke-opacity': 0.5, 'stroke-dasharray': '3 2' })); }
        const c = TCOL[r.tier], x = X(r.rate);
        const mark = r.kind === 'coupon' ? S('circle', { cx: x, cy: my, r: 6, fill: c }) : r.kind === 'floating' ? S('rect', { x: x - 5.5, y: my - 5.5, width: 11, height: 11, fill: c }) : S('path', { d: `M${x} ${my - 7}L${x + 7} ${my}L${x} ${my + 7}L${x - 7} ${my}z`, fill: c });
        svg.append(mark, S('text', { x: x + 11, y: my + 4, class: 'ai-val' }, (+r.rate.toFixed(3)).toString() + ' %' + (r.approx ? ' ≈' : '')));
        const hit = S('rect', { x: 0, y: yy - rowH / 2, width: w, height: rowH, fill: 'transparent' });
        hit.addEventListener('mousemove', (ev) => showTip(ev, `<b>${r.name}</b><table><tr><td>${r.kind === 'coupon' ? 'coupon' : r.kind === 'floating' ? 'all-in rate' : 'yield'}</td><td>${r.rate} %${r.approx ? ' (approx.)' : ''}</td></tr><tr><td>as of</td><td>${r.asof}</td></tr>${r.rating ? `<tr><td>rating</td><td>${r.rating}</td></tr>` : ''}</table>${r.computed ? '<span>computed: Treasury yield on the day plus the new-issue spread</span><br>' : ''}<span>${ref(r.ref)}</span>`));
        hit.addEventListener('mouseleave', hideTip);
        svg.append(hit);
      }
      stage.replaceChildren(svg);
    }
    observe(stage, (w) => draw(w));
  }

  // ================================================================== deals table
  function dealsWidget(root) {
    const D = DATA.deals, st = { type: 'all', key: 'date', dir: -1 };
    const { ctrl, stage, legend } = frame(root, 'table');
    const T = { ig: ['Investment-grade bonds', BLUE], off: ['Off balance sheet', TEAL], neo: ['High yield and lab-adjacent', WARM], loan: ['Bank loans', GREY] };
    ctrl.append(lbl('Type'), seg([['all', 'All'], ...Object.entries(T).map(([k, v]) => [k, v[0]])], st.type, (v) => { st.type = v; draw(); }));
    legend.replaceChildren(h('span', { class: 'bx-hint' }, 'Click a column heading to sort. Sizes are as reported on the date of the deal, in US dollars.'));
    function draw() {
      const rows = D.filter((d) => st.type === 'all' || d[6] === st.type).slice().sort((a, b) => {
        const k = { date: 0, name: 1, size: 3 }[st.key]; const x = a[k], y = b[k];
        return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * st.dir;
      });
      const th = (key, label, cls) => h('th', { class: (cls || '') + (st.key === key ? ' on' : ''), onclick: () => { st.dir = st.key === key ? -st.dir : (key === 'name' ? 1 : -1); st.key = key; draw(); } }, label + (st.key === key ? (st.dir < 0 ? ' ↓' : ' ↑') : ''));
      const table = h('table', { class: 'ai-tab' }, h('thead', {}, h('tr', {}, th('date', 'Date'), th('name', 'Borrower'), h('th', {}, 'Instrument'), th('size', 'Size', 'r'), h('th', {}, 'Price'), h('th', {}, 'Demand and notes'))),
        h('tbody', {}, ...rows.map((d) => h('tr', {}, h('td', { class: 'mono' }, d[0]), h('td', {}, h('i', { class: 'dot', style: 'background:' + T[d[6]][1] }), d[1]), h('td', {}, d[2]), h('td', { class: 'r mono' }, '$' + d[3] + ' bn'), h('td', {}, d[4]), h('td', {}, d[5], ' ', h('a', { href: '#r-' + d[7], class: 'rf' }, '[' + sh(d[7]) + ']'))))));
      stage.replaceChildren(h('div', { class: 'ai-tabwrap' }, table));
    }
    draw();
  }

  // ================================================================== rates and spreads
  function ratesWidget(root) {
    const R = DATA.fred, G = DATA.grid.map(ts), st = { range: root.dataset.range || '3y', on: new Set(['DGS10', 'DGS30', 'IG_OAS', 'HY_OAS', 'BBB_OAS']) };
    const { ctrl, stage, legend } = frame(root, 'time series');
    const SER = {
      DGS30: ['30-year Treasury', INK, 'y'], DGS10: ['10-year Treasury', BLUE, 'y'], DGS2: ['2-year Treasury', TEAL, 'y'], FEDFUNDS: ['Fed funds rate (monthly mean)', GREY, 'y'],
      TP10: ['10-year term premium (NY Fed)', VIOLET, 't'], IG_OAS: ['Investment-grade spread (all)', BLUE, 's'], BBB_OAS: ['BBB spread', GOLD, 's'], HY_OAS: ['High-yield spread', WARM, 's'],
    };
    ctrl.append(lbl('Range'), seg([['1y', 'One year'], ['3y', 'Three years'], ['all', 'Since 2019']], st.range, (v) => { st.range = v; draw(); }));
    ctrl.append(chips(Object.entries(SER).map(([k, v]) => [k, v[0], v[1]]), st.on, () => draw()));
    legend.replaceChildren(...[]);
    const evs = DATA.events.map(([d, n], i) => [ts(d), n, String(i + 1)]);
    function draw(w) {
      w = w || draw.w || 640; draw.w = w;
      const t1 = G[G.length - 1], t0 = st.range === 'all' ? G[0] : t1 - (st.range === '1y' ? 1 : 3) * 365.25 * 864e5;
      const mk = (k) => ({ k, name: SER[k][0], c: SER[k][1], x: G, y: R[k], dash: k === 'FEDFUNDS' ? '2 3' : null, fmt: SER[k][2] !== 's' ? (v) => v.toFixed(2) + ' %' : (v) => (v * 100).toFixed(0) + ' bp' });
      const ts_ = Object.keys(SER).filter((k) => SER[k][2] === 't' && st.on.has(k)).map(mk), ys = Object.keys(SER).filter((k) => SER[k][2] === 'y' && st.on.has(k)).map(mk), ss = Object.keys(SER).filter((k) => SER[k][2] === 's' && st.on.has(k)).map(mk);
      const yrs = []; for (let y = 2019; y <= 2026; y++) for (const m of (st.range === 'all' ? [0] : [0, 3, 6, 9])) yrs.push([Date.UTC(y, m, 1), m === 0 ? String(y) : MON[m]]);
      const panels = [];
      if (ys.length) panels.push({ h: ss.length || ts_.length ? 180 : 300, ymin: st.range === 'all' ? 0 : 2.5, ymax: 6, ticks: st.range === 'all' ? [0, 2, 4, 6] : [3, 4, 5, 6], yfmt: (v) => v + ' %', series: ys, title: 'Yields and policy rate' });
      if (ts_.length) panels.push({ h: 110, ymin: -1.5, ymax: 1.5, ticks: [-1, 0, 1], yfmt: (v) => v + ' %', series: ts_, title: 'Term premium: what investors ask for holding ten-year bonds' });
      if (ss.length) {
        const sx = ss.map((s) => s.k);
        panels.push({ h: ys.length ? 130 : 300, ymin: 0, ymax: sx.includes('HY_OAS') ? 5 : 2, yfmt: (v) => (v * 100).toFixed(0) + ' bp', series: ss, title: 'Spread over Treasuries (ICE BofA indices; data from Oct 2023)' });
      }
      if (!panels.length) { stage.replaceChildren(h('p', { class: 'bx-note' }, 'Switch at least one series on.')); return; }
      timeChart(stage, { w, panels, x0: t0, x1: t1, xticks: yrs, events: evs, hover: fdate, aria: 'Treasury yields and credit spreads' });
      stage.append(h('div', { class: 'ai-evlist' }, ...evs.map(([, n, i]) => h('span', {}, h('b', {}, i), ' ' + n))));
    }
    observe(stage, (w) => draw(w));
  }

  // ================================================================== calculator
  function calcWidget(root) {
    const st = { capex: 750, life: 6, r: 8, margin: 60, mode: 'one' };
    const { ctrl, stage, legend } = frame(root, 'calculator');
    const sl = (key, label, min, max, step, unit) => {
      const out = h('b', { class: 'ai-sv' }, st[key] + unit), inp = h('input', { type: 'range', min, max, step, value: st[key], class: 'bx-range', 'aria-label': label });
      inp.addEventListener('input', () => { st[key] = +inp.value; out.textContent = st[key] + unit; draw(); });
      return h('label', { class: 'ai-sl' }, h('span', { class: 'bx-lbl' }, label), inp, out);
    };
    ctrl.append(sl('capex', 'Capex per year', 200, 1500, 25, ' bn'), sl('life', 'Useful life', 2, 15, 1, ' y'), sl('r', 'Required return', 4, 15, 0.5, ' %'), sl('margin', 'Gross margin', 30, 90, 5, ' %'),
      seg([['one', 'One year of spending'], ['all', 'Spending every year'] ], st.mode, (v) => { st.mode = v; draw(); }));
    legend.replaceChildren(h('span', { class: 'bx-hint' }, 'Defaults: $750 bn a year (roughly the four clouds\' 2026 guidance), six-year life, 8 % required return, 60 % gross margin on AI services.'));
    const REF = [['Anthropic run rate (Jul 2026)', 65, TEAL], ['OpenAI 2026 forecast', 36, TEAL], ['Google Cloud, Q2 × 4', 99, BLUE], ['AWS, Q2 × 4', 169, BLUE], ['Azure ("above $100 bn")', 100, BLUE]];
    function draw() {
      const r = st.r / 100, L = st.life, a = r / (1 - Math.pow(1 + r, -L)); // annuity factor
      const annualCost = st.capex * a * (st.mode === 'one' ? 1 : L);
      const rev = annualCost / (st.margin / 100);
      const dep = st.capex / L;
      const mx = Math.max(rev, ...REF.map((x) => x[1])) * 1.1;
      const bar = (name, v, c, strong) => h('div', { class: 'ai-row' + (strong ? ' strong' : '') }, h('span', { class: 'nm' }, name), h('div', { class: 'barwrap' }, h('div', { class: 'ai-stack' }, h('i', { style: `width:${(v / mx) * 100}%;background:${c}` }))), h('span', { class: 'v' }, usd(v)));
      stage.replaceChildren(
        h('div', { class: 'ai-calc' },
          h('p', { class: 'ai-big' }, h('b', {}, usd(rev)), st.mode === 'one' ? ' of AI revenue a year, for the life of the assets, to earn the required return on one year of spending' : ' of AI revenue a year to earn the required return if the spending is repeated every year'),
          h('p', { class: 'bx-note' }, `Capital charge per year: ${usd(annualCost)} (annuity factor ${f2(a)} per dollar over ${L} years at ${st.r} %${st.mode === 'all' ? ', times ' + L + ' overlapping vintages' : ''}); straight-line depreciation alone would be ${usd(dep * (st.mode === 'one' ? 1 : L))}.`),
          bar('Revenue needed', rev, WARM, true), ...REF.map(([n, v, c]) => bar(n, v, c))),
        note('Reference bars: Anthropic and OpenAI as in the text; the cloud figures are the quarter\'s revenue times four and include all cloud work, not only AI.'));
    }
    draw();
  }

  // ================================================================== nasdaq
  function nasdaqWidget(root) {
    const N = DATA.nasdaq, st = { v: root.dataset.view || 'boom' };
    const { ctrl, stage, legend } = frame(root, 'time series');
    ctrl.append(lbl('View'), seg([['boom', 'Boom against boom'], ['long', 'Long run, log scale']], st.v, (v) => { st.v = v; legs(); draw(); }));
    const legs = () => legend.replaceChildren(...(st.v === 'boom' ? swatch([['From Aug 1995 (Netscape\'s IPO) = 100', WARM], ['From Nov 2022 (ChatGPT) = 100', BLUE]]) : swatch([['Nasdaq Composite, month-end', INK]])));
    legs();
    const months = N.m.map(ts), vals = N.v.concat([]);
    // the last day replaces the last month-end if newer
    const lastT = ts(N.last[0]);
    if (lastT > months[months.length - 1]) { months.push(lastT); vals.push(N.last[1]); }
    const idx = (d) => months.findIndex((t) => t >= ts(d));
    const A = idx('1995-08-01'), B = idx('2022-11-01');
    function draw(w) {
      w = w || draw.w || 640; draw.w = w;
      if (st.v === 'boom') {
        const ser = (i0, name, c, n) => { const x = [], y = []; for (let i = i0; i < months.length && i - i0 <= n; i++) { x.push(i - i0); y.push((vals[i] / vals[i0]) * 100); } return { name, c, x, y, w: 2.4, fmt: (v) => f0(v) }; };
        const dot = ser(A, 'Nasdaq from Aug 1995 (Netscape\'s IPO) = 100', WARM, 80), ai = ser(B, 'Nasdaq from Nov 2022 (ChatGPT) = 100', BLUE, 80);
        const nowM = ai.x[ai.x.length - 1];
        timeChart(stage, { w, x0: 0, x1: 80, xticks: [0, 12, 24, 36, 48, 60, 72].map((m) => [m, m ? m + ' mo' : 'start']), hover: (x) => `${x} months after the start`,
          panels: [{ h: 300, log: true, ymin: 80, ymax: 700, ticksLog: [100, 200, 300, 500, 700], yfmt: (v) => v, series: [dot, ai] }],
          events: [[nowM, `Today: month ${nowM}. The 2000 peak came at month ${dot.x[dot.y.indexOf(Math.max(...dot.y))]}.`, '▶']] });
      } else {
        timeChart(stage, { w, x0: months[0], x1: months[months.length - 1], xticks: [1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025].map((y) => [Date.UTC(y, 0, 1), String(y)]), hover: fmon,
          panels: [{ h: 300, log: true, ymin: 400, ymax: 40000, ticksLog: [500, 1000, 2000, 5000, 10000, 20000], yfmt: (v) => f0(v), series: [{ name: 'Nasdaq Composite, month-end', c: INK, x: months, y: vals, w: 1.8, fmt: f0 }] }],
          events: [[ts(N.peak2000[0]), `Peak ${f0(N.peak2000[1])} on ${N.peak2000[0]}`, '1'], [ts(N.trough2002[0]), `Trough ${f0(N.trough2002[1])} on ${N.trough2002[0]}: ${Math.round((1 - N.trough2002[1] / N.peak2000[1]) * 100)} % below the peak`, '2'], [ts(N.peak2026[0]), `Record close ${f0(N.peak2026[1])} on ${N.peak2026[0]}`, '3']] });
        stage.append(h('div', { class: 'ai-evlist' }, ...[['1', `Peak ${f0(N.peak2000[1])} (${N.peak2000[0]})`], ['2', `Trough ${f0(N.trough2002[1])} (${N.trough2002[0]}), ${Math.round((1 - N.trough2002[1] / N.peak2000[1]) * 100)} % below the peak`], ['3', `Record close ${f0(N.peak2026[1])} (${N.peak2026[0]})`]].map(([i, t]) => h('span', {}, h('b', {}, i), ' ' + t))));
      }
    }
    observe(stage, (w) => draw(w));
  }

  // ================================================================== sovereign yields
  function sovWidget(root) {
    const S1 = DATA.sov, isos = Object.keys(S1);
    const COLS = { USA: INK, DEU: TEAL, GBR: BLUE, JPN: WARM, FRA: VIOLET, ITA: GOLD, ESP: '#b3447a', NLD: '#5b8def', CAN: '#7a8a2a', AUS: '#c96b00', KOR: '#2a8a6a', CHE: GREY };
    const st = { on: new Set(['USA', 'DEU', 'GBR', 'JPN', 'FRA', 'ITA']), buy: 36 }; // buy: index into dates
    const dates = S1.USA.d, N = dates.length;
    st.buy = dates.indexOf('2021-12-01');
    const { ctrl, stage, legend } = frame(root, 'time series + table');
    ctrl.append(chips(isos.map((k) => [k, S1[k].n, COLS[k]]), st.on, () => draw()));
    const slider = h('input', { type: 'range', min: 0, max: N - 13, step: 1, value: st.buy, class: 'bx-range', style: 'width:220px', 'aria-label': 'purchase month' });
    const sout = h('b', { class: 'ai-sv' });
    const upd = () => { st.buy = +slider.value; sout.textContent = fmon(ts(dates[st.buy])); drawTable(); };
    slider.addEventListener('input', upd);
    const chart = h('div', {}), tab = h('div', { class: 'ai-sovtab' });
    stage.append(chart, h('div', { class: 'ai-sl2' }, h('span', { class: 'bx-lbl' }, 'Bought a 10-year bond at par in'), slider, sout), tab);
    legend.replaceChildren(h('span', { class: 'bx-hint' }, 'OECD long-term (about ten-year) government bond yields, monthly, via FRED; latest month shown. Interest and debt from the national-budgets article\'s dataset (IMF/Eurostat), latest year there.'));
    const price = (c, m, y) => { y /= 100; if (Math.abs(y) < 1e-9) return c * m + 100; return c * (1 - Math.pow(1 + y, -m)) / y + 100 * Math.pow(1 + y, -m); };
    function drawChart(w) {
      const ser = isos.filter((k) => st.on.has(k)).map((k) => ({ name: S1[k].n, c: COLS[k], x: S1[k].d.map(ts), y: S1[k].y, w: 2, fmt: (v) => v.toFixed(2) + ' %' }));
      const t0 = ts(dates[0]), t1 = ts(dates[N - 1]);
      timeChart(chart, { w, x0: t0, x1: t1, xticks: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((y) => [Date.UTC(y, 0, 1), String(y)]), hover: fmon,
        panels: [{ h: 280, ymin: -1, ymax: 6, ticks: [-1, 0, 1, 2, 3, 4, 5, 6], yfmt: (v) => v + ' %', series: ser }] });
    }
    function drawTable() {
      const i0 = st.buy, k = (N - 1 - i0) / 12, m = Math.max(10 - k, 0.5);
      const rows = isos.map((iso) => {
        const s = S1[iso], y0 = s.y[i0], y1 = s.y[s.y.length - 1], c = Math.max(y0, 0), p0 = price(c, 10, y0), p1 = price(c, m, y1);
        return { iso, n: s.n, y0, y1, ch: (p1 / p0 - 1) * 100, int: s.int, ie: s.int_year, debt: s.debt };
      }).sort((a, b) => a.ch - b.ch);
      const mn = Math.min(...rows.map((r) => r.ch), -1);
      tab.replaceChildren(h('div', { class: 'ai-tabwrap' }, h('table', { class: 'ai-tab' }, h('thead', {}, h('tr', {}, h('th', {}, 'Country'), h('th', { class: 'r' }, 'Yield then'), h('th', { class: 'r' }, 'Yield now'), h('th', {}, 'Price of the bond today (per 100 paid), change'), h('th', { class: 'r' }, 'Interest bill, % GDP'), h('th', { class: 'r' }, 'Debt, % GDP'))),
        h('tbody', {}, ...rows.map((r) => h('tr', {}, h('td', {}, h('i', { class: 'dot', style: 'background:' + COLS[r.iso] }), r.n), h('td', { class: 'r mono' }, r.y0.toFixed(2) + ' %'), h('td', { class: 'r mono' }, r.y1.toFixed(2) + ' %'),
          h('td', {}, h('div', { class: 'ai-mini' }, h('i', { style: `width:${Math.min(100, Math.abs(Math.min(r.ch, 0)) / Math.abs(mn) * 100)}%;background:${r.ch < 0 ? WARM : TEAL}` }), h('b', {}, (r.ch > 0 ? '+' : '') + r.ch.toFixed(1) + ' %'))),
          h('td', { class: 'r mono' }, r.int != null ? r.int.toFixed(1) : '–'), h('td', { class: 'r mono' }, r.debt != null ? Math.round(r.debt) : '–')))))),
        note(`A 10-year bond bought at par in ${fmon(ts(dates[i0]))} with a coupon equal to that month's yield (zero if the yield was negative), priced today with ${m.toFixed(1)} years left. Price change only, coupons received are not counted; annual coupons, no tax, no currency. It shows why a rise in yields is a fall in price: roughly the remaining duration times the change in yield.`));
    }
    sout.textContent = fmon(ts(dates[st.buy]));
    function draw(w) { drawChart(w || draw.w || 640); draw.w = w || draw.w; drawTable(); }
    observe(stage, (w) => draw(w));
  }

  // ------------------------------------------------------------------ boot
  const WIDGETS = { capex: capexWidget, labs: labsWidget, web: webWidget, commit: commitWidget, curves: curvesWidget, ladder: ladderWidget, deals: dealsWidget, rates: ratesWidget, calc: calcWidget, nasdaq: nasdaqWidget, sov: sovWidget };
  for (const r of roots) { const w = WIDGETS[r.dataset.ai]; if (w) lazy(r, w); }
})();
