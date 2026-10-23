"""Build assets/budget-article/bonds.json from cache/ (run fetch.py first) and budget.json. Idempotent.

Everything downloaded is stamped with source and date; hand-curated reported numbers (JGB holders, gilt holders, ECB PSPP,
ratings actions) sit in CURATED with the page they were read from and a status tag (opened / primary / snippet).
"""
import csv, json, datetime as dt, pathlib, re
HERE = pathlib.Path(__file__).parent; C = HERE / 'cache'; ROOT = HERE.parents[2]
OUT = ROOT / 'assets' / 'budget-article' / 'bonds.json'
import importlib.util as iu
def load(name, path):
    sp = iu.spec_from_file_location(name, path); mod = iu.module_from_spec(sp); sp.loader.exec_module(mod); return mod
COUNTRIES = load('countries', HERE.parent / 'countries.py').COUNTRIES
ISO2 = load('bonds_fetch', HERE / 'fetch.py').ISO2   # importing does not download (main() is guarded)

def series(name):
    rows = list(csv.reader(open(C / f'{name}.csv')))[1:]
    return [(d, float(v)) for d, v in rows if v not in ('', '.')]
def m(name):   # monthly series -> dict 'YYYY-MM' : value
    return {d[:7]: v for d, v in series(name)}

budget = json.load(open(ROOT / 'assets' / 'budget-article' / 'budget.json'))['countries']
today = dt.date.today().isoformat()

# a. 10-year yields (OECD MEI via FRED), monthly from 2005-01
months = sorted({k for iso in ISO2 for k in m('lt_' + ISO2[iso])})
grid = [k for k in months if k >= '2005-01']
yields = {}
for iso, i2 in ISO2.items():
    s = m('lt_' + i2)
    last = max(s)
    yields[iso] = {'n': COUNTRIES[iso][0], 'src': f'OECD Main Economic Indicators, long-term government bond yield (about 10 years), FRED IRLTLT01{i2}M156N',
                   'y': [round(s[k], 3) if k in s else None for k in grid], 'last': [last + '-01', round(s[last], 3)]}
dg = series('DGS10')
us_daily = {'src': 'Federal Reserve H.15 via FRED DGS10 (daily, constant-maturity 10-year Treasury)', 'last': [dg[-1][0], dg[-1][1]],
            'high_since_2019': max(dg, key=lambda x: x[1]), 'low_since_2019': min(dg, key=lambda x: x[1])}
tp = m('TP10m'); tpl = max(tp)
extras = {'grid_note': 'monthly, first = %s, last = %s' % (grid[0], grid[-1]),
          'term_premium_10y': {'src': 'Kim-Wright 10-year term premium (FRED THREEFYTP10), monthly mean', 'm': [round(tp[k], 3) if k in tp else None for k in grid],
                               'last': [tpl + '-01', round(tp[tpl], 3)]},
          'fed_funds': {'src': 'Federal Reserve H.15 via FRED FEDFUNDS, monthly mean', 'm': [round(m('FEDFUNDS').get(k), 3) if k in m('FEDFUNDS') else None for k in grid]}}

# b/c. debt and interest bill in dollars, from budget.json (IMF WEO debt % GDP and GDP USD; interest % GDP from GFS economic classification)
debt, interest = {}, {}
for iso in COUNTRIES:
    f = budget[iso]['fiscal']; yrs = f['years']
    d = [None if p is None else round(p / 100 * g / 1e9, 1) for p, g in zip(f['debt'], f['gdp_usd'])]
    debt[iso] = {'years': yrs, 'pct_gdp': f['debt'], 'usd_bn': d, 'gdp_usd_bn': [round(g / 1e9, 1) for g in f['gdp_usd']],
                 'src': 'IMF World Economic Outlook (general-government gross debt, % of GDP; GDP in current US dollars), as in budget.json; the last year(s) are WEO estimates/projections'}
    e = budget[iso].get('econ', {})
    ys = sorted(e)
    if ys:
        iy, ip, iu, ir = [], [], [], []
        for y in ys:
            if 'int' not in e[y] or int(y) not in yrs: continue
            k = yrs.index(int(y)); p = e[y]['int']; g = f['gdp_usd'][k]
            iy.append(int(y)); ip.append(p); iu.append(round(p / 100 * g / 1e9, 1))
            ir.append(round(p / f['debt'][k] * 100, 2) if f['debt'][k] else None)   # interest / gross debt, both % GDP of the same year
        interest[iso] = {'years': iy, 'pct_gdp': ip, 'usd_bn': iu, 'implied_rate_pct': ir,
                         'src': 'IMF/Eurostat/OECD government finance statistics, interest in the economic classification of expenditure (general government), % of GDP x WEO GDP in USD; implied rate = interest / gross debt of the same year'}

