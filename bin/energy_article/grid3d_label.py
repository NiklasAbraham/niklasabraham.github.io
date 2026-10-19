"""Labels for the grid3d renders: pills with a leader line to the anchors that grid3d.py wrote next to each PNG.

    python3 bin/energy_article/grid3d_label.py [scene ...]

Reads cache/grid3d/<scene>.png + .json, writes assets/energy-article/media/grid_<scene>.webp.
Each label is (anchor, title, sub, level, (dx, dy)) with the offset of the pill from the anchor, in pixels at 1600 px width.
Level colours match the long read: 380 kV violet, 110 kV blue, 20 kV teal, 0.4 kV warm, plain ink.
"""
import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "cache" / "grid3d"
DST = HERE.parent.parent / "assets" / "energy-article" / "media"
INK, MUTED = "#04204B", "#5A6B88"
COL = {"ehv": "#6A47C2", "hv": "#0B4FC0", "mv": "#138374", "lv": "#B4552F", "": "#04204B"}
FONT = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
FONT2 = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"

L = {
    "overview": [   # a string offset is an absolute position: "t" top row, "b" bottom row, or an x in pixels as "x:420"
        ("plant", "Power plant", "10–27 kV, stepped up to 380 kV", "ehv", ("x:60", "t")),
        ("line380", "Extra-high voltage", "380 kV · transmission grid", "ehv", ("x:400", "t")),
        ("sub380", "Substation", "380 → 110 kV", "hv", ("x:690", "t")),
        ("line110", "High voltage", "110 kV", "hv", ("x:900", "t")),
        ("sub110", "Substation", "110 → 20 kV", "mv", ("x:1090", "t")),
        ("house", "Your socket", "230 V", "lv", ("x:1360", "t")),
        ("wind", "Wind and solar", "feed in at 110 and 20 kV", "mv", ("x:960", "b")),
        ("station", "Local station", "20 kV → 0.4 kV", "lv", ("x:1260", "b")),
    ],
    "plant": [
        ("generator", "Generator", "10–27 kV, spun by the turbine", "", (-250, -150)),
        ("duct", "Busbar duct", "at generator voltage", "ehv", (-400, 110)),
        ("transformer", "Step-up transformer", "generator voltage → 380 kV", "ehv", (-50, 190)),
        ("pylon", "First pylon", "380 kV", "ehv", (80, -130)),
        ("cooling", "Cooling tower", "", "", (-290, 20)),
    ],
    "line": [
        ("tower", "Lattice pylon", "about 60 m, two circuits of three phases", "ehv", (-420, -90)),
        ("bundle", "Bundle of four conductors", "per phase", "ehv", (-300, 120)),
        ("insulators", "Insulator string", "a few metres of glass or porcelain discs", "ehv", (-330, 230)),
        ("span", "Earth wire on top", "takes the lightning", "", (-120, -190)),
    ],
    "sub380": [
        ("tower_in", "380 kV line", "arrives from the transmission grid", "ehv", (60, -10)),
        ("busbar", "380 kV busbars and bays", "breakers and disconnectors", "ehv", (-310, 40)),
        ("trafo380", "380/110 kV transformers", "", "hv", (-330, 120)),
        ("busbar110", "110 kV busbar", "", "hv", (60, 160)),
        ("mast110", "110 kV line out", "", "hv", (-210, -50)),
        ("control", "Control building", "", "", (-100, 90)),
    ],
    "sub110": [
        ("mast110", "110 kV line in", "", "hv", (60, -20)),
        ("trafo110", "110/20 kV transformer", "", "mv", (-250, 130)),
        ("switchgear", "20 kV switchgear", "", "mv", (30, 120)),
        ("cable20", "20 kV underground cables", "to villages and farms", "mv", (-100, 150)),
        ("wind", "Wind turbine", "connected at 20 kV", "mv", (-150, -190)),
        ("pv", "Solar park", "connected at 20 kV", "mv", (-20, -150)),
    ],
    "village": [
        ("cable_mv", "20 kV cable", "three phases, buried", "mv", (-240, 50)),
        ("station", "Local transformer station", "20 kV → 0.4 kV", "lv", (50, -70)),
        ("cable_lv", "0.4 kV cable", "four conductors, along the street", "lv", (-60, 190)),
        ("branch", "House connection", "", "lv", (160, 80)),
    ],
    "house": [
        ("service", "Service cable", "0.4 kV from the street", "lv", (30, 120)),
        ("entry", "Connection box", "where the utility ends", "lv", (-260, -60)),
        ("meter", "Electricity meter", "", "lv", (-120, -180)),
        ("fuses", "Fuses", "one per circuit", "lv", (-220, 110)),
        ("socket", "Socket", "230 V", "lv", (-60, -170)),
        ("lamp", "Your lamp", "", "", (120, -30)),
    ],
}


def pill(d, x, y, title, sub, colour, s):
    f1 = ImageFont.truetype(FONT, int(25 * s))
    f2 = ImageFont.truetype(FONT2, int(20 * s))
    w1 = d.textlength(title, font=f1)
    w2 = d.textlength(sub, font=f2) if sub else 0
    w = max(w1, w2) + 34 * s
    h = (60 if sub else 42) * s
    d.rounded_rectangle((x, y, x + w, y + h), radius=10 * s, fill=(255, 255, 255, 235), outline=colour, width=max(2, int(2 * s)))
    d.rounded_rectangle((x, y, x + 9 * s, y + h), radius=4 * s, fill=colour)
    d.text((x + 22 * s, y + 8 * s), title, font=f1, fill=INK)
    if sub:
        d.text((x + 22 * s, y + 35 * s), sub, font=f2, fill=MUTED)
    return w, h


def label(scene):
    img = Image.open(SRC / f"{scene}.png").convert("RGBA")
    pos = json.loads((SRC / f"{scene}.json").read_text())
    s = img.width / 1600
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for a, title, sub, lvl, (dx, dy) in L[scene]:
        if a not in pos:
            print("missing anchor", scene, a)
            continue
        ax, ay = pos[a]
        def place(v, base, axis):
            if isinstance(v, str):
                return {"t": 14 * s, "b": img.height - 74 * s}[v] if v in ("t", "b") else float(v.split(":")[1]) * s
            return base + v * s
        px, py = place(dx, ax, 0), place(dy, ay, 1)
        col = COL[lvl]
        # clamp into the frame
        f1 = ImageFont.truetype(FONT, int(25 * s))
        wmax = max(d.textlength(title, font=f1), d.textlength(sub, font=ImageFont.truetype(FONT2, int(20 * s))) if sub else 0) + 34 * s
        px = min(max(px, 12 * s), img.width - wmax - 12 * s)
        py = min(max(py, 12 * s), img.height - 72 * s)
        hh = (60 if sub else 42) * s
        cx = min(max(ax, px), px + wmax)
        cy = py + hh if ay > py + hh else (py if ay < py else ay)
        d.line((cx, cy, ax, ay), fill=col, width=max(2, int(2.5 * s)))
        r = 7 * s
        d.ellipse((ax - r, ay - r, ax + r, ay + r), fill=col, outline=(255, 255, 255, 255), width=int(2.5 * s))
        pill(d, px, py, title, sub, col, s)
    out = Image.alpha_composite(img, lay).convert("RGB")
    DST.mkdir(parents=True, exist_ok=True)
    out.save(DST / f"grid_{scene}.webp", quality=88, method=6)
    out.save(SRC / f"{scene}_labelled.png")
    print("wrote", DST / f"grid_{scene}.webp", out.size)


if __name__ == "__main__":
    for n in sys.argv[1:] or list(L):
        label(n)
