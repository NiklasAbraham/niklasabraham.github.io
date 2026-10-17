#!/usr/bin/env python3
"""Maps for the German energy long read, drawn with the map kit of ConceptsPlots
(~/code/ConceptsPlots/100_code/020_maps: equal-area projections, paper land, tinted sea,
labels on a halo). Writes SVGs into _includes/energy-article/ (inlined by en-map.html) and
PNG previews into bin/energy_article/cache/preview/.

    python3 bin/energy_article/maps.py            # all
    python3 bin/energy_article/maps.py gas        # one

map_gas.svg        where the gas comes from (BNetzA gas supply figures 2025, SMARD "The gas market in 2025")
map_renewables.svg wind onshore (FA Wind & Solar, end 2025) and solar (MaStR via strom-report, 13 Jan 2026) per state
map_grid.svg       the four TSO control areas (approximated by state), HVDC corridors, lignite regions, offshore wind
map_europe.svg     2025 day-ahead prices by bidding zone and Germany's net physical flows (Energy-Charts)
"""
import json
import math
import pathlib
import re
import sys

MAPKIT = pathlib.Path.home() / "code" / "ConceptsPlots" / "100_code" / "020_maps"
sys.path.insert(0, str(MAPKIT))

import numpy as np  # noqa: E402
from shapely.ops import unary_union  # noqa: E402

import geodata  # noqa: E402
from mapkit import Map  # noqa: E402
from proj import laea  # noqa: E402
from themes import literal_theme  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / "_includes" / "energy-article"
PREV = HERE / "cache" / "preview"
CACHE = HERE / "cache"

INK, INK2 = "#04204B", "#3D5F91"
BLUE, WARM, TEAL, VIOLET = "#0B4FC0", "#B4552F", "#138374", "#6A47C2"
GAS, SOLAR, WIND = "#D9762B", "#E3A21A", "#2F6FD0"


def theme():
    t = literal_theme("site", sea="#EEF2F8", land="#FFFFFF", ink=INK, paper="#FFFFFF", muted=INK2, hl=BLUE,
                      series=[WARM, BLUE, TEAL, "#C0841A", VIOLET, "#8A9099"])
    fam = "Inter, 'Helvetica Neue', Arial, sans-serif"
    t["fonts"] = {"sans": fam, "disp": fam, "mono": "'JetBrains Mono', 'DejaVu Sans Mono', monospace", "serif": fam}
    return t


def out(m, name):
    OUT.mkdir(parents=True, exist_ok=True)
    PREV.mkdir(parents=True, exist_ok=True)
    # the kit sets pathLength="1" for its draw-in animation; in a browser that rescales dash patterns to the
    # path length and turns every dashed line solid, and nothing animates here
    svg = m.svg(klasse="en-map-svg").replace(' pathLength="1"', "")
    (OUT / f"{name}.svg").write_text(svg, encoding="utf-8")
    m.png(PREV / f"{name}.png", scale=1.2, klasse="en-map-svg")
    print("wrote", (OUT / f"{name}.svg").relative_to(ROOT), f"{len(svg) / 1024:.0f} KB")


def states():
    return {p["iso_3166_2"]: (p["name"], g) for p, g in geodata.natural_earth("admin_1_states_provinces", "10m")
            if p.get("adm0_a3") == "DEU"}


def mix(c, t):
    """c mixed with white: t = 0 white, 1 full colour"""
    c = c.lstrip("#")
    r, g, b = (int(c[i:i + 2], 16) for i in (0, 2, 4))
    return "#" + "".join(f"{round(255 + (x - 255) * t):02X}" for x in (r, g, b))


