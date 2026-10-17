#!/usr/bin/env python3
"""Data figures for the long read, in the site's house style (Inter, the gallery's role colours,
no titles inside the image: the card header carries the title). Writes webp files into
assets/diffusion-article/media/.

    python3 bin/diffusion_gallery/article_plots.py

fig_triangle_toy2.webp   why triangles help: a toy chain, contacts only → (min, +) triangle passes → truth,
                         and the shared-neighbour count (a one-channel triangle multiplication)
fig_fourier_noise2.webp  AF3's noise-level code (SI Alg. 22): six features over σ, similarity of two
                         codes against their σ ratio, sampling schedule against the training σ range
"""
import io
import pathlib

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402
from PIL import Image  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "diffusion-article" / "media"
# gallery role colours (_sass/_diffusion_gallery.scss, light theme)
INK, INK2, MUTED, RES = "#1f2430", "#4b5363", "#6b7280", "#a3abb9"
ATTN, ATTN_F, COND, COND_F, PAIR, PAIR_F = "#2f5bd3", "#e4ebff", "#b4552f", "#fbe8df", "#04204b", "#e3e8f2"
plt.rcParams.update({
    "font.family": "Inter", "font.size": 11, "text.color": INK, "axes.labelcolor": INK2, "axes.edgecolor": RES,
    "xtick.color": INK2, "ytick.color": INK2, "axes.spines.top": False, "axes.spines.right": False,
    "axes.titlesize": 11.5, "axes.titleweight": "semibold", "axes.titlelocation": "left", "axes.titlepad": 10,
    "figure.facecolor": "white", "axes.facecolor": "white", "axes.grid": False, "mathtext.fontset": "dejavusans",
})
NAVY = LinearSegmentedColormap.from_list("navy", ["#04204b", "#2f5bd3", "#a9bff2", "#f4f6fb"])


