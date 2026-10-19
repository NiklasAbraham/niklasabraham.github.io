"""The grid as isometric dioramas: power plant, 380 kV line, 380/110 kV substation, 110/20 kV
substation with wind and solar, the village transformer, the house connection, and one overview.

Run inside Blender (headless), from the repository root:

    blender -b --python bin/energy_article/grid3d.py -- [scene ...] [--res 1600x1000] [--samples 48]

Scenes: overview plant line sub380 sub110 village house.  Each writes bin/energy_article/cache/grid3d/<scene>.png
and <scene>.json (pixel positions of the named anchors, for the labels that grid3d_label.py draws).
Geometry is procedural: every object is a few boxes, cylinders and splines merged per material, in
metres, with the vertical exaggerated where a detail would otherwise vanish (cable trench, insulators).
Nothing is to scale between scenes.
"""
import json
import math
import pathlib
import random
import sys

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "cache" / "grid3d"

# palette of the site (bin/energy_article/style.py) and one colour per voltage level
INK, BLUE, WARM, TEAL, VIOLET = "#04204B", "#0B4FC0", "#B4552F", "#138374", "#6A47C2"
LEVEL = {"ehv": VIOLET, "hv": BLUE, "mv": TEAL, "lv": WARM}

MAT = {
    "grass": "#CBDDB8", "field1": "#E3DDA6", "field2": "#BED5A3", "soil": "#B79B7C", "soil2": "#9C7F63", "sand": "#E6D5AF",
    "concrete": "#E4E1DA", "concrete2": "#CFCBC3", "roof": "#B4552F", "wall": "#F1ECE2", "steel": "#8E98A8",
    "steel2": "#5F6A7C", "glass": "#BFD7E4", "ceramic": "#D9C9B0", "white": "#F6F6F4", "turb": "#C5CFDD", "dark": "#2B3340",
    "ehv": VIOLET, "hv": BLUE, "mv": TEAL, "lv": WARM, "wire": "#2B3340", "road": "#BDBFC4", "panel": "#27407A",
    "plume": "#E6ECF4", "wood": "#C9A57A", "gold": "#E3A21A",
}


def lin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0]


_mats = {}


def material(key, rough=0.55, metal=0.0, emit=0.0):
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(key)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = lin(MAT.get(key, key))
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = lin(MAT.get(key, key))
        b.inputs["Emission Strength"].default_value = emit
    _mats[key] = m
    return m


# ---------------------------------------------------------------------------------------------
# merged geometry: one bmesh per material, a transform stack for placing whole objects
class Scene:
    def __init__(self):
        self.bm = {}
        self.curves = []          # (points, radius, material key)
        self.T = Matrix.Identity(4)
        self.stack = []
        self.anchors = {}

    # placement -------------------------------------------------------------------------------
    def push(self, loc=(0, 0, 0), rot=0.0, scale=1.0):
        self.stack.append(self.T)
        self.T = self.T @ Matrix.Translation(loc) @ Matrix.Rotation(rot, 4, "Z") @ Matrix.Scale(scale, 4)

    def pop(self):
        self.T = self.stack.pop()

    def P(self, p):
        return self.T @ Vector(p)

    def anchor(self, name, p):
        self.anchors[name] = tuple(self.P(p))

    def _bm(self, key):
        if key not in self.bm:
            self.bm[key] = bmesh.new()
        return self.bm[key]

    # primitives ------------------------------------------------------------------------------
    def box(self, c, size, key, rot=0.0, z0=False):
        """Box centred at c (z0: c is the centre of the bottom face), size (x, y, z), rotated about z."""
        bm = self._bm(key)
        sx, sy, sz = size
        cz = c[2] + (sz / 2 if z0 else 0)
        M = self.T @ Matrix.Translation((c[0], c[1], cz)) @ Matrix.Rotation(rot, 4, "Z")
        bmesh.ops.create_cube(bm, size=1.0, matrix=M @ Matrix.Diagonal((sx, sy, sz, 1)))

    def cyl(self, p0, p1, r, key, seg=12, r1=None, cap=True):
        bm = self._bm(key)
        a, b = self.P(p0), self.P(p1)
        d = b - a
        L = d.length
        if L < 1e-6:
            return
        rot = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
        s = self.T.to_scale()[0]
        M = Matrix.Translation((a + b) / 2) @ rot
        bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg, radius1=r * s, radius2=(r if r1 is None else r1) * s,
                              depth=L, matrix=M)

    def vcyl(self, c, r, h, key, seg=16, r1=None):
        self.cyl((c[0], c[1], c[2]), (c[0], c[1], c[2] + h), r, key, seg, r1)

    def sphere(self, c, r, key, seg=10):
        bm = self._bm(key)
        s = self.T.to_scale()[0]
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(4, seg // 2), radius=r * s, matrix=Matrix.Translation(self.P(c)))

    def lathe(self, profile, key, c=(0, 0, 0), seg=48):
        """Solid of revolution about the vertical axis; profile = [(r, z), ...] bottom to top."""
        bm = self._bm(key)
        rings = []
        for r, z in profile:
            ring = []
            for i in range(seg):
                a = 2 * math.pi * i / seg
                ring.append(bm.verts.new(self.P((c[0] + r * math.cos(a), c[1] + r * math.sin(a), c[2] + z))))
            rings.append(ring)
        for k in range(len(rings) - 1):
            for i in range(seg):
                j = (i + 1) % seg
                try:
                    bm.faces.new((rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]))
                except ValueError:
                    pass
        for ring in (rings[0], rings[-1]):
            try:
                bm.faces.new(ring)
            except ValueError:
                pass

    def prism_roof(self, c, size, h, key, rot=0.0):
        """Gable roof over a footprint (sx, sy) with ridge along x; c = centre of the footprint at the eaves."""
        bm = self._bm(key)
        sx, sy = size
        M = self.T @ Matrix.Translation(c) @ Matrix.Rotation(rot, 4, "Z")
        pts = [(-sx / 2, -sy / 2, 0), (sx / 2, -sy / 2, 0), (sx / 2, sy / 2, 0), (-sx / 2, sy / 2, 0), (-sx / 2, 0, h), (sx / 2, 0, h)]
        v = [bm.verts.new(M @ Vector(p)) for p in pts]
        for f in ((0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)):
            bm.faces.new([v[i] for i in f])

    def wire(self, pts, r, key="wire"):
        self.curves.append(([tuple(self.P(p)) for p in pts], r * self.T.to_scale()[0], key))

    def span(self, a, b, r, key="wire", sag=0.04, n=14):
        """Catenary-ish wire between two points; sag as a fraction of the span."""
        a, b = Vector(a), Vector(b)
        L = (b - a).length
        pts = []
        for i in range(n + 1):
            u = i / n
            p = a.lerp(b, u)
            p.z -= sag * L * 4 * u * (1 - u)
            pts.append(tuple(p))
        self.wire(pts, r, key)

    def tube(self, pts, r, key, seg=8):
        self.curves.append(([tuple(self.P(p)) for p in pts], r * self.T.to_scale()[0], key + ":solid"))

    # build -----------------------------------------------------------------------------------
    def commit(self):
        col = bpy.context.scene.collection
        for key, bm in self.bm.items():
            me = bpy.data.meshes.new(key)
            bm.normal_update()
            bm.to_mesh(me)
            bm.free()
            for p in me.polygons:
                p.use_smooth = key in ("plume", "ehv_s")
            ob = bpy.data.objects.new(key, me)
            ob.data.materials.append(material(key.split(":")[0]))
            col.objects.link(ob)
        for pts, r, key in self.curves:
            solid = key.endswith(":solid")
            k = key.split(":")[0]
            cu = bpy.data.curves.new("c", "CURVE")
            cu.dimensions = "3D"
            cu.bevel_depth = r
            cu.bevel_resolution = 1 if not solid else 3
            cu.use_fill_caps = True
            sp = cu.splines.new("POLY")
            sp.points.add(len(pts) - 1)
            for p, q in zip(sp.points, pts):
                p.co = (*q, 1)
            ob = bpy.data.objects.new("c", cu)
            ob.data.materials.append(material(k, rough=0.4))
            col.objects.link(ob)


