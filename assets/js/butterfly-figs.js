// Interactive figures of the butterfly long read (/blog/2026/butterfly-wing/). Each <figure data-bf="..."> is filled when it
// scrolls near the viewport. The 3D flight figure is in butterfly-flight3d.js (uses butterfly-core.js for the viewer); the others are plain SVG.
// Nothing is loaded from outside the site. 
import { FIG_PHYS } from './butterfly-physics.js';
import { figFlight } from './butterfly-flight3d.js';
import { FIG_BIO } from './butterfly-bio.js';
import { TAU, clamp } from './butterfly-core.js';

const NS = 'http://www.w3.org/2000/svg';
const INK = '#04204B', BLUE = '#0b4fc0', WARM = '#b4552f', TEAL = '#138374', MUTED = '#6b7280', RULE = '#c9d0dc', RED = '#c0392b';
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
const T = (x, y, txt, o = {}) => S('text', { x, y, 'font-size': o.s || 12, fill: o.c || INK, 'text-anchor': o.a || 'start', 'font-weight': o.w || 400, 'font-family': o.f || 'Inter, system-ui, sans-serif', class: o.cls }, txt);
const deg = (r) => (r * 180) / Math.PI;

function frame(root, kind) {
  root.classList.add('concept', 'bx', 'bf');
  const title = root.dataset.title, cap = root.dataset.caption;
  root.innerHTML = '';
  const ctrl = h('div', { class: 'bx-ctrl' }), stage = h('div', { class: 'bx-stage' }), legend = h('div', { class: 'bx-legend' });
  root.append(h('header', {}, h('span', { class: 'concept-kind' }, kind), h('span', { class: 'concept-title' }, title)), ctrl, stage, legend);
  if (cap) root.append(h('figcaption', {}, cap));
  return { ctrl, stage, legend };
}
function seg(options, current, onPick) {
  const wrap = h('span', { class: 'bx-seg' });
  for (const [v, label] of options) wrap.append(h('button', { type: 'button', class: v === current ? 'on' : '', 'data-v': v, 'aria-pressed': v === current ? 'true' : 'false', onclick: () => { onPick(v); set(wrap, v); } }, label));
  return wrap;
}
const set = (wrap, v) => [...wrap.children].forEach((b) => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); });
const chip = (label, on, fn) => { const b = h('button', { type: 'button', class: 'bx-chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: () => { const v = !b.classList.contains('on'); b.classList.toggle('on', v); b.setAttribute('aria-pressed', v); fn(v); } }, label); return b; };
const slider = (min, max, value, step, fn, label) => { const r = h('input', { type: 'range', class: 'bx-range', min, max, step: step || 'any', value, 'aria-label': label || 'value' }); r.addEventListener('input', () => fn(+r.value)); return r; };
const lbl = (t) => h('span', { class: 'bx-lbl' }, t);

// A play/pause button and a phase that advances while playing (shared by the animated figures)
function clock(host, { speed = 0.25, onPhase }) {
  const st = { ph: 0, playing: !REDUCED, speed };
  const play = h('button', { type: 'button', class: 'bx-play', onclick: () => { st.playing = !st.playing; play.textContent = st.playing ? '❚❚ pause' : '▶ play'; } }, st.playing ? '❚❚ pause' : '▶ play');
  const ph = slider(0, 1000, 0, 1, (v) => { st.ph = v / 1000; st.playing = false; play.textContent = '▶ play'; onPhase && onPhase(st.ph); }, 'phase of the wingbeat');
  st.play = play; st.slider = ph;
  st.tick = (dt) => { if (st.playing) { st.ph = (st.ph + st.speed * dt) % 1; ph.value = Math.round(st.ph * 1000); } };
  return st;
}

// ====================================================================================================
// 3. the lever (2D)
// ====================================================================================================
function figLever(root) {
  const { ctrl, stage, legend } = frame(root, 'lever');
  const st = { d: 0.2, lin: 0.4, lout: 3.5 };
  const svg = S('svg', { viewBox: '0 0 900 380', class: 'bf-svg', role: 'img', 'aria-label': 'Lever: a small roof movement becomes a large wing movement' }); stage.append(svg);
  const clk = clock(root, { speed: 0.3 });
  const o = { d: h('span', { class: 'bx-yr' }), lin: h('span', { class: 'bx-yr' }), lout: h('span', { class: 'bx-yr' }) };
  const sD = slider(0, 0.34, st.d, 0.005, (v) => { st.d = v; clk.playing = false; clk.play.textContent = '▶ play'; draw(); }, 'roof displacement');
  const sI = slider(0.2, 0.8, st.lin, 0.01, (v) => { st.lin = v; draw(); }, 'inner arm');
  const sO = slider(1, 4.2, st.lout, 0.05, (v) => { st.lout = v; draw(); }, 'outer arm');
  ctrl.append(clk.play, h('label', {}, lbl('roof drop δ '), sD, o.d), h('label', {}, lbl('inner arm '), sI, o.lin), h('label', {}, lbl('outer arm '), sO, o.lout));
  const read = h('div', { class: 'bf-read' }); legend.append(read);
  const K = 120, F = { x: 300, y: 170 }, floor = 330;
  function draw() {
    const a = Math.asin(Math.min(1, st.d / st.lin)), ca = Math.cos(a), sa = Math.sin(a);
    const I = { x: F.x - st.lin * K * ca, y: F.y + st.lin * K * sa }, tip = { x: F.x + st.lout * K * ca, y: F.y - st.lout * K * sa };
    const I0 = { x: F.x - st.lin * K, y: F.y }, tip0 = { x: F.x + st.lout * K, y: F.y };
    svg.innerHTML = '';
    svg.append(S('rect', { x: 0, y: 0, width: 900, height: 380, fill: '#fff' }));
    // thorax wall (pleura) and floor, roof plate, muscle
    svg.append(S('path', { d: `M${F.x},${F.y + 8} L${F.x},${floor - 14} Q${F.x},${floor} ${F.x - 24},${floor} L60,${floor}`, fill: 'none', stroke: '#8a6a3c', 'stroke-width': 8, 'stroke-linecap': 'round' }));
    svg.append(S('line', { x1: 60, y1: I.y, x2: I.x, y2: I.y, stroke: '#7a5a36', 'stroke-width': 8, 'stroke-linecap': 'round' }));
    svg.append(S('path', { d: `M${I.x},${I.y} Q${I.x + 4},${I.y + 18} ${F.x - 4},${F.y + 30}`, fill: 'none', stroke: TEAL, 'stroke-width': 3, 'stroke-dasharray': '5 3' }));
    const mw = 22 + 14 * (st.d / 0.34);
    svg.append(S('line', { x1: 150, y1: I.y + 14, x2: 150, y2: floor - 8, stroke: `rgb(${190 + 40 * st.d / 0.34},${80 - 30 * st.d / 0.34},${70 - 30 * st.d / 0.34})`, 'stroke-width': mw, 'stroke-linecap': 'round' }));
    svg.append(T(150, floor + 26, 'dorsoventral muscle', { a: 'middle', c: RED, s: 12 }));
    // ghost wing at rest, wing now
    svg.append(S('line', { x1: I0.x, y1: I0.y, x2: tip0.x, y2: tip0.y, stroke: '#cfd5e1', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': '2 8' }));
    svg.append(S('path', { d: `M${F.x + st.lout * K},${F.y} A${st.lout * K},${st.lout * K} 0 0 0 ${tip.x},${tip.y}`, fill: 'none', stroke: WARM, 'stroke-width': 2 }));
    svg.append(S('line', { x1: I.x, y1: I.y, x2: tip.x, y2: tip.y, stroke: '#e58a2b', 'stroke-width': 9, 'stroke-linecap': 'round' }));
    svg.append(S('path', { d: `M${F.x - 11},${F.y + 22} L${F.x},${F.y + 3} L${F.x + 11},${F.y + 22}Z`, fill: BLUE }), S('circle', { cx: F.x, cy: F.y, r: 7, fill: '#fff', stroke: BLUE, 'stroke-width': 3 }));
    // dimensions
    svg.append(S('line', { x1: I0.x, y1: I0.y + 2, x2: I0.x, y2: I.y, stroke: RED, 'stroke-width': 2 }), T(I0.x - 8, (I0.y + I.y) / 2 + 4, 'δ', { a: 'end', c: RED, s: 14, w: 700 }));
    svg.append(S('line', { x1: tip0.x + 14, y1: tip0.y, x2: tip0.x + 14, y2: tip.y, stroke: WARM, 'stroke-width': 2 }), T(tip0.x + 22, (tip0.y + tip.y) / 2 + 4, 'tip', { c: WARM, s: 13, w: 700 }));
    svg.append(T(F.x, F.y + 42, 'pleural wing process', { a: 'middle', c: BLUE, s: 12 }), T(F.x - st.lin * K / 2, F.y - 14, 'inner arm', { a: 'middle', s: 11, c: MUTED }), T(F.x + st.lout * K * 0.55, F.y - 18 - 8, 'outer arm (the wing)', { a: 'middle', s: 11, c: MUTED }));
    svg.append(T(60, I.y - 12, 'roof (notum)', { s: 12, c: '#7a5a36' }), T(F.x + 10, floor - 30, 'side wall (fixed)', { s: 12, c: '#8a6a3c' }));
    const tipTravel = Math.hypot(tip.x - tip0.x, tip.y - tip0.y) / K, gain = tipTravel / Math.max(1e-6, st.d);
    o.d.textContent = st.d.toFixed(2); o.lin.textContent = st.lin.toFixed(2); o.lout.textContent = st.lout.toFixed(1);
    read.innerHTML = `<span><b>wing angle</b> θ = arcsin(δ / inner arm) = ${deg(a).toFixed(1)}°</span><span><b>tip travel</b> ${tipTravel.toFixed(2)} thorax half-widths</span><span><b>gain</b> tip / roof ≈ ${gain.toFixed(1)}× (lever ratio ${(st.lout / st.lin).toFixed(1)})</span>`;
  }
  clk.speed = 0.3;
  const oldTick = clk.tick; let t = 0;
  new IntersectionObserver((e) => { vis = e[0].isIntersecting; if (vis) loop(); }).observe(root);
  let vis = false, last = performance.now();
  function loop() { if (!vis) return; const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; if (clk.playing) { t += dt * clk.speed; st.d = 0.17 + 0.17 * Math.sin(TAU * t); sD.value = st.d; draw(); } requestAnimationFrame(loop); }
  void oldTick; draw();
}

// ====================================================================================================
// 4. the muscle: sarcomere and the nerve
// ====================================================================================================
function figMuscle(root) {
  const { ctrl, stage, legend } = frame(root, 'muscle');
  const clk = clock(root, { speed: 0.25 });
  const st = { f: 12, which: 'dvm' };
  const grid = h('div', { class: 'bf-two' }); stage.append(grid);
  const sar = S('svg', { viewBox: '0 0 520 330', class: 'bf-svg', role: 'img', 'aria-label': 'One sarcomere shortening' });
  const spk = S('svg', { viewBox: '0 0 520 330', class: 'bf-svg', role: 'img', 'aria-label': 'Nerve impulses and force, synchronous against asynchronous muscle' });
  grid.append(h('div', {}, sar), h('div', {}, spk));
  const fOut = h('span', { class: 'bx-yr' }, '12 Hz');
  const sF = slider(0, 100, 17.6, 0.5, (v) => { st.f = Math.round(Math.pow(10, 0.7 + v / 100 * 2.3) * 10) / 10; fOut.textContent = st.f + ' Hz'; drawSpikes(); }, 'wingbeat frequency');
  const whichSeg = seg([['dvm', 'dorsoventral muscle'], ['dlm', 'dorsolongitudinal muscle']], 'dvm', (v) => { st.which = v; });
  ctrl.append(clk.play, clk.slider, lbl('muscle'), whichSeg, h('label', {}, lbl('wingbeat frequency '), sF, fOut));
  const read = h('div', { class: 'bf-read' }); legend.append(read);
  const L0 = 420, cx = 260;
  function drawSar() {
    const a = force(clk.ph, st.which), len = L0 * (1 - 0.2 * a), x0 = cx - len / 2, x1 = cx + len / 2;
    sar.innerHTML = '';
    sar.append(S('rect', { width: 520, height: 330, fill: '#fff' }), T(10, 22, 'One sarcomere, the repeating unit of the muscle fibre', { w: 700, s: 13 }));
    const y = 150, thick = 0.62 * L0;
    // thick filaments (myosin) centred, thin (actin) hang off the Z-discs
    for (const dy of [-44, -15, 15, 44]) {
      const yy = y + dy * 1.0;
      sar.append(S('line', { x1: cx - thick / 2, x2: cx + thick / 2, y1: yy, y2: yy, stroke: '#b4552f', 'stroke-width': 8, 'stroke-linecap': 'round' }));
      for (let i = 0; i < 14; i++) { const hx = cx - thick / 2 + 14 + (i / 13) * (thick - 28); if (Math.abs(hx - cx) < 14) continue; const ang = (a * 0.8 + 0.2) * 0.9 * (hx < cx ? 1 : -1); sar.append(S('line', { x1: hx, y1: yy, x2: hx + 12 * Math.sin(ang) * (hx < cx ? -1 : 1) * -1, y2: yy + (dy > 0 ? -1 : 1) * 12 * Math.cos(ang) * -1, stroke: '#b4552f', 'stroke-width': 2.4 })); }
    }
    for (const dy of [-30, 0, 30]) {
      const yy = y + dy;
      sar.append(S('line', { x1: x0, x2: x0 + 0.4 * L0, y1: yy, y2: yy, stroke: BLUE, 'stroke-width': 4.5, 'stroke-linecap': 'round' }), S('line', { x1: x1, x2: x1 - 0.4 * L0, y1: yy, y2: yy, stroke: BLUE, 'stroke-width': 4.5, 'stroke-linecap': 'round' }));
    }
    for (const x of [x0, x1]) sar.append(S('rect', { x: x - 5, y: y - 70, width: 10, height: 140, rx: 3, fill: INK }));
    // calcium
    if (a > 0.2) for (let i = 0; i < 14; i++) { const px = x0 + 20 + ((i * 37) % 1000) / 1000 * (len - 40), py = y - 62 + ((i * 53) % 100) * 1.24; sar.append(S('circle', { cx: px, cy: py, r: 3.2, fill: '#e8a317', opacity: clamp(a * 1.2, 0, 1) })); }
    sar.append(T(x0, y - 82, 'Z-disc', { a: 'middle', s: 11, c: MUTED }), T(x1, y - 82, 'Z-disc', { a: 'middle', s: 11, c: MUTED }), T(cx, y + 92, 'thick filament: myosin', { a: 'middle', c: WARM, s: 12 }), T(x0 + 10, y + 74, 'thin: actin', { c: BLUE, s: 12 }));
    sar.append(S('line', { x1: x0, x2: x1, y1: y + 112, y2: y + 112, stroke: INK, 'stroke-width': 1.5, 'marker-end': 'none' }), T(cx, y + 130, `sarcomere length ${(len / L0 * 100).toFixed(0)} % of rest`, { a: 'middle', s: 12 }));
    sar.append(T(10, 316, a > 0.2 ? 'Ca²⁺ released after the nerve impulse (dots) lets the myosin heads grab the actin and pull the Z-discs together.' : 'Resting: no Ca²⁺ in the fibre, heads detached.', { s: 11, c: MUTED }));
  }
  function drawSpikes() {
    const f = st.f, Tp = 1 / f, W = 6 * Tp, X = (t) => 50 + (t / W) * 450, tau = 0.012;
    spk.innerHTML = '';
    spk.append(S('rect', { width: 520, height: 330, fill: '#fff' }), T(10, 22, 'Nerve impulses and muscle force at ' + f + ' Hz', { w: 700, s: 13 }));
    const kern = (t) => (t < 0 ? 0 : (t / tau) * Math.exp(1 - t / tau));
    // synchronous: one impulse per wingbeat
    const N = 360, F1 = [], t0 = 0;
    for (let i = 0; i <= N; i++) { const t = (i / N) * W; let s = 0; for (let k = -6; k <= 7; k++) s += kern(t - (k * Tp + Tp * 0.25)); F1.push(s); }
    const mx = Math.max(...F1), mn = Math.min(...F1), ripple = mx > 0 ? (mx - mn) / mx : 0;
    const topY = 50, bot1 = 158;
    spk.append(T(10, 42, 'synchronous muscle (butterflies, moths)', { c: RED, w: 700, s: 12 }));
    let d = ''; F1.forEach((v, i) => { d += (i ? 'L' : 'M') + (50 + (i / N) * 450) + ',' + (bot1 - (v / (mx || 1)) * 62); });
    spk.append(S('line', { x1: 50, x2: 500, y1: bot1, y2: bot1, stroke: RULE }), S('path', { d, fill: 'none', stroke: RED, 'stroke-width': 2.2 }));
    for (let k = 0; k < 7; k++) { const t = k * Tp + Tp * 0.25; if (t > W) continue; spk.append(S('line', { x1: X(t), x2: X(t), y1: topY + 8, y2: topY + 22, stroke: INK, 'stroke-width': 2 })); }
    spk.append(T(500, topY + 20, 'nerve impulses', { a: 'end', s: 10.5, c: MUTED }), T(500, bot1 + 14, ripple > 0.5 ? `force swings ${(ripple * 100).toFixed(0)} % per beat` : `twitches fuse: ${(ripple * 100).toFixed(0)} % ripple`, { a: 'end', s: 11, c: ripple > 0.5 ? TEAL : WARM, w: 600 }));
    // asynchronous: the nerve fires slowly, the oscillation comes from stretch activation
    const bot2 = 290, nr = 8;
    spk.append(T(10, 188, 'asynchronous muscle (flies, bees, beetles)', { c: '#7b5ea7', w: 700, s: 12 }));
    d = ''; for (let i = 0; i <= N; i++) d += (i ? 'L' : 'M') + (50 + (i / N) * 450) + ',' + (bot2 - 34 - 28 * Math.sin(TAU * (i / N) * 6) * 1);
    spk.append(S('line', { x1: 50, x2: 500, y1: bot2, y2: bot2, stroke: RULE }), S('path', { d, fill: 'none', stroke: '#7b5ea7', 'stroke-width': 2.2 }));
    for (let k = 0; k < 3; k++) { const t = ((k + 0.3) / nr) ; if (t > W) continue; if (t < W) spk.append(S('line', { x1: X(t), x2: X(t), y1: 198, y2: 212, stroke: INK, 'stroke-width': 2 })); }
    spk.append(T(500, 210, 'nerve impulses, about ' + nr + ' per second', { a: 'end', s: 10.5, c: MUTED }), T(500, bot2 + 16, `${(f / nr).toFixed(f / nr < 10 ? 1 : 0)} wingbeats per nerve impulse`, { a: 'end', s: 11, c: '#7b5ea7', w: 600 }));
    spk.append(T(10, 322, 'Cartoon: twitch time constant 12 ms, nerve rate 8 Hz. The point is the scaling, not the numbers.', { s: 10.5, c: MUTED }));
    read.dataset.rip = ripple;
  }
  drawSpikes();
  let vis = false, last = performance.now();
  new IntersectionObserver((e) => { vis = e[0].isIntersecting; if (vis) loop(); }).observe(root);
  function loop() { if (!vis) return; const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; clk.tick(dt); drawSar(); const a = force(clk.ph, st.which); read.innerHTML = `<span><b>phase</b> ${clk.ph.toFixed(2)}</span><span><b>${st.which === 'dvm' ? 'DVM' : 'DLM'} activation</b> ${(a * 100).toFixed(0)} %</span><span><b>sarcomere</b> ${(100 - 20 * a).toFixed(0)} % of rest length</span>`; requestAnimationFrame(loop); }
  drawSar();
}

// ====================================================================================================
// 5. wingbeat frequency across insects
// ====================================================================================================
function figFreq(root) {
  const { stage, legend } = frame(root, 'chart');
  const rows = [
    ['Monarch butterfly', 10, 'sync', 'about 10 Hz'],
    ['Cabbage white (Pieris rapae)', 12.04, 'sync', '12.04 ± 1.31 Hz'],
    ['Hummingbird hawkmoth', 85, 'sync', 'about 85 Hz, the fast end for Lepidoptera'],
    ['Bumblebee', 180, 'async', 'about 180 Hz'],
    ['Mosquito', 800, 'async', 'more than 800 Hz'],
    ['Midge', 1000, 'async', 'up to about 1000 Hz'],
  ];
  const W = 900, rowH = 44, L = 250, svg = S('svg', { viewBox: `0 0 ${W} ${rows.length * rowH + 70}`, class: 'bf-svg', role: 'img', 'aria-label': 'Wingbeat frequency of six insects on a log axis' }); stage.append(svg);
  const X = (f) => L + (Math.log10(f) - 0.7) / (3.2 - 0.7) * (W - L - 40);
  [5, 10, 20, 50, 100, 200, 500, 1000].forEach((f) => { svg.append(S('line', { x1: X(f), x2: X(f), y1: 10, y2: rows.length * rowH + 14, stroke: '#eef1f6' }), T(X(f), rows.length * rowH + 32, f + '', { a: 'middle', s: 11, c: MUTED })); });
  svg.append(T(L + (W - L - 40) / 2, rows.length * rowH + 56, 'wingbeats per second (log scale)', { a: 'middle', s: 12, c: MUTED }));
  const tip = h('div', { class: 'bf-read' }, 'Hover a bar. Red: one nerve impulse per contraction. Violet: the muscle oscillates on its own, stretch-activated.'); legend.append(tip);
  rows.forEach(([n, f, k, note], i) => {
    const y = 14 + i * rowH, col = k === 'sync' ? RED : '#7b5ea7';
    const g = S('g', { style: 'cursor:default' });
    g.append(S('rect', { x: 0, y: y - 2, width: W, height: rowH - 6, fill: 'transparent' }), T(L - 12, y + 22, n, { a: 'end', s: 13 }), S('rect', { x: L, y: y + 6, width: X(f) - L, height: 22, rx: 4, fill: col, opacity: 0.88 }), T(X(f) + 8, y + 22, f >= 100 ? Math.round(f) + ' Hz' : f.toFixed(f % 1 ? 1 : 0) + ' Hz', { s: 12, w: 700, c: col }));
    g.addEventListener('mouseenter', () => { tip.textContent = `${n}: ${note}. ${k === 'sync' ? 'Synchronous flight muscle' : 'Asynchronous flight muscle'}.`; });
    svg.append(g);
  });
}

// ====================================================================================================
// 6. the thorax as a spring
// ====================================================================================================
function figSpring(root) {
  const { ctrl, stage, legend } = frame(root, 'resonance');
  const st = { Q: 8, f0: 12, fd: 12 };
  const svg = S('svg', { viewBox: '0 0 900 330', class: 'bf-svg', role: 'img', 'aria-label': 'Resonance curve of the thorax as a damped spring' }); stage.append(svg);
  const o = { Q: h('span', { class: 'bx-yr' }), f0: h('span', { class: 'bx-yr' }), fd: h('span', { class: 'bx-yr' }) };
  const sQ = slider(0.6, 20, 8, 0.1, (v) => { st.Q = v; draw(); }, 'quality factor'), sF = slider(4, 40, 12, 0.5, (v) => { st.f0 = v; draw(); }, 'natural frequency'), sD = slider(4, 40, 12, 0.5, (v) => { st.fd = v; draw(); }, 'wingbeat frequency');
  ctrl.append(h('label', {}, lbl('Q (low loss → high) '), sQ, o.Q), h('label', {}, lbl('natural frequency f₀ '), sF, o.f0), h('label', {}, lbl('wingbeat f '), sD, o.fd));
  const read = h('div', { class: 'bf-read' }); legend.append(read);
  const L = 70, R = 870, B = 270, Tp = 24;
  function draw() {
    svg.innerHTML = '';
    const amp = (f) => 1 / Math.sqrt((1 - (f / st.f0) ** 2) ** 2 + (f / st.f0 / st.Q) ** 2);
    const fx = (f) => L + ((f - 2) / 46) * (R - L), mxA = Math.max(1.2, amp(st.f0));
    const ya = (a) => B - (Math.min(a, 22) / Math.max(5, Math.min(22, mxA * 1.1))) * (B - Tp - 10);
    svg.append(S('rect', { width: 900, height: 330, fill: '#fff' }), S('line', { x1: L, x2: R, y1: B, y2: B, stroke: INK }), S('line', { x1: L, x2: L, y1: Tp, y2: B, stroke: INK }));
    [5, 10, 20, 30, 40].forEach((f) => svg.append(S('line', { x1: fx(f), x2: fx(f), y1: B, y2: B + 5, stroke: INK }), T(fx(f), B + 20, f + '', { a: 'middle', s: 11, c: MUTED })));
    svg.append(T((L + R) / 2, B + 44, 'drive frequency (Hz)', { a: 'middle', s: 12, c: MUTED }), T(14, 150, 'wing amplitude for the same muscle force', { s: 12, c: MUTED, cls: 'rot' }));
    svg.lastChild.setAttribute('transform', 'rotate(-90 14 150)'); svg.lastChild.setAttribute('x', 14); svg.lastChild.setAttribute('y', 150);
    let d = ''; for (let i = 0; i <= 300; i++) { const f = 2 + (i / 300) * 46; d += (i ? 'L' : 'M') + fx(f) + ',' + ya(amp(f)); }
    svg.append(S('path', { d, fill: 'none', stroke: BLUE, 'stroke-width': 2.6 }));
    svg.append(S('line', { x1: fx(st.f0), x2: fx(st.f0), y1: Tp, y2: B, stroke: BLUE, 'stroke-dasharray': '4 4', opacity: 0.5 }), T(fx(st.f0) + 6, Tp + 12, 'f₀ = ' + st.f0.toFixed(1) + ' Hz', { s: 11, c: BLUE }));
    const a = amp(st.fd);
    svg.append(S('circle', { cx: fx(st.fd), cy: ya(a), r: 7, fill: WARM }), T(fx(st.fd) + 12, ya(a) - 8, 'wingbeat', { s: 12, c: WARM, w: 700 }));
    // free ring-down at the bottom
    o.Q.textContent = st.Q.toFixed(1); o.f0.textContent = st.f0.toFixed(1) + ' Hz'; o.fd.textContent = st.fd.toFixed(1) + ' Hz';
    const lost = (1 - Math.exp(-TAU / st.Q)) * 100;
    read.innerHTML = `<span><b>amplitude at the wingbeat</b> ${a.toFixed(2)}× the static deflection</span><span><b>energy lost per beat</b> 1 − e^(−2π/Q) = ${lost.toFixed(0)} % of the stored elastic energy</span><span><b>muscle work</b> ${a < 1 ? 'larger than the spring can help with' : 'shared with the spring'} ${lost < 40 ? '· the spring returns most of it' : '· the spring returns little'}</span>`;
  }
  draw();
}

// ====================================================================================================
// 7. clap and fling
// ====================================================================================================
function figFling(root) {
  const { ctrl, stage, legend } = frame(root, 'schematic');
  const svg = S('svg', { viewBox: '0 0 900 340', class: 'bf-svg', role: 'img', 'aria-label': 'Two wings clap together and fling apart' }); stage.append(svg);
  const clk = clock(root, { speed: 0.18 });
  ctrl.append(clk.play, clk.slider);
  const read = h('div', { class: 'bf-read' }); legend.append(read);
  let vis = false, last = performance.now();
  new IntersectionObserver((e) => { vis = e[0].isIntersecting; if (vis) loop(); }).observe(root);
  function loop() { if (!vis) return; const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; clk.tick(dt); draw(); requestAnimationFrame(loop); }
  function draw() {
    const p = clk.ph; // 0 clap, 0..0.45 fling opens, 0.45..0.8 apart/downstroke, 0.8..1 closing
    const open = p < 0.45 ? p / 0.45 : p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2;
    const beta = open * 0.95; // opening angle of each wing from the vertical
    svg.innerHTML = '';
    svg.append(S('rect', { width: 900, height: 340, fill: '#fff' }));
    // view along the span: the two wings are lines in cross-section, hinged at the trailing edge (top). Thorax at the bottom.
    const cx = 450, hy = 230, Lw = 170;
    svg.append(S('ellipse', { cx, cy: 285, rx: 70, ry: 20, fill: '#d9c7a5', stroke: '#8a6a3c', 'stroke-width': 3 }));
    // the wings are lines seen edge-on, hinged at the touching trailing edges (bottom), leading edges up
    const tips = [1, -1].map((s) => ({ s, x: cx + s * Math.sin(beta) * Lw, y: hy - Math.cos(beta) * Lw }));
    // air drawn into the opening gap from above
    if (p > 0.04 && p < 0.7) for (let i = 0; i < 5; i++) { const u = (i - 2) / 2, x0 = cx + u * 150, y0 = 52, x1 = cx + u * 14 * (0.3 + open), y1 = hy - 28 - 70 * Math.min(1, open * 1.2); svg.append(S('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke: TEAL, 'stroke-width': 2, opacity: 0.8 }), S('circle', { cx: x1, cy: y1, r: 3.5, fill: TEAL })); }
    for (const t of tips) {
      svg.append(S('line', { x1: cx, y1: hy, x2: t.x, y2: t.y, stroke: '#e58a2b', 'stroke-width': 9, 'stroke-linecap': 'round' }));
      if (open > 0.15 && p < 0.8) svg.append(S('circle', { cx: t.x + t.s * 10, cy: t.y + 6, r: 8 + 20 * open, fill: 'none', stroke: WARM, 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }));
    }
    svg.append(S('circle', { cx, cy: hy, r: 6, fill: '#fff', stroke: BLUE, 'stroke-width': 3 }), T(cx + 14, hy + 20, 'trailing edges stay touching', { s: 12, c: MUTED }));
    svg.append(T(24, 30, p < 0.04 || p > 0.96 ? 'CLAP: the wings meet and squeeze the air out' : p < 0.45 ? 'FLING: the wings peel apart from the front, rotating about the trailing edges' : p < 0.8 ? 'the wings are apart; the stroke continues' : 'the wings swing back together', { s: 14, w: 700 }));
    svg.append(T(24, 330, 'View along the span from the head end, wings seen edge-on. Orange rings: leading-edge vortices. Green: air drawn into the opening gap.', { s: 11, c: MUTED }));
    read.innerHTML = `<span><b>opening</b> ${(deg(beta) * 2).toFixed(0)}° between the wings</span><span><b>idea</b> the gap opens faster than the air can fill it from outside, so the surrounding air rushes in and wraps round each wing as circulation</span>`;
  }
  draw();
}


// ====================================================================================================
const FIG = { flight: figFlight, lever: figLever, muscle: figMuscle, freq: figFreq, spring: figSpring, fling: figFling, ...FIG_PHYS, ...FIG_BIO };
const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { io.unobserve(e.target); const f = FIG[e.target.dataset.bf]; if (f) { try { f(e.target); } catch (err) { console.error(err); e.target.textContent = 'This figure failed to load: ' + err.message; } } } }, { rootMargin: '400px 0px' });
document.querySelectorAll('[data-bf]').forEach((el) => io.observe(el));
