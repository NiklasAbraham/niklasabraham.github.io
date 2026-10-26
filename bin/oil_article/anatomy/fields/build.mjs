// Fig: three ways oil comes out of the ground, cut open side by side on one depth scale.
// A Saudi onshore giant (Ghawar), a North Sea fixed platform (Johan Sverdrup) and a Permian shale well, as three
// geology block models on one plinth. Light only (site look). node build.mjs [--audit]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/niklas/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/niklas/.claude/skills/anatomy/kit/lathe.mjs";
import * as A from "/home/niklas/.claude/skills/anatomy/kit/audit.mjs";
import { tubePieces, tubeSvg } from "/home/niklas/.claude/skills/anatomy/kit/tube.mjs";
import { kitScript } from "/home/niklas/.claude/skills/anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "..", "..", "assets", "oil-article", "anatomy");
const SITE_LIGHT = readFileSync(join(OUT, "refinery-light.html"), "utf8").match(/<style id="oil-site-light">[\s\S]*?<\/style>/)[0];

const W = 600;
const AZIMUTH = 64;
const ELEVATION = 27;

// ---------- world layout ----------
// x across the sections, y into the page (front face at y = FRONT), z up; block tops at z = 0 (sea level / ground).
const FRONT = 40;
const ZB = M.zOf(M.BOTTOM_KM * 1000); // block bottoms
const BLOCKS = {
  ghawar: { x0: 0, x1: 64 },
  sverdrup: { x0: 80, x1: 144 },
  permian: { x0: 160, x1: 252 },
};
const SEA = M.zOf(115); // seabed under Sverdrup (115 m of water, Sodir)
const PLINTH = { x: -16, y: -7, w: 284, d: 55, r: 5 };
const PLINTH_H = 9;

// a camera fitted to the plinth and the tallest parts
const extremes = [...k.boxCorners(PLINTH, ZB - PLINTH_H - 4, 0), [6, 6, 24], [106, 32, 25], [240, 20, 8]];
const unit = k.fitProjection(extremes, W, 1000, { pad: 0, azimuth: AZIMUTH, elevation: ELEVATION });
const flat = extremes.map((p) => k.iso(p, unit));
const ratio = (Math.max(...flat.map((p) => p[1])) - Math.min(...flat.map((p) => p[1]))) / (Math.max(...flat.map((p) => p[0])) - Math.min(...flat.map((p) => p[0])));
const PAD = 12;
const HT = Math.round((W - 2 * PAD) * ratio + 2 * PAD);
const P = k.fitProjection(extremes, W, HT, { pad: PAD, azimuth: AZIMUTH, elevation: ELEVATION });
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const path3 = (pts, closed = false) => k.pathOf(pts.map(at), closed);
const f1 = (v) => (Math.round(v * 10) / 10).toString();

