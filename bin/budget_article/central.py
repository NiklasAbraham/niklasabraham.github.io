#!/usr/bin/env python3
"""Central-government COFOG (IMF GFS_COFOG, sector S1311 / S1321) per country, latest year with all ten divisions,
merged into assets/budget-article/budget.json as country['central'] = {y, sec, cof: {GF01..GF10 in % of GDP}}; sec is the IMF sector: S1311 budgetary central government (excludes social-security funds) or S1321 central government incl. social-security funds, used only where S1311 is missing (US, Korea).
The main series of the article is general government (all levels); this is what the headline 'federal budget' corresponds to.

    python3 central.py
"""
import json, pathlib
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "budget-article" / "budget.json"
L1 = [f"GF{k:02d}" for k in range(1, 11)]
b = json.load(open(OUT))
got = {}
for f in ("cofog_S1311.csv", "cofog_S1321.csv"):
    d = pd.read_csv(pathlib.Path(__file__).parent / "cache" / f, low_memory=False, usecols=["COUNTRY", "TIME_PERIOD", "OBS_VALUE", "COFOG", "TYPE_OF_TRANSFORMATION"])
    d = d[(d.TYPE_OF_TRANSFORMATION == "POGDP_PT") & d.OBS_VALUE.notna() & d.COFOG.isin(L1)]
    for iso, g in d.groupby("COUNTRY"):
        if iso not in b["countries"] or iso in got:
            continue
        n = g.groupby("TIME_PERIOD").COFOG.nunique()
        ys = n[n >= 9].index
        if not len(ys):
            continue
        y = int(ys.max()); t = g[g.TIME_PERIOD == y]
        got[iso] = dict(y=y, sec=("S1311" if f.endswith("S1311.csv") else "S1321"), cof={r.COFOG: round(float(r.OBS_VALUE), 3) for r in t.itertuples()})
for iso, c in b["countries"].items():
    c.pop("central", None)
    if iso in got:
        c["central"] = got[iso]
json.dump(b, open(OUT, "w"), separators=(",", ":"))
print(len(got), "countries with central-government COFOG;", sorted(set(b["countries"]) - set(got)), "without")
