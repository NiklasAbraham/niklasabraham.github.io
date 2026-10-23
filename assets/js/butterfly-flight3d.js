// A physics-driven 3D butterfly: the wings follow the stroke of the article, every blade element of every wing feels the quasi-steady
// force of section 01, and the body is a point mass that integrates those forces plus weight and body drag (two degrees of freedom,
// height and forward). Nothing here is animated by hand: the picture is the solution of the equations in butterfly-phys-core.js.
import { THREE, Viewer, webgl } from './butterfly-core.js';
import { REF, TAU, G, RHO, wingModel, liftSummary } from './butterfly-phys-core.js';
import { h, S, T, frame, param } from './butterfly-physics.js';

const INK = '#04204B', BLUE = '#0b4fc0', WARM = '#b4552f', MUTED = '#6b7280', RULE = '#c9d0dc', GRID = '#eef1f6', GREEN = '#138374';
const NR = 10, NQ = 4, CDA = 1.0e-4;            // blade elements per wing, chord strips, body drag area C_D A (m^2): estimate
const rad = (d) => (d * Math.PI) / 180;

// chord distribution c(r) = cbar g(r/R), g = sqrt(1-x^2)(1+kx), k chosen so that the second radius of the area equals REF.r2 (so the sum over
// blade elements reproduces S2 of the article), normalised to unit mean
function chordShape(r2) {
  const k = Math.max(0, (r2 * r2 * (Math.PI / 4) - Math.PI / 16) / (2 / 15 - r2 * r2 / 3));
  const raw = (x) => Math.sqrt(Math.max(0, 1 - x * x)) * (1 + k * x);
  let m = 0; const n = 400; for (let i = 0; i < n; i++) m += raw((i + 0.5) / n) / n;
  return (x) => raw(x) / m;
}

