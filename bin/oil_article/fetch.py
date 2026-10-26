"""Download the public series behind the oil-market long read into cache/ (no keys needed).

FRED (Federal Reserve Bank of St. Louis) republishes the EIA daily spot prices; EIA's own history workbooks
(hist_xls) give the weekly US stocks, refinery runs, exports and the NYMEX futures strip. All EIA data are public domain.
Run from this folder: python3 fetch.py [--force]
"""
import subprocess, sys, pathlib
HERE = pathlib.Path(__file__).parent; CACHE = HERE / 'cache'; CACHE.mkdir(exist_ok=True)
FORCE = '--force' in sys.argv
FRED = {  # EIA spot prices via FRED, daily. crude $/bbl, products $/gal
    'wti': 'DCOILWTICO', 'brent': 'DCOILBRENTEU', 'gas_nyh': 'DGASNYH', 'gas_usg': 'DGASUSGULF',
    'ulsd_nyh': 'DDFUELNYH', 'ulsd_usg': 'DDFUELUSGULF', 'jet_usg': 'DJFUELUSGULF', 'ho_nyh': 'DHOILNYH',
}
EIA = {  # EIA petroleum history workbooks
    'cushing': 'W_EPC0_SAX_YCUOK_MBBLw',          # Cushing crude stocks, kbbl, weekly
    'us_crude_stocks': 'WCESTUS1w',              # US commercial crude stocks excl. SPR, kbbl
    'spr': 'WCSSTUS1w',                          # Strategic Petroleum Reserve, kbbl
    'distillate_stocks': 'WDISTUS1w',            # US distillate stocks, kbbl
    'gasoline_stocks': 'WGTSTUS1w',              # US motor gasoline stocks, kbbl
    'refinery_util': 'WPULEUS3w',                # % operable capacity utilisation
    'crude_exports': 'WCREXUS2w',                # US crude exports, kb/d
    'crude_prod': 'WCRFPUS2w',                   # US field production, kb/d
    'retail_gas': 'EMM_EPMR_PTE_NUS_DPGw',       # US regular gasoline retail, $/gal
    'retail_diesel': 'EMD_EPD2D_PTE_NUS_DPGw',   # US on-highway diesel retail, $/gal
}


def get(url, out):
    if out.exists() and out.stat().st_size > 200 and not FORCE:
        return
    subprocess.run(['curl', '-s', '-4', '-m', '120', '-o', str(out), url], check=True)
    print(out.name, out.stat().st_size, 'bytes')


for k, sid in FRED.items():
    get(f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}&cosd=1986-01-01', CACHE / f'{k}.csv')
for k, sid in EIA.items():
    get(f'https://www.eia.gov/dnav/pet/hist_xls/{sid}.xls', CACHE / f'{k}.xls')