def legend_box(m, x, y, rows, title=None, size=15):
    """rows: [(kind, colour, text)] with kind 'sq', 'line', 'dash', 'dot'"""
    if title:
        m.text(x, y, title, size=size, weight=700, anchor="start", halo=False)
        y += size * 1.6
    for kind, col, txt in rows:
        if kind == "sq":
            m.add(f'<rect x="{x}" y="{y - 8}" width="16" height="16" rx="3" style="fill:{col}"/>')
        elif kind in ("line", "dash"):
            dash = ";stroke-dasharray:7 5" if kind == "dash" else ""
            m.add(f'<line x1="{x}" y1="{y}" x2="{x + 22}" y2="{y}" style="stroke:{col};stroke-width:4;stroke-linecap:round{dash}"/>')
        elif kind == "dot":
            m.add(f'<circle cx="{x + 8}" cy="{y}" r="7" style="fill:{col}"/>')
        m.text(x + 32, y, txt, size=size - 1, anchor="start", halo=False, role="label_soft")
        y += size * 1.55
    return y


# ------------------------------------------------------------------------------------------ gas
def gas():
    m = Map(laea(10, 55), bbox=(-4, 46.5, 24, 63.5), size=(1100, 1000), theme=theme(), id="gas")
    m.base(scale="50m", graticule=0, rivers=False)
    m.countries({"DEU": mix(GAS, 0.18)}, stroke=INK2, width=1.2)
    m.sea_label(2.4, 57.7, "North Sea", size=17)
    m.sea_label(17.8, 55.6, "Baltic Sea", size=17)
    # import corridors, width ~ share (BNetzA 2025: Norway 44 %, Netherlands 24 %, Belgium 21 %, LNG 10.3 %)
    flows = [((5.0, 61.0), (7.4, 53.6), 44, "Norway 44 %", (-6, -8), 0.10),
             ((4.4, 52.4), (7.3, 52.2), 24, "Netherlands 24 %", (0, 30), 0.0),
             ((3.4, 51.0), (6.6, 50.8), 21, "Belgium 21 %", (0, 34), 0.0)]
    for a, b, share, lab, (dx, dy), bog in flows:
        m.arrow(a, b, role=GAS, width=2 + share * 0.32, bogen=bog, kopf=12 + share * 0.3)
    m.label(4.0, 60.0, "Norway 44 %", size=19, weight=700, role=GAS, anchor="start", dx=0, dy=0)
    m.text(*m.xy(4.4, 60.0), "", size=1)
    m.label(4.0, 59.55, "Europipe I/II, Norpipe → Emden/Dornum", size=14, role="label_soft", anchor="start")
    m.label(2.6, 52.75, "Netherlands 24 %", size=18, weight=700, role=GAS, anchor="start")
    m.label(1.2, 50.55, "Belgium 21 %", size=18, weight=700, role=GAS, anchor="start")
    m.label(1.2, 50.15, "both pass on LNG landed", size=13.5, role="label_soft", anchor="start")
    m.label(1.2, 49.85, "at Rotterdam and Zeebrugge", size=13.5, role="label_soft", anchor="start")
    # LNG terminals (AGEB 2025: share of German LNG landings)
    lng = [(8.10, 53.58, "Wilhelmshaven (2 FSRUs) · 54 %", "l", 0, -42),
           (9.17, 53.89, "Brunsbüttel · 21 %", "r", 0, -16),
           (13.62, 54.51, "Mukran (Rügen) · 25 %", "r", 0, 0)]
    for lon, lat, lab, side, dx, dy in lng:
        m.point(lon, lat, lab, r=7, role=BLUE, seite=side, size=15, weight=600, label_role=BLUE, dx=dx, dy=dy, ring=True)
    m.route([(-4.9, 49.55), (-1.0, 50.3), (1.45, 51.15), (3.4, 52.5), (5.6, 53.9)], role=BLUE, width=3.4)
    m.arrow((5.6, 53.85), (7.85, 53.7), role=BLUE, width=3.4, bogen=0.0, kopf=15, halo=False)
    m.label(0.4, 55.6, "LNG by ship: 106 TWh,", size=16, weight=700, role=BLUE, anchor="start")
    m.label(0.4, 55.25, "10.3 % of imports, 94 % of it", size=14, role=BLUE, anchor="start")
    m.label(0.4, 54.93, "from the United States", size=14, role=BLUE, anchor="start")
    # Nord Stream, out of service
    m.route([(28.5, 60.4), (24.0, 59.6), (19.5, 57.6), (15.6, 55.2), (13.65, 54.15)], role="#8A9099", width=3,
            dash="8 7")
    m.label(20.4, 58.7, "Nord Stream 1 & 2", size=15, weight=700, role="#6b7280", anchor="start")
    m.label(20.4, 58.32, "blown up Sept 2022, no flow", size=13.5, role="#6b7280", anchor="start")
    # exports (transit) to the south: SMARD 2025, 221 TWh exported: Austria 46 %, Czechia 26 %, Switzerland 13 %
    for a, b, lab, d in [((12.0, 48.3), (13.6, 47.6), "Austria 46 %", (12, 18)), ((13.0, 50.6), (14.4, 50.1), "Czechia 26 %", (8, -6)),
                         ((8.0, 48.2), (8.0, 47.2), "Switzerland 13 %", (-6, 22))]:
        m.arrow(a, b, role="#A35A20", width=2.6, bogen=0.0, kopf=11)
    m.label(14.4, 47.35, "Austria 46 %", size=14, role="#A35A20", anchor="start", weight=600)
    m.label(14.75, 50.0, "Czechia 26 %", size=14, role="#A35A20", anchor="start", weight=600)
    m.label(7.0, 46.95, "Switzerland 13 %", size=14, role="#A35A20", anchor="middle", weight=600)
    m.region_label(10.9, 51.75, "Germany", size=21, role=INK2)
    m.label(10.9, 51.35, "uses 864 TWh", size=14.5, role=INK2)
    m.label(10.9, 51.05, "imports 1,031 TWh", size=14.5, role=INK2)
    m.label(10.9, 50.75, "exports 221 TWh", size=14.5, role=INK2)
    m.label(10.9, 50.45, "produces 34 TWh", size=14.5, role=INK2)
    legend_box(m, 30, 925, [("line", GAS, "pipeline imports, width ~ share"), ("line", "#A35A20", "exports and transit (share of 221 TWh)")], size=15)
    out(m, "map_gas")


