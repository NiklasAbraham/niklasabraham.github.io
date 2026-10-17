#!/usr/bin/env python3
"""Data figures for the German energy long read (/blog/2026/german-energy-market/).

    python3 bin/energy_article/plots.py            # all
    python3 bin/energy_article/plots.py mix price  # only figures whose name contains one of the words

Reads the tables made by process.py (Energy-Charts / Fraunhofer ISE, CC BY 4.0) and writes webp files into
assets/energy-article/media/. Numbers that come from reports, not from the time series, are written into
the functions with their source next to them.
"""
import json
import sys

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, TwoSlopeNorm
from matplotlib.ticker import FuncFormatter

from style import (BLUE, CACHE, COL, INK, INK2, MUTED, NAME, RULE, STACK, TEAL, VIOLET, WARM, grid, load, save)

GEN = STACK
YEARS = list(range(2015, 2026))
FIGS = {}


def fig(fn):
    FIGS[fn.__name__] = fn
    return fn


def legend_row(fig, keys, ncol=6, y=1.0, hatch_import=True):
    from matplotlib.patches import Patch
    hs = [Patch(color=COL[k], label=NAME[k]) for k in keys]
    if hatch_import:
        hs.append(Patch(facecolor="white", edgecolor=MUTED, hatch="////", label="Net imports"))
    fig.legend(handles=hs, loc="lower left", bbox_to_anchor=(0.06, y), ncol=ncol, fontsize=8.6, handlelength=1.1,
               handleheight=0.9, columnspacing=1.1, borderaxespad=0)


def twh(df, cols):
    """Energy per calendar year in TWh from an hourly MW table."""
    return (df[cols] / 1e6).groupby(df.index.year).sum(min_count=1)


# ------------------------------------------------------------------------------------------ part I
@fig
def primary_energy():
    # AGEB, Primärenergieverbrauch in Deutschland 2025 (Jahresbericht, Aug 2026), Tabelle 1
    parts = [("Oil", 36.0, "#8C3C4E"), ("Natural gas", 26.6, "#D9762B"), ("Renewables", 20.8, "#5E8F2F"),
             ("Lignite", 7.1, "#7A5230"), ("Hard coal", 6.8, "#3A3A3A"), ("Other", 2.0, "#A3A9B4"),
             ("Net power imports", 0.7, "#C9CED8")]
    fig, ax = plt.subplots(figsize=(8.2, 1.5))
    x = 0
    for i, (n, v, c) in enumerate(parts):
        ax.barh(0, v, left=x, color=c, height=0.62, edgecolor="white", lw=1.2)
        if v > 15:
            ax.text(x + v / 2, 0, f"{n}\n{v:.1f} %", ha="center", va="center", color="white", fontsize=9.5,
                    fontweight="semibold", linespacing=1.25)
        elif v > 5:
            ax.text(x + v / 2, 0, f"{v:.1f}", ha="center", va="center", color="white", fontsize=9.5,
                    fontweight="semibold")
        x += v
    ax.text(100, -0.42, "Lignite 7.1 %   ·   Hard coal 6.8 %   ·   Other 2.0 %   ·   Net power imports 0.7 %",
            ha="right", va="top", fontsize=8.8, color=INK2)
    ax.set_xlim(0, 100)
    ax.set_ylim(-0.7, 0.45)
    ax.axis("off")
    ax.text(0, 0.42, "10,530 PJ = 2,925 TWh of primary energy, 2025", fontsize=9.5, color=INK2, va="bottom")
    save(fig, "primary_energy_2025.webp")


