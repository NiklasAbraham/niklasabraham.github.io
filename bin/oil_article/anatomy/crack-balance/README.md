# crack-balance

The 3-2-1 crack spread built as a precision equal-arm beam balance. The left pan holds three barrels of crude (orange),
the right pan two barrels of gasoline (green) and one of diesel (blue). Each barrel is as tall as its price per barrel.
The beam tilts by the crack and the pointer reads it on the arc scale (−5 to 80 $/bbl). The red rider on the beam marks
the same margin, and a red hoop on each product barrel marks the height of a crude barrel, so what stands above the hoop
is what the refinery gets over its crude. A drum counter on the base shows the month, and a cursor runs along a date
track from 2006 to 2026. The red tick on the track is March 2026, the first month of the Iran war.

Size tier: Figure (70 solids, about 670 paths).

## Files

- `model.mjs` holds the data slice and the instrument constants. It is pure and runs only at build time.
  `node model.mjs` prints the tour stops.
- `build.mjs` builds the static art with the anatomy kit and inlines the kit, the constants and `live.js`.
  `node build.mjs` writes `assets/oil-article/anatomy/crack-balance.html`, and `--light` writes `crack-balance-light.html`.
- `live.js` redraws the tilted beam, the knife axle, the pointer, the rider and the barrels each frame, moves the pans
  and the cursor, runs the tour and handles input. It also posts the page height to the parent:
  `{ oilFig: "crack-balance", h }`.
- `shots/` holds the headless checks: desktop, phone and light, the tour, close-ups and line-end rings.

## Numbers and where they come from

The source is `assets/oil-article/oil.json`, `monthly`, built by `bin/oil_article/build.py` from EIA daily spot prices
(via FRED). The values are monthly means, and the last price is 20 Oct 2026, so October 2026 is a partial month.

| Series | Meaning |
|---|---|
| `wti` | WTI Cushing, $/bbl |
| `gas_usg` | US Gulf Coast conventional gasoline, $/gal × 42 → $/bbl |
| `ulsd_usg` | US Gulf Coast ULSD, $/bbl. It is quoted from June 2006, which is where the slice starts (245 months) |
| `crack321_usg` | (2·gasoline + diesel)/3 − WTI, $ per bbl of crude |

The figure shows the pipeline's `crack321_usg`. That column is the monthly mean of the daily crack, so it differs
slightly from the formula applied to the monthly means of the three prices: by at most $1.44 (May 2011), and by more
than $0.10 in 17 of the 245 months. `model.mjs` checks and reports the difference.

The tour stops are computed from the data, never typed in:

| Month | Crude | Gasoline | Diesel | Crack | Why the tour stops |
|---|---|---|---|---|---|
| Jun 2022 | 114.84 | 170.06 | 180.01 | 58.54 | highest month of 2022 (post-Ukraine peak) |
| Jan 2026 | 60.04 | 86.09 | 88.66 | 26.91 | |
| Feb 2026 | 64.51 | 82.91 | 96.69 | 23.00 | last month before the Iran war |
| Sep 2026 | 97.31 | 156.73 | 205.22 | 75.59 | highest month in the series |
| Oct 2026 | 99.97 | 144.66 | 199.34 | 62.92 | latest, partial (to 20 Oct) |

The lowest month is Nov 2008 at $2.22. That month gasoline ($51) was below crude ($57), and the figure shows it: the
green barrels are shorter than the orange ones.

These instrument constants are schematic, chosen for the drawing:

- The beam tilts 0.30° per $/bbl of crack, so 80 $/bbl tilts it 24°.
- Barrel height is 0.20 units per $/bbl, so the dearest barrel in the series (diesel, Sep 2026, $205) stands 41 units.
- The arc scale and the beam graduation run from −5 to 80 $/bbl.

`build.mjs` asserts the clearances at full scale: the products pan clears the arrest posts, the tallest barrel clears
the stirrup, and the beam's belly clears the bearing bracket.

## Interaction

- When idle, the tour runs from June 2006 at 9 months a second. It holds 3.4 s at each stop and 5.5 s at the latest
  month, then sweeps back to the start. It stops while the figure is offscreen.
- Moving the mouse over the figure scrubs the month: 10% to 90% of the width covers June 2006 to October 2026. Touch
  works by dragging; vertical page scroll stays free (`touch-action: pan-y`).
- ← / → step one month, PageUp / PageDown step a year, and Home / End jump to the ends. The tour resumes 4.5 s after
  the last input.
- The month index eases to its target, and the beam follows the crack on a slightly underdamped spring.
- With reduced motion there is no tour: the figure shows the latest month and moves only on input, without easing.