// ---------- recorder and helpers (shapes recorded as drawn, keys settled from geometry) ----------
const R_ = A.recorder(P);
const record = R_.solid;
let FIELD = "";
let LAYER = "post"; // "pre": under water or left of it, drawn before the sea; "post": after it
function put(name, ref, svg, shapes = [], { bias = 0, ...rest } = {}) {
  for (const sh of shapes) if (!R_.solids.includes(sh) && sh.kind !== "tube") R_.solids.push(Object.assign(sh, sh.name ? {} : { name }));
  return R_.put({ name, at: ref, bias, svg, shapes: shapes.map((s) => (s.name ? s : Object.assign(s, { name }))), piece: "site", field: FIELD, layer: LAYER, ...rest });
}
const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 0.2, steps = 2, bevel = 0.2, extra = "", inner = "", bias = 0, owner, cls } = {}) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
  const shape = record(A.slab(plan, z0, z1 - z0, { name, owner }, steps));
  put(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", className: cls, ...style, inner }) + extra, [shape], { bias });
  return shape;
}
function cyl(name, cx, cy, r, z0, h, style = {}, { extra = "", inner = "", bias = 0, owner, steps = 28 } = {}) {
  const shape = record(A.cylinder(cx, cy, r, z0, h, { name, owner }));
  put(name, [cx, cy, z0 + h / 2], S(k.cylinder(cx, cy, r, z0, h, P, steps), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
function prismItem(name, F, poly, s0, s1, style = {}, { extra = "", inner = "", bias = 0, owner } = {}) {
  const shape = record(A.prism(F, poly, s0, s1, { name, owner }));
  const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
  const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const centre = G.add3(G.add3(G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), G.mul3(F.u, cx)), G.mul3(F.v, cy));
  put(name, centre, S(G.prismOf(F, poly, s0, s1, P), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, owner, smooth } = {}) {
  const paths = G.solidOf(profile, F, P, smooth !== undefined ? { smooth } : {});
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name, owner }));
  put(name, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
function ballItem(name, c, r, style = {}, { owner, bias = 0 } = {}) {
  const shape = record(A.ball(c, r, { name, owner }));
  put(name, c, S(G.sphereOf(c, r, P, { steps: 32 }), { tone: "mid", ...style }), [shape], { bias });
  return shape;
}
function tubeItems(name, route, r, { tone = "mid", gaps = [], maxLength = 10, ends = [true, true], touch, caps = true, cls } = {}) {
  R_.route(name, route, r, { gaps, ends, touch, piece: "site" });
  tubePieces(route, r, P, { maxLength, spacing: Math.max(0.5, Math.min(1.4, r * 0.6)), gaps, caps }).forEach((piece, index) => {
    const svg = tubeSvg(piece, { tone });
    put(`${name}:${index}`, piece.mid, cls ? `<g class="${cls}">${svg}</g>` : svg, [A.tube(piece.points, piece.radii, { name: `${name}:${index}`, owner: name })], { route: name, chunk: index });
  });
}
function pipe(name, control, r, opts = {}) {
  const line = G.fillet(control, Math.max(r * 2.6, 1.2), 10, { P, tube: r });
  tubeItems(name, line, r, opts);
  return line;
}
// a horizontal pressure vessel with 2:1 elliptical heads, along axis `dir`, on two saddles
function vessel(name, c, dir, L, r, { saddles = true, tone = "hi", inner } = {}) {
  const F = G.frameAlong(c, dir);
  const h = r * 0.5;
  const left = Array.from({ length: 9 }, (_, i) => {
    const t = (i / 8) * (Math.PI / 2);
    return [-L / 2 + h * (1 - Math.cos(t)), Math.max(0.02, r * Math.sin(t)), i < 8 ? 1 : 0];
  });
  const right = left.slice().reverse().map(([s, rr], i) => [-s, rr, i > 0 ? 1 : 0]);
  const profile = [...left, ...right];
  turned(name, F, profile, { tone }, { inner: inner ?? Ln(G.arcOf(F, -L / 2 + h, r, P), { tone: "faint" }) + Ln(G.arcOf(F, L / 2 - h, r, P), { tone: "faint" }) });
  if (saddles) {
    const side = G.unit3(G.cross3([0, 0, 1], dir));
    for (const s of [-L * 0.3, L * 0.3]) {
      const p = G.add3(c, G.mul3(dir, s));
      const SF = G.frameOf([p[0], p[1], 0], [0, 0, 1], dir, side);
      prismItem(`${name}.saddle${s > 0 ? "R" : "L"}`, SF, rect(-0.5, 0.5, -r * 0.7, r * 0.7), BASEZ, c[2] - r * 0.92, { tone: "mid" });
    }
  }
  return F;
}
let BASEZ = 0; // the floor the current group stands on

// ---------- geology (world z from metres; the front face is the cut) ----------
const zOf = M.zOf;
// lithology fills (light, neutral); fluids carry the colour
const LITH = {
  sand: { fill: "#f3f0e9", pat: "dots" },
  clay: { fill: "#eceae4", pat: "dash" },
  limestone: { fill: "#eef0ee", pat: "brick" },
  marl: { fill: "#ebebe7", pat: "brickdash" },
  anhydrite: { fill: "#f7f7f6", pat: "hatch" },
  salt: { fill: "#f6f6f6", pat: "cross" },
  shale: { fill: "#e6e6e3", pat: "dash" },
  sandstone: { fill: "#f2eee5", pat: "dots" },
  siltstone: { fill: "#e9e8e3", pat: "dashdot" },
  basement: { fill: "#e2e2e0", pat: "vee" },
  chalk: { fill: "#f4f4f2", pat: "brick" },
};
const archGh = (x, amp) => {
  const t = Math.min(1, Math.abs(x - 32) / 32);
  return (amp * (1 - Math.cos(Math.PI * t))) / 2;
};
const archSv = (x, amp) => {
  const t = Math.min(1, Math.abs(x - 112) / 32);
  return (amp * (1 - Math.cos(Math.PI * t))) / 2 + (x - 112) * 0.6; // a low dome, tilted gently to the west
};
// layer tops in metres below datum as functions of x; the last layer runs to the bottom of the block
const GEO = {
  ghawar: [
    { name: "Sand and gravel", lith: "sand", top: () => 0 },
    { name: "Eocene limestone", lith: "limestone", top: (x) => 260 + archGh(x, 40) },
    { name: "Cretaceous shale and marl", lith: "marl", top: (x) => 720 + archGh(x, 150) },
    { name: "Lower Cretaceous limestone", lith: "limestone", top: (x) => 1180 + archGh(x, 260) },
    { name: "Anhydrite seal", lith: "anhydrite", top: (x) => 1800 + archGh(x, 430) },
    { name: "Arab-D limestone", lith: "limestone", top: (x) => M.FIELDS[0].top_m + archGh(x, 450), res: true },
    { name: "Hanifa limestone (source rock)", lith: "marl", top: (x) => M.FIELDS[0].top_m + M.FIELDS[0].pay_m + archGh(x, 450) },
  ],
  sverdrup: [
    { name: "Clay and sand", lith: "clay", top: () => 115 },
    { name: "Mudstone", lith: "shale", top: (x) => 900 + archSv(x, 20) * 0.5 },
    { name: "Chalk and marl", lith: "chalk", top: (x) => 1380 + archSv(x, 50) * 0.8 },
    { name: "Draupne shale seal", lith: "shale", top: (x) => 1830 + archSv(x, 90) },
    { name: "Draupne sandstone", lith: "sandstone", top: (x) => M.FIELDS[1].top_m + archSv(x, 90), res: true },
    { name: "Older sandstone", lith: "sandstone", top: (x) => M.FIELDS[1].top_m + M.FIELDS[1].pay_m + archSv(x, 90) },
    { name: "Basement", lith: "basement", top: (x) => 2420 + archSv(x, 140) },
  ],
  permian: [
    { name: "Red beds", lith: "sand", top: () => 0 },
    { name: "Salt and anhydrite", lith: "salt", top: (x) => 320 + (x - 160) * 0.3 },
    { name: "San Andres limestone", lith: "limestone", top: (x) => 1050 + (x - 160) * 0.5 },
    { name: "Clear Fork shale", lith: "shale", top: (x) => 1500 + (x - 160) * 0.6 },
    { name: "Spraberry siltstone", lith: "siltstone", top: (x) => 2050 + (x - 160) * 0.7 },
    { name: "Wolfcamp mudstone", lith: "shale", top: (x) => 2600 + (x - 160) * 0.7, res: true },
    { name: "Older limestone", lith: "limestone", top: (x) => 3120 + (x - 160) * 0.7 },
  ],
};
// fluids: oil-water contact (m) for the conventional reservoirs; Ghawar's rises over the loop (live)
const OWC = { ghawar: M.FIELDS[0].top_m + 330, sverdrup: 1985 };
const OWC_RISE = 90; // metres the Ghawar water front climbs over one loop (schematic)

// a face of a block in its plane: front (y = FRONT, u = x) or side (x = x1, u = y)
const fpt = (x, m) => [x, FRONT, zOf(m)];
const spt = (x1, y, m) => [x1, y, zOf(m)];
const samplesOf = (x0, x1, n = 64) => Array.from({ length: n + 1 }, (_, i) => x0 + ((x1 - x0) * i) / n);

// lithology patterns in each face plane (patternTransform = the face's affine map; units are world units)
function faceMatrix(face) {
  const o = at([0, 0, 0]);
  const X = G.sub3(at([1, 0, 0]).concat(0), o.concat(0));
  const Y = G.sub3(at([0, 1, 0]).concat(0), o.concat(0));
  const Z = G.sub3(at([0, 0, 1]).concat(0), o.concat(0));
  const [u, off] = face === "front" ? [X, G.mul3(Y, FRONT)] : [Y, [0, 0, 0]];
  return `matrix(${[u[0], u[1], -Z[0], -Z[1], o[0] + off[0], o[1] + off[1]].map((v) => v.toFixed(4)).join(" ")})`;
}
function patternDefs() {
  const tiles = {
    dots: { w: 3, h: 1.6, d: `M0.8 0.45h0.01M2.3 1.25h0.01`, dot: true },
    dash: { w: 5, h: 1.4, d: `M0.4 0.4H2.8M3.0 1.1H4.7` },
    brick: { w: 5, h: 2.4, d: `M0 0.01H5M0 1.2H5M1.2 0V1.2M3.7 1.2V2.4` },
    brickdash: { w: 5, h: 2.4, d: `M0 0.01H5M1.2 0V1.2M0.6 1.8H3.2` },
    hatch: { w: 2.6, h: 2.6, d: `M0 2.6L2.6 0M-0.65 0.65L0.65 -0.65M1.95 3.25L3.25 1.95` },
    cross: { w: 3.2, h: 2.4, d: `M1.2 0.7V1.5M0.8 1.1H1.6M2.8 1.9V2.5M2.5 2.2H3.1` },
    dashdot: { w: 5, h: 1.6, d: `M0.4 0.45H2.6M3.6 0.45h0.01M1.4 1.2h0.01M2.4 1.2H4.6`, dot: true },
    vee: { w: 4, h: 3, d: `M0.6 0.6L1.1 1.4L1.6 0.6M2.6 2.0L3.1 2.8L3.6 2.0` },
  };
  const out = [];
  for (const face of ["front", "side"]) {
    for (const [name, t] of Object.entries(tiles)) {
      out.push(`<pattern id="fd-${name}-${face}" patternUnits="userSpaceOnUse" width="${t.w}" height="${t.h}" patternTransform="${faceMatrix(face)}"><path class="fd-pat${t.dot ? " fd-patdot" : ""}" d="${t.d}"/></pattern>`);
    }
  }
  return `<defs>${out.join("")}</defs>`;
}

// polygons of one layer on the front and side faces
function layerPolys(id, i) {
  const { x0, x1 } = BLOCKS[id];
  const L = GEO[id];
  const top = L[i].top;
  const bot = i + 1 < L.length ? L[i + 1].top : () => M.BOTTOM_KM * 1000;
  const xs = samplesOf(x0, x1);
  const front = [...xs.map((x) => fpt(x, top(x))), ...xs.slice().reverse().map((x) => fpt(x, bot(x)))];
  const side = [spt(x1, FRONT, top(x1)), spt(x1, 0, top(x1)), spt(x1, 0, bot(x1)), spt(x1, FRONT, bot(x1))];
  return { front, side, top, bot };
}
const clipBelow = (poly, zc) => {
  // Sutherland-Hodgman against z <= zc (world z)
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ia = a[2] <= zc;
    const ib = b[2] <= zc;
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = (zc - a[2]) / (b[2] - a[2]);
      out.push(G.lerp3(a, b, t));
    }
  }
  return out;
};

// a well drawn in the cut: a steel ribbon along a polyline in the front plane (x, metres), filleted
function wellPath(pts) {
  // pts: [[x, m], ...] -> world polyline on the front face, corners rounded
  const world = pts.map(([x, m]) => fpt(x, m));
  return G.fillet(world, 3.2, 12);
}
function ribbon(line, half) {
  // offset a polyline in the front plane (x, z) by +-half, rounded toe
  const left = [];
  const right = [];
  for (let i = 0; i < line.length; i++) {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dz = b[2] - a[2];
    const l = Math.hypot(dx, dz) || 1;
    const nx = -dz / l;
    const nz = dx / l;
    left.push([line[i][0] + nx * half, FRONT, line[i][2] + nz * half]);
    right.push([line[i][0] - nx * half, FRONT, line[i][2] - nz * half]);
  }
  // round toe: a half circle around the last point
  const e = line[line.length - 1];
  const p = line[line.length - 2];
  const dir = Math.atan2(e[2] - p[2], e[0] - p[0]);
  const toe = Array.from({ length: 9 }, (_, i) => {
    const a = dir + Math.PI / 2 - (i / 8) * Math.PI;
    return [e[0] + Math.cos(a) * half, FRONT, e[2] + Math.sin(a) * half];
  });
  return [...left, ...toe, ...right.reverse()];
}
const polyD = (pts) => path3(pts, true);

