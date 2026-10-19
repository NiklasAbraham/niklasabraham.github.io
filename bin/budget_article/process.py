"""Merge the raw downloads into assets/budget-article/budget.json (the data of the explorer) and print checks.

Spending by function (COFOG, % of GDP): Eurostat for the 11 EU members here, OECD table 11 where it is
newer than the IMF (Korea, Australia), IMF GFS_COFOG otherwise (general government S13, central
government where S13 is missing). Headline fiscal series: IMF World Economic Outlook (April 2026).
Revenue and economic type of spending: IMF GFS Statement of Operations. Military: SIPRI via World Bank.
"""
import json
import pathlib
import re

import numpy as np
import pandas as pd

from cofog_meta import FUNCS, GROUPS, SUBS
from countries import COUNTRIES

HERE = pathlib.Path(__file__).resolve().parent
CACHE = HERE / "cache"
OUT = HERE.parents[1] / "assets" / "budget-article" / "budget.json"
OUT.parent.mkdir(parents=True, exist_ok=True)
Y0 = 2007
EU = {"DE": "DEU", "FR": "FRA", "IT": "ITA", "ES": "ESP", "NL": "NLD", "PL": "POL", "SE": "SWE", "DK": "DNK",
      "FI": "FIN", "IE": "IRL", "EL": "GRC"}
L1 = [f"GF{i:02d}" for i in range(1, 11)]


def canon(code):
    """IMF COFOG code -> Eurostat-style code (GF011 -> GF0101, GF0150 -> GF0105, GF1080 -> GF1008); None for level 3."""
    d = code[2:]
    if len(d) == 2:
        return code
    if len(d) == 3:
        return f"GF{d[:2]}0{d[2]}"
    if len(d) == 4 and d.endswith("0"):
        return f"GF{d[:2]}0{d[2]}"
    return None


# ------------------------------------------------------------------ COFOG, % of GDP
cof = {}      # iso -> year -> code -> value
src = {}      # iso -> year -> source label
sector = {}   # iso -> year -> S13 / central


def put(iso, y, code, v, s, sec="S13"):
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return
    cof.setdefault(iso, {}).setdefault(int(y), {})[code] = float(v)
    src.setdefault(iso, {})[int(y)] = s
    sector.setdefault(iso, {})[int(y)] = sec


for sec_code, label in (("S1311", "central"), ("S1321", "central"), ("S13", "S13")):  # later overrides earlier
    d = pd.read_csv(CACHE / f"cofog_{sec_code}.csv", usecols=["COUNTRY", "COFOG", "TYPE_OF_TRANSFORMATION", "TIME_PERIOD", "OBS_VALUE"], low_memory=False)
    d = d[(d.TYPE_OF_TRANSFORMATION == "POGDP_PT") & d.OBS_VALUE.notna() & (d.TIME_PERIOD >= Y0) & d.COFOG.notna()]
    tmp = {}
    for r in d.itertuples():
        c = canon(r.COFOG)
        if c:
            tmp.setdefault((r.COUNTRY, int(r.TIME_PERIOD)), {})[c] = r.OBS_VALUE
    for (iso, y), codes in tmp.items():
        if sum(k in codes for k in L1) == 10:      # only complete years replace what is there
            cof.setdefault(iso, {})[y] = codes
            src.setdefault(iso, {})[y] = "IMF GFS"
            sector.setdefault(iso, {})[y] = label

# OECD (national currency) -> % of GDP with the WEO GDP
weo = pd.read_csv(CACHE / "weo.csv", usecols=["COUNTRY", "INDICATOR", "TIME_PERIOD", "OBS_VALUE"], low_memory=False)
W = {(r.COUNTRY, r.INDICATOR, int(r.TIME_PERIOD)): r.OBS_VALUE for r in weo.itertuples() if not np.isnan(r.OBS_VALUE)}
o = pd.read_csv(CACHE / "oecd11.csv", usecols=["REF_AREA", "SECTOR", "TRANSACTION", "EXPENDITURE", "TIME_PERIOD", "OBS_VALUE", "CONSOLIDATION", "UNIT_MULT"], low_memory=False)
o = o[(o.SECTOR == "S13") & (o.TRANSACTION == "OTE") & (o.CONSOLIDATION == "P") & (o.EXPENDITURE != "_T") & (o.TIME_PERIOD >= Y0)]
for (iso, y), g in o.groupby(["REF_AREA", "TIME_PERIOD"]):
    if iso not in ("KOR", "AUS"):
        continue
    gdp = W.get((iso, "NGDP", int(y)))
    if not gdp:
        continue
    codes = {r.EXPENDITURE: r.OBS_VALUE * 10 ** r.UNIT_MULT / gdp * 100 for r in g.itertuples()}
    if sum(k in codes for k in L1) == 10 and int(y) >= max(cof.get(iso, {0: 0})):
        cof.setdefault(iso, {})[int(y)] = codes
        src.setdefault(iso, {})[int(y)] = "OECD"
        sector.setdefault(iso, {})[int(y)] = "S13"