# ------------------------------------------------------------------------------------------ renewables
WIND_MW = {  # FA Wind und Solar, Status des Windenergieausbaus an Land 2025, Tabelle 5 (MaStR, 31 Dec 2025)
    "DE-BW": 2058, "DE-BY": 2760, "DE-BE": 17, "DE-BB": 9525, "DE-HB": 198, "DE-HH": 121, "DE-HE": 2792,
    "DE-MV": 3931, "DE-NI": 13976, "DE-NW": 9074, "DE-RP": 4327, "DE-SL": 564, "DE-SN": 1418, "DE-ST": 5786,
    "DE-SH": 9624, "DE-TH": 1896}
SOLAR_MW = {  # BNetzA Marktstammdatenregister via strom-report.com, 13 Jan 2026
    "DE-BW": 14640, "DE-BY": 31452, "DE-BE": 489, "DE-BB": 8858, "DE-HB": 189, "DE-HH": 250, "DE-HE": 5405,
    "DE-MV": 5022, "DE-NI": 10387, "DE-NW": 14218, "DE-RP": 5936, "DE-SL": 1179, "DE-SN": 5437, "DE-ST": 5790,
    "DE-SH": 4579, "DE-TH": 3207}
ABBR = {"DE-BW": "BW", "DE-BY": "BY", "DE-BE": "BE", "DE-BB": "BB", "DE-HB": "HB", "DE-HH": "HH", "DE-HE": "HE",
        "DE-MV": "MV", "DE-NI": "NI", "DE-NW": "NW", "DE-RP": "RP", "DE-SL": "SL", "DE-SN": "SN", "DE-ST": "ST",
        "DE-SH": "SH", "DE-TH": "TH"}
