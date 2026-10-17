"""House style for the energy long read: the site's Inter, ink and accents, one fixed colour per source."""
import io
import pathlib

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from PIL import Image  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "energy-article" / "media"
CACHE = pathlib.Path(__file__).resolve().parent / "cache"

INK, INK2, MUTED, RULE = "#04204B", "#3D5F91", "#6b7280", "#c9d0dc"
BLUE, WARM, TEAL, VIOLET = "#0B4FC0", "#B4552F", "#138374", "#6A47C2"

# one colour per source, used by every figure, map and the explorer
COL = {
    "solar": "#E3A21A", "wind_on": "#2F6FD0", "wind_off": "#173F7E", "biomass": "#5E8F2F",
    "hydro": "#3AA6B9", "pumped": "#86C3DD", "nuclear": "#7D5BA6", "lignite": "#7A5230",
    "hardcoal": "#3A3A3A", "gas": "#D9762B", "oil": "#8C3C4E", "other": "#A3A9B4",
    "import": "#C9CED8", "battery": "#138374",
}
NAME = {
    "solar": "Solar", "wind_on": "Wind onshore", "wind_off": "Wind offshore", "biomass": "Biomass",
    "hydro": "Hydro", "pumped": "Pumped storage", "nuclear": "Nuclear", "lignite": "Lignite",
    "hardcoal": "Hard coal", "gas": "Gas", "oil": "Oil", "other": "Waste & other", "import": "Net imports",
    "battery": "Batteries",
}
# stacking order, bottom to top: inflexible first, weather last
STACK = ["nuclear", "lignite", "hardcoal", "gas", "oil", "other", "biomass", "hydro", "pumped",
         "wind_off", "wind_on", "solar"]

plt.rcParams.update({
    "font.family": "Inter", "font.size": 10.5, "text.color": INK, "axes.labelcolor": INK2,
    "axes.edgecolor": RULE, "xtick.color": INK2, "ytick.color": INK2, "axes.spines.top": False,
    "axes.spines.right": False, "axes.titlesize": 11, "axes.titleweight": "semibold",
    "axes.titlelocation": "left", "axes.titlepad": 8, "figure.facecolor": "white",
    "axes.facecolor": "white", "axes.grid": False, "legend.frameon": False,
    "mathtext.fontset": "dejavusans", "axes.labelsize": 10, "xtick.labelsize": 9.5, "ytick.labelsize": 9.5,
})


def grid(ax, axis="y"):
    ax.grid(axis=axis, color="#e6eaf1", lw=0.8)
    ax.set_axisbelow(True)


def save(fig, name):
    buf = io.BytesIO()
    fig.savefig(buf, dpi=200, bbox_inches="tight", facecolor="white", pad_inches=0.08)
    plt.close(fig)
    OUT.mkdir(parents=True, exist_ok=True)
    Image.open(buf).convert("RGB").save(OUT / name, "WEBP", quality=88, method=6)
    print("wrote", (OUT / name).relative_to(ROOT))


def load(kind="hourly"):
    import pandas as pd
    df = pd.read_pickle(CACHE / f"{'q15' if kind == 'q15' else 'hourly'}.pkl")
    # fold small sources into the groups the figures use
    df["hydro_all"] = df[["hydro", "reservoir"]].sum(axis=1, min_count=1)
    df["other_all"] = df[["other", "waste", "coalgas", "geothermal"]].sum(axis=1, min_count=1)
    df = df.drop(columns=["hydro", "other"]).rename(columns={"hydro_all": "hydro", "other_all": "other"})
    return df
