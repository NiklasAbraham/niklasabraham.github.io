// Interactive figures of the bonds section of the national-budget long read (section 19): 10-year yields since 2005
// with dated events, debt and interest in dollars, who holds the debt in four countries, and an r-minus-g calculator.
// Data: assets/budget-article/bonds.json, made by bin/budget_article/bonds/process.py (OECD yields via FRED, IMF WEO,
// US Treasury FiscalData, Federal Reserve Z.1, hand-checked holder tables). Every figure is a <figure data-bx="...">
// (kinds yields, stock, holders, rg) that this script fills when it scrolls into view. Vanilla SVG/HTML, no library,
// nothing leaves the page. The frame, buttons and tooltip are the .bx-* styles of the budget post.
(function () {
  'use strict';
  const KINDS = ['yields', 'stock', 'holders', 'rg'];
  const roots = [...document.querySelectorAll('[data-bx]')].filter((el) => KINDS.includes(el.dataset.bx));
  if (!roots.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#04204B', MUTED = '#6b7280', RULE = '#dfe4ee', BLUE = '#0b4fc0', WARM = '#b4552f', TEAL = '#138374', VIOLET = '#6a47c2', GREY = '#8a93a6', GOLD = '#a47a00', GREEN = '#1baf7a';
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
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const f0 = (v) => (v == null ? '–' : Math.round(v).toLocaleString('en-US'));
  const f1 = (v) => (v == null ? '–' : v.toFixed(1));
  const f2 = (v) => (v == null ? '–' : v.toFixed(2));
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmonth = (ym) => MON[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4);
  const bn = (v) => (v == null ? '–' : v >= 1000 ? '$' + (v / 1000).toFixed(v >= 10000 ? 1 : 2) + ' trn' : v >= 10 ? '$' + Math.round(v).toLocaleString('en-US') + ' bn' : '$' + v.toFixed(1) + ' bn');
  const escapeHtml = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function niceTicks(lo, hi, n) {
    const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag, out = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-6; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function observe(el, fn) {
    let w = 0;
    const ro = new ResizeObserver(() => { const nw = Math.round(el.getBoundingClientRect().width); if (nw && nw !== w) { w = nw; fn(w); } });
    ro.observe(el);
  }

  const NAMES = {
    USA: ['United States', 'Americas'], CAN: ['Canada', 'Americas'], MEX: ['Mexico', 'Americas'], BRA: ['Brazil', 'Americas'], GBR: ['United Kingdom', 'Europe'], DEU: ['Germany', 'Europe'],
    FRA: ['France', 'Europe'], ITA: ['Italy', 'Europe'], ESP: ['Spain', 'Europe'], NLD: ['Netherlands', 'Europe'], POL: ['Poland', 'Europe'], SWE: ['Sweden', 'Europe'], NOR: ['Norway', 'Europe'],
    DNK: ['Denmark', 'Europe'], FIN: ['Finland', 'Europe'], IRL: ['Ireland', 'Europe'], GRC: ['Greece', 'Europe'], CHE: ['Switzerland', 'Europe'], UKR: ['Ukraine', 'Europe'], RUS: ['Russia', 'Europe'],
    TUR: ['Türkiye', 'Middle East & Africa'], ISR: ['Israel', 'Middle East & Africa'], SAU: ['Saudi Arabia', 'Middle East & Africa'], ARE: ['United Arab Emirates', 'Middle East & Africa'],
    ZAF: ['South Africa', 'Middle East & Africa'], CHN: ['China', 'Asia-Pacific'], JPN: ['Japan', 'Asia-Pacific'], KOR: ['South Korea', 'Asia-Pacific'], IND: ['India', 'Asia-Pacific'],
    IDN: ['Indonesia', 'Asia-Pacific'], THA: ['Thailand', 'Asia-Pacific'], SGP: ['Singapore', 'Asia-Pacific'], AUS: ['Australia', 'Asia-Pacific'],
  };
  const SHORT = { USA: 'US', GBR: 'UK', ZAF: 'S. Africa', KOR: 'S. Korea', NLD: 'Netherlands', CHE: 'Switzerland' };
  const nm = (iso) => NAMES[iso][0];
  const RCOL = { Europe: '#2a78d6', Americas: '#eb6834', 'Asia-Pacific': '#1baf7a', 'Middle East & Africa': '#e87ba4' };

  let DATA = null;
  const load = () => DATA ? Promise.resolve(DATA) : (load.p = load.p || fetch(BASE + 'bonds.json').then((r) => { if (!r.ok) throw new Error('bonds.json: ' + r.status); return r.json(); }).then((d) => (DATA = d)));

  // tooltip, frame and controls: the budget article's look
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
    root.classList.add('concept', 'bx', 'bd');
    const title = root.dataset.title, cap = root.dataset.caption;
    root.innerHTML = '';
    const ctrl = h('div', { class: 'bx-ctrl' }), stage = h('div', { class: 'bx-stage' }), legend = h('div', { class: 'bx-legend' });
    root.append(h('header', {}, h('span', { class: 'concept-kind' }, kind), h('span', { class: 'concept-title' }, title)), ctrl, stage, legend);
    if (cap) root.append(h('figcaption', {}, cap));
    return { ctrl, stage, legend };
  }
  const lbl = (t) => h('span', { class: 'bx-lbl' }, t);
  const setSeg = (wrap, v) => [...wrap.children].forEach((b) => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); });
  function seg(options, current, onPick) {
    const wrap = h('span', { class: 'bx-seg' });
    for (const [v, label] of options) {
      wrap.append(h('button', { type: 'button', class: v === current ? 'on' : '', 'aria-pressed': v === current ? 'true' : 'false', 'data-v': v, onclick: () => { onPick(v); setSeg(wrap, v); } }, label));
    }
    return wrap;
  }
  const note = (t) => h('p', { class: 'bx-note' }, t);
  function lazy(root, fn) {
    const go = () => load().then(() => fn(root)).catch((e) => { console.error(e); root.append(h('p', { class: 'bx-err' }, 'This figure failed to load: ' + e.message)); });
    if (!('IntersectionObserver' in window)) return go();
    root.classList.add('concept', 'bx', 'bd');
    root.append(h('div', { class: 'bd-wait' }, 'loading …'));
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: '700px 0px' });
    io.observe(root);
  }

  // ================================================================== 10-year yields
  // Events are dated in the primary source named in `ref` (a key of _data/budget_article/refs.yml; the anchor is #rb-<key>).
  const EVENTS = [
    { d: '2012-03-15', n: 'Mar 2012', t: 'Greek private creditors exchange about 97 % of their bonds at a 53.5 % cut of face value', ref: 'esm-psi', rl: 'ESM' },
    { d: '2012-07-26', n: '26 Jul 2012', t: 'Draghi: "the ECB is ready to do whatever it takes to preserve the euro"', ref: 'ecb-draghi', rl: 'ECB' },
    { d: '2012-09-06', n: '6 Sep 2012', t: 'ECB announces Outright Monetary Transactions, with "no ex ante quantitative limits"', ref: 'ecb-omt', rl: 'ECB' },
    { d: '2022-09-23', n: '23 Sep 2022', t: 'UK growth plan; the Bank of England buys long gilts from 28 Sep to 14 Oct', ref: 'boe-cunliffe', rl: 'Bank of England' },
    { d: '2025-05-16', n: '16 May 2025', t: "Moody's cuts the US from Aaa to Aa1", ref: 'moodys-us', rl: "Moody's" },
  ];
  // The month containing the day 'YYYY-MM-DD' as a fractional grid index
  function gridPos(grid, d) {
    const i = grid.indexOf(d.slice(0, 7));
    return i < 0 ? null : i + (+d.slice(8, 10) - 1) / 30;
  }
  const YC = { USA: INK, DEU: TEAL, ITA: GOLD, GBR: BLUE, JPN: WARM, FRA: VIOLET, ESP: '#b3447a', GRC: '#c0392b', CAN: '#7a8a2a', AUS: '#c96b00', KOR: '#2a8a6a', CHE: GREY, NLD: '#5b8def', POL: '#8e44ad', MEX: '#d35400', ZAF: '#16a085', SWE: '#2980b9', NOR: '#7f8c8d', DNK: '#c2185b', FIN: '#6d4c41', IRL: '#388e3c', ISR: '#5d6d7e' };

  function yieldsWidget(root) {
    const D = DATA, G = D.grid, isos = Object.keys(D.yields);
    const st = { on: new Set((root.dataset.countries || 'USA,DEU,ITA,GBR,JPN,FRA').split(',').filter((c) => D.yields[c])), mode: 'level', from: 'all' };
    const { ctrl, stage, legend } = frame(root, 'time series');
    const modeSeg = seg([['level', 'Yield'], ['spread', 'Spread to Germany']], st.mode, (v) => { st.mode = v; chipSync(); draw(); });
    const fromSeg = seg([['all', 'Since 2005'], ['2019', 'Since 2019']], st.from, (v) => { st.from = v; draw(); });
    ctrl.append(lbl('Show'), modeSeg, lbl('From'), fromSeg);
    const chipWrap = h('div', { class: 'bx-chips' });
    const chipEls = {};
    for (const iso of isos) {
      const b = h('button', { type: 'button', class: 'bx-chip' + (st.on.has(iso) ? ' on' : ''), 'aria-pressed': st.on.has(iso) ? 'true' : 'false', onclick: () => { if (st.mode === 'spread' && iso === 'DEU') return; if (st.on.has(iso)) st.on.delete(iso); else st.on.add(iso); chipSync(); draw(); } }, h('i', { style: 'background:' + (YC[iso] || GREY) }), nm(iso));
      chipEls[iso] = b; chipWrap.append(b);
    }
    function chipSync() {
      for (const iso of isos) {
        const dis = st.mode === 'spread' && iso === 'DEU';
        chipEls[iso].classList.toggle('on', st.on.has(iso) && !dis);
        chipEls[iso].setAttribute('aria-pressed', st.on.has(iso) && !dis ? 'true' : 'false');
        chipEls[iso].disabled = dis; chipEls[iso].classList.toggle('dis', dis);
      }
    }
    ctrl.after(chipWrap);
    const svgHost = h('div', {});
    stage.append(svgHost);
    const miss = D.missing_yields.map(nm).join(', ');
    const endNote = isos.filter((i) => D.yields[i].last[0] !== G[G.length - 1] + '-01').map((i) => nm(i) + ' ends ' + fmonth(D.yields[i].last[0])).join('; ');
    legend.replaceChildren(
      h('div', { class: 'bd-evlist' }, ...EVENTS.map((e, i) => h('span', {}, h('b', {}, i + 1), ' ', h('em', {}, e.n), ' ' + e.t + ' ', h('a', { href: '#rb-' + e.ref }, '[' + e.rl + ']')))),
      h('span', { class: 'bx-hint' }, `No series for ${miss}. ${endNote}.`));
    const valAt = (iso, i) => { const y = D.yields[iso].y[i]; return y == null ? null : (st.mode === 'spread' ? (D.yields.DEU.y[i] == null ? null : y - D.yields.DEU.y[i]) : y); };
    function draw(w) {
      w = w || draw.w || 640; draw.w = w;
      if (w < 240) return;
      const narrow = w < 560;
      const M = { l: 44, r: narrow ? 46 : 96, t: 34, b: 24 }, H = narrow ? 300 : 360, iw = w - M.l - M.r, ih = H - M.t - M.b;
      const i0 = st.from === '2019' ? G.indexOf('2019-01') : 0, i1 = G.length - 1;
      const X = (i) => M.l + ((i - i0) / (i1 - i0)) * iw;
      const show = [...st.on].filter((iso) => !(st.mode === 'spread' && iso === 'DEU'));
      let lo = 0, hi = st.mode === 'spread' ? 1 : 4;
      for (const iso of show) for (let i = i0; i <= i1; i++) { const v = valAt(iso, i); if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
      const pad = (hi - lo) * 0.06; lo = lo < 0 ? lo - pad : 0; hi += pad;
      const Y = (v) => M.t + ih - ((v - lo) / (hi - lo)) * ih;
      const svg = S('svg', { viewBox: `0 0 ${w} ${H}`, width: w, height: H, class: 'bd-svg', role: 'img', 'aria-label': 'Line chart of 10-year government bond yields' });
      for (const t of niceTicks(lo, hi, 5)) {
        svg.append(S('line', { x1: M.l, x2: w - M.r, y1: Y(t), y2: Y(t), stroke: t === 0 ? '#9aa4b8' : RULE, 'stroke-width': t === 0 ? 1.3 : 1 }), S('text', { x: M.l - 6, y: Y(t) + 3.5, 'text-anchor': 'end', class: 'bd-ax' }, (st.mode === 'spread' && t > 0 ? '+' : '') + (Math.abs(t) < 1e-9 ? 0 : t) + (st.mode === 'spread' ? '' : ' %')));
      }
      svg.append(S('text', { x: M.l, y: 12, class: 'bd-pt' }, st.mode === 'spread' ? '10-year yield minus Germany, percentage points' : '10-year yield, % a year'));
      const y0 = +G[i0].slice(0, 4), yEnd = +G[i1].slice(0, 4), step = st.from === '2019' ? 1 : (narrow ? 5 : 2);
      for (let y = Math.ceil(y0 / step) * step; y <= yEnd; y += step) { const i = G.indexOf(y + '-01'); if (i >= i0) svg.append(S('text', { x: X(i), y: H - 6, 'text-anchor': 'middle', class: 'bd-ax' }, y)); }
      // events
      EVENTS.forEach((e, k) => {
        const p = gridPos(G, e.d); if (p == null || p < i0) return;
        const g = S('g', { class: 'bd-ev', tabindex: 0, role: 'img', 'aria-label': e.n + ': ' + e.t });
        g.append(S('line', { x1: X(p), x2: X(p), y1: M.t - 6, y2: Y(lo), stroke: '#b4552f', 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.7 }), S('circle', { cx: X(p), cy: M.t - 14, r: 8, fill: WARM }), S('text', { x: X(p), y: M.t - 10.6, 'text-anchor': 'middle', class: 'bd-evn' }, k + 1));
        const evTip = (ev) => showTip(ev, `<b>${escapeHtml(e.n)}</b><br>${escapeHtml(e.t)}<br><span>source: ${escapeHtml(e.rl)}</span>`);
        g.addEventListener('mousemove', evTip); g.addEventListener('mouseleave', hideTip);
        g.addEventListener('focus', () => { const r = g.getBoundingClientRect(); evTip({ clientX: r.left, clientY: r.bottom }); }); g.addEventListener('blur', hideTip);
        svg.append(g);
      });
      const clipId = 'bdc' + Math.random().toString(36).slice(2, 8);
      svg.append(S('clipPath', { id: clipId }, S('rect', { x: M.l, y: M.t - 4, width: iw + 2, height: ih + 8 })));
      const lines = S('g', { 'clip-path': `url(#${clipId})` });
      const ends = [];
      for (const iso of show) {
        let d = '', pen = false, last = null;
        for (let i = i0; i <= i1; i++) {
          const v = valAt(iso, i);
          if (v == null) { pen = false; continue; }
          d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; last = [i, v];
        }
        lines.append(S('path', { d, fill: 'none', stroke: YC[iso] || GREY, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
        if (last) ends.push({ iso, y: Y(last[1]), x: X(last[0]), v: last[1] });
      }
      svg.append(lines);
      ends.sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
      for (const e of ends) svg.append(S('circle', { cx: e.x, cy: Y(e.v), r: 2.8, fill: YC[e.iso] || GREY }), S('text', { x: e.x + 6, y: e.y + 4, class: 'bd-end', fill: YC[e.iso] || GREY }, narrow ? e.iso : (SHORT[e.iso] || nm(e.iso))));
      // hover
      const cur = S('line', { y1: M.t, y2: Y(lo), stroke: INK, 'stroke-width': 1, opacity: 0 });
      svg.append(cur);
      const hit = S('rect', { x: M.l, y: M.t - 4, width: iw, height: ih + 8, fill: 'transparent' });
      const move = (ev) => {
        const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * (w / r.width);
        const i = clamp(Math.round(i0 + ((px - M.l) / iw) * (i1 - i0)), i0, i1);
        cur.setAttribute('x1', X(i)); cur.setAttribute('x2', X(i)); cur.setAttribute('opacity', 0.45);
        const rows = show.map((iso) => [iso, valAt(iso, i)]).filter((r2) => r2[1] != null).sort((a, b) => b[1] - a[1])
          .map(([iso, v]) => `<tr><td><i style="background:${YC[iso] || GREY}"></i>${escapeHtml(nm(iso))}</td><td>${st.mode === 'spread' ? (v > 0 ? '+' : '') + v.toFixed(2) + ' pp' : v.toFixed(2) + ' %'}</td></tr>`).join('');
        showTip(ev, `<b>${fmonth(G[i])}</b> <span>monthly average</span><table>${rows || '<tr><td>no data</td></tr>'}</table>`);
      };
      hit.addEventListener('mousemove', move); hit.addEventListener('touchstart', (e) => move(e.touches[0]), { passive: true }); hit.addEventListener('touchmove', (e) => move(e.touches[0]), { passive: true });
      hit.addEventListener('mouseleave', () => { hideTip(); cur.setAttribute('opacity', 0); });
      svg.append(hit);
      svgHost.replaceChildren(svg);
    }
    chipSync();
    observe(stage, (w) => draw(w));
  }

  // ================================================================== debt and interest in dollars
  function stockWidget(root) {
    const D = DATA, st = { m: 'debt', top: 12 };
    const { ctrl, stage, legend } = frame(root, 'bar chart');
    const mseg = seg([['debt', 'Debt (US$)'], ['int', 'Interest per year (US$)'], ['rate', 'Implied average rate']], st.m, (v) => { st.m = v; draw(); });
    const tseg = seg([['12', 'Top 12'], ['all', 'All 33']], '12', (v) => { st.top = v === 'all' ? 99 : 12; draw(); });
    ctrl.append(lbl('Measure'), mseg, lbl('Rows'), tseg);
    const isos = Object.keys(NAMES);
    const info = (iso) => {
      const dd = D.debt[iso], di = dd.years.length - 1, ii = D.interest[iso];
      const o = { iso, debt: dd.usd_bn[di], dy: dd.years[di], pct: dd.pct_gdp[di], gdp: dd.gdp_usd_bn[di] };
      if (ii) { const k = ii.years.length - 1; o.int = ii.usd_bn[k]; o.iy = ii.years[k]; o.ipct = ii.pct_gdp[k]; o.rate = ii.implied_rate_pct[k]; }
      return o;
    };
    const rows = isos.map(info);
    const rowsEl = h('div', { class: 'bd-bars' }), noteEl = h('div', {});
    stage.append(rowsEl, noteEl);
    legend.replaceChildren(...Object.entries(RCOL).map(([r, c]) => h('span', { class: 'bx-chip static' }, h('i', { style: 'background:' + c }), r)));
    const fmt = { debt: (r) => bn(r.debt), int: (r) => bn(r.int), rate: (r) => (r.rate == null ? '–' : f2(r.rate) + ' %') };
    function draw() {
      const key = st.m === 'debt' ? 'debt' : st.m === 'int' ? 'int' : 'rate';
      const have = rows.filter((r) => r[key] != null).sort((a, b) => b[key] - a[key]);
      const shown = have.slice(0, st.top), mx = Math.max(...shown.map((r) => r[key]));
      rowsEl.replaceChildren(...shown.map((r) => {
        const tipHtml = `<b>${escapeHtml(nm(r.iso))}</b><table><tr><td>Gross debt, end of ${r.dy}</td><td>${bn(r.debt)} (${f1(r.pct)} % of GDP)</td></tr>` +
          (r.int != null ? `<tr><td>Interest, all levels, ${r.iy}</td><td>${bn(r.int)} (${f2(r.ipct)} % of GDP)</td></tr><tr><td>Implied rate, ${r.iy}</td><td>${f2(r.rate)} %</td></tr>` : '<tr><td>Interest</td><td>no series</td></tr>') + '</table>';
        const row = h('div', { class: 'bd-row' }, h('span', { class: 'nm' }, nm(r.iso), (st.m !== 'debt' && r.iy !== 2025 ? h('small', {}, ' ' + r.iy) : null)),
          h('div', { class: 'tr' }, h('i', { style: `width:${Math.max(0.6, (r[key] / mx) * 100)}%;background:${RCOL[NAMES[r.iso][1]]}` })), h('span', { class: 'v' }, fmt[st.m](r)));
        row.addEventListener('mousemove', (ev) => showTip(ev, tipHtml)); row.addEventListener('mouseleave', hideTip);
        return row;
      }));
      const out = [];
      if (st.m === 'debt') out.push(note('General-government gross debt at the end of 2025 (IMF, partly estimates), in current US dollars, all levels of government as the IMF defines it; coverage differs between countries, and the figure includes debt held inside government. It is not the Treasury\'s number: for the United States see the table above (federal debt, October 2026).'));
      else {
        const us = D.us.interest_vs_defense_usd_bn, rawGap = rows.filter((r) => r.int == null).map((r) => nm(r.iso));
        if (st.m === 'int') out.push(note(`General-government interest (federal, state and local, gross of interest received), in the latest year each country has: ${rows.filter((r) => r.int != null).map((r) => r.iso + ' ' + r.iy).join(', ')}. For the United States this is ${bn(info('USA').int)} for calendar 2025; the Treasury's own federal "net interest" is ${bn(us.net_interest['2025'])} for fiscal year 2025 (to 30 September) and ${bn(us.net_interest['2026'])} for fiscal 2026. The two definitions must not be mixed.`));
        else out.push(note(`Interest divided by gross debt of the same year, both general government. Japan pays ${f2(info('JPN').rate)} % on its debt (${info('JPN').iy}), Brazil ${f2(info('BRA').rate)} % (${info('BRA').iy}), Türkiye ${f2(info('TUR').rate)} % (${info('TUR').iy}); the figure is an average over old and new bonds, not today's yield, and divides a flow by a stock.`));
        out.push(note(`No interest series: ${rawGap.join(', ')}.`));
      }
      noteEl.replaceChildren(...out);
    }
    draw();
  }

  // ================================================================== holders
  function holdersWidget(root) {
    const D = DATA, C = D.curated, U = D.us.holders_common_quarter_usd_bn;
    const CLS = [['cb', 'Central bank', WARM], ['for', 'Foreign / non-resident', BLUE], ['bank', 'Banks and money funds', TEAL], ['ins', 'Insurers and pension funds', VIOLET], ['ofin', 'Other financial', GOLD], ['hh', 'Households and other residents', GREEN], ['gov', 'Government accounts', GREY], ['oth', 'Remainder', '#c9d0dc']];
    const col = Object.fromEntries(CLS.map(([k, , c]) => [k, c])), cname = Object.fromEntries(CLS.map(([k, n]) => [k, n]));
    const J = C.JPN.holders, J_ = J.shares_pct, B = C.GBR.holders, I = C.ITA.holders.shares_pct;
    const pct = (a, tot) => (a / tot) * 100;
    const uTot = U.total, uRes = uTot - U.foreign - U.federal_reserve - U.agencies_and_trusts;
    const COUNTRIES = [
      { iso: 'JPN', scope: 'Japanese government bonds excluding bills', date: 'June 2026, preliminary', tot: `¥${f1(J.total_jgb)} trn`, src: 'Ministry of Finance Japan, from the Bank of Japan Flow of Funds', status: J.status,
        seg: [['cb', 'Bank of Japan', J_.boj, `¥${f1(J.boj)} trn`], ['bank', 'Banks (incl. Japan Post Bank, securities firms)', J_.banks, `¥${f1(J.banks)} trn`], ['ins', 'Insurers', J_.insurers, `¥${f1(J.insurers)} trn`], ['ins', 'Public pensions', J_.public_pensions, `¥${f1(J.public_pensions)} trn`],
          ['ins', 'Pension funds', J_.pension_funds, `¥${f1(J.pension_funds)} trn`], ['for', 'Foreigners', J_.foreigners, `¥${f1(J.foreigners)} trn`], ['hh', 'Households', J_.households, `¥${f1(J.households)} trn`], ['gov', 'General government', J_.general_government, `¥${f1(J.general_government)} trn`], ['oth', 'Others', J_.others, `¥${f1(J.others)} trn`]] },
      { iso: 'GBR', scope: 'gilts at market value', date: 'Q1 2026', tot: `£${f1(B.total / 1000)} bn`, src: 'UK Debt Management Office, from the Office for National Statistics', status: B.status,
        seg: [['cb', 'Bank of England (Asset Purchase Facility)', pct(B.bank_of_england_apf, B.total), `£${f1(B.bank_of_england_apf / 1000)} bn`], ['bank', 'Banks (monetary financial institutions)', pct(B.monetary_financial_institutions, B.total), `£${f1(B.monetary_financial_institutions / 1000)} bn`], ['ins', 'Insurers and pension funds', pct(B.insurers_pension_funds, B.total), `£${f1(B.insurers_pension_funds / 1000)} bn`],
          ['ofin', 'Other financial institutions', pct(B.other_financial, B.total), `£${f1(B.other_financial / 1000)} bn`], ['for', 'Overseas', pct(B.overseas, B.total), `£${f1(B.overseas / 1000)} bn`], ['hh', 'Households', pct(B.households, B.total), `£${f1(B.households / 1000)} bn`], ['oth', 'Local authorities', pct(B.local_authorities, B.total), `£${f1(B.local_authorities / 1000)} bn`]] },
      { iso: 'USA', scope: 'federal debt, all securities', date: 'Q1 2026', tot: bn(uTot), src: 'Federal Reserve Financial Accounts (Z.1) via FRED', status: 'data',
        seg: [['cb', 'Federal Reserve', pct(U.federal_reserve, uTot), bn(U.federal_reserve)], ['gov', 'Agencies and trust funds', pct(U.agencies_and_trusts, uTot), bn(U.agencies_and_trusts)], ['for', 'Foreign holders', pct(U.foreign, uTot), bn(U.foreign)], ['oth', 'Remainder: domestic private holders and others (total minus the three groups)', pct(uRes, uTot), bn(uRes)]] },
      { iso: 'ITA', scope: 'general-government debt', date: 'April 2026', tot: null, src: "Osservatorio CPI, from Banca d'Italia data of 15 July 2026", status: C.ITA.holders.status,
        seg: [['cb', 'Eurosystem', I.eurosystem, null], ['bank', 'Banks and money funds', I.banks_money_funds, null], ['ofin', 'Other financial institutions', I.other_financial, null], ['hh', 'Households and other residents', I.households_other_residents, null], ['for', 'Non-residents, net of the ECB', I.non_residents_net_of_ecb, null]] },
    ];
    const { stage, legend } = frame(root, 'stacked bars');
    legend.replaceChildren(...CLS.map(([, n, c]) => h('span', { class: 'bx-chip static' }, h('i', { style: 'background:' + c }), n)));
    const box = h('div', { class: 'bd-hold' });
    for (const c of COUNTRIES) {
      const total = c.seg.reduce((a, s) => a + s[2], 0);
      const bar = h('div', { class: 'bar', role: 'img', 'aria-label': nm(c.iso) + ': holders of government debt' });
      for (const [k, name, share, amt] of c.seg) {
        if (!(share > 0)) continue;
        const el = h('i', { style: `width:${(share / total) * 100}%;background:${col[k]}`, tabindex: 0 }, share >= 5 ? h('span', {}, f1(share)) : null);
        const t = (ev) => showTip(ev, `<b>${escapeHtml(name)}</b><br>${f1(share)} % of ${escapeHtml(c.scope)}${amt ? ' · ' + escapeHtml(amt) : ''}<br><span>${escapeHtml(nm(c.iso))}, ${escapeHtml(c.date)} · ${escapeHtml(cname[k])}</span>`);
        el.addEventListener('mousemove', t); el.addEventListener('mouseleave', hideTip); el.addEventListener('focus', () => { const r = el.getBoundingClientRect(); t({ clientX: r.left, clientY: r.bottom }); }); el.addEventListener('blur', hideTip);
        bar.append(el);
      }
      box.append(h('div', { class: 'bd-hrow' }, h('div', { class: 'who' }, h('b', {}, nm(c.iso)), h('small', {}, c.date)), bar,
        h('p', { class: 'meta' }, `${c.scope}${c.tot ? ', total ' + c.tot : ''}. Source: ${c.src} `, h('em', { class: 'st ' + c.status }, c.status))));
    }
    stage.append(box, note('Percentages of each country\'s own total; the categories are the closest common labels, and the definitions differ (for example "foreign" is overseas holders in the UK and Japan, foreign holders in the US, and non-residents net of the ECB in Italy). Segments under 5 % carry no label; hover or focus for names and amounts.'));
  }

  // ================================================================== r minus g
  function rgWidget(root) {
    const R = DATA.us_rg, ix = (y) => R.years.indexOf(y);
    const pre = (name, y, over) => ({ name, d: R.d[ix(y)], r: R.r[ix(y)], g: R.g[ix(y)], pb: R.pb[ix(y)], ...over });
    const PRESETS = [pre('US 2021', 2021), pre('US 2025', 2025), pre('2025 debt, r = 1 %, g = 4 %', 2025, { r: 1, g: 4 }), pre('2025 debt, r = 5 %, g = 4 %', 2025, { r: 5, g: 4 })];
    const st = { ...PRESETS[1] };
    const T = 30;
    const { ctrl, stage, legend } = frame(root, 'calculator');
    const sliders = {};
    const sl = (key, label, min, max, step, unit) => {
      const out = h('b', { class: 'bd-sv' }), inp = h('input', { type: 'range', min, max, step, class: 'bx-range', 'aria-label': label });
      const sync = () => { inp.value = st[key]; out.textContent = (key === 'pb' && st[key] > 0 ? '+' : '') + (+st[key]).toFixed(key === 'd' ? 1 : 2) + unit; };
      inp.addEventListener('input', () => { st[key] = +inp.value; sync(); draw(); });
      sliders[key] = sync; sync();
      return h('label', { class: 'bd-sl' }, h('span', { class: 'bx-lbl' }, label), inp, out);
    };
    ctrl.append(h('div', { class: 'bd-sliders' }, sl('d', 'Debt, % of GDP', 0, 250, 0.1, ' %'), sl('r', 'Interest rate r', 0, 12, 0.01, ' %'), sl('g', 'Nominal growth g', -2, 12, 0.01, ' %'), sl('pb', 'Primary balance, % of GDP', -12, 6, 0.01, ' %')));
    const chips = h('div', { class: 'bx-chips' }, lbl('Presets'), ...PRESETS.map((p) => h('button', { type: 'button', class: 'bx-chip', onclick: () => { Object.assign(st, { d: p.d, r: p.r, g: p.g, pb: p.pb }); Object.values(sliders).forEach((f) => f()); draw(); } }, p.name)));
    ctrl.after(chips);
    const out = h('div', { class: 'bd-out' }), svgHost = h('div', {}), tab = h('div', { class: 'bd-tabwrap' });
    stage.append(out, svgHost, tab);
    legend.replaceChildren(...[['Your primary balance', BLUE], ['Primary balance of zero', WARM], ['Debt-stabilising balance (flat)', GREY]].map(([n, c]) => h('span', { class: 'bx-chip static' }, h('i', { style: 'background:' + c }), n)),
      h('span', { class: 'bx-hint' }, 'd(t) = d(t-1)(1+r)/(1+g) - pb, the debt equation of section 03; r applies to the whole stock at once.'));
    // history table, IMF basis
    tab.append(h('table', { class: 'bd-tab' }, h('thead', {}, h('tr', {}, ['US, IMF basis', 'Debt, % GDP', 'r, %', 'g, %', 'Stabilising pb', 'Actual primary balance'].map((t, i) => h('th', { class: i ? 'r' : '' }, t)))),
      h('tbody', {}, ...R.years.map((y, k) => (y < 2021 ? null : h('tr', {}, h('td', {}, y), h('td', { class: 'r mono' }, f1(R.d[k])), h('td', { class: 'r mono' }, f2(R.r[k])), h('td', { class: 'r mono' }, f2(R.g[k])), h('td', { class: 'r mono' }, f1(R.pstar[k])), h('td', { class: 'r mono' }, f1(R.pb[k])))))) ),
      note(R.src.split(';')[0] + '. Stabilising pb = d (r - g)/(1 + g); negative means a primary deficit of that size keeps the ratio constant. The actual primary balance is the IMF\'s, net of interest received.'));
    const path = (pb) => { const a = [st.d]; for (let t = 1; t <= T; t++) a.push(a[t - 1] * (1 + st.r / 100) / (1 + st.g / 100) - pb); return a; };
    function draw(w) {
      w = w || draw.w || 640; draw.w = w;
      if (w < 240) return;
      const pstar = (st.d * (st.r - st.g) / 100) / (1 + st.g / 100), mine = path(st.pb), zero = path(0), end = mine[T];
      const dy = mine[1] - mine[0];
      out.replaceChildren(
        h('div', {}, h('span', { class: 'bx-lbl' }, 'Debt-stabilising primary balance'), h('b', { class: 'big' }, (pstar > 0 ? '+' : '') + f1(pstar) + ' % of GDP'), h('small', {}, pstar > 0 ? 'a surplus is needed just to stand still' : 'a primary deficit of this size keeps the ratio constant')),
        h('div', {}, h('span', { class: 'bx-lbl' }, 'Your balance, first year'), h('b', { class: 'big ' + (dy > 0.005 ? 'up' : 'dn') }, (dy > 0 ? '+' : '') + f1(dy) + ' points'), h('small', {}, 'change in the debt ratio in year 1')),
        h('div', {}, h('span', { class: 'bx-lbl' }, 'Debt ratio after 30 years'), h('b', { class: 'big' }, end > 1000 ? 'over 1,000 %' : end < 0 ? 'below zero (net creditor)' : f0(end) + ' %'), h('small', {}, `interest in year 1: ${f1(st.d * st.r / 100)} % of GDP`)));
      const narrow = w < 560, M = { l: 44, r: narrow ? 12 : 130, t: 14, b: 24 }, H = narrow ? 260 : 300, iw = w - M.l - M.r, ih = H - M.t - M.b;
      const vals = [...mine, ...zero, st.d];
      let hi = Math.min(Math.max(...vals) * 1.05, 400), lo = Math.min(0, Math.min(...vals) * 1.05, 0); hi = Math.max(hi, 50);
      const X = (t) => M.l + (t / T) * iw, Y = (v) => M.t + ih - ((clamp(v, lo, hi) - lo) / (hi - lo)) * ih;
      const svg = S('svg', { viewBox: `0 0 ${w} ${H}`, width: w, height: H, class: 'bd-svg', role: 'img', 'aria-label': 'Debt ratio over 30 years' });
      for (const t of niceTicks(lo, hi, 5)) svg.append(S('line', { x1: M.l, x2: w - M.r, y1: Y(t), y2: Y(t), stroke: t === 0 ? '#9aa4b8' : RULE }), S('text', { x: M.l - 6, y: Y(t) + 3.5, 'text-anchor': 'end', class: 'bd-ax' }, t + ' %'));
      for (let t = 0; t <= T; t += 5) svg.append(S('text', { x: X(t), y: H - 6, 'text-anchor': 'middle', class: 'bd-ax' }, t === 0 ? 'now' : '+' + t + ' y'));
      const clipId = 'bdr' + Math.random().toString(36).slice(2, 8);
      svg.append(S('clipPath', { id: clipId }, S('rect', { x: M.l, y: M.t - 2, width: iw + 1, height: ih + 4 })));
      const ls = S('g', { 'clip-path': `url(#${clipId})` });
      const line = (a, c, wd, dash) => S('path', { d: a.map((v, t) => (t ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(v).toFixed(1)).join(''), fill: 'none', stroke: c, 'stroke-width': wd, 'stroke-dasharray': dash || null, 'stroke-linejoin': 'round' });
      ls.append(line(Array(T + 1).fill(st.d), GREY, 1.6, '4 4'), line(zero, WARM, 2, '6 3'), line(mine, BLUE, 2.8));
      svg.append(ls);
      if (!narrow) svg.append(S('text', { x: X(T) + 6, y: Y(mine[T]) + 4, class: 'bd-end', fill: BLUE }, 'your balance'), S('text', { x: X(T) + 6, y: Y(zero[T]) + (Math.abs(Y(zero[T]) - Y(mine[T])) < 13 ? 15 : 4), class: 'bd-end', fill: WARM }, 'balance of zero'));
      const cur = S('line', { y1: M.t, y2: M.t + ih, stroke: INK, opacity: 0 });
      const hit = S('rect', { x: M.l, y: M.t, width: iw, height: ih, fill: 'transparent' });
      const move = (ev) => {
        const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * (w / r.width), t = clamp(Math.round(((px - M.l) / iw) * T), 0, T);
        cur.setAttribute('x1', X(t)); cur.setAttribute('x2', X(t)); cur.setAttribute('opacity', 0.45);
        showTip(ev, `<b>${t === 0 ? 'Now' : 'Year +' + t}</b><table><tr><td><i style="background:${BLUE}"></i>Your balance</td><td>${f1(mine[t])} %</td></tr><tr><td><i style="background:${WARM}"></i>Balance of zero</td><td>${f1(zero[t])} %</td></tr></table>`);
      };
      hit.addEventListener('mousemove', move); hit.addEventListener('touchstart', (e) => move(e.touches[0]), { passive: true }); hit.addEventListener('touchmove', (e) => move(e.touches[0]), { passive: true });
      hit.addEventListener('mouseleave', () => { hideTip(); cur.setAttribute('opacity', 0); });
      svg.append(cur, hit);
      svgHost.replaceChildren(svg);
    }
    observe(stage, (w) => draw(w));
  }

  // ------------------------------------------------------------------ boot
  const WIDGETS = { yields: yieldsWidget, stock: stockWidget, holders: holdersWidget, rg: rgWidget };
  for (const r of roots) lazy(r, WIDGETS[r.dataset.bx]);
})();