@fig
def generation_years():
    h = load()
    cols = [c for c in GEN if c in h]
    E = twh(h, cols + ["load", "trade"]).loc[2015:2025].fillna(0)
    fig, ax = plt.subplots(figsize=(8.4, 4.4))
    bottom = np.zeros(len(E))
    for c in cols:
        ax.bar(E.index, E[c], bottom=bottom, color=COL[c], width=0.72, edgecolor="white", lw=0.4)
        bottom += E[c].values
    imp = E["trade"].clip(lower=0)
    ax.bar(E.index, imp, bottom=bottom, color="white", edgecolor=MUTED, hatch="////", width=0.72, lw=0.6)
    ax.plot(E.index, E["load"], color=INK, lw=2, marker="o", ms=4, zorder=5)
    import matplotlib.patheffects as pe
    ax.text(2015, E["load"].iloc[0] + 16, "load", color=INK, fontsize=9.5, fontweight="semibold", ha="center",
            path_effects=[pe.withStroke(linewidth=3, foreground="white")])
    # labels at the right end
    y = 0
    last = E.iloc[-1]
    for c in cols:
        v = last[c]
        if v > 14:
            ax.text(2025.5, y + v / 2, f"{NAME[c]}  {v:.0f}", va="center", fontsize=8.8, color=COL[c],
                    fontweight="semibold")
        y += v
    ax.text(2025.5, y + imp.iloc[-1] / 2 + 6, f"Net imports  {imp.iloc[-1]:.0f}", va="center", fontsize=8.8,
            color=MUTED)
    ax.set_xlim(2014.4, 2028.2)
    ax.set_xticks(YEARS)
    ax.set_xticklabels([f"'{str(y)[2:]}" for y in YEARS])
    ax.set_ylabel("TWh per year")
    ax.spines["left"].set_visible(False)
    grid(ax)
    legend_row(fig, [c for c in reversed(cols)], ncol=7, y=0.93)
    save(fig, "generation_by_year.webp")
    return E


@fig
def renewable_share():
    h = load()
    ren = ["wind_on", "wind_off", "solar", "biomass", "hydro"]
    E = twh(h, ren + ["load", "nuclear", "lignite", "hardcoal", "gas", "oil", "other", "pumped"])
    allgen = E.drop(columns=["load"]).sum(axis=1)
    share = 100 * E[ren].sum(axis=1) / allgen
    return share


@fig
def capacity():
    d = json.loads((CACHE / "installed_yearly.json").read_text())
    t = [int(x) for x in d["time"]]
    ser = {p["name"]: p["data"] for p in d["production_types"]}
    pick = [("Solar DC", "solar", "Solar (DC)"), ("Wind onshore", "wind_on", "Wind onshore"),
            ("Fossil gas", "gas", "Gas"), ("Fossil hard coal", "hardcoal", "Hard coal"),
            ("Fossil brown coal / lignite", "lignite", "Lignite"), ("Wind offshore", "wind_off", "Wind offshore"),
            ("Nuclear", "nuclear", "Nuclear"), ("Battery storage (power)", "battery", "Batteries")]
    fig, ax = plt.subplots(figsize=(8.4, 4.6))
    ends = []
    for key, c, lab in pick:
        v = np.array([np.nan if x is None else x for x in ser[key]], float)
        m = np.array(t) <= 2025
        ax.plot(np.array(t)[m], v[m], color=COL[c], lw=2.4 if c in ("solar", "wind_on") else 1.8)
        ends.append((v[m][-1], lab, c))
    # EEG 2023 § 4 and WindSeeG § 1 targets for 2030
    for val, c, lab, dy in [(215, "solar", "215 GW solar target 2030 (EEG § 4)", 9),
                            (115, "wind_on", "115 GW onshore target 2030", 11),
                            (30, "wind_off", "30 GW offshore target 2030 (WindSeeG)", 9)]:
        ax.plot([2025, 2030], [ends[[e[2] for e in ends].index(c)][0], val], color=COL[c], lw=1.2, ls=(0, (3, 3)))
        ax.plot(2030, val, "o", color=COL[c], ms=5, mfc="white", mew=1.6)
        ax.text(2030.3, val + dy, lab, ha="right", fontsize=8.6, color=COL[c], va="center", linespacing=1.1)
    from matplotlib.lines import Line2D
    ends.sort(reverse=True)
    hs = [Line2D([], [], color=COL[c], lw=2.4, label=f"{lab}  {v:.0f} GW") for v, lab, c in ends]
    ax.legend(handles=hs, loc="upper left", fontsize=8.8, title="installed end of 2025", title_fontsize=8.8,
              alignment="left", handlelength=1.6)
    ax.set_xlim(2002, 2030.5)
    ax.set_ylim(0, 232)
    ax.set_ylabel("installed capacity, GW")
    ax.set_xticks([2002, 2006, 2010, 2014, 2018, 2022, 2025, 2030])
    grid(ax)
    ax.spines["left"].set_visible(False)
    save(fig, "capacity.webp")


