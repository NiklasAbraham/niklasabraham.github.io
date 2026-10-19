"""Print the numbers quoted in the prose, from assets/budget-article/budget.json."""
import json
import pathlib

D = json.load(open(pathlib.Path(__file__).resolve().parents[2] / "assets/budget-article/budget.json"))["countries"]
L1 = [f"GF{i:02d}" for i in range(1, 11)]
FULL = {i: c for i, c in D.items() if c["cofog"]}


def ly(i): return max(D[i]["cofog"])
def cf(i, k, y=None): return D[i]["cofog"][y or ly(i)].get(k)
def tot(i, y=None): return sum(cf(i, k, y) for k in L1)
def fy(i, key, y):
    f = D[i]["fiscal"]
    return f[key][f["years"].index(int(y))] if int(y) in f["years"] else None
def pick(dct, y):
    return dct.get(y) or (dct[max(dct)] if dct else None)


def rank(title, fn, n=33, rev=True, fmt="{:.1f}"):
    r = sorted(((fn(i), i) for i in FULL if fn(i) is not None), reverse=rev)
    print(f"\n## {title}\n" + ", ".join(f"{i} {fmt.format(v)}" for v, i in r[:n]))


if __name__ == "__main__":
    rank("total spending % GDP (COFOG)", lambda i: tot(i))
    for k, n in (("GF01", "general"), ("GF02", "defence"), ("GF03", "order"), ("GF04", "economic"), ("GF07", "health"), ("GF09", "education"), ("GF10", "social"), ("GF1002", "old age"), ("GF0107", "public debt transactions"), ("GF0701", "med products"), ("GF0703", "hospitals"), ("GF0405", "transport")):
        rank(f"{n} % GDP", lambda i, k=k: cf(i, k))
        rank(f"{n} share of spending %", lambda i, k=k: 100 * cf(i, k) / tot(i) if cf(i, k) is not None else None)
    rank("military SIPRI % GDP latest", lambda i: (D[i]["mil"][max(D[i]["mil"])]["mil_gdp"] if D[i]["mil"] else None), n=40)
    for i in D:
        if D[i]["mil"]:
            m = D[i]["mil"]; print(i, {y: round(m[y].get("mil_gdp", 0), 2) for y in list(m)[-6:]})
