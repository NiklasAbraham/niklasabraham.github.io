# budget_article — the national-budget long read

Everything behind `/blog/2026/national-budgets/` (`_posts/2026-10-18-national-budgets.md`). Run from this folder, in order:

| Script | What it does | Output |
|---|---|---|
| `fetch.py` | Downloads raw data with curl: IMF (GFS_COFOG, GFS_SOO, FM, WEO via api.imf.org SDMX 3.0 CSV), Eurostat (gov_10a_exp, nama_10_gdp), OECD (table 11), World Bank (SIPRI military). `--force` re-downloads. About 600 MB, takes a few minutes | `cache/` (gitignored) |
| `process.py` | Merges them (Eurostat for the 11 EU members, OECD for Korea and Australia where newer than the IMF, IMF otherwise), builds COFOG % of GDP per year, revenue and economic-type splits, fiscal series, prints checks | `assets/budget-article/budget.json` |
| `profiles.py` | One generated card per country (every sentence computed; hand-written caveats in `CAVEAT`) | `_includes/budget-article/profiles.html` |
| `facts.py` | Prints the rankings quoted in the prose | stdout |

Support: `countries.py` (the 33 countries, regions), `cofog_meta.py` (division and group names, the eight colour groups).
Styles `_sass/_budget_article.scss`; include `_includes/bx.html`; JS `assets/js/budget-explorer.js` (stack bars, sankey, treemap, compare, lines, scatter; vanilla SVG/HTML, no library).

Known data limits (also in the post): India, Mexico and Saudi Arabia have no COFOG; Russia's latest is 2020, UAE has one year; COFOG totals differ from IMF headline expenditure for Singapore, Canada, USA, South Africa; the US reports no environment spending; Singapore's net investment is negative (excluded from the economic-type view).
Prose numbers were typed from `facts.py` output and ad-hoc checks; re-check them if `budget.json` is rebuilt.