# ------------------------------------------------------------------------------------------ part II
@fig
def price_vs_residual():
    h = load()
    fig, axes = plt.subplots(1, 2, figsize=(8.6, 3.9), sharey=True)
    for ax, y, c in zip(axes, [2019, 2025], [BLUE, WARM]):
        d = h.loc[str(y), ["residual", "price"]].dropna()
        ax.scatter(d["residual"] / 1e3, d["price"], s=2.2, color=c, alpha=0.18, lw=0, rasterized=True)
        # binned median = the empirical supply curve
        b = pd.cut(d["residual"] / 1e3, np.arange(-20, 80, 2.5))
        med = d.groupby(b, observed=True)["price"].median()
        xs = [iv.mid for iv in med.index]
        ax.plot(xs, med.values, color=INK, lw=2)
        ax.axhline(0, color=RULE, lw=0.8)
        ax.set_title(f"{y}", color=c)
        ax.set_xlabel("residual load, GW (load − wind − solar)")
        grid(ax, "both")
        ax.set_xlim(-10, 78)
    axes[0].set_ylabel("day-ahead price, EUR/MWh")
    axes[0].set_ylim(-150, 400)
    axes[1].text(-8, 340, "black: median price\nper 2.5 GW bin", fontsize=8.6, color=INK2, va="top")
    save(fig, "price_vs_residual.webp")


@fig
def neighbours_trade():
    rows = []
    for y in YEARS + [2026]:
        d = json.loads((CACHE / f"cbpf_{y}.json").read_text())
        for ctry in d["countries"]:
            v = np.array([np.nan if x is None else x for x in ctry["data"]], float)
            # GW at 15 min resolution -> TWh; sign: + = import into DE
            rows.append((y, ctry["name"], np.nansum(v) * 0.25 / 1e3))
    df = pd.DataFrame(rows, columns=["year", "country", "twh"]).pivot(index="year", columns="country", values="twh")
    return df


@fig
def frequency_day():
    d = json.loads((CACHE / "freq_2025-06-15.json").read_text())
    t = pd.to_datetime(d["unix_seconds"], unit="s", utc=True).tz_convert("Europe/Berlin")
    f = pd.Series(d["data"], index=t, dtype=float)
    fig, (a, b) = plt.subplots(1, 2, figsize=(8.6, 3.2), gridspec_kw=dict(width_ratios=[2.2, 1]))
    m = f.resample("10s").mean()
    a.plot(m.index, m.values, color=INK, lw=0.6)
    a.axhline(50, color=WARM, lw=0.8)
    a.set_ylabel("Hz")
    a.set_title("Sunday 15 June 2025 (from 02:00), 10-second means", color=INK2, fontweight="normal", fontsize=9.5)
    a.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter("%H:%M", tz=t.tz))
    grid(a)
    # mean deviation by second of the hour across the day: market steps at full hours
    allf = []
    for fn in sorted(CACHE.glob("freq_2025-06-*.json")):
        dd = json.loads(fn.read_text())
        allf.append(pd.Series(dd["data"], index=pd.to_datetime(dd["unix_seconds"], unit="s", utc=True), dtype=float))
    fa = pd.concat(allf)
    fa = fa[~fa.index.duplicated()]
    sec = (fa.index.minute * 60 + fa.index.second)
    prof = ((fa - 50).groupby(sec).mean() * 1000).rolling(10, center=True, min_periods=1).mean()
    b.set_title(f"mean over {len(allf)} days, 9–19 June 2025", color=INK2, fontweight="normal", fontsize=9.5)
    b.plot(prof.index / 60, prof.values, color=BLUE, lw=0.8)
    b.axhline(0, color=RULE, lw=0.8)
    b.set_xlabel("minute of the hour")
    b.set_ylabel("mean deviation, mHz")
    b.set_xticks([0, 15, 30, 45, 60])
    grid(b)
    save(fig, "frequency_day.webp")


# ------------------------------------------------------------------------------------------ part III
def season_profile(h, months, weekday=True):
    d = h[h.index.month.isin(months)]
    d = d[(d.index.dayofweek < 5) if weekday else (d.index.dayofweek >= 5)]
    return d.groupby(d.index.hour).mean().fillna(0)


