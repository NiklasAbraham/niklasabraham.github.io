"""Re-derive every number quoted in section 19 (bonds) of _posts/2026-10-18-national-budgets.md from assets/budget-article/bonds.json
(and budget.json) and print it next to the value in the prose. 'quoted' is typed by hand from the prose; 'source' is computed here.
Items whose source is a document (not in the JSON) are listed under DOCUMENT with the page they were read on; they cannot be recomputed
by this script. Exit code 1 if any computed item disagrees with the prose beyond the rounding tolerance.
Usage: python3 prose_check.py
"""
import json, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parents[3]
D = json.load(open(ROOT / 'assets/budget-article/bonds.json')); B = json.load(open(ROOT / 'assets/budget-article/budget.json'))['countries']
POST = (ROOT / '_posts/2026-10-18-national-budgets.md').read_text()
G = D['grid']; Y = D['yields']; U = D['us']; bad = []
def y(c, m): return Y[c]['y'][G.index(m)]
def dv(c, k, yr=None):
    d = D['debt'][c]; i = d['years'].index(yr) if yr else -1; return d[k][i]
def iv(c, k, yr=None):
    d = D['interest'][c]; i = d['years'].index(yr) if yr else -1; return d[k][i]
rows = []
def chk(label, quoted, source, tol=0.051, unit=''):
    ok = abs(quoted - source) <= tol; rows.append((ok, label, quoted, source, unit))
    if not ok: bad.append(label)

