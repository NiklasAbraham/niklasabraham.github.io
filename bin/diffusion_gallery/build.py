"""Diffusion architecture gallery: one source for the facts and the drawings.

Writes, for every model in MODELS,
  _includes/diffusion-gallery/<id>.svg   the architecture drawing (inline SVG, styled by CSS)
and once
  _data/diffusion_gallery.json            the fact sheets the page renders.

Run from the repository root:  python3 bin/diffusion_gallery/build.py

Preview while drawing (touches neither _includes/ nor _data/):
  python3 bin/diffusion_gallery/build.py --preview-card rfd4 [rfd3 …] [--shot]
draws only those cards into bin/diffusion_gallery/preview/index.html (gitignored, open it as a file;
?theme=dark or the toggle for dark). Its main.css is compiled from assets/css/main.scss and _sass/ by
the dart-sass of the nab-site-dev image, extracted once to ~/.cache/nab-site/ (DG_SASS overrides);
without it, the preview server's main.css is used and a newer SCSS file is warned about.
--shot renders the cards headless at 2x (preview_shot.mjs, Playwright) to
<shot dir>/gallery_<id>_{light,dark}.png and prints console errors and text that leaves its box.

Every drawing uses the same vocabulary: boxes are coloured by what they do (role), never by
model, so the same block looks the same in every card. Colours live in
_sass/_diffusion_gallery.scss as CSS variables; the SVG carries only class names.
Flow runs bottom to top (input at the bottom, prediction at the top), except in U-Nets,
which run down the encoder and back up the decoder.
"""

import argparse
import email.utils
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from html import escape

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from details import DETAILS, KEY_GLOSS, ROLE_GLOSS  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT_SVG = ROOT / "_includes" / "diffusion-gallery"
OUT_DATA = ROOT / "_data" / "diffusion_gallery.json"
OUT_GLOSS = ROOT / "_data" / "diffusion_gallery_gloss.json"
PREVIEW = ROOT / "bin" / "diffusion_gallery" / "preview"
SHOTS = pathlib.Path("/home/niklas/code/MasterThesis/050_system/shots")
SASS_IMAGE = "nab-site-dev"
SASS_CACHE = pathlib.Path.home() / ".cache" / "nab-site"
SERVED_CSS = "http://127.0.0.1:4000/assets/css/main.css"

W = 520  # every drawing is 520 user units wide; height varies


# ----------------------------------------------------------------------------------------
# Text: a tiny markup for sub- and superscripts, x_t, z_{ij}, σ^2
# ----------------------------------------------------------------------------------------

_SCRIPT = re.compile(r"([_^])(\{[^}]*\}|[^\s{}])")


def fmt(s):
    out, pos = [], 0
    for m in _SCRIPT.finditer(s):
        out.append(escape(s[pos:m.start()]))
        body = m.group(2).strip("{}")
        shift = "-22%" if m.group(1) == "_" else "38%"
        out.append(f'<tspan class="sc" baseline-shift="{shift}">{escape(body)}</tspan>')
        pos = m.end()
    out.append(escape(s[pos:]))
    return "".join(out)


def hfmt(s):
    """The same markup for HTML (detail view): sub/sup tags, backticks become <code>."""
    if not s:
        return ""
    out = []
    for i, part in enumerate(s.split("`")):
        if i % 2:
            out.append(f"<code>{escape(part)}</code>")
            continue
        pos = 0
        for m in _SCRIPT.finditer(part):
            out.append(escape(part[pos:m.start()]))
            tag = "sub" if m.group(1) == "_" else "sup"
            out.append(f"<{tag}>{escape(m.group(2).strip('{}'))}</{tag}>")
            pos = m.end()
        out.append(escape(part[pos:]))
    return "".join(out)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "b"


# ----------------------------------------------------------------------------------------
# Drawing primitives
# ----------------------------------------------------------------------------------------

class Fig:
    def __init__(self, mid, h, crop=False):
        self.id, self.h, self.el = mid, h, []
        self.blocks = {}  # key -> title, sub, role of every interactive block
        self.auto = {}    # key -> dims/text the drawing helpers can derive themselves
        self.crop = crop  # True: the viewBox is fitted to what was drawn (gallery drawings)
        self.late = []    # drawn last, on top of every line (labels with a halo)
        self.ymin, self.ymax = float("inf"), float("-inf")

    def _y(self, *ys):
        for y in ys:
            self.ymin, self.ymax = min(self.ymin, y), max(self.ymax, y)

    # --- interactive blocks: everything between begin() and end() highlights together
    def begin(self, key, title, sub=None, role="io"):
        k = slug(key)
        self.blocks.setdefault(k, dict(title=(title or "").replace("\n", " "),
                                       sub=(sub or "").replace("\n", " · "), role=role))
        self.raw(f'<g class="blk" data-k="{k}">')

    def end(self):
        self.raw("</g>")

    # --- low level
    def raw(self, s):
        self.el.append(s)

    def text(self, x, y, s, cls="t", anchor="middle", late=False):
        out = f'<text class="{cls}" x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}">{fmt(s)}</text>'
        (self.late if late else self.el).append(out)
        if "vert" in cls.split():
            half = 3.1 * len(s)
            self._y(y - half, y + half)
        else:
            self._y(y - 11, y + 4)

    def arrow(self, pts, cls="f", head=True):
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        mk = f' marker-end="url(#{self.id}-{"aw" if "w" in cls.split() else "a"})"' if head else ""
        self.raw(f'<path class="ln {cls}" d="{d}"{mk}/>')
        self._y(*[y for _, y in pts])

    def curve(self, d, cls="f", head=True):
        mk = f' marker-end="url(#{self.id}-{"aw" if "w" in cls.split() else "a"})"' if head else ""
        self.raw(f'<path class="ln {cls}" d="{d}"{mk}/>')
        self._y(*[float(b) for _, b in re.findall(r"(-?[\d.]+),(-?[\d.]+)", d)])

    def dot(self, x, y, cls="f"):
        self.raw(f'<circle class="dot {cls}" cx="{x:.1f}" cy="{y:.1f}" r="2.6"/>')
        self._y(y - 3, y + 3)

    def plus(self, x, y, r=7.5):
        self.raw(f'<g class="plus"><circle cx="{x:.1f}" cy="{y:.1f}" r="{r}"/>'
                 f'<path d="M{x - r * .55:.1f},{y:.1f} H{x + r * .55:.1f} M{x:.1f},{y - r * .55:.1f} V{y + r * .55:.1f}"/></g>')
        self._y(y - r, y + r)

    def box(self, x, y, w, h, title, sub=None, role="attn", diff=False, dash=False, small=False, key=None):
        wrap = key is not False and (key or title)
        if wrap:
            self.begin(key or title.split("\n")[0], title, sub, role)
        cls = f"bx {role}" + (" diff" if diff else "") + (" dash" if dash else "")
        self.raw(f'<rect class="{cls}" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="7"/>')
        self._y(y, y + h)
        lines = title.split("\n") if title else []
        subs = sub.split("\n") if sub else []
        lh, sh = (13, 11.5) if small else (15, 12.5)
        total = len(lines) * lh + len(subs) * sh
        yy = y + h / 2 - total / 2 + (lh - 3.5)
        for ln in lines:
            self.text(x + w / 2, yy, ln, "bt sm" if small else "bt")
            yy += lh
        for ln in subs:
            self.text(x + w / 2, yy - 1, ln, "bs" + (" dw" if diff else ""))
            yy += sh
        if wrap:
            self.end()

    def chip(self, x, y, s, cls="pl", anchor="start", key=None, title=None):
        """A pill-shaped tag; x is its left edge (or centre if anchor='middle')."""
        w = 7 + 6.1 * len(re.sub(r"[_^{}]", "", s))
        x0 = x - w / 2 if anchor == "middle" else x
        if key:
            self.begin(key, title or s, s, "pair")
        self.raw(f'<rect class="{cls}" x="{x0:.1f}" y="{y - 11:.1f}" width="{w:.1f}" height="16" rx="8"/>')
        self.text(x0 + w / 2, y + 0.5, s, " ".join(c + "-t" for c in cls.split()))
        self._y(y - 11, y + 5)
        if key:
            self.end()
        return w

    def badge(self, x, y, rep, rep_cls="rep", anchor="end"):
        """A dark '× N' pill centred on y; x is its right edge (anchor='end'), left edge or centre."""
        rw = 12 + 6.4 * len(rep)
        x0 = x - rw if anchor == "end" else x - rw / 2 if anchor == "middle" else x
        self.raw(f'<rect class="{rep_cls}" x="{x0:.1f}" y="{y - 9:.1f}" width="{rw:.1f}" height="18" rx="9"/>')
        self.text(x0 + rw / 2, y + 4, rep, " ".join(c + "-t" for c in rep_cls.split()))
        self._y(y - 9, y + 9)
        return rw

    def group(self, x, y, w, h, label, rep=None, cls="grp", rep_cls="rep", rep_left=False, label_dy=15,
              label_x=None):
        """A dashed frame around repeated or related blocks; rep is the dark '× N' badge on its top edge."""
        self.raw(f'<rect class="{cls}" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="11"/>')
        self._y(y, y + h)
        if label:
            self.text(x + 10 if label_x is None else label_x, y + label_dy, label, "gl", "start")
        if rep:
            if rep_left:
                self.badge(x + 10, y, rep, rep_cls, "start")
            else:
                self.badge(x + w - 8, y, rep, rep_cls, "end")

    def svg(self):
        defs = (f'<defs>'
                f'<marker id="{self.id}-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path class="ah" d="M0,1 L9,5 L0,9 z"/></marker>'
                f'<marker id="{self.id}-aw" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path class="ah w" d="M0,1 L9,5 L0,9 z"/></marker>'
                f'</defs>')
        if self.crop and self.ymax > self.ymin:
            y0, hh = int(self.ymin - 12), int(self.ymax - self.ymin + 24.999)
            vb = f"0 {y0} {W} {hh}"
        else:
            vb = f"0 0 {W} {self.h}"
        return (f'<svg class="dg-svg" viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" '
                f'role="img" aria-labelledby="{self.id}-title"><title id="{self.id}-title">{self.id} architecture</title>'
                + defs + "".join(self.el) + "".join(self.late) + "</svg>\n")


# ----------------------------------------------------------------------------------------
# Composite helpers
# ----------------------------------------------------------------------------------------

def residual_sublayer(f, x, w, y, norm, op, op_sub=None, role="attn", gate=None, diff=False,
                      norm_diff=False, mod_from=None, res=True):
    """One pre-norm residual sub-layer, drawn upwards from y. Returns the new top y.

    mod_from: x coordinate of a modulation bus; draws a short warm arrow into the norm box. The y of
    every such arrow is collected in f.mod_ys, so the caller can draw the bus over exactly that span.
    """
    cx = x + w / 2
    rx = x + w + 14
    yb = y
    mods = f.__dict__.setdefault("mod_ys", [])
    y -= 8
    f.dot(cx, y)
    if norm:
        f.arrow([(cx, y), (cx, y - 10)])
        y -= 10 + 22
        f.box(x + w * .18, y, w * .64, 22, norm, role="norm", diff=norm_diff, small=True)
        if mod_from is not None:
            f.arrow([(mod_from, y + 11), (x + w * .18, y + 11)], "w dsh")
            mods.append(y + 11)
    f.arrow([(cx, y), (cx, y - 10)])
    oh = 38 if op_sub else 28
    y -= 10 + oh
    f.box(x, y, w, oh, op, op_sub, role=role, diff=diff)
    if gate:
        f.arrow([(cx, y), (cx, y - 8)])
        y -= 8 + 18
        f.box(x + w * .3, y, w * .4, 18, gate, role="norm", small=True)
        if mod_from is not None:
            f.arrow([(mod_from, y + 9), (x + w * .3, y + 9)], "w dsh")
            mods.append(y + 9)
    f.arrow([(cx, y), (cx, y - 12)])
    y -= 12 + 7.5
    if res:
        f.plus(cx, y)
        f.arrow([(cx, yb - 8), (rx, yb - 8), (rx, y), (cx + 7.5, y)], "r")
    y -= 7.5
    return y


