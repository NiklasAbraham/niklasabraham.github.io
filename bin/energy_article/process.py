#!/usr/bin/env python3
"""Turn the Energy-Charts cache (fetch.py) into one tidy table per resolution.

    python3 bin/energy_article/process.py

cache/q15.pkl     15-minute table, Europe/Berlin, 2015-01-01 .. 2026-10-16: one column per source (MW),
                  load, residual load, net trade (+ = import), price (EUR/MWh; hourly prices are repeated
                  over their four quarter hours before Oct 2025)
cache/hourly.pkl  hourly means of the same
Columns are renamed to short keys (SRC below). Energy in MWh = MW x 0.25 per quarter hour.
"""
import json
import pathlib

import numpy as np
import pandas as pd

HERE = pathlib.Path(__file__).resolve().parent
CACHE = HERE / "cache"
TZ = "Europe/Berlin"

SRC = {
    "Nuclear": "nuclear", "Fossil brown coal / lignite": "lignite", "Fossil hard coal": "hardcoal",
    "Fossil gas": "gas", "Fossil oil": "oil", "Fossil coal-derived gas": "coalgas", "Others": "other",
    "Waste": "waste", "Biomass": "biomass", "Hydro Run-of-River": "hydro", "Hydro water reservoir": "reservoir",
    "Hydro pumped storage": "pumped", "Hydro pumped storage consumption": "pumped_in", "Geothermal": "geothermal",
    "Wind offshore": "wind_off", "Wind onshore": "wind_on", "Solar": "solar",
    "Cross border electricity trading": "trade", "Load": "load", "Residual load": "residual",
    "Renewable share of load": "ren_share_load", "Renewable share of generation": "ren_share_gen",
}


def public_power():
    frames = []
    for y in range(2015, 2027):
        f = CACHE / f"pp_{y}.json"
        if not f.exists():
            print("missing", f.name)
            continue
        d = json.loads(f.read_text())
        idx = pd.to_datetime(d["unix_seconds"], unit="s", utc=True)
        cols = {SRC[p["name"]]: pd.to_numeric(pd.Series(p["data"], index=idx), errors="coerce")
                for p in d["production_types"] if p["name"] in SRC}
        frames.append(pd.DataFrame(cols))
    df = pd.concat(frames).sort_index()
    df = df[~df.index.duplicated()]
    return df


def prices():
    parts = []
    for f in sorted(CACHE.glob("price_20*.json")):
        d = json.loads(f.read_text())
        s = pd.Series(d["price"], index=pd.to_datetime(d["unix_seconds"], unit="s", utc=True), dtype=float)
        parts.append(s)
    s = pd.concat(parts).sort_index()
    return s[~s.index.duplicated()]


def main():
    pp = public_power()
    pr = prices()
    # put prices on the 15-minute grid: an hourly price holds for its four quarter hours
    pr15 = pr.reindex(pp.index, method="ffill", limit=3)
    pp["price"] = pr15
    pp.index = pp.index.tz_convert(TZ)
    pp.to_pickle(CACHE / "q15.pkl")
    h = pp.resample("1h").mean()
    h.to_pickle(CACHE / "hourly.pkl")
    print("q15", pp.shape, pp.index[0], pp.index[-1])
    print("hourly", h.shape)
    print(h.groupby(h.index.year)[["load", "solar", "wind_on", "price"]].mean().round(1))


if __name__ == "__main__":
    main()