# --- how a bond works
price = lambda c, r, n: c * (1 - (1 + r) ** -n) / r + 100 * (1 + r) ** -n
chk('price of a 10-year 4 % coupon bond at a 5 % yield, per 100', 92.28, price(4, .05, 10), .005)
chk('same bond at a 3 % yield is above 100 (value)', 100, min(100, price(4, .03, 10)) if price(4, .03, 10) > 100 else 0, 0)
# --- issuance
chk('refunding: new cash share of $125 bn offering, %', 23, 28.7 / 125 * 100, .5)
I = U['interest_vs_defense_usd_bn']
chk('FY2026 receipts, $ bn', 5403, I['receipts']['2026'], .6); chk('FY2026 outlays, $ bn', 7396, I['outlays']['2026'], .6); chk('FY2026 deficit, $ bn', 1992, I['deficit']['2026'], .6)
# --- the pile (US definitions table)
T = U['total_public_debt_usd_bn']; M = U['marketable_stock_usd_bn']; H = U['holders_common_quarter_usd_bn']
chk('IMF general-government gross debt, end 2025, $ trn', 38.39, dv('USA', 'usd_bn', 2025) / 1e3, .006); chk('  as % of GDP', 124.4, dv('USA', 'pct_gdp', 2025))
chk('federal debt Z.1 Q1 2026, $ trn', 39.07, H['total'] / 1e3, .006); chk('total public debt 15 Oct 2026, $ trn', 40.39, T['total'] / 1e3, .006)
chk('  owed to trust funds, $ trn', 7.85, T['intragov'] / 1e3, .006); chk('held by the public, $ trn', 32.54, T['held_by_public'] / 1e3, .006)
chk('marketable securities 30 Sep 2026, $ trn', 31.83, M['total'] / 1e3, .006); chk('bills, $ trn', 7.12, M['bills'] / 1e3, .006); chk('bills share of marketable, %', 22, M['bills'] / M['total'] * 100, .5)
P = D['curated']['GBR']['portfolio']; chk('UK uplifted nominal debt portfolio 30 Jun 2026, GBP bn', 2994, P['uplifted_nominal_gbp_bn'], .6); chk('  of which T-bills, GBP bn', 86.5, P['tbills'])
J = D['curated']['JPN']['holders']; chk('JGBs June 2026, trn yen', 1006.5, J['total_jgb']); chk('Japan GG gross debt end 2025, % of GDP', 204.8, dv('JPN', 'pct_gdp', 2025))
# --- holders
S = J['shares_pct']
for k, q in [('boj', 46.7), ('banks', 15.6), ('insurers', 15.1), ('foreigners', 7.9)]: chk(f'Japan holder share {k}, %', q, S[k] / 1 if S[k] else 0)
chk('Japan shares sum to 100', 100, sum(S.values()), .11)
for k, a in [('boj', 470.0), ('banks', 157.3), ('insurers', 152.1), ('foreigners', 79.9)]: chk(f'  Japan {k} amount / total, %', S[k], a / J['total_jgb'] * 100, .06)
Gb = D['curated']['GBR']['holders']; tot = Gb['total']
for k, q in [('overseas', 33.6), ('insurers_pension_funds', 20.2), ('bank_of_england_apf', 16.6)]: chk(f'UK holder share {k}, %', q, Gb[k] / tot * 100, .06)
chk('UK total gilts Q1 2026 (market value), GBP bn', 2198.7, tot / 1e3); chk('BoE APF Q2 2025, GBP bn', 427.1, Gb['boe_series']['Q2 2025'] / 1e3); chk('BoE APF Q1 2026, GBP bn', 365.9, Gb['boe_series']['Q1 2026'] / 1e3)
chk('US foreign share of federal debt Q1 2026, %', 23.9, H['foreign'] / H['total'] * 100); chk('US Fed share, %', 12.0, H['federal_reserve'] / H['total'] * 100); chk('US agencies and trusts share, %', 19.5, H['agencies_and_trusts'] / H['total'] * 100)
chk('US remainder share, %', 44.6, (H['total'] - H['foreign'] - H['federal_reserve'] - H['agencies_and_trusts']) / H['total'] * 100)
chk('Fed Treasuries 14 Oct 2026, $ bn', 4571, U['fed_treasury_holdings_usd_bn']['last'][1], .6)
tr = 'TREAST'; import csv
ts = [(r[0], float(r[1])) for r in csv.reader(open(pathlib.Path(__file__).parent / 'cache/TREAST.csv')) if r and r[0][:2] == '20' and r[1] not in ('', '.')]
pk = max(ts, key=lambda x: x[1]); chk('Fed Treasuries peak, $ bn (peak date ' + pk[0] + ')', 5771, pk[1] / 1e3 if pk[1] > 1e5 else pk[1], 1)
chk('  peak minus now, $ trn', 1.2, (pk[1] / 1e3 - U['fed_treasury_holdings_usd_bn']['last'][1]) / 1e3, .06)
It = D['curated']['ITA']['holders']['shares_pct']; chk('Italy Eurosystem, %', 19, It['eurosystem'], 0); chk('Italy non-residents net of ECB, %', 34, It['non_residents_net_of_ecb'], 0); chk('Italy banks+money funds, %', 20.3, It['banks_money_funds']); chk('Italy households/other residents, %', 14.6, It['households_other_residents']); chk('Italy shares sum', 100, sum(It.values()), .11)
# --- cost
chk('Treasury net interest FY2025, $ bn', 970, I['net_interest']['2025'], .6); chk('FY2026', 1052, I['net_interest']['2026'], .6)
chk('national defense FY2025', 917, I['national_defense']['2025'], .6); chk('national defense FY2026', 965, I['national_defense']['2026'], .6)
chk('FY2024 interest', 882, I['net_interest']['2024'], .6); chk('FY2024 defence', 874, I['national_defense']['2024'], .6); chk('FY2023 gap defence - interest', 162, I['national_defense']['2023'] - I['net_interest']['2023'], .6)
chk('interest share of federal outlays FY2026, %', 14.2, I['net_interest']['2026'] / I['outlays']['2026'] * 100); chk('interest share of receipts FY2026, %', 19.5, I['net_interest']['2026'] / I['receipts']['2026'] * 100)
chk('GG interest USA 2025, $ bn', 1247, iv('USA', 'usd_bn', 2025), .6); chk('  % of GDP', 4.04, iv('USA', 'pct_gdp', 2025), .006)
chk('BEA federal interest Q2 2026 SAAR, $ bn', 1280, [r for r in U['interest_definitions'] if 'national accounts' in r['what']][0]['usd_bn'], .6)
dd = {r['what']: r for r in U['defence_definitions']}
chk('BEA national defence Q2 2026, $ bn', 1190, dd['National defense, BEA']['usd_bn'], .6); chk('COFOG defence US 2024, $ bn (section 02 says 913)', 913, dd['Defence (COFOG GF02), general government']['usd_bn'], .6); chk('SIPRI US 2025, $ bn (section 02 says 954)', 954, dd['Military expenditure, SIPRI']['usd_bn'], .6)
vet = [0]
import json as _j
mts26 = {r['classification_desc']: float(r['current_fytd_rcpt_outly_amt']) for r in _j.load(open(pathlib.Path(__file__).parent / 'cache/mts9_2026.json'))['data'] if r['current_fytd_rcpt_outly_amt'] not in (None, 'null')}
chk('veterans benefits FY2026, $ bn', 416, mts26['Veterans Benefits and Services'] / 1e9, .6); chk('  defence + veterans, $ bn', 1381, (mts26['Veterans Benefits and Services'] + mts26['National Defense']) / 1e9, .6)
chk('average rate on marketable debt 30 Sep 2026, %', 3.518, U['avg_interest_rate_pct']['Total Marketable'], .0006)
chk('10-year US monthly average Sep 2026, %', 4.99, y('USA', '2026-09'), .006); chk('10-year US daily 15 Oct 2026, %', 5.10, D['us_daily_10y']['last'][1], .006)
# --- r minus g (IMF basis)
R = D['us_rg']; i21, i25 = R['years'].index(2021), R['years'].index(2025)
for lab, i, q in [('2021', i21, dict(d=125.0, r=2.13, g=11.1, ps=-10.1, pb=-9.2)), ('2025', i25, dict(d=124.4, r=3.25, g=5.04, ps=-2.1, pb=-3.9))]:
    chk(f'US {lab} debt % GDP', q['d'], R['d'][i]); chk(f'  implied r, %', q['r'], R['r'][i], .006); chk(f'  nominal g (USD GDP), %', q['g'], R['g'][i], .06)
    chk(f'  stabilising pb, % GDP', q['ps'], R['pstar'][i], .06); chk(f'  actual primary balance, % GDP', q['pb'], R['pb'][i], .06)
