#!/usr/bin/env python3
"""Thumbnails of the blog index: one 1200x800 WebP per post -> assets/blog-thumbs/<slug>.webp.
Art, not charts: no text, drawn from the same data files the posts use.

    python3 bin/thumbs/build.py
"""
import json, pathlib, re
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle
from matplotlib.colors import LinearSegmentedColormap
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
A = ROOT / "assets"
OUT = A / "blog-thumbs"
OUT.mkdir(exist_ok=True)
W, H = 1200, 800
INK, BLUE, TEAL, RUST, BG = "#04204b", "#0b4fc0", "#138374", "#b4552f", "#f4f6fb"


def canvas(bg=BG):
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, W); ax.set_ylim(H, 0); ax.axis("off")
    fig.patch.set_facecolor(bg); ax.add_patch(Rectangle((0, 0), W, H, color=bg))
    return fig, ax


def save(fig, slug):
    p = OUT / f"{slug}.png"
    fig.savefig(p, dpi=100, facecolor=fig.get_facecolor()); plt.close(fig)
    Image.open(p).convert("RGB").save(OUT / f"{slug}.webp", quality=84, method=6); p.unlink()


def energy():
    src = Image.open(A / "energy-article/media/price_heatmap.webp").convert("RGB")
    im = Image.new("RGB", (800, 600))  # the 2022 and 2025 panels side by side, without axes
    im.paste(src.crop((610, 68, 1010, 668)), (0, 0)); im.paste(src.crop((1104, 68, 1504, 668)), (400, 0))
    im = im.resize((W, 900), Image.LANCZOS).crop((0, 100, W, 100 + H))
    im.save(OUT / "energy.webp", quality=84, method=6)


def food():
    wd = json.load(open(A / "food-article/world.json")); F = json.load(open(A / "food-article/food.json"))
    prod = F["prod"]["wheat"]; tot = sum(v[0] for v in prod.values())
    ramp = ["#FBEEE7", "#F3CDB9", "#E5A07F", "#D07548", "#B4552F", "#7E3416"]
    cuts = [0.002, 0.01, 0.03, 0.08, 0.15]
    fig, ax = canvas("#fbf7f2")
    sc = 1240 / wd["w"]; ox, oy = (W - wd["w"] * sc) / 2, (H - wd["h"] * sc) / 2 + 6
    tr = lambda pts: np.array(pts) * sc + [ox, oy]
    nums = lambda d: [[tuple(map(float, m)) for m in re.findall(r"(-?[\d.]+),(-?[\d.]+)", r)] for r in d.split("Z") if r]
    ax.add_patch(Polygon(tr(nums(wd["o"])[0]), closed=True, fc="#efe6dc", ec="none"))
    for code, c in wd["c"].items():
        v = prod.get(code, [0])[0] / tot
        col = ramp[sum(v >= x for x in cuts)] if v > 0 else "#ffffff"
        for ring in nums(c["d"]):
            if len(ring) > 2: ax.add_patch(Polygon(tr(ring), closed=True, fc=col, ec="#c9b8a6", lw=0.35))
    save(fig, "food")


def budget():
    b = json.load(open(A / "budget-article/budget.json"))
    cols = [BLUE, TEAL, "#7aa7e6", RUST, "#e0a43c", "#8a6fc4", "#b8c4d9", "#04204b", "#9aa5b8", "#d6a0a0"]
    names = ["United States", "Germany", "France", "Finland", "Japan", "Brazil", "United Kingdom", "Sweden", "Italy", "Poland", "Chile", "Mexico", "Spain", "Denmark"]
    rows = []
    for k, c in b["countries"].items():
        if c["name"] in names and c.get("cofog"):
            y = max(c["cofog"]); d = c["cofog"][y]
            sh = [sum(d.get(f, 0) for f in g["fn"]) for g in b["groups"]]
            if sum(sh) > 0: rows.append((names.index(c["name"]), sh))
    rows.sort(); fig, ax = canvas(); n = len(rows); h = (H - 120) / n
    for i, (_, sh) in enumerate(rows):
        s = sum(sh); x = 90
        for j, v in enumerate(sh):
            w = (W - 180) * v / s
            ax.add_patch(Rectangle((x, 60 + i * h), w - 3, h - 8, fc=cols[j % len(cols)], ec="none")); x += w
    save(fig, "budget")