def unet(f, levels, mid, top, xl=40, xr=480, lvl_h=44, gap=22, in_label="", out_label="",
         in_sub=None, out_sub=None, in_diff=False, out_diff=False):
    """A U-Net, encoder down the left, decoder up the right, skips across.

    levels: list of (resolution, channels, blocks_label, attn_label or None). The decoder runs one
    ResBlock more per level than the encoder (num_res_blocks + 1 in every reference implementation).
    mid: (what the bottleneck runs, its resolution). Returns the y below the bottleneck; the level
    positions are left in f.levels for unet_cond().
    """
    n = len(levels)
    bw = 150
    f.box(xl, top, bw, 34, in_label, in_sub, role="io", diff=in_diff)
    f.box(xr - bw, top, bw, 34, out_label, out_sub, role="io", diff=out_diff)
    y = top + 34 + 22
    f.arrow([(xl + bw / 2, top + 34), (xl + bw / 2, y)])
    ys = []
    for i, (res, ch, blk, attn) in enumerate(levels):
        inset = i * 8
        lx, rx_ = xl + inset, xr - bw - inset
        h = lvl_h + (16 if attn else 0)
        for side, bx in (("enc", lx), ("dec", rx_)):
            b = blk if side == "enc" else blk.replace("×2", "×3")
            name = ("Encoder" if side == "enc" else "Decoder") + f" level {i + 1}"
            f.begin(f"{side}{i}", name, f"{res} · {ch} ch · {b}" + (f" · {attn}" if attn else ""), "conv")
            f.box(bx, y, bw, h, None, role="conv", key=False)
            f.text(bx + bw / 2, y + 16, b, "bt")
            f.text(bx + bw / 2, y + 30, f"{res} · {ch} ch", "bs")
            if attn:
                f.chip(bx + bw / 2, y + h - 10, attn, "pl attn", "middle")
            f.end()
            n_ = res.rstrip("²")
            if side == "enc":
                nxt = "then downsampled 2× for the next level" if i < n - 1 else "then passed to the bottleneck"
                f.auto[f"{side}{i}"] = dict(
                    dims=f"{ch} × {n_} × {n_}",
                    text=f"{b} at {n_} × {n_} with {ch} channels" + (f", {attn}" if attn else "")
                         + f". The output of every ResBlock is kept for a skip to decoder level {i + 1}, {nxt}.")
            else:
                f.auto[f"{side}{i}"] = dict(
                    dims=f"{ch} × {n_} × {n_} (input: upsampled features ‖ skip from encoder level {i + 1})",
                    text=f"{b} at {n_} × {n_}, one more than the encoder level; a skip from encoder level {i + 1} "
                         f"is concatenated on the channel axis before each ResBlock"
                         + (f"; {attn}" if attn else "")
                         + (". Then upsampled 2×." if i > 0 else ". Then the output head."))
        ys.append((y, h, lx, rx_))
        # skip across
        f.arrow([(lx + bw, y + h / 2), (rx_, y + h / 2)], "s")
        if i < n - 1:
            ny = y + h + gap
            f.arrow([(lx + bw / 2, y + h), (lx + bw / 2, y + h + gap / 2), (lx + 8 + bw / 2, y + h + gap / 2),
                     (lx + 8 + bw / 2, ny)])
            f.text(lx + bw / 2 - 6, y + h + gap / 2 + 4, "↓2", "lab", "end")
        y += h + gap
    # decoder arrows up
    for i in range(n - 1, 0, -1):
        y0, h0, _, rx0 = ys[i]
        y1, h1, _, rx1 = ys[i - 1]
        f.arrow([(rx0 + bw / 2, y0), (rx0 + bw / 2, y0 - gap / 2), (rx1 + bw / 2, y0 - gap / 2), (rx1 + bw / 2, y1 + h1)])
        f.text(rx1 + bw / 2 + 6, y0 - gap / 2 + 4, "↑2", "lab", "start")
    f.arrow([(xr - bw / 2, ys[0][0]), (xr - bw / 2, top + 34)])
    f.text((xl + xr) / 2, ys[0][0] + ys[0][1] / 2 - 5, "skip ‖", "lab", "middle")
    # bottleneck
    yl, hl, lx, rx_ = ys[-1]
    by = yl + hl + 24
    bwid = 240
    bx = (xl + xr) / 2 - bwid / 2
    f.box(bx, by, bwid, 40, f"bottleneck · {mid[1]}", mid[0], role="conv", key="mid")
    f.arrow([(lx + bw / 2, yl + hl), (lx + bw / 2, by + 20), (bx, by + 20)])
    f.arrow([(bx + bwid, by + 20), (rx_ + bw / 2, by + 20), (rx_ + bw / 2, yl + hl)])
    f.levels = [(y_ + h_ / 2, lx_, rx__ + bw) for (y_, h_, lx_, rx__) in ys]
    return by + 40


def unet_cond(f, y, sources, note=None, xL=22, xR=498):
    """The conditioning row under a U-Net. Every wired source feeds one warm bus that runs up both
    sides and enters every encoder and decoder level. sources: dicts with x, w, title, sub, label,
    and optionally h, diff, dash, wired (False for something that is not a network input)."""
    hmax = max(s.get("h", 44) for s in sources)
    ybus = y + hmax + 16
    for s in sources:
        h = s.get("h", 44)
        cx = s["x"] + s["w"] / 2
        f.text(cx, y - 8, s["label"], "lab w", "middle")
        f.box(s["x"], y, s["w"], h, s["title"], s.get("sub"), role="cond", diff=s.get("diff", False),
              dash=s.get("dash", False))
        if s.get("wired", True):
            f.arrow([(cx, y + h), (cx, ybus)], "w dsh", head=False)
    ytop = f.levels[0][0]
    f.arrow([(xL, ybus), (xR, ybus)], "w dsh", head=False)
    f.arrow([(xL, ybus), (xL, ytop)], "w dsh", head=False)
    f.arrow([(xR, ybus), (xR, ytop)], "w dsh", head=False)
    for yc, lx, rxr in f.levels:
        f.arrow([(xL, yc), (lx, yc)], "w dsh")
        f.arrow([(xR, yc), (rxr, yc)], "w dsh")
    if note:
        f.text(260, ybus + 22, note, "lab", "middle")


def bracket(f, x, y_top, y_bot, rep, label=None):
    """A thin bracket to the left of a run of blocks, with a dark '× N' badge: 'this repeats'."""
    f.raw(f'<path class="ln br" d="M{x + 6:.1f},{y_top:.1f} H{x:.1f} V{y_bot:.1f} H{x + 6:.1f}"/>')
    f._y(y_top, y_bot)
    ym = (y_top + y_bot) / 2
    f.badge(x, ym, rep, anchor="middle")
    if label:
        f.text(x - 24, ym + 4, label, "lab", "end")


# ----------------------------------------------------------------------------------------
# The drawings, one function per model
# ----------------------------------------------------------------------------------------

def draw_ddpm(mid):
    f = Fig(mid, 700, crop=True)
    yb = unet(f, [("32²", 128, "ResBlock ×2", None), ("16²", 256, "ResBlock ×2", "self-attn"),
                  ("8²", 256, "ResBlock ×2", None), ("4²", 256, "ResBlock ×2", None)],
              ("ResBlock · self-attn · ResBlock", "4²"), 20,
              in_label="noisy image x_t", in_sub="3 × 32 × 32", out_label="noise ε̂", out_sub="3 × 32 × 32")
    unet_cond(f, yb + 40, [dict(x=170, w=180, title="time t", sub="sinusoidal → MLP",
                                label="added in every ResBlock")],
              note="GroupNorm · Wide-ResNet blocks · pixel space")
    return f


def draw_adm(mid):
    f = Fig(mid, 900, crop=True)
    yb = unet(f, [("256²", 256, "ResBlock ×2", None), ("128²", 256, "ResBlock ×2", None),
                  ("64²", 512, "ResBlock ×2", None), ("32²", 512, "ResBlock ×2", "MHA · 64 ch/head"),
                  ("16²", 1024, "ResBlock ×2", "MHA · 64 ch/head"), ("8²", 1024, "ResBlock ×2", "MHA · 64 ch/head")],
              ("ResBlock · MHA · ResBlock", "8²"), 20,
              in_label="noisy image x_t", in_sub="3 × 256 × 256", out_label="ε̂ and Σ̂", out_sub="6 × 256 × 256",
              out_diff=True)
    unet_cond(f, yb + 40, [
        dict(x=40, w=200, title="time t + class y", sub="embed → AdaGN", diff=True,
             label="scale, shift after every GroupNorm"),
        dict(x=280, w=200, title="noisy classifier p(y | x_t)", sub="∇ log p shifts each step", diff=True,
             dash=True, wired=False, label="guidance, at sampling only")],
        note="BigGAN up/down ResBlocks · learned Σ")
    return f


def _vae_top(f, image_in, image_out, latent, diff=False):
    f.box(40, 14, 150, 34, "image x", image_in, role="io")
    f.box(330, 14, 150, 34, "image", image_out, role="io")
    f.box(40, 66, 150, 30, "VAE encoder", "f = 8", role="latent", small=True, diff=diff)
    f.box(330, 66, 150, 30, "VAE decoder", None, role="latent", small=True, diff=diff)
    f.arrow([(115, 48), (115, 66)])
    f.arrow([(405, 66), (405, 48)])
    f.text(260, 86, f"latent z: {latent}", "lab", "middle")
    f.arrow([(115, 96), (115, 112)])
    f.arrow([(405, 112), (405, 96)])


def draw_sd1(mid):
    f = Fig(mid, 900, crop=True)
    _vae_top(f, "3 × 512 × 512", "3 × 512 × 512", "4 × 64 × 64", diff=True)
    yb = unet(f, [("64²", 320, "ResBlock ×2", "1 transformer each"), ("32²", 640, "ResBlock ×2", "1 transformer each"),
                  ("16²", 1280, "ResBlock ×2", "1 transformer each"), ("8²", 1280, "ResBlock ×2", None)],
              ("ResBlock · transformer · ResBlock", "8²"), 112,
              in_label="noisy latent z_t", in_sub="4 × 64 × 64", out_label="noise ε̂", out_sub="4 × 64 × 64")
    unet_cond(f, yb + 40, [
        dict(x=40, w=210, title="CLIP ViT-L/14 (frozen)", sub="prompt → 77 × 768 tokens", diff=True,
             label="K, V of every cross-attention"),
        dict(x=290, w=190, title="time t", sub="sinusoidal → MLP", label="added in every ResBlock")],
        note="transformer = self-attn → cross-attn(text) → FFN")
    return f


def draw_sdxl(mid):
    f = Fig(mid, 900, crop=True)
    _vae_top(f, "3 × 1024 × 1024", "→ refiner (optional)", "4 × 128 × 128")
    yb = unet(f, [("128²", 320, "ResBlock ×2", None), ("64²", 640, "ResBlock ×2", "2 transformers each"),
                  ("32²", 1280, "ResBlock ×2", "10 transformers each")],
              ("ResBlock · 10 transformers · ResBlock", "32²"), 112,
              in_label="noisy latent z_t", in_sub="4 × 128 × 128", out_label="noise ε̂", out_sub="4 × 128 × 128")
    unet_cond(f, yb + 40, [
        dict(x=40, w=220, h=50, title="CLIP ViT-L + OpenCLIP bigG", sub="tokens concatenated → 77 × 2048",
             diff=True, label="K, V of every cross-attention"),
        dict(x=280, w=200, h=50, title="vector: t + pooled bigG", sub="+ size, crop, target size\n(Fourier features)",
             diff=True, label="one vector, added in every ResBlock")],
        note="no attention at 128², one level fewer than SD 1")
    return f


def dit_block(f, x, w, y, mod_x, sublayers):
    for s in sublayers:
        y = residual_sublayer(f, x, w, y, mod_from=mod_x, **s)
    return y


def draw_dit(mid):
    f = Fig(mid, 640, crop=True)
    x, w = 190, 210
    cx = x + w / 2
    H = f.h
    f.box(x, H - 46, w, 34, "noisy latent z_t", "4 × 32 × 32 (256² image)", role="io")
    f.arrow([(cx, H - 46), (cx, H - 64)])
    f.box(x, H - 104, w, 40, "patchify, p = 2", "→ 256 tokens · + sin-cos pos.", role="embed", diff=True)
    bus = 160
    f.mod_ys = []
    y = H - 104 - 6
    y = dit_block(f, x, w, y, bus, [
        dict(norm="LayerNorm · γ, β", op="multi-head self-attention", op_sub="16 heads · d = 1152",
             role="attn", gate="scale α"),
        dict(norm="LayerNorm · γ, β", op="pointwise MLP", op_sub="1152 → 4608 → 1152", role="mlp",
             gate="scale α"),
    ])
    gtop = y - 24
    f.group(x - 14, gtop, w + 52, H - 104 - 14 - gtop, "DiT block", "× 28")
    f.arrow([(cx, y), (cx, gtop - 18)])
    f.box(x, gtop - 52, w, 34, "LayerNorm · linear · unpatchify", None, role="embed", small=True)
    f.arrow([(cx, gtop - 52), (cx, gtop - 66)])
    f.box(x, gtop - 102, w, 36, "noise ε̂ and Σ̂", "8 × 32 × 32", role="io")
    # conditioning column: t and y summed, one MLP per block regresses its six modulation vectors
    f.box(14, H - 104, 124, 40, "time t", "sinusoidal → MLP", role="cond")
    f.box(14, H - 170, 124, 40, "class y", "embedding table", role="cond")
    f.plus(76, H - 200)
    f.arrow([(76, H - 170), (76, H - 192)], "w")
    f.arrow([(138, H - 84), (150, H - 84), (150, H - 200), (84, H - 200)], "w")
    ym = H - 252
    f.box(14, ym - 22, 124, 44, "MLP → 6 vectors", "γ₁ β₁ α₁ γ₂ β₂ α₂", role="cond", diff=True)
    f.arrow([(76, H - 208), (76, ym + 22)], "w")
    f.arrow([(138, ym), (bus, ym)], "w dsh", head=False)
    f.arrow([(bus, min(f.mod_ys + [ym])), (bus, max(f.mod_ys + [ym]))], "w dsh", head=False)
    f.text(76, ym - 84, "adaLN-Zero", "lab w", "middle")
    f.text(76, ym - 68, "α = 0 at init:", "lab", "middle")
    f.text(76, ym - 54, "every block starts", "lab", "middle")
    f.text(76, ym - 40, "as the identity", "lab", "middle")
    return f


