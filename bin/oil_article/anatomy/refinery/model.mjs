// Truth for the crude distillation unit figure. Every number the page shows comes from here.
// Pure module: no DOM, imported by build.mjs and inlined into the page as JSON.

// Fired heater: crude leaves the atmospheric heater at about 343-371 °C (650-700 °F); the vacuum
// heater runs to about 399 °C (750 °F). Hotter, and the heavy molecules crack thermally (coke).
// Source: OSHA Technical Manual, Section IV Chapter 2 "Petroleum Refining Processes".
export const FURNACE = { outletC: [343, 371], vacuumC: 399 };

// Atmospheric column: slightly above atmospheric pressure, about 1-2 bar gauge at the top, with
// roughly 30-50 trays (typical values, e.g. Gary, Handwerk & Kaiser, "Petroleum Refining", ch. 4).
// The drawing uses 40 trays.
export const COLUMN = { barg: [1, 2], trays: [30, 50], drawnTrays: 40 };

// True-boiling-point cut points, °C, as used in the TotalEnergies crude assays.
export const CUTS = [
  { id: "lpg",     name: "gas / LPG (C1–C4)",  short: "LPG",     tbp: [null, 15] },
  { id: "naphtha", name: "naphtha",            short: "naphtha", tbp: [15, 150] },
  { id: "kero",    name: "kerosene / jet",     short: "jet",     tbp: [150, 230] },
  { id: "diesel",  name: "gasoil / diesel",    short: "diesel",  tbp: [230, 375] },
  { id: "resid",   name: "atmospheric residue", short: "residue", tbp: [375, null],
    // the residue glass shows its two parts: vacuum gasoil 375-550 °C above vacuum residue >550 °C
    parts: [{ id: "vgo", name: "vacuum gasoil", tbp: [375, 550] }, { id: "vr", name: "vacuum residue", tbp: [550, null] }] },
];

// Straight-run yields, WEIGHT %, from the TotalEnergies TBP crude assays
// (https://trading.totalenergies.com/wp-content/uploads/2025/11/BRENT.pdf and the same URL
// pattern per grade). LPG (C1-C4) is the remainder to 100. `vr` is the >550 °C part of `resid`.
export const CRUDES = [
  { id: "brent",  name: "Brent",                 kind: "light sweet",  api: 38.1, sulphur: 0.4,
    yields: { naphtha: 21.2, kero: 13.3, diesel: 26.1, resid: 36.7 }, vr: 13.6, color: "#E8A24A" },
  { id: "oman",   name: "Oman",                  kind: "medium sour",  api: 33.2, sulphur: 1.1,
    yields: { naphtha: 13.3, kero: 12.0, diesel: 23.3, resid: 50.1 }, vr: 24.4, color: "#C9782E" },
  { id: "synbit", name: "Canadian heavy Synbit", short: "Synbit", kind: "heavy sour", api: 19.0, sulphur: 2.97,
    yields: { naphtha: 5.5, kero: 8.3, diesel: 28.7, resid: 57.5 }, vr: 28, color: "#6E4A2C" },
];
// Assayed but not drawn (kept for reference): Murban 40.5 °API, 0.79 % S:
// naphtha 20.7, kero 18.3, gasoil 27.6, residue 32.3 (>550: 9.7).

for (const c of CRUDES) {
  const named = c.yields.naphtha + c.yields.kero + c.yields.diesel + c.yields.resid;
  c.yields.lpg = Math.max(0, Math.round((100 - named) * 10) / 10); // remainder to 100
}

// Sight-glass scale: every glass reads the same 0-60 wt % scale, so levels compare directly.
export const SCALE_MAX = 60;

export const readout = (crude) => {
  const n = (v) => v.toFixed(1);
  return `${crude.short ?? crude.name} · API ${n(crude.api)} · ${crude.sulphur} % S · naphtha ${n(crude.yields.naphtha)} · jet ${n(crude.yields.kero)} · diesel ${n(crude.yields.diesel)} · residue ${n(crude.yields.resid)} wt %`;
};
