// Interactive explorer for the German electricity long read: any day, week or month from 2015 to
// October 2026, hourly generation by source (stacked), load and day-ahead price.
// Data: assets/energy-article/explorer/YYYY.json, made by bin/energy_article/explorer_data.py from
// Energy-Charts (Fraunhofer ISE, CC BY 4.0). Generation and load in units of 100 MW.
(function () {
  'use strict';
  const root = document.querySelector('[data-energy-explorer]');
  if (!root) return;
  const BASE = root.dataset.base;
  const COL = {
    nuclear: '#7D5BA6', lignite: '#7A5230', hardcoal: '#3A3A3A', gas: '#D9762B', oil: '#8C3C4E', other: '#A3A9B4',
    biomass: '#5E8F2F', hydro: '#3AA6B9', pumped: '#86C3DD', wind_off: '#173F7E', wind_on: '#2F6FD0', solar: '#E3A21A',
    import: '#C9CED8',
  };
  const NAME = {
    nuclear: 'Nuclear', lignite: 'Lignite', hardcoal: 'Hard coal', gas: 'Gas', oil: 'Oil', other: 'Waste & other',
    biomass: 'Biomass', hydro: 'Hydro', pumped: 'Pumped storage', wind_off: 'Wind offshore', wind_on: 'Wind onshore',
    solar: 'Solar', import: 'Net imports',
  };
  const STACK = ['nuclear', 'lignite', 'hardcoal', 'gas', 'oil', 'other', 'biomass', 'hydro', 'pumped', 'wind_off', 'wind_on', 'solar', 'import'];
  const REN = ['biomass', 'hydro', 'wind_off', 'wind_on', 'solar'];
  const PRESETS = [
    ['2025-06-20', 1, 'Solar record, 20 Jun 2025'],
    ['2024-12-09', 7, 'Dunkelflaute, Dec 2024'],
    ['2024-11-02', 7, 'Dunkelflaute, Nov 2024'],
    ['2026-05-01', 1, '−500 EUR/MWh, 1 May 2026'],
    ['2025-10-24', 7, 'Wind record, Oct 2025'],
    ['2022-08-22', 7, 'Gas crisis, Aug 2022'],
    ['2023-04-10', 7, 'Last nuclear week, Apr 2023'],
    ['2025-12-22', 7, 'Christmas week 2025'],
  ];
  const cache = {};
  const load = (y) => cache[y] || (cache[y] = fetch(`${BASE}${y}.json`).then((r) => r.json()));

  root.innerHTML = `
    <div class="ee-controls">
      <button type="button" data-step="-1" aria-label="earlier">◀</button>
      <input type="date" min="2015-01-01" max="2026-10-16" value="2025-06-16">
      <button type="button" data-step="1" aria-label="later">▶</button>
      <span class="ee-span">${[1, 7, 28].map((n) => `<button type="button" data-span="${n}">${n === 1 ? 'day' : n === 7 ? 'week' : '4 weeks'}</button>`).join('')}</span>
      <select class="ee-preset"><option value="">jump to …</option>${PRESETS.map((p, i) => `<option value="${i}">${p[2]}</option>`).join('')}</select>
    </div>
    <div class="ee-stage"><canvas></canvas><div class="ee-tip" hidden></div></div>
    <div class="ee-stats"></div>
    <div class="ee-legend">${STACK.map((k) => `<span><i style="background:${COL[k]}${k === 'import' ? ';background-image:repeating-linear-gradient(45deg,#8a93a6 0 1px,transparent 1px 5px)' : ''}"></i>${NAME[k]}</span>`).join('')}<span><i class="ln"></i>Load</span><span><i class="ln pr"></i>Price</span></div>`;
  const $ = (s) => root.querySelector(s);
  const canvas = $('canvas'), tip = $('.ee-tip'), dateIn = $('input[type=date]');
  let span = 7, rows = null, hover = -1;

  function ymd(d) { return d.toISOString().slice(0, 10); }
  async function window_(startStr, days) {
    // hours from local midnight of start, over `days` days; may cross a year boundary
    const start = new Date(startStr + 'T00:00:00');
    const out = [];
    for (let i = 0; i < days * 24; i++) out.push(null);
    const years = new Set([start.getFullYear(), new Date(start.getTime() + days * 864e5).getFullYear()]);
    const t0 = start.getTime() / 1000;
    for (const y of years) {
      if (y < 2015 || y > 2026) continue;
      const d = await load(y);
      const n = d.d.load.length;
      for (let i = 0; i < out.length; i++) {
        const t = t0 + i * 3600;
        const j = Math.round((t - d.t0) / 3600);
        if (j < 0 || j >= n) continue;
        const r = { t };
        for (const k of d.keys) r[k] = d.d[k][j];
        out[i] = r;
      }
    }
    return out;
  }

  function draw() {
    if (!rows) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const L = 46, R = 50, T = 10, gap = 26;
    const h1 = (H - T - gap - 26) * 0.66, h2 = (H - T - gap - 26) * 0.34;
    const n = rows.length, pw = W - L - R;
    const X = (i) => L + (i / Math.max(n - 1, 1)) * pw;
    let ymax = 10;
    rows.forEach((r) => { if (!r) return; let s = 0; STACK.forEach((k) => { s += r[k] || 0; }); ymax = Math.max(ymax, s, r.load); });
    ymax = Math.ceil(ymax / 100) * 100; // units of 100 MW
    const Y = (v) => T + h1 - (v / ymax) * h1;
    const prices = rows.filter(Boolean).map((r) => r.price).filter((p) => p !== null);
    let pmin = Math.min(0, ...prices), pmax = Math.max(50, ...prices);
    const pad = (pmax - pmin) * 0.08; pmin -= pad; pmax += pad;
    const top2 = T + h1 + gap;
    const P = (v) => top2 + h2 - ((v - pmin) / (pmax - pmin)) * h2;
    ctx.font = "11px Inter, system-ui, sans-serif";
    // grid + axes
    ctx.strokeStyle = '#e6eaf1'; ctx.fillStyle = '#3D5F91'; ctx.lineWidth = 1;
    for (let g = 0; g <= ymax; g += ymax > 600 ? 200 : 100) {
      ctx.beginPath(); ctx.moveTo(L, Y(g)); ctx.lineTo(L + pw, Y(g)); ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(String(g / 10), L - 6, Y(g));
    }
    ctx.save(); ctx.translate(12, T + h1 / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('GW', 0, 0); ctx.restore();
    // stacked areas
    const base = new Array(n).fill(0);
    for (const k of STACK) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) { const r = rows[i]; const v = r ? r[k] || 0 : 0; const x = X(i); const y = Y(base[i] + v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(X(i), Y(base[i]));
      ctx.closePath();
      if (k === 'import') {
        ctx.fillStyle = '#eef0f4'; ctx.fill();
        ctx.save(); ctx.clip(); ctx.strokeStyle = '#8a93a6'; ctx.lineWidth = 0.7;
        for (let x = L - h1; x < L + pw + h1; x += 6) { ctx.beginPath(); ctx.moveTo(x, T + h1); ctx.lineTo(x + h1, T); ctx.stroke(); }
        ctx.restore();
      } else { ctx.fillStyle = COL[k]; ctx.fill(); }
      for (let i = 0; i < n; i++) base[i] += rows[i] ? rows[i][k] || 0 : 0;
    }
    // load line
    ctx.strokeStyle = '#04204B'; ctx.lineWidth = 1.8; ctx.beginPath();
    rows.forEach((r, i) => { if (!r) return; const y = Y(r.load); i ? ctx.lineTo(X(i), y) : ctx.moveTo(X(i), y); });
    ctx.stroke();
    // price panel
    ctx.strokeStyle = '#e6eaf1'; ctx.lineWidth = 1; ctx.fillStyle = '#B4552F';
    const step = (pmax - pmin) > 600 ? 200 : (pmax - pmin) > 250 ? 100 : 50;
    for (let g = Math.ceil(pmin / step) * step; g <= pmax; g += step) {
      ctx.beginPath(); ctx.moveTo(L, P(g)); ctx.lineTo(L + pw, P(g)); ctx.strokeStyle = g === 0 ? '#9aa6bd' : '#e6eaf1'; ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(String(g), L - 6, P(g));
    }
    ctx.save(); ctx.translate(12, top2 + h2 / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('EUR/MWh', 0, 0); ctx.restore();
    ctx.beginPath(); let started = false;
    rows.forEach((r, i) => { if (!r || r.price === null) return; const y = P(r.price); if (!started) { ctx.moveTo(X(i), y); started = true; } else ctx.lineTo(X(i), y); });
    ctx.strokeStyle = '#B4552F'; ctx.lineWidth = 1.6; ctx.stroke();
    // negative shading
    ctx.fillStyle = 'rgba(11,79,192,0.10)';
    if (pmin < 0) ctx.fillRect(L, P(0), pw, P(pmin) - P(0));
    // x labels: days
    ctx.fillStyle = '#3D5F91'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const days = n / 24;
    for (let dIdx = 0; dIdx <= days; dIdx++) {
      const i = Math.min(dIdx * 24, n - 1); const x = X(i);
      ctx.strokeStyle = '#d3d9e4'; ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, top2 + h2); ctx.stroke();
      if (dIdx < days && (days <= 7 || dIdx % 7 === 0) && rows[i]) {
        const d = new Date(rows[i].t * 1000);
        const narrow = days > 1 && pw / Math.min(days, 7) < 90;
        const lab = days === 1 ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
          : narrow ? d.toLocaleDateString('en-GB', { day: 'numeric', month: days > 7 ? 'short' : undefined })
          : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        ctx.fillText(lab, days === 1 ? L + pw / 2 : x + (days <= 7 ? pw / days / 2 : 0), top2 + h2 + 6);
      }
    }
    if (days === 1) for (let hh = 0; hh <= 24; hh += 3) { ctx.fillText(String(hh).padStart(2, '0'), X(Math.min(hh, 23)), T + h1 + 4); }
    // hover
    if (hover >= 0 && rows[hover]) {
      const x = X(hover);
      ctx.strokeStyle = '#04204B'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, top2 + h2); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function stats() {
    const ok = rows.filter(Boolean);
    if (!ok.length) { $('.ee-stats').textContent = 'No data for this window.'; return; }
    let gen = 0, ren = 0, sol = 0, wnd = 0, ld = 0, ps = [], neg = 0;
    ok.forEach((r) => {
      STACK.forEach((k) => { if (k !== 'import') gen += r[k] || 0; });
      REN.forEach((k) => { ren += r[k] || 0; });
      sol += r.solar; wnd += r.wind_on + r.wind_off; ld += r.load;
      if (r.price !== null) { ps.push(r.price); if (r.price < 0) neg++; }
    });
    const avg = ps.reduce((a, b) => a + b, 0) / Math.max(ps.length, 1);
    const f = (v) => (v / 10).toFixed(v >= 1e4 ? 0 : 1);
    $('.ee-stats').innerHTML = `
      <span><b>${(ld / 10 / 1000).toFixed(ok.length > 48 ? 1 : 2)} TWh</b> load</span>
      <span><b>${Math.round(100 * ren / ld)} %</b> of load from renewables</span>
      <span><b>${Math.round(100 * sol / ld)} %</b> solar · <b>${Math.round(100 * wnd / ld)} %</b> wind</span>
      <span><b>${avg.toFixed(0)}</b> EUR/MWh average price</span>
      <span><b>${Math.min(...ps).toFixed(0)} … ${Math.max(...ps).toFixed(0)}</b> range</span>
      <span><b>${neg}</b> negative hours</span>`;
  }

  async function update() {
    rows = await window_(dateIn.value, span);
    root.querySelectorAll('[data-span]').forEach((b) => b.classList.toggle('on', +b.dataset.span === span));
    draw(); stats();
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.span) { span = +b.dataset.span; update(); }
    if (b.dataset.step) {
      const d = new Date(dateIn.value + 'T12:00:00');
      d.setDate(d.getDate() + (+b.dataset.step) * span);
      const s = ymd(d);
      if (s >= dateIn.min && s <= dateIn.max) { dateIn.value = s; update(); }
    }
  });
  dateIn.addEventListener('change', update);
  $('.ee-preset').addEventListener('change', (e) => {
    const p = PRESETS[+e.target.value];
    if (!p) return;
    dateIn.value = p[0]; span = p[1]; update();
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!rows) return;
    const rect = canvas.getBoundingClientRect();
    const L = 46, R = 50, pw = rect.width - L - R;
    const i = Math.round(((e.clientX - rect.left - L) / pw) * (rows.length - 1));
    if (i < 0 || i >= rows.length || !rows[i]) { hover = -1; tip.hidden = true; draw(); return; }
    hover = i; draw();
    const r = rows[i];
    const d = new Date(r.t * 1000);
    const top = STACK.filter((k) => (r[k] || 0) >= 5).sort((a, b) => r[b] - r[a]).slice(0, 5);
    tip.innerHTML = `<b>${d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</b>
      <div>load ${(r.load / 10).toFixed(1)} GW · price ${r.price === null ? '–' : r.price.toFixed(1) + ' EUR/MWh'}</div>
      ${top.map((k) => `<div><i style="background:${COL[k]}"></i>${NAME[k]} ${(r[k] / 10).toFixed(1)} GW</div>`).join('')}`;
    tip.hidden = false;
    const x = e.clientX - rect.left;
    tip.style.left = (x > rect.width / 2 ? x - tip.offsetWidth - 12 : x + 12) + 'px';
    tip.style.top = '8px';
  });
  canvas.addEventListener('mouseleave', () => { hover = -1; tip.hidden = true; draw(); });
  window.addEventListener('resize', draw);
  const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); update(); } }, { rootMargin: '300px' });
  io.observe(root);
})();
