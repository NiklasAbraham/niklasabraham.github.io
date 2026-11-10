# Irrawaddy rice boat post: dev preview

`_posts/2026-11-07-irrawaddy-rice-boat.md` (`/blog/2026/irrawaddy-rice-boat/`) has no data pipeline: the figures are
drawn in the browser.

- `assets/js/boat-model.js`: the procedural three.js laung-zat (`Boat`: parts, `explode`, `setSail`, `setRig('kelly'|'yule')`,
  `setOars`, `steer`, `highlight`) and its `Viewer`. Units metres; dimensions are chosen, not measured.
- `assets/js/boat-figs.js`: `{% include rb.html kind="boat"|"river" %}`; part texts in `PARTS`.
- Styles `_sass/_rice_boat_article.scss`; source tags `{% include rb-ref.html k=… %}` from `_data/rice_boat_article/refs.yml`.
- Photos in `assets/rice-boat/` (public domain, from Wikimedia Commons; the museum photo is Niklas's).

`preview.html` loads both figures without Jekyll: serve the repository root (`python3 -m http.server 5591`) and open
`http://127.0.0.1:5591/bin/rice_boat/preview.html`. Headless WebGL needs Chromium with
`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`; each figure root exposes `__boat`, `__view`, `__st`.
Research notes behind the text: `~/code/ConceptsPlots/070_research/research_notes/irrawaddy_rice_boat/`.