# US detail (primary data)
def jl(n): return json.load(open(C / n))['data']
mspd = {(r['security_type_desc'], r['security_class_desc']): float(r['total_mil_amt']) for r in jl('mspd1.json') if r['record_date'] == jl('mspd1.json')[0]['record_date']}
mdate = jl('mspd1.json')[0]['record_date']
avg = {r['security_desc']: float(r['avg_interest_rate_amt']) for r in jl('avgint.json') if r['record_date'] == jl('avgint.json')[0]['record_date']}
dtp = jl('dttp.json')[0]
tic = [l.rstrip('\n').split('\t') for l in open(C / 'tic5.txt', errors='ignore')]
hdr = next(l for l in tic if l and l[0] == 'Country'); tic_month = hdr[1]
tic_h = {l[0]: float(l[1]) for l in tic if len(l) > 2 and l[0] != 'Country' and re.fullmatch(r'[\d.]+', l[1] or '')}
def last(n): s = series(n); return [s[-1][0], s[-1][1]]
us = {
    'marketable_stock_usd_bn': {'date': mdate, 'src': 'US Treasury FiscalData, Monthly Statement of the Public Debt table 1',
                                'total': round(mspd[('Total Marketable', '_')] / 1e3, 1),
                                'bills': round(mspd[('Marketable', 'Bills')] / 1e3, 1), 'notes': round(mspd[('Marketable', 'Notes')] / 1e3, 1),
                                'bonds': round(mspd[('Marketable', 'Bonds')] / 1e3, 1), 'tips': round(mspd[('Marketable', 'Treasury Inflation-Protected Securities')] / 1e3, 1),
                                'frn': round(mspd[('Marketable', 'Floating Rate Notes')] / 1e3, 1)},
    'total_public_debt_usd_bn': {'date': dtp['record_date'], 'src': 'US Treasury FiscalData, Debt to the Penny', 'total': round(float(dtp['tot_pub_debt_out_amt']) / 1e9, 1),
                                 'held_by_public': round(float(dtp['debt_held_public_amt']) / 1e9, 1), 'intragov': round(float(dtp['intragov_hold_amt']) / 1e9, 1)},
    'avg_interest_rate_pct': {'date': jl('avgint.json')[0]['record_date'], 'src': 'US Treasury FiscalData, Average Interest Rates on Treasury Securities', **{k: v for k, v in avg.items() if k in ('Treasury Bills', 'Treasury Notes', 'Treasury Bonds', 'Total Marketable', 'Total Interest-bearing Debt')}},
    'holders_quarterly_usd_bn': {'src': 'Federal Reserve Financial Accounts Z.1 via FRED (federal debt held by ...), quarterly; the date is the first day of the quarter, i.e. 2026-01-01 = Q1 2026; series end at different quarters', 'foreign': last('FDHBFIN'), 'federal_reserve': last('FDHBFRBN'),
                                 'agencies_and_trusts': [last('FDHBATN')[0], round(last('FDHBATN')[1] / 1e3, 1)], 'total_federal_debt': [last('GFDEBTN')[0], round(last('GFDEBTN')[1] / 1e3, 1)],
                                 'private_investors_incl_foreign': last('FDHBPIN'),
                                 'foreign_series': {'q': [d[:7] for d, _ in series('FDHBFIN')], 'v': [v for _, v in series('FDHBFIN')]},
                                 'fed_series': {'q': [d[:7] for d, _ in series('FDHBFRBN')], 'v': [v for _, v in series('FDHBFRBN')]}},
    'fed_treasury_holdings_usd_bn': {'src': 'Federal Reserve H.4.1 via FRED TREAST (Treasury securities held outright, Wednesday level)', 'last': [last('TREAST')[0], round(last('TREAST')[1] / 1e3, 1)]},
    'foreign_holders_tic_usd_bn': {'month': tic_month, 'src': 'US Treasury TIC, Major Foreign Holders of Treasury Securities (table 5; custodian basis)',
                                   'top': {k: tic_h[k] for k in ('Japan', 'United Kingdom', 'China, Mainland', 'Belgium', 'Canada', 'Cayman Islands', 'Luxembourg', 'France', 'Ireland', 'Taiwan', 'Switzerland', 'Singapore', 'Hong Kong', 'India', 'Norway', 'Brazil', 'Saudi Arabia', 'Korea, South')},
                                   'grand_total': tic_h['Grand Total'], 'foreign_official': tic_h['Of Which: Foreign Official']},
    'interest_outlays_usd_bn': {'src': 'Federal outlays for interest, fiscal year (FRED FYOINT, Treasury/OMB)', 'fy': [d[:4] for d, _ in series('FYOINT')], 'v': [round(v / 1e3, 1) for _, v in series('FYOINT')]},
}
mts = {}
for fy in ('2023', '2024', '2025', '2026'):
    for r in jl(f'mts9_{fy}.json'):
        if r['classification_desc'] in ('Net Interest', 'National Defense', 'Total'):
            mts.setdefault(r['classification_desc'], {})[fy] = round(float(r['current_fytd_rcpt_outly_amt']) / 1e9, 1)
