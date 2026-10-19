"""Download the public time series behind the AI-money long read from FRED (no key needed) into cache/.

FRED serves any series as csv at fredgraph.csv?id=...; all of these are public data from the Federal Reserve Bank of
St. Louis (ICE BofA indices are republished there with ICE's permission, OECD yields are from the OECD MEI).
Run from this folder: python3 fetch.py [--force]
"""
import subprocess, sys, pathlib
HERE = pathlib.Path(__file__).parent; CACHE = HERE / 'cache'; CACHE.mkdir(exist_ok=True)
FORCE = '--force' in sys.argv
DAILY = {  # name: (series id, first date)
    'DGS10': ('DGS10', '2019-01-01'), 'DGS30': ('DGS30', '2019-01-01'), 'DGS2': ('DGS2', '2019-01-01'),
    'IG_OAS': ('BAMLC0A0CM', '2019-01-01'), 'AAA_OAS': ('BAMLC0A1CAAA', '2019-01-01'), 'BBB_OAS': ('BAMLC0A4CBBB', '2019-01-01'),
    'HY_OAS': ('BAMLH0A0HYM2', '2019-01-01'), 'SOFR': ('SOFR', '2019-01-01'), 'NASDAQ': ('NASDAQCOM', '1990-01-01'), 'TP10': ('THREEFYTP10', '2019-01-01'),
}
MONTHLY = {'FEDFUNDS': ('FEDFUNDS', '2019-01-01')}
# OECD main economic indicators, long-term government bond yield (about 10 years), monthly, % per year
SOV = {'USA': 'US', 'DEU': 'DE', 'GBR': 'GB', 'JPN': 'JP', 'FRA': 'FR', 'ITA': 'IT', 'ESP': 'ES', 'NLD': 'NL', 'CAN': 'CA',
       'AUS': 'AU', 'KOR': 'KR', 'CHE': 'CH'}
jobs = {**DAILY, **MONTHLY, **{f'lt_{k}': (f'IRLTLT01{v}M156N', '2019-01-01') for k, v in SOV.items()}}
for name, (sid, start) in jobs.items():
    out = CACHE / f'{name}.csv'
    if out.exists() and out.stat().st_size > 200 and not FORCE:
        continue
    subprocess.run(['curl', '-s', '-m', '90', '-o', str(out), f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}&cosd={start}'], check=True)
    print(name, sid, len(out.read_text().splitlines()), 'rows')