for r_, q in [(1, -3.6), (5, 1.2)]: chk(f'debt 124.4 %, g 4 %, r {r_} % -> pb*', q, 124.38 * (r_ - 4) / 100 / 1.04, .06)
# --- episodes
chk('Italy monthly 10y Nov 2011, %', 7.06, y('ITA', '2011-11'), .006); chk('  spread to Germany, pp', 5.18, y('ITA', '2011-11') - y('DEU', '2011-11'), .006)
chk('Spain Jul 2012, %', 6.80, y('ESP', '2012-07'), .006); chk('Greece Feb 2012, %', 29.24, y('GRC', '2012-02'), .006)
chk('Italy spread Sep 2012, pp', 3.76, y('ITA', '2012-09') - y('DEU', '2012-09'), .006); chk('Italy spread Dec 2014, pp', 1.40, y('ITA', '2014-12') - y('DEU', '2014-12'), .006)
for m, q in [('2022-08', 2.33), ('2022-09', 3.50), ('2022-10', 4.11)]: chk(f'UK 10y {m}, %', q, y('GBR', m), .006)
chk('UK 10y Sep 2026, %', 5.24, y('GBR', '2026-09'), .006)
for m, q in [('2025-04', 4.28), ('2025-05', 4.42), ('2025-06', 4.38)]: chk(f'US 10y {m}, %', q, y('USA', m), .006)
tp = D['term_premium_10y']['m']; chk('term premium Jul 2020, %', -0.61, tp[G.index('2020-07')], .006); chk('term premium Sep 2026, %', 0.96, tp[G.index('2026-09')], .006)
chk('US daily 10y high since 2019, %', 5.31, D['us_daily_10y']['high_since_2019'][1], .006)
for m, q in [('2019-08', -0.28), ('2020-12', 0.02), ('2024-12', 1.09), ('2025-12', 2.06), ('2026-09', 3.05), ('2005-01', 1.31)]: chk(f'Japan 10y {m}, %', q, y('JPN', m), .006)
chk('Japan 10y Sep 2026 is the series maximum', y('JPN', '2026-09'), max(v for v in Y['JPN']['y'] if v is not None), 0)
chk('Japan implied rate 2024, %', 0.72, iv('JPN', 'implied_rate_pct', 2024), .006); chk('Japan interest % GDP 2024', 1.5, iv('JPN', 'pct_gdp', 2024), .06)
chk('Japan 204.78 % x 3.05 % = % of GDP', 6.2, dv('JPN', 'pct_gdp', 2025) * 3.05 / 100, .06)
for m, c, q in [('2026-02', 'FRA', 3.35), ('2026-08', 'FRA', 4.03), ('2026-09', 'FRA', 4.48), ('2026-08', 'ITA', 3.99)]: chk(f'{c} 10y {m}, %', q, y(c, m), .006)
chk('France - Germany Sep 2026, pp', 1.01, y('FRA', '2026-09') - y('DEU', '2026-09'), .006); chk('France debt 2025, % GDP', 115.5, dv('FRA', 'pct_gdp', 2025), .06); chk('Italy debt 2025, % GDP', 137.1, dv('ITA', 'pct_gdp', 2025), .06)
chk('Italy minus France debt ratio, points (about 22)', 22, dv('ITA', 'pct_gdp', 2025) - dv('FRA', 'pct_gdp', 2025), .5)
chk('US average rate (3.518) vs 10y near 5: 10y Sep', 5, y('USA', '2026-09'), .5)

