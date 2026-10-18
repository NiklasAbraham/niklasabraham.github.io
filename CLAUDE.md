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