# NB the 'Total' row of table 9 is receipts PLUS outlays (it is not total outlays): outlays = Total - receipts rows.
RECEIPT_ROWS = ('Individual Income Taxes', 'Corporation Income Taxes', 'Employment and General Retirement', 'Unemployment Insurance', 'Other Retirement', 'Excise Taxes', 'Estate and Gift Taxes', 'Customs Duties', 'Miscellaneous Receipts')
rcp, outl = {}, {}
for fy in ('2023', '2024', '2025', '2026'):
    rows = {r['classification_desc']: float(r['current_fytd_rcpt_outly_amt']) for r in jl(f'mts9_{fy}.json') if r['current_fytd_rcpt_outly_amt'] not in (None, 'null')}
    rcp[fy] = round(sum(rows[k] for k in RECEIPT_ROWS) / 1e9, 1); outl[fy] = round((rows['Total'] - sum(rows[k] for k in RECEIPT_ROWS)) / 1e9, 1)
us['interest_vs_defense_usd_bn'] = {'src': 'US Treasury FiscalData, Monthly Statement of the Treasury table 9 (outlays by function), fiscal year to 30 September (federal government, not general government)', 'net_interest': mts['Net Interest'], 'national_defense': mts['National Defense'],
                                    'receipts': rcp, 'outlays': outl, 'deficit': {k: round(outl[k] - rcp[k], 1) for k in outl}, 'note': "table 9 'Total' = receipts + outlays, so outlays are computed as Total minus the receipt rows"}
# US federal debt by holder, one common quarter (Z.1 via FRED); latest quarter for which all five series exist
def zq(n): return {d: v for d, v in series(n)}
_q = max(set(zq('FDHBFIN')) & set(zq('FDHBFRBN')) & set(zq('FDHBATN')) & set(zq('FDHBPIN')) & set(zq('GFDEBTN')))
us['holders_common_quarter_usd_bn'] = {'quarter_start': _q, 'src': 'Federal Reserve Financial Accounts Z.1 via FRED (FDHBFIN, FDHBFRBN, FDHBATN, FDHBPIN, GFDEBTN), federal debt by holder; the date is the first day of the quarter (2026-01-01 = Q1 2026); groups overlap, so the residual is total minus the three named groups',
                                       'total': round(zq('GFDEBTN')[_q] / 1e3, 1), 'foreign': zq('FDHBFIN')[_q], 'federal_reserve': round(zq('FDHBFRBN')[_q], 1), 'agencies_and_trusts': round(zq('FDHBATN')[_q] / 1e3, 1), 'private_incl_foreign': zq('FDHBPIN')[_q]}
