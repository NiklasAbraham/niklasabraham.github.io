#!/usr/bin/env python3
"""Download the raw data for the German electricity long read from the Energy-Charts API
(Fraunhofer ISE, api.energy-charts.info; data CC BY 4.0, sources ENTSO-E, EEX, SMARD, TSOs).
Everything is cached as JSON in bin/energy_article/cache/ (gitignored); rerunning only fetches
what is missing.

    python3 bin/energy_article/fetch.py

public_power   DE net public generation per source, load, residual load, 15 min, per year 2015 .. 2026-10-16
total_power    DE incl. industrial self-supply, per year 2025
price          day-ahead DE-LU (from 2018-10) and DE-AT-LU (before), per year; neighbour zones 2025
cbpf / cbet    physical flows and scheduled trades with each neighbour, per year 2015 .. 2025
installed      installed capacity, yearly and monthly
frequency      grid frequency, 1 s, a few sample days
"""
import json
import pathlib
import sys
import time
import subprocess

API = "https://api.energy-charts.info"
CACHE = pathlib.Path(__file__).resolve().parent / "cache"
CACHE.mkdir(exist_ok=True)


def get(path, name, **params):
    f = CACHE / f"{name}.json"
    if f.exists() and f.stat().st_size > 50:
        return json.loads(f.read_text())
    q = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{API}/{path}?{q}"
    for attempt in range(6):
        try:
            # curl, not urllib: urllib stalls ~50 s per request on this host
            out = subprocess.run(["curl", "-s", "-4", "-m", "180", url], capture_output=True, check=True).stdout
            d = json.loads(out)
            f.write_text(json.dumps(d))
            print("ok", name, flush=True)
            time.sleep(4.0)
            return d
        except Exception as e:  # noqa: BLE001
            print("retry", name, e, flush=True)
            time.sleep(10 * (attempt + 1))
    print("FAILED", name, url, flush=True)
    return None


def months(y0, m0, y1, m1):
    y, m = y0, m0
    while (y, m) <= (y1, m1):
        ny, nm = (y + 1, 1) if m == 12 else (y, m + 1)
        yield y, m, f"{y}-{m:02d}-01", f"{ny}-{nm:02d}-01"
        y, m = ny, nm


def main():
    # whole years per request: month-by-month requests run into the API's rate limit
    get("installed_power", "installed_yearly", country="de", time_step="yearly")
    get("installed_power", "installed_monthly", country="de", time_step="monthly")
    get("installed_power", "installed_yearly_net", country="de", time_step="yearly", installation_decommission="true")
    for y in range(2015, 2027):
        end = "2026-10-16" if y == 2026 else f"{y}-12-31"
        get("public_power", f"pp_{y}", country="de", start=f"{y}-01-01", end=end)
        if y < 2018:
            get("price", f"price_{y}", bzn="DE-AT-LU", start=f"{y}-01-01", end=end)
        elif y == 2018:
            get("price", "price_2018a", bzn="DE-AT-LU", start="2018-01-01", end="2018-09-30")
            get("price", "price_2018b", bzn="DE-LU", start="2018-10-01", end="2018-12-31")
        else:
            get("price", f"price_{y}", bzn="DE-LU", start=f"{y}-01-01", end=end)
    for y in range(2015, 2027):
        end = "2026-10-16" if y == 2026 else f"{y}-12-31"
        get("cbpf", f"cbpf_{y}", country="de", start=f"{y}-01-01", end=end)
        get("cbet", f"cbet_{y}", country="de", start=f"{y}-01-01", end=end)
    get("total_power", "tp_2025", country="de", start="2025-01-01", end="2025-12-31")
    for z in ["FR", "NL", "BE", "AT", "CH", "CZ", "PL", "DK1", "DK2", "SE4", "SE3", "NO2", "IT-North", "HU", "SI",
              "ES", "PT", "FI", "EE", "LT", "LV", "SK", "RO", "BG", "HR", "GR", "SE1", "SE2", "NO1", "NO3", "NO4", "NO5"]:
        get("price", f"price_zone_{z}_2025", bzn=z, start="2025-01-01", end="2025-12-31")
    for d in ["2025-06-15", "2025-01-15"]:
        get("frequency", f"freq_{d}", region="DE-Freiburg", start=d, end=d)


if __name__ == "__main__":
    main()
