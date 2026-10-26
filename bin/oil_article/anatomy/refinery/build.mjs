// Crude distillation unit as a bench model: three crude barrels, a charge pump, a fired heater,
// an atmospheric column with a cut-away window, side strippers, overhead condenser and reflux drum,
// and five product sight glasses on a rack. Picking a crude sets each glass to its straight-run yield.
//   node build.mjs            -> assets/oil-article/anatomy/refinery.html (dark)
//   node build.mjs --light    -> refinery-light.html
//   node build.mjs --audit    -> geometry audit
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/niklas/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/niklas/.claude/skills/anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "/home/niklas/.claude/skills/anatomy/kit/tube.mjs";
import * as A from "/home/niklas/.claude/skills/anatomy/kit/audit.mjs";
import { kitScript } from "/home/niklas/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { CRUDES, CUTS, SCALE_MAX, FURNACE, COLUMN, readout } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "..", "..", "assets", "oil-article", "anatomy");
const THEME = process.argv.includes("--light") ? "light" : "dark";
const FIG = (process.argv.find((a) => a.startsWith("--fig=")) || "--fig=Fig 3").slice(6);
const DEG = Math.PI / 180;

const W = 600;
const H = 540;
const AZIMUTH = 55;
const ELEVATION = 28;

// ---------- world plan (units ~ px of the model) ----------
const PLATE = { x: -214, y: -100, w: 392, d: 170, r: 10 };
const PLATE_H = 10;
const FOOT_H = 5;

const COL = { x: 30, y: -40, r: 16, skirt: 34, top: 268, head: 8 };
const BARREL = { x: -184, r: 11, z0: 4, z1: 38, ys: [-14, -42, -70] };
const FUR = { x: -110, y: -62, w: 56, d: 44, leg: 18, floor: 21, roof: 81 };
const GLASS = { y: 47, xs: { resid: 30, diesel: 60, kero: 90, naphtha: 120, lpg: 150 }, z0: 27, h: 72, r: 5.2, block: 14 };
const STRIP = { diesel: { x: 60, y: -27 }, kero: { x: 90, y: -27 } };
const LOW = 22; // product rundown header height
const DRUM = { y: -40, z: 247, r: 7, x0: 58.5, x1: 95.5, head: 3.5 };
const COND = { y: -40, z: 269, r: 6, x0: 56, x1: 98, head: 3 };
const DECK = { x: 48, y: -58, w: 56, d: 36, z: 236, t: 2 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [COL.x, COL.y, 300], [70, -40, 300], [-82, -40, 200]],
  W,
  H,
  { pad: 26, azimuth: AZIMUTH, elevation: ELEVATION },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const Faded = (list, style) => k.fadedSvg(list, style);
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
const f2 = (v) => Math.round(v * 100) / 100;
const UP = [0, 0, 1];

const R = A.recorder(P);
const record = R.solid;
function put(name, ref, svg, shapes = [], { bias = 0, attrs = "", ...rest } = {}) {
  return R.put({ name: R.nameFor(name), at: ref, bias, svg, shapes, piece: "cdu", attrs, ...rest });
}

// ---------- helpers that draw and record ----------
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
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, smooth, rims, bevel = 0, owner, seated, cut, attrs = "" } = {}) {
  const opts = { bevel, ...(smooth !== undefined ? { smooth } : {}), ...(rims ? { rims } : {}) };
  const paths = G.solidOf(profile, F, P, opts);
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name, owner, seated, cut, radius: smooth && smooth.radius ? smooth.radius : null }));
  put(name, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias, attrs });
  return shape;
}
const disc = (name, F, s0, s1, r, style = {}, options = {}) => turned(name, F, [[s0, r], [s1, r]], style, options);
function ball(name, c, r, style = {}, { bias = 0, owner, attrs = "" } = {}) {
  const shape = record(A.ball(c, r, { name, owner }));
  put(name, c, S(G.sphereOf(c, r, P, { steps: 28 }), { tone: "mid", ...style }), [shape], { bias, attrs });
  return shape;
}
// a saddle pad on a curved host: `point` on the host surface, `outward` its normal. Returns the face centre.
function pad(name, hosts, point, outward, a, h, style = {}, { ring = true } = {}) {
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
  put(name, G.add3(point, G.mul3(axis, h / 2)), S(G.saddleOf(F, a, start, h, P), { tone: "mid", ...style }) + face, [record(A.disc(F, low - 0.05, h, a, { name, seated: true, cut: hosts }))], { bias: 0.05 });
  return G.add3(point, G.mul3(axis, h));
}
function flangeAt(name, centre, axis, r, thick, { bolts = 0, tone = "mid", owner, attrs = "", bias = 0 } = {}) {
  const F = G.frameAlong(centre, axis);
  const towards = G.dot3(F.a, V) > 0 ? thick / 2 : -thick / 2;
  const face = Math.abs(G.dot3(F.a, V)) > 0.15 && bolts ? Dots(G.dotsOf(F, towards, r * 0.74, bolts, P, { all: true }), { size: 0.38, tone: "lo" }) : "";
  put(name, centre, S(G.disc(-thick / 2, thick / 2, r, F, P), { tone }) + face, [record(A.disc(F, -thick / 2, thick / 2, r, { name, owner }))], { bias, attrs });
}
// a pipe: control points -> filleted route, flanges at its ends, optional bands, bellows and blind ends
function pipe(name, control, r, { valve = null, bend = 2.6, tone = "mid", flanges = [true, true], flangeR = 1.6, bands = [], bellows = null, ends = [true, true], flow = "", touch, maxLength = 16, bias = 0, blind = [false, false] } = {}) {
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
  if (valve) {
    const along = total * valve.at;
    const g = Math.sqrt(valve.R ** 2 - r ** 2);
    gaps.push([along - g, along + g]);
    ball(`${name}.valve`, G.pointAlong(line, along), valve.R, { tone: "mid" }, { owner: name });
  }
  R.route(name, line, r, { owner: name, gaps, ends, touch, rims: [0, 1].map((i) => (flanges[i] || blind[i] ? r * flangeR : r)), piece: "cdu" });
  const attrs = flow ? ` data-flow="${flow}"` : "";
  tubePieces(line, r, P, { maxLength, spacing: Math.max(0.8, Math.min(2.2, r * 0.4)), gaps }).forEach((piece, index) =>
    put(`${name}:${index}`, piece.mid, tubeSvg(piece, { tone: "hi" }), [A.tube(piece.points, piece.radii)], { bias, route: name, chunk: index, attrs }),
  );
  collars.forEach(({ kind, centre, tangent, radius, thick }, index) =>
    flangeAt(`${name}.${kind}${index}`, centre, tangent, radius, thick, { bolts: kind === "flange" && r > 2.4 ? 8 : 0, owner: name, tone: kind === "band" || kind === "bellows" ? "lo" : "mid", attrs: kind === "blind" ? attrs : "" }),
  );
  return line;
}

