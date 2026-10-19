"""Download the raw data of the national-budget long read into cache/ (gitignored).

IMF api.imf.org (SDMX 3.0, CSV): GFS_COFOG, GFS_SOO, FM, WEO.  OECD (SDMX, CSV): table 11 (COFOG) for the
countries where the IMF series is stale.  World Bank API: military expenditure (SIPRI), population.
Uses curl; the large IMF queries take a minute or two.
"""
import pathlib
import subprocess
import sys

CACHE = pathlib.Path(__file__).resolve().parent / "cache"
CACHE.mkdir(exist_ok=True)
from countries import CODES  # noqa: E402

IMF = "https://api.imf.org/external/sdmx/3.0/data/dataflow"
CSV = "Accept: application/vnd.sdmx.data+csv;version=2.0.0"


def curl(url, out, header=CSV):
    p = CACHE / out
    if p.exists() and p.stat().st_size > 1000 and "--force" not in sys.argv:
        print("cached", out)
        return
    print("fetch", out)
    subprocess.run(["curl", "-sS", "--fail", "-m", "600", "-H", header, url, "-o", str(p)], check=True)


c = "+".join(CODES)
for s in ("S13", "S1321", "S1311"):
    curl(f"{IMF}/IMF.STA/GFS_COFOG/+/{c}.{s}.*.*.*.A?startPeriod=2005", f"cofog_{s}.csv")
    curl(f"{IMF}/IMF.STA/GFS_SOO/+/{c}.{s}.*.*.*.A?startPeriod=2005", f"soo_{s}.csv")
curl(f"{IMF}/IMF.FAD/FM/+/{c}.*.A?startPeriod=2005", "fm.csv")
curl(f"{IMF}/IMF.RES/WEO/+/{c}.*.A?startPeriod=2005", "weo.csv")
curl("https://sdmx.oecd.org/public/rest/data/OECD.SDD.NAD,DSD_NASEC10@DF_TABLE11,/A.KOR+AUS+MEX+USA+JPN+CAN+CHL+CRI+COL+ISR+TUR+GBR............?startPeriod=2012",
     "oecd11.csv", "Accept: application/vnd.sdmx.data+csv")
for ind in ("MS.MIL.XPND.GD.ZS", "MS.MIL.XPND.CD"):
    curl(f"https://api.worldbank.org/v2/country/all/indicator/{ind}?format=json&date=2005:2025&per_page=20000",
         f"wb_{ind}.json", "Accept: application/json")
EU = "DE+FR+IT+ES+NL+PL+SE+DK+FI+IE+EL"
curl(f"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_exp?format=JSON&lang=en&geo={EU.replace('+', '&geo=')}&unit=MIO_EUR&sector=S13&na_item=TE&sinceTimePeriod=2007",
     "eurostat_cofog.json", "Accept: application/json")
curl(f"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10a_exp?format=JSON&lang=en&geo={EU.replace('+', '&geo=')}&unit=MIO_EUR&sector=S13&na_item=TE&cofog99=TOTAL&sinceTimePeriod=2007",
     "eurostat_total_eur.json", "Accept: application/json")
curl(f"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10_gdp?format=JSON&lang=en&unit=CP_MEUR&na_item=B1GQ&{'&'.join('geo='+g for g in EU.split('+'))}&sinceTimePeriod=2007",
     "eurostat_gdp_eur.json", "Accept: application/json")
