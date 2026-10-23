# Government bonds: narrative brief for the budget long read

Compiled 19 Oct 2026. Status tags: **opened** = page/PDF/API read in full or the relevant part; **snippet** = search-result text only; **primary** = central bank, treasury, debt office, statistics office, IMF/ESM/BIS/Eurostat (also tagged opened or snippet); **data** = FRED/OECD/Eurostat series pulled by me. Paywalled outlets are snippet by rule. "derived" = my arithmetic from the quoted figures. Dates are as printed in the source.

Conventions: yields in %, spreads in basis points (bp), US fiscal year ends 30 Sept.

---

## 1. How a deficit becomes issuance: the mechanics (US Treasury and Bundesfinanzagentur)

**Mechanism.** A bond is a fixed schedule of coupons plus principal. The coupon is fixed at issue (as a round percentage of face value); the yield is whatever the auction clears at, so price and yield move opposite ways. The state sells new debt at scheduled auctions to dealers and investors, rolls maturing debt into new debt, and adds the deficit on top. Gross issuance = deficit + redemptions.

**US.**
- Marketable debt held by the public, 30 Sep 2026: **$31.814 trn** (bills 7.118, notes 16.278, bonds 5.539, TIPS 2.172, FRNs 0.708 trn). Total public debt outstanding incl. intragovernmental: **$40.172 trn** (Treasury MSPD, record date 2026-09-30, fiscaldata API). [opened, primary]
- Average interest rate on marketable debt 30 Sep 2026: **3.518 %** (bills 3.870, notes 3.383, bonds 3.466). That is the average *coupon* on the stock, far below today's yields because most of the stock was issued earlier at lower rates. [opened, primary]
- Refunding of 5 Aug 2026: $125 bn offered to refinance ~$96.3 bn maturing 15 Aug 2026, raising ~$28.7 bn new cash. Sizes: 3y $58 bn, 10y $42 bn, 30y $25 bn (auctions 11-13 Aug, settle 17 Aug). Monthly sizes Aug-Oct: 2y 69, 3y 58, 5y 70, 7y 44, FRN 28-30 ($ bn). Treasury expects to keep coupon sizes unchanged "for at least the next several quarters". Next refunding 4 Nov 2026. Buybacks up to $38 bn off-the-run for liquidity, up to $25 bn for cash management. [opened, primary]
- FY2026 (Oct 2025-Sep 2026) cumulative: receipts $5.403 trn, outlays $7.396 trn, deficit $1.992 trn (derived), net interest $1.052 trn (prior year $0.970 trn), national defense $0.965 trn (MTS table 9, 2026-09-30). [opened, primary] Net interest = 19.5 % of receipts (derived).
- Primary dealers (banks obliged to bid at every auction) not documented here: NY Fed page 404 on fetch. [not verified; omit or source separately]

**Germany (Bundesfinanzagentur, Deutsche Finanzagentur).**
- Plan for 2026 (press release no. 10, 18 Dec 2025): **~€512.0 bn** via auctions of conventional securities and green bonds: €318.0 bn capital market + €176.0 bn money market (Unverzinsliche Schatzanweisungen, "Bubills") + green €16-19 bn; four syndicates. Breakdown: Schatz (2y) 17 issues €92 bn; Bobl (5y) 14 issues €73 bn; 7y 6 dates €22 bn; Bund (10y) 15 dates €82 bn; 15/20y segment 10 dates €20 bn; 30y 11 dates €29 bn; first-ever 20y Bund via syndicate in 2026. Money-market: €53 bn of the €176 bn matures within 2026. Plan "may change with financing need and market conditions" but is held to give investors reliable orientation. [opened, primary]
- Update 24 Sep 2026 (Börsen-Zeitung, Diemer): €525.5 bn raised in 2026; maturities €309 bn in 2026; €79 bn redemptions in Q4; 2027 issuance to rise "significantly to record levels". Federal holdings of own securities ~€200 bn. [opened (partial), snippet-level press; primary figures should be re-checked on deutsche-finanzagentur.de]
- Stock: Börsen-Zeitung gives outstanding federal capital-market debt €1.997 trn, planned €2.144 trn at end 2026 (article date not visible). [snippet] German general government debt 64.4 % of GDP in Q1 2026 (Eurostat gov_10q_ggdebt). [opened, primary]
- Contrast to note: US plans by size per auction and keeps sizes fixed for quarters; Germany publishes the whole calendar a year ahead.

**Budget lesson.** The deficit is only the top layer; the *rollover* of maturing debt (Germany €309 bn redemptions in 2026 vs a net borrowing need of ~€217 bn, derived) is the larger refinancing task every year, and it reprices at the market yield each time. The average coupon (US 3.5 %) lags the market (10y 5.1 %, below) by years, which is why the interest bill keeps rising even when rates stop rising.

