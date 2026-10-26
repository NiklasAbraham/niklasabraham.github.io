// An atmospheric distillation column cut open, as a bench model: a fired heater heats the crude, the
// transfer line feeds the flash zone, the column is cut by a plane facing the reader so its trays,
// downcomers, weirs and bubble caps show in section, a temperature rule stands beside it, and each product
// leaves at its height: overhead through the condenser and reflux drum, side draws through a stacked side
// stripper, residue from the bottom. A second panel magnifies one tray.
//   node build.mjs            -> assets/oil-article/anatomy/column-light.html (light only, BRIEF-2)
//   node build.mjs --audit    -> geometry audit
//   node build.mjs --fig="Fig 5"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/niklas/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/niklas/.claude/skills/anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "/home/niklas/.claude/skills/anatomy/kit/tube.mjs";
import * as A from "/home/niklas/.claude/skills/anatomy/kit/audit.mjs";
import { kitScript } from "/home/niklas/.claude/skills/anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "..", "..", "assets", "oil-article", "anatomy");
const FIG = (process.argv.find((a) => a.startsWith("--fig=")) || "--fig=The crude column").slice(6);
const { PRODUCTS, CRUDES, PROFILE, COLUMN } = M;
const PROD = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

// ---------- camera ----------
const AZIMUTH = 60;
const ELEVATION = 30;
const W = 600;
const LABEL_W = 150; // right strip of the art kept for the product labels (HTML)
const DEG = Math.PI / 180;
const E = [Math.sin(AZIMUTH * DEG), -Math.cos(AZIMUTH * DEG), 0]; // screen-right on the floor
const VF = [Math.cos(AZIMUTH * DEG), Math.sin(AZIMUTH * DEG), 0]; // toward the viewer on the floor
// column frame: u along E (screen right), w along VF (toward the viewer), z up; the column axis is the origin
const CW = (u, w, z) => [u * E[0] + w * VF[0], u * E[1] + w * VF[1], z];
const dirOf = (theta) => [Math.cos(theta) * E[0] + Math.sin(theta) * VF[0], Math.cos(theta) * E[1] + Math.sin(theta) * VF[1], 0];

// ---------- world plan ----------
const COL = { r: 20, t: 1.4, zb: 30, zt: 274, top: 284, head: 10 };
const RIN = COL.r - COL.t;
const TRAY = { t: 1.2, liquid: 5, weir: 4, chord: 12.4, clear: 3, backup: 9, sump: 11 };
const Z_STRIP = [48, 61];
const Z_TRAY = Array.from({ length: COLUMN.drawnAbove }, (_, i) => 86 + 14 * i);
const zTray = (i) => Z_TRAY[i - 1];
const Z_FEED = 72;
const Z_SUMP = COL.zb + 7; // residue level in the sump
// trays bottom to top: { z, side (+1: downcomer on the right), label }
const TRAYS = [
  { z: Z_STRIP[0], side: 1, name: "s1" },
  { z: Z_STRIP[1], side: -1, name: "s2" },
  ...Z_TRAY.map((z, i) => ({ z, side: (i + 1) % 2 ? 1 : -1, name: `t${i + 1}`, index: i + 1 })),
];
const DRAW_THETA = -30 * DEG; // side draws leave the back half toward the stripper
const BACK_THETA = -60 * DEG; // reflux in, residue out
const STEAM_THETA = -105 * DEG;
const FEED_THETA = 210 * DEG; // points along world -x, at the heater outlet
const STRIP = { c: [44 * dirOf(DRAW_THETA)[0], 44 * dirOf(DRAW_THETA)[1]], r: 8 };
const SECTIONS = [
  { id: "hgo", z0: 30, z1: 96, tray: 1 },
  { id: "diesel", z0: 98, z1: 152, tray: 5 },
  { id: "kero", z0: 154, z1: 208, tray: 9 },
];
const FUR = { x: -142, y: -18, w: 38, d: 36, leg: 14, floor: 17, roof: 90, conv: 108 };
const PLATE = { x: -158, y: -106, w: 222, d: 136, r: 10 };
const PLATE_H = 8;
const FOOT_H = 5;
const DECK = { x0: 18, x1: 58, y0: -102, y1: -78, z: 232, t: 2 };
const DRUM = { y: -90, z: 242, r: 7, x0: 22, x1: 52, head: 3.5 };
const COND = { y: -90, z: 283, r: 5.5, x0: 16, x1: 46, head: 3 };
const RULE = { u0: -45, u1: -38, w0: 3, w1: 5.5, z0: 0, z1: 270 };

// temperature profile of the column, height -> °C (draw trays from PROFILE, the patent example).
// The two stripping-tray values between the flash zone and the bottoms are interpolated (tint only).
const T_AT = [
  [Z_SUMP - 3, PROFILE.bottoms], [Z_STRIP[0], 342], [Z_STRIP[1], 344], [Z_FEED, PROFILE.flash],
  [zTray(1), PROFILE.gasoil], [zTray(5), PROFILE.diesel], [zTray(9), PROFILE.kerosene], [zTray(11), PROFILE.heavyNaphtha], [zTray(13), PROFILE.overhead],
];
const tempAt = (z) => {
  if (z <= T_AT[0][0]) return T_AT[0][1];
  for (let i = 1; i < T_AT.length; i++) if (z <= T_AT[i][0]) {
    const [z0, t0] = T_AT[i - 1];
    const [z1, t1] = T_AT[i];
    return t0 + ((t1 - t0) * (z - z0)) / (z1 - z0);
  }
  return T_AT[T_AT.length - 1][1];
};
// the rule: height of a temperature, on the monotone part above the feed
const RULE_T = T_AT.slice(3); // flash zone upward
const zOfT = (T) => {
  if (T >= RULE_T[0][1]) return RULE_T[0][0];
  for (let i = 1; i < RULE_T.length; i++) if (T >= RULE_T[i][1]) {
    const [z0, t0] = RULE_T[i - 1];
    const [z1, t1] = RULE_T[i];
    return z0 + ((z1 - z0) * (T - t0)) / (t1 - t0);
  }
  return RULE_T[RULE_T.length - 1][0];
};
const RULE_TOP = zTray(13);
const RULE_BOT = Z_FEED;

// product colour of the liquid on a tray, by its temperature (interpolated between the draw colours)
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const TINT = [[PROFILE.overhead, PROD.lnap.color], [PROFILE.heavyNaphtha, PROD.hnap.color], [PROFILE.kerosene, PROD.kero.color], [PROFILE.diesel, PROD.diesel.color], [PROFILE.gasoil, PROD.hgo.color], [PROFILE.flash, PROD.resid.color]];
const tintAt = (T) => {
  if (T <= TINT[0][0]) return TINT[0][1];
  for (let i = 1; i < TINT.length; i++) if (T <= TINT[i][0]) {
    const [t0, c0] = TINT[i - 1];
    const [t1, c1] = TINT[i];
    const f = (T - t0) / (t1 - t0);
    return toHex(hex(c0).map((v, j) => v + (hex(c1)[j] - v) * f));
  }
  return TINT[TINT.length - 1][1];
};

// ---------- projection: fit the drawing into the left part of the art ----------
const FIT = [
  ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, 312], CW(-COL.r, 0, 312), CW(RULE.u0, RULE.w1, 0), [FUR.x, FUR.y + FUR.d, 150],
  [DECK.x1, DECK.y0, 300], [100, -38, 0],
];
const P = (() => {
  const unit = { origin: [0, 0], scale: 1, azimuth: AZIMUTH, elevation: ELEVATION };
  const pts = FIT.map((p) => k.iso(p, unit));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = 14;
  const scale = (W - LABEL_W - pad * 2) / (Math.max(...xs) - Math.min(...xs));
  return { origin: [pad - Math.min(...xs) * scale, 22 - Math.min(...ys) * scale], scale, azimuth: AZIMUTH, elevation: ELEVATION, _h: (Math.max(...ys) - Math.min(...ys)) * scale + 22 + 20 };
})();
const H = Math.ceil(P._h);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
const f2 = (v) => Math.round(v * 100) / 100;
const UP = [0, 0, 1];
const towardA = Math.atan2(VF[1], VF[0]);

const R = A.recorder(P);
const record = R.solid;
function put(name, ref, svg, shapes = [], { bias = 0, attrs = "", ...rest } = {}) {
  return R.put({ name: R.nameFor(name), at: ref, bias, svg, shapes, piece: "cdu", attrs, ...rest });
}

