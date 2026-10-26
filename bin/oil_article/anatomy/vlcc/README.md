# vlcc — freight per barrel on a VLCC

Anatomy figure for the oil-market long read. A Very Large Crude Carrier as a ship model on a display
stand, near side cut open over cargo-tank rows 2–4 (double side, double bottom, oil in the wing tanks;
row 2 also open from above to show the oil level). On the stand: a day-rate slider on a logarithmic
scale, a dial and counter reading $ per barrel, a coin stack (one coin per $1/bbl) beside a rod as tall
as one barrel of crude costs, and a barrel.

- `model.mjs` — every number, with its source in a comment; pure, also inlined into the page.
- `build.mjs` — geometry (anatomy kit), writes `assets/oil-article/anatomy/vlcc.html` (dark) and,
  with `--light`, `vlcc-light.html`. `--audit` runs the kit audit on the deck layer.
- `shots/` — headless checks (desktop, phone, light, close-ups, tour, line-end check).

Build: `node build.mjs && node build.mjs --light` (reads `assets/oil-article/oil.json` for the WTI price).

## Numbers

| Quantity | Value | Source / status |
|---|---|---|
| Length overall, beam, draught, depth | ~330 m, ~60 m, ~22 m, ~31 m | standard 300–320 kt dwt VLCC designs; approximate |
| Deadweight | ~300,000 t | VLCC class definition (200–320 kt); approximate |
| Cargo | 2,000,000 bbl | the industry's "2 million barrel" VLCC; round number |
| Tanks | 5 rows × 3 + 2 slop tanks, double hull ~3 m | usual double-hull VLCC layout; schematic |
| Laden voyage Ras Tanura → Ningbo | ~20 days at ~13 kn | ~6,000 nm benchmark Gulf → China route (TD3C); approximate |
| Days of hire paid | 50 | laden ~20 + ballast ~20 + port/waiting ~10; round number |
| Day rate range | $30,000 – $1,300,000/day (TCE) | $1.3M = record reported early October 2026 |
| Tour hold points | $70k (Jan 2026), $400k, $1.3M | brief |
| Crude price for comparison | WTI monthly mean, latest month in `oil.json` (2026-10: $99.97) | EIA via the post's pipeline |

Freight per barrel = rate × 50 / 2,000,000: $70k → $1.75, $400k → $10.0, $1.3M → $32.5 (a third of
~$100 crude). Excluded: bunker fuel, port dues, war-risk insurance (a further cost in 2026).

Drawing licences: pipes are drawn about 2× their true diameter; hull lines are simplified (vertical
sides, flat bottom, a blunt bow with a bulb).
