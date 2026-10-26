// Pure model for the Cushing tank figure: data slice, capacities, and the mapping from stocks to roof height.
// Every number the page shows (readout, gauge board, caption) comes from here.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OIL = JSON.parse(readFileSync(join(HERE, "..", "..", "..", "..", "assets", "oil-article", "oil.json"), "utf8"));

// Working storage capacity at Cushing, Oklahoma, in thousand barrels. Approximate: EIA "Working and Net Available
// Shell Storage Capacity" report (semi-annual), Cushing tank farms ~76 million barrels working, ~94 million shell.
export const WORKING_KB = 76000;
export const SHELL_KB = 94000;

// Weekly Cushing crude stocks (EIA WCESTUS1 / W_EPC0_SAX_YCUOK_MBBL), thousand barrels, from the post's pipeline
// (assets/oil-article/oil.json, stocks.t / stocks.cushing). The series starts with nulls until EIA began it (Apr 2004).
const T = OIL.stocks.t;
const C = OIL.stocks.cushing;
// 83 weeks in 2004-07 are null in the pipeline (calendar misalignment); they are dropped, never filled.
const KEEP = T.map((_, i) => i).filter((i) => C[i] !== null && C[i] !== undefined);
export const WEEKS = KEEP.map((i) => T[i]);
export const STOCKS = KEEP.map((i) => C[i]);

const indexOf = (date) => WEEKS.indexOf(date);
const argmin = (from, to) => {
  let best = from;
  for (let i = from; i <= to; i++) if (STOCKS[i] < STOCKS[best]) best = i;
  return best;
};
const argmax = (from, to) => {
  let best = from;
  for (let i = from; i <= to; i++) if (STOCKS[i] > STOCKS[best]) best = i;
  return best;
};

// Tour stops.
// April-May 2020: WTI May futures settled at -$37.63 on 20 Apr 2020; the stock peak of that spring is the week ending 1 May 2020.
const y2020 = [indexOf("2020-03-27"), indexOf("2020-06-26")];
export const PEAK_2020 = argmax(y2020[0], y2020[1]);
export const NEGATIVE_WEEK = WEEKS.findIndex((t) => t >= "2020-04-20"); // the weekly report that covers 20 Apr 2020
const y2026 = WEEKS.findIndex((t) => t >= "2026-01-01");
export const LOW_2026 = argmin(y2026, WEEKS.length - 1);
export const LATEST = WEEKS.length - 1;
// NYMEX WTI May 2020 contract settlement on 20 Apr 2020, $/bbl (CME Group settlement; EIA "Today in Energy", 21 Apr 2020).
// Not in the post's pipeline (its daily series starts in 2025), so it is a cited constant.
export const NEGATIVE_SETTLE = -37.63;
const mbbl = (i) => (STOCKS[i] / 1000).toFixed(1);
export const caption = () =>
  `A floating-roof crude tank at Cushing, Oklahoma, the delivery point of the NYMEX WTI contract. The roof floats on the oil; here its height stands for total crude stocks at Cushing (EIA, weekly) against about ${WORKING_KB / 1000} million barrels of working capacity (about ${SHELL_KB / 1000} million shell capacity; both approximate, from EIA's storage-capacity report), and the gauge board on the shell reads millions of barrels. ` +
  `Stocks peaked at ${mbbl(ALL_TIME_HIGH)} m bbl in ${dateText(WEEKS[ALL_TIME_HIGH]).slice(-8)}, stood at ${mbbl(NEGATIVE_WEEK)} m bbl in the week the May 2020 WTI future settled at −$${Math.abs(NEGATIVE_SETTLE).toFixed(2)} (20 Apr 2020) and ${mbbl(PEAK_2020)} m bbl a week later, fell to ${mbbl(LOW_2026)} m bbl on ${dateText(WEEKS[LOW_2026])} and were ${mbbl(LATEST)} m bbl on ${dateText(WEEKS[LATEST])}. ` +
  `Thin stocks at Cushing mean a tight prompt WTI market and backwardation; tanks near full mean contango, and in April 2020 a delivered barrel had nowhere to go. One tank stands for the whole hub; its proportions and the split of the spare volume between tank bottoms and headroom are schematic.`;
export const ALL_TIME_HIGH = argmax(0, WEEKS.length - 1);

// Tank geometry used to turn stocks into a roof height (schematic: one tank stands for the hub).
// Shell height H holds the shell capacity; the working band runs from the roof landed on its legs (tank bottoms,
// below which pump suction fails) to the maximum safe fill. We split the shell-minus-working volume evenly between
// bottoms and headroom (approximate).
export const SHELL_H = 40; // world units
const SPARE = (SHELL_KB - WORKING_KB) / 2;
export const Z_LOW = (SHELL_H * SPARE) / SHELL_KB;
export const Z_HIGH = (SHELL_H * (SPARE + WORKING_KB)) / SHELL_KB;
export const shareOf = (kb) => kb / WORKING_KB;
export const levelOf = (kb) => Z_LOW + Math.max(0, Math.min(1, shareOf(kb))) * (Z_HIGH - Z_LOW);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dateText = (t) => `${Number(t.slice(8, 10))} ${MONTHS[Number(t.slice(5, 7)) - 1]} ${t.slice(0, 4)}`;
export const readout = (i) => `${dateText(WEEKS[i])} · ${(STOCKS[i] / 1000).toFixed(1)} m bbl · ${Math.round(shareOf(STOCKS[i]) * 100)} % of working capacity`;

if (process.argv[1] && process.argv[1].endsWith("model.mjs")) {
  for (const [name, i] of Object.entries({ first: 0, PEAK_2020, NEGATIVE_WEEK, ALL_TIME_HIGH, LOW_2026, LATEST })) console.log(name.padEnd(14), readout(i));
  console.log("weeks", WEEKS.length, "Z_LOW", Z_LOW.toFixed(2), "Z_HIGH", Z_HIGH.toFixed(2));
}
