// Truth for the VLCC freight figure. Every number the page shows comes from here.
// Pure module: imported by build.mjs (Node) and inlined into the page (live code).

// Ship. Typical modern VLCC (e.g. the 300,000-320,000 dwt designs built in Korea and China):
// length overall ~330 m, beam ~60 m, design (scantling) draught ~22 m, moulded depth ~31 m.
// Sources: class/yard particulars of standard VLCC designs; round numbers, approximate.
export const LOA_M = 330;          // length overall, m (approximate)
export const BEAM_M = 60;          // moulded beam, m (approximate)
export const DRAUGHT_M = 22;       // design draught, m (approximate)
export const DEPTH_M = 31;         // moulded depth to main deck, m (approximate)
export const DWT_T = 300_000;      // deadweight, tonnes (class name: "VLCC" is 200-320 kt dwt)
export const CARGO_BBL = 2_000_000; // cargo carried, barrels: the industry's "2 million barrel" VLCC (round number)

// Cargo tanks: 5 rows x 3 (port wing, centre, starboard wing) plus two slop tanks aft,
// the usual double-hull VLCC arrangement (MARPOL double hull: double sides and double bottom ~2-3 m).
export const TANK_ROWS = 5;
export const TANK_ACROSS = 3;
export const SLOP_TANKS = 2;
export const DOUBLE_HULL_M = 3;    // width of double side / height of double bottom, m (approximate)
export const FILL = 0.98;          // tanks are loaded to ~98 % to leave ullage for expansion

// Voyage. Ras Tanura (Saudi Arabia) -> Ningbo (China), the benchmark Middle East Gulf -> China VLCC route
// (TD3C). ~6,000 nautical miles laden at ~13 knots is ~20 days at sea.
export const LADEN_DAYS = 20;      // laden leg, days (approximate)
export const SPEED_KN = 13;        // service speed laden, knots (approximate)
// Round trip: the charterer pays hire for the whole cycle, laden leg + ballast leg back + port time and canal-free
// waiting: ~20 + ~20 + ~10 days. Round number, the caption says so.
export const VOYAGE_DAYS = 50;

// Day rate range for the control: time-charter-equivalent (TCE) earnings.
export const RATE_MIN = 30_000;      // $/day, a weak market floor (approximate)
export const RATE_MAX = 1_300_000;   // $/day, record TCE reported for VLCCs in early October 2026 (Hormuz crisis)

// Hold points of the idle tour.
export const HOLDS = [
  { rate: 70_000, note: "Jan 2026" },        // ~$70k/day in January 2026: freight ~ $1.7/bbl Gulf -> China
  { rate: 400_000, note: "mid-crisis" },     // a typical crisis-period level between the two
  { rate: 1_300_000, note: "record, Oct 2026" }, // record, early October 2026: freight ~ $33/bbl
];

// Crude price for comparison: WTI monthly average spot, EIA (assets/oil-article/oil.json, monthly.wti).
// Inlined at build time by build.mjs from oil.json; this default is the 2026-10 value.
export const CRUDE_DEFAULT = { month: "2026-10", usd: 99.97 };

// Freight per barrel = day rate x days of hire / barrels carried.
// Excludes bunker fuel, port dues and war-risk insurance (the 2026 war-risk premium was a further cost).
export const freightPerBbl = (rate) => (rate * VOYAGE_DAYS) / CARGO_BBL;
// Checks: 1,300,000 x 50 / 2,000,000 = 32.5 ; 70,000 x 50 / 2,000,000 = 1.75.

// Control mapping: the slider is a logarithmic day-rate scale (slide-rule style).
export const shareOfRate = (rate) => Math.log(rate / RATE_MIN) / Math.log(RATE_MAX / RATE_MIN);
export const rateOfShare = (share) => RATE_MIN * Math.pow(RATE_MAX / RATE_MIN, share);

// Dial: 0-40 $/bbl over 270 degrees.
export const DIAL_MAX = 40;
export const DIAL_SPAN_DEG = 270;

export const fmtUsd = (value) => "$" + Math.round(value).toLocaleString("en-US");
export const fmtBbl = (value) => "$" + (value < 10 ? value.toFixed(2) : value.toFixed(1));
export function readout(rate, crude = CRUDE_DEFAULT.usd) {
  const f = freightPerBbl(rate);
  return `${fmtUsd(rate)} / day × ${VOYAGE_DAYS} days ÷ ${(CARGO_BBL / 1e6).toFixed(1)} m bbl = ${fmtBbl(f)} per barrel · ${Math.round((100 * f) / crude)}% of crude`;
}