# Five US debt numbers and five US interest numbers, each with scope and date (nothing here is a validation of one by another)
bea_i, bea_d = series('A091RC1Q027SBEA'), series('FDEFX')
_cu = budget['USA']; _gd = _cu['fiscal']['gdp_usd'][_cu['fiscal']['years'].index(2024)]
us['debt_definitions'] = [
    {'what': 'IMF WEO general-government gross debt', 'scope': 'reported by the IMF as general government; its exact coverage relative to federal debt (intragovernmental holdings, states and localities) is not verified here', 'date': 'end of 2025', 'usd_bn': debt['USA']['usd_bn'][-1], 'pct_gdp': debt['USA']['pct_gdp'][-1], 'src': 'IMF WEO, country data of 28-29 Sep 2026'},
    {'what': 'Federal debt, Financial Accounts Z.1', 'scope': 'federal government, all securities', 'date': 'Q1 2026', 'usd_bn': us['holders_common_quarter_usd_bn']['total'], 'src': 'Federal Reserve Z.1 via FRED GFDEBTN'},
    {'what': 'Total public debt outstanding', 'scope': 'federal government, including debt owed to its own trust funds', 'date': '15 Oct 2026', 'usd_bn': us['total_public_debt_usd_bn']['total'], 'src': 'Treasury, Debt to the Penny'},
    {'what': 'Debt held by the public', 'scope': 'federal government, excluding intragovernmental holdings', 'date': '15 Oct 2026', 'usd_bn': us['total_public_debt_usd_bn']['held_by_public'], 'src': 'Treasury, Debt to the Penny'},
    {'what': 'Marketable securities', 'scope': 'federal government, tradable bills, notes, bonds, TIPS, FRNs', 'date': '30 Sep 2026', 'usd_bn': us['marketable_stock_usd_bn']['total'], 'src': 'Treasury, MSPD table 1'}]
us['interest_definitions'] = [
    {'what': 'General-government interest (economic classification)', 'scope': 'all levels of government, gross of interest received', 'date': 'calendar 2025', 'usd_bn': interest['USA']['usd_bn'][-1], 'src': 'IMF GFS / budget.json'},
    {'what': 'Treasury net interest', 'scope': 'federal, net of interest received, MTS table 9', 'date': 'fiscal 2025 (to 30 Sep 2025)', 'usd_bn': us['interest_vs_defense_usd_bn']['net_interest']['2025'], 'src': 'Treasury MTS'},
    {'what': 'Treasury net interest', 'scope': 'federal, net of interest received, MTS table 9', 'date': 'fiscal 2026 (to 30 Sep 2026)', 'usd_bn': us['interest_vs_defense_usd_bn']['net_interest']['2026'], 'src': 'Treasury MTS'},
    {'what': 'Federal interest payments, national accounts', 'scope': 'federal, BEA current expenditure, seasonally adjusted annual rate', 'date': bea_i[-1][0] + ' (quarter start; Q2 2026)', 'usd_bn': round(bea_i[-1][1], 1), 'src': 'BEA via FRED A091RC1Q027SBEA'}]
