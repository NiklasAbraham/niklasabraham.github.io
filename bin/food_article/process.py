#!/usr/bin/env python3
"""Build the data of the food article from the FAOSTAT files in cache/.

    python3 bin/food_article/process.py

Reads QCL (production) and FBS (food balance sheets) straight from the zips (never unzipped, nothing large is
pickled: the disk is tight) and cache/tm.pkl (tm_extract.py). Writes assets/food-article/{food,trade,diet}.json.

Choices (all repeated in the post):
- headline year 2023 (2024 is FAO's first estimate for most countries); the time machine runs 1961-2024.
- 'China' is FAO's China, mainland; Hong Kong, Macao and Taiwan Province stay separate.
- a flow exporter -> importer in tonnes is what the importer reports; where the importer reports nothing for that
  pair, what the exporter reports (the mirror).
"""
import json, pathlib, sys, zipfile
import numpy as np
import pandas as pd

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from commodities import COMMS, GROUPS, DERIVED  # noqa: E402

CACHE = HERE / "cache"
OUT = HERE.parents[1] / "assets" / "food-article"
OUT.mkdir(parents=True, exist_ok=True)
YEAR = 2023
NE = pathlib.Path.home() / "code/ConceptsPlots/900_data/maps/ne_50m_admin_0_countries.geojson"
SHORT = {
    "Russian Federation": "Russia", "United States of America": "United States",
    "United Kingdom of Great Britain and Northern Ireland": "United Kingdom", "Iran (Islamic Republic of)": "Iran",
    "Viet Nam": "Vietnam", "Republic of Korea": "South Korea", "Democratic People's Republic of Korea": "North Korea",
    "Bolivia (Plurinational State of)": "Bolivia", "Venezuela (Bolivarian Republic of)": "Venezuela",
    "Netherlands (Kingdom of the)": "Netherlands", "China, mainland": "China", "China, Hong Kong SAR": "Hong Kong",
    "China, Macao SAR": "Macao", "China, Taiwan Province of": "Taiwan", "United Republic of Tanzania": "Tanzania",
    "Syrian Arab Republic": "Syria", "Lao People's Democratic Republic": "Laos", "Republic of Moldova": "Moldova",
    "Democratic Republic of the Congo": "DR Congo", "Micronesia (Federated States of)": "Micronesia",
    "Brunei Darussalam": "Brunei", "Cabo Verde": "Cape Verde", "Czechia": "Czechia", "Türkiye": "Turkey",
    "Eswatini": "Eswatini", "Saint Vincent and the Grenadines": "St Vincent and the Grenadines",
    "Saint Kitts and Nevis": "St Kitts and Nevis", "Saint Lucia": "St Lucia", "North Macedonia": "North Macedonia",
}
AREA_AGG = 5000  # FAO codes >= 5000 are regions and groups
SERIES_FROM = {"tea": 1991}
FORMER = {"USSR", "Yugoslav SFR", "Czechoslovakia", "Ethiopia PDR", "Sudan (former)", "Belgium-Luxembourg", "Serbia and Montenegro"}


def short(n):
    return SHORT.get(n, n)


def m49(s):
    return str(s).strip("'").lstrip("0") or "0"


ne = {}
for f in json.load(open(NE))["features"]:
    p = f["properties"]
    code = p["ISO_N3"] if p["ISO_N3"] != "-99" else p["ISO_N3_EH"]
    ne[code.lstrip("0")] = dict(region=p["REGION_UN"], sub=p["SUBREGION"], iso=p["ADM0_A3"])
ne["250"] = dict(region="Europe", sub="Western Europe", iso="FRA")
ne["578"] = dict(region="Europe", sub="Northern Europe", iso="NOR")

# ---------------------------------------------------------------- production
zq = zipfile.ZipFile(CACHE / "Production_Crops_Livestock_E_All_Data_(Normalized).zip")
q = pd.read_csv(zq.open("Production_Crops_Livestock_E_All_Data_(Normalized).csv"), encoding="utf-8", low_memory=False,
                usecols=["Area Code", "Area Code (M49)", "Area", "Item Code", "Element", "Year", "Unit", "Value", "Flag"])
