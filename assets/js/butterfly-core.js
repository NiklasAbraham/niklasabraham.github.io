// Butterfly long read (/blog/2026/butterfly-wing/): the 3D model, its kinematics and a small viewer.
// three.js r180 is self-hosted in assets/vendor/three/ (MIT, no CDN). Shapes are schematic (proportions chosen to be read, not measured)
// but the surfaces are physically based: scaled wings with a bump map, iridescent morpho blue, a furred body, faceted eyes, wet muscle.
// Units: the thorax half-width is 1. x lateral (right wing +x), y up, z towards the head.
import * as THREE from '../vendor/three/three.module.min.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
export { THREE };

export const TAU = Math.PI * 2;
export const A0 = (32 * Math.PI) / 180; // default wing elevation amplitude
export const LIN = 0.4; // inner arm of the lever: hinge pivot to the inner end of the wing root
export const HINGE = { x: 0.92, y: 0.5 }; // pleural wing process, in the section plane
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ------------------------------------------------------------------ motor neurons and muscle force
// Spikes per wingbeat (phase 0 = wings at the top of the upstroke). A butterfly's flight muscles get a short burst per stroke
// (Ando et al. 2024, EMG of five muscles in a free-flying chestnut tiger butterfly); three spikes is a cartoon of that burst.
export const SPIKES = { dvm: [0.7, 0.76, 0.82], dlm: [0.2, 0.26, 0.32] };
const twitch = (dt) => { dt = ((dt % 1) + 1) % 1; const tau = 0.09; return (dt / tau) * Math.exp(1 - dt / tau); };
const NORM = {};
for (const k of Object.keys(SPIKES)) { let m = 0; for (let i = 0; i < 400; i++) { let s = 0; for (const t of SPIKES[k]) s += twitch(i / 400 - t); m = Math.max(m, s); } NORM[k] = m; }
export const force = (ph, key) => { let s = 0; for (const t of SPIKES[key]) s += twitch(ph - t); return Math.min(1, s / NORM[key]); };

// ------------------------------------------------------------------ wing kinematics
export const DEFAULT_P = { amp: A0, ampL: 1, ampR: 1, mix: 0.0, sweep: 0.2, twist: 0.45, lean: 0.0 };
// side +1 right / -1 left; returns the three angles of one wing at phase ph: elevation (about the body axis z), sweep (about the vertical y), pitch (about the span axis x)
export function wingAngles(ph, P, side) {
  const w = TAU * ph, amp = P.amp * (side > 0 ? P.ampR : P.ampL);
  const elev = amp * Math.cos(w);
  const sweep = P.lean + P.sweep * ((1 - P.mix) * Math.sin(w + 1.1) + P.mix * Math.sin(2 * w + 0.5));
  const pitch = P.twist * Math.sin(w + 0.35);
  return { elev, sweep, pitch };
}

