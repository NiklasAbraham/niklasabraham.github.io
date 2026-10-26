# niklas-abraham.de — notes for Claude

al-folio Jekyll site, self-hosted on niklas-abraham.de. Deploy from this folder with
`docker compose build site && docker compose up -d site`. Not served by Jekyll (`exclude` in `_config.yml`).

## Blog posts (`_posts/`, `/blog/:year/:title/`)

- **Always the site's own look (CI), never the look of the source.** When a post is inspired by a video, reel or
  article, take the content, not its style: no dark sheets, condensed display fonts, blueprint title blocks or
  slide-like figures. Figures are the light `.concept.bx` cards of the food and AI posts (white stage, ink #04204b,
  blue #0b4fc0, warm #b4552f, teal #138374), at text width, set inside the prose with the caption under the card.
  Niklas rejected the reel look of the oil post on 26 Oct 2026 ("clean, fact-based, like the others").
- **The blog index is newest first.** Do not set `pinned: true` on a post unless Niklas asks for it.

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
`{% include bx.html kind=… %}` read by `assets/js/budget-explorer.js` from `assets/budget-article/budget.json`. Section 19 (`#bonds`, government bonds) has its own pipeline `bin/budget_article/bonds/` → `bonds.json`, figures `kind=yields|stock|holders|rg` in `assets/js/budget-bonds.js` (styles `_sass/_budget_bonds.scss`), source tags `{% include bd-ref.html k=… %}` from `_data/budget_article/refs.yml` (add the entry first; status primary/opened/snippet/data; snippet numbers are written "as reported"). Always state scope (central / general government, federal vs all levels), unit, currency and date; US debt and interest have several definitions, never mix them. Run `bin/budget_article/bonds/prose_check.py` after any rebuild.

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

## Fold walkthrough

`_projects/diffusion-walkthrough.md` (`/projects/diffusion-architectures/walkthrough/`): engine `assets/js/fw-core.js`,
chapters `fw-bio.js`, `fw-model.js` (the left-to-right strip; the open column takes the full width, a chip bar shows
the chain), `fw-film.js` (one PyMOL film, `bin/fold_film/`). Styles `_sass/_fold_walkthrough.scss`, `_fw_model.scss`.
Layout (20 Oct 2026): no step list beside the figure; the current step's title, points and principle sit in a column
inside the figure card. Prefer more, smaller steps over denser ones; the live in-browser sampler was dropped.


## Butterfly-wing post

`_posts/2026-10-21-butterfly-wing.md` (`/blog/2026/butterfly-wing/`): how a butterfly wing is moved (thorax muscles, compliant hinge, lever, synchronous muscle, stroke, clap and fling, steering). No data pipeline; the figures are drawn models.
Figures are `{% include bf.html kind=… %}` (hero, thorax, stroke, lever, muscle, freq, spring, fling; `hero` is the opening exploded view with the blast, the labels in two columns and the part descriptions from `PARTS` in `butterfly-core.js`) filled by `assets/js/butterfly-figs.js` (an ES module, loaded with `type="module"`); the 3D model, kinematics and viewer are in `assets/js/butterfly-core.js`. three.js r17x and OrbitControls are vendored in `assets/vendor/three/` (MIT; `OrbitControls.js` imports `./three.module.min.js` instead of the bare `three`, so no import map is needed). Styles `_sass/_butterfly_article.scss`. Source tags `{% include bf-ref.html k=… %}` from `_data/butterfly_article/refs.yml` (status opened / abstract / snippet / estimate; add the entry first). Inline maths is `$$…$$` in kramdown (single `$` is not rendered). Everything is schematic and the post says so; the lever ratio (9), the 32° swing and the three-spike bursts are chosen, not measured. Surfaces are physically based (21 Oct 2026 upgrade): wing textures are painted scale by scale with a bump map (`wingTex`, cached per wing and species), the body is furred with instanced hairs (`hairDir` keeps every hair out of the body: a hair swept backward inside the tangent plane, never into the shell, else hairs poke into the cut-open interior), the cuticle is split into a lid and a floor so the exploded view can open it (`Butterfly.explode(e)`, clip planes follow the parts), reflections come from a procedural studio (`makeEnv`). No free butterfly model was usable (CGTrader, RenderHub, Sketchfab are paid or login-gated), so everything is procedural. Headless check: the page is heavy under SwiftShader, so use `page.screenshot` after `scrollIntoView`, not element screenshots, and wait several seconds per state. Chromium needs `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` to render the WebGL figures.

Physics rewrite (21 Oct 2026, evening): Niklas wanted an engineering understanding, not a 3D showpiece, so the post is now physics-first: sections load (01), where the work comes from (02), lever (03), hinge (04), spring-wing and the Weis-Fogh number (05), muscle work loop (06), power budget (07), then the aerodynamics in short. The equations live in `assets/js/butterfly-phys-core.js` (pure functions, no DOM, run with node to test: `REF` is the reference butterfly of 80 mg / 5 cm² per side / 12 Hz / ±63°, all estimates; `wingModel`, `liftSummary`, `springWing`, `workLoop`, `bestPhase`), the figures that draw them in `assets/js/butterfly-physics.js` (`FIG_PHYS` = load, transmission, springwing, workloop, merged into `FIG` in `butterfly-figs.js`). Numbers quoted in the prose (85 % of the weight, N 0.66, 7 % spring saving, 79 W/kg at 12 Hz, 55 % stress at 0.5 mm) come from these functions: re-run them and fix the text if a parameter changes. Source tags added: lynch2024 (opened), gau2022 (abstract), muscle-power / monarch-fmr (snippet), hill / est-params (estimate). The old `lever`, `spring` figures remain in `butterfly-figs.js` unused. Headless check without WebGL: route the page and strip the `hero|thorax|stroke|fling` figures, otherwise element screenshots time out in SwiftShader.

### Butterfly wing: 3D is now a solved simulation (job 044)
The schematic 3D figures (exploded hero, cut-open thorax, stroke) are gone from the post. The only 3D figure is `kind="flight"` (`assets/js/butterfly-flight3d.js`): blade-element forces from `butterfly-phys-core.js` constants, stroke-plane tilt, 2-DOF point-mass body (height, forward), body drag C_D A = 1e-4 m² (estimate). `butterfly-core.js` still supplies the `Viewer`; its old `Butterfly` model is unused. Headless check: `root.__sim`, `root.__P`, `root.__st` on `#bf-flight`; scroll the figure into view twice (layout shifts after load), software GL needs ~8 s.

### Butterfly wing: biology figures are back (22 Oct 2026)
Niklas wanted the physics-first post *and* the biology with 3D, so section 00 "The animal, taken apart" was added and the cut-open thorax and the beating whole animal were rebuilt in `assets/js/butterfly-bio.js` (`FIG_BIO`: `anatomy`, `thorax`, `stroke`, merged into `FIG` in `butterfly-figs.js`) on top of the still-present procedural `Butterfly` model in `butterfly-core.js`. The earlier hero/thorax/stroke figure code and prose had never been committed and were lost, so these are new. `Viewer`'s IntersectionObserver now takes the last entry (a long model build queued entries and the first, stale one switched the loop off). Headless: scroll `#bf-*  .bf-3d` into view with `block:'center'` twice.

## Oil-market post

`_posts/2026-10-26-oil-market.md` (`/blog/2026/oil-market/`): the whole oil market (crude, refining, crack spread, producers, demand, costs, OPEC+, chokepoints, tankers, Cushing, benchmarks, curve, Brent−WTI, the 2026 Hormuz war, diesel, stocks, pump price). Pipeline `bin/oil_article/` (README there): EIA/FRED → `assets/oil-article/oil.json`, Natural Earth → `geo.json`, hand-curated `curated.py` (series colours live there too, in the site palette). Figures are `{% include oil.html kind=… %}` from `assets/js/oil-explorer.js`, drawn in the site's `.concept.bx` card (restyled 26 Oct 2026 from the first version's navy blueprint sheets, which Niklas rejected; styles `_sass/_oil_article.scss`). The four isometric drawings are iframes `{% include oil-anat.html name=… %}` of the `-light` pages in `assets/oil-article/anatomy/`, each patched with a `<style id="oil-site-light">` block that forces the light variables on every `.iso` and a white page: re-add it if the drawings are rebuilt from `bin/oil_article/anatomy/`. Source tags `{% include oil-ref.html k=… %}` from `_data/oil_article/refs.yml`. "Brent spot" in the post always means the EIA series; ICE futures are named as such. Check with `node bin/oil_article/shots.mjs [--phone]`. Thumbnail: `oil()` in `bin/thumbs/build.py` (crude flows on a pale map).
