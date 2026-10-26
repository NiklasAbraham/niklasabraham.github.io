// Fig: a crude storage tank at Cushing, Oklahoma, whose floating roof rides on EIA's weekly Cushing stocks.
// node build.mjs [--light] [--audit]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "/home/niklas/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/niklas/.claude/skills/anatomy/kit/lathe.mjs";
import * as A from "/home/niklas/.claude/skills/anatomy/kit/audit.mjs";
import { tubePieces, tubeSvg } from "/home/niklas/.claude/skills/anatomy/kit/tube.mjs";
import { kitScript } from "/home/niklas/.claude/skills/anatomy/scripts/inline-kit.mjs";
import { makeMesh } from "./mesh.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const OUT = join(HERE, "..", "..", "..", "..", "assets", "oil-article", "anatomy");

const W = 600;
const HT = 372;
const AZIMUTH = 55;
const ELEVATION = 33;

// ---------- world layout (units ~ px; the tank is drawn at about 1.4 H/D of a real 600 kbbl tank: schematic) ----------
const R = 56; // shell outer radius
const T = 1; // shell plate thickness (exaggerated)
const RI = R - T;
const H = M.SHELL_H; // 40
const COURSE = 5; // 8 courses (strakes)
const COURSES = Array.from({ length: H / COURSE + 1 }, (_, i) => i * COURSE);
const WIN = [30, 93]; // window cut out of the shell, degrees
const ZCUT = 5; // the bottom course stays
const GIRDER_Z = H - 4.5;
const BERM = { in: 75, crestIn: 78.5, crestOut: 81.5, out: 85, h: 5.5 };
const PLATE = { x: -96, y: -92, w: 276, d: 188, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

// floating roof (built at z = 0 = oil surface, moved up by the level)
const SEAL_GAP = 1.4;
const PONT_OUT = RI - SEAL_GAP;
const PONT_IN = PONT_OUT - 8;
const PONT_H = 2.6;
const DECK_H = 0.8;
const LADDER_A = 160; // gauger's platform and rolling-ladder hinge, degrees
const LADDER_LEN = 52;
const LADDER_W = 3.6;
const HINGE = [(RI - 2.5) * Math.cos((LADDER_A * Math.PI) / 180), (RI - 2.5) * Math.sin((LADDER_A * Math.PI) / 180), H + 0.2];
const INWARD = [-Math.cos((LADDER_A * Math.PI) / 180), -Math.sin((LADDER_A * Math.PI) / 180), 0];
const ACROSS = [-INWARD[1], INWARD[0], 0];
const TRACK_TOP = DECK_H + 0.7;

const L0 = M.levelOf(M.STOCKS[M.LATEST]);

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, H + 6], [R * Math.cos(2.4), R * Math.sin(2.4), H + 8]],
  W,
  HT,
  { pad: 14, azimuth: AZIMUTH, elevation: ELEVATION },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const path3 = (pts, closed = false) => k.pathOf(pts.map(at), closed);
const Mh = makeMesh(P);
const D2R = Math.PI / 180;
const pol = (r, a, z) => [r * Math.cos(a * D2R), r * Math.sin(a * D2R), z];

const R_ = A.recorder(P);
const record = R_.solid;
const RECORDED = new Set();
function put(name, ref, svg, shapes = [], { bias = 0, ...rest } = {}) {
  for (const sh of shapes) if (!RECORDED.has(sh) && !R_.solids.includes(sh) && sh.kind !== "tube") (RECORDED.add(sh), R_.solids.push(Object.assign(sh, sh.name ? {} : { name })));
  return R_.put({ name, at: ref, bias, svg, shapes: shapes.map((s) => (s.name ? s : Object.assign(s, { name }))), piece: "site", ...rest });
}

// ---------- base plate (static, behind everything) ----------
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

// time ruler on the front face of the plate: 2004 .. 2027, one tick a year, major every 5; a slider rides on it
const YF = PLATE.y + PLATE.d; // front face
const STRIP = { x0: PLATE.x + 18, x1: PLATE.x + PLATE.w - 18, z0: -8.4, z1: -1.6, t: 0.7 };
const YEAR0 = 2004;
const YEAR1 = 2027;
const xOfYear = (y) => STRIP.x0 + 4 + ((y - YEAR0) / (YEAR1 - YEAR0)) * (STRIP.x1 - STRIP.x0 - 8);
const yearOf = (t) => Number(t.slice(0, 4)) + (Number(t.slice(5, 7)) - 1) / 12 + (Number(t.slice(8, 10)) - 1) / 365;
{
  const plan = { x: STRIP.x0, y: YF, w: STRIP.x1 - STRIP.x0, d: STRIP.t, r: 0.3 };
  const minor = [];
  const major = [];
  for (let y = YEAR0; y <= YEAR1; y++) {
    const x = xOfYear(y);
    (y % 5 === 0 ? major : minor).push(k.segment([x, YF + STRIP.t, STRIP.z1], [x, YF + STRIP.t, STRIP.z1 - (y % 5 === 0 ? 3.4 : 1.8)], P));
  }
  // the week WTI went negative (20 Apr 2020), a short red tick rising from the strip's lower edge
  const x20 = xOfYear(yearOf(M.WEEKS[M.NEGATIVE_WEEK]));
  const red = k.segment([x20, YF + STRIP.t, STRIP.z0], [x20, YF + STRIP.t, STRIP.z0 + 2.2], P);
  back.push(S(k.slabOf(plan, STRIP.z0, STRIP.z1 - STRIP.z0, P, 2), { tone: "lo", crease: "none", inner: Ln(minor.join(""), { tone: "lo" }) + Ln(major.join(""), { tone: "mid" }) + Ln(red, { tone: "red" }) }));
  back.push(Dots([at([STRIP.x0 + 1.6, YF + STRIP.t, (STRIP.z0 + STRIP.z1) / 2]), at([STRIP.x1 - 1.6, YF + STRIP.t, (STRIP.z0 + STRIP.z1) / 2])], { size: 0.4 }));
}
// the slider (lit): built at YEAR0, moved along x by the page
const CURSOR0 = xOfYear(YEAR0);
const cursorSvg = (() => {
  const plan = { x: CURSOR0 - 1.3, y: YF + STRIP.t, w: 2.6, d: 1.2, r: 0.3 };
  return S(k.slabOf(plan, STRIP.z0 - 0.8, STRIP.z1 - STRIP.z0 + 1.6, P, 2, 0.2), { tone: "hi", lit: true }) + Ln(k.segment([CURSOR0, YF + STRIP.t + 1.2, STRIP.z0 - 0.4], [CURSOR0, YF + STRIP.t + 1.2, STRIP.z1 + 0.4], P), { tone: "lit" });
})();
// label plate
{
  const plan = { x: PLATE.x + 10, y: PLATE.y + PLATE.d - 24, w: 28, d: 14, r: 1.2 };
  back.push(S(k.slabOf(plan, 0, 0.8, P, 4), { tone: "lo" }));
  back.push(Ln(k.planOutline(k.insetPlan(plan, 1.6), 0.8, P, 3), { tone: "faint" }));
  back.push(Ln([0, 1, 2].map((i) => k.lineOnTop([plan.x + 4, plan.y + 4 + i * 3], [plan.x + 4 + [18, 12, 15][i], plan.y + 4 + i * 3], 0.8, P)).join(""), { tone: "lo", free: true }));
  back.push(Dots([at([plan.x + 2.4, plan.y + 2.4, 0.8]), at([plan.x + plan.w - 2.4, plan.y + plan.d - 2.4, 0.8])], { size: 0.4 }));
}

