// The physics figures of the butterfly-wing long read: load budget, lever and muscle limits, spring-wing power, muscle work loop.
// Models are in butterfly-phys-core.js (pure functions); this file only draws them. All SVG, nothing loaded from outside.
import { REF, MUSCLE, TAU, G, RHO, wingModel, liftTrace, liftSummary, springWing, workLoop, bestPhase } from './butterfly-phys-core.js';

const NS = 'http://www.w3.org/2000/svg';
const INK = '#04204B', BLUE = '#0b4fc0', WARM = '#b4552f', TEAL = '#138374', MUTED = '#6b7280', RULE = '#c9d0dc', RED = '#c0392b', VIOLET = '#7b5ea7', GRID = '#eef1f6';

export function h(tag, attrs, ...kids) {
  const svg = tag.startsWith('svg:');
  const e = svg ? document.createElementNS(NS, tag.slice(4)) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.setAttribute('class', v); else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
export const S = (tag, attrs, ...kids) => h('svg:' + tag, attrs, ...kids);
export const T = (x, y, txt, o = {}) => S('text', { x, y, 'font-size': o.s || 12, fill: o.c || INK, 'text-anchor': o.a || 'start', 'font-weight': o.w || 400, 'font-family': 'Inter, system-ui, sans-serif', transform: o.rot ? `rotate(${o.rot} ${x} ${y})` : null }, txt);
export function frame(root, kind) {
  root.classList.add('concept', 'bx', 'bf'); const title = root.dataset.title, cap = root.dataset.caption; root.innerHTML = '';
  const ctrl = h('div', { class: 'bf-sl' }), stage = h('div', { class: 'bx-stage' }), legend = h('div', { class: 'bx-legend' });
  root.append(h('header', {}, h('span', { class: 'concept-kind' }, kind), h('span', { class: 'concept-title' }, title)), ctrl, stage, legend);
  if (cap) root.append(h('figcaption', {}, cap));
  return { ctrl, stage, legend };
}
// a labelled slider: returns {el, set(v)}; fmt formats the value shown
export function param(ctrl, label, min, max, step, value, fmt, fn) {
  const out = h('span', { class: 'bx-yr' }), r = h('input', { type: 'range', class: 'bx-range', min, max, step, value, 'aria-label': label });
  const upd = () => { out.textContent = fmt(+r.value); };
  r.addEventListener('input', () => { upd(); fn(+r.value); }); upd();
  ctrl.append(h('label', {}, h('span', { class: 'bx-lbl' }, label), r, out));
  return { el: r, set: (v) => { r.value = v; upd(); } };
}
// axes: returns mapping functions. opts: x [a,b], y [a,b], xt/yt tick arrays, xl/yl labels, box [L,R,T,B] inside a W x H viewBox
function axes(svg, o) {
  const [L, R, Tp, B] = o.box, X = (x) => L + ((x - o.x[0]) / (o.x[1] - o.x[0])) * (R - L), Y = (y) => B - ((y - o.y[0]) / (o.y[1] - o.y[0])) * (B - Tp);
  for (const t of o.yt || []) { svg.append(S('line', { x1: L, x2: R, y1: Y(t), y2: Y(t), stroke: t === 0 ? RULE : GRID }), T(L - 6, Y(t) + 4, o.yf ? o.yf(t) : t, { a: 'end', s: 10.5, c: MUTED })); }
  for (const t of o.xt || []) { svg.append(S('line', { x1: X(t), x2: X(t), y1: B, y2: B + 4, stroke: MUTED }), T(X(t), B + 17, o.xf ? o.xf(t) : t, { a: 'middle', s: 10.5, c: MUTED })); }
  svg.append(S('line', { x1: L, x2: R, y1: B, y2: B, stroke: INK }), S('line', { x1: L, x2: L, y1: Tp, y2: B, stroke: INK }));
  if (o.xl) svg.append(T((L + R) / 2, B + 36, o.xl, { a: 'middle', s: 11.5, c: MUTED }));
  if (o.yl) svg.append(T(14, (Tp + B) / 2, o.yl, { a: 'middle', s: 11.5, c: MUTED, rot: -90 }));
  return { X, Y };
}
function nice(max, n = 4) { const raw = max / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag, st = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag; const out = []; for (let v = 0; v <= max * 1.0001; v += st) out.push(+v.toFixed(10)); return out; }
const path = (pts, X, Y) => pts.map(([x, y], i) => (i ? 'L' : 'M') + X(x).toFixed(1) + ',' + Y(y).toFixed(1)).join('');
const fmtE = (v, d = 1) => { const [m, e] = v.toExponential(d).split('e'); return `${m}·10<sup>${e.replace('+', '').replace('-', '−')}</sup>`; };
const mN = (v) => (v * 1e3).toFixed(2) + ' mN';
const fix = (v, d) => v.toFixed(d);
export function readout(el, parts) { el.innerHTML = parts.map(([k, v]) => `<span><b>${k}</b> ${v}</span>`).join(''); }
function twoPanel(stage) { const a = S('svg', { class: 'bf-svg', viewBox: '0 0 520 320' }), b = S('svg', { class: 'bf-svg', viewBox: '0 0 520 320' }); stage.append(h('div', { class: 'bf-two' }, a, b)); return [a, b]; }

// ====================================================================================================
// A. load budget: what the wings have to do just to hold the animal up
// ====================================================================================================
export function figLoad(root) {
  const { ctrl, stage, legend } = frame(root, 'load budget');
  const p = { ...REF }, svg = S('svg', { class: 'bf-svg', viewBox: '0 0 900 340', role: 'img', 'aria-label': 'Vertical force of the wings over one wingbeat compared with the weight' }); stage.append(svg);
  const read = h('div', { class: 'bf-read' }); legend.append(read);
  param(ctrl, 'body mass', 20, 600, 5, p.m * 1e6, (v) => v.toFixed(0) + ' mg', (v) => { p.m = v * 1e-6; draw(); });
  param(ctrl, 'wing area (per side)', 1, 20, 0.1, p.S * 1e4, (v) => v.toFixed(1) + ' cm²', (v) => { const k = Math.sqrt(v / (p.S * 1e4)); p.S = v * 1e-4; p.R *= k; draw(); });
  param(ctrl, 'wingbeat frequency', 3, 30, 0.5, p.f, (v) => v.toFixed(1) + ' Hz', (v) => { p.f = v; draw(); });
  param(ctrl, 'stroke half-amplitude', 20, 90, 1, (p.phi * 180) / Math.PI, (v) => v.toFixed(0) + '°', (v) => { p.phi = (v * Math.PI) / 180; draw(); });
  param(ctrl, 'angle of attack', 10, 80, 1, p.alpha, (v) => v.toFixed(0) + '°', (v) => { p.alpha = v; draw(); });
  function draw() {
    svg.innerHTML = '';
    const tr = liftTrace(p), s = liftSummary(p), top = Math.max(s.peak, s.weight) * 1.15;
    const unit = top > 2e-3 ? [1e3, 'mN'] : [1e6, 'µN'];
    const { X, Y } = axes(svg, { box: [70, 640, 24, 290], x: [0, 1], y: [0, top * unit[0]], xt: [0, 0.25, 0.5, 0.75, 1], xf: (t) => ['top', '↓ mid-downstroke', 'bottom', '↑ mid-upstroke', 'top'][t * 4], xl: 'one wingbeat (both wings, normal force resolved vertically)', yl: 'vertical force (' + unit[1] + ')', yt: nice(top * unit[0]), yf: (t) => (t >= 100 ? t.toFixed(0) : t) });
    svg.append(S('path', { d: path(tr.map((q) => [q.ph, q.F * unit[0]]), X, Y) + `L${X(1)},${Y(0)}L${X(0)},${Y(0)}Z`, fill: BLUE, opacity: 0.1 }), S('path', { d: path(tr.map((q) => [q.ph, q.F * unit[0]]), X, Y), fill: 'none', stroke: BLUE, 'stroke-width': 2.6 }));
    svg.append(S('line', { x1: X(0), x2: X(1), y1: Y(s.weight * unit[0]), y2: Y(s.weight * unit[0]), stroke: WARM, 'stroke-width': 2, 'stroke-dasharray': '6 4' }), T(X(1) + 8, Y(s.weight * unit[0]) + 4, 'weight m g', { c: WARM, s: 12, w: 700 }));
    svg.append(S('line', { x1: X(0), x2: X(1), y1: Y(s.mean * unit[0]), y2: Y(s.mean * unit[0]), stroke: BLUE, 'stroke-width': 1.6, 'stroke-dasharray': '2 4' }), T(X(1) + 8, Y(s.mean * unit[0]) + 4, 'mean lift', { c: BLUE, s: 12, w: 700 }));
    const ok = s.ratio >= 1;
    readout(read, [['mean lift / weight', `<i style="color:${ok ? TEAL : WARM}">${fix(s.ratio, 2)}</i>`], ['half-amplitude that just carries the weight', fix((s.phiReq * 180) / Math.PI, 0) + '°'], ['wing loading', fix(s.loading, 2) + ' N/m²'], ['peak wing-tip speed', fix(s.U / p.r2, 1) + ' m/s'], ['Reynolds number', fix(s.Re, 0)], ['C<sub>L</sub> = C<sub>N,max</sub> sin α cos α', fix(s.CL, 2)]]);
  }
  draw();
}

// ====================================================================================================
// B. lever: force against displacement, the window the muscle can work in
// ====================================================================================================
export function figTransmission(root) {
  const { ctrl, stage, legend } = frame(root, 'lever and muscle limits');
  const p = { ...REF }, st = { lin: 0.5, ml: 8, epsMax: 0.08, fmr: 0.2 };
  const [a, b] = twoPanel(stage); const read = h('div', { class: 'bf-read' }); legend.append(read);
  param(ctrl, 'inner arm ℓ<sub>in</sub>', 0.1, 3, 0.05, st.lin, (v) => v.toFixed(2) + ' mm', (v) => { st.lin = v; draw(); });
  param(ctrl, 'muscle length', 3, 15, 0.5, st.ml, (v) => v.toFixed(1) + ' mm', (v) => { st.ml = v; draw(); });
  param(ctrl, 'flight muscle / body mass', 0.05, 0.45, 0.01, st.fmr, (v) => (v * 100).toFixed(0) + ' %', (v) => { st.fmr = v; draw(); });
  param(ctrl, 'stroke half-amplitude', 20, 90, 1, (p.phi * 180) / Math.PI, (v) => v.toFixed(0) + '°', (v) => { p.phi = (v * Math.PI) / 180; draw(); });
  ctrl.querySelectorAll('label span.bx-lbl').forEach((e) => { e.innerHTML = e.textContent; });
  function draw() {
    const w = wingModel(p), sw = springWing(p, 1.0), tauPk = sw.tauPeak;             // spring tuned to the beat: the lightest muscle load
    const vol = (st.fmr * p.m) / MUSCLE.rho / 2;                                       // one muscle set = half the flight muscle
    const Area = (vol / (st.ml * 1e-3)) / 2;                                           // the set drives both wings: the share of its cross-section that carries one wing's torque
    const lin = (l) => l * 1e-3, F = (l) => tauPk / (lin(l) * Math.cos(Math.min(p.phi, 1.4))), strain = (l) => (lin(l) * Math.sin(p.phi)) / (st.ml * 1e-3);
    const stressFrac = (l) => F(l) / Area / MUSCLE.sigma, strFrac = (l) => strain(l) / st.epsMax;
    // left: geometry drawn to scale for the chosen arm
    a.innerHTML = '';
    const Fx = 300, Fy = 175;                                                              // wing drawn compressed (not to scale)
    const th = p.phi, lpx = Math.max(24, st.lin * 60), wing = 150;
    const ix = (t) => Fx - lpx * Math.cos(t), iy = (t) => Fy + lpx * Math.sin(t), tx = (t) => Fx + wing * Math.cos(t), ty = (t) => Fy - wing * Math.sin(t);
    a.append(S('rect', { width: 520, height: 320, fill: '#fff' }));
    a.append(S('line', { x1: 30, x2: Fx, y1: iy(-th), y2: iy(-th), stroke: '#c9b79a', 'stroke-width': 5, 'stroke-dasharray': '2 5' }), S('line', { x1: 30, x2: ix(th), y1: iy(th), y2: iy(th), stroke: '#7a5a36', 'stroke-width': 6, 'stroke-linecap': 'round' }));
    a.append(S('line', { x1: ix(0), y1: Fy, x2: tx(0), y2: Fy, stroke: '#d6dbe6', 'stroke-width': 4, 'stroke-dasharray': '2 6' }));
    for (const [t, c, o] of [[-th, '#e58a2b', 0.35], [th, '#e58a2b', 1]]) a.append(S('line', { x1: ix(t), y1: iy(t), x2: tx(t), y2: ty(t), stroke: c, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: o }));
    a.append(S('path', { d: `M${Fx - 10},${Fy + 24} L${Fx},${Fy + 4} L${Fx + 10},${Fy + 24}Z`, fill: BLUE }), S('circle', { cx: Fx, cy: Fy, r: 6, fill: '#fff', stroke: BLUE, 'stroke-width': 3 }));
    a.append(T(Fx + 14, Fy + 40, 'fulcrum', { c: BLUE, s: 11 }), T(40, iy(th) - 10, 'roof moves δ = ℓ_in sin θ_a', { s: 11, c: '#7a5a36' }), T(Fx - lpx / 2, Fy - 26, 'ℓ_in', { a: 'middle', s: 12, c: INK, w: 700 }), T(Fx + 20, 30, 'wing R = ' + (p.R * 1e3).toFixed(0) + ' mm, drawn shorter', { s: 11, c: MUTED }));
    a.append(T(30, 262, `peak roof displacement δ = ${(lin(st.lin) * Math.sin(p.phi) * 1e3).toFixed(2)} mm`, { s: 12, w: 700 }), T(30, 281, `muscle strain ε = δ / L = ${(strain(st.lin) * 100).toFixed(1)} %`, { s: 12 }), T(30, 300, `peak force ${(F(st.lin) * 1e3).toFixed(0)} mN → stress ${(F(st.lin) / Area / 1e3).toFixed(0)} kPa`, { s: 12 }));
    // right: both utilisations against the inner arm
    b.innerHTML = '';
    const { X, Y } = axes(b, { box: [58, 500, 24, 262], x: [Math.log10(0.1), Math.log10(3)], y: [0, 2], xt: [0.1, 0.2, 0.5, 1, 2].map(Math.log10), xf: (t) => +Math.pow(10, t).toFixed(1), xl: 'inner arm ℓ_in (mm, log axis)', yl: 'fraction of what the muscle can do', yt: [0, 0.5, 1, 1.5, 2], yf: (t) => (t * 100).toFixed(0) + '%' });
    const Xl = (l) => X(Math.log10(l));
    const ls = Array.from({ length: 80 }, (_, i) => 0.1 * Math.pow(30, i / 79));
    const ok = ls.filter((l) => stressFrac(l) <= 1 && strFrac(l) <= 1);
    if (ok.length) b.append(S('rect', { x: Xl(ok[0]), width: Xl(ok[ok.length - 1]) - Xl(ok[0]), y: Y(2), height: Y(0) - Y(2), fill: TEAL, opacity: 0.08 }), T((Xl(ok[0]) + Xl(ok[ok.length - 1])) / 2, 262 - 6, 'both within limits', { a: 'middle', s: 11, c: TEAL, w: 700 }));
    b.append(S('line', { x1: 58, x2: 500, y1: Y(1), y2: Y(1), stroke: INK, 'stroke-dasharray': '4 3', opacity: 0.5 }));
    b.append(S('path', { d: ls.map((l, i) => (i ? 'L' : 'M') + Xl(l) + ',' + Y(Math.min(2, stressFrac(l)))).join(''), fill: 'none', stroke: RED, 'stroke-width': 2.4 }), S('path', { d: ls.map((l, i) => (i ? 'L' : 'M') + Xl(l) + ',' + Y(Math.min(2, strFrac(l)))).join(''), fill: 'none', stroke: VIOLET, 'stroke-width': 2.4 }));
    b.append(T(Xl(0.11), Y(1.45), 'stress / 250 kPa', { c: RED, s: 11.5, w: 700 }), T(Xl(0.9), Y(0.28), 'strain / ' + (st.epsMax * 100).toFixed(0) + ' %', { c: VIOLET, s: 11.5, w: 700 }), S('circle', { cx: Xl(st.lin), cy: Y(Math.min(2, stressFrac(st.lin))), r: 5.5, fill: RED }), S('circle', { cx: Xl(st.lin), cy: Y(Math.min(2, strFrac(st.lin))), r: 5.5, fill: VIOLET }));
    const work = F(st.lin) * lin(st.lin) * Math.sin(p.phi);
    readout(read, [['peak torque per wing', fmtE(tauPk, 1) + ' N·m'], ['work per half-stroke', (work * 1e6).toFixed(1) + ' µJ (independent of ℓ<sub>in</sub>)'], ['stress / strain at this arm', `${(stressFrac(st.lin) * 100).toFixed(0)} % of σ<sub>max</sub> · ${(strFrac(st.lin) * 100).toFixed(0)} % of ε<sub>max</sub>`], ['lever ratio R / ℓ<sub>in</sub>', (p.R / lin(st.lin)).toFixed(0)]]);
  }
  draw();
}

// ====================================================================================================
// C. spring-wing: torques, power, the Weis-Fogh number
// ====================================================================================================
export function figSpringWing(root) {
  const { ctrl, stage, legend } = frame(root, 'spring and wing');
  const p = { ...REF }, st = { rf: 1.2, mult: 1, gam: 0.1, none: false };
  const [a, b] = twoPanel(stage); const read = h('div', { class: 'bf-read' }); legend.append(read);
  const sRf = param(ctrl, 'wingbeat / hinge resonance ratio', 0.2, 4, 0.05, st.rf, (v) => (st.none ? 'no spring' : v.toFixed(2)), (v) => { st.rf = v; st.none = false; draw(); });
  param(ctrl, 'wing inertia ×', 0.3, 30, 0.1, st.mult, (v) => v.toFixed(1) + '×', (v) => { st.mult = v; draw(); });
  param(ctrl, 'hinge loss (internal friction)', 0, 0.4, 0.01, st.gam, (v) => v.toFixed(2), (v) => { st.gam = v; draw(); });
  const none = h('button', { type: 'button', class: 'bx-chip', onclick: () => { st.none = !st.none; none.classList.toggle('on', st.none); sRf.set(st.rf); draw(); } }, 'remove the spring');
  ctrl.append(none);
  const pw = () => ({ ...p, mw: p.mw * st.mult });
  function sweep(q, gam) { const p0 = springWing(q, 0, gam, 160).Ppos, out = []; for (let i = 0; i <= 70; i++) { const rf = 0.2 + (3.8 * i) / 70; out.push([rf, springWing(q, rf, gam, 160).Ppos / p0]); } return out; }
  function draw() {
    const q = pw(), r = springWing(q, st.none ? 0 : st.rf, st.gam), r0 = springWing(q, 0, st.gam), w = r.w;
    a.innerHTML = ''; b.innerHTML = '';
    const tm = Math.max(...r.tM.map(Math.abs), ...r0.tM.map(Math.abs), r.tauPeak) * 1.1, u = tm > 1e-4 ? [1e3, 'mN·m'] : [1e6, 'µN·m'];
    const A = axes(a, { box: [62, 506, 22, 258], x: [0, 1], y: [-tm * u[0], tm * u[0]], xt: [0, 0.5, 1], xf: (t) => (t === 0 ? 'top' : t === 0.5 ? 'bottom' : 'top'), xl: 'one beat · torques on one wing', yl: 'torque (' + u[1] + ')', yt: [-1, -0.5, 0, 0.5, 1].map((t) => t * Math.round(tm * u[0] * 0.8 * 10) / 10), yf: (t) => t.toFixed(Math.abs(t) < 1 ? 1 : 0) });
    const line = (arr, col, wd = 2, dash) => a.append(S('path', { d: r.t.map((t, i) => (i ? 'L' : 'M') + A.X(t) + ',' + A.Y(arr[i] * u[0])).join(''), fill: 'none', stroke: col, 'stroke-width': wd, 'stroke-dasharray': dash }));
    line(r.tM, INK, 4); line(r.tIn, VIOLET, 1.8); line(r.tEl, TEAL, 1.8); line(r.tAe, WARM, 2.2, '5 4');
    [['muscle torque', INK], ['inertia I θ″', VIOLET], ['spring k θ', TEAL], ['air Γ|θ′|θ′', WARM]].forEach(([t, c], i) => { a.append(S('rect', { x: 74 + i * 112, y: 8, width: 10, height: 3, fill: c }), T(88 + i * 112, 13, t, { s: 10.5, c })); });
    // right: mean muscle power against the spring tuning, for the chosen N and for two others
    const Nnow = w.N, curves = [[sweep(q, st.gam), INK, 3, null, `N = ${Nnow.toFixed(2)}`]];
    const mkN = (target) => ({ ...p, mw: p.mw * ((target * (w.Gam * w.th0) - w.Ia) / w.Iw) });
    for (const tN of [Nnow < 1.8 ? 3 : 0.4, Nnow < 5 ? 8 : 1.2]) { const qq = mkN(tN); if (qq.mw > 0) curves.push([sweep(qq, st.gam), tN > Nnow ? BLUE : MUTED, 1.6, '5 4', `N = ${tN}`]); }
    const norm = (cv) => cv.map(([x, y]) => [x, y]);
    const B = axes(b, { box: [62, 506, 22, 258], x: [0.2, 4], y: [0, 2], xt: [0.5, 1, 2, 3, 4], xl: 'wingbeat / hinge resonance ratio  (1 = tuned)', yl: 'muscle power / power with no spring', yt: [0, 0.5, 1, 1.5, 2], yf: (t) => t + '×' });
    b.append(S('line', { x1: 62, x2: 506, y1: B.Y(1), y2: B.Y(1), stroke: WARM, 'stroke-dasharray': '4 3', opacity: 0.7 }), T(68, B.Y(1) - 5, 'no spring', { s: 10.5, c: WARM }));
    for (const [pts, col, wd, dash, lab] of curves) { b.append(S('path', { d: pts.map(([x, y], i) => (i ? 'L' : 'M') + B.X(x) + ',' + B.Y(Math.min(2, y))).join(''), fill: 'none', stroke: col, 'stroke-width': wd, 'stroke-dasharray': dash })); const mn = pts.reduce((m2, q2) => (q2[1] < m2[1] ? q2 : m2)); const solid = col === INK; b.append(T(solid ? B.X(3.3) : B.X(mn[0]) + 10, solid ? B.Y(0.97) - 8 : B.Y(mn[1]) + 15, lab, { s: 10.5, c: col, w: 700 })); }
    b.append(S('line', { x1: B.X(1), x2: B.X(1), y1: 22, y2: 258, stroke: BLUE, 'stroke-dasharray': '3 4', opacity: 0.4 }));
    if (!st.none) b.append(S('circle', { cx: B.X(st.rf), cy: B.Y(Math.min(2, r.Ppos / r0.Ppos)), r: 6, fill: INK }));
    const eta = r.Pae / r.Ppos, save = 1 - r.Ppos / r0.Ppos;
    readout(read, [['Weis-Fogh number N = I / (Γ θ₀)', `<i>${Nnow.toFixed(2)}</i>`], ['air power per wing', (r.Pae * 1e6).toFixed(0) + ' µW'], ['muscle power per wing (positive work)', (r.Ppos * 1e6).toFixed(0) + ' µW'], ['without spring', (r0.Ppos * 1e6).toFixed(0) + ' µW'], ['saving by the spring', (save >= 0 ? fix(save * 100, 0) + ' %' : fix(-save * 100, 0) + ' % worse')], ['peak muscle torque', (r.tauPeak * 1e6).toFixed(1) + ' µN·m'], ['efficiency air / muscle', fix(eta * 100, 0) + ' %']]);
  }
  draw();
}

// ====================================================================================================
// D. the muscle: work loop of a Hill-type fibre with a twitch
// ====================================================================================================
export function figWorkLoop(root) {
  const { ctrl, stage, legend } = frame(root, 'muscle work loop');
  const st = { f: 12, ph: 0.5, n: 2, ea: 0.05, tauD: 12 }, m = { ...MUSCLE };
  const [a, b] = twoPanel(stage); const read = h('div', { class: 'bf-read' }); legend.append(read);
  const sPh = param(ctrl, 'burst starts at beat phase', 0, 1, 0.01, st.ph, (v) => v.toFixed(2), (v) => { st.ph = v; draw(); });
  param(ctrl, 'wingbeat frequency', 2, 60, 0.5, st.f, (v) => v.toFixed(1) + ' Hz', (v) => { st.f = v; draw(); });
  param(ctrl, 'impulses per burst', 1, 4, 1, st.n, (v) => v + '', (v) => { st.n = v; draw(); });
  param(ctrl, 'muscle strain amplitude', 0.01, 0.1, 0.005, st.ea, (v) => (v * 100).toFixed(1) + ' %', (v) => { st.ea = v; draw(); });
  param(ctrl, 'twitch decay time (Ca²⁺ removal)', 4, 30, 1, st.tauD, (v) => v.toFixed(0) + ' ms', (v) => { st.tauD = v; m.tauD = v / 1000; m.tauR = Math.max(0.002, v / 2000); draw(); });
  const need = (() => { const r = springWing(REF, 1.0); const mus = (REF.fmr * REF.m) ; return (2 * r.Ppos) / mus; })();
  function draw() {
    a.innerHTML = ''; b.innerHTML = '';
    const r = workLoop(st.f, st.ph, st.n, st.ea, m, 5, 300);
    const A = axes(a, { box: [62, 506, 22, 258], x: [-0.1, 0.1], y: [0, 1.5], xt: [-0.1, -0.05, 0, 0.05, 0.1], xf: (t) => (t * 100).toFixed(0) + '%', xl: 'muscle strain (shortening ←  → lengthening)', yl: 'force / F₀', yt: [0, 0.5, 1, 1.5] });
    // loop: the muscle shortens (strain falls) while it is active: area enclosed with the strain going down = work done by the muscle
    const pts = r.pts, d = pts.map((q, i) => (i ? 'L' : 'M') + A.X(q.eps) + ',' + A.Y(Math.min(1.5, q.F))).join('');
    a.append(S('path', { d: d + 'Z', fill: r.W >= 0 ? BLUE : WARM, opacity: 0.16 }), S('path', { d, fill: 'none', stroke: INK, 'stroke-width': 2.4 }));
    for (const i of [0, 75, 150, 225]) { const q = pts[i], q2 = pts[i + 6]; const ang = Math.atan2(A.Y(q2.F) - A.Y(q.F), A.X(q2.eps) - A.X(q.eps)); a.append(S('path', { d: 'M-6,-4 L4,0 L-6,4Z', fill: INK, transform: `translate(${A.X(q.eps)},${A.Y(Math.min(1.5, q.F))}) rotate(${(ang * 180) / Math.PI})` })); }
    // activation and strain over the beat (small inset)
    a.append(T(70, 36, r.W >= 0 ? 'net positive work: the muscle is a motor' : 'net negative work: the muscle is a brake', { s: 11.5, c: r.W >= 0 ? BLUE : WARM, w: 700 }));
    const fs = Array.from({ length: 50 }, (_, i) => 2 + i * 1.2), best = fs.map((f) => [f, bestPhase(f, st.n, st.ea, m).spec]);
    const cur = fs.map((f) => [f, workLoop(f, st.ph, st.n, st.ea, m, 4, 160).spec]);
    const top = Math.max(120, ...best.map((q) => q[1])) * 1.1, bot = -150, cl = (q) => [q[0], Math.max(bot, q[1])];
    const B = axes(b, { box: [62, 506, 22, 258], x: [0, 62], y: [bot, top], xt: [10, 20, 30, 40, 50, 60], xl: 'wingbeat frequency (Hz)', yl: 'net muscle power (W per kg of muscle)', yt: [-100, 0, 50, 100, 150].filter((t) => t >= bot && t <= top) });
    b.append(S('path', { d: path(best.map(cl), B.X, B.Y), fill: 'none', stroke: INK, 'stroke-width': 2.6 }), S('path', { d: path(cur.map(cl), B.X, B.Y), fill: 'none', stroke: BLUE, 'stroke-width': 1.8, 'stroke-dasharray': '5 4' }));
    b.append(S('line', { x1: 62, x2: 506, y1: B.Y(need), y2: B.Y(need), stroke: WARM, 'stroke-dasharray': '4 3' }), T(500, B.Y(need) - 6, `needed by air + inertia: ${need.toFixed(0)} W/kg`, { a: 'end', s: 10.5, c: WARM, w: 700 }));
    b.append(S('circle', { cx: B.X(st.f), cy: B.Y(Math.max(bot, r.spec)), r: 6, fill: BLUE }), T(70, 276 - 0, '', {}), T(506, 278, '', {}));
    b.append(T(500, B.Y(-120), 'solid: best burst timing at each f', { a: 'end', s: 10.5, c: INK }), T(500, B.Y(-140), 'dashed: your timing', { a: 'end', s: 10.5, c: BLUE }));
    readout(read, [['specific power', `<i>${r.spec.toFixed(0)} W/kg</i>`], ['work per beat', (r.W * MUSCLE.sigma / MUSCLE.rho).toFixed(1) + ' J/kg'], ['best timing at this f', bestPhase(st.f, st.n, st.ea, m).ph.toFixed(2) + ' → ' + bestPhase(st.f, st.n, st.ea, m).spec.toFixed(0) + ' W/kg'], ['force-velocity: Hill, v<sub>max</sub> = 20 L₀/s', 'σ<sub>max</sub> = 250 kPa']]);
  }
  draw();
}

export const FIG_PHYS = { load: figLoad, transmission: figTransmission, springwing: figSpringWing, workloop: figWorkLoop };