# ---------------------------------------------------------------------------------------------
# objects
def slab(S, x0, x1, y0, y1, depth=14.0, top="grass", skip=None):
    """The diorama base: a thin top layer of `top` over a block of soil, with the layered side showing."""
    S.box(((x0 + x1) / 2, (y0 + y1) / 2, -depth / 2 - 0.4), (x1 - x0, y1 - y0, depth), "soil")
    S.box(((x0 + x1) / 2, (y0 + y1) / 2, -0.4 / 2), (x1 - x0, y1 - y0, 0.4), "soil2")
    if skip is None:
        S.box(((x0 + x1) / 2, (y0 + y1) / 2, -0.0), (x1 - x0, y1 - y0, 0.02), top)


def lattice_tower(S, H=58.0, w0=9.0, w1=2.2, arms=((38, 11.5), (46, 9.5), (54, 7.5)), r=0.32, phase_key="ehv", bundle=4,
                  insulator=4.0, rot=0.0, drop=1.0):
    """Steel lattice pylon with three crossarm levels, two circuits; returns the six phase attachment points (world, T applied)."""
    S.push((0, 0, 0), rot)
    npanel = 8
    zs = [H * i / npanel * 0.78 for i in range(npanel + 1)]          # tapered body to 78 % of H
    def hw(z):
        return w0 + (w1 - w0) * min(1, z / (H * 0.78))
    legs = [(sx, sy) for sx in (-1, 1) for sy in (-1, 1)]
    for sx, sy in legs:
        S.cyl((sx * hw(0), sy * hw(0), 0), (sx * hw(zs[-1]), sy * hw(zs[-1]), zs[-1]), r * 1.5, "steel", 6)
    for k in range(npanel):
        za, zb = zs[k], zs[k + 1]
        wa, wb = hw(za), hw(zb)
        for (sx, sy), (tx, ty) in zip(legs, [legs[1], legs[3], legs[0], legs[2]]):
            pass
        for a, b in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
            S.cyl((a[0] * wa, a[1] * wa, za), (b[0] * wb, b[1] * wb, zb), r, "steel", 4)
            S.cyl((b[0] * wa, b[1] * wa, za), (a[0] * wb, a[1] * wb, zb), r, "steel", 4)
        for a, b in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
            S.cyl((a[0] * wb, a[1] * wb, zb), (b[0] * wb, b[1] * wb, zb), r * 0.9, "steel", 4)
    # head and earth-wire peak
    top = zs[-1]
    S.cyl((0, 0, top), (0, 0, H), r * 1.6, "steel", 6, r1=r * 0.7)
    # crossarms (along y; conductors hang at the tips, one circuit per side)
    pts = []
    for z, L in arms:
        wz = hw(min(z, top))
        for sgn in (-1, 1):
            S.cyl((0, sgn * wz * 0.4, z), (0, sgn * (L + wz * 0.4), z + 0.0), r * 1.3, "steel", 5)
            S.cyl((0, sgn * (L + wz * 0.4), z), (0, sgn * wz * 0.4, z + 3.0), r * 0.8, "steel", 4)
            S.cyl((0, sgn * (L + wz * 0.4), z), (0, sgn * wz * 0.4, z - 3.0), r * 0.8, "steel", 4)
            tip = (0, sgn * (L + wz * 0.4), z)
            # insulator string: stacked discs
            n = int(insulator / 0.22)
            for i in range(n):
                zz = z - 0.35 - i * 0.22
                S.vcyl((tip[0], tip[1], zz - 0.08), 0.34 * (1 if insulator > 2 else 0.8), 0.1, "ceramic", 10)
            S.cyl((tip[0], tip[1], z), (tip[0], tip[1], z - insulator - 0.5), 0.07, "steel2", 6)
            pts.append((tip[0], tip[1], z - insulator - 0.8))
            # arm marker colour disc
    S.anchor("tower_top", (0, 0, H))
    S.pop()
    return pts


def tower_phase_points(S, pts, rot=0.0):
    """World positions (through the current transform and a rotation about z) of tower-local attachment points."""
    out = []
    Rz = Matrix.Rotation(rot, 4, "Z")
    for p in pts:
        out.append(tuple(S.P(Rz @ Vector(p))))
    return out


def conductors(S, A, B, r=0.22, bundle=4, key="wire", sag=0.035, gap=0.45):
    """Wires between matching attachment points of two towers (lists of world points, S.T must be identity)."""
    for a, b in zip(A, B):
        offs = [(0, 0)] if bundle == 1 else ([(-gap / 2, 0), (gap / 2, 0)] if bundle == 2 else [(-gap / 2, -gap / 2), (gap / 2, -gap / 2), (gap / 2, gap / 2), (-gap / 2, gap / 2)])
        for dy, dz in offs:
            S.span((a[0], a[1] + dy, a[2] + dz), (b[0], b[1] + dy, b[2] + dz), r, key, sag)


def transformer(S, size=(11, 6.5, 8), key="mv", bushings=3, bushing_h=3.0, rad=True, rot=0.0, bushing_key="ceramic", hv_side=1):
    """Power transformer: tank, conservator, radiator banks, three bushings on top."""
    S.push((0, 0, 0), rot)
    sx, sy, sz = size
    S.box((0, 0, 0.7), (sx, sy, sz), key, z0=True)
    S.box((0, 0, 0), (sx + 1.2, sy + 1.2, 0.7), "concrete2", z0=True)
    S.box((0, 0, 0.7 + sz + 0.3), (sx * 0.9, sy * 0.9, 0.5), "steel", z0=True)       # cover
    S.cyl((-sx * 0.3, 0, 0.7 + sz + 1.9), (sx * 0.3, 0, 0.7 + sz + 1.9), 0.9, "steel", 14)   # conservator
    S.box((-sx * 0.3, 0, 0.7 + sz + 0.8), (0.6, 0.6, 1.1), "steel2", z0=False)
    if rad:
        for sgn in (-1, 1):
            for i in range(7):
                x = -sx * 0.4 + i * sx * 0.8 / 6
                S.box((x, sgn * (sy / 2 + 0.7), 1.2), (0.28, 1.0, sz - 1.2), "steel", z0=True)
    for i in range(bushings):
        x = (i - (bushings - 1) / 2) * sx * 0.3
        zb = 0.7 + sz + 0.5
        S.vcyl((x, hv_side * sy * 0.2, zb), 0.45, 0.4, "steel2", 10)
        for j in range(int(bushing_h / 0.28)):
            S.vcyl((x, hv_side * sy * 0.2, zb + 0.4 + j * 0.28), 0.62 if j % 2 == 0 else 0.45, 0.28, bushing_key, 10)
        S.anchor(f"bushing{i}", (x, hv_side * sy * 0.2, zb + 0.4 + bushing_h))
    S.pop()