// ------------------------------------------------------------------ wings: outline, paint, mesh
// Outlines in (s, t): s = span fraction from the hinge, t = chord fraction of the span, +t towards the head.
const OUT = {
  fore: [[0, 0.05], [0.22, 0.1], [0.5, 0.15], [0.8, 0.185], [0.97, 0.15], [1.04, 0.05], [1.02, -0.07], [0.93, -0.19], [0.78, -0.3], [0.58, -0.37], [0.36, -0.37], [0.14, -0.28], [0.0, -0.16]],
  hind: [[0, 0.03], [0.2, 0.0], [0.48, -0.06], [0.75, -0.17], [0.9, -0.3], [0.88, -0.44], [0.72, -0.53], [0.5, -0.55], [0.28, -0.47], [0.1, -0.33], [0.0, -0.2]],
};
const BOX = { fore: [-0.14, 1.1, -0.42, 0.24], hind: [-0.14, 1.0, -0.6, 0.08] }; // s0 s1 t0 t1
const BASE_PT = { fore: [0.02, -0.04], hind: [0.02, -0.08] }; // where the veins start
function catmull(pts, n = 10) {
  const out = [], N = pts.length;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  return out;
}
export const PALETTES = {
  monarch: { name: 'Monarch (Danaus plexippus)', base: '#ec7d27', lo: '#c44d12', vein: '#17110d', edge: '#17110d', dots: '#fff7e6', tip: null, fur: '#1c1612', abd: '#1d1814', abdDots: '#f1ebdd', vw: 8 },
  morpho: { name: 'Blue morpho (Morpho menelaus)', base: '#2a6fe0', lo: '#1238a0', vein: '#0d1230', edge: '#10101a', dots: '#d9ecff', tip: null, sheen: '#7cc8ff', irid: true, fur: '#3b2a1c', abd: '#4a3524', abdDots: null, vw: 4 },
  white: { name: 'Cabbage white (Pieris rapae)', base: '#f4f2e8', lo: '#d9d5c2', vein: '#9a9684', edge: '#2d2d2d', dots: null, tip: '#2d2d2d', spots: true, fur: '#d6d1c2', abd: '#c9c3b2', abdDots: null, vw: 4 },
};
// the wing is painted twice: a flat pattern (veins, border, dots), then re-drawn scale by scale (each scale takes the colour of the pattern under it, with a little jitter)
// next to a height map of the same scales for the bump map. Overlapping rows run from the hinge to the margin, tips outward like roof tiles.
const texCache = {};
function veinPaths(g, kind, poly, X, Y, pal, w) {
  const bx = X(BASE_PT[kind][0]), by = Y(BASE_PT[kind][1]);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const margin = poly.filter(([s]) => s > 0.3);
  const n = kind === 'fore' ? 9 : 8;
  for (let k = 0; k < n; k++) {
    const [s, t] = margin[Math.floor(((k + 0.5) / n) * (margin.length - 1))];
    const mx = X(s * 0.98), my = Y(t * 0.98);
    g.lineWidth = w * (k === 0 ? 1.3 : 1); g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo((bx + mx) / 2, by + (my - by) * 0.3, mx, my); g.stroke();
    // a fork near the margin
    g.lineWidth = w * 0.55; const fx = bx + (mx - bx) * 0.62, fy = by + (my - by) * 0.55;
    g.beginPath(); g.moveTo(fx, fy); g.lineTo(mx + 14, my + (k % 2 ? 22 : -22)); g.stroke();
  }
  // leading-edge vein and the cross vein that closes the central cell
  g.lineWidth = w * 1.5; g.beginPath(); poly.filter(([s, t]) => s > 0.02 && s < 0.97 && t > (kind === 'fore' ? 0.04 : -0.05)).forEach(([s, t], i) => (i ? g.lineTo(X(s), Y(t * 0.96)) : g.moveTo(X(s), Y(t * 0.96)))); g.stroke();
  g.lineWidth = w * 0.8; g.beginPath(); g.moveTo(X(0.5), Y(kind === 'fore' ? 0.1 : -0.05)); g.quadraticCurveTo(X(0.58), Y(kind === 'fore' ? -0.05 : -0.2), X(0.5), Y(kind === 'fore' ? -0.2 : -0.33)); g.stroke();
}
function wingTex(kind, key) {
  const ck = kind + key; if (texCache[ck]) return texCache[ck];
  const pal = PALETTES[key], [s0, s1, t0, t1] = BOX[kind], W = 2048, H = Math.round((W * (t1 - t0)) / (s1 - s0));
  const X = (s) => ((s - s0) / (s1 - s0)) * W, Y = (t) => ((t1 - t) / (t1 - t0)) * H;
  const poly = catmull(OUT[kind]);
  // 1. flat pattern
  const pat = canvas(W, H), g = pat.getContext('2d');
  g.beginPath(); poly.forEach(([s, t], i) => (i ? g.lineTo(X(s), Y(t)) : g.moveTo(X(s), Y(t)))); g.closePath();
  g.save(); g.clip();
  const grad = g.createLinearGradient(X(0), 0, X(1), 0); grad.addColorStop(0, pal.lo); grad.addColorStop(0.35, pal.base); grad.addColorStop(1, pal.base);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  if (pal.sheen) { const r = g.createRadialGradient(X(0.55), Y(-0.12), 10, X(0.55), Y(-0.12), W * 0.45); r.addColorStop(0, pal.sheen + 'cc'); r.addColorStop(1, pal.sheen + '00'); g.fillStyle = r; g.fillRect(0, 0, W, H); }
  if (pal.tip) { const r = g.createRadialGradient(X(1.0), Y(0.05), 5, X(1.0), Y(0.05), W * 0.3); r.addColorStop(0, pal.tip); r.addColorStop(1, pal.tip + '00'); g.fillStyle = r; g.fillRect(0, 0, W, H); }
  g.strokeStyle = pal.vein; g.globalAlpha = pal.sheen ? 0.4 : 0.95; veinPaths(g, kind, poly, X, Y, pal, pal.vw * 1.6); g.globalAlpha = 1;
  g.beginPath(); poly.forEach(([s, t], i) => (i ? g.lineTo(X(s), Y(t)) : g.moveTo(X(s), Y(t)))); g.closePath();
  g.lineJoin = 'round'; g.strokeStyle = pal.edge; g.lineWidth = pal.tip ? 14 : 100; g.stroke();
  if (pal.dots) { // two rows of dots just inside the dark border
    const cs = poly.reduce((a, [s, t]) => [a[0] + s / poly.length, a[1] + t / poly.length], [0, 0]); g.fillStyle = pal.dots;
    let acc = 0, prev = null;
    poly.forEach(([s, t]) => { const x = X(s), y = Y(t); if (prev) acc += Math.hypot(x - prev[0], y - prev[1]); prev = [x, y]; if (acc < 46 || s < 0.3) return; acc = 0;
      const dx = X(cs[0]) - x, dy = Y(cs[1]) - y, d = Math.hypot(dx, dy) || 1;
      g.beginPath(); g.arc(x + (dx / d) * 34, y + (dy / d) * 34, 10, 0, TAU); g.fill(); g.beginPath(); g.arc(x + (dx / d) * 70, y + (dy / d) * 70, 5.5, 0, TAU); g.fill(); });
  }
  if (pal.spots && kind === 'fore') { g.fillStyle = '#26262a'; [[0.62, -0.1, 34], [0.5, -0.27, 28]].forEach(([s, t, r]) => { g.beginPath(); g.arc(X(s), Y(t), r, 0, TAU); g.fill(); }); }
  g.restore();
  const px = g.getImageData(0, 0, W, H).data;
  // 2. scale sprite for the height map: low at the root, a ridge along the edge, high at the free tip
  const SL = 26, SW = 16, spr = canvas(SL, SW), sg = spr.getContext('2d');
  const sgrad = sg.createLinearGradient(0, 0, SL, 0); sgrad.addColorStop(0, '#4a4a4a'); sgrad.addColorStop(0.7, '#b8b8b8'); sgrad.addColorStop(1, '#ffffff');
  sg.fillStyle = sgrad; sg.beginPath(); sg.ellipse(SL / 2, SW / 2, SL / 2, SW / 2 - 0.5, 0, 0, TAU); sg.fill(); sg.strokeStyle = 'rgba(0,0,0,0.45)'; sg.lineWidth = 1.5; sg.stroke();
  sg.strokeStyle = 'rgba(0,0,0,0.25)'; sg.lineWidth = 1; for (let k = -2; k <= 2; k++) { sg.beginPath(); sg.moveTo(3, SW / 2 + k * 2.4); sg.lineTo(SL - 3, SW / 2 + k * 2.4); sg.stroke(); }
  // 3. the scales
  const col = canvas(W, H), cg = col.getContext('2d'), bump = canvas(W, H), bg = bump.getContext('2d');
  bg.fillStyle = '#6a6a6a'; bg.fillRect(0, 0, W, H);
  const bx = X(BASE_PT[kind][0]), by = Y(BASE_PT[kind][1]), rand = rng(kind === 'fore' ? 11 : 23);
  let a0 = 9, a1 = -9; for (const [s, t] of poly) { const a = Math.atan2(Y(t) - by, X(s) - bx); a0 = Math.min(a0, a); a1 = Math.max(a1, a); }
  a0 -= 0.12; a1 += 0.12; let maxR = 0; for (const [s, t] of poly) maxR = Math.max(maxR, Math.hypot(X(s) - bx, Y(t) - by));
  maxR += 20;
  for (let rho = maxR; rho > 6; rho -= 9) {
    const da = 11 / rho, off = (Math.round(rho / 9) % 2) * da * 0.5;
    for (let a = a0 + off; a < a1; a += da) {
      const ja = a + (rand() - 0.5) * da * 0.5, jr = rho + (rand() - 0.5) * 3, x = bx + jr * Math.cos(ja), y = by + jr * Math.sin(ja);
      const ix = x | 0, iy = y | 0; if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
      const o = (iy * W + ix) * 4; if (px[o + 3] < 128) continue;
      const j = 0.86 + rand() * 0.26, sh = rand() < 0.08 ? 0.75 : 1;
      cg.setTransform(Math.cos(ja), Math.sin(ja), -Math.sin(ja), Math.cos(ja), x, y);
      cg.fillStyle = `rgb(${Math.min(255, px[o] * j * sh) | 0},${Math.min(255, px[o + 1] * j * sh) | 0},${Math.min(255, px[o + 2] * j * sh) | 0})`;
      cg.beginPath(); cg.ellipse(0, 0, SL / 2, SW / 2, 0, 0, TAU); cg.fill();
      bg.setTransform(Math.cos(ja), Math.sin(ja), -Math.sin(ja), Math.cos(ja), x, y); bg.globalAlpha = 0.55 + rand() * 0.45; bg.drawImage(spr, -SL / 2, -SW / 2);
    }
  }
  cg.setTransform(1, 0, 0, 1, 0, 0); bg.setTransform(1, 0, 0, 1, 0, 0); bg.globalAlpha = 1;
  // 4. veins on top, crisp, in the colour layer and raised in the height map
  cg.save(); cg.beginPath(); poly.forEach(([s, t], i) => (i ? cg.lineTo(X(s), Y(t)) : cg.moveTo(X(s), Y(t)))); cg.closePath(); cg.clip();
  cg.strokeStyle = pal.vein; cg.globalAlpha = pal.sheen ? 0.3 : 0.7; veinPaths(cg, kind, poly, X, Y, pal, pal.vw); cg.restore();
  bg.strokeStyle = '#ffffff'; bg.globalAlpha = 0.9; veinPaths(bg, kind, poly, X, Y, pal, 6); bg.globalAlpha = 1;
  const map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const bumpT = new THREE.CanvasTexture(bump); bumpT.anisotropy = 8;
  return (texCache[ck] = { map, bump: bumpT });
}
const NX = 60, NZ = 36;
export class Wing {
  constructor(kind, side, Ls, key) {
    this.kind = kind; this.side = side; this.Ls = Ls;
    const [s0, s1, t0, t1] = BOX[kind];
    const g = new THREE.PlaneGeometry(Ls * (s1 - s0), Ls * (t1 - t0), NX, NZ);
    g.rotateX(Math.PI / 2); g.translate((Ls * (s0 + s1)) / 2, 0, (Ls * (t0 + t1)) / 2);
    // fixed corrugation: the membrane is pleated between the veins
    const P = g.attributes.position, xb = Ls * BASE_PT[kind][0], zb = Ls * BASE_PT[kind][1];
    for (let i = 0; i < P.count; i++) { const dx = P.getX(i) - xb, dz = P.getZ(i) - zb, r = Math.hypot(dx, dz), th = Math.atan2(dz, dx); P.setY(i, 0.0075 * Ls * Math.sin(th * 20) * Math.min(1, r / (0.45 * Ls))); }
    this.geo = g; this.base = g.attributes.position.array.slice();
    this.mat = new THREE.MeshPhysicalMaterial({ roughness: 0.52, metalness: 0, side: THREE.DoubleSide, alphaTest: 0.5, alphaToCoverage: true, sheen: 0.5, sheenRoughness: 0.5, bumpScale: 1.6 });
    this.repaint(key);
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.scale.x = side; this.mesh.castShadow = true;
    // the root arm: the wing continues inward past the pivot to the axillary plates (inner end I, LIN away)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, LIN + 0.05, 10), new THREE.MeshStandardMaterial({ color: 0x4a3b2a, roughness: 0.55 }));
    arm.rotation.z = Math.PI / 2; arm.position.set(-LIN / 2 + 0.02, 0, 0);
    this.arm = arm;
    this.mir = new THREE.Group(); this.mir.scale.x = side; this.mir.add(arm);
    this.pivot = new THREE.Group(); this.pivot.add(this.mesh, this.mir);
    this.lev = null;
  }
  repaint(key) {
    const t = wingTex(this.kind, key), pal = PALETTES[key];
    this.mat.map = t.map; this.mat.bumpMap = t.bump;
    this.mat.iridescence = pal.irid ? 1 : 0; this.mat.iridescenceIOR = 1.9; this.mat.iridescenceThicknessRange = [180, 460];
    this.mat.sheenColor = new THREE.Color(pal.sheen || pal.base).multiplyScalar(0.6); this.mat.needsUpdate = true;
  }
  pose(a, bend) {
    const s = this.side;
    this.pivot.rotation.set(a.pitch, -s * a.sweep, s * a.elev, 'YZX');
    const p = this.geo.attributes.position, B = this.base, Ls = this.Ls;
    for (let i = 0; i < p.count; i++) { const x = B[3 * i]; const f = Math.max(0, x) / Ls; p.array[3 * i + 1] = B[3 * i + 1] + bend * Ls * 0.16 * f * f - 0.02 * Ls * Math.sin(Math.PI * Math.min(1, f)) * 0.5; }
    p.needsUpdate = true; this.geo.computeVertexNormals();
  }
}

