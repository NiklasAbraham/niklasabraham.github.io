# Anatomy figures for the oil-market long read — shared brief

The post: `_posts/2026-10-26-oil-market.md` on Niklas Abraham's Jekyll blog (`~/code/niklasabraham.github.io`, read its
CLAUDE.md). It explains the whole world oil market, anchored in the 2026 Iran war / Hormuz crisis, in the visual feel of
the reel by "Crude & Conflict" (dark navy blueprint sheets, white line drawings in isometric, an engineering title block,
orange = crude, blue = diesel, green/yellow = gasoline, red = the "crack"/margin). Keyframes of the reel:
`~/code/ConceptsPlots/900_data/reels/Dev_az-Ar0k/sheet_1.jpg` … `sheet_5.jpg` (look at two of them for the feel).

Rules for every anatomy figure:
- Use the `anatomy` skill (invoke it with the Skill tool and follow it: object = explanation, parts list first, kit,
  painter's order, audit/lines checks, read your own screenshots). Framework-free: `build.mjs` importing
  `~/.claude/skills/anatomy/kit/iso-kit.mjs` (absolute import path) and `scripts/inline-kit.mjs`.
- Source in `bin/oil_article/anatomy/<name>/` (build.mjs, model.mjs, live.js, README.md with the numbers and where
  they come from). Output: `assets/oil-article/anatomy/<name>.html` (dark) and `<name>-light.html` (light), standalone,
  no external requests (privacy: nothing from CDNs; fonts only system/kit).
- The page is embedded in the post in an `<iframe>`: make the body margin 0, the card fill the width (max ~720 px), no
  page title outside the card, and post the document height to the parent on load and resize:
  `parent.postMessage({ oilFig: "<name>", h: document.documentElement.scrollHeight }, "*")`.
- Colour only where colour is the subject (product streams: crude orange #E8913A, gasoline green #A6C94A,
  jet/kerosene white/pale, diesel blue #4FA8E0, residue/heavy grey-brown, margin red #E5533D). Everything else is the
  kit's tones.
- Every number in the readout and caption comes from `model.mjs`; write the source of each constant in a comment.
  Approximations are labelled as such in the caption ("approximate", "schematic").
- Data from the post's pipeline: `assets/oil-article/oil.json` (keys: monthly.t ["YYYY-MM"], monthly.wti,
  monthly.gas_usg, monthly.ulsd_usg, monthly.crack321_usg [$ per bbl]; stocks.t, stocks.cushing [thousand bbl, weekly];
  built from EIA spot prices to 20 Oct 2026). Inline the slice you need into the page at build time (no fetch).
- Check headless with the skill's capture/drive/lines scripts, dark and light, desktop and 390 px; read the PNGs.
  Save screenshots under `bin/oil_article/anatomy/<name>/shots/`.
- Do not touch any other file of the blog (the post, includes, sass) — the coordinator embeds the figure.
- Finish with: the two output paths, size tier, part count, what the interaction does, the readout strings, the check
  results (audit / line ends), and the caption text you propose for the post.