LABEL_AT = {"DE-BB": (13.2, 52.0), "DE-NI": (9.2, 52.75), "DE-SH": (9.75, 54.25), "DE-BY": (11.5, 48.85),
            "DE-HE": (9.0, 50.55), "DE-SN": (13.3, 51.0), "DE-ST": (11.7, 52.0), "DE-RP": (7.45, 49.85),
            "DE-NW": (7.5, 51.45), "DE-BW": (9.0, 48.55), "DE-TH": (11.0, 50.85), "DE-MV": (12.6, 53.75),
            "DE-SL": (6.95, 49.38)}


def de_panel(values, colour, title, unit_note, mapid):
    m = Map(laea(10.4, 51.2), bbox=(5.6, 47.2, 15.2, 55.1), size=(620, 800), theme=theme(), id=mapid, rand=0.03)
    m.base(scale="50m", graticule=0, borders=True)
    st = states()
    vmax = max(values.values())
    for code, (name, g) in st.items():
        v = values[code]
        m.polygon(g, fill=mix(colour, 0.08 + 0.92 * math.sqrt(v / vmax)), stroke="#FFFFFF", width=1.2)
    for code, (lon, lat) in LABEL_AT.items():
        v = values[code]
        dark = math.sqrt(v / vmax) > 0.55
        m.label(lon, lat, f"{v / 1000:.1f}", size=17, weight=700, role="#FFFFFF" if dark else INK, halo=not dark)
    m.text(20, 30, title, size=21, weight=700, anchor="start", halo=False)
    m.text(20, 58, unit_note, size=14, anchor="start", halo=False, role="label_soft")
    return m


def renewables():
    w = de_panel(WIND_MW, WIND, "Wind onshore, GW", f"68.1 GW in total, end of 2025", "wind")
    s = de_panel(SOLAR_MW, SOLAR, "Solar, GW", "117.0 GW in total, January 2026", "solar")
    # compose the two maps side by side in one SVG
    inner = lambda svg: re.sub(r"^<svg[^>]*>|</svg>$", "", svg)
    inner0 = inner
    inner = lambda svg: inner0(svg).replace(' pathLength="1"', "")
    comp = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1260 800" class="en-map-svg" role="img">'
            f'<g>{inner(w.svg())}</g><g transform="translate(640,0)">{inner(s.svg())}</g></svg>')
    (OUT / "map_renewables.svg").write_text(comp, encoding="utf-8")
    import cairosvg
    PREV.mkdir(parents=True, exist_ok=True)
    cairosvg.svg2png(bytestring=comp.encode(), write_to=str(PREV / "map_renewables.png"), scale=1.2)
    print("wrote map_renewables.svg", f"{len(comp) / 1024:.0f} KB")


# ------------------------------------------------------------------------------------------ grid
TSO = {  # control areas approximated by state; the true borders cut through BY, HE, NI and BW
    "50Hertz": (["DE-BE", "DE-BB", "DE-HH", "DE-MV", "DE-SN", "DE-ST", "DE-TH"], "#6A47C2"),
    "TenneT": (["DE-SH", "DE-NI", "DE-HB", "DE-HE", "DE-BY"], "#0B4FC0"),
    "Amprion": (["DE-NW", "DE-RP", "DE-SL"], "#138374"),
    "TransnetBW": (["DE-BW"], "#B4552F"),
}


