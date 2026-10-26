// The numbers behind the crack balance. Pure: no drawing here.
//
// Source: assets/oil-article/oil.json, built by bin/oil_article/build.py from EIA daily spot prices (via FRED),
// monthly means, products converted from $/gal to $/bbl at 42 gal per barrel. Last price: 20 Oct 2026, so the
// October 2026 month is partial.
//   wti           WTI Cushing spot, $/bbl
//   gas_usg       US Gulf Coast conventional gasoline (regular), $/bbl
//   ulsd_usg      US Gulf Coast ultra-low-sulphur diesel, $/bbl (quoted from June 2006, which is where the slice starts)
//   crack321_usg  (2 * gas_usg + 1 * ulsd_usg) / 3 - wti, $/bbl of crude
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const OIL = JSON.parse(readFileSync(join(ROOT, "assets", "oil-article", "oil.json"), "utf8"));
const M = OIL.monthly;

export const LAST_PRICE = OIL.meta.last_price; // "2026-10-20": the last daily price in the pipeline

// The slice: every month where all four series are quoted (skips the nulls before ULSD USG starts).
const keep = M.t.map((_, i) => i).filter((i) => [M.wti, M.gas_usg, M.ulsd_usg, M.crack321_usg].every((s) => s[i] != null));
const r2 = (v) => Math.round(v * 100) / 100;
export const SERIES = {
  t: keep.map((i) => M.t[i]),
  wti: keep.map((i) => r2(M.wti[i])),
  gas: keep.map((i) => r2(M.gas_usg[i])),
  ulsd: keep.map((i) => r2(M.ulsd_usg[i])),
  crack: keep.map((i) => r2(M.crack321_usg[i])),
};
const N = SERIES.t.length;

// The 3-2-1 crack, recomputed from the monthly means as a check against the pipeline's column. The pipeline takes the
// monthly mean of the *daily* crack (only days on which all three prices are quoted), so the two differ slightly in
// months with missing quotes: at most $1.44 (May 2011), more than $0.10 in 17 of 245 months. The figure shows the
// pipeline's crack321_usg.
export const crackOf = (wti, gas, ulsd) => (2 * gas + ulsd) / 3 - wti;
export let WORST = { d: 0, t: "" };
for (let i = 0; i < N; i++) {
  const d = Math.abs(crackOf(SERIES.wti[i], SERIES.gas[i], SERIES.ulsd[i]) - SERIES.crack[i]);
  if (d > WORST.d) WORST = { d, t: SERIES.t[i] };
}
if (WORST.d > 2) throw new Error(`crack mismatch ${WORST.t}: ${WORST.d}`);

const indexOf = (t) => SERIES.t.indexOf(t);
const argmax = (from, to) => {
  let best = from;
  for (let i = from; i <= to; i++) if (SERIES.crack[i] > SERIES.crack[best]) best = i;
  return best;
};
const year = (y) => [SERIES.t.findIndex((t) => t.startsWith(y)), SERIES.t.findLastIndex((t) => t.startsWith(y))];

// The tour stops, found from the data (no values typed in).
export const STOPS = [
  { i: argmax(...year("2022")), why: "post-Ukraine peak" },
  { i: indexOf("2026-01"), why: "January 2026" },
  { i: indexOf("2026-02"), why: "last month before the Iran war" },
  { i: argmax(0, N - 1), why: "highest month in the series" },
  { i: N - 1, why: "latest, partial month" },
].sort((a, b) => a.i - b.i);

// Instrument constants (schematic, chosen for the drawing, not data):
export const SCALE = [-5, 80]; // arc scale range, $/bbl (brief)
export const DEG_PER_USD = 0.3; // beam tilt per $/bbl of crack: 80 $/bbl tilts the beam 24 degrees
export const H_PER_USD = 0.2; // barrel height per $/bbl: the dearest month (diesel, 205 $/bbl) stands 41 units tall

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthName = (t) => `${MONTHS[Number(t.slice(5, 7)) - 1]} ${t.slice(0, 4)}`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`${N} months, ${SERIES.t[0]} to ${SERIES.t[N - 1]}`);
  for (const s of STOPS) console.log(SERIES.t[s.i], s.why, "crude", SERIES.wti[s.i], "gas", SERIES.gas[s.i], "diesel", SERIES.ulsd[s.i], "crack", SERIES.crack[s.i]);
  const lo = SERIES.crack.indexOf(Math.min(...SERIES.crack));
  console.log("largest formula gap", WORST);
  console.log("lowest", SERIES.t[lo], SERIES.crack[lo], "dearest product", Math.max(...SERIES.ulsd, ...SERIES.gas));
}