w = max(len(r[1]) for r in rows)
print(f"{'prose':>10} {'source':>10}   item")
for ok, lab, q, s, u in rows: print(f"{q:>10g} {s:>10.4g}   {'ok ' if ok else 'BAD'} {lab}")
print('\nDOCUMENT items (read on the page named; not recomputable here):')
for t in ["$125 bn / $58 / $42 / $25 bn offering, $96.3 bn maturing 15 Aug, $28.7 bn new cash: Treasury press release sb0590, 5 Aug 2026 (downloaded and read 19 Oct 2026)",
          "Germany plans about EUR 512.0 bn, of which EUR 176.0 bn money-market bills: Finanzagentur press release no. 10, 18 Dec 2025 (PDF read)",
          "UK 160 bp in a few days from about 1.2 %; over GBP 1 trn in LDI; at least GBP 50 bn vs GBP 12 bn a day; more than 100 bp fall on 28 Sep; 'Friday 23 September ... growth plan': Cunliffe letter 5 Oct 2022 (read)",
          "BoE 'on whatever scale is necessary', auctions until 14 October: BoE news 28 Sep 2022 (read); peak holdings GBP 19.3 bn (12.1 + 7.2): BoE APF 2022 Q4 (read)",
          "Greece: about 97 % of private bonds, about EUR 197 bn, 53.5 % cut of face value, about EUR 107 bn debt reduction: ESM page (read)",
          "Draghi quote 26 Jul 2012: ECB speech (read); OMT 6 Sep 2012, 'no ex ante quantitative limits': ECB press release (read)",
          "Moody's Aaa to Aa1 on 16 May 2025: Moody's page (read)",
          "Fed runoff stopped 1 Dec 2025: Fed policy-normalisation page (read)",
          "DMO 30-year syndication 8 Sep 2026, GBP 4.25 bn at 5.8168 %, orders above GBP 87 bn: AJ Bell (opened by the researchers, not re-read here)",
          "JGB 30y record 4.235 % on 5 Oct 2026: The Standard HK; 30y auction 8 Oct 2026 average 4.109 %: MoF auction page (both opened by the researchers, not re-read here)",
          "Assumed interest rate in Japan's FY2026 budget raised from 2.0 % to 3.0 %: Adnkronos/Jiji (page read here)",
          "SNIPPET (quoted 'as reported'): AGI 575 bp on 9 Nov 2011; France 10y above 5 % on 1-2 Oct 2026 for the first time since 2002 and EUR 54 bn consolidation (roic.ai); spread range 120 to more than 150 bp (roic.ai, Trading Economics); OECD sovereign bonds not quoted",
          "Japan holders (MoF June 2026) and Italy holders (OCPI, April 2026): PDF / page downloaded and read 19 Oct 2026; UK holders and portfolio: DMO PDF read"]: print(' -', t)
# tags used vs defined
import yaml
refs = {r['key'] for r in yaml.safe_load(open(ROOT / '_data/budget_article/refs.yml'))}
used = set(re.findall(r'bd-ref\.html k="([^"]+)"', POST))
print('\nTags used but not defined:', sorted(used - refs) or 'none'); print('Defined but unused:', sorted(refs - used) or 'none')
print('\n%d items checked, %d mismatches' % (len(rows), len(bad)))
for b in bad: print('  MISMATCH:', b)
sys.exit(1 if bad else 0)