// ------------------------------------------------------------------ small textures
function fibreTex(rep = [3, 5]) {
  const cv = canvas(256, 256), g = cv.getContext('2d'), r = rng(5);
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1100; i++) { const x = r() * 256; g.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.16})`; g.lineWidth = 0.6 + r() * 1.4; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 4, 256); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,0.1)'; g.lineWidth = 1; for (let y = 8; y < 256; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } // sarcomere banding
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function grainTex() {
  const cv = canvas(256, 256), g = cv.getContext('2d'), r = rng(9); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) { const v = 90 + r() * 90; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(r() * 256, r() * 256, 1 + r() * 3, 0, TAU); g.fill(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 4); return t;
}
function facetTex() { // a hexagonal lattice of ommatidia: dark gaps, a bright dome in each facet
  const S = 512, cv = canvas(S, S), g = cv.getContext('2d'), bump = canvas(S, S), b = bump.getContext('2d');
  g.fillStyle = '#0d0b09'; g.fillRect(0, 0, S, S); b.fillStyle = '#000'; b.fillRect(0, 0, S, S);
  const R = 14, dx = R * Math.sqrt(3), dy = R * 1.5;
  for (let row = -1; row * dy < S + dy; row++) for (let c = -1; c * dx < S + dx; c++) {
    const x = c * dx + (row % 2 ? dx / 2 : 0), y = row * dy;
    const gr = g.createRadialGradient(x - R * 0.25, y - R * 0.25, 1, x, y, R); gr.addColorStop(0, '#5a4a3a'); gr.addColorStop(0.55, '#2a211a'); gr.addColorStop(1, '#0d0b09');
    g.fillStyle = gr; g.beginPath(); for (let k = 0; k < 6; k++) { const a = TAU / 6 * k + Math.PI / 6; g.lineTo(x + (R - 1.2) * Math.cos(a), y + (R - 1.2) * Math.sin(a)); } g.closePath(); g.fill();
    const bgr = b.createRadialGradient(x, y, 0, x, y, R); bgr.addColorStop(0, '#fff'); bgr.addColorStop(1, '#000'); b.fillStyle = bgr; b.beginPath(); b.arc(x, y, R - 0.5, 0, TAU); b.fill();
  }
  const m = new THREE.CanvasTexture(cv); m.colorSpace = THREE.SRGBColorSpace; const bm = new THREE.CanvasTexture(bump);
  for (const t of [m, bm]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1.5); t.anisotropy = 4; }
  return { m, bm };
}
function ringTex(light) {
  const cv = canvas(128, 8), g = cv.getContext('2d'); g.fillStyle = '#17120e'; g.fillRect(0, 0, 128, 8); g.fillStyle = light; g.fillRect(0, 0, 3, 8); g.fillRect(64, 0, 3, 8);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 1); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function abdomenTex(pal) {
  const cv = canvas(256, 512), g = cv.getContext('2d'); g.fillStyle = pal.abd; g.fillRect(0, 0, 256, 512);
  const r = rng(3);
  for (let i = 0; i < 2600; i++) { const v = r(); g.fillStyle = v < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'; g.fillRect(r() * 256, r() * 512, 2 + r() * 4, 1 + r() * 2); }
  if (pal.abdDots) { g.fillStyle = pal.abdDots; for (let i = 0; i < 16; i++) for (const u of [0.0, 0.5, 1.0]) { g.beginPath(); g.arc(u * 256, 40 + i * 28, 4.5, 0, TAU); g.fill(); } }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ------------------------------------------------------------------ the thorax
// cross-section is a superellipse (box with round corners), tapering to a point at both ends
const TH = { A: 1.0, B: 0.8, yc: 0, C: 1.45, n: 3 };
const spow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
function shellPoint(th, ph) {
  const r = Math.pow(Math.cos(ph), 0.6);
  return [TH.A * r * spow(Math.cos(th), 2 / TH.n), TH.yc + TH.B * r * spow(Math.sin(th), 2 / TH.n), TH.C * Math.sin(ph)];
}
const wRoof = (y) => smooth(0.12, 0.62, y); // how much of the roof deformation a point at height y gets
// a hair direction: along the surface normal n, swept towards -z within the tangent plane, never pointing into the body
const BACK = new THREE.Vector3(0, 0, -1);
function hairDir(n, sweep, r, spread = 0.3) {
  const t = BACK.clone().addScaledVector(n, -n.dot(BACK)); if (t.lengthSq() > 1e-6) t.normalize();
  const d = n.clone().multiplyScalar(0.7).addScaledVector(t, sweep).add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(spread)).normalize();
  const k = d.dot(n); if (k < 0.4) d.addScaledVector(n, 0.4 - k).normalize();
  return d;
}
const SPLIT = 0.06; // the exploded view splits the cuticle into a lid and a floor at this height (the roof does not deform below 0.12)

// Parts of the exploded view: direction/distance at explode = 1, a local anchor for the label, and the text shown when it is picked.
export const PARTS = [
  { k: 'lid', name: 'Roof (notum) and side walls', off: [0, 2.0, 0], anchor: [0, 0.78, -0.3], info: 'The roof of the thorax with the wall bearing the wing-hinge. It is the surface the muscles deform: pulled down by the vertical muscles, arched up by the long ones.' },
  { k: 'dlm', name: 'Dorsolongitudinal muscles', off: [0, 0.75, 0], anchor: [0, 0.2, 0.9], info: 'Three on each side run front to back. Shortening the thorax arches the roof and so drives the wings down, the power stroke.' },
  { k: 'dvm', name: 'Dorsoventral muscles', off: [1.7, 0.2, 0], anchor: [0.68, -0.1, -0.25], info: 'Vertical, from roof to floor. They pull the roof down; through the lever of the hinge this raises the wings.' },
  { k: 'hinge', name: 'Wing hinge: plates and fulcrum', off: [0, 1.15, 0], anchor: [0.92, 0.5, -0.05], info: 'Hard plates joined by rubbery resilin, resting on a peg of the side wall. It bends instead of sliding: a compliant mechanism, no bearing.' },
  { k: 'gut', name: 'Gut', off: [0, -0.7, 0.2], anchor: [0, -0.36, 0.9], info: 'The food canal runs straight through the thorax from the mouth to the abdomen.' },
  { k: 'nerve', name: 'Nerve cord', off: [0, -1.5, -0.2], anchor: [0, -0.66, 0.4], info: 'The ventral nerve cord with the thoracic ganglia, where the motor neurons that time every wing beat start.' },
  { k: 'floor', name: 'Floor (sternum)', off: [0, -2.5, 0], anchor: [0, -0.8, 0.5], info: 'The underside of the thorax, the fixed anchor of the vertical muscles. The legs attach here.' },
  { k: 'legs', name: 'Legs', off: [0, -3.4, 0.5], anchor: [0.45, -1.15, 0.2], info: 'Six legs. In the brush-footed butterflies such as the monarch the front pair is reduced and held folded; only four are used for walking.' },
  { k: 'head', name: 'Head', off: [0, 0.5, 2.0], anchor: [0, 0.3, 2.3], info: 'Carries the eyes, antennae and mouthparts. It plays no part in moving the wings.' },
  { k: 'eyeR', name: 'Compound eyes', off: [1.2, 0.5, 1.2], anchor: [0.4, 0.25, 2.25], info: 'Each eye is a lattice of thousands of tiny lenses, the ommatidia. Butterflies see colour, including ultraviolet.' },
  { k: 'eyeL', name: '', off: [-1.2, 0.5, 1.2], anchor: [-0.4, 0.25, 2.25] },
  { k: 'antR', name: 'Antennae', off: [1.6, 1.6, 1.3], anchor: [0.85, 1.5, 3.4], info: 'Clubbed in butterflies. They carry smell organs and, at the base, a sensor of airspeed and rotation that matters in flight.' },
  { k: 'antL', name: '', off: [-1.6, 1.6, 1.3], anchor: [-0.85, 1.5, 3.4] },
  { k: 'prob', name: 'Proboscis', off: [0, -1.4, 2.4], anchor: [0, -0.2, 2.5], info: 'A drinking straw rolled up under the head, made of two grooved halves zipped together.' },
  { k: 'abd', name: 'Abdomen', off: [0, -0.3, -3.2], anchor: [0, 0.05, -3.4], info: 'Digestion, reproduction and air sacs. It holds no flight muscle and trails behind as a counterweight.' },
  { k: 'foreR', name: 'Forewing', off: [3.2, 1.1, 0.9], anchor: [2.9, 0, 0.3], info: 'A membrane held open by hollow veins and covered in overlapping scales. There is no muscle in it.' },
  { k: 'foreL', name: '', off: [-3.2, 1.1, 0.9], anchor: [-2.9, 0, 0.3] },
  { k: 'hindR', name: 'Hindwing', off: [3.0, 0.1, -2.0], anchor: [2.4, 0, -1.7], info: 'Linked to the forewing so that both beat as one surface; it adds area behind the centre of mass.' },
  { k: 'hindL', name: '', off: [-3.0, 0.1, -2.0], anchor: [-2.4, 0, -1.7] },
];

export class Butterfly {
  // opts: species
  constructor(opts = {}) {
    this.group = new THREE.Group();
    this.P = { ...DEFAULT_P };
    this.zc = 0; this.cut = true; this.dy = 0; this.D = LIN * Math.sin(A0); this.ex = 0; this.furDy = null;
    this.key = opts.species || 'monarch'; this.pal = PALETTES[this.key];
    this.clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    this.clipU = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SPLIT); // keeps the lid
    this.clipL = new THREE.Plane(new THREE.Vector3(0, -1, 0), SPLIT); // keeps the floor
    this.clipMats = [];
    this.parts = {};
    for (const p of PARTS) { const g = new THREE.Group(); this.group.add(g); this.parts[p.k] = { ...p, g, off: new THREE.Vector3(...p.off), anchor: new THREE.Vector3(...p.anchor) }; }
    this._shell(); this._muscles(); this._hinge(); this._wings(); this._body(); this._fur();
    this.setCut(true, 0);
  }
  _cm(m, planes) { m.clippingPlanes = planes || [this.clip]; m.clipShadows = true; this.clipMats.push(m); return m; }
  _shell() {
    const NT = 96, NP = 56, pos = [], idx = [], col = [], uv = [];
    this.shellBase = [];
    for (let j = 0; j <= NP; j++) for (let i = 0; i <= NT; i++) {
      const th = (i / NT) * TAU, ph = -Math.PI / 2 + (j / NP) * Math.PI;
      const [x, y, z] = shellPoint(th, ph); pos.push(x, y, z); uv.push(i / NT, j / NP); this.shellBase.push(x, y, z);
      const w = wRoof(y), lat = Math.abs(x) > 0.55 ? 1 : 0;
      const c = new THREE.Color();
      if (y < -0.5) c.set('#b99a6e'); else if (w > 0.9) c.set('#7a5a36'); else if (w < 0.08) c.set('#c9ab7c'); else c.set(lat ? '#8aa77f' : '#9a7a50');
      col.push(c.r, c.g, c.b);
    }
    for (let j = 0; j < NP; j++) for (let i = 0; i < NT; i++) { const a = j * (NT + 1) + i, b = a + 1, c = a + NT + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.computeVertexNormals(); this.shellGeo = g;
    const grain = grainTex();
    const half = (planes, part) => {
      const out = new THREE.Mesh(g, this._cm(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, clearcoat: 0.45, clearcoatRoughness: 0.35, bumpMap: grain, bumpScale: 0.7, transparent: true, opacity: 1, side: THREE.FrontSide }), planes));
      const inn = new THREE.Mesh(g, this._cm(new THREE.MeshStandardMaterial({ color: 0xe6d3b0, roughness: 0.6, bumpMap: grain, bumpScale: 0.12, side: THREE.BackSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), planes)); // pushed towards the camera so the hairs rooted on the outside never show through it
      out.castShadow = false; out.receiveShadow = true; part.g.add(out, inn); return out;
    };
    this.shellOutU = half([this.clip, this.clipU], this.parts.lid); this.shellOutL = half([this.clip, this.clipL], this.parts.floor);
    this.shellOut = this.shellOutU; // legacy handle used by the figures
    // the cuticle's cut edge
    this.cutEdge = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0x5a4220, roughness: 0.5 }));
    this.group.add(this.cutEdge);
  }
  setSee(on) { for (const m of [this.shellOutU, this.shellOutL]) m.material.opacity = on ? 0.3 : 1; this.furOn = !on; this._furVis(); }
  roofY(x, z, dy = this.dy) {
    const rr = Math.pow(Math.max(0, Math.cos(Math.asin(clamp(z / TH.C, -1, 1)))), 0.6);
    const yb = TH.yc + TH.B * rr * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / (TH.A * rr), TH.n)), 1 / TH.n);
    return yb + wRoof(yb) * dy;
  }
  _muscles() {
    const prof = []; for (let i = 0; i <= 18; i++) { const t = i / 18; prof.push(new THREE.Vector2(Math.max(0.02, Math.pow(Math.sin(Math.PI * t), 0.45)), t - 0.5)); }
    const lathe = new THREE.LatheGeometry(prof, 28); // radius profile along y from -0.5 to 0.5, radius 1 at the middle
    const fibre = fibreTex();
    const mk = (part) => {
      const mat = this._cm(new THREE.MeshPhysicalMaterial({ map: fibre, bumpMap: fibre, bumpScale: 1.4, color: 0xa8281e, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.25, sheen: 0.4, sheenColor: new THREE.Color(0xff8a7a), side: THREE.FrontSide }));
      const back = this._cm(new THREE.MeshStandardMaterial({ color: 0x7a1f1a, roughness: 0.6, side: THREE.BackSide }));
      const m = new THREE.Mesh(lathe, mat), b = new THREE.Mesh(lathe, back);
      const gr = new THREE.Group(); gr.add(m, b); part.g.add(gr); gr.mat = mat; return gr;
    };
    this.dlm = [-0.3, 0, 0.3].map((x) => { const m = mk(this.parts.dlm); m.x = x; return m; });
    this.dvm = [[0.68, -0.25], [-0.68, -0.25], [0.68, -0.8], [-0.68, -0.8]].map(([x, z]) => { const m = mk(this.parts.dvm); m.x = x; m.z = z; return m; });
    // cut faces of the long muscles, gut and nerve cord at the section plane
    const capMat = (c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
    this.caps = this.dlm.map(() => new THREE.Mesh(new THREE.CircleGeometry(1, 36), capMat(0xd9594a)));
    // gut: ringed like a real alimentary canal; nerve cord with a swelling at each thoracic ganglion
    const gp = [], npf = [];
    for (let i = 0; i <= 80; i++) { const t = i / 80, y = (t - 0.5) * 2.4; gp.push(new THREE.Vector2(0.14 * (1 + 0.07 * Math.cos(t * 2.4 * 14)), y)); npf.push(new THREE.Vector2(0.045 + 0.045 * (Math.exp(-Math.pow((y + 0.75) / 0.17, 2)) + Math.exp(-Math.pow(y / 0.17, 2)) + Math.exp(-Math.pow((y - 0.75) / 0.17, 2))), y)); }
    this.gut = new THREE.Mesh(new THREE.LatheGeometry(gp, 28), this._cm(new THREE.MeshPhysicalMaterial({ color: 0xcdb7e6, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2, side: THREE.DoubleSide })));
    this.gut.rotation.x = Math.PI / 2; this.gut.position.set(0, -0.36, 0);
    this.nerve = new THREE.Mesh(new THREE.LatheGeometry(npf, 18), this._cm(new THREE.MeshPhysicalMaterial({ color: 0xe8c547, roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide })));
    this.nerve.rotation.x = Math.PI / 2; this.nerve.position.set(0, -0.66, 0);
    this.gutCap = new THREE.Mesh(new THREE.CircleGeometry(0.14, 28), capMat(0xe3d4f3)); this.nerveCap = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), capMat(0xf3dc7a));
    this.parts.gut.g.add(this.gut, this.gutCap); this.parts.nerve.g.add(this.nerve, this.nerveCap);
    this.parts.dlm.g.add(...this.caps);
    for (const m of [...this.dlm, ...this.dvm]) m.children.forEach((c) => (c.castShadow = false));
  }
  _hinge() {
    const hg = this.parts.hinge.g; this.hingeG = hg;
    const blue = new THREE.MeshPhysicalMaterial({ color: 0x0b4fc0, roughness: 0.3, clearcoat: 0.8 }), dark = new THREE.MeshPhysicalMaterial({ color: 0x3a2d1d, roughness: 0.4, clearcoat: 0.5 });
    this.pegs = [1, -1].map((s) => { const m = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 20), blue); m.position.set(s * HINGE.x, HINGE.y - 0.1, ZF); hg.add(m); return m; });
    // axillary plates: a link from the inner end of the wing root up to the roof edge
    this.links = [1, -1].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 10), dark); hg.add(m); return m; });
    this.knobs = [1, -1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), dark); hg.add(m); return m; });
    this.pivots = [1, -1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.065, 18, 14), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2, clearcoat: 1 })); hg.add(m); return m; });
  }
  _wings() {
    this.wings = { fore: [1, -1].map((s) => new Wing('fore', s, 3.5, this.key)), hind: [1, -1].map((s) => new Wing('hind', s, 2.9, this.key)) };
    this.wingG = new THREE.Group(); this.group.add(this.wingG);
    const host = { fore: [this.parts.foreR, this.parts.foreL], hind: [this.parts.hindR, this.parts.hindL] };
    for (const kind of ['fore', 'hind']) this.wings[kind].forEach((w, i) => {
      if (kind === 'fore') w.pivot.position.set(w.side * HINGE.x, HINGE.y, ZF); else w.pivot.position.set(w.side * 0.86, HINGE.y - 0.04, -1.0);
      host[kind][i].g.add(w.pivot);
    });
  }
  _body() {
    this.bodyG = new THREE.Group(); this.group.add(this.bodyG);
    const fur = new THREE.MeshStandardMaterial({ color: new THREE.Color(this.pal.fur), roughness: 0.95 }); this.furBase = fur;
    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 28), fur); head.position.set(0, 0.05, 1.95); head.scale.set(1, 0.96, 0.94); head.castShadow = true;
    const ft = facetTex(); this.eyeMat = new THREE.MeshPhysicalMaterial({ map: ft.m, bumpMap: ft.bm, bumpScale: 2.5, color: 0xffffff, roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 });
    const mkEye = (s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.24, 40, 30), this.eyeMat); e.scale.set(0.82, 1.08, 1.0); e.position.set(s * 0.33, 0.14, 2.1); e.rotation.y = s * 0.4; e.castShadow = true; return e; };
    this.parts.head.g.add(head); this.headMesh = head;
    this.parts.eyeR.g.add(mkEye(1)); this.parts.eyeL.g.add(mkEye(-1));
    // labial palps: two furry rods pointing forward below the eyes
    for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 6, 14), fur); p.position.set(s * 0.14, -0.26, 2.42); p.rotation.x = Math.PI / 2 - 0.35; p.castShadow = true; this.parts.head.g.add(p); }
    // proboscis: a coil seen from the side
    const pc = []; for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * TAU * 2.3, r = 0.17 - 0.1 * t; pc.push(new THREE.Vector3(0, -0.3 + r * Math.cos(a) * 0.9, 2.3 + 0.12 + r * Math.sin(a))); }
    const prob = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pc), 160, 0.026, 8), new THREE.MeshPhysicalMaterial({ color: 0x9c7a4c, roughness: 0.35, clearcoat: 0.6 }));
    prob.castShadow = true; this.parts.prob.g.add(prob);
    // antennae: ringed shaft and a club
    const ant = new THREE.MeshStandardMaterial({ map: ringTex(this.pal.abdDots || '#d8c9a8'), roughness: 0.6 }); this.antMat = ant;
    for (const s of [1, -1]) {
      const c = new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.15, 0.42, 2.25), new THREE.Vector3(s * 0.42, 0.95, 2.8), new THREE.Vector3(s * 0.85, 1.45, 3.35), new THREE.Vector3(s * 1.15, 1.7, 3.8)]);
      const shaft = new THREE.Mesh(new THREE.TubeGeometry(c, 60, 0.016, 8), ant); shaft.castShadow = true;
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshStandardMaterial({ color: 0x17120e, roughness: 0.5 })); k.scale.set(1, 1, 2.6); const end = c.getPoint(1); k.position.copy(end); k.lookAt(end.clone().add(c.getTangent(1)));
      const gs = this.parts[s > 0 ? 'antR' : 'antL'].g; gs.add(shaft, k);
    }
    // abdomen: segmented, tapering, with its own texture
    const NU = 90, NA = 40, pos = [], uv = [], idx = [];
    for (let j = 0; j <= NU; j++) { const u = j / NU, r = 0.46 * Math.pow(Math.sin(Math.PI * (0.1 + 0.9 * u)), 0.5) * (1 + 0.05 * Math.cos(TAU * 9 * u)); for (let i = 0; i <= NA; i++) { const a = (i / NA) * TAU; pos.push(r * Math.cos(a), -0.12 + r * 0.96 * Math.sin(a), -1.6 - 3.4 * u); uv.push(i / NA, u); } }
    for (let j = 0; j < NU; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ag.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ag.setIndex(idx); ag.computeVertexNormals(); this.abdGeo = ag;
    this.abdMat = new THREE.MeshPhysicalMaterial({ map: abdomenTex(this.pal), roughness: 0.8, sheen: 0.6, sheenColor: new THREE.Color(0x888070), sheenRoughness: 0.6 });
    const ab = new THREE.Mesh(ag, this.abdMat); ab.castShadow = true; this.parts.abd.g.add(ab); this.abdomen = ab;
    // legs: coxa-femur-tibia-tarsus chains tucked against the underside
    const legM = new THREE.MeshStandardMaterial({ color: 0x2a211a, roughness: 0.55 });
    const seg = (a, b, r0, r1, par) => { const d = b.clone().sub(a), L = d.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, 10), legM); m.position.copy(a.clone().add(b).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); par.add(m); const j = new THREE.Mesh(new THREE.SphereGeometry(r1 * 1.25, 10, 8), legM); j.position.copy(b); par.add(j); m.castShadow = true; };
    const lg = this.parts.legs.g;
    [[0, 0.82, 0.12, 0.5, 0.45], [1, 0.1, 0.5, 0.9, 0.7], [2, -0.65, 0.55, 1.05, 0.95]].forEach(([pair, z, ox, fo, to], n) => {
      for (const s of [1, -1]) {
        const p0 = new THREE.Vector3(s * 0.28, -0.72, z), p1 = new THREE.Vector3(s * (0.28 + ox * 0.4), -0.98, z + (n === 0 ? 0.28 : 0.18)), p2 = new THREE.Vector3(s * (0.28 + ox * 0.65), -1.42 + (n === 0 ? 0.25 : 0), z + (n === 0 ? 0.55 : -0.1 - 0.12 * n)),
          p3 = new THREE.Vector3(s * (0.28 + ox * 0.65), -1.62 + (n === 0 ? 0.35 : 0), z + (n === 0 ? 0.35 : -0.25 - 0.1 * n));
        seg(p0, p1, 0.05, 0.04, lg); seg(p1, p2, 0.04, 0.03, lg); seg(p2, p3, 0.028, 0.02, lg);
      }
    });
  }
  _fur() {
    const hairGeo = new THREE.ConeGeometry(0.009, 1, 5, 1, false); hairGeo.translate(0, 0.5, 0);
    const cols = []; const pp = hairGeo.attributes.position; for (let i = 0; i < pp.count; i++) { const v = 0.5 + 0.5 * pp.getY(i); cols.push(v, v, v); } hairGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    this._hairGeo = hairGeo;
    const mk = (planes) => { const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(this.pal.fur).multiplyScalar(1.6), vertexColors: true, roughness: 0.9 }); if (planes) this._cm(m, planes); return m; };
    this.furMats = [];
    const up = new THREE.Vector3(0, 1, 0), tmp = new THREE.Object3D();
    const build = (list, mat, parent, keepBase) => {
      const im = new THREE.InstancedMesh(hairGeo, mat, list.length); const r = rng(77 + list.length);
      list.forEach((h, i) => {
        tmp.position.copy(h.p); tmp.quaternion.setFromUnitVectors(up, h.d); tmp.scale.set(h.w, h.l, h.w); tmp.updateMatrix(); im.setMatrixAt(i, tmp.matrix);
        const v = 0.6 + r() * 0.8; im.setColorAt(i, new THREE.Color(v, v, v));
      });
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; parent.add(im); this.furMats.push(mat);
      if (keepBase) im.userData.base = list;
      return im;
    };
    const r = rng(31), lists = { up: [], lo: [] };
    // thorax fur: hairs sweep backward
    const pt = (th, ph) => new THREE.Vector3(...shellPoint(th, ph));
    for (let n = 0; n < 9000; n++) {
      const th = r() * TAU, ph = Math.asin((r() * 2 - 1) * 0.97), p = pt(th, ph);
      const e = 1e-3, dth = pt(th + e, ph).sub(p), dph = pt(th, ph + e).sub(p), nrm = new THREE.Vector3().crossVectors(dth, dph).normalize();
      if (nrm.dot(p) < 0) nrm.negate();
      const d = hairDir(nrm, 0.6, r);
      const hair = { p, d, l: 0.11 + r() * 0.12, w: 0.8 + r() * 0.6 };
      (p.y > SPLIT ? lists.up : lists.lo).push(hair);
    }
    this.furU = build(lists.up, mk([this.clip, this.clipU]), this.parts.lid.g, true);
    this.furL = build(lists.lo, mk([this.clip, this.clipL]), this.parts.floor.g, false);
    // head fur
    const hh = [];
    for (let n = 0; n < 1800; n++) { const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(); const p = new THREE.Vector3(0, 0.05, 1.95).add(v.clone().multiplyScalar(0.49).multiply(new THREE.Vector3(1, 0.96, 0.94))); if (Math.abs(v.x) > 0.55 && v.z > -0.1) continue;
      hh.push({ p, d: hairDir(v, 0.35, r), l: 0.07 + r() * 0.08, w: 0.7 + r() * 0.5 }); }
    this.furH = build(hh, mk(), this.parts.head.g);
    // abdomen: short hairs
    const ah = [];
    for (let n = 0; n < 4200; n++) { const u = 0.02 + r() * 0.96, a = r() * TAU, rad = 0.38 * Math.pow(Math.sin(Math.PI * (0.1 + 0.9 * u)), 0.62) * (1 + 0.05 * Math.cos(TAU * 9 * u));
      const p = new THREE.Vector3(rad * Math.cos(a), -0.12 + rad * 0.96 * Math.sin(a), -1.6 - 3.4 * u); const o = new THREE.Vector3(Math.cos(a), 0.96 * Math.sin(a), 0).normalize();
      ah.push({ p, d: hairDir(o, 0.5, r, 0.2), l: 0.05 + r() * 0.06, w: 0.55 + r() * 0.4 }); }
    this.furA = build(ah, mk(), this.parts.abd.g);
    this.furOn = true; this._furVis();
  }
  _furVis() { for (const f of [this.furU, this.furL, this.furH, this.furA]) f.visible = this.furOn; }
  // fur on the roof follows the deformation of the roof
  _furRoof() {
    const im = this.furU, list = im.userData.base, tmp = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0), dy = this.dy;
    if (this.furDy !== null && Math.abs(dy - this.furDy) < 4e-4) return; this.furDy = dy;
    for (let i = 0; i < list.length; i++) { const h = list[i]; tmp.position.set(h.p.x, h.p.y + wRoof(h.p.y) * dy, h.p.z); tmp.quaternion.setFromUnitVectors(up, h.d); tmp.scale.set(h.w, h.l, h.w); tmp.updateMatrix(); im.setMatrixAt(i, tmp.matrix); }
    im.instanceMatrix.needsUpdate = true;
  }
  setSpecies(key) {
    this.key = key; this.pal = PALETTES[key];
    for (const w of [...this.wings.fore, ...this.wings.hind]) w.repaint(key);
    this.furBase.color.set(this.pal.fur); for (const m of this.furMats) m.color.set(this.pal.fur).multiplyScalar(1.6);
    this.abdMat.map.dispose(); this.abdMat.map = abdomenTex(this.pal); this.abdMat.needsUpdate = true;
    this.antMat.map.dispose(); this.antMat.map = ringTex(this.pal.abdDots || '#d8c9a8'); this.antMat.needsUpdate = true;
  }
  setCut(on, zc = this.zc) {
    this.cut = on; this.zc = zc; this.clip.constant = on ? zc : 99;
    this.parts.head.g.visible = !on; this.parts.eyeR.g.visible = this.parts.eyeL.g.visible = !on; this.parts.antR.g.visible = this.parts.antL.g.visible = !on; this.parts.prob.g.visible = !on; this.parts.legs.g.visible = !on;
    this.setSee(false);
    this.shellOutU.castShadow = this.shellOutL.castShadow = !on;
    for (const c of this.caps) c.visible = on; this.gutCap.visible = on; this.nerveCap.visible = on; this.cutEdge.visible = on;
    this.layout();
  }
  layout() { /* muscles are placed in update() */ }
  // explode in [0, ~1.1]: moves every part along its own direction and keeps the clip planes of the two cuticle halves on their parts
  explode(e) {
    this.ex = e;
    for (const k in this.parts) { const p = this.parts[k]; p.g.position.copy(p.off).multiplyScalar(e); }
    this.clipU.constant = -(SPLIT + this.parts.lid.g.position.y); this.clipL.constant = SPLIT + this.parts.floor.g.position.y;
  }
  // phase ph in [0,1); P carries the wing parameters
  update(ph, P = this.P) {
    this.P = P;
    const aR = wingAngles(ph, P, 1), aL = wingAngles(ph, P, -1);
    this.dy = -LIN * Math.sin(aR.elev); // the roof edge follows the inner end of the wing root
    const dy = this.dy;
    // shell: roof moves with dy
    const p = this.shellGeo.attributes.position, B = this.shellBase;
    for (let i = 0; i < p.count; i++) { const y = B[3 * i + 1], wt = wRoof(y); p.array[3 * i + 1] = y + wt * dy; p.array[3 * i + 2] = B[3 * i + 2]; }
    p.needsUpdate = true; this.shellGeo.computeVertexNormals(); this._furRoof();
    // wings
    const bendF = (a, ph0) => { const d = 1e-3, a2 = wingAngles(ph0 + d, P, a.side).elev; return clamp(((a2 - a.elev) / d) * 0.012, -1, 1); };
    this.aR = aR; this.aL = aL;
    const eR = aR.elev, eL = aL.elev;
    this.wings.fore[0].pose(aR, bendF({ side: 1, elev: aR.elev }, ph)); this.wings.fore[1].pose(aL, bendF({ side: -1, elev: aL.elev }, ph));
    const lag = 0.018, hR = wingAngles(ph - lag, P, 1), hL = wingAngles(ph - lag, P, -1);
    this.wings.hind[0].pose(hR, bendF({ side: 1, elev: hR.elev }, ph - lag)); this.wings.hind[1].pose(hL, bendF({ side: -1, elev: hL.elev }, ph - lag));
    // hinge: inner end of the root arm, link to the roof edge, pegs
    [[1, eR], [-1, eL]].forEach(([s, e], k) => {
      const I = new THREE.Vector3(s * (HINGE.x - LIN * Math.cos(e)), HINGE.y - LIN * Math.sin(e), ZF);
      const xr = Math.abs(I.x), top = new THREE.Vector3(I.x, this.roofY(xr, ZF, dy) - 0.015, ZF);
      const mid = I.clone().add(top).multiplyScalar(0.5), L = I.distanceTo(top);
      const lk = this.links[k]; lk.position.copy(mid); lk.scale.set(1, L, 1);
      lk.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(I).normalize());
      this.knobs[k].position.copy(I); this.pivots[k].position.set(s * HINGE.x, HINGE.y, ZF);
      this.anchorI = this.anchorI || {}; this.anchorI[s] = { I, top };
    });
    // muscles
    const fD = force(ph, 'dvm'), fL = force(ph, 'dlm'); this.fDVM = fD; this.fDLM = fL;
    const zc = this.zc;
    this.dlm.forEach((m, k) => {
      const yTop = this.roofY(m.x, 0, dy), r = 0.1 + 0.04 * fL, len = 2.5 - 0.12 * fL;
      const y = yTop - 0.2 - r * 0.6; m.position.set(m.x, y, 0); m.rotation.set(Math.PI / 2, 0, 0); m.scale.set(r, len, r);
      m.mat.color.setRGB(0.55 + 0.4 * fL, 0.2 - 0.1 * fL, 0.17 - 0.07 * fL);
      const cap = this.caps[k], zz = clamp(zc / (len / 2), -1, 1), rr = r * Math.pow(Math.sin(Math.PI * (zz * 0.5 + 0.5)), 0.45);
      cap.position.set(m.x, y, zc + 0.002); cap.scale.set(Math.max(0.01, rr), Math.max(0.01, rr), 1); cap.visible = this.cut && Math.abs(zc) < len / 2 - 0.05;
      cap.material.color.setRGB(0.8 + 0.15 * fL, 0.3 - 0.1 * fL, 0.26);
    });
    this.dvm.forEach((m) => {
      const yTop = this.roofY(m.x, m.z, dy) - 0.04, yBot = -0.74, len = yTop - yBot, r = 0.1 + 0.055 * fD;
      m.position.set(m.x, (yTop + yBot) / 2, m.z); m.rotation.set(0, 0, 0); m.scale.set(r, len, r);
      m.mat.color.setRGB(0.55 + 0.4 * fD, 0.2 - 0.1 * fD, 0.17 - 0.07 * fD);
    });
    this.gutCap.position.set(0, -0.36, zc + 0.002); this.nerveCap.position.set(0, -0.66, zc + 0.002);
    // cut edge of the cuticle at the section plane
    if (this.cut) {
      const pts = [], sp = clamp(zc / TH.C, -0.98, 0.98), ph2 = Math.asin(sp);
      for (let i = 0; i < 90; i++) { const th = (i / 90) * TAU, [x, y] = shellPoint(th, ph2); pts.push(new THREE.Vector3(x, y + wRoof(y) * dy, zc)); }
      const curve = new THREE.CatmullRomCurve3(pts, true); this.cutEdge.geometry.dispose(); this.cutEdge.geometry = new THREE.TubeGeometry(curve, 120, 0.028, 8, true);
    }
    return { aR, aL, fD, fL, dy };
  }
  // world positions of the labelled parts (butterfly coordinates)
  anchors() {
    const dy = this.dy, z = this.zc, a = this.anchorI || {};
    return {
      notum: new THREE.Vector3(-0.3, this.roofY(0.3, z, dy) + 0.0, z),
      dlm: new THREE.Vector3(0, this.dlm[1].position.y, z),
      dvm: new THREE.Vector3(-0.68, 0.0, -0.25),
      peg: new THREE.Vector3(HINGE.x, HINGE.y - 0.12, ZF),
      link: a[1] ? a[1].I.clone().add(a[1].top).multiplyScalar(0.5) : new THREE.Vector3(),
      resilin: new THREE.Vector3(0.96, 0.33, ZF),
      root: new THREE.Vector3(-HINGE.x, HINGE.y, ZF),
      sternum: new THREE.Vector3(0.3, -0.8, -0.2),
      gut: new THREE.Vector3(0.1, -0.36, z),
      nerve: new THREE.Vector3(-0.1, -0.66, z),
      fore: new THREE.Vector3(2.7, 1.25, 0.45),
    };
  }
  partAnchor(k) { const p = this.parts[k]; return p.anchor.clone().add(p.g.position); }
}
const ZF = -0.05; // fore-aft position of the forewing hinge (just behind the cut plane)

// ------------------------------------------------------------------ light: a procedural studio for the reflections
function makeEnv(renderer) {
  const sc = new THREE.Scene(), geo = new THREE.SphereGeometry(40, 48, 24), pos = geo.attributes.position, cols = [];
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 40, c = new THREE.Color(); if (y > 0) c.lerpColors(new THREE.Color('#f4f7ff'), new THREE.Color('#9fbfff'), Math.pow(y, 0.7)); else c.lerpColors(new THREE.Color('#efe6d4'), new THREE.Color('#8a7a5e'), Math.pow(-y, 0.7)); cols.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  sc.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const box = (w, h, p, c, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); sc.add(m); };
  box(18, 10, [14, 22, 16], '#fff6e8', 9); box(12, 14, [-24, 8, 6], '#dbe7ff', 5); box(24, 6, [0, 10, -26], '#ffffff', 4); box(10, 10, [0, -20, 14], '#ffe7c4', 1.2);
  const pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(sc, 0.03).texture; pm.dispose(); geo.dispose();
  return tex;
}

// ------------------------------------------------------------------ viewer: renderer, camera, orbit controls, loop
export class Viewer {
  constructor(host, { fov = 32, pos = [0, 0.6, 9.5], target = [0, 0.3, 0], maxDist = 22, minDist = 2.2, groundY = -3.4 } = {}) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); this.renderer.setClearColor(0xffffff, 1);
    this.renderer.localClippingEnabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.environment = makeEnv(this.renderer); this.scene.environmentIntensity = 0.85;
    this.camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.3, 140); this.camera.position.set(...pos);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...target); this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
    this.controls.minDistance = minDist; this.controls.maxDistance = maxDist; this.controls.enablePan = false;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb9a98e, 0.35));
    const sun = new THREE.DirectionalLight(0xfff3e0, 2.2); sun.position.set(4, 9, 7); sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536); const sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 30; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xbcd2ff, 0.9); rim.position.set(-6, 3, -6); this.scene.add(rim);
    // a ground that only catches the shadow
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16 })); this.ground.rotation.x = -Math.PI / 2; this.ground.position.y = groundY; this.ground.receiveShadow = true; this.ground.visible = false; this.scene.add(this.ground);
    this.tick = null; this.visible = false; this.last = 0; this.tween = null;
    new ResizeObserver(() => this.resize()).observe(host);
    new IntersectionObserver((e) => { this.visible = e[e.length - 1].isIntersecting; if (this.visible) { this.last = performance.now(); this.loop(); } }).observe(host);
    this.resize();
  }
  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.w = w; this.h = h; this.dirty = true;
  }
  goTo(pos, target, ms = 800) {
    this.tween = { t0: performance.now(), ms, p0: this.camera.position.clone(), q0: this.controls.target.clone(), p1: new THREE.Vector3(...pos), q1: new THREE.Vector3(...target) };
  }
  project(v) { const p = v.clone().project(this.camera); return [(p.x * 0.5 + 0.5) * this.w, (-p.y * 0.5 + 0.5) * this.h, p.z]; }
  loop = () => {
    if (!this.visible) return;
    const now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    if (this.tween) {
      const k = Math.min(1, (now - this.tween.t0) / this.tween.ms), e = k * k * (3 - 2 * k);
      this.camera.position.lerpVectors(this.tween.p0, this.tween.p1, e); this.controls.target.lerpVectors(this.tween.q0, this.tween.q1, e); if (k >= 1) this.tween = null;
    }
    this.controls.update();
    if (this.tick) this.tick(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  };
}
export const webgl = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } };
