// Pure model for the "fields" figure: three ways oil comes out of the ground, cut open on one depth scale.
// Every number the page shows (chips, readout, cost bars, the shale decline loop) comes from here.
// Source: ~/code/ConceptsPlots/070_research/research_notes/the_oil_market_2026/080_upstream_fields.md (UPSTREAM dict,
// section F). Keys in `src` are the post's reference keys (_data/oil_article/refs.yml) where one exists; `note:` keys
// are rows of the research note without a post reference. `status` follows the note: primary / opened / snippet /
// computed (arithmetic on cited rows) / illustrative (a fit, not a source number). Snippet-based numbers read "about".

// ---------- drawing scales (schematic) ----------
// One depth scale for all three blocks. Horizontal distances are compressed against it (vertical exaggeration
// Z_PER_KM / X_PER_KM = 2.2), and the surface plant is enlarged far beyond either scale.
export const Z_PER_KM = 44; // world units per km of depth
export const X_PER_KM = 20; // world units per km across the section
export const VE = Z_PER_KM / X_PER_KM;
export const BOTTOM_KM = 3.3; // the blocks are cut off at 3.3 km
export const zOf = (m) => (-m / 1000) * Z_PER_KM; // metres below datum -> world z
export const xOf = (m) => (m / 1000) * X_PER_KM;

// Reference price for the government take in the cost bars (illustrative; a round number, not a forecast).
export const PRICE = 70;

// ---------- Permian decline: illustrative Arps fit (note C4: "fit, not source data") ----------
// q(t) = qi / (1 + b Di t)^(1/b), qi = 730 b/d, b = 1.4, nominal Di = 3.66 /yr, chosen to pass 730 -> 200 b/d at
// 12 months (API citing Rystad, opened). The figure loops one year of it.
export const ARPS = { qi: 730, b: 1.4, Di: 3.66 };
export const arps = (tYears) => ARPS.qi / Math.pow(1 + ARPS.b * ARPS.Di * tYears, 1 / ARPS.b);