// ---------- helpers that draw and record (as in the refinery figure) ----------
function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 0.4, steps = 2, bevel = 0, extra = "", inner = "", bias = 0, attrs = "" } = {}) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
  const shape = record(A.slab(plan, z0, z1 - z0, { name }, steps));
  put(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias, attrs });
  return shape;
}
function cyl(name, cx, cy, r, z0, z1, style = {}, { extra = "", inner = "", bias = 0, steps = 32, bevel = 0, attrs = "", owner, seated, cut } = {}) {
  const shape = record(A.cylinder(cx, cy, r, z0, z1 - z0, { name, owner, seated, cut }));
  put(name, [cx, cy, (z0 + z1) / 2], S(k.cylinder(cx, cy, r, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias, attrs });
  return shape;
}
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, smooth, bevel = 0, owner, seated, cut, attrs = "" } = {}) {
  const opts = { bevel, ...(smooth !== undefined ? { smooth } : {}) };
  const paths = G.solidOf(profile, F, P, opts);
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name, owner, seated, cut, radius: smooth && smooth.radius ? smooth.radius : null }));
  put(name, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias, attrs });
  return shape;
}
const disc = (name, F, s0, s1, r, style = {}, options = {}) => turned(name, F, [[s0, r], [s1, r]], style, options);
function pad(name, hosts, point, outward, a, h, style = {}, { ring = true, attrs = "" } = {}) {
  hosts = [hosts].flat();
  const inside = (p) => hosts.some((shape) => A.sdf(shape, p) < 0);
  const axis = G.unit3(outward);
  const F = G.frameAlong(point, axis);
  const start = (angle) => {
    let lo = -2.5 * a;
    let hi = h;
    if (!inside(G.pointOf(F, lo, a, angle))) return 0;
    for (let step = 0; step < 40; step++) {
      const mid = (lo + hi) / 2;
      if (inside(G.pointOf(F, mid, a, angle))) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  const low = Math.min(...Array.from({ length: 48 }, (_, index) => start((index / 48) * Math.PI * 2)));
  const face = ring && G.dot3(axis, V) > 0.15 ? Ln(G.circleOf(F, h, a * 0.55, P, 16), { tone: "faint" }) : "";
  put(name, G.add3(point, G.mul3(axis, h / 2)), S(G.saddleOf(F, a, start, h, P), { tone: "mid", ...style }) + face, [record(A.disc(F, low - 0.05, h, a, { name, seated: true, cut: hosts }))], { bias: 0.05, attrs });
  return G.add3(point, G.mul3(axis, h));
}
function flangeAt(name, centre, axis, r, thick, { bolts = 0, tone = "mid", owner, attrs = "", bias = 0 } = {}) {
  const F = G.frameAlong(centre, axis);
  const towards = G.dot3(F.a, V) > 0 ? thick / 2 : -thick / 2;
  const face = Math.abs(G.dot3(F.a, V)) > 0.15 && bolts ? Dots(G.dotsOf(F, towards, r * 0.74, bolts, P, { all: true }), { size: 0.38, tone: "lo" }) : "";
  put(name, centre, S(G.disc(-thick / 2, thick / 2, r, F, P), { tone }) + face, [record(A.disc(F, -thick / 2, thick / 2, r, { name, owner }))], { bias, attrs });
}
// a pipe: control points -> filleted route, flanges at its ends, optional bands and bellows; `flow` tints it
// with a product colour, `core` draws the product stream inside it as a stroke the page widens with the yield
function pipe(name, control, r, { bend = 2.6, tone = "mid", flanges = [true, true], flangeR = 1.6, bands = [], bellows = null, ends = [true, true], flow = "", core = "", touch, maxLength = 30, bias = 0, blind = [false, false] } = {}) {
  const line = G.fillet(control, Math.max(r * bend, 3), 10, { P, tube: r });
  const total = G.pathLength(line);
  const collars = [];
  [[0, -1], [total, 1]].forEach(([along, sign], index) => {
    if (!flanges[index] && !blind[index]) return;
    const thick = Math.max(0.8, r * 0.45);
    const tangent = G.tangentAlong(line, along);
    collars.push({ kind: blind[index] ? "blind" : "flange", centre: G.add3(G.pointAlong(line, along), G.mul3(tangent, (-sign * thick) / 2)), tangent, radius: r * flangeR, thick, gap: sign < 0 ? [0, thick] : [total - thick, total] });
  });
  const ring = (along, radius, thick, kind) => collars.push({ kind, centre: G.pointAlong(line, along), tangent: G.tangentAlong(line, along), radius, thick, gap: [along - thick / 2, along + thick / 2] });
  for (const share of bands) ring(total * share, r * 1.25, Math.max(0.7, r * 0.5), "band");
  if (bellows) {
    const [from, to, count] = bellows;
    for (let index = 0; index < count; index++) ring(total * from + ((total * (to - from)) * index) / (count - 1), r * 1.3, Math.max(0.5, r * 0.28), "bellows");
  }
  const gaps = collars.map(({ gap }) => gap);
  R.route(name, line, r, { owner: name, gaps, ends, touch, rims: [0, 1].map((i) => (flanges[i] || blind[i] ? r * flangeR : r)), piece: "cdu" });
  const attrs = (flow ? ` data-flow="${flow}"` : "") + (core ? ` data-pick="${core}"` : "");
  tubePieces(line, r, P, { maxLength, spacing: Math.max(1.2, Math.min(4, r * 1.3)), gaps }).forEach((piece, index) => {
    const coreSvg = core ? `<path class="cs-core" data-core="${core}" d="${k.pathOf(piece.points.map(at))}"/>` : "";
    put(`${name}:${index}`, piece.mid, tubeSvg(piece, { tone: "hi" }).replace(/<\/g>$/, `${coreSvg}</g>`), [A.tube(piece.points, piece.radii)], { bias, route: name, chunk: index, attrs });
  });
  collars.forEach(({ kind, centre, tangent, radius, thick }, index) =>
    flangeAt(`${name}.${kind}${index}`, centre, tangent, radius, thick, { bolts: kind === "flange" && r > 2.2 ? 8 : 0, owner: name, tone: kind === "band" || kind === "bellows" ? "lo" : "mid", attrs: kind === "blind" ? attrs : "" }),
  );
  return line;
}

// ---------- the bench: plate, feet, label plate (static back layer) ----------
const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
  back.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
}
back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -3.5, P, 8), { tone: "faint" }) }));
back.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
const plateScrews = k.corners(PLATE, 10);
back.push(Ln(plateScrews.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
back.push(Dots(plateScrews.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }, 8));
{
  const label = { x: PLATE.x + 14, y: PLATE.y + PLATE.d - 24, w: 46, d: 15, r: 1.5 };
  back.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo" }));
  back.push(Ln(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  back.push(k.faceTextSvg(k.topMatrix([label.x + 5, label.y + 6.5], 0.8, P, "x"), "CDU-1", { size: 4.2, tone: "mid" }));
  back.push(Ln([[label.x + 5, label.y + 10, 30], [label.x + 5, label.y + 12.4, 21]].map(([x, y, len]) => k.lineOnTop([x, y], [x + len, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  back.push(Dots([at([label.x + label.w - 3, label.y + 3, 0.8]), at([label.x + label.w - 3, label.y + label.d - 3, 0.8])], { size: 0.45 }));
}

// ---------- fired heater ----------
const FX1 = FUR.x + FUR.w;
const FY1 = FUR.y + FUR.d;
for (const [x, y] of [[FUR.x + 2, FUR.y + 2], [FX1 - 6, FUR.y + 2], [FUR.x + 2, FY1 - 6], [FX1 - 6, FY1 - 6]]) {
  box("fur.leg", [x, y, 0.8], [x + 4, y + 4, FUR.leg], { tone: "mid" });
  box("fur.legplate", [x - 1, y - 1, 0], [x + 5, y + 5, 0.8], { tone: "lo" });
}
box("fur.floor", [FUR.x, FUR.y, FUR.leg], [FX1, FY1, FUR.floor], { tone: "lo" }, { r: 0.6 });
const BURNERS = [-133, -123, -113];
pipe("fuel.header", [[FUR.x - 0.0, 0, 5], [FX1 + 8, 0, 5]], 1.6, { flanges: [false, true], blind: [true, false], ends: [false, true], touch: ["fuel.neck*"] });
box("fuel.regulator", [FX1 + 8, -5, 0], [FX1 + 15, 5, 11], { tone: "mid" }, { r: 0.8, extra: Dots([at([FX1 + 11.5, 0, 11])], { size: 0.5 }) });
BURNERS.forEach((x) => {
  cyl("fuel.neck", x, 0, 0.9, 5 + Math.sqrt(1.6 ** 2 - 0.9 ** 2) - 0.1, 9, { tone: "mid" }, { steps: 14 });
  cyl("burner", x, 0, 2.6, 9, FUR.leg, { tone: "mid" }, { steps: 24, inner: Ln(k.sideArc(x, 0, 2.6, 11.5, P, 16), { tone: "faint" }) });
});
// radiant box with a cut-away window on the front (+y) face: refractory back wall, radiant coil, flames
const WIN = { x0: -138, x1: -108, z0: 24, z1: 80, y: FY1, t: 2.5 };
let furnaceWindow = "";
{
  const opening = [[WIN.x0, WIN.y, WIN.z0], [WIN.x1, WIN.y, WIN.z0], [WIN.x1, WIN.y, WIN.z1], [WIN.x0, WIN.y, WIN.z1]];
  const parts = [`<clipPath id="cs-fwin"><path d="${path3(opening, true)}"/></clipPath>`, `<g clip-path="url(#cs-fwin)" class="cs-fire-box">`];
  parts.push(`<path class="cs-cavity" d="${path3(opening, true)}"/>`);
  // brick courses on the back wall, run past the opening and clipped by it so each ends on its outline
  const quad = opening.map(at);
  const clipSeg = (a, b) => {
    let t0 = 0, t1 = 1;
    const n = quad.length;
    let cx = 0, cy = 0;
    quad.forEach(([x, y]) => { cx += x / n; cy += y / n; });
    for (let i = 0; i < n; i++) {
      const p = quad[i], q = quad[(i + 1) % n];
      let nx = -(q[1] - p[1]), ny = q[0] - p[0];
      if (nx * (cx - p[0]) + ny * (cy - p[1]) < 0) { nx = -nx; ny = -ny; }
      const den = nx * (b[0] - a[0]) + ny * (b[1] - a[1]);
      const num = nx * (a[0] - p[0]) + ny * (a[1] - p[1]);
      if (Math.abs(den) < 1e-9) { if (num < 0) return null; continue; }
      const t = -num / den;
      if (den > 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
    }
    if (t1 <= t0) return null;
    const L = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    return k.pathOf([L(t0), L(t1)]);
  };
  parts.push(Ln([30, 38, 46, 54, 62, 70, 78].map((z) => clipSeg(at([WIN.x0 - 40, FUR.y + 1, z]), at([WIN.x1 + 40, FUR.y + 1, z]))).filter(Boolean).join(""), { tone: "faint", className: "cs-brick" }));
  const hearth = [[FUR.x + 1, FUR.y + 1, FUR.floor], [FX1 - 1, FUR.y + 1, FUR.floor], [FX1 - 1, FY1 - 1, FUR.floor], [FUR.x + 1, FY1 - 1, FUR.floor]];
  parts.push(`<path class="cs-hearth" d="${path3(hearth, true)}"/>`);
  BURNERS.forEach((x) => {
    const tile = Array.from({ length: 29 }, (_, i) => { const t = (i / 28) * Math.PI * 2; return [x + 3.4 * Math.cos(t), 3.4 * Math.sin(t), FUR.floor]; });
    parts.push(`<path class="cs-tile" d="${path3(tile, true)}"/>`);
  });
  const c = at([-123, FUR.y + 1, 38]);
  parts.push(`<ellipse class="cs-glow" cx="${f2(c[0])}" cy="${f2(c[1])}" rx="${f2(30 * KS)}" ry="${f2(24 * KS)}"/>`);
  for (let x = FUR.x + 4; x < FX1 - 2; x += 3.6) parts.push(S(k.cylinder(x, FUR.y + 3.5, 1.2, FUR.floor, FUR.roof - FUR.floor, P, 12), { tone: "mid", crease: "none", className: "cs-coil" }));
  BURNERS.forEach((x, i) => {
    const base = at([x, 0, FUR.floor]);
    const tip = at([x, 0, FUR.floor + 24]);
    const w = 2.8 * KS;
    const h = base[1] - tip[1];
    const d = `M${f2(base[0] - w)} ${f2(base[1])}C${f2(base[0] - w)} ${f2(base[1] - h * 0.45)} ${f2(base[0] - w * 0.25)} ${f2(base[1] - h * 0.7)} ${f2(tip[0])} ${f2(tip[1])}C${f2(base[0] + w * 0.25)} ${f2(base[1] - h * 0.7)} ${f2(base[0] + w)} ${f2(base[1] - h * 0.45)} ${f2(base[0] + w)} ${f2(base[1])}C${f2(base[0] + w)} ${f2(base[1] + w * 0.45)} ${f2(base[0] - w)} ${f2(base[1] + w * 0.45)} ${f2(base[0] - w)} ${f2(base[1])}Z`;
    parts.push(`<path class="cs-flame" style="transform-origin:${f2(base[0])}px ${f2(base[1])}px;animation-delay:${-i * 0.37}s" d="${d}"/>`);
  });
  const jamb = [[WIN.x0, WIN.y, WIN.z0], [WIN.x0, WIN.y, WIN.z1], [WIN.x0, WIN.y - WIN.t, WIN.z1], [WIN.x0, WIN.y - WIN.t, WIN.z0]];
  const sill = [[WIN.x0, WIN.y, WIN.z0], [WIN.x1, WIN.y, WIN.z0], [WIN.x1, WIN.y - WIN.t, WIN.z0], [WIN.x0, WIN.y - WIN.t, WIN.z0]];
  parts.push(`<path class="iso-shade" data-shade="2" d="${path3(jamb, true)}"/>`, `<path class="iso-top" d="${path3(sill, true)}"/>`, `</g>`);
  parts.push(Ln(path3(opening, true), { tone: "mid" }));
  parts.push(Ln(path3([[WIN.x0 - 2, WIN.y, WIN.z0 - 2], [WIN.x1 + 2, WIN.y, WIN.z0 - 2], [WIN.x1 + 2, WIN.y, WIN.z1 + 2], [WIN.x0 - 2, WIN.y, WIN.z1 + 2]], true), { tone: "faint" }));
  furnaceWindow = parts.join("");
}
{
  const plan = { x: FUR.x, y: FUR.y, w: FUR.w, d: FUR.d, r: 0.6 };
  const seams = Ln([52, 84].map((z) => k.sideSeam(plan, z, P, 2)).join(""), { tone: "faint" });
  const stiff = Ln([-8, 8].map((y) => path3([[FX1, y, FUR.floor], [FX1, y, FUR.roof]])).join(""), { tone: "faint" });
  box("fur.radiant", [FUR.x, FUR.y, FUR.floor], [FX1, FY1, FUR.roof], { tone: "mid" }, { r: 0.6, bevel: 0.6, inner: seams + stiff, extra: furnaceWindow, attrs: ' data-pick="feed"' });
}
for (const z of [30, 46]) box("fur.peep", [FX1, -14, z], [FX1 + 0.8, -9, z + 4], { tone: "mid" }, { extra: Dots([at([FX1 + 0.8, -11.5, z + 2])], { size: 0.4, tone: "lo" }) });
const CONV = { x: FUR.x + 6, y: FUR.y + 6, w: FUR.w - 12, d: FUR.d - 12 };
box("conv.bank", [CONV.x, CONV.y, FUR.roof], [CONV.x + CONV.w, CONV.y + CONV.d, FUR.conv], { tone: "mid" }, { r: 0.6, bevel: 0.5, inner: Ln(k.sideSeam({ x: CONV.x, y: CONV.y, w: CONV.w, d: CONV.d, r: 0.6 }, 99, P, 2), { tone: "faint" }) });
for (const x of [CONV.x - 4, CONV.x + CONV.w]) box("conv.bends", [x, CONV.y + 2, 93], [x + 4, CONV.y + CONV.d - 2, 105], { tone: "lo" }, { r: 0.6, extra: Dots([CONV.y + 5, CONV.y + CONV.d - 5].map((y) => at([x + 4, y, 102])), { size: 0.4 }) });
box("stack.hood", [-130, -7, FUR.conv], [-116, 7, 112], { tone: "mid" }, { r: 1 });
const STK = { x: -123, y: 0, r: 5 };
cyl("stack.lower", STK.x, STK.y, STK.r, 112, 120, { tone: "mid" });
cyl("stack.damper", STK.x, STK.y, STK.r + 0.9, 120, 122.6, { tone: "lo" });
cyl("stack.upper", STK.x, STK.y, STK.r, 122.6, 158, { tone: "mid" }, { inner: Ln(k.sideArc(STK.x, STK.y, STK.r, 140, P, 20), { tone: "faint" }) });
cyl("stack.lip", STK.x, STK.y, STK.r + 0.7, 158, 160, { tone: "mid" }, { extra: Ln(k.ring(STK.x, STK.y, STK.r - 0.6, 160, P, 32), { tone: "lo" }) });
// crude in: from the desalter into the convection coil, enters on the front face of the bank
const convIn = (() => {
  const F = G.frameAlong([CONV.x + 5, CONV.y + CONV.d, 100], [0, 1, 0]);
  disc("conv.inlet", F, 0, 2.2, 3.2, { tone: "mid" }, {});
  return [CONV.x + 5, CONV.y + CONV.d + 2.2, 100];
})();
const CRUDE_IN = [PLATE.x - 4, CONV.y + CONV.d + 9, 100];
pipe("feed.in", [convIn, [convIn[0], CRUDE_IN[1], 100], CRUDE_IN], 1.9, { flow: "crude", flanges: [true, true], ends: [true, false], bend: 3 });
// heater outlet -> transfer line -> flash zone
const outletBoss = (() => {
  const F = G.frameAlong([FX1, 0, Z_FEED], [1, 0, 0]);
  disc("fur.outlet", F, 0, 2.4, 5.2, { tone: "mid" }, {});
  return [FX1 + 2.4, 0, Z_FEED];
})();

// ---------- the column ----------
const CF = G.frameOf([0, 0, 0], UP, E, VF); // prism frame: u = E, v = VF
const halfDisc = (r, from = Math.PI, to = 2 * Math.PI, n = 36) => Array.from({ length: n + 1 }, (_, i) => { const t = from + ((to - from) * i) / n; return [r * Math.cos(t), r * Math.sin(t)]; });
cyl("col.base", 0, 0, COL.r + 3.5, 0, 2.5, { tone: "lo" }, { steps: 64, extra: Dots(G.dotsOf(G.frameOf([0, 0, 0], UP, [1, 0, 0], [0, 1, 0]), 2.5, COL.r + 2, 12, P, { all: true }), { size: 0.55, tone: "mid" }) });
const skirtOpen = (() => {
  const pts = [];
  const rr = COL.r + 0.05;
  for (let i = 0; i <= 12; i++) { const t = towardA - 0.85 - 0.24 + (0.48 * i) / 12; pts.push([rr * Math.cos(t), rr * Math.sin(t), 6]); }
  for (let i = 0; i <= 12; i++) { const t = towardA - 0.85 + 0.24 - (0.48 * i) / 12; pts.push([rr * Math.cos(t), rr * Math.sin(t), 22]); }
  return `<path class="cs-cavity" d="${path3(pts, true)}"/>` + Ln(path3(pts, true), { tone: "mid" });
})();
const skirt = cyl("col.skirt", 0, 0, COL.r, 2.5, COL.zb, { tone: "mid" }, { steps: 72, inner: skirtOpen + Ln(k.sideArc(0, 0, COL.r, COL.zb - 3, P, 40), { tone: "faint" }) });

// --- the section: everything inside the back half, painted back to front, bottom to top ---
function sectionSvg() {
  const out = [];
  const P3 = (u, w, z) => at(CW(u, w, z));
  const poly = (pts) => k.pathOf(pts.map(([u, w, z]) => P3(u, w, z)), true);
  const wmax = (u, r = RIN) => -Math.sqrt(Math.max(0, r * r - u * u));
  // a horizontal region of the back half between u0 and u1 at height z (chord + back arc)
  const topRegion = (u0, u1, z, r = RIN, n = 18) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const u = u0 + ((u1 - u0) * i) / n; pts.push([u, 0, z]); }
    for (let i = n; i >= 0; i--) { const u = u0 + ((u1 - u0) * i) / n; pts.push([u, wmax(u, r), z]); }
    return pts;
  };
  const cut = (u0, u1, z0, z1) => [[u0, 0, z0], [u1, 0, z0], [u1, 0, z1], [u0, 0, z1]];
  const rectD = (u0, u1, z0, z1) => poly(cut(u0, u1, z0, z1));
  const edge = (pts, tone = "mid", closed = true) => Ln(k.pathOf(pts.map(([u, w, z]) => P3(u, w, z)), closed), { tone });

  // inner back wall in strips shaded by how each faces the light
  const N = 24;
  for (let i = 0; i < N; i++) {
    const t0 = Math.PI + (Math.PI * i) / N;
    const t1 = Math.PI + (Math.PI * (i + 1)) / N;
    const tm = (t0 + t1) / 2;
    const normal = G.mul3(dirOf(tm), -1);
    const band = G.bandOf(G.dot3(normal, G.lightOf(P)));
    const q = [[RIN * Math.cos(t0), RIN * Math.sin(t0), COL.zb], [RIN * Math.cos(t1), RIN * Math.sin(t1), COL.zb], [RIN * Math.cos(t1), RIN * Math.sin(t1), COL.zt], [RIN * Math.cos(t0), RIN * Math.sin(t0), COL.zt]];
    out.push(`<path class="iso-shade cs-wall" data-shade="${Math.min(3, band)}" d="${poly(q)}"/>`);
  }
  // shell course seams on the inner wall, and the ports where nozzles pierce it
  const port = (theta, z, r = 2) => {
    const c = [RIN * Math.cos(theta), RIN * Math.sin(theta)];
    const t = [-Math.sin(theta), Math.cos(theta)];
    const pts = Array.from({ length: 25 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return [c[0] + t[0] * r * Math.cos(a), c[1] + t[1] * r * Math.cos(a), z + r * Math.sin(a)]; });
    return `<path class="cs-port" d="${poly(pts)}"/>` + edge(pts, "mid");
  };
  // floor of the column (back half) and the residue in the sump
  out.push(`<path class="iso-top" d="${poly(topRegion(-RIN, RIN, COL.zb))}"/>`);
  out.push(port(BACK_THETA, COL.zb + 5, 2.2));
  out.push(liquid(-RIN, RIN, COL.zb, Z_SUMP, PROD.resid.color, ' data-liq="resid"', { dense: true }));
  // stripping steam: port and a perforated sparger across the column, steam bubbling up
  out.push(port(STEAM_THETA, 41, 1.6));
  {
    const s0 = [RIN * Math.cos(STEAM_THETA), RIN * Math.sin(STEAM_THETA)];
    const pts = [CW(s0[0], s0[1], 41), CW(s0[0] + 2, -7, 41), CW(13, -7, 41)].map((p) => p);
    const line = G.fillet(pts, 2.5, 8);
    tubePieces(line, 0.9, P, { maxLength: 400 }).forEach((piece) => out.push(`<g class="cs-steam-pipe">${tubeSvg(piece, { tone: "mid" })}</g>`));
    const holes = [];
    for (let u = -2; u <= 12; u += 3) holes.push(P3(u, -7, 41.9));
    out.push(Dots(holes, { size: 0.35, tone: "hi" }));
    for (let j = 0; j < 7; j++) {
      const u = -1 + j * 2.1;
      const p0 = P3(u, -7, 42.5);
      out.push(`<circle class="cs-steam" cx="${f2(p0[0])}" cy="${f2(p0[1])}" r="${f2(0.55 * KS)}" style="--rise:${f2((Z_STRIP[0] - 44) * Math.cos(ELEVATION * DEG) * KS)}px;animation-delay:${-(j * 0.53).toFixed(2)}s"/>`);
    }
  }
  // the feed: port, an inlet horn with a baffle, flashing feed (vapour up, liquid rain down)
  out.push(port(FEED_THETA, Z_FEED, 2.6));
  {
    const pc = [RIN * Math.cos(FEED_THETA), RIN * Math.sin(FEED_THETA)];
    const line = G.fillet([CW(pc[0], pc[1], Z_FEED), CW(pc[0] + 6, -5, Z_FEED), CW(-6, -5, Z_FEED)], 3, 8);
    tubePieces(line, 2.2, P, { maxLength: 400 }).forEach((piece) => out.push(`<g class="cs-feed-pipe">${tubeSvg(piece, { tone: "mid" })}</g>`));
    out.push(`<path class="iso-shade" data-shade="2" d="${poly([[-5, -1, Z_FEED - 5], [-4, -1, Z_FEED - 5], [-4, -9, Z_FEED + 4], [-5, -9, Z_FEED + 4]])}"/>`);
    out.push(`<path class="cs-cut" d="${rectD(-5.4, -3.6, Z_FEED - 6, Z_FEED + 5)}"/>` + Ln(rectD(-5.4, -3.6, Z_FEED - 6, Z_FEED + 5), { tone: "mid" }));
    for (let j = 0; j < 8; j++) {
      const u = -2 + j * 2.2;
      const p0 = P3(u, 0, Z_FEED - 2);
      out.push(`<circle class="cs-rain" cx="${f2(p0[0])}" cy="${f2(p0[1])}" r="${f2(0.45 * KS)}" style="--fall:${f2((Z_FEED - 2 - (Z_STRIP[1] + TRAY.liquid)) * Math.cos(ELEVATION * DEG) * KS)}px;animation-delay:${-(j * 0.31).toFixed(2)}s"/>`);
    }
    for (let j = 0; j < 6; j++) {
      const u = -10 + j * 4;
      const p0 = P3(u, 0, Z_FEED + 3);
      out.push(`<circle class="cs-vap" cx="${f2(p0[0])}" cy="${f2(p0[1])}" r="${f2(0.6 * KS)}" style="--rise:${f2(8 * Math.cos(ELEVATION * DEG) * KS)}px;animation-delay:${-(j * 0.47).toFixed(2)}s"/>`);
    }
  }
  // trays, bottom to top
  TRAYS.forEach((tray, ti) => {
    const below = TRAYS[ti - 1];
    const { z, side } = tray;
    const T = tempAt(z);
    const color = tintAt(T);
    const draw = PRODUCTS.find((p) => p.where === "draw" && tray.index === p.tray);
    // this tray's downcomer (hangs from its deck into the space of the tray below)
    {
      const u0 = side * TRAY.chord;
      const ua = Math.min(u0, side * RIN);
      const ub = Math.max(u0, side * RIN);
      const floor = below ? below.z : ti === 2 ? Z_FEED + 3 : Z_SUMP - 2;
      const bottom = below ? below.z + TRAY.clear : ti === 2 ? Z_FEED + 3 : COL.zb + 3;
      const level = below ? below.z + (draw ? TRAY.sump : TRAY.backup) : ti === 2 ? Z_FEED + 8 : Z_SUMP;
      if (ti === 2) {
        // tray 1 (heavy gasoil draw) sits over the flash zone: its downcomer ends in a seal pan
        out.push(`<path class="iso-top" d="${poly(topRegion(ua, ub, floor))}"/>` + `<path class="cs-cut" d="${rectD(ua, ub, floor - 1, floor)}"/>` + Ln(rectD(ua, ub, floor - 1, floor), { tone: "mid" }));
      }
      const dcAttrs = draw ? ` data-liq="${draw.id}"` : "";
      if (level > floor + TRAY.liquid - 0.01 || ti === 2 || !below) out.push(liquid(side > 0 ? u0 + side * 0.6 : ua, side > 0 ? ub : u0 + side * 0.6, below ? below.z + TRAY.liquid : floor, level, color, dcAttrs, { draw: Boolean(draw) }));
      // falling liquid inside the downcomer
      const fx = side * (TRAY.chord + 2.8);
      const fa = P3(fx, 0, z - TRAY.t - 0.4);
      const fb = P3(fx, 0, level + 0.4);
      out.push(`<path class="cs-fall" d="M${f2(fa[0])} ${f2(fa[1])}L${f2(fb[0])} ${f2(fb[1])}"/>`);
      if (draw) out.push(port(DRAW_THETA, z - 4, 1.8));
      // the downcomer plate: seen edge-on, a thin strip from its cut edge back to the wall
      const pu = [u0, u0 + side * 0.6].sort((a, b) => a - b);
      const plate = [[pu[0], 0, bottom], [pu[1], 0, bottom], [pu[1], wmax(pu[1]), z], [pu[0], wmax(pu[0]), z]];
      out.push(`<path class="iso-shade" data-shade="1" d="${poly([[pu[0], 0, bottom], [pu[1], 0, bottom], [pu[1], 0, z], [pu[1], wmax(pu[1]), z], [pu[0], wmax(pu[0]), z], [pu[0], 0, bottom]])}"/>`);
      out.push(`<path class="cs-cut" d="${rectD(pu[0], pu[1], bottom, z - TRAY.t)}"/>` + edge(plate, "mid"));
    }
    // deck: from the inlet wall to the outlet weir
    const deckA = side > 0 ? -RIN : -TRAY.chord;
    const deckB = side > 0 ? TRAY.chord : RIN;
    out.push(`<path class="iso-top" d="${poly(topRegion(deckA, deckB, z))}"/>` + edge(topRegion(deckA, deckB, z), "mid"));
    // caps in the back row: seen whole, sticking out of the liquid
    const capsU = [-5.8, 5.8];
    const backCaps = [[0, -10.5]];
    // liquid on the deck
    const la = side > 0 ? -RIN : -TRAY.chord - 0.6;
    const lb = side > 0 ? TRAY.chord + 0.6 : RIN;
    out.push(liquid(la, lb, z, z + TRAY.liquid, color, draw ? ` data-tray="${draw.id}"` : tray.index === COLUMN.drawnAbove ? ' data-tray="top"' : "", { surface: backCaps }));
    for (const [u, w] of backCaps) {
      const [cx, cy] = CW(u, w, 0);
      out.push(S(k.cylinder(cx, cy, 3.8, z + TRAY.liquid, 2.4, P, 28), { tone: "mid", className: "cs-capb" }));
    }
    // caps in the cut plane, drawn in section: riser walls, inverted cup with slots
    capsU.forEach((u, ci) => out.push(capSection(u, z, ci)));
    // the outlet weir: edge-on strip and its cut face
    {
      const wu = [side * TRAY.chord, side * (TRAY.chord + 0.6)].sort((a, b) => a - b);
      out.push(`<path class="iso-shade" data-shade="2" d="${poly([[wu[0], 0, z], [wu[1], 0, z], [wu[1], 0, z + TRAY.weir], [wu[1], wmax(wu[1]), z + TRAY.weir], [wu[0], wmax(wu[0]), z + TRAY.weir], [wu[0], 0, z]])}"/>`);
      out.push(`<path class="cs-cut" d="${rectD(wu[0], wu[1], z, z + TRAY.weir)}"/>` + edge([[wu[0], 0, z], [wu[1], 0, z], [wu[1], 0, z + TRAY.weir], [wu[1], wmax(wu[1]), z + TRAY.weir], [wu[0], wmax(wu[0]), z + TRAY.weir], [wu[0], 0, z + TRAY.weir]], "mid"));
      // liquid spilling over the weir into the downcomer
      const a0 = P3(side * (TRAY.chord + 0.6), 0, z + TRAY.liquid);
      const a1 = P3(side * (TRAY.chord + 2.8), 0, z - 3);
      const ctl = P3(side * (TRAY.chord + 2.6), 0, z + TRAY.liquid);
      out.push(`<path class="cs-spill" style="--c:${color}" d="M${f2(a0[0])} ${f2(a0[1])}Q${f2(ctl[0])} ${f2(ctl[1])} ${f2(a1[0])} ${f2(a1[1])}"/>`);
    }
    // deck cut face, last, so it sits over the liquid and the cap feet
    out.push(`<path class="cs-cut" d="${rectD(deckA, deckB, z - TRAY.t, z)}"/>` + Ln(rectD(deckA, deckB, z - TRAY.t, z), { tone: "mid" }));
    // ports: vapour return from the stripper above each draw tray, reflux at the top
    if (draw && draw.id !== "hnap") out.push(port(DRAW_THETA, z + 7, 1.6));
  });
  // reflux: port and a distributor pipe that runs to the inlet side of the top tray
  {
    const zr = zTray(COLUMN.drawnAbove) + 9;
    out.push(port(BACK_THETA, zr, 1.8));
    const pc = [RIN * Math.cos(BACK_THETA), RIN * Math.sin(BACK_THETA)];
    const line = G.fillet([CW(pc[0], pc[1], zr), CW(pc[0], -8, zr), CW(-13, -8, zr)], 3, 8);
    tubePieces(line, 1, P, { maxLength: 400 }).forEach((piece) => out.push(`<g class="cs-reflux-pipe">${tubeSvg(piece, { tone: "mid" })}</g>`));
    for (let j = 0; j < 3; j++) {
      const p0 = P3(-13 + j * 0.9, -8, zr - 1.2);
      out.push(`<circle class="cs-rain" cx="${f2(p0[0])}" cy="${f2(p0[1])}" r="${f2(0.45 * KS)}" style="--fall:${f2((zr - 1.2 - zTray(COLUMN.drawnAbove) - TRAY.liquid) * Math.cos(ELEVATION * DEG) * KS)}px;animation-delay:${-(j * 0.4).toFixed(2)}s"/>`);
    }
  }
  // the overhead outlet seen from inside (the top of the section is under the intact top course)
  // the cut wall at both sides, last
  for (const [u0, u1] of [[-COL.r, -RIN], [RIN, COL.r]]) out.push(`<path class="cs-cut" d="${rectD(u0, u1, COL.zb, COL.zt)}"/>` + Ln(rectD(u0, u1, COL.zb, COL.zt), { tone: "hi" }));
  return out.join("");

  // a body of liquid in the back half: top surface (with optional bubbling rings round back caps) and cut face
  function liquid(u0, u1, z0, z1, color, attrs = "", { surface = [], dense = false, draw = false } = {}) {
    const parts = [`<g class="cs-liq${dense ? " cs-dense" : ""}${draw ? " cs-sump" : ""}" style="--c:${color}"${attrs}>`];
    parts.push(`<path class="cs-liq-top" d="${poly(topRegion(u0, u1, z1))}"/>`);
    for (const [u, w] of surface) {
      const pts = Array.from({ length: 25 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return [u + 4 * Math.cos(a), w + 4 * Math.sin(a), z1]; });
      parts.push(`<path class="cs-ripple" d="${poly(pts)}"/>`);
    }
    parts.push(`<path class="cs-liq-cut" d="${rectD(u0, u1, z0, z1)}"/>`);
    // flow lines in the cut face, toward the weir (or down, in a downcomer)
    if (!dense && z1 - z0 > 3) {
      const zz = (z0 + z1) / 2;
      const a = P3(u0, 0, zz);
      const b = P3(u1, 0, zz);
      parts.push(`<path class="cs-flow" d="M${f2(a[0])} ${f2(a[1])}L${f2(b[0])} ${f2(b[1])}"/>`);
    }
    parts.push(Ln(k.pathOf([P3(u0, 0, z1), P3(u1, 0, z1)]), { tone: "lo", className: "cs-liq-line" }));
    parts.push(`</g>`);
    return parts.join("");
  }
  // one bubble cap cut through its axis, in the section plane
  function capSection(u, z, ci) {
    const parts = [];
    const r1 = 1.6; // riser inner radius
    const rt = 0.5; // wall thickness
    const rc = 3.3; // cap inner radius
    const top = z + 7.6;
    const riser = z + 6.4;
    // vapour space inside the cap (lighter), then the walls
    parts.push(`<path class="cs-capin" d="${rectD(u - rc, u + rc, z + 3.6, top)}"/>`);
    parts.push(`<path class="cs-cut" d="${rectD(u - r1 - rt, u - r1, z, riser)}"/>` + `<path class="cs-cut" d="${rectD(u + r1, u + r1 + rt, z, riser)}"/>`);
    const cup = [[u - rc - rt, 0, z + 1.2], [u - rc - rt, 0, top + rt], [u + rc + rt, 0, top + rt], [u + rc + rt, 0, z + 1.2], [u + rc, 0, z + 1.2], [u + rc, 0, top], [u - rc, 0, top], [u - rc, 0, z + 1.2]];
    // the skirt is open at the slots: z+1.8 .. z+3.4
    const slot = [z + 1.8, z + 3.4];
    parts.push(`<path class="cs-cut" d="${poly(cup)}"/>`);
    parts.push(`<path class="cs-slot" d="${rectD(u - rc - rt - 0.05, u - rc + 0.05, slot[0], slot[1])}"/>` + `<path class="cs-slot" d="${rectD(u + rc - 0.05, u + rc + rt + 0.05, slot[0], slot[1])}"/>`);
    parts.push(Ln(rectD(u - r1 - rt, u - r1, z, riser) + rectD(u + r1, u + r1 + rt, z, riser), { tone: "mid" }));
    // cup outline in two pieces around each slot
    const L = (pts) => k.pathOf(pts.map(([a, b]) => P3(a, 0, b)));
    parts.push(Ln(L([[u - rc - rt, slot[1]], [u - rc - rt, top + rt], [u + rc + rt, top + rt], [u + rc + rt, slot[1]], [u + rc, slot[1]], [u + rc, top], [u - rc, top], [u - rc, slot[1]], [u - rc - rt, slot[1]]]) + L([[u - rc - rt, slot[0]], [u - rc - rt, z + 1.2], [u - rc, z + 1.2], [u - rc, slot[0]], [u - rc - rt, slot[0]]]) + L([[u + rc + rt, slot[0]], [u + rc + rt, z + 1.2], [u + rc, z + 1.2], [u + rc, slot[0]], [u + rc + rt, slot[0]]]), { tone: "mid" }));
    // bubbles leaving the slots and rising through the liquid
    for (const s of [-1, 1]) for (let j = 0; j < 2; j++) {
      const p0 = P3(u + s * (rc + 0.9 + j * 0.9), 0, z + 2.6);
      parts.push(`<circle class="cs-bub" cx="${f2(p0[0])}" cy="${f2(p0[1])}" r="${f2((0.5 + 0.15 * j) * KS)}" style="--rise:${f2((TRAY.liquid - 2.9) * Math.cos(ELEVATION * DEG) * KS)}px;animation-delay:${-((ci * 0.29 + j * 0.61 + (s > 0 ? 0.3 : 0)) % 1.2).toFixed(2)}s"/>`);
    }
    return parts.join("");
  }
}
const SECTION_SHAPE = record(A.prism(CF, halfDisc(COL.r), COL.zb, COL.zt, { name: "col.section" }));
put("col.section", [0, -8, (COL.zb + COL.zt) / 2], `<g class="cs-in">${sectionSvg()}</g>`, [SECTION_SHAPE], { bias: 0 });
// the intact top course and head above the cut
const TOP = cyl("col.top", 0, 0, COL.r, COL.zt, COL.top, { tone: "hi", crease: "lo" }, { steps: 72, inner: Ln(k.sideArc(0, 0, COL.r, COL.zt + 0.8, P, 48), { tone: "faint" }) });
const headR = (s) => COL.r * Math.sqrt(Math.max(0, 1 - (s / COL.head) ** 2));
const headSlope = (s) => (s >= COL.head ? -1e3 : (-COL.r * (s / COL.head ** 2)) / Math.sqrt(Math.max(1e-6, 1 - (s / COL.head) ** 2)));
const headProfile = Array.from({ length: 25 }, (_, i) => { const s = COL.head * Math.sin((i / 24) * (Math.PI / 2)); return [s, headR(s), 1]; });
headProfile[24] = [COL.head, 0, 1];
const HEAD = turned("col.head", G.frameOf([0, 0, COL.top], UP, [1, 0, 0], [0, 1, 0]), headProfile, { tone: "hi", crease: "lo" }, { smooth: { slope: headSlope, radius: headR } });
const topBoss = (() => {
  const s0 = 7;
  disc("col.topboss", G.frameAlong([0, 0, COL.top + s0], UP), 0, 302 - COL.top - s0, 4.2, { tone: "mid" }, { seated: true, cut: [HEAD] });
  return [0, 0, 302];
})();
// nozzles on the back half
const HOSTS = [SECTION_SHAPE];
const nozzle = (name, theta, z, a = 2.8, h = 2.6, attrs = "") => pad(name, HOSTS, [COL.r * dirOf(theta)[0], COL.r * dirOf(theta)[1], z], dirOf(theta), a, h, {}, { attrs });
const feedFace = nozzle("col.feed", FEED_THETA, Z_FEED, 5.2, 3, ' data-pick="feed"');
pipe("xfer", [outletBoss, feedFace], 3, { flow: "crude", bands: [0.72], bellows: [0.22, 0.3, 5], touch: ["xfer.shoe*", "xfer.post*"] });
box("xfer.post", [-55.5, -1.5, 1], [-52.5, 1.5, Z_FEED - 3 - 1], { tone: "mid" }, { r: 0.3 });
box("xfer.postfoot", [-57.5, -3.5, 0], [-50.5, 3.5, 1], { tone: "lo" }, { r: 0.3 });
box("xfer.shoe", [-57, -3, Z_FEED - 3 - 1], [-51, 3, Z_FEED - 3], { tone: "mid" }, { r: 0.2 });
// stripping steam into the bottom, a blue stub with a blind flange
{
  const f = nozzle("col.steam", STEAM_THETA, 41, 2, 2);
  pipe("col.steamline", [f, G.add3(f, G.mul3(dirOf(STEAM_THETA), 7))], 1.1, { flow: "steam", flanges: [true, false], blind: [false, true], ends: [true, false] });
}

// ---------- the stacked side stripper ----------
const [SX, SY] = STRIP.c;
const SF = G.frameOf([SX, SY, 0], UP, [1, 0, 0], [0, 1, 0]);
cyl("strip.base", SX, SY, STRIP.r + 2.4, 0, 1.6, { tone: "lo" }, { steps: 40, extra: Dots(G.dotsOf(SF, 1.6, STRIP.r + 1.4, 6, P, { all: true }), { size: 0.45, tone: "mid" }) });
cyl("strip.skirt", SX, SY, STRIP.r, 1.6, SECTIONS[0].z0, { tone: "mid" }, { steps: 48 });
const STRIP_TOP = SECTIONS[2].z1;
const stripShell = cyl("strip.shell", SX, SY, STRIP.r, SECTIONS[0].z0, STRIP_TOP, { tone: "hi", crease: "lo" }, { steps: 56, inner: Ln(SECTIONS.slice(1).map((s) => k.sideArc(SX, SY, STRIP.r, s.z0 - 1, P, 28)).join(""), { tone: "lo" }) });
{
  const hr = (q) => STRIP.r * Math.sqrt(Math.max(0, 1 - (q / 4) ** 2));
  const hs = (q) => (q >= 4 ? -1e3 : (-STRIP.r * (q / 16)) / Math.sqrt(Math.max(1e-6, 1 - (q / 4) ** 2)));
  const prof = Array.from({ length: 17 }, (_, i) => { const q = 4 * Math.sin((i / 16) * (Math.PI / 2)); return [q, hr(q), 1]; });
  prof[16] = [4, 0, 1];
  turned("strip.head", G.frameOf([SX, SY, STRIP_TOP], UP, [1, 0, 0], [0, 1, 0]), prof, { tone: "hi", crease: "lo" }, { smooth: { slope: hs, radius: hr } });
}
const towardCol = G.unit3([-SX, -SY, 0]);
const sideOut = [1, 0, 0];
const stripPad = (name, dir, z, a = 2.2, h = 2.2, attrs = "") => pad(name, stripShell, [SX + STRIP.r * dir[0], SY + STRIP.r * dir[1], z], dir, a, h, {}, { attrs });
const X_END0 = 100; // product lines end here (for lines at the stripper's y); others are shifted to the same screen x
const xEndAt = (y) => X_END0 + ((SY - y) * E[1]) / E[0]; // same screen x as a line at the stripper's y
const ENDS = {};
function rundown(id, from, control, r = 2.4, extra = {}) {
  const p = PROD[id];
  const last = control.length ? control[control.length - 1] : from;
  const end = [xEndAt(last[1]), last[1], last[2]];
  pipe(`run.${id}`, [from, ...control, end], r, { flow: id, core: id, flanges: [true, false], blind: [false, true], ends: [true, false], bend: 3, ...extra });
  ENDS[id] = { end, r };
  void p;
}
SECTIONS.forEach((s) => {
  const tray = zTray(s.tray);
  const pick = ` data-pick="${s.id}"`;
  // liquid draw: column nozzle under the draw tray -> straight to the stripper's top tray
  const a = nozzle(`col.draw.${s.id}`, DRAW_THETA, tray - 4, 2.8, 2.4, pick);
  const b = stripPad(`strip.in.${s.id}`, towardCol, tray - 4, 2.8, 2.4, pick);
  pipe(`draw.${s.id}`, [a, b], 1.6, { flow: s.id });
  // vapour return: stripper top -> column above the draw tray
  const c = stripPad(`strip.vap.${s.id}`, towardCol, tray + 7, 2, 2);
  const d = nozzle(`col.vap.${s.id}`, DRAW_THETA, tray + 7, 2, 2);
  pipe(`vap.${s.id}`, [c, d], 1.3, { flow: "vapour" });
  // stripping steam into the bottom of the section (back side), product out at the bottom (front side)
  const st = stripPad(`strip.steam.${s.id}`, G.unit3([0.5, -0.866, 0]), s.z0 + (s.id === "hgo" ? 16 : 6), 1.6, 1.4);
  pipe(`strip.steamline.${s.id}`, [st, G.add3(st, [3, -5.2, 0])], 1, { flow: "steam", flanges: [true, false], blind: [false, true], ends: [true, false] });
  const o = stripPad(`strip.out.${s.id}`, sideOut, s.z0 + (s.id === "hgo" ? 56 : s.id === "diesel" ? 24 : 8), 4, 2.4, pick);
  rundown(s.id, o, []);
});
// heavy naphtha: straight off tray 11 (no stripper in this drawing), over the stripper head
{
  const z = zTray(PROD.hnap.tray) - 4;
  const a = nozzle("col.draw.hnap", DRAW_THETA, z, 4, 2.4, ' data-pick="hnap"');
  rundown("hnap", a, [[SX, SY, z]]);
}
// residue: from the sump, out the back, down to the plate and along it
{
  const a = nozzle("col.bottoms", BACK_THETA, COL.zb + 5, 4.4, 2.6, ' data-pick="resid"');
  rundown("resid", a, [[a[0], -58, a[2]]], 2.6, { touch: ["resid.post*"] });
  box("resid.post", [44, -59.5, 1], [47, -56.5, a[2] - 2.6], { tone: "mid" }, { r: 0.3 });
  box("resid.postfoot", [42.5, -61, 0], [48.5, -55, 1], { tone: "lo" }, { r: 0.3 });
}

// ---------- overhead: deck on posts, condenser, reflux drum ----------
for (const x of [DECK.x0 + 2, DECK.x1 - 5]) for (const y of [DECK.y0 + 2, DECK.y1 - 5]) {
  box("deck.post", [x, y, 1], [x + 3, y + 3, DECK.z], { tone: "mid" }, { r: 0.3 });
  box("deck.postfoot", [x - 1.5, y - 1.5, 0], [x + 4.5, y + 4.5, 1], { tone: "lo" }, { r: 0.3 });
}
box("deck.plate", [DECK.x0, DECK.y0, DECK.z], [DECK.x1, DECK.y1, DECK.z + DECK.t], { tone: "mid" }, { r: 0.6, bevel: 0.4, extra: Ln(k.planOutline(k.insetPlan({ x: DECK.x0, y: DECK.y0, w: DECK.x1 - DECK.x0, d: DECK.y1 - DECK.y0, r: 0.6 }, 2.2), DECK.z + DECK.t, P, 2), { tone: "faint" }) });
{
  const y = DECK.y0 + 0.8;
  for (const x of [DECK.x0 + 3, (DECK.x0 + DECK.x1) / 2, DECK.x1 - 3]) cyl("deck.railpost", x, y, 0.5, DECK.z + DECK.t, DECK.z + 13, { tone: "mid" }, { steps: 8 });
  box("deck.toprail", [DECK.x0 + 2, y - 0.5, DECK.z + 13], [DECK.x1 - 2, y + 0.5, DECK.z + 14], { tone: "mid" }, { r: 0.1 });
  box("deck.midrail", [DECK.x0 + 3.5, y - 0.35, DECK.z + 8], [DECK.x1 - 3.5, y + 0.35, DECK.z + 8.7], { tone: "lo" }, { r: 0.1 });
}
const DZ = DECK.z + DECK.t;
const vessel = (len, r, hd) => {
  const radius = (s) => (s < hd ? r * Math.sqrt(Math.max(0, 1 - ((hd - s) / hd) ** 2)) : s > len - hd ? r * Math.sqrt(Math.max(0, 1 - ((s - (len - hd)) / hd) ** 2)) : r);
  const slope = (s) => {
    if (s < hd) { const u = (hd - s) / hd; return u >= 1 ? 1e3 : (r * u) / (hd * Math.sqrt(1 - u * u)); }
    if (s > len - hd) { const u = (s - (len - hd)) / hd; return u >= 1 ? -1e3 : (-r * u) / (hd * Math.sqrt(1 - u * u)); }
    return 0;
  };
  const prof = [];
  for (let i = 0; i <= 12; i++) { const s = hd * (1 - Math.cos((i / 12) * (Math.PI / 2))); prof.push([s, radius(s), 1]); }
  prof[0] = [0, 0, 1];
  for (let i = 1; i <= 12; i++) { const s = len - hd + hd * Math.sin((i / 12) * (Math.PI / 2)); prof.push([s, radius(s), 1]); }
  prof[prof.length - 1] = [len, 0, 1];
  return { prof, radius, slope };
};
for (const x of [27, 45]) box("drum.saddle", [x, DRUM.y - 5, DZ], [x + 4, DRUM.y + 5, DRUM.z - DRUM.r + 0.4], { tone: "lo" }, { r: 0.2 });
const DF = G.frameOf([DRUM.x0, DRUM.y, DRUM.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const dv = vessel(DRUM.x1 - DRUM.x0, DRUM.r, DRUM.head);
const drum = turned("drum", DF, dv.prof, { tone: "hi", crease: "lo" }, { smooth: { slope: dv.slope, radius: dv.radius }, inner: Ln(G.arcOf(DF, DRUM.head + 0.2, DRUM.r, P) + G.arcOf(DF, DRUM.x1 - DRUM.x0 - DRUM.head - 0.2, DRUM.r, P), { tone: "faint" }), attrs: ' data-pick="lnap"' });
// sour-water boot under the drum
{
  const x = 38;
  cyl("drum.boot", x, DRUM.y, 2.4, DZ + 0.01, DRUM.z - DRUM.r + 0.6, { tone: "mid" }, { steps: 24, seated: true, cut: [drum] });
}
const FRAME_Z = 274;
for (const x of [20, 36]) for (const y of [COND.y - 9]) box("cond.leg", [x - 1, y - 1, DZ], [x + 1, y + 1, FRAME_Z], { tone: "mid" }, { r: 0.2 });
for (const x of [20, 36]) box("cond.beam", [x - 1.5, COND.y - 10.4, FRAME_Z], [x + 1.5, COND.y + 6, FRAME_Z + 2], { tone: "lo" }, { r: 0.2 });
const CZ = FRAME_Z + 2 + COND.r;
const CFm = G.frameOf([COND.x0, COND.y, CZ], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const cv = vessel(COND.x1 - COND.x0, COND.r, COND.head);
const SC = COND.x1 - COND.head - 4 - COND.x0;
const profA = [...cv.prof.filter(([q]) => q < SC - 0.01), [SC, COND.r]];
const profB = [[SC + 1.4, COND.r], ...cv.prof.filter(([q]) => q > SC + 1.41)];
const cond = turned("cond", CFm, profA, { tone: "hi", crease: "lo" }, { smooth: { slope: cv.slope, radius: cv.radius } });
turned("cond.bonnet", CFm, profB, { tone: "hi", crease: "lo" }, { smooth: { slope: cv.slope, radius: cv.radius } });
disc("cond.channel", CFm, SC, SC + 1.4, COND.r + 1.1, { tone: "mid" }, { extra: Dots(G.dotsOf(CFm, SC + 1.4, COND.r + 0.55, 12, P, { fade: [0.04, 0.42] }), { size: 0.35, tone: "lo" }) });
for (const x of [31.5, 35.5]) {
  const f = pad("cond.cw", cond, [x, COND.y, CZ + COND.r], UP, 1.4, 1);
  pipe("cond.cwline", [f, G.add3(f, [0, 0, 4])], 0.85, { flow: "steam", flanges: [true, false], blind: [false, true], ends: [true, false] });
}
const vapIn = pad("cond.in", cond, [24.5, COND.y, CZ + COND.r], UP, 4.1, 1.4);
const condOut = pad("cond.out", cond, [31.4, COND.y, CZ - COND.r], [0, 0, -1], 2.6, 1.1);
const drumIn = pad("drum.in", drum, [31.4, DRUM.y, DRUM.z + DRUM.r], UP, 2.6, 1.1);
pipe("overhead", [topBoss, [0, 0, 312], [0, COND.y, 312], [vapIn[0], COND.y, 312], vapIn], 2.4, { flow: "overhead", bend: 2.6 });
pipe("cond.drop", [condOut, drumIn], 1.5, { flow: "lnap" });
// reflux: drum front bottom -> back into the column above the top tray
const refluxOut = (() => {
  const F = G.frameAlong([DRUM.x0 + 0.6, DRUM.y, DRUM.z], [-1, 0, 0]);
  disc("drum.refluxnz", F, 0, 2.2, 2.5, { tone: "mid" }, { seated: true, cut: [drum] });
  return [DRUM.x0 - 1.6, DRUM.y, DRUM.z];
})();
const refluxIn = nozzle("col.reflux", BACK_THETA, zTray(COLUMN.drawnAbove) + 9, 2.4, 2.2, ' data-pick="lnap"');
pipe("reflux", [refluxOut, [0, DRUM.y, DRUM.z], [0, DRUM.y, refluxIn[2]], refluxIn], 1.4, { flow: "lnap", bend: 3 });
// products from the drum: gas off the top, light naphtha off the far end
{
  const g = pad("drum.gas", drum, [49, DRUM.y, DRUM.z + DRUM.r * Math.sqrt(1 - (0.5 / DRUM.head) ** 2)], UP, 2.7, 1.2, {}, { attrs: ' data-pick="gas"' });
  rundown("gas", g, [[g[0], g[1], g[2] + 13], [60, g[1], g[2] + 13], [60, g[1], 300]], 1.6);
  const nOut = (() => {
    const F = G.frameAlong([DRUM.x1 - 0.6, DRUM.y, DRUM.z], [1, 0, 0]);
    disc("drum.naphtha", F, 0, 2.2, 3.3, { tone: "mid" }, { seated: true, cut: [drum], attrs: ' data-pick="lnap"' });
    return [DRUM.x1 + 1.6, DRUM.y, DRUM.z];
  })();
  rundown("lnap", nOut, [], 1.9);
}

// ---------- the temperature rule beside the column ----------
const RF = CF;
const rulePoly = [[RULE.u0, RULE.w0], [RULE.u1, RULE.w0], [RULE.u1, RULE.w1], [RULE.u0, RULE.w1]];
const RULE_SHAPE = record(A.prism(RF, rulePoly, RULE.z0 + 2, RULE.z1, { name: "rule" }));
const TICKS = [];
for (let T = 110; T <= 340; T += 10) TICKS.push(T);
const ruleSvg = (() => {
  const face = (u, z) => at(CW(u, RULE.w1, z));
  const parts = [S(G.prismOf(RF, rulePoly, RULE.z0 + 2, RULE.z1, P), { tone: "mid" })];
  // bands (filled by the page for the product picked), the draw mark, then the ticks
  parts.push(`<path class="cs-band" data-band d=""/><path class="cs-band-mark" data-mark d=""/>`);
  // off-scale ends: hatched, above the top tray (cooler) and below the flash zone (the column is never hotter)
  const minor = [];
  const major = [];
  for (const T of TICKS) {
    const z = zOfT(T);
    const len = T % 50 ? 1.8 : 3.2;
    (T % 50 ? minor : major).push(k.pathOf([face(RULE.u1, z), face(RULE.u1 - len, z)]));
  }
  // the two ends of the scale: the top tray and the flash zone
  const ends = [RULE_TOP, RULE_BOT].map((z) => k.pathOf([face(RULE.u1, z), face(RULE.u0, z)])).join("");
  parts.push(Ln(minor.join(""), { tone: "lo" }), Ln(major.join(""), { tone: "hi" }), Ln(ends, { tone: "hi" }));
  return parts.join("");
})();
put("rule", CW((RULE.u0 + RULE.u1) / 2, RULE.w1, 130), ruleSvg, [RULE_SHAPE], { bias: 0 });
// rule foot and cap
{
  const footPoly = [[RULE.u0 - 2.5, RULE.w0 - 2.5], [RULE.u1 + 2.5, RULE.w0 - 2.5], [RULE.u1 + 2.5, RULE.w1 + 2.5], [RULE.u0 - 2.5, RULE.w1 + 2.5]];
  put("rule.foot", CW((RULE.u0 + RULE.u1) / 2, RULE.w1, 1), S(G.prismOf(RF, footPoly, 0, 2, P), { tone: "lo" }) + Dots([at(CW(RULE.u0 - 1.2, (RULE.w0 + RULE.w1) / 2, 2)), at(CW(RULE.u1 + 1.2, (RULE.w0 + RULE.w1) / 2, 2))], { size: 0.45 }), [record(A.prism(RF, footPoly, 0, 2, { name: "rule.foot" }))]);
  const capPoly = [[RULE.u0 - 0.8, RULE.w0 - 0.8], [RULE.u1 + 0.8, RULE.w0 - 0.8], [RULE.u1 + 0.8, RULE.w1 + 0.8], [RULE.u0 - 0.8, RULE.w1 + 0.8]];
  put("rule.cap", CW((RULE.u0 + RULE.u1) / 2, RULE.w1, RULE.z1 + 1), S(G.prismOf(RF, capPoly, RULE.z1, RULE.z1 + 2, P), { tone: "mid" }), [record(A.prism(RF, capPoly, RULE.z1, RULE.z1 + 2, { name: "rule.cap" }))]);
}

// ---------- settle and assemble ----------
A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const groups = R.items.map((item) => `<g class="it" data-name="${item.name}"${item.attrs ?? ""}>${item.svg}</g>`);
// guide line from the rule to the column at the picked draw height (drawn by the page)
const guide = `<path class="cs-guide" data-guide d=""/>`;

const LABEL_ART =
  "A bench model of an atmospheric crude distillation column, cut open by a plane facing the reader. A fired heater on the left heats the crude, which enters the column low down in the flash zone. Inside, fifteen trays with bubble caps, weirs and downcomers carry liquid down and vapour up; the liquid on each tray is tinted by the product that boils at that tray's temperature. A temperature rule stands beside the column. Side draws leave the column at their heights into a stacked side stripper, the overhead vapour goes to a condenser and reflux drum, and the residue leaves at the bottom.";
const svgMain = k.figureSvg({ width: W, height: H, label: LABEL_ART, body: [...back, `<g class="cs-items">${groups.join("")}</g>`, guide] });

// ---------- screen positions for the HTML labels ----------
const pct = ([x, y], h = H) => [f2((x / W) * 100), f2((y / h) * 100)];
const LABELS = PRODUCTS.map((p) => {
  const e = ENDS[p.id];
  const s = at(e.end);
  return { id: p.id, x: s[0] + e.r * KS * 1.6 + 5, y: s[1] };
});
const RULE_LABELS = [150, 200, 250, 300].map((T) => ({ T, p: at(CW(RULE.u0 - 1.5, RULE.w1, zOfT(T))) }));
RULE_LABELS.push({ T: Math.round(PROFILE.overhead), p: at(CW(RULE.u0 - 1.5, RULE.w1, RULE_TOP)), end: "top" });
RULE_LABELS.push({ T: Math.round(PROFILE.flash), p: at(CW(RULE.u0 - 1.5, RULE.w1, RULE_BOT)), end: "flash" });

// ---------- the detail panel: one tray magnified, drawn flat in the section plane ----------
const DW = 600;
const DH = 236;
const D = { deck: 156, t: 7, liq: 120, weir: 474, weirTop: 128, wallL: 40, wallR: 560, dcPlate: 118, caps: [222, 368] };
function detailSvg() {
  const o = [];
  const rect = (x0, y0, x1, y1, cls, extra = "") => `<rect class="${cls}" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"${extra}/>`;
  o.push(`<defs><clipPath id="cs-dclip"><rect x="0" y="0" width="${DW}" height="${DH}"/></clipPath><pattern id="cs-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" class="cs-hatch-bg"/><line x1="0" y1="0" x2="0" y2="5" class="cs-hatch-line"/></pattern></defs>`);
  o.push(`<g clip-path="url(#cs-dclip)">`);
  o.push(rect(D.wallL, 0, D.wallR, DH, "cs-dvap"));
  // liquid in the downcomer from the tray above (left), under its plate and across the deck to the weir
  o.push(`<g class="cs-dliq">`);
  o.push(rect(D.wallL, 40, D.dcPlate, D.deck, "cs-dliq-body"));
  o.push(rect(D.dcPlate, D.liq, D.weir, D.deck, "cs-dliq-body"));
  // falling sheet over the weir into the outlet downcomer, and its pool
  o.push(`<path class="cs-dliq-body" d="M${D.weir + 6} ${D.weirTop - 4} C ${D.weir + 26} ${D.weirTop - 4} ${D.weir + 30} ${D.deck + 10} ${D.weir + 34} ${DH} L ${D.weir + 18} ${DH} C ${D.weir + 16} ${D.deck + 16} ${D.weir + 12} ${D.weirTop + 4} ${D.weir + 6} ${D.weirTop + 4} Z"/>`);
  o.push(rect(D.weir + 6, DH - 22, D.wallR, DH, "cs-dliq-body"));
  o.push(`</g>`);
  // flow lines in the liquid
  o.push(`<path class="cs-dflow" d="M${D.wallL + 22} 48 L${D.wallL + 22} ${D.deck - 4}"/>`);
  o.push(`<path class="cs-dflow" d="M${D.wallL + 50} 48 L${D.wallL + 50} ${D.deck - 4}"/>`);
  o.push(`<path class="cs-dflow cs-dflow-h" d="M${D.dcPlate} ${D.deck - 6} L${D.weir} ${D.deck - 6}"/>`);
  o.push(`<path class="cs-dflow" d="M${D.weir + 10} ${D.weirTop - 1} C ${D.weir + 22} ${D.weirTop} ${D.weir + 25} ${D.deck + 12} ${D.weir + 27} ${DH - 22}"/>`);
  // the deck (hatched cut), with a hole under each riser
  const holes = D.caps.map((c) => [c - 14, c + 14]);
  let x = D.wallL;
  for (const [h0, h1] of holes) { o.push(rect(x, D.deck, h0, D.deck + D.t, "cs-dcut")); x = h1; }
  o.push(rect(x, D.deck, D.weir + 6, D.deck + D.t, "cs-dcut"));
  // the weir and the outlet downcomer plate (one plate: weir above the deck, downcomer below)
  o.push(rect(D.weir, D.weirTop, D.weir + 6, DH, "cs-dcut"));
  // the inlet downcomer plate from the tray above
  o.push(rect(D.dcPlate - 6, 0, D.dcPlate, D.liq + 18, "cs-dcut"));
  o.push(rect(D.wallL - 6, 0, D.dcPlate - 6, 8, "cs-dcut"));
  // column walls
  o.push(rect(D.wallL - 14, 0, D.wallL, DH, "cs-dcut"));
  o.push(rect(D.wallR, 0, D.wallR + 14, DH, "cs-dcut"));
  // bubble caps in section
  for (const c of D.caps) {
    const riserTop = 98;
    const capTop = 80;
    const rc = 34;
    const wt = 5;
    o.push(rect(c - rc + wt, capTop + wt, c + rc - wt, D.liq + 12, "cs-dcapin"));
    o.push(rect(c - 14, riserTop, c + 14, DH, "cs-dcapin"));
    o.push(rect(c - 14 - wt, riserTop, c - 14, D.deck + D.t, "cs-dcut"));
    o.push(rect(c + 14, riserTop, c + 14 + wt, D.deck + D.t, "cs-dcut"));
    o.push(`<path class="cs-dcut" d="M${c - rc} ${D.deck - 12} V${capTop} H${c + rc} V${D.deck - 12} H${c + rc - wt} V${capTop + wt} H${c - rc + wt} V${D.deck - 12} Z"/>`);
    // the slots: openings in the cap skirt below the liquid surface; teeth below them
    o.push(rect(c - rc, D.deck - 12, c - rc + wt, D.deck - 9, "cs-dcut") + rect(c + rc - wt, D.deck - 12, c + rc, D.deck - 9, "cs-dcut"));
    o.push(rect(c - rc - 0.5, D.liq + 12, c - rc + wt + 0.5, D.deck - 12, "cs-dslot") + rect(c + rc - wt - 0.5, D.liq + 12, c + rc + 0.5, D.deck - 12, "cs-dslot"));
    // the skirt above the slots, down to the slot top
    o.push(`<path class="cs-dcut" d="M${c - rc} ${capTop} V${D.liq + 12} H${c - rc + wt} V${capTop} Z M${c + rc - wt} ${capTop} V${D.liq + 12} H${c + rc} V${capTop} Z"/>`);
  }
  o.push(`</g>`);
  // bubbles and molecules are added by the page into this group
  o.push(`<g class="cs-dmove" data-dmove></g>`);
  return `<svg class="cs-detail" viewBox="0 0 ${DW} ${DH}" role="img" aria-label="One tray magnified: a bubble-cap tray in section. Liquid comes down the downcomer on the left, flows across the deck past two bubble caps and over the weir into the downcomer on the right. Vapour from the tray below rises up each riser, turns down under the cap and bubbles out of the slots through the liquid; heavy molecules condense into the liquid, light ones stay in the vapour and rise.">${o.join("")}</svg>`;
}
// paths the page animates in the panel: vapour up the riser, over and down under the cap, out of the slot, up
const VAPOUR_PATHS = D.caps.flatMap((c) => [-1, 1].map((s) => [[c + s * 4, DH + 4], [c + s * 4, 92], [c + s * 22, 92], [c + s * 26, D.deck - 18], [c + s * 40, D.deck - 18], [c + s * 46, D.liq + 2], [c + s * 50, -10]]));
const DETAIL_LABELS = [
  { t: "riser", x: D.caps[0] - 2, y: 106, a: "middle", cls: "in" },
  { t: "cap", x: D.caps[1], y: 74, a: "middle" },
  { t: "slots", x: D.caps[1] + 50, y: D.deck - 22, a: "start" },
  { t: "weir", x: D.weir - 4, y: D.weirTop - 16, a: "end" },
  { t: "downcomer", x: D.weir + 50, y: 200, a: "start" },
  { t: "liquid from the tray above", x: D.wallL + 6, y: 22, a: "start" },
  { t: "vapour from the tray below", x: D.caps[0] - 2, y: 218, a: "middle", cls: "dim" },
];

// ---------- page ----------
const CSS = readFileSync(join(HERE, "style.css"), "utf8").replace("__FONTS__", "");
const SITE_LIGHT = (() => {
  const s = readFileSync(join(OUT, "refinery-light.html"), "utf8");
  const i = s.indexOf('<style id="oil-site-light">');
  return s.slice(i, s.indexOf("</style>", i) + 8);
})();
const ICONS = {
  gas: '<path d="M8 2c1.6 2 3.4 3.6 3.4 6.4A3.4 3.4 0 0 1 4.6 8.4C4.6 6.6 5.8 5.4 6.4 4.4c.4 1 .9 1.6 1.6 2C8.2 5 8 3.6 8 2Z"/>',
  lnap: '<path d="M3 13V4.5L5 3h4v10M3 8h6M9 6l2 1.2V11a1 1 0 0 0 2 0V6.5L11.5 5"/>',
  hnap: '<path d="M3 13V4.5L5 3h4v10M3 8h6M9 6l2 1.2V11a1 1 0 0 0 2 0V6.5L11.5 5"/>',
  kero: '<path d="M2 9.2 7 7.6V4a1 1 0 0 1 2 0v3.6l5 1.6V10.6L9 9.6v2.2l1.6 1.2v1L8 13.4 5.4 14v-1L7 11.8V9.6l-5 1Z"/>',
  diesel: '<path d="M1.5 4.5h8v6h-8zM9.5 7h3l2 2v1.5h-5M3.5 12.5a1.2 1.2 0 1 0 0 .01M11.5 12.5a1.2 1.2 0 1 0 0 .01"/>',
  hgo: '<path d="M2 14V7l3 2V7l3 2V7l3 2V3h2v11Z"/>',
  resid: '<path d="M3 4.5h10v8H3zM3 8.5h10M6 4.5V3h4v1.5"/>',
};
const icon = (id) => `<svg class="cs-icon" viewBox="0 0 16 16" aria-hidden="true">${ICONS[id]}</svg>`;
const labelHtml = LABELS.map((l) => {
  const p = PROD[l.id];
  const [x, y] = pct([l.x, l.y]);
  return `<button type="button" class="cs-tag" data-pick="${p.id}" style="left:${x}%;top:${y}%;--c:${p.color}"><span class="cs-tag-name">${icon(p.id)}<span class="cs-full">${p.name}</span><span class="cs-short">${p.short[0].toUpperCase() + p.short.slice(1)}</span></span><span class="cs-tag-sub">${M.rangeOf(p)} · ${M.carbonText(p)}</span><span class="cs-tag-use">${p.use}</span></button>`;
}).join("");
const ruleHtml = RULE_LABELS.map(({ T, p, end }) => {
  const [x, y] = pct(p);
  return `<span class="cs-rule-n${end ? " cs-rule-end" : ""}" style="right:${f2(100 - x)}%;top:${y}%">${end ? "≈ " : ""}${T} °C</span>`;
}).join("");
const crudeIn = at(CRUDE_IN);
const feedHtml = `<button type="button" class="cs-tag cs-tag-feed" data-pick="feed" style="left:${pct(crudeIn)[0]}%;top:${pct(crudeIn)[1]}%;--c:${M.CRUDE_COLOR}"><span class="cs-tag-name">Crude in</span><span class="cs-tag-sub">from the desalter</span></button>`;
const detailHtml = DETAIL_LABELS.map((l) => `<span class="cs-dl${l.cls ? ` cs-dl-${l.cls}` : ""}" style="left:${f2((l.x / DW) * 100)}%;top:${f2((l.y / DH) * 100)}%;--a:${l.a === "middle" ? "-50%" : l.a === "end" ? "-100%" : "0"}">${l.t}</span>`).join("");

const chips = [
  `<button type="button" class="cs-chip" data-pick="feed" style="--c:${M.CRUDE_COLOR}">Crude feed</button>`,
  ...PRODUCTS.map((p) => `<button type="button" class="cs-chip" data-pick="${p.id}" style="--c:${p.color}">${p.short[0].toUpperCase() + p.short.slice(1)}</button>`),
].join("");
const crudeChips = CRUDES.map((c, i) => `<button type="button" class="cs-crude" data-crude="${i}">${c.name} <span>${c.kind}, ${c.api} °API</span></button>`).join("");

const DATA = {
  W, H, DW, DH,
  products: PRODUCTS.map((p) => ({ id: p.id, name: p.name, color: p.color, where: p.where, tray: p.tray ?? null, drawT: p.drawT, tbp: p.tbp })),
  crudes: CRUDES,
  yieldMax: M.YIELD_MAX,
  coreMax: f2(2 * 2.4 * KS * 0.82),
  P,
  rule: { u0: RULE.u0, u1: RULE.u1, w: RULE.w1, top: RULE_TOP, bot: RULE_BOT, z0: RULE.z0 + 3, z1: RULE.z1 - 1, E, VF },
  zOfT: RULE_T,
  drawZ: Object.fromEntries(PRODUCTS.map((p) => [p.id, p.where === "draw" ? zTray(p.tray) : p.where === "overhead" ? zTray(COLUMN.drawnAbove) : Z_SUMP - 3])),
  colLeft: -COL.r,
  feedZ: Z_FEED,
  trayT: Object.fromEntries(PRODUCTS.map((p) => [p.id, p.drawT])),
  detail: { paths: VAPOUR_PATHS, liq: D.liq, deck: D.deck, caps: D.caps },
  alkanes: M.ALKANES,
};
const LIVE = readFileSync(join(HERE, "live.js"), "utf8")
  .replace("__DATA__", () => JSON.stringify(DATA))
  .replace("__MODEL__", () => Object.entries({ carbonText: M.carbonText, rangeOf: M.rangeOf, whereText: M.whereText, yieldText: M.yieldText, readout: M.readout, feedReadout: M.feedReadout, trayChem: M.trayChem }).map(([n, f]) => { const src = f.toString(); return src.startsWith("function") ? src : `const ${n} = ${src};`; }).join("\n").replace(/^/, `const PRODUCTS = ${JSON.stringify(PRODUCTS)};\nconst ALKANES = ${JSON.stringify(M.ALKANES)};\nconst FURNACE = ${JSON.stringify(M.FURNACE)};\nconst FLASHED_MAX = ${M.FLASHED_MAX};\nconst deg = (v) => { const r = Math.round(v); return r < 0 ? \`−\${-r}\` : \`\${r === 0 ? 0 : r}\`; };\n`));

const art = `<div class="cs-art">${svgMain}<div class="cs-over">${ruleHtml}${labelHtml}${feedHtml}</div></div>`;
const detail = `<div class="cs-detail-wrap"><div class="cs-detail-head"><span class="cs-detail-title" data-dtitle>One tray, magnified</span><span class="cs-detail-chem" data-dchem></span></div><div class="cs-detail-art">${detailSvg()}<div class="cs-over">${detailHtml}<span class="cs-mol-tag" data-moltag="light"></span><span class="cs-mol-tag" data-moltag="heavy"></span></div></div></div>`;
const controls = `<div class="cs-controls"><div class="cs-chips" role="group" aria-label="Pick a product">${chips}</div><div class="cs-crudes" role="group" aria-label="Pick a crude">${crudeChips}</div></div>`;

const k0 = PROD.kero;
const body =
  `<style>${CSS}</style>` +
  k.plateHtml({
    fig: FIG,
    title: "Distillation column, cut open",
    hint: "Pick a product · ← →",
    readout: M.readout(k0, CRUDES[0]),
    keys: [
      { mark: "lit", label: "Rule: column temperature at each height (approximate), band = boiling range of the product picked" },
      { mark: "raised", label: "Liquid on each tray tinted by the cut that boils at that tray's temperature" },
      { mark: "edge", label: "Stream width in the rundown lines: square root of the crude's yield (wt %)" },
    ],
    caption: `CAPTION`,
    body: `<div class="iso-stage cs-stage" tabindex="0" role="group" aria-label="Distillation column cut open. Pick a product with the buttons or the left and right arrow keys; its draw, boiling range and temperature are shown.">${controls}${art}${detail}<span class="cs-sr" role="status" aria-live="polite" data-status></span></div>`,
  });

const CAPTION = `A crude distillation column cut open (schematic: ${COLUMN.drawn} trays drawn, a real column has ${COLUMN.realTrays[0]}–${COLUMN.realTrays[1]}, spaced ${COLUMN.spacingCm[0]}–${COLUMN.spacingCm[1]} cm). The heater takes the crude to about ${M.FURNACE.columnFeedC[0]}–${M.FURNACE.columnFeedC[1]} °C (OSHA) and up to half of it flashes to vapour in the flash zone; there is no reboiler, so the column is hottest at the bottom and cools upward as rising vapour meets liquid running down. On every tray the vapour bubbles through the liquid: heavier molecules condense, lighter ones stay in the vapour. Each product is drawn where the column is about as warm as its boiling range. Draw temperatures (about ${Math.round(PROFILE.overhead)} °C at the top to ${Math.round(PROFILE.flash)} °C at the feed) are one example design from a patent (approximate); cut points are TotalEnergies assay cuts, with the gasoil split at 321 °C as in Penn State's FSC 432; carbon numbers are the n-alkanes that boil in each range (NIST, ASTM D2887). Yields: Brent TotalEnergies TBP assay, WCS crudemonitor.ca simulated distillation (Sep 2026, approximate).`;
const page = k
  .pageHtml({ title: "Distillation column", theme: "light", body: body.replace("CAPTION", () => CAPTION), script: kitScript() + LIVE, width: 720 })
  .replace("</style></head>", `</style>${SITE_LIGHT}</head>`);
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "column-light.html"), page);
const solids = R.solids.length;
console.log("wrote", join(OUT, "column-light.html"), `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `${solids} solids`, `scale ${KS.toFixed(3)}`, `H ${H}`);
A.auditOrExit(R, P, { crowd: [["overhead", "col.section"]] });
