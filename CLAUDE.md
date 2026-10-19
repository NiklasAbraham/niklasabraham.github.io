# niklas-abraham.de — notes for Claude

al-folio Jekyll site, self-hosted on niklas-abraham.de. Deploy from this folder with
`docker compose build site && docker compose up -d site`. Not served by Jekyll (`exclude` in `_config.yml`).

## Blog posts (`_posts/`, `/blog/:year/:title/`)

- **No stat-tile row at the top.** No grid of headline numbers ("2,925 TWh / 59.8 % / 89 EUR/MWh …")
  between the intro note and the text. Niklas removed it from the energy post (18 Oct 2026); the
  numbers belong in the prose and figures where they are explained. Open with eyebrow, title, lede,
  meta line, the "note before you start", then the question and the contents.
- Long reads reuse the `.da` styles and `assets/js/da-guide.js` (contents rail, `data-stations="off"`,
  `data-brand`). Post-specific styles go in their own `_sass/_<post>.scss`.
- End every section with a `{: .da-bridge}` paragraph that closes it and opens the next.
- Set `read_time` in the front matter when inlined SVGs inflate the word count.
- Data pipelines live in `bin/<post>/` with a README (see `bin/energy_article/`).
- Privacy: everything self-hosted in `assets/vendor/`; no CDN, Google Fonts, embeds or tracking
  (the privacy policy promises it). Credit data licences in the post (e.g. Energy-Charts CC BY 4.0).
- Never put `|` inside `$$…$$` (kramdown reads a table); use `\lvert … \rvert`.

## AI disclaimer

All blog posts are written by Claude, and the site says so: `_includes/ai-notice.html` sits on the blog index, and
every post opens with a `.da-note.ai-note` saying the article was written by an AI at Niklas's request, that he uses
such articles to read about topics he finds interesting, and that numbers come from the named public sources while the
prose may contain errors. Keep this in every new post, and write the byline as "Written by an AI, published by Niklas
Abraham", never as if he wrote it.

## Budget post

`_posts/2026-10-18-national-budgets.md`. Pipeline in `bin/budget_article/` (README there); figures are
`{% include bx.html kind=… %}` read by `assets/js/budget-explorer.js` from `assets/budget-article/budget.json`.

## Food post

`_posts/2026-10-19-world-food.md` (`/blog/2026/world-food/`). Pipeline in `bin/food_article/` (README there): FAOSTAT production (QCL),
detailed trade matrix (TM, 8.5 GB csv streamed out of the zip, never unzipped) and food balances (FBS) plus Natural Earth borders →
`assets/food-article/{food,trade,diet,world}.json`. Figures are `{% include fd.html kind=… %}` read by `assets/js/food-explorer.js`
(atlas, plate, scale, use, half, time, traded, flow, diet, country; each data file is fetched once, when the first figure that needs it
scrolls into view); styles `_sass/_food_article.scss` on top of the budget post's `.concept.bx` / `.bx-*`; formula cards
`{% include fd-concept.html id=… %}` from `_data/food_article/`. FAOSTAT is CC BY 4.0 (citation format in the Sources section).
`nginx.conf` now gzips JSON/JS/CSS/SVG (the data files are several hundred KB). The disk of the dev machine is nearly full: keep
`bin/food_article/cache/` small (delete `tm.pkl` and the zips when done).

## AI-money post

`_posts/2026-10-19-ai-money.md` (`/blog/2026/ai-money/`): who funds whom in the AI build-out, bonds and rates, bubble tests, sovereign yields. Pipeline in `bin/ai_article/` (README there): FRED series + hand-curated `curated.py` → `assets/ai-article/ai.json`. Figures are `{% include ai.html kind=… %}` read by `assets/js/ai-explorer.js` (capex, labs, web, commit, curves, ladder, deals, rates, calc, nasdaq, sov); styles `_sass/_ai_article.scss` on top of the budget post's `.bx-*`. **Every claim carries a source tag** `{% include ai-ref.html k="key" %}` resolved from `_data/ai_article/refs.yml` (status opened / snippet / primary / data); add the entry before using a key. Prices of bonds and swaps are stamped with their date; refresh them (and `build.py`) before republishing.