def draw_uvit(mid):
    f = Fig(mid, 820, crop=True)
    H = f.h
    x, w = 170, 210
    cx = x + w / 2
    # token row
    y0 = H - 46
    f.box(30, y0, 74, 34, "time t", None, role="cond", small=True, diff=True)
    f.box(112, y0, 96, 34, "condition c", None, role="cond", small=True, diff=True)
    f.box(216, y0, 274, 34, "noisy patches x_t", "image or latent, patch 2", role="io")
    f.arrow([(67, y0), (67, y0 - 16), (cx - 40, y0 - 16), (cx - 40, y0 - 30)])
    f.arrow([(160, y0), (160, y0 - 16)], head=False)
    f.arrow([(353, y0), (353, y0 - 16), (cx + 40, y0 - 16), (cx + 40, y0 - 30)])
    f.box(x, y0 - 70, w, 40, "linear embed + pos. embed", "one sequence: [t, c, x₁ … x_L]", role="embed")
    # stack: in-blocks 1, 2, …, 14 · mid · out-blocks 14, …, 2, 1
    names = ["in-block 1", "in-block 2", None, "in-block 14", "mid-block",
             "out-block 14", None, "out-block 2", "out-block 1"]
    y = y0 - 70
    centres = {}
    for n in names:
        if n is None:   # the blocks that are not drawn
            f.arrow([(cx, y), (cx, y - 30)])
            f.text(cx + 12, y - 11, "⋮ blocks 3 – 13", "lab", "start")
            y -= 30
            continue
        f.arrow([(cx, y), (cx, y - 18)])
        y -= 18 + 34
        key = n.split(" ")[0] if "-block " in n else n
        f.box(x, y, w, 34, n, "self-attn + MLP", role="attn", small=True, key=key)
        centres[n] = (y, y + 34)
    # long skips on the right, nested
    for k, (a, b) in enumerate([("in-block 14", "out-block 14"), ("in-block 2", "out-block 2"),
                                ("in-block 1", "out-block 1")]):
        ya, yb = sum(centres[a]) / 2, sum(centres[b]) / 2
        xr = x + w + 22 + k * 22
        f.curve(f"M{x + w:.1f},{ya:.1f} H{xr - 10:.1f} Q{xr:.1f},{ya:.1f} {xr:.1f},{ya - 10:.1f} "
                f"V{yb + 10:.1f} Q{xr:.1f},{yb:.1f} {xr - 10:.1f},{yb:.1f} H{x + w + 1:.1f}", "s")
    bracket(f, x - 26, centres["in-block 14"][0], centres["in-block 1"][1], "× 14", "shallow half")
    bracket(f, x - 26, centres["out-block 1"][0], centres["out-block 14"][1], "× 14", "deep half")
    f.text(70, centres["mid-block"][0] + 14, "long skips:", "lab", "middle")
    f.text(70, centres["mid-block"][0] + 28, "concat + linear", "lab", "middle")
    f.arrow([(cx, y), (cx, y - 18)])
    f.box(x, y - 52, w, 34, "linear · unpatchify", "+ 3×3 conv (optional)", role="embed", small=True)
    f.arrow([(cx, y - 52), (cx, y - 66)])
    f.box(x, y - 100, w, 34, "noise ε̂", None, role="io")
    return f


def mmdit_block(f, ybot, xt, xi, w, att_sub, rep, label, vec):
    """The SD3 / FLUX double-stream block, drawn upwards from ybot (the top of the embedding boxes).

    vec: (x, y), where the global vector's line arrives; it runs under the block to the gap between
    the streams and modulates both. Returns the top y of the block's frame."""
    cx_t, cx_i = xt + w / 2, xi + w / 2
    gx = (xt + w + xi) / 2
    y = ybot - 20 - 24
    for xx in (xt, xi):
        f.box(xx, y, w, 24, "adaLN modulation", None, role="norm", small=True)
    f.arrow([(cx_t, ybot), (cx_t, y + 24)])
    f.arrow([(cx_i, ybot), (cx_i, y + 24)])
    ybus, ym = ybot - 12, y + 12
    vx, vy = vec
    f.arrow([(vx, vy), (vx, ybus), (gx, ybus), (gx, ym)], "w dsh", head=False)
    f.arrow([(gx, ym), (xt + w, ym)], "w dsh")
    f.arrow([(gx, ym), (xi, ym)], "w dsh")
    y -= 14 + 26
    f.box(xt, y, w, 26, "Q K V · text weights", None, role="attn", small=True)
    f.box(xi, y, w, 26, "Q K V · image weights", None, role="attn", small=True)
    f.arrow([(cx_t, y + 40), (cx_t, y + 26)])
    f.arrow([(cx_i, y + 40), (cx_i, y + 26)])
    y -= 14 + 40
    f.box(xt, y, xi + w - xt, 40, "joint attention", att_sub, role="attn", diff=True)
    f.arrow([(cx_t, y + 54), (cx_t, y + 40)])
    f.arrow([(cx_i, y + 54), (cx_i, y + 40)])
    y -= 12 + 24
    for xx in (xt, xi):
        f.box(xx, y, w, 24, "out proj · gate ⊕", None, role="attn", small=True)
        f.arrow([(xx + w / 2, y + 36), (xx + w / 2, y + 24)])
    y -= 12 + 26
    for xx in (xt, xi):
        f.box(xx, y, w, 26, "MLP · gate ⊕", None, role="mlp", small=True)
        f.arrow([(xx + w / 2, y + 38), (xx + w / 2, y + 26)])
    gtop = y - 30
    f.group(xt - 16, gtop, xi + w - xt + 32, ybot - 5 - gtop, label, rep, label_x=cx_t + 10)
    return gtop, y


def draw_sd3(mid):
    f = Fig(mid, 760, crop=True)
    H = f.h
    w = 156
    xt, xi = 128, 340
    f.box(xt - 20, H - 54, w + 40, 44, "text tokens", "CLIP-L ‖ bigG (padded) + T5-XXL\n154 × 4096", role="cond")
    f.box(xi - 20, H - 54, w + 40, 44, "noisy latent x_t", "16 ch · patch 2", role="io")
    f.box(xt, H - 104, w, 30, "linear", None, role="embed", small=True)
    f.box(xi, H - 104, w, 30, "patchify + pos. embed", None, role="embed", small=True)
    f.arrow([(xt + w / 2, H - 54), (xt + w / 2, H - 74)])
    f.arrow([(xi + w / 2, H - 54), (xi + w / 2, H - 74)])
    vy = H - 250
    f.box(6, vy - 34, 90, 68, "vector y", "pooled CLIP\n+ time t\n→ MLP", role="cond")
    f.arrow([(96, vy), (104, vy)], "w dsh", head=False)
    gtop, ytop = mmdit_block(f, H - 104, xt, xi, w, "one softmax over [text ; image]", "× 24", "MMDiT block",
                             (104, vy))
    # the text stream stops; only image tokens are decoded
    f.arrow([(xt + w / 2, ytop), (xt + w / 2, gtop - 14)], head=False)
    f.text(xt + w / 2, gtop - 20, "text tokens dropped", "lab", "middle")
    yo = gtop - 22
    f.arrow([(xi + w / 2, ytop), (xi + w / 2, yo - 24)])
    f.box(xi, yo - 58, w, 34, "adaLN · linear · unpatchify", None, role="embed", small=True)
    f.arrow([(xi + w / 2, yo - 58), (xi + w / 2, yo - 72)])
    f.box(xi, yo - 108, w, 36, "velocity v̂", "rectified flow", role="io", diff=True)
    f.text(xt + w / 2, yo - 84, "QK-RMSNorm (paper) keeps", "lab", "middle")
    f.text(xt + w / 2, yo - 70, "attention logits bounded", "lab", "middle")
    return f


def draw_flux(mid):
    f = Fig(mid, 900, crop=True)
    H = f.h
    w = 156
    xt, xi = 128, 340
    f.box(xt - 20, H - 54, w + 40, 44, "text tokens", "T5-XXL · up to 512 × 4096", role="cond")
    f.box(xi - 20, H - 54, w + 40, 44, "noisy latent x_t", "16 ch, 2×2 packed → 64", role="io")
    f.box(xt, H - 104, w, 30, "linear → 3072", None, role="embed", small=True)
    f.box(xi, H - 104, w, 30, "linear → 3072", None, role="embed", small=True, key="linear img")
    f.arrow([(xt + w / 2, H - 54), (xt + w / 2, H - 74)])
    f.arrow([(xi + w / 2, H - 54), (xi + w / 2, H - 74)])
    vy = H - 250
    f.box(6, vy - 46, 90, 92, "vector", "pooled CLIP-L\n+ time t\n+ guidance g\n→ MLP", role="cond", diff=True)
    f.arrow([(96, vy), (104, vy)], "w dsh", head=False)
    gtop, ytop = mmdit_block(f, H - 104, xt, xi, w, "24 heads · RoPE on Q, K", "× 19", "double-stream block",
                             (104, vy))
    # concat
    y = gtop - 26
    f.arrow([(xt + w / 2, ytop), (xt + w / 2, y), (240, y)], "f")
    f.arrow([(xi + w / 2, ytop), (xi + w / 2, y), (320, y)], "f")
    f.box(240, y - 13, 80, 26, "concat", None, role="embed", small=True)
    f.arrow([(280, y - 13), (280, y - 40)])
    # single-stream block
    yb = y - 40
    f.box(170, yb - 24, 220, 24, "adaLN modulation", None, role="norm", small=True, key="adaLN single")
    f.arrow([(51, vy - 46), (51, yb - 12), (170, yb - 12)], "w dsh")
    f.arrow([(280, yb - 24), (280, yb - 38)])
    f.box(170, yb - 90, 105, 52, "attention", "RoPE", role="attn", diff=True)
    f.box(285, yb - 90, 105, 52, "MLP", "in parallel", role="mlp", diff=True)
    f.arrow([(280, yb - 90), (280, yb - 104)])
    f.box(170, yb - 128, 220, 24, "linear (fused) · gate ⊕", None, role="attn", small=True)
    sg_top = yb - 160
    f.group(152, sg_top, 256, yb + 8 - sg_top, "single-stream", "× 38")
    f.arrow([(280, yb - 128), (280, sg_top - 16)])
    f.box(170, sg_top - 48, 220, 32, "image tokens → linear", None, role="embed", small=True)
    f.arrow([(280, sg_top - 48), (280, sg_top - 62)])
    f.box(170, sg_top - 98, 220, 36, "velocity v̂", "rectified flow", role="io")
    f.text(462, yb - 70, "attention and", "lab", "middle")
    f.text(462, yb - 56, "MLP read the", "lab", "middle")
    f.text(462, yb - 42, "same input", "lab", "middle")
    return f


def cofold(f, spec):
    """AlphaFold-3-family layout: trunk column on the left, diffusion module on the right.
    Drawn bottom-up on a tall canvas; the viewBox is fitted afterwards."""
    _cofold(f, spec)
    return f


def _cofold(f, spec):
    H = f.h
    d = spec.get("diff", set())
    xl, wl = 34, 196
    xr, wr = 282, 196
    cl, cr = xl + wl / 2, xr + wr / 2
    ex_t, ex_d = xl + wl - 34, xr + wr - 34      # where the trunk and the denoiser hand on their output
    bus = 252                                     # the corridor between the two columns
    # --- trunk, bottom to top
    f.box(xl, H - 50, wl, 38, spec.get("input", "sequences + ligand SMILES"), spec.get("input_sub"), role="io",
          diff="input" in d, key="input")
    y = H - 50
    for (t, s, role, key) in spec["trunk_pre"]:
        f.arrow([(cl, y), (cl, y - 14)])
        y -= 14 + 40
        f.box(xl, y, wl, 40, t, s, role=role, diff=key in d, key=key)
    tg_bot = y - 14
    f.arrow([(cl, y), (cl, y - 26)])
    y -= 26
    for i, item in enumerate(spec["trunk"]):
        t, s, role, key = item[:4]
        opt = item[4] if len(item) > 4 else {}
        h = opt.get("h", 46 if role == "pair" else 40)
        y -= h
        f.box(xl + 16, y, wl - 16, h, t, s, role=role, diff=key in d, key=key, dash=opt.get("dash", False),
              small=opt.get("small", False))
        if i < len(spec["trunk"]) - 1:
            f.arrow([(cl + 8, y), (cl + 8, y - 12)])
            y -= 12
    y_trunk_top = y
    tg_top = y - 34
    f.group(xl - 10, tg_top, wl + 20, tg_bot - tg_top + 4, spec.get("trunk_label", "trunk · once per target"),
            spec.get("recycle"), rep_cls="rep ink", rep_left=True, label_dy=24)
    # recycling arrow on the left edge, where the trunk is recycled at all
    if spec.get("recycle"):
        f.curve(f"M{xl + 4:.1f},{tg_top + 40:.1f} C{xl - 30:.1f},{tg_top + 56:.1f} {xl - 30:.1f},{tg_bot - 40:.1f} "
                f"{xl + 14:.1f},{tg_bot - 24:.1f}", "f dsh")
        f.text(xl - 23, (tg_top + tg_bot) / 2 + 8, spec.get("recycle_label", "recycle"), "lab vert halo", "middle",
               late=True)
    # trunk output
    yc = tg_top - 30
    lab = spec.get("c_label", "c = (s_i, z_{ij})")
    cw = 7 + 6.1 * len(re.sub(r"[_^{}]", "", lab))
    cx_c = min(ex_t, bus - 8 - cw / 2)
    f.arrow([(ex_t, y_trunk_top), (ex_t, yc + 5)])
    f.chip(cx_c, yc, lab, "pl ink", "middle", key="c", title="trunk output c")
    # --- diffusion module, bottom to top
    nz = spec.get("noise", ("noise at σ_{max}", "atom coordinates x"))
    f.box(xr, H - 50, wr, 38, nz[0], nz[1], role="io", key="noise")
    y = H - 50
    dg_bot = y - 14
    f.arrow([(cr, y), (cr, y - 26)])
    y -= 26
    tops = {}
    if spec.get("diffusion_fn"):
        # a denoiser that is not a plain stack draws itself; it must report the 'cond' and 'tok' boxes
        y = spec["diffusion_fn"](f, xr, wr, y, d, tops)
    else:
        for i, (t, s, role, key) in enumerate(spec["diffusion"]):
            h = 48 if s and "\n" in s else 40
            y -= h
            f.box(xr + 10, y, wr - 20, h, t, s, role=role, diff=key in d, key=key)
            tops[key] = (y, h)
            if i < len(spec["diffusion"]) - 1:
                f.arrow([(cr, y), (cr, y - 12)])
                y -= 12
    y_den_top = y
    dg_top = y - 34
    f.group(xr - 10, dg_top, wr + 20, dg_bot - dg_top + 4, spec.get("den_label", "denoiser D_θ(x, σ | c)"),
            spec["steps"], rep_left=True, label_dy=24)
    # step loop on the right edge
    f.curve(f"M{xr + wr + 6:.1f},{dg_top + 24:.1f} C{xr + wr + 26:.1f},{dg_top + 40:.1f} {xr + wr + 26:.1f},"
            f"{dg_bot - 30:.1f} {xr + wr - 2:.1f},{dg_bot - 10:.1f}", "w dsh")
    f.text(xr + wr + 30, (dg_top + dg_bot) / 2, spec.get("step_label", "x̂ → next x, σ shrinks"), "lab w vert",
           "middle")
    # the condition c: from the trunk, down the corridor, into the conditioning block
    yk, hk = tops["cond"]
    f.arrow([(cx_c + cw / 2, yc - 3), (bus, yc - 3), (bus, yk + hk / 2), (xr + 10, yk + hk / 2)], "w")
    f.text(bus + 11, (yc + yk) / 2, spec.get("bus_label", "c, the same at every step"), "lab w vert halo",
           "middle", late=True)
    # conditioning → token transformer (s through AdaLN, z as pair bias), inside the frame on the right
    yt_, ht_ = tops[spec.get("tok_key", "tok")]
    xin = xr + wr + 2
    f.arrow([(xr + wr - 10, yk + hk / 2), (xin, yk + hk / 2), (xin, yt_ + ht_ / 2), (xr + wr - 10, yt_ + ht_ / 2)],
            "w dsh")
    # output, and the confidence head where the model has one
    yt = min(yc - 11, dg_top - 9) - 196
    xh = spec.get("xhat", ("structure x̂", "S samples"))
    out = spec.get("out", ("S structures + confidence", "pLDDT · PAE · pTM"))
    f.arrow([(ex_d, y_den_top), (ex_d, yt + 140)])
    f.box(xr, yt + 104, wr, 36, xh[0], xh[1], role="io", key=spec.get("xhat_key", "xhat"))
    if spec.get("conf"):
        f.box(xl, yt + 96, wl, 52, spec["conf"][0], spec["conf"][1], role="pair", diff="conf" in d, key="conf")
        f.arrow([(ex_t, yc - 11), (ex_t, yt + 148)])
        f.arrow([(xr, yt + 122), (xl + wl, yt + 122)])
    f.box(150, yt + 14, 220, 40, out[0], out[1], role="io", key="out")
    if spec.get("conf"):
        f.arrow([(cl, yt + 96), (cl, yt + 34), (150, yt + 34)])
    f.arrow([(cr, yt + 104), (cr, yt + 34), (370, yt + 34)])
    # where the trunk is this short, say what the left column would hold in AF3 rather than
    # leaving the space blank
    if spec.get("absent"):
        label, items = spec["absent"]
        ay = yt + 70
        ah = min(tg_top - 14, yc - 24) - ay   # stop short of the trunk frame and the c chip
        f.group(xl - 10, ay, wl + 20, ah, label, cls="grp")
        for i, it in enumerate(items):
            f.text(cl, ay + ah / 2 - (len(items) - 1) * 9 + i * 18, it, "lab")


