#!/usr/bin/env python3
"""Numbers quoted in the prose of the post, computed from assets/food-article/*.json (python3 story.py)."""
import json, pathlib
A = pathlib.Path(__file__).resolve().parents[2] / "assets" / "food-article"
F = json.load(open(A / "food.json")); T = json.load(open(A / "trade.json"))["trade"]; D = json.load(open(A / "diet.json"))
cn = lambda m: F["countries"].get(m, {}).get("n", m)
y = F["years"].index(F["year"]); C = {c["id"]: c for c in F["comms"]}
def tot(c): return sum(v[0] for v in F["prod"][c].values())
print("=== N50 (countries for half) of non-derived commodities")
rows = []
for c in F["comms"]:
    if c["d"]: continue
    p = F["prod"][c["id"]]; t = tot(c["id"]); ms = sorted(p, key=lambda m: -p[m][0]); cum = 0; n = 0
    for m in ms:
        n += 1; cum += p[m][0]
        if cum >= t / 2: break
    rows.append((n, c["id"], round(p[ms[0]][0] / t * 100), cn(ms[0]), len(p), round(t / 1e6, 1)))
for r in sorted(rows): print(r)
print("=== top 10 commodities by tonnes (non-derived)")
for c in sorted([c for c in F["comms"] if not c["d"]], key=lambda c: -tot(c["id"]))[:10]: print(c["id"], round(tot(c["id"]) / 1e6))
print("=== world plate kcal/day", D["world"]["kcal"], D["world"]["plate"])
print("=== top FBS items", D["world"]["items"][:12])
tk = sum(i[2] for i in D["world"]["items"]); print("sum items", tk)
cer = D["world"]["plate"]["cereals"] / D["world"]["kcal"]; print("cereal share of kcal", cer)
big = [m for m in D["c"] if D["c"][m]["pop"] > 5e6]
dep = lambda m: D["c"][m]["cer"]["imp"] / D["c"][m]["cer"]["dom"] * 100 if D["c"][m]["cer"]["dom"] > 0 else None
print("=== cereal import dependence (pop>5m) highest")
for m in sorted([m for m in big if dep(m) is not None], key=lambda m: -dep(m))[:14]: print(cn(m), round(dep(m)), round(D["c"][m]["pop"] / 1e6))
print("lowest"); 
for m in sorted([m for m in big if dep(m) is not None], key=lambda m: dep(m))[:8]: print(cn(m), round(dep(m)))
print("=== kcal extremes (pop>5m)")
s = sorted(big, key=lambda m: D["c"][m]["kcal"]); print([(cn(m), D["c"][m]["kcal"]) for m in s[:6]], [(cn(m), D["c"][m]["kcal"]) for m in s[-6:]])
s = sorted(big, key=lambda m: D["c"][m]["animal"]); print([(cn(m), round(D["c"][m]["animal"] * 100)) for m in s[:5]], [(cn(m), round(D["c"][m]["animal"] * 100)) for m in s[-5:]])
def flows(c, e=None, i=None, n=8):
    t = T[c]; f = [x for x in t["flows"] if (e is None or x[0] == e) and (i is None or x[1] == i)]
    return sorted(f, key=lambda x: -x[2])[:n]
print("=== flows")
for c, e, i in [("soy", "76", None), ("soy", None, "156"), ("wheat", "643", None), ("sunoil", "804", None), ("palmoil", "360", None), ("coffee", "76", None), ("rice", "356", None), ("cocoa", "384", None), ("avocado", "484", None), ("banana", "218", None)]:
    t = T[c]; print(c, e, i, "total", round(t["total"] / 1e6, 2), [(cn(x[0]), cn(x[1]), round(x[2] / 1e6, 2)) for x in flows(c, e, i, 5)])
print("=== soy imports China share", T["soy"]["imp"].get("156"), T["soy"]["total"], T["soy"]["imp"]["156"][0] / T["soy"]["total"])
print("=== Egypt wheat imports", T["wheat"]["imp"].get("818"), "who", [(cn(x[0]), round(x[2] / 1e6, 2)) for x in flows("wheat", None, "818", 5)])
print("=== world traded share by decade (cmp commodities)")
for c in ["wheat", "maize", "soy", "rice", "palmoil", "coffee", "chicken"]:
    if c in F["wtrade"]:
        w = F["wtrade"][c]; pr = F["world"][c]
        print(c, {yr: round(w[F["tyears"].index(yr)] / pr[F["years"].index(yr)] * 100) for yr in (1990, 2000, 2010, 2023) if w[F["tyears"].index(yr)]})
print("=== soy production 1961 / 2023 by country")
s = F["series"]["soy"]; i0 = 0
print({cn(m): (v[0], v[-2]) for m, v in s.items()})
print("=== wheat world 1961 vs 2023", F["world"]["wheat"][0], F["world"]["wheat"][y], " maize", F["world"]["maize"][0], F["world"]["maize"][y], "rice", F["world"]["rice"][0], F["world"]["rice"][y])
print("=== palm oil Indonesia/Malaysia 1990, 2000, 2023")
s = F["series"]["palmoil"]
for k, v in s.items(): print(cn(k), v[F["years"].index(1990)], v[F["years"].index(2000)], v[y])
