#!/usr/bin/env python3
"""The film on the walkthrough's last step (/projects/diffusion-architectures/walkthrough/#step-film).

One ray-traced PyMOL film of PDB 1N8Z (trastuzumab Fv + HER2 domain IV) sampled from noise with
AlphaFold 3's stochastic sampler, the denoiser being the exact posterior mean of four antigen poses
(the same toy the old live sampler used). Cartoon: the denoiser's guess x_hat; beads: the noisy state
x_t, one per residue, drawn in the network's input scale (c_in x) so the cloud condenses in place.
No captions burned in: the page draws sigma from fold.json, synchronised to the video time.

Reuses the thesis figure foundry (~/code/MasterThesis/030_slides/figures: figkit, tools/mock_sde.py
trajectories in traj/). Run with the miniconda python that has PyMOL:

    ~/miniconda3/bin/python bin/fold_film/render.py [--seed 0] [--w 1120] [--h 840]

Writes assets/diffusion-article/walkthrough/fold.webm, fold.mp4 (fallback), fold.jpg (poster), fold.json.
"""
import argparse, json, pathlib, shutil, subprocess, sys, tempfile, time

FIG = pathlib.Path.home() / 'code/MasterThesis/030_slides/figures'
sys.path[:0] = [str(FIG), str(FIG / 'tools'), str(FIG.parent / 'intro' / 'tools')]
from render_films import pm                                  # noqa: E402  house PyMOL session
from figkit import pymol_kit as pk, views, diffusion as dif  # noqa: E402
from figkit.structure import system                          # noqa: E402
from PIL import Image                                         # noqa: E402

OUT = pathlib.Path(__file__).resolve().parents[2] / 'assets/diffusion-article/walkthrough'
FPS = 25


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--seed', type=int, default=0)
    ap.add_argument('--w', type=int, default=1120)
    ap.add_argument('--h', type=int, default=840)
    ap.add_argument('--per-step', type=int, default=3)
    ap.add_argument('--hold', type=int, default=110)
    ap.add_argument('--turn', type=float, default=0.55, help='degrees per frame about the vertical axis')
    a = ap.parse_args()
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    S = system('abag')
    run = dif.load('abag', 'healthy')
    sig = run['sigma']; F = len(sig)
    v0 = views.get('abag', 'poses', a.w / a.h).zoomed(0.86)
    cmd = pm()
    cmd.set('max_threads', 8); cmd.set('antialias', 1); cmd.set('ray_opaque_background', 1); cmd.bg_color('white')
    cmd.set('cartoon_loop_radius', 0.36)
    pk.set_look(cmd, 'outline'); pk.palette.pymol_register(cmd)
    cmd.set('ray_trace_gain', 0.010)
    cmd.delete('all')
    pk.load(cmd, S, 'dh'); pk.rep_cartoon(cmd, 'dh', S, 'roles')
    pk.load_beads(cmd, S, 'bt'); pk.rep_beads(cmd, 'bt', S, 'roles', scale=0.45, trace=False)
    cmd.set('sphere_transparency', 0.5, 'bt')
    us = [i / a.per_step for i in range((F - 1) * a.per_step + 1)] + [F - 1] * a.hold
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='fold_'))
    meta = []; t0 = time.time()
    for k, u in enumerate(us):
        tau = int(round(u))
        x = run['x'][a.seed][tau]; xh = dif.xhat_at(run, a.seed, tau)
        pk.update(cmd, 'dh', xh); pk.update(cmd, 'bt', S.beads(dif.residual_view(x, xh, sig[tau])))
        if tau == F - 1:   # landed: the beads have merged into the cartoon
            cmd.disable('bt')
        pk.render(cmd, v0.turned('y', a.turn * k), tmp / ('f_%04d.png' % k), a.w, a.h)
        meta.append(round(float(sig[tau]), 4))
        if k % 25 == 0:
            print('frame %d / %d  %.0f s' % (k, len(us), time.time() - t0), flush=True)
    OUT.mkdir(parents=True, exist_ok=True)
    src = ['-framerate', str(FPS), '-i', str(tmp / 'f_%04d.png')]
    subprocess.run([ff, '-y', '-loglevel', 'error', *src, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1',
                    '-pix_fmt', 'yuv420p', str(OUT / 'fold.webm')], check=True)
    subprocess.run([ff, '-y', '-loglevel', 'error', *src, '-c:v', 'libx264', '-crf', '26', '-preset', 'slow',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(OUT / 'fold.mp4')], check=True)
    Image.open(tmp / ('f_%04d.png' % (len(us) - 1))).convert('RGB').save(OUT / 'fold.jpg', quality=86)
    poses = run.get('mode')
    json.dump({'fps': FPS, 'n_steps': F - 1, 'sigma': meta,
               'step': [int(round(u)) for u in us], 'seed': a.seed,
               'pose': int(poses[a.seed]) if poses is not None else None}, open(OUT / 'fold.json', 'w'))
    shutil.rmtree(tmp, ignore_errors=True)
    for f in ('fold.webm', 'fold.mp4', 'fold.jpg', 'fold.json'):
        print('%-10s %8.1f kB' % (f, (OUT / f).stat().st_size / 1024))
    print('ALL DONE in %.0f s' % (time.time() - t0))


if __name__ == '__main__':
    main()
