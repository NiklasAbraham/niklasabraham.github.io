// VLCC freight figure: a ship model on a display stand, cut open to show the cargo tanks.
// node build.mjs            -> assets/oil-article/anatomy/vlcc.html
// node build.mjs --light    -> assets/oil-article/anatomy/vlcc-light.html
// node build.mjs --audit    -> geometry audit of the deck layer
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/niklas/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/niklas/.claude/skills/anatomy/kit/lathe.mjs";
import * as A from "/home/niklas/.claude/skills/anatomy/kit/audit.mjs";
import { kitScript } from "/home/niklas/.claude/skills/anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..", "..");
const OUT = join(ROOT, "assets", "oil-article", "anatomy");
const theme = process.argv.includes("--light") ? "light" : "dark";

// Crude price for the comparison: WTI monthly average spot (EIA), from the post's pipeline.
const OIL = JSON.parse(readFileSync(join(ROOT, "assets", "oil-article", "oil.json"), "utf8"));
const wtiAt = (month) => ({ month, usd: OIL.monthly.wti[OIL.monthly.t.indexOf(month)] });
const CRUDE = wtiAt(OIL.monthly.t[OIL.monthly.t.length - 1]); // latest month (2026-10: $99.97)
const CRUDE_JAN = wtiAt("2026-01"); // January 2026: $60.04

const WIDTH = 700;
const HEIGHT = 360;

// ---------------------------------------------------------------- world (1 unit = 1 m of the ship)
const L2 = M.LOA_M / 2; // 165
const HB = M.BEAM_M / 2; // 30
const KZ = 16; // keel height above the base plate (cradles)
const DEP = M.DEPTH_M; // 31, main deck
const DH = M.DOUBLE_HULL_M; // 3
const Z = (z) => KZ + z; // hull-local height -> world
const DECK = Z(DEP);
const RAISED = Z(DEP + 3); // poop and forecastle decks
const PLATE = { x: -200, y: -38, w: 400, d: 116, r: 8 };
const PLATE_H = 9;
const FOOT_H = 5;

// Cargo block: slop tanks aft, then 5 rows of 44 m.
const SLOP = [-115, -105];
const ROWS = [-105, -61, -17, 27, 71, 115];
const CUT = [ROWS[1], ROWS[4]]; // rows 2-4 cut open on the near side
const LBH = 11; // longitudinal bulkheads at y = +-11 (centre tank 22 m, wing tanks 16 m)
const INNER = HB - DH; // inner hull at y = 27
const OIL_TOP = DH + M.FILL * (DEP - 1 - DH); // 98 % of the tank height under the 1 m deck

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [-158, 0, Z(64)], [-140, 0, Z(64)], [-180, 44, 54], [166, 30, DECK]],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: 70 },
);
const KS = G.scaleOf(P);

const at = (p) => k.iso(p, P);
const S = (paths, style = {}) => k.solidSvg(paths, style);
const Ln = (d, style = {}) => k.lineSvg(d, style);
const Dt = (points, style) => k.dotsSvg(points, style);
const plan = (x0, x1, y0, y1, r = 0.4) => ({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r });
const box = (x0, x1, y0, y1, z0, z1, { r = 0.4, steps = 3, bevel = 0 } = {}) => k.slabOf(plan(x0, x1, y0, y1, r), z0, z1 - z0, P, steps, bevel);
const depth = (p) => k.depthOf(p, P);
const byDepth = (list, of = (v) => v) => [...list].sort((a, b) => depth(of(a)) - depth(of(b)));
const Y = [0, 1, 0];
const X = [1, 0, 0];
const UP = [0, 0, 1];

// The recorder: hull and stand are ground; deck items are put and their order settled from geometry.
const R = A.recorder(P);
const ground = (shape) => R.solid({ ...shape, ground: true });
const put = (name, centre, svg, shapes, bias = 0) => R.put({ name: R.nameFor(name), at: centre, bias, svg, shapes: shapes.map((s) => R.solid({ ...s, name: s.name ?? name })) });
const aSlab = (x0, x1, y0, y1, z0, z1, meta = {}) => A.box([x0, y0, z0], [x1, y1, z1], meta);