# Eurostat (million EUR; shares and % of GDP are exact, the published PC_GDP is rounded to 0.1)
def eurostat(path):
    e = json.load(open(path))
    dims, sizes = e["id"], e["size"]
    idx = {k: list(e["dimension"][k]["category"]["index"]) for k in dims}
    for key, v in e["value"].items():
        k = int(key)
        pos = {}
        for dname, sz in zip(reversed(dims), reversed(sizes)):
            pos[dname] = idx[dname][k % sz]
            k //= sz
        yield EU[pos["geo"]], int(pos["time"]), pos.get("cofog99"), v


gdp_eur = {(iso, y): v for iso, y, _, v in eurostat(CACHE / "eurostat_gdp_eur.json")}
for iso, y, code, v in eurostat(CACHE / "eurostat_cofog.json"):
    if y >= Y0 and (iso, y) in gdp_eur:
        tmp = cof.setdefault(iso, {})
        if src.get(iso, {}).get(y) != "Eurostat":      # first Eurostat value of that year wipes the IMF year
            tmp[y] = {}
            src.setdefault(iso, {})[y] = "Eurostat"
            sector.setdefault(iso, {})[y] = "S13"
        tmp[y][code] = v / gdp_eur[(iso, y)] * 100

# keep complete years only, drop the 'TOTAL' key, and drop years later than the last Eurostat/IMF year with data
for iso in list(cof):
    cof[iso] = {y: c for y, c in cof[iso].items() if sum(k in c for k in L1) == 10 and y <= 2025}

# ------------------------------------------------------------------ fiscal headline (WEO)
WSER = {"rev": "GGR_NGDP", "exp": "GGX_NGDP", "bal": "GGXCNL_NGDP", "pbal": "GGXONLB_NGDP", "debt": "GGXWDG_NGDP",
        "gdp_usd": "NGDPD", "gdp_ppp": "PPPGDP", "pc_ppp": "PPPPC", "pc_usd": "NGDPDPC", "pop": "LP"}

# ------------------------------------------------------------------ Statement of Operations (revenue, economic type)
SOO_KEEP = ["G23", "G1", "G11", "G111", "G1111", "G1112", "G112", "G113", "G114", "G11411", "G1142", "G115", "G116", "G12", "G13", "G14",
            "G2M", "G2", "G21", "G22", "G24", "G25", "G26", "G27", "G28", "G31", "GNLB"]
soo = {}
for sec_code in ("S1311", "S1321", "S13"):   # S13 last so it wins
    d = pd.read_csv(CACHE / f"soo_{sec_code}.csv", usecols=["COUNTRY", "INDICATOR", "TYPE_OF_TRANSFORMATION", "TIME_PERIOD", "OBS_VALUE", "GFS_GRP"], low_memory=False)
    d = d[(d.TYPE_OF_TRANSFORMATION == "POGDP_PT") & d.OBS_VALUE.notna() & (d.TIME_PERIOD >= Y0)]
    d = d[d.INDICATOR.str[:-2].isin(SOO_KEEP) & d.INDICATOR.str.endswith("_T")]
    for r in d.itertuples():
        soo.setdefault(r.COUNTRY, {}).setdefault(int(r.TIME_PERIOD), {})[(r.INDICATOR[:-2], sec_code)] = r.OBS_VALUE

mil = {}
for ind, name in (("MS.MIL.XPND.GD.ZS", "mil_gdp"), ("MS.MIL.XPND.CD", "mil_usd")):
    j = json.load(open(CACHE / f"wb_{ind}.json"))[1]
    for r in j:
        if r["value"] is not None and r["countryiso3code"] in COUNTRIES:
            mil.setdefault(r["countryiso3code"], {}).setdefault(int(r["date"]), {})[name] = r["value"]

