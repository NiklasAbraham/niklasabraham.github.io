# bonds — data for the government-bond section

`fetch.py` downloads into `cache/` (gitignored, ~350 kB): FRED (OECD 10-year yields for 22 of the 33 countries, Kim-Wright term premium, Fed funds, Z.1 holders of federal debt, H.4.1 Treasury holdings), US Treasury FiscalData (debt to the penny, MSPD stock by type, average interest rates, MTS table 9 interest vs defence) and TIC table 5. Reuses `bin/ai_article/cache/DGS10.csv` when present. `--force` re-downloads.
`process.py` → `assets/budget-article/bonds.json` (~90 kB): yields, debt and interest in dollars from `budget.json`, US detail, curated holder splits (Japan MoF June 2026, UK DMO Q1 2026, Italy, ECB PSPP, US rating actions), each with source, date, status.
`FACTS.md` is the sourced fact sheet for the prose. Prose numbers must be re-checked if the data are rebuilt.

`process.py` also writes the US definition tables (five debt measures, four interest measures, four defence measures, each with scope and date) and `us_rg` (IMF-basis inputs of the r-minus-g calculator). Note: the 'Total' row of MTS table 9 is receipts plus outlays; outlays are computed as Total minus the receipt rows. `prose_check.py` verifies the quoted numbers.
