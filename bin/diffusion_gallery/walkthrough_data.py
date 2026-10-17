#!/usr/bin/env python3
"""Data for the walkthrough page (/projects/diffusion-architectures/walkthrough/).

Reads two PDB entries and writes assets/diffusion-article/walkthrough/<id>.json with, per complex:
sequences and chains, Cα coordinates (centred, Å), the Cβ distance map (Å, uint8, base64), interface
flags, and the alternative poses the page's exact denoiser knows about. Run with the desk's Python
environment (biotite): /home/niklas/code/MasterThesis/050_system/pyenv/py bin/diffusion_gallery/walkthrough_data.py

1N8Z  trastuzumab VL (A 1-107) + VH (B 1-120) + HER2 domain IV (C 480-607): the native pose plus three
      rigid alternative placements of the antigen (rotations about the interface centre that keep it
      bound and clash-free) — a toy stand-in for "several plausible binding poses".
1VII  villin headpiece, 35 residues: one fold, the control.
"""
import base64
import json
import pathlib
import sys

import biotite.structure as struc
import biotite.structure.io.pdbx as pdbx
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "diffusion-article" / "walkthrough"
SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/ac2")
AA = dict(ALA="A", ARG="R", ASN="N", ASP="D", CYS="C", GLN="Q", GLU="E", GLY="G", HIS="H", ILE="I", LEU="L",
          LYS="K", MET="M", PHE="F", PRO="P", SER="S", THR="T", TRP="W", TYR="Y", VAL="V")


def residues(cif, chains):
    a = pdbx.get_structure(pdbx.CIFFile.read(cif), model=1)
    a = a[struc.filter_amino_acids(a)]
    out = []
    for ch, lo, hi, name, role in chains:
        r = a[(a.chain_id == ch) & (a.res_id >= lo) & (a.res_id <= hi)]
        seq, ca, cb = [], [], []
        for rid in np.unique(r.res_id):
            res = r[r.res_id == rid]
            if "CA" not in res.atom_name:
                continue
            seq.append(AA.get(res.res_name[0], "X"))
            ca.append(res[res.atom_name == "CA"].coord[0])
            cb.append((res[res.atom_name == "CB"] if "CB" in res.atom_name else res[res.atom_name == "CA"]).coord[0])
        out.append(dict(id=ch, name=name, role=role, seq="".join(seq), ca=np.array(ca), cb=np.array(cb)))
    return out


def rot(axis, ang):
    axis = axis / np.linalg.norm(axis)
    K = np.array([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    return np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * K @ K


def pack(name, title, chs, poses=None, note=""):
    ca = np.concatenate([c["ca"] for c in chs]); cb = np.concatenate([c["cb"] for c in chs])
    ctr = ca.mean(0); ca = ca - ctr
    D = np.linalg.norm(cb[:, None] - cb[None], axis=-1)
    chain_of = np.concatenate([[k] * len(c["seq"]) for k, c in enumerate(chs)])
    ab = np.array([chs[k]["role"] == "binder" for k in chain_of])
    ag = np.array([chs[k]["role"] == "antigen" for k in chain_of])
    inter = (D < 8) & np.outer(ab, ag)
    iface = (inter.any(1) | inter.any(0)).astype(int)
    data = dict(id=name, title=title, note=note,
                chains=[dict(id=c["id"], name=c["name"], role=c["role"], seq=c["seq"]) for c in chs],
                chain_of=chain_of.tolist(), iface=iface.tolist(),
                ca=np.round(ca, 2).tolist(),
                dist=base64.b64encode(np.clip(np.round(D), 0, 255).astype(np.uint8).tobytes()).decode(),
                n=int(len(ca)))
    if poses is not None:
        data["poses"] = [np.round(p - ctr, 2).tolist() for p in poses]   # antigen coordinates per pose
        data["ag_idx"] = np.where(ag)[0].tolist()
    (OUT / f"{name}.json").write_text(json.dumps(data, separators=(",", ":")))
    print(name, "N =", len(ca), "bytes", (OUT / f"{name}.json").stat().st_size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    chs = residues(SRC / "1n8z.cif", [("A", 1, 107, "light chain VL", "binder"), ("B", 1, 120, "heavy chain VH", "binder"),
                                      ("C", 480, 607, "HER2 domain IV", "antigen")])
    ab = np.concatenate([chs[0]["ca"], chs[1]["ca"]]); ag = chs[2]["ca"]
    D = np.linalg.norm(ab[:, None] - ag[None], axis=-1)
    centre = np.concatenate([ab[(D < 10).any(1)], ag[(D < 10).any(0)]]).mean(0)
    rng = np.random.default_rng(7)
    poses = [ag]
    for _ in range(40000):
        R = rot(rng.normal(size=3), np.deg2rad(rng.uniform(30, 110)))
        p = (ag - centre) @ R.T + centre
        d = np.linalg.norm(ab[:, None] - p[None], axis=-1)
        if d.min() < 4.0 or (d < 8).sum() < 12:
            continue
        if min(np.sqrt(((p - q) ** 2).sum(1).mean()) for q in poses) < 11:
            continue
        poses.append(p)
        if len(poses) == 4:
            break
    print("poses", len(poses), [round(float(np.sqrt(((p - ag) ** 2).sum(1).mean())), 1) for p in poses])
    pack("1n8z", "Antibody–antigen: trastuzumab Fv with HER2 domain IV (1N8Z)", chs, poses,
         "Several binding poses are plausible: the native one and three alternatives.")
    v = residues(SRC / "1vii.cif", [("A", -999, 9999, "villin headpiece", "single")])
    pack("1vii", "One fold: villin headpiece (1VII)", v, None, "A small protein with one stable structure: the control.")


if __name__ == "__main__":
    main()