def grid():
    m = Map(laea(10.4, 51.2), bbox=(4.8, 47.0, 15.6, 55.6), size=(900, 1000), theme=theme(), id="grid", rand=0.02)
    m.base(scale="50m", graticule=0)
    st = states()
    for name, (codes, col) in TSO.items():
        g = unary_union([st[c][1] for c in codes]).buffer(0)
        m.polygon(g, fill=mix(col, 0.16), stroke=mix(col, 0.55), width=1.6)
    for code, (n, g) in st.items():
        m.polygon(g, fill="none", stroke="#FFFFFF", width=0.8)
    for name, (lon, lat) in {"50Hertz": (12.7, 53.4), "TenneT": (8.6, 52.75), "Amprion": (7.2, 50.6),
                             "TransnetBW": (9.0, 48.25)}.items():
        m.label(lon, lat, name.upper(), size=19, weight=700, role=TSO[name][1], spacing="0.08em")
    m.label(11.7, 48.55, "TENNET", size=19, weight=700, role=TSO["TenneT"][1], spacing="0.08em")
    # offshore wind areas (schematic)
    for lon, lat, txt in [(6.6, 54.35, "North Sea\noffshore wind"), (13.9, 54.75, "Baltic\noffshore")]:
        m.point(lon, lat, None, r=11, role="#173F7E")
        m.label(lon, lat + 0.42, txt, size=14, weight=600, role="#173F7E")
    # lignite regions
    for lon, lat, txt, side in [(6.55, 50.95, "Rhineland lignite", "l"), (14.35, 51.6, "Lusatia lignite", "r"),
                                (12.3, 51.25, "Central German\nlignite", "r")]:
        m.point(lon, lat, txt, r=9, role="#7A5230", seite=side, size=14.5, weight=600, label_role="#7A5230")
    # HVDC corridors (approximate end points; Bundesnetzagentur, Netzausbau)
    hvdc = [("SuedLink", [(9.37, 53.92), (9.9, 52.3), (10.2, 50.0)], "2028"),
            ("SuedLink", [(9.5, 53.75), (9.6, 51.5), (9.15, 49.15)], ""),
            ("SuedOstLink", [(11.63, 52.25), (12.0, 50.5), (12.2, 48.6)], "2027"),
            ("A-Nord", [(7.2, 53.37), (6.62, 51.27)], "2027"),
            ("Ultranet", [(6.62, 51.27), (7.6, 50.1), (8.45, 49.23)], "2026–27")]
    for name, pts, year in hvdc:
        m.route(pts, role=WARM, width=5.0, dash="10 6", bogen=0.06)
    m.label(10.35, 51.7, "SuedLink\n2 × 2 GW · 2028", size=14.5, weight=700, role=WARM, anchor="start")
    m.label(12.25, 49.9, "SuedOstLink\n2 GW · 2027", size=14.5, weight=700, role=WARM, anchor="start")
    m.label(6.0, 52.6, "A-Nord", size=14.5, weight=700, role=WARM, anchor="end")
    m.label(7.05, 49.75, "Ultranet", size=14.5, weight=700, role=WARM, anchor="end")
    # load centres
    for lon, lat, txt, side in [(11.58, 48.14, "Munich", "b"), (9.18, 48.78, "Stuttgart", "l"),
                                (8.68, 50.11, "Frankfurt", "r"), (6.96, 51.45, "Ruhr", "r"),
                                (13.4, 52.52, "Berlin", "r"), (9.99, 53.55, "Hamburg", "r")]:
        m.point(lon, lat, txt, r=4.5, role=INK, seite=side, size=14, weight=500)
    legend_box(m, 660, 860, [("dash", WARM, "HVDC line being built"),
                              ("dot", "#7A5230", "lignite mining region"), ("dot", "#173F7E", "offshore wind cluster")],
               size=15)
    m.text(660, 830, "Shading: TSO areas, approximate", size=13.5, anchor="start", halo=True,
           role="label_soft")
    out(m, "map_grid")