def gantry(S, width=24.0, h=14.0, bays=1, key="steel", r=0.34, rot=0.0, n_beams=1):
    """Portal frame: lattice posts and a horizontal beam; returns nothing, anchors the top."""
    S.push((0, 0, 0), rot)
    for x in (-width / 2, width / 2):
        for dx, dy in ((-0.5, -0.5), (0.5, -0.5), (0.5, 0.5), (-0.5, 0.5)):
            S.cyl((x + dx, dy, 0), (x + dx * 0.6, dy * 0.6, h), r * 0.7, key, 4)
        for k in range(5):
            z0, z1 = h * k / 5, h * (k + 1) / 5
            S.cyl((x - 0.5, -0.5, z0), (x + 0.5, 0.5, z1), r * 0.4, key, 4)
    for k in range(n_beams):
        S.cyl((-width / 2, 0, h - k * 0.9), (width / 2, 0, h - k * 0.9), r, key, 5)
    S.pop()


def breaker(S, p, key="steel", ceramic="ceramic", rot=0.0, H=4.0):
    S.push(p, rot)
    S.box((0, 0, 0), (2.6, 1.0, 1.4), "concrete2", z0=True)
    S.box((0, 0, 1.4), (0.7, 0.7, 1.4), key, z0=True)
    for x in (-0.9, 0, 0.9):
        S.vcyl((x, 0, 1.4), 0.34, H, ceramic, 8)
    S.pop()


def disconnector(S, p, rot=0.0):
    S.push(p, rot)
    S.vcyl((-0.9, 0, 0), 0.2, 3.2, "steel2", 6)
    S.vcyl((0.9, 0, 0), 0.2, 3.2, "steel2", 6)
    S.cyl((-0.9, 0, 3.2), (0.9, 0, 3.8), 0.14, "steel", 5)
    S.pop()


