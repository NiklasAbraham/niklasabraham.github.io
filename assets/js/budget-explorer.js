// Interactive figures of the national-budget long read: stacked comparison bars, a sankey from revenue to
// spending, a treemap deep dive, a side-by-side comparison, a time machine and a fiscal scatter.
// Data: assets/budget-article/budget.json, made by bin/budget_article/process.py from IMF, Eurostat, OECD and
// World Bank statistics. Every figure is a <figure data-bx="..."> that this script fills; nothing leaves the page.
(function () {
  'use strict';
  const roots = [...document.querySelectorAll('[data-bx]')];
  if (!roots.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#04204B', MUTED = '#6b7280', RULE = '#c9d0dc', BLUE = '#0b4fc0', WARM = '#b4552f';

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
  const f1 = (v) => (v == null ? '–' : v.toFixed(1));
  const f2 = (v) => (v == null ? '–' : v.toFixed(2));
  const usd = (v) => (v == null ? '–' : '$' + Math.round(v).toLocaleString('en-US'));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function nice(v) { // round up to a 1-2-5 step
    const e = Math.pow(10, Math.floor(Math.log10(v))), m = v / e;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e;
  }
  function ticks(max, n) {
    const step = nice(max / n), out = [];
    for (let v = 0; v <= max + 1e-9; v += step) out.push(v);
    return out;
  }
  function observe(el, fn) {
    let w = 0;
    const ro = new ResizeObserver(() => { const nw = Math.round(el.getBoundingClientRect().width); if (nw && nw !== w) { w = nw; fn(w); } });
    ro.observe(el);
  }
  const fmtMetric = { gdp: (v) => f1(v) + ' %', share: (v) => f1(v) + ' %', pc: usd };
  const METRIC_NAME = { gdp: '% of GDP', share: '% of the total', pc: 'PPP $ per person' };

  // ------------------------------------------------------------------ data
  const BASE = roots[0].dataset.base;
  const GCOL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
  const ECON = [
    { k: 'ben', name: 'Social benefits', info: 'pensions, unemployment and family benefits paid in cash or in kind' },
    { k: 'wage', name: 'Wages and salaries', info: 'compensation of government employees: teachers, nurses, soldiers, civil servants' },
    { k: 'goods', name: 'Goods and services', info: 'what government buys to run its services: supplies, rent, energy, contracted services' },
    { k: 'inv', name: 'Investment', info: 'net investment in roads, buildings, equipment' },
    { k: 'sub', name: 'Subsidies', info: 'payments to firms to lower their prices or support them' },
    { k: 'gr', name: 'Grants', info: 'transfers to other governments and international organisations' },
    { k: 'int', name: 'Interest', info: 'interest paid on public debt' },
    { k: 'oth', name: 'Other expense', info: 'depreciation, property expense, miscellaneous transfers' },
  ];
  const REV = [
    { k: 'inc', name: 'Income and profit taxes', info: 'personal income tax, corporate tax, capital gains' },
    { k: 'gs', name: 'Taxes on goods and services', info: 'VAT, sales taxes, excises on fuel, tobacco and alcohol' },
    { k: 'sc', name: 'Social contributions', info: 'payments by employees and employers into pension, health and unemployment insurance' },
    { k: 'tax_o', name: 'Other taxes', info: 'property, payroll, customs and other taxes' },
    { k: 'oth', name: 'Other revenue', info: 'grants, property income such as oil or dividends, fees and sales' },
  ];
  const REGIONS = ['Europe', 'Americas', 'Asia-Pacific', 'Middle East & Africa'];
  const EVENTS = [[2008.7, 'financial crisis'], [2020.2, 'Covid-19'], [2022.15, 'invasion of Ukraine']];

  let D, C, ISOS, FULL, GROUPS, FN, SUBS;

  function prep(raw) {
    D = raw; C = raw.countries; ISOS = Object.keys(C);
    FN = raw.funcs; SUBS = raw.subs;
    GROUPS = raw.groups.map((g, i) => ({ ...g, color: GCOL[i] }));
    for (const iso of ISOS) {
      const c = C[iso];
      c.iso = iso;
      const ys = Object.keys(c.cofog).map(Number).sort((a, b) => a - b);
      c.years = ys; c.ly = ys.length ? ys[ys.length - 1] : null;
    }
    FULL = ISOS.filter((i) => C[i].ly);
  }
  const L1 = Array.from({ length: 10 }, (_, i) => 'GF' + String(i + 1).padStart(2, '0'));
  const cof = (iso, y, k) => { const v = C[iso].cofog[y]; if (!v) return null; return v[k] == null ? null : v[k]; };
  const cofTotal = (iso, y) => { const v = C[iso].cofog[y]; return v ? sum(L1.map((k) => v[k])) : null; };
  function fiscal(iso, key, y) {
    const f = C[iso].fiscal, i = f.years.indexOf(Math.round(y));
    return i < 0 ? null : f[key][i];
  }
  function pcppp(iso, y) {
    let v = fiscal(iso, 'pc_ppp', y);
    if (v == null) { const a = C[iso].fiscal.pc_ppp.filter((x) => x != null); v = a.length ? a[a.length - 1] : null; }
    return v;
  }
  function nearest(obj, y) {
    if (!obj) return null;
    if (y && obj[y]) return { y: +y, v: obj[y] };
    const ks = Object.keys(obj).map(Number).sort((a, b) => a - b);
    return ks.length ? { y: ks[ks.length - 1], v: obj[ks[ks.length - 1]] } : null;
  }
  const groupVal = (iso, y, g) => sum(g.fn.map((k) => cof(iso, y, k)));
  const subCodes = (k) => Object.keys(SUBS).filter((s) => s.startsWith(k));
  const nameOf = (code) => (FN[code] ? FN[code].name : SUBS[code] || code);
  function funcColor(k) {
    const g = GROUPS.find((x) => x.fn.includes(k.slice(0, 4)));
    const base = g ? g.color : '#999';
    if (k.startsWith('GF06')) return mix(base, '#ffffff', 0.4);
    if (k.startsWith('GF08')) return mix(base, '#000000', 0.22);
    return base;
  }
  function mix(a, b, t) {
    const p = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
    const [x, y] = [p(a), p(b)];
    return '#' + x.map((v, i) => Math.round(v * (1 - t) + y[i] * t).toString(16).padStart(2, '0')).join('');
  }
  function convert(iso, y, val, tot, m) { // value in % of GDP -> the metric
    if (val == null) return null;
    if (m === 'gdp') return val;
    if (m === 'share') return tot ? (val / tot) * 100 : null;
    const pc = pcppp(iso, y); return pc == null ? null : (val / 100) * pc;
  }
  function pick(root, name, def) { return root.dataset[name] || def; }

  // ------------------------------------------------------------------ figure frame
  const tip = h('div', { class: 'bx-tip', hidden: true });
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
    root.classList.add('concept', 'bx');
    const title = root.dataset.title, cap = root.dataset.caption;
    root.innerHTML = '';
    const ctrl = h('div', { class: 'bx-ctrl' }), stage = h('div', { class: 'bx-stage' }), legend = h('div', { class: 'bx-legend' });
    root.append(h('header', {}, h('span', { class: 'concept-kind' }, kind), h('span', { class: 'concept-title' }, title)), ctrl, stage, legend);
    if (cap) root.append(h('figcaption', {}, cap));
    return { ctrl, stage, legend };
  }
  function seg(options, current, onPick) { // button group
    const wrap = h('span', { class: 'bx-seg' });
    for (const [v, label] of options) {
      wrap.append(h('button', { type: 'button', class: v === current ? 'on' : '', 'data-v': v, onclick: () => { onPick(v); [...wrap.children].forEach((b) => b.classList.toggle('on', b.dataset.v === v)); } }, label));
    }
    return wrap;
  }
  function countrySelect(value, onPick, pool, placeholder) {
    const sel = h('select', { class: 'bx-select', 'aria-label': placeholder || 'country' });
    if (placeholder) sel.append(h('option', { value: '' }, placeholder));
    for (const r of REGIONS) {
      const og = h('optgroup', { label: r });
      for (const iso of pool) if (C[iso].region === r) og.append(h('option', { value: iso }, C[iso].name));
      if (og.children.length) sel.append(og);
    }
    sel.value = value || '';
    sel.addEventListener('change', () => onPick(sel.value));
    return sel;
  }
  const srcLine = (iso, y) => {
    const c = C[iso], s = c.src[y];
    return `${c.name} ${y} · ${s === 'Eurostat' ? 'Eurostat' : s === 'OECD' ? 'OECD' : 'IMF'} · ${c.sector[y] !== 'S13' ? 'central government only' : 'general government, all levels'}`;
  };
  function openDeep(iso) { document.dispatchEvent(new CustomEvent('bx:country', { detail: iso })); }


  // ================================================================== absolute amounts, in dollars
  // % of GDP x GDP in current US$ (market exchange rates), each country in its latest year of data.
  const RCOL = { Europe: '#2a78d6', Americas: '#eb6834', 'Asia-Pacific': '#1baf7a', 'Middle East & Africa': '#e87ba4' };
  const bn = (v) => (v == null ? '–' : v >= 1000 ? '$' + (v / 1000).toFixed(v >= 10000 ? 1 : 2) + ' trn' : v >= 10 ? '$' + Math.round(v).toLocaleString('en-US') + ' bn' : '$' + v.toFixed(1) + ' bn');
  function absMeasures(level) {
    const G = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
    const central = level === 'central';
    // one source per level: general government (C[iso].cofog, latest year) or the IMF's central-government series (C[iso].central, from 2020 on)
    const src = (iso) => { const c = C[iso].central; return central ? (c && c.y >= 2020 ? { y: c.y, sec: c.sec, get: (k) => c.cof[k] } : null) : (C[iso].ly ? { y: C[iso].ly, get: (k) => cof(iso, C[iso].ly, k) } : null); };
    const fromCof = (fnList) => (iso) => { const o = src(iso); if (!o) return null; const g = fiscal(iso, 'gdp_usd', o.y); if (g == null) return null; return { y: o.y, sec: o.sec, v: (sum(fnList.map(o.get)) / 100) * g / 1e9 }; };
    const fromFiscal = (key) => (iso) => { const f = C[iso].fiscal; for (let i = f.years.length - 1; i >= 0; i--) if (f[key][i] != null && f.gdp_usd[i] != null && f.years[i] <= 2024) return { y: f.years[i], v: (f[key][i] / 100) * f.gdp_usd[i] / 1e9 }; return null; };
    // interest from the economic-type table (statement of operations), all levels; COFOG's debt-transactions division is not interest
    const interest = (iso) => { const e = C[iso].econ, ys = Object.keys(e || {}).map(Number).filter((y) => e[y] && e[y].int != null && y <= 2024).sort((a, b) => a - b); if (!ys.length) return null; const y = ys[ys.length - 1], g = fiscal(iso, 'gdp_usd', y); return g == null ? null : { y, v: (e[y].int / 100) * g / 1e9 }; };
    return [
      ['total', central ? 'All central-government spending' : 'All government spending (all levels)', fromCof(L1)],
      ['rev', 'Government revenue (IMF WEO headline)', fromFiscal('rev')],
      ['debt', 'Gross government debt (IMF WEO headline)', fromFiscal('debt')],
      ['gdp', 'GDP (for scale)', (iso) => { const f = C[iso].fiscal; for (let i = f.years.length - 1; i >= 0; i--) if (f.gdp_usd[i] != null && f.years[i] <= 2024) return { y: f.years[i], v: f.gdp_usd[i] / 1e9 }; return null; }],
      ['soc', 'Social protection (pensions, benefits)', fromCof(G.soc.fn)],
      ['hea', 'Health', fromCof(G.hea.fn)],
      ['edu', 'Education', fromCof(G.edu.fn)],
      ['def', 'Defence (COFOG)', fromCof(G.def.fn)],
      ['mil', 'Military (SIPRI, national total)', (iso) => { const m = C[iso].mil; const ys = Object.keys(m || {}).map(Number).filter((y) => y <= 2024 && m[y] && m[y].mil_usd != null).sort((a, b) => a - b); return ys.length ? { y: ys[ys.length - 1], v: m[ys[ys.length - 1]].mil_usd / 1e9 } : null; }],
      ['ord', 'Public order and safety', fromCof(G.ord.fn)],
      ['eco', 'Economic affairs (transport, energy, industry)', fromCof(G.eco.fn)],
      ['int', 'Interest on public debt (all levels)', interest],
    ];
  }
  function absWidget(root) {
    const LV = {}, label = {};
    for (const level of ['all', 'central']) {
      const M = absMeasures(level), MV = {}; M.forEach(([k, n, fn]) => { MV[k] = {}; (label[level] = label[level] || {})[k] = n; ISOS.forEach((iso) => { const r = fn(iso); if (r && r.v > 0) MV[k][iso] = r; }); });
      LV[level] = MV;
    }
    const M = absMeasures('all'), lab = (k) => label[st.level][k];
    const st = { m: pick(root, 'metric', 'total'), level: pick(root, 'view', 'all'), a: ['USA', 'def'], b: ['CAN', 'total'] };
    const MVc = () => LV[st.level];
    const { ctrl, stage, legend } = frame(root, 'dollars');
    const sel = h('select', { class: 'bx-select', 'aria-label': 'what to show' }, M.map(([k, n]) => h('option', { value: k }, n)));
    sel.value = st.m; sel.addEventListener('change', () => { st.m = sel.value; draw(); });
    const lvSeg = seg([['all', 'All levels of government'], ['central', 'Central government only']], st.level, (v) => { st.level = v; draw(); });
    lvSeg.classList.add('ab-level');
    ctrl.append(h('span', { class: 'bx-lbl' }, 'whose budget'), lvSeg, h('span', { class: 'bx-lbl' }, 'show'), sel);
    const relabel = () => { [...sel.options].forEach((o) => { o.textContent = lab(o.value); }); };
    const bars = h('div', { class: 'ab-bars' }), weigh = h('div', { class: 'ab-weigh' });
    stage.append(bars, weigh);
    legend.innerHTML = '';
    legend.append(...Object.entries(RCOL).map(([r, c]) => h('span', { class: 'bx-chip static' }, h('i', { style: 'background:' + c }), r)), h('span', { class: 'bx-hint' }, 'Current US dollars at market exchange rates, so a strong currency inflates a country and a weak one shrinks it. Each country in its latest year of data (shown after the name, mostly 2024). "Central government" is the IMF\'s own central-government sector, and it is not the same thing everywhere: for most countries it is the budgetary central government without the social-insurance funds (Germany, France, Spain), for the United States the IMF only reports a version that includes the social-security funds, and for China and Switzerland it leaves out most public spending. The view needs data from 2020 on and is therefore missing for Canada, India, Saudi Arabia, Mexico and South Korea; for revenue, debt, GDP, SIPRI military spending and interest it shows the same bars as the all-levels view. Revenue and debt are the IMF World Economic Outlook headline series, which for some countries (Saudi Arabia, South Africa) appears narrower than all levels; SIPRI military spending is a national total counted differently from COFOG defence; interest comes from the economic-type table. Years after 2024 are not shown.'));
    const CENTRAL_ONLY = new Set(['total', 'soc', 'hea', 'edu', 'def', 'ord', 'eco']);
    const secTxt = (r) => (st.level === 'central' && r.sec ? ' · IMF sector ' + r.sec + (r.sec === 'S1321' ? ' (incl. social-security funds)' : ' (excl. social-security funds)') : '');
    const titleEl = root.querySelector('.concept-title'), baseTitle = titleEl.textContent;
    function draw() {
      relabel();
      titleEl.textContent = baseTitle + (st.level === 'central' ? (CENTRAL_ONLY.has(st.m) ? ' – central government only' : ' – this measure is the same in both views') : ' – all levels of government');
      const rows = Object.entries(MVc()[st.m]).map(([iso, r]) => ({ iso, ...r })).sort((a, b) => b.v - a.v);
      const mx = rows[0].v;
      bars.replaceChildren(...rows.map((r) => h('div', { class: 'ab-row', onmousemove: (ev) => showTip(ev, `<b>${C[r.iso].name}</b> <span>${r.y}${secTxt(r)}</span><br>${lab(st.m)}: ${bn(r.v)}`), onmouseleave: hideTip, onclick: () => { st.a = [r.iso, st.m]; drawWeigh(); weigh.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } },
        h('span', { class: 'ab-n' }, C[r.iso].name, h('small', {}, ' ' + r.y)), h('span', { class: 'ab-t' }, h('i', { style: `width:${Math.max(0.4, (r.v / mx) * 100)}%;background:${RCOL[C[r.iso].region] || '#999'}` })), h('span', { class: 'ab-v' }, bn(r.v)))));
      drawWeigh();
    }
    const cSel = (cur, set) => { const s = h('select', { class: 'bx-select', 'aria-label': 'country' }, Object.keys(C).sort((a, b) => C[a].name.localeCompare(C[b].name)).map((i) => h('option', { value: i }, C[i].name))); s.value = cur; s.addEventListener('change', () => { set(s.value); drawWeigh(); }); return s; };
    const mSel = (cur, set) => { const s = h('select', { class: 'bx-select', 'aria-label': 'measure' }, M.map(([k, n]) => h('option', { value: k }, n))); s.value = cur; s.addEventListener('change', () => { set(s.value); drawWeigh(); }); return s; };
    const PRESETS = [['US defence vs Germany, central government', ['USA', 'def'], ['DEU', 'total'], 'central'], ['US defence vs Canada, all levels', ['USA', 'def'], ['CAN', 'total']], ['US health vs Germany, all levels', ['USA', 'hea'], ['DEU', 'total']], ['China education vs France, all levels', ['CHN', 'edu'], ['FRA', 'total']], ['US defence vs China defence', ['USA', 'def'], ['CHN', 'def']], ['Germany defence vs Germany interest', ['DEU', 'def'], ['DEU', 'int']], ['UK interest vs UK defence', ['GBR', 'int'], ['GBR', 'def']]];
    function drawWeigh() {
      const A = MVc()[st.a[1]][st.a[0]], B = MVc()[st.b[1]][st.b[0]];
      const poss = (n) => (/s$/.test(n) ? n + "'" : n + "'s"), name = (p) => `${poss(C[p[0]].name)} ${p[1] === 'total' ? (st.level === 'central' ? 'central-government spending' : 'spending at all levels of government') : label[st.level][p[1]].replace(/ \(.*\)/, '').toLowerCase()}`;
      let verdict = 'No figure for this pair (the country does not report that item).';
      const miss = [[st.a, A], [st.b, B]].filter(([, r]) => !r).map(([p]) => C[p[0]].name);
      const fix = st.level === 'central' && miss.length ? h('button', { type: 'button', class: 'bx-chip', onclick: () => { st.level = 'all'; [...lvSeg.children].forEach((x) => x.classList.toggle('on', x.dataset.v === 'all')); draw(); } }, 'Show all levels of government') : null;
      if (miss.length) verdict = `${miss.join(' and ')} ${miss.length > 1 ? 'have' : 'has'} no figure for this item in the ${st.level === 'central' ? 'central-government view (the IMF reports no central series, or none from 2020 on)' : 'data'}.`;
      let big = null;
      if (A && B) {
        const r = A.v / B.v, hi = r >= 1 ? [A, st.a] : [B, st.b], lo = r >= 1 ? [B, st.b] : [A, st.a], x = Math.max(r, 1 / r);
        verdict = `${name(hi[1])} (${bn(hi[0].v)}) is ${x < 1.05 ? 'about as large as' : x.toFixed(x < 10 ? 2 : 1) + ' times'} ${name(lo[1])} (${bn(lo[0].v)}).`;
        if (x < 1.05) verdict = `${name(A === hi[0] ? st.a : st.b)} (${bn(A.v)}) is about as large as ${name(st.b)} (${bn(B.v)}).`;
        big = Math.max(A.v, B.v);
      }
      const line = (p, R, col) => h('div', { class: 'ab-pair' }, h('span', { class: 'ab-n' }, name(p)), h('span', { class: 'ab-t' }, R ? h('i', { style: `width:${(R.v / big) * 100}%;background:${col}` }) : null), h('span', { class: 'ab-v' }, R ? bn(R.v) : 'n/a'));
      weigh.replaceChildren(
        h('h4', {}, 'Weigh one against another'),
        h('div', { class: 'ab-pre' }, PRESETS.map(([t, a, b, lv]) => h('button', { type: 'button', class: 'bx-chip', onclick: () => { st.a = a.slice(); st.b = b.slice(); st.level = lv || 'all'; [...lvSeg.children].forEach((x) => x.classList.toggle('on', x.dataset.v === st.level)); draw(); } }, t))),
        h('div', { class: 'ab-pick' }, cSel(st.a[0], (v) => { st.a[0] = v; }), mSel(st.a[1], (v) => { st.a[1] = v; }), h('span', { class: 'ab-vs' }, 'against'), cSel(st.b[0], (v) => { st.b[0] = v; }), mSel(st.b[1], (v) => { st.b[1] = v; })),
        line(st.a, A, '#2a78d6'), line(st.b, B, '#eb6834'), h('p', { class: 'ab-verdict' }, verdict, fix ? ' ' : null, fix));
    }
    draw();
  }

  // ================================================================== stacked comparison bars
  function stackWidget(root) {
    const st = { view: pick(root, 'view', 'fn'), metric: pick(root, 'metric', 'gdp'), sort: pick(root, 'sort', 'total'), focus: root.dataset.focus || '' };
    const ctrlSet = (root.dataset.ctrl || 'metric,sort').split(',');
    const { ctrl, stage, legend } = frame(root, root.dataset.kind || 'compare');
    if (ctrlSet.includes('view')) ctrl.append(h('span', { class: 'bx-lbl' }, 'show'), seg([['fn', 'spending by purpose'], ['econ', 'spending by type'], ['rev', 'revenue by source']], st.view, (v) => { st.view = v; st.focus = ''; if (st.sort !== 'name' && st.sort !== 'region') st.sort = 'total'; build(); }));
    if (ctrlSet.includes('metric')) ctrl.append(h('span', { class: 'bx-lbl' }, 'measure'), seg([['gdp', '% of GDP'], ['share', '% of total'], ['pc', 'PPP $ per person']], st.metric, (v) => { st.metric = v; update(); }));
    let sortSel;
    if (ctrlSet.includes('sort')) {
      ctrl.append(h('span', { class: 'bx-lbl' }, 'sort'));
      sortSel = h('select', { class: 'bx-select', 'aria-label': 'sort', onchange: () => { st.sort = sortSel.value; update(); } });
      ctrl.append(sortSel);
    }
    const head = h('div', { class: 'bx-axis' }), body = h('div', { class: 'bx-rows' });
    stage.append(head, body);
    const note = h('div', { class: 'bx-note' });
    stage.append(note);
    let parts, rows, els = {};

    function parts_() {
      if (st.view === 'fn') return GROUPS.map((g) => ({ k: g.id, name: g.name, color: g.color, info: g.fn.map((k) => FN[k].name).join(', ') }));
      const arr = st.view === 'econ' ? ECON : REV;
      return arr.map((p, i) => ({ ...p, color: GCOL[i] }));
    }
    function build() {
      parts = parts_();
      body.innerHTML = ''; els = {};
      rows = [];
      const missing = [];
      for (const iso of ISOS) {
        const c = C[iso]; let year, vals;
        if (st.view === 'fn') { if (!c.ly) { missing.push(c.name); continue; } year = c.ly; vals = GROUPS.map((g) => groupVal(iso, year, g)); }
        else {
          const e = nearest(st.view === 'econ' ? c.econ : c.rev, c.ly);
          if (!e) { missing.push(c.name); continue; }
          year = e.y; vals = parts.map((p) => e.v[p.k]);
          if (vals.some((x) => x == null || x < -0.05)) { missing.push(c.name); continue; }
        }
        rows.push({ iso, year, vals, tot: sum(vals), c });
      }
      for (const r of rows) {
        const bar = h('div', { class: 'bx-bar' }, parts.map(() => h('i', { class: 'bx-seg-i' })));
        const label = h('button', { type: 'button', class: 'bx-name', title: 'open in the deep dive', onclick: () => openDeep(r.iso) }, r.c.name, h('small', {}, ' ' + r.year));
        const val = h('span', { class: 'bx-val' });
        const row = h('div', { class: 'bx-row', onmousemove: (ev) => tipFor(ev, r), onmouseleave: hideTip }, label, h('div', { class: 'bx-barwrap' }, bar, val));
        body.append(row);
        els[r.iso] = { row, bar, val, segs: [...bar.children] };
      }
      note.textContent = missing.length ? `Not shown for ${missing.join(', ')}: no ${st.view === 'fn' ? 'functional breakdown' : st.view === 'econ' ? 'breakdown by economic type' : 'revenue breakdown'} in the IMF, Eurostat or OECD data${st.view === 'econ' ? ', or a negative component (Singapore)' : ''}.` : '';
      legend.innerHTML = '';
      parts.forEach((p, i) => legend.append(h('button', { type: 'button', class: 'bx-chip' + (st.focus === p.k ? ' on' : ''), title: p.info, onclick: () => { st.focus = st.focus === p.k ? '' : p.k; if (st.focus) st.sort = st.focus; else if (st.sort === parts.map((x) => x.k).find((k) => k === st.sort)) st.sort = 'total'; update(); } }, h('i', { style: `background:${p.color}` }), p.name)));
      if (sortSel) {
        sortSel.innerHTML = '';
        sortSel.append(h('option', { value: 'total' }, 'total, largest first'), h('option', { value: 'name' }, 'name'), h('option', { value: 'region' }, 'region'));
        parts.forEach((p) => sortSel.append(h('option', { value: p.k }, p.name + ', largest first')));
        sortSel.value = st.sort;
      }
      update();
    }
    const order = (r) => { // fixed segment order, or the focused one first
      const idx = parts.map((_, i) => i);
      if (st.focus) { const f = parts.findIndex((p) => p.k === st.focus); idx.splice(idx.indexOf(f), 1); idx.unshift(f); }
      return idx;
    };
    function val(r, i) { return convert(r.iso, r.year, r.vals[i], r.tot, st.metric); }
    function rowTotal(r) { return st.metric === 'share' ? 100 : convert(r.iso, r.year, r.tot, r.tot, st.metric); }
    function update() {
      if (sortSel) sortSel.value = st.sort;
      const keyOf = (r) => {
        if (st.sort === 'name') return r.c.name;
        if (st.sort === 'region') return REGIONS.indexOf(r.c.region) * 1000 - r.tot;
        const pi = parts.findIndex((p) => p.k === st.sort);
        if (pi >= 0) return -(val(r, pi) ?? -1);
        return -(st.metric === 'share' ? r.tot : rowTotal(r) ?? -1);
      };
      const sorted = rows.slice().sort((a, b) => { const x = keyOf(a), y = keyOf(b); return typeof x === 'string' ? x.localeCompare(y) : x - y; });
      const rowsWithVal = sorted.filter((r) => rowTotal(r) != null);
      const top = Math.max(...rowsWithVal.map((r) => rowTotal(r))) * 1.08;
      const stp = st.metric === 'pc' ? nice(top / 8) : top > 40 ? 10 : top > 15 ? 5 : top > 6 ? 2 : 1;
      const mx = st.metric === 'share' ? 100 : Math.ceil(top / stp) * stp;
      const tk = st.metric === 'share' ? [0, 25, 50, 75, 100] : ticks(mx, st.metric === 'pc' ? 4 : 5);
      head.innerHTML = '';
      tk.forEach((t) => head.append(h('span', { style: `left:${(t / mx) * 100}%` }, st.metric === 'pc' ? (t >= 1000 ? t / 1000 + 'k' : t) : t + (st.metric === 'pc' ? '' : ''))));
      head.append(h('em', {}, ''));
      body.style.height = sorted.length * 25 + 'px';
      body.style.setProperty('--grid', tk.map((t) => `${(t / mx) * 100}%`).join(','));
      sorted.forEach((r, n) => {
        const e = els[r.iso];
        e.row.style.transform = `translateY(${n * 25}px)`;
        const idx = order(r);
        let acc = 0;
        idx.forEach((pi) => {
          const v = val(r, pi) ?? 0;
          const s = e.segs[pi];
          s.style.left = (acc / mx) * 100 + '%';
          s.style.width = Math.max(0, (v / mx) * 100) + '%';
          s.style.background = parts[pi].color;
          s.style.opacity = st.focus && parts[pi].k !== st.focus ? 0.22 : 1;
          acc += v;
        });
        const fi = st.focus ? parts.findIndex((p) => p.k === st.focus) : -1;
        const shown = fi >= 0 ? val(r, fi) : rowTotal(r);
        e.val.textContent = st.metric === 'pc' ? usd(shown) : f1(shown);
        e.val.style.left = (acc / mx) * 100 + '%';
        if (fi >= 0) e.val.style.left = ((val(r, fi) ?? 0) / mx) * 100 + '%';
      });
      for (const r of rows) if (rowTotal(r) == null) els[r.iso].row.style.display = 'none';
    }
    function tipFor(ev, r) {
      const lines = parts.map((p, i) => {
        const g = convert(r.iso, r.year, r.vals[i], r.tot, 'gdp'), s = convert(r.iso, r.year, r.vals[i], r.tot, 'share'), pc = convert(r.iso, r.year, r.vals[i], r.tot, 'pc');
        return `<tr><td><i style="background:${p.color}"></i>${p.name}</td><td>${f1(g)}</td><td>${f1(s)}</td><td>${pc == null ? '–' : usd(pc)}</td></tr>`;
      }).join('');
      const what = st.view === 'rev' ? 'revenue' : 'spending';
      showTip(ev, `<b>${r.c.name}</b> <span>${st.view === 'fn' ? srcLine(r.iso, r.year) : r.year}</span><table><tr><th></th><th>% GDP</th><th>% ${what}</th><th>PPP $/person</th></tr>${lines}<tr class="t"><td>total ${what}</td><td>${f1(r.tot)}</td><td>100</td><td>${usd(convert(r.iso, r.year, r.tot, r.tot, 'pc'))}</td></tr></table>`);
    }
    build();
  }

  function label(x, ty, hh, name, v, anchor, narrow) { // node label: name (wrapped on narrow screens) and value
    const max = narrow ? 14 : 99, words = name.split(' '), lines = [];
    let cur = '';
    words.forEach((w) => { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    lines.push(cur);
    const showV = hh > 14 + 12 * lines.length - 2, lh = 12.5, y0 = ty - ((lines.length - 1 + (showV ? 1.15 : 0)) * lh) / 2 + 4;
    const t = h('svg:text', { x, y: y0, 'text-anchor': anchor, class: 'bx-t' }, lines.map((l, i) => h('svg:tspan', { x, dy: i ? lh : 0 }, l)));
    if (showV) t.append(h('svg:tspan', { x, dy: lh * 1.15, class: 'bx-t2' }, `${v} % of GDP`));
    return t;
  }

  // ================================================================== sankey: revenue -> state -> spending
  function sankeyWidget(root) {
    const st = { iso: root.dataset.country || 'DEU' };
    const { ctrl, stage, legend } = frame(root, 'flow');
    const pool = FULL.filter((i) => nearest(C[i].rev, C[i].ly));
    ctrl.append(h('span', { class: 'bx-lbl' }, 'country'), countrySelect(st.iso, (v) => { st.iso = v; draw(); }, pool));
    const svg = h('svg:svg', { class: 'bx-svg', role: 'img' });
    const stats = h('div', { class: 'bx-stats' });
    stage.append(svg); root.insertBefore(stats, legend);
    const ctl = ctrl;
    function draw() {
      const c = C[st.iso], ly = c.ly, r = nearest(c.rev, ly), W = stage.getBoundingClientRect().width || 720;
      if (W < 260) return;
      const narrow = W < 560, H = narrow ? 470 : 500, padT = 14, padB = 26;
      const left = REV.map((p, i) => ({ name: p.name, v: r.v[p.k], color: GCOL[i], info: p.info })).filter((x) => x.v > 0.005);
      const revTot = r.v.tot, spend = cofTotal(st.iso, ly);
      const gap = spend - revTot;
      if (gap > 0.05) left.push({ name: 'Borrowing', v: gap, color: '#7b8394', hatch: true, info: 'spending minus revenue: financed by new debt' });
      const right = GROUPS.map((g) => ({ name: g.name, v: groupVal(st.iso, ly, g), color: g.color })).sort((a, b) => b.v - a.v);
      if (gap < -0.05) right.push({ name: 'Surplus', v: -gap, color: '#7b8394', hatch: true });
      const T = Math.max(revTot, spend, sum(left.map((x) => x.v)));
      const labW = narrow ? 104 : 190, midX = W / 2, nodeW = 14, ih = H - padT - padB, k = ih / T, gapPx = 5;
      const lx = labW, rx = W - labW - nodeW;
      const nL = left.length, nR = right.length;
      const lk = (ih - gapPx * (nL - 1)) / sum(left.map((x) => x.v)), rk = (ih - gapPx * (nR - 1)) / sum(right.map((x) => x.v));
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.innerHTML = '';
      const defs = h('svg:defs', {}, h('svg:pattern', { id: 'bxh', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, h('svg:rect', { width: 6, height: 6, fill: '#e8ebf1' }), h('svg:rect', { width: 2.4, height: 6, fill: '#9aa3b5' })));
      svg.append(defs);
      const cx0 = lx + nodeW, cx1 = rx;
      const cw = 12, cL = midX - cw / 2 - 0;   // central pillar
      // central pillar
      svg.append(h('svg:rect', { x: cL, y: padT, width: cw, height: ih, fill: INK, rx: 2 }));
      // left ribbons
      let y = padT, yc = padT;
      const gl = h('svg:g', {}), gr = h('svg:g', {});
      const ribbon = (x0, y0, hh0, x1, y1, hh1, color, hatch, label, info) => {
        const mx = (x0 + x1) / 2;
        const p = h('svg:path', { d: `M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1} L${x1},${y1 + hh1} C${mx},${y1 + hh1} ${mx},${y0 + hh0} ${x0},${y0 + hh0} Z`, fill: hatch ? 'url(#bxh)' : color, 'fill-opacity': hatch ? 1 : 0.34, class: 'bx-rib' });
        p.addEventListener('mousemove', (ev) => showTip(ev, label)); p.addEventListener('mouseleave', hideTip);
        return p;
      };
      const fmt = (v) => f1(v);
      left.forEach((n) => {
        const hh = n.v * lk, hc = n.v * (ih / (sum(left.map((x) => x.v))));
        gl.append(ribbon(lx + nodeW, y, hh, cL, yc, hc, n.color, n.hatch, `<b>${n.name}</b><br>${fmt(n.v)} % of GDP · ${f1((n.v / sum(left.map((x) => x.v))) * 100)} % of the money in<br><span>${n.info || ''}</span>`));
        svg.append(h('svg:rect', { x: lx, y, width: nodeW, height: Math.max(1, hh), fill: n.hatch ? 'url(#bxh)' : n.color, stroke: n.hatch ? '#9aa3b5' : 'none' }));
        const ty = y + hh / 2;
        svg.append(label(lx - 8, ty, hh, n.name, fmt(n.v), 'end', narrow));
        y += hh + gapPx; yc += hc;
      });
      y = padT; yc = padT;
      right.forEach((n) => {
        const hh = n.v * rk, hc = n.v * (ih / sum(right.map((x) => x.v)));
        gr.append(ribbon(cL + cw, yc, hc, rx, y, hh, n.color, n.hatch, `<b>${n.name}</b><br>${fmt(n.v)} % of GDP · ${f1((n.v / sum(right.map((x) => x.v))) * 100)} % of the money out`));
        svg.append(h('svg:rect', { x: rx, y, width: nodeW, height: Math.max(1, hh), fill: n.hatch ? 'url(#bxh)' : n.color, stroke: n.hatch ? '#9aa3b5' : 'none' }));
        const ty = y + hh / 2;
        svg.append(label(rx + nodeW + 8, ty, hh, n.name, fmt(n.v), 'start', narrow));
        y += hh + gapPx; yc += hc;
      });
      svg.insertBefore(gl, svg.children[2]); svg.insertBefore(gr, svg.children[3]);
      svg.append(h('svg:text', { x: midX, y: H - 6, 'text-anchor': 'middle', class: 'bx-t2' }, 'government'),
        h('svg:text', { x: lx + nodeW / 2, y: 10, 'text-anchor': 'start', class: 'bx-h' }, ''));
      const bal = revTot - spend;
      stats.innerHTML = `<span><b>${c.name}</b>, ${ly}${c.sector[ly] !== 'S13' ? ' (central government)' : ''}</span><span>revenue <b>${f1(revTot)} %</b> of GDP</span><span>spending <b>${f1(spend)} %</b> of GDP</span><span>${bal < 0 ? 'deficit' : 'surplus'} <b>${f1(Math.abs(bal))} %</b> of GDP</span><span>revenue year ${r.y}</span>`;
    }
    observe(stage, () => draw());
    legend.innerHTML = '<span class="bx-hint">Hover a ribbon. Widths are % of GDP; the pillar is the government. Left of it comes the money in, right of it goes the money out.</span>';
  }

  // ================================================================== treemap deep dive
  function treeWidget(root) {
    const st = { iso: root.dataset.country || 'DEU', year: null, metric: 'gdp', path: null };
    const { ctrl, stage, legend } = frame(root, 'deep dive');
    root.id = root.id || 'deep-dive';
    const sel = countrySelect(st.iso, (v) => { st.iso = v; st.year = null; st.path = null; draw(); }, FULL);
    const yr = h('input', { type: 'range', class: 'bx-range', 'aria-label': 'year' });
    const yl = h('span', { class: 'bx-yr' });
    ctrl.append(h('span', { class: 'bx-lbl' }, 'country'), sel, h('span', { class: 'bx-lbl' }, 'year'), yr, yl,
      seg([['gdp', '% of GDP'], ['share', '% of total'], ['pc', 'PPP $ per person']], st.metric, (v) => { st.metric = v; draw(); }));
    yr.addEventListener('input', () => { st.year = +yr.value; draw(true); });
    const crumb = h('div', { class: 'bx-crumb' });
    const map = h('div', { class: 'bx-tree' }), side = h('div', { class: 'bx-side' });
    stage.append(crumb, h('div', { class: 'bx-split' }, map, side));
    let nodes = {};
    document.addEventListener('bx:country', (ev) => {
      if (!FULL.includes(ev.detail)) return;
      st.iso = ev.detail; st.year = null; st.path = null; sel.value = st.iso; draw();
      root.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    function items(iso, y) {
      const v = C[iso].cofog[y], tot = cofTotal(iso, y);
      let list;
      if (!st.path) list = L1.map((k) => ({ k, name: FN[k].name, v: v[k], color: funcColor(k), info: FN[k].desc }));
      else {
        const subs = subCodes(st.path).filter((s) => s.length === 6 && v[s] != null);
        list = subs.map((s) => ({ k: s, name: SUBS[s], v: v[s], color: mix(funcColor(st.path), '#ffffff', 0.12 * (subs.indexOf(s) % 4)) }));
        const rest = v[st.path] - sum(list.map((x) => x.v));
        if (rest > 0.03) list.push({ k: 'rest', name: 'Not broken down further in this source', v: rest, color: '#b8c0cf' });
      }
      return { list: list.filter((x) => x.v > 0.0004).sort((a, b) => b.v - a.v), tot };
    }
    function draw(keep) {
      const c = C[st.iso];
      if (!keep || !st.year || !c.cofog[st.year]) {
        if (!c.cofog[st.year]) st.year = c.ly;
      }
      yr.min = c.years[0]; yr.max = c.ly; yr.step = 1; yr.value = st.year; yl.textContent = st.year;
      const { list, tot } = items(st.iso, st.year);
      const W = Math.max(280, map.getBoundingClientRect().width), Hh = 400;
      map.style.height = Hh + 'px';
      const total = sum(list.map((x) => x.v));
      const boxes = squarify(list.map((x) => ({ ...x })), 0, 0, W, Hh);
      const seen = new Set();
      boxes.forEach((b) => {
        seen.add(b.k);
        let n = nodes[b.k];
        if (!n || !n.isConnected) {
          n = h('div', { class: 'bx-node' }, h('b', {}), h('span', {}));
          n.addEventListener('click', () => { if (!st.path && b.k !== 'rest') { st.path = b.k; nodes = Object.fromEntries(Object.entries(nodes).filter(([k]) => false)); map.innerHTML = ''; draw(true); } });
          n.addEventListener('mousemove', (ev) => { const nb = n._b; showTip(ev, `<b>${nb.name}</b><br>${f1(nb.v)} % of GDP · ${f1(nb.v / total * 100)} % of ${st.path ? FN[st.path].name.toLowerCase() : 'spending'}${pcppp(st.iso, st.year) ? ' · ' + usd(nb.v / 100 * pcppp(st.iso, st.year)) + ' per person' : ''}${nb.info ? '<br><span>' + nb.info + '</span>' : ''}`); });
          n.addEventListener('mouseleave', hideTip);
          map.append(n); nodes[b.k] = n;
        }
        n._b = b;
        n.style.cssText = `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;background:${b.color};cursor:${!st.path && b.k !== 'rest' ? 'pointer' : 'default'}`;
        const val = convert(st.iso, st.year, b.v, tot, st.metric === 'share' ? 'gdp' : st.metric);
        const shown = st.metric === 'share' ? f1((b.v / total) * 100) + ' %' : st.metric === 'pc' ? usd(val) : f1(b.v) + ' %';
        const roomy = b.w > 78 && b.h > 42;
        n.firstChild.textContent = roomy ? b.name : '';
        n.lastChild.textContent = roomy && b.h > 58 ? shown : (b.w > 46 && b.h > 22 && !roomy ? shown : '');
        n.classList.toggle('small', b.w < 90);
        n.style.color = lum(b.color) > 0.55 ? INK : '#fff';
      });
      for (const k of Object.keys(nodes)) if (!seen.has(k)) { nodes[k].remove(); delete nodes[k]; }
      crumb.innerHTML = '';
      crumb.append(h('button', { type: 'button', class: st.path ? 'link' : 'cur', onclick: () => { st.path = null; map.innerHTML = ''; nodes = {}; draw(true); } }, `${c.name}: all spending`));
      if (st.path) crumb.append(' › ', h('span', { class: 'cur' }, FN[st.path].name), h('em', {}, 'click “all spending” to go back'));
      else crumb.append(h('em', {}, 'click a block to open it'));
      side.innerHTML = '';
      const y = st.year, rev = fiscal(st.iso, 'rev', y), bal = fiscal(st.iso, 'bal', y), debt = fiscal(st.iso, 'debt', y), pc = pcppp(st.iso, y), gdp = fiscal(st.iso, 'gdp_usd', y);
      const row = (a, b) => h('div', {}, h('span', {}, a), h('b', {}, b));
      side.append(h('h4', {}, st.path ? FN[st.path].name : 'Total spending'),
        row('% of GDP', f1(st.path ? C[st.iso].cofog[y][st.path] : tot) + ' %'),
        row('PPP $ per person', pc ? usd((st.path ? C[st.iso].cofog[y][st.path] : tot) / 100 * pc) : '–'),
        row('share of spending', st.path ? f1((C[st.iso].cofog[y][st.path] / tot) * 100) + ' %' : '100 %'));
      // rank among the other countries
      const key = st.path || null;
      const others = FULL.map((i) => { const yy = C[i].ly; const vv = key ? cof(i, yy, key) : cofTotal(i, yy); const tt = cofTotal(i, yy); return { i, v: vv == null ? null : (st.metric === 'share' ? (vv / tt) * 100 : st.metric === 'pc' ? (pcppp(i, yy) ? (vv / 100) * pcppp(i, yy) : null) : vv) }; }).filter((x) => x.v != null).sort((a, b) => b.v - a.v);
      const mine = others.findIndex((x) => x.i === st.iso);
      if (mine >= 0 && y === c.ly) side.append(row(`rank, of ${others.length}`, `#${mine + 1}`));
      side.append(h('h4', { class: 'sp' }, 'The whole government'), row('revenue', rev == null ? '–' : f1(rev) + ' % of GDP'), row('balance', bal == null ? '–' : f1(bal) + ' % of GDP'), row('gross debt', debt == null ? '–' : f1(debt) + ' % of GDP'), row('GDP', gdp ? '$' + (gdp / 1e9 >= 1000 ? f1(gdp / 1e12) + ' trn' : Math.round(gdp / 1e9) + ' bn') : '–'),
        h('p', { class: 'bx-src' }, srcLine(st.iso, y)));
      // sparkline of the opened node
      const ser = c.years.map((yy) => ({ y: yy, v: key ? cof(st.iso, yy, key) : cofTotal(st.iso, yy) })).filter((p) => p.v != null);
      if (ser.length > 2) side.append(spark(ser, y));
    }
    function spark(ser, cur) {
      const w = 190, hh = 44, x0 = ser[0].y, x1 = ser[ser.length - 1].y, mx = Math.max(...ser.map((p) => p.v)) * 1.1, mn = Math.min(0, ...ser.map((p) => p.v));
      const X = (v) => 4 + ((v - x0) / (x1 - x0)) * (w - 8), Y = (v) => hh - 4 - ((v - mn) / (mx - mn)) * (hh - 10);
      const d = ser.map((p, i) => (i ? 'L' : 'M') + X(p.y).toFixed(1) + ',' + Y(p.v).toFixed(1)).join('');
      const p = ser.find((q) => q.y === cur);
      return h('div', { class: 'bx-spark' }, h('span', {}, `% of GDP, ${x0}–${x1}`), h('svg:svg', { width: w, height: hh, viewBox: `0 0 ${w} ${hh}` },
        h('svg:path', { d, fill: 'none', stroke: BLUE, 'stroke-width': 1.8 }), p ? h('svg:circle', { cx: X(p.y), cy: Y(p.v), r: 3.4, fill: BLUE, stroke: '#fff', 'stroke-width': 1.5 }) : null));
    }
    observe(map, () => { nodes = {}; map.innerHTML = ''; draw(true); });
    legend.innerHTML = '<span class="bx-hint">Area = money. Slide the year to watch the budget change; open a block to see what is inside it. Nothing here is a forecast: every block is spending that happened.</span>';
  }
  function lum(hex) { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
  function squarify(items, x, y, w, hgt) {
    if (!items.length) return [];
    items = items.slice().sort((a, b) => b.v - a.v);
    const total = sum(items.map((i) => i.v)), scale = (w * hgt) / total;
    const nodes = items.map((i) => ({ ...i, a: i.v * scale }));
    const out = []; let row = [], rect = { x, y, w, h: hgt };
    const worst = (r, side) => { const s = sum(r.map((q) => q.a)), mx = Math.max(...r.map((q) => q.a)), mn = Math.min(...r.map((q) => q.a)); return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn)); };
    const lay = (r) => {
      const s = sum(r.map((q) => q.a));
      if (rect.w >= rect.h) { const cw = s / rect.h; let yy = rect.y; r.forEach((q) => { const hh = q.a / cw; out.push({ ...q, x: rect.x, y: yy, w: cw, h: hh }); yy += hh; }); rect = { x: rect.x + cw, y: rect.y, w: rect.w - cw, h: rect.h }; }
      else { const rh = s / rect.w; let xx = rect.x; r.forEach((q) => { const ww = q.a / rh; out.push({ ...q, x: xx, y: rect.y, w: ww, h: rh }); xx += ww; }); rect = { x: rect.x, y: rect.y + rh, w: rect.w, h: rect.h - rh }; }
    };
    for (const n of nodes) {
      const side = Math.min(rect.w, rect.h);
      if (!row.length || worst(row.concat(n), side) <= worst(row, side)) row.push(n); else { lay(row); row = [n]; }
    }
    if (row.length) lay(row);
    return out.map((q) => ({ ...q, x: q.x + 1, y: q.y + 1, w: Math.max(0, q.w - 2), h: Math.max(0, q.h - 2) }));
  }

  // ================================================================== side-by-side comparison
  function compareWidget(root) {
    const st = { sel: (root.dataset.countries || 'DEU,USA,FRA').split(','), metric: 'gdp', open: new Set() };
    const { ctrl, stage, legend } = frame(root, 'compare');
    const CC = ['#2a78d6', '#eb6834', '#1baf7a', '#e87ba4'];
    ctrl.append(seg([['gdp', '% of GDP'], ['share', '% of total'], ['pc', 'PPP $ per person']], st.metric, (v) => { st.metric = v; draw(); }));
    const add = countrySelect('', (v) => { if (v && !st.sel.includes(v) && st.sel.length < 4) { st.sel.push(v); draw(); } add.value = ''; }, FULL, '+ add country');
    ctrl.append(add);
    const chips = h('div', { class: 'bx-chips' });
    const grid = h('div', { class: 'bx-cmp' });
    stage.append(chips, grid);
    function draw() {
      chips.innerHTML = '';
      st.sel.forEach((iso, i) => chips.append(h('button', { type: 'button', class: 'bx-chip on', title: 'remove', onclick: () => { if (st.sel.length > 1) { st.sel.splice(i, 1); draw(); } } }, h('i', { style: `background:${CC[i]}` }), `${C[iso].name} ${C[iso].ly}`, ' ×')));
      const rows = [];
      L1.forEach((k) => {
        rows.push({ k, lvl: 0 });
        if (st.open.has(k)) subCodes(k).filter((s) => s.length === 6).forEach((s) => rows.push({ k: s, lvl: 1 }));
      });
      const val = (iso, k) => { const y = C[iso].ly; return convert(iso, y, cof(iso, y, k), cofTotal(iso, y), st.metric); };
      const mxTop = Math.max(...L1.flatMap((k) => st.sel.map((i) => val(i, k) || 0)));
      const mx = nice(mxTop * 1.15);
      grid.innerHTML = '';
      rows.forEach((r) => {
        const vals = st.sel.map((iso) => val(iso, r.k));
        const bars = h('div', { class: 'bx-cbars' }, st.sel.map((iso, i) => {
          const v = vals[i];
          return h('div', { class: 'bx-cb' }, h('i', { style: `width:${v == null ? 0 : (v / mx) * 100}%;background:${CC[i]}` }), h('em', {}, v == null ? 'n/a' : st.metric === 'pc' ? usd(v) : f1(v)));
        }));
        const name = h('button', { type: 'button', class: 'bx-cn l' + r.lvl, onclick: () => { if (r.lvl === 0) { st.open.has(r.k) ? st.open.delete(r.k) : st.open.add(r.k); draw(); } } }, r.lvl === 0 ? (st.open.has(r.k) ? '▾ ' : '▸ ') : '', nameOf(r.k));
        grid.append(h('div', { class: 'bx-crow l' + r.lvl }, name, bars));
      });
      const totals = st.sel.map((iso) => convert(iso, C[iso].ly, cofTotal(iso, C[iso].ly), cofTotal(iso, C[iso].ly), st.metric));
      grid.append(h('div', { class: 'bx-crow tot' }, h('span', { class: 'bx-cn' }, 'All spending'), h('div', { class: 'bx-cbars' }, st.sel.map((iso, i) => h('div', { class: 'bx-cb' }, h('em', { style: `color:${CC[i]}` }, st.metric === 'share' ? '100 %' : st.metric === 'pc' ? usd(totals[i]) : f1(totals[i]) + ' %'))))));
    }
    draw();
    legend.innerHTML = '<span class="bx-hint">Click a purpose to open its parts. Up to four countries, each in its latest year of data.</span>';
  }

  // ================================================================== time machine
  function linesWidget(root) {
    const FNOPTS = [['MIL', 'Military spending, SIPRI (all 33, to 2025)'], ['TOTAL', 'All spending'], ...L1.map((k) => [k, FN[k].name]), ['GF0201', 'Military defence'], ['GF0107', 'Public debt transactions (interest)'], ['GF1002', 'Old-age pensions'], ['GF0703', 'Hospital services'], ['GF0405', 'Transport'], ['GF0904', 'Tertiary education']];
    const st = { fn: root.dataset.fn || 'GF02', sel: (root.dataset.countries || 'DEU,USA,POL,GBR').split(','), metric: root.dataset.metric || 'gdp' };
    const PRESETS = [
      ['Military spending', 'MIL', 'USA,RUS,POL,DEU,CHN,ISR'.split(','), 'gdp'],
      ['Interest bills', 'GF0107', 'ITA,GBR,USA,DEU,BRA,JPN'.split(','), 'gdp'],
      ['Covid spending spike', 'TOTAL', 'USA,DEU,GBR,ITA,JPN,KOR'.split(','), 'gdp'],
      ['Pensions', 'GF1002', 'ITA,FIN,DEU,JPN,GBR,USA'.split(','), 'gdp'],
      ['Health', 'GF07', 'USA,GBR,DEU,JPN,CHN,KOR'.split(','), 'gdp'],
      ['Economic affairs', 'GF04', 'CHN,KOR,DEU,USA,POL,ZAF'.split(','), 'share'],
    ];
    const { ctrl, stage, legend } = frame(root, 'time machine');
    const fsel = h('select', { class: 'bx-select', 'aria-label': 'purpose', onchange: () => { st.fn = fsel.value; draw(); } }, FNOPTS.map(([k, n]) => h('option', { value: k }, n)));
    fsel.value = st.fn;
    const add = countrySelect('', (v) => { if (v && !st.sel.includes(v) && st.sel.length < 6) { st.sel.push(v); draw(); } add.value = ''; }, ISOS, '+ add country');
    const mseg = seg([['gdp', '% of GDP'], ['share', '% of spending']], st.metric, (v) => { st.metric = v; draw(); });
    ctrl.append(h('span', { class: 'bx-lbl' }, 'what'), fsel, mseg, add);
    const pre = h('div', { class: 'bx-chips' }, h('span', { class: 'bx-lbl' }, 'try'), PRESETS.map((p) => h('button', { type: 'button', class: 'bx-chip', onclick: () => { st.fn = p[1]; st.sel = p[2].slice(); st.metric = p[3]; fsel.value = st.fn; [...mseg.children].forEach((b) => b.classList.toggle('on', b.dataset.v === st.metric)); draw(); } }, p[0])));
    const chips = h('div', { class: 'bx-chips' });
    const svg = h('svg:svg', { class: 'bx-svg' });
    ctrl.after(pre, chips); stage.append(svg);
    const LC = ['#2a78d6', '#eb6834', '#1baf7a', '#e87ba4', '#4a3aa7', '#008300'];
    let hoverX = null;
    function series(iso) {
      const c = C[iso], out = [];
      if (st.fn === 'MIL') { for (let y = 2007; y <= 2025; y++) { const m = c.mil[y]; out.push([y, m && m.mil_gdp != null ? m.mil_gdp : null]); } return out; }
      for (const y of c.years) {
        const tot = cofTotal(iso, y);
        let v = st.fn === 'TOTAL' ? tot : cof(iso, y, st.fn);
        if (v == null) { out.push([y, null]); continue; }
        out.push([y, st.metric === 'share' ? (v / tot) * 100 : v]);
      }
      return out;
    }
    function draw() {
      chips.innerHTML = '';
      st.sel.forEach((iso, i) => chips.append(h('button', { type: 'button', class: 'bx-chip on', title: 'remove', onclick: () => { if (st.sel.length > 1) { st.sel.splice(i, 1); draw(); } } }, h('i', { style: `background:${LC[i]}` }), C[iso].name, ' ×')));
      if (st.fn === 'MIL' && st.metric !== 'gdp') { st.metric = 'gdp'; [...mseg.children].forEach((b) => b.classList.toggle('on', b.dataset.v === 'gdp')); }
      const W = stage.getBoundingClientRect().width || 720;
      if (W < 260) return;
      const H = W < 560 ? 340 : 400, m = { l: 44, r: W < 560 ? 70 : 120, t: 22, b: 28 };
      const data = st.sel.map((iso) => ({ iso, pts: series(iso) }));
      const all = data.flatMap((d) => d.pts.filter((p) => p[1] != null));
      const mx = nice(Math.max(1, ...all.map((p) => p[1])) * 1.08), x0 = 2007, x1 = 2025;
      const X = (y) => m.l + ((y - x0) / (x1 - x0)) * (W - m.l - m.r), Y = (v) => H - m.b - (v / mx) * (H - m.t - m.b);
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H); svg.innerHTML = '';
      ticks(mx, 5).forEach((t) => svg.append(h('svg:line', { x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t), stroke: '#e6eaf1' }), h('svg:text', { x: m.l - 6, y: Y(t) + 4, 'text-anchor': 'end', class: 'bx-t2' }, t)));
      for (let y = 2008; y <= 2025; y += 2) svg.append(h('svg:text', { x: X(y), y: H - 8, 'text-anchor': 'middle', class: 'bx-t2' }, y));
      EVENTS.forEach(([ey, en]) => { svg.append(h('svg:line', { x1: X(ey), x2: X(ey), y1: m.t, y2: H - m.b, stroke: RULE, 'stroke-dasharray': '3 3' }), h('svg:text', { x: X(ey) + 4, y: m.t - 8, class: 'bx-t2' }, en)); });
      svg.append(h('svg:text', { x: m.l, y: 11, class: 'bx-t2' }, METRIC_NAME[st.metric].replace('% of GDP', '% of GDP').replace('% of the total', '% of spending')));
      data.forEach((d, i) => {
        let path = '', open = false;
        d.pts.forEach(([y, v]) => { if (v == null) { open = false; return; } path += (open ? 'L' : 'M') + X(y).toFixed(1) + ',' + Y(v).toFixed(1); open = true; });
        svg.append(h('svg:path', { d: path, fill: 'none', stroke: LC[i], 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
        const last = [...d.pts].reverse().find((p) => p[1] != null);
        if (last) { svg.append(h('svg:circle', { cx: X(last[0]), cy: Y(last[1]), r: 3.6, fill: LC[i], stroke: '#fff', 'stroke-width': 1.5 })); d.last = last; }
      });
      // direct labels with simple de-overlap
      const labs = data.filter((d) => d.last).map((d, i) => ({ d, i, y: Y(d.last[1]) })).sort((a, b) => a.y - b.y);
      for (let i = 1; i < labs.length; i++) if (labs[i].y - labs[i - 1].y < 13) labs[i].y = labs[i - 1].y + 13;
      labs.forEach((l) => svg.append(h('svg:text', { x: X(l.d.last[0]) + 8, y: l.y + 4, class: 'bx-t', fill: INK }, `${C[l.d.iso].name.replace('United Kingdom', 'UK').replace('United States', 'USA')} ${l.d.last[0] < 2025 ? l.d.last[0] : ''}`)));
      const cur = h('svg:line', { y1: m.t, y2: H - m.b, stroke: INK, 'stroke-width': 1, opacity: 0 });
      svg.append(cur);
      const dots = data.map((d, i) => h('svg:circle', { r: 4, fill: LC[i], stroke: '#fff', 'stroke-width': 1.5, opacity: 0 }));
      dots.forEach((d) => svg.append(d));
      const hit = h('svg:rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' });
      hit.addEventListener('mousemove', (ev) => {
        const r = svg.getBoundingClientRect(), px = ev.clientX - r.left, yy = Math.round(x0 + ((px - m.l) / (W - m.l - m.r)) * (x1 - x0));
        if (yy < x0 || yy > x1) return;
        cur.setAttribute('x1', X(yy)); cur.setAttribute('x2', X(yy)); cur.setAttribute('opacity', 0.5);
        const lines = data.map((d, i) => { const p = d.pts.find((q) => q[0] === yy); dots[i].setAttribute('opacity', p && p[1] != null ? 1 : 0); if (p && p[1] != null) { dots[i].setAttribute('cx', X(yy)); dots[i].setAttribute('cy', Y(p[1])); } return `<tr><td><i style="background:${LC[i]}"></i>${C[d.iso].name}</td><td>${p && p[1] != null ? f1(p[1]) + ' %' : '–'}</td></tr>`; }).join('');
        showTip(ev, `<b>${yy}</b><table>${lines}</table>`);
      });
      hit.addEventListener('mouseleave', () => { hideTip(); cur.setAttribute('opacity', 0); dots.forEach((d) => d.setAttribute('opacity', 0)); });
      svg.append(hit);
    }
    observe(stage, draw);
    if (!root.dataset.caption) legend.innerHTML = '<span class="bx-hint">Each line stops at the last year the source has.</span>'; else legend.remove();
  }

  // ================================================================== fiscal scatter
  function scatterWidget(root) {
    const AX = {
      rev: ['Revenue (IMF WEO headline)', '% of GDP'], exp: ['Expenditure (IMF WEO headline)', '% of GDP'], bal: ['Net lending (+) / borrowing (−)', '% of GDP'], pbal: ['Primary balance', '% of GDP'],
      debt: ['Gross debt', '% of GDP'], pc_ppp: ['GDP per person', 'PPP $, log scale'], gdp_usd: ['GDP', 'US$, log scale'], mil: ['Military expenditure', '% of GDP'],
    };
    const st = { x: root.dataset.x || 'rev', y: root.dataset.y || 'exp', year: 2024, play: false, sel: null };
    const { ctrl, stage, legend } = frame(root, 'fiscal map');
    const opts = (cur) => Object.entries(AX).map(([k, [n]]) => h('option', { value: k, selected: k === cur }, n));
    const sx = h('select', { class: 'bx-select', onchange: () => { st.x = sx.value; draw(); } }, opts(st.x));
    const sy = h('select', { class: 'bx-select', onchange: () => { st.y = sy.value; draw(); } }, opts(st.y));
    const yr = h('input', { type: 'range', class: 'bx-range', min: 2005, max: 2025, value: st.year, 'aria-label': 'year' });
    const yl = h('span', { class: 'bx-yr' }, st.year);
    const play = h('button', { type: 'button', class: 'bx-play', onclick: () => toggle() }, '▶ play');
    ctrl.append(h('span', { class: 'bx-lbl' }, 'x'), sx, h('span', { class: 'bx-lbl' }, 'y'), sy, h('span', { class: 'bx-lbl' }, 'year'), yr, yl, play);
    const PRE = [['Spend vs collect', 'rev', 'exp'], ['Rich and indebted?', 'pc_ppp', 'debt'], ['Debt vs deficit', 'debt', 'bal'], ['Guns and taxes', 'rev', 'mil']];
    ctrl.after(h('div', { class: 'bx-chips' }, h('span', { class: 'bx-lbl' }, 'try'), PRE.map((p) => h('button', { type: 'button', class: 'bx-chip', onclick: () => { st.x = p[1]; st.y = p[2]; sx.value = st.x; sy.value = st.y; draw(); } }, p[0]))));
    const svg = h('svg:svg', { class: 'bx-svg' }); stage.append(svg);
    let timer = null;
    function toggle() {
      st.play = !st.play; play.textContent = st.play ? '❚❚ pause' : '▶ play';
      clearInterval(timer);
      if (st.play) { if (st.year >= 2025) st.year = 2005; timer = setInterval(() => { st.year++; if (st.year >= 2025) toggle(); yr.value = st.year; yl.textContent = st.year; draw(); }, 650); }
    }
    yr.addEventListener('input', () => { st.year = +yr.value; yl.textContent = st.year; draw(); });
    const val = (iso, k, y) => {
      if (k === 'mil') { const m = C[iso].mil[y]; return m ? m.mil_gdp : null; }
      return fiscal(iso, k, y);
    };
    function draw() {
      const W = stage.getBoundingClientRect().width || 720;
      if (W < 260) return;
      const H = W < 560 ? 420 : 500, m = { l: 52, r: 18, t: 16, b: 46 };
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H); svg.innerHTML = '';
      const logAx = (k) => k === 'pc_ppp' || k === 'gdp_usd';
      const pts = ISOS.map((iso) => ({ iso, x: val(iso, st.x, st.year), y: val(iso, st.y, st.year), g: fiscal(iso, 'gdp_usd', st.year) })).filter((p) => p.x != null && p.y != null && (!logAx(st.x) || p.x > 0) && (!logAx(st.y) || p.y > 0));
      // fixed axis ranges over all years so the play button does not rescale
      const allv = (k) => ISOS.flatMap((iso) => Array.from({ length: 21 }, (_, i) => val(iso, k, 2005 + i))).filter((v) => v != null && (!logAx(k) || v > 0));
      const rng = (k) => { const a = allv(k); let lo = Math.min(...a), hi = Math.max(...a); if (logAx(k)) { lo = Math.pow(10, Math.floor(Math.log10(lo))); hi = Math.pow(10, Math.ceil(Math.log10(hi))); } else { const pad = (hi - lo) * 0.06; lo = lo >= 0 ? 0 : Math.floor((lo - pad) / 5) * 5; hi = Math.ceil((hi + pad) / 5) * 5; } return [lo, hi]; };
      const [xl, xh] = rng(st.x), [yl_, yh] = rng(st.y);
      const sc = (k, lo, hi, a, b) => (v) => (logAx(k) ? a + ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (b - a) : a + ((v - lo) / (hi - lo)) * (b - a));
      const X = sc(st.x, xl, xh, m.l, W - m.r), Y = sc(st.y, yl_, yh, H - m.b, m.t);
      const tk = (k, lo, hi) => logAx(k) ? (() => { const o = []; for (let e = Math.log10(lo); e <= Math.log10(hi) + 1e-9; e++) o.push(Math.pow(10, e)); return o; })() : (() => { const o = [], step = nice((hi - lo) / 6); for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) o.push(v); return o; })();
      const fmtT = (k, v) => (k === 'pc_ppp' ? '$' + v / 1000 + 'k' : k === 'gdp_usd' ? (v >= 1e12 ? v / 1e12 + ' trn' : v / 1e9 + ' bn') : v);
      tk(st.y, yl_, yh).forEach((t) => svg.append(h('svg:line', { x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t), stroke: t === 0 && !logAx(st.y) ? RULE : '#e9edf3' }), h('svg:text', { x: m.l - 6, y: Y(t) + 4, 'text-anchor': 'end', class: 'bx-t2' }, fmtT(st.y, t))));
      tk(st.x, xl, xh).forEach((t) => svg.append(h('svg:line', { x1: X(t), x2: X(t), y1: m.t, y2: H - m.b, stroke: t === 0 && !logAx(st.x) ? RULE : '#e9edf3' }), h('svg:text', { x: X(t), y: H - m.b + 15, 'text-anchor': 'middle', class: 'bx-t2' }, fmtT(st.x, t))));
      svg.append(h('svg:text', { x: (m.l + W - m.r) / 2, y: H - 6, 'text-anchor': 'middle', class: 'bx-t' }, `${AX[st.x][0]}, ${AX[st.x][1]}`),
        h('svg:text', { x: 12, y: (m.t + H - m.b) / 2, class: 'bx-t', transform: `rotate(-90 12 ${(m.t + H - m.b) / 2})`, 'text-anchor': 'middle' }, `${AX[st.y][0]}, ${AX[st.y][1]}`));
      if (st.x === 'rev' && st.y === 'exp') { const lo = Math.max(xl, yl_), hi = Math.min(xh, yh); svg.append(h('svg:line', { x1: X(lo), y1: Y(lo), x2: X(hi), y2: Y(hi), stroke: INK, 'stroke-dasharray': '4 4', opacity: 0.5 }), h('svg:text', { x: X(hi) - 6, y: Y(hi) + 14, 'text-anchor': 'end', class: 'bx-t2' }, 'spending = revenue (balanced budget)')); }
      if (st.x === 'debt' && st.y === 'bal') svg.append(h('svg:line', { x1: m.l, x2: W - m.r, y1: Y(0), y2: Y(0), stroke: INK, opacity: 0.4 }));
      const rad = (g) => (g ? clamp(Math.sqrt(g / 1e12) * 4.6 + 3, 3, 24) : 4);
      // trail of the selected country
      if (st.sel) {
        const tr = []; for (let y = 2005; y <= 2025; y++) { const a = val(st.sel, st.x, y), b = val(st.sel, st.y, y); if (a != null && b != null && (!logAx(st.x) || a > 0) && (!logAx(st.y) || b > 0)) tr.push([y, X(a), Y(b)]); }
        svg.append(h('svg:path', { d: tr.map((p, i) => (i ? 'L' : 'M') + p[1].toFixed(1) + ',' + p[2].toFixed(1)).join(''), fill: 'none', stroke: WARM, 'stroke-width': 1.5, opacity: 0.8 }));
        tr.forEach((p) => { if (p[0] % 4 === 1 || p[0] === 2025) svg.append(h('svg:circle', { cx: p[1], cy: p[2], r: 2.5, fill: WARM }), h('svg:text', { x: p[1] + 4, y: p[2] - 5, class: 'bx-t2', fill: WARM }, p[0])); });
      }
      pts.sort((a, b) => b.g - a.g).forEach((p) => {
        const g = h('svg:g', { class: 'bx-pt' + (p.iso === st.sel ? ' sel' : '') });
        g.append(h('svg:circle', { cx: X(p.x), cy: Y(p.y), r: rad(p.g), fill: p.iso === st.sel ? WARM : BLUE, 'fill-opacity': p.iso === st.sel ? 0.5 : 0.28, stroke: p.iso === st.sel ? WARM : BLUE, 'stroke-width': 1.4 }),
          h('svg:text', { x: X(p.x), y: Y(p.y) + 3.2, 'text-anchor': 'middle', class: 'bx-iso' }, p.iso));
        g.addEventListener('mousemove', (ev) => showTip(ev, `<b>${C[p.iso].name}</b> <span>${st.year}</span><table><tr><td>${AX[st.x][0]}</td><td>${st.x === 'pc_ppp' ? usd(p.x) : st.x === 'gdp_usd' ? '$' + f1(p.x / 1e12) + ' trn' : f1(p.x) + ' %'}</td></tr><tr><td>${AX[st.y][0]}</td><td>${st.y === 'pc_ppp' ? usd(p.y) : st.y === 'gdp_usd' ? '$' + f1(p.y / 1e12) + ' trn' : f1(p.y) + ' %'}</td></tr><tr><td>GDP</td><td>$${f1(p.g / 1e12)} trn</td></tr></table><span>click to draw its path 2005–2025</span>`));
        g.addEventListener('mouseleave', hideTip);
        g.addEventListener('click', () => { st.sel = st.sel === p.iso ? null : p.iso; draw(); });
        svg.append(g);
      });
      svg.append(h('svg:text', { x: W - m.r, y: m.t + 12, 'text-anchor': 'end', class: 'bx-year' }, st.year));
    }
    observe(stage, draw);
    legend.remove();
  }

  // ------------------------------------------------------------------ boot
  const WIDGETS = { dollars: absWidget, stack: stackWidget, flow: sankeyWidget, tree: treeWidget, compare: compareWidget, lines: linesWidget, scatter: scatterWidget };
  fetch(BASE + 'budget.json').then((r) => r.json()).then((raw) => {
    prep(raw);
    for (const el of roots) { const w = WIDGETS[el.dataset.bx]; if (w) { try { w(el); } catch (e) { console.error(e); el.append(h('p', { class: 'bx-err' }, 'This figure failed to load: ' + e.message)); } } }
  }).catch((e) => roots.forEach((el) => { el.textContent = 'The data could not be loaded (' + e.message + ').'; }));
})();
