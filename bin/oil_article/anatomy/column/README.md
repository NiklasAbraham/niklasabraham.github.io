# column — atmospheric distillation column, cut open (anatomy figure)

Why each product comes off at its own height. A bench model of a crude unit: a fired heater heats the crude,
the transfer line feeds the flash zone, and the column is cut by a vertical plane facing the reader, so its
15 trays (2 stripping trays below the feed, 13 above) show in section: decks, bubble caps cut through their axis
(riser, cup, slots) plus a whole cap behind each row, outlet weirs, downcomers with their liquid, the spill over
each weir, the feed horn with flashing feed, the stripping-steam sparger, the reflux distributor and the residue
sump. The liquid on each tray is tinted by the cut that boils at that tray's temperature. A temperature rule
stands beside the column (heights mapped to the example profile). Side draws go to a stacked three-section side
stripper (heavy gasoil, diesel, kerosene, each with steam and a vapour return); heavy naphtha goes straight out;
the overhead vapour goes to a condenser above the reflux drum (gas off the top, light naphtha and reflux off the
ends, sour-water boot); residue leaves the sump toward the vacuum unit. A second panel magnifies one tray.

Light only (BRIEF-2): output `assets/oil-article/anatomy/column-light.html`.

## Files

| File | What it is |
|---|---|
| `model.mjs` | The truth: n-alkane boiling points, cut points, carbon ranges, the column temperature profile, furnace, tray counts, Brent and WCS yields, `trayChem`, readout strings. Every number on the page comes from here. |
| `build.mjs` | Geometry (anatomy kit: `iso-kit`, `lathe`, `tube`, `audit`), the section, the rule, the magnified tray, HTML labels, page. |
| `style.css` | Page and SVG styles (site palette, chips, labels, liquids, motion). |
| `live.js` | Picking (chips, labels, pipes, arrow keys), the rule band and draw mark, crude toggle (stream widths), the magnified tray (bubbles, molecules), idle tour, offscreen pause, reduced motion, height `postMessage` (`oilFig: "column"`). |
| `shots/` | Headless checks: desktop, phone, reduced motion, picks, line-end rings, `audit.txt`. |

Build: `node build.mjs` (`--audit` for the geometry audit, must end `audit passed`; `--fig="…"` changes the
card label, default "The crude column"). Line ends: `node ~/.claude/skills/anatomy/scripts/lines.mjs
../../../../assets/oil-article/anatomy/column-light.html` (must print `line ends: 0`).

## Numbers and where they come from

All from `~/code/ConceptsPlots/070_research/research_notes/the_oil_market_2026/060_distillation_chemistry.md`.

| Quantity | Value | Source (status) |
|---|---|---|
| Draw temperatures | overhead 104, heavy naphtha 161, kerosene 205, diesel 262, AGO 322, flash 346 (328–374), bottoms 341 °C | US 10,913,908 B2 worked example (snippet: printed "about", caption says approximate) |
| Feed into the column | 343–371 °C (650–700 °F) | OSHA Technical Manual (primary) |
| Flashed | up to 50 % of the crude | Jechura, CBEN409 (primary) |
| Trays | real 35–50; drawn 15 | Jechura's table (primary); figure's choice |
| Tray spacing | 60–75 cm | Wikipedia "Theoretical plate" (opened) |
| Cut points | LN 15–80, HN 80–150, kero 150–230, gasoil 230–375 split at 321 (diesel 230–321, heavy gasoil 321–375), residue > 375 °C | TotalEnergies assay cuts; 321 °C = Penn State FSC 432 LGO/HGO boundary (primary) |
| Carbon ranges | n-alkanes boiling inside each cut: gas C1–C4, LN C5–C6, HN C7–C8, kero C9–C12, diesel C13–C18, HGO C19–C22, residue C23+ | derived from the D2887/NIST/CRC table (060 §3 method) |
| Brent yields, wt % | gas 2.7, LN 6.8, HN 14.4, kero 13.3, diesel 16.6, HGO 9.5, residue 36.7 | TotalEnergies TBP assay 2006, interpolated (primary) |
| WCS yields, wt % | gas 1.4, LN 5.3, HN 5.2, kero 5.6, diesel 8.6, HGO 6.3, residue 67.5 | crudemonitor.ca D7169 SimDist, 1 Sep 2026, linear interpolation between sparse points (approximate) |
| Tray chemistry | heavy example = lightest n-alkane boiling above the tray; light = heaviest boiling ≥ 60 °C below | `trayChem`, boiling points from 060 §2.2 |

Schematic choices (not data): liquid depth and cap size exaggerated, tray 1 is the heavy gasoil draw, the
stripping-tray tints between flash and bottoms are interpolated, stream width ∝ √yield.

## Checks (26 Oct 2026)

- `node build.mjs --audit`: `audit passed` (31 tubes, 160 solids, 214 items).
- `lines.mjs`: `line ends: 0` at 760 px and 390 px.
- Console clean on desktop, phone, reduced motion; no horizontal scroll. Page height ≈ 1480 px at 720, ≈ 1335 at 390.