def building(S, c, size, key="concrete", roof=True, rot=0.0, windows=True, roof_key="roof", hroof=1.5):
    S.push(c, rot)
    sx, sy, sz = size
    S.box((0, 0, 0), size, key, z0=True)
    if roof:
        S.prism_roof((0, 0, sz), (sx + 0.8, sy + 0.8), hroof, roof_key)
    if windows:
        for i in range(max(1, int(sx // 4))):
            x = -sx / 2 + 2 + i * 4
            if abs(x) < sx / 2 - 1:
                S.box((x, -sy / 2 - 0.02, sz * 0.55), (1.6, 0.06, 1.6), "glass")
    S.pop()


def cooling_tower(S, c, H=120.0, rb=46.0, rt=28.0):
    zt, rthr = H * 0.72, rt * 0.93
    prof = []
    for i in range(25):
        z = H * i / 24
        r = math.sqrt(rthr ** 2 + ((rb ** 2 - rthr ** 2) / zt ** 2) * (z - zt) ** 2) if z < zt else rthr + (rt - rthr) * ((z - zt) / (H - zt)) ** 1.4
        prof.append((r, z))
    S.lathe(prof, "concrete", c, 56)
    S.lathe([(rt - 0.1, H - 0.2), (rt * 0.96, H - 0.2), (rt * 0.96, H - 2.5)], "concrete2", c, 56)


def plume(S, c, R=22.0, seed=3):
    rnd = random.Random(seed)
    for i in range(46):
        a = rnd.uniform(0, 2 * math.pi)
        d = rnd.uniform(0, R * 0.55) * (0.35 + 0.65 * i / 46)
        z = i * R * 0.075 + rnd.uniform(-1, 1)
        r = R * (0.32 + 0.5 * math.sin(math.pi * (i + 4) / 56)) * rnd.uniform(0.7, 1.1)
        S.sphere((c[0] + d * math.cos(a) + z * 0.42, c[1] + d * math.sin(a), c[2] + z), r, "plume", 14)


def wind_turbine(S, c, H=80.0, rot=0.0, blade=48.0, yaw=0.0, spin=0.3):
    S.push(c, rot)
    S.cyl((0, 0, 0), (0, 0, H), 2.2, "turb", 18, r1=1.3)
    S.vcyl((0, 0, 0), 3.2, 1.2, "concrete2", 18)
    S.box((-1.2, 0, H + 1.7), (8.0, 3.4, 3.6), "turb")
    S.cyl((3.0, 0, H + 1.7), (5.2, 0, H + 1.7), 1.7, "turb", 14, r1=0.2)
    for k in range(3):
        a = spin + k * 2 * math.pi / 3
        tip = (4.8, blade * math.sin(a), H + 1.7 + blade * math.cos(a))
        mid = (4.8, 0.4 * blade * math.sin(a), H + 1.7 + 0.4 * blade * math.cos(a))
        S.cyl((4.8, 0, H + 1.7), mid, 1.3, "turb", 8, r1=0.9)
        S.cyl(mid, tip, 0.9, "turb", 8, r1=0.18)
    S.anchor("hub", (4.8, 0, H + 1.7))
    S.pop()


def pv_row(S, c, n, w=4.2, d=2.2, gap=3.8, rot=0.0, tilt=0.5):
    S.push(c, rot)
    for i in range(n):
        y = i * gap
        S.push((0, y, 0.0), 0.0)
        bm = S._bm("panel")
        # tilted rectangle with thickness: a box rotated about x
        M = S.T @ Matrix.Translation((0, 0, 1.2)) @ Matrix.Rotation(tilt, 4, "X") @ Matrix.Diagonal((w, d, 0.1, 1))
        bmesh.ops.create_cube(bm, size=1.0, matrix=M)
        S.cyl((-w * 0.35, 0, 0), (-w * 0.35, 0, 1.2), 0.06, "steel", 4)
        S.cyl((w * 0.35, 0, 0), (w * 0.35, 0, 1.2), 0.06, "steel", 4)
        S.pop()
    S.pop()


def house(S, c, size=(9.0, 7.0, 5.5), rot=0.0, roof_key="roof", hroof=3.4, chimney=False):
    S.push(c, rot)
    sx, sy, sz = size
    S.box((0, 0, 0), size, "wall", z0=True)
    S.prism_roof((0, 0, sz), (sx + 1.0, sy + 1.0), hroof, roof_key)
    S.box((-sx / 2 - 0.02, 0, 0.0), (0.08, 1.2, 2.4), "dark", z0=True)
    for y in (-2.2, 2.2):
        S.box((-sx / 2 - 0.02, y, 2.0), (0.08, 1.3, 1.5), "glass")
        S.box((0, -sy / 2 - 0.02 if y < 0 else sy / 2 + 0.02, 2.0), (1.5, 0.08, 1.5), "glass")
    if chimney:
        S.box((sx * 0.25, 0, sz + 1.5), (0.9, 0.9, 3.0), "concrete2", z0=True)
    S.pop()


def pole(S, p, H=11.0, key="wood"):
    S.vcyl((p[0], p[1], 0), 0.22, H, key, 8)


def tree(S, p, h=7.0, seed=0):
    rnd = random.Random(int(p[0] * 7 + p[1] * 13 + seed))
    s = rnd.uniform(0.8, 1.2)
    S.vcyl((p[0], p[1], 0), 0.35 * s, 2.2 * s, "wood", 6)
    S.sphere((p[0], p[1], 2.2 * s + h * 0.35 * s), h * 0.42 * s, "#8FB27A", 8)
    S.sphere((p[0] + 0.5 * s, p[1] + 0.3, 2.2 * s + h * 0.62 * s), h * 0.3 * s, "#9CC084", 8)


# ---------------------------------------------------------------------------------------------
# render plumbing
def setup(res, samples, ortho, az=-45.0, el=32.0, target=(0, 0, 8), dist=900.0, sun=(-0.5, -0.35)):
    sc = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    _mats.clear()
    sc.render.engine = "CYCLES"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = not bool(__import__("os").environ.get("NODENOISE"))
    sc.cycles.device = "CPU"
    sc.render.threads = 8
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.render.film_transparent = False
    w = bpy.data.worlds.new("w") if not sc.world else sc.world
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (1, 1, 1, 1)
    bg.inputs[1].default_value = 1.0
    # sun: soft, from the upper left front
    sun_d = bpy.data.lights.new("sun", "SUN")
    sun_d.energy = 2.0
    sun_d.angle = math.radians(6)
    sun_o = bpy.data.objects.new("sun", sun_d)
    bpy.context.scene.collection.objects.link(sun_o)
    sun_o.rotation_euler = (math.radians(48), math.radians(8), math.radians(az + 205))
    cam_d = bpy.data.cameras.new("cam")
    cam_d.type = "ORTHO"
    cam_d.ortho_scale = ortho
    cam_d.clip_end = 5000
    cam = bpy.data.objects.new("cam", cam_d)
    bpy.context.scene.collection.objects.link(cam)
    azr, elr = math.radians(az), math.radians(el)
    t = Vector(target)
    cam.location = t + Vector((dist * math.cos(elr) * math.sin(azr) * -1, dist * math.cos(elr) * math.cos(azr), dist * math.sin(elr)))
    cam.location = t + Vector((dist * math.cos(elr) * math.cos(math.radians(az)), dist * math.cos(elr) * math.sin(math.radians(az)), dist * math.sin(elr)))
    direction = t - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam
    return cam


def finish(name, S, cam):
    S.commit()
    sc = bpy.context.scene
    bpy.context.view_layer.update()
    OUT.mkdir(parents=True, exist_ok=True)
    W, H = sc.render.resolution_x, sc.render.resolution_y
    px = {}
    for k, p in S.anchors.items():
        v = world_to_camera_view(sc, cam, Vector(p))
        px[k] = [round(v.x * W, 1), round((1 - v.y) * H, 1)]
    (OUT / f"{name}.json").write_text(json.dumps(px, indent=1))
    sc.render.filepath = str(OUT / f"{name}.png")
    bpy.ops.render.render(write_still=True)
    print("rendered", name)


# ---------------------------------------------------------------------------------------------
# scenes: each returns after rendering
def scene_plant(res, samples):
    S = Scene()
    slab(S, -230, 190, -150, 150)
    # roads, grass patches
    S.box((20, -118, 0.03), (360, 9, 0.05), "road")
    cooling_tower(S, (-150, 70, 0))
    plume(S, (-150, 70, 118), R=26)
    S.anchor("cooling", (-130, 36, 40))
    building(S, (-62, 72, 0), (60, 46, 62), "concrete", roof=False, windows=False)
    S.box((-62, 49, 40), (60, 0.4, 6), "steel2")
    # chimney
    S.lathe([(5.2, 0), (4.3, 80), (3.6, 120), ], "concrete", (-62, 110, 0), 24)
    for z in (118, 108):
        S.vcyl((-62, 110, z), 3.65 - (118 - z) * 0.02, 3.0, "lv", 24)
    S.anchor("boiler", (-62, 49, 45))
    # turbine hall: open from the front and top, so the turbine train shows
    hx, hy = -62, 8
    S.box((hx, hy, 0), (64, 30, 0.5), "concrete2", z0=True)
    S.box((hx, hy + 15, 0), (64, 0.8, 22), "concrete", z0=True)
    S.box((hx - 32, hy, 0), (0.8, 30, 22), "concrete", z0=True)
    S.box((hx, hy - 15, 0), (64, 0.5, 2.4), "concrete", z0=True)
    for i in range(7):
        S.box((hx - 30 + i * 10, hy, 21), (0.8, 30, 0.8), "steel", z0=True)
    # turbine train along x: HP, IP, two LP, generator
    zc = 7.0
    xs = hx - 28
    for rr, ll in ((2.0, 6), (2.6, 7), (4.2, 8), (4.2, 8)):
        S.cyl((xs, hy, zc), (xs + ll, hy, zc), rr, "steel2", 22)
        S.cyl((xs + ll, hy, zc), (xs + ll + 1.5, hy, zc), 1.0, "dark", 10)
        xs += ll + 1.5
    S.cyl((xs, hy, zc), (xs + 15, hy, zc), 3.6, "lv", 28)          # generator
    S.anchor("generator", (xs + 7, hy, zc + 3.6))
    gx = xs + 15
    S.box((hx, hy, 2.2), (60, 4.5, 4.4), "concrete2", z0=False)       # pedestal
    # busbar duct from generator to transformer (21 kV)
    S.box(((gx + 14), hy, 4.5), (25, 2.2, 2.0), "ehv")
    S.anchor("duct", (gx + 14, hy, 5.8))
    # generator transformer and switchyard
    S.push((gx + 30, hy, 0))
    transformer(S, (12, 7.5, 9), key="ehv", bushing_h=3.4, bushing_key="ceramic")
    S.pop()
    S.anchor("transformer", (gx + 30, hy, 14))
    S.push((gx + 62, hy, 0), math.pi / 2)
    gantry(S, width=30, h=17, n_beams=2)
    S.pop()
    S.push((gx + 62, hy + 28, 0))
    breaker(S, (0, 0, 0), rot=math.pi / 2)
    S.pop()
    # three conductors from the transformer bushings to the gantry, a 380 kV tower at the edge
    bz = 0.7 + 9 + 0.5 + 0.4 + 3.4
    bx = gx + 30
    ph = [(bx, hy + 7.5 * 0.2 + dy, bz) for dy in (-3.6, 0, 3.6)]
    g = [(gx + 62, hy + dy, 17) for dy in (-3.6, 0, 3.6)]
    for a, b in zip(ph, g):
        S.span(a, b, 0.18, "wire", 0.03)
    # outgoing line to the first pylon
    S.push((gx + 100, hy - 3, 0))
    pts = lattice_tower(S, H=60, w0=8, w1=2.2, arms=((40, 12), (48, 10), (56, 8)), rot=0.0)
    S.pop()
    tw = [(gx + 100 + p[0], hy - 3 + p[1], p[2]) for p in pts]
    for k, a in enumerate(g):
        b = tw[[2, 3, 0, 1, 4, 5][k]]
    for k in range(3):
        a = (gx + 62, hy + (-3.6, 0, 3.6)[k], 17)
        S.span(a, tw[(1, 3, 5)[k]], 0.2, "wire", 0.04)
    S.anchor("pylon", (gx + 100, hy - 3, 60))
    for p in ((-190, 120), (-185, -60), (120, 110), (150, -90), (60, 130)):
        tree(S, p)
    cam = setup(res, samples, ortho=450, target=(-30, 12, 62), az=-42, el=30)
    finish("plant", S, cam)


def scene_line(res, samples):
    """380 kV: five lattice towers along a gentle curve, fields below."""
    S = Scene()
    slab(S, -140, 140, -330, 330, depth=14)
    rnd = random.Random(2)
    for i, (y, c) in enumerate(zip(range(-300, 300, 60), ("field1", "field2", "field1", "grass", "field2", "field1", "field2", "grass", "field1", "field2"))):
        S.box((-70 if i % 2 else 78, y + 30, 0.04), (110 if i % 2 else 90, 56, 0.06), c)
    S.box((-30, 0, 0.05), (7, 660, 0.06), "road")
    xs = [(-60, y) for y in (-250, -80, 90, 260)]
    # attachment points of the three crossarm levels on both sides, tower-local then through the turn
    towers = []
    for (x, y) in xs:
        S.push((x, y, 0), math.pi / 2)
        loc = []
        for z, L in ((40, 12.5), (49, 10.5), (58, 8.5)):
            for sgn in (-1, 1):
                wz = 9.5 + (2.4 - 9.5) * min(1, z / (64 * 0.78))
                loc.append(S.P((0, sgn * (L + wz * 0.4), z - 4.4 - 0.8)))
        towers.append([tuple(p) for p in loc])
        S.pop()
    for a, b in zip(towers[:-1], towers[1:]):
        conductors(S, a, b, r=0.28, bundle=4, sag=0.032, gap=0.7)
    # earth wire between peaks
    for a, b in zip(xs[:-1], xs[1:]):
        S.span((a[0], a[1], 64), (b[0], b[1], 64), 0.2, "wire", 0.025)
    S.push((xs[1][0], xs[1][1], 0), math.pi / 2)
    S.anchor("tower", (0, 0, 64))
    S.anchor("bundle", (0, 20.0, 49 - 4.4 - 0.8))
    S.anchor("insulators", (0, -22.0, 49 - 3))
    S.pop()
    S.anchor("span", ((xs[1][0] + xs[2][0]) / 2, (xs[1][1] + xs[2][1]) / 2, 40))
    for p in ((-110, -280), (-120, -120), (110, -300), (100, 20), (-115, 200), (118, 230), (115, -150), (-100, 300)):
        tree(S, p)
    cam = setup(res, samples, ortho=520, target=(-30, 0, 30), az=-35, el=30)
    finish("line", S, cam)


def scene_sub380(res, samples):
    S = Scene()
    slab(S, -140, 140, -110, 110)
    S.box((0, -96, 0.05), (280, 10, 0.06), "road")
    # gravel yard
    S.box((0, 0, 0.04), (170, 120, 0.06), "concrete2")
    # incoming 380 kV tower (left) with three gantry bays
    S.push((-122, 0, 0), math.pi / 2)
    pts = lattice_tower(S, H=58, w0=8, w1=2.2, arms=((38, 11.5), (46, 9.5), (54, 7.5)), r=0.42)
    S.pop()
    arm_pts = []
    for z, L in ((38, 11.5), (46, 9.5), (54, 7.5)):
        for sgn in (-1, 1):
            wz = 8 + (2.2 - 8) * min(1, z / (58 * 0.78))
            arm_pts.append((-122, sgn * (L + wz * 0.4), z - 4.0 - 0.8))
    S.anchor("tower_in", (-122, 0, 58))
    # 380 kV bays: gantries with busbar, breakers and disconnectors in rows
    for i, x in enumerate((-85, -60)):
        S.push((x, 0, 0), math.pi / 2)
        gantry(S, width=76, h=19, n_beams=1)
        S.pop()
    # busbar: three phases above the gantries
    for dx in (-2.4, 0, 2.4):
        S.cyl((-85 + dx, -34, 17), (-85 + dx, 34, 17), 0.35, "steel", 6)
    for dx in (-2.4, 0, 2.4):
        S.cyl((-60 + dx, -34, 17), (-60 + dx, 34, 17), 0.35, "steel", 6)
    for y in (-26, -9, 9, 26):
        breaker(S, (-72, y, 0), rot=math.pi / 2, H=5.0)
        disconnector(S, (-72, y + 4.5, 0))
        S.cyl((-72, y, 6.8), (-60, y, 17), 0.16, "wire", 5)
    # two 380/110 kV transformers
    for y in (-30, 24):
        S.push((-26, y, 0))
        transformer(S, (13, 8, 10), key="hv", bushing_h=3.6, rot=math.pi / 2)
        S.pop()
        S.span((-60, y, 17), (-26, y, 19), 0.18, "wire", 0.03)
        S.push((18, y, 0))
        S.pop()
    S.anchor("trafo380", (-26, -30, 17))
    S.anchor("busbar", (-85, 0, 17))
    # 110 kV side: lower gantry and line to a 110 kV pylon
    S.push((8, 0, 0), math.pi / 2)
    gantry(S, width=70, h=11, n_beams=1)
    S.pop()
    for y in (-30, 24):
        S.span((-26, y, 15), (8, y, 11), 0.14, "wire", 0.02)
        for dx in (-2.0, 0, 2.0):
            pass
    for dx in (-1.8, 0, 1.8):
        S.cyl((8 + dx, -32, 10), (8 + dx, 32, 10), 0.3, "steel", 6)
    S.anchor("busbar110", (8, 0, 10))
    # control building and a small shed
    building(S, (60, -52, 0), (24, 12, 6.5), roof=True, hroof=1.8)
    building(S, (60, 30, 0), (16, 9, 4.5), roof=True, hroof=1.4)
    S.anchor("control", (60, -52, 9))
    # outgoing 110 kV pole line (steel mast)
    S.push((118, 0, 0), math.pi / 2)
    pts = lattice_tower(S, H=32, w0=3.6, w1=1.2, arms=((20, 5.5), (25, 4.5), (30, 3.5)), r=0.22, insulator=1.6)
    S.pop()
    S.anchor("mast110", (118, 0, 32))
    for k, (z, L) in enumerate(((20, 5.5), (25, 4.5), (30, 3.5))):
        for sgn in (-1, 1):
            a = (8 + 0, sgn * 10 + 0, 10)
    for sgn, y0 in ((0, -8), (1, 0), (2, 8)):
        pass
    for z, L, y in ((20, 5.5, -9), (25, 4.5, 0), (30, 3.5, 9)):
        S.span((8, y, 10.2), (118, y * 0.4 + (0 if y == 0 else (-1 if y < 0 else 1) * (L - 0.5)), z - 1.8), 0.14, "wire", 0.01)
    for p in ((-130, 100), (-110, -100), (125, 90), (100, -95), (-40, 95), (30, 100), (130, -60)):
        tree(S, p)
    # lines leaving to the left: the 380 kV spans
    for z, L, y in ((38, 11.5, 0),):
        pass
    for a in arm_pts:
        S.span((a[0], a[1], a[2]), (-136, a[1] * 1.0, a[2] - 4), 0.2, "wire", 0.02)
    cam = setup(res, samples, ortho=330, target=(0, 0, 8), az=-40, el=32)
    finish("sub380", S, cam)


def scene_sub110(res, samples):
    S = Scene()
    slab(S, -130, 130, -100, 100)
    S.box((0, -88, 0.05), (260, 9, 0.06), "road")
    S.box((-35, -10, 0.04), (110, 80, 0.06), "concrete2")
    # 110 kV mast from the left, gantry, transformer, 20 kV switchgear hall
    S.push((-112, -10, 0), math.pi / 2)
    lattice_tower(S, H=32, w0=3.6, w1=1.2, arms=((20, 5.5), (25, 4.5), (30, 3.5)), r=0.22, insulator=1.6)
    S.pop()
    S.anchor("mast110", (-112, -10, 32))
    S.push((-64, -10, 0), math.pi / 2)
    gantry(S, width=34, h=11, n_beams=1)
    S.pop()
    for y in (-18, -10, -2):
        S.span((-112, -10 + (y + 10) * 0.35, 24), (-64, y, 11.2), 0.14, "wire", 0.01)
    # trafo 110/20
    for y in (-22, 2):
        S.push((-34, y, 0))
        transformer(S, (9, 5.5, 7), key="mv", bushing_h=2.4, rot=math.pi / 2)
        S.pop()
        S.span((-64, y + 0.0, 11), (-34, y, 13.4), 0.14, "wire", 0.02)
    S.anchor("trafo110", (-34, -22, 14))
    # 20 kV switchgear hall
    building(S, (4, -10, 0), (22, 11, 6), key="concrete", roof=True, hroof=1.4)
    S.anchor("switchgear", (4, -10, 8))
    for y in (-22, 2):
        S.cyl((-34, y, 11.5), (4 - 11, y * 0.5 - 5, 5), 0.12, "mv", 5)
    # 20 kV feeders: underground cables (open trench with tubes) running right
    S.box((60, -10, -1.1), (110, 4.0, 0.3), "sand")
    for k, dy in enumerate((-1.2, 0.0, 1.2)):
        S.tube([(4 + 11, -10 + dy, -0.7), (100, -10 + dy, -0.7), (115, -10 + dy + 14 * (k - 1), -0.7)], 0.45, "mv")
    S.anchor("cable20", (60, -10, -0.5))
    # a 20 kV feeder rising to a wind turbine and a PV park
    wind_turbine(S, (88, 48, 0), H=75, blade=42, spin=0.5)
    S.anchor("wind", (88, 48, 78))
    S.tube([(100, -10, -0.7), (88, 40, -0.7), (88, 48, 0.0), (88, 48, 3)], 0.4, "mv")
    for j in range(4):
        pv_row(S, (-92 + j * 23, 52, 0), 4, w=19, d=2.6, gap=4.4, rot=0.0, tilt=0.55)
    S.anchor("pv", (-60, 62, 2))
    for p in ((-120, 90), (120, -85), (-105, -88), (115, 90), (50, -80)):
        tree(S, p)
    cam = setup(res, samples, ortho=330, target=(-5, 5, 8), az=-35, el=33)
    finish("sub110", S, cam)


def scene_village(res, samples):
    """The street with its cable trench opened (vertical exaggeration): 20 kV in, the 0.4 kV station, 0.4 kV out to the houses."""
    S = Scene()
    x0, x1, y0, y1 = -64, 64, -48, 48
    tw, zb, ty = 6.0, -2.6, 8.0                            # trench width, floor, street axis
    xa, xb = -64, 34                                       # open stretch
    hz = -zb
    S.box((0, 0, zb - 7.0), (x1 - x0, y1 - y0, 14), "soil")
    for ya, yb in ((y0, ty - tw / 2), (ty + tw / 2, y1)):
        S.box((0, (ya + yb) / 2, zb + hz / 2), (x1 - x0, yb - ya, hz), "soil2")
        S.box((0, (ya + yb) / 2, 0.01), (x1 - x0, yb - ya, 0.04), "grass")
    S.box(((xb + x1) / 2, ty, zb + hz / 2), (x1 - xb, tw, hz), "soil2")
    S.box(((xb + x1) / 2, ty, 0.01), (x1 - xb, tw, 0.04), "grass")
    S.box(((xa + xb) / 2, ty, zb + 0.15), (xb - xa, tw, 0.3), "soil2")
    S.box(((xa + xb) / 2, ty, zb + 0.5), (xb - xa, tw * 0.75, 0.6), "sand")
    zc = zb + 1.5
    # 20 kV cable in from the left, up into the station
    sx, sy = -22.0, 19.0
    S.tube([(xa, ty - 1.0, zc), (sx - 1.2, ty - 1.0, zc), (sx - 1.2, ty - 1.0, -0.2), (sx - 1.2, sy - 1.5, -0.2), (sx - 1.2, sy - 1.5, 2.0)], 0.95, "mv")
    S.anchor("cable_mv", (-48, ty - 1.0, zc))
    # the station
    S.push((sx, sy, 0), 0.0, 1.7)
    S.box((0, 0, 0), (4.6, 3.4, 3.4), "concrete", z0=True)
    S.prism_roof((0, 0, 3.4), (5.2, 4.0), 1.0, "concrete2")
    S.box((0, -1.72, 0), (1.6, 0.08, 2.4), "dark", z0=True)
    S.box((0, -1.77, 2.7), (1.0, 0.04, 0.5), "lv")
    S.pop()
    S.anchor("station", (sx, sy, 8.5))
    # 0.4 kV cable out of the station, along the trench; branches to the houses just under the surface
    S.tube([(sx + 1.2, sy - 1.5, 2.0), (sx + 1.2, sy - 1.5, -0.2), (sx + 1.2, ty + 0.6, -0.2), (sx + 1.2, ty + 0.6, zc), (xb, ty + 0.6, zc)], 0.75, "lv")
    S.anchor("cable_lv", (12, ty + 0.6, zc))
    north = (-44, -12, 20, 48)
    south = (-44, -14, 16, 44)
    for i, x in enumerate(north):
        house(S, (x, 38, 0), size=(11, 8, 5.5), rot=math.pi / 2, roof_key="roof" if i % 2 == 0 else "#7A4A38")
    for i, x in enumerate(south):
        house(S, (x, -28, 0), size=(10, 8, 5.2), rot=-math.pi / 2, roof_key="#7A4A38" if i % 2 == 0 else "roof")
    for x in (12, 20, 28):
        S.tube([(x, ty + 0.6, zc), (x, ty + 0.6, -0.15), (x, 33, -0.15)], 0.42, "lv")
    S.anchor("house", (20, 38, 11))
    S.anchor("branch", (20, 22, 0.3))
    for p in ((-58, 40), (58, 42), (-58, -40), (58, -40), (-6, 44), (0, -42), (30, -44)):
        tree(S, p, h=6.5)
    for x in (-52, -8, 30):
        pole(S, (x, ty - 4.2), 7.0, "steel")
    cam = setup(res, samples, ortho=140, target=(-10, 10, 0), az=-40, el=36)
    finish("village", S, cam)


def scene_house(res, samples):
    """A sectioned house: service cable, entry box, meter, fuses, wall, socket, lamp."""
    S = Scene()
    W, D = 14.0, 10.0
    S.box((0, 0, -7.4), (30, 24, 14), "soil")
    S.box((0, 0, -0.2), (30, 24, 0.4), "grass")
    # house walls: floor, back and left wall full height, the other two cut away
    wt = 0.5
    zH = 7.0
    S.box((0, 0, 0), (W, D, 0.5), "concrete2", z0=True)                       # slab
    S.box((0, D / 2 - wt / 2, 0.5), (W, wt, zH), "wall", z0=True)                       # back wall
    S.box((-W / 2 + wt / 2, -wt / 2, 0.5), (wt, D - wt, zH), "wall", z0=True)           # left wall
    S.box((W / 2 - wt / 2, 0, 0.5), (wt, D - 2 * wt, 0.9), "wall", z0=True)             # right wall stub
    S.box((wt / 2, -D / 2 + wt / 2, 0.5), (W - wt, wt, 0.9), "wall", z0=True)           # front wall stub
    # window openings on the back wall
    S.box((2.2, D / 2 - wt / 2 + 0.02, 3.4), (3.0, wt + 0.05, 2.4), "glass")
    S.box((-3.4, D / 2 - wt / 2 + 0.02, 3.4), (2.4, wt + 0.05, 2.4), "glass")
    # service cable from the street, underground, then up through the wall to the entry box (Hausanschlusskasten)
    zc = -1.0
    S.cyl((-W / 2 + 0.9, -12.0, zc), (-W / 2 + 0.9, -2.5, zc), 0.3, "lv", 14)
    S.cyl((-W / 2 + 0.9, -2.5, zc), (-W / 2 + 0.9, -2.5, 1.8), 0.3, "lv", 14)
    S.anchor("service", (-W / 2 + 0.9, -12.0, zc))
    # entry box
    S.box((-W / 2 + 0.9, -2.5, 1.7), (0.5, 1.6, 2.0), "steel", z0=False)
    S.anchor("entry", (-W / 2 + 0.9, -2.5, 3.0))
    # meter cabinet on the left wall: meter, then fuse board
    S.box((-W / 2 + 0.9, 1.4, 3.2), (0.4, 3.6, 4.6), "white")
    S.box((-W / 2 + 1.2, 0.4, 4.2), (0.2, 1.5, 1.6), "dark")
    S.box((-W / 2 + 1.32, 0.4, 4.2), (0.06, 1.2, 1.2), "glass")
    S.box((-W / 2 + 1.34, 0.4, 4.5), (0.04, 0.9, 0.35), "#E2ECF2")
    S.anchor("meter", (-W / 2 + 1.4, 0.4, 5.3))
    for k in range(6):
        S.box((-W / 2 + 1.2, 2.1 + 0.0 + (k % 3) * 0.42, 2.4 + (k // 3) * 1.0), (0.22, 0.34, 0.8), "lv" if k % 2 == 0 else "white")
    S.anchor("fuses", (-W / 2 + 1.3, 2.7, 3.8))
    S.cyl((-W / 2 + 0.7, -1.8, 2.2), (-W / 2 + 0.7, 0.0, 2.2), 0.12, "lv", 6)
    S.cyl((-W / 2 + 0.7, 1.2, 4.6), (-W / 2 + 0.7, 1.2, 5.4), 0.12, "lv", 6)
    # cable in the wall to a socket on the back wall, with a lamp plugged in
    S.tube([(-W / 2 + 0.6, 2.7, 4.8), (-W / 2 + 0.6, 2.7, 6.3), (-W / 2 + 0.6, 4.0, 6.3), (-6.0, D / 2 - 0.2, 6.3)], 0.1, "lv")
    S.tube([(-6.0, D / 2 - 0.2, 6.3), (-6.0, D / 2 - 0.2, 1.7)], 0.1, "lv")
    S.box((-6.0, D / 2 - 0.25, 1.4), (0.9, 0.12, 0.9), "white")
    S.box((-6.0, D / 2 - 0.34, 1.4), (0.14, 0.05, 0.28), "dark")
    S.anchor("socket", (-6.0, D / 2 - 0.4, 1.8))
    # plug and flex to a floor lamp
    S.box((-6.0, D / 2 - 0.9, 1.4), (0.5, 0.9, 0.6), "dark")
    S.tube([(-6.0, D / 2 - 1.2, 1.1), (-5.0, D / 2 - 2.5, 0.65), (1.5, D / 2 - 3.0, 0.62)], 0.07, "dark")
    S.vcyl((1.5, D / 2 - 3.0, 0.5), 0.9, 0.35, "dark", 14)
    S.vcyl((1.5, D / 2 - 3.0, 0.8), 0.08, 5.2, "steel", 8)
    S.cyl((1.5, D / 2 - 3.0, 6.0), (1.5, D / 2 - 3.0, 7.6), 1.5, "#FFE7A8", 16, r1=0.8)
    S.anchor("lamp", (1.5, D / 2 - 3.0, 7.6))
    S.anchor("wall", (-W / 2, 5.5, 5.4))
    # a roof, lifted and tilted away (only a hint): ridge beam stubs
    # outside: station pole stub, tree
    for p in ((12, -9), (-12, 9), (11, 9)):
        tree(S, p, h=5.5)
    cam = setup(res, samples, ortho=36, target=(-2, 0, 2.5), az=-38, el=33)
    finish("house", S, cam)


def scene_overview(res, samples):
    """The whole chain along one line, left to right: plant, 380 kV line, 380/110 kV substation, 110 kV line,
    110/20 kV substation with wind and solar, 20 kV cable, village transformer, houses. Not to scale."""
    S = Scene()
    slab(S, -60, 1060, -130, 130, depth=16)
    for i in range(18):
        S.box((40 + i * 58, (-1) ** i * 88, 0.05), (48, 70, 0.05), "field1" if i % 3 else "field2")
    # 1 power plant
    S.push((10, 0, 0), 0.0, 0.62)
    cooling_tower(S, (-30, 70, 0), H=110, rb=40, rt=25)
    plume(S, (-30, 70, 108), R=20, seed=5)
    building(S, (50, 80, 0), (50, 40, 55), "concrete", roof=False, windows=False)
    S.lathe([(5, 0), (3.5, 105)], "concrete", (50, 118, 0), 20)
    building(S, (30, 12, 0), (56, 26, 20), "concrete", roof=False, windows=False)
    S.push((88, 12, 0))
    transformer(S, (12, 7.5, 9), key="ehv", bushing_h=3.4)
    S.pop()
    S.pop()
    S.anchor("plant", (20, 40, 80))
    # 2 380 kV towers
    xs = [150, 270, 390]
    tw = []
    for x in xs:
        S.push((x, 0, 0), math.pi / 2, 1.25)
        lattice_tower(S, H=64, w0=9.5, w1=2.4, arms=((40, 12.5), (49, 10.5), (58, 8.5)), r=0.5, insulator=4.4)
        loc = []
        for z, Lr in ((40, 12.5), (49, 10.5), (58, 8.5)):
            for sgn in (-1, 1):
                wz = 9.5 + (2.4 - 9.5) * min(1, z / (64 * 0.78))
                loc.append(tuple(S.P((0, sgn * (Lr + wz * 0.4), z - 5.2))))
        tw.append(loc)
        S.pop()
    for a_, b_ in zip(tw[:-1], tw[1:]):
        conductors(S, a_, b_, r=0.4, bundle=2, sag=0.03, gap=0.9)
    S.anchor("line380", (270, 0, 82))
    # plant transformer to the first tower, last tower to the substation gantry
    S.span((100, 6, 14), (tw[0][1][0], tw[0][1][1], tw[0][1][2]), 0.3, "wire", 0.02)
    # 3 substation 380/110 kV
    S.push((470, 0, 0), 0.0, 1.0)
    S.push((0, 0, 0), math.pi / 2)
    gantry(S, width=70, h=21, n_beams=1)
    S.pop()
    for y in (-20, 20):
        S.push((34, y, 0), 0.0, 1.0)
        transformer(S, (13, 8, 10), key="hv", bushing_h=3.6, rot=math.pi / 2)
        S.pop()
    S.push((62, 0, 0), math.pi / 2)
    gantry(S, width=66, h=13, n_beams=1)
    S.pop()
    S.pop()
    S.anchor("sub380", (505, 0, 34))
    for k, loc in enumerate(tw[-1][:3]):
        S.span(loc, (470, (-8, 0, 8)[k], 21), 0.3, "wire", 0.02)
    # 4 110 kV masts
    mp = []
    for x in (590, 660, 730):
        S.push((x, 0, 0), math.pi / 2, 1.6)
        lattice_tower(S, H=32, w0=3.6, w1=1.2, arms=((20, 5.5), (25, 4.5), (30, 3.5)), r=0.3, insulator=1.6)
        loc = []
        for z, Lr in ((20, 5.5), (25, 4.5), (30, 3.5)):
            for sgn in (-1, 1):
                wz = 3.6 + (1.2 - 3.6) * min(1, z / (32 * 0.78))
                loc.append(tuple(S.P((0, sgn * (Lr + wz * 0.4), z - 2.4))))
        mp.append(loc)
        S.pop()
    for a_, b_ in zip(mp[:-1], mp[1:]):
        conductors(S, a_, b_, r=0.22, bundle=1, sag=0.02)
    for k in range(3):
        S.span((532, (-8, 0, 8)[k], 13), mp[0][k * 2 + (0, 1, 0)[k]], 0.22, "wire", 0.02)
    S.anchor("line110", (660, 0, 56))
    # 5 substation 110/20 kV with a wind turbine and a PV park feeding in
    S.push((820, 0, 0), 0.0, 1.5)
    transformer(S, (9, 5.5, 7), key="mv", bushing_h=2.4, rot=math.pi / 2)
    building(S, (22, 0, 0), (22, 11, 6), "concrete", roof=True, hroof=1.4)
    S.pop()
    S.anchor("sub110", (830, 0, 30))
    for k in range(3):
        S.span(mp[-1][k * 2 + (0, 1, 0)[k]], (806, (-4, 0, 4)[k], 17), 0.18, "wire", 0.02)
    wind_turbine(S, (800, 95, 0), H=75, blade=42, spin=0.6)
    wind_turbine(S, (860, -100, 0), H=75, blade=42, spin=0.1)
    S.anchor("wind", (800, 95, 82))
    for j in range(3):
        pv_row(S, (700 + j * 26, 60, 0), 3, w=20, d=2.8, gap=5, rot=0.0, tilt=0.5)
    S.anchor("pv", (714, 74, 6))
    # 6 the village: transformer station, street, houses; 20 kV and 0.4 kV routes laid on the ground
    for i, x in enumerate((900, 935, 970, 1005)):
        house(S, (x, 30, 0), size=(12, 9, 6), rot=math.pi / 2, roof_key="roof" if i % 2 == 0 else "#7A4A38")
        house(S, (x + 12, -32, 0), size=(11, 9, 5.6), rot=-math.pi / 2, roof_key="#7A4A38" if i % 2 == 0 else "roof")
    S.box((960, 0, 0.04), (150, 14, 0.06), "road")
    S.box((885, 8, 0), (6.5, 5, 4.5), "concrete", z0=True)
    S.prism_roof((885, 8, 4.5), (7.2, 5.8), 1.4, "concrete2")
    S.anchor("station", (885, 8, 8))
    S.anchor("house", (970, 30, 13))
    def route(pts, key, r=1.3):
        S.curves.append(([(p[0], p[1], 0.9) for p in pts], r, key + ":solid"))
    route([(855, 0), (870, 8), (881, 8)], "mv")
    route([(888, 8), (900, 8), (1010, 8)], "lv")
    for x in (900, 935, 970, 1005):
        route([(x, 8), (x, 22)], "lv", 0.9)
        route([(x + 12, 8), (x + 12, -22)], "lv", 0.9)
    rnd = random.Random(5)
    for _ in range(44):
        p = (rnd.uniform(0, 1040), rnd.choice([-1, 1]) * rnd.uniform(112, 126))
        tree(S, p, h=9)
    cam = setup(res, samples, ortho=1190, target=(500, 0, 14), az=-72, el=27, dist=3000)
    finish("overview", S, cam)


SCENES = {"plant": scene_plant, "line": scene_line, "sub380": scene_sub380, "sub110": scene_sub110, "village": scene_village,
          "house": scene_house, "overview": scene_overview}

if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    res, samples, names = (1600, 1000), 48, []
    i = 0
    while i < len(argv):
        if argv[i] == "--res":
            res = tuple(int(x) for x in argv[i + 1].split("x"))
            i += 2
        elif argv[i] == "--samples":
            samples = int(argv[i + 1])
            i += 2
        else:
            names.append(argv[i])
            i += 1
    for n in names or list(SCENES):
        r = (res[0], int(res[0] * 0.4)) if n == "overview" and "--res" not in argv else res
        SCENES[n](r, samples)
