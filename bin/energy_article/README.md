# energy_article — the German energy long read

Everything behind `/blog/2026/german-energy-market/` (`_posts/2026-10-17-german-energy-market.md`).
Run from the repository root, in this order:

| Script | What it does | Output |
|---|---|---|
| `fetch.py` | Downloads Energy-Charts (Fraunhofer ISE, CC BY 4.0) via curl, one request per year, with backoff (the API rate-limits) | `cache/*.json` (gitignored, ~80 MB) |
| `process.py` | 15-minute and hourly tables, Europe/Berlin, short source keys | `cache/q15.pkl`, `cache/hourly.pkl` |
| `plots.py [names]` | All data figures (matplotlib, style in `style.py`: Inter, one colour per source) | `assets/energy-article/media/*.webp` |
| `maps.py [gas renewables grid europe]` | Maps with the ConceptsPlots map kit (`~/code/ConceptsPlots/100_code/020_maps`) | `_includes/energy-article/*.svg`, previews in `cache/preview/` |
| `explorer_data.py` | Hourly data per year for the explorer | `assets/energy-article/explorer/YYYY.json` |
| `animframes.mjs SPEC OUT [times]` | Contact sheet of a 2d-anim concept spec at fixed times (headless, Playwright from `~/code/Website/node_modules`) | `cache/animcheck/*.png` |

Concept cards live in `_data/energy_article/`: `f0*` formula cards written by hand, `a0*` animations generated
with `~/code/MasterThesis/050_system/concepts/concepts.py viz` (raw outputs in `concepts/`; `a03` and `a04`
hand-edited, see their `hand_edited` flag). Includes: `en-fig.html` (webp figure), `en-map.html` (inline SVG
map), `en-concept.html` (concept card); styles `_sass/_energy_article.scss`; JS `assets/js/energy-explorer.js`,
plus the shared `concepts.js` and `da-guide.js` (rail; `data-stations="off"`, `data-brand`).

Numbers taken from reports (AGEB, BNetzA, BDEW, FA Wind und Solar, strom-report/MaStR) are written into the
scripts next to their source.

## 3D grid scenes (section 06, "From the plant to your socket")

| Script | What it does | Output |
|---|---|---|
| `grid3d.py [scenes] [--res WxH] [--samples N]` | Run in Blender (`blender -b --python bin/energy_article/grid3d.py -- plant line sub380 sub110 village house overview`). Procedural isometric dioramas (Cycles, CPU, ~15 s per scene), plus a json of anchor pixel positions | `cache/grid3d/<scene>.png/.json` |
| `grid3d_label.py [scenes]` | Pills with leader lines at those anchors (Inter; colour = voltage level), written as webp | `assets/energy-article/media/grid_<scene>.webp` |

Not to scale; the cable trench is deeper than a real one. Level colours: 380 kV violet, 110 kV blue, 20 kV teal, 0.4 kV warm (`.lvl-*` in `_sass/_energy_article.scss`).