def ai():
    a = json.load(open(A / "ai-article/ai.json")); g = a["capex"]["guidance"]
    cols = {"Amazon": RUST, "Alphabet": BLUE, "Microsoft": TEAL, "Meta": "#8a6fc4"}
    fig, ax = canvas(INK); top = 250.0
    gw = (W - 200) / 4
    for i, co in enumerate(a["capex"]["companies"]):
        for j, m in enumerate(["Jan", "Apr", "Jul"]):
            lo, hi = g[co][m]; v = (lo + hi) / 2; hh = (H - 160) * v / top; x = 100 + i * gw + j * gw * 0.3
            ax.add_patch(Rectangle((x, H - 80 - hh), gw * 0.26, hh, fc=cols[co], alpha=0.45 + 0.27 * j, ec="none"))
    ax.plot([80, W - 80], [H - 78, H - 78], color="#6f86b3", lw=2)
    save(fig, "ai-money")


def oil():
    """The year's crude flows at sea on a pale world map: lanes as warm ribbons, width by million barrels a day, rings at
    the chokepoints by the oil through them; same lanes, flows and Equal Earth projection as the post's flow map."""
    g = json.load(open(A / "oil-article/geo.json"))["world"]; cu = json.load(open(A / "oil-article/oil.json"))["curated"]
    A1, A2, A3, A4, D = 1.340264, -0.081106, 0.000893, 0.003796, np.pi / 180
    def P(lon, lat):
        l = (lon - g["lon0"] + 180) % 360 - 180
        th = np.arcsin(np.sqrt(3) / 2 * np.sin(lat * D)); t2 = th * th; t6 = t2 ** 3
        x = 2 * np.sqrt(3) * l * D * np.cos(th) / (3 * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)))
        return g["cx"] + g["s"] * x, g["cy"] - g["s"] * th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
    # crop: the Atlantic to Japan, scaled to the card
    x0, y0, x1, y1 = 170, 95, 930, 402
    sc = W / (x1 - x0); oy = (H - (y1 - y0) * sc) / 2
    T = lambda x, y: ((x - x0) * sc, (y - y0) * sc + oy)
    nums = lambda d: [[tuple(map(float, m)) for m in re.findall(r"(-?[\d.]+),(-?[\d.]+)", r)] for r in d.split("Z") if r]
    fig, ax = canvas("#f4f6fb")
    for c in g["c"].values():
        for ring in nums(c["d"]):
            if len(ring) > 2 and np.ptp([q[0] for q in ring]) < 400:  # skip rings cut by the antimeridian
                ax.add_patch(Polygon([T(*q) for q in ring], closed=True, fc="#ffffff", ec="#cdd5e2", lw=0.5))
    def chaikin(xy, n=4):  # round the schematic lanes
        for _ in range(n):
            q = 0.75 * xy[:-1] + 0.25 * xy[1:]; r = 0.25 * xy[:-1] + 0.75 * xy[1:]
            xy = np.vstack([xy[:1], np.column_stack([q, r]).reshape(-1, 2), xy[-1:]])
        return xy
    col = {"crude": RUST, "wti": "#d98a52", "urals": "#8e4fb3"}
    load = {}
    for f in cu["flows"]:
        for k in f["lanes"]: load.setdefault(k, {}); load[k][f["c"]] = load[k].get(f["c"], 0) + f["mbd"]
    for k, pts in cu["lanes"].items():
        if k not in load: continue
        lon = np.concatenate([np.linspace(a[0], b[0], 12) for a, b in zip(pts, pts[1:])])
        lat = np.concatenate([np.linspace(a[1], b[1], 12) for a, b in zip(pts, pts[1:])])
        xy = chaikin(np.array([T(*P(a, b)) for a, b in zip(lon, lat)])[::6])
        for c, v in sorted(load[k].items(), key=lambda kv: -kv[1]):
            ax.plot(xy[:, 0], xy[:, 1], color=col.get(c, RUST), lw=1.2 + 1.35 * v, alpha=0.82, solid_capstyle="round", solid_joinstyle="round")
    for ch in cu["chokepoints"]:
        x, y = T(*P(ch["lon"], ch["lat"])); r = 7 + 4.2 * np.sqrt(ch["mbd"])
        hot = ch["k"] == "hormuz"
        ax.add_patch(plt.Circle((x, y), r, fc="none", ec=INK, lw=2.6 if hot else 1.4, zorder=6))
        if hot: ax.add_patch(plt.Circle((x, y), r * 1.55, fc="none", ec=INK, lw=0.9, ls=(0, (3, 3)), zorder=6))
    save(fig, "oil-market")

for fn in (energy, food, budget, ai, oil):
    fn()
print(sorted(p.name for p in OUT.iterdir()))