// ---------- berm (earth wall), back and front halves around the tank ----------
const VA = AZIMUTH; // the viewer's azimuth in plan; front half = VA +- 90
function bermFaces(a0, a1) {
  return [
    ...Mh.cone(BERM.in, 0, BERM.crestIn, BERM.h, a0, a1, { step: 5, grp: "in" }),
    ...Mh.annulus(BERM.crestIn, BERM.crestOut, BERM.h, a0, a1, { step: 5, grp: "crest" }),
    ...Mh.cone(BERM.crestOut, BERM.h, BERM.out, 0, a0, a1, { step: 5, grp: "out" }),
  ];
}
const bermBack = Mh.svg(bermFaces(VA + 90, VA + 270), { edge: "lo", className: "ct-earth" });
const bermFront = Mh.svg(bermFaces(VA - 90, VA + 90), { edge: "lo", className: "ct-earth" });
const bermRing = (a0, a1) => {
  const pts = Mh.span(a0, a1, 3);
  const inner = pts.map((a) => [BERM.in * Math.cos(a * D2R), BERM.in * Math.sin(a * D2R)]);
  const outer = pts.map((a) => [BERM.out * Math.cos(a * D2R), BERM.out * Math.sin(a * D2R)]).reverse();
  return [...inner, ...outer];
};
// recorded as three stacked rings that follow the slopes
const bermLayers = (a0, a1, name) => [0, 1, 2].map((i) => {
  const z0 = (BERM.h * i) / 3;
  const z1 = (BERM.h * (i + 1)) / 3;
  const rin = BERM.in + ((BERM.crestIn - BERM.in) * z1) / BERM.h;
  const rout = BERM.out - ((BERM.out - BERM.crestOut) * z1) / BERM.h;
  const pts = Mh.span(a0, a1, 3);
  return A.extruded([...pts.map((a) => [rin * Math.cos(a * D2R), rin * Math.sin(a * D2R)]), ...pts.map((a) => [rout * Math.cos(a * D2R), rout * Math.sin(a * D2R)]).reverse()], z0, z1 - z0, { name: `${name}#${i}`, owner: name });
});
put("berm.back", pol(BERM.crestIn, VA + 180, BERM.h / 2), bermBack, bermLayers(VA + 90, VA + 270, "berm.back"));
put("berm.front", pol(BERM.crestIn, VA, BERM.h / 2), bermFront, bermLayers(VA - 90, VA + 90, "berm.front"));
record(A.extruded(bermRing(0, 360), -0.01, 0.01, { name: "stand.yard", ground: true }));

// ---------- the tank: one composite item, painted inside out ----------
// course seams (horizontal welds) and staggered vertical welds, drawn on the faces they belong to
const visA = [VA - 90, VA + 90];
const arcPts = (r, z, a0, a1) => Mh.span(a0, a1, 2).map((a) => pol(r, a, z));
function innerSeams() {
  const out = [];
  for (const z of COURSES.slice(1, -1)) out.push(path3(arcPts(RI, z, VA + 90, VA + 270)));
  return Ln(out.join(""), { tone: "faint" });
}
function outerSeams() {
  const out = [];
  const lim = (a0, a1) => [Math.max(a0, visA[0]), Math.min(a1, visA[1])];
  for (const z of COURSES.slice(1, -1)) {
    if (z < ZCUT + 1e-6) out.push(path3(arcPts(R, z, ...visA)));
    else {
      out.push(path3(arcPts(R, z, visA[0], WIN[0])));
      out.push(path3(arcPts(R, z, WIN[1], visA[1])));
    }
  }
  // vertical welds, staggered course to course
  for (let c = 0; c < COURSES.length - 1; c++) {
    const z0 = COURSES[c];
    const z1 = COURSES[c + 1];
    for (let a = visA[0] + 6 + (c % 2) * 7; a < visA[1] - 4; a += 14) {
      if (z0 >= ZCUT - 1e-6 && a > WIN[0] - 1 && a < WIN[1] + 1) continue;
      out.push(path3([pol(R, a, z0), pol(R, a, z1)]));
    }
  }
  return Ln(out.join(""), { tone: "lo" });
}
const winSkip = (a, z0) => a > WIN[0] && a < WIN[1] && z0 >= ZCUT - 1e-6;
const grpCourse = (zi) => `c${zi}`;
// back inner wall (inside of the shell) and the girder behind it
const innerFaces = Mh.wall(RI, [0, H], 0, 360, { inward: true, step: 4, grp: () => "inner" });
const girderAll = Mh.ring(R, R + 3.2, GIRDER_Z, GIRDER_Z + 0.7, 0, 360, { step: 4, grp: "girder" }).filter((f) => !(f.n[2] === 0 && G.dot3(f.n, Mh.radial(0)) === 0 && false));
const tankBack = Mh.svg(girderAll.filter((f) => G.dot3(f.n, V) > 0 && isBack(f)), { edge: "mid" }) + Mh.svg(innerFaces, { edge: "mid", className: "ct-cavity" }) + innerSeams();
function isBack(f) {
  const c = f.pts.reduce((s, p) => G.add3(s, p), [0, 0, 0]);
  return c[0] * Math.cos(VA * D2R) + c[1] * Math.sin(VA * D2R) < 0;
}

// oil column (orange): a cylinder clipped at the oil surface; the clip moves with the level
const OIL_TOP = H; // drawn this tall, clipped down to the level
const oilPaths = k.cylinder(0, 0, RI - 0.05, 0, OIL_TOP, P, 120);
const oilClip = k.cylinder(0, 0, RI - 0.05, -60, 60, P, 120).fill; // hull from z -60 to 0, moved up by the level
const oil =
  `<clipPath id="ct-oil-clip"><path data-part="oil-clip" d="${oilClip}" transform="${k.translateAlong(P, [0, 0, L0])}"/></clipPath>` +
  `<g class="ct-oil" clip-path="url(#ct-oil-clip)">${S(oilPaths, { tone: "mid", crease: "none" })}</g>`;