// ---------- the plinth (static, behind everything) ----------
const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(PLINTH, ZB - PLINTH_H - 4, PLINTH_H, P)}"/>`);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const FEET = [...k.corners(PLINTH, 16), [PLINTH.x + PLINTH.w / 2, PLINTH.y + 16], [PLINTH.x + PLINTH.w / 2, PLINTH.y + PLINTH.d - 16]];
for (const [x, y] of byDepth(FEET)) {
  back.push(S(k.cylinder(x, y, 6, ZB - PLINTH_H - 4, 1.4, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 4.6, ZB - PLINTH_H - 2.6, 2.6, P, 28), { tone: "mid" }));
}
// name plates on the front face of the plinth, one under each block
const plates = [];
for (const f of M.FIELDS) {
  const { x0, x1 } = BLOCKS[f.id];
  const cx = (x0 + x1) / 2;
  const w = Math.min(54, x1 - x0 - 10);
  const pz0 = ZB - PLINTH_H + 2;
  const pz1 = ZB - 2;
  const y = PLINTH.y + PLINTH.d;
  const quad = [[cx - w / 2, y + 0.01, pz0], [cx + w / 2, y + 0.01, pz0], [cx + w / 2, y + 0.01, pz1], [cx - w / 2, y + 0.01, pz1]];
  plates.push(`<path class="fd-plate" d="${path3(quad, true)}"/>`);
  plates.push(Ln(path3(quad, true), { tone: "lo" }));
  plates.push(Dots([at([cx - w / 2 + 1.4, y, (pz0 + pz1) / 2]), at([cx + w / 2 - 1.4, y, (pz0 + pz1) / 2])], { size: 0.45 }));
  plates.push(k.faceTextSvg(k.sideMatrix([cx, y + 0.02], pz0 + 1.45, P, "left"), f.plinth, { size: 2.6, tone: "mid", anchor: "middle" }));
}
back.push(S(k.slabOf(PLINTH, ZB - PLINTH_H, PLINTH_H, P, 8, 1.2), { tone: "mid", inner: Ln(k.sideSeam(PLINTH, ZB - PLINTH_H + 1.2, P, 8), { tone: "faint" }) + plates.join("") }));
back.push(Ln(k.planOutline(k.insetPlan(PLINTH, 3.5), ZB, P), { tone: "faint" }));
back.push(Ln(k.corners(PLINTH, 7).map(([x, y]) => k.ring(x, y, 1.6, ZB, P, 16)).join(""), { tone: "lo" }));
back.push(Dots(k.corners(PLINTH, 7).map(([x, y]) => at([x, y, ZB])), { size: 0.45 }));
record(A.slab(PLINTH, ZB - PLINTH_H, PLINTH_H, { name: "stand.plinth", ground: true }, 8));

// ---------- depth ruler: a post on the plinth, left of the first block, ticks every 100 m, a major every km ----------
{
  FIELD = "";
  LAYER = "pre";
  const RX = -13.2;
  const RW = 3;
  const plan = { x: RX, y: FRONT - 3, w: RW, d: 3, r: 0.2 };
  const minor = [];
  const major = [];
  const texts = [];
  for (let m = 0; m <= M.BOTTOM_KM * 1000 + 1; m += 100) {
    const z = zOf(m);
    const len = m % 1000 === 0 ? 2.2 : m % 500 === 0 ? 1.5 : 0.9;
    (m % 500 === 0 ? major : minor).push(k.segment([RX + RW - 0.35, FRONT, z], [RX + RW - 0.35 - len, FRONT, z], P));
    if (m % 1000 === 0) texts.push(k.faceTextSvg(k.sideMatrix([RX + 0.25, FRONT + 0.02], z + (m === 0 ? -2.6 : 1.2), P, "left"), m === 0 ? "0" : `${m / 1000} km`, { size: 2.1, tone: "mid" }));
  }
  major.push(k.segment([RX + RW - 0.35, FRONT, ZB + 1.2], [RX + RW - 0.35, FRONT, 2], P));
  const shape = record(A.slab(plan, ZB + 1.2, -ZB + 0.8, { name: "ruler" }, 2));
  put("ruler", [RX + RW / 2, FRONT - 1.5, ZB / 2], S(k.slabOf(plan, ZB + 1.2, -ZB + 0.8, P, 2, 0.2), { tone: "mid", inner: Ln(minor.join(""), { tone: "lo" }) + Ln(major.join(""), { tone: "hi" }) + texts.join("") }), [shape]);
  box("ruler.foot", [RX - 1.6, FRONT - 4.6, ZB], [RX + RW + 1.6, FRONT + 0.0, ZB + 1.2], { tone: "lo" });
}

// ---------- the three blocks with their cuts ----------
const BLOCK_SVG = {};
function blockSvg(id) {
  const { x0, x1 } = BLOCKS[id];
  const ztop = id === "sverdrup" ? SEA : 0;
  const L = GEO[id];
  const fills = [];
  const fluids = [];
  const pats = [];
  const lines = [];
  const frontLines = [];
  for (let i = 0; i < L.length; i++) {
    const { front, side, top } = layerPolys(id, i);
    const lith = LITH[L[i].lith];
    fills.push(`<path fill="${lith.fill}" d="${polyD(front)}"/><path fill="${lith.fill}" d="${polyD(side)}"/>`);
    pats.push(`<path fill="url(#fd-${lith.pat}-front)" d="${polyD(front)}"/><path fill="url(#fd-${lith.pat}-side)" d="${polyD(side)}"/>`);
    if (i > 0 || id === "sverdrup") {
      const xs = samplesOf(x0, x1);
      frontLines.push(path3(xs.map((x) => fpt(x, top(x)))));
      lines.push(path3([spt(x1, FRONT, top(x1)), spt(x1, 0, top(x1))]));
    }
    if (L[i].res) {
      // fluids in the reservoir layer
      if (id === "permian") {
        fluids.push(`<path class="fd-shaleoil" d="${polyD(front)}"/><path class="fd-shaleoil" d="${polyD(side)}"/>`);
      } else {
        fluids.push(`<path class="fd-oil" d="${polyD(front)}"/><path class="fd-oil" d="${polyD(side)}"/>`);
        // water below the oil-water contact: the same polygon clipped below the contact; the clip moves (Ghawar)
        const zc = zOf(OWC[id]);
        const wf = clipBelow(front, zc);
        const ws = clipBelow(side, zc);
        const clipQuad = [[x0 - 1, FRONT + 0.5, zc], [x1 + 1, FRONT + 0.5, zc], [x1 + 1, FRONT + 0.5, ZB - 40], [x0 - 1, FRONT + 0.5, ZB - 40]];
        const clipSide = [[x1, FRONT + 1, zc], [x1, -1, zc], [x1, -1, ZB - 40], [x1, FRONT + 1, ZB - 40]];
        if (id === "ghawar") {
          fluids.push(`<clipPath id="fd-owc-${id}"><path data-part="owc-${id}" d="${path3(clipQuad, true)}${path3(clipSide, true)}"/></clipPath>` +
            `<g class="fd-waterzone" data-part="water-${id}" clip-path="url(#fd-owc-${id})"><path class="fd-water" d="${polyD(front)}"/><path class="fd-water" d="${polyD(side)}"/></g>`);
        } else {
          fluids.push(`<path class="fd-water" d="${polyD(wf)}"/>${ws.length > 2 ? `<path class="fd-water" d="${polyD(ws)}"/>` : ""}`);
        }
      }
    }
  }
  // side face in shade: one translucent layer over the whole side
  const sideAll = [[x1, FRONT, ztop], [x1, 0, ztop], [x1, 0, ZB], [x1, FRONT, ZB]];
  const shade = `<path class="fd-sideshade" d="${path3(sideAll, true)}"/>`;
  // top face
  const topQuad = [[x0, 0, ztop], [x1, 0, ztop], [x1, FRONT, ztop], [x0, FRONT, ztop]];
  const topCls = id === "ghawar" ? "fd-top-sand" : id === "sverdrup" ? "fd-top-seabed" : "fd-top-scrub";
  let topTex = "";
  if (id === "ghawar") {
    // dune ripples: wavy lines across the top, edge to edge
    const rip = [];
    for (let j = 0; j < 9; j++) {
      const y0 = 3 + j * 4.2;
      rip.push(path3(samplesOf(x0, x1, 40).map((x) => [x, Math.max(0.2, Math.min(FRONT - 0.2, y0 + 0.9 * Math.sin((x + j * 7) / 3.1))), 0])));
    }
    topTex = Ln(rip.join(""), { tone: "faint" });
  } else if (id === "sverdrup") {
    const rip = [];
    for (let j = 0; j < 6; j++) {
      const y0 = 4 + j * 6.4;
      rip.push(path3(samplesOf(x0, x1, 40).map((x) => [x, Math.max(0.2, Math.min(FRONT - 0.2, y0 + 0.5 * Math.sin((x + j * 5) / 2.2))), SEA])));
    }
    topTex = Ln(rip.join(""), { tone: "faint" });
  } else {
    // scrub: a scatter of small dots (mesquite), kept off the pad
    const pts = [];
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let j = 0; j < 140; j++) {
      const x = x0 + 1 + rnd() * (x1 - x0 - 2);
      const y = 1 + rnd() * (FRONT - 2);
      if (x > 156 && x < 211 && y > 8.5 && y < 40) continue;
      if (x > 216 && x < 247 && y > 4 && y < 22) continue;
      pts.push(at([x, y, 0]));
    }
    topTex = Dots(pts, { size: 0.55, tone: "lo" });
  }
  const topSvg = `<path class="${topCls}" d="${path3(topQuad, true)}"/>${topTex}`;
  // edges between the faces (the slab's own creases are painted over by the cut)
  const edges = Ln(path3([[x1, FRONT, ZB], [x1, FRONT, ztop]]) + path3([[x0, FRONT, ztop], [x1, FRONT, ztop]]) + path3([[x1, FRONT, ztop], [x1, 0, ztop]]), { tone: "mid" });
  const strata = Ln(frontLines.join("") + lines.join(""), { tone: "lo" });
  return { base: fills.join("") + fluids.join("") + pats.join("") + shade + strata + topSvg, edges };
}