_mil = {int(k): v for k, v in _cu['mil'].items()}; _my = max(k for k, v in _mil.items() if v.get('mil_usd'))
us['defence_definitions'] = [
    {'what': 'National defense, Treasury MTS', 'scope': 'federal, fiscal year', 'date': 'fiscal 2026', 'usd_bn': us['interest_vs_defense_usd_bn']['national_defense']['2026']},
    {'what': 'National defense, BEA', 'scope': 'federal, national accounts, SAAR', 'date': 'Q2 2026', 'usd_bn': round(bea_d[-1][1], 1), 'src': 'BEA via FRED FDEFX'},
    {'what': 'Defence (COFOG GF02), general government', 'scope': 'all levels, calendar year, % of GDP x GDP', 'date': '2024', 'usd_bn': round(_cu['cofog']['2024']['GF02'] / 100 * _gd / 1e9, 1) if '2024' in _cu['cofog'] else round(_cu['cofog'][2024]['GF02'] / 100 * _gd / 1e9, 1), 'src': 'IMF GFS COFOG / budget.json'},
    {'what': 'Military expenditure, SIPRI', 'scope': 'SIPRI definition, all levels of government', 'date': '2025', 'usd_bn': round(_mil[_my]['mil_usd'] / 1e9, 1), 'src': 'SIPRI via World Bank'}]

# r-minus-g inputs for the United States on one basis (IMF WEO / GFS, general government): d = gross debt % GDP, r = interest / gross debt (implied rate),
# g = growth of nominal GDP in current US dollars, pb = IMF primary balance % GDP; pstar = d (r - g) / (1 + g), the debt-stabilising primary balance (section 03 recursion)
_D, _I, _F = debt['USA'], interest['USA'], budget['USA']['fiscal']
us_rg = {'src': 'IMF WEO, country data of 28-29 Sep 2026 (debt, GDP in USD, primary balance) and general-government interest from the GFS economic classification, as in budget.json; r = interest / gross debt of the same year; g = nominal GDP growth in USD; pstar = d (r - g) / (1 + g)',
         'years': [], 'd': [], 'r': [], 'g': [], 'pb': [], 'pstar': []}
for y in range(2019, 2026):
    k = _D['years'].index(y); kk = _I['years'].index(y)
    d_ = _D['pct_gdp'][k]; r_ = _I['implied_rate_pct'][kk]; g_ = (_D['gdp_usd_bn'][k] / _D['gdp_usd_bn'][k - 1] - 1) * 100; pb_ = _F['pbal'][_F['years'].index(y)]
    us_rg['years'].append(y); us_rg['d'].append(round(d_, 2)); us_rg['r'].append(round(r_, 2)); us_rg['g'].append(round(g_, 2)); us_rg['pb'].append(round(pb_, 2)); us_rg['pstar'].append(round(d_ * (r_ - g_) / 100 / (1 + g_ / 100), 2))