AF3_TRUNK_PRE = [("input embedder", "atoms → tokens · 3 blocks", "embed", "emb")]
AF3_TRUNK = [("template module", "2 blocks", "pair", "tmpl"),
             ("MSA module", "4 blocks · MSA → pairs z", "pair", "msa"),
             ("Pairformer", "48 blocks · triangle updates on z\nattention on s", "pair", "pf")]
AF3_DIFF = [("conditioning", "z ⊕ rel. pos. · s ⊕ Fourier(σ)", "cond", "cond"),
            ("atom encoder", "3 blocks · 32 × 128 windows", "attn", "aenc"),
            ("token transformer", "24 blocks × 16 heads · 768\npair bias from z · AdaLN(s)", "attn", "tok"),
            ("atom decoder", "3 blocks · tokens → atoms", "attn", "adec")]


def draw_af3(mid):
    f = Fig(mid, 1000, crop=True)
    return cofold(f, dict(trunk_pre=AF3_TRUNK_PRE, trunk=AF3_TRUNK, diffusion=AF3_DIFF,
                          recycle="× 4 passes", steps="× 200 steps", conf=("confidence head", "Pairformer · 4 blocks")))


def draw_boltz2(mid):
    f = Fig(mid, 1000, crop=True)
    trunk = [("template module", "2 blocks · + user templates", "pair", "tmpl"),
             ("MSA module", "4 blocks · 3 M", "pair", "msa"),
             ("Pairformer", "64 blocks · 197 M", "pair", "pf")]
    diff = [("conditioning", "all per-layer biases\nprecomputed once per target", "cond", "cond"),
            ("atom encoder", "3 blocks · 32 × 128 windows", "attn", "aenc"),
            ("token transformer", "24 × 16 heads · 768 · residual\nAdaLN on 768-ch s · 283 M", "attn", "tok"),
            ("atom decoder", "3 blocks", "attn", "adec")]
    return cofold(f, dict(trunk_pre=AF3_TRUNK_PRE, trunk=trunk, diffusion=diff, input_sub="+ method · pocket · contacts",
                          recycle="× 4 passes", steps="× 200 steps · 294 M", conf=("confidence · 8 blocks · 25 M",
                                                                                   "+ affinity module"),
                          diff={"pf", "cond", "tok", "conf", "input"}, bus_label="c, biases cached once",
                          step_label="x̂ → next x · Kabsch · + steering"))


def draw_of3(mid):
    f = Fig(mid, 1000, crop=True)
    trunk = [("template module", "2 blocks", "pair", "tmpl"),
             ("MSA module", "4 blocks · 3 M", "pair", "msa"),
             ("Pairformer", "48 blocks · 147 M", "pair", "pf")]
    diff = [("conditioning", "recomputed every call", "cond", "cond"),
            ("atom encoder", "3 blocks · as AF3", "attn", "aenc"),
            ("token transformer", "24 × 16 heads · 768 · 198 M\nresidual added (differs from SI)", "attn", "tok"),
            ("atom decoder", "3 blocks", "attn", "adec")]
    return cofold(f, dict(trunk_pre=AF3_TRUNK_PRE, trunk=trunk, diffusion=diff, recycle="× 4 passes",
                          steps="× 200 steps · 203 M", conf=("confidence head", "Pairformer 4 blocks · 13 M"),
                          diff={"tok"}))


def draw_protenix(mid):
    f = Fig(mid, 1000, crop=True)
    trunk = [("template module", "2 blocks", "pair", "tmpl"),
             ("MSA module", "4 blocks · 3 M", "pair", "msa"),
             ("Pairformer", "48 blocks · 147 M", "pair", "pf")]
    diff = [("conditioning", "pair + atom terms cached\nacross steps", "cond", "cond"),
            ("atom encoder", "3 blocks · as AF3", "attn", "aenc"),
            ("token transformer", "24 × 16 heads · 768 · 198 M\nresidual added", "attn", "tok"),
            ("atom decoder", "3 blocks", "attn", "adec")]
    return cofold(f, dict(trunk_pre=AF3_TRUNK_PRE, trunk=trunk, diffusion=diff, recycle="× 10 passes",
                          steps="× 200 steps · 203 M", conf=("confidence head", "Pairformer 4 blocks · 13 M"),
                          diff={"cond", "tok"}, bus_label="c, pair terms cached once"))


def draw_pearl(mid):
    """AF3 layout with an SO(3)-equivariant denoiser: the trunk stays invariant (triangle
    multiplication without triangle attention), the diffusion module carries vector features.
    The report gives no block counts, widths or parameters, so the card names none."""
    f = Fig(mid, 1000, crop=True)
    trunk = [("template module", "multi-chain · protein + ligands\n+ cofactors in one template", "pair", "tmpl"),
             ("MSA module", "optional, as in AF3", "pair", "msa", dict(dash=True)),
             ("trimul trunk", "PairMixer-style, invariant\nno triangle attention", "pair", "trimul")]
    diff = [("conditioning", "s, z from the trunk\n+ pocket residues, if given", "cond", "cond"),
            ("scalar + vector features", "invariants · 3-D vectors from x", "embed", "eqlift"),
            ("equivariant transformer", "EqT blocks · scalar + vector Q/K\npair bias from z · mixing",
             "attn", "eqt"),
            ("equivariant transition", "gated nonlinearity on vectors", "mlp", "eqtr")]
    return cofold(f, dict(trunk_pre=[("input embedder", "atoms → tokens", "embed", "emb")], trunk=trunk,
                          diffusion=diff, tok_key="eqt",
                          input="sequences + ligand topology", input_sub="+ templates · pocket residues",
                          recycle=None, steps="× ≥ 200 steps", conf=None,
                          xhat=("structure x̂", "vector output · SO(3)-equivariant"),
                          out=("S protein–ligand poses", "no confidence head described"),
                          diff={"input", "tmpl", "trimul", "cond", "eqlift", "eqt", "eqtr"},
                          absent=("not in the report", ["block counts and widths", "parameter count",
                                                        "confidence head"]),
                          bus_label="c is invariant, x̂ equivariant",
                          step_label="x̂ → next x · + guidance, steering"))


def draw_esmfold2(mid):
    f = Fig(mid, 1000, crop=True)
    trunk_pre = [("ESM C protein LM", "6 B parameters, frozen", "cond", "lm")]
    trunk = [("MSA module", "optional · 4 layers", "pair", "msa", dict(dash=True)),
             ("pair stack", "48 layers · 256-ch z\nno single track", "pair", "pair")]
    diff = [("conditioning", "s^{inputs} ⊕ Fourier(σ) → 768\nz cached across steps", "cond", "cond"),
            ("atom encoder", "sliding window 128 · Flash\n3D RoPE from ref. conformer", "attn", "aenc"),
            ("token transformer", "12 blocks × 16 heads · 768\n120 M · residual", "attn", "tok"),
            ("atom decoder", "3 blocks · RoPE", "attn", "adec")]
    return cofold(f, dict(trunk_pre=trunk_pre, trunk=trunk, diffusion=diff, recycle="× 10 loops",
                          recycle_label="contractive loop", c_label="c = (s^{inputs}, z_{ij})",
                          steps="× 10–68 steps · 131 M", conf=("confidence head", "4 pair folding layers"),
                          diff={"lm", "msa", "pair", "cond", "aenc", "tok", "conf"},
                          bus_label="c: no trunk single, only z",
                          step_label="x̂ → next x · Kabsch · from σ = 256 Å"))


def draw_mol1(mid):
    """Protenix with a heterogeneous-width trunk: 8 PairMixer blocks at 448 channels, a learned
    down-projection, 40 Pairformer blocks at 320 channels, an up-projection back to 448."""
    f = Fig(mid, 1000, crop=True)
    trunk = [("template module", "2 blocks · 448-ch z", "pair", "tmpl"),
             ("MSA module", "4 blocks · c_m = 192 · 31 M", "pair", "msa"),
             ("PairMixer", "8 blocks · 448-ch z · 59 M\nno triangle attention", "pair", "pmix"),
             ("linear 448 → 320", None, "embed", "down", dict(h=26, small=True)),
             ("Pairformer", "40 blocks · 320-ch z · 240 M", "pair", "pf"),
             ("linear 320 → 448", None, "embed", "up", dict(h=26, small=True))]
    diff = [("conditioning", "448-ch z · pair biases of all 24\nlayers projected once per target", "cond", "cond"),
            ("atom encoder", "3 blocks · as AF3", "attn", "aenc"),
            ("token transformer", "24 × 16 heads · 768 · 198 M\nresidual added", "attn", "tok"),
            ("atom decoder", "3 blocks", "attn", "adec")]
    return cofold(f, dict(trunk_pre=AF3_TRUNK_PRE, trunk=trunk, diffusion=diff, recycle="× 20 passes",
                          steps="× 200 steps · 206 M", conf=("confidence head", "Pairformer 4 blocks · 448-ch · 38 M"),
                          diff={"tmpl", "msa", "pmix", "down", "pf", "up", "cond", "conf"},
                          bus_label="c, pair biases cached once"))


def draw_rfd3(mid):
    """The same two columns as AF3, with the trunk cut down to two layers: the left column is
    nearly empty, which is the point of the card."""
    f = Fig(mid, 1000, crop=True)
    trunk_pre = [("atomisation", "4 + 10 atoms per residue", "embed", "atomise"),
                 ("input embedder", "atoms → tokens", "embed", "emb")]
    trunk = [("Pairformer", "2 layers · no triangle updates", "pair", "pf")]
    diff = [("conditioning", "motif atoms sit in the noise cloud\ns ⊕ Fourier(σ) · CFG γ_{CFG}", "cond", "cond"),
            ("downsample · atom encoder", "sparse: geometric neighbours\ncross-attention atoms → tokens",
             "attn", "aenc"),
            ("token transformer", "sparse attention over tokens", "attn", "tok"),
            ("upsample · atom decoder", "tokens modulate atoms\n→ coordinate update", "attn", "adec")]
    return cofold(f, dict(trunk_pre=trunk_pre, trunk=trunk, diffusion=diff,
                          input="design conditions", input_sub="motif atoms · ligands · symmetry",
                          recycle=None, trunk_label="conditioning trunk · once per target",
                          steps="× 100 steps · 168 M", conf=None,
                          xhat=("designed structure x̂", "all atoms, backbone + sidechain"),
                          out=("protein, RNA or DNA design", "sequence from MPNN, or codesigned"),
                          diff={"input", "atomise", "pf", "cond", "aenc", "tok"},
                          absent=("what AF3 has here", ["MSA module", "template module", "confidence head"]),
                          bus_label="c from 2 layers, not 48",
                          step_label="x̂ → next x · step scale · recycled every step"))