// wells in the cut
const WELLS = {}; // id -> [{ d (ribbon), flow (centre path), kind }]
function well(id, name, pts, { kind = "prod", half = 0.55, from = 0 } = {}) {
  const line = wellPath(pts);
  const flow = kind === "inj" ? line : line.slice().reverse();
  (WELLS[id] ??= []).push({ name, kind, ribbon: polyD(ribbon(line, half)), flow: path3(flow), line, toe: line[line.length - 1] });
  return line;
}
// Ghawar: MRC producer on the crest with two of its 3-4 laterals in the Arab-D; injectors on both flanks below the oil
{
  const top = GEO.ghawar[5].top;
  const mid = (x) => top(x) + M.FIELDS[0].pay_m * 0.5;
  well("ghawar", "producer", [[32, 0], [32, mid(32)], [44, mid(44)]].map(([x, m], i) => (i === 2 ? [x, mid(x)] : [x, m])));
  // second lateral: from a junction a little above the first, sweeping the other way
  WELLS.ghawar.push((() => {
    const line = G.fillet([fpt(32, mid(32) - 70), fpt(31, mid(31)), ...samplesOf(31, 20, 6).slice(1).map((x) => fpt(x, mid(x)))], 3.2, 12);
    return { name: "lateral", kind: "prod", ribbon: polyD(ribbon(line, 0.5)), flow: path3(line.slice().reverse()), line, toe: line[line.length - 1] };
  })());
  // the first lateral follows the layer down the flank
  WELLS.ghawar[0] = (() => {
    const line = G.fillet([fpt(32, 0), fpt(32, mid(32) - 10), ...samplesOf(33, 44, 6).map((x) => fpt(x, mid(x)))], 3.2, 12);
    return { name: "producer", kind: "prod", ribbon: polyD(ribbon(line, 0.55)), flow: path3(line.slice().reverse()), line, toe: line[line.length - 1] };
  })();
  for (const x of [5, 59]) well("ghawar", `injector${x}`, [[x, 0], [x, top(x) + M.FIELDS[0].pay_m * 0.7]], { kind: "inj", half: 0.45 });
}
// Sverdrup: wells from the drilling platform, deviated into the sandstone; an injector on the western flank
const DP = { x0: 102, x1: 116, y0: 26, y1: 39.4, deck: 3.6 };
{
  const top = GEO.sverdrup[4].top;
  const mid = (x) => top(x) + M.FIELDS[1].pay_m * 0.5;
  const slot = (i) => 105 + i * 1.6;
  const dev = (i, xt) => well("sverdrup", `well${i}`, [[slot(i), 115], [slot(i), 520], [xt - Math.sign(xt - slot(i)) * 8, mid(xt) - 30], [xt, mid(xt)]], { half: 0.5 });
  dev(0, 88);
  dev(1, 98);
  dev(2, 124);
  dev(3, 134);
  const inj = well("sverdrup", "injector", [[slot(4), 115], [slot(4), 600], [138, top(140) + M.FIELDS[1].pay_m * 0.8 - 40], [141, top(141) + M.FIELDS[1].pay_m * 0.8]], { kind: "inj", half: 0.45 });
}
// Permian: vertical, a curve of ~300 m radius, then 3.3 km of lateral in the Wolfcamp at ~2.9 km
const LAT = { x0: 166, m: M.FIELDS[2].target_m, len: M.xOf(M.FIELDS[2].lateral_m) };
{
  const kop = LAT.m - 300;
  const line = [];
  for (let i = 0; i <= 10; i++) line.push(fpt(LAT.x0, (kop * i) / 10));
  for (let i = 1; i <= 16; i++) {
    const t = (i / 16) * (Math.PI / 2);
    line.push(fpt(LAT.x0 + M.xOf(300 * (1 - Math.cos(t))), kop + 300 * Math.sin(t)));
  }
  const xh = LAT.x0 + M.xOf(300);
  for (let i = 1; i <= 24; i++) line.push(fpt(xh + (LAT.len * i) / 24, LAT.m));
  LAT.heel = xh;
  LAT.toe = xh + LAT.len;
  WELLS.permian = [{ name: "lateral", kind: "prod", ribbon: polyD(ribbon(line, 0.55)), flow: path3(line.slice().reverse()), line, toe: line[line.length - 1] }];
}
// frac stages along the lateral: thin vertical lenses (transverse fractures seen edge-on), toe first
const FRACS = [];
{
  const n = M.FIELDS[2].stagesDrawn;
  for (let i = 0; i < n; i++) {
    const x = LAT.toe - 1.6 - ((LAT.toe - LAT.heel - 3.2) * i) / (n - 1);
    const z = zOf(LAT.m);
    const hz = 3.4 + 0.5 * Math.sin(i * 1.7);
    const hw = 0.55;
    const lens = Array.from({ length: 20 }, (_, j) => {
      const a = (j / 20) * Math.PI * 2;
      return [x + hw * Math.cos(a) * (1 - 0.25 * Math.abs(Math.sin(a))), FRONT, z + hz * Math.sin(a)];
    });
    const c = at([x, FRONT, z]);
    FRACS.push(`<path class="fd-frac" style="--i:${i};transform-origin:${f1(c[0])}px ${f1(c[1])}px" d="${polyD(lens)}"/>`);
  }
}
// flow in the rock toward the wells (dashed, animated), drawn in the cut
const FLOWS = { ghawar: [], sverdrup: [], permian: [] };
{
  const top = GEO.ghawar[5].top;
  const pay = M.FIELDS[0].pay_m;
  const oilLine = (xa, xb) => path3(samplesOf(xa, xb, 16).map((x) => fpt(x, top(x) + pay * 0.32)));
  FLOWS.ghawar.push(`<path class="fd-flow fd-flow-oil" data-free="" d="${oilLine(17, 30.4)}"/>`, `<path class="fd-flow fd-flow-oil" data-free="" d="${oilLine(50, 45.6)}"/>`);
  const wl = (xa, xb) => path3(samplesOf(xa, xb, 12).map((x) => fpt(x, top(x) + pay * 0.78)));
  FLOWS.ghawar.push(`<path class="fd-flow fd-flow-water" data-free="" d="${wl(5.6, 15)}"/>`, `<path class="fd-flow fd-flow-water" data-free="" d="${wl(58.4, 49)}"/>`);
  const ts = GEO.sverdrup[4].top;
  const pays = M.FIELDS[1].pay_m;
  const sl = (xa, xb, f) => path3(samplesOf(xa, xb, 10).map((x) => fpt(x, ts(x) + pays * f)));
  for (const [xa, xb] of [[81.5, 87], [92.5, 89], [93, 97.4], [104, 98.8], [118, 123.4], [129.5, 124.8], [128.5, 133.4]]) FLOWS.sverdrup.push(`<path class="fd-flow fd-flow-oil" data-free="" d="${sl(xa, xb, 0.42)}"/>`);
  FLOWS.sverdrup.push(`<path class="fd-flow fd-flow-water" data-free="" d="${sl(141.4, 136, 0.86)}"/>`);
}