const round = (v, to = 1) => Math.round(v / to) * to;
const usd = (v) => (Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`);

// ---------- the three fields ----------
export const FIELDS = [
  {
    id: "ghawar",
    name: "Ghawar",
    where: "Saudi Arabia, onshore",
    plinth: "GHAWAR · SAUDI ARABIA",
    kind: "Onshore giant",
    // A1 geology
    rock: "Arab-D limestone", // Upper Jurassic Arab-D carbonate (limestone, grainstone, some dolomite); wiki/geoexpro, opened
    seal: "anhydrite",
    depth_m: [1800, 2330], // wiki 1,800-2,100; geoexpro 2,000-2,330 (opened)
    top_m: 1950, // drawn crest of the reservoir top (inside the cited range)
    pay_m: 110, // drawn layer thickness; Wikipedia ~85 m, Afifi ~120 m (opened)
    column_m: 396, // oil column up to 396 m (GeoExpro, opened)
    perm: "hundreds of mD to darcies", // geoexpro/durham (snippet/opened): "up to several darcys"
    permShort: "100s of mD to D",
    water_m: 0,
    // A3 rate per well: Haradh III 300 kb/d / 32 MRC producers = 9.4 kb/d (World Oil 2007 snippet; computed)
    rate0: 9400,
    rate0Status: "snippet",
    rate1: null, // no published single-well decline curve; the well is held on plateau by the water drive (note A4)
    rate1Text: "about the same, held on plateau by water injection (no published well curve)",
    declineText: "field 1–2 % a year",
    declineSrc: "worldoil-ghawar",
    // A5 cost per barrel, Aramco upstream, all fields, per boe, 2025 (AR25, primary)
    lifting: 3.51,
    capex: 8.0,
    royaltyPct: 15, // 15 % of value up to $70 Brent (Argaam / Business Recorder, snippet)
    incomeTaxPct: 50, // 50 % upstream income tax (World Oil 2017 / AGSI, snippet)
    breakeven: 27, // full-cycle, new onshore Middle East projects, Rystad 2024 (opened / snippet)
    breakevenKind: "full-cycle, new Middle East onshore projects (Rystad)",
    takeStatus: "snippet",
    src: {
      geology: ["geoexpro-ghawar"],
      rate: ["mrc-haradh"],
      decline: ["worldoil-ghawar", "iea-decline"],
      cost: ["aramco-ar25"],
      take: ["note: argaam royalty (snippet)", "note: worldoil-2017 tax (snippet)"],
      breakeven: ["rystad"],
    },
    wells: "MRC producer on the crest, water injectors on the flanks",
  },
  {
    id: "sverdrup",
    name: "Johan Sverdrup",
    where: "Norway, North Sea",
    plinth: "JOHAN SVERDRUP · NORWAY",
    kind: "Offshore platform",
    rock: "Draupne sandstone", // Upper Jurassic intra-Draupne sandstone (Norsk Petroleum, primary)
    seal: "shale",
    depth_m: [1900, 1900], // reservoir depth 1,900 m (Sodir / Norsk Petroleum, primary)
    top_m: 1900,
    pay_m: 80, // drawn thickness; not in the note (schematic)
    water_m: 115, // water depth 115 m (Sodir, primary)
    perm: "5–30 darcy", // Vigorito et al. 2013 abstract (snippet)
    permShort: "5–30 D",
    // >430 kb/d from 9 producers in early 2020 = ~48 kb/d (Hart, snippet; computed)
    rate0: 48000,
    rate0Status: "snippet",
    rate1: null, // field plateau 755 kb/d from May 2023 to early 2025 (Equinor, primary)
    rate1Text: "on plateau: the field held 755,000 b/d from 2023 to early 2025",
    declineText: "over 10 % in 2026 (Equinor); deep offshore about 10 %",
    declineSrc: "jpt-sverdrup",
    lifting: 2.0, // operating cost < $2/bbl at plateau (Equinor 2020, primary): drawn at the bound
    liftingText: "under $2",
    capex: 6.5, // NOK ~176 bn / 2.7 bn boe = $6-7/boe (computed from Sodir/Equinor, primary)
    capexText: "about $6–7",
    taxPct: 78, // 22 % corporate + 71.8 % special = 78 % marginal (Norsk Petroleum, primary)
    breakeven: 20, // full field < $20/bbl (Equinor 2020, primary)
    breakevenText: "under $20",
    breakevenKind: "full field (Equinor)",
    takeStatus: "computed",
    src: {
      geology: ["np-sverdrup"],
      rate: ["equinor-sverdrup", "note: hart-2020 (snippet)"],
      decline: ["jpt-sverdrup", "iea-decline"],
      cost: ["equinor-sverdrup", "np-sverdrup"],
      take: ["np-tax"],
      breakeven: ["equinor-sverdrup"],
    },
    wells: "deviated producers from the drilling platform, water injector on the flank",
  },
  {
    id: "permian",
    name: "Permian shale",
    where: "Texas, Midland Basin",
    plinth: "PERMIAN · TEXAS",
    kind: "Shale well",
    rock: "Wolfcamp mudstone", // Wolfcamp / Spraberry mudstone, siltstone, carbonate (EIA 2019, primary)
    seal: null,
    depth_m: [2000, 3500], // typical target 2,000-3,500 m TVD (EIA TIE 53059 / AAPG, snippet)
    target_m: 2900, // Wolfcamp B ~9,500 ft TVD in Midland County = ~2,900 m (EIA TIE 53059, snippet)
    lateral_m: 3310, // Permian average lateral 2025, 10,867 ft (EIA TIE 67984, primary)
    stages: [45, 50], // ~225 ft per stage (SPE/Liberty, snippet; computed)
    stagesDrawn: 16,
    water_m: 0,
    perm: "1–60 nanodarcy", // matrix < 60 nD (Ramiro-Ramirez 2024, snippet)
    permShort: "1–60 nD",
    rate0: 730, // new Midland well ~730 b/d (API citing Rystad, opened)
    rate0Status: "opened",
    rate1: 200, // ~200 b/d after 12 months (same)
    rate1Text: null,
    declineText: "about 73 % in the first year",
    declineSrc: "api-decline",
    lifting: 5.91, // lease operating expense, Diamondback Q4 2025, $/boe (opened)
    capex: 13, // $7 m well / ~0.55 mb oil EUR (computed from snippet well costs)
    capexText: "about $13",
    royaltyPct: 25, // private Texas land, typical 20-25 %, median 25 % (Caddo, snippet)
    severancePct: 4.6, // Texas crude production tax (Comptroller, opened)
    breakeven: 68.57, // new well, Midland, Dallas Fed Energy Survey Q1 2026 (primary)
    breakevenKind: "new well, Midland (Dallas Fed survey)",
    takeStatus: "snippet",
    src: {
      geology: ["eia-lateral", "note: ramiro-ramirez-2024 (snippet)"],
      rate: ["api-decline"],
      decline: ["api-decline", "ogj-arps"],
      cost: ["diamondback"],
      take: ["tx-tax", "note: caddo royalty (snippet)"],
      breakeven: ["dallasfed"],
    },
    wells: "one pad, vertical then horizontal for 3.3 km, fracked in stages",
  },
];

// ---------- the cost of a barrel at the reference price ----------
// Ghawar: royalty 15 % of PRICE; income tax 50 % of (PRICE - royalty - lifting - capex). Note A5 computes $34.5 at $70.
// Simplification (the note's): ignores depreciation timing and treats capex as expensed.
// Sverdrup: 78 % marginal tax on (PRICE - opex - capex); under the cash-flow tax, investment is expensed (np-tax).
// Permian: royalty 25 % + severance 4.6 % of value; federal income tax (21 %) not included (not sourced in the note).
export function costOf(f) {
  let take;
  let takeText;
  if (f.id === "ghawar") {
    const royalty = (f.royaltyPct / 100) * PRICE;
    const tax = (f.incomeTaxPct / 100) * (PRICE - royalty - f.lifting - f.capex);
    take = royalty + tax;
    takeText = `royalty ${f.royaltyPct} % and ${f.incomeTaxPct} % income tax`;
  } else if (f.id === "sverdrup") {
    take = (f.taxPct / 100) * (PRICE - f.lifting - f.capex);
    takeText = `${f.taxPct} % marginal petroleum tax`;
  } else {
    take = ((f.royaltyPct + f.severancePct) / 100) * PRICE;
    takeText = `royalty ${f.royaltyPct} % and Texas severance ${f.severancePct} %, before income tax`;
  }
  const rest = PRICE - f.lifting - f.capex - take;
  return { lifting: f.lifting, capex: f.capex, take, rest, takeText };
}

const fmtRate = (v) => (v >= 1000 ? `${Math.round(v).toLocaleString("en-US")}` : `${Math.round(v)}`);
const about = (status) => (status === "snippet" || status === "computed" ? "about " : "");

// Short lines for the chips (rock / depth / permeability / rate per well).
export function chipOf(f) {
  const depth =
    f.id === "permian"
      ? `${(f.target_m / 1000).toFixed(1)} km down, 3.3 km sideways`
      : f.id === "sverdrup"
        ? `1.9 km, under ${f.water_m} m of sea`
        : `1.8–2.3 km`;
  return {
    title: f.name,
    sub: f.kind,
    lines: [f.rock, depth, f.permShort, `${about(f.rate0Status)}${fmtRate(f.rate0)} b/d a well`],
  };
}

// The readout panel: rate, decline, cost split, breakeven. Each line carries its sources.
export function readoutOf(f) {
  const c = costOf(f);
  const rate =
    f.id === "permian"
      ? `${fmtRate(f.rate0)} b/d at the start, ${fmtRate(f.rate1)} after a year`
      : `${about(f.rate0Status)}${fmtRate(f.rate0)} b/d at the start; after a year ${f.rate1Text}`;
  const lift = f.liftingText ?? usd(f.lifting);
  const cap = f.capexText ?? usd(f.capex);
  const take = `about $${round(c.take)}`;
  const be = f.breakevenText ?? usd(f.breakeven);
  return {
    rate: { text: rate, src: f.src.rate },
    decline: { text: f.declineText, src: f.src.decline },
    lifting: { text: `${lift} lifting`, value: c.lifting, src: f.src.cost },
    capex: { text: `${cap} capital`, value: c.capex, src: f.src.cost },
    take: { text: `${take} in ${f.id === "sverdrup" ? "tax" : "taxes and royalty"} (${c.takeText})`, value: c.take, src: f.src.take },
    rest: { value: c.rest },
    breakeven: { text: `breakeven ${be}: ${f.breakevenKind}`, value: f.breakeven, src: f.src.breakeven },
  };
}

// The one-line readout in the card corner.
export const cornerOf = (f) =>
  f.id === "permian" ? `${f.name} · ${fmtRate(f.rate0)} → ${fmtRate(f.rate1)} b/d in a year` : `${f.name} · ${about(f.rate0Status)}${fmtRate(f.rate0)} b/d a well`;
export const loopText = (tYears) => `Permian well · month ${Math.min(12, Math.floor(tYears * 12) + 1)} · ${Math.round(arps(tYears))} b/d`;

export const CAPTION =
  "Schematic. The three blocks share one depth scale (exaggerated about 2× against the horizontal); widths and the surface plant are not to scale. " +
  "The shale well's decline is an illustrative Arps fit through 730 and 200 b/d (b = 1.4), not a measured well. " +
  `Costs: lifting and capital per barrel as reported (Aramco for all its fields; Sverdrup's capital cost and the Permian well's are arithmetic on the sources); taxes and royalty are worked out for a $${PRICE} barrel (the Permian royalty goes to the mineral owner, and US income tax is left out). "About" marks numbers seen only as reported.`;

if (process.argv[1] && process.argv[1].endsWith("model.mjs")) {
  for (const f of FIELDS) {
    const r = readoutOf(f);
    console.log(f.name, chipOf(f).lines.join(" | "));
    for (const [k, v] of Object.entries(r)) console.log("  ", k, v.text ?? "", v.value !== undefined ? v.value.toFixed(2) : "", (v.src || []).join(", "));
  }
  for (const t of [0, 0.25, 0.5, 1]) console.log("arps", t, arps(t).toFixed(0));
}