// floating roof, built at z = 0 (oil surface)
function roofSvg() {
  const faces = [];
  // seal (shoe seal + wiper) between the pontoon and the shell
  const seal = [...Mh.wall(RI - 0.05, [0, 1.1], 0, 360, { step: 6, grp: () => "seal" }), ...Mh.annulus(PONT_OUT, RI - 0.05, 1.1, 0, 360, { step: 6, grp: "seal" })];
  seal.forEach((f) => (f.edgeTone = "mid"));
  faces.push(...seal);
  // pontoon ring with 16 compartments (bulkheads drawn as seams on its top)
  const pont = [
    ...Mh.wall(PONT_OUT, [1.1, PONT_H], 0, 360, { step: 6, grp: () => "pont" }),
    ...Mh.wall(PONT_IN, [DECK_H, PONT_H], 0, 360, { step: 6, inward: true, grp: () => "pont" }),
    ...Mh.annulus(PONT_IN, PONT_OUT, PONT_H, 0, 360, { step: 3.75, grp: (a) => `cell${Math.floor(((a + 360) % 360) / 22.5)}` }),
  ];
  pont.forEach((f) => {
    f.edgeTone = "lit";
    f.seamTone = "lo";
  });
  faces.push(...pont);
  // centre deck (single steel deck plate)
  faces.push({ pts: Mh.span(0, 360, 6).slice(0, -1).map((a) => pol(PONT_IN, a, DECK_H)), n: [0, 0, 1], grp: "deck", bias: -50 });
  let svg = Mh.svg(faces, { edge: "hi", className: "ct-roof" });
  const parts = [];
  // manholes on each compartment
  for (let i = 0; i < 16; i++) {
    const a = i * 22.5 + 11.25;
    const c = pol((PONT_IN + PONT_OUT) / 2, a, PONT_H);
    parts.push(Ln(k.ring(c[0], c[1], 1.5, PONT_H, P, 20), { tone: "mid" }));
    parts.push(Dots([at(c)], { size: 0.45, tone: "mid" }));
  }
  // roof support legs (sleeves through the deck), avoiding the ladder runway
  const legs = [];
  for (let i = 0; i < 14; i++) legs.push(pol(36, i * (360 / 14) + 6, 0));
  for (let i = 0; i < 6; i++) legs.push(pol(19, i * 60 + 35, 0));
  const offTrack = (p) => Math.abs(G.dot3(p, ACROSS) - G.dot3(HINGE, ACROSS)) > LADDER_W;
  // each leg: a pin standing 2.2 above the deck, with its sleeve collar as a dot
  const legPts = byDepth(legs.filter(offTrack));
  parts.push(Ln(legPts.map(([x, y]) => k.rise([x, y], DECK_H, DECK_H + 2.2, P)).join(""), { tone: "mid" }) + Dots(legPts.map(([x, y]) => at([x, y, DECK_H + 2.2])), { size: 0.55, tone: "mid" }) + Dots(legPts.map(([x, y]) => at([x, y, DECK_H])), { size: 0.75, tone: "lo" }));
  // roof drain sump beside the centre
  const sump = G.add3(G.mul3(ACROSS, 7), [0, 0, 0]);
  parts.push(S(k.cylinder(sump[0], sump[1], 2.4, DECK_H - 0.4, 0.6, P, 24), { tone: "lo" }));
  parts.push(Ln([-1.2, 0, 1.2].map((o) => k.lineOnTop([sump[0] + o, sump[1] - Math.sqrt(2.4 ** 2 - o * o) + 0.3], [sump[0] + o, sump[1] + Math.sqrt(2.4 ** 2 - o * o) - 0.3], DECK_H + 0.2, P)).join(""), { tone: "lo" }));
  // ladder runway: two rails from the pontoon's inner edge across the centre
  for (const side of [-1, 1]) {
    const o = G.mul3(ACROSS, (side * LADDER_W) / 2);
    const from = G.add3(G.add3([HINGE[0], HINGE[1], 0], G.mul3(INWARD, RI - 2.5 - PONT_IN + 1)), o);
    const to = G.add3(G.add3([HINGE[0], HINGE[1], 0], G.mul3(INWARD, LADDER_LEN + 4)), o);
    const F = G.frameOf([0, 0, 0], [0, 0, 1], INWARD, ACROSS);
    const u0 = G.dot3(from, INWARD);
    const u1 = G.dot3(to, INWARD);
    const v = G.dot3(o, ACROSS);
    parts.push(S(G.prismOf(F, [[u0, v - 0.4], [u1, v - 0.4], [u1, v + 0.4], [u0, v + 0.4]], DECK_H, TRACK_TOP, P), { tone: "mid" }));
  }
  // rim vent and gauge-pole well
  const vent = pol((PONT_IN + PONT_OUT) / 2 + 1.2, 52, PONT_H);
  parts.push(S(k.cylinder(vent[0], vent[1], 1.1, PONT_H, 1.8, P, 16), { tone: "mid" }), S(k.cylinder(vent[0], vent[1], 1.6, PONT_H + 1.8, 0.5, P, 16), { tone: "mid" }));
  const well = pol(POLE.r, POLE.a, 0);
  parts.push(S(k.cylinder(well[0], well[1], 1.8, DECK_H, 2.4, P, 20), { tone: "mid" }));
  svg += parts.join("");
  return svg;
}
const POLE = { r: 40, a: 128 };
const roof = `<g data-part="roof" transform="${k.translateAlong(P, [0, 0, L0])}">${roofSvg()}</g>`;

// guide pole: fixed, from the floor to above the rim; clipped above the roof well
const POLE_P = pol(POLE.r, POLE.a, 0);
const poleSvg = S(k.cylinder(POLE_P[0], POLE_P[1], 0.9, 0, H + 3, P, 16), { tone: "hi", crease: "none" }) + S(k.cylinder(POLE_P[0], POLE_P[1], 1.3, H + 3, 0.8, P, 16), { tone: "mid" });
const poleTop = at([POLE_P[0], POLE_P[1], DECK_H + 2.4]);
const poleClipD = (() => {
  // everything above the well top, as a screen rectangle (moved with the roof)
  const [x, y] = poleTop;
  return `M${(x - 12).toFixed(1)} ${(y - 300).toFixed(1)}H${(x + 12).toFixed(1)}V${(y + 0.2).toFixed(1)}H${(x - 12).toFixed(1)}Z`;
})();
const pole = `<clipPath id="ct-pole-clip"><path data-part="pole-clip" d="${poleClipD}" transform="${k.translateAlong(P, [0, 0, L0])}"/></clipPath><g clip-path="url(#ct-pole-clip)">${poleSvg}</g>`;

