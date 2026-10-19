# ai_article — the "Who pays for the AI boom?" long read

Everything behind `/blog/2026/ai-money/` (`_posts/2026-10-19-ai-money.md`). Run from this folder:

| Script | What it does | Output |
|---|---|---|
| `fetch.py` | Downloads the public FRED series with curl (no key): Treasury yields DGS2/10/30, SOFR, fed funds, ACM term premium, Nasdaq Composite, ICE BofA IG/BBB/HY option-adjusted spreads, OECD 10-year yields of twelve countries. `--force` re-downloads | `cache/*.csv` (gitignored, 600 kB) |
| `build.py` | Samples the daily series weekly, reads interest and debt from the budget article's `budget.json`, adds the hand-curated facts of `curated.py` and the short names of the references | `assets/ai-article/ai.json` (70 kB) |
| `shots.mjs` | Headless Playwright on the running preview: console errors and one screenshot per figure | `cache/shots/` |

`curated.py` holds every reported number that is not a downloaded series (capex guidance, labs, the deal network, commitments, spread curves, the cost-of-money ladder, the deals table, default-swap levels), each with a `ref` key into `_data/ai_article/refs.yml`. Edit there and rerun `build.py`; the figures read only `ai.json`.

References: `_data/ai_article/refs.yml` (key, short tag, publisher, title, date, url, status = opened / snippet / primary / data). In the post, `[[key]]` was expanded to `{% include ai-ref.html k="key" %}`, which prints the numbered-by-name tag and links to the entry in `{% include ai-refs.html %}` at the end. The status field is honest on purpose: Bloomberg, Reuters, CNBC and the FT are paywalled or block automated readers, so most numbers are "as reported" via search snippets and aggregators.

Figures: `{% include ai.html kind=… %}` (capex, labs, web, commit, curves, ladder, deals, rates, calc, nasdaq, sov) read by `assets/js/ai-explorer.js` (vanilla SVG/HTML, one `timeChart` helper for rates, Nasdaq and sovereign yields); styles `_sass/_ai_article.scss` on top of the budget article's `.concept.bx` / `.bx-*`.

Known limits: all deal facts come from secondary pages; the Hyperion price (91 cents, 7.55 %) is of 19 Oct 2026 and is also in Bloomberg-syndicated text on two sites; the Amazon 40-year yield is computed (30-year Treasury on 7 Jul + 125 bp); the QTS rate is a midpoint of "low to mid 7 %"; prose numbers were typed from the sources and from ad-hoc checks of `ai.json`, re-check them if the data are rebuilt. FRED terms: ICE BofA series are republished with ICE's permission and must be credited (done in the post).
