// Truth for the distillation-column figure ("column"). Every number the page shows comes from here.
// Pure module: no DOM. build.mjs imports it and inlines the data and the readout functions into the page.
// All numbers are from the research note
//   ~/code/ConceptsPlots/070_research/research_notes/the_oil_market_2026/060_distillation_chemistry.md
// (referred to as "060 §x" below), with that note's source and status.

// ---------- n-alkane normal boiling points, °C (060 §2.2; ASTM D2887 / NIST / CRC via Wikipedia, primary) ----------
export const ALKANES = [
  [1, "methane", -161.5], [2, "ethane", -88.6], [3, "propane", -42.1], [4, "butane", -0.5], [5, "pentane", 36.1],
  [6, "hexane", 68.7], [7, "heptane", 98.4], [8, "octane", 125.6], [9, "nonane", 150.8], [10, "decane", 174.1],
  [11, "undecane", 195.9], [12, "dodecane", 216.3], [13, "tridecane", 235.4], [14, "tetradecane", 253.5],
  [15, "pentadecane", 270.6], [16, "hexadecane", 286.8], [17, "heptadecane", 302], [18, "octadecane", 317],
  [19, "nonadecane", 330], [20, "eicosane", 342.7], [21, "heneicosane", 356.5], [22, "docosane", 368.7],
  [23, "tricosane", 380], [24, "tetracosane", 391.3], [25, "pentacosane", 401], [26, "hexacosane", 412.2],
];
export const alkane = (n) => ALKANES.find((a) => a[0] === n);

// Carbon range of a cut: the n-alkanes whose normal boiling point lies inside it (060 §3, "derived check").
// Branched, ring and aromatic molecules of the same boiling range have fewer carbons (060 §2.3).
export function carbonOf(lo, hi) {
  const inside = ALKANES.filter(([, , tb]) => (lo === null || tb >= lo) && (hi === null || tb <= hi)).map(([n]) => n);
  return { from: inside[0], to: hi === null ? null : inside[inside.length - 1] };
}

// ---------- the column's temperature profile (060 §4.3) ----------
// A 59-tray worked example, US patent 10,913,908 B2 (status: SNIPPET, PDF not opened), so every draw
// temperature is printed "about". The Chulalongkorn thesis snippet in 060 gives similar values.
export const PROFILE = {
  overhead: 104.4, // top tray / overhead vapour
  heavyNaphtha: 160.6,
  kerosene: 205,
  diesel: 261.7,
  gasoil: 322.2, // atmospheric gasoil (AGO) draw
  flash: 346, // flash zone (feed); the patent gives 328-374 °C
  flashRange: [328, 374],
  bottoms: 340.6, // cooler than the flash zone: stripping steam boils light ends out of the residue
};

// ---------- furnace, flash, pressure, trays ----------
export const FURNACE = {
  // feed into the column 650-700 °F; hotter "may cause undesirable thermal cracking" (OSHA, primary, 060 §4.2)
  columnFeedC: [343, 371],
};
// "As much as 50% of the incoming crude may be flashed" (Jechura, primary, 060 §4.2)
export const FLASHED_MAX = 50;
export const COLUMN = {
  realTrays: [35, 50], // whole column, actual trays (Jechura's table citing Branan, Kaes, GPA; 060 §4.4)
  typicalTrays: 32, // "Typically 32 trays in tower" (Jechura)
  spacingCm: [60, 75], // tray spacing (Wikipedia "Theoretical plate", opened)
  heightM: 37, // "a steel cylinder about 120 feet high" (OSHA)
  dpMbarPerTray: 7, // 0.1 psi per tray design target (Jechura)
  stripperTrays: [5, 7], // steam side stripper (Jechura)
  // drawn: 2 stripping trays below the feed + 13 above it (the figure's own choice, schematic)
  drawnBelow: 2,
  drawnAbove: 13,
};
COLUMN.drawn = COLUMN.drawnBelow + COLUMN.drawnAbove;

