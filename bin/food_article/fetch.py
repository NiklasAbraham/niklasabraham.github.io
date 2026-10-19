#!/usr/bin/env python3
"""Download the three FAOSTAT bulk files behind the food long read into cache/ (gitignored).

    python3 bin/food_article/fetch.py [--force]

QCL  Production: Crops and livestock products   (34 MB zip, 545 MB csv)
TM   Trade: Detailed trade matrix                (421 MB zip, 8.5 GB csv: never unzipped, tm_extract.py streams it)
FBS  Food balances 2010-                          (55 MB zip, 633 MB csv)
FAOSTAT data are CC BY 4.0 (https://www.fao.org/contact-us/terms/db-terms-of-use/en/).
"""
import pathlib, subprocess, sys

CACHE = pathlib.Path(__file__).resolve().parent / "cache"
BASE = "https://bulks-faostat.fao.org/production/"
FILES = [
    "Production_Crops_Livestock_E_All_Data_(Normalized).zip",
    "Trade_DetailedTradeMatrix_E_All_Data_(Normalized).zip",
    "FoodBalanceSheets_E_All_Data_(Normalized).zip",
]
CACHE.mkdir(exist_ok=True)
for f in FILES:
    dest = CACHE / f
    if dest.exists() and dest.stat().st_size > 1e6 and "--force" not in sys.argv:
        print("have", f)
        continue
    # -g: the file names contain parentheses, curl must not glob them
    subprocess.run(["curl", "-g", "-sSL", "--retry", "3", "-o", str(dest), BASE + f], check=True)
    print("fetched", f, dest.stat().st_size // 10**6, "MB")
