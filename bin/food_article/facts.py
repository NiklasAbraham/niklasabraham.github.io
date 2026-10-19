#!/usr/bin/env python3
"""Print the rankings and checks quoted in the post (reads assets/food-article/*.json)."""
import json, pathlib, sys
A = pathlib.Path(__file__).resolve().parents[2] / "assets" / "food-article"
F = json.load(open(A / "food.json")); T = json.load(open(A / "trade.json"))["trade"]; D = json.load(open(A / "diet.json"))
cn = lambda m: F["countries"].get(m, {}).get("n", m)
what = sys.argv[1:] or [c["id"] for c in F["comms"]]
y = F["years"].index(F["year"])
print("pop covered by FBS", D["world"]["pop"] / 1e9, "kcal", D["world"]["kcal"])
for cid in what:
    p = F["prod"][cid]; tot = sum(v[0] for v in p.values()); w = F["world"][cid][y]
    top = sorted(p, key=lambda m: -p[m][0])[:5]
    t = T.get(cid)
    print(f"{cid:10s} sum={tot/1e6:8.2f} Mt world(FAO)={(w or 0)/1e6:8.2f} n={len(p):3d} top: " + ", ".join(f"{cn(m)} {p[m][0]/tot:.0%}" for m in top)
          + (f" | traded {t['total']/1e6:.2f} Mt ({t['total']/tot:.0%}) top exp " + ", ".join(f"{cn(m)} {v[0]/t['total']:.0%}" for m, v in sorted(t['exp'].items(), key=lambda x: -x[1][0])[:3]) if t else ""))