# ------------------------------------------------------------------ assemble
def r2(x, n=2):
    return None if x is None or (isinstance(x, float) and np.isnan(x)) else round(float(x), n)


out = {"built": "2026-10-19", "funcs": {k: {"name": v[0], "desc": v[1]} for k, v in FUNCS.items()}, "subs": SUBS,
       "groups": [{"id": g, "name": n, "fn": f} for g, n, f in GROUPS], "countries": {}}
for iso, (name, region) in COUNTRIES.items():
    c = {"name": name, "region": region}
    years = sorted(cof.get(iso, {}))
    c["cofog"] = {str(y): {k: r2(v, 3) for k, v in cof[iso][y].items() if k != "TOTAL" and re.fullmatch(r"GF\d{2}(\d{2})?", k)} for y in years}
    c["src"] = {str(y): src[iso][y] for y in years}
    c["sector"] = {str(y): sector[iso][y] for y in years}
    fy = list(range(2005, 2026))
    c["fiscal"] = {"years": fy}
    for k, ind in WSER.items():
        if k in ("gdp_usd", "gdp_ppp", "pc_ppp", "pc_usd", "pop"):
            c["fiscal"][k] = [r2(W.get((iso, ind, y)), 1 if k != "pop" else 0) for y in fy]
        else:
            c["fiscal"][k] = [r2(W.get((iso, ind, y)), 2) for y in fy]
    c["mil"] = {str(y): {k: r2(v, 3) for k, v in d.items()} for y, d in sorted(mil.get(iso, {}).items()) if y >= 2005}
    # SOO: per year, S13 first, then central
    s = soo.get(iso, {})
    c["soo"] = {}
    for y, d in sorted(s.items()):
        pick = {}
        for pref in ("S13", "S1321", "S1311"):
            for (ind, sec), v in d.items():
                if sec == pref and ind not in pick:
                    pick[ind] = (v, sec)
        if pick:
            secs = {v[1] for v in pick.values()}
            c["soo"][str(y)] = {"v": {k: r2(v[0], 3) for k, v in pick.items()}, "sec": sorted(secs)}
    c["econ"], c["rev"] = {}, {}
    for y, e in c["soo"].items():
        v = e["v"]
        g = lambda k: v.get(k)
        if g("G1") is not None and g("G11") is not None and g("G12") is not None:
            inc, gs = g("G111") or 0, g("G114") or 0
            c["rev"][y] = {"inc": r2(inc, 3), "gs": r2(gs, 3), "sc": r2(g("G12"), 3), "tax_o": r2(g("G11") - inc - gs, 3),
                           "oth": r2(g("G1") - g("G11") - g("G12"), 3), "tot": r2(g("G1"), 3), "sec": e["sec"]}
        if g("G2M") is not None and g("G2") is not None and g("G21") is not None:
            k = [g(x) or 0 for x in ("G21", "G22", "G24", "G25", "G26", "G27")]
            c["econ"][y] = {"wage": r2(k[0], 3), "goods": r2(k[1], 3), "int": r2(k[2], 3), "sub": r2(k[3], 3), "gr": r2(k[4], 3),
                            "ben": r2(k[5], 3), "inv": r2(g("G2M") - g("G2"), 3), "oth": r2(g("G2") - sum(k), 3), "tot": r2(g("G2M"), 3), "sec": e["sec"]}
    del c["soo"]
    out["countries"][iso] = c

json.dump(out, open(OUT, "w"), separators=(",", ":"))
print("wrote", OUT, OUT.stat().st_size // 1024, "KB")

# ------------------------------------------------------------------ checks
print(f"{'iso':4} {'latest':6} {'src':9} {'sector':8} {'sumL1':6} {'WEO exp':7} {'#yrs':4}  soo-yrs")
for iso in COUNTRIES:
    c = out["countries"][iso]
    ys = sorted(c["cofog"])
    if not ys:
        print(iso, "no COFOG", "; soo years", sorted(c["econ"])[-3:])
        continue
    ly = ys[-1]
    tot = sum(c["cofog"][ly][k] for k in L1)
    wexp = c["fiscal"]["exp"][c["fiscal"]["years"].index(int(ly))] if int(ly) in c["fiscal"]["years"] else None
    print(f"{iso:4} {ly:6} {c['src'][ly]:9} {c['sector'][ly]:8} {tot:6.1f} {wexp!s:7} {len(ys):4}  {sorted(c['econ'])[-1:]}")
