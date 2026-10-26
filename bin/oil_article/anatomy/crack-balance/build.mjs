// The crack balance: an equal-arm beam balance that weighs three barrels of crude against two of gasoline and one of
// diesel. Barrel heights are the prices per barrel; the beam tilts by the 3-2-1 crack, and the pointer reads it on the
// arc scale. Build: node build.mjs [--light]  ->  assets/oil-article/anatomy/crack-balance(-light).html
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/niklas/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/niklas/.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "/home/niklas/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { SERIES, STOPS, SCALE, DEG_PER_USD, H_PER_USD, LAST_PRICE, monthName } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "..", "..", "assets", "oil-article", "anatomy");
const theme = process.argv.includes("--light") ? "light" : "dark";
const FIG = "Fig";

const WIDTH = 600;
const HEIGHT = 420;

// ---------- world (units ~1 px, x right, y toward the front, z up) ----------
const BASE = { x: -108, y: -32, w: 216, d: 62, r: 6 };
const BASE_H = 14;
const FOOT_H = 5;
const COL = [0, -16]; // column axis
const COL_R = 4.6;
const ZP = 106; // pivot (knife edge) height
const ARM = 76; // pivot to end knife
const BEAM = { zp: ZP, arm: ARM, half: 81, halfY: 2.4, topZ: 3, endZ: 2, midZ: 5.2, riderFrom: 10, riderTo: 64, rider: 2.4,
  axleBack: 6.8, axleFront: 8.4, pointer: 57, tail: 7, pointerY: 9.4 };
const BRACKET_Z = [92, 97]; // bearing bracket under the beam
const CHEEK_TOP = ZP - 1.3; // the knife's lower edge rests here
const PLATE = { y0: 6.6, y1: 7.8, rIn: 43, rOut: 60, a0: -6, a1: 30.5 }; // arc scale plate, degrees from vertical
const TOP_ARM_Z = [ZP + 64, ZP + 68];
const COL_TOP = ZP + 70;
const PAN = { r: 22, z: 44, h: 2.4, boss: 1.6 }; // pan disc bottom z (at rest)
const PAN_TOP = PAN.z + PAN.h;
const BOW = { y: 23.5, z0: 88.6, z1: 92, rod: 0.85 }; // stirrup: rods front/back, crossbar along y above the barrels
const BARREL_R = 6.4;
const SPOTS = {
  L: [{ dx: -13.4, dy: 0, kind: "crude" }, { dx: 0, dy: 0, kind: "crude" }, { dx: 13.4, dy: 0, kind: "crude" }],
  R: [{ dx: -13.4, dy: 0, kind: "gas" }, { dx: 0, dy: 0, kind: "gas" }, { dx: 13.4, dy: 0, kind: "ulsd" }],
};
const TRACK = { x0: -90, x1: 90, y: 20, d: 6 }; // the date track on the base top
const N = SERIES.t.length;

// the deepest the products pan goes: crack at the top of the scale
const DROP = ARM * Math.sin(SCALE[1] * DEG_PER_USD * Math.PI / 180);
if (PAN.z - PAN.boss - DROP < 8.5) throw new Error("products pan would hit the arrest post");
if (PAN_TOP + Math.max(...SERIES.ulsd, ...SERIES.gas, ...SERIES.wti) * H_PER_USD > BOW.z0 - 0.5) throw new Error("barrel through the stirrup");

// the beam's belly must clear the bearing bracket at full tilt (it passes between the cheeks, above the bracket)
{
  const t = SCALE[1] * DEG_PER_USD * Math.PI / 180, x = 4.4;
  const belly = -(BEAM.midZ - (BEAM.midZ - BEAM.endZ) * x / BEAM.half);
  if (ZP - x * Math.sin(t) + belly * Math.cos(t) < BRACKET_Z[1] + 0.3) throw new Error("beam hits the bracket");
}