# hen eggs are published in tonnes and in 1000 pieces; several EU members (France, Poland, Romania ...) only in pieces.
# For those, tonnes = pieces x the world mean mass per piece of that year (what FAO uses for its own aggregate).
EGG = 1062
eg = q[(q["Item Code"] == EGG) & (q.Element == "Production")]
egt = eg[eg.Unit == "t"].set_index(["Area Code", "Year"]).Value
egn = eg[eg.Unit == "1000 No"].set_index(["Area Code", "Year"])
wt = eg[(eg["Area Code"] == 5000)].pivot_table(index="Year", columns="Unit", values="Value")
ratio = (wt["t"] / wt["1000 No"]).to_dict()
fill = egn[~egn.index.isin(egt.index)].copy()
fill["Value"] = [v * ratio[y] for (_, y), v in fill.Value.items()]
fill["Unit"] = "t"
q = q[(q.Element == "Production") & (q.Unit == "t") | (q.Element == "Area harvested") & (q.Unit == "ha")]
q = pd.concat([q, fill.reset_index()[q.columns]], ignore_index=True)
ALLPROD = {c for k in COMMS for c in k["prod"]}
q = q[q["Item Code"].isin(ALLPROD)]
q["m"] = q["Area Code (M49)"].map(m49)
world = q[q["Area Code"] == AREA_AGG]
cty = q[q["Area Code"] < AREA_AGG]
cty = cty[cty["Area Code"] != 351]  # FAO 'China' = mainland + HK + Macao + Taiwan, which are listed on their own
names = cty[["m", "Area", "Area Code"]].drop_duplicates().set_index("m")
years = list(range(1961, 2025))
code2comm = {}
for k in COMMS:
    for c in k["prod"]:
        code2comm[c] = k["id"]
cty = cty.assign(comm=cty["Item Code"].map(code2comm))
world = world.assign(comm=world["Item Code"].map(code2comm))

prod = {}   # comm -> {m49: [t, ha]} for YEAR
series = {}  # comm -> {key: [values by year]}
worldser = {}
countries = {}
for k in COMMS:
    cid = k["id"]
    sub = cty[cty.comm == cid]
    p = sub[sub.Element == "Production"].groupby(["m", "Year"]).Value.sum().unstack(fill_value=np.nan)
    a = sub[sub.Element == "Area harvested"].groupby(["m", "Year"]).Value.sum().unstack(fill_value=np.nan)
    w = world[(world.comm == cid) & (world.Element == "Production")].groupby("Year").Value.sum().reindex(years)
    if cid in SERIES_FROM:  # FAO switched tea from made tea to green leaf in 1991: no comparable series before
        w = w.where(w.index >= SERIES_FROM[cid])
    worldser[cid] = [None if np.isnan(v) else round(float(v)) for v in w.values]
    d = {}
    for m in p.index:
        v = p.loc[m].get(YEAR, np.nan)
        if np.isnan(v) or v <= 0:
            continue
        ha = a.loc[m].get(YEAR, np.nan) if m in a.index else np.nan
        d[m] = [round(float(v)), None if np.isnan(ha) or ha <= 0 else round(float(ha))]
    prod[cid] = d
    top = sorted(d, key=lambda m: -d[m][0])[:12]
    ser = {}
    for m in top:
        s_ = p.loc[m].reindex(years)
        if cid in SERIES_FROM:
            s_ = s_.where(s_.index >= SERIES_FROM[cid])
        ser[m] = [None if np.isnan(x) else round(float(x)) for x in s_.values]
    # former entities that carried real output before 1992
    for m in p.index:
        nm = names.loc[m, "Area"]
        if isinstance(nm, pd.Series):
            nm = nm.iloc[0]
        if nm in FORMER:
            arr = p.loc[m].reindex(years)
            if arr.max() > 0 and arr.max() > 0.04 * np.nanmax(np.array(worldser[cid], dtype=float)):
                ser[m] = [None if np.isnan(x) else round(float(x)) for x in arr.values]
    series[cid] = ser
    for m in d:
        countries.setdefault(m, True)
    for m in ser:
        countries.setdefault(m, True)

# ---------------------------------------------------------------- food balance sheets
zf = zipfile.ZipFile(CACHE / "FoodBalanceSheets_E_All_Data_(Normalized).zip")
fb = pd.read_csv(zf.open("FoodBalanceSheets_E_All_Data_(Normalized).csv"), encoding="utf-8", low_memory=False,
                 usecols=["Area Code", "Area Code (M49)", "Area", "Item Code", "Item", "Element Code", "Year", "Value"])