def draw_rfd4(mid):
    """RFD4-Proteina: no trunk/denoiser split. One 14-layer single/pair network is the denoiser and is
    re-run R_t times inside every flow step; two flow heads and two detached heads read the single track;
    a decoder turns anchors + latents into atoms."""
    f = Fig(mid, 1100, crop=True)
    H = f.h
    xl, xr = 56, 446
    cx = (xl + xr) / 2
    # --- inputs: two noised states on their own clocks, and the design conditions
    y0 = H - 50
    bw, bg = 124, 9
    xs0 = [xl, xl + bw + bg, xl + 2 * (bw + bg)]
    f.box(xs0[0], y0, bw, 38, "noised anchors x_t", "token anchors · clock t_x", role="io", key="xt", small=True)
    f.box(xs0[1], y0, bw, 38, "noised latents ℓ_t", "32 per token · clock t_ℓ", role="io", key="lt", small=True,
          diff=True)
    f.box(xs0[2], y0, bw, 38, "conditions", "motifs · ligands · tasks", role="cond", key="conds", small=True)
    y = y0 - 14
    for k, x in enumerate(xs0):
        f.arrow([(x + bw / 2, y0), (x + bw / 2, y)], "w" if k == 2 else "f")
    y -= 40
    f.box(xl, y, xr - xl, 40, "input embedder", "s_i: 768 · z_{ij}: 384 · adaLN: 256", role="embed", key="emb")
    y_emb = y
    f.arrow([(cx, y), (cx, y - 58)])
    # --- one trunk layer, drawn once: single lane left, pair lane right
    ly_bot = y - 58
    lw = 170
    xs, xp = xl + 14, xr - 14 - lw
    cs, cp = xs + lw / 2, xp + lw / 2
    yp = ly_bot - 6 - 34
    f.box(xp, yp, lw, 34, "single → pair update", "a_i ⊙ b_j · every layer", role="pair", key="hadamard",
          small=True, diff=True)
    yp_h = yp
    f.arrow([(cp, yp), (cp, yp - 10)])
    yp -= 10 + 44
    f.box(xp, yp, lw, 44, "triangle multiplication", "outgoing + incoming\nevery other layer", role="pair",
          key="trimult", small=True, diff=True)
    f.arrow([(cp, yp), (cp, yp - 10)])
    yp -= 10 + 26
    f.box(xp, yp, lw, 26, "pair transition", None, role="mlp", key="ptrans", small=True)
    yp_top = yp
    ys = ly_bot - 6 - 44
    f.box(xs, ys, lw, 44, "self-attention", "12 heads × 64 · QK-norm\npair bias β_ij · gated", role="attn",
          key="attn", small=True)
    ys_a = ys
    f.arrow([(cs, ys), (cs, ys - 10)])
    ys -= 10 + 36
    f.box(xs, ys, lw, 36, "token transition", "SwiGLU · hidden 3072", role="mlp", key="trans", small=True)
    # s_i feeds the Hadamard update; the pair track biases the attention logits
    f.arrow([(xs + lw, ys_a + 38), (xp, yp_h + 17)], "w")
    xm = (xs + lw + xp) / 2
    f.arrow([(xp, yp_top + 13), (xm, yp_top + 13), (xm, ys_a + 10), (xs + lw, ys_a + 10)], "w dsh")
    # adaLN feeds both lanes
    ytop_lane = min(ys, yp_top)
    ya = ytop_lane - 22
    f.box(xl + 14, ya - 28, xr - xl - 28, 28, "adaLN features", "t_x, t_ℓ · molecular conditions", role="norm",
          key="adaln", small=True)
    lg_top = ya - 28 - 34
    f.group(xl, lg_top, xr - xl, (ly_bot + 6) - lg_top + 4, "trunk layer", "× 14", rep_left=True, label_dy=24)
    # --- recycling: the whole stack, same weights, read out after the last pass
    rg_bot = (ly_bot + 6) + 4 + 28
    rg_top = lg_top - 58
    f.group(xl - 24, rg_top, xr - xl + 48, rg_bot - rg_top, None)
    f.text(cx, rg_bot - 10, "recycled: s, z projected and added back to the input embeddings", "lab", "middle")
    f.curve(f"M{xl - 4:.1f},{rg_top + 62:.1f} C{xl - 30:.1f},{rg_top + 82:.1f} {xl - 30:.1f},{rg_bot - 40:.1f} "
            f"{xl - 6:.1f},{rg_bot - 22:.1f}", "f dsh")
    # --- heads, fanned out of the final single representation
    hw, hg = 92, 7
    hx0 = xl + (xr - xl - 4 * hw - 3 * hg) / 2
    jy = rg_top + 24                       # the junction, just inside the recycling frame
    f.arrow([(cx, lg_top), (cx, jy)], head=False)
    yh = rg_top - 24
    f.raw(f'<path class="ln f" d="M{hx0 + hw / 2:.1f},{jy:.1f} H{hx0 + 3 * (hw + hg) + hw / 2:.1f}"/>')
    heads = [("coordinate\nvelocity", "v_x · N_{tok} × 3", "mlp", "vx", False),
             ("latent\nvelocity", "v_ℓ · N_{tok} × 32", "mlp", "vl", False),
             ("sequence\nhead", "147 classes", "attn", "seqhead", True),
             ("motif\nmapping", "motif tokens", "attn", "mapping", True)]
    for i, (t, sub, role, key, dash) in enumerate(heads):
        x = hx0 + i * (hw + hg)
        f.box(x, yh - 54, hw, 54, t, sub, role=role, key=key, dash=dash, small=True, diff=i >= 2)
        f.arrow([(x + hw / 2, jy), (x + hw / 2, yh)], "f dsh" if i >= 2 else "f")
    f.text(cx - 8, jy + 17, "final s_i", "lab halo", "end", late=True)
    f.badge(hx0 + 1.5 * (hw + hg) + hw / 2, rg_top, "× 1–9 passes", "rep ink", "middle")
    y_heads_top = yh - 54
    # --- the flow step: everything above, repeated for 60 steps
    st_bot = y0 + 38 + 38
    st_top = y_heads_top - 46
    f.group(xl - 38, st_top, xr - xl + 76, st_bot - st_top, "flow step at times t_x, t_ℓ", "× 60 steps",
            rep_left=True, label_dy=24)
    yr = y0 + 38 + 12                     # the return line under the inputs
    f.curve(f"M{xr + 38:.1f},{st_top + 40:.1f} C{xr + 64:.1f},{st_top + 70:.1f} {xr + 64:.1f},{yr - 30:.1f} "
            f"{xr + 30:.1f},{yr:.1f}", "w dsh", head=False)
    f.arrow([(xr + 30, yr), (xs0[0] + bw / 2, yr)], "w dsh", head=False)
    for k in (0, 1):
        f.arrow([(xs0[k] + bw / 2, yr), (xs0[k] + bw / 2, y0 + 38 + 3)], "w dsh")
    f.text(cx, yr + 16, "next x_t, ℓ_t: stochastic TSR update, both clocks advance", "lab w", "middle")
    # --- decoder and output
    yd = st_top - 30
    f.arrow([(hx0 + hw + hg + hw / 2, st_top), (hx0 + hw + hg + hw / 2, yd)])
    f.arrow([(hx0 + 2 * (hw + hg) + hw / 2, y_heads_top), (hx0 + 2 * (hw + hg) + hw / 2, yd)], "f dsh")
    f.text(hx0 + hw + hg + hw / 2 - 8, st_top - 20, "x_0, ℓ_0 after the last step", "lab halo", "end", late=True)
    f.box(xl + 20, yd - 46, xr - xl - 40, 46, "decoder", "12 layers × 12 heads × 768 · no pair track\n"
          "anchors + latents + sequence → atoms", role="latent", key="dec", diff=True)
    f.arrow([(cx, yd - 46), (cx, yd - 46 - 22)])
    f.box(xl + 20, yd - 46 - 22 - 40, xr - xl - 40, 40, "all-atom design",
          "backbone · rotamers · ligand pose · sequence", role="io", key="out")
    return f


def draw_bioemu(mid):
    """BioEmu 1: a frozen AlphaFold 2 encoder on the left, a small IPA score model over backbone frames on
    the right. Same two columns as AF3, because the split is the same: condition once, denoise many times."""
    f = Fig(mid, 1000, crop=True)
    trunk_pre = [("MSA search", "ColabFold MMseqs2 · no templates", "embed", "msasearch")]
    trunk = [("AlphaFold 2 Evoformer", "48 blocks · weights frozen\nmodel 3 · no recycling", "pair", "evo")]
    diff = [("input projections", "s → 512 ⊕ sinusoidal(t)\nz → 256 ⊕ rel. position", "cond", "cond"),
            ("IPA layer", "8 layers × 32 heads · 512\npoint attention in x_t's frames", "attn", "ipa"),
            ("score heads", "translation · rotation", "mlp", "heads")]
    return cofold(f, dict(trunk_pre=trunk_pre, trunk=trunk, diffusion=diff,
                          input="protein sequence", input_sub="one chain · no ligands",
                          recycle=None, trunk_label="frozen AF2 · once per sequence", tok_key="ipa",
                          noise=("noise at t = 1", "Cα Gaussian · uniform rotations"),
                          den_label="score model s_θ(x_t, t | c)",
                          steps="× 49 steps · 31 M", conf=None,
                          xhat=("scores ŝ_r, ŝ_Q", "per residue, in its own frame"), xhat_key="score",
                          out=("backbone ensemble", "10⁴ samples · side chains by H-Packer"),
                          absent=("not in BioEmu", ["no trained trunk: AF2 is frozen",
                                                    "no atoms beyond the backbone", "no confidence head"]),
                          bus_label="c, cached once per sequence",
                          step_label="score → DPM-Solver-2 step · t → 0"))


def _bioemu2_denoiser(f, xr, wr, y, d, tops):
    """Two residual streams side by side, atoms on the left and tokens on the right, joined by a coupling
    step in every layer. There is no atom encoder or decoder around a token transformer as in AF3."""
    x0, x1 = xr + 10, xr + wr - 10
    lw = (x1 - x0 - 8) / 2
    xa, xt = x0, x1 - lw                       # left edges of the atom and the token lane
    ca, ct = xa + lw / 2, xt + lw / 2
    # conditioning: c from the trunk, the noise level and the lag; z for the pair bias
    y -= 48
    f.box(x0, y, x1 - x0, 48, "conditioning", "s ⊕ Fourier(σ) ⊕ lag Δt → 768\nz ⊕ rel. pos. → 256 · cached",
          role="cond", diff="cond" in d, key="cond")
    tops["cond"] = (y, 48)
    for cx in (ca, ct):
        f.arrow([(cx, y), (cx, y - 12)])
    y -= 12 + 40
    f.box(xa, y, lw, 40, "atoms q", "x_t + reference\n(+ start frame)", role="embed", diff="ain" in d, key="ain",
          small=True)
    f.box(xt, y, lw, 40, "tokens a", "s^{trunk} + x_t\nof centre atom", role="embed", diff="tin" in d, key="tin",
          small=True)
    for cx in (ca, ct):
        f.arrow([(cx, y), (cx, y - 22)])
    # one dual-stream layer
    gb = y - 12
    y = gb - 12
    y -= 38
    f.box(xa, y, lw, 38, "atom attn", "window 32×128", role="attn", diff="aatt" in d, key="aatt", small=True)
    f.box(xt, y, lw, 38, "token attn", "pair bias z", role="attn", diff="tok" in d, key="tok", small=True)
    tops["tok"] = (y, 38)
    for cx in (ca, ct):
        f.arrow([(cx, y), (cx, y - 10)])
    y -= 10 + 24
    f.box(xa, y, lw, 24, "MLP · 128", None, role="mlp", diff="amlp" in d, key="amlp", small=True)
    f.box(xt, y, lw, 24, "MLP · 768", None, role="mlp", diff="tmlp" in d, key="tmlp", small=True)
    for cx in (ca, ct):
        f.arrow([(cx, y), (cx, y - 12)])
    y -= 12 + 40
    f.box(x0, y, x1 - x0, 40, "atom ↔ token coupling", "via each token's centre atom", role="mlp",
          diff="coup" in d, key="coup")
    gt = y - 32
    f.group(x0 - 6, gt, x1 - x0 + 12, gb - gt, "dual-stream layer", "× 16")
    for cx in (ca, ct):
        f.arrow([(cx, y), (cx, gt - 12)])
    y = gt - 12 - 40
    f.box(x0, y, x1 - x0, 40, "readout", "token ⊕ atom → Δx per atom", role="embed", diff="readout" in d,
          key="readout")
    return y


def draw_bioemu2(mid):
    f = Fig(mid, 1000, crop=True)
    trunk_pre = [("input embedder", "atoms → tokens · 3 blocks", "embed", "emb"),
                 ("mode · contacts", "MD or non-MD token · contacts", "cond", "mode")]
    trunk = [("MSA module", "4 blocks · no triangle attention", "pair", "msa"),
             ("PairMixer", "48 blocks · triangle mult. only\nz 256 ch · s not updated", "pair", "pairmixer")]
    return cofold(f, dict(trunk_pre=trunk_pre, trunk=trunk, diffusion_fn=_bioemu2_denoiser,
                          input="sequences + ligands", input_sub="MSA · start frame for propagation",
                          recycle="× 4 passes", steps="× 200 steps · 425 M", conf=None,
                          xhat=("structure x̂", "all atoms · S samples"),
                          out=("ensemble or one structure", "η = 1 for ensembles, 1.5 for one"),
                          absent=("what AF3 has here", ["template module", "triangle attention",
                                                         "attention on the single track", "confidence head"]),
                          diff={"input", "mode", "msa", "pairmixer", "cond", "ain", "tin", "aatt", "tok", "coup",
                                "readout"},
                          bus_label="c, cached once per target",
                          step_label="x̂ → next x · Kabsch · η = 1 or 1.5"))


