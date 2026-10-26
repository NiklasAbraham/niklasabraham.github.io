# fields

Anatomy figure (Drawing E) for the oil-market long read: three ways oil comes out of the ground, as three geology
block models on one plinth, cut open at the front on **one depth scale**. Ghawar (onshore carbonate, water flood),
Johan Sverdrup (North Sea steel-jacket platform, sandstone) and a Permian shale well (vertical, then 3.3 km horizontal,
fracked in stages). Light only (BRIEF-2.md).

Build: `node build.mjs` writes `assets/oil-article/anatomy/fields-light.html` (~600 KB, standalone, no requests; the
`oil-site-light` style block is copied from `refinery-light.html` at build time). `node build.mjs --audit` runs the
kit audit (passes; one crowding pair excused after a look: the missile manifold pipe lying on its trailer bed).

Files: `model.mjs` (every number, with source key and status; scales; the Arps fit; chips, readout and caption text),
`build.mjs` (strata, wells and fractures in the cut, surface plant, the sea, card, chips, cost panels), `live.js`
(picking, tour, Ghawar water front, Permian year loop and frac pulse, reduced motion, height `postMessage`),
`fields.css`, `shots/` (checks).

## Scales (schematic)
- Depth: 44 world units per km in all three blocks; across the section 20 units per km (vertical exaggeration 2.2).
  Blocks are cut off at 3.3 km. The surface plant is enlarged far beyond either scale.
- Water depth over Sverdrup 115 m (Sodir) is drawn on the depth scale, which is why the jacket is short.
- Lateral 3,310 m (EIA TIE 67984, 2025 Permian average) on the horizontal scale; 16 of the ~45–50 stages are drawn.
- Layer names, thicknesses and the shape of the folds are schematic, apart from the reservoir depths:
  Ghawar Arab-D top 1.95 km at the crest (cited range 1.8–2.33 km), oil column ~330 m drawn (up to 396 m, GeoExpro);
  Sverdrup 1.9 km (Sodir); Permian target 2.9 km TVD (Wolfcamp B, EIA TIE 53059, snippet).

## Numbers (research note 080_upstream_fields.md, section F; keys = post refs.yml where one exists)
| Field | Rate per well | Decline | Lifting | Capital | Taxes/royalty at $70 | Breakeven |
|---|---|---|---|---|---|---|
| Ghawar | ~9,400 b/d (Haradh III, `mrc-haradh`, snippet → "about") | field 1–2 %/yr (`worldoil-ghawar`, `iea-decline`) | $3.51/boe (`aramco-ar25`, primary; all Aramco fields) | $8.0/boe (same) | ~$34: royalty 15 % + 50 % income tax (note: Argaam, World Oil 2017, snippet; computed) | $27 full-cycle new ME onshore (`rystad`) |
| Sverdrup | ~48,000 b/d (>430 kb/d from 9 wells 2020; Hart snippet, `equinor-sverdrup`) | plateau 755 kb/d 2023–early 2025; >10 % in 2026 (`jpt-sverdrup`) | < $2 (`equinor-sverdrup`, primary) | ~$6–7 (computed from Sodir/Equinor capex) | ~$48: 78 % marginal tax on (70 − 2 − 6.5) (`np-tax`; computed) | < $20 (`equinor-sverdrup`) |
| Permian | 730 → 200 b/d after 12 months (`api-decline`, opened) | ~73 % in year 1 (computed from the same) | $5.91/boe (`diamondback`) | ~$13/bbl oil (computed: $7 m / ~0.55 mb) | ~$21: royalty 25 % (note: Caddo, snippet) + TX severance 4.6 % (`tx-tax`); income tax left out | $68.57 new well, Midland (`dallasfed`, primary) |

The four "cost" kinds are kept apart in the panel: lifting and capital are drawn as bar segments, taxes and royalty
as a third segment for a $70 reference barrel, and the breakeven as a separate teal marker named by its kind.

Shale decline loop: Arps hyperbolic q = 730 / (1 + 1.4 · 3.66 · t)^(1/1.4), the note's illustrative fit through
730 and 200 b/d (not a measured well). The flow ribbon in the well is drawn proportional to q (floored at 22 %).
The Ghawar oil-water contact climbs ~90 m over a 22 s pass (schematic), then the pass fades and starts again.

## Checks (26 Oct 2026)
`--audit`: audit passed (202 items, 201 solids, 9 tubes). `scripts/lines.mjs`: 0 floating ends at 720 and 390 px,
Ghawar and Permian (late in the year) selected. Desktop, phone, zooms of each top, the water front at two times,
Permian mid-year and reduced motion in `shots/`.