// ---------- products ----------
// Cut points (TBP, °C): TotalEnergies assay cuts (060 §3): light naphtha 15-80, heavy naphtha 80-150,
// kerosene 150-230, gasoil 230-375, residue > 375. The figure draws diesel and heavy gasoil separately, so the
// 230-375 gasoil cut is split at 321 °C, the light/heavy gasoil boundary in Penn State FSC 432 Table 4.1 and
// Fig. 3.1 (primary). Gas: C1-C4, boiling from methane to butane (n-alkane table above).
// tray: which drawn tray (above the feed, 1 = lowest) the draw is taken from; null = overhead or bottom.
// drawT: temperature of the draw (PROFILE). Colours: the post's product palette (BRIEF-2).
// Uses: 060 §3 table and CUTS list (PSU, Wikipedia).
export const PRODUCTS = [
  { id: "gas", name: "Gas and LPG", short: "gas, LPG", tbp: [-161.5, -0.5], range: "−162 to 0 °C", color: "#c99a1e",
    where: "overhead", drawT: PROFILE.overhead, use: "refinery fuel gas, LPG" },
  { id: "lnap", name: "Light naphtha", short: "light naphtha", tbp: [15, 80], color: "#3f9f8c",
    where: "overhead", drawT: PROFILE.overhead, use: "gasoline blending, petrochemical feed" },
  { id: "hnap", name: "Heavy naphtha", short: "heavy naphtha", tbp: [80, 150], color: "#138374",
    where: "draw", tray: 11, drawT: PROFILE.heavyNaphtha, use: "reformer feed for gasoline" },
  { id: "kero", name: "Kerosene / jet", short: "kerosene", tbp: [150, 230], color: "#8a93a6",
    where: "draw", tray: 9, drawT: PROFILE.kerosene, use: "jet fuel" },
  { id: "diesel", name: "Diesel / light gasoil", short: "diesel", tbp: [230, 321], color: "#6a47c2",
    where: "draw", tray: 5, drawT: PROFILE.diesel, use: "diesel, heating oil" },
  { id: "hgo", name: "Heavy gasoil", short: "heavy gasoil", tbp: [321, 375], color: "#b58a5e",
    where: "draw", tray: 1, drawT: PROFILE.gasoil, use: "cracker feed (FCC, hydrocracker)" },
  { id: "resid", name: "Atmospheric residue", short: "residue", tbp: [375, null], color: "#4e3b2c",
    where: "bottom", drawT: PROFILE.bottoms, use: "feed to the vacuum unit" },
];
for (const p of PRODUCTS) {
  p.carbon = p.id === "gas" ? { from: 1, to: 4 } : carbonOf(p.tbp[0], p.tbp[1]);
}
export const CRUDE_COLOR = "#b4552f";
export const STEAM_COLOR = "#0b4fc0";

// ---------- crudes: straight-run yields from TBP / SimDist curves (060 §7) ----------
// Cumulative weight % distilled at each temperature. Brent: TotalEnergies assay, 3 Oct 2006, 38.1 °API
// (primary). Light ends C4 and lighter 2.7 wt %, taken as the cumulative at 15 °C.
// WCS: crudemonitor.ca, ASTM D7169 simulated distillation, sample 1 Sep 2026, 19.8 °API (primary). SimDist
// gives temperature at mass % recovered; it is read here as (°C, cumulative wt %) and interpolated linearly
// between its sparse points, so the WCS yields are approximate.
const BRENT_TBP = [[15, 2.7], [80, 9.48], [140, 21.9], [150, 23.9], [160, 25.7], [180, 29.1], [200, 32.3], [220, 35.5],
  [240, 38.8], [250, 40.6], [260, 42.4], [300, 49.8], [310, 51.7], [320, 53.6], [330, 55.4], [340, 57.3], [350, 59.1],
  [360, 60.8], [370, 62.5], [380, 64.1], [390, 65.7], [400, 67.2]];