def draw_rfdiffusion(mid):
    f = Fig(mid, 900, crop=True)
    H = f.h
    f.box(150, H - 50, 220, 38, "noised residue frames x_t", "Cα: Gaussian · rotation: IGSO(3)", role="io")
    f.box(390, H - 50, 116, 38, "motif · hotspots", "symmetry", role="cond")
    f.box(14, H - 50, 120, 38, "previous x̂₀", "self-conditioning", role="cond", dash=True)
    og_bot = H - 72
    f.arrow([(260, H - 50), (260, og_bot - 14)])
    f.arrow([(448, H - 50), (448, og_bot - 14)], "w")
    f.arrow([(74, H - 50), (74, og_bot - 14)], "w dsh")
    # one three-track block: the lanes, bottom-up, with the exchanges between them
    ig_bot = og_bot - 14
    lanes = [("1D track", "per residue · 256 ch", "embed", ["MSA attention", "transition"]),
             ("2D track", "residue pairs · 128 ch", "pair", ["pair update", "biaxial attention"]),
             ("3D track", "frames, kNN graph", "attn", ["SE(3)-transformer", "frame update"])]
    lw, gx = 128, 14
    x0 = 260 - (3 * lw + 2 * gx) / 2
    rows = []
    for i, (t, sub, role, ops) in enumerate(lanes):
        x = x0 + i * (lw + gx)
        yy = ig_bot - 12
        for j, op in enumerate(ops):
            if j:
                f.arrow([(x + lw / 2, yy), (x + lw / 2, yy - 12)])
                yy -= 12
            yy -= 28
            f.box(x + 4, yy, lw - 8, 28, op, None, role=role, small=True)
            if i == 0:
                rows.append(yy + 14)
        f.text(x + lw / 2, yy - 24, t, "bt")
        f.text(x + lw / 2, yy - 10, sub, "bs")
        top_ops = yy - 40
    for i in range(2):
        xa, xb = x0 + i * (lw + gx) + lw - 4, x0 + (i + 1) * (lw + gx) + 4
        f.arrow([(xa, rows[0]), (xb, rows[0])])
        f.arrow([(xb, rows[1]), (xa, rows[1])])
    ig_top = top_ops - 26
    f.group(x0 - 12, ig_top, 3 * lw + 2 * gx + 24, ig_bot - ig_top, "three-track block", "× 36")
    f.arrow([(260, ig_top), (260, ig_top - 16)])
    f.box(x0 + 4, ig_top - 54, 3 * lw + 2 * gx - 8, 38, "structure refinement", "4 SE(3)-transformer blocks",
          role="attn")
    og_top = ig_top - 94
    f.group(24, og_top, 464, og_bot - og_top, "denoiser · RoseTTAFold, fine-tuned", "× 50–200 steps",
            rep_left=True, label_dy=24)
    # step loop on the right edge
    f.curve(f"M492,{og_top + 24:.1f} C510,{og_top + 40:.1f} 510,{og_bot - 30:.1f} 484,{og_bot - 8:.1f}", "w dsh")
    f.text(514, (og_top + og_bot) / 2, "x̂₀ → next x_t: a step toward x̂₀", "lab w vert", "middle")
    f.arrow([(260, ig_top - 54), (260, og_top - 22)])
    f.box(150, og_top - 60, 220, 38, "predicted x̂₀", "clean frames, not ε", role="io")
    # self-conditioning: the prediction goes back in as a template at the next step
    yx = og_top - 41
    f.curve(f"M150,{yx:.1f} H38 Q12,{yx:.1f} 12,{yx + 26:.1f} V{H - 74:.1f} Q12,{H - 60:.1f} 30,{H - 53:.1f}",
            "w dsh")
    return f


# ----------------------------------------------------------------------------------------
# The models: facts first, drawing second
# ----------------------------------------------------------------------------------------