// rolling ladder (rebuilt in the page each frame)
function ladderD(level) {
  const wheelZ = level + TRACK_TOP + 0.6;
  const drop = HINGE[2] - wheelZ;
  const run = Math.sqrt(Math.max(0, LADDER_LEN ** 2 - drop ** 2));
  const foot = G.add3([HINGE[0], HINGE[1], wheelZ], G.mul3(INWARD, run));
  const rails = [-1, 1].map((s) => [G.add3(HINGE, G.mul3(ACROSS, (s * LADDER_W) / 2)), G.add3(foot, G.mul3(ACROSS, (s * LADDER_W) / 2))]);
  const n = 18;
  const rungs = [];
  for (let i = 1; i < n; i++) rungs.push([0, 1].map((j) => G.lerp3(rails[j][0], rails[j][1], i / n)));
  const circ = ([x, y], r) => `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  return { rails: rails.map((r) => path3(r)).join(""), rungs: rungs.map((r) => path3(r)).join(""), wheels: rails.map((r) => circ(at(r[1]), 1.1) + circ(at(r[0]), 0.8)).join("") };
}
const lad = ladderD(L0);
const ladder = `<g data-part="ladder"><path class="iso-line" data-tone="mid" data-part="rungs" d="${lad.rungs}"/><path class="iso-line" data-tone="hi" data-part="rails" d="${lad.rails}" style="stroke-width:1"/><path class="ct-wheel" data-part="wheels" d="${lad.wheels}"/></g>`;

// front of the shell: outer wall with the window cut out, rim, girder front, cut faces
function shellFront() {
  const faces = [];
  const outer = Mh.wall(R, [0, ZCUT, H], 0, 360, { step: 4, grp: () => "outer", skip: (a, z0) => winSkip(a, z0) });
  faces.push(...outer);
  const rim = Mh.annulus(RI, R, H, 0, 360, { step: 4, grp: "rim", skip: (a) => a > WIN[0] && a < WIN[1] });
  faces.push(...rim);
  // cut faces: the two vertical edges and the ledge on the bottom of the window
  faces.push(Mh.cap(RI, R, ZCUT, H, WIN[0], 1, "cut"), Mh.cap(RI, R, ZCUT, H, WIN[1], -1, "cut"));
  faces.push(...Mh.annulus(RI, R, ZCUT, WIN[0], WIN[1], { grp: "ledge" }));
  // wind girder: the front of the ring, cut at the window
  const girder = Mh.ring(R, R + 3.2, GIRDER_Z, GIRDER_Z + 0.7, 0, 360, { step: 4, grp: "girder" }).filter((f) => !isBack(f));
  const gcut = girder.filter((f) => {
    const c = f.pts.reduce((s, p) => G.add3(s, p), [0, 0, 0]).map((v) => v / f.pts.length);
    const a = ((Math.atan2(c[1], c[0]) / D2R) + 360) % 360;
    return !(a > WIN[0] && a < WIN[1]);
  });
  faces.push(...gcut);
  return Mh.svg(faces, { edge: "mid", seam: "lo" }) + outerSeams();
}
const tankSvg = tankBack + oil + roof + pole + ladder + shellFront();
put("tank", [0, 0, H / 2], tankSvg, [A.cylinder(0, 0, R, 0, H, { name: "tank.shell" })]);
record(A.cylinder(0, 0, R + 2, -0.01, 0.01, { name: "stand.ringwall", ground: true }));

// ---------- helpers for recorded parts ----------
function prismItem(name, F, poly, s0, s1, style = {}, { extra = "", inner = "", bias = 0, ref, owner, attrs } = {}) {
  const shape = record(A.prism(F, poly, s0, s1, { name, owner }));
  const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
  const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const centre = G.add3(G.add3(G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), G.mul3(F.u, cx)), G.mul3(F.v, cy));
  put(name, ref ?? centre, S(G.prismOf(F, poly, s0, s1, P), { tone: "mid", ...style, inner }) + extra, [shape], { bias, attrs });
  return shape;
}
const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 0.3, steps = 2, bevel = 0.3, extra = "", inner = "", bias = 0, owner } = {}) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
  const shape = record(A.slab(plan, z0, z1 - z0, { name, owner }, steps));
  put(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, smooth, steps, rims, bevel = 0, owner, ref } = {}) {
  const rMax = Math.max(...profile.map((p) => p[1]));
  const opts = { bevel, ...(smooth !== undefined ? { smooth } : {}), steps: steps ?? Math.round(Math.max(14, Math.min(48, rMax * 7))), ...(rims ? { rims } : {}) };
  const paths = G.solidOf(profile, F, P, opts);
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name, owner, radius: smooth && smooth.radius ? smooth.radius : null }));
  put(name, ref ?? G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}
const discItem = (name, F, s0, s1, r, style = {}, options = {}) => turned(name, F, [[s0, r], [s1, r]], style, options);
function ballItem(name, c, r, style = {}, { bias = 0, owner } = {}) {
  const shape = record(A.ball(c, r, { name, owner }));
  put(name, c, S(G.sphereOf(c, r, P, { steps: 32 }), { tone: "mid", ...style }), [shape], { bias });
  return shape;
}
// a saddle pad on a curved host: its base follows the host surface, its flat face at h from the point
function padOn(name, host, point, outward, a, h, { tone = "mid", owner, extra = "" } = {}) {
  const hosts = [host].flat();
  const inside = (p) => hosts.some((shape) => A.sdf(shape, p) < 0);
  const F = G.frameAlong(point, G.unit3(outward));
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
  const low = Math.min(...Array.from({ length: 48 }, (_, i) => start((i / 48) * Math.PI * 2)));
  put(name, G.add3(point, G.mul3(F.a, h / 2)), S(G.saddleOf(F, a, start, h, P), { tone }) + extra, [record(A.disc(F, low - 0.05, h, a, { name, owner, seated: true, cut: hosts }))], { bias: 0.1 });
  return G.add3(point, G.mul3(F.a, h));
}
function tubeItems(name, route, r, { tone = "mid", gaps = [], maxLength = 14, rims, ends = [true, true], bias = 0, touch, limp = false, caps = true } = {}) {
  R_.route(name, route, r, { gaps, rims, ends, touch, limp, piece: "site" });
  tubePieces(route, r, P, { maxLength, spacing: Math.max(0.6, Math.min(1.6, r * 0.6)), gaps, caps }).forEach((piece, index) =>
    put(`${name}:${index}`, piece.mid, tubeSvg(piece, { tone }), [A.tube(piece.points, piece.radii, { name: `${name}:${index}`, owner: name })], { bias, route: name, chunk: index }),
  );
}
// a flanged pipe: route through control points, collars (flanges/bands/sleeves) gap it
function pipe(name, control, r, { bend = 2.6, tone = "mid", collars = [], extraGaps = [], maxLength = 14, rims, ends, touch } = {}) {
  const line = G.fillet(control, Math.max(r * bend, 3), 12, { P, tube: r });
  const total = G.pathLength(line);
  const gaps = [...(typeof extraGaps === "function" ? extraGaps(line, total) : extraGaps)];
  for (const c of collars) {
    const along = c.at < 0 ? total + c.at : c.at;
    const from = Math.max(0, along - c.thick / 2);
    const to = Math.min(total, along + c.thick / 2);
    gaps.push([from, to]);
    const centre = G.pointAlong(line, (from + to) / 2);
    const tangent = G.tangentAlong(line, (from + to) / 2);
    const F = G.frameAlong(centre, tangent);
    const half = (to - from) / 2;
    const faceDots = c.bolts && Math.abs(G.dot3(F.a, V)) > 0.12 ? Dots(G.dotsOf(F, G.dot3(F.a, V) > 0 ? half : -half, c.r * 0.76, c.bolts, P, { all: true }), { size: 0.4, tone: "mid" }) : "";
    discItem(`${name}.${c.kind}${Math.round(along)}`, F, -half, half, c.r, { tone: c.tone ?? "mid" }, { owner: c.owner === undefined ? name : c.owner, extra: faceDots, bevel: 0.2 });
  }
  tubeItems(name, line, r, { tone, gaps, maxLength, rims, ends, touch });
  line.owner = name;
  line.total = total;
  return line;
}
// gate valve on a straight leg of a line: flanged body, bonnet, yoke and handwheel (stem rising)
function gateValve(name, line, along, r, { tone = "mid", up = 1 } = {}) {
  const centre = G.pointAlong(line, along);
  const tangent = G.tangentAlong(line, along);
  const F = G.frameAlong(centre, tangent);
  const half = r * 2.1;
  const fl = r * 1.55;
  const crown = r * 1.75;
  const bulge = (x) => r * 1.25 + (crown - r * 1.25) * Math.sqrt(Math.max(0, 1 - (x / (r * 1.4)) ** 2));
  const meridian = [
    [-half, 0], [-half, fl], [-half + 0.9, fl], [-half + 0.9, r * 1.2],
    ...Array.from({ length: 13 }, (_, i) => { const x = r * 1.4 * Math.sin(((i - 6) / 6) * (Math.PI / 2)); return [x, bulge(x), i && i < 12 ? 1 : 0]; }),
    [half - 0.9, r * 1.2], [half - 0.9, fl], [half, fl], [half, 0],
  ];
  const bodyDots = Dots([...G.dotsOf(F, -half, fl * 0.78, 8, P, { fade: [0.04, 0.42] }), ...G.dotsOf(F, half, fl * 0.78, 8, P, { fade: [0.04, 0.42] })], { size: 0.4, tone: "mid" });
  put(name, centre, S(G.lathe(meridian, F, P, { steps: 28, smooth: { rows: 2 } }), { tone }) + bodyDots, [record(A.body(F, meridian, { name, owner: line.owner }))]);
  // bonnet: neck, bolted flange, bonnet barrel
  const NF = G.frameAlong(centre, [0, 0, 1]);
  const s0 = crown - 0.3;
  const bonnet = [[s0, 0], [s0, r * 0.8], [crown + 1.2, r * 0.8], [crown + 1.2, r * 1.15], [crown + 1.9, r * 1.15], [crown + 1.9, r * 0.75], [crown + 4.4, r * 0.62], [crown + 4.4, 0]];
  put(`${name}.bonnet`, G.add3(centre, [0, 0, crown + 2]), S(G.solidOf(bonnet.slice(1, -1), NF, P), { tone }) + Dots(G.dotsOf(NF, crown + 1.9, r * 1.0, 6, P, { all: true }), { size: 0.38, tone: "mid" }), [record(A.solid(NF, bonnet.slice(1, -1), { name: `${name}.bonnet`, owner: line.owner }))], { bias: 0.2 });
  // yoke: two flat legs to the yoke nut
  const yb = crown + 4.4;
  const yt = yb + 5.2;
  const side = G.unit3(G.cross3([0, 0, 1], tangent));
  for (const s of [-1, 1]) {
    const c = G.add3(centre, G.mul3(side, s * r * 0.5));
    const YF = G.frameOf(c, [0, 0, 1], side, tangent);
    prismItem(`${name}.yoke${s > 0 ? "R" : "L"}`, YF, rect(-0.35, 0.35, -0.7, 0.7), yb, yt, { tone: "mid" }, { owner: line.owner, bias: 0.25 });
  }
  const nutF = G.frameAlong(G.add3(centre, [0, 0, 0]), [0, 0, 1]);
  turned(`${name}.nut`, nutF, [[yt, r * 0.95], [yt + 0.9, r * 0.95]], { tone: "mid" }, { owner: line.owner, bias: 0.3 });
  // stem (rising stem: shows how open the valve is) and handwheel
  const hw0 = yt + 2.6;
  turned(`${name}.stem`, nutF, [[yt + 0.9, 0.35], [hw0 - 0.5, 0.35]], { tone: "hi" }, { owner: line.owner, bias: 0.35 });
  turned(`${name}.stemtop`, nutF, [[hw0 + 0.5, 0.35], [yt + 4.2, 0.35]], { tone: "hi" }, { owner: line.owner, bias: 0.45 });
  const hw = yt + 2.6;
  const rw = r * 1.9;
  const wheel = G.ringBand(hw - 0.35, hw + 0.35, rw - 0.55, rw, nutF, P, { steps: 40, hole: [hw + 0.35, rw - 0.55] });
  const hub = [[hw - 0.5, 0.75], [hw + 0.5, 0.75]];
  const spokes = [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    return path3([G.add3(nutF.o, [Math.cos(a) * 0.75, Math.sin(a) * 0.75, hw + 0.3]), G.add3(nutF.o, [Math.cos(a) * (rw - 0.55), Math.sin(a) * (rw - 0.55), hw + 0.3])]);
  }).join("");
  const spokeShapes = [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const SF = G.frameAlong(G.add3(nutF.o, [0, 0, hw]), [Math.cos(a), Math.sin(a), 0]);
    return record(A.disc(SF, 0.6, rw - 0.45, 0.18, { name: `${name}.spoke${i}`, owner: line.owner }));
  });
  put(`${name}.wheel`, G.add3(nutF.o, [0, 0, hw]), S(wheel, { tone: "mid" }) + Ln(spokes, { tone: "mid" }) + S(G.solidOf(hub, nutF, P), { tone: "mid" }), [record(A.ring(nutF, hw - 0.35, hw + 0.35, rw - 0.55, rw, { name: `${name}.wheel`, owner: line.owner })), record(A.disc(nutF, hw - 0.5, hw + 0.5, 0.75, { name: `${name}.hub`, owner: line.owner })), ...spokeShapes], { bias: 0.4 });
  return { centre, half };
}

// ---------- spiral stair, gauger's platform ----------
const STAIR = { a0: 100, a1: 156, r0: R + 0.1, r1: R + 4.4, n: 16 };
const stairZ = (a) => ((H + 0.4) * (a - STAIR.a0)) / (STAIR.a1 - STAIR.a0);
const stairA = (z) => STAIR.a0 + ((STAIR.a1 - STAIR.a0) * z) / (H + 0.4);
for (let i = 1; i < STAIR.n; i++) {
  const z = ((H + 0.4) * i) / STAIR.n;
  const a = stairA(z);
  const F = G.frameOf([0, 0, 0], [0, 0, 1], Mh.radial(a), Mh.radial(a + 90));
  prismItem(`stair.tread${i}`, F, rect(STAIR.r0, STAIR.r1, -1.3, 1.3), z - 0.5, z, { tone: "mid" });
}
const helix = (r, dz, a0 = STAIR.a0, a1 = STAIR.a1) => Mh.span(a0, a1, 1).map((a) => pol(r, a, stairZ(a) + dz));
// landing at the foot of the stair
prismItem("stair.landing", G.frameOf([0, 0, 0], [0, 0, 1], Mh.radial(STAIR.a0 + 1), Mh.radial(STAIR.a0 + 91)), rect(R + 0.3, R + 7.4, -3.6, 3.6), 0, 0.8, { tone: "lo" });
// gauger's platform on the rim
const PF = G.frameOf([0, 0, 0], [0, 0, 1], Mh.radial(LADDER_A), Mh.radial(LADDER_A + 90));
prismItem("platform.deck", PF, rect(RI - 3.6, R + 5.2, -4.6, 4.6), H, H + 0.8, { tone: "mid" }, { extra: Ln([-2.3, 0, 2.3].map((v) => path3([G.add3(G.mul3(PF.u, RI - 3.6), G.add3(G.mul3(PF.v, v), [0, 0, H + 0.8])), G.add3(G.mul3(PF.u, R + 5.2), G.add3(G.mul3(PF.v, v), [0, 0, H + 0.8]))])).join(""), { tone: "faint" }) });
// stringer up the stair (the treads are welded to it), from the landing to the platform's side face
const STR_R = R + 4.75;
{
  const top = G.add3(G.add3(G.mul3(PF.u, STR_R), G.mul3(PF.v, -4.6)), [0, 0, H + 0.4]);
  const pts = [pol(STR_R, STAIR.a0 + 1.2, 0.8), pol(STR_R, STAIR.a0 + 1.2, 2.6), ...Mh.span(STAIR.a0 + 6, 150, 2).map((a) => pol(STR_R, a, stairZ(a) + 0.2)), G.sub3(top, G.mul3(PF.v, 3.2)), top];
  tubeItems("stair.stringer", G.fillet(pts, 2.4, 8, { P, tube: 0.42 }), 0.42, { tone: "mid", maxLength: 6, touch: ["stair.tread*"] });
}
// handrail: posts on the treads, knuckle balls on the posts, rail segments between the knuckles
const RAIL_R = R + 3.7;
const POSTS = [2, 5, 8, 11];
const knuckles = POSTS.map((i) => {
  const z = ((H + 0.4) * i) / STAIR.n;
  const a = stairA(z);
  const c = pol(RAIL_R, a, 0);
  turned(`stair.post${i}`, G.frameAlong([c[0], c[1], 0], [0, 0, 1]), [[z, 0.26], [z + 4.6, 0.26]], { tone: "mid" });
  const k3 = [c[0], c[1], z + 4.6 + 0.45];
  ballItem(`stair.knuckle${i}`, k3, 0.5, { tone: "mid" });
  return k3;
});
for (let i = 0; i < knuckles.length - 1; i++) {
  const a = knuckles[i];
  const b = knuckles[i + 1];
  const aa = Math.atan2(a[1], a[0]) / D2R;
  const bb = Math.atan2(b[1], b[0]) / D2R;
  const mid = Mh.span(aa, bb, 2).slice(1, -1).map((ang) => pol(RAIL_R, ang, a[2] + ((b[2] - a[2]) * (ang - aa)) / (bb - aa)));
  const pts = [a, ...mid, b];
  const d0 = G.unit3(G.sub3(pts[1], pts[0]));
  const d1 = G.unit3(G.sub3(pts[pts.length - 1], pts[pts.length - 2]));
  const off = Math.sqrt(0.5 ** 2 - 0.3 ** 2);
  pts[0] = G.add3(a, G.mul3(d0, off));
  pts[pts.length - 1] = G.sub3(b, G.mul3(d1, off));
  tubeItems(`stair.rail${i}`, pts, 0.3, { tone: "mid", maxLength: 6 });
}
// platform railing: two posts on its outer edge, knuckles, and the top rail between them
{
  const railPts = [-4, 4].map((v) => G.add3(G.mul3(PF.u, R + 4.6), G.mul3(PF.v, v)));
  const ks = railPts.map((p, i) => {
    turned(`platform.post${i}`, G.frameAlong([p[0], p[1], 0], [0, 0, 1]), [[H + 0.8, 0.28], [H + 5.4, 0.28]], { tone: "mid" });
    const k3 = [p[0], p[1], H + 5.4 + 0.45];
    ballItem(`platform.knuckle${i}`, k3, 0.5, { tone: "mid" });
    return k3;
  });
  const d = G.unit3(G.sub3(ks[1], ks[0]));
  const off = Math.sqrt(0.5 ** 2 - 0.3 ** 2);
  tubeItems("platform.rail", [G.add3(ks[0], G.mul3(d, off)), G.sub3(ks[1], G.mul3(d, off))], 0.3, { tone: "mid", maxLength: 6 });
}

// ---------- gauge board with float-gauge target ----------
const GB = { a: 20, s0: R + 3.6, s1: R + 4.4, w: 2.6 };
const GF = G.frameOf([0, 0, 0], Mh.radial(GB.a), Mh.radial(GB.a + 90), [0, 0, 1]);
const zOfMbbl = (m) => M.Z_HIGH - (m / (M.WORKING_KB / 1000)) * (M.Z_HIGH - M.Z_LOW);
{
  const minor = [];
  const major = [];
  for (let m = 0; m <= 76; m += 2) {
    const z = zOfMbbl(m);
    const len = m % 10 === 0 ? 1.9 : 1.0;
    (m % 10 === 0 ? major : minor).push(path3([G.add3(G.mul3(GF.a, GB.s1), G.add3(G.mul3(GF.u, -GB.w), [0, 0, z])), G.add3(G.mul3(GF.a, GB.s1), G.add3(G.mul3(GF.u, -GB.w + len), [0, 0, z]))]));
  }
  // the board: a plank on three brackets
  prismItem("gauge.board", GF, rect(-GB.w, GB.w, M.Z_LOW - 1.2, M.Z_HIGH + 0.6), GB.s0, GB.s1, { tone: "mid" }, { extra: Ln(minor.join(""), { tone: "lo" }) + Ln(major.join(""), { tone: "hi" }) });
  for (const z of [M.Z_LOW + 1, (M.Z_LOW + M.Z_HIGH) / 2, M.Z_HIGH - 1]) prismItem(`gauge.bracket${Math.round(z)}`, GF, rect(-0.6, 0.6, z - 0.6, z + 0.6), R - 0.02, GB.s0, { tone: "lo" });
  // gauge head (sheave box) on top of the board, conduit over the rim to the tape sheave on the rim
  prismItem("gauge.head", GF, rect(-1.8, 1.8, M.Z_HIGH + 0.6, M.Z_HIGH + 3), GB.s0, GB.s1 + 1.4, { tone: "mid" }, { extra: Dots([G.add3(G.mul3(GF.a, GB.s1 + 1.4), [0, 0, M.Z_HIGH + 1.8])].map(at), { size: 0.45 }) });
  prismItem("gauge.sheave", GF, rect(-1.4, 1.4, H, H + 3.6), RI - 1.2, R + 1.4, { tone: "mid" });
}
const TAPE_U = 1.2;
const tapeAt = (z) => G.add3(G.mul3(GF.a, GB.s1 + 0.05), G.add3(G.mul3(GF.u, TAPE_U), [0, 0, z]));
// the target rides on the board face; its index edge reads the board (0 m bbl at the top, 76 at the bottom):
// index z = Z_HIGH + Z_LOW - level (the tape runs over the sheave, so the target falls as the roof rises)
const targetZ = (level) => M.Z_HIGH + M.Z_LOW - level;
const TZ0 = targetZ(L0);
{
  const TF = GF;
  const svgT = S(G.prismOf(TF, rect(-GB.w - 0.4, TAPE_U + 0.9, TZ0 - 0.7, TZ0 + 0.7), GB.s1, GB.s1 + 0.7, P), { tone: "hi", lit: true }) +
    Ln(path3([G.add3(G.mul3(TF.a, GB.s1 + 0.7), G.add3(G.mul3(TF.u, -GB.w - 0.4), [0, 0, TZ0])), G.add3(G.mul3(TF.a, GB.s1 + 0.7), G.add3(G.mul3(TF.u, TAPE_U - 0.6), [0, 0, TZ0]))]), { tone: "lit" });
  const sh = record(A.prism(TF, rect(-GB.w - 0.4, TAPE_U + 0.9, TZ0 - 0.7, TZ0 + 0.7), GB.s1, GB.s1 + 0.7, { name: "gauge.target" }));
  put("gauge.target", G.add3(G.mul3(GF.a, GB.s1 + 0.4), [0, 0, TZ0]), `<g data-part="target">${svgT}</g>`, [sh], { bias: 0.2 });
  // the tape from the target up to the gauge head
  put("gauge.tape", G.add3(G.mul3(GF.a, GB.s1 + 0.1), [0, 0, (TZ0 + M.Z_HIGH) / 2]), `<path class="iso-line" data-tone="hi" data-part="tape" d="${path3([tapeAt(TZ0 + 0.7), tapeAt(M.Z_HIGH + 0.6)])}"/>`, [A.tube([tapeAt(TZ0 + 0.7), tapeAt(M.Z_HIGH + 0.6)], 0.2, { name: "gauge.tape", limp: true })], { bias: 0.1 });
}
{
  const conduit = [G.add3(G.mul3(GF.a, GB.s0 + 1.6), [0, 0, M.Z_HIGH + 3]), G.add3(G.mul3(GF.a, GB.s0 + 1.6), [0, 0, H + 2.4]), G.add3(G.mul3(GF.a, R + 1.4), [0, 0, H + 2.4])];
  tubeItems("gauge.conduit", G.fillet(conduit, 1.2, 8, { P, tube: 0.45 }), 0.45, { tone: "mid", maxLength: 6 });
}

// ---------- shell manway ----------
{
  const a = 10;
  const F = G.frameAlong(pol(R - 0.05, a, 3.6), Mh.radial(a));
  discItem("manway.pad", F, 0, 0.5, 3.6, { tone: "mid" });
  discItem("manway.cover", F, 0.5, 1.3, 3.0, { tone: "mid" }, { extra: Dots(G.dotsOf(F, 1.3, 2.5, 12, P, { all: true }), { size: 0.4 }) });
  turned("manway.davit", F, [[1.3, 0.6], [2.4, 0.6]], { tone: "hi" });
}

// ---------- tank lines: nozzles, gate valves, up and over the berm to the header ----------
const PR = 2.4; // pipe radius
const RUN_Z = 16; // pipe-rack height (pipe centreline)
const HEADER_X = 112;
const TEE_R = 3.6;
const TANK_LINES = [-22, -6];
const teeEnd = HEADER_X - Math.sqrt(TEE_R ** 2 - PR ** 2);
const valves = [];
TANK_LINES.forEach((a, i) => {
  const start = pol(R - 0.02, a, 4.6);
  const rise = pol(74, a, 4.6);
  const pts = [start, rise, [rise[0], rise[1], RUN_Z], [teeEnd, rise[1], RUN_Z]];
  const vAt = 0.6 + 2.1 * PR;
  const line = pipe(`line${i}`, pts, PR, { collars: [{ kind: "pad", at: 0.3, thick: 0.6, r: 4.2, owner: null }, { kind: "flange", at: vAt + 2.1 * PR + 0.35, thick: 0.7, r: 3.5, bolts: 8 }], extraGaps: [[vAt - 2.1 * PR, vAt + 2.1 * PR]], touch: [`support${i}.*`] });
  const v = gateValve(`valve${i}`, line, vAt, PR);
  valves.push(v);
});
// supports: T-posts outside the berm
for (const x of [95]) {
  for (const [i, a] of TANK_LINES.entries()) {
    const y = pol(74, a, 0)[1];
    box(`support${i}.cap`, [x - 1.6, y - 3, RUN_Z - PR - 0.8], [x + 1.6, y + 3, RUN_Z - PR], { tone: "mid" });
    box(`support${i}.post`, [x - 0.7, y - 0.7, 0.7], [x + 0.7, y + 0.7, RUN_Z - PR - 0.8], { tone: "mid" });
    box(`support${i}.foot`, [x - 2, y - 2, 0], [x + 2, y + 2, 0.7], { tone: "lo" });
  }
}

// ---------- pipe rack and manifold ----------
const BEAM_TOP = RUN_Z - PR;
for (const y of [-18, 22, 47]) {
  box(`rack.beam${y}`, [HEADER_X - 8, y - 1, BEAM_TOP - 1], [HEADER_X + 26, y + 1, BEAM_TOP], { tone: "mid" });
  for (const x of [HEADER_X - 6, HEADER_X + 23]) box(`rack.post${y}.${x}`, [x - 0.8, y - 0.8, 0], [x + 0.8, y + 0.8, BEAM_TOP - 1], { tone: "mid" });
}
// header + meter run (south) + kicker (north) as one line, from the meter riser to the launcher barrel
const BARREL = { x: HEADER_X + 38, y0: 40, y1: 68, r: 4.2 };
const SOUTH_Y = -44;
const RISER_X = 166;
function alongOf(line, p) {
  let best = 0, bestD = Infinity, s = 0;
  for (let i = 1; i < line.length; i++) {
    const d = G.sub3(line[i], line[i - 1]);
    const L = G.len3(d);
    const t = Math.max(0, Math.min(1, G.dot3(G.sub3(p, line[i - 1]), d) / (L * L || 1)));
    const q = G.add3(line[i - 1], G.mul3(d, t));
    const dist = G.len3(G.sub3(q, p));
    if (dist < bestD) (bestD = dist), (best = s + t * L);
    s += L;
  }
  return best;
}
const STRAINER_AT = [127, SOUTH_Y, RUN_Z];
const STRAINER_R = 3.4;
const METER_AT = [147.5, SOUTH_Y, RUN_Z];
const METER_HALF = 5.2;
const meterLine = pipe("header", [[RISER_X, SOUTH_Y, 0], [RISER_X, SOUTH_Y, RUN_Z], [HEADER_X, SOUTH_Y, RUN_Z], [HEADER_X, 60, RUN_Z], [BARREL.x - BARREL.r - 1.2, 60, RUN_Z]], PR, {
  collars: [{ kind: "sleeve", at: 0.6, thick: 1.2, r: 3.6, tone: "lo" }],
  touch: ["rack.beam*", "skid.cap*", "skid.post*"],
  extraGaps: (line) => [...TANK_LINES.map((a) => [HEADER_X, pol(74, a, 0)[1], RUN_Z]), STRAINER_AT, METER_AT].map((p) => {
    const s = alongOf(line, p);
    const c = p === STRAINER_AT ? STRAINER_R + 0.8 : p === METER_AT ? METER_HALF : Math.sqrt(TEE_R ** 2 - PR ** 2);
    return [s - c, s + c];
  }),
});
// tees on the header where the tank lines land
for (const [i, a] of TANK_LINES.entries()) ballItem(`tee${i}`, [HEADER_X, pol(74, a, 0)[1], RUN_Z], TEE_R, { tone: "mid" }, { owner: "header" });

let POT;
// basket strainer: a vertical pot the line passes through, bolted cover on top
{
  const F = G.frameAlong([STRAINER_AT[0], STRAINER_AT[1], 0], [0, 0, 1]);
  const z0 = RUN_Z - 5;
  const z1 = RUN_Z + 4.2;
  POT = turned("strainer.pot", F, [[z0, STRAINER_R * 0.7, 1], [z0 + 1.6, STRAINER_R, 1], [z1, STRAINER_R]], { tone: "mid" }, { owner: "header", inner: Ln(G.arcOf(F, RUN_Z, STRAINER_R, P), { tone: "faint" }) });
  discItem("strainer.cover", F, z1, z1 + 0.9, STRAINER_R + 0.7, { tone: "mid" }, { extra: Dots(G.dotsOf(F, z1 + 0.9, STRAINER_R + 0.2, 10, P, { all: true }), { size: 0.4 }) });
  turned("strainer.vent", F, [[z1 + 0.9, 0.5], [z1 + 2.2, 0.5]], { tone: "mid" });
  discItem("strainer.drain", F, z0 - 1.4, z0, 0.6, { tone: "mid" });
  // inlet and outlet nozzles: flanged stubs out of the pot, the line lands on their faces
  for (const sgn of [-1, 1]) {
    const NF = G.frameAlong(STRAINER_AT, [sgn, 0, 0]);
    padOn(`strainer.nozzle${sgn > 0 ? "out" : "in"}`, POT, STRAINER_AT, [sgn, 0, 0], PR * 1.05, STRAINER_R + 0.2, { owner: "header" });
    turned(`strainer.flange${sgn > 0 ? "out" : "in"}`, NF, [[STRAINER_R + 0.2, PR * 1.5], [STRAINER_R + 0.8, PR * 1.5]], { tone: "mid" }, { owner: "header", extra: Dots(G.dotsOf(NF, STRAINER_R + 0.8, PR * 1.2, 8, P, { fade: [0.04, 0.42] }), { size: 0.38 }) });
  }
}
// turbine meter: flanged spool with a register head on a neck
{
  const F = G.frameAlong(METER_AT, [1, 0, 0]);
  const h = METER_HALF;
  const prof = [[-h, PR * 1.55], [-h + 0.9, PR * 1.55], [-h + 0.9, PR * 1.15], [h - 0.9, PR * 1.15], [h - 0.9, PR * 1.55], [h, PR * 1.55]];
  turned("meter.body", F, prof, { tone: "mid" }, { owner: "header", extra: Dots([...G.dotsOf(F, -h, PR * 1.2, 8, P, { fade: [0.04, 0.42] }), ...G.dotsOf(F, h, PR * 1.2, 8, P, { fade: [0.04, 0.42] })], { size: 0.4, tone: "mid" }) });
  const NF = G.frameAlong(METER_AT, [0, 0, 1]);
  turned("meter.neck", NF, [[PR * 1.15 - 0.2, 0.8], [PR * 1.15 + 1.4, 0.8]], { tone: "mid" });
  const z0 = METER_AT[2] + PR * 1.15 + 1.4;
  box("meter.register", [METER_AT[0] - 2, METER_AT[1] - 1.8, z0], [METER_AT[0] + 2, METER_AT[1] + 1.8, z0 + 3], { tone: "mid" }, { extra: Ln(k.planOutline(k.insetPlan({ x: METER_AT[0] - 2, y: METER_AT[1] - 1.8, w: 4, d: 3.6, r: 0.3 }, 0.8), z0 + 3, P, 2), { tone: "faint" }) });
}
// meter skid under the run, with two pipe supports
{
  const skid = { x: 118, y: SOUTH_Y - 6, w: 44, d: 12, r: 0.6 };
  box("skid.base", [skid.x, skid.y, 0], [skid.x + skid.w, skid.y + skid.d, 1.4], { tone: "lo" }, { inner: Ln(k.sideSeam(skid, 0.7, P, 2), { tone: "faint" }) });
  for (const x of [137, 157]) {
    box(`skid.post${x}`, [x - 0.7, SOUTH_Y - 0.7, 1.4], [x + 0.7, SOUTH_Y + 0.7, RUN_Z - PR - 0.8], { tone: "mid" });
    box(`skid.cap${x}`, [x - 1.6, SOUTH_Y - 2.6, RUN_Z - PR - 0.8], [x + 1.6, SOUTH_Y + 2.6, RUN_Z - PR], { tone: "mid" });
  }
}
// pig launcher: barrel with quick-opening closure facing the yard, reducer, mainline back along the rack and down
{
  const F = G.frameOf([BARREL.x, 0, RUN_Z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const prof = [[BARREL.y0, PR], [BARREL.y0 + 3.2, BARREL.r, 1], [BARREL.y1, BARREL.r]];
  const BAR = turned("launcher.barrel", F, [[BARREL.y0 - 1.2, PR * 1.5], [BARREL.y0 - 0.5, PR * 1.5], [BARREL.y0 - 0.5, PR], [BARREL.y0, PR], ...prof.slice(1)], { tone: "mid" }, { inner: Ln(G.arcOf(F, BARREL.y0 + 14, BARREL.r, P), { tone: "faint" }) });
  padOn("launcher.kickerpad", BAR, [BARREL.x, 60, RUN_Z], [-1, 0, 0], PR * 1.3, BARREL.r + 1.2, { tone: "mid" });
  discItem("launcher.hub", F, BARREL.y1, BARREL.y1 + 1.2, BARREL.r + 0.8, { tone: "mid" });
  discItem("launcher.door", F, BARREL.y1 + 1.2, BARREL.y1 + 2.2, BARREL.r + 0.4, { tone: "mid" }, { extra: Dots(G.dotsOf(F, BARREL.y1 + 2.2, BARREL.r - 0.6, 6, P, { all: true }), { size: 0.45, tone: "mid" }) + Ln(G.circleOf(F, BARREL.y1 + 2.2, 1.6, P, 24), { tone: "faint" }) });
  // closure hinge block on the side of the hub
  box("launcher.hinge", [BARREL.x + BARREL.r + 0.8, BARREL.y1 - 0.4, RUN_Z - 1.2], [BARREL.x + BARREL.r + 2.2, BARREL.y1 + 2.6, RUN_Z + 1.2], { tone: "mid" });
  // pressure gauge on a nipple on top of the barrel near the door
  const g = [BARREL.x, BARREL.y1 - 3, RUN_Z];
  const NF = G.frameAlong(g, [0, 0, 1]);
  turned("launcher.nipple", NF, [[BARREL.r - 0.15, 0.4], [BARREL.r + 2.2, 0.4]], { tone: "mid" });
  const GF2 = G.frameAlong([g[0], g[1], g[2] + BARREL.r + 3.2], [0, 1, 0]);
  discItem("launcher.gauge", GF2, -0.6, 0.6, 1.3, { tone: "hi" }, { extra: Ln(G.circleOf(GF2, 0.6, 0.9, P, 20), { tone: "lo" }) });
  // saddles
  for (const y of [BARREL.y0 + 7, BARREL.y1 - 7]) {
    box(`launcher.saddle${y}`, [BARREL.x - 2.4, y - 1.2, RUN_Z - BARREL.r - 0.8], [BARREL.x + 2.4, y + 1.2, RUN_Z - BARREL.r], { tone: "mid" });
    box(`launcher.leg${y}`, [BARREL.x - 0.7, y - 0.7, 0], [BARREL.x + 0.7, y + 0.7, RUN_Z - BARREL.r - 0.8], { tone: "mid" });
  }
  const MV = 7.6;
  const main = pipe("mainline", [[BARREL.x, BARREL.y0 - 1.2, RUN_Z], [BARREL.x, 20, RUN_Z], [BARREL.x + 14, 20, RUN_Z], [BARREL.x + 14, 20, 0]], PR, {
    collars: [{ kind: "flange", at: 0.35, thick: 0.7, r: 3.6, bolts: 8, owner: null }, { kind: "sleeve", at: -0.6, thick: 1.2, r: 3.6, tone: "lo" }],
    extraGaps: [[MV - 2.1 * PR, MV + 2.1 * PR]],
    touch: ["rack.beam*"],
  });
  gateValve("valve.main", main, MV, PR);
}

// ---------- fire-water monitor outside the berm (foam/water cannon aimed at the tank) ----------
{
  const base = [-58, 74];
  const F = G.frameAlong([base[0], base[1], 0], [0, 0, 1]);
  turned("monitor.flange", F, [[0, 2.6], [0.7, 2.6]], { tone: "lo" }, { extra: Dots(G.dotsOf(F, 0.7, 2.0, 6, P, { all: true }), { size: 0.4 }) });
  turned("monitor.riser", F, [[0.7, 1.2], [8.2, 1.2], [8.2, 1.7], [9.0, 1.7]], { tone: "mid" }, { inner: Ln(G.arcOf(F, 4.2, 1.2, P), { tone: "faint" }) });
  const ball = [base[0], base[1], 9.0 + 1.6];
  ballItem("monitor.swivel", ball, 1.9, { tone: "mid" });
  const dir = G.unit3([-base[0], -base[1], Math.hypot(base[0], base[1]) * 0.36]);
  const NF = G.frameAlong(ball, dir);
  const r0 = 1.0;
  const s0 = Math.sqrt(1.9 ** 2 - r0 ** 2);
  turned("monitor.barrel", NF, [[s0, r0], [s0 + 4.5, 0.85, 1], [s0 + 7.5, 0.6, 1], [s0 + 7.5, 0.8], [s0 + 8.6, 0.8]], { tone: "mid" });
  // the aiming lever
  const LF = G.frameAlong(ball, G.unit3([-dir[0], -dir[1], -0.2]));
  turned("monitor.lever", LF, [[1.75, 0.3], [5.2, 0.3]], { tone: "mid" });
}

// ---------- order, page ----------
A.settle(R_, P);
R_.items.sort((a, b) => a.key - b.key);
const svgFig = k.figureSvg({
  width: W,
  height: HT,
  label: "A crude storage tank at Cushing, Oklahoma, inside an earth berm, with part of its shell cut away: the orange crude inside, the external floating roof riding on it, the rolling ladder from the gauger's platform, the spiral stair, the gauge board, and the valves and pipes to the manifold. The roof rises and falls with the weekly crude stocks held at Cushing.",
  body: [...back, `<g data-part="cursor">${cursorSvg}</g>`, ...R_.items.map((item) => `<g class="it" data-name="${item.name}">${item.svg}</g>`)],
});

const CSS = readFileSync(join(HERE, "cushing-tank.css"), "utf8");
const DATA = {
  P,
  weeks: M.WEEKS,
  stocks: M.STOCKS,
  zLow: M.Z_LOW,
  zHigh: M.Z_HIGH,
  working: M.WORKING_KB,
  stops: [M.NEGATIVE_WEEK, M.PEAK_2020, M.LOW_2026, M.LATEST],
  latest: M.LATEST,
  hinge: HINGE,
  tz0: TZ0,
  tapeFoot: tapeAt(0),
  tapeTop: tapeAt(M.Z_HIGH + 0.6),
  inward: INWARD,
  across: ACROSS,
  ladderLen: LADDER_LEN,
  ladderW: LADDER_W,
  trackTop: TRACK_TOP,
  strip: { x0: xOfYear(YEAR0), x1: xOfYear(YEAR1), y: YF + STRIP.t, z: STRIP.z1, y0: YEAR0, y1: YEAR1 },
};
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const body = `<style>${CSS}</style>` + k.plateHtml({
  fig: "Fig · Cushing, Oklahoma",
  title: "Crude storage tank",
  hint: "Drag or ← → through the weeks",
  readout: M.readout(M.LATEST),
  keys: [
    { mark: "lit", label: "Floating roof and gauge target: their height is Cushing crude stocks" },
    { mark: "raised", label: "Shell cut away to show the crude (orange)" },
    { mark: "red", label: "Time rule: week WTI futures went negative" },
  ],
  caption: "Schematic: one tank stands for the whole hub. Capacities approximate (EIA storage-capacity report); stocks EIA weekly, 2004 to 16 Oct 2026.",
  body: `<div class="iso-stage ct-stage" tabindex="0" role="slider" aria-label="Cushing crude stocks by week; left and right arrows step one week, Page Up and Page Down one year" aria-valuemin="0" aria-valuemax="${M.WEEKS.length - 1}" aria-valuenow="${M.LATEST}" aria-valuetext="${M.readout(M.LATEST)}">${svgFig}</div>`,
});
const page = k.pageHtml({ title: "Cushing tank", theme: THEME, body, script: kitScript() + LIVE, width: 720 });
mkdirSync(OUT, { recursive: true });
const name = THEME === "light" ? "cushing-tank-light.html" : "cushing-tank.html";
writeFileSync(join(OUT, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`, `${R_.items.length} items`, `scale ${KS.toFixed(3)}`);
A.auditOrExit(R_, P, { crowd: [["gauge.conduit", "gauge.board"]] });