fb = fb[(fb.Year >= YEAR - 4) & (fb["Area Code"] < AREA_AGG) & (fb["Area Code"] != 351)]
fb["m"] = fb["Area Code (M49)"].map(m49)
# FAO has not yet published 2023 for every country (Japan, Mali, Chad, Sudan, Cuba ...): use each country's latest year since 2019
ymax = fb[(fb["Element Code"] == 664) & (fb["Item Code"] == 2901) & fb.Value.notna()].groupby("m").Year.max()
fb = fb[fb.Year == fb.m.map(ymax)]
fnames = fb[["m", "Area"]].drop_duplicates().set_index("m").Area
PLATE = [  # id, label, FBS item codes (summed), colour
    ("cereals", "Cereals", [2905], "#C0841A"),
    ("roots", "Roots and tubers", [2907], "#8A6A3B"),
    ("sugar", "Sugar and sweeteners", [2909], "#6A47C2"),
    ("pulses", "Pulses", [2911], "#6B8E23"),
    ("nutsoil", "Nuts and oil seeds", [2912, 2913], "#A0522D"),
    ("vegoil", "Vegetable oils", [2914], "#138374"),
    ("veg", "Vegetables", [2918], "#2E9E4F"),
    ("fruit", "Fruit", [2919], "#D9462B"),
    ("meat", "Meat and offal", [2943, 2945], "#B4552F"),
    ("dairy", "Milk and cream", [2948], "#3D8FD0"),
    ("eggs", "Eggs", [2949], "#E3A21A"),
    ("fish", "Fish and seafood", [2960, 2961], "#0B7C9E"),
    ("fats", "Animal fats", [2946], "#7A6A5A"),
    ("alc", "Alcoholic drinks", [2924], "#9A6AA0"),
    ("other", "Everything else", [], "#8A9099"),
]
E_KCAL, E_POP, E_PROT, E_FAT, E_PROD, E_IMP, E_EXP, E_DOM = 664, 511, 674, 684, 5511, 5611, 5911, 5301


def fv(el, items):
    s = fb[(fb["Element Code"] == el) & fb["Item Code"].isin(items)]
    return s.groupby("m").Value.sum()


pop = fv(E_POP, [2501]) * 1000
tot_kcal = fv(E_KCAL, [2901])
diet = {}
plate = {pid: fv(E_KCAL, its) for pid, _, its, _ in PLATE if its}
prot = fv(E_PROT, [2901])
fat = fv(E_FAT, [2901])
prot_an = fv(E_PROT, [2941])
cer_imp, cer_prod, cer_dom, cer_exp = (fv(E_IMP, [2905]), fv(E_PROD, [2905]), fv(E_DOM, [2905]), fv(E_EXP, [2905]))
for m in tot_kcal.index:
    if m not in pop.index or tot_kcal[m] <= 0:
        continue
    row = {pid: round(float(plate[pid].get(m, 0)), 1) for pid in plate}
    row["other"] = round(max(0.0, float(tot_kcal[m]) - sum(row.values())), 1)
    dm = float(cer_dom.get(m, 0))
    diet[m] = dict(pop=round(float(pop[m])), kcal=round(float(tot_kcal[m])), prot=round(float(prot.get(m, 0)), 1),
                   fat=round(float(fat.get(m, 0)), 1), animal=round(float(prot_an.get(m, 0)) / max(float(prot.get(m, 1)), 1e-9), 3),
                   plate=row,
                   cer=dict(prod=round(float(cer_prod.get(m, 0))), imp=round(float(cer_imp.get(m, 0))), exp=round(float(cer_exp.get(m, 0))),
                            dom=round(dm)))
    countries.setdefault(m, True)
wpop = float(sum(v["pop"] for v in diet.values()))
wplate = {pid: round(sum(v["plate"][pid] * v["pop"] for v in diet.values()) / wpop, 1) for pid, _, _, _ in PLATE}
wkcal = round(sum(v["kcal"] * v["pop"] for v in diet.values()) / wpop, 1)
item_kcal = fb[(fb["Element Code"] == E_KCAL) & (fb["Item Code"] < 2900)]  # leaf items; 29xx are the groups
item_names = fb[["Item Code", "Item"]].drop_duplicates().set_index("Item Code").Item
piv = item_kcal.pivot_table(index="m", columns="Item Code", values="Value", aggfunc="sum")
piv = piv.loc[[m for m in piv.index if m in diet]]
wi = (piv.mul(pd.Series({m: diet[m]["pop"] for m in piv.index}), axis=0).sum() / sum(diet[m]["pop"] for m in piv.index)).sort_values(ascending=False)
items = [[int(c), str(item_names[c]), round(float(v), 1)] for c, v in wi.items() if v >= 4]
for m in diet:
    diet[m]["y"] = int(ymax[m])

# what happens to a crop: share of domestic supply that is eaten, fed, processed, sown, lost or used otherwise
USE_ITEMS = [(2511, "Wheat"), (2807, "Rice"), (2514, "Maize"), (2513, "Barley"), (2518, "Sorghum"), (2531, "Potatoes"), (2532, "Cassava"),
             (2555, "Soya beans"), (2558, "Rapeseed and mustard"), (2557, "Sunflower seed"), (2542, "Sugar (raw equivalent)"),
             (2571, "Soya bean oil"), (2577, "Palm oil"), (2574, "Rapeseed oil"), (2573, "Sunflower oil")]