MODELS = [
    dict(id="ddpm", name="DDPM", year=2020, org="UC Berkeley", domain="image",
         paper="Ho, Jain, Abbeel · NeurIPS 2020", url="https://arxiv.org/abs/2006.11239",
         space="pixels", backbone="U-Net (PixelCNN++ / Wide ResNet blocks)", params="35.7 M (CIFAR-10)",
         params_m=35.7, conditioning="none (unconditional); time t added in every ResBlock",
         objective="ε-prediction, simple MSE", steps="1000 (ancestral)",
         novelty="The template: a convolutional U-Net with one attention level predicts the noise.",
         notes=["Four resolutions at 32²: two ResBlocks per level going down, three coming up; channel multipliers (1, 2, 2, 2) in the released code.",
                "Self-attention only at 16² and in the bottleneck; the time step is added in every ResBlock.",
                "Linear β schedule from 10⁻⁴ to 0.02 over T = 1000 steps."],
         vs=None, draw=draw_ddpm),
    dict(id="adm", name="ADM", year=2021, org="OpenAI", domain="image",
         paper="Dhariwal & Nichol · NeurIPS 2021", url="https://arxiv.org/abs/2105.05233",
         space="pixels", backbone="U-Net, attention at three resolutions", params="554 M (ImageNet 256)",
         params_m=554, conditioning="class + time via adaptive GroupNorm; classifier guidance",
         objective="ε and Σ (hybrid loss)", steps="250 (DDPM) / 25 (DDIM)",
         novelty="Architecture search on the U-Net: more heads, attention at 32/16/8, AdaGN, guidance.",
         notes=["Channel multipliers (1, 1, 2, 2, 4, 4) at 256², base width 256.",
                "AdaGN: GroupNorm whose scale and shift come from the time and class embedding.",
                "A separate noise-aware classifier steers sampling by ∇ log p(y | x_t)."],
         vs='DDPM', draw=draw_adm),
    dict(id="sd1", name="Latent Diffusion / SD 1", year=2022, org="LMU Munich · Runway · Stability", domain="image",
         paper="Rombach et al. · CVPR 2022", url="https://arxiv.org/abs/2112.10752",
         space="VAE latent, f = 8", backbone="U-Net + transformer blocks", params="860 M U-Net + 123 M text encoder",
         params_m=860, conditioning="cross-attention to frozen CLIP ViT-L/14 tokens",
         objective="ε-prediction", steps="≈ 50 (PNDM / DDIM) + CFG",
         novelty="Diffuse in a compressed latent, read the prompt through cross-attention.",
         notes=["512² images become 4 × 64 × 64 latents.",
                "Every attention level is a transformer block: self-attn → cross-attn(text) → FFN.",
                "Classifier-free guidance replaces the separate classifier."],
         vs='ADM', draw=draw_sd1),
    dict(id="sdxl", name="SDXL", year=2023, org="Stability AI", domain="image",
         paper="Podell et al. · ICLR 2024", url="https://arxiv.org/abs/2307.01952",
         space="VAE latent, f = 8", backbone="U-Net, transformer depth 0 / 2 / 10", params="2.6 B U-Net",
         params_m=2600, conditioning="two text encoders (2048-d context) + size / crop conditioning",
         objective="ε-prediction", steps="≈ 40–50 + optional refiner",
         novelty="Same U-Net idea, three times larger, compute moved to the low resolutions.",
         notes=["The 128² level has no attention; the 64² level runs 2 transformer blocks after every ResBlock, the 32² level 10.",
                "Original size, crop offsets and target size are Fourier-embedded (256 per number) and, with the pooled bigG embedding, form a 2816-d vector that is added to the time embedding.",
                "A second refiner model polishes the last noise levels (SDEdit-style)."],
         vs='SD 1', draw=draw_sdxl),
    dict(id="dit", name="DiT", year=2023, org="UC Berkeley · NYU", domain="image",
         paper="Peebles & Xie · ICCV 2023", url="https://arxiv.org/abs/2212.09748",
         space="VAE latent, f = 8", backbone="plain transformer on 2×2 latent patches", params="675 M (DiT-XL/2)",
         params_m=675, conditioning="adaLN-Zero from time + class", objective="ε and Σ",
         steps="250 (DDPM) + CFG",
         novelty="Drop the U-Net: a ViT on latent patches, conditioned by adaptive LayerNorm.",
         notes=["28 blocks, width 1152, 16 heads; 256 tokens for a 256² image.",
                "adaLN-Zero regresses scale, shift and a gate per sub-layer; gates start at zero.",
                "Quality tracks GFLOPs: the scaling argument that moved the field to transformers."],
         vs='the latent U-Net of SD 1', draw=draw_dit),
    dict(id="uvit", name="U-ViT", year=2023, org="Tsinghua", domain="image",
         paper="Bao et al. · CVPR 2023", url="https://arxiv.org/abs/2209.12152",
         space="pixels or latent", backbone="ViT with long skip connections", params="501 M (U-ViT-H/2)",
         params_m=501, conditioning="time and condition as input tokens", objective="ε-prediction",
         steps="50 (DPM-Solver) + CFG",
         novelty="Everything is a token; the U-Net survives only as long skips.",
         notes=["Time, class or text tokens are simply prepended to the patch sequence.",
                "U-ViT-H/2: 14 shallow blocks, 1 middle block, 14 deep blocks; shallow block i is joined to deep block i by concatenation + linear.",
                "An optional 3×3 convolution after unpatchify smooths patch borders; the ImageNet-256 U-ViT-H/2 model runs without it."],
         vs='DiT', draw=draw_uvit),
    dict(id="sd3", name="SD3 · MMDiT", year=2024, org="Stability AI", domain="image",
         paper="Esser et al. · ICML 2024", url="https://arxiv.org/abs/2403.03206",
         space="VAE latent, 16 channels", backbone="MMDiT: two weight sets, one joint attention",
         params="2 B – 8 B", params_m=8000,
         conditioning="text tokens in the sequence; pooled CLIP + t via adaLN",
         objective="rectified flow (velocity), logit-normal t", steps="28 (Euler, Medium)",
         novelty="Text and image get their own weights but attend jointly in both directions.",
         notes=["Three text encoders: CLIP-L and OpenCLIP bigG (77 × 2048, zero-padded to 4096 channels) and T5-XXL (77 × 4096).",
                "Width 64 · depth; depth 24 in SD3 Medium, 38 in the 8 B model.",
                "RMSNorm on Q and K keeps the attention logits bounded; the paper adds it for stable mixed-precision training at high resolution."],
         vs='DiT', draw=draw_sd3),
    dict(id="flux", name="FLUX.1", year=2024, org="Black Forest Labs", domain="image",
         paper="BFL model release · FLUX.1 Kontext report 2025", url="https://arxiv.org/abs/2506.15742",
         space="VAE latent, 16 channels", backbone="19 double-stream + 38 single-stream blocks",
         params="12 B", params_m=12000, conditioning="T5 tokens in sequence; CLIP pooled + t + guidance via adaLN",
         objective="rectified flow (velocity), guidance-distilled [dev]", steps="28–50",
         novelty="MMDiT first, then cheaper single-stream blocks with parallel attention and MLP.",
         notes=["Hidden width 3072, 24 heads of 128; RoPE on Q and K over three axes of 16 + 56 + 56 channels.",
                "2×2 latent patches are packed into 64-channel tokens.",
                "[dev] takes the guidance scale as an input instead of running CFG twice."],
         vs='SD3', draw=draw_flux),
    dict(id="rfdiffusion", name="RFdiffusion", year=2023, org="Baker lab, UW", domain="bio",
         paper="Watson et al. · Nature 2023", url="https://www.nature.com/articles/s41586-023-06415-8",
         space="residue frames (Cα + orientation)", backbone="RoseTTAFold, fine-tuned (three tracks)",
         params="not stated in the paper", params_m=None,
         conditioning="motif, binder hotspots, symmetry; self-conditioning on previous x̂₀",
         objective="x̂₀-prediction on frames", steps="200 in the paper, 50 in the released config",
         novelty="A structure predictor turned into a denoiser of backbone frames for design.",
         notes=["Translations are noised with Gaussians, rotations with IGSO(3).",
                "36 three-track blocks and 4 SE(3) refinement blocks (released config); x_t enters as 3D-track coordinates.",
                "The network predicts the clean structure; the loss is an unaligned frame MSE, not FAPE; its previous prediction is fed back as a template.",
                "Conditioning is mostly by fixing parts of the input (motifs) rather than by a separate encoder."],
         vs=None, draw=draw_rfdiffusion),
    dict(id="af3", name="AlphaFold 3", year=2024, org="Google DeepMind · Isomorphic", domain="bio",
         paper="Abramson et al. · Nature 2024", url="https://www.nature.com/articles/s41586-024-07487-w",
         space="all-atom coordinates", backbone="Pairformer trunk + diffusion transformer", params="not stated in the paper",
         params_m=None, conditioning="single s and pair z from the trunk: AdaLN(s), pair bias from z",
         objective="x̂ (EDM preconditioning), σ_data = 16 Å", steps="200",
         novelty="Replaces AF2's structure module with an all-atom diffusion module conditioned on the trunk.",
         notes=["The trunk runs once per target; the denoiser runs 200 steps × S samples.",
                "Token transformer: 24 blocks × 16 heads × 768, pair bias from z, AdaLN(s); no residual as printed in SI Alg. 23.",
                "Atom attention is local: blocks of 32 query × 128 key atoms."],
         vs=None, draw=draw_af3),
    dict(id="boltz2", name="Boltz-2", year=2025, org="MIT · Recursion", domain="bio",
         paper="Passaro, Corso, Wohlwend et al. · 2025", url="https://doi.org/10.1101/2025.06.14.659707",
         space="all-atom coordinates", backbone="AF3 layout, 64 Pairformer blocks", params="521 M (denoiser 294 M)",
         params_m=521, conditioning="AF3-style; biases precomputed once; method, template, contact conditioning",
         objective="x̂ (EDM)", steps="200 + optional physics steering",
         novelty="AF3 layout with a deeper trunk, an affinity head and inference-time steering.",
         notes=["Pairformer 64 blocks (197 M), confidence 8 blocks (25 M).",
                "Token transformer 283 M (checkpoint) vs 198 M in OpenFold3 and Protenix: AdaLN on a 768-ch s adds 42 M, a wider SwiGLU gate 28 M (269 M by code); 14 M unexplained.",
                "Same denoiser as Boltz-1; per-layer pair biases are computed once per target; x is Kabsch-aligned onto x̂ before every step.",
                "Prediction, not design: the input is a given sequence (plus ligand or partner), the output its structure, a confidence "
                "score and, for a ligand, an affinity. A design model such as RFdiffusion3 or RFD4-Proteina starts from a target "
                "and returns a new molecule; in a design pipeline a predictor like this is the filter that refolds the result."],
         vs='AlphaFold 3', draw=draw_boltz2),
    dict(id="openfold3", name="OpenFold3", year=2025, org="OpenFold consortium", domain="bio",
         paper="OpenFold3 preview · 2025", url="https://github.com/aqlaboratory/openfold-3",
         space="all-atom coordinates", backbone="AF3 reproduction, 48 Pairformer blocks", params="368 M (denoiser 203 M)",
         params_m=368, conditioning="AF3 layout and widths; recomputed every call", objective="x̂ (EDM)",
         steps="200", novelty="Open AF3 reproduction; adds the residual the SI omits.",
         notes=["Pairformer 147 M, MSA module 3 M, confidence 13 M.",
                "Token transformer gets a residual connection (code comment: 'differs from SI').",
                "A use_conditioning flag can drop the trunk input entirely."],
         vs='AlphaFold 3', draw=draw_of3),
    dict(id="protenix", name="Protenix", year=2025, org="ByteDance", domain="bio",
         paper="Protenix technical report · 2025", url="https://github.com/bytedance/Protenix",
         space="all-atom coordinates", backbone="AF3 reproduction, 48 Pairformer blocks", params="368 M (denoiser 203 M)",
         params_m=368, conditioning="AF3 layout; pair and atom conditioning cached across steps",
         objective="x̂ (EDM)", steps="200", novelty="PyTorch AF3 reproduction tuned for throughput.",
         notes=["Residual added in the token transformer; training did not converge without it.",
                "Custom LayerNorm and triangle kernels in the trunk; denoiser attention through PyTorch SDPA; samples in chunks of 5.",
                "10 recycling passes by default."],
         vs='AlphaFold 3', draw=draw_protenix),
    dict(id="pearl", name="Pearl", year=2025, org="Genesis Molecular AI", domain="bio",
         paper="Genesis Research Team · arXiv 2025", url="https://arxiv.org/abs/2510.24670",
         space="all-atom coordinates", backbone="invariant trimul trunk + SO(3)-equivariant diffusion module",
         params="not stated in the report", params_m=None,
         conditioning="invariant trunk features s, z; multi-chain templates with ligands and cofactors; pocket residues",
         objective="x̂ (diffusion; details not reported)", steps="≥ 200 (DECAF, Pearl-2026.1.dev)",
         novelty="The only all-atom co-folding denoiser here that is SO(3)-equivariant by construction; the trunk keeps only "
                 "triangle multiplication.",
         notes=["Trunk: rotation- and translation-invariant, with 'a lightweight triangle multiplication (trimul) "
                "module for efficiency', citing PairMixer (Ouyang-Zhang et al. 2025, same group). Depth and widths "
                "are not given.",
                "Diffusion module: equivariant transformer (EqT) blocks on scalar and vector features. Attention "
                "weights come from scalar and vector queries and keys plus the pair representation; a feed-forward "
                "layer gates the vector channels (report Fig. 2). Equivariance comes from the architecture and data "
                "augmentation together; AF3's denoiser relies on augmentation alone.",
                "Templates cover several chains and non-polymers at once (cofactors, related ligands), to give a "
                "holo-like pocket. Two modes: unconditional (sequence and ligand topology, optional MSA and "
                "templates) and pocket-conditional.",
                "Training data: PDB before 2021-09-30, monomer distillation (OpenFold, AFDB) and a large synthetic "
                "set of physics-generated protein–ligand complexes; success on a hold-out set rises monotonically "
                "with the synthetic share (582,065 structures in the scaling run). Five-stage curriculum.",
                "No weights or code were released with the report. Runs N' Poses (RMSD < 2 Å and PB-valid, best@5): 85.2 % "
                "against 74.4 % for AF3. A few-step DECAF distillation (2026) matches a later checkpoint at 40 NFE."],
         vs='AlphaFold 3', draw=draw_pearl),
    dict(id="bioemu", name="BioEmu", year=2025, org="Microsoft Research AI for Science", domain="bio",
         paper="Lewis, Hempel, Jiménez-Luna, Gastegger et al. · Science 2025",
         url="https://doi.org/10.1126/science.adv9817",
         space="backbone frames (Cα + orientation)", backbone="frozen AF2 Evoformer + 8-layer IPA score model",
         params="31 M trainable", params_m=31.3,
         conditioning="frozen AF2 single and pair embeddings: added to s, pair bias and pair values from z",
         objective="score matching: VP-SDE (cosine) on Cα, IGSO(3) on orientations",
         steps="49 (50 time points, DPM-Solver-2, 98 network calls)",
         novelty="Samples equilibrium ensembles, not one structure: a small score model on frozen AlphaFold 2 "
                 "embeddings, trained to be diverse.",
         notes=["The sequence encoder is AlphaFold 2 itself (model 3, no templates, recycling disabled), frozen; "
                "its single and pair embeddings are computed once per sequence and cached.",
                "Score model: 8 IPA layers × 32 heads at width 512, pair width 256, GELU MLP of 1024; 31.3 M "
                "parameters in the v1.1 checkpoint, 22 M of them in attention.",
                "Backbone only: Cα positions diffuse under a variance-preserving SDE with a cosine schedule, "
                "residue orientations under IGSO(3). Side chains are added afterwards by H-Packer.",
                "Three training stages: AFDB clusters that map one sequence to several structures, then over "
                "200 ms of MD reweighted toward equilibrium, then 502,442 sequences with measured folding stabilities "
                "(MEGAscale) through property-prediction fine-tuning, with only layers 1 and 8 trained.",
                "Diversity comes from the data: models pretrained on the PDB or on high-pLDDT AFDB instead were "
                "'worse in their ability to sample diverse conformations' (Fig. S8)."],
         vs=None, draw=draw_bioemu),
    dict(id="esmfold2", name="ESMFold2", year=2026, org="Biohub", domain="bio",
         paper="Candido et al. · bioRxiv 2026", url="https://doi.org/10.64898/2026.06.03.729735",
         space="all-atom coordinates", backbone="ESMC 6 B LM + looped pair stack + small denoiser",
         params="denoiser 131 M", params_m=131,
         conditioning="language-model features; z as pair bias, s from inputs only",
         objective="x̂ (EDM-style)", steps="68 in the paper, 10 in the released config",
         novelty="The language model replaces the MSA trunk; the denoiser shrinks to 12 blocks.",
         notes=["Token transformer 12 blocks × 16 heads × 768 (120 M of 131 M).",
                "Atom attention: sliding window of 128 with FlashAttention and 3D RoPE from the reference conformer.",
                "No trunk single representation enters the denoiser; x is Kabsch-aligned onto x̂ before every step, as in Boltz."],
         vs='AlphaFold 3', draw=draw_esmfold2),
    dict(id="mol1", name="Mol-1", year=2026, org="Molence Bio", domain="bio",
         paper="Mol-1: Open Frontier Biomolecular Intelligence · Molence Bio technical report 2026",
         url="https://github.com/molence/Mol-1",
         space="all-atom coordinates", backbone="Protenix fork: 8 PairMixer + 40 Pairformer blocks, then the AF3 denoiser",
         params="577 M (denoiser 206 M)", params_m=577,
         conditioning="AF3 layout; 448-channel pair conditioning; pair biases of every denoiser layer cached per target",
         objective="x̂ (EDM)", steps="200",
         novelty="Protenix with a pair stack that is wide only where it is cheap: 8 triangle-attention-free blocks at "
                 "448 channels, 40 Pairformer blocks at 320, and 20 trunk passes.",
         notes=["Trunk: 8 PairMixer blocks at 448 pair channels (59 M), a learned linear 448 → 320, 40 Pairformer blocks "
                "at 320 channels (240 M), and a linear 320 → 448 at the output. The report says this needs about 60 % "
                "of the FLOPs of a full-width trunk with comparable fitting.",
                "The PairMixer blocks drop triangle attention but keep the single track: attention on s with a "
                "bias from z and a single transition. BioEmu-2's PairMixer never updates s.",
                "Same sampler constants as Protenix (200 steps, γ_0 = 0.8, λ = 1.003, η = 1.5) and the same "
                "denoiser except for the wider z; the 24 layers' pair-bias projections are computed once per request "
                "and reused at every step.",
                "20 trunk passes by default (Protenix 10); training shifts the cycle-depth distribution toward deeper "
                "recycling, from Beta(1, 1) capped at 4 cycles to Beta(2, 1).",
                "One constraint-conditioned variant (site, exclusion, contact) adds zero-initialised conditioning to z "
                "and trains it with the last 8 Pairformer blocks: 48.7 M of 577.4 M parameters.",
                "Trained on PDB structures released before 2021-09-30 plus synthetic data the report does not describe."],
         vs='Protenix', draw=draw_mol1),
    dict(id="rfd3", name="RFdiffusion3", year=2026, org="Baker lab, UW", domain="bio",
         paper="Butcher, Krishna, Mitra et al. · Science 2026",
         url="https://doi.org/10.1126/science.aeh2982",
         space="free atoms (backbone + sidechain)",
         backbone="2-layer Pairformer + AF3-style transformer U-Net",
         params="168 M trainable", params_m=168,
         conditioning="motif atoms placed in the noise cloud; classifier-free guidance",
         objective="x̂ on atom coordinates",
         steps="100 in Fig. 1A; recycling at every step",
         novelty="The AF3 denoiser with the trunk cut from 48 Pairformer layers to 2.",
         notes=["Design, not prediction: the input is design conditions, not a sequence, so the paper argues a much "
                "lighter conditioning module suffices. 168 M parameters against about 350 M for AF3.",
                "Triangle multiplicative and triangle attention updates are dropped entirely.",
                "Sequence-agnostic atomisation: 4 backbone + 10 sidechain atoms per residue (tryptophan is the "
                "largest canonical sidechain), virtual atoms on Cβ pad the shorter ones, with distinct virtual "
                "indices for isosteres such as Cys/Ser and the bases C/U; 11–12 backbone + 11 base atoms for "
                "nucleic acids, 23 at most.",
                "Attention is distance-gated: only residues and atoms geometrically close in the noise attend to "
                "each other, which the authors report prevents overfitting and cropping artifacts.",
                "Recycling moves from the trunk into the sampler: each diffusion step recycles, buying inference "
                "compute without new parameters.",
                "Two inference-time knobs trade adherence against diversity: a higher classifier-free guidance "
                "scale raises motif adherence while lowering codesignability (Fig. 2D), and the step scale sets "
                "the sampling temperature (fig. S1C)."],
         vs='AlphaFold 3', draw=draw_rfd3),
    dict(id="rfd4", name="RFD4-Proteina", year=2026, org="Institute for Protein Design, UW · NVIDIA", domain="bio",
         paper="Corley, Didi, Kazman, Brent et al. · preprint 2026",
         url="https://github.com/RosettaCommons/RFD4-Proteina",
         space="token anchors + 32-d latents, decoded to all atoms",
         backbone="14-layer single/pair network with triangle multiplication, recycled inside every step",
         params="not stated in the paper", params_m=None,
         conditioning="adaLN from noise times and molecular conditions; in-context motif tokens; "
                      "per-residue sequence-probability constraints",
         objective="clean-state error, flow matching on coordinates and latents",
         steps="60, stochastic TSR sampler",
         novelty="Recycling moved from the trunk into every flow step, on a shared latent space of "
                 "coordinates and chemistry.",
         notes=["There is no separate trunk: the same 14-layer network is the conditioning module and the "
                "denoiser, and it is applied up to 9 times inside every flow step (Poisson(3) clamped to 1–9 in "
                "training; at inference the number varies with the step).",
                "Two flows run side by side with independent clocks: the token anchors (Cα, C1′ or the "
                "anomeric carbon) and a 32-dimensional latent per token that encodes residue identity and "
                "local structure. A decoder turns both into atoms.",
                "Triangle multiplication every other layer, a Hadamard single-to-pair update every layer, and "
                "adaptive RMSNorm for conditioning; the pair width is 384 and the single width 768.",
                "Instead of self-conditioning, the previous pass's single and pair states are projected and "
                "added to the input embeddings; gradients flow through the final pass only.",
                "Sampling uses a temperature-rescaled score (TSR) with a stochastic Euler–Maruyama update in "
                "60 steps; a 400-step SDE is slightly better but cannot be shortened.",
                "Code and weights are released under a permissive licence."],
         vs='RFdiffusion3', draw=draw_rfd4),
    dict(id="bioemu2", name="BioEmu-2", year=2026, org="Microsoft Research AI for Science", domain="bio",
         paper="bioemu2-preview · code and weights, October 2026 (no paper yet)",
         url="https://github.com/microsoft/bioemu2",
         space="all-atom coordinates", backbone="PairMixer trunk + dual-stream atom/token denoiser",
         params="512 M (denoiser 425 M)", params_m=512,
         conditioning="trunk s and z via AdaLN and pair bias; MD / non-MD mode token, contacts; "
                      "start frame and lag Δt for propagation",
         objective="x̂ (EDM), σ_data = 16 Å", steps="200; step scale 1.0 for ensembles, 1.5 for one structure",
         novelty="An all-atom emulator whose weight sits in the denoiser: an 86 M pair-only trunk feeds a 425 M "
                 "dual-stream diffusion module, five times its size.",
         notes=["Trunk: 4 MSA blocks and 48 PairMixer blocks, triangle multiplication only, pair width 256. The "
                "single representation is never updated inside the trunk; only z is.",
                "Denoiser: 16 dual-stream layers. Windowed atom attention (128 channels, 32 × 128 windows) and "
                "full token attention (768 channels, 16 heads, pair bias from z) run as parallel residual streams; "
                "two coupling MLPs then exchange atom and token information through each token's centre atom. "
                "No separate atom encoder or decoder.",
                "Parameters, read from the checkpoint: token blocks 217 M, coupling 184 M, atom blocks 14 M, "
                "trunk 86 M. The denoiser is five times the trunk; in OpenFold3 it is 1.3 times (203 M against about "
                "150 M).",
                "Ensemble or structure is set by two switches on the same weights: a method token in the trunk "
                "input (MD for equilibrium sampling, non-MD for structure prediction) and the sampler's step "
                "scale η, 1.0 or 1.5.",
                "Propagation: a start structure and a lag time Δt (1 ns to 1 µs recommended) enter the denoiser; "
                "the start coordinates are gated by a learned function that decays with Δt.",
                "Training data (model card): 189,745 PDB systems, 7.2 M AFDB monomers, 775 k multi-conformation "
                "AFDB dimers, Teddymer, and Microsoft MD of CATH domains, dimers and PDBbind complexes."],
         vs='AlphaFold 3', draw=draw_bioemu2),
]


