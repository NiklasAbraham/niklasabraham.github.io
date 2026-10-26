# cushing-tank

Anatomy figure for the oil-market long read: a floating-roof crude tank at Cushing, Oklahoma (delivery point of
NYMEX WTI), shell cut away, roof height = total Cushing crude stocks.

Build: `node build.mjs` (dark) and `node build.mjs --light`; `--audit` runs the kit audit (passes).
Output: `assets/oil-article/anatomy/cushing-tank.html`, `cushing-tank-light.html` (standalone, ~615 KB, no requests).

Files: `model.mjs` (data slice, capacities, stock → roof height, readout and caption text), `mesh.mjs` (small face
painter for the cut shell, rings and berm), `build.mjs` (geometry, audit recorder, page), `live.js` (scrub, tour,
ladder rebuild, postMessage), `cushing-tank.css`, `shots/` (checks).

## Numbers and sources
- Weekly Cushing crude stocks, thousand barrels: `assets/oil-article/oil.json` → `stocks.t`, `stocks.cushing` (EIA
  weekly, from the post's pipeline). 98 null weeks (2004 to mid-2007, calendar misalignment in the pipeline) are dropped,
  not filled: 1,092 weeks from 16 Apr 2004 to 16 Oct 2026.
- Working storage capacity ~76 million bbl, shell capacity ~94 million bbl: EIA "Working and Net Available Shell Storage
  Capacity" report, approximate.
- May 2020 WTI future settled at −$37.63 on 20 Apr 2020 (CME settlement, EIA Today in Energy 21 Apr 2020); cited
  constant, the pipeline's daily series starts in 2025.
- Mapping (schematic): shell height H holds the shell capacity; the 18 million bbl not in working capacity is split
  evenly into tank bottoms (roof landed on its legs) and headroom, so the working band runs from z = 3.83 to 36.17 of
  H = 40. Roof height = bottom + stocks / 76 000 × band. Gauge board: 0 m bbl at the top, 76 at the bottom (the target
  falls as the roof rises, as on a real float gauge).
- Tour holds: 24 Apr 2020 (63.4 m bbl, the week covering 20 Apr), 1 May 2020 (65.4, spring-2020 peak), 24 Jul 2026
  (18.6, 2026 low), 16 Oct 2026 (27.6, latest). All-time high in the series: 69.4 m bbl, 7 Apr 2017.

## Checks (26 Oct 2026)
`--audit` passed (one crowding pair excused after an 8× look: the gauge conduit leaving the head above the board).
`scripts/lines.mjs`: 0 floating ends, dark and light, at the latest week, 1 May 2020 and 24 Jul 2026. Desktop and
390 px, both themes, tour contact sheet in `shots/`.
