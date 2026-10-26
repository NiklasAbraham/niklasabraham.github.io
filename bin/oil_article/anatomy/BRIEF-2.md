# Anatomy figures, second round (26 Oct 2026): distillation column and three oil fields

Read `BRIEF.md` first for the mechanics (anatomy skill, build.mjs/model.mjs/README per folder, iframe embedding,
postMessage height, no external requests, check headless, do not touch other blog files). **This brief overrides
its style section**: the reel look (dark navy blueprint sheets) was rejected by Niklas on 26 Oct 2026. Every new
drawing is built **light only**, in the site's look:

- One output per figure: `assets/oil-article/anatomy/<name>-light.html` (the include `_includes/oil-anat.html`
  loads `<name>-light.html`). Theme light, page background white, card `#fbfbfa`. Copy the `<style id="oil-site-light">`
  variable block from `assets/oil-article/anatomy/refinery-light.html` (the lines after `</style><style id="oil-site-light">`)
  into the page so the kit's tones match the four existing drawings.
- Site palette for colour that carries meaning: ink `#04204b`, blue `#0b4fc0`, warm `#b4552f`, teal `#138374`.
  Product streams as in the post's charts: crude `#b4552f`, LPG/gas `#c99a1e`, naphtha/gasoline `#138374`,
  kerosene/jet `#8a93a6`, diesel/gasoil `#6a47c2`, vacuum gasoil `#b58a5e`, residue `#4e3b2c`, water `#0b4fc0` at low
  opacity. Everything else in the kit's neutral greys. No condensed display fonts, no title blocks, no slide look.
- Labels: Inter/system sans, sentence case, short. Numbers in the readout come from `model.mjs`, each constant with its
  source in a comment (the research notes are in
  `~/code/ConceptsPlots/070_research/research_notes/the_oil_market_2026/`, files 060, 070, 080).
- Must read well at 720 px and at 390 px width (the iframe is the text width of the post).
- Finish with the output path, part count, what the interaction does, check results, and a proposed caption.
