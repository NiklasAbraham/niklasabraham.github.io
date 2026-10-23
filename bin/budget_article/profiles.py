"""Country profiles of the budget long read: one card per country, every sentence computed from budget.json.

Writes _includes/budget-article/profiles.html. For each country: size of the state, the three biggest purposes,
the purposes where it is first or last of the group, and the headline fiscal numbers."""
import json
import pathlib

from cofog_meta import FUNCS, GROUPS

ROOT = pathlib.Path(__file__).resolve().parents[2]
D = json.load(open(ROOT / "assets/budget-article/budget.json"))["countries"]
REG = ["Europe", "Americas", "Asia-Pacific", "Middle East & Africa"]
L1 = list(FUNCS)
GCOL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"]
SHORT = {"GF01": "general public services", "GF02": "defence", "GF03": "public order", "GF04": "economic affairs", "GF05": "environment",
         "GF06": "housing and amenities", "GF07": "health", "GF08": "recreation and culture", "GF09": "education", "GF10": "social protection"}
FULL = [i for i, c in D.items() if c["cofog"]]


def ly(i): return max(D[i]["cofog"], key=int)
def v(i, k): return D[i]["cofog"][ly(i)][k]
def tot(i): return sum(v(i, k) for k in L1)
def fis(i, k, y=None):
    f = D[i]["fiscal"]; y = int(y or ly(i)) if D[i]["cofog"] or y else 2024
    return f[k][f["years"].index(y)] if y in f["years"] else None
def ordinal(n): return f"{n}{'th' if 11 <= n % 100 <= 13 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"


def rank(key, i, share=False):
    vals = sorted(((v(j, key) / (tot(j) if share else 1)), j) for j in FULL)
    vals.reverse()
    return [j for _, j in vals].index(i) + 1


CAVEAT = {
    "IRL": " <em>Irish GDP is inflated by multinationals' profits, which makes every ratio to GDP look small.</em>",
    "CHE": " <em>Compulsory health insurance is private in Switzerland and so is not counted as government health spending.</em>",
    "USA": " <em>The IMF series has no detail below social protection for the US and reports no separate environment spending.</em>",
    "RUS": " <em>Pre-invasion data: the budget has changed since.</em>",
    "UKR": " <em>Wartime year; foreign grants finance part of the deficit.</em>",
    "ARE": " <em>Only one year of functional data (2024).</em>",
}


def card(i):
    c = D[i]
    cls = f'<span class="bx-flag" style="--c:#6b7280">{c["region"]}</span>'
    if not c["cofog"]:
        y = 2024
        rev, exp, bal, debt = (fis(i, k, y) for k in ("rev", "exp", "bal", "debt"))
        pc = fis(i, "pc_ppp", y)
        mil = c["mil"].get("2025", {}).get("mil_gdp")
        s = (f'{c["name"]} has no functional breakdown of spending in the IMF, Eurostat or OECD data. What the IMF does report for {y}: '
             f'revenue {rev:.1f} % of GDP, expenditure {exp:.1f} %, {"deficit" if bal < 0 else "surplus"} {abs(bal):.1f} %, gross debt {debt:.1f} % of GDP; GDP per person ${pc:,.0f} (PPP).')
        if mil: s += f' Military spending (SIPRI, 2025): {mil:.1f} % of GDP.'
        return (f'<div class="bx-prof" data-iso="{i}"><h4>{c["name"]}<small>headline only</small></h4><p>{s}</p></div>')
    y = ly(i)
    t = tot(i)
    shares = sorted(((v(i, k) / t * 100, k) for k in L1), reverse=True)
    n_t = sorted((tot(j), j) for j in FULL)[::-1]
    rk_t = [j for _, j in n_t].index(i) + 1
    f = c["fiscal"]; fyi = f["years"].index(int(y)) if int(y) in f["years"] else None
    pcv = f["pc_ppp"][fyi] if fyi is not None else None
    bar = "".join(f'<i style="width:{sum(v(i, k) for k in g[2]) / t * 100:.2f}%;background:{GCOL[n]}" title="{g[1]}"></i>' for n, g in enumerate(GROUPS))
    head = f'In {y} the general government of {c["name"]} (all levels) spent <b>{t:.1f} %</b> of GDP (<b>{ordinal(rk_t)}</b> of {len(FULL)}'
    head += f'; ${t / 100 * pcv:,.0f} per person at PPP)' if pcv else ')'
    top = ", ".join(f'{SHORT[k]} {s:.0f} %' for s, k in shares[:3])
    notes = []
    for k in ("GF01", "GF02", "GF03", "GF04", "GF07", "GF09", "GF10"):
        r = rank(k, i)
        if r <= 2: notes.append((r, f'{SHORT[k]} is {"first" if r == 1 else "second"} of {len(FULL)} by % of GDP ({v(i, k):.1f} %)'))
        elif r >= len(FULL) - 1 and v(i, k) > 0: notes.append((len(FULL) - r + 1, f'{SHORT[k]} is {"last" if r == len(FULL) else "second to last"} ({v(i, k):.1f} %)'))
    notes = [n for _, n in sorted(notes, key=lambda t: t[0])]
    rev, bal, debt = (f[k][fyi] if fyi is not None else None for k in ("rev", "bal", "debt"))
    fiscal = ""
    if rev is not None:
        fiscal = f' IMF World Economic Outlook headline (its coverage can differ from the spending above): revenue {rev:.1f} % of GDP, {"deficit" if bal < 0 else "surplus"} {abs(bal):.1f} %, gross debt {debt:.1f} %.'
    cav = CAVEAT.get(i, "")
    if int(y) < 2023: cav = f' <em>Latest year with a functional breakdown is {y}.</em>'
    if c["sector"][y] != "S13": cav += " <em>Central government only.</em>"
    exp = f["exp"][fyi] if fyi is not None else None
    if exp is not None and abs(t - exp) >= 1.9:  # spending by purpose and the IMF headline expenditure are not on the same footing
        cav += f" <em>Spending by purpose covers {t:.1f} % of GDP, the IMF headline expenditure {exp:.1f} %: the revenue, balance and debt quoted here are not on the same footing as the spending.</em>"
    notes_s = (" Stands out: " + "; ".join(notes[:3]) + ".") if notes else ""
    return (f'<div class="bx-prof" data-iso="{i}"><h4>{c["name"]}<small>{y}</small></h4><div class="bx-pbar">{bar}</div>'
            f'<p>{head}. Biggest purposes: {top}.{notes_s}{fiscal}{cav}</p></div>')


out = ['<div class="bx-profiles">']
for r in REG:
    out.append(f'<h3 class="bx-reg">{r}</h3><div class="bx-grid">')
    for i, c in D.items():
        if c["region"] == r: out.append(card(i))
    out.append("</div>")
out.append("</div>")
dst = ROOT / "_includes/budget-article"
dst.mkdir(exist_ok=True)
(dst / "profiles.html").write_text("\n".join(out), encoding="utf-8")
print("profiles written", sum(len(x) for x in out) // 1024, "KB")
