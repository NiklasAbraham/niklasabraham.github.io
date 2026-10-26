"""Map geometry for the oil-market long read -> assets/oil-article/geo.json.

Natural Earth admin-0 countries (public domain): 50m for the world, 10m for the regional maps. Each map is a set of
SVG path strings in its own pixel frame plus the projection parameters, so that assets/js/oil-explorer.js can place
any lon/lat point (ports, chokepoints, tankers) with the same formula:
  world  : Equal Earth, lon0 = 10, x = cx + s * X(lon, lat), y = cy - s * Y(lon, lat)
  region : equirectangular scaled by cos(lat0): x = (lon - lon_min) * kx, y = (lat_max - lat) * ky
Run with the conceptsplots env (shapely, numpy):  python geo.py
"""
import json, pathlib, sys
import numpy as np
from shapely.geometry import shape, Polygon, MultiPolygon, box

KIT = pathlib.Path.home() / 'code' / 'ConceptsPlots' / '100_code' / '020_maps'
sys.path.insert(0, str(KIT))
from proj import equal_earth  # noqa: E402
from geodata import antimeridian  # noqa: E402

NE = pathlib.Path.home() / 'code' / 'ConceptsPlots' / '900_data' / 'maps'
OUT = pathlib.Path(__file__).resolve().parents[2] / 'assets' / 'oil-article' / 'geo.json'
REGIONS = {  # name: (lon_min, lon_max, lat_min, lat_max, width px, resolution, simplify tolerance in degrees)
    'gulf': (46.0, 61.0, 21.0, 31.0, 1000, '10m', 0.01),
    'atlantic': (-100.0, 12.0, 18.0, 64.0, 1000, '50m', 0.05),
    'northsea': (-8.0, 12.0, 50.0, 63.0, 1000, '10m', 0.01),
}


def load(res):
    feats = json.load(open(NE / f'ne_{res}_admin_0_countries.geojson'))['features']
    out = []
    for f in feats:
        p = f['properties']
        if p.get('CONTINENT') == 'Antarctica':
            continue
        iso = p.get('ISO_A3') if p.get('ISO_A3') not in (None, '-99') else p.get('ADM0_A3')
        out.append((iso, p.get('NAME'), antimeridian(shape(f['geometry']))))
    return out


def polys(g):
    return [g] if isinstance(g, Polygon) else [x for x in getattr(g, 'geoms', []) if isinstance(x, Polygon)]


def path(rings):
    s = []
    for r in rings:
        if len(r) < 3:
            continue
        s.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in r) + 'Z')
    return ''.join(s)


def world():
    P = equal_earth(10)
    xm, _ = P(np.array([180.0 + 10]), np.array([0.0]))
    _, ym = P(np.array([10.0]), np.array([84.0]))
    W = 1000.0; s = W / 2 / float(np.abs(xm[0])); H = round(2 * float(ym[0]) * s + 60)
    cx, cy = W / 2, H / 2 - 10
    cut = box(-180, -58, 180, 84)
    feats = {}
    for iso, name, g in load('50m'):
        g = g.intersection(cut).simplify(0.08, preserve_topology=True)
        rings = []
        for pg in polys(g):
            for ring in [pg.exterior]:
                c = np.asarray(ring.coords)
                x, y = P(c[:, 0], c[:, 1])
                rings.append(list(zip(cx + s * x, cy - s * y)))
        if rings:
            feats[iso] = {'n': name, 'd': path(rings)}
    return {'proj': 'equalearth', 'lon0': 10, 'cx': cx, 'cy': cy, 's': s, 'w': W, 'h': H, 'c': feats}


def region(lo0, lo1, la0, la1, W, res, tol):
    kx = W / (lo1 - lo0); ky = kx / np.cos(np.radians((la0 + la1) / 2)); H = round((la1 - la0) * ky)
    clip = box(lo0 - 2, la0 - 2, lo1 + 2, la1 + 2)
    feats = {}
    for iso, name, g in load(res):
        if not g.intersects(clip):
            continue
        g = g.intersection(clip).simplify(tol, preserve_topology=True)
        rings = []
        for pg in polys(g):
            c = np.asarray(pg.exterior.coords)
            rings.append(list(zip((c[:, 0] - lo0) * kx, (la1 - c[:, 1]) * ky)))
        if rings:
            key = iso if iso not in feats else iso + '_' + str(len(feats))
            feats[key] = {'n': name, 'd': path(rings)}
    return {'proj': 'equirect', 'lon0': lo0, 'lat1': la1, 'kx': kx, 'ky': ky, 'w': W, 'h': H, 'c': feats}


data = {'world': world(), **{k: region(*v) for k, v in REGIONS.items()}}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, separators=(',', ':')))
print(OUT, round(OUT.stat().st_size / 1024), 'kB', {k: (len(v['c']), v['w'], v['h']) for k, v in data.items()})