const WCS_SIMDIST = [[-2.0, 0], [57.7, 5], [122.4, 10], [265.3, 20], [355.8, 30], [433.1, 40], [512.7, 50]];
function cumulative(curve, t) {
  if (t <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    const [t0, c0] = curve[i - 1];
    const [t1, c1] = curve[i];
    if (t <= t1) return c0 + ((c1 - c0) * (t - t0)) / (t1 - t0);
  }
  return curve[curve.length - 1][1];
}
// cut boundaries used for yields: gas up to 15 °C, then the product cut points
const EDGES = { gas: [null, 15], lnap: [15, 80], hnap: [80, 150], kero: [150, 230], diesel: [230, 321], hgo: [321, 375], resid: [375, null] };
function yieldsOf(curve, lightEnds) {
  const at = (t) => (t === null ? 100 : cumulative(curve, t));
  const out = {};
  for (const [id, [lo, hi]] of Object.entries(EDGES)) {
    const a = lo === null ? 0 : at(lo);
    const b = hi === null ? 100 : at(hi);
    out[id] = Math.round((b - a) * 10) / 10;
  }
  if (lightEnds !== undefined) out.gas = lightEnds;
  return out;
}
export const CRUDES = [
  { id: "brent", name: "Brent", kind: "light", api: 38.1, source: "TotalEnergies assay, TBP", yields: yieldsOf(BRENT_TBP, 2.7) },
  { id: "wcs", name: "WCS", long: "Western Canadian Select", kind: "heavy", api: 19.8, source: "crudemonitor.ca, SimDist", yields: yieldsOf(WCS_SIMDIST) },
];
// The widest stream in the drawing (WCS residue) sets the scale of the stream widths.
export const YIELD_MAX = Math.max(...CRUDES.flatMap((c) => Object.values(c.yields)));

// ---------- one tray, magnified: which molecules condense and which rise ----------
// At a tray of temperature T: the heavy example is the lightest n-alkane that boils above T (it condenses into
// the liquid); the light example is the heaviest n-alkane that boils at least 60 °C below T (it stays in the
// vapour and rises). Boiling points from ALKANES.
export function trayChem(T) {
  const heavy = ALKANES.find(([, , tb]) => tb > T) ?? ALKANES[ALKANES.length - 1];
  const light = [...ALKANES].reverse().find(([, , tb]) => tb <= T - 60) ?? ALKANES[0];
  return { T, light: { n: light[0], name: light[1], tb: light[2] }, heavy: { n: heavy[0], name: heavy[1], tb: heavy[2] } };
}

// ---------- strings ----------
const deg = (v) => { const r = Math.round(v); return r < 0 ? `−${-r}` : `${r === 0 ? 0 : r}`; };
export const rangeOf = (p) =>
  p.range ?? (p.tbp[1] === null ? `above ${deg(p.tbp[0])} °C` : `${deg(p.tbp[0])}–${deg(p.tbp[1])} °C`);
export const carbonText = (p) => (p.carbon.to === null ? `C${p.carbon.from}+` : `C${p.carbon.from}–C${p.carbon.to}`);
export const whereText = (p) =>
  p.where === "overhead" ? `leaves the top at about ${deg(p.drawT)} °C` : p.where === "bottom" ? `leaves the bottom at about ${deg(p.drawT)} °C` : `drawn at about ${deg(p.drawT)} °C`;
export const yieldText = (p, crude) => `${crude.name} ${crude.yields[p.id].toFixed(1)} wt %`;
export function readout(p, crude) {
  return `${p.name} · ${rangeOf(p)} · ${carbonText(p)} · ${whereText(p)} · ${p.use} · ${yieldText(p, crude)}`;
}
export function feedReadout(crude) {
  return `Crude (${crude.name}) · heated to about ${FURNACE.columnFeedC[0]}–${FURNACE.columnFeedC[1]} °C · up to ${FLASHED_MAX} % flashes to vapour in the flash zone`;
}