@fig
def day_by_season():
    h = load().loc["2025"]
    seasons = [("January", [1]), ("April", [4]), ("July", [7]), ("October", [10])]
    fig, axes = plt.subplots(1, 4, figsize=(9.2, 3.6), sharey=True)
    for ax, (lab, ms) in zip(axes, seasons):
        p = season_profile(h, ms)
        bottom = np.zeros(24)
        for c in GEN:
            if c not in p:
                continue
            v = p[c].clip(lower=0).values / 1e3
            ax.fill_between(range(24), bottom, bottom + v, color=COL[c], lw=0, step=None)
            bottom += v
        imp = p["trade"].clip(lower=0).values / 1e3
        ax.fill_between(range(24), bottom, bottom + imp, facecolor="white", hatch="////", edgecolor=MUTED, lw=0.3)
        ax.plot(range(24), p["load"] / 1e3, color=INK, lw=1.8)
        ax2 = ax.twinx()
        ax2.plot(range(24), p["price"], color=WARM, lw=1.6, ls=(0, (4, 2)))
        ax2.set_ylim(-20, 220)
        ax2.spines["top"].set_visible(False)
        ax2.tick_params(colors=WARM, labelsize=8.5)
        if ax is not axes[-1]:
            ax2.set_yticklabels([])
            ax2.tick_params(right=False)
        else:
            ax2.set_ylabel("price, EUR/MWh (dashed)", color=WARM)
        ax.set_title(lab)
        ax.set_xticks([0, 6, 12, 18, 23])
        ax.set_xlim(0, 23)
        ax.set_xlabel("hour")
    axes[0].set_ylabel("GW (weekday average, 2025)")
    axes[0].set_ylim(0, 80)
    legend_row(fig, ["solar", "wind_on", "wind_off", "hydro", "biomass", "other", "gas", "hardcoal", "lignite"],
               ncol=10, y=0.99)
    save(fig, "day_by_season.webp")


@fig
def price_by_hour_years():
    h = load()
    fig, ax = plt.subplots(figsize=(8.4, 3.9))
    cmap = LinearSegmentedColormap.from_list("yr", ["#a9bff2", BLUE, INK])
    for i, y in enumerate([2015, 2019, 2023, 2025]):
        d = h.loc[str(y), "price"]
        rel = d.groupby(d.index.hour).mean() / d.mean()
        col = WARM if y == 2025 else cmap(i / 2.6)
        ax.plot(rel.index, rel.values, color=col, lw=2.4 if y == 2025 else 1.5)
        ax.text(23.3, rel.values[-1] + {2015: -0.02, 2019: 0.015, 2023: 0.0, 2025: 0.02}[y], str(y), color=col, fontsize=8.8,
                va="center", fontweight="semibold" if y == 2025 else "normal")
    ax.axhline(1, color=RULE, lw=0.8)
    ax.set_xlim(0, 24.6)
    ax.set_xticks(range(0, 24, 3))
    ax.set_xlabel("hour of the day")
    ax.set_ylabel("price ÷ yearly mean")
    grid(ax)
    save(fig, "price_by_hour_years.webp")