# ------------------------------------------------------------------------------------------ europe
ZONE_OF = {"FRA": ["FR"], "NLD": ["NL"], "BEL": ["BE"], "AUT": ["AT"], "CHE": ["CH"], "CZE": ["CZ"], "POL": ["PL"],
           "DNK": ["DK1", "DK2"], "SWE": ["SE1", "SE2", "SE3", "SE4"], "NOR": ["NO1", "NO2", "NO3", "NO4", "NO5"],
           "ITA": ["IT-North"], "HUN": ["HU"], "SVN": ["SI"], "ESP": ["ES"], "PRT": ["PT"], "FIN": ["FI"],
           "EST": ["EE"], "LTU": ["LT"], "LVA": ["LV"], "SVK": ["SK"], "ROU": ["RO"], "BGR": ["BG"], "HRV": ["HR"],
           "GRC": ["GR"]}
FLOW_NAME = {"Austria": "AUT", "Belgium": "BEL", "Czech Republic": "CZE", "Denmark": "DNK", "France": "FRA",
             "Luxembourg": "LUX", "Netherlands": "NLD", "Norway": "NOR", "Poland": "POL", "Sweden": "SWE",
             "Switzerland": "CHE"}
ANCHOR = {"AUT": (14.2, 47.6), "BEL": (4.6, 50.7), "CZE": (15.3, 49.8), "DNK": (9.9, 56.0), "FRA": (2.6, 47.0),
          "LUX": (6.1, 49.75), "NLD": (5.4, 52.3), "NOR": (5.2, 58.2), "POL": (19.2, 52.2), "SWE": (14.8, 57.6),
          "CHE": (8.1, 46.8), "DEU": (10.3, 51.2)}


def zone_price(z):
    f = CACHE / f"price_zone_{z}_2025.json"
    if not f.exists():
        return None
    d = json.loads(f.read_text())
    if not d.get("price"):
        return None
    import pandas as pd
    s = pd.Series([np.nan if x is None else x for x in d["price"]], index=pd.to_datetime(d["unix_seconds"], unit="s"))
    # hourly products until Sep 2025, quarter-hourly after: average per hour first, then over the year
    return float(s.resample("1h").mean().mean())


def price_colour(p):
    stops = [(20, "#0B4FC0"), (45, "#7FA6E6"), (65, "#D6E3F6"), (80, "#F6DFA0"), (95, "#E8A33A"), (115, "#C4562A"),
             (140, "#7A2416")]
    if p <= stops[0][0]:
        return stops[0][1]
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        if p <= b:
            t = (p - a) / (b - a)
            ca, cb = ca.lstrip("#"), cb.lstrip("#")
            return "#" + "".join(f"{round(int(ca[i:i + 2], 16) * (1 - t) + int(cb[i:i + 2], 16) * t):02X}" for i in (0, 2, 4))
    return stops[-1][1]


