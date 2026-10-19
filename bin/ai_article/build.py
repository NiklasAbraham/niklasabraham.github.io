"""Build assets/ai-article/ai.json for the AI-money long read from cache/ (fetch.py) and curated.py.
Run from this folder: python3 build.py"""
import csv, json, pathlib, datetime as dt
import curated as C
HERE = pathlib.Path(__file__).parent; CACHE = HERE / 'cache'
ROOT = HERE.parent.parent; OUT = ROOT / 'assets' / 'ai-article'; OUT.mkdir(parents=True, exist_ok=True)

def read(name):
    rows = list(csv.reader(open(CACHE / f'{name}.csv')))[1:]
    return [(d, float(v)) for d, v in rows if v not in ('', '.')]

def weekly(series, start='2019-01-01'):
    """last observation of each ISO week"""
    out = {}
    for d, v in series:
        if d < start: continue
        y, w, _ = dt.date.fromisoformat(d).isocalendar()
        out[(y, w)] = (d, v)
    return [out[k] for k in sorted(out)]

fred = {}
grid = sorted({d for n in ('DGS10', 'DGS30', 'DGS2') for d, _ in weekly(read(n))})
# one common weekly grid; every series is sampled at the last obs on or before the grid date
def on_grid(series):
    s = dict(series); keys = sorted(s); out = []; j = -1
    for g in grid:
        while j + 1 < len(keys) and keys[j + 1] <= g: j += 1
        out.append(round(s[keys[j]], 3) if j >= 0 and (dt.date.fromisoformat(g) - dt.date.fromisoformat(keys[j])).days < 8 else None)
    return out
for key in ('DGS10', 'DGS30', 'DGS2', 'IG_OAS', 'AAA_OAS', 'BBB_OAS', 'HY_OAS', 'TP10'):
    fred[key] = on_grid(read(key))
# the freshest day replaces the last grid point
last = {k: read(k)[-1] for k in ('DGS10', 'DGS30', 'DGS2', 'IG_OAS', 'BBB_OAS', 'HY_OAS', 'SOFR', 'TP10')}
ff = read('FEDFUNDS')
fedm = {d[:7]: v for d, v in ff}
fred['FEDFUNDS'] = [fedm.get(g[:7]) for g in grid]

# nasdaq: month-end close, and the last day
nas = read('NASDAQ'); me = {}
for d, v in nas: me[d[:7]] = (d, v)
nasdaq = {'m': [k + '-01' for k in sorted(me)], 'v': [round(me[k][1], 1) for k in sorted(me)], 'last': list(nas[-1]),
          'peak2000': max(((d, v) for d, v in nas if d < '2001'), key=lambda x: x[1]),
          'trough2002': min(((d, v) for d, v in nas if '2000-06' < d < '2004'), key=lambda x: x[1]),
          'peak2026': max(((d, v) for d, v in nas if d > '2025'), key=lambda x: x[1])}

# sovereigns
budget = json.load(open(ROOT / 'assets' / 'budget-article' / 'budget.json'))['countries']
NAMES = {'USA': 'United States', 'DEU': 'Germany', 'GBR': 'United Kingdom', 'JPN': 'Japan', 'FRA': 'France', 'ITA': 'Italy', 'ESP': 'Spain',
         'NLD': 'Netherlands', 'CAN': 'Canada', 'AUS': 'Australia', 'KOR': 'South Korea', 'CHE': 'Switzerland'}
sov = {}
for iso, name in NAMES.items():
    s = read(f'lt_{iso}')
    b = budget.get(iso, {}); econ = b.get('econ', {}); fy = sorted(econ)[-1] if econ else None
    fis = b.get('fiscal', {})
    sov[iso] = {'n': name, 'd': [d for d, _ in s], 'y': [round(v, 3) for _, v in s],
                'int': econ[fy].get('int') if fy else None, 'int_year': fy,
                'debt': fis['debt'][-1] if fis.get('debt') else None, 'debt_year': fis['years'][-1] if fis.get('years') else None}

import yaml
refs = {r['key']: r['short'] for r in yaml.safe_load(open(ROOT / '_data' / 'ai_article' / 'refs.yml'))}
data = {'refs': refs, 'built': dt.date.today().isoformat(), 'grid': grid, 'fred': fred, 'latest': {k: list(v) for k, v in last.items()}, 'nasdaq': nasdaq, 'sov': sov,
        'capex': C.CAPEX, 'labs': C.LABS, 'nodes': C.NODES, 'edges': C.EDGES, 'commit': C.COMMIT, 'curves': C.CURVES, 'ladder': C.LADDER,
        'deals': C.DEALS, 'events': C.EVENTS, 'cds': C.CDS}
(OUT / 'ai.json').write_text(json.dumps(data, separators=(',', ':'), ensure_ascii=False))
print('ai.json', (OUT / 'ai.json').stat().st_size // 1024, 'kB; grid', len(grid), grid[0], grid[-1])
print('latest', last)
print('nasdaq', nasdaq['peak2000'], nasdaq['trough2002'], nasdaq['peak2026'], nasdaq['last'])
for k, v in sov.items(): print(k, v['y'][-1], v['d'][-1], v['int'], v['int_year'], v['debt'])