@fig
def quarter_hours():
    q = load("q15")
    d = q.loc["2025-10-01":"2026-10-16", "price"]
    prof = d.groupby(d.index.hour * 4 + d.index.minute // 15).mean()
    dh = q.loc["2024-10-01":"2025-09-30", "price"]
    profh = dh.groupby(dh.index.hour * 4 + dh.index.minute // 15).mean()
    fig, (a, b) = plt.subplots(1, 2, figsize=(8.8, 3.5), gridspec_kw=dict(width_ratios=[1.6, 1]))
    a.step(profh.index / 4, profh.values / dh.mean(), where="post", color=MUTED, lw=1.2,
           label="hourly products, Oct 2024 – Sep 2025")
    a.step(prof.index / 4, prof.values / d.mean(), where="post", color=BLUE, lw=1.4,
           label="15-min products, Oct 2025 – Oct 2026")
    a.set_xlabel("time of day")
    a.set_ylabel("mean price ÷ period mean")
    a.set_xticks(range(0, 25, 3))
    a.legend(fontsize=8.5, loc="upper left")
    grid(a)
    # within the hour: price of each quarter relative to the hour's mean, morning vs evening ramp
    df = d.to_frame("p")
    df["hour"], df["qh"] = df.index.hour, df.index.minute // 15
    df["rel"] = df["p"] - df.groupby([df.index.date, df["hour"]])["p"].transform("mean")
    for hrs, col, lab in [([9, 10, 11], WARM, "09–12 h, solar ramping up"), ([16, 17, 18], TEAL, "16–19 h, solar ramping down")]:
        s = df[df.hour.isin(hrs)].groupby("qh")["rel"].mean()
        b.plot([":00", ":15", ":30", ":45"], s.values, marker="o", color=col, lw=1.8, label=lab)
    b.axhline(0, color=RULE, lw=0.8)
    b.set_ylabel("EUR/MWh vs. the hour's mean")
    b.set_xlabel("quarter hour")
    b.legend(fontsize=8.5)
    grid(b)
    save(fig, "quarter_hours.webp")


@fig
def week_profile():
    h = load().loc["2025"]
    how = h.index.dayofweek * 24 + h.index.hour
    p = h.groupby(how)[["load", "price", "solar", "wind_on", "wind_off"]].mean()
    fig, ax = plt.subplots(figsize=(8.4, 3.2))
    ax.plot(p.index, p["load"] / 1e3, color=INK, lw=1.8)
    ax.fill_between(p.index, 0, (p["solar"] + p["wind_on"] + p["wind_off"]) / 1e3, color=COL["wind_on"], alpha=0.15, lw=0)
    ax.set_ylabel("load, GW", color=INK)
    ax.set_ylim(0, 75)
    ax2 = ax.twinx()
    ax2.plot(p.index, p["price"], color=WARM, lw=1.5, ls=(0, (4, 2)))
    ax2.set_ylabel("price, EUR/MWh", color=WARM)
    ax2.tick_params(colors=WARM)
    ax2.spines["top"].set_visible(False)
    ax2.set_ylim(0, 160)
    ax.set_xticks(np.arange(0, 168, 24) + 12)
    ax.set_xticklabels(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
    for x in range(24, 168, 24):
        ax.axvline(x, color="#eef1f6", lw=0.8)
    ax.set_xlim(0, 167)
    ax.text(2, 4, "shaded: average wind + solar", fontsize=8.6, color=COL["wind_on"])
    save(fig, "week_profile.webp")


@fig
def dunkelflaute():
    h = load().loc["2024-10-28":"2024-12-16"]
    fig, (a, b) = plt.subplots(2, 1, figsize=(8.8, 4.8), sharex=True, gridspec_kw=dict(height_ratios=[1.4, 1]))
    ren = (h["wind_on"] + h["wind_off"]) / 1e3
    a.fill_between(h.index, 0, ren, color=COL["wind_on"], lw=0, label="wind")
    a.fill_between(h.index, ren, ren + h["solar"] / 1e3, color=COL["solar"], lw=0, label="solar")
    a.plot(h.index, h["load"] / 1e3, color=INK, lw=1)
    a.set_ylabel("GW")
    a.legend(loc="upper left", bbox_to_anchor=(0.0, 1.16), ncol=2, fontsize=8.5)
    a.text(h.index[-1], 68, " load", color=INK, fontsize=8.8, va="center")
    for s0, s1 in [("2024-11-02", "2024-11-08"), ("2024-12-10", "2024-12-13")]:
        for ax in (a, b):
            ax.axvspan(pd.Timestamp(s0, tz="Europe/Berlin"), pd.Timestamp(s1, tz="Europe/Berlin"), color="#e9edf5", lw=0, zorder=0)
    b.plot(h.index, h["price"], color=WARM, lw=1)
    b.set_ylabel("EUR/MWh")
    for when, txt in [("2024-11-06 17:00", "6 Nov: 820"), ("2024-12-12 17:00", "12 Dec: 936")]:
        t = pd.Timestamp(when, tz="Europe/Berlin")
        b.annotate(txt, (t, h.loc[t, "price"]), xytext=(-62, -6), textcoords="offset points", fontsize=8.6,
                   color=WARM, arrowprops=dict(arrowstyle="-", color=WARM, lw=0.8))
    grid(a)
    grid(b)
    b.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter("%d %b", tz=h.index.tz))
    save(fig, "dunkelflaute_2024.webp")


@fig
def price_heatmap():
    h = load()
    fig, axes = plt.subplots(1, 3, figsize=(9.4, 3.9), sharey=True)
    norm = TwoSlopeNorm(vmin=-60, vcenter=0, vmax=300)
    cmap = LinearSegmentedColormap.from_list("pr", [(0, "#0B4FC0"), (0.5, "#ffffff"), (0.58, "#F6DFA0"),
                                                     (0.68, "#E8A33A"), (0.8, "#C4562A"), (1, "#5E1A12")])
    for ax, y in zip(axes, [2019, 2022, 2025]):
        d = h.loc[str(y), "price"]
        m = d.groupby([d.index.hour, d.index.dayofyear]).mean().unstack()
        im = ax.imshow(m.values, aspect="auto", cmap=cmap, norm=norm, origin="lower", interpolation="nearest",
                       extent=[0.5, m.shape[1] + 0.5, -0.5, 23.5])
        ax.set_title(str(y))
        ax.set_xticks([1, 91, 182, 274])
        ax.set_xticklabels(["Jan", "Apr", "Jul", "Oct"])
        for s in ax.spines.values():
            s.set_visible(False)
    axes[0].set_yticks([0, 6, 12, 18, 23])
    axes[0].set_ylabel("hour of the day")
    cb = fig.colorbar(im, ax=axes, fraction=0.025, pad=0.015, extend="both")
    cb.set_label("EUR/MWh")
    cb.outline.set_visible(False)
    save(fig, "price_heatmap.webp")


@fig
def months_2025():
    h = load().loc["2025"]
    M = (h[[c for c in GEN if c in h] + ["load", "trade"]] / 1e6).groupby(h.index.month).sum()
    fig, ax = plt.subplots(figsize=(8.4, 3.9))
    bottom = np.zeros(12)
    for c in GEN:
        if c not in M:
            continue
        ax.bar(M.index, M[c], bottom=bottom, color=COL[c], width=0.74, edgecolor="white", lw=0.4)
        bottom += M[c].values
    ax.bar(M.index, M["trade"].clip(lower=0), bottom=bottom, color="white", hatch="////", edgecolor=MUTED, width=0.74, lw=0.5)
    ax.plot(M.index, M["load"], color=INK, lw=1.8, marker="o", ms=3.5)
    ax.set_xticks(range(1, 13))
    ax.set_xticklabels(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])
    ax.set_ylabel("TWh per month, 2025")
    grid(ax)
    ax.spines["left"].set_visible(False)
    legend_row(fig, [c for c in reversed(GEN) if c in M and c != "nuclear"], ncol=6, y=0.96)
    save(fig, "months_2025.webp")


@fig
def monthly_price():
    h = load()
    m = h["price"].resample("MS").mean()
    fig, ax = plt.subplots(figsize=(8.8, 3.6))
    ax.fill_between(m.index, 0, m.values, step="post", color=WARM, alpha=0.15, lw=0)
    ax.step(m.index, m.values, where="post", color=WARM, lw=1.6)
    yr = h["price"].groupby(h.index.year).mean()
    for y, v in yr.items():
        x0, x1 = pd.Timestamp(f"{y}-01-01", tz="Europe/Berlin"), pd.Timestamp(f"{y}-12-31", tz="Europe/Berlin")
        ax.plot([x0, x1], [v, v], color=INK, lw=1.2)
        ax.text(x0 + pd.Timedelta(days=182), v + 14, f"{v:.0f}", ha="center", fontsize=8.6, color=INK)
    for when, txt, xy in [("2022-08-01", "Aug 2022: 465 EUR/MWh,\ngas cut from Russia", ("2019-01-01", 420)),
                          ("2021-10-01", "autumn 2021:\ngas prices climb", ("2018-06-01", 250)),
                          ("2026-03-01", "from Mar 2026: Iran war,\nHormuz shipping halted", ("2023-09-01", 250))]:
        t = pd.Timestamp(when, tz="Europe/Berlin")
        ax.annotate(txt, (t, m.loc[t]), xytext=(pd.Timestamp(xy[0], tz="Europe/Berlin"), xy[1]), fontsize=8.5,
                    color=INK2, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7), va="center")
    ax.set_ylabel("EUR/MWh")
    ax.set_ylim(0, 500)
    grid(ax)
    save(fig, "monthly_price.webp")