Sources:
1. https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_1 (MSPD table 1; Sep 2026) - opened, primary
2. https://home.treasury.gov/news/press-releases/sb0590 (refunding statement 5 Aug 2026) - opened, primary
3. https://www.deutsche-finanzagentur.de/fileadmin/user_upload/Pressemitteilung/dt/2025/2025_12_18_pm_10_Emissionsplanung_Bund_2026_dt.pdf - opened, primary
4. https://www.boersen-zeitung.de/kapitalmaerkte/bund-muss-2027-mehr-kredite-aufnehmen - opened (partial)

---

## 2. Who holds sovereign debt: Japan vs US vs Italy

**US (TIC, Aug 2026).** Foreign holdings of Treasury securities **$9.332 trn** (Japan 1,068; UK 1,010; mainland China 591); foreign official 3,756 (~40 %). Foreign share of debt held by the public ~29 % (9.33 / 32.43, derived; TIC counts marketable securities, so approximate). Fed: SOMA Treasuries (TREAST) **$4.571 trn** at 14 Oct 2026 = ~14 % of marketable debt (derived). [opened, primary; FRED data]

**Japan (MOF, flow of funds, end-Dec 2025, preliminary).** BoJ **¥503.0 trn = 49.0 %** of JGB holdings (¥1,025.8 trn total); insurers 15.8 %, banks (incl. Japan Post Bank) 15.2 %, public pensions 6.9 %, pension funds 3.0 %, foreigners **6.8 %**. BoJ share was 11.55 % in Mar 2013 and peaked ~53.3 % around Mar 2023 (Nippon.com summary). Consequence: demand for the long end rests on domestic life insurers/pensions, so their withdrawal matters (see episode 7). [snippet: MOF PDF could not be text-extracted; numbers via search summary of MOF table]

