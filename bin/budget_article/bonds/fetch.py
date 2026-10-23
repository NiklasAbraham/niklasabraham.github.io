"""Download the open series behind the government-bond section into cache/ (idempotent; --force re-downloads).

FRED (no key): OECD MEI 10-year yields IRLTLT01xxM156N (monthly, 2005-), Fed funds, ACM-type term premium (Kim-Wright
THREEFYTP10, monthly mean), US Financial Accounts holders of federal debt, federal interest outlays.
US Treasury: FiscalData API (debt to the penny, MSPD marketable stock by type, average interest rates), TIC table 5.
Run from this folder: python3 fetch.py [--force]
"""
import subprocess, sys, pathlib
HERE = pathlib.Path(__file__).parent; CACHE = HERE / 'cache'; CACHE.mkdir(exist_ok=True)
FORCE = '--force' in sys.argv  # also read when imported by process.py
ISO2 = {'USA': 'US', 'CAN': 'CA', 'MEX': 'MX', 'GBR': 'GB', 'DEU': 'DE', 'FRA': 'FR', 'ITA': 'IT', 'ESP': 'ES', 'NLD': 'NL', 'POL': 'PL',
        'SWE': 'SE', 'NOR': 'NO', 'DNK': 'DK', 'FIN': 'FI', 'IRL': 'IE', 'GRC': 'GR', 'CHE': 'CH', 'ISR': 'IL', 'ZAF': 'ZA',
        'JPN': 'JP', 'KOR': 'KR', 'AUS': 'AU'}   # no open FRED/OECD 10y series for BRA UKR RUS TUR SAU ARE CHN IND IDN THA SGP
FRED = {f'lt_{v}': f'IRLTLT01{v}M156N' for v in ISO2.values()}
FRED.update({'FEDFUNDS': 'FEDFUNDS', 'FDHBFIN': 'FDHBFIN', 'FDHBFRBN': 'FDHBFRBN', 'FDHBATN': 'FDHBATN', 'FDHBPIN': 'FDHBPIN',
             'GFDEBTN': 'GFDEBTN', 'FYOINT': 'FYOINT', 'MTSDS133FMS': 'MTSDS133FMS',
             'A091RC1Q027SBEA': 'A091RC1Q027SBEA', 'FDEFX': 'FDEFX'})   # BEA federal interest payments and national defence, SAAR, quarterly
FA = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service'
OTHER = {
    'TP10m.csv': 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=THREEFYTP10&cosd=2005-01-01&fq=Monthly&fam=avg',
    'tic5.txt': 'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt',
    'dttp.json': f'{FA}/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=1',
    'mspd1.json': f'{FA}/v1/debt/mspd/mspd_table_1?sort=-record_date&page%5Bsize%5D=12',
    'avgint.json': f'{FA}/v2/accounting/od/avg_interest_rates?sort=-record_date&page%5Bsize%5D=40',
}
for fy in ('2023', '2024', '2025', '2026'):   # Monthly Treasury Statement table 9 (outlays by function), September = full fiscal year
    OTHER[f'mts9_{fy}.json'] = (f'{FA}/v1/accounting/mts/mts_table_9?filter=record_date:eq:{fy}-09-30&page%5Bsize%5D=100'
                                '&fields=record_date,classification_desc,current_fytd_rcpt_outly_amt,prior_fytd_rcpt_outly_amt')
def get(name, url):
    out = CACHE / name
    if out.exists() and out.stat().st_size > 200 and not FORCE:
        return
    for _ in range(3):
        subprocess.run(['curl', '-s', '-m', '90', '-o', str(out), url], check=True)
        if out.stat().st_size > 200 and not out.read_bytes()[:20].lstrip().startswith(b'<'):
            print(name, out.stat().st_size, 'B'); return
    out.unlink(missing_ok=True); print('FAILED', name)
def main():
    for n, sid in FRED.items():
        get(f'{n}.csv', f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}&cosd=2005-01-01')
    for n, u in OTHER.items():
        get(n, u)
    # daily 10y Treasury (latest value): reuse the AI post's cache when present
    ai = HERE.parent.parent / 'ai_article' / 'cache' / 'DGS10.csv'
    if ai.exists(): (CACHE / 'DGS10.csv').write_bytes(ai.read_bytes())
    else: get('DGS10.csv', 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10&cosd=2019-01-01')

if __name__ == '__main__':
    main()