@fig
def negative_hours():
    h = load()
    p = h["price"]
    n = (p < 0).groupby(p.index.year).sum()
    fig, (a, b) = plt.subplots(1, 2, figsize=(8.8, 3.4), gridspec_kw=dict(width_ratios=[1.35, 1]))
    cols = [MUTED] * (len(n) - 1) + [BLUE]
    a.bar(n.index, n.values, color=[WARM if y == 2025 else (BLUE if y == 2026 else "#8EA6CF") for y in n.index], width=0.7)
    for y, v in n.items():
        a.text(y, v + 8, f"{v}", ha="center", fontsize=8.4, color=INK2)
    a.set_xticks(n.index)
    a.set_xticklabels([f"'{str(y)[2:]}" for y in n.index], fontsize=8.8)
    a.set_ylabel("hours with a negative day-ahead price")
    a.text(2026, n.loc[2026] + 42, "to 16 Oct", ha="center", fontsize=7.6, color=BLUE)
    a.spines["left"].set_visible(False)
    grid(a)
    d = p.loc["2025"]
    neg = d[d < 0]
    hist = neg.groupby(neg.index.hour).size().reindex(range(24), fill_value=0)
    mon = neg.groupby(neg.index.month).size().reindex(range(1, 13), fill_value=0)
    b.bar(hist.index, hist.values, color=COL["solar"], width=0.8)
    b.set_xlabel("hour of the day (2025)")
    b.set_ylabel("negative hours")
    b.set_xticks([0, 6, 12, 18, 23])
    grid(b)
    save(fig, "negative_hours.webp")
    return n, mon