# CURATED: reported numbers not in a downloaded series. status: opened = page/PDF read; primary = official release.
CURATED = {
    'JPN': {'holders': {'date': '2026-06', 'src': 'Ministry of Finance Japan, Breakdown by JGB and T-Bill holders (June 2026, preliminary), from Bank of Japan Flow of Funds, 17 Sep 2026',
                        'url': 'https://www.mof.go.jp/english/policy/jgbs/reference/Others/holdings01.pdf', 'status': 'opened', 'unit': 'trillion yen',
                        'total_jgb': 1006.5, 'boj': 470.0, 'banks': 157.3, 'insurers': 152.1, 'foreigners': 79.9, 'public_pensions': 76.6, 'pension_funds': 32.2, 'households': 21.9, 'general_government': 3.7, 'others': 12.7,
                        'shares_pct': {'boj': 46.7, 'banks': 15.6, 'insurers': 15.1, 'foreigners': 7.9, 'public_pensions': 7.6, 'pension_funds': 3.2, 'households': 2.2, 'general_government': 0.4, 'others': 1.3}}},
    'GBR': {'holders': {'date': '2026-Q1', 'src': 'UK DMO Quarterly Review April-June 2026 (gilt holdings table from ONS, market values)', 'url': 'https://dmo.gov.uk/media/r2ejghpr/apr-jun-2026a.pdf', 'status': 'opened', 'unit': 'GBP million',
                        'total': 2198691, 'insurers_pension_funds': 443425, 'overseas': 739088, 'bank_of_england_apf': 365868, 'other_financial': 408269, 'monetary_financial_institutions': 238111, 'households': 2952, 'local_authorities': 978,
                        'shares_pct': {'insurers_pension_funds': 20.2, 'overseas': 33.6, 'bank_of_england_apf': 16.6, 'other_financial': 18.6, 'monetary_financial_institutions': 10.8, 'households': 0.1},
                        'overseas_series': {'Q2 2025': 696258, 'Q3 2025': 709279, 'Q4 2025': 737355, 'Q1 2026': 739088}, 'boe_series': {'Q2 2025': 427066, 'Q3 2025': 393760, 'Q4 2025': 398664, 'Q1 2026': 365868}},
            'portfolio': {'date': '2026-06-30', 'src': 'UK DMO Quarterly Review April-June 2026', 'status': 'opened', 'uplifted_nominal_gbp_bn': 2994.45, 'conventional': 2216.02, 'index_linked': 691.93, 'tbills': 86.5,
                          'avg_maturity_years': 13.06, 'gilt_avg_maturity_years': 13.44}},
    'ITA': {'holders': {'date': '2026-04', 'src': "Osservatorio CPI (Universita Cattolica), La composizione dei detentori del debito pubblico italiano, from Banca d'Italia data published 15 Jul 2026 (holders as of April 2026)",
                        'url': 'https://osservatoriocpi.unicatt.it/ocpi-pubblicazioni-la-composizione-dei-detentori-del-debito-pubblico-italiano-un-aggiornamento', 'status': 'opened', 'unit': 'share of general-government debt, percent',
                        'shares_pct': {'eurosystem': 19.0, 'non_residents_net_of_ecb': 34.0, 'banks_money_funds': 20.3, 'other_financial': 12.1, 'households_other_residents': 14.6}},
            'holders_bdi_june': {'date': '2026-06 (non-resident share: 2026-05)', 'src': "Banca d'Italia data as reported by Il Sole 24 Ore (June 2026)", 'url': 'https://en.ilsole24ore.com/art/bank-of-italy-debt-hits-new-record-in-june-breaking-through-the-3200-billion-mark-AJRW1Om',
                        'status': 'snippet', 'unit': 'EUR billion', 'general_government_debt': 3207.2, 'bank_of_italy': 537.0, 'bank_of_italy_share_pct': 16.7, 'non_residents_share_pct': 35.9}},
    'EUR': {'pspp': {'date': '2026-10-09', 'src': 'ECB, Asset purchase programmes (PSPP holdings, amortised cost)', 'url': 'https://www.ecb.europa.eu/mopo/implement/app/html/index.en.html', 'status': 'opened', 'eur_mn': 1646178}},
    'USA_ratings': [
        {'agency': "S&P", 'date': '2011-08-05', 'action': 'AAA to AA+ (first US downgrade by S&P)', 'status': 'snippet'},
        {'agency': 'Fitch', 'date': '2023-08-01', 'action': 'AAA to AA+', 'status': 'snippet'},
        {'agency': "Moody's", 'date': '2025-05-16', 'action': 'Aaa to Aa1, outlook negative to stable', 'url': 'https://www.moodys.com/web/en/us/about-us/usrating.html', 'status': 'opened'}],
}
out = {'built': today, 'note': 'Open-data coverage: 10-year yields for 22 of the 33 countries; US/JP/UK holder splits only (G7 holder data are scattered); ratings only for the US (verified). No open series for BRA UKR RUS TUR SAU ARE CHN IND IDN THA SGP yields.',
       'grid': grid, 'yields': yields, 'us_daily_10y': us_daily, **extras, 'debt': debt, 'interest': interest, 'us': us, 'curated': CURATED, 'us_rg': us_rg,
       'missing_yields': [c for c in COUNTRIES if c not in ISO2]}
OUT.write_text(json.dumps(out, separators=(',', ':'), ensure_ascii=False))
print('bonds.json', OUT.stat().st_size // 1024, 'kB; yields for', len(yields), 'countries; grid', grid[0], grid[-1])
