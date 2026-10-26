# oil_article — "The crack writes the story" (the world oil market, 2026)

Everything behind `/blog/2026/oil-market/` (`_posts/2026-10-26-oil-market.md`). Run from this folder with the
`conceptsplots` env (`~/miniconda3/envs/conceptsplots/bin/python`: pandas, xlrd, shapely):

| Script | What it does | Output |
|---|---|---|
| `fetch.py` | EIA daily spot prices via FRED (WTI, Brent, NYH/USGC gasoline, ULSD, jet, heating oil) and EIA history workbooks (Cushing, US crude, SPR, distillate, gasoline stocks; utilisation; exports; production; retail gasoline and diesel) with curl, no key. `--force` re-downloads | `cache/*.csv`, `cache/*.xls` (gitignored) |
| `build.py` | Products to $/bbl, crack spreads (3-2-1 NYH vs WTI = the reel's, USGC vs WTI, NYH vs Brent; diesel and gasoline cracks; Brent−WTI), weekly history to 2024 + daily 2025–26 + monthly; weekly stocks; adds `curated.py` | `assets/oil-article/oil.json` (420 kB) |
| `curated.py` | Every number that is not a downloaded series (yields, events, chokepoints, sea lanes, flows, places, Hormuz stages, countries, products, per-capita, breakevens, spare capacity, shut-ins, assays, North Sea basket, curve points, pump breakdowns), each sourced in a comment | → `oil.json["curated"]` |
| `geo.py` | Natural Earth admin-0 (50m world in Equal Earth; 10m Gulf and North Sea, 50m Atlantic in scaled equirectangular) as SVG paths plus projection parameters | `assets/oil-article/geo.json` (440 kB) |
| `shots.mjs` | Headless Playwright on the running preview: console errors, overflow, one screenshot per figure (`--phone` for 390 px, `--only=kind,…`) | `cache/shots/` |
| `anatomy/` | The isometric drawings made with the `anatomy` skill (refinery, crack-balance, vlcc, cushing-tank; light-only since 26 Oct 2026: column, fields, see `BRIEF-2.md`): each folder has `build.mjs`, `model.mjs`, README and shots; `BRIEF.md` is the shared brief | `assets/oil-article/anatomy/<name>.html` (+ `-light`) |

Figures: `{% include oil.html kind=… %}` read by `assets/js/oil-explorer.js` (barrel, assay, boil, tbp, stages, crack, producers, us, demand,
wells, upcost, cost, spare, pipes, flows, northsea, curve, gap, route, prices, hormuz, war, stocks, pump), styles `_sass/_oil_article.scss`
(blueprint sheets: navy paper, grid, Barlow Condensed headings vendored in `assets/vendor/fonts/barlow-condensed/`, title
block with drawing number). Drawings: `{% include oil-anat.html name=… %}` embeds the standalone page in an iframe whose
height follows the page's `postMessage({oilFig, h})`. Source tags `{% include oil-ref.html k=… %}` from
`_data/oil_article/refs.yml` (status data / primary / opened / snippet / estimate).

Research notes behind the text (five researchers, Oct 2026): `~/code/ConceptsPlots/070_research/research_notes/the_oil_market_2026/`.
The reel was read with `~/code/ConceptsPlots/100_code/100_reel_reader/reel.py`.

Known limits: "Brent spot" is the EIA series (a Dated-type physical price), not ICE futures; 2026 tanker flows differ by
tracker (Kpler vs Vortexa up to 6 mb/d); the Hormuz stage numbers mix IEA months with Kpler weeks for October; the German
litre breakdown is an order-of-magnitude estimate; pipeline and dock costs in the `route` figure are round estimates.
Prose numbers were typed from the data and notes: re-check them after a rebuild with newer data.

Added 26 Oct 2026 (second round): `curated.py` gained DISTILL (n-alkane boiling points, cut points, TBP curves, Raoult
staircases; note 060), UPSTREAM / SHALE_ARPS / FIELD_HIST (three field types, costs, decline; note 080) and PIPES /
PIPE_EVENTS (62 lines with Wikipedia-coordinate waypoints, 58 dated events; note 070). The shale decline curve and the
50 mmHg vacuum curve are derived (labelled so in the post). Notes 060-080 are in the research-notes folder above.