@fig
def capture_rates():
    h = load()
    p = h["price"]
    rows = {}
    for y in YEARS:
        d = h.loc[str(y)]
        base = d["price"].mean()
        r = {}
        for c in ["solar", "wind_on", "wind_off"]:
            ok = d["price"].notna()
            r[c] = (d.loc[ok, c] * d.loc[ok, "price"]).sum() / d.loc[ok, c].sum() / base
        rows[y] = r
    R = pd.DataFrame(rows).T
    fig, ax = plt.subplots(figsize=(8.0, 3.6))
    for c in ["solar", "wind_on", "wind_off"]:
        ax.plot(R.index, R[c] * 100, color=COL[c], lw=2.2, marker="o", ms=4)
        ax.text(2025.2, R[c].iloc[-1] * 100, f"{NAME[c]} {R[c].iloc[-1] * 100:.0f} %", color=COL[c], fontsize=9,
                va="center", fontweight="semibold")
    ax.axhline(100, color=RULE, lw=0.8)
    ax.set_ylim(40, 110)
    ax.set_xlim(2014.6, 2027.6)
    ax.set_xticks(YEARS)
    ax.set_xticklabels([f"'{str(y)[2:]}" for y in YEARS])
    ax.set_ylabel("capture rate, % of the base price")
    grid(ax)
    save(fig, "capture_rates.webp")
    return R


@fig
def duration_curves():
    h = load()
    fig, ax = plt.subplots(figsize=(8.0, 3.8))
    for y, c in [(2015, "#8EA6CF"), (2020, BLUE), (2025, WARM)]:
        d = h.loc[str(y)]
        r = np.sort(d["residual"].dropna().values)[::-1] / 1e3
        l = np.sort(d["load"].dropna().values)[::-1] / 1e3
        x = np.linspace(0, 100, len(r))
        ax.plot(x, r, color=c, lw=2, label=f"residual load {y}")
        if y == 2025:
            ax.plot(np.linspace(0, 100, len(l)), l, color=INK, lw=1.2, ls=(0, (4, 2)), label="load 2025")
    ax.axhline(0, color=RULE, lw=0.8)
    ax.set_xlabel("share of the hours of the year, sorted from highest to lowest, %")
    ax.set_ylabel("GW")
    ax.legend(fontsize=8.6)
    grid(ax, "both")
    save(fig, "duration_curves.webp")