// ---------- surface plant (enlarged, not to scale) ----------
// Ghawar: crest wellhead, flank injectors, a gas-oil separation plant (GOSP) and its flare
function tree(name, x, y, { tall = 1, wing = -1, cap = true } = {}) {
  box(`${name}.cellar`, [x - 2.6, y - 2.4, 0], [x + 2.6, Math.min(FRONT, y + 2.4), 0.45], { tone: "lo" });
  cyl(`${name}.flange`, x, y, 1.0, 0.45, 0.6, { tone: "mid" });
  box(`${name}.master`, [x - 0.75, y - 0.75, 1.05], [x + 0.75, y + 0.75, 2.6 * tall], { tone: "mid" });
  cyl(`${name}.swab`, x, y, 0.62, 2.6 * tall, 1.3, { tone: "mid" });
  if (cap) cyl(`${name}.cap`, x, y, 0.85, 2.6 * tall + 1.3, 0.5, { tone: "hi" });
  // wing valve and its handwheel stem
  const dir = Array.isArray(wing) ? wing : [0, wing, 0];
  const WF = G.frameAlong([x, y, 1.9 * tall], dir);
  turned(`${name}.wing`, WF, [[0.74, 0.42], [2.2, 0.42], [2.2, 0.62], [2.6, 0.62]], { tone: "mid" });
  return [x + dir[0] * 2.6, y + dir[1] * 2.6, 1.9 * tall];
}
{
  FIELD = "ghawar";
  LAYER = "pre";
  BASEZ = 0;
  const out = tree("gh.prod", 32, 37.2, { tall: 1.25 });
  // flowline from the wing to the GOSP inlet, on two sleepers
  box("gh.sleeper1", [30.6, 28.4, 0], [33.4, 29.4, 0.9], { tone: "lo" });
  pipe("gh.flowline", [out, [32, out[1] - 2.4, out[2]], [32, out[1] - 3.6, 1.35], [32, 21.6, 1.35], [32, 20.9, 1.35]], 0.42, { touch: ["gh.sleeper*"] });
  for (const x of [5, 59]) {
    const sx = x < 32 ? 1 : -1;
    const o = tree(`gh.inj${x}`, x, 37.2, { tall: 0.9, wing: [sx, 0, 0] });
    pipe(`gh.injline${x}`, [o, [o[0] + sx * 2.2, o[1], o[2]], [o[0] + sx * 2.2, o[1], 0.0]], 0.36, {});
  }
  // GOSP pad
  box("gh.pad", [20, 6, 0], [58, 21, 0.5], { tone: "lo" }, { inner: "" });
  BASEZ = 0.5;
  vessel("gh.hpsep", [31, 17.4, 3.1], [1, 0, 0], 13, 1.9);
  vessel("gh.lpsep", [31, 11.0, 2.7], [1, 0, 0], 11, 1.5);
  // inlet manifold block where the flowline lands
  box("gh.inlet", [30.6, 19.6, 0.5], [33.4, 20.9, 2.2], { tone: "mid" });
  // stabiliser column with a dome top and a skirt
  {
    const F = G.frameAlong([47, 15, 0], [0, 0, 1]);
    turned("gh.column.skirt", F, [[0.5, 2.0], [2.2, 2.0]], { tone: "mid" });
    const dome = Array.from({ length: 8 }, (_, i) => {
      const t = ((i + 1) / 8) * (Math.PI / 2);
      return [15.6 + 0.9 * Math.sin(t), 1.7 * Math.cos(t) + 1e-3, i < 7 ? 1 : 0];
    });
    const cuts = [[2.2, 8.6], [8.95, 13.8], [14.15, 15.6]];
    cuts.forEach(([s0, s1], i) => {
      const prof = i < 2 ? [[s0, 1.7], [s1, 1.7]] : [[s0, 1.7], [s1, 1.7, 1], ...dome];
      turned(`gh.column${i}`, F, prof, { tone: "hi" }, { inner: i === 0 ? Ln(G.arcOf(F, 5.4, 1.7, P), { tone: "faint" }) : "" });
      if (i < 2) turned(`gh.column.deck${i}`, F, [[s1, 2.9], [s1 + 0.35, 2.9]], { tone: "mid" });
    });
  }
  // compressor house with a ridge of roof vents
  box("gh.house", [38.5, 7.2, 0.5], [44.5, 11.8, 4.0], { tone: "mid" }, { inner: Ln(k.sideSeam({ x: 38.5, y: 7.2, w: 6, d: 4.6, r: 0.2 }, 2.8, P, 2), { tone: "faint" }) });
  box("gh.house.roof", [38.2, 6.9, 4.0], [44.8, 12.1, 4.5], { tone: "mid" });
  for (const x of [39.8, 41.5, 43.2]) cyl(`gh.house.vent${x}`, x, 9.5, 0.45, 4.5, 0.9, { tone: "mid" }, { steps: 16 });
  // crude tank
  cyl("gh.tank", 53.4, 11.6, 3.0, 0.5, 4.2, { tone: "mid" }, { inner: Ln(k.sideArc(53.4, 11.6, 3.0, 2.6, P, 32), { tone: "faint" }), extra: Ln(k.ring(53.4, 11.6, 2.4, 4.7, P, 32), { tone: "faint" }) });
  // pipe from the separators to the column and from the column to the tank (on the rack height)
  box("gh.rackL", [36.4, 13.4, 0.5], [37.2, 14.2, 2.3], { tone: "mid" });
  pipe("gh.sep2col", [[37.5 - 0.05, 17.4, 3.1], [40.5, 17.4, 3.1], [40.5, 15.0, 3.1], [45.3, 15.0, 3.1]], 0.36, { touch: ["gh.rack*"] });
  {
    const u = G.unit3([53.4 - 47, 11.6 - 15, 0]);
    pipe("gh.col2tank", [[47 + u[0] * 1.7, 15 + u[1] * 1.7, 2.6], [53.4 - u[0] * 3.0, 11.6 - u[1] * 3.0, 2.6]], 0.32, {});
  }
  // flare: stack on a base, tip, three guy wires to deadmen
  BASEZ = 0;
  box("gh.flare.base", [4.6, 4.6, 0], [7.4, 7.4, 0.8], { tone: "lo" });
  const COL = 15.5;
  cyl("gh.flare.stack", 6, 6, 0.55, 0.8, COL - 0.3 - 0.8, { tone: "mid" }, { steps: 20 });
  cyl("gh.flare.collar", 6, 6, 0.9, COL - 0.3, 0.6, { tone: "mid" }, { steps: 20 });
  cyl("gh.flare.stack2", 6, 6, 0.55, COL + 0.3, 21.2 - COL - 0.3, { tone: "mid" }, { steps: 20 });
  cyl("gh.flare.tip", 6, 6, 0.85, 21.2, 1.0, { tone: "hi" }, { steps: 20 });
  const GUYS = [[7, 3.5], [-3.6, 8.4], [5.2, -3.4]];
  for (const [dx, dy] of GUYS) {
    const foot = [6 + dx, 6 + dy, 0];
    box(`gh.flare.dead${dx}`, [foot[0] - 0.6, foot[1] - 0.6, 0], [foot[0] + 0.6, foot[1] + 0.6, 0.55], { tone: "lo" });
    const u = G.unit3([dx, dy, 0]);
    const a = [6 + u[0] * 0.9, 6 + u[1] * 0.9, COL];
    const b = [6 + dx, 6 + dy, 0.55];
    put(`gh.flare.wire${dx}`, G.lerp3(a, b, 0.5), Ln(path3([a, b]), { tone: "lo" }), [record(A.tube([a, b], 0.08, { name: `gh.flare.wire${dx}`, limp: true }))]);
  }
  // export line into the ground (buried pipeline to Abqaiq), with a marker post
  pipe("gh.export", [[56.4, 11.6, 1.4], [60.2, 11.6, 1.4], [60.2, 11.6, 0.0]], 0.4, {});
  cyl("gh.marker", 61.6, 8.4, 0.25, 0, 2.4, { tone: "mid" }, { steps: 12 });
}