// ---------------------------------------------------------------- hull plan outlines
const sample = (from, to, n, f) => Array.from({ length: n + 1 }, (_, i) => f(from + ((to - from) * i) / n));
// Bow: full-bodied VLCC bow, half-breadth an ellipse quadrant from x = 125 to the stem at x = 166.
const bowHalf = (x) => (x <= 125 ? HB : HB * Math.sqrt(Math.max(0, 1 - ((x - 125) / 41) ** 2)));
function bowRing(x0) {
  const far = sample(x0, 166, 28, (x) => [x, -bowHalf(x)]);
  const near = sample(166, x0, 28, (x) => [x, bowHalf(x)]).slice(1, -1);
  return [...far, ...near];
}
// Stern above the counter: square with rounded quarters (r 14) to a transom at x = -165.
function sternRing(x0) {
  const r = 14;
  const arc = (cx, cy, a0, a1) => sample(a0, a1, 10, (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  return [[x0, -HB], ...arc(-L2 + r, -HB + r, -Math.PI / 2, -Math.PI), ...arc(-L2 + r, HB - r, Math.PI, Math.PI / 2), [x0, HB]];
}
// Run aft below the counter: fines toward the skeg (4 m wide at x = -148).
const runHalf = (x) => (x >= -115 ? HB : 2 + (HB - 2) * Math.pow((x + 148) / 33, 0.55));
function runRing(x0) {
  return [...sample(x0, -148, 20, (x) => [x, -runHalf(x)]), ...sample(-148, x0, 20, (x) => [x, runHalf(x)])];
}
// A seam on the near, outward faces of a prism ring, skipping the cut faces (normal along x at a cut).
function seamOn(ring, z, skip = () => false) {
  const [vx, vy] = k.towardViewer(P);
  const n = ring.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += ring[i][0] * ring[(i + 1) % n][1] - ring[(i + 1) % n][0] * ring[i][1];
  const runs = [];
  let run = [];
  for (let i = 0; i < n; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const [nx, ny] = area > 0 ? [dy, -dx] : [-dy, dx];
    const seen = nx * vx + ny * vy > 1e-9 && !skip(a, b);
    if (seen) {
      if (!run.length) run.push(a);
      run.push(b);
    } else if (run.length) runs.push(run), (run = []);
  }
  if (run.length) runs.push(run);
  return runs.map((r) => k.onTop(r, z, P)).join("");
}
const atCut = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && (Math.abs(a[0] - CUT[0]) < 1e-6 || Math.abs(a[0] - CUT[1]) < 1e-6);

// ---------------------------------------------------------------- stand
function stand() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 22).concat([[0, PLATE.y + 22], [0, PLATE.y + PLATE.d - 22]]);
  for (const [x, y] of byDepth(feet, ([x, y]) => [x, y, 0])) {
    out.push(S(k.cylinder(x, y, 8, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(Dt(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // halo of the lifted hull on the plate
  out.push(`<path class="iso-halo" d="${k.haloOf(plan(-150, 160, -24, 24, 10), 0, 0.1, P)}" style="opacity:.5;filter:blur(6px)"/>`);
  return out.join("");
}

// Two cradles under the flat bottom: base, web with gussets, saddle, felt pad.
const CRADLES = [-86, 92];
function cradles() {
  const out = [];
  for (const cx of CRADLES) {
    out.push(S(box(cx - 8, cx + 8, -24, 24, 0, 2.4, { r: 1.2, bevel: 0.5 }), { tone: "mid" }));
    out.push(Dt([[cx - 5, -20], [cx + 5, -20], [cx - 5, 20], [cx + 5, 20]].map(([x, y]) => at([x, y, 2.4])), { size: 0.45 }));
    out.push(S(box(cx - 6, cx + 6, -12.6, -11.4, 2.4, KZ - 2.2, { r: 0.3 }), { tone: "mid" }));
    out.push(S(box(cx - 1.4, cx + 1.4, -21, 21, 2.4, KZ - 2.2, { r: 0.4 }), { tone: "mid" }));
    out.push(S(box(cx - 6, cx + 6, 11.4, 12.6, 2.4, KZ - 2.2, { r: 0.3 }), { tone: "mid" }));
    out.push(S(box(cx - 5.4, cx + 5.4, -23, 23, KZ - 2.2, KZ - 0.7, { r: 0.8, bevel: 0.4 }), { tone: "mid" }));
    out.push(S(box(cx - 4.6, cx + 4.6, -22, 22, KZ - 0.7, KZ, { r: 0.6 }), { tone: "lo", crease: "none" }));
    ground(aSlab(cx - 8, cx + 8, -24, 24, 0, KZ, { name: "stand.cradle" }));
  }
  return out.join("");
}

// ---------------------------------------------------------------- hull, back to front
function propulsion() {
  const out = [];
  // rudder (aft of the propeller, hung from the counter)
  out.push(S(box(-163.5, -157, -0.8, 0.8, Z(1.2), Z(12), { r: 0.7 }), { tone: "mid" }));
  ground(aSlab(-163.5, -157, -0.8, 0.8, Z(1.2), Z(12), { name: "stand.rudder" }));
  // propeller: hub along x, four blades in the disc plane
  const C = [-152, 0, Z(6.6)];
  const F = G.frameOf(C, X, Y, UP);
  const hub = G.solidOf([[-2.6, 0.9, 1], [-1.6, 1.5, 1], [0, 1.6], [1.6, 1.4]], F, P);
  const blades = [0.35, 0.35 + Math.PI / 2, 0.35 + Math.PI, 0.35 + 1.5 * Math.PI].map((a) => {
    const d = [Math.cos(a), Math.sin(a)];
    const poly = sample(0, Math.PI * 2, 18, (t) => {
      const along = 3.2 + 2.3 * Math.cos(t);
      const across = 1.25 * Math.sin(t);
      return [d[0] * along - d[1] * across, d[1] * along + d[0] * across];
    }).slice(0, -1);
    const centre = [C[0], C[1] + d[0] * 3.2, C[2] + d[1] * 3.2];
    return { centre, svg: S(G.prismOf(F, poly, -0.25, 0.25, P), { tone: "mid" }) };
  });
  const hubDepth = depth(C);
  const sorted = byDepth(blades, (b) => b.centre);
  sorted.filter((b) => depth(b.centre) < hubDepth).forEach((b) => out.push(b.svg));
  out.push(S(hub, { tone: "mid" }));
  sorted.filter((b) => depth(b.centre) >= hubDepth).forEach((b) => out.push(b.svg));
  // shaft from the skeg to the hub
  out.push(S(G.disc(1.6, 4, 0.7, F, P), { tone: "mid" }));
  ground(A.disc(F, -2.6, 4, 1.6, { name: "stand.prop" }));
  return out.join("");
}

function hull() {
  const out = [];
  // aft body: run below the counter, then the full stern above it, then the poop deck
  const run = runRing(CUT[0]);
  out.push(S(k.extrude(run, Z(0), 12, P), { tone: "mid" }));
  const stern = sternRing(CUT[0]);
  const draught = Ln(seamOn(stern, Z(M.DRAUGHT_M), atCut), { tone: "lo" });
  out.push(S(k.extrude(stern, Z(12), DEP - 12, P), { tone: "hi", inner: draught }));
  ground(A.extruded(run, Z(0), 12, { name: "stand.hull.run" }));
  ground(A.extruded(stern, Z(12), DEP - 12, { name: "stand.hull.stern" }));
  // section lines on the cut end face at x = -61: inner hull, inner bottom, deck plate
  const fx = CUT[0];
  out.push(Ln(k.segment([fx, INNER, Z(DH)], [fx, INNER, DECK], P) + k.segment([fx, LBH, Z(DH)], [fx, HB, Z(DH)], P) + k.segment([fx, LBH, DECK - 1], [fx, INNER, DECK - 1], P), { tone: "lo" }));
  let aftMarks = "";
  for (let d = 14; d <= M.DRAUGHT_M; d += 2) aftMarks += "M" + [[-140, Z(d) - 0.35], [d % 4 === 0 ? -137 : -138.4, Z(d) - 0.35], [d % 4 === 0 ? -137 : -138.4, Z(d) + 0.35], [-140, Z(d) + 0.35]].map(([x, z]) => at([x, HB + 0.02, z]).join(" ")).join("L") + "Z";
  out.push(Ln(aftMarks, { tone: "mid" }));
  const poop = sternRing(-128);
  out.push(S(k.extrude(poop, DECK, 3, P, { bevel: 0.5 }), { tone: "hi" }));
  ground(A.extruded(poop, DECK, 3, { name: "stand.hull.poop" }));

  // cut region: far side and centre tanks (closed), double bottom strip
  out.push(S(box(CUT[0], CUT[1], -HB, LBH, Z(0), DECK, { r: 0, steps: 1 }), { tone: "hi" }));
  ground(aSlab(CUT[0], CUT[1], -HB, LBH, Z(0), DECK, { name: "stand.hull.centre" }));
  // longitudinal bulkhead stiffeners, seen above the oil in the open row 2
  out.push(Ln(sample(CUT[0] + 4, ROWS[2] - 4, 9, (x) => k.segment([x, LBH, Z(OIL_TOP)], [x, LBH, DECK], P)).join(""), { tone: "faint" }));
  out.push(S(box(CUT[0], CUT[1], LBH, HB, Z(0), Z(DH), { r: 0, steps: 1 }), { tone: "mid" }));
  // tanks in x order: oil row, bulkhead, oil row ...
  const oil = [];
  const rows = [[CUT[0], ROWS[2] - 0.4], [ROWS[2] + 0.4, ROWS[3] - 0.4], [ROWS[3] + 0.4, CUT[1]]];
  rows.forEach(([x0, x1], i) => {
    out.push(`<g class="vl-oil">${S(box(x0, x1, LBH, INNER - 0.6, Z(DH), Z(OIL_TOP), { r: 0, steps: 1 }), { tone: "hi", crease: "lo" })}</g>`);
    if (i < 2) {
      const bx = ROWS[i + 2];
      out.push(S(box(bx - 0.4, bx + 0.4, LBH, INNER - 0.6, Z(DH), DECK - 1, { r: 0, steps: 1 }), { tone: "mid" }));
    }
  });
  // oil surface ripple lines in the open tank (end on the bulkheads)
  out.push(`<g class="vl-oil">${Ln(k.lineOnTop([CUT[0], 15], [ROWS[2] - 0.4, 15], Z(OIL_TOP), P) + k.lineOnTop([CUT[0], 19.5], [ROWS[2] - 0.4, 19.5], Z(OIL_TOP), P), { tone: "faint" })}</g>`);
  // inner hull stub, web frames of the double side, outer shell stub
  out.push(S(box(CUT[0], CUT[1], INNER - 0.6, INNER, Z(DH), Z(12), { r: 0, steps: 1 }), { tone: "mid" }));
  for (const x of byDepth(sample(CUT[0] + 6, CUT[1] - 6, 12, (x) => x), (x) => [x, 28, 0])) {
    out.push(S(box(x - 0.3, x + 0.3, INNER, HB - 0.6, Z(DH), Z(7.5), { r: 0, steps: 1 }), { tone: "mid", crease: "none" }));
  }
  out.push(S(box(CUT[0], CUT[1], HB - 0.6, HB, Z(DH), Z(7.5), { r: 0, steps: 1 }), { tone: "hi" }));
  // main deck plate over rows 3-4 (row 2 is cut open from above to show the oil level)
  out.push(S(box(ROWS[2] - 0.4, CUT[1], LBH, HB, DECK - 1, DECK, { r: 0, steps: 1 }), { tone: "hi" }));
  ground(aSlab(CUT[0], CUT[1], LBH, HB, Z(0), DECK, { name: "stand.hull.cut" }));

  // fore body and forecastle, bulbous bow
  const fore = bowRing(CUT[1]);
  const foreDraught = Ln(seamOn(fore, Z(M.DRAUGHT_M), atCut), { tone: "lo" });
  out.push(S(k.extrude(fore, Z(0), DEP, P), { tone: "hi", inner: foreDraught }));
  const foreShape = ground(A.extruded(fore, Z(0), DEP, { name: "stand.hull.fore" }));
  // bow thruster tunnel and hawse pipe, drawn in the plane tangent to the bow
  const onBow = (x, z, r) => {
    const h = bowHalf(x);
    const dh = (bowHalf(x + 0.5) - bowHalf(x - 0.5)) / 1;
    const t = [1 / Math.hypot(1, dh), dh / Math.hypot(1, dh)];
    return "M" + sample(0, Math.PI * 2, 32, (a) => at([x + r * Math.cos(a) * t[0], h + r * Math.cos(a) * t[1] + 0.05, z + r * Math.sin(a)]).join(" ")).join("L") + "Z";
  };
  out.push(Ln(onBow(147, Z(7), 1.6) + onBow(151, Z(27.5), 1.1), { tone: "lo" }));
  // load-line (Plimsoll) mark amidships of the fore body and draught marks at the bow, on the near side (y = 30)
  const side = (x, z) => at([x, HB + 0.02, z]);
  const rect = (x0, x1, z0, z1) => "M" + [side(x0, z0), side(x1, z0), side(x1, z1), side(x0, z1)].map((p) => p.join(" ")).join("L") + "Z";
  const ring = (x, z, r) => "M" + sample(0, Math.PI * 2, 28, (a) => side(x + r * Math.cos(a), z + r * Math.sin(a)).join(" ")).join("L") + "Z";
  const LX = 92;
  let marks = ring(LX, Z(M.DRAUGHT_M), 2) + rect(LX - 3.4, LX + 3.4, Z(M.DRAUGHT_M) - 0.25, Z(M.DRAUGHT_M) + 0.25) + rect(LX - 3.4, LX + 3.4, Z(DEP) - 2.2, Z(DEP) - 1.7);
  for (let d = 4; d <= M.DRAUGHT_M; d += 2) marks += rect(118, d % 4 === 0 ? 121 : 119.6, Z(d) - 0.35, Z(d) + 0.35);
  out.push(Ln(marks, { tone: "mid" }));
  const fc = bowRing(138);
  out.push(S(k.extrude(fc, DECK, 3, P, { bevel: 0.5 }), { tone: "hi" }));
  ground(A.extruded(fc, DECK, 3, { name: "stand.hull.fc" }));
  const FB = G.frameAlong([160, 0, Z(7.5)], X);
  out.push(S(G.solidOf([[0, 4.6], [6, 4.6, 1], [9.5, 3.8, 1], [11.8, 2.2, 1], [12.6, 0, 1]], FB, P), { tone: "mid" }));
  ground(A.solid(FB, [[0, 4.6], [6, 4.6, 1], [9.5, 3.8, 1], [11.8, 2.2, 1], [12.6, 0, 1]], { name: "stand.hull.bulb", seated: true, cut: [foreShape] }));
  return out.join("");
}

// ---------------------------------------------------------------- deck items (settled order)
const PZ = DECK + 2; // cargo main lines, centre height
const PR = 0.8; // pipe radius (exaggerated ~2x for legibility)
const MAINS = [-3, 0, 3];
const XOVER = [-2, 6]; // manifold crossovers, midships
const TEE = Math.sqrt(2) * PR + 0.05;
const TEE_S = Math.sqrt(TEE * TEE - PR * PR);
const MAIN_X = [-110, 112];

function pipeX(name, y, x0, x1) {
  const F = G.frameOf([x0, y, PZ], X, Y, UP);
  put(name, [(x0 + x1) / 2, y, PZ], S(G.disc(0, x1 - x0, PR, F, P), { tone: "hi" }), [A.disc(F, 0, x1 - x0, PR)]);
}
function pipeY(name, x, y0, y1, r = PR, tone = "hi") {
  const F = G.frameOf([x, y0, PZ], Y, UP, X);
  put(name, [x, (y0 + y1) / 2, PZ], S(G.disc(0, y1 - y0, r, F, P), { tone }), [A.disc(F, 0, y1 - y0, r)]);
}

function cargoLines() {
  // supports every ~22 m, saddles under the three mains
  for (let x = -100; x <= 104; x += 22) {
    if (x > -8 && x < 12) continue;
    put("deck.support", [x, 0, DECK + 0.6], S(box(x - 0.6, x + 0.6, -4.4, 4.4, DECK, PZ - PR, { r: 0.2 })), [aSlab(x - 0.6, x + 0.6, -4.4, 4.4, DECK, PZ - PR)]);
  }
  // mains, split at the crossover tees
  for (const y of MAINS) {
    const cuts = [MAIN_X[0], ...XOVER.flatMap((x) => [x - TEE_S, x + TEE_S]), MAIN_X[1]];
    for (let i = 0; i < cuts.length; i += 2) pipeX("deck.main", y, cuts[i], cuts[i + 1]);
    // end flanges (blind) and the drop into the pump-room trunk aft
    for (const [x, dir] of [[MAIN_X[0], -1], [MAIN_X[1], 1]]) {
      const F = G.frameOf([x, y, PZ], [dir, 0, 0], Y, UP);
      put("deck.flange", [x + dir * 0.3, y, PZ], S(G.disc(0, 0.6, 1.2, F, P), { tone: "mid" }) + Dt(G.dotsOf(F, 0.6, 0.85, 6, P, { fade: [0.04, 0.42] }), { size: 0.3 }), [A.disc(F, 0, 0.6, 1.2)]);
    }
  }
  // tees where crossovers meet the mains
  for (const x of XOVER) for (const y of MAINS) put("deck.tee", [x, y, PZ], S(G.sphereOf([x, y, PZ], TEE, P), { tone: "hi" }), [A.ball([x, y, PZ], TEE)]);
  // crossovers between mains and out to the manifolds
  for (const x of XOVER) {
    for (let i = 0; i < MAINS.length - 1; i++) pipeY("deck.xover", x, MAINS[i] + TEE_S, MAINS[i + 1] - TEE_S);
    for (const s of [1, -1]) {
      const y0 = s * (MAINS[2] + TEE_S);
      const seg = (a, b, r, tone) => pipeY("deck.xover", x, Math.min(a, b), Math.max(a, b), r, tone);
      seg(y0, s * 14.6, PR);
      // manifold valve: bulged body on the crossover, stem and handwheel on top
      const F = G.frameOf([x, s * 14.6, PZ], [0, s, 0], X, UP);
      const body = [[0, 1.25], [0.4, 1.25], [0.4, 1.05], [1.0, 1.4, 1], [2.0, 1.55, 1], [3.0, 1.4, 1], [3.6, 1.05], [3.6, 1.25], [4.0, 1.25]];
      put("deck.valve", [x, s * 16.6, PZ], S(G.solidOf(body, F, P), { tone: "mid" }), [A.solid(F, body)]);
      const vy = s * 16.6;
      put("deck.wheel", [x, vy, PZ + 2.6], S(k.cylinder(x, vy, 0.35, PZ + 1.5, 1.6, P, 12), { tone: "mid" }) + S(k.cylinder(x, vy, 1.3, PZ + 3.1, 0.3, P, 28), { tone: "mid" }) + Ln(k.lineOnTop([x - 1.3, vy], [x + 1.3, vy], PZ + 3.4, P) + k.lineOnTop([x, vy - 1.3], [x, vy + 1.3], PZ + 3.4, P), { tone: "lo" }), [A.cylinder(x, vy, 0.35, PZ + 1.5, 1.6), A.cylinder(x, vy, 1.3, PZ + 3.1, 0.3)]);
      seg(s * 18.6, s * 23.4, PR);
      // reducer flange and presentation flange over the drip tray
      const F2 = G.frameOf([x, s * 23.4, PZ], [0, s, 0], X, UP);
      put("deck.flange", [x, s * 23.7, PZ], S(G.disc(0, 0.6, 1.25, F2, P), { tone: "mid" }), [A.disc(F2, 0, 0.6, 1.25)]);
      seg(s * 24, s * 25.4, 1.0, "hi");
      const F3 = G.frameOf([x, s * 25.4, PZ], [0, s, 0], X, UP);
      put("deck.flange", [x, s * 25.7, PZ], S(G.disc(0, 0.6, 1.5, F3, P), { tone: "mid" }) + Dt(G.dotsOf(F3, 0.6, 1.1, 8, P, { all: true }), { size: 0.3 }), [A.disc(F3, 0, 0.6, 1.5)]);
      // pipe pedestals on deck and on the tray
      for (const py of [s * 9, s * 21]) put("deck.support", [x, py, DECK + 0.6], S(box(x - 0.7, x + 0.7, py - 0.6, py + 0.6, py === s * 21 ? DECK + 0.5 : DECK, PZ - PR, { r: 0.2 })), [aSlab(x - 0.7, x + 0.7, py - 0.6, py + 0.6, py === s * 21 ? DECK + 0.5 : DECK, PZ - PR)]);
    }
  }
  // drip trays under the manifolds
  for (const s of [1, -1]) {
    const y0 = s > 0 ? 19.5 : -27.5;
    const tray = plan(-6, 10, y0, y0 + 8, 0.6);
    put("deck.tray", [2, y0 + 4, DECK + 0.25], S(k.slabOf(tray, DECK, 0.5, P, 3), { tone: "mid" }) + Ln(k.planOutline(k.insetPlan(tray, 0.8), DECK + 0.5, P, 3), { tone: "lo" }), [A.slab(tray, DECK, 0.5)], -0.3);
  }
}

function hatches() {
  const spots = [];
  const centres = ROWS.slice(0, 5).map((x, i) => (x + ROWS[i + 1]) / 2 - 12);
  centres.forEach((x, i) => {
    for (const y of [-19, -7, 19]) {
      if (i === 1 && y === 19) continue; // row 2 near wing is cut open
      spots.push([x, y]);
    }
  });
  spots.push([-110, -19], [-110, 19]);
  for (const [x, y] of spots) {
    put("deck.hatch", [x, y, DECK + 0.5], S(k.cylinder(x, y, 1.4, DECK, 0.5, P, 24), { tone: "mid" }) + S(k.cylinder(x, y, 1.0, DECK + 0.5, 0.5, P, 20, 0.2), { tone: "hi" }) + Dt([at([x + 0.6, y, DECK + 1])], { size: 0.3 }), [A.cylinder(x, y, 1.4, DECK, 0.5), A.cylinder(x, y, 1.0, DECK + 0.5, 0.5)]);
  }
}

// Fore-and-aft catwalk on portal frames above the lines.
const CW = { x0: -130, x1: 141, z: DECK + 6 };
function catwalk() {
  const posts = [-122, -104, -86, -68, -50, -30, -14, 18, 34, 52, 70, 88, 106, 124];
  for (const x of posts) {
    for (const y of [-5, 5]) put("deck.post", [x, y, (DECK + CW.z) / 2], S(box(x - 0.3, x + 0.3, y - 0.3, y + 0.3, DECK, CW.z - 0.6, { r: 0.1 }), { tone: "mid", crease: "none" }), [aSlab(x - 0.3, x + 0.3, y - 0.3, y + 0.3, DECK, CW.z - 0.6)]);
    put("deck.beam", [x, 0, CW.z - 0.3], S(box(x - 0.4, x + 0.4, -5.3, 5.3, CW.z - 0.6, CW.z, { r: 0.1 }), { tone: "mid" }), [aSlab(x - 0.4, x + 0.4, -5.3, 5.3, CW.z - 0.6, CW.z)]);
  }
  // forecastle post at the fore end
  put("deck.portal", [139.5, 0, RAISED + 1], S(box(139, 140, -0.5, 0.5, RAISED, CW.z, { r: 0.1 }), { tone: "mid" }), [aSlab(139, 140, -0.5, 0.5, RAISED, CW.z)]);
  // walkway plate in pieces so it sorts against the cranes and manifold
  const cuts = [CW.x0, -60, 0, 60, CW.x1];
  for (let i = 0; i < cuts.length - 1; i++) {
    const [a, b] = [cuts[i], cuts[i + 1]];
    const rails = [];
    for (const y of [-1.1, 1.1]) {
      rails.push(k.segment([a, y, CW.z + 1.2], [b, y, CW.z + 1.2], P));
      for (let x = a + (i === 0 ? 4 : 0); x <= b - 0.01 || (i === cuts.length - 2 && x <= b); x += 6) rails.push(k.segment([x, y, CW.z + 0.5], [x, y, CW.z + 1.2], P));
      rails.push(k.segment([b, y, CW.z + 0.5], [b, y, CW.z + 1.2], P));
    }
    put("deck.catwalk", [(a + b) / 2, 0, CW.z + 0.25], S(box(a, b, -1.2, 1.2, CW.z, CW.z + 0.5, { r: 0, steps: 1 }), { tone: "hi" }) + Ln(rails.join(""), { tone: "mid" }), [aSlab(a, b, -1.2, 1.2, CW.z, CW.z + 0.5)]);
  }
}

// Hose-handling cranes at the manifold, one each side.
function cranes() {
  for (const s of [1, -1]) {
    const cx = -14;
    const cy = s * 21;
    const shapes = [A.cylinder(cx, cy, 1.6, DECK, 6), aSlab(cx - 2.2, cx + 2.6, cy - 1.8, cy + 1.8, DECK + 6, DECK + 9)];
    let svg = S(k.cylinder(cx, cy, 2.2, DECK, 0.6, P, 24), { tone: "mid" }) + S(k.cylinder(cx, cy, 1.6, DECK + 0.6, 5.4, P, 24), { tone: "mid" });
    svg += Ln(k.sideArc(cx, cy, 1.6, DECK + 3, P, 16), { tone: "faint" });
    svg += S(box(cx - 2.2, cx + 2.6, cy - 1.8, cy + 1.8, DECK + 6, DECK + 9, { r: 0.6, bevel: 0.3 }), { tone: "hi" });
    svg += Dt([at([cx + 2.6, cy + 1, DECK + 8]), at([cx + 2.6, cy - 1, DECK + 8])], { size: 0.3 });
    put("deck.crane", [cx, cy, DECK + 4], svg, shapes);
    // jib: from the slewing house up and out over the manifold
    const from = [cx + 2.6, cy, DECK + 8];
    const tip = [4, s * 23.5, DECK + 17];
    const dir = G.unit3(G.sub3(tip, from));
    const len = G.len3(G.sub3(tip, from));
    const side = G.unit3(G.cross3(dir, UP));
    const up = G.cross3(side, dir);
    const F = G.frameOf(from, dir, side, up);
    const poly = [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]];
    // hook block hanging over the presentation flanges
    const hook = [tip[0], tip[1], DECK + 12];
    let jib = S(G.prismOf(F, poly, 0, len, P), { tone: "hi" });
    jib += Ln(k.segment(tip, [hook[0], hook[1], hook[2] + 0.8], P), { tone: "mid" }) + Dt([at(tip)], { size: 0.45, tone: "hi" });
    put("deck.jib", G.lerp3(from, tip, 0.5), jib, [A.prism(F, poly, 0, len)]);
    put("deck.hook", hook, S(box(hook[0] - 0.6, hook[0] + 0.6, hook[1] - 0.6, hook[1] + 0.6, hook[2] - 0.6, hook[2] + 0.8, { r: 0.2 }), { tone: "mid" }), [aSlab(hook[0] - 0.6, hook[0] + 0.6, hook[1] - 0.6, hook[1] + 0.6, hook[2] - 0.6, hook[2] + 0.8), aSlab(tip[0] - 0.08, tip[0] + 0.08, tip[1] - 0.08, tip[1] + 0.08, hook[2] + 0.8, tip[2] - 0.5)]);
  }
}

// Accommodation block, bridge, funnel, engine casing, radar mast, lifeboat, aft mooring.
function aft() {
  const Z0 = RAISED;
  const blk = plan(-150, -130, -16, 16, 1);
  const levels = [3, 6, 9, 12].map((h) => Z0 + h);
  const seams = Ln(levels.map((z) => k.sideSeam(blk, z, P, 3)).join(""), { tone: "lo" });
  let svg = S(k.slabOf(blk, Z0, 16, P, 3, 0.4), { tone: "hi", inner: seams });
  const win = [];
  for (let l = 0; l < 5; l++) {
    const z = Z0 + 1.7 + l * 3;
    for (let y = -13; y <= 13; y += 2.6) win.push(at([-130, y, z]));
    for (let x = -147.5; x <= -132; x += 2.6) win.push(at([x, 16, z]));
  }
  svg += Dt(win, { size: 0.42, tone: "mid" });
  put("aft.block", [-140, 0, Z0 + 8], svg, [A.slab(blk, Z0, 16)]);
  // bridge with wings and its window band
  const br = plan(-146, -130, -27, 27, 0.8);
  const band = [[-130, -25, Z0 + 17.4], [-130, 25, Z0 + 17.4], [-130, 25, Z0 + 18.8], [-130, -25, Z0 + 18.8]];
  const mull = sample(-25, 25, 20, (y) => k.segment([-130, y, Z0 + 17.4], [-130, y, Z0 + 18.8], P)).join("");
  const bandD = "M" + band.map((p) => at(p).join(" ")).join("L") + "Z";
  put("aft.bridge", [-138, 0, Z0 + 17.8], S(k.slabOf(br, Z0 + 16, 3.6, P, 3, 0.4), { tone: "hi", inner: Ln(bandD, { tone: "mid" }) + Ln(mull, { tone: "lo" }) }), [A.slab(br, Z0 + 16, 3.6)]);
  // radar mast on the compass deck
  const MZ = Z0 + 19.6;
  let mast = S(k.cylinder(-140, 0, 0.6, MZ, 8, P, 14), { tone: "mid", crease: "none" });
  mast += S(box(-140.5, -139.5, -4, 4, MZ + 6, MZ + 6.6, { r: 0.2 }), { tone: "mid" });
  mast += S(box(-141, -139, -0.6, 0.6, MZ + 8, MZ + 8.5, { r: 0.2 }), { tone: "mid" });
  mast += S(box(-140.6, -139.4, -3.4, 3.4, MZ + 8.5, MZ + 8.9, { r: 0.2 }), { tone: "hi" });
  mast += Dt([at([-140, -4, MZ + 6.6]), at([-140, 4, MZ + 6.6])], { size: 0.4, tone: "hi" });
  put("aft.mast", [-140, 0, MZ + 4], mast, [A.cylinder(-140, 0, 0.6, MZ, 8, { owner: "mast" }), aSlab(-140.5, -139.5, -4, 4, MZ + 6, MZ + 6.6, { owner: "mast" }), aSlab(-141, -139, -0.6, 0.6, MZ + 8, MZ + 8.5, { owner: "mast" }), aSlab(-140.6, -139.4, -3.4, 3.4, MZ + 8.5, MZ + 8.9, { owner: "mast" })]);
  // engine casing and funnel
  put("aft.casing", [-152, 0, Z0 + 5], S(box(-154, -150, -5, 5, Z0, Z0 + 10, { r: 0.4 }), { tone: "hi" }), [aSlab(-154, -150, -5, 5, Z0, Z0 + 10)]);
  const fun = plan(-163, -154, -6, 6, 3);
  const fseams = Ln(k.sideSeam(fun, Z0 + 20, P, 6) + k.sideSeam(fun, Z0 + 22, P, 6), { tone: "mid" });
  put("aft.funnel", [-158.5, 0, Z0 + 12], S(k.slabOf(fun, Z0, 25, P, 6, 0.5), { tone: "hi", inner: fseams }) + Ln(k.planOutline(k.insetPlan(fun, 0.9), Z0 + 25, P, 6), { tone: "lo" }), [A.slab(fun, Z0, 25)]);
  for (const y of [-2.2, 2.2]) put("aft.exhaust", [-159, y, Z0 + 26], S(k.cylinder(-159, y, 1, Z0 + 25, 2.2, P, 18), { tone: "mid" }) + Ln(k.ring(-159, y, 0.6, Z0 + 27.2, P, 14), { tone: "lo" }), [A.cylinder(-159, y, 1, Z0 + 25, 2.2)]);
  // lifeboat on davits, near side of the block
  const boat = plan(-147, -137, 17.6, 21, 1.6);
  put("aft.boat", [-142, 19.3, Z0 + 7.5], S(k.slabOf(boat, Z0 + 6, 2.2, P, 6, 0.4), { tone: "hi", inner: Ln(k.sideSeam(boat, Z0 + 7, P, 6), { tone: "lo" }) }) + S(box(-146, -138, 18, 20.6, Z0 + 8.2, Z0 + 9, { r: 1 }), { tone: "mid" }), [A.slab(boat, Z0 + 6, 2.2), aSlab(-146, -138, 18, 20.6, Z0 + 8.2, Z0 + 9)]);
  for (const x of [-145, -139]) put("aft.davit", [x, 17, Z0 + 9.5], S(box(x - 0.3, x + 0.3, 16, 19.3, Z0 + 9, Z0 + 10, { r: 0.1 }), { tone: "mid" }), [aSlab(x - 0.3, x + 0.3, 16, 19.3, Z0 + 9, Z0 + 10)]);
  // aft mooring winches and bitts on the poop
  for (const s of [1, -1]) winch([-160, s * 18], Z0, "aft.winch", s);
  for (const [x, y] of [[-163, 24], [-163, -24], [-132, 25], [-132, -25]]) bitts(x, y, Z0, "aft.bitts");
}

// Mooring winch: base, two drums on a shaft along y, gearbox.
function winch([x, y], z0, name, s) {
  const y0 = y - s * 2.2;
  const base = plan(x - 2.6, x + 2.6, Math.min(y0, y0 + s * 4.4) - 0.3, Math.max(y0, y0 + s * 4.4) + 0.3, 0.4);
  const F = G.frameOf([x, Math.min(y0, y0 + s * 4.4), z0 + 2.6], Y, UP, X);
  const prof = [[0, 1.9], [0.35, 1.9], [0.35, 1.1], [1.9, 1.1], [1.9, 1.9], [2.5, 1.9], [2.5, 1.1], [4.05, 1.1], [4.05, 1.9], [4.4, 1.9]];
  let svg = S(k.slabOf(base, z0, 0.7, P, 3), { tone: "mid" });
  svg += S(G.solidOf(prof, F, P), { tone: "hi" });
  put(name, [x, y, z0 + 2.4], svg, [A.slab(base, z0, 0.7), A.solid(F, prof)]);
  const gy = s > 0 ? Math.max(y0, y0 + 4.4) + 0.3 : Math.min(y0, y0 - 4.4) - 0.3;
  const g = plan(x - 1.8, x + 1.8, Math.min(gy, gy + s * 2.4), Math.max(gy, gy + s * 2.4), 0.4);
  put(name, [x, gy + s * 1.2, z0 + 1.5], S(k.slabOf(g, z0, 3.2, P, 3, 0.3), { tone: "mid" }), [A.slab(g, z0, 3.2)]);
}
function bitts(x, y, z0, name) {
  const b = plan(x - 2.2, x + 2.2, y - 0.9, y + 0.9, 0.5);
  put(name, [x, y, z0 + 0.8], S(k.slabOf(b, z0, 0.4, P, 3), { tone: "mid" }) + S(k.cylinder(x - 1.1, y, 0.6, z0 + 0.4, 1.4, P, 14), { tone: "hi" }) + S(k.cylinder(x + 1.1, y, 0.6, z0 + 0.4, 1.4, P, 14), { tone: "hi" }), [A.slab(b, z0, 0.4), A.cylinder(x - 1.1, y, 0.6, z0 + 0.4, 1.4), A.cylinder(x + 1.1, y, 0.6, z0 + 0.4, 1.4)]);
}

// Forecastle: windlasses with chain to the hawse pipes, mooring winches, bitts, foremast.
function forecastle() {
  const z0 = RAISED;
  for (const s of [1, -1]) {
    const y = s * 7;
    const base = plan(146, 152, y - 2.4, y + 2.4, 0.5);
    const F = G.frameOf([149, y - 1.6, z0 + 2.4], Y, UP, X);
    const gyp = [[0, 1.2], [0.4, 1.2], [0.4, 1.7, 1], [1.6, 1.7, 1], [1.6, 1.2], [3.2, 1.2]];
    put("fc.windlass", [149, y, z0 + 2], S(k.slabOf(base, z0, 0.8, P, 3), { tone: "mid" }) + S(G.solidOf(gyp, F, P), { tone: "hi" }), [A.slab(base, z0, 0.8), A.solid(F, gyp)]);
    // chain: gypsy -> stopper -> hawse pipe (deck ring)
    const hx = 158;
    const hy = s * 10;
    const chain = Ln(k.segment([149.6, y - 0.6 * s + s * 0.0, z0 + 3.3], [153.6, (y + hy) / 2, z0 + 0.9], P) + k.segment([155, (y + hy) / 2 + s * 0.4, z0 + 0.9], [hx - 0.9, hy - s * 0.2, z0], P), { tone: "mid", dotted: true });
    const stop = plan(153.4, 155.2, (y + hy) / 2 - 0.9, (y + hy) / 2 + 0.9, 0.3);
    put("fc.chain", [154, (y + hy) / 2, z0 + 0.6], S(k.slabOf(stop, z0, 0.9, P, 3), { tone: "mid" }) + S(k.cylinder(hx, hy, 1.2, z0, 0.3, P, 20), { tone: "mid" }) + Ln(k.ring(hx, hy, 0.8, z0 + 0.3, P, 18), { tone: "lo" }) + chain, [A.slab(stop, z0, 0.9), A.cylinder(hx, hy, 1.2, z0, 0.3)], 0.2);
    winch([142, s * 12], z0, "fc.winch", s);
    bitts(160, s * 17, z0, "fc.bitts");
  }
  // foremast with a lamp
  put("fc.mast", [162, 0, z0 + 5], S(k.cylinder(162, 0, 1.1, z0, 0.4, P, 16), { tone: "mid" }) + S(k.cylinder(162, 0, 0.45, z0 + 0.4, 9, P, 12), { tone: "mid", crease: "none" }) + S(k.cylinder(162, 0, 0.8, z0 + 9.4, 1.2, P, 14), { tone: "hi" }), [A.cylinder(162, 0, 1.1, z0, 0.4), A.cylinder(162, 0, 0.45, z0 + 0.4, 9), A.cylinder(162, 0, 0.8, z0 + 9.4, 1.2)]);
}

// ---------------------------------------------------------------- front of the stand: the instrument
// Day-rate slider (log scale), $/bbl dial with counter, coin stack beside a $100 crude rod, a barrel.
const RAIL = { x0: -146, x1: 106, y: 64 };
const SX = (share) => RAIL.x0 + 5 + share * (RAIL.x1 - RAIL.x0 - 10);
const DIAL = { x: 156, y: 52, r: 14, z: 9, h: 5 };
const DIAL_TOP = DIAL.z + DIAL.h;
const COIN = { x: -170, y: 51, r: 5.2, t: 0.5, z: 1.2, n: M.DIAL_MAX };
const ROD = { x: -183, y: 45, r: 0.8 };
const BARREL = { x: -152, y: 50, r: 4, h: 9 };
const dialAngle = (v) => ((-M.DIAL_SPAN_DEG / 2 + (Math.min(v, M.DIAL_MAX) / M.DIAL_MAX) * M.DIAL_SPAN_DEG) * Math.PI) / 180;

function front() {
  const out = [];
  // label plate with the one engraved label
  const lp = plan(-128, -82, 46, 56, 1);
  out.push(S(k.slabOf(lp, 0, 0.8, P, 4), { tone: "mid", crease: "none" }));
  out.push(Ln(k.planOutline(k.insetPlan(lp, 1.4), 0.8, P, 4), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([-124, 50.6], 0.8, P, "x"), "VLCC · 2.0 M BBL", { size: 3.2, tone: "mid" }));
  out.push(Ln(k.lineOnTop([-124, 53.4], [-96, 53.4], 0.8, P), { tone: "lo", free: true }));
  out.push(Dt([at([-126, 51, 0.8]), at([-84, 51, 0.8])], { size: 0.4 }));
  // crude-price rod on its tray, then the coin stack, then the barrel
  const tray = plan(-188, -160, 40, 60, 3);
  out.push(S(k.slabOf(tray, 0, COIN.z, P, 5, 0.5), { tone: "mid" }));
  out.push(Ln(k.ring(COIN.x, COIN.y, COIN.r + 0.6, COIN.z, P, 36), { tone: "lo" }));
  const rodTop = COIN.z + CRUDE.usd * COIN.t;
  out.push(S(k.cylinder(ROD.x, ROD.y, 1.8, COIN.z, 1, P, 20), { tone: "mid" }));
  const rings = [];
  for (let v = 10; v < CRUDE.usd; v += 10) rings.push(k.sideArc(ROD.x, ROD.y, ROD.r, COIN.z + v * COIN.t, P, 10));
  out.push(S(k.cylinder(ROD.x, ROD.y, ROD.r, COIN.z + 1, rodTop - COIN.z - 1, P, 14), { tone: "mid", crease: "none", inner: Ln(rings.join(""), { tone: "lo" }) }));
  out.push(`<g class="vl-oil">${S(k.cylinder(ROD.x, ROD.y, 1.9, rodTop, 1.4, P, 22, 0.3), { tone: "hi" })}</g>`);
  // coins (one per dollar of freight per barrel), shown up to the live value
  const coins = [];
  for (let i = 0; i < COIN.n; i++) {
    const z = COIN.z + i * COIN.t;
    coins.push(`<g data-coin="${i}"${i < 33 ? "" : ' style="display:none"'}>${S(k.cylinder(COIN.x, COIN.y, COIN.r, z, COIN.t, P, 40), { tone: "hi", lit: true, crease: "none" })}</g>`);
  }
  out.push(`<g data-part="coins">${coins.join("")}</g>`);
  // barrel of crude: one barrel, the unit the coins are counted against
  const B = BARREL;
  const ribs = Ln([B.h / 3, (2 * B.h) / 3].map((h) => k.sideArc(B.x, B.y, B.r, h, P, 24)).join(""), { tone: "lo" });
  out.push(`<g class="vl-oil">${S(k.cylinder(B.x, B.y, B.r, 0, B.h, P, 36, 0.4), { tone: "hi", inner: ribs })}${Ln(k.ring(B.x, B.y, B.r - 0.6, B.h, P, 32), { tone: "lo" })}${Dt([at([B.x + 1.6, B.y - 1.4, B.h])], { size: 0.5, tone: "hi" })}</g>`);
  // rail, stops and log ruler
  out.push(S(box(RAIL.x0, RAIL.x1, RAIL.y, RAIL.y + 4, 0, 2, { r: 0.6, bevel: 0.4 }), { tone: "mid" }));
  out.push(Ln(k.lineOnTop([RAIL.x0, RAIL.y + 2], [RAIL.x1, RAIL.y + 2], 2, P), { tone: "faint" }));
  for (const x of [RAIL.x0 - 4, RAIL.x1]) {
    out.push(S(box(x, x + 4, RAIL.y - 2, RAIL.y + 6, 0, 4, { r: 0.8, bevel: 0.4 }), { tone: "mid" }));
    out.push(Dt([at([x + 2, RAIL.y, 4]), at([x + 2, RAIL.y + 4, 4])], { size: 0.4 }));
  }
  const strip = plan(RAIL.x0, RAIL.x1, 70, 76, 0.6);
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const minor = [];
  const major = [];
  for (const decade of [10_000, 100_000, 1_000_000]) {
    for (let m = 1; m < 10; m++) {
      const rate = decade * m;
      if (rate < M.RATE_MIN || rate > M.RATE_MAX) continue;
      const big = m === 1 || rate === M.RATE_MIN;
      const x = SX(M.shareOfRate(rate));
      (big ? major : minor).push(k.lineOnTop([x, 70], [x, 70 + (big ? 3.6 : m === 5 ? 2.6 : 1.8)], 0.6, P));
    }
  }
  major.push(k.lineOnTop([SX(1), 70], [SX(1), 73.6], 0.6, P));
  out.push(Ln(minor.join(""), { tone: "lo" }), Ln(major.join(""), { tone: "hi" }));
  out.push(Dt(M.HOLDS.map((h) => at([SX(M.shareOfRate(h.rate)), 75, 0.6])), { size: 0.55, tone: "hi" }));
  // carriage (built at x = 0, moved live) with knurled knob and index pointer
  let car = S(box(-5, 5, RAIL.y - 1.4, RAIL.y + 5.4, 2, 4.4, { r: 1.2, bevel: 0.4 }), { tone: "hi" });
  car += S(box(-0.9, 0.9, RAIL.y + 5.4, 73.8, 0.6, 1.4, { r: 0.3 }), { tone: "hi" });
  car += Ln(k.lineOnTop([0, RAIL.y + 5.4], [0, 73.8], 1.4, P), { tone: "lit" });
  car += S(k.cylinder(0, RAIL.y + 2, 2.6, 4.4, 3.6, P, 32), { tone: "mid" });
  car += Ln(k.knurl(0, RAIL.y + 2, 2.6, 4.4, 8, 30, P), { tone: "lo" });
  car += Ln(k.lineOnTop([0, RAIL.y + 2], [0, RAIL.y + 4.6], 8, P), { tone: "hi" });
  out.push(`<g data-part="carriage">${car}</g>`);
  // dial pedestal with counter window, dial face, needle
  const ped = plan(DIAL.x - 20, DIAL.x + 18, 36, 70, 3);
  out.push(S(k.slabOf(ped, 0, DIAL.z, P, 6, 1), { tone: "mid" }));
  out.push(Dt(k.corners(ped, 3).map(([x, y]) => at([x, y, DIAL.z])), { size: 0.45 }));
  out.push(S(k.cylinder(DIAL.x, DIAL.y, DIAL.r, DIAL.z, DIAL.h, P, 64, 0.8), { tone: "hi", crease: "lo" }));
  out.push(Ln(k.knurl(DIAL.x, DIAL.y, DIAL.r, DIAL_TOP - 2.4, DIAL_TOP, 72, P, 0.3), { tone: "lo" }));
  out.push(Ln(k.sideArc(DIAL.x, DIAL.y, DIAL.r, DIAL_TOP - 2.4, P, 40), { tone: "faint" }));
  out.push(Ln(k.ring(DIAL.x, DIAL.y, DIAL.r - 1.6, DIAL_TOP, P, 64), { tone: "lo" }));
  const span = (M.DIAL_SPAN_DEG * Math.PI) / 180;
  const t = k.radialTicks(DIAL.x, DIAL.y, DIAL.r - 1.6, M.DIAL_MAX, 5, DIAL_TOP, [1.1, 2.4], P, -span / 2, span);
  out.push(Ln(t.minor, { tone: "lo" }), Ln(t.major, { tone: "mid" }));
  // red mark at the record ($32.5/bbl)
  const rec = dialAngle(M.freightPerBbl(M.RATE_MAX));
  const rr = DIAL.r - 1.6;
  out.push(Ln(k.lineOnTop([DIAL.x + Math.sin(rec) * (rr - 3.2), DIAL.y - Math.cos(rec) * (rr - 3.2)], [DIAL.x + Math.sin(rec) * rr, DIAL.y - Math.cos(rec) * rr], DIAL_TOP, P), { tone: "red" }));
  out.push(Ln(k.ring(DIAL.x, DIAL.y, 1.4, DIAL_TOP, P, 16), { tone: "mid" }));
  // counter window in the front face of the pedestal (face plane y = 70)
  const W = { x0: DIAL.x - 12, x1: DIAL.x + 4, z0: 2, z1: 7 };
  out.push(`<g transform="${k.sideMatrix([0, 70], 0, P, "left")}"><rect x="${W.x0}" y="${-W.z1}" width="${W.x1 - W.x0}" height="${W.z1 - W.z0}" rx="0.6" class="vl-window"/><text data-part="counter" class="iso-face-text vl-digits" x="${W.x1 - 1}" y="${-W.z0 - 1.2}" font-size="3.6" text-anchor="end">$32.5</text></g>`);
  out.push(Dt([at([W.x0 - 1.4, 70, 4.5]), at([W.x1 + 1.4, 70, 4.5])], { size: 0.4 }));
  return out.join("");
}
const needleAt = (v) => {
  const a = dialAngle(v);
  const r = DIAL.r - 3;
  return k.lineOnTop([DIAL.x - Math.sin(a) * 2.4, DIAL.y + Math.cos(a) * 2.4], [DIAL.x + Math.sin(a) * r, DIAL.y - Math.cos(a) * r], DIAL_TOP + 0.2, P);
};

// ---------------------------------------------------------------- assemble
const back = stand() + cradles() + propulsion() + hull();
cargoLines();
hatches();
catwalk();
cranes();
aft();
forecastle();
A.settle(R, P);
const deck = [...R.items].sort((a, b) => a.key - b.key).map((item) => item.svg).join("");
A.auditOrExit(R, P, { cover: ["fc.chain*"] }); // the anchor chain is a dotted line lying on the deck

const START = M.HOLDS[2].rate;
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A model of a Very Large Crude Carrier on a display stand. The near side shell is cut away over three of the five rows of cargo tanks, showing the double hull and orange crude oil filling the wing tanks. On deck run the cargo lines, the midship manifold, hose cranes and a catwalk; the accommodation and funnel are aft, the forecastle with its windlasses forward. On the stand a slider sets the day rate on a logarithmic scale, a dial and a counter read freight in dollars per barrel, and a stack of coins, one per dollar, rises beside a rod as tall as one barrel of crude costs.",
  body: [back, deck, front(), `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(M.freightPerBbl(START))}" style="stroke-width:1.1"/>`],
});

const EXTRA_CSS = `
.iso-page{width:100%!important;max-width:720px;margin:0 auto!important}
body{background:transparent}
.iso-stage:focus{outline:none}.iso-stage:focus-visible{outline:1px solid var(--anatomy-faint);outline-offset:4px}
.vl-oil{--anatomy-paper:#6b3a12;--anatomy-face:#c97528;--anatomy-top:#f2a456;--anatomy-shade-0:#9a5418;--anatomy-shade-1:#b0611d;--anatomy-shade-2:#c46e24;--anatomy-shade-3:#d87e2e;--anatomy-hi:#ffc98c;--anatomy-mid:#e8913a;--anatomy-lo:#a85a1a;--anatomy-faint:#c06a20;--anatomy-lit-top:#f2a456;--anatomy-lit-shade:#c46e24}
.iso[data-theme="light"] .vl-oil{--anatomy-paper:#f3c48f;--anatomy-face:#efa04f;--anatomy-top:#f6b46c;--anatomy-shade-0:#d9802f;--anatomy-shade-1:#e28a37;--anatomy-shade-2:#e8913a;--anatomy-shade-3:#ee9c48;--anatomy-hi:#8a4610;--anatomy-mid:#b0601c;--anatomy-lo:#c46e24;--anatomy-faint:#d9802f}
.vl-window{fill:var(--anatomy-shade-0);stroke:var(--anatomy-mid);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke}
.vl-digits{fill:var(--anatomy-lit);font-weight:600}
.iso-plate-corner[data-corner="readout"]{white-space:pre-line;text-align:right}
.iso-stage{touch-action:pan-y}
.iso-plate{overflow:hidden}
@media (max-width:540px){.iso-plate-corner[data-corner="hint"]{display:none}.iso-plate-corner[data-corner="readout"]{font-size:9px;letter-spacing:0}.iso-stage svg{width:116%;margin:0 -8%}}
`;

const live = `
const M = (() => { ${readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "")}; return { freightPerBbl, shareOfRate, rateOfShare, fmtUsd, fmtBbl, HOLDS, RATE_MIN, RATE_MAX, VOYAGE_DAYS, CARGO_BBL }; })();
const P = ${JSON.stringify(P)};
const CRUDE = ${JSON.stringify(CRUDE)};
const DIAL = ${JSON.stringify(DIAL)}, DIAL_TOP = ${DIAL_TOP}, DIAL_MAX = ${M.DIAL_MAX}, SPAN = ${M.DIAL_SPAN_DEG};
const RAIL = ${JSON.stringify(RAIL)};
const SX = (share) => RAIL.x0 + 5 + share * (RAIL.x1 - RAIL.x0 - 10);
const dialAngle = (v) => ((-SPAN / 2 + (Math.min(v, DIAL_MAX) / DIAL_MAX) * SPAN) * Math.PI) / 180;
const needleAt = (v) => { const a = dialAngle(v), r = DIAL.r - 3; return lineOnTop([DIAL.x - Math.sin(a) * 2.4, DIAL.y + Math.cos(a) * 2.4], [DIAL.x + Math.sin(a) * r, DIAL.y - Math.cos(a) * r], DIAL_TOP + 0.2, P); };
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const carriage = svg.querySelector('[data-part="carriage"]');
const needle = svg.querySelector('[data-part="needle"]');
const counter = svg.querySelector('[data-part="counter"]');
const coins = [...svg.querySelectorAll("[data-coin]")];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const holds = M.HOLDS.map((h) => M.shareOfRate(h.rate));
let share = holds[2], target = share, frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idle = 0, shown = -1;
// idle tour: hold each point 3.2 s, travel between them
const tourAt = (t) => holds[Math.floor(t / 3.2) % holds.length];
const fmtRate = (r) => r >= 1e6 ? "$" + (r / 1e6).toFixed(2).replace(/0$/, "") + "m" : "$" + Math.round(r / 1000) + "k";
function draw() {
  const rate = M.rateOfShare(share);
  const f = M.freightPerBbl(rate);
  carriage.setAttribute("transform", translateAlong(P, [SX(share), 0, 0]));
  needle.setAttribute("d", needleAt(f));
  const n = Math.round(f);
  if (n !== shown) { coins.forEach((c, i) => (c.style.display = i < n ? "" : "none")); shown = n; }
  const fb = M.fmtBbl(M.freightPerBbl(rate >= 100000 ? Math.round(rate / 10000) * 10000 : Math.round(rate / 1000) * 1000));
  if (counter.textContent !== fb) counter.textContent = fb;
  const shownRate = rate >= 100000 ? Math.round(rate / 10000) * 10000 : Math.round(rate / 1000) * 1000;
  const text = M.fmtUsd(shownRate) + " / day × " + M.VOYAGE_DAYS + " days ÷ " + (M.CARGO_BBL / 1e6).toFixed(1) + " m bbl\\n= " + M.fmtBbl(M.freightPerBbl(shownRate)) + " per barrel · " + Math.round(100 * M.freightPerBbl(shownRate) / CRUDE.usd) + "% of $" + Math.round(CRUDE.usd) + " crude";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(shownRate)));
  stage.setAttribute("aria-valuetext", text.replace("\\n", " "));
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = tourAt(clock); }
  share = still.matches ? target : share + (target - share) * (1 - Math.exp(-dt / 0.45));
  if (Math.abs(target - share) < 1e-4) share = target;
  draw();
  frame = visible && (touring || share !== target) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, 0, 1); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 4000); run(); };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  steer(clamp(((event.clientX - box.left) / box.width - 0.1) / 0.8, 0, 1));
});
stage.addEventListener("keydown", (event) => {
  const here = holds.reduce((best, h, i) => (Math.abs(h - target) < Math.abs(holds[best] - target) ? i : best), 0);
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = holds[Math.min(holds.length - 1, here + 1)];
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = holds[Math.max(0, here - 1)];
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = 1;
  if (to === null) return;
  event.preventDefault();
  steer(to);
});
draw();
const post = () => parent.postMessage({ oilFig: "vlcc", h: document.documentElement.scrollHeight }, "*");
addEventListener("load", post);
addEventListener("resize", post);
new ResizeObserver(post).observe(document.body);
post();
`;

const f70 = M.freightPerBbl(M.HOLDS[0].rate);
const f13 = M.freightPerBbl(M.RATE_MAX);
const caption = `Freight per barrel = day rate × days of hire ÷ barrels carried. A VLCC (about 330 m long, 60 m beam, 22 m draught, 300,000 dwt) carries about ${(M.CARGO_BBL / 1e6).toFixed(0)} million barrels; Ras Tanura to Ningbo is about ${M.LADEN_DAYS} days laden at ${M.SPEED_KN} knots, and with the ballast leg back and port time the charterer pays for about ${M.VOYAGE_DAYS} days (both round numbers). At ${M.fmtUsd(M.HOLDS[0].rate)}/day (January 2026) that is ${M.fmtBbl(f70)} a barrel; at the record ${M.fmtUsd(M.RATE_MAX)}/day of early October 2026 it is ${M.fmtBbl(f13)}, about a third of the ${"$" + Math.round(CRUDE.usd)} the crude itself cost (WTI, ${CRUDE.month}). Bunker fuel and war-risk insurance are not included; in 2026 the war-risk premium was a further cost. Ship schematic, tank layout simplified, pipes drawn about twice their true size.`;

const body = k.plateHtml({
  fig: "Fig",
  title: "VLCC freight",
  hint: "Hover across to set the day rate",
  readout: M.readout(START, CRUDE.usd),
  keys: [
    { mark: "lit", label: "Needle and coins: dollars of freight per barrel (one coin per $1)" },
    { mark: "raised", label: `Rod: one barrel of crude, $${Math.round(CRUDE.usd)} (WTI, ${CRUDE.month})` },
  ],
  caption,
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="VLCC freight: arrow keys step between January 2026, mid-crisis and the October 2026 record day rates" aria-valuemin="${M.RATE_MIN}" aria-valuemax="${M.RATE_MAX}" aria-valuenow="${START}">${svg}</div>`,
});

let html = k.pageHtml({ title: "VLCC freight per barrel", theme, body, script: kitScript() + live, width: 720 });
html = html.replace("</style>", EXTRA_CSS + "</style>");
mkdirSync(OUT, { recursive: true });
const file = join(OUT, theme === "light" ? "vlcc-light.html" : "vlcc.html");
writeFileSync(file, html);
console.log("wrote", file, (html.length / 1024).toFixed(0) + " KB", "items", R.items.length, "solids", R.solids.length, "scale", KS.toFixed(2), "crude", CRUDE, CRUDE_JAN);