@fig
def wind_solar_variability():
    h = load()
    d = h.loc["2025"]
    cap = {"wind": 63.6 + 9.2, "solar": 100.8}  # end-2024 installed GW (Energy-Charts), to normalise 2025
    wind = (d["wind_on"] + d["wind_off"]) / 1e3
    sol = d["solar"] / 1e3
    fig, (a, b) = plt.subplots(1, 2, figsize=(8.8, 3.3))
    a.hist(wind, bins=np.arange(0, 60, 1.5), color=COL["wind_on"], alpha=0.9)
    a.set_xlabel("wind output, GW (hourly, 2025)")
    a.set_ylabel("hours")
    a.axvline(wind.mean(), color=INK, lw=1.2)
    a.text(wind.mean() + 1, a.get_ylim()[1] * 0.9, f"mean {wind.mean():.1f} GW", fontsize=8.6)
    grid(a)
    # calm spells: longest stretch with wind + solar below 10 % of load
    low = ((d["wind_on"] + d["wind_off"] + d["solar"]) < 0.1 * d["load"]).astype(int)
    runs = (low.groupby((low != low.shift()).cumsum()).agg(["first", "size"]))
    runs = runs[runs["first"] == 1]["size"].sort_values(ascending=False)
    daily = (d[["wind_on", "wind_off", "solar"]].sum(axis=1) / d["load"]).resample("D").mean() * 100
    b.plot(daily.index, daily.values, color=TEAL, lw=1)
    b.fill_between(daily.index, 0, daily.values, color=TEAL, alpha=0.15, lw=0)
    b.set_ylabel("wind + solar, % of load (daily)")
    for t, v, txt, dx in [(daily.idxmin(), daily.min(), f"{daily.min():.0f} % on {daily.idxmin():%-d %b}", -95),
                          (daily.idxmax(), daily.max(), f"{daily.max():.0f} % on {daily.idxmax():%-d %b}", -95)]:
        b.annotate(txt, (t, v), xytext=(dx, 4 if v > 50 else -2), textcoords="offset points", fontsize=8.5, color=INK2,
                   arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.7), va="center")
    b.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter("%b", tz=daily.index.tz))
    grid(b)
    save(fig, "variability.webp")
    return runs.head(5), daily.min(), daily.idxmin(), daily.max(), daily.idxmax()


@fig
def household_price():
    # BDEW-Strompreisanalyse August 2026, household 3,500 kWh/a, 2026 average, ct/kWh
    parts = [("Procurement & retail", 15.17, "#2F6FD0"), ("Network charges (incl. metering)", 9.24, "#138374"),
             ("VAT 19 %", 5.91, "#8C3C4E"), ("Electricity tax", 2.05, "#B4552F"), ("Concession fee", 1.666, "#D9762B"),
             ("§ 19 grid surcharge", 1.559, "#A3A9B4"), ("Offshore grid levy", 0.941, "#173F7E"),
             ("CHP levy", 0.446, "#7A5230")]
    fig, ax = plt.subplots(figsize=(8.4, 2.0))
    x = 0
    for i, (n, v, c) in enumerate(parts):
        ax.barh(0, v, left=x, color=c, height=0.6, edgecolor="white", lw=1.2)
        if v > 3:
            ax.text(x + v / 2, 0, f"{v:.1f}", ha="center", va="center", color="white", fontsize=10, fontweight="semibold")
        x += v
    ax.set_xlim(0, 37.2)
    ax.set_ylim(-0.4, 0.6)
    ax.axis("off")
    from matplotlib.patches import Patch
    ax.legend(handles=[Patch(color=c, label=f"{n}  {v:.2f}") for n, v, c in parts], loc="upper left",
              bbox_to_anchor=(0.0, 0.08), ncol=3, fontsize=8.6, handlelength=1.0, columnspacing=1.4)
    ax.text(0, 0.42, "37.0 ct/kWh, average household (3,500 kWh/year), 2026", fontsize=9.5, color=INK2, va="bottom")
    save(fig, "household_price.webp")


if __name__ == "__main__":
    want = sys.argv[1:]
    for name, fn in FIGS.items():
        if want and not any(w in name for w in want):
            continue
        try:
            out = fn()
        except FileNotFoundError as e:
            print("skip", name, e)
            continue
        if out is not None and name in ("renewable_share", "neighbours_trade", "negative_hours", "capture_rates",
                                        "wind_solar_variability", "generation_years"):
            print(name, "\n", out)