**Italy (Banca d'Italia, via OCPI Cattolica, April 2026, published 15 Jul 2026).** Non-residents net of ECB **34 %** (up from 32.3 % in Oct 2025); Eurosystem **19 %** (down from 20.7 %; peak 28.7 % in 2022 after QE, 18.3 % in 2019); resident non-central-bank holders 47 %: households and firms 14.6 % (9.5 % in 2022), banks and money funds 20.3 % (24.1 %), other financial incl. insurers/pensions 12.1 % (13.9 %). Non-residents' holdings €966.98 bn in July 2026, an all-time high (Teleborsa citing Banca d'Italia). [opened (OCPI), snippet (Teleborsa)]

**Contrast.** Japan: debt is held at home, half by the central bank, foreigners marginal. US: global reserve asset, ~29 % foreign, Fed ~14 %. Italy: since the QE share fell, foreigners and households replaced the Eurosystem; domestic banks hold the "doom loop" exposure (their share is falling).

**Budget lesson.** Who holds the debt determines who can *stop* buying. Domestic captive holders (Japan, Italy households) make a rollover crisis slower; foreign price-sensitive holders (US, Italy 34 %) make it faster but also deeper and more liquid.

Sources:
1. https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt - opened, primary
2. https://www.mof.go.jp/english/policy/jgbs/reference/Others/holdings01.pdf (and holdings02.pdf) - snippet, primary (PDF unreadable to me)
3. https://osservatoriocpi.unicatt.it/ocpi-pubblicazioni-la-composizione-dei-detentori-del-debito-pubblico-italiano-un-aggiornamento - opened (data = Banca d'Italia)
4. https://www.borsaitaliana.it/borsa/notizie/teleborsa/finanza/titoli-di-stato-italiani-controvalore-detenuto-da-esteri-e-retail-ai-massimi-storici-95_2026-10-15_TLB.html - snippet

---

## 3. QE and QT: central-bank balance sheets

**Numbers (FRED, weekly, to 14 Oct 2026 for Fed; 9 Oct ECB; Sep 2026 BoJ).**
- Fed total assets: $0.88 trn (Dec 2007) -> peak **$8.965 trn (13 Apr 2022)** -> **$6.756 trn (14 Oct 2026)**. Treasuries on the Fed's books: peak $5.771 trn (8 Jun 2022) -> $4.571 trn. [data; primary series]
- Eurosystem assets: peak **€8.836 trn (24 Jun 2022)** -> €5.944 trn (9 Oct 2026). [data]
- BoJ assets: peak ¥7,648 trn (Aug 2024) -> ¥6,250 trn (Sep 2026). [data]
- Fed ended runoff on **1 Dec 2025**; began reserve-management purchases of Treasury bills in Dec 2025; July 2026 Monetary Policy Report: balance sheet "ticked up" to **$6.7 trn** (data to 1 Jul 2026), reserves about $3.1 trn. [opened, primary]
- BoJ (16 Jun 2026, ING): raised to 1.00 % (7-1), decided to stop tapering JGB purchases from April 2027, holding ~¥2 trn per month. [snippet]

**Mechanism.** QE = the central bank creates reserves and buys bonds; the government's interest on those bonds is effectively paid to its own central bank and (at the time) rebated; QT = bonds mature without replacement, so the Treasury must find a private buyer for the full amount, raising supply the market has to absorb. With policy rates above coupons, a central bank holding long bonds also reports *losses* (it pays interest on reserves above what it earns). Term premium effect is the contested channel; the NY Fed ACM 10y term premium was **-0.66 % on 4 Aug 2020** and **+1.07 % on 9 Oct 2026** (THREEFYTP10, data), a 1.7 pp swing, of which QE/QT is one of several contributors (attribution not verified).

**Budget lesson.** During QE the central bank was a price-insensitive buyer of 4-5 trn of the deficit; the budget's low interest bill of 2020-21 was partly *bought*. QT hands that duty back to private buyers at a price.

Sources:
1. https://www.federalreserve.gov/monetarypolicy/2026-07-mpr-part2.htm - opened, primary
2. https://fred.stlouisfed.org/series/WALCL ; TREAST ; ECBASSETSW ; JPNASSETS ; THREEFYTP10 - data
3. https://think.ing.com/snaps/the-bank-of-japan-raised-its-policy-rate-to-10-but-market-reactions-were-muted/ (BoJ Jun 2026) - snippet

---

## 4. Euro crisis 2010-12, Greece restructuring, "whatever it takes"

**Yields (OECD long-term rates, monthly averages, FRED data).** Germany 10y 2.74 % (May 2010) -> 1.87 % (Nov 2011): safe-asset flight. Greece 7.97 % (May 2010) -> 16.15 % (Jul 2011) -> **29.24 % (Feb 2012)**. Portugal peak 13.85 % (Jan 2012). Italy 4.0 % (Dec 2009) -> **7.06 % (Nov 2011, monthly)**. Spain 6.79 % (Jul 2012). Italy-Bund daily record **575 bp on 9 Nov 2011** (BTP 7.47 %; AGI); two other outlets quoted 522-536 bp intraday that day. [data; AGI snippet]

**Greece.** March 2012 private-sector involvement: **53.5 % face-value cut**, ~**€197 bn of ~€206 bn** invited privately held bonds exchanged (ESM: ~97 %), ~**€107 bn** off the debt stock; Greek ministry April 2012: €198.63 bn, ~96.6 % of €205.5 bn. NPV haircut ~74 % in one law-firm summary; threshold of 90 % participation set by Greece; collective action clauses used on Greek-law bonds. [ESM opened, primary; others snippet] Debt/GDP: 147.8 % in 2010 -> **143.5 % in Q1 2026** (Eurostat) with 2025 estimates 145.7-146.1 %; Greece prepaid €5.287 bn of EFSF/ESM loans in Dec 2025 and plans to be below 120 % by 2029. [Eurostat opened, primary; To Vima snippet]

**"Whatever it takes."** Draghi, 26 Jul 2012, London Global Investment Conference: "Within our mandate, the ECB is ready to do whatever it takes to preserve the euro. And believe me, it will be enough." (ECB speech, opened, primary.) OMT technical features, 6 Sep 2012: purchases of sovereign bonds with 1-3 year maturity, only with an EFSF/ESM programme (strict conditionality), liquidity fully sterilised, "no ex ante quantitative limits." (ECB press release, opened, primary.) Italy 10y fell from 5.996 % (Jul 2012 avg) to 4.11 % (Dec 2013) without OMT ever being used (non-use stated here from general knowledge: **not verified in sources read**).

**Budget lesson.** The market can reprice a solvent-looking state into a self-fulfilling default (Italy's 2011 primary balance not checked here; yield 7 %). A backstop that is *credible but unused* can end the run. Conditionality is the price: the budget is handed to a programme.

Sources:
1. https://www.ecb.europa.eu/press/key/date/2012/html/sp120726.en.html - opened, primary
2. https://www.ecb.europa.eu/press/pr/date/2012/html/pr120906_1.en.html - opened, primary
3. https://www.esm.europa.eu/content/what-was-private-sector-debt-restructuring-march-2012 - opened, primary
4. https://fred.stlouisfed.org/series/IRLTLT01GRM156N (and ITM, ESM, PTM, DEM) - data
5. https://www.agi.it/economia/news/2021-02-04/draghi-spread-montagne-russe-11286301/ - snippet

---

## 5. UK gilts, Sept 2022: mini-budget and LDI

**What happened (Bank of England primary letter, Cunliffe to Treasury Committee, 5 Oct 2022, read as text).**
- Mini-budget 23 Sept 2022 (Fri). 30y gilt yield: +~50 bp on Mon 26 Sept (more than 80 bp above Friday's start); on Tue 27 Sept it fell 20 bp in the morning, then ended **67 bp above the morning level**. Wed 28 Sept intraday range 127 bp; the BoE operation led to a **>100 bp fall** in the 30y that day. Over a few days the 30y rose **160 bp**, from ~1.2 % at start of 2022. Biggest prior daily rise in data since 2000: 29 bp.
- Mechanism: **over £1 trn** invested in LDI strategies (hedge pension liabilities with leveraged long gilts); rising yields -> margin/collateral calls -> forced gilt sales -> higher yields -> "potentially self-reinforcing spiral." Market intelligence on 26 Sept implied at least **£50 bn** of extra long-gilt sales vs recent normal trading volumes of **£12 bn per day** in those maturities.
- Response: 28 Sept announcement of temporary long-dated gilt purchases "on whatever scale is necessary", indemnified by HM Treasury, to "restore orderly market conditions"; "material risk to UK financial stability". Auction limit £5 bn/day, raised to £10 bn on 10 Oct, index-linked added 11 Oct; ended 14 Oct. **Purchases peaked at £19.3 bn** (£12.1 bn conventional, £7.2 bn index-linked); unwound from 29 Nov 2022, completed 12 Jan 2023 (BoE APF Q4 2022 report). [all opened, primary]
- 30y gilt reached 5.1 % on 12 Oct 2022 (Tradeweb, snippet). The ~£65 bn figure in circulation = my multiplication of £5 bn x 13 days; **not a stated figure**, do not use.

**2026 sequel (gilts, snippet-level except one).** 30y yield 5.78 % on 5 May 2026 (highest since 1998; Bloomberg, 403, snippet); 5.86 % mid-May (roic snippet); **DMO 30y syndication 8 Sept 2026: £4.25 bn of the 5.375 % 2056 at 5.8168 %, "highest since the DMO was established", orders >£87 bn** (AJ Bell, opened); 30y reached 6.029 % on 1 Oct 2026 (roic snippet, highest since 1998) ahead of the Budget on **28 Oct 2026**. OECD monthly UK 10y: 4.45 % (Jan 2026) -> 5.24 % (Sep 2026) (data). Outcome of the 28 Oct Budget cannot be known today.

**Budget lesson.** The yield rise was triggered by *unfunded* tax cuts (~£45 bn per one source, snippet) with no OBR forecast; the transmission ran through a leveraged domestic holder, not foreign flight. The government lost its Chancellor and PM within weeks. A fiscal event now has to pass a bond-market test before a parliamentary one.

Sources:
1. https://www.bankofengland.co.uk/-/media/boe/files/letter/2022/october/letter-from-jon-cunliffe-ldi-5-october-2022 - opened, primary
2. https://www.bankofengland.co.uk/news/2022/september/bank-of-england-announces-gilt-market-operation - opened, primary
3. https://www.bankofengland.co.uk/asset-purchase-facility/2022/2022-q4 - opened, primary
4. https://www.ajbell.co.uk/news/articles/uk-pays-record-yield-30-year-gilt-despite-bumper-demand - opened
5. https://www.roic.ai/news/uk-30-year-gilt-yield-breaches-6-for-first-time-since-1998-10-01-2026 - snippet (403)

---

## 6. US ratings, term premium and the interest bill (2023-2026)

**Ratings.** S&P to AA+ (Aug 2011); Fitch to AA+ (1 Aug 2023, citing deterioration and debt-ceiling brinkmanship); Moody's Aaa -> **Aa1 on 16 May 2025**, projecting federal debt ~**134 % of GDP by 2035** (98 % in 2024) and "successive US administrations and Congress have failed to agree on measures to reverse the trend of large annual fiscal deficits and growing interest costs." [snippet; agencies' pages blocked to my fetcher; S&P 2011 text not retrieved]

**Yields (FRED DGS10, DGS30, THREEFYTP10).** 10y: 3.63 % (16 Sep 2024) -> 4.51 % (23 May 2025, days after the downgrade; 4.43 % on 16 May) -> 3.97 % (22 Oct 2025 low) -> **5.31 % (5 Oct 2026, highest since 2007)** -> 5.10 % (15 Oct 2026). 30y: 5.11 % (19 Oct 2023) -> 5.67 % (7 Oct 2026, highest since 2007) -> 5.43 % (15 Oct). ACM term premium (10y): 0.04 % (16 Sep 2024) -> 0.66 % (19 Oct 2023) -> **1.10 % (5 Oct 2026)** -> 1.07 % (9 Oct), vs 2009 high 1.25 % (data). KuCoin/Axios-type headlines ("10-year high") are consistent but snippet.

**Interest vs defence.**
- FY2026 to 30 Sep: net interest **$1.052 trn** (+8.4 % on $0.970 trn), national defense **$0.965 trn** (MTS, opened, primary). First reported crossing of net interest over defense in FY2024 (CBO, via BeInCrypto snippet).
- BEA national accounts, 2026 Q2 annualised: federal interest payments **$1,280 bn** vs national defense spending **$1,190 bn** (FRED A091RC1Q027SBEA, FDEFX; data). Definitions differ from MTS; do not mix.
- CBO Feb 2026 baseline: FY2026 deficit $1.9 trn (5.8 % of GDP), outlays $7.4 trn; net interest 3.2 % of GDP ($970 bn) in 2025 rising to 4.6 % ($2.1 trn) in 2036; above defense every year of the baseline (CBO testimony opened via search; CRFB summary snippet; House Budget Cttee summary is partisan).
- The causal story for the Oct 2026 spike (energy prices, inflation, expectations of Fed hikes, fiscal risk) is from press snippets and is **unverified**; a September 2026 FOMC "hike" is discussed in the repo's AI post (ATFX snippet) but I did not verify the Fed funds path.

**Budget lesson.** With r on the stock still rising toward market yields and a deficit near 6 % of GDP, interest is the one large line item no legislation chooses. The rating cut mattered little for yields on the day (4.43 -> 4.51 % in a week); what moved yields was supply plus term premium, not the letter grade.

Sources:
1. https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_9 (record_date 2026-09-30) - opened, primary
2. https://fred.stlouisfed.org/series/DGS10 ; DGS30 ; THREEFYTP10 ; A091RC1Q027SBEA ; FDEFX - data
3. https://www.cbo.gov/publication/62207 - snippet, primary
4. https://www.crfb.org/blogs/cbo-releases-february-2026-budget-and-economic-outlook - snippet
5. https://seekingalpha.com/news/4449791-moodys-downgrades-u-s-due-to-ever-rising-debt-high-interest-payment-ratios - snippet (Moody's Aa1)
6. https://www.kucoin.com/news/flash/us-treasury-yield-spikes-as-term-premium-hits-10-year-high - snippet

---

## 7. Japan: from yield-curve control to 4 % at the long end

**Timeline.**
- BoJ ended negative rates and yield-curve control on **19 Mar 2024** (rate to 0-0.1 %, first hike since 2007; 7-2 vote). [snippet]
- OECD 10y JGB (monthly, data): 0.055 % (Jan 2021) -> 0.41 % (Dec 2022) -> 1.09 % (Dec 2024) -> 2.06 % (Dec 2025) -> 3.05 % (Sep 2026).
- Policy rate: 1.00 % after 16 Jun 2026 hike; **1.25 % on 18 Sept 2026** (7-2, Asada and Sato dissenting; "highest since 1995"; Jiji/nippon.com, Business Today, snippet). The BoJ list page confirms a 18 Sept 2026 "Change in the Guideline for Money Market Operations" (title only, primary, opened).
- Jan 2026 sell-off: Takaichi called a snap election for 8 Feb and pledged a two-year suspension of the 8 % consumption tax on food (~¥5 trn/yr revenue; ¥21.5 trn package); 40y JGB hit **4.22 %**, first time above 4.2 %; 30y **3.88 %**, +26.8 bp in a day, ~+45 bp in January; weak 20y auction and life-insurer selling cited. [snippet, TheStreet/Euronews]
- 1 Sept 2026: 10y JGB **3.000 %**, first since 1996 (equal to the 3.0 % rate in the FY2026 budget; snippet).
- 8 Sept 2026 closes: 2y 1.835, 5y 2.230, 10y 2.890, 20y 3.695, **30y 3.965, 40y 4.035**; 5y record 2.31 % the week before (Edge Malaysia/Reuters, opened).
- **5 Oct 2026: 30y record 4.235 %**, 10y 3.08 %, 2y 1.9 % (The Standard HK, opened). **8 Oct 2026 MOF 30y auction (4.2 % coupon, due 2056): average yield 4.109 %, lowest-accepted 4.121 %, ¥450.7 bn accepted, bid-to-cover ~3.9** (MOF, opened, primary; bid-to-cover derived).

**Budget arithmetic (FY2026 budget, adopted by cabinet 26 Dec 2025).** General account **¥122.3 trn**; new JGBs ~**¥29.6 trn**; debt service **¥31.28 trn** (record, sixth year), of which interest **¥13.04 trn** (Jiji); **assumed interest rate raised from 2.0 % to 3.0 %**; MOF sensitivity: debt service ~¥16.1 trn *in interest* if long-term rates average 2.5 % by FY2028, ¥25.6 trn by FY2034 even if rates then stay flat (Jiji/Adnkronos snippet; the Adnkronos page opened gave the ¥31.28 trn and 3.0 % but not the sensitivity). For the next budget request, MOF assumes **3.8 %** (snippet).

**Cannot verify.** JGB yields after 8 Oct 2026; the BoJ's "yield curve control exit" effect on holdings beyond MOF share data; any October BoJ meeting (next meeting date not retrieved); whether the 5 Oct record still stands on 19 Oct.

**Budget lesson.** A country with debt >200 % of GDP and the lowest effective rate for decades is the clean test of "r matters": every 1 pp on the stock of ¥1,000 trn-scale debt is ~¥10 trn a year, and the MOF now assumes 3.8 %. The sell-off was fiscal (food-tax cut) plus a thinning buyer base (insurers, BoJ stepping back), not inflation alone.

Sources:
1. https://www.mof.go.jp/english/policy/jgbs/auction/calendar/eresul/eresul20261008.htm - opened, primary
2. https://www.thestandard.com.hk/finance/article/344586/ - opened
3. https://theedgemalaysia.com/node/817187 - opened (Reuters-style wire)
4. https://english.adnkronos.com/2025/12/26/japan-govt-adopts-record-122-t-yen-draft-budget-for-fy-2026/ - opened (Jiji wire)
5. https://pro.thestreet.com/market-commentary/japans-new-leader-faces-test-after-41-billion-bond-meltdown - snippet
6. https://www.boj.or.jp/en/mopo/mpmdeci/mpr_2026/index.htm - opened, primary (list only)
7. https://fred.stlouisfed.org/series/IRLTLT01JPM156N - data

---

## 8. France 2024-26: spreads and political budget stress

**Facts.**
- 10y OAT-Bund spread: **55 bp in Feb 2026**, 75-80 bp in Nov 2025 (MNI snippets); OECD monthly 10y: France 3.35 % (Feb 2026) -> 4.03 % (Aug) -> 4.48 % (Sep); Germany 2.75 % -> 3.19 % -> 3.47 % (data; Sept monthly avg spread = 101 bp, derived).
- **1-2 Oct 2026: 10y OAT briefly above 5 %** (4.989 % on 1 Oct per roic.ai, above 5 % per Trading Economics 2 Oct), highest since 2002; spread to Bund "above 150 bp, widest since late 2011" (Trading Economics, opened); other aggregators say ~120-131 bp "highest since 2012" on 30 Sept (roic snippets): **the spread level conflicts across sources; use FRED/ECB data for the chart and cite the range**. Easing to ~4.8 % by 15-19 Oct (TE, opened).
- Trigger: 2027 budget bill with **€54 bn of consolidation** (€43 bn new measures; roic snippet), deficit target 5 % of GDP; fiscal watchdog called assumptions "optimistic"; presidential election 2027; AFT plans **€340 bn** record borrowing next year (TE, opened).
- 2026 budget was only passed 2-3 Feb 2026 after four months, via Article 49.3 (revenue part), target deficit **5.0 % of GDP** vs ~5.4 % in 2025, loosened from 4.7 % to obtain Socialist support (snippets: Europe1, Le Temps, Newsquawk).
- Debt: **117.6 % of GDP, Q1 2026** (Eurostat), 115.4 % Q2 2025 (data). A claim of 119 % in Q2 2026 is from a snippet (roic); Eurostat Q2 2026 not retrieved.
- AFT 2026 programme: **€310.0 bn net medium/long-term issuance**; €162 bn raised by mid-May, 50.8 % done; draft budget debt charge **€58.0 bn in 2026** (+7.49 % vs €53.5 bn) (AFT bulletin / Senate report; AFT page snippet). Rating actions on France in 2025-26: **not verified** (searched, not found).
- Comparison to note: in Aug 2026 France (4.03 %) was *above* Italy (3.99 %) on OECD 10y (data), a reversal of the 2011 ordering.

**Budget lesson.** Spread = a price on political ability to execute a consolidation, not only on the debt ratio (France 117 % vs Italy 139 % in Q1 2026). The EUR 54 bn plan was priced as less credible than a mid-year budget that nearly failed.

Sources:
1. https://tradingeconomics.com/france/government-bond-yield/news/589189 - opened
2. https://www.roic.ai/news/french-10-year-bond-yield-breaches-5-for-first-time-since-2002-10-02-2026 ; .../french-bond-risk-hits-highest-level-since-2012-09-30-2026 - snippet (403)
3. https://www.aft.gouv.fr/en/node/13632 (2026 financing programme) - snippet, primary
4. https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10q_ggdebt - opened, primary
5. https://www.letemps.ch/monde/europe/le-gouvernement-lecornu-sauve-son-budget-2026-au-terme-d-une-longue-bataille - snippet

---

## 9. Emerging markets: local vs foreign-currency debt, one clean case (Ghana)

**Principle.** Debt in own currency can be inflated or restructured domestically; debt in dollars needs reserves. IMF GFSR Oct 2025, ch. 3: EMDE government debt nearly **$30 trn** (~$12 trn ex-China), median ~60 % of GDP; countries with higher local-currency shares and diverse investor bases saw more stable yields in global stress; average maturity of domestic debt for large EMs 7 years in 2024. [snippet, primary]

**Ghana.**
- Dec 2022: domestic exchange launched 5 Dec; **19 Dec 2022** suspension of payments on Eurobonds, commercial and most bilateral debt "pending orderly restructuring" (Finance Ministry; reserves ~$6.6 bn in Sept 2022, < 3 months of imports). [snippet; MoF page]
- Domestic debt exchange (DDEP) closed 10 Feb 2023: ~GH¢83 bn of GH¢97.7 bn treasury bonds exchanged (85 %); later total GH¢203 bn exchanged; pension funds got special terms (21 % coupon on new notes vs 18.5 % average on old). New-bond coupon schedule **not verified**. [snippet]
- External: Eurobond deal June 2024 / completed Oct 2024: **$13 bn** restructured, **98 % consent** (threshold 65 %); two options: PAR (0 % face haircut, 1.5 % coupon, due 2037) and DISCO (37 % haircut, 5-6 % coupon, 2029-35); nominal reduction ~**37 % (~$5 bn)**; average rate on bonded debt from >8 % to <5 % (Finance Minister Adam, GNA, opened); Finance Ministry in 2024: $4.7 bn cancelled + $4.4 bn cash-flow relief (snippet). OCC approved comparability of treatment under the G20 Common Framework.
- IMF: 39-month ECF, sixth and final review completed 27 Jul 2026, final disbursement ~$371 m, total ~$3 bn; risk of debt distress back to *moderate*; new 36-month Policy Coordination Instrument. (Press coverage snippet; IMF PR 25/429, 17 Dec 2025, opened.) IMF projection table (5th review): gross public debt/GDP **79.1 % (2023) -> 69.8 % (2024) -> 56.6 % (2025) -> 54.9 % (2026)** (projections for 2025-26); inflation back in target range for the first time since 2021. Ghana MoF newsletter, Mar 2026: central-government debt **GH¢686.1 bn (US$62.4 bn), 42.95 % of projected GDP**, 53.3 % domestic / 46.7 % external; note definitional gap to the IMF series (public sector vs central gov't, rebased GDP) not resolved. (Opened, primary.)
- Pre-default interest/revenue ratio for Ghana: **not verified**. The IMF full staff report (IMF CR 26/212) was not opened.

**Alternates (not researched in depth, say so if mentioned):** Argentina (2020 restructuring), Türkiye (domestic-currency lira debt, no default), Zambia, Sri Lanka.

**Budget lesson.** Default risk showed up in the interest/revenue ratio and reserves before the yield spike; the *domestic* creditors (banks, pension funds) took the first haircut because they cannot leave; the budget got relief of ~$9 bn but lost market access for ~2 years.

Sources:
1. https://gna.org.gh/2024/10/ghana-completes-external-debt-restructuring-with-eurobond-holders/ - opened
2. https://www.imf.org/en/news/articles/2025/12/17/pr-25429-ghana-imf-completes-the-fifth-review-under-the-ecf-arrangement - opened, primary
3. https://mofep.gov.gh/sites/default/files/basic-page/Monthly-Public-Debt-Newsletter-2026-03.pdf - opened, primary
4. https://www.mofep.gov.gh/sites/default/files/news/Suspension-of-Payments-on-Selected-External-Debts-of-The-GoG.pdf - snippet, primary
5. https://www.imf.org/en/publications/gfsr/issues/2025/10/14/global-financial-stability-report-october-2025 - snippet, primary
6. https://gazettengr.com/ghana-exits-imf-programme-with-inflation-down-reserves-up-final-371-million-disbursement-approved/ - snippet

---

## 10. r minus g: why the same debt ratio is safe at 1 % and dangerous at 5 %

**Identity.** Debt ratio $d_t = D_t/Y_t$ evolves as $d_{t+1} - d_t = \frac{r-g}{1+g}\,d_t - p_t$, with $r$ the effective nominal interest rate on the stock, $g$ nominal GDP growth, $p$ the primary balance in % of GDP (surplus positive). The debt-stabilising primary balance is $p^* = \frac{r-g}{1+g}\,d$.

**Worked example with real US figures (FRED/BEA/Treasury, Q2 of each year; effective $r$ = federal interest payments / debt held by the public; $g$ = YoY nominal GDP).**

| Q2 | debt held by public / GDP | interest payments | eff. r | g (nominal) | interest / GDP |
|---|---|---|---|---|---|
| 2021 | 95.3 % | $560 bn | 2.50 % | 17.5 % (rebound) | 2.39 % |
| 2022 | 92.5 % | $683 bn | 2.85 % | 10.3 % | 2.64 % |
| 2023 | 92.5 % | $894 bn | 3.51 % | 6.4 % | 3.25 % |
| 2024 | 94.5 % | $1,096 bn | 3.97 % | 6.2 % | 3.75 % |
| 2025 | 94.6 % | $1,197 bn | 4.13 % | 4.8 % | 3.91 % |
| 2026 | 97.4 % | $1,280 bn | 4.04 % | 6.3 % | 3.93 % |

(Series: FYGFDPUN, GDP, A091RC1Q027SBEA; all data, computed by me. Interest uses a gross NIPA concept and slightly overstates r on public debt; the Treasury's own average rate on marketable debt is 3.52 % at 30 Sep 2026.)

- **Same debt, different bill.** The debt ratio is ~95 % in 2021 and ~97 % in 2026, but interest rises from **2.4 % to 3.9 % of GDP** because $r$ moved from 2.5 % to 4.0 %.
- **Hypotheticals on d = 97.4 %, g = 4 % nominal:** at $r = 1\,\%$: interest bill $0.97$ % of GDP, $p^* = \frac{-3}{104}\times 97.4 \approx -2.8$ % (the state can run a primary *deficit* of 2.8 % of GDP and the ratio is flat); at $r = 5\,\%$: interest $4.9$ % of GDP, $p^* = \frac{1}{104}\times 97.4 \approx +0.94$ % (a primary *surplus* is required). A 6 pp swing in the required primary balance = 3.7 pp of GDP.
- **Actual 2026.** FY2026 deficit $1.992 trn minus net interest $1.052 trn = primary deficit $0.94 trn = ~2.9 % of GDP (on 2026 Q2 annualised GDP $32.56 trn; derived). With $r = 4.0\,\%$, $g = 5.9\,\%$ (4-year nominal CAGR, derived), $p^* \approx \frac{-1.9}{105.9}\times 97.4 \approx -1.7$ %: favourable $r-g$ allows a 1.7 % primary deficit, but the actual primary deficit is 2.9 %, so the ratio still rises (95 % to 97 % over 2025-26). The comfort is a 1.9 pp growth margin, not the primary balance.
- **Italy (Istat, Sept 2026 release):** 2025 deficit 3.1 %, primary balance +0.8 %, debt 136.7 % of GDP (March release 137.1 %). Implied interest ~3.9 % of GDP, implied $r \approx 2.9$ % (derived, approximate). The primary surplus is the whole job; a 1 pp rise in $r$ on a 137 % ratio costs ~1.4 % of GDP per year once fully rolled.
- **Japan, MOF:** budget-assumed rate 3.0 % (FY2026) -> 3.8 % (FY2027 request). Interest ¥13.0 trn in FY2026.

**Budget lesson.** Only the *difference* $r-g$ matters for the ratio, but only $r$ (level) matters for the *bill* a parliament must find each year. The two come apart when nominal growth falls (2025: g 4.8 % vs r 4.1 %, margin nearly gone) or when the stock rolls onto market yields.

Sources:
1. https://fred.stlouisfed.org/series/FYGFDPUN ; GDP ; A091RC1Q027SBEA - data
2. https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates (30 Sep 2026) - opened, primary
3. https://www.ilfoglio.it/en/economy/2026/09/22/news/istat-confirms-2025-deficit-at-31-per-cent-italy-remains-subject-to-infringement-proceedings--408315 - snippet (Istat data)
4. https://english.adnkronos.com/2025/12/26/japan-govt-adopts-record-122-t-yen-draft-budget-for-fy-2026/ - opened

---

## Claims I could not verify (do not print without a fix)

- Primary dealer count and obligations (NY Fed page 404).
- Any S&P 2011 / Fitch 2023 / Moody's 2025 statement text (agency sites blocked); the 134 % of GDP by 2035 figure is from a secondary summary.
- Attribution of the Oct 2026 US yield spike to energy prices, inflation and Fed hike expectations (press snippets); the Fed funds path in Sept-Oct 2026.
- That OMT was never used (general knowledge, not read in a source); the 74 % NPV haircut for Greece; "95.7 %" participation (not found; sources give 96.6 % and ~97 %).
- UK mini-budget "~£45 bn" unfunded tax cuts (Finadium snippet); the "£65 bn" BoE figure (my multiplication, not stated; BoE says peak holdings £19.3 bn).
- UK 30y 6.029 % on 1 Oct 2026 and 5.78 % on 5 May 2026 (single aggregator / Bloomberg 403); outcome of the 28 Oct 2026 Budget (future).
- France: spread at 2 Oct 2026 (sources: 120, 131, >150 bp); French debt 119 % in Q2 2026; €54 bn consolidation split; AFT's "€340 bn" for 2027; any 2025-26 rating action; the 2026 debt charge after the final budget.
- Japan: holder shares after Dec 2025; JGB yields after 8 Oct 2026; the interest-sensitivity figures (¥16.1 / 25.6 trn) are wire-service snippets; the 1 Sept 2026 3.000 % 10y print; the BoJ's 18 Sept 2026 statement text (only the title was opened).
- Italian holders by category beyond April 2026; Banca d'Italia's own table (only OCPI's summary read).
- Bund stock €1.997 trn / €2.144 trn (date of article unknown); Bundesbank's €2.60 trn figure covers all public issuers.
- Ghana: DDEP coupon schedule, bank losses, pre-default interest/revenue ratio, IMF series vs MoF newsletter definitions; IMF CR 26/212 not opened.
- IMF GFSR local-currency share of EM debt (chapter PDF not read).
- ACM term-premium attribution to QE/QT; Fed asset-purchase effect estimates.
