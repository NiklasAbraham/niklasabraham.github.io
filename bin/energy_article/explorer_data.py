#!/usr/bin/env python3
"""Hourly data per year for the interactive explorer (assets/js/energy-explorer.js).

    python3 bin/energy_article/explorer_data.py

assets/energy-article/explorer/YYYY.json: {"t0": first hour (unix s), "keys": [...], "d": {key: [...]}}
Generation and load in units of 100 MW (integers), price in EUR/MWh with one decimal.
"""
import json

import numpy as np

from style import ROOT, load

OUTD = ROOT / "assets" / "energy-article" / "explorer"
KEYS = ["nuclear", "lignite", "hardcoal", "gas", "oil", "other", "biomass", "hydro", "pumped", "wind_off", "wind_on",
        "solar", "import", "load", "price"]


def main():
    h = load()
    h["oil"] = h["oil"].fillna(0)
    h["import"] = h["trade"].clip(lower=0)
    OUTD.mkdir(parents=True, exist_ok=True)
    for y in range(2015, 2027):
        d = h.loc[str(y)]
        out = {"t0": int(d.index[0].timestamp()), "keys": KEYS, "d": {}}
        for k in KEYS:
            v = d[k].values if k in d else np.zeros(len(d))
            if k == "price":
                out["d"][k] = [None if np.isnan(x) else round(float(x), 1) for x in v]
            else:
                out["d"][k] = [0 if np.isnan(x) else int(round(max(x, 0) / 100)) for x in v]
        f = OUTD / f"{y}.json"
        f.write_text(json.dumps(out, separators=(",", ":")))
        print(f.name, f"{f.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
