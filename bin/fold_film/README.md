# fold_film

The film on the last step of the walkthrough (`/projects/diffusion-architectures/walkthrough/#step-film`).

`render.py` ray-traces PDB 1N8Z (trastuzumab Fv + HER2 domain IV) being sampled from noise by AlphaFold 3's
stochastic sampler (50 steps), the denoiser being the exact posterior mean of four antigen poses. Cartoon: the
denoiser's guess x̂; beads: the noisy state, one per residue, at the network's input scale. It reuses the thesis
figure foundry (`~/code/MasterThesis/030_slides/figures`: `figkit`, the `traj/abag_healthy_sde.npz` trajectories
from `tools/mock_sde.py`) and needs the miniconda Python with PyMOL:

    ~/miniconda3/bin/python bin/fold_film/render.py --seed 4     # ~9 min on 8 threads

Seed 4 lands in the crystal pose. Writes `assets/diffusion-article/walkthrough/fold.{webm,mp4,jpg,json}`; the page
(`assets/js/fw-film.js`) reads sigma and the step per frame from `fold.json`. Baked on white, no captions burned in.
