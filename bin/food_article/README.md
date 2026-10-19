# food_article — the world-food long read

Everything behind `/blog/2026/world-food/` (`_posts/2026-10-19-world-food.md`). Run from the repository root, in this order:

| Script | What it does | Output |
|---|---|---|
| `fetch.py` | Downloads three FAOSTAT bulk files with curl (QCL production 34 MB, TM detailed trade matrix 421 MB, FBS food balances 55 MB; the file names contain parentheses, curl needs `-g`) | `cache/*.zip` (gitignored) |
| `tm_extract.py` | Streams the 8.5 GB trade-matrix csv out of the zip (never unzipped: the disk is tight), keeps the commodities of `commodities.py`, tonnes and value, as reporter and as partner. About 5 minutes | `cache/tm.pkl` |
| `process.py` | Production 1961-2024 and 2023 snapshot per country, food balances (latest year per country since 2019), trade flows with the mirror rule, "what happens to a crop" table | `assets/food-article/{food,trade,diet}.json` |
| `geo.py` | Natural Earth 50m countries, Equal Earth, simplified SVG paths keyed by UN M49 code, anchor point per country for the arcs | `assets/food-article/world.json` |
| `facts.py`, `story.py` | Print the rankings and the numbers quoted in the prose | stdout |
| `shots.mjs` | Headless Playwright: console errors and one screenshot per figure of the running preview (`http://127.0.0.1:4000/blog/2026/world-food/`) | `cache/shots/` |

Support: `commodities.py` (68 commodities: FAOSTAT item codes for production and for trade, group, `cmp` = production and trade are the same physical product, `DERIVED` = made from another listed commodity).
Styles `_sass/_food_article.scss` (frame, controls and tooltip are the budget article's `.concept.bx` / `.bx-*`); includes `_includes/fd.html` (figure) and `fd-concept.html` (formula cards in `_data/food_article/`); JS `assets/js/food-explorer.js` (vanilla SVG/HTML; each data file is fetched once, when the first figure that needs it scrolls into view).

Choices, all stated in the post: headline year 2023; "China" is FAO's China, mainland (Hong Kong, Macao, Taiwan Province separate); a flow's tonnes are the importer's report, else the exporter's; hen eggs published only in pieces (14 EU countries) are converted at the world mean mass per egg; food balances use each country's latest year since 2019 (20 countries, among them Japan, have none).

Known limits: fish is not in FAOSTAT's production tables; the trade matrix is lower than national figures for some sellers (Russian wheat 34 Mt against about 44 Mt in USDA's marketing year); the sum of countries for eggs is 1 % below FAO's world row; prose numbers were typed from `facts.py` / `story.py` output and checked by script, re-check them if the JSON is rebuilt.
Data licence: FAOSTAT is CC BY 4.0 (citations in the post); Natural Earth is public domain.
`cache/` is gitignored; delete `tm.pkl` and the zips to free about 400 MB, they can be rebuilt with `fetch.py` and `tm_extract.py`.
