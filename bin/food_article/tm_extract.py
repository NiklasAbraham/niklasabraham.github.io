#!/usr/bin/env python3
"""Stream the FAOSTAT detailed trade matrix (8.5 GB csv inside the zip, never unzipped) and keep only the
commodities of commodities.py. Output cache/tm.pkl: one row per reporter, partner, commodity, year with
import and export tonnes and value (1000 USD) as the reporter and as the partner states them.

    python3 bin/food_article/tm_extract.py        # ~10-20 min
"""
import pathlib, sys, zipfile, time
import pandas as pd
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from commodities import COMMS

CACHE = pathlib.Path(__file__).resolve().parent / "cache"
Z = CACHE / "Trade_DetailedTradeMatrix_E_All_Data_(Normalized).zip"
CODE2COMM = {}
for c in COMMS:
    for t in c["trade"]:
        CODE2COMM[t] = c["id"]
ELEM = {5610: ("imp_t", "t"), 5910: ("exp_t", "t"), 5622: ("imp_v", None), 5922: ("exp_v", None)}
zf = zipfile.ZipFile(Z)
name = "Trade_DetailedTradeMatrix_E_All_Data_(Normalized).csv"
parts, n, t0 = [], 0, time.time()
usecols = ["Reporter Country Code", "Reporter Country Code (M49)", "Partner Country Code", "Partner Country Code (M49)",
           "Item Code", "Element Code", "Year", "Unit", "Value"]
with zf.open(name) as f:
    for ch in pd.read_csv(f, encoding="utf-8", usecols=usecols, chunksize=3_000_000, dtype={"Reporter Country Code (M49)": str, "Partner Country Code (M49)": str}):
        n += len(ch)
        ch = ch[ch["Element Code"].isin(ELEM) & ch["Item Code"].isin(CODE2COMM)]
        ch = ch[(ch["Element Code"].isin([5610, 5910]) & (ch.Unit == "t")) | ch["Element Code"].isin([5622, 5922])]
        ch = ch.assign(comm=ch["Item Code"].map(CODE2COMM), el=ch["Element Code"].map(lambda e: ELEM[e][0]))
        ch = ch.rename(columns={"Reporter Country Code (M49)": "rep", "Partner Country Code (M49)": "par"})
        parts.append(ch[["rep", "par", "comm", "Year", "el", "Value"]])
        print(f"{n/1e6:.0f}M rows, kept {sum(len(p) for p in parts)/1e6:.2f}M, {time.time()-t0:.0f}s", flush=True)
d = pd.concat(parts)
d["rep"] = d.rep.str.strip("'")
d["par"] = d.par.str.strip("'")
d = d.groupby(["rep", "par", "comm", "Year", "el"], as_index=False).Value.sum()
d = d.pivot_table(index=["rep", "par", "comm", "Year"], columns="el", values="Value", aggfunc="sum").reset_index()
d.to_pickle(CACHE / "tm.pkl")
print(d.shape, d.Year.min(), d.Year.max())