def check_details(m, fig):
    """Warn about detail keys (details.py) with no block in the drawing."""
    det = DETAILS.get(m["id"], {})
    for k in dict.fromkeys(map(slug, det.get("parts", {}))):
        if k not in fig.blocks and k not in det.get("inherited", ()):
            print(f"  warning: {m['id']}: no block '{k}' in the drawing", file=sys.stderr)


def main():
    OUT_SVG.mkdir(parents=True, exist_ok=True)
    data = []
    for m in MODELS:
        fig = m["draw"](m["id"])
        (OUT_SVG / f"{m['id']}.svg").write_text(fig.svg())
        check_details(m, fig)
        det = DETAILS.get(m["id"], {})
        parts = {slug(k): v for k, v in det.get("parts", {}).items()}
        blocks = {}
        for k, b in fig.blocks.items():
            p = dict(fig.auto.get(k, {}), **{a: v for a, v in parts.get(k, {}).items() if v})
            text = p.get("text", "")
            if k[:3] in ("enc", "dec") and k[3:].isdigit() and det.get("resblock"):
                text += " ResBlock: " + det["resblock"] + "."
            blocks[k] = dict(title=hfmt(b["title"]), sub=hfmt(b["sub"]), role=b["role"],
                             dims=hfmt(p.get("dims", "")), text=hfmt(text),
                             refs=[dict(label=l, url=u) for l, u in p.get("refs", [])])
        row = {k: v for k, v in m.items() if k != "draw"}
        row.update(task=task_of(m), blocks=blocks,
                   overview=[hfmt(t) for t in det.get("overview", [])],
                   flow=[dict(stage=hfmt(a), shape=hfmt(b)) for a, b in det.get("flow", [])],
                   links=[dict(label=l, url=u) for l, u in det.get("links", [])])
        data.append(row)
    OUT_DATA.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    gloss = dict(role={r: hfmt(t) for r, t in ROLE_GLOSS.items()},
                 key={slug(k): hfmt(t) for k, t in KEY_GLOSS.items()})
    OUT_GLOSS.write_text(json.dumps(gloss, indent=1, ensure_ascii=False) + "\n")
    # every block must resolve to some glossary entry, via its key or at least its role
    missing = {b["role"] for m in data for b in m["blocks"].values()} - set(gloss["role"])
    if missing:
        print(f"  warning: no glossary for role(s) {sorted(missing)}", file=sys.stderr)
    print(f"wrote {len(MODELS)} drawings to {OUT_SVG.relative_to(ROOT)}, {OUT_DATA.relative_to(ROOT)} "
          f"and {OUT_GLOSS.relative_to(ROOT)}")


# ----------------------------------------------------------------------------------------
# Preview: a few cards on a standalone page, without Jekyll
# ----------------------------------------------------------------------------------------

def sass_bin():
    """dart-sass as Jekyll runs it (the sass-embedded gem of the preview image), cached once."""
    if os.environ.get("DG_SASS"):
        return os.environ["DG_SASS"]
    exe = SASS_CACHE / "dart-sass" / "sass"
    if not exe.exists() and shutil.which("docker"):
        print(f"  extracting dart-sass from the {SASS_IMAGE} image to {SASS_CACHE} (once)")
        SASS_CACHE.mkdir(parents=True, exist_ok=True)
        subprocess.run(["docker", "run", "--rm", "--user", f"{os.getuid()}:{os.getgid()}",
                        "-v", f"{SASS_CACHE}:/out", "--entrypoint", "sh", SASS_IMAGE, "-c",
                        "cp -r /usr/local/bundle/gems/sass-embedded-*/ext/sass/dart-sass /out/"],
                       capture_output=True)
    return str(exe) if exe.exists() else None


def site_css(dst):
    """Write the site's main.css to dst: compiled from _sass, else the preview server's copy."""
    src = re.sub(r"\A---\n.*?---\n", "", (ROOT / "assets/css/main.scss").read_text(), flags=re.S)
    width = re.search(r"^max_width:\s*(\S+)", (ROOT / "_config.yml").read_text(), re.M).group(1)
    src = src.replace("{{ site.max_width }}", width)
    if "{{" in src or "{%" in src:
        sys.exit("main.scss has Liquid the preview does not know; teach site_css() about it")
    exe = sass_bin()
    if exe:
        r = subprocess.run([exe, "--stdin", f"--load-path={ROOT / '_sass'}", "--style=compressed",
                            "--no-source-map"], input=src, capture_output=True, text=True)
        if r.returncode:
            sys.exit(f"sass failed:\n{r.stderr}")
        dst.write_text(r.stdout)
        return "compiled from _sass"
    try:
        with urllib.request.urlopen(SERVED_CSS, timeout=5) as r:
            css, stamp = r.read(), r.headers.get("Last-Modified")
    except OSError as e:
        sys.exit(f"no dart-sass (image {SASS_IMAGE} or DG_SASS) and no preview server at {SERVED_CSS}: {e}")
    dst.write_bytes(css)
    newest = max(f.stat().st_mtime for f in [ROOT / "assets/css/main.scss", *(ROOT / "_sass").glob("*.scss")])
    if not stamp or newest > email.utils.parsedate_to_datetime(stamp).timestamp():
        print("  warning: an SCSS file is newer than the served main.css; the preview may be stale",
              file=sys.stderr)
    return f"from {SERVED_CSS}"


# What a biomolecule model is for: the input decides it. Prediction takes a sequence (plus ligands, partners)
# and returns its structure; design takes a target or site and returns a new sequence and structure; the
# ensemble emulators return many structures of one sequence.
TASK = {"predicts": "structure prediction", "ensemble": "ensemble sampling", "design": "design"}
TASK_OF = {"rfdiffusion": "design", "rfd3": "design", "rfd4": "design",
           "bioemu": "ensemble", "bioemu2": "ensemble",
           "af3": "predicts", "boltz2": "predicts", "openfold3": "predicts", "protenix": "predicts",
           "esmfold2": "predicts", "mol1": "predicts", "pearl": "predicts"}


def task_of(m):
    return TASK[TASK_OF[m["id"]]] if m["domain"] == "bio" else ""


def card_html(n, m, fig):
    """One gallery card, as _projects/diffusion-architectures.md renders it."""
    bio = m["domain"] == "bio"
    paper = f'<a href="{m["url"]}" target="_blank" rel="noopener">{m["paper"]}</a>' if m.get("url") else m["paper"]
    facts = [("Backbone", m["backbone"]), ("Parameters", m["params"]), ("Conditioning", m["conditioning"]),
             ("Objective · steps", f'{m["objective"]} · {m["steps"]}')]
    vs = f'<p class="dg-vs"><i aria-hidden="true"></i>Magenta outlines: new relative to {m["vs"]}.</p>' if m.get("vs") else ""
    links = "".join(f'<a href="{u}" target="_blank" rel="noopener">{l.split(" · ")[0]} <span aria-hidden="true">↗</span></a>'
                    for l, u in DETAILS.get(m["id"], {}).get("links", [])[:2])
    return f"""<article class="dg-card" id="{m['id']}" data-id="{m['id']}" data-domain="{m['domain']}">
  <header class="dg-cardhead">
    <span class="dg-kind{' warm' if bio else ''}">{n:02d} · {'biomolecules · ' + task_of(m) if bio else 'images'} · {m['year']}</span>
    <h2>{m['name']}</h2>
    <button class="dg-btn" type="button">⤢ enlarge</button>
  </header>
  <button class="dg-figure" aria-label="{m['name']}">
{fig.svg()}  </button>
  <div class="dg-body">
    <p class="dg-org">{m['org']} · {paper}</p>
    <p class="dg-novelty">{m['novelty']}</p>
    <dl class="dg-facts">{''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in facts)}</dl>
    {vs}
    <div class="dg-cardlinks"><button class="dg-explore" type="button">Explore {len(fig.blocks)} blocks <span aria-hidden="true">→</span></button>{links}</div>
  </div>
</article>
"""


def preview(ids, shot=False, shot_dir=SHOTS):
    """Draw only the given cards into PREVIEW/index.html; with shot, PNGs light and dark."""
    t0 = time.time()
    by_id = {m["id"]: (n, m) for n, m in enumerate(MODELS, 1)}
    if unknown := [i for i in ids if i not in by_id]:
        sys.exit(f"unknown id(s) {unknown}; known: {' '.join(by_id)}")
    PREVIEW.mkdir(exist_ok=True)
    how = site_css(PREVIEW / "main.css")
    cards = []
    for i in ids:
        n, m = by_id[i]
        fig = m["draw"](m["id"])
        check_details(m, fig)
        if missing := {b["role"] for b in fig.blocks.values()} - set(ROLE_GLOSS):
            print(f"  warning: {i}: no glossary for role(s) {sorted(missing)}", file=sys.stderr)
        cards.append(card_html(n, m, fig))
    rel = lambda f: os.path.relpath(ROOT / f, PREVIEW)
    css = ["assets/vendor/bootstrap/bootstrap.min.css", "assets/vendor/mdb/css/mdb.min.css",
           "assets/vendor/fonts/inter/inter.css", "assets/vendor/fonts/jetbrains-mono/jetbrains-mono.css"]
    page = PREVIEW / "index.html"
    page.write_text(f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gallery preview · {' '.join(ids)}</title>
<script>document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';</script>
{''.join(f'<link rel="stylesheet" href="{rel(f)}">' for f in css)}
<link rel="stylesheet" href="main.css">
<style>.pv-bar {{ font: 12px 'JetBrains Mono', monospace; color: var(--global-text-color-light); display: flex; gap: 1rem; }}
.pv-bar button {{ font: inherit; }} .dg-grid {{ align-items: start; }}</style>
</head>
<body>
<div class="container mt-5"><div class="dg">
<p class="pv-bar">preview · {time.strftime('%H:%M:%S')} · css {how}
<button type="button" onclick="const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
document.documentElement.dataset.theme = t; history.replaceState(null, '', '?theme=' + t)">light / dark</button></p>
<section class="dg-grid dg-wide">
{''.join(cards)}</section>
</div></div>
</body>
</html>
""")
    print(f"wrote {page.relative_to(ROOT)} ({len(ids)} card(s), css {how}) in {time.time() - t0:.1f} s", flush=True)
    if shot:
        node = shutil.which("node") or sys.exit("--shot needs node on PATH")
        shot_dir.mkdir(parents=True, exist_ok=True)
        subprocess.run([node, str(pathlib.Path(__file__).with_name("preview_shot.mjs")), str(page),
                        str(shot_dir), *ids], check=True)
        print(f"done in {time.time() - t0:.1f} s")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Build the diffusion gallery, or preview a few cards without Jekyll.")
    ap.add_argument("--preview-card", nargs="+", metavar="ID",
                    help="draw only these models into bin/diffusion_gallery/preview/index.html; "
                         "_includes/ and _data/ are left alone")
    ap.add_argument("--shot", action="store_true",
                    help="with --preview-card: PNGs at 2x, light and dark, gallery_<id>_{light,dark}.png")
    ap.add_argument("--shot-dir", type=pathlib.Path, default=SHOTS, help=f"where --shot writes (default {SHOTS})")
    a = ap.parse_args()
    if a.preview_card:
        preview(a.preview_card, a.shot, a.shot_dir)
    elif a.shot:
        ap.error("--shot needs --preview-card")
    else:
        main()