// ---------- the bench: plate, feet, ruler strip, label plate (static back layer) ----------
const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
  back.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
}
back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -4, P, 8), { tone: "faint" }) }));
back.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
const plateScrews = k.corners(PLATE, 10);
back.push(Ln(plateScrews.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
back.push(Dots(plateScrews.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }, 8));
{
  // ruler strip along the front edge, ticks every 4, major every 5th
  const strip = { x: PLATE.x + 70, y: PLATE.y + PLATE.d - 12, w: PLATE.w - 250, d: 6, r: 1 };
  back.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y, 0.6, [1.8, 3.4], P);
  back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  // label plate at the front-left corner, one engraved label
  const label = { x: PLATE.x + 14, y: PLATE.y + PLATE.d - 26, w: 44, d: 16, r: 1.5 };
  back.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo" }));
  back.push(Ln(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  back.push(k.faceTextSvg(k.topMatrix([label.x + 5, label.y + 7], 0.8, P, "x"), "CDU-1", { size: 4.2, tone: "mid" }));
  back.push(Ln([[label.x + 5, label.y + 10.5, 28], [label.x + 5, label.y + 13, 20]].map(([x, y, len]) => k.lineOnTop([x, y], [x + len, y], 0.8, P)).join(""), { tone: "lo", free: true }));
  back.push(Dots([at([label.x + label.w - 3, label.y + 3, 0.8]), at([label.x + label.w - 3, label.y + label.d - 3, 0.8])], { size: 0.45 }));
}

// ---------- feed: three crude barrels on a skid, valves, manifold ----------
box("feed.skid", [-200, -86, 0], [-148, 2, 4], { tone: "lo" }, { r: 1.5, steps: 3, bevel: 0.4 });
const BARRELS = [];
const towardA = Math.atan2(k.towardViewer(P)[1], k.towardViewer(P)[0]);
const arcPts = (cx, cy, r, z, steps = 28) => Array.from({ length: steps + 1 }, (_, i) => {
  const t = towardA - Math.PI / 2 + (Math.PI * i) / steps;
  return [cx + r * Math.cos(t), cy + r * Math.sin(t), z];
});
const MANI = { x0: -162, x1: -156, y0: -82, y1: -2, z0: 4, z1: 15 };
box("feed.manifold", [MANI.x0, MANI.y0, MANI.z0], [MANI.x1, MANI.y1, MANI.z1], { tone: "mid" }, { r: 1, steps: 3, bevel: 0.4, extra: Dots([MANI.y0 + 3, MANI.y1 - 3].map((y) => at([(MANI.x0 + MANI.x1) / 2, y, MANI.z1])), { size: 0.45 }) });
BARREL.ys.forEach((y, i) => {
  const x = BARREL.x;
  const c = CRUDES[i];
  cyl(`barrel${i}.chime0`, x, y, BARREL.r + 0.4, BARREL.z0, BARREL.z0 + 1.2, { tone: "lo" }, { steps: 40 });
  const band = [...arcPts(x, y, BARREL.r, 17), ...arcPts(x, y, BARREL.r, 26).reverse()];
  const hoops = [13, 30].map((z) => Ln(k.sideArc(x, y, BARREL.r, z, P, 28), { tone: "lo" })).join("");
  const paint = `<path class="rf-band" data-barrel="${i}" style="--c:${c.color}" d="${path3(band, true)}"/>`;
  cyl(`barrel${i}.body`, x, y, BARREL.r, BARREL.z0 + 1.2, BARREL.z1 - 1.2, { tone: "mid" }, { steps: 40, inner: paint + hoops, attrs: ` data-pick="${i}"` });
  cyl(`barrel${i}.chime1`, x, y, BARREL.r + 0.4, BARREL.z1 - 1.2, BARREL.z1, { tone: "mid" }, { steps: 40, extra: Ln(k.ring(x, y, BARREL.r - 0.8, BARREL.z1, P, 40), { tone: "faint" }) });
  cyl(`barrel${i}.bung`, x + 5, y - 3, 2, BARREL.z1, BARREL.z1 + 1.2, { tone: "mid" }, { steps: 18, extra: Ln(k.ring(x + 5, y - 3, 1, BARREL.z1 + 1.2, P, 12), { tone: "lo" }) });
  cyl(`barrel${i}.vent`, x - 4, y + 4, 1.2, BARREL.z1, BARREL.z1 + 0.9, { tone: "mid" }, { steps: 14 });
  const body = R.solids.find((s) => s.name === `barrel${i}.body`);
  const face = pad(`barrel${i}.pad`, body, [x + BARREL.r, y, 9], [1, 0, 0], 2.3, 1.4);
  const line = pipe(`barrel${i}.branch`, [face, [MANI.x0, y, 9]], 1.3, { flow: `branch${i}`, flanges: [false, false], valve: { at: 0.5, R: 2.4 } });
  // ball valve with a lever: lever along the pipe = open
  const vc = [(face[0] + MANI.x0) / 2, y, 9];
  void line;
  BARRELS.push({ vc, i });
});

// ---------- charge pump ----------
box("pump.skid", [-146, -52, 0], [-107, -28, 3], { tone: "lo" }, { r: 1.2, steps: 3, bevel: 0.4, extra: Dots([[-143, -49], [-110, -49], [-143, -31], [-110, -31]].map(([x, y]) => at([x, y, 3])), { size: 0.45 }) });
box("pump.pedestal", [-137, -44, 3], [-133, -36, 5], { tone: "mid" });
const PX = G.frameOf([-138, -40, 11], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const casing = disc("pump.casing", PX, 0, 8, 6, { tone: "hi" }, { bevel: 0.4 });
disc("pump.bearing", PX, 8, 10, 3, { tone: "mid" }, {});
box("pump.guard", [-128, -43.5, 3], [-123, -36.5, 15], { tone: "mid" }, { r: 0.6, extra: Ln(path3([[-128, -36.5, 9], [-123, -36.5, 9]]), { tone: "faint" }) });
box("pump.motorfeet", [-121, -45, 3], [-112, -35, 5.8], { tone: "lo" });
{
  const MF = G.frameOf([-123, -40, 11], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const ribs = Faded(G.ribsOf(MF, 1.2, 11.8, 5.2, 28, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" });
  disc("pump.motor", MF, 0, 13, 5.2, { tone: "mid" }, { extra: ribs });
  disc("pump.motorcap", MF, 13, 14.2, 4, { tone: "mid" }, {});
  box("pump.terminal", [-118, -42, 16.2], [-114, -38, 19], { tone: "mid" });
}
const suction = pipe("feed.suction", [[MANI.x1, -40, 11], [-138, -40, 11]], 1.8, { flow: "crude" });
void suction;
const discharge0 = pad("pump.discharge", casing, [-133, -40, 17], UP, 3, 1.4);

// ---------- fired heater ----------
const FX1 = FUR.x + FUR.w;
const FY1 = FUR.y + FUR.d;
for (const [x, y] of [[FUR.x + 2, FUR.y + 2], [FX1 - 6, FUR.y + 2], [FUR.x + 2, FY1 - 6], [FX1 - 6, FY1 - 6]]) {
  box("fur.leg", [x, y, 0.8], [x + 4, y + 4, FUR.leg], { tone: "mid" });
  box("fur.legplate", [x - 1, y - 1, 0], [x + 5, y + 5, 0.8], { tone: "lo" });
}
box("fur.floor", [FUR.x, FUR.y, FUR.leg], [FX1, FY1, FUR.floor], { tone: "lo" }, { r: 0.6 });
// burner row under the firebox floor, fed by a fuel-gas header
const BURNERS = [-98, -86, -74, -62];
const header = pipe("fuel.header", [[FUR.x + FUR.w, -40, 6], [-103, -40, 6]], 2.6, { flanges: [true, false], blind: [false, true], ends: [true, false], touch: ["fuel.neck*"] });
void header;
box("fuel.regulator", [FUR.x + FUR.w, -45, 0], [FUR.x + FUR.w + 8, -35, 12], { tone: "mid" }, { r: 0.8, extra: Dots([at([FUR.x + FUR.w + 4, -40, 12])], { size: 0.5 }) });
BURNERS.forEach((x) => {
  cyl("fuel.neck", x, -40, 1.3, 6 + Math.sqrt(2.6 ** 2 - 1.3 ** 2) - 0.1, 11, { tone: "mid" }, { steps: 14 });
  cyl("burner", x, -40, 3, 11, FUR.leg, { tone: "mid" }, { steps: 24, inner: Ln(k.sideArc(x, -40, 3, 14, P, 16), { tone: "faint" }) });
});
// radiant box with a cut-away window on the front face
const WIN = { x0: -104, x1: -78, z0: 28, z1: 72, y: FY1, t: 3 };
const coalTones = (n) => n;
void coalTones;
let furnaceWindow = "";
{
  const opening = [[WIN.x0, WIN.y, WIN.z0], [WIN.x1, WIN.y, WIN.z0], [WIN.x1, WIN.y, WIN.z1], [WIN.x0, WIN.y, WIN.z1]];
  const parts = [];
  parts.push(`<clipPath id="rf-fwin"><path d="${path3(opening, true)}"/></clipPath>`);
  parts.push(`<g clip-path="url(#rf-fwin)">`);
  parts.push(`<path class="rf-cavity" d="${path3(opening, true)}"/>`);
  // back wall seams (refractory brick courses)
  // brick courses on the back wall, clipped in screen space to the opening so each ends on its outline
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
  parts.push(Ln([32, 40, 48, 56, 64].map((z) => clipSeg(at([WIN.x0 - 40, FUR.y + 2, z]), at([WIN.x1 + 40, FUR.y + 2, z]))).filter(Boolean).join(""), { tone: "faint", className: "rf-brick" }));
  // radiant coil: vertical tubes along the back wall
  for (let x = FUR.x + 5; x < FX1 - 3; x += 4.4) parts.push(S(k.cylinder(x, FUR.y + 4.5, 1.4, FUR.floor, FUR.roof - FUR.floor, P, 12), { tone: "lo", crease: "none" }));
  // flames: one per burner, rising from the floor (drawn in world space, flickered by the page)
  BURNERS.forEach((x, i) => {
    const base = at([x, -40, FUR.floor]);
    const tip = at([x, -40, FUR.floor + 26]);
    const w = 3.4 * KS;
    const h = base[1] - tip[1];
    const d = `M${f2(base[0] - w)} ${f2(base[1])}C${f2(base[0] - w)} ${f2(base[1] - h * 0.45)} ${f2(base[0] - w * 0.25)} ${f2(base[1] - h * 0.7)} ${f2(tip[0])} ${f2(tip[1])}C${f2(base[0] + w * 0.25)} ${f2(base[1] - h * 0.7)} ${f2(base[0] + w)} ${f2(base[1] - h * 0.45)} ${f2(base[0] + w)} ${f2(base[1])}Z`;
    parts.push(`<path class="rf-flame" data-flame="${i}" style="transform-origin:${f2(base[0])}px ${f2(base[1])}px" d="${d}"/>`);
  });
  // jambs: the cut through the wall (left side and sill face the viewer)
  const jamb = [[WIN.x0, WIN.y, WIN.z0], [WIN.x0, WIN.y, WIN.z1], [WIN.x0, WIN.y - WIN.t, WIN.z1], [WIN.x0, WIN.y - WIN.t, WIN.z0]];
  const sill = [[WIN.x0, WIN.y, WIN.z0], [WIN.x1, WIN.y, WIN.z0], [WIN.x1, WIN.y - WIN.t, WIN.z0], [WIN.x0, WIN.y - WIN.t, WIN.z0]];
  parts.push(`<path class="iso-shade" data-shade="2" d="${path3(jamb, true)}"/>`);
  parts.push(`<path class="iso-top" d="${path3(sill, true)}"/>`);
  parts.push(`</g>`);
  parts.push(Ln(path3(opening, true), { tone: "lo" }));
  parts.push(Ln(path3([[WIN.x0 - 2, WIN.y, WIN.z0 - 2], [WIN.x1 + 2, WIN.y, WIN.z0 - 2], [WIN.x1 + 2, WIN.y, WIN.z1 + 2], [WIN.x0 - 2, WIN.y, WIN.z1 + 2]], true), { tone: "faint" }));
  furnaceWindow = parts.join("");
}
{
  const seams = [41, 61].map((z) => Ln(k.sideSeam({ x: FUR.x, y: FUR.y, w: FUR.w, d: FUR.d, r: 0.6 }, z, P, 2), { tone: "faint" })).join("");
  const stiff = Ln([-48, -32].map((y) => path3([[FX1, y, FUR.floor], [FX1, y, FUR.roof]])).join("") + path3([[-66, FY1, FUR.floor], [-66, FY1, FUR.roof]]), { tone: "faint" });
  box("fur.radiant", [FUR.x, FUR.y, FUR.floor], [FX1, FY1, FUR.roof], { tone: "mid" }, { r: 0.6, bevel: 0.6, inner: seams + stiff, extra: furnaceWindow });
}
// peep doors on the outlet face
for (const y of [-56, -24]) for (const z of [32, 50]) box("fur.peep", [FX1, y - 2.5, z], [FX1 + 0.8, y + 2.5, z + 4], { tone: "mid" }, { extra: Dots([at([FX1 + 0.8, y, z + 2])], { size: 0.4, tone: "lo" }) });
// convection section, return-bend boxes, hood and stack
const CONV = { x: -96, y: -54, w: 28, d: 28, z0: FUR.roof, z1: 105 };
box("conv.bank", [CONV.x, CONV.y, CONV.z0], [CONV.x + CONV.w, CONV.y + CONV.d, CONV.z1], { tone: "mid" }, { r: 0.6, bevel: 0.5, inner: Ln(k.sideSeam({ x: CONV.x, y: CONV.y, w: CONV.w, d: CONV.d, r: 0.6 }, 93, P, 2), { tone: "faint" }) });
for (const y of [CONV.y - 4, CONV.y + CONV.d]) box("conv.bends", [CONV.x + 2, y, 84], [CONV.x + CONV.w - 2, y + 4, 102], { tone: "lo" }, { r: 0.6, extra: Dots([CONV.x + 5, CONV.x + CONV.w - 5].map((x) => at([x, y + 4, 99])), { size: 0.4 }) });
box("stack.hood", [-90, -48, CONV.z1], [-74, -32, 109], { tone: "mid" }, { r: 1 });
const STK = { x: -82, y: -40, r: 6 };
cyl("stack.lower", STK.x, STK.y, STK.r, 109, 118, { tone: "mid" }, { steps: 32 });
cyl("stack.damper", STK.x, STK.y, STK.r + 1, 118, 121, { tone: "lo" }, { steps: 32 });
cyl("stack.mid", STK.x, STK.y, STK.r, 121, 159, { tone: "mid" }, { steps: 32, inner: Ln(k.sideArc(STK.x, STK.y, STK.r, 140, P, 20), { tone: "faint" }) });
cyl("stack.platform", STK.x, STK.y, 13, 159, 160.4, { tone: "lo" }, { steps: 48, extra: Ln(k.ring(STK.x, STK.y, 12, 160.4, P, 48), { tone: "faint" }) });
cyl("stack.upper", STK.x, STK.y, STK.r, 160.4, 196, { tone: "mid" }, { steps: 32, inner: Ln(k.sideArc(STK.x, STK.y, STK.r, 178, P, 20), { tone: "faint" }) });
cyl("stack.lip", STK.x, STK.y, STK.r + 0.8, 196, 198, { tone: "mid" }, { steps: 32, extra: Ln(k.ring(STK.x, STK.y, STK.r - 0.6, 198, P, 32), { tone: "lo" }) });
{
  const posts = 8;
  for (let i = 0; i < posts; i++) {
    const t = (i / posts) * Math.PI * 2 + 0.2;
    cyl("stack.post", STK.x + 12.2 * Math.cos(t), STK.y + 12.2 * Math.sin(t), 0.45, 160.4, 166.6, { tone: "mid" }, { steps: 8 });
  }
  const ringPts = Array.from({ length: 49 }, (_, i) => { const t = (i / 48) * Math.PI * 2; return [STK.x + 12.2 * Math.cos(t), STK.y + 12.2 * Math.sin(t), 167]; });
  R.route("stack.rail", ringPts, 0.45, { closed: true, touch: ["stack.post*"], piece: "cdu" });
  tubePieces(ringPts, 0.45, P, { closed: true, maxLength: 8, spacing: 0.6 }).forEach((piece, index) => put(`stack.rail:${index}`, piece.mid, tubeSvg(piece, { tone: "mid" }), [A.tube(piece.points, piece.radii)], { route: "stack.rail", chunk: index }));
}
// ladder from the convection roof up past the platform
{
  const y = CONV.y + CONV.d - 1.2;
  const xs = [STK.x - 2.6, STK.x + 2.6];
  // the ladder stands off the platform rim; rails rise from the roof to above the platform
  const ly = STK.y + 13.6;
  void y;
  xs.forEach((x) => box("ladder.rail", [x - 0.4, ly - 0.4, CONV.z1], [x + 0.4, ly + 0.4, 168], { tone: "mid" }, { r: 0.1 }));
  const rungs = [];
  for (let z = CONV.z1 + 4; z < 166; z += 4.2) rungs.push(path3([[xs[0] + 0.4, ly + 0.4, z], [xs[1] - 0.4, ly + 0.4, z]]));
  put("ladder.rungs", [STK.x, ly + 0.5, 136], Ln(rungs.join(""), { tone: "lo" }), [record(A.box([xs[0], ly - 0.3, CONV.z1 + 3], [xs[1], ly + 0.4, 166], { name: "ladder.rungs" }))], { bias: 0.2 });
  box("ladder.bracket", [xs[0] - 0.4, STK.y + 6, 140], [xs[1] + 0.4, ly - 0.4, 141], { tone: "lo" }, { r: 0.1 });
}
const convIn = [CONV.x, -40, 99];
pipe("feed.riser", [discharge0, [-133, -40, 99], convIn], 1.8, { flow: "crude", bend: 3.2 });

// ---------- atmospheric column ----------
const CF = G.frameOf([COL.x, COL.y, 0], UP, [1, 0, 0], [0, 1, 0]);
cyl("col.base", COL.x, COL.y, COL.r + 3.5, 0, 2.5, { tone: "lo" }, { steps: 64, extra: Dots(G.dotsOf(CF, 2.5, COL.r + 2, 12, P, { all: true }), { size: 0.55, tone: "mid" }) });
const skirtOpen = (() => {
  // an access opening in the skirt, facing the viewer
  const t0 = towardA - 0.55;
  const pts = [];
  const rr = COL.r + 0.05;
  for (let i = 0; i <= 12; i++) { const t = t0 - 0.22 + (0.44 * i) / 12; pts.push([COL.x + rr * Math.cos(t), COL.y + rr * Math.sin(t), 6]); }
  for (let i = 0; i <= 12; i++) { const t = t0 + 0.22 - (0.44 * i) / 12; pts.push([COL.x + rr * Math.cos(t), COL.y + rr * Math.sin(t), 24]); }
  return `<path class="rf-cavity" d="${path3(pts, true)}"/>` + Ln(path3(pts, true), { tone: "lo" });
})();
const skirt = cyl("col.skirt", COL.x, COL.y, COL.r, 2.5, COL.skirt, { tone: "mid" }, { steps: 64, inner: skirtOpen + Ln(k.sideArc(COL.x, COL.y, COL.r, COL.skirt - 3, P, 40), { tone: "faint" }) });
// shell courses; the 182-232 course carries the cut-away window
const COURSES = [34, 64, 94, 124, 154, 182, 240, COL.top];
const WCOL = { z0: 182, z1: 232, t0: towardA - 0.62, t1: towardA + 0.62 };
const TRAY_DZ = (COL.top - COL.skirt) / COLUMN.drawnTrays;
const trayZ = Array.from({ length: COLUMN.drawnTrays }, (_, i) => COL.skirt + 3 + i * TRAY_DZ);
function columnWindow() {
  const rr = COL.r;
  const n = 24;
  const ring = (z, r = rr, a0 = WCOL.t0, a1 = WCOL.t1) => Array.from({ length: n + 1 }, (_, i) => { const t = a0 + ((a1 - a0) * i) / n; return [COL.x + r * Math.cos(t), COL.y + r * Math.sin(t), z]; });
  const opening = [...ring(WCOL.z0), ...ring(WCOL.z1).reverse()];
  const parts = [`<clipPath id="rf-cwin"><path d="${path3(opening, true)}"/></clipPath>`, `<g clip-path="url(#rf-cwin)">`, `<path class="rf-cavity" d="${path3(opening, true)}"/>`];
  // inside: trays seen from above, bottom to top, each with its downcomer hanging below
  const inner = rr - 0.6;
  const full = (z) => Array.from({ length: 49 }, (_, i) => { const t = (i / 48) * Math.PI * 2; return [COL.x + inner * Math.cos(t), COL.y + inner * Math.sin(t), z]; });
  trayZ.filter((z) => z > WCOL.z0 - 10 && z < WCOL.z1 + 2).forEach((z, i) => {
    const side = i % 2 ? 1 : -1;
    // downcomer: a chord plate across the column, hanging from this tray
    const cx = COL.x + side * inner * 0.62;
    const half = Math.sqrt(inner ** 2 - (inner * 0.62) ** 2);
    const dc = [[cx, COL.y - half, z], [cx, COL.y + half, z], [cx, COL.y + half, z - TRAY_DZ * 0.7], [cx, COL.y - half, z - TRAY_DZ * 0.7]];
    parts.push(`<path class="iso-shade" data-shade="1" d="${path3(dc, true)}"/>` + Ln(path3(dc, true), { tone: "lo" }));
    parts.push(`<path class="rf-tray" d="${path3(full(z), true)}"/>` + Ln(path3(full(z), true), { tone: "lo" }));
    // valve caps on the active area
    const caps = [];
    for (let a = -10; a <= 10; a += 4) for (let b = -10; b <= 10; b += 4) {
      const x = COL.x + a + side * -2;
      const y = COL.y + b;
      if (Math.hypot(a + side * -2, b) < inner - 3 && side * (x - cx) < -2) caps.push(at([x, y, z]));
    }
    parts.push(Dots(caps, { size: 0.35, tone: "lo" }));
    // outlet weir: the downcomer plate standing 1.2 above the tray
    const weir = [[cx, COL.y - half, z], [cx, COL.y + half, z], [cx, COL.y + half, z + 1.2], [cx, COL.y - half, z + 1.2]];
    parts.push(`<path class="iso-shade" data-shade="2" d="${path3(weir, true)}"/>` + Ln(path3(weir, true), { tone: "lo" }));
  });
  parts.push(`</g>`);
  // the cut edges: sill (a ring band seen from above) and the left jamb
  const sill = [...ring(WCOL.z0, rr), ...ring(WCOL.z0, rr - 1.2).reverse()];
  parts.push(`<path class="iso-top" d="${path3(sill, true)}"/>`);
  const ja = WCOL.t0;
  const jamb = [[COL.x + rr * Math.cos(ja), COL.y + rr * Math.sin(ja), WCOL.z0], [COL.x + rr * Math.cos(ja), COL.y + rr * Math.sin(ja), WCOL.z1], [COL.x + (rr - 1.2) * Math.cos(ja), COL.y + (rr - 1.2) * Math.sin(ja), WCOL.z1], [COL.x + (rr - 1.2) * Math.cos(ja), COL.y + (rr - 1.2) * Math.sin(ja), WCOL.z0]];
  parts.push(`<path class="iso-shade" data-shade="2" d="${path3(jamb, true)}"/>`);
  parts.push(Ln(path3(opening, true), { tone: "mid" }));
  return parts.join("");
}
const SHELL = [];
for (let i = 0; i < COURSES.length - 1; i++) {
  const [z0, z1] = [COURSES[i], COURSES[i + 1]];
  const win = z0 === WCOL.z0 ? columnWindow() : "";
  SHELL.push(cyl(`col.course${i}`, COL.x, COL.y, COL.r, z0, z1, { tone: "hi", crease: "lo" }, { steps: 72, extra: win }));
}
// top head: 2:1 ellipsoidal, analytic profile
const headR = (s) => COL.r * Math.sqrt(Math.max(0, 1 - (s / COL.head) ** 2));
const headSlope = (s) => (s >= COL.head ? -1e3 : (-COL.r * (s / COL.head ** 2)) / Math.sqrt(Math.max(1e-6, 1 - (s / COL.head) ** 2)));
const HF = G.frameOf([COL.x, COL.y, COL.top], UP, [1, 0, 0], [0, 1, 0]);
const headProfile = Array.from({ length: 25 }, (_, i) => { const s = COL.head * Math.sin((i / 24) * (Math.PI / 2)); return [s, headR(s), 1]; });
headProfile[24] = [COL.head, 0, 1];
const head = turned("col.head", HF, headProfile, { tone: "hi", crease: "lo" }, { smooth: { slope: headSlope, radius: headR } });
// nozzles
const colHosts = [...SHELL];
const nozzleOn = (name, z, angle, a = 3.4, h = 2.6) => pad(name, colHosts, [COL.x + COL.r * Math.cos(angle), COL.y + COL.r * Math.sin(angle), z], [Math.cos(angle), Math.sin(angle), 0], a, h);
const feedFace = nozzleOn("col.feed", 66, Math.PI, 5.2, 3);
const angTo = (s) => Math.atan2(s.y - COL.y, s.x - COL.x);
const keroFace = nozzleOn("col.kero", 175, angTo(STRIP.kero));
const dieselFace = nozzleOn("col.diesel", 130, angTo(STRIP.diesel));
const refluxFace = nozzleOn("col.reflux", DRUM.z, 0, 2.8, 2.4);
const topBoss = (() => {
  const s0 = 7.2;
  const F = G.frameAlong([COL.x, COL.y, COL.top + s0], UP);
  disc("col.topboss", F, 0, 280 - COL.top - s0, 3.9, { tone: "mid" }, { seated: true, cut: [head] });
  return [COL.x, COL.y, 280];
})();
// manways: pad, flange, blind cover with bolts, a davit arm
for (const [z, ang] of [[104, towardA + 0.35], [252, towardA + 0.5]]) {
  const n = [Math.cos(ang), Math.sin(ang), 0];
  const face = nozzleOn("col.manway", z, ang, 5.2, 3);
  const F = G.frameAlong(face, n);
  disc("col.manway.flange", F, 0, 1.2, 6.6, { tone: "mid" }, {});
  disc("col.manway.cover", F, 1.2, 2.4, 6.6, { tone: "hi" }, { extra: Dots(G.dotsOf(F, 2.4, 5.6, 12, P, { all: true }), { size: 0.4, tone: "lo" }) });
}
const bottomsFace = pad("col.bottoms", skirt, [COL.x, COL.y + COL.r, LOW], [0, 1, 0], 3, 2.4);

// ---------- transfer line (heater outlet -> flash zone) ----------
const outletBoss = (() => {
  const F = G.frameAlong([FX1, -40, 66], [1, 0, 0]);
  disc("fur.outlet", F, 0, 2.4, 5.2, { tone: "mid" }, {});
  return [FX1 + 2.4, -40, 66];
})();
box("xfer.post", [-23, -41.5, 1], [-20, -38.5, 61.6], { tone: "mid" }, { r: 0.3 });
box("xfer.postfoot", [-25, -43.5, 0], [-18, -36.5, 1], { tone: "lo" }, { r: 0.3 });
box("xfer.shoe", [-25, -43, 61.6], [-18, -37, 62.6], { tone: "mid" }, { r: 0.2 });
pipe("xfer", [outletBoss, feedFace], 3.2, { flow: "hot", bands: [0.62], bellows: [0.3, 0.38, 5], touch: ["xfer.shoe*", "xfer.post*"] });

// ---------- side strippers ----------
const STRIP_TOP = 100;
const stripperHosts = {};
for (const [id, s] of Object.entries(STRIP)) {
  const SF = G.frameOf([s.x, s.y, 0], UP, [1, 0, 0], [0, 1, 0]);
  cyl(`${id}.strip.base`, s.x, s.y, 8.4, 0, 1.6, { tone: "lo" }, { steps: 40, extra: Dots(G.dotsOf(SF, 1.6, 7.4, 6, P, { all: true }), { size: 0.45, tone: "mid" }) });
  cyl(`${id}.strip.skirt`, s.x, s.y, 6, 1.6, 14, { tone: "mid" }, { steps: 40 });
  const shell = cyl(`${id}.strip.shell`, s.x, s.y, 6, 14, STRIP_TOP, { tone: "hi", crease: "lo" }, { steps: 48, inner: Ln([44, 72].map((z) => k.sideArc(s.x, s.y, 6, z, P, 24)).join(""), { tone: "faint" }) });
  const hr = (q) => 6 * Math.sqrt(Math.max(0, 1 - (q / 3) ** 2));
  const hs = (q) => (q >= 3 ? -1e3 : (-6 * (q / 9)) / Math.sqrt(Math.max(1e-6, 1 - (q / 3) ** 2)));
  const prof = Array.from({ length: 17 }, (_, i) => { const q = 3 * Math.sin((i / 16) * (Math.PI / 2)); return [q, hr(q), 1]; });
  prof[16] = [3, 0, 1];
  const hd = turned(`${id}.strip.head`, G.frameOf([s.x, s.y, STRIP_TOP], UP, [1, 0, 0], [0, 1, 0]), prof, { tone: "hi", crease: "lo" }, { smooth: { slope: hs, radius: hr } });
  disc(`${id}.strip.topboss`, G.frameAlong([s.x, s.y, STRIP_TOP + 2.6], UP), 0, 6.4, 3, { tone: "mid" }, { seated: true, cut: [hd] });
  stripperHosts[id] = { shell, top: [s.x, s.y, STRIP_TOP + 9] };
  // stripping steam stub with a blind flange
  const steam = pad(`${id}.strip.steam`, shell, [s.x + 6, s.y, 30], [1, 0, 0], 1.8, 1.2);
  pipe(`${id}.strip.steamline`, [steam, G.add3(steam, [6, 0, 0])], 1, { flanges: [true, false], blind: [false, true], ends: [true, false] });
}
pipe("draw.diesel", [dieselFace, [STRIP.diesel.x, STRIP.diesel.y, 130], stripperHosts.diesel.top], 1.8, { flow: "diesel", bend: 3 });
pipe("draw.kero", [keroFace, [STRIP.kero.x, STRIP.kero.y, 175], stripperHosts.kero.top], 1.8, { flow: "kero", bend: 3 });

// ---------- overhead: platform, condenser, reflux drum ----------
const DX1 = DECK.x + DECK.w;
const DY1 = DECK.y + DECK.d;
for (const y of [COL.y - 6, COL.y + 6]) {
  const xs = COL.x + Math.sqrt(COL.r ** 2 - (y - COL.y) ** 2);
  const face = pad("deck.clip", SHELL, [xs, y, DECK.z - 3.5], [1, 0, 0], 4, 1.4, {}, { ring: false });
  box("deck.beam", [face[0], y - 1.5, DECK.z - 7], [DX1 - 2, y + 1.5, DECK.z], { tone: "lo" }, { r: 0.2 });
}
box("deck.plate", [DECK.x, DECK.y, DECK.z], [DX1, DY1, DECK.z + DECK.t], { tone: "mid" }, { r: 0.6, bevel: 0.4, extra: Ln(k.planOutline(k.insetPlan({ x: DECK.x, y: DECK.y, w: DECK.w, d: DECK.d, r: 0.6 }, 2.2), DECK.z + DECK.t, P, 2), { tone: "faint" }) });
// handrail along the back edge
{
  const y = DECK.y + 0.8;
  for (const x of [DECK.x + 3, DECK.x + 28, DX1 - 3]) cyl("deck.post", x, y, 0.5, DECK.z + DECK.t, DECK.z + 12, { tone: "mid" }, { steps: 8 });
  box("deck.toprail", [DECK.x + 2, y - 0.5, DECK.z + 12], [DX1 - 2, y + 0.5, DECK.z + 13], { tone: "mid" }, { r: 0.1 });
  box("deck.midrail", [DECK.x + 3.5, y - 0.35, DECK.z + 7], [DX1 - 3.5, y + 0.35, DECK.z + 7.7], { tone: "lo" }, { r: 0.1 });
}
// reflux drum on two saddles
const DZ = DECK.z + DECK.t;
for (const x of [66, 84]) box("drum.saddle", [x, DRUM.y - 5, DZ], [x + 4, DRUM.y + 5, DRUM.z - DRUM.r], { tone: "lo" }, { r: 0.2 });
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
const DF = G.frameOf([DRUM.x0, DRUM.y, DRUM.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const dv = vessel(DRUM.x1 - DRUM.x0, DRUM.r, DRUM.head);
const drum = turned("drum", DF, dv.prof, { tone: "hi", crease: "lo" }, { smooth: { slope: dv.slope, radius: dv.radius }, inner: Ln(G.arcOf(DF, DRUM.head + 0.2, DRUM.r, P) + G.arcOf(DF, DRUM.x1 - DRUM.x0 - DRUM.head - 0.2, DRUM.r, P), { tone: "faint" }) });
// condenser on a frame above the drum
const FRAME_Z = 262;
for (const x of [66, 86]) for (const y of [DRUM.y - 11, DRUM.y + 11]) box("cond.leg", [x - 1, y - 1, DZ], [x + 1, y + 1, FRAME_Z], { tone: "mid" }, { r: 0.2 });
for (const x of [66, 86]) box("cond.beam", [x - 1.5, DRUM.y - 12.5, FRAME_Z], [x + 1.5, DRUM.y + 12.5, FRAME_Z + 2], { tone: "lo" }, { r: 0.2 });
const CZ = FRAME_Z + 2 + COND.r;
const CFm = G.frameOf([COND.x0, COND.y, CZ], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const cv = vessel(COND.x1 - COND.x0, COND.r, COND.head);
const SC = COND.x1 - COND.head - 4 - COND.x0;
const profA = [...cv.prof.filter(([q]) => q < SC - 0.01), [SC, COND.r]];
const profB = [[SC + 1.4, COND.r], ...cv.prof.filter(([q]) => q > SC + 1.41)];
const cond = turned("cond", CFm, profA, { tone: "hi", crease: "lo" }, { smooth: { slope: cv.slope, radius: cv.radius } });
turned("cond.bonnet", CFm, profB, { tone: "hi", crease: "lo" }, { smooth: { slope: cv.slope, radius: cv.radius } });
disc("cond.channel", CFm, SC, SC + 1.4, COND.r + 1.2, { tone: "mid" }, { extra: Dots(G.dotsOf(CFm, SC + 1.4, COND.r + 0.6, 12, P, { fade: [0.04, 0.42] }), { size: 0.35, tone: "lo" }) });
// cooling-water stubs on the condenser
for (const x of [70, 82]) {
  const f = pad("cond.cw", cond, [x, COND.y, CZ + COND.r], UP, 1.5, 1);
  pipe("cond.cwline", [f, G.add3(f, [0, 0, 4])], 0.9, { flanges: [true, false], blind: [false, true], ends: [true, false] });
}
const vapIn = pad("cond.in", cond, [62, COND.y, CZ + COND.r], UP, 3.9, 1.6);
const condOut = pad("cond.out", cond, [81, COND.y, CZ - COND.r], [0, 0, -1], 2.6, 1.2);
const drumIn = pad("drum.in", drum, [81, DRUM.y, DRUM.z + DRUM.r], UP, 2.6, 1.2);
const lpgOut = pad("drum.gas", drum, [80, DRUM.y + DRUM.r, DRUM.z], [0, 1, 0], 1.9, 1.2);
const refluxOut = (() => {
  const F = G.frameAlong([DRUM.x0 + 0.6, DRUM.y, DRUM.z], [-1, 0, 0]);
  disc("drum.reflux", F, 0, 2.2, 2.6, { tone: "mid" }, { seated: true, cut: [drum] });
  return [DRUM.x0 - 1.6, DRUM.y, DRUM.z];
})();
const naphOut = (() => {
  const F = G.frameAlong([DRUM.x1 - 0.6, DRUM.y, DRUM.z], [1, 0, 0]);
  disc("drum.naphtha", F, 0, 2.2, 2.6, { tone: "mid" }, { seated: true, cut: [drum] });
  return [DRUM.x1 + 1.6, DRUM.y, DRUM.z];
})();
pipe("overhead", [topBoss, [COL.x, COL.y, 294], [vapIn[0], COND.y, 294], vapIn], 2.4, { flow: "vapour", bend: 2.6 });
pipe("cond.drop", [condOut, drumIn], 1.6, {});
pipe("reflux", [refluxOut, refluxFace], 1.6, { flow: "naphtha" });

// ---------- product sight glasses on a rack ----------
const GX = GLASS.xs;
const RACK = { x0: GX.resid - 10, x1: GX.lpg + 12, y0: GLASS.y - 9, y1: GLASS.y + 9, z0: 12, z1: 15 };
for (const x of [RACK.x0 + 1, (RACK.x0 + RACK.x1) / 2 - 1.5, RACK.x1 - 4]) for (const y of [RACK.y0 + 1, RACK.y1 - 4]) box("rack.leg", [x, y, 0], [x + 3, y + 3, RACK.z0], { tone: "mid" }, { r: 0.3 });
box("rack.deck", [RACK.x0, RACK.y0, RACK.z0], [RACK.x1, RACK.y1, RACK.z1], { tone: "lo" }, { r: 0.8, bevel: 0.4 });
box("rack.sleeper", [GX.resid - 8, 10, 0], [GX.lpg + 8, 16, LOW - 2.9], { tone: "lo" }, { r: 0.4 });
const GLASSES = [];
for (const cut of CUTS) {
  const gx = GX[cut.id];
  const gy = GLASS.y;
  const b = GLASS.block / 2;
  box(`glass.${cut.id}.base`, [gx - b, gy - b, RACK.z1], [gx + b + 3, gy + b, GLASS.z0], { tone: "mid" }, { r: 0.6, bevel: 0.4, extra: Dots([at([gx + b + 1.5, gy + b - 1.5, GLASS.z0])], { size: 0.4 }) });
  box(`glass.${cut.id}.cap`, [gx - b, gy - b, GLASS.z0 + GLASS.h], [gx + b + 3, gy + b, GLASS.z0 + GLASS.h + 5], { tone: "mid" }, { r: 0.6, bevel: 0.4, extra: Dots([at([gx + b + 1.5, gy + b - 1.5, GLASS.z0 + GLASS.h + 5])], { size: 0.4 }) });
  cyl(`glass.${cut.id}.vent`, gx - 1.5, gy - 1.5, 1.2, GLASS.z0 + GLASS.h + 5, GLASS.z0 + GLASS.h + 7.5, { tone: "mid" }, { steps: 14 });
  // glass tube with liquid (liquid paths are rebuilt by the page)
  const glass = k.cylinder(gx, gy, GLASS.r, GLASS.z0, GLASS.h, P, 40);
  const liq = k.cylinder(gx, gy, GLASS.r - 0.5, GLASS.z0, 0.01, P, 32);
  const shine = Ln(path3([[gx + GLASS.r * Math.cos(towardA - 0.9), gy + GLASS.r * Math.sin(towardA - 0.9), GLASS.z0], [gx + GLASS.r * Math.cos(towardA - 0.9), gy + GLASS.r * Math.sin(towardA - 0.9), GLASS.z0 + GLASS.h]]), { tone: "faint", className: "rf-shine" });
  const svg = [
    `<path class="rf-glass" d="${glass.fill}"/>`,
    `<g class="rf-liq" data-cut="${cut.id}"><path class="rf-liq-body" d="${liq.fill}"/><path class="rf-liq-top" d="${liq.top}"/></g>`,
    cut.id === "resid" ? `<g class="rf-liq" data-cut="vr"><path class="rf-liq-body" d="${liq.fill}"/><path class="iso-line rf-liq-edge" d=""/></g>` : "",
    shine,
    `<path class="iso-line iso-edge" data-tone="mid" d="${glass.outline}"/>`,
  ].join("");
  put(`glass.${cut.id}.tube`, [gx, gy, GLASS.z0 + GLASS.h / 2], svg, [record(A.cylinder(gx, gy, GLASS.r, GLASS.z0, GLASS.h, { name: `glass.${cut.id}.tube` }))]);
  // guard rods at the two screen-side corners
  for (const side of [1, -1]) cyl(`glass.${cut.id}.rod`, gx + side * 6.5 * Math.sin(towardA), gy - side * 6.5 * Math.cos(towardA), 0.55, GLASS.z0, GLASS.z0 + GLASS.h, { tone: "mid" }, { steps: 8 });
  // graduated scale plate 0-60 % vol, ticks every 5, major every 10, rooted on the plate's left edge
  const sx0 = gx + b + 0.6;
  const sx1 = gx + b + 2.6;
  const ticks = [];
  for (let p = 0; p <= SCALE_MAX; p += 5) {
    const z = GLASS.z0 + (p / SCALE_MAX) * GLASS.h;
    const len = p % 10 ? 0.9 : 1.7;
    ticks.push({ d: path3([[sx0, gy + b, z], [sx0 + len, gy + b, z]]), major: !(p % 10) });
  }
  const scale = Ln(ticks.filter((t) => !t.major).map((t) => t.d).join(""), { tone: "lo" }) + Ln(ticks.filter((t) => t.major).map((t) => t.d).join(""), { tone: "mid" });
  box(`glass.${cut.id}.scale`, [sx0, gy + b - 1.4, GLASS.z0], [sx1, gy + b, GLASS.z0 + GLASS.h], { tone: "mid" }, { r: 0.1, extra: scale + `<path class="rf-mark" data-mark="${cut.id}" d=""/>` });
  GLASSES.push({ id: cut.id, gx, gy, sx0, face: gy + b });
}
// rundown lines into the base blocks (from -y)
const inletOf = (id) => [GX[id], GLASS.y - GLASS.block / 2, LOW];
pipe("run.resid", [bottomsFace, inletOf("resid")], 1.9, { flow: "resid" });
for (const id of ["diesel", "kero"]) {
  const s = STRIP[id];
  const f = pad(`${id}.strip.out`, stripperHosts[id].shell, [s.x, s.y + 6, LOW], [0, 1, 0], 2.4, 1.6);
  pipe(`run.${id}`, [f, inletOf(id)], 1.5, { flow: id });
}
pipe("run.naphtha", [naphOut, [GX.naphtha, DRUM.y, DRUM.z], [GX.naphtha, DRUM.y, LOW], inletOf("naphtha")], 1.5, { flow: "naphtha", bend: 3 });
pipe("run.lpg", [lpgOut, [80, -14, DRUM.z], [GX.lpg, -14, DRUM.z], [GX.lpg, -14, LOW], inletOf("lpg")], 1.2, { flow: "lpg", bend: 3 });
// residue stub: leaves the residue glass toward the vacuum unit / cracker, ends on a coloured blind flange
{
  const g = GLASSES[4];
  const from = [g.gx - GLASS.block / 2, g.gy, LOW];
  void from;
}
pipe("resid.stub", [[GX.resid - GLASS.block / 2, GLASS.y, 21], [GX.resid - 40, GLASS.y, 21]], 1.9, { flanges: [true, false], blind: [false, true], ends: [true, false], flow: "resid", bands: [0.5] });

// barrels' valves (after pipes so their gaps exist): ball + stem + lever
const VALVES = [];
BARRELS.forEach(({ vc, i }) => {
  cyl(`barrel${i}.stem`, vc[0], vc[1], 0.55, vc[2] + 2.3, vc[2] + 4.4, { tone: "mid" }, { steps: 8, extra: `<path class="iso-line rf-lever" data-lever="${i}" data-free="end" d=""/>` });
  VALVES.push({ i, top: [vc[0], vc[1], vc[2] + 4.4] });
});

// ---------- settle and assemble ----------
A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);
const groups = R.items.map((item) => `<g class="it" data-name="${item.name}"${item.attrs ?? ""}>${item.svg}</g>`);
// hit areas over the barrels
const hits = BARREL.ys.map((y, i) => {
  const pts = [];
  for (let t = 0; t < 24; t++) { const a = (t / 24) * Math.PI * 2; pts.push(at([BARREL.x + 13 * Math.cos(a), y + 13 * Math.sin(a), 0])); pts.push(at([BARREL.x + 13 * Math.cos(a), y + 13 * Math.sin(a), 42])); }
  const hull = G.hullOf(pts);
  return `<path class="rf-hit" data-pick="${i}" d="${k.pathOf(hull, true)}"/>`;
});

const LABEL =
  "A bench model of a crude distillation unit: three crude barrels on a skid feed a charge pump; the pump sends crude through the convection and radiant coils of a box furnace with four burners and a stack; a transfer line carries it to a tall atmospheric column, seen through a cut-away window with its trays. An overhead condenser and reflux drum sit on a platform at the top; kerosene and diesel are drawn off to two side strippers; the residue leaves through the skirt. Five sight glasses on a rack show the share of each product for the crude selected.";
const svg = k.figureSvg({ width: W, height: H, label: LABEL, body: [...back, `<g class="rf-items">${groups.join("")}</g>`, `<g class="rf-hits">${hits.join("")}</g>`] });

const CSS = `
.rf-stage{--crude:#E8913A;--c-lpg:#9DB0C6;--c-naphtha:#A6C94A;--c-kero:#E9ECEF;--c-diesel:#4FA8E0;--c-resid:#A07E5C;--c-vr:#4E3626;--c-hot:#E8913A;touch-action:pan-y;outline:none}
.iso[data-theme="light"] .rf-stage{--c-lpg:#7F93AB;--c-kero:#C9CED6;--c-resid:#9A7652;--c-vr:#3F2A1C}
.rf-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
.rf-cavity{fill:#07080a}
.iso[data-theme="light"] .rf-cavity{fill:#3a3631}
.rf-tray{fill:#1a1b1e}
.iso[data-theme="light"] .rf-tray{fill:#77726b}
.iso[data-theme="light"] .rf-cavity ~ .iso-line[data-tone="lo"],.iso[data-theme="light"] .rf-tray + .iso-line{stroke:#2a2724}
.rf-glass{fill:var(--anatomy-paper);opacity:.92}
.rf-band{fill:var(--c);opacity:.28;transition:opacity .5s var(--anatomy-ease)}
.rf-band[data-on]{opacity:.95}
.rf-liq-body{fill:var(--c);opacity:.85}
.rf-liq-top{fill:var(--c);opacity:1;filter:brightness(1.25)}
.rf-liq[data-cut="lpg"]{--c:var(--c-lpg)}.rf-liq[data-cut="naphtha"]{--c:var(--c-naphtha)}.rf-liq[data-cut="kero"]{--c:var(--c-kero)}.rf-liq[data-cut="diesel"]{--c:var(--c-diesel)}.rf-liq[data-cut="resid"]{--c:var(--c-resid)}.rf-liq[data-cut="vr"]{--c:var(--c-vr)}.rf-liq[data-cut="vr"] .rf-liq-body{opacity:1}.rf-liq-edge{stroke:var(--c-vr);filter:brightness(1.3);fill:none}
.rf-mark{fill:none;stroke:var(--anatomy-lit);stroke-width:1;stroke-linecap:round}
.rf-lever{stroke:var(--anatomy-mid);stroke-width:1.4;stroke-linecap:round;fill:none}
.rf-lever[data-on]{stroke:var(--anatomy-lit)}
.it[data-flow] .tb-body{fill:color-mix(in srgb,var(--c) 30%,var(--anatomy-paper))}
.it[data-flow] .tb-shine{fill:color-mix(in srgb,var(--c) 45%,var(--anatomy-paper))}
.it[data-flow="crude"],.it[data-flow^="branch"]{--c:var(--crude)}
.it[data-flow^="branch"] .tb-body{fill:var(--anatomy-paper);transition:fill .5s}
.it[data-flow^="branch"][data-on] .tb-body{fill:color-mix(in srgb,var(--c) 45%,var(--anatomy-paper))}
.it[data-flow="hot"]{--c:var(--c-hot)}.it[data-flow="vapour"]{--c:var(--c-lpg)}.it[data-flow="lpg"]{--c:var(--c-lpg)}.it[data-flow="naphtha"]{--c:var(--c-naphtha)}.it[data-flow="kero"]{--c:var(--c-kero)}.it[data-flow="diesel"]{--c:var(--c-diesel)}.it[data-flow="resid"]{--c:var(--c-resid)}
.it[data-flow="resid"] .iso-fill{fill:color-mix(in srgb,var(--c) 55%,var(--anatomy-paper))}
.rf-flame{fill:url(#rf-fire);mix-blend-mode:screen;opacity:.9}
.iso[data-theme="light"] .rf-flame{mix-blend-mode:normal}
.rf-hit{fill:transparent;cursor:pointer}
.iso-page{width:100%!important;max-width:720px;margin:0 auto!important}
body{margin:0}
.iso-plate-corner[data-corner="hint"]{top:17px;bottom:auto!important}
.iso-plate-corner[data-corner="readout"]{left:0;white-space:normal;text-align:right;line-height:1.45}
@media (max-width:560px){.iso-plate{padding-bottom:64px!important}}
.rf-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
`;
const GRAD = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="rf-fire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff2c4"/><stop offset=".35" stop-color="#ffb347"/><stop offset=".75" stop-color="#e8613a" stop-opacity=".75"/><stop offset="1" stop-color="#c0392b" stop-opacity="0"/></linearGradient></defs></svg>`;

const DATA = {
  P,
  crudes: CRUDES,
  cuts: CUTS.map((c) => c.id),
  scaleMax: SCALE_MAX,
  glass: { z0: GLASS.z0, h: GLASS.h, r: GLASS.r - 0.5, outer: GLASS.r },
  glasses: GLASSES,
  valves: VALVES,
  furnace: FURNACE,
};
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA)).replace("__READOUT__", readout.toString());

const start = CRUDES[0];
const body =
  `<style>${CSS}</style>${GRAD}` +
  k.plateHtml({
    fig: FIG,
    title: "Crude distillation unit",
    hint: "Click a barrel · ← →",
    readout: readout(start),
    keys: [
      { mark: "lit", label: "Sight glasses: straight-run yield of the crude selected, wt %, 0–60 scale" },
      { mark: "raised", label: "Barrels, front to back: Brent, Oman, Canadian heavy Synbit" },
      { mark: "edge", label: "Glasses, left to right: residue (vacuum residue dark below), diesel blue, jet pale, naphtha green, LPG grey" },
    ],
    caption: `A crude distillation unit as a bench model (schematic). The charge pump sends crude through the furnace, which heats it to about ${FURNACE.outletC[0]}–${FURNACE.outletC[1]} °C (hotter and it starts to crack); in the column, at about ${COLUMN.barg[0]}–${COLUMN.barg[1]} bar gauge over ${COLUMN.trays[0]}–${COLUMN.trays[1]} trays, the vapour separates by boiling range: LPG, naphtha ${CUTS[1].tbp[0]}–${CUTS[1].tbp[1]} °C, jet ${CUTS[2].tbp[0]}–${CUTS[2].tbp[1]}, gasoil/diesel ${CUTS[3].tbp[0]}–${CUTS[3].tbp[1]} °C, and the residue above ${CUTS[4].tbp[0]} °C leaves through the skirt toward a vacuum unit and cracker. Pick a crude: each glass fills to its straight-run yield in weight % (TotalEnergies assays). Straight-run gasoil is 23–29 % for almost every grade, so most of a refinery's diesel has to be made by cracking the vacuum gasoil and residue, which is why heavy crude needs cracking units and why crude is priced by the diesel that can be got out of it.`,
    body: `<div class="iso-stage rf-stage" tabindex="0" role="group" aria-label="Crude distillation unit. Click a barrel, or use the left and right arrow keys, to choose Brent, Oman or Canadian heavy Synbit; the sight glasses show its straight-run yields.">${svg}<span class="rf-sr" role="status" aria-live="polite" data-status></span></div>`,
  });

const page = k.pageHtml({ title: "Crude distillation unit", theme: THEME, body, script: kitScript() + LIVE, width: 720 });
mkdirSync(OUT, { recursive: true });
const name = THEME === "light" ? "refinery-light.html" : "refinery.html";
writeFileSync(join(OUT, name), page);
console.log("wrote", join(OUT, name), `${(page.length / 1024).toFixed(0)} KB`, `${R.items.length} items`, `${R.solids.length} solids`, `scale ${KS.toFixed(3)}`);
A.auditOrExit(R, P, {});