// Sverdrup: steel-jacket drilling platform bridged to a riser and process platform (two of the field centre's four)
const RP = { x0: 126, x1: 140, y0: 12, y1: 25.4, deck: 3.2 };
function jacket(name, J) {
  const legs = [[J.x0 + 1, J.y0 + 1], [J.x1 - 1, J.y0 + 1], [J.x0 + 1, J.y1 - 1], [J.x1 - 1, J.y1 - 1]];
  for (const [x, y] of legs) {
    LAYER = "pre";
    cyl(`${name}.leg${x}.${y}.sub`, x, y, 0.55, SEA + 0.7, -SEA - 0.7, { tone: "mid" }, { steps: 18 });
    cyl(`${name}.pile${x}.${y}`, x, y, 0.95, SEA, 0.7, { tone: "lo" }, { steps: 18 });
    LAYER = "post";
    cyl(`${name}.leg${x}.${y}.air`, x, y, 0.55, 0, J.deck, { tone: "mid" }, { steps: 18 });
  }
  // horizontal frames just below the surface and at the mudline: slender bars between the legs
  LAYER = "pre";
  for (const z of [SEA + 1.4, -0.9]) {
    for (const [[xa, ya], [xb, yb]] of [[legs[0], legs[1]], [legs[2], legs[3]], [legs[0], legs[2]], [legs[1], legs[3]]]) {
      const F = G.frameOf([xa, ya, z], G.unit3([xb - xa, yb - ya, 0]), [0, 0, 1], G.unit3(G.cross3([0, 0, 1], [xb - xa, yb - ya, 0])));
      const len = Math.hypot(xb - xa, yb - ya);
      prismItem(`${name}.frame${z.toFixed(1)}.${xa}.${ya}.${xb}.${yb}`, F, rect(-0.22, 0.22, -0.22, 0.22), 0.55, len - 0.55, { tone: "mid" });
    }
  }
  LAYER = "post";
}
{
  FIELD = "sverdrup";
  jacket("sv.dp", DP);
  jacket("sv.rp", RP);
  // drilling platform topsides
  BASEZ = DP.deck;
  box("sv.dp.deck", [DP.x0, DP.y0, DP.deck], [DP.x1, DP.y1, DP.deck + 0.8], { tone: "mid" }, { inner: Ln(k.sideSeam({ x: DP.x0, y: DP.y0, w: DP.x1 - DP.x0, d: DP.y1 - DP.y0, r: 0.2 }, DP.deck + 0.4, P, 2), { tone: "faint" }) });
  const D1 = DP.deck + 0.8;
  box("sv.dp.utility", [DP.x0 + 0.4, DP.y0 + 0.4, D1], [DP.x0 + 2.6, DP.y1 - 0.4, D1 + 4.6], { tone: "mid" }, { inner: Ln([1.6, 3.2].map((h) => k.sideSeam({ x: DP.x0 + 0.4, y: DP.y0 + 0.4, w: 2.2, d: DP.y1 - DP.y0 - 0.8, r: 0.2 }, D1 + h, P, 2)).join(""), { tone: "faint" }) });
  box("sv.dp.substructure", [105.2, 29, D1], [111.4, 35.4, D1 + 3.0], { tone: "mid" });
  box("sv.dp.floor", [104.8, 28.6, D1 + 3.0], [111.8, 35.8, D1 + 3.5], { tone: "mid" });
  // derrick: a tapered lattice tower on the drill floor, crown block on top
  {
    const z0 = D1 + 3.5;
    const z1 = z0 + 13;
    const b = { x0: 106, x1: 111, y0: 29.8, y1: 34.8 };
    const t = { x0: 107.8, x1: 109.2, y0: 31.6, y1: 33.0 };
    const corners = [[b.x0, b.y0, t.x0, t.y0], [b.x1, b.y0, t.x1, t.y0], [b.x0, b.y1, t.x0, t.y1], [b.x1, b.y1, t.x1, t.y1]];
    const lerp = (a, c, s) => a + (c - a) * s;
    const lat = [];
    // lattice on the two visible faces (+x and +y), z-pattern of braces between the corner posts
    const n = 7;
    for (let i = 0; i < n; i++) {
      const s0 = i / n;
      const s1 = (i + 1) / n;
      const P0 = (cx, cy, s) => [lerp(cx[0], cx[1], s), lerp(cy[0], cy[1], s), lerp(z0, z1, s)];
      // +y face: x from x0..x1 at y1
      const yA0 = P0([b.x0, t.x0], [b.y1, t.y1], s0), yB0 = P0([b.x1, t.x1], [b.y1, t.y1], s0), yB1 = P0([b.x1, t.x1], [b.y1, t.y1], s1), yA1 = P0([b.x0, t.x0], [b.y1, t.y1], s1);
      lat.push(path3([yA0, yB1]), path3([yA1, yB1]));
      const xA0 = P0([b.x1, t.x1], [b.y0, t.y0], s0), xB1 = P0([b.x1, t.x1], [b.y1, t.y1], s1), xA1 = P0([b.x1, t.x1], [b.y0, t.y0], s1);
      lat.push(path3([xA0, xB1]), path3([xA1, xB1]));
      if (i === 0) lat.push(path3([yA0, yB0]));
    }
    const posts = corners.map(([bx, by, tx, ty]) => path3([[bx, by, z0], [tx, ty, z1]]));
    const shapes = corners.map(([bx, by, tx, ty], i) => record(A.tube([[bx, by, z0], [tx, ty, z1]], 0.25, { name: `sv.dp.derrick.post${i}`, owner: "sv.dp.derrick" })));
    const backPosts = Ln(posts[0] + posts[1], { tone: "lo" });
    const front = Ln(lat.join(""), { tone: "lo" }) + `<path class="iso-line" data-tone="mid" style="stroke-width:.9" d="${posts[2] + posts[3]}"/>`;
    put("sv.dp.derrick", [108.5, 32.3, (z0 + z1) / 2], backPosts + front, shapes, { bias: 0.5 });
    box("sv.dp.crown", [107.5, 31.3, z1], [109.5, 33.3, z1 + 1.0], { tone: "hi" });
  }
  box("sv.dp.pipedeck", [112.2, 27, D1], [115.6, 34, D1 + 1.2], { tone: "mid" }, { extra: Ln([0.3, 0.6, 0.9].map((h) => path3([[112.2, 34, D1 + h], [115.6, 34, D1 + h]])).join(""), { tone: "faint" }) });
  // crane on a pedestal at the front corner, boom resting toward the pipe deck
  cyl("sv.dp.crane.ped", 114.2, 37.6, 0.7, D1, 3.2, { tone: "mid" }, { steps: 20 });
  box("sv.dp.crane.cab", [113.4, 36.8, D1 + 3.2], [115.2, 38.4, D1 + 4.6], { tone: "mid" });
  {
    const a = [114.6, 37.0, D1 + 4.2];
    const b2 = [114.6, 28.0, D1 + 9.6];
    const F = G.frameOf(a, G.unit3(G.sub3(b2, a)), [1, 0, 0], G.unit3(G.cross3([1, 0, 0], G.unit3(G.sub3(b2, a)))));
    prismItem("sv.dp.crane.boom", F, rect(-0.28, 0.28, -0.28, 0.28), 0, G.len3(G.sub3(b2, a)), { tone: "hi" });
  }
  // bridge to the riser platform
  box("sv.bridge", [DP.x1, 25.9, DP.deck + 0.9], [RP.x0, 27.1, DP.deck + 1.3], { tone: "mid" }, { extra: Ln(path3([[DP.x1, 27.1, DP.deck + 2.2], [RP.x0, 27.1, DP.deck + 2.2]]), { tone: "lo" }) });
  // riser and process platform topsides
  BASEZ = RP.deck;
  box("sv.rp.deck", [RP.x0, RP.y0, RP.deck], [RP.x1, RP.y1 + 2.2, RP.deck + 0.8], { tone: "mid" });
  const D2 = RP.deck + 0.8;
  BASEZ = D2;
  vessel("sv.rp.sep1", [131.5, 21.2, D2 + 1.6], [1, 0, 0], 8, 1.3);
  vessel("sv.rp.sep2", [131.5, 16.6, D2 + 1.3], [1, 0, 0], 7, 1.0);
  box("sv.rp.module", [136.4, 13, D2], [139.6, 26.8, D2 + 3.6], { tone: "mid" }, { inner: Ln(k.sideSeam({ x: 136.4, y: 13, w: 3.2, d: 13.8, r: 0.2 }, D2 + 1.8, P, 2), { tone: "faint" }) });
  // helideck: an octagon on four short posts above the module
  {
    const c = [138, 20, D2 + 4.8];
    const oct = Array.from({ length: 8 }, (_, i) => [3.2 * Math.cos((i + 0.5) * (Math.PI / 4)), 3.2 * Math.sin((i + 0.5) * (Math.PI / 4))]);
    for (const [dx, dy] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) box(`sv.rp.heli.post${dx}${dy}`, [c[0] + dx - 0.2, c[1] + dy - 0.2, D2 + 3.6], [c[0] + dx + 0.2, c[1] + dy + 0.2, c[2]], { tone: "mid" });
    const F = G.frameOf([c[0], c[1], 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    prismItem("sv.rp.heli", F, oct, c[2], c[2] + 0.35, { tone: "mid" }, { extra: Ln(k.ring(c[0], c[1], 1.6, c[2] + 0.35, P, 32), { tone: "lo" }) });
  }
  // flare boom from the far corner of the process deck, angled away
  {
    const a = [RP.x1 - 0.4, RP.y0 + 0.4, D2];
    const b2 = [RP.x1 + 2.6, RP.y0 - 4.6, D2 + 9];
    const dir = G.unit3(G.sub3(b2, a));
    const F = G.frameOf(a, dir, [1, 0, 0], G.unit3(G.cross3(dir, [1, 0, 0])));
    prismItem("sv.rp.flareboom", F, rect(-0.3, 0.3, -0.3, 0.3), 0, G.len3(G.sub3(b2, a)), { tone: "mid" });
    turned("sv.rp.flaretip", G.frameAlong(b2, dir), [[0, 0.5], [1.0, 0.5]], { tone: "hi" });
  }
  // export riser: up the riser platform's near leg from the seabed, then a pipeline on the seabed to the back edge
  LAYER = "pre";
  BASEZ = SEA;
  box("sv.plem", [RP.x1 - 3.4, 1.2, SEA], [RP.x1 - 0.2, 4.2, SEA + 1.0], { tone: "mid" });
  box("sv.riserbase", [RP.x1 - 3.4, 8.2, SEA], [RP.x1 - 0.2, 10.6, SEA + 1.4], { tone: "mid" });
  pipe("sv.export", [[RP.x1 - 1.8, 4.2, SEA + 0.72], [RP.x1 - 1.8, 8.2, SEA + 0.72]], 0.42, {});
  LAYER = "post";
}

// Permian: a well pad with the frac spread (sand, water, pumps, manifold), a second capped well, a tank battery
{
  FIELD = "permian";
  LAYER = "post";
  BASEZ = 0;
  box("pm.pad", [158, 9.5, 0], [208, 39.6, 0.35], { tone: "lo" }, { inner: Ln(k.planOutline(k.insetPlan({ x: 158, y: 9.5, w: 50, d: 30.1, r: 0.2 }, 1.2), 0.35, P, 2), { tone: "faint" }) });
  BASEZ = 0.35;
  // frac tree on the well: valve stack and goat head
  const x = LAT.x0;
  const y = 37.4;
  box("pm.w1.cellar", [x - 2.2, y - 2.0, 0.35], [x + 2.2, FRONT, 0.7], { tone: "lo" });
  cyl("pm.w1.flange", x, y, 1.05, 0.7, 0.6, { tone: "mid" });
  box("pm.w1.valve1", [x - 0.8, y - 0.8, 1.3], [x + 0.8, y + 0.8, 2.6], { tone: "mid" });
  cyl("pm.w1.spool", x, y, 0.6, 2.6, 0.8, { tone: "mid" });
  box("pm.w1.valve2", [x - 0.8, y - 0.8, 3.4], [x + 0.8, y + 0.8, 4.7], { tone: "mid" });
  box("pm.w1.goat", [x - 1.0, y - 1.0, 4.7], [x + 1.0, y + 1.0, 6.0], { tone: "hi" });
  cyl("pm.w1.cap", x, y, 0.55, 6.0, 0.7, { tone: "mid" });
  // second well on the pad (already completed, capped)
  box("pm.w2.cellar", [x + 4.4, y - 2.0, 0.35], [x + 8.0, FRONT, 0.7], { tone: "lo" });
  cyl("pm.w2.flange", x + 6.2, y, 0.9, 0.7, 0.5, { tone: "mid" });
  box("pm.w2.valve", [x + 5.5, y - 0.7, 1.2], [x + 6.9, y + 0.7, 2.6], { tone: "mid" });
  cyl("pm.w2.cap", x + 6.2, y, 0.7, 2.6, 0.45, { tone: "mid" });
  // missile (high-pressure manifold trailer)
  box("pm.missile.bed", [176, 29.2, 0.35], [201, 31.8, 1.6], { tone: "mid" });
  for (const xx of [178, 196.5, 199]) cyl(`pm.missile.axle${xx}`, xx, 30.5, 0.4, 0.35, 0.3, { tone: "lo" }, { steps: 12 });
  box("pm.missile.headL", [176.4, 29.7, 1.6], [177.4, 31.3, 3.8], { tone: "mid" });
  box("pm.missile.headR", [199.6, 29.7, 1.6], [200.6, 31.3, 2.9], { tone: "mid" });
  pipe("pm.missile.pipe", [[177.4, 30.5, 2.16], [199.6, 30.5, 2.16]], 0.55, { touch: ["pm.missile.*"] });
  // frac iron: two treating lines from the missile to the goat head
  pipe("pm.iron1", [[176.9, 30.5, 3.8], [176.9, 30.5, 5.35], [x, 30.5, 5.35], [x, y - 1.0, 5.35]], 0.3, {});
  // frac pumps: five trucks side by side, cabs toward the back, pumps toward the missile
  for (let i = 0; i < 5; i++) {
    const x0 = 177 + i * 4.6;
    box(`pm.pump${i}.chassis`, [x0, 18.6, 0.35], [x0 + 2.8, 28.4, 1.3], { tone: "lo" });
    box(`pm.pump${i}.cab`, [x0 + 0.1, 18.8, 1.3], [x0 + 2.7, 21.2, 3.4], { tone: "mid" }, { inner: Ln(k.sideSeam({ x: x0 + 0.1, y: 18.8, w: 2.6, d: 2.4, r: 0.2 }, 2.6, P, 2), { tone: "faint" }) });
    box(`pm.pump${i}.engine`, [x0 + 0.2, 21.8, 1.3], [x0 + 2.6, 24.8, 3.8], { tone: "mid" }, { extra: Ln([22.6, 23.4, 24.2].map((yy) => path3([[x0 + 2.6, yy, 2.0], [x0 + 2.6, yy, 3.4]])).join(""), { tone: "faint" }) });
    box(`pm.pump${i}.pump`, [x0 + 0.3, 25.2, 1.3], [x0 + 2.5, 28.2, 3.0], { tone: "hi" });
    cyl(`pm.pump${i}.stack`, x0 + 1.4, 23.3, 0.3, 3.8, 1.2, { tone: "mid" }, { steps: 12 });
  }
  // blender and data van
  box("pm.blender.chassis", [168, 18.6, 0.35], [171.6, 28.4, 1.3], { tone: "lo" });
  box("pm.blender.tub", [168.3, 23.6, 1.3], [171.3, 27.6, 3.0], { tone: "mid" });
  cyl("pm.blender.hopper", 169.8, 21.4, 1.3, 1.3, 2.2, { tone: "mid" }, { steps: 20 });
  box("pm.van", [159.6, 22, 0.35], [165.2, 26.4, 3.2], { tone: "mid" }, { inner: Ln(k.sideSeam({ x: 159.6, y: 22, w: 5.6, d: 4.4, r: 0.2 }, 2.4, P, 2), { tone: "faint" }), extra: Ln([161, 162.6].map((xx) => path3([[xx, 26.4, 1.6], [xx, 26.4, 3.2]])).join(""), { tone: "faint" }) });
  // sand: three silos on stands
  for (const [i, sx] of [160.8, 164.8, 168.8].entries()) {
    box(`pm.silo${i}.stand`, [sx - 1.6, 11.4, 0.35], [sx + 1.6, 14.6, 2.6], { tone: "lo" });
    const F = G.frameAlong([sx, 13, 0], [0, 0, 1]);
    turned(`pm.silo${i}`, F, [[2.6, 0.5], [4.0, 1.7, 1], [4.2, 1.75], [10.4, 1.75], [10.4, 1.4], [10.9, 1.4]], { tone: "hi" }, { inner: Ln(G.arcOf(F, 7.3, 1.75, P), { tone: "faint" }) });
  }
  // frac water tanks along the back of the pad
  for (let i = 0; i < 4; i++) {
    const x0 = 176 + i * 6.4;
    box(`pm.ftank${i}`, [x0, 10.6, 0.35], [x0 + 5.6, 14.6, 3.6], { tone: "mid" }, { r: 0.9, steps: 4, inner: Ln(k.sideSeam({ x: x0, y: 10.6, w: 5.6, d: 4, r: 0.9 }, 2.0, P, 4), { tone: "faint" }) });
  }
  // tank battery off the pad: three oil tanks and a water tank on a ring of gravel
  BASEZ = 0;
  box("pm.battery", [218, 6, 0], [246, 20, 0.3], { tone: "lo" });
  for (const [i, tx] of [222.5, 228.5, 234.5].entries()) cyl(`pm.otank${i}`, tx, 13, 2.4, 0.3, 4.6, { tone: "mid" }, { inner: Ln(k.sideArc(tx, 13, 2.4, 2.6, P, 28), { tone: "faint" }) });
  cyl("pm.wtank", 241.5, 13, 2.0, 0.3, 4.0, { tone: "lo" });
}

// ---------- the blocks as items (drawn under everything that stands on them) ----------
for (const f of M.FIELDS) {
  FIELD = f.id;
  LAYER = f.id === "permian" ? "post" : "pre";
  const { x0, x1 } = BLOCKS[f.id];
  const ztop = f.id === "sverdrup" ? SEA : 0;
  const plan = { x: x0, y: 0, w: x1 - x0, d: FRONT, r: 0.01 };
  const b = blockSvg(f.id);
  const wells = (WELLS[f.id] || []).map((w) => `<path class="fd-well${w.kind === "inj" ? " fd-inj" : ""}" d="${w.ribbon}"/>`).join("");
  const wellFlows = (WELLS[f.id] || []).map((w) => `<path class="fd-flow ${w.kind === "inj" ? "fd-flow-water" : "fd-flow-oil"} fd-bore" data-free="" ${f.id === "permian" ? 'data-part="boreflow"' : ""} d="${w.flow}"/>`).join("");
  const toes = Dots((WELLS[f.id] || []).map((w) => at(w.toe)), { size: 0.5, tone: "hi" });
  const fr = f.id === "permian" ? `<g class="fd-fracs" data-part="fracs">${FRACS.join("")}</g>` : "";
  const inner = b.base + fr + `<g class="fd-wells">${wells}</g><g class="fd-flows">${(FLOWS[f.id] || []).join("")}${wellFlows}</g>` + toes + b.edges;
  const shape = record(A.slab(plan, ZB, ztop - ZB, { name: `stand.block.${f.id}`, ground: true }, 2));
  put(`block.${f.id}`, [(x0 + x1) / 2, FRONT / 2, ZB / 2], S(k.slabOf(plan, ZB, ztop - ZB, P, 2, 0), { tone: "hi", inner }), [shape], { bias: -1000 });
}

// the conductors of the Sverdrup wells above water, from the sea to the cellar deck (in front of the jacket)
{
  FIELD = "sverdrup";
  LAYER = "post";
  const xs = [0, 1, 2, 3, 4].map((i) => 105 + i * 1.6);
  const d = xs.map((x) => path3([[x, FRONT - 0.6, 0], [x, FRONT - 0.6, DP.deck]])).join("");
  const shapes = xs.map((x) => record(A.cylinder(x, FRONT - 0.6, 0.35, 0, DP.deck, { name: `sv.conductor${x}` })));
  put("sv.conductors", [107.4, FRONT - 0.6, DP.deck / 2], `<path class="fd-conductor" d="${d}"/>`, shapes);
  LAYER = "pre";
  const dSub = xs.map((x) => path3([[x, FRONT - 0.6, SEA], [x, FRONT - 0.6, 0]])).join("");
  const sShapes = xs.map((x) => record(A.cylinder(x, FRONT - 0.6, 0.35, SEA, -SEA, { name: `sv.conductor.sub${x}` })));
  put("sv.conductors.sub", [107.4, FRONT - 0.6, SEA / 2], `<path class="fd-conductor" d="${dSub}"/>`, sShapes);
}

// the sea over Sverdrup: a translucent volume drawn between what is under it and what stands above it
function seaSvg() {
  const { x0, x1 } = BLOCKS.sverdrup;
  const front = [[x0, FRONT, SEA], [x1, FRONT, SEA], [x1, FRONT, 0], [x0, FRONT, 0]];
  const side = [[x1, FRONT, SEA], [x1, 0, SEA], [x1, 0, 0], [x1, FRONT, 0]];
  const top = [[x0, 0, 0], [x1, 0, 0], [x1, FRONT, 0], [x0, FRONT, 0]];
  const rip = [];
  for (let j = 0; j < 7; j++) {
    const y0 = 3 + j * 5.6;
    rip.push(path3(samplesOf(x0, x1, 48).map((x) => [x, Math.max(0.2, Math.min(FRONT - 0.2, y0 + 0.35 * Math.sin((x + j * 9) / 1.6))), 0])));
  }
  const outline = path3([[x0, FRONT, SEA], [x1, FRONT, SEA], [x1, 0, SEA], [x1, 0, 0], [x0, 0, 0], [x0, FRONT, 0]], true);
  return `<g class="fd-sea" data-field="sverdrup"><path class="fd-sea-front" d="${path3(front, true)}"/><path class="fd-sea-side" d="${path3(side, true)}"/><path class="fd-sea-top" d="${path3(top, true)}"/>` +
    `<path class="fd-sea-rip" d="${rip.join("")}"/><path class="fd-sea-edge" d="${path3([[x0, FRONT, 0], [x1, FRONT, 0], [x1, 0, 0]]) + path3([[x1, FRONT, SEA], [x1, FRONT, 0]])}"/><path class="fd-sea-outline" d="${outline}"/></g>`;
}

// ---------- order, page ----------
A.settle(R_, P);
R_.items.sort((a, b) => a.key - b.key);
const itemSvg = (item) => `<g class="it" data-name="${item.name}"${item.field ? ` data-field="${item.field}"` : ""}>${item.svg}</g>`;
const pre = R_.items.filter((i) => i.layer === "pre").map(itemSvg);
const post = R_.items.filter((i) => i.layer !== "pre").map(itemSvg);
const svgFig = k.figureSvg({
  width: W,
  height: HT,
  label:
    "Three earth blocks on one plinth, cut open at the front on the same depth scale: Ghawar in Saudi Arabia, a fold of limestone about 2 km down with a gas-oil separation plant on the desert above, one producer on the crest and water injected on the flanks; Johan Sverdrup in the North Sea, a sandstone 1.9 km down under 115 m of water, reached by deviated wells from a steel platform; and a Permian shale well that runs down 2.9 km and then 3.3 km sideways through the mudstone, cracked open in stages, with the frac spread on its pad.",
  body: [patternDefs(), ...back, ...pre, seaSvg(), ...post],
});

const CSS = readFileSync(join(HERE, "fields.css"), "utf8");
// chips and panels (all numbers from model.mjs)
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const srcTags = (list) => `<span class="fd-src">${list.map((s) => `<span>${esc(s.replace(/^note: /, "note · "))}</span>`).join("")}</span>`;
const chips = M.FIELDS.map((f, i) => {
  const c = M.chipOf(f);
  return `<button class="fd-chip" type="button" data-pick="${f.id}" aria-pressed="${i === 0}"><span class="fd-chip-t">${esc(c.title)}</span><span class="fd-chip-s">${esc(c.sub)}</span>${c.lines.map((l) => `<span class="fd-chip-l">${esc(l)}</span>`).join("")}</button>`;
}).join("");
const panels = M.FIELDS.map((f, i) => {
  const r = M.readoutOf(f);
  const pct = (v) => ((100 * Math.max(0, v)) / M.PRICE).toFixed(2);
  const seg = (cls, v, label) => `<span class="fd-seg ${cls}" style="width:${pct(v)}%" title="${esc(label)}"></span>`;
  const bar =
    `<div class="fd-bar" role="img" aria-label="${esc(`Of a $${M.PRICE} barrel: ${r.lifting.text}, ${r.capex.text}, ${r.take.text}; ${r.breakeven.text}`)}">` +
    seg("fd-seg-lift", r.lifting.value, r.lifting.text) + seg("fd-seg-cap", r.capex.value, r.capex.text) + seg("fd-seg-take", r.take.value, r.take.text) + seg("fd-seg-rest", r.rest.value, "left for the operator") +
    `<span class="fd-be" style="left:${pct(r.breakeven.value)}%"></span></div>` +
    `<div class="fd-scale"><span>$0</span><span>$${M.PRICE} a barrel</span></div>`;
  return (
    `<div class="fd-panel" data-panel="${f.id}"${i === 0 ? "" : " hidden"}>` +
    `<div class="fd-row"><span class="fd-k">Rate per well</span><span class="fd-v">${esc(r.rate.text)}</span>${srcTags(r.rate.src)}</div>` +
    `<div class="fd-row"><span class="fd-k">Decline</span><span class="fd-v">${esc(r.decline.text)}</span>${srcTags(r.decline.src)}</div>` +
    `<div class="fd-row fd-row-bar"><span class="fd-k">A $${M.PRICE} barrel</span><span class="fd-v">${bar}</span></div>` +
    `<ul class="fd-keys">` +
    `<li><i class="fd-sw fd-seg-lift"></i><span>${esc(r.lifting.text)}</span>${srcTags(r.lifting.src)}</li>` +
    `<li><i class="fd-sw fd-seg-cap"></i><span>${esc(r.capex.text)}</span>${srcTags(r.capex.src)}</li>` +
    `<li><i class="fd-sw fd-seg-take"></i><span>${esc(r.take.text)}</span>${srcTags(r.take.src)}</li>` +
    `<li><i class="fd-sw fd-sw-be"></i><span>${esc(r.breakeven.text)}</span>${srcTags(r.breakeven.src)}</li>` +
    `</ul></div>`
  );
}).join("");

const DATA = {
  P,
  fields: M.FIELDS.map((f) => f.id),
  corner: Object.fromEntries(M.FIELDS.map((f) => [f.id, M.cornerOf(f)])),
  arps: M.ARPS,
  owcRise: zOf(OWC.ghawar - OWC_RISE) - zOf(OWC.ghawar),
};
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const body =
  `<style>${CSS}</style>` +
  k.plateHtml({
    fig: "Three fields",
    title: "One depth scale",
    hint: "Pick a field",
    readout: M.cornerOf(M.FIELDS[0]),
    keys: [],
    caption: M.CAPTION,
    body: `<div class="iso-stage fd-stage" data-sel="ghawar">${svgFig}</div><div class="fd-chips" role="group" aria-label="Pick a field">${chips}</div><div class="fd-panels" aria-live="polite">${panels}</div>`,
  });
let page = k.pageHtml({ title: "Three oil fields", theme: "light", body, script: kitScript() + LIVE, width: 720 });
page = page.replace("</style>", `</style>${SITE_LIGHT}`);
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "fields-light.html"), page);
console.log("wrote fields-light.html", `${(page.length / 1024).toFixed(0)} KB`, `${R_.items.length} items`, `${R_.solids.length} solids`, `viewBox ${W}x${HT}`, `scale ${KS.toFixed(3)}`);
A.auditOrExit(R_, P, { crowd: [["pm.missile.pipe", "pm.missile.bed"]] });