const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [COL[0], COL[1], COL_TOP + 2], [-ARM - 24, 22, PAN.z + DROP + 60], [ARM + 24, -22, PAN.z - DROP],
    [PLATE.rOut * Math.sin(PLATE.a1 * Math.PI / 180), 8, ZP + PLATE.rOut]],
  WIDTH, HEIGHT, { pad: 18, azimuth: 70, elevation: 26 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const Dt = (pts, style) => k.dotsSvg(pts, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const along = (o, a) => G.frameAlong(o, a);
const slab = (x, y, w, d, z, h, r = 0.8, steps = 3, bevel = 0) => k.slabOf({ x, y, w, d, r }, z, h, P, steps, bevel);

// ---------- base ----------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  // levelling feet: flange, knurled screw, foot pad
  for (const [x, y] of byDepth(k.corners(BASE, 14))) {
    out.push(S(k.cylinder(x, y, 6.4, -BASE_H - FOOT_H, 1.4, P, 32), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 4.6, -BASE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 32), { tone: "mid" }));
    out.push(L(k.knurl(x, y, 4.6, -BASE_H - FOOT_H + 1.4, -BASE_H, 30, P), { tone: "lo" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.4), { tone: "mid", inner: L(k.sideSeam(BASE, -BASE_H + 3, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 4.5), 0, P), { tone: "lo" }));
  const screws = k.corners(BASE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(Dt(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  return out.join("");
}

// the month counter on the front face of the base: a bezel, a window onto two drums, a setting wheel
function counter() {
  const out = [];
  const fy = BASE.y + BASE.d; // front face plane
  const bz = [-11.8, -2.2];
  const bx = [-22.4, 12.4];
  out.push(S(slab(bx[0], fy, bx[1] - bx[0], 1.4, bz[0], bz[1] - bz[0], 0.6, 2, 0.3), { tone: "mid" }));
  const wy = fy + 1.4;
  const wx = [-19.6, 9.6], wz = [-10, -4];
  const quad = (pts) => k.pathOf(pts.map(([x, z]) => at([x, wy, z])), true);
  const win = [[wx[0], wz[0]], [wx[1], wz[0]], [wx[1], wz[1]], [wx[0], wz[1]]];
  out.push(`<path class="cb-window" d="${quad(win)}"/>`);
  // drum curvature: two faint lines near the top and bottom of the window, edge to edge
  out.push(L([-9.3, -4.7].map((z) => k.pathOf([at([wx[0], wy, z]), at([wx[1], wy, z])])).join(""), { tone: "faint" }));
  // divider between the month drum and the year drum
  out.push(L(k.pathOf([at([-7.4, wy, wz[0]]), at([-7.4, wy, wz[1]])]), { tone: "lo" }));
  out.push(L(quad(win), { tone: "lo" }));
  const last = monthName(SERIES.t[N - 1]).toUpperCase().split(" ");
  out.push(`<g transform="${k.sideMatrix([-13.5, wy], -8.4, P, "left")}"><text class="cb-drum" data-part="drum-month" x="0" y="0" font-size="4.3" text-anchor="middle">${last[0]}</text></g>`);
  out.push(`<g transform="${k.sideMatrix([1.1, wy], -8.4, P, "left")}"><text class="cb-drum" data-part="drum-year" x="0" y="0" font-size="4.3" text-anchor="middle">${last[1]}</text></g>`);
  out.push(Dt([[bx[0] + 1.4, bz[1] - 1.2], [bx[1] - 1.4, bz[1] - 1.2], [bx[0] + 1.4, bz[0] + 1.2], [bx[1] - 1.4, bz[0] + 1.2]].map(([x, z]) => at([x, wy, z])), { size: 0.45 }));
  // setting wheel beside the bezel
  const F = along([19, fy, -7], [0, 1, 0]);
  out.push(S(G.disc(0, 1, 4.2, F, P), { tone: "mid" }));
  out.push(S(G.disc(1, 3.2, 3.6, F, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 1, 3.2, 3.6, 28, P, { fade: [0.04, 0.4], seams: "first" }), { tone: "lo" }) }));
  out.push(L(G.circleOf(F, 3.2, 1.4, P), { tone: "lo" }));
  // the beam-arrest knob at the left of the front face: a boss, a knurled knob and its index line
  const A = along([-62, fy, -7], [0, 1, 0]);
  out.push(S(G.disc(0, 0.8, 6, A, P), { tone: "mid" }));
  out.push(S(G.disc(0.8, 4.2, 4.6, A, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(A, 0.8, 4.2, 4.6, 32, P, { fade: [0.04, 0.4], seams: "first" }), { tone: "lo" }) }));
  out.push(L(G.circleOf(A, 4.2, 1.2, P), { tone: "lo" }));
  out.push(L(k.pathOf([at([-62, fy + 4.2, -7 + 1.2]), at([-62, fy + 4.2, -7 + 4.6])]), { tone: "hi" }));
  out.push(Dt([[-70, -7], [-54, -7]].map(([x, z]) => at([x, fy, z])), { size: 0.45 }));
  return out.join("");
}

// label plate and spirit level on the base top
function topFittings() {
  const out = [];
  const plate = { x: -46, y: -28, w: 24, d: 9, r: 1 };
  out.push(S(k.slabOf(plate, 0, 0.7, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.4), 0.7, P, 3), { tone: "faint" }));
  [[16, -25.6], [11, -23.3], [14, -21]].forEach(([w, y]) => out.push(L(k.lineOnTop([plate.x + 3.4, y], [plate.x + 3.4 + w, y], 0.7, P), { tone: "lo", free: true })));
  out.push(Dt([at([plate.x + 1.6, plate.y + 4.5, 0.7]), at([plate.x + plate.w - 1.6, plate.y + 4.5, 0.7])], { size: 0.4 }));
  // spirit level: a block with a round vial window and the bubble
  const lv = { x: 20, y: -28, w: 22, d: 7, r: 1.2 };
  out.push(S(k.slabOf(lv, 0, 2.6, P, 3, 0.4), { tone: "mid" }));
  out.push(`<path class="cb-vial" d="${k.planOutline({ x: 23, y: -26.2, w: 16, d: 3.4, r: 1.7 }, 2.6, P, 6)}"/>`);
  out.push(L(k.planOutline({ x: 23, y: -26.2, w: 16, d: 3.4, r: 1.7 }, 2.6, P, 6), { tone: "lo" }));
  out.push(L([29.6, 32.4].map((x) => k.lineOnTop([x, -26.2], [x, -22.8], 2.6, P)).join(""), { tone: "lo" }));
  out.push(L(k.ring(31, -24.5, 1.1, 2.6, P, 16), { tone: "hi" }));
  return out.join("");
}

// pan arrests: the posts the pans would rest on when the balance is locked
function arrests() {
  const out = [];
  for (const x of [-ARM, ARM]) {
    out.push(S(k.cylinder(x, 0, 5, 0, 1.2, P, 32), { tone: "lo" }));
    out.push(S(k.cylinder(x, 0, 2.6, 1.2, 5, P, 24), { tone: "mid" }));
    out.push(S(k.cylinder(x, 0, 3.4, 6.2, 1.2, P, 28), { tone: "lo" }));
  }
  return out.join("");
}

// the date track: a ruler strip on the base top, one tick per year, long ticks every five, and a cursor that slides
function track() {
  const out = [];
  const strip = { x: TRACK.x0 - 5, y: TRACK.y, w: TRACK.x1 - TRACK.x0 + 10, d: TRACK.d, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const minor = [], major = [];
  SERIES.t.forEach((t, i) => {
    if (!t.endsWith("-01")) return;
    const x = TRACK.x0 + (i / (N - 1)) * (TRACK.x1 - TRACK.x0);
    const y5 = Number(t.slice(0, 4)) % 5 === 0;
    (y5 ? major : minor).push(k.lineOnTop([x, strip.y + strip.d], [x, strip.y + strip.d - (y5 ? 3.4 : 1.8)], 0.6, P));
  });
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  // the war marker: the first month of the Iran war (March 2026) as a red tick
  const war = SERIES.t.indexOf("2026-03");
  const wx = TRACK.x0 + (war / (N - 1)) * (TRACK.x1 - TRACK.x0);
  out.push(L(k.lineOnTop([wx, strip.y + strip.d], [wx, strip.y + 0.6], 0.6, P), { tone: "red" }));
  out.push(Dt([at([strip.x + 2, strip.y + 3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3, 0.6])], { size: 0.45 }));
  return out.join("");
}
function cursor() {
  // built at x = 0, moved along the track by the live code
  const out = [];
  out.push(S(slab(-1.8, TRACK.y - 1.2, 3.6, TRACK.d + 2.4, 0.6, 2, 0.8, 3, 0.3), { tone: "hi", crease: "lo" }));
  out.push(L(k.lineOnTop([0, TRACK.y - 1.2], [0, TRACK.y + TRACK.d + 1.2], 2.6, P), { tone: "hi" }));
  return out.join("");
}

// ---------- the stand ----------
function column() {
  const [x, y] = COL;
  const out = [];
  out.push(S(k.cylinder(x, y, 9.5, 0, 2.4, P, 48, 0.6), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 7, 2.4, 3.2, P, 40), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, COL_R, 5.6, COL_TOP - 5.6, P, 40), { tone: "mid", crease: "none", inner: L([40, 130].map((z) => k.sideArc(x, y, COL_R, z, P, 24)).join(""), { tone: "faint" }) }));
  out.push(S(k.cylinder(x, y, 5.6, COL_TOP, 2.2, P, 40, 0.4), { tone: "mid" }));
  out.push(Dt([at([x, y, COL_TOP + 2.2])], { size: 0.5 }));
  return out.join("");
}
function scaleArc() {
  const out = [];
  // top arm from the column forward, and the hanger that carries the scale plate
  out.push(S(slab(-3, COL[1] + 3.5, 6, PLATE.y1 - COL[1] - 3.5, TOP_ARM_Z[0], TOP_ARM_Z[1] - TOP_ARM_Z[0], 0.8, 3, 0.4), { tone: "mid" }));
  out.push(Dt([at([0, -6, TOP_ARM_Z[1]]), at([0, 3, TOP_ARM_Z[1]])], { size: 0.45 }));
  out.push(S(slab(-2.6, PLATE.y0, 5.2, PLATE.y1 - PLATE.y0, ZP + PLATE.rOut - 0.1, TOP_ARM_Z[0] - ZP - PLATE.rOut + 0.1, 0.4, 2), { tone: "mid" }));
  // the plate: a convex fan in the plane y = y0..y1
  const F = G.frameOf([0, PLATE.y0, ZP], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const pt = (r, a) => [r * Math.sin(a * Math.PI / 180), r * Math.cos(a * Math.PI / 180)];
  const poly = [];
  for (let a = PLATE.a0; a <= PLATE.a1 + 1e-9; a += (PLATE.a1 - PLATE.a0) / 40) poly.push(pt(PLATE.rOut, a));
  poly.push(pt(PLATE.rIn, PLATE.a1), pt(PLATE.rIn, PLATE.a0));
  out.push(S(G.prismOf(F, poly, 0, PLATE.y1 - PLATE.y0, P), { tone: "hi", crease: "lo" }));
  const fy = PLATE.y1;
  const w = (r, a) => { const [u, v] = pt(r, a); return at([u, fy, ZP + v]); };
  // an engraved arc inside the rim, end face to end face, and the ticks hanging from the rim onto it
  const arc = [];
  for (let a = PLATE.a0; a <= PLATE.a1 + 1e-9; a += 0.5) arc.push(w(PLATE.rOut - 6.2, a));
  out.push(L(k.pathOf(arc), { tone: "faint" }));
  const minor = [], mid = [], major = [];
  for (let c = SCALE[0]; c <= SCALE[1]; c += 1) {
    const a = c * DEG_PER_USD;
    if (c % 20 === 0) major.push(k.pathOf([w(PLATE.rOut - 0.05, a), w(PLATE.rOut - 6.2, a)]));
    else if (c % 5 === 0) mid.push(k.pathOf([w(PLATE.rOut - 0.05, a), w(PLATE.rOut - 4, a)]));
    else minor.push(k.pathOf([w(PLATE.rOut - 0.05, a), w(PLATE.rOut - 2, a)]));
  }
  out.push(L(minor.join(""), { tone: "faint" }), L(mid.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  for (const c of [0, 20, 40, 60, 80]) {
    const a = c * DEG_PER_USD;
    const [u, v] = pt(PLATE.rOut - 9.4, a);
    out.push(k.faceTextSvg(k.sideMatrix([u, fy], ZP + v, P, "left"), String(c), { size: 3.3, tone: c === 0 ? "hi" : "mid", anchor: "middle" }));
  }
  const [u, v] = pt(PLATE.rIn + 4.2, 12);
  out.push(k.faceTextSvg(k.sideMatrix([u, fy], ZP + v, P, "left"), "$ / bbl", { size: 2.4, tone: "lo", anchor: "middle" }));
  out.push(Dt([w(PLATE.rIn + 1.8, PLATE.a0 + 2.2), w(PLATE.rIn + 1.8, PLATE.a1 - 2.2)], { size: 0.45 }));
  return out.join("");
}
function bracket() {
  const out = [];
  const [z0, z1] = BRACKET_Z;
  // bracket from the column front, under the beam, with a gusset below
  out.push(S(slab(-3, COL[1] + 3.6, 6, 8, z0 - 10, 10, 0.6, 2), { tone: "mid" }));
  out.push(S(slab(-4.4, COL[1] + 3.6, 8.8, 6.4 - COL[1] - 3.6 + 0.2, z0, z1 - z0, 0.8, 3, 0.4), { tone: "mid" }));
  out.push(Dt([at([0, COL[1] + 7, z1])], { size: 0.45 }));
  return out.join("");
}
const cheek = (y) => S(slab(-4.4, y, 8.8, 2.4, BRACKET_Z[1], CHEEK_TOP - BRACKET_Z[1], 0.5, 2, 0.3), { tone: "mid" });
const cheekTop = (y) => `<path class="cb-agate" d="${k.planOutline({ x: -2.4, y: y + 0.5, w: 4.8, d: 1.4, r: 0.3 }, CHEEK_TOP, P, 2)}"/>`;

// the hub on the front end of the knife axle: round, so it is drawn once and not rebuilt
function hub() {
  const F = along([0, BEAM.axleFront, ZP], [0, 1, 0]);
  return S(G.disc(0, BEAM.pointerY - BEAM.axleFront, 2.8, F, P), { tone: "mid" });
}

// ---------- pans: built at rest, moved by the live code as the beam end moves ----------
function panBack(side) {
  const sx = side === "L" ? -1 : 1;
  const cx = sx * ARM;
  const out = [];
  out.push(S(k.cylinder(cx, 0, 5.5, PAN.z - PAN.boss, PAN.boss, P, 36), { tone: "mid" }));
  out.push(S(k.cylinder(cx, 0, PAN.r, PAN.z, PAN.h, P, 72, 0.7), { tone: "mid", inner: L(k.sideArc(cx, 0, PAN.r, PAN.z + 0.8, P, 48), { tone: "faint" }) }));
  out.push(L(k.ring(cx, 0, PAN.r - 2.4, PAN_TOP, P, 64), { tone: "lo" }));
  for (const y0 of [-BOW.y - 2.2, BOW.y - 1.8]) out.push(S(slab(cx - 1.6, y0, 3.2, 4, PAN.z, PAN.h + 0.6, 0.6, 2), { tone: "mid" }));
  // back rod of the stirrup and the back half of the crossbar
  out.push(S(k.cylinder(cx, -BOW.y + 0.3, BOW.rod, PAN_TOP + 0.6, BOW.z0 - PAN_TOP - 0.6, P, 14), { tone: "mid", crease: "none" }));
  out.push(`<g data-part="barrels-${side}"></g>`);
  out.push(S(slab(cx - 1.5, -BOW.y - 1, 3, BOW.y + 1 - BEAM.halfY - 0.6, BOW.z0, BOW.z1 - BOW.z0, 0.6, 2), { tone: "mid" }));
  // the back strap hangs from the end knife behind the beam
  out.push(S(slab(cx - 1.4, -BEAM.halfY - 1.8, 2.8, 1.2, BOW.z1, ZP + 1.6 - BOW.z1, 0.4, 2), { tone: "mid" }));
  return out.join("");
}
function panFront(side) {
  const sx = side === "L" ? -1 : 1;
  const cx = sx * ARM;
  const out = [];
  out.push(S(slab(cx - 1.5, -BEAM.halfY - 0.6, 3, BOW.y + 1 + BEAM.halfY + 0.6, BOW.z0, BOW.z1 - BOW.z0, 0.6, 2), { tone: "mid" }));
  out.push(S(k.cylinder(cx, BOW.y - 0.3, BOW.rod, PAN_TOP + 0.6, BOW.z0 - PAN_TOP - 0.6, P, 14), { tone: "mid", crease: "none" }));
  out.push(Dt([at([cx, BOW.y - 0.3, BOW.z1]), at([cx, -BOW.y + 0.3, BOW.z1])], { size: 0.45 }));
  // front strap and the round head of the end-knife pin
  out.push(S(slab(cx - 1.4, BEAM.halfY + 0.6, 2.8, 1.2, BOW.z1, ZP + 1.6 - BOW.z1, 0.4, 2), { tone: "mid" }));
  const F = along([cx, BEAM.halfY + 1.8, ZP], [0, 1, 0]);
  out.push(S(G.disc(0, 0.9, 1.5, F, P), { tone: "mid" }));
  return out.join("");
}

// ---------- assemble ----------
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "An equal-arm beam balance on a heavy base. The left pan carries three barrels of crude, the right pan two barrels of gasoline and one of diesel; each barrel is as tall as its price per barrel. The beam tilts by the 3-2-1 crack spread, products minus crude per barrel of crude, and a pointer reads it on an arc scale from minus 5 to 80 dollars. A red rider on the beam marks the same margin, a counter on the base shows the month and a cursor runs along a date track from 2006 to 2026.",
  body: [
    base(),
    counter(),
    topFittings(),
    arrests(),
    track(),
    `<g data-part="cursor" transform="${k.translateAlong(P, [TRACK.x1, 0, 0])}">${cursor()}</g>`,
    column(),
    scaleArc(),
    bracket(),
    cheek(-BEAM.halfY - 2.4 - 1.6),
    cheekTop(-BEAM.halfY - 2.4 - 1.6),
    `<g data-part="pan-back-L">${panBack("L")}</g>`,
    `<g data-part="pan-back-R">${panBack("R")}</g>`,
    `<g data-part="beam"></g>`,
    cheek(BEAM.halfY + 1.6),
    `<g data-part="front"></g>`,
    `<g data-part="pan-front-L">${panFront("L")}</g>`,
    `<g data-part="pan-front-R">${panFront("R")}</g>`,
  ],
});

const C = {
  P,
  data: SERIES,
  stops: STOPS.map((s) => s.i),
  scale: SCALE,
  degPerUsd: DEG_PER_USD,
  hPerUsd: H_PER_USD,
  beam: BEAM,
  panTop: PAN_TOP,
  barrels: { r: BARREL_R },
  pans: { L: { x: -ARM, spots: SPOTS.L }, R: { x: ARM, spots: SPOTS.R } },
  track: TRACK,
  lastDay: (() => { const [, m, d] = LAST_PRICE.split("-"); return `${Number(d)} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]}`; })(),
  hubSvg: hub(),
};
const live = `const C = ${JSON.stringify(C)};\n` + readFileSync(join(HERE, "live.js"), "utf8");

const CSS = `
.iso{--cb-crude:#E8913A;--cb-gas:#A6C94A;--cb-ulsd:#4FA8E0;--cb-margin:#E5533D}
.iso-page{width:100%;max-width:720px;margin:0 auto}
.iso-figure{margin:0}
.iso-plate{padding:50px 22px 54px}
.iso-stage{outline:none;touch-action:pan-y;cursor:ew-resize}
.iso-stage:focus-visible{box-shadow:0 0 0 1px var(--anatomy-mid)}
.cb-tint{--anatomy-shade-0:color-mix(in srgb,var(--c) 20%,var(--anatomy-card));--anatomy-shade-1:color-mix(in srgb,var(--c) 26%,var(--anatomy-card));--anatomy-shade-2:color-mix(in srgb,var(--c) 32%,var(--anatomy-card));--anatomy-shade-3:color-mix(in srgb,var(--c) 38%,var(--anatomy-card));--anatomy-top:color-mix(in srgb,var(--c) 46%,var(--anatomy-card));--anatomy-hi:var(--c);--anatomy-lo:color-mix(in srgb,var(--c) 62%,var(--anatomy-card))}
.iso[data-theme="light"] .cb-tint{--anatomy-shade-0:color-mix(in srgb,var(--c) 48%,var(--anatomy-card));--anatomy-shade-1:color-mix(in srgb,var(--c) 40%,var(--anatomy-card));--anatomy-shade-2:color-mix(in srgb,var(--c) 33%,var(--anatomy-card));--anatomy-shade-3:color-mix(in srgb,var(--c) 26%,var(--anatomy-card));--anatomy-top:color-mix(in srgb,var(--c) 16%,var(--anatomy-card));--anatomy-hi:color-mix(in srgb,var(--c) 80%,#000);--anatomy-lo:color-mix(in srgb,var(--c) 85%,#000)}
.iso[data-theme="light"]{--cb-crude:#d9771f;--cb-gas:#7fa82a;--cb-ulsd:#2f8fd0;--cb-margin:#d8402a}
.iso-line.cb-gapline{stroke:var(--cb-margin);stroke-width:1}
.cb-window{fill:var(--anatomy-shade-0);stroke:none}
.cb-vial{fill:var(--anatomy-shade-1);stroke:none}
.cb-agate{fill:var(--anatomy-shade-3);stroke:var(--anatomy-lo);stroke-width:.5}
.cb-drum{fill:var(--anatomy-hi);font-family:var(--anatomy-mono);letter-spacing:.06em;font-variant-numeric:tabular-nums}
.cb-bob{fill:var(--anatomy-lit);stroke:none}
.iso-plate-corner[data-corner="readout"] .cb-r1,.iso-plate-corner[data-corner="readout"] .cb-r3{color:var(--anatomy-strong)}
.cb-r2::before,.cb-r3::before{content:" · ";white-space:pre}
.iso-swatch[data-mark="cb-crude"] path{stroke:var(--cb-crude)}
@media (max-width:560px){
  .iso-plate{padding:46px 10px 76px}
  .iso-plate-corner[data-corner="readout"]{display:flex;flex-wrap:wrap;justify-content:flex-end;line-height:1.6;left:0}
  .iso-plate-corner[data-corner="readout"] .cb-r2{order:2;flex-basis:100%;text-align:right}
  .cb-r2::before{content:none}
}
.iso-plate-corner[data-corner="hint"]{bottom:auto;top:17px}
.iso-legend{padding:0 2px}
@media (max-width:560px){.iso-stage{overflow:hidden;margin:0 -10px}.iso-plate .iso-stage>.iso-svg{width:124%;max-width:none;margin:-4% -12% -6%}}
`;

const body = k.plateHtml({
  fig: FIG,
  title: "The crack balance",
  hint: "Drag or ← → · month",
  readout: "",
  keys: [
    { mark: "lit", label: "Pointer: the 3-2-1 crack, $ per barrel of crude" },
    { mark: "red", label: "Rider and red hoops: the margin; a hoop marks a crude barrel's height on each product barrel" },
    { mark: "raised", label: "Barrel height ∝ price per barrel (orange crude, green gasoline, blue diesel)" },
  ],
  caption: `US Gulf Coast spot prices against WTI, monthly means, June 2006 to ${monthName(SERIES.t[N - 1])}; ${monthName(SERIES.t[N - 1])} is a partial month, to ${C.lastDay}. Source: EIA via FRED. Beam tilt and barrel heights are schematic but proportional.`,
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Crack balance: arrow keys step one month, Page Up and Page Down one year" aria-valuemin="0" aria-valuemax="${N - 1}" aria-valuenow="${N - 1}">${svg}</div>`,
});

let html = k.pageHtml({ title: "The crack balance", theme, body, script: kitScript() + live, width: 720 });
html = html.replace("</style>", CSS + "</style>");
mkdirSync(OUT, { recursive: true });
const file = join(OUT, theme === "light" ? "crack-balance-light.html" : "crack-balance.html");
writeFileSync(file, html);
console.log("wrote", file, `${(html.length / 1024).toFixed(0)} kB`);