def europe():
    m = Map(laea(12, 52), bbox=(-9, 39, 31, 66), size=(1100, 1000), theme=theme(), id="eu", rand=0.01)
    m.base(scale="50m", graticule=0)
    prices = {}
    for a3, zones in ZONE_OF.items():
        ps = [(z, zone_price(z)) for z in zones]
        ps = [(z, p) for z, p in ps if p is not None]
        if ps:
            prices[a3] = ps
    import shutil
    shutil.copy(CACHE / "price_2025.json", CACHE / "price_zone_DE-LU_2025.json")
    de = zone_price("DE-LU")
    fills = {a3: price_colour(np.mean([p for _, p in ps])) for a3, ps in prices.items()}
    fills["DEU"] = price_colour(de)
    fills["LUX"] = price_colour(de)
    m.countries(fills, stroke="#FFFFFF", width=1.0)
    m.countries({"DEU": "none"}, stroke=INK, width=2.2)
    # labels with the zone prices
    lab_at = {"FRA": (2.4, 46.6), "NLD": (5.6, 52.5), "BEL": (4.3, 50.55), "AUT": (14.6, 47.45), "CHE": (8.0, 46.75),
              "CZE": (15.4, 49.75), "POL": (19.3, 52.1), "DNK": (9.3, 56.05), "SWE": (15.6, 61.5), "NOR": (9.0, 61.2),
              "ITA": (10.6, 44.9), "HUN": (19.4, 47.1), "ESP": (-3.6, 40.4), "FIN": (26.0, 63.0), "SVK": (19.6, 48.75),
              "SVN": (14.8, 46.1), "HRV": (16.2, 45.4), "ROU": (24.5, 46.0), "LTU": (23.8, 55.4), "LVA": (25.2, 56.9),
              "EST": (25.6, 58.7), "PRT": (-8.2, 40.0)}
    for a3, ps in prices.items():
        if a3 not in lab_at:
            continue
        lon, lat = lab_at[a3]
        if len(ps) == 1:
            txt = f"{ps[0][1]:.0f}"
        else:
            vals = sorted(p for _, p in ps)
            txt = f"{vals[0]:.0f}–{vals[-1]:.0f}"
        m.label(lon, lat, txt, size=17, weight=700, role=INK)
    m.label(10.2, 51.0, f"DE-LU\n{de:.0f}", size=19, weight=800, role=INK)
    # net physical flows 2025 (cbpf, + = import into Germany)
    d = json.loads((CACHE / "cbpf_2025.json").read_text())
    for c in d["countries"]:
        a3 = FLOW_NAME.get(c["name"])
        if not a3:
            continue
        v = np.array([np.nan if x is None else x for x in c["data"]], float)
        twh = float(np.nansum(v) * 0.25 / 1e3)
        if abs(twh) < 0.8:
            continue
        de_pt = ANCHOR["DEU"]
        nb = ANCHOR[a3]
        # start/end pulled in from the anchors so the arrows sit across the border
        f0, f1 = (0.18, 0.62) if twh > 0 else (0.38, 0.82)
        a = (nb[0] + (de_pt[0] - nb[0]) * f0, nb[1] + (de_pt[1] - nb[1]) * f0)
        b = (nb[0] + (de_pt[0] - nb[0]) * f1, nb[1] + (de_pt[1] - nb[1]) * f1)
        if twh < 0:
            a, b = (de_pt[0] + (nb[0] - de_pt[0]) * 0.38, de_pt[1] + (nb[1] - de_pt[1]) * 0.38), \
                   (de_pt[0] + (nb[0] - de_pt[0]) * 0.82, de_pt[1] + (nb[1] - de_pt[1]) * 0.82)
        col = TEAL if twh > 0 else VIOLET
        m.arrow(a, b, role=col, width=2 + abs(twh) * 0.45, bogen=0.0, kopf=12 + abs(twh) * 0.4)
        mx, my = m.xy((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        m.text(mx, my - 16, f"{abs(twh):.1f}", size=15, weight=800, role=col)
    # legend: colour scale and arrows
    x0, y0 = 30, 40
    m.text(x0, y0, "Day-ahead price 2025, EUR/MWh (zone mean)", size=16, weight=700, anchor="start", halo=False)
    for i, p in enumerate(range(20, 145, 5)):
        m.add(f'<rect x="{x0 + i * 14}" y="{y0 + 16}" width="14" height="14" style="fill:{price_colour(p)}"/>')
    for p in (20, 60, 100, 140):
        m.text(x0 + (p - 20) / 5 * 14 + 7, y0 + 46, str(p), size=13, anchor="middle", halo=False, role="label_soft")
    legend_box(m, x0, y0 + 80, [("line", TEAL, "net flow into Germany, TWh (2025)"),
                                ("line", VIOLET, "net flow out of Germany, TWh")], size=15)
    m.text(x0, 965, "Countries with several zones show the range (Nordic zones; Italy: North zone only).",
           size=13, anchor="start", halo=False, role="label_soft")
    out(m, "map_europe")


if __name__ == "__main__":
    want = sys.argv[1:] or ["gas", "renewables", "grid", "europe"]
    for w in want:
        globals()[w]()
