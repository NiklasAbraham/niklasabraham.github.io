"""Turn the cached EIA/FRED series into assets/oil-article/oil.json, the one data file the figures read.

Prices: daily spot (EIA via FRED), products converted from $/gal to $/bbl (42 gal). Derived:
  crack321_usg = (2 * gasoline_usg + 1 * ulsd_usg) / 3 - wti      (US Gulf Coast 3-2-1 against WTI, $/bbl)
  crack321_nyh = (2 * gasoline_nyh + 1 * ulsd_nyh) / 3 - brent    (New York Harbor 3-2-1 against Brent, $/bbl)
  diesel_brent = ulsd_nyh - brent, gasoline_brent = gas_nyh - brent, jet_wti = jet_usg - wti
  brent_wti    = brent - wti (spot, Cushing vs Dated Brent)
Daily data are kept from 2025-01-01 (the war year in full), weekly means before that back to 1986.
Run from this folder after fetch.py:  python3 build.py
"""
import json, pathlib
import pandas as pd
from curated import CURATED

HERE = pathlib.Path(__file__).parent; CACHE = HERE / 'cache'
OUT = HERE.parents[1] / 'assets' / 'oil-article' / 'oil.json'
GAL = 42.0


def fred(name):
    s = pd.read_csv(CACHE / f'{name}.csv', na_values=['.'])
    s.columns = ['date', name]
    s['date'] = pd.to_datetime(s['date'])
    return s.set_index('date')[name].astype(float)


def eia(name):
    x = pd.read_excel(CACHE / f'{name}.xls', sheet_name='Data 1', skiprows=2)
    x.columns = ['date', name]
    return x.set_index(pd.to_datetime(x['date']))[name].astype(float)


px = pd.concat(sort=True, objs=[fred(n) for n in ['wti', 'brent', 'gas_nyh', 'gas_usg', 'ulsd_nyh', 'ulsd_usg', 'jet_usg', 'ho_nyh']], axis=1)
for c in ['gas_nyh', 'gas_usg', 'ulsd_nyh', 'ulsd_usg', 'jet_usg', 'ho_nyh']:
    px[c] = px[c] * GAL
# heating oil stands in for diesel in New York before ULSD was quoted (2006)
px['dist_nyh'] = px['ulsd_nyh'].fillna(px['ho_nyh'])
px['crack321_usg'] = (2 * px['gas_usg'] + px['ulsd_usg']) / 3 - px['wti']
px['crack321_nyw'] = (2 * px['gas_nyh'] + px['ulsd_nyh']) / 3 - px['wti']   # the reel's 3-2-1: New York Harbor products against WTI
px['diesel_wti'] = px['ulsd_nyh'] - px['wti']
px['crack321_nyh'] = (2 * px['gas_nyh'] + px['dist_nyh']) / 3 - px['brent']
px['diesel_brent'] = px['dist_nyh'] - px['brent']
px['gasoline_brent'] = px['gas_nyh'] - px['brent']
px['jet_wti'] = px['jet_usg'] - px['wti']
px['brent_wti'] = px['brent'] - px['wti']
cols = ['wti', 'brent', 'gas_nyh', 'gas_usg', 'dist_nyh', 'ulsd_usg', 'jet_usg', 'crack321_usg', 'crack321_nyw', 'crack321_nyh', 'diesel_wti',
        'diesel_brent', 'gasoline_brent', 'jet_wti', 'brent_wti']
px = px[cols]


def pack(df, fmt):
    df = df.dropna(how='all')
    return {'t': [d.strftime(fmt) for d in df.index], **{c: [None if pd.isna(v) else round(float(v), 2) for v in df[c]] for c in df.columns}}


weekly = px[px.index < '2025-01-01'].resample('W-FRI').mean()
daily = px[px.index >= '2025-01-01'].dropna(how='all')
monthly = px.resample('MS').mean()

wk = pd.concat(sort=True, objs=[eia(n) for n in ['cushing', 'us_crude_stocks', 'spr', 'distillate_stocks', 'gasoline_stocks',
                                 'refinery_util', 'crude_exports', 'crude_prod']], axis=1)
wk = wk[wk.index >= '2004-01-01']
retail = pd.concat([eia('retail_gas'), eia('retail_diesel')], axis=1)
retail = retail[retail.index >= '2000-01-01']

data = {
    'meta': {'built': pd.Timestamp.now().strftime('%Y-%m-%d'), 'last_price': daily.index[-1].strftime('%Y-%m-%d'),
             'last_weekly': wk.dropna(how='all').index[-1].strftime('%Y-%m-%d'),
             'units': 'crude and products $/bbl; stocks thousand barrels; flows thousand b/d; utilisation %; retail $/gal'},
    'weekly': pack(weekly, '%Y-%m-%d'),
    'daily': pack(daily, '%Y-%m-%d'),
    'monthly': pack(monthly, '%Y-%m'),
    'stocks': pack(wk.resample('W-FRI').last(), '%Y-%m-%d'),
    'retail': pack(retail.resample('W-MON').last(), '%Y-%m-%d'),
    'curated': CURATED,
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, separators=(',', ':')))
print(OUT, round(OUT.stat().st_size / 1024), 'kB')
m = monthly[monthly.index >= '2025-06-01'][['brent', 'wti', 'crack321_nyw', 'crack321_usg', 'crack321_nyh', 'diesel_brent', 'gasoline_brent', 'brent_wti']]
print(m.round(1).to_string())
print('max monthly crack321_nyw', monthly['crack321_nyw'].idxmax(), round(monthly['crack321_nyw'].max(), 2))
print('top 5 months crack321_usg', monthly['crack321_usg'].nlargest(5).round(1).to_dict())
