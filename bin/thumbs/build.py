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


for fn in (energy, food, budget, ai):
    fn()
print(sorted(p.name for p in OUT.iterdir()))
