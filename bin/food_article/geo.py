#!/usr/bin/env python3
"""World geometry for the maps of the food article: Natural Earth 50m admin-0 (public domain) in the Equal Earth
projection, simplified, as SVG path strings keyed by UN M49 code -> assets/food-article/world.json.

    python3 bin/food_article/geo.py
"""
import json, pathlib, sys
import numpy as np
from shapely.geometry import shape, Polygon, MultiPolygon, box
from shapely.ops import unary_union

KIT = pathlib.Path.home() / "code" / "ConceptsPlots" / "100_code" / "020_maps"
sys.path.insert(0, str(KIT))
from proj import equal_earth  # noqa: E402
from geodata import antimeridian  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
NE = pathlib.Path.home() / "code" / "ConceptsPlots" / "900_data" / "maps" / "ne_50m_admin_0_countries.geojson"
OUT = ROOT / "assets" / "food-article" / "world.json"
W = 1000.0
P = equal_earth(0)
# NE codes -99 or shared; Kosovo, Somaliland and N. Cyprus are inside Serbia, Somalia and Cyprus in the FAO data
SPECIAL = {"France": "250", "Norway": "578", "Kosovo": "688", "Somaliland": "706", "N. Cyprus": "196", "Antarctica": None}
# representative points for countries whose largest polygon's centre is a poor anchor for a flow arc
ANCHOR = {"250": (2.5, 46.8), "840": (-98.0, 39.5), "643": (50.0, 57.0), "124": (-100.0, 56.0), "578": (9.0, 61.0), "152": (-71.0, -33.0), "360": (113.0, -1.0)}

feats = json.load(open(NE))["features"]
raw = {}
for f in feats:
    p = f["properties"]
    code = SPECIAL.get(p["NAME"], p["ISO_N3"] if p["ISO_N3"] != "-99" else p["ISO_N3_EH"])
    if p["NAME"] in SPECIAL and SPECIAL[p["NAME"]] is None:
        continue
    if code in (None, "-99") or p["CONTINENT"] == "Antarctica":
        continue
    code = code.lstrip("0")  # the data files use M49 without leading zeros ('76' for Brazil)
    g = antimeridian(shape(f["geometry"]))
    g = g.intersection(box(-180, -58, 180, 84))
    if g.is_empty:
        continue
    if code in raw:  # territories sharing a code with their country (Australia + Ashmore and Cartier + Indian Ocean Ter.)
        old_name, old_g = raw[code]
        big = old_name if old_g.area >= g.area else p["NAME"]
        raw[code] = (big, unary_union([old_g, g]))
    else:
        raw[code] = (p["NAME"], g)

def proj_geom(g):
    polys = [g] if isinstance(g, Polygon) else [x for x in g.geoms if isinstance(x, Polygon)]
    out = []
    for pg in polys:
        def tr(ring):
            c = np.asarray(ring.coords)
            x, y = P(c[:, 0], c[:, 1])
            return np.column_stack([x, y])
        out.append((tr(pg.exterior), [tr(r) for r in pg.interiors]))
    return out

# scale: equal earth x range
x_max, _ = P(np.array([180.0]), np.array([0.0]))
_, y_top = P(np.array([0.0]), np.array([84.0]))
_, y_bot = P(np.array([0.0]), np.array([-58.0]))
S = W / (2 * float(x_max[0]))
H = (float(y_top[0]) - float(y_bot[0])) * S

def sx(x): return (x + float(x_max[0])) * S
def sy(y): return (float(y_top[0]) - y) * S

countries = {}
for code, (name, g) in sorted(raw.items()):
    polys = []
    for ext, holes in proj_geom(g):
        pol = Polygon(np.column_stack([sx(ext[:, 0]), sy(ext[:, 1])]), [np.column_stack([sx(h[:, 0]), sy(h[:, 1])]) for h in holes if len(h) > 3])
        if not pol.is_valid:
            pol = pol.buffer(0)
        pol = pol.simplify(0.35)
        if pol.is_empty or pol.area < 0.15:
            continue
        polys += [pol] if isinstance(pol, Polygon) else list(pol.geoms)
    if not polys:
        continue
    d = ""
    for pol in polys:
        for ring in [pol.exterior, *pol.interiors]:
            c = np.asarray(ring.coords)
            d += "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in c[:-1]) + "Z"
    big = max(polys, key=lambda q: q.area)
    if code in ANCHOR:
        lo, la = ANCHOR[code]
        ax, ay = P(np.array([lo]), np.array([la]))
        cx, cy = sx(float(ax[0])), sy(float(ay[0]))
    else:
        c = big.representative_point() if not big.centroid.within(big) else big.centroid
        cx, cy = c.x, c.y
    countries[code] = dict(n=name, d=d, x=round(cx, 1), y=round(cy, 1), a=round(sum(q.area for q in polys), 1))
OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump(dict(w=W, h=round(H, 1), c=countries), open(OUT, "w"), separators=(",", ":"))
print(len(countries), "countries", OUT.stat().st_size // 1024, "KB", "h=", round(H, 1))