def save(fig, name):
    buf = io.BytesIO()
    fig.savefig(buf, dpi=170, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    Image.open(buf).convert("RGB").save(OUT / name, "WEBP", quality=90, method=6)
    print("wrote", (OUT / name).relative_to(ROOT))


def toy_chain(n=64, seed=3, bond=3.8, R=11.5):
    rng = np.random.default_rng(seed)
    while True:
        X = [np.zeros(3)]
        d = rng.normal(size=3); d /= np.linalg.norm(d)
        ok = True
        for t in range(1, n):
            for _ in range(400):
                nd = d + 0.9 * rng.normal(size=3); nd /= np.linalg.norm(nd)
                if nd @ d < -0.2:
                    continue
                p = X[-1] + bond * nd
                if np.linalg.norm(p) > R:
                    continue
                if t > 2 and np.min(np.linalg.norm(np.array(X[:-2]) - p, axis=1)) < 4.2:
                    continue
                X.append(p); d = nd; break
            else:
                ok = False; break
        if ok:
            X = np.array(X)
            return np.linalg.norm(X[:, None] - X[None], axis=-1)


def triangle_toy():
    D = toy_chain()
    n, cut = len(D), 8.0
    M = np.where(D < cut, D, np.inf)
    for _ in range(6):
        M = np.minimum(M, np.min(M[:, :, None] + M[None, :, :], axis=1))
    unobs = (D >= cut) & ~np.eye(n, dtype=bool)
    A = (D < cut).astype(float)
    C = A @ A.T
    fig, axs = plt.subplots(1, 4, figsize=(15.5, 4.1), gridspec_kw={"width_ratios": [1, 1, 1, 1.25], "wspace": 0.28})
    vmax = D.max()
    for ax, (Z, t) in zip(axs[:3], [(np.where(D < cut, D, np.nan), "1 · what is known: contacts < 8 Å"),
                                    (M, "2 · after a few triangle passes"), (D, "3 · the true distances")]):
        ax.imshow(Z, cmap=NAVY, vmin=0, vmax=vmax, interpolation="nearest")
        ax.set_facecolor("#f1f2f4")
        ax.set_title(t); ax.set_xticks([]); ax.set_yticks([])
        for sp in ax.spines.values():
            sp.set_visible(False)
    axs[1].text(0.5, -0.1, "$d_{ij} \\leq \\min_k\\,(d_{ik} + d_{kj})$, repeated", transform=axs[1].transAxes,
                ha="center", va="top", fontsize=10, color=INK2)
    axs[0].text(0.5, -0.1, "residue i (rows) × residue j (columns)", transform=axs[0].transAxes, ha="center",
                va="top", fontsize=10, color=INK2)
    r = np.corrcoef(D[unobs], M[unobs])[0, 1]
    axs[2].text(0.5, -0.1, f"step 2 vs step 3 on unknown pairs: r = {r:.2f}", transform=axs[2].transAxes,
                ha="center", va="top", fontsize=10, color=INK2)
    ax = axs[3]
    vals = [D[unobs & (C == k)] for k in range(9)]
    pos = [k for k in range(9) if len(vals[k]) > 5]
    med = [np.median(vals[k]) for k in pos]
    q1 = [np.quantile(vals[k], 0.25) for k in pos]; q3 = [np.quantile(vals[k], 0.75) for k in pos]
    ax.vlines(pos, q1, q3, color=ATTN, lw=7, alpha=0.25)
    ax.plot(pos, med, "o-", color=ATTN, lw=2)
    ax.set_xlabel("shared neighbours  $\\sum_k A_{ik} A_{jk}$")
    ax.set_ylabel("true distance (Å)")
    ax.set_title("4 · one channel of triangle multiplication")
    ax.text(0.98, 0.95, "median and middle half,\npairs not in contact", transform=ax.transAxes, ha="right",
            va="top", fontsize=9.5, color=MUTED)
    save(fig, "fig_triangle_toy2.webp")


def fourier():
    SD = 16.0
    rng = np.random.default_rng(0)
    W, B = rng.normal(size=256), rng.normal(size=256)
    code = lambda s: np.cos(2 * np.pi * (np.outer(0.25 * np.log(np.atleast_1d(s) / SD), W) + B))  # noqa: E731
    fig, axs = plt.subplots(1, 3, figsize=(15.5, 4.3), gridspec_kw={"width_ratios": [1.35, 1, 1], "wspace": 0.3})
    ax = axs[0]
    sig = np.logspace(np.log10(0.004), np.log10(4000), 600)
    pick = np.argsort(np.abs(W))[[20, 128, 200, 245]]
    for k, j in enumerate(pick):
        ax.plot(sig, np.cos(2 * np.pi * (W[j] * 0.25 * np.log(sig / SD) + B[j])) * 0.4 + k, color=PAIR, lw=1.5)
        ax.text(5200, k, f"w = {W[j]:+.1f}", fontsize=9.5, va="center", ha="right", color=MUTED)
    pdf = np.exp(-0.5 * ((np.log(sig / SD) + 1.2) / 1.5) ** 2)
    ax.fill_between(sig, -0.7, -0.7 + 0.9 * pdf, color=COND, alpha=0.18, lw=0)
    ax.text(2.0, -0.62, "training noise levels", color=COND, fontsize=9.5, ha="center")
    ax.set_xscale("log"); ax.invert_xaxis(); ax.set_yticks([]); ax.spines["left"].set_visible(False)
    ax.set_xlim(4000, 0.004); ax.set_ylim(-0.8, 3.6)
    ax.set_xlabel("noise level σ (Å) — sampling runs left to right")
    ax.set_title("1 · four of the 256 features, cos(2π(w·u + b))")
    ax = axs[1]
    rr = np.logspace(0, 2, 200)
    emp = (code(10 * rr) @ code([10.0]).T)[:, 0] / np.linalg.norm(code(10 * rr), axis=1) / np.linalg.norm(code([10.0]))
    ax.semilogx(rr, np.exp(-np.pi ** 2 * np.log(rr) ** 2 / 8), color=COND, lw=2.4, label="expected")
    ax.semilogx(rr, emp, color=ATTN, lw=1.5, label="one draw of 256")
    ax.axhline(0.5, color=RES, lw=0.9, ls=":"); ax.axvline(2.1, color=RES, lw=0.9, ls=":")
    ax.text(2.25, 0.55, "½ at a factor 2.1", fontsize=9.5, color=MUTED)
    ax.set_xlabel("ratio of two noise levels"); ax.set_ylabel("similarity of their codes")
    ax.set_title("2 · how far apart two codes are")
    ax.legend(frameon=False, fontsize=9.5)
    ax = axs[2]
    T = 200
    sched = SD * (160 ** (1 / 7) + np.arange(T + 1) / T * (4e-4 ** (1 / 7) - 160 ** (1 / 7))) ** 7
    lo, hi = SD * np.exp(-1.2 - 1.96 * 1.5), SD * np.exp(-1.2 + 1.96 * 1.5)
    ax.axhspan(lo, hi, color=COND, alpha=0.15, lw=0)
    ax.semilogy(sched, color=PAIR, lw=2.2)
    ax.text(8, hi * 0.6, f"95 % of training\n{lo:.2f}–{hi:.0f} Å", color=COND, fontsize=9.5, ha="left", va="top")
    ax.text(198, 900, f"{int((sched > hi).sum())} of 200 steps\nabove that range", color=PAIR, fontsize=9.5, va="top", ha="right")
    ax.set_xlabel("sampling step"); ax.set_ylabel("σ (Å)")
    ax.set_title("3 · sampling vs training")
    save(fig, "fig_fourier_noise2.webp")


def antibody_pairmap(cif="/tmp/ac2/1n8z.cif"):
    """Part III opener: the trastuzumab Fv bound to HER2 domain IV (PDB 1N8Z) as the three things the
    model deals with: the input sequences, the structure, and the pair map in between (Cβ distances,
    Cα for glycine; the distogram head is trained to predict this matrix from z). Needs biotite: run
    with /home/niklas/code/MasterThesis/050_system/pyenv/py."""
    import biotite.structure as struc
    import biotite.structure.io.pdbx as pdbx
    a = pdbx.get_structure(pdbx.CIFFile.read(cif), model=1)
    a = a[struc.filter_amino_acids(a)]
    chains = [("A", 1, 107, "light chain VL"), ("B", 1, 120, "heavy chain VH"), ("C", 480, 607, "HER2 domain IV")]
    xyz, lab, seg = [], [], []
    for ch, lo, hi, name in chains:
        r = a[(a.chain_id == ch) & (a.res_id >= lo) & (a.res_id <= hi)]
        n0 = len(xyz)
        for rid in np.unique(r.res_id):
            res = r[r.res_id == rid]
            atom = res[res.atom_name == "CB"] if "CB" in res.atom_name else res[res.atom_name == "CA"]
            if len(atom):
                xyz.append(atom.coord[0]); lab.append(ch)
        seg.append((name, n0, len(xyz)))
    X = np.array(xyz); lab = np.array(lab)
    D = np.linalg.norm(X[:, None] - X[None], axis=-1)
    ab, ag = np.isin(lab, ["A", "B"]), lab == "C"
    inter = (D < 8.0) & np.outer(ab, ag)
    paratope, epitope = inter.any(1), inter.any(0)
    img = Image.open(OUT / "hero_1n8z.webp").convert("RGB")
    arr = np.asarray(img); m = (arr < 245).any(-1); ys, xs = np.where(m)
    img = img.crop((xs.min() - 20, ys.min() - 20, xs.max() + 20, ys.max() + 20))
    fig = plt.figure(figsize=(15.5, 5.2))
    gs = fig.add_gridspec(1, 3, width_ratios=[1.15, 0.8, 1.05], wspace=0.18)
    # 1 · input
    ax = fig.add_subplot(gs[0])
    ax.set_xlim(0, 135); ax.set_ylim(-0.6, 3.2); ax.axis("off")
    ax.set_title("1 · what goes in: three sequences")
    for k, (name, i0, i1) in enumerate(seg):
        y = 2.4 - k * 1.0
        n = i1 - i0
        col = PAIR if k < 2 else COND
        ax.add_patch(plt.Rectangle((0, y - 0.12), n, 0.24, color=PAIR_F if k < 2 else COND_F, ec=col, lw=1.2))
        hits = np.where((paratope | epitope)[i0:i1])[0]
        for h in hits:
            ax.add_patch(plt.Rectangle((h, y - 0.12), 1, 0.24, color=COND if k < 2 else PAIR, lw=0))
        ax.text(0, y + 0.3, f"{name} · {n} residues", fontsize=10.5, color=INK, fontweight="semibold")
    ax.text(0, -0.35, "marked: residues that touch the other side of the interface (Cβ < 8 Å)\n"
            "the model also gets an alignment of related sequences (MSA) for each chain", fontsize=9.5, color=MUTED)
    # 2 · structure
    ax = fig.add_subplot(gs[1]); ax.imshow(img); ax.axis("off")
    ax.set_title("2 · what comes out: one structure")
    ax.text(0.5, -0.03, "antibody blue, its binding loops pale; antigen orange", transform=ax.transAxes,
            fontsize=9.5, color=MUTED, va="top", ha="center")
    # 3 · pair map
    ax = fig.add_subplot(gs[2])
    ax.imshow(D, cmap=NAVY, vmin=0, vmax=40, interpolation="nearest")
    ii, jj = np.where(inter)
    ax.scatter(jj, ii, s=22, color=COND, lw=0, label="antibody–antigen contacts (< 8 Å)")
    ax.scatter(ii, jj, s=22, color=COND, lw=0)
    n_ab = seg[2][1]
    ax.add_patch(plt.Rectangle((n_ab - 0.5, -0.5), D.shape[0] - n_ab, n_ab, fill=False, ec=COND, lw=1.6, ls="--"))
    ax.text(D.shape[0] + 4, n_ab / 2, "interface\nblock", fontsize=9.5, color=COND, va="center")
    ax.text(D.shape[0] + 4, D.shape[0] - 10, "darker =\ncloser\n(0–40 Å)", fontsize=9, color=MUTED, va="bottom")
    for name, i0, i1 in seg[1:]:
        ax.axhline(i0 - 0.5, color="white", lw=1.2); ax.axvline(i0 - 0.5, color="white", lw=1.2)
    for name, i0, i1 in seg:
        ax.text((i0 + i1) / 2, -6, name.split(" ")[-1] if "HER2" not in name else "HER2", ha="center", fontsize=9.5, color=INK2)
    ax.set_xticks([]); ax.set_yticks([])
    for sp in ax.spines.values():
        sp.set_visible(False)
    ax.set_title("3 · in between: its pair map", pad=22)
    ax.legend(frameon=False, fontsize=9.5, loc="lower left", bbox_to_anchor=(0, -0.13))
    save(fig, "fig_antibody_pairmap.webp")


if __name__ == "__main__":
    import sys
    which = sys.argv[1:] or ["toy", "fourier"]
    if "toy" in which: triangle_toy()
    if "fourier" in which: fourier()
    if "antibody" in which: antibody_pairmap()