export function figFlight(root) {
  const { ctrl, stage, legend } = frame(root, '3D · solved, not animated');
  if (!webgl()) { stage.textContent = 'This figure needs WebGL, which this browser does not offer.'; return; }
  const P = { ...REF }, st = { beta: 0, slow: 0.04, run: true, el: true, tot: true };
  P.phi = rad(63);
  const g = chordShape(P.r2);
  const host = h('div', { class: 'bf-3d bf-flight' }); stage.append(host);
  const view = new Viewer(host, { pos: [9.5, 6, 13], target: [0, 0, 0], maxDist: 42, minDist: 5 });
  view.scene.background = new THREE.Color(0xf4f6fa);

  // ---- scene: body, wings, arrows, still reference points ----
  const body = new THREE.Group(); view.scene.add(body);
  const mat = (c, r = 0.55, m = 0.05) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), mat(0x3b2a20)); thorax.scale.set(0.9, 0.9, 1.25); body.add(thorax);
  const abd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), mat(0x5a4636)); abd.scale.set(0.8, 0.8, 3.1); abd.position.set(0, -0.02, 1.35); body.add(abd);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 12), mat(0x241912)); head.position.set(0, 0.02, -0.72); body.add(head);
  for (const sx of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 6), mat(0x241912)); a.position.set(sx * 0.32, 0.5, -1.35); a.rotation.set(-0.55, 0, -sx * 0.45); body.add(a); }
  const HINGE = 0.34;
  const wing = (sx) => {
    const geo = new THREE.BufferGeometry(), nv = (NR + 1) * (NQ + 1), pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = [];
    for (let i = 0; i < NR; i++) for (let j = 0; j < NQ; j++) { const a = i * (NQ + 1) + j, b = a + 1, c = a + NQ + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8, metalness: 0, transparent: true, opacity: 0.93 }));
    m.frustumCulled = false; body.add(m);
    const arrows = [], dr = [];
    for (let i = 0; i < NR; i++) {
      const L = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, 0x138374, 0.28, 0.16), D = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xb4552f, 0.22, 0.13);
      body.add(L, D); arrows.push(L); dr.push(D);
    }
    return { sx, m, pos, col, geo, L: arrows, D: dr };
  };
  const wings = [wing(1), wing(-1)];
  const wArrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, 0xc0392b, 0.5, 0.3), fArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, 0x04204b, 0.5, 0.3);
  body.add(wArrow, fArrow);
  // still motes, wrapped around the body, so that climbing, sinking and gliding are visible
  const NM = 160, motes = new Float32Array(NM * 3); for (let i = 0; i < NM * 3; i++) motes[i] = (Math.random() - 0.5) * 60;
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NM * 3), 3));
  const mp = new THREE.Points(mg, new THREE.PointsMaterial({ color: 0x8aa0c0, size: 0.16, sizeAttenuation: true })); mp.frustumCulled = false; view.scene.add(mp);
  // altimeter pole with a tick every 10 cm
  const pole = new THREE.Group(); view.scene.add(pole);
  pole.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -200, 0), new THREE.Vector3(0, 200, 0)]), new THREE.LineBasicMaterial({ color: 0xc9d0dc })));
  const tickG = new THREE.BufferGeometry(), tv = []; for (let k = -20; k <= 20; k++) tv.push(-0.9, k * 10, 0, 0.9, k * 10, 0);
  tickG.setAttribute('position', new THREE.Float32BufferAttribute(tv, 3)); pole.add(new THREE.LineSegments(tickG, new THREE.LineBasicMaterial({ color: 0x6b7280 }))); pole.position.set(-9, 0, -4);

  // ---- state ----
  const sim = { t: 0, y: 0, z: 0, vy: 0, vz: 0, Fy: 0, avg: 0, avgZ: 0, lastBody: new THREE.Vector3() };
  const histF = [], histY = [];
  const reset = () => { Object.assign(sim, { t: 0, y: 0, z: 0, vy: 0, vz: 0, Fy: 0, avg: P.m * G, avgZ: 0 }); histF.length = histY.length = 0; };
  reset();

  const w0 = () => wingModel(P);
  // one step of physics at time sim.t; fills per-element forces for drawing (right wing; the left is its mirror)
  const el = { Lv: [], Dv: [], q: [] };
  function forces(t, fill) {
    const w = w0(), om = TAU * P.f, th = -P.phi * Math.cos(om * t), thd = om * P.phi * Math.sin(om * t);
    const b = rad(st.beta), nV = [0, Math.cos(b), -Math.sin(b)], e0 = [0, -Math.sin(b), -Math.cos(b)];
    const sg = Math.tanh(thd / (0.2 * om * P.phi)), a = rad(P.alpha), psi = a + (Math.PI - 2 * a) * (1 - sg) / 2;
    const cth = Math.cos(th), sth = Math.sin(th);
    const s = [cth, sth * e0[1], sth * e0[2]], eth = [-sth, cth * e0[1], cth * e0[2]];
    const ell = [Math.cos(psi) * eth[0], Math.cos(psi) * eth[1] + Math.sin(psi) * nV[1], Math.cos(psi) * eth[2] + Math.sin(psi) * nV[2]];
    let Fy = 0, Fz = 0; const dr = P.R / NR;
    for (let i = 0; i < NR; i++) {
      const x = (i + 0.5) / NR, r = x * P.R, c = (P.S / P.R) * g(x), u = r * thd;
      const dL = 0.5 * RHO * w.CL * c * u * u * dr, dD = -0.5 * RHO * w.CD * c * Math.abs(u) * u * dr;   // dD along e_theta
      const fy = dL * nV[1] + dD * eth[1], fz = dL * nV[2] + dD * eth[2];
      Fy += 2 * fy; Fz += 2 * fz;                                                                         // both wings: x components cancel
      if (fill) { el.Lv[i] = dL; el.Dv[i] = dD; el.q[i] = u * u; }
    }
    return { Fy, Fz, th, thd, s, eth, ell, nV, c: P.S / P.R };
  }
  function step(dt) {
    const f = forces(sim.t, false), v = Math.hypot(sim.vy, sim.vz);
    const ay = (f.Fy - P.m * G - 0.5 * RHO * CDA * v * sim.vy) / P.m, az = (f.Fz - 0.5 * RHO * CDA * v * sim.vz) / P.m;
    sim.vy += ay * dt; sim.vz += az * dt; sim.y += sim.vy * dt; sim.z += sim.vz * dt; sim.t += dt; sim.Fy = f.Fy;
    sim.avg += (f.Fy - sim.avg) * Math.min(1, dt * P.f); sim.avgZ += (f.Fz - sim.avgZ) * Math.min(1, dt * P.f);
  }

  // ---- drawing ----
  const U = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const ramp = (q) => { const k = Math.min(1, Math.sqrt(q)); return [0.45 + 0.5 * k, 0.62 - 0.12 * k, 0.86 - 0.62 * k]; };
  function draw() {
    const f = forces(sim.t, true), w = w0(), umax2 = (TAU * P.f * P.phi * P.R) ** 2, SC = 100;
    for (const wg of wings) {
      const sx = wg.sx; let k = 0;
      for (let i = 0; i <= NR; i++) {
        const x = i / NR, r = x * P.R * SC, c = (P.S / P.R) * g(x) * SC, qq = (x * x * (f.thd * f.thd * P.R * P.R)) / umax2;
        for (let j = 0; j <= NQ; j++) {
          const qc = (0.3 - j / NQ) * c;      // from the leading edge (0.3 c ahead of the pitch axis) to the trailing edge (0.7 c behind)
          wg.pos[k * 3] = sx * (HINGE + r * f.s[0] + qc * f.ell[0]); wg.pos[k * 3 + 1] = r * f.s[1] + qc * f.ell[1]; wg.pos[k * 3 + 2] = r * f.s[2] + qc * f.ell[2];
          const cc = ramp(qq * (1 - 0.15 * (j / NQ))); wg.col[k * 3] = cc[0]; wg.col[k * 3 + 1] = cc[1]; wg.col[k * 3 + 2] = cc[2]; k++;
        }
      }
      wg.geo.attributes.position.needsUpdate = true; wg.geo.attributes.color.needsUpdate = true; wg.geo.computeVertexNormals();
      const wt = P.m * G, es = 14 / wt;     // element arrows: 14 length units per weight (cm)
      for (let i = 0; i < NR; i++) {
        const x = (i + 0.5) / NR, r = x * P.R * SC, c = (P.S / P.R) * g(x) * SC, qc = 0.05 * c;
        const o = new THREE.Vector3(sx * (HINGE + r * f.s[0] + qc * f.ell[0]), r * f.s[1] + qc * f.ell[1], r * f.s[2] + qc * f.ell[2]);
        const Lm = Math.abs(el.Lv[i]) * es, Dm = Math.abs(el.Dv[i]) * es, vis = st.el;
        const nv = U(f.nV), dv = U(f.eth).multiplyScalar(Math.sign(el.Dv[i]) || 1); dv.x *= sx;
        wg.L[i].visible = vis && Lm > 0.05; wg.D[i].visible = vis && Dm > 0.05;
        if (wg.L[i].visible) { wg.L[i].position.copy(o); wg.L[i].setDirection(nv); wg.L[i].setLength(Lm, Math.min(0.28, Lm * 0.5), 0.14); }
        if (wg.D[i].visible) { wg.D[i].position.copy(o); wg.D[i].setDirection(dv.normalize()); wg.D[i].setLength(Dm, Math.min(0.22, Dm * 0.5), 0.1); }
      }
    }
    const wt = P.m * G, ts = 4 / wt, org = new THREE.Vector3(0, 0, 0);     // total arrows: 4 length units per weight
    wArrow.visible = fArrow.visible = st.tot;
    if (st.tot) {
      wArrow.position.set(0.55, 0, 0.1); wArrow.setLength(Math.max(0.01, wt * ts), 0.4, 0.22);
      const fv = new THREE.Vector3(0, sim.Fy, f.Fz).multiplyScalar(ts), fl = Math.max(0.01, fv.length());
      fArrow.position.set(-0.55, 0, 0.1); fArrow.setDirection(fv.lengthSq() > 1e-12 ? fv.clone().normalize() : new THREE.Vector3(0, 1, 0)); fArrow.setLength(fl, Math.min(0.4, fl * 0.5), 0.22);
    }
    body.position.set(0, sim.y * SC, -sim.z * SC);
    // follow-cam: translate camera with the body, keep the user's orbit
    const d = body.position.clone().sub(sim.lastBody); sim.lastBody.copy(body.position);
    view.camera.position.add(d); view.controls.target.add(d);
    // motes wrap around the body
    const bp = mg.attributes.position.array, c = body.position;
    for (let i = 0; i < NM; i++) for (let k = 0; k < 3; k++) { const o = [c.x, c.y, c.z][k]; let v = motes[i * 3 + k] - o; v = ((v + 30) % 60 + 60) % 60 - 30; bp[i * 3 + k] = o + v; }
    mg.attributes.position.needsUpdate = true;
    pole.position.set(-9, 0, c.z - 4);
    return { f, w };
  }

  // ---- controls ----
  const ph = param(ctrl, 'stroke half-amplitude', 20, 90, 0.5, 63, (v) => v.toFixed(0) + '°', (v) => { P.phi = rad(v); });
  param(ctrl, 'wingbeat frequency', 6, 20, 0.5, 12, (v) => v.toFixed(1) + ' Hz', (v) => { P.f = v; });
  param(ctrl, 'angle of attack', 15, 75, 1, 45, (v) => v.toFixed(0) + '°', (v) => { P.alpha = v; });
  param(ctrl, 'stroke-plane tilt', 0, 60, 1, 0, (v) => v.toFixed(0) + '°', (v) => { st.beta = v; });
  const seg = h('span', { class: 'bx-seg' }); const slowOpts = [[0.02, '50× slow'], [0.05, '20× slow'], [0.2, '5× slow']];
  slowOpts.forEach(([v, t], i) => seg.append(h('button', { type: 'button', class: 'bx-chip' + (i === 1 ? ' on' : ''), onclick: (e) => { st.slow = v; [...seg.children].forEach((b) => b.classList.toggle('on', b === e.currentTarget)); } }, t))); st.slow = 0.05;
  const chip = (label, on, fn) => { const b = h('button', { type: 'button', class: 'bx-chip' + (on ? ' on' : ''), onclick: () => { const v = !b.classList.contains('on'); b.classList.toggle('on', v); fn(v); } }, label); return b; };
  const bar = h('div', { class: 'bf-bar' },
    h('button', { type: 'button', class: 'bx-play', onclick: (e) => { st.run = !st.run; e.currentTarget.textContent = st.run ? '❚❚ pause' : '▶ run'; } }, '❚❚ pause'), seg,
    h('button', { type: 'button', class: 'bx-chip', onclick: () => { const s = liftSummary(P); P.phi = Math.min(rad(90), s.phiReq / Math.sqrt(Math.cos(rad(st.beta)))); ph.set(Math.round((P.phi * 180) / Math.PI * 2) / 2); } }, 'amplitude that hovers'),
    h('button', { type: 'button', class: 'bx-chip', onclick: reset }, 'reset to rest'),
    chip('blade-element forces', true, (v) => { st.el = v; }), chip('weight and total force', true, (v) => { st.tot = v; }));
  ctrl.append(bar);
  // ---- traces ----
  const W = 900, Hh = 150, svg = S('svg', { class: 'bf-svg', viewBox: `0 0 ${W} ${Hh * 2 + 30}`, role: 'img', 'aria-label': 'Vertical force over the last three wingbeats and height over the last two seconds' }); stage.append(svg);
  const read = h('div', { class: 'bf-read' }); legend.append(read);
  function chart(y0, title, data, xr, yr, unit, col, ref) {
    const L = 60, R = W - 14, Tp = y0 + 18, B = y0 + Hh - 18, X = (x) => L + ((x - xr[0]) / (xr[1] - xr[0])) * (R - L), Y = (y) => B - ((y - yr[0]) / (yr[1] - yr[0])) * (B - Tp);
    const g2 = S('g', {});
    g2.append(T(L, y0 + 11, title, { s: 12, w: 600 }), S('rect', { x: L, y: Tp, width: R - L, height: B - Tp, fill: 'none', stroke: RULE }));
    for (const v of [yr[0], (yr[0] + yr[1]) / 2, yr[1]]) g2.append(S('line', { x1: L, x2: R, y1: Y(v), y2: Y(v), stroke: GRID }), T(L - 6, Y(v) + 4, v.toFixed(Math.abs(yr[1]) < 5 ? 1 : 0), { a: 'end', s: 10.5, c: MUTED }));
    g2.append(T(L - 6, Tp - 5, unit, { a: 'end', s: 10.5, c: MUTED }));
    if (ref != null) g2.append(S('line', { x1: L, x2: R, y1: Y(ref), y2: Y(ref), stroke: WARM, 'stroke-dasharray': '5 4' }), T(R - 2, Y(ref) - 4, 'weight', { a: 'end', s: 10.5, c: WARM }));
    if (data.length > 1) g2.append(S('path', { d: data.map(([x, y], i) => (i ? 'L' : 'M') + X(x).toFixed(1) + ',' + Y(Math.max(yr[0], Math.min(yr[1], y))).toFixed(1)).join(''), fill: 'none', stroke: col, 'stroke-width': 1.8 }));
    return g2;
  }
  let acc = 0, tr = 0;
  view.tick = (dt) => {
    if (st.run) {
      let rem = dt * st.slow; const sub = 1 / (P.f * 500);
      while (rem > 1e-9) { const d = Math.min(sub, rem); step(d); rem -= d; acc += d; if (acc >= 1 / (P.f * 80)) { acc = 0; histF.push([sim.t, sim.Fy / (P.m * G)]); } }
      if (sim.t - tr >= 0.01) { tr = sim.t; histY.push([sim.t, sim.y * 100]); }
      const t0 = sim.t - 3 / P.f; while (histF.length && histF[0][0] < t0) histF.shift(); while (histY.length && histY[0][0] < sim.t - 2) histY.shift();
    }
    const { f, w } = draw(), wt = P.m * G, ratio = sim.avg / wt;
    const Fd = histF.map(([t, v]) => [t, v]), t1 = sim.t, T3 = 3 / P.f;
    const yv = histY.map(([t, v]) => v), ymin = Math.min(0, ...yv), ymax = Math.max(1, ...yv), pad = (ymax - ymin) * 0.1 + 0.5;
    svg.replaceChildren(chart(0, 'vertical force of both wings ÷ weight, last three wingbeats', Fd, [t1 - T3, t1], [0, 3.2], '', BLUE, 1),
      chart(Hh + 30, 'height of the body, last 2 s of flight time', histY, [Math.max(0, t1 - 2), Math.max(2, t1)], [ymin - pad, ymax + pad], 'cm', GREEN, null));
    const U = TAU * P.f * P.phi * P.R * P.r2, hov = liftSummary(P);
    read.innerHTML = [['mean lift ÷ weight', `${(ratio * 100).toFixed(0)} %`], ['height', `${(sim.y * 100).toFixed(1)} cm`], ['vertical speed', `${sim.vy.toFixed(2)} m/s`], ['forward speed', `${sim.vz.toFixed(2)} m/s`],
      ['tip speed', `${(TAU * P.f * P.phi * P.R).toFixed(1)} m/s`], ['flight time', `${sim.t.toFixed(2)} s`], ['hover needs', `${(hov.phiReq * 180 / Math.PI / Math.sqrt(Math.cos(rad(st.beta)))).toFixed(0)}°`]].map(([k, v]) => `<span><b>${k}</b> ${v}</span>`).join('');
  };
  root.__sim = sim; root.__P = P; root.__st = st;
}
