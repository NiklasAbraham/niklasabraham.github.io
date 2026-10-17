#!/usr/bin/env python3
"""Gallery-style drawings for the long read (/projects/diffusion-architectures/explained/).

Same primitives and role colours as the gallery (build.py), so a block type looks the same in the
gallery and in the article. Writes _includes/diffusion-article/<name>.svg; the article embeds them
with {% include da-svg.html file="<name>.svg" ... %}.

    python3 bin/diffusion_gallery/article_figs.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build  # noqa: E402
from build import Fig, residual_sublayer  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "_includes" / "diffusion-article"


class WideFig(Fig):
    """A Fig with its own width (the gallery's are all 520 units wide)."""

    def __init__(self, mid, w, h):
        super().__init__(mid, h)
        self.w = w

    def crop(self, top, bottom=None):
        """Keep only the band [top, bottom] of the canvas (drawn bottom-up on a tall canvas)."""
        bottom = self.h if bottom is None else bottom
        self.el.insert(0, f'<g transform="translate(0,{-top:.1f})">')
        self.el.append("</g>")
        self.h = bottom - top

    def svg(self):
        old, build.W = build.W, self.w
        try:
            return super().svg().replace(f"{self.id} architecture", self.id.replace("-", " "))
        finally:
            build.W = old


def pairformer_block():
    f = WideFig("da-pairformer", 640, 760)
    H = f.h
    xp, wp = 50, 250            # pair column
    xs, ws = 380, 220           # single column
    cp, cs = xp + wp / 2, xs + ws / 2
    f.chip(cp, H - 22, "pair z · N × N × 128", "pl ink", "middle")
    f.chip(cs, H - 22, "single s · N × 384", "pl", "middle")
    y = H - 40
    f.arrow([(cp, y), (cp, y - 14)], head=False)
    y -= 14
    ops = [("triangle mult. · outgoing", "z_{ij} += Σ_k a_{ik} ⊙ b_{jk}  ·  N^3", "pair", "tmo"),
           ("triangle mult. · incoming", "z_{ij} += Σ_k a_{ki} ⊙ b_{kj}  ·  N^3", "pair", "tmi"),
           ("triangle attention · start", "attend over row i, bias from (j, k)  ·  N^3", "pair", "tas"),
           ("triangle attention · end", "attend over column j, bias from (k, i)  ·  N^3", "pair", "tae"),
           ("pair transition", "SwiGLU 128 → 512 → 128, each pair alone", "mlp", "ptr")]
    for t, s, role, key in ops:
        f.begin(key, t, s, role)
        y = residual_sublayer(f, xp, wp, y, None, t, s, role=role)
        f.end()
    y_pair_top = y
    # single track: a long straight lane up to where the pair stack ends, then two sub-layers
    ys = H - 40
    f.arrow([(cs, ys), (cs, y_pair_top + 6)], head=False)
    f.text(cs + 10, (ys + y_pair_top) / 2, "waits for the pair track", "lab vert", "middle")
    y2 = y_pair_top + 6
    f.begin("spa", "attention with pair bias", "16 heads", "attn")
    y2 = residual_sublayer(f, xs, ws, y2, None, "attention with pair bias", "16 heads · logit + b_{ij}", role="attn")
    f.end()
    att_y = y2 + 7.5 + 12 + 19          # middle of the attention box just drawn
    f.begin("str", "single transition", "SwiGLU", "mlp")
    y2 = residual_sublayer(f, xs, ws, y2, None, "single transition", "SwiGLU 384 → 1536 → 384", role="mlp")
    f.end()
    # pair bias: from the top of the pair track into the single attention
    f.dot(cp, y_pair_top + 2)
    f.arrow([(cp, y_pair_top + 2), (xp + wp + 40, y_pair_top + 2), (xp + wp + 40, att_y), (xs, att_y)])
    f.chip(xp + wp + 8, y_pair_top + 22, "bias b_{ij} = Linear(LN z_{ij})", "pl attn")
    f.text(xs - 14, (H - 40 + y_pair_top) / 2 + 40, "no path from s back to z", "lab w vert", "middle")
    top = min(y, y2)
    f.arrow([(cp, y), (cp, top - 26)])
    f.arrow([(cs, y2), (cs, top - 26)])
    f.chip(cp, top - 34, "z to the next block", "pl ink", "middle")
    f.chip(cs, top - 34, "s to the next block", "pl", "middle")
    f.group(xp - 26, top - 12, xs + ws - xp + 52, H - 34 - (top - 12), "one Pairformer block", "× 48",
            rep_cls="rep ink")
    f.crop(top - 52)
    return f


def denoiser_sandwich():
    f = WideFig("da-sandwich", 700, 700)
    H = f.h
    xa, wa = 120, 420           # atom level: wide
    xt, wt = 205, 250           # token level: narrow
    ca = xa + wa / 2
    xi = xa + wa + 22           # side inputs
    f.box(xa + 70, H - 52, wa - 140, 40, "noisy atom positions x", "N_{atom} × 3, at noise level σ", role="io", key="x")
    y = H - 52
    f.arrow([(ca, y), (ca, y - 14)])
    y -= 14 + 26
    f.box(xa + 110, y, wa - 220, 26, "r = x / √(σ^2 + σ_d^2)", role="norm", small=True, key="scale")
    f.arrow([(ca, y), (ca, y - 14)])
    y -= 14 + 64
    enc_y = y
    f.box(xa, y, wa, 64, "atom encoder · 3 blocks", "local attention: 32 atoms see 128 neighbours\n"
          "features from the reference conformer, s^{trunk}, z\n≈ 1 M parameters", role="attn", key="enc")
    f.arrow([(ca, y), (ca, y - 34)])
    f.text(ca + 8, y - 14, "average each token's atoms → one 768-number vector", "lab", "start")
    y -= 34 + 76
    tt_y = y
    f.box(xt, y, wt, 76, "token transformer · 24 blocks", "global attention over all tokens\n"
          "logit + pair bias from z · AdaLN from s\n≈ 198 M parameters · 70–90 % of the time", role="attn", key="tok")
    f.chip(xi, y + 18, "z → pair bias", "pl ink", "start")
    f.arrow([(xi - 2, y + 18), (xt + wt, y + 18)])
    f.box(xi, y + 36, 128, 28, "s + Fourier(σ) → AdaLN", role="cond", small=True, key="cond")
    f.arrow([(xi - 2, y + 50), (xt + wt, y + 50)], "w dsh")
    f.arrow([(ca, y), (ca, y - 34)])
    f.text(ca + 8, y - 14, "copy each token back to its atoms", "lab", "start")
    y -= 34 + 64
    dec_y = y
    f.box(xa, y, wa, 64, "atom decoder · 3 blocks", "local attention again\nposition update for every atom\n"
          "≈ 1 M parameters", role="attn", key="dec")
    # skip connection encoder → decoder, inner left
    f.curve(f"M{xa:.1f},{enc_y + 32:.1f} C{xa - 40:.1f},{enc_y + 20:.1f} {xa - 40:.1f},"
            f"{dec_y + 44:.1f} {xa:.1f},{dec_y + 32:.1f}", "r")
    f.text(xa - 34, (enc_y + dec_y) / 2 + 32, "skip: atom features", "lab vert", "middle")
    f.arrow([(ca, y), (ca, y - 14)])
    y -= 14 + 40
    f.box(xa + 70, y, wa - 140, 40, "D_θ = c_{skip} x + c_{out} · update", "the denoised guess x̂", role="io", key="out")
    # x itself skips everything (c_skip), outer left
    f.curve(f"M{xa + 70:.1f},{H - 32:.1f} C{xa - 92:.1f},{H - 70:.1f} {xa - 92:.1f},{y + 40:.1f} {xa + 70:.1f},"
            f"{y + 20:.1f}", "r dsh")
    f.text(xa - 74, (H - 32 + y + 20) / 2 + 40, "x itself, weighted by c_{skip}", "lab vert", "middle")
    for yy, lab in [(enc_y + 32, "atoms · fine"), (tt_y + 38, "tokens · coarse"), (dec_y + 32, "atoms · fine")]:
        f.text(16, yy, lab, "gl vert", "middle")
    f.group(30, y - 22, 640, H - 6 - (y - 22), "one call of the denoiser", "× 200 steps")
    f.crop(y - 40)
    return f


# ---------------------------------------------------------------------------------- small parts

ROLE_STROKE = {"blue": "var(--dg-attn-s)", "warm": "var(--dg-cond-s)", "ink": "var(--dg-pair-s)", "line": "var(--dg-line)"}


def cell(f, x, y, c, cls="bx io", extra=""):
    f.raw(f'<rect class="{cls}" x="{x:.1f}" y="{y:.1f}" width="{c - 2:.1f}" height="{c - 2:.1f}" rx="3"{extra}/>')


def grid(f, x0, y0, n, c, hl, rows=None, cols=None):
    """n × n grid of pair cells; hl maps (row, col) -> rect class. rows/cols: {index: label}."""
    for i in range(n):
        for j in range(n):
            cell(f, x0 + j * c, y0 + i * c, c, hl.get((i, j), "bx io"))
    for i, lab in (rows or {}).items():
        f.text(x0 - 8, y0 + i * c + c / 2 + 4, lab, "bt sm", "end")
    for j, lab in (cols or {}).items():
        f.text(x0 + j * c + c / 2 - 1, y0 - 8, lab, "bt sm", "middle")


def node(f, x, y, lab, r=13):
    f.raw(f'<g class="plus"><circle cx="{x:.1f}" cy="{y:.1f}" r="{r}"/></g>')
    f.text(x, y + 4.5, lab, "bt sm", "middle")


def edge(f, p, q, col="line", dash=False, w=1.6, r=13, head=True):
    import math
    (x1, y1), (x2, y2) = p, q
    L = math.hypot(x2 - x1, y2 - y1)
    ux, uy = (x2 - x1) / L, (y2 - y1) / L
    a, b = (x1 + ux * r, y1 + uy * r), (x2 - ux * (r + 2), y2 - uy * (r + 2))
    st = f' style="stroke:{ROLE_STROKE[col]};stroke-width:{w}"'
    da = ' stroke-dasharray="5 3"' if dash else ""
    mk = f' marker-end="url(#{f.id}-a)"' if head else ""
    f.raw(f'<path class="ln" d="M{a[0]:.1f},{a[1]:.1f} L{b[0]:.1f},{b[1]:.1f}"{st}{da}{mk}/>')


def tri_panel(f, x0, title, sub, kind):
    """One panel of the triangle-update drawings: grid on top, the triangles below.
    kind: out / in (multiplication), start / end (attention)."""
    n, c = 7, 26
    i, j, k = 1, 4, 6
    hl = {}
    A = "bx attn"; B = "bx cond" if kind in ("out", "in") else "bx cond dash"
    for m in range(n):
        if kind in ("out", "start"):
            hl[(i, m)] = A; hl[(j, m)] = B
        else:
            hl[(m, i if kind == "in" else j)] = A if kind == "in" else A
            hl[(m, j if kind == "in" else i)] = B
    if kind == "end":
        hl = {}
        for m in range(n):
            hl[(m, j)] = A; hl[(m, i)] = B
    hl[(i, j)] = "rep ink"
    gx = x0 + 70
    f.text(x0 + 170, 24, title, "bt", "middle")
    f.text(x0 + 170, 40, sub, "bs", "middle")
    rows = {i: "i", j: "j"} if kind in ("out", "start") else {}
    cols = {i: "i", j: "j"} if kind in ("in", "end") else {}
    if kind in ("out", "start"):
        cols = {k: "k"}
    else:
        rows = {k: "k"}
    grid(f, gx, 62, n, c, hl, rows, cols)
    # emphasise the k-th pair of cells
    for (a, b) in ([(i, k), (j, k)] if kind in ("out", "start") else [(k, i), (k, j)]):
        f.raw(f'<rect x="{gx + b * c - 1:.1f}" y="{62 + a * c - 1:.1f}" width="{c:.1f}" height="{c:.1f}" rx="4" '
              f'style="fill:none;stroke:var(--dg-line);stroke-width:2"/>')
    # triangles below
    yb = 62 + n * c + 40
    P_i, P_j = (x0 + 95, yb + 20), (x0 + 245, yb + 20)
    ks = [(x0 + 70, yb + 110), (x0 + 130, yb + 128), (x0 + 210, yb + 128), (x0 + 270, yb + 110)]
    for t, Pk in enumerate(ks):
        main = t == 1
        w = 1.8 if main else 1.0
        if kind == "out":
            edge(f, P_i, Pk, "blue", w=w); edge(f, P_j, Pk, "warm", w=w)
        elif kind == "in":
            edge(f, Pk, P_i, "blue", w=w); edge(f, Pk, P_j, "warm", w=w)
        elif kind == "start":
            edge(f, P_i, Pk, "blue", w=w); edge(f, P_j, Pk, "warm", dash=True, w=w)
        else:
            edge(f, Pk, P_j, "blue", w=w); edge(f, Pk, P_i, "warm", dash=True, w=w)
        node(f, *Pk, "k" if main else "", r=11)
    edge(f, P_i, P_j, "ink", w=2.6)
    node(f, *P_i, "i"); node(f, *P_j, "j")
    f.text((P_i[0] + P_j[0]) / 2, P_i[1] - 10, "z_{ij}", "bt sm", "middle")
    f.text(x0 + 170, yb + 158, "summed over every third token k" if kind in ("out", "in")
           else "attention weights over every k", "lab", "middle")


def triangle_mult():
    f = WideFig("da-trimul", 720, 480)
    tri_panel(f, 10, "outgoing", "rows i and j: edges leaving i and j", "out")
    tri_panel(f, 370, "incoming", "columns i and j: edges arriving at i and j", "in")
    f.raw('<line x1="360" y1="20" x2="360" y2="460" style="stroke:var(--dg-res);stroke-dasharray:4 4"/>')
    return f


def triangle_attn():
    f = WideFig("da-triatt", 720, 480)
    tri_panel(f, 10, "starting node", "keys and values: row i · bias: row j (dashed)", "start")
    tri_panel(f, 370, "ending node", "keys and values: column j · bias: column i (dashed)", "end")
    f.raw('<line x1="360" y1="20" x2="360" y2="460" style="stroke:var(--dg-res);stroke-dasharray:4 4"/>')
    return f


def receptive():
    f = WideFig("da-receptive", 720, 245)
    n, c = 8, 18
    a, b = 2, 5
    panels = [("one entry z_{ab} changes", {(a, b): "rep ink"}),
              ("after triangle mult. outgoing", {**{(a, m): "bx attn" for m in range(n)},
                                               **{(m, a): "bx attn" for m in range(n)}, (a, b): "rep ink"}),
              ("after incoming as well", {**{(r, m): "bx attn" for r in range(n) for m in range(n)}, (a, b): "rep ink"})]
    for t, (title, hl) in enumerate(panels):
        x0 = 40 + t * 235
        f.text(x0 + n * c / 2, 18, title, "bt sm", "middle")
        grid(f, x0, 52, n, c, hl, {a: "a"} if t == 0 else None, {b: "b"} if t == 0 else None)
        pct = round(100 * len(hl) / n ** 2)
        f.text(x0 + n * c / 2, 52 + n * c + 22, f"{pct} % of the pair map can change", "lab", "middle")
        if t < 2:
            f.arrow([(x0 + n * c + 12, 52 + n * c / 2), (x0 + 223, 52 + n * c / 2)])
    return f


def token_block():
    f = WideFig("da-tokblock", 680, 640)
    H = f.h
    x, w = 250, 250
    cx = x + w / 2
    bus = 200
    f.chip(cx, H - 20, "token vectors a · N_{tok} × 768", "pl attn", "middle")
    f.arrow([(cx, H - 32), (cx, H - 46)], head=False)
    y = H - 46
    gtop_guess = 80
    from build import dit_block
    y = dit_block(f, x, w, y, bus, [
        dict(norm="AdaLN(a, s)", op="attention with pair bias", op_sub="16 heads × 48 · logit + b^h_{ij}",
             role="attn", gate="gate σ(W s)"),
        dict(norm="AdaLN(a, s)", op="transition", op_sub="SwiGLU 768 → 1536 → 768", role="mlp",
             gate="gate σ(W s)"),
    ])
    top = y
    f.group(x - 20, top - 8, w + 58, H - 50 - (top - 8), "token-transformer block", "× 24")
    f.arrow([(cx, top), (cx, top - 30)])
    f.chip(cx, top - 38, "to the next block, then the atom decoder", "pl attn", "middle")
    # conditioning column on the left
    f.box(24, H - 150, 150, 52, "single conditioning s", "s^{trunk} and s^{inputs}\n+ Fourier code of σ", role="cond", key="s")
    f.arrow([(174, H - 124), (bus, H - 124), (bus, top + 40)], "w dsh", head=False)
    f.text(99, H - 166, "per token, per step", "lab w", "middle")
    f.text(99, H - 80, "sets scale, shift and gate", "lab", "middle")
    f.text(99, H - 66, "of every sub-layer", "lab", "middle")
    # pair bias on the right, into the attention box (its middle sits at H - 115)
    f.box(x + w + 50, H - 150, 130, 52, "pair z_{ij}", "→ LN → Linear\n→ b^h_{ij}, 16 numbers", role="pair", key="z")
    f.arrow([(x + w + 50, H - 124), (x + w + 25, H - 124), (x + w + 25, H - 115), (x + w, H - 115)])
    f.text(x + w + 115, H - 82, "one bias per head", "lab", "middle")
    f.text(x + w + 115, H - 68, "and token pair", "lab", "middle")
    f.crop(top - 60)
    return f


def attn_pair_bias():
    f = WideFig("da-apb", 760, 330)
    yq, yk, yv = 70, 140, 210
    f.box(14, 120, 110, 44, "AdaLN(a, s)", "token vectors", role="norm", key="in")
    for yy, t, s in [(yq, "query q_i", "W_q a_i"), (yk, "keys k_j", "W_k a_j"), (yv, "values v_j", "W_v a_j")]:
        f.box(170, yy - 20, 120, 40, t, s, role="attn", key=t)
        f.arrow([(124, 142), (146, 142), (146, yy), (170, yy)])
    f.box(330, 85, 140, 50, "logits", "q_i · k_j / √48", role="attn", key="logits")
    f.arrow([(290, yq), (310, yq), (310, 102), (330, 102)])
    f.arrow([(290, yk), (310, yk), (310, 118), (330, 118)])
    f.plus(400, 160)
    f.arrow([(400, 135), (400, 152.5)])
    f.box(330, 240, 140, 52, "pair bias b^h_{ij}", "Linear(LN z_{ij})", role="pair", key="bias")
    f.arrow([(400, 240), (400, 167.5)])
    f.chip(400, 316, "from the trunk: z_{ij}", "pl ink", "middle")
    f.arrow([(400, 305), (400, 292)])
    f.box(500, 140, 110, 40, "softmax over j", "weights A_{ij}", role="norm", key="softmax")
    f.arrow([(407.5, 160), (500, 160)])
    f.box(500, 200, 110, 40, "Σ_j A_{ij} v_j", None, role="attn", key="mix")
    f.arrow([(555, 180), (555, 200)])
    f.arrow([(290, yv), (480, yv), (480, 220), (500, 220)])
    f.box(640, 200, 106, 40, "× gate g_i", "σ(W_g a_i)", role="norm", key="gate")
    f.arrow([(610, 220), (640, 220)])
    f.box(640, 120, 106, 44, "16 heads →", "concat, W_o", role="embed", key="out")
    f.arrow([(693, 200), (693, 164)])
    f.arrow([(693, 120), (693, 96)])
    f.text(693, 88, "update for token i", "lab", "middle")
    f.text(400, 30, "content (q · k) decides what to read; the trunk's pair representation shifts every logit",
           "lab", "middle")
    return f


def atom_windows():
    f = WideFig("da-atomwin", 760, 250)
    n_blocks, bw = 8, 84
    x0, y0, h = 44, 60, 30
    c = x0 + 3 * bw + bw / 2 - 2
    half = 2 * bw
    f.raw(f'<rect x="{c - half:.1f}" y="{y0 - 10}" width="{2 * half:.1f}" height="{h + 20}" rx="8" '
          f'style="fill:var(--dg-attn-f);fill-opacity:0.45;stroke:var(--dg-attn-s);stroke-dasharray:6 4;stroke-width:1.6"/>')
    for b in range(n_blocks):
        cls = "bx attn" if b == 3 else "bx io"
        f.raw(f'<rect class="{cls}" x="{x0 + b * bw:.1f}" y="{y0}" width="{bw - 4}" height="{h}" rx="5"/>')
        f.text(x0 + b * bw + bw / 2 - 2, y0 + 19, f"atoms {b * 32}–{b * 32 + 31}", "bs", "middle")
    f.text(c, y0 - 20, "these 32 query atoms attend to the 128 key atoms around them (shaded)", "bt sm", "middle")
    f.text(c, y0 + h + 30, "and add a bias p_{lm}: reference-conformer offset + z of the two atoms' tokens", "lab", "middle")
    # aggregation to tokens
    yt = 170
    for t in range(10):
        f.raw(f'<rect class="bx attn" x="{x0 + 40 + t * 62:.1f}" y="{yt}" width="54" height="24" rx="5"/>')
        f.text(x0 + 40 + t * 62 + 27, yt + 16, f"token {t + 1}", "bs", "middle")
    f.text(x0 + 360, yt - 14, "the encoder averages each token's atoms (≈ 8 per residue) into one 768-number token vector",
           "lab", "middle")
    f.text(x0 + 360, yt + 46, "the decoder copies every token vector back to its atoms and runs the same windows again",
           "lab", "middle")
    return f


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("pairformer_block", pairformer_block), ("denoiser_sandwich", denoiser_sandwich),
                     ("triangle_mult", triangle_mult), ("triangle_attn", triangle_attn), ("receptive", receptive),
                     ("token_block", token_block), ("attn_pair_bias", attn_pair_bias), ("atom_windows", atom_windows)]:
        fig = fn()
        (OUT / f"{name}.svg").write_text(fig.svg())
        print("wrote", (OUT / f"{name}.svg").relative_to(ROOT))


if __name__ == "__main__":
    main()