E_USE = dict(food=5142, feed=5521, proc=5131, seed=5527, loss=5123, other=5154)
use = []
for code, label in USE_ITEMS:
    s = fb[fb["Item Code"] == code]
    dom = float(s[s["Element Code"] == E_DOM].Value.sum())
    row = {k: float(s[s["Element Code"] == e].Value.sum()) for k, e in E_USE.items()}
    row["resid"] = dom - sum(row.values())
    use.append(dict(id=code, n=label, dom=round(dom * 1000), **{k: round(v * 1000) for k, v in row.items()}))

# ---------------------------------------------------------------- trade
tm = pd.read_pickle(CACHE / "tm.pkl")
tm = tm.rename(columns={"Year": "y"})
for c in ["imp_t", "exp_t", "imp_v", "exp_v"]:
    if c not in tm:
        tm[c] = np.nan
tm["rep"] = tm.rep.map(m49)
tm["par"] = tm.par.map(m49)


def flows(df):
    """exporter, importer, comm, y -> tonnes, value (1000 USD) with the mirror rule."""
    imp = df[df.imp_t.notna() | df.imp_v.notna()].rename(columns={"rep": "imp", "par": "exp"})[["exp", "imp", "comm", "y", "imp_t", "imp_v"]]
    exp = df[df.exp_t.notna() | df.exp_v.notna()].rename(columns={"rep": "exp", "par": "imp"})[["exp", "imp", "comm", "y", "exp_t", "exp_v"]]
    m = imp.merge(exp, on=["exp", "imp", "comm", "y"], how="outer")
    m["t"] = m.imp_t.fillna(m.exp_t)
    m["v"] = m.imp_v.fillna(m.exp_v)
    return m[["exp", "imp", "comm", "y", "t", "v"]]


fl = flows(tm)
fl = fl[(fl.exp != fl.imp)]
f23 = fl[fl.y == YEAR]
trade = {}
for k in COMMS:
    if not k["trade"]:
        continue
    s = f23[f23.comm == k["id"]].dropna(subset=["t"])
    s = s[s.t > 0].sort_values("t", ascending=False)
    if s.empty:
        continue
    tot = float(s.t.sum())
    keep = s.head(220)
    ex = s.groupby("exp").t.sum()
    im = s.groupby("imp").t.sum()
    exv = s.groupby("exp").v.sum()
    imv = s.groupby("imp").v.sum()
    trade[k["id"]] = dict(
        total=round(tot), value=round(float(s.v.sum())),
        flows=[[r.exp, r.imp, round(float(r.t)), None if np.isnan(r.v) else round(float(r.v))] for r in keep.itertuples()],
        covered=round(float(keep.t.sum() / tot), 3),
        exp={m: [round(float(x)), None if np.isnan(exv.get(m, np.nan)) else round(float(exv[m]))] for m, x in ex.items() if x > 0},
        imp={m: [round(float(x)), None if np.isnan(imv.get(m, np.nan)) else round(float(imv[m]))] for m, x in im.items() if x > 0},
    )
# world traded tonnes per year (same mirror rule) for the share-of-output-traded view
tyears = list(range(1986, 2024))
wtrade = {}
for k in COMMS:
    if not k["trade"] or not k["cmp"]:
        continue
    s = fl[(fl.comm == k["id"])].dropna(subset=["t"]).groupby("y").t.sum()
    wtrade[k["id"]] = [None if y not in s.index else round(float(s[y])) for y in tyears]

# ---------------------------------------------------------------- write
cl = {}
for m in countries:
    nm = names.loc[m, "Area"] if m in names.index else fnames.get(m, m)
    if isinstance(nm, pd.Series):
        nm = nm.iloc[0]
    info = ne.get(m, {})
    cl[m] = dict(n=short(nm), r=info.get("region") or "", s=info.get("sub") or "", f=int(nm in FORMER))
json.dump(dict(year=YEAR, years=years, groups=[dict(id=i, n=n, c=c) for i, n, c in GROUPS],
               comms=[dict(id=k["id"], n=k["label"], g=k["group"], cmp=int(k["cmp"]), tr=int(bool(k["trade"])), d=int(k["id"] in DERIVED)) for k in COMMS],
               countries=cl, prod=prod, series=series, world=worldser, tyears=tyears, wtrade=wtrade),
          open(OUT / "food.json", "w"), separators=(",", ":"))
json.dump(dict(year=YEAR, trade=trade), open(OUT / "trade.json", "w"), separators=(",", ":"))
json.dump(dict(year=YEAR, plate=[dict(id=i, n=n, c=c) for i, n, _, c in PLATE], world=dict(kcal=wkcal, plate=wplate, pop=round(wpop), items=items), use=use, c=diet),
          open(OUT / "diet.json", "w"), separators=(",", ":"))
for f in ["food", "trade", "diet"]:
    print(f, (OUT / f"{f}.json").stat().st_size // 1024, "KB")
print("countries", len(cl), "world kcal/cap/day", wkcal, "pop", round(wpop / 1e9, 2), "bn")
