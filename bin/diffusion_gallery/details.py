"""Long-form content for the gallery's detail view: overview text, a shape trace through one
forward pass, links, and one entry per block of each drawing.

Blocks are addressed by key. A box's key is the slug of the first line of its title unless the
drawing passes one explicitly (U-Net levels are enc0, dec0, …; the co-folding models use the
keys of their spec tuples). build.py warns about any key here that no drawing uses.

Text may use the drawing markup: x_t, z_{ij}, σ^2 become sub- and superscripts. Anything in
backticks is code and is left alone.
"""


def P(dims, text, *refs):
    return dict(dims=dims, text=text, refs=list(refs))


# Where a component comes from. Each is (label, url).
R = dict(
    transformer=("Vaswani et al. 2017 · Attention is all you need", "https://arxiv.org/abs/1706.03762"),
    groupnorm=("Wu & He 2018 · Group Normalization", "https://arxiv.org/abs/1803.08494"),
    wrn=("Zagoruyko & Komodakis 2016 · Wide ResNets", "https://arxiv.org/abs/1605.07146"),
    pixelcnnpp=("Salimans et al. 2017 · PixelCNN++", "https://arxiv.org/abs/1701.05517"),
    unet=("Ronneberger et al. 2015 · U-Net", "https://arxiv.org/abs/1505.04597"),
    ddpm=("Ho et al. 2020 · DDPM", "https://arxiv.org/abs/2006.11239"),
    iddpm=("Nichol & Dhariwal 2021 · Improved DDPM (learned Σ)", "https://arxiv.org/abs/2102.09672"),
    adm=("Dhariwal & Nichol 2021 · Diffusion beats GANs", "https://arxiv.org/abs/2105.05233"),
    biggan=("Brock et al. 2019 · BigGAN", "https://arxiv.org/abs/1809.11096"),
    cfg=("Ho & Salimans 2022 · Classifier-free guidance", "https://arxiv.org/abs/2207.12598"),
    ddim=("Song et al. 2021 · DDIM", "https://arxiv.org/abs/2010.02502"),
    ldm=("Rombach et al. 2022 · Latent diffusion", "https://arxiv.org/abs/2112.10752"),
    clip=("Radford et al. 2021 · CLIP", "https://arxiv.org/abs/2103.00020"),
    openclip=("OpenCLIP (LAION)", "https://github.com/mlfoundations/open_clip"),
    t5=("Raffel et al. 2020 · T5", "https://arxiv.org/abs/1910.10683"),
    geglu=("Shazeer 2020 · GLU variants (GEGLU)", "https://arxiv.org/abs/2002.05202"),
    sdxl=("Podell et al. 2023 · SDXL", "https://arxiv.org/abs/2307.01952"),
    sdedit=("Meng et al. 2022 · SDEdit", "https://arxiv.org/abs/2108.01073"),
    vit=("Dosovitskiy et al. 2021 · ViT", "https://arxiv.org/abs/2010.11929"),
    film=("Perez et al. 2018 · FiLM", "https://arxiv.org/abs/1709.07871"),
    dit=("Peebles & Xie 2023 · DiT", "https://arxiv.org/abs/2212.09748"),
    uvit=("Bao et al. 2023 · U-ViT", "https://arxiv.org/abs/2209.12152"),
    mmdit=("Esser et al. 2024 · SD3 / MMDiT", "https://arxiv.org/abs/2403.03206"),
    rf=("Liu et al. 2023 · Rectified flow", "https://arxiv.org/abs/2209.03003"),
    fm=("Lipman et al. 2023 · Flow matching", "https://arxiv.org/abs/2210.02747"),
    rope=("Su et al. 2021 · RoFormer (RoPE)", "https://arxiv.org/abs/2104.09864"),
    qknorm=("Dehghani et al. 2023 · ViT-22B (QK-norm, parallel layers)", "https://arxiv.org/abs/2302.05442"),
    guidedistill=("Meng et al. 2023 · Distillation of guided diffusion", "https://arxiv.org/abs/2210.03142"),
    kontext=("BFL 2025 · FLUX.1 Kontext", "https://arxiv.org/abs/2506.15742"),
    rf2=("Baek et al. 2021 · RoseTTAFold", "https://doi.org/10.1126/science.abj8754"),
    se3t=("Fuchs et al. 2020 · SE(3)-Transformers", "https://arxiv.org/abs/2006.10503"),
    framediff=("Yim et al. 2023 · SE(3) diffusion (FrameDiff)", "https://arxiv.org/abs/2302.02277"),
    selfcond=("Chen, Zhang & Hinton 2023 · Analog Bits (self-conditioning)", "https://arxiv.org/abs/2208.04202"),
    rfdiff=("Watson et al. 2023 · RFdiffusion", "https://www.nature.com/articles/s41586-023-06415-8"),
    af2=("Jumper et al. 2021 · AlphaFold 2 (Evoformer, triangle updates)", "https://doi.org/10.1038/s41586-021-03819-2"),
    af3=("Abramson et al. 2024 · AlphaFold 3", "https://www.nature.com/articles/s41586-024-07487-w"),
    edm=("Karras et al. 2022 · EDM", "https://arxiv.org/abs/2206.00364"),
    illaf=("Simon & Silberg · The Illustrated AlphaFold", "https://elanapearl.github.io/blog/2024/the-illustrated-alphafold/"),
    boltz1=("Wohlwend et al. 2024 · Boltz-1", "https://doi.org/10.1101/2024.11.19.624167"),
    boltz2=("Passaro et al. 2025 · Boltz-2", "https://doi.org/10.1101/2025.06.14.659707"),
    protenix=("Protenix technical report 2025", "https://doi.org/10.1101/2025.01.08.631967"),
    flash=("Dao et al. 2022 · FlashAttention", "https://arxiv.org/abs/2205.14135"),
    rfd3=("Butcher, Krishna, Mitra et al. 2026 · RFdiffusion3", "https://doi.org/10.1126/science.aeh2982"),
    pallatom=("Qu et al. 2025 · P(all-atom)", "https://openreview.net/forum?id=xeZmxOBvW9"),
    blt=("Pagnoni et al. 2025 · Byte Latent Transformer (cross-attention pooling)",
         "https://arxiv.org/abs/2412.09871"),
    atomworks=("Corley, Mathis et al. 2025 · AtomWorks and RF3",
               "https://doi.org/10.1101/2025.08.14.670328"),
    mpnn=("Dauparas et al. 2022 · ProteinMPNN", "https://doi.org/10.1126/science.add2187"),
    bioemu=("Lewis et al. 2025 · BioEmu", "https://doi.org/10.1126/science.adv9817"),
    bioemu_code=("Code · microsoft/bioemu", "https://github.com/microsoft/bioemu"),
    bioemu2=("BioEmu-2 code and model card · microsoft/bioemu2", "https://github.com/microsoft/bioemu2"),
    dig=("Zheng et al. 2024 · Distributional Graphormer (DiG)", "https://arxiv.org/abs/2306.05445"),
    colabfold=("Mirdita et al. 2022 · ColabFold", "https://doi.org/10.1038/s41592-022-01488-1"),
    rsgm=("De Bortoli et al. 2022 · Riemannian score-based generative modelling", "https://arxiv.org/abs/2202.02763"),
    dpmsolver=("Lu et al. 2022 · DPM-Solver", "https://arxiv.org/abs/2206.00927"),
    hpacker=("Visani et al. · H-Packer", "https://arxiv.org/abs/2311.09312"),
    pairmixer=("Ouyang-Zhang et al. 2025 · Triangle multiplication is all you need (PairMixer)",
               "https://arxiv.org/abs/2510.18870"),
    ito=("Schreiner, Winther & Olsson 2023 · Implicit transfer operator learning",
         "https://arxiv.org/abs/2305.18046"),
    fksteer=("Singhal et al. 2025 · FK steering of diffusion models", "https://proceedings.mlr.press/v267/singhal25b.html"),
)


# ----------------------------------------------------------------------------------------
# What a kind of layer does, independent of the model it sits in. The detail view offers this
# under "What this kind of layer does", so the same block type reads the same everywhere.
# ROLE_GLOSS is the fallback (every block has a role); KEY_GLOSS overrides it where a block
# key recurs across models and deserves its own words.
# ----------------------------------------------------------------------------------------

ROLE_GLOSS = {
    "io": "An input or output of the network rather than a layer: what goes in, what comes back "
          "out. Nothing is learned here.",
    "embed": "A projection that turns raw inputs into vectors the network can work with, or maps "
             "between two granularities (atoms and tokens, pixels and patches). Mostly linear "
             "layers and lookup tables; cheap next to the stacks that follow.",
    "attn": "An attention layer. Every position builds a query, compares it with the keys of the "
            "positions it is allowed to see, and takes a weighted sum of their values. This is how "
            "information moves between distant parts of the input; which positions may attend to "
            "which is what distinguishes global, windowed and distance-gated variants.",
    "mlp": "A position-wise feed-forward layer: the same small network applied independently at "
           "every position, widening to an inner dimension and back. Attention moves information "
           "between positions; this transforms it in place, and usually holds most of the "
           "parameters.",
    "norm": "A normalisation or modulation layer. It rescales activations to keep training stable, "
            "and in diffusion models it is also where the conditioning enters: the scale and shift "
            "are predicted from the noise level and the condition instead of being learned "
            "constants (FiLM, AdaLN).",
    "conv": "A convolution or residual block. It mixes a position with its spatial neighbours using "
            "shared weights, so it is naturally translation-equivariant and cheap on grids. The "
            "building block of U-Net denoisers.",
    "cond": "The conditioning path: where everything the denoiser is told about the target enters, "
            "and where the noise level is embedded. In a co-folding model this is also the boundary "
            "between the part computed once per target and the part recomputed at every step.",
    "latent": "An autoencoder stage. The diffusion process does not run on the data itself but on a "
              "compressed latent, with an encoder in front and a decoder behind, so the denoiser "
              "works at a much smaller resolution.",
    "pair": "A pair representation: one vector per pair of tokens, holding what the network believes "
            "about the relationship between them — typically distance and orientation. It is "
            "quadratic in sequence length, which is why it dominates the cost of a folding trunk.",
}

KEY_GLOSS = {
    "noise": "The starting point of the reverse process: pure Gaussian noise at the largest noise "
             "level of the schedule. Each sample begins from a different draw, which is the only "
             "source of diversity between samples of the same target.",
    "xhat": "The denoiser's estimate of the clean data given the current noisy state. The sampler "
            "does not jump to it; it takes a step toward it, re-noises a little, and asks again.",
    "cond": "Where the condition and the noise level are injected. The noise level is turned into a "
            "vector by a Fourier or sinusoidal embedding and added to the condition, so one network "
            "can serve every noise level instead of one network per step.",
    "aenc": "The atom encoder. It attends over atoms — only locally, since atoms far apart in the "
            "structure have little to say to each other — and then pools each token's atoms into a "
            "single token vector, handing a much shorter sequence to the transformer above.",
    "tok": "The token transformer: the main body of the denoiser, attending globally over tokens. "
           "The condition enters here twice over, as AdaLN scales and shifts from the single "
           "representation and as a learned bias added to every attention logit from the pair "
           "representation.",
    "adec": "The atom decoder. It broadcasts the token features back down to the atoms they came "
            "from and runs local attention again, ending in a linear layer that outputs a "
            "coordinate update per atom.",
    "c": "The condition handed to the denoiser. It is computed once per target and reused for every "
         "sampling step and every sample, which is why the trunk is expensive but amortised, while "
         "the denoiser is cheap but paid for hundreds of times.",
    "pf": "The Pairformer: the folding trunk's main stack, alternating triangle updates on the pair "
          "representation with attention on the single representation. Triangle updates enforce a "
          "geometric consistency — if i is close to k and k to j, that constrains i and j — which is "
          "what makes the stack expensive and what the lighter models drop.",
    "msa": "The MSA module. A multiple sequence alignment holds evolutionary cousins of the input "
           "sequence; positions that mutate together are usually in contact, and this module "
           "distils that signal into the pair representation.",
    "tmpl": "The template module. Known structures of related proteins are embedded as pair features "
            "and averaged into the pair representation, giving the trunk a structural prior.",
    "conf": "The confidence head. It does not change the structure; it predicts how much to trust "
            "it, per atom and per pair, and its scores are what rank several samples of the same "
            "target against each other.",
    "emb": "The input embedder: raw inputs become the single and pair representations the trunk "
           "works with, including the relative-position and bond features that tell the network how "
           "the tokens are connected.",
    "input": "What the user supplies. Everything downstream is a function of this plus the noise "
             "draw, so what can be asked of the model is set here.",
    "out": "What comes back, after any ranking or post-processing that is not part of the network.",
    "ipa": "Invariant point attention, the layer AlphaFold 2's structure module is built from. Each residue "
           "carries a rigid frame; besides ordinary query-key attention, every head places a few query and key "
           "points in 3D using the residue's frame, and the distance between those points enters the attention "
           "logit. Rotating the whole structure rotates the points with it, so the output does not change.",
    "score": "The network's output for a score model: an estimate of the gradient of the log-density of the "
             "noised data, here per residue and in that residue's own frame. A solver turns it into the next, "
             "less noisy state; it is not a clean structure itself.",
    "pairmixer": "A PairMixer block: triangle multiplication (outgoing, then incoming) and a transition on the "
                 "pair representation, nothing else. No triangle attention and no attention on the single "
                 "representation, which is what makes it cheaper than a Pairformer block.",
    "coup": "A coupling step between two residual streams that run at different granularities. Token features "
            "are broadcast to their atoms and mixed into the atom stream; the features of each token's centre "
            "atom are mixed back into the token stream. Both mixes are MLPs gated by the conditioning.",
    "readout": "The output layer: token and atom features are projected to a common width, added per atom, "
               "normalised and mapped to a three-dimensional coordinate update.",
    "mid": "The middle of a U-Net, at the lowest resolution and the widest channels. Attention is "
           "affordable here, so this is where the most global reasoning happens.",
}


def unet_level_text(resblock):
    """Shared text for U-Net levels; build.py adds the level's own resolution and channels."""
    return resblock


DETAILS = {}

# ---------------------------------------------------------------------------------- DDPM
DETAILS["ddpm"] = dict(
    links=[("Paper · arXiv 2006.11239", "https://arxiv.org/abs/2006.11239"),
           ("Code · TensorFlow (official)", "https://github.com/hojonathanho/diffusion"),
           ("Lilian Weng · What are diffusion models?", "https://lilianweng.github.io/posts/2021-07-11-diffusion-models/")],
    overview=[
        "DDPM fixes a forward process that adds Gaussian noise over T = 1000 steps with a linear β schedule "
        "and trains a network ε_θ(x_t, t) to predict the noise that was added. With this parameterisation the "
        "variational bound reduces, up to its weighting, to a plain mean-squared error on ε, the L_{simple} "
        "objective, which gave better samples than the full bound.",
        "The network is a PixelCNN++-style U-Net: four resolutions from 32² down to 4², two Wide-ResNet blocks "
        "per resolution, GroupNorm and SiLU throughout, and one self-attention layer at 16². The time step "
        "enters every ResBlock as a projected sinusoidal embedding that is added to the feature map. Nothing "
        "else conditions the network.",
        "Sampling runs the learned reverse chain for all 1000 steps, one network call each. DDIM and the later "
        "ODE solvers cut that to tens of steps on the same trained network.",
    ],
    resblock="GroupNorm → SiLU → 3×3 conv → + time embedding → GroupNorm → SiLU → dropout 0.1 → 3×3 conv, plus the residual",
    flow=[("noisy image x_t", "3 × 32 × 32"),
          ("t → sinusoidal → MLP", "128 → 512"),
          ("stem 3×3 conv", "128 × 32 × 32"),
          ("encoder", "128 · 32² → 256 · 16² → 256 · 8² → 256 · 4²"),
          ("bottleneck", "256 × 4 × 4"),
          ("decoder, skips concatenated", "256 · 4² → … → 128 · 32²"),
          ("GroupNorm · SiLU · 3×3 conv", "ε̂: 3 × 32 × 32")],
    parts={
        "noisy image x_t": P("3 × 32 × 32 (CIFAR-10) · 3 × 256 × 256 (LSUN, CelebA-HQ)",
                             "x_t = √ᾱ_t x_0 + √(1 − ᾱ_t) ε. During training x_0 is a data image and t is uniform on "
                             "{1, …, 1000}; during sampling it is the current state of the reverse chain, which starts "
                             "from pure Gaussian noise at t = T.", R["ddpm"]),
        "noise ε̂": P("3 × 32 × 32",
                     "The predicted noise. The reverse-step mean is μ_θ = (x_t − β_t / √(1 − ᾱ_t) · ε̂) / √α_t; the "
                     "variance is fixed to β_t, not learned.", R["ddpm"]),
        "mid": P("256 × 4 × 4",
                 "ResBlock → single-head self-attention → ResBlock at the lowest resolution: besides 16², the only "
                 "place where every position sees every other.", R["transformer"]),
        "time t": P("t ∈ {1…1000} → 128-d sinusoidal → Dense 512 → SiLU → Dense 512",
                    "Each ResBlock projects this 512-d vector to its own channel count and adds it to the feature map "
                    "after the first convolution, a per-channel bias that tells the block how noisy its input is.",
                    R["transformer"]),
    },
)

# ---------------------------------------------------------------------------------- ADM
DETAILS["adm"] = dict(
    links=[("Paper · arXiv 2105.05233", "https://arxiv.org/abs/2105.05233"),
           ("Code · guided-diffusion", "https://github.com/openai/guided-diffusion"),
           ("Improved DDPM (learned Σ)", "https://arxiv.org/abs/2102.09672")],
    overview=[
        "ADM, the 'ablated diffusion model', is the DDPM U-Net after a systematic architecture search on "
        "ImageNet: more width, attention at 32², 16² and 8² with 64 channels per head, and BigGAN-style "
        "residual blocks that do the up- and downsampling themselves.",
        "Class and time enter through adaptive group normalisation, AdaGN(h, y) = y_s · GroupNorm(h) + y_b, "
        "where (y_s, y_b) is a linear projection of the summed time and class embedding. Following Improved "
        "DDPM the network also predicts how to interpolate the reverse-step variance between β_t and β̃_t, "
        "trained with the hybrid loss L_{simple} + λ L_{vlb}.",
        "Classifier guidance adds s · Σ ∇_{x_t} log p_φ(y | x_t) to the mean of every reverse step, where p_φ is "
        "a separate classifier trained on noisy images. The guidance scale s trades diversity for fidelity; "
        "this is the paper in which diffusion first beat BigGAN on ImageNet FID.",
    ],
    resblock="BigGAN residual block: GroupNorm → SiLU → 3×3 conv → AdaGN(t, y) → SiLU → dropout → 3×3 conv, plus the residual; resampling happens inside the block",
    flow=[("noisy image x_t", "3 × 256 × 256"),
          ("t + y → embedding", "1024"),
          ("stem 3×3 conv", "256 × 256 × 256"),
          ("encoder, mult (1, 1, 2, 2, 4, 4)", "256 · 256² → 256 · 128² → 512 · 64² → 512 · 32² → 1024 · 16² → 1024 · 8²"),
          ("bottleneck", "1024 × 8 × 8"),
          ("decoder, skips concatenated", "back to 256 × 256 × 256"),
          ("output conv", "ε̂ and v: 6 × 256 × 256")],
    parts={
        "noisy image x_t": P("3 × 256 × 256 (ImageNet 256 model)", "Same forward process as DDPM; the cosine schedule "
                             "of Improved DDPM is used for the smaller ImageNet models.", R["iddpm"]),
        "ε̂ and Σ̂": P("6 × 256 × 256 = 3 for ε̂ + 3 for v",
                      "Σ_θ = exp(v log β_t + (1 − v) log β̃_t): a learned per-pixel interpolation between the two "
                      "analytic variances. Learning Σ is what allows sampling with 25–250 steps instead of 1000.",
                      R["iddpm"]),
        "mid": P("1024 × 8 × 8", "ResBlock → multi-head attention (16 heads × 64) → ResBlock."),
        "time t + class y": P("t → sinusoidal 256 → MLP → 1024 · y → embedding 1000 × 1024 · summed",
                              "Each ResBlock projects the 1024-d vector to 2C numbers, a scale and a shift per channel, "
                              "applied after GroupNorm (AdaGN). This is the convolutional ancestor of DiT's adaLN.",
                              R["adm"], R["film"]),
        "noisy classifier p(y | x_t)": P("encoder half of the U-Net + attention pooling at 8² → 1000 logits",
                                         "Trained on noised ImageNet images at every t. At sampling time its gradient "
                                         "shifts each reverse step: μ ← μ + s Σ ∇_{x_t} log p_φ(y | x_t) "
                                         "(ADM Algorithm 1). Classifier-free guidance later removed the classifier.",
                                         R["adm"], R["cfg"]),
    },
)

# ---------------------------------------------------------------------------------- SD 1
DETAILS["sd1"] = dict(
    links=[("Paper · arXiv 2112.10752", "https://arxiv.org/abs/2112.10752"),
           ("Code · CompVis/stable-diffusion", "https://github.com/CompVis/stable-diffusion"),
           ("Code · CompVis/latent-diffusion", "https://github.com/CompVis/latent-diffusion"),
           ("Jay Alammar · The Illustrated Stable Diffusion", "https://jalammar.github.io/illustrated-stable-diffusion/")],
    overview=[
        "Latent diffusion splits generation in two. A KL-regularised autoencoder, trained once with perceptual "
        "and adversarial losses, compresses a 512² image to a 4 × 64 × 64 latent (downsampling factor f = 8). "
        "The diffusion model only ever sees that latent, so it no longer spends capacity on pixel-level detail "
        "that the decoder can restore.",
        "The denoiser is an ADM-style U-Net with 320, 640, 1280 and 1280 channels and a spatial transformer "
        "after the ResBlocks at 64², 32² and 16². Each transformer block runs self-attention over the latent "
        "positions, then cross-attention whose keys and values are the 77 × 768 token features of a frozen "
        "CLIP ViT-L/14 text encoder, then a GEGLU feed-forward.",
        "Time enters each ResBlock additively, as in DDPM. Sampling uses about 50 PNDM or DDIM steps with "
        "classifier-free guidance (scale ≈ 7.5), which needs a conditional and an unconditional (empty prompt) "
        "prediction at every step.",
    ],
    resblock="GroupNorm → SiLU → 3×3 conv → + time embedding → GroupNorm → SiLU → 3×3 conv, plus the residual; then a spatial transformer where marked",
    flow=[("image x", "3 × 512 × 512"),
          ("VAE encoder, × 0.18215", "z: 4 × 64 × 64"),
          ("prompt → CLIP ViT-L/14", "77 × 768"),
          ("input 3×3 conv", "320 × 64 × 64"),
          ("encoder", "320 · 64² → 640 · 32² → 1280 · 16² → 1280 · 8²"),
          ("decoder, skips concatenated", "back to 320 × 64 × 64"),
          ("output 3×3 conv", "ε̂: 4 × 64 × 64"),
          ("VAE decoder (after the last step)", "3 × 512 × 512")],
    parts={
        "image x": P("3 × 512 × 512", "Only used in training: the encoder turns it into the clean latent z_0."),
        "image": P("3 × 512 × 512", "The decoded sample. The VAE decoder runs once, after the last denoising step."),
        "VAE encoder": P("3 × 512² → mean and log-variance 2 × 4 × 64² → sample 4 × 64 × 64",
                         "A convolutional encoder trained with L1 + LPIPS + patch-GAN losses and a small KL penalty. "
                         "The latent is multiplied by 0.18215 so that it has roughly unit variance.", R["ldm"]),
        "VAE decoder": P("4 × 64 × 64 → 3 × 512 × 512", "About 50 M parameters; ResBlocks with one attention layer "
                         "at the lowest resolution.", R["ldm"]),
        "noisy latent z_t": P("4 × 64 × 64", "z_t = √ᾱ_t z_0 + √(1 − ᾱ_t) ε with a scaled-linear β schedule, T = 1000.",
                              R["ldm"]),
        "noise ε̂": P("4 × 64 × 64", "ε-prediction in latent space."),
        "mid": P("1280 × 8 × 8", "ResBlock → spatial transformer → ResBlock."),
        "CLIP ViT-L/14 (frozen)": P("prompt → 77 BPE tokens → 12-layer text transformer → 77 × 768 (123 M)",
                                    "The last hidden layer is used as the cross-attention context. In every transformer "
                                    "block the latent positions give the queries and the 77 text tokens the keys and "
                                    "values: softmax(Q Kᵀ / √d) V, 8 heads.", R["clip"], R["ldm"]),
        "time t": P("t → sinusoidal 320 → MLP → 1280", "Projected and added inside every ResBlock."),
    },
)

# ---------------------------------------------------------------------------------- SDXL
DETAILS["sdxl"] = dict(
    links=[("Paper · arXiv 2307.01952", "https://arxiv.org/abs/2307.01952"),
           ("Code · Stability-AI/generative-models", "https://github.com/Stability-AI/generative-models"),
           ("Weights · stable-diffusion-xl-base-1.0", "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0")],
    overview=[
        "SDXL keeps the latent-diffusion recipe and scales the U-Net to 2.6 B parameters, but it moves the "
        "compute: the 128² level has no attention at all, the 64² level two transformer blocks per stage, the "
        "32² level ten. Most of the parameters sit at low resolution, where attention is cheap, and there are "
        "three levels instead of four.",
        "Text comes from two frozen encoders, OpenCLIP ViT-bigG/14 and CLIP ViT-L/14. Their penultimate-layer "
        "token features are concatenated channel-wise into a 77 × 2048 cross-attention context, and the pooled "
        "bigG embedding joins the time embedding.",
        "Micro-conditioning: the original image size, the crop offsets and the target size are Fourier-embedded "
        "and added to the time embedding, so the model can train on small and cropped images without learning to "
        "produce small or cropped images. An optional refiner, a second latent model specialised on low noise "
        "levels, polishes details SDEdit-style.",
    ],
    resblock="GroupNorm → SiLU → 3×3 conv → + vector embedding → GroupNorm → SiLU → 3×3 conv, plus the residual; then the marked number of transformer blocks",
    flow=[("image x", "3 × 1024 × 1024"),
          ("VAE encoder", "z: 4 × 128 × 128"),
          ("two text encoders, concatenated", "77 × (1280 + 768) = 77 × 2048"),
          ("vector: pooled + micro-conditioning", "1280 + 6 × 256 = 2816 → 1280"),
          ("encoder", "320 · 128² → 640 · 64² → 1280 · 32²"),
          ("bottleneck", "1280 × 32 × 32, 10 transformer blocks"),
          ("output 3×3 conv", "ε̂: 4 × 128 × 128")],
    parts={
        "image x": P("3 × 1024 × 1024 (multi-aspect buckets)", "Training images are bucketed by aspect ratio; the "
                     "bucket size is part of the conditioning."),
        "image": P("3 × 1024 × 1024", "Optionally passed to the refiner, which re-noises it slightly and denoises the "
                   "last noise levels again.", R["sdedit"]),
        "VAE encoder": P("3 × 1024² → 4 × 128 × 128", "Same architecture as SD 1, retrained with a larger batch and "
                         "EMA weights for sharper reconstructions.", R["sdxl"]),
        "VAE decoder": P("4 × 128 × 128 → 3 × 1024 × 1024", "Runs once after sampling."),
        "noisy latent z_t": P("4 × 128 × 128", "ε-prediction with the SD 1 noise schedule."),
        "noise ε̂": P("4 × 128 × 128", ""),
        "mid": P("1280 × 32 × 32", "ResBlock → 10 transformer blocks → ResBlock: the most expensive part of the network."),
        "CLIP ViT-L + OpenCLIP bigG": P("77 × 768 ‖ 77 × 1280 → 77 × 2048",
                                            "Both encoders are frozen; their penultimate hidden layers are concatenated "
                                            "per token and used as keys and values in every cross-attention. Head "
                                            "dimension 64.", R["openclip"], R["clip"]),
        "vector: t + pooled bigG": P("pooled bigG 1280 + 6 numbers × 256 Fourier features = 2816 → MLP → 1280",
                                     "The six micro-conditioning numbers are original height and width, crop top and "
                                     "left, target height and width (`adm_in_channels: 2816` in the released config). "
                                     "The vector is added to the time embedding and so enters every ResBlock.",
                                     R["sdxl"]),
    },
)

# ---------------------------------------------------------------------------------- DiT
DETAILS["dit"] = dict(
    links=[("Paper · arXiv 2212.09748", "https://arxiv.org/abs/2212.09748"),
           ("Code · facebookresearch/DiT", "https://github.com/facebookresearch/DiT"),
           ("Project page", "https://www.wpeebles.com/DiT")],
    overview=[
        "DiT replaces the U-Net with a plain Vision Transformer. The 4 × 32 × 32 latent of a 256² image is cut "
        "into 2 × 2 patches, giving 256 tokens of width 1152 with fixed 2D sin-cos positional embeddings. 28 "
        "identical blocks process the sequence, and a final linear layer maps each token back to a 2 × 2 patch "
        "with 8 channels.",
        "Conditioning is adaptive LayerNorm. The time and class embeddings are summed into one vector c; in "
        "every block an MLP regresses six vectors from c: a shift β and scale γ applied after each of the two "
        "LayerNorms, and a gate α on each residual branch. The gates are zero-initialised (adaLN-Zero), so every "
        "block starts as the identity. In the paper's ablation this beat in-context tokens and cross-attention.",
        "The main result is a scaling law: FID falls steadily with forward-pass GFLOPs, whether the GFLOPs come "
        "from a larger model or smaller patches. DiT-XL/2 reaches FID 2.27 on class-conditional ImageNet 256 "
        "with classifier-free guidance.",
    ],
    flow=[("noisy latent z_t", "4 × 32 × 32"),
          ("patchify p = 2", "256 tokens × 16 values"),
          ("linear + 2D sin-cos pos.", "256 × 1152"),
          ("c = MLP(t) + emb(y)", "1152"),
          ("28 DiT blocks", "256 × 1152"),
          ("adaLN + linear", "256 × (2 · 2 · 8) = 256 × 32"),
          ("unpatchify", "ε̂ and Σ̂: 8 × 32 × 32")],
    parts={
        "noisy latent z_t": P("4 × 32 × 32 (256² image, SD VAE f = 8)",
                              "Same VAE as Stable Diffusion; the diffusion process is the ADM one with learned Σ.",
                              R["ldm"]),
        "patchify, p = 2": P("4 × 32 × 32 → (32/2)² = 256 tokens × (2 · 2 · 4) → linear → 256 × 1152",
                             "Patch size sets the token count: p = 8, 4, 2 give 16, 64, 256 tokens. Halving p "
                             "quadruples the GFLOPs at almost the same parameter count.", R["vit"], R["dit"]),
        "LayerNorm · γ, β": P("256 × 1152, no learned affine",
                              "h ← LN(h) · (1 + γ) + β, with γ, β ∈ ℝ^{1152} regressed from c. Every token gets the "
                              "same modulation: the condition rescales features, it does not add tokens.",
                              R["dit"], R["film"]),
        "multi-head self-attention": P("256 × 1152 → 16 heads × 72 → 256 × 1152",
                                       "Full attention over all 256 patches; no causal mask, no relative positions.",
                                       R["transformer"]),
        "scale α": P("α ∈ ℝ^{1152}, zero at initialisation",
                     "h ← h + α ⊙ sublayer(h). With α = 0 the residual branch is switched off at the start, which made "
                     "large DiTs train stably.", R["dit"]),
        "pointwise MLP": P("1152 → 4608 → 1152, GELU (tanh)", "Applied to each token independently."),
        "LayerNorm · linear · unpatchify": P("256 × 1152 → 256 × 32 → 8 × 32 × 32",
                                             "A final adaLN (shift and scale only) and a zero-initialised linear layer."),
        "noise ε̂ and Σ̂": P("8 × 32 × 32 = 4 for ε̂ + 4 for Σ", "Trained with the Improved-DDPM hybrid loss.",
                            R["iddpm"]),
        "time t": P("t → 256-d sinusoidal → MLP → 1152", ""),
        "class y": P("embedding table 1001 × 1152", "1000 ImageNet classes plus a null class. Labels are dropped 10 % "
                     "of the time so the same network gives the unconditional prediction for classifier-free guidance.",
                     R["cfg"]),
        "MLP → 6 vectors": P("c → SiLU → linear 1152 → 6 × 1152, one per block",
                             "Regresses (γ₁, β₁, α₁) for attention and (γ₂, β₂, α₂) for the MLP. Initialised to zero.",
                             R["dit"]),
    },
)

# ---------------------------------------------------------------------------------- U-ViT
DETAILS["uvit"] = dict(
    links=[("Paper · arXiv 2209.12152", "https://arxiv.org/abs/2209.12152"),
           ("Code · baofff/U-ViT", "https://github.com/baofff/U-ViT")],
    overview=[
        "U-ViT treats everything as a token. The time step, the condition (a class label, or 77 CLIP text "
        "tokens) and the noisy image patches are embedded and concatenated into one sequence, and a ViT "
        "processes it with plain self-attention. There is no adaptive normalisation and no cross-attention.",
        "What survives of the U-Net is the long skip. The blocks are split into a shallow half, one middle "
        "block and a deep half; the output of shallow block i is concatenated with the input of the matching "
        "deep block and projected back to the model width by a linear layer. The paper finds the long skips "
        "essential and the down- and upsampling unnecessary.",
        "After the last block the time and condition tokens are dropped, the patch tokens are put back on the "
        "image grid, and an optional 3 × 3 convolution smooths the patch borders (the ImageNet-256 U-ViT-H/2 "
        "config runs without it). U-ViT-H/2 has 14 + 1 + 14 blocks of width 1152 (29 in Table 2 of the paper); "
        "the drawing shows blocks 1, 2 and 14 of each half.",
    ],
    flow=[("noisy latent x_t", "4 × 32 × 32 (ImageNet 256)"),
          ("patchify p = 2 + linear", "256 × 1152"),
          ("[t ; c ; patches] + learned pos.", "258 × 1152"),
          ("14 in-blocks · mid · 14 out-blocks", "258 × 1152"),
          ("drop t, c · linear", "256 × 16"),
          ("unpatchify (· 3×3 conv, optional)", "ε̂: 4 × 32 × 32")],
    parts={
        "time t": P("t → sinusoidal → 1 token × 1152", "A token like any other; attention decides how much each patch "
                    "reads from it."),
        "condition c": P("class: 1 token · text: 77 CLIP tokens", "Class-conditional ImageNet uses one label token; "
                         "text-to-image on MS-COCO uses the 77 CLIP ViT-L/14 token features, projected to the width.",
                         R["clip"]),
        "noisy patches x_t": P("pixels (CIFAR-10, CelebA) or a 4 × 32 × 32 SD latent", "Works in either space; the "
                               "headline ImageNet numbers are in latent space."),
        "linear embed + pos. embed": P("258 × 1152", "Learned positional embedding over the whole sequence.", R["vit"]),
        "in-block": P("258 × 1152 → 258 × 1152",
                      "Pre-norm transformer block: LN → self-attention (16 heads) → LN → MLP (4608). Its output is kept "
                      "for the long skip.", R["transformer"]),
        "mid-block": P("258 × 1152", "The one block without a skip partner."),
        "out-block": P("concat(h, skip) 258 × 2304 → linear → 1152 → transformer block",
                       "The long skip from the matching in-block is concatenated per token and projected back before "
                       "the block runs.", R["uvit"]),
        "linear · unpatchify": P("256 × 1152 → 256 × 16 → 4 × 32 × 32",
                                 "An optional 3 × 3 convolution after unpatchify removes visible patch borders. The "
                                 "ablation favours it on CIFAR-10, but the ImageNet-256 headline model (FID 2.29) is "
                                 "trained without it (`conv=False`).", R["uvit"]),
        "noise ε̂": P("4 × 32 × 32", "ε-prediction; sampled with DPM-Solver in 50 steps."),
    },
)

# ---------------------------------------------------------------------------------- SD3
_MM_ATTN = ("Q, K, V of both streams are concatenated along the sequence; one softmax runs over all tokens, so "
            "image tokens attend to text and text tokens to the image. The outputs are split back by stream.")
DETAILS["sd3"] = dict(
    links=[("Paper · arXiv 2403.03206", "https://arxiv.org/abs/2403.03206"),
           ("Code · Stability-AI/sd3.5 (reference)", "https://github.com/Stability-AI/sd3.5"),
           ("Weights · stable-diffusion-3-medium", "https://huggingface.co/stabilityai/stable-diffusion-3-medium")],
    overview=[
        "SD3 trains a rectified flow: x_t = (1 − t) x_0 + t ε on a straight path from data (t = 0) to noise "
        "(t = 1), and the network predicts the velocity v = ε − x_0. Training times are drawn from a logit-normal "
        "distribution, which concentrates training on the middle of the path, where the prediction is hardest.",
        "The backbone, MMDiT, keeps two token streams, text and image, each with its own QKV projections, MLPs "
        "and adaLN modulation. Inside every block the queries, keys and values of both streams are concatenated "
        "and a single attention runs over the joint sequence. A model of depth d has width 64 · d and d heads: "
        "SD3 Medium has d = 24 (2 B parameters), the largest model d = 38 (8 B).",
        "Text conditioning uses three frozen encoders: CLIP-L and OpenCLIP bigG token features (77 tokens, "
        "zero-padded to 4096 channels) and T5-XXL (77 tokens), 154 tokens in all. The pooled CLIP vectors join "
        "the time embedding in a global vector y that drives the modulation of both streams. RMSNorm on Q and K "
        "keeps the attention logits bounded at large scale.",
    ],
    flow=[("image 1024² → VAE", "x_0: 16 × 128 × 128"),
          ("patchify p = 2 + linear", "4096 × 1536 (d = 24)"),
          ("CLIP-L ‖ bigG ‖ T5 → linear", "154 × 1536"),
          ("y = MLP(t) + MLP(pooled 2048)", "1536"),
          ("24 MMDiT blocks", "(154 + 4096) × 1536"),
          ("image stream: adaLN + linear", "4096 × 64"),
          ("unpatchify", "v̂: 16 × 128 × 128")],
    parts={
        "text tokens": P("77 CLIP (768 ‖ 1280, zero-padded) + 77 T5-XXL × 4096 = 154 × 4096",
                         "T5 can be dropped at inference for lower memory at some cost in text rendering.",
                         R["clip"], R["openclip"], R["t5"]),
        "noisy latent x_t": P("16 × 128 × 128 for 1024²", "A 16-channel VAE (instead of 4) preserves more detail and "
                              "pays off once the model is large.", R["mmdit"]),
        "linear": P("154 × 4096 → 154 × 1536", "Projects the text features to the model width."),
        "patchify + pos. embed": P("16 × 128² → 4096 tokens × 64 → 4096 × 1536",
                                   "2D positional embedding, cropped to the image size for multi-aspect training."),
        "adaLN modulation": P("y → SiLU → linear → 6 × 1536, separate for each stream",
                              "Shift, scale and gate for the attention and MLP sub-layers, as in DiT, but with different "
                              "weights for text and image tokens.", R["dit"]),
        "Q K V · text weights": P("154 × 1536 → Q, K, V each 154 × 24 heads × 64",
                                  "RMSNorm on Q and K per head.", R["qknorm"]),
        "Q K V · image weights": P("4096 × 1536 → Q, K, V each 4096 × 24 heads × 64", "RMSNorm on Q and K per head.",
                                   R["qknorm"]),
        "joint attention": P("4250 queries × 4250 keys × 24 heads", _MM_ATTN, R["mmdit"]),
        "out proj · gate ⊕": P("per stream: 1536 → 1536, × gate, + residual", ""),
        "MLP · gate ⊕": P("per stream: 1536 → 6144 → 1536, GELU, × gate, + residual", ""),
        "vector y": P("pooled CLIP-L 768 + bigG 1280 = 2048 → MLP · t → 256-d sinusoidal → MLP · summed → 1536",
                      "The only global conditioning; it reaches every block through adaLN."),
        "adaLN · linear · unpatchify": P("4096 × 1536 → 4096 × 64 → 16 × 128 × 128", "Text tokens are discarded."),
        "velocity v̂": P("16 × 128 × 128", "v = ε − x_0. Sampled with 28 Euler steps on the ODE dx/dt = v̂ from t = 1 "
                        "to t = 0, with a resolution-dependent time shift.", R["rf"], R["fm"]),
    },
)

# ---------------------------------------------------------------------------------- FLUX
DETAILS["flux"] = dict(
    links=[("FLUX.1 Kontext paper · arXiv 2506.15742", "https://arxiv.org/abs/2506.15742"),
           ("Code · black-forest-labs/flux", "https://github.com/black-forest-labs/flux"),
           ("Weights · FLUX.1-dev", "https://huggingface.co/black-forest-labs/FLUX.1-dev")],
    overview=[
        "FLUX.1 extends MMDiT into a hybrid stack: 19 double-stream blocks, in which text and image tokens keep "
        "separate weights as in SD3, then 38 single-stream blocks that process the concatenated sequence with "
        "shared weights. A single-stream block runs attention and the MLP in parallel from one fused input "
        "projection, as in ViT-22B.",
        "Width is 3072 with 24 heads of 128 channels. Positions are rotary: every token carries a 3-axis index "
        "(the latent row and column for image tokens, zeros for text; the first axis separates reference images "
        "in Kontext), and RoPE rotates Q and K by it, so no positional embedding is added to the tokens. The "
        "16-channel latent is packed in 2 × 2 patches into 64-channel tokens; a 1024² image gives 4096 tokens.",
        "T5-XXL tokens (up to 512) form the text stream. The pooled CLIP-L vector, the time and, in FLUX.1 [dev], "
        "the guidance scale are embedded and summed into the vector that drives every adaLN. [dev] is "
        "guidance-distilled, so one forward pass replaces the two of classifier-free guidance; [schnell] is "
        "step-distilled to 1–4 steps.",
    ],
    flow=[("image 1024² → VAE", "16 × 128 × 128"),
          ("pack 2 × 2 → linear", "4096 × 64 → 4096 × 3072"),
          ("T5-XXL → linear", "512 × 4096 → 512 × 3072"),
          ("vector: CLIP + t + g", "3072"),
          ("19 double-stream blocks", "512 + 4096 tokens × 3072"),
          ("38 single-stream blocks", "4608 × 3072"),
          ("image tokens: adaLN + linear", "4096 × 64"),
          ("unpack", "v̂: 16 × 128 × 128")],
    parts={
        "text tokens": P("T5-XXL: up to 512 × 4096 ([dev]), 256 ([schnell])", "Only T5 tokens enter the sequence; CLIP "
                         "contributes only its pooled vector.", R["t5"]),
        "noisy latent x_t": P("16 × 128 × 128 → 2 × 2 packing → 4096 × 64", "Packing replaces a patchify convolution."),
        "linear → 3072": P("text 4096 → 3072 · image 64 → 3072", "One linear layer per stream."),
        "adaLN modulation": P("vector → SiLU → linear → 6 × 3072 per stream", "", R["dit"]),
        "Q K V · text weights": P("512 × 3072 → 24 heads × 128, RMSNorm on Q, K", "", R["qknorm"]),
        "Q K V · image weights": P("4096 × 3072 → 24 heads × 128, RMSNorm on Q, K", "", R["qknorm"]),
        "joint attention": P("4608 × 4608 × 24 heads; RoPE on Q, K (axes 16 + 56 + 56 = 128)", _MM_ATTN,
                             R["mmdit"], R["rope"]),
        "out proj · gate ⊕": P("per stream: 3072 → 3072, gated residual", ""),
        "MLP · gate ⊕": P("per stream: 3072 → 12288 → 3072, GELU (tanh)", ""),
        "concat": P("[text ; image] 4608 × 3072", "From here on both kinds of token share weights."),
        "adaLN single": P("vector → linear → 3 × 3072", "Shift, scale and a single gate: the attention and MLP branches "
                          "are added to the residual together."),
        "attention": P("fused linear 3072 → 3 · 3072 (QKV) + 12288 (MLP in)", "Attention over the full 4608-token "
                       "sequence, with RoPE.", R["rope"], R["qknorm"]),
        "MLP": P("12288, GELU (tanh)", "Reads the same normalised input as attention, in parallel rather than after "
                 "it.", R["qknorm"]),
        "linear (fused) · gate ⊕": P("concat(attn 3072, MLP 12288) → 3072", "One output projection for both branches."),
        "image tokens → linear": P("4096 × 3072 → adaLN → 4096 × 64", "Text tokens are dropped."),
        "velocity v̂": P("4096 × 64 → unpack → 16 × 128 × 128", "Rectified-flow velocity, Euler steps with a time "
                        "shift that grows with the image size.", R["rf"]),
        "vector": P("CLIP-L pooled 768 → MLP · t → 256 → MLP · g → 256 → MLP · summed → 3072",
                    "g is the guidance strength that [dev] was distilled to accept.", R["guidedistill"], R["clip"]),
    },
)

# ---------------------------------------------------------------------------------- RFdiffusion
DETAILS["rfdiffusion"] = dict(
    links=[("Paper · Nature 2023", "https://www.nature.com/articles/s41586-023-06415-8"),
           ("Code · RosettaCommons/RFdiffusion", "https://github.com/RosettaCommons/RFdiffusion"),
           ("RoseTTAFold · Science 2021", "https://doi.org/10.1126/science.abj8754")],
    overview=[
        "RFdiffusion fine-tunes RoseTTAFold, a protein structure predictor, into a denoiser of protein "
        "backbones. The state is one rigid frame per residue, a Cα position and a rotation; translations are "
        "noised with a Gaussian and rotations with the isotropic Gaussian on SO(3), IGSO(3).",
        "The network keeps RoseTTAFold's three tracks: 1D per-residue features, 2D pair features, and 3D "
        "coordinates updated by an SE(3)-equivariant transformer, with the tracks exchanging information in "
        "every block. It predicts the clean structure x̂_0, not the noise, and the next state interpolates "
        "toward that prediction. Its previous x̂_0 is fed back as a template input (self-conditioning).",
        "Conditioning reuses the predictor's inputs: fixed motif residues for scaffolding, hotspot flags for "
        "binder design, and symmetry by symmetrising the noise and the updates. Designs are then given "
        "sequences with ProteinMPNN and filtered by AlphaFold 2.",
    ],
    flow=[("noised frames x_t", "L residues × (Cα ∈ ℝ³, R ∈ SO(3))"),
          ("1D track", "L × d_{1D}"),
          ("2D track", "L × L × d_{2D}"),
          ("3D track", "L frames"),
          ("prediction", "x̂_0: L frames"),
          ("update", "x_{t−1} from x_t and x̂_0")],
    parts={
        "noised residue frames x_t": P("L × (3 + 3 × 3): Cα translation and rotation per residue",
                                       "Sequence is masked; the model generates backbone geometry only. x_t enters the "
                                       "3D track as coordinates; the time step is a per-residue 1D feature, 1 − t/T "
                                       "(1 for fixed motif residues).",
                                       R["framediff"], R["rfdiff"]),
        "motif · hotspots": P("fixed residues · per-residue hotspot flags · symmetry group",
                              "Motif residues are kept at their true coordinates and are not noised; hotspots mark "
                              "target residues the binder should contact.", R["rfdiff"]),
        "previous x̂₀": P("L frames, used as a template", "Self-conditioning: the last prediction enters the next step "
                         "through the template features (as a distogram and anglegram). Supplied on half of the "
                         "training examples; Extended Data Fig. 1e shows it raises the in silico success rate.",
                         R["selfcond"], R["rfdiff"]),
        "MSA attention": P("1 × L × 256 (the single masked sequence)", "Row and column attention in the 1D track, biased "
                           "by the pair features and the current 3D structure.", R["rf2"]),
        "transition": P("per residue MLP", ""),
        "pair update": P("L × L × 128", "Updates pair features from the 1D track (outer products) and from current "
                         "3D distances.", R["rf2"]),
        "biaxial attention": P("L × L × 128", "Tied, gated row- and column-wise attention on the pair map, with "
                               "projected Cα–Cα distances of the current structure as bias (Supplementary Methods 1.2).",
                               R["rf2"]),
        "structure refinement": P("L frames · 4 blocks", "Four final SE(3)-transformer layers that refine the "
                                  "coordinates from the 1D and 2D features (Supplementary Methods 1.2.5).", R["se3t"]),
        "SE(3)-transformer": P("L nodes, edges from the pair track", "Equivariant attention on the residue graph; "
                               "rotating the input rotates the output.", R["se3t"]),
        "frame update": P("L × (Δt, ΔR)", "Applies the predicted rigid updates to each frame."),
        "predicted x̂₀": P("L frames",
                          "Loss: an unaligned frame MSE on Cα positions and rotations (deliberately not FAPE, so the "
                          "global frame stays continuous between steps) plus a distogram term. The next state takes "
                          "a Gaussian step toward x̂_0 for translations and a geodesic step on SO(3) for rotations. "
                          "The paper samples with T = 200; the released config defaults to 50, and 15 steps already "
                          "give over 60 % in silico success for a 100-residue design.", R["rfdiff"], R["framediff"]),
    },
)

# ---------------------------------------------------------------------------------- AF3 family
_AF3_PARTS = {
    "input": P("tokens: one per residue / nucleotide, one per ligand atom · atoms with reference conformers",
               "Proteins, nucleic acids, ligands (SMILES or CCD), ions and modifications are all tokenised. Every "
               "atom gets a reference conformer from RDKit.", R["af3"]),
    "emb": P("atom single 128 · atom pair 16 → s^{inputs}: N_{tok} × 449 → s: N_{tok} × 384, z: N_{tok}² × 128",
             "A small atom transformer aggregates atoms to tokens; z starts as an outer sum of s plus relative-position "
             "and bond features.", R["af3"]),
    "tmpl": P("N_{tok}² × 64, 2 blocks", "Template structures are embedded as pair features and averaged into z.",
              R["af3"]),
    "msa": P("MSA N_{seq} × N_{tok} × 64 → z", "Outer-product mean from the MSA into z, pair-weighted averaging back, "
             "triangle updates on z. 4 blocks; replaces AF2's Evoformer MSA stack.", R["af3"], R["af2"]),
    "pf": P("s: N_{tok} × 384 · z: N_{tok} × N_{tok} × 128",
            "Per block: triangle multiplication (outgoing, incoming), triangle attention (start, end node), pair "
            "transition, single attention with pair bias, single transition. The MSA is gone from the trunk; only s "
            "and z are carried.", R["af3"], R["af2"], R["illaf"]),
    "c": P("s_i^{trunk}: N_{tok} × 384 · z_{ij}^{trunk}: N_{tok}² × 128",
           "Everything the denoiser knows about the target. It is computed once and reused for every step and every "
           "sample.", R["af3"]),
    "noise": P("N_{atom} × 3, σ_0 = 160 σ_{data} = 2560 Å",
               "Karras ρ-schedule with ρ = 7, s_{max} = 160, s_{min} = 4 · 10^{−4}, σ_{data} = 16 Å.", R["edm"]),
    "cond": P("z: concat(z^{trunk}, rel. pos.) → 128 · s: concat(s^{trunk}, s^{inputs}) → 384 + Fourier(¼ log(σ / σ_{data}))",
              "Two transitions each on s and z. This is where the noise level enters the network.", R["af3"], R["edm"]),
    "aenc": P("atoms: 128 ch, pairs 16 ch · 3 blocks · 4 heads · windows of 32 queries × 128 keys → tokens 768",
              "Local attention over atoms near each other in the token order, then a mean over each token's atoms.",
              R["af3"]),
    "tok": P("N_{tok} × 768 · 24 blocks × 16 heads · pair bias from z (128 → 16) · AdaLN(s)",
             "Global attention over tokens. AdaLN conditions on s, every attention logit gets a learned bias from z.",
             R["af3"], R["dit"]),
    "adec": P("tokens 768 → broadcast to atoms 128 · 3 blocks → Δx: N_{atom} × 3",
              "Atom-level attention again, then a linear layer to coordinate updates F_θ.", R["af3"]),
    "xhat": P("N_{atom} × 3", "x̂ = c_{skip}(σ) x + c_{out}(σ) F_θ, EDM preconditioning. The sampler takes 200 Euler "
              "steps with churn γ_0 = 0.8, noise scale λ = 1.003 and step scale η = 1.5, and no alignment between "
              "steps.", R["edm"], R["af3"]),
    "conf": P("4 Pairformer blocks on s, z and the predicted x̂", "Heads for pLDDT (50 bins, per atom), PAE (64 bins), "
              "PDE and experimentally-resolved. Trained on a short mini-rollout of the sampler.", R["af3"]),
    "out": P("S samples, ranked", "Ranking combines pTM / ipTM with clash and disorder penalties."),
}


def _cofold_details(overrides, links, overview, flow):
    parts = dict(_AF3_PARTS)
    for k, v in overrides.items():  # empty fields keep the AF3 text
        base = parts.get(k, P("", ""))
        parts[k] = dict(dims=v["dims"] or base["dims"], text=v["text"] or base["text"],
                        refs=v["refs"] or base["refs"])
    return dict(links=links, overview=overview, flow=flow, parts=parts, inherited=set(_AF3_PARTS))


_COFOLD_FLOW = [("tokens", "N_{tok}; atoms N_{atom}"),
                ("input embedder", "s^{inputs}: N_{tok} × 449"),
                ("trunk", "s: N_{tok} × 384 · z: N_{tok}² × 128"),
                ("noise", "x: N_{atom} × 3"),
                ("atom encoder", "N_{atom} × 128 → N_{tok} × 768"),
                ("token transformer", "N_{tok} × 768"),
                ("atom decoder", "→ N_{atom} × 3")]

DETAILS["af3"] = _cofold_details(
    {}, [("Paper · Nature 2024", "https://www.nature.com/articles/s41586-024-07487-w"),
         ("Code · google-deepmind/alphafold3", "https://github.com/google-deepmind/alphafold3"),
         ("The Illustrated AlphaFold", "https://elanapearl.github.io/blog/2024/the-illustrated-alphafold/")],
    ["AlphaFold 3 predicts the joint structure of proteins, nucleic acids, ligands and ions. It keeps AlphaFold "
     "2's split into an expensive trunk and a structure head, but the head is now a diffusion model over all "
     "atom coordinates instead of AF2's equivariant structure module.",
     "The trunk runs once per target: an input embedder, a template module, a 4-block MSA module and the "
     "48-block Pairformer, recycled several times. Its outputs, a single representation s_i and a pair "
     "representation z_{ij}, are the condition c. The denoiser D_θ(x, σ | c) is an atom encoder, a 24-block "
     "token transformer and an atom decoder, conditioned through AdaLN on s and an attention bias from z.",
     "Sampling is EDM's stochastic sampler with Euler steps (SI Algorithm 18): 200 steps, churn γ_0 = 0.8, "
     "λ = 1.003, η = 1.5. Because the trunk is shared, S samples cost S × 200 denoiser calls but only one trunk "
     "pass. Training runs 48 noise levels per trunk pass for the same reason."],
    _COFOLD_FLOW)

DETAILS["boltz2"] = _cofold_details(
    {"input": P("sequences, ligands + method, pocket and contact constraints, templates",
                "Method conditioning (X-ray, NMR, MD, …) lets the user ask for a structure in the style of one "
                "experimental technique.", R["boltz2"]),
     "tmpl": P("N_{tok}² × 64, 2 blocks", "Templates can be supplied by the user and optionally enforced during "
               "sampling (template steering).", R["boltz2"]),
     "msa": P("4 blocks · 3 M parameters", "", R["boltz1"]),
     "pf": P("64 blocks · 197 M parameters", "Sixteen blocks deeper than AF3.", R["boltz2"]),
     "cond": P("all per-layer pair biases precomputed once per target",
               "The 24 layers' pair-bias projections of z are computed once and cached, so a denoising step only "
               "touches s, x and the atom features.", R["boltz2"]),
     "tok": P("24 × 16 heads × 768 · AdaLN on a 768-channel s · 283 M (checkpoint)",
              "Larger than the token transformers of OpenFold3 and Protenix (198 M). Counted in the released code, the "
              "768-wide single conditioning in every AdaLN and gate adds 42 M (226.6 M with a 384-wide s), and the "
              "transition's SwiGLU gate projects to 2 × 1536 before a separate 768 → 1536 value projection, one more "
              "matrix per block than Algorithm 25 (28 M). That gives 269 M; the remaining 14 M of the checkpoint "
              "count are unexplained.", R["boltz1"]),
     "conf": P("8 Pairformer blocks · 25 M + affinity module",
               "The affinity module runs a Pairformer on the pocket and predicts binder probability and log IC50.",
               R["boltz2"]),
     "xhat": P("N_{atom} × 3", "200 steps. Before every Euler step the noisy x is Kabsch-aligned onto the "
               "prediction x̂ (Boltz-1 and Boltz-2 only, besides ESMFold2). Optional steering potentials (clashes, "
               "chirality, planarity, bonds) push each step toward physical validity.", R["boltz2"])},
    [("Paper · bioRxiv 2025", "https://doi.org/10.1101/2025.06.14.659707"),
     ("Code · jwohlwend/boltz", "https://github.com/jwohlwend/boltz"),
     ("Boltz-1 · bioRxiv 2024", "https://doi.org/10.1101/2024.11.19.624167")],
    ["Boltz-2 keeps the AlphaFold 3 layout and the Boltz-1 denoiser, with a 64-block Pairformer, 4 trunk "
     "passes (3 recycles), and 200 sampling steps. It is the first open model in this family with a binding "
     "affinity head.",
     "Its additions are controls: method conditioning, user templates with optional steering, pocket and "
     "contact constraints, and physics-based steering potentials applied during sampling. The denoiser's "
     "per-layer pair biases are computed once per target and cached across steps.",
     "Numbers on this card were read from the released checkpoint (Boltz 2.2.1)."],
    _COFOLD_FLOW)

DETAILS["openfold3"] = _cofold_details(
    {"pf": P("48 blocks · 147 M parameters", "", R["af3"]),
     "msa": P("4 blocks · 3 M parameters", "", R["af3"]),
     "cond": P("recomputed at every denoiser call", "Unlike Boltz-2 and Protenix nothing is cached across steps. A "
               "`use_conditioning` flag can switch the trunk input off entirely."),
     "tok": P("24 × 16 heads × 768 · 198 M", "Adds a residual connection around each block, with the code comment "
              "'differs from SI'.", R["af3"]),
     "conf": P("4 Pairformer blocks · 13 M", "", R["af3"])},
    [("Code · aqlaboratory/openfold-3", "https://github.com/aqlaboratory/openfold-3"),
     ("OpenFold consortium", "https://openfold.io")],
    ["OpenFold3 is the OpenFold consortium's open reproduction of AlphaFold 3, trained from scratch and "
     "released under a permissive licence. Widths, depths and the sampler follow the AF3 supplementary "
     "information.",
     "The main deviation is in the token transformer: the code adds the residual connection that the SI's "
     "pseudocode omits. Numbers on this card were read from the released checkpoint (OpenFold3 0.4.3)."],
    _COFOLD_FLOW)

DETAILS["protenix"] = _cofold_details(
    {"pf": P("48 blocks · 147 M parameters", "", R["protenix"]),
     "msa": P("4 blocks · 3 M parameters", "", R["protenix"]),
     "cond": P("pair and atom conditioning cached across steps", "Computed once per target, as in Boltz-2.",
               R["protenix"]),
     "tok": P("24 × 16 heads × 768 · 198 M", "Residual added; the report notes training did not converge without it.",
              R["protenix"]),
     "conf": P("4 Pairformer blocks · 13 M", "", R["protenix"])},
    [("Technical report · bioRxiv 2025", "https://doi.org/10.1101/2025.01.08.631967"),
     ("Code · bytedance/Protenix", "https://github.com/bytedance/Protenix"),
     ("Protenix-Mini+ · arXiv 2510.12842", "https://arxiv.org/abs/2510.12842")],
    ["Protenix is ByteDance's PyTorch reproduction of AlphaFold 3, tuned for training and inference "
     "throughput: fused kernels, chunked sampling, and conditioning cached across denoising steps. It runs 10 "
     "trunk passes by default.",
     "Like OpenFold3 it adds a residual connection in the token transformer. Numbers on this card were read "
     "from the released checkpoint (Protenix 1.1.0)."],
    _COFOLD_FLOW)

DETAILS["esmfold2"] = _cofold_details(
    {"lm": P("ESM C, 6 B parameters → per-residue embeddings", "The language model replaces the MSA search and the "
             "MSA module; an MSA can still be supplied."),
     "pair": P("48 pair folding layers · z: N_{tok}² × 256", "Triangle multiplication and transitions only (no triangle attention, no single track), run as a contractive recurrence: 1–6 loops in training, 10 in the paper's benchmarks, instead of recycling."),
     "msa": P("optional · 4 layers · d_{msa} = 128 · 8 heads", "No triangle attention; up to 1024 rows, "
              "resubsampled at every loop. ESMFold2-Fast drops it; without an MSA the model runs on the language model "
              "alone."),
     "c": P("s^{inputs}: N_{tok} × 451 · z_{ij}: N_{tok}² × 256",
            "There is no trunk single representation: the denoiser's single conditioning comes from the input "
            "features alone, and only the pair stack's z carries what the trunk computed."),
     "cond": P("s ⊕ Fourier(σ) → 768 · z cached · 8.5 M", "Conditioning width is 768, twice AF3's 384."),
     "aenc": P("sliding window of 128 atoms · FlashAttention · 3D RoPE from the reference conformer · 1.0 M",
               "Replaces AF3's 32 × 128 blocks with a sliding window and rotary positions from the conformer.",
               R["flash"], R["rope"]),
     "tok": P("12 blocks × 16 heads × 768 · 120 M", "Half the depth of AF3's token transformer; 92 % of the denoiser's "
              "131 M parameters."),
     "adec": P("3 blocks · RoPE · 0.9 M", ""),
     "xhat": P("N_{atom} × 3", "The paper's schedule drops every level above σ = 256 Å, leaving 68 of 100 steps; the "
               "released config runs 10. The noisy x is Kabsch-aligned onto x̂ before every Euler step.")},
    [],
    ["ESMFold2 replaces the MSA-based trunk with the 6 B-parameter ESM C language model and a looped pair "
     "stack, and shrinks the denoiser: 12 token-transformer blocks, sliding-window atom attention with 3D RoPE, "
     "and no trunk single representation. It samples in 10–68 steps.",
     "Parameter counts were read from the checkpoint: 131.5 M for the denoiser, of which the token transformer "
     "is 120.4 M."],
    [("tokens", "N_{tok}; atoms N_{atom}"),
     ("ESM C", "N_{tok} × d_{LM}"),
     ("pair stack", "z: N_{tok}² × 256"),
     ("atom encoder", "N_{atom} → N_{tok} × 768"),
     ("token transformer", "12 blocks, N_{tok} × 768"),
     ("atom decoder", "→ N_{atom} × 3")])

DETAILS["rfd3"] = _cofold_details(
    {"input": P("design conditions: motif atoms, ligands, length, symmetry",
                "The input is not a sequence. Motifs are given as atoms, without having to say which sequence "
                "positions will carry them; the coordinates of the motif or binding partner are placed inside the "
                "developing noise cloud so the network refines the structure in the motif's context.", R["rfd3"]),
     "atomise": P("protein: 4 backbone + 10 sidechain atoms · RNA 12 + 11, DNA 11 + 11 · at most 23",
                  "Side chains and bases have to be representable before the sequence is known, so every residue "
                  "gets the atom count of the largest member of its class — tryptophan's 10 sidechain atoms, the "
                  "11 atoms of the largest base — and virtual atoms on the Cβ pad the rest. Isosteric pairs such "
                  "as Cys/Ser and the bases C and U are given distinct virtual atom indices, so the model can tell "
                  "them apart despite identical bonded geometry.", R["rfd3"], R["pallatom"]),
     "emb": P("atomic and residue-level features of the partially noised structure",
              "Lighter than AF3's: no MSA search, no templates, no sequence.", R["rfd3"]),
     "pf": P("2 layers · no triangle multiplicative or triangle attention updates",
             "AF3 spends most of its trunk compute extracting distance information from a sequence. For design "
             "the input is already a set of high-level conditions, so the paper shrinks the Pairformer from 48 "
             "layers to 2 and drops the triangle updates used throughout prior design and prediction networks. "
             "The whole network comes to 168 M trainable parameters against about 350 M for AF3, and RFD3 is an "
             "order of magnitude faster than earlier design diffusion models.", R["rfd3"], R["af3"]),
     "c": P("conditioning features for the diffusion module",
            "Most of the compute is now spent in the denoiser rather than in the trunk.", R["rfd3"]),
     "noise": P("N_{atom} × 3", "Training noises protein and nucleic acid structures to different extents and "
                "predicts backbone and sidechain positions.", R["rfd3"]),
     "cond": P("conditioning features ⊕ Fourier(σ) · classifier-free guidance scale γ_{CFG}",
               "Two conditioning routes. The hard one is geometric: motif and partner atoms are present in the "
               "noise cloud itself. The soft one is classifier-free guidance, which the paper reports improves "
               "adherence to the conditioning information — at a price, see the sampler.", R["rfd3"], R["cfg"]),
     "aenc": P("sparse attention between atom and token features · cross-attention down-pooling",
               "Only residues and atoms that are geometrically close in the noise attend to each other. These "
               "distance-based keys push the network toward local interactions, help prevent overfitting and "
               "mitigate the artifacts seen with cropping. Pooling atoms into tokens is a cross-attention: each "
               "atom's features are weighted before they are pooled, so the token-level transformer can focus on "
               "specific atoms within a token — the mechanism comes from the Byte Latent Transformer.",
               R["rfd3"], R["blt"]),
     "tok": P("sparse attention over token features",
              "The middle of a transformer U-Net, where the coarse-grained token representation is processed.",
              R["rfd3"], R["unet"]),
     "adec": P("token features modulate atom features → coordinate update",
               "Token features are read back out by cross-attention with token splitting, then modulate the atom "
               "features to predict coordinate updates.", R["rfd3"]),
     "xhat": P("N_{atom} × 3, backbone and sidechain", "Fig. 1A shows a 100-step trajectory (t = 100, 50, 40, 20, "
               "0). Recycling is introduced at every diffusion step, which buys inference compute without adding "
               "parameters. Two inference-time settings trade conditioning adherence against diversity: raising "
               "γ_{CFG} raises the weighted secondary-structure F1 of a design against its target while lowering "
               "codesignability (Fig. 2D), and the step scale sets the sampling temperature (fig. S1C).",
               R["rfd3"], R["cfg"]),
     "out": P("designs, then sequence assignment",
              "Protein designs get sequences from ProteinMPNN, or LigandMPNN where non-protein atoms are present, "
              "and are filtered by structure prediction with AF3 or RF3. RNA is the exception: the sequences the "
              "model codesigns are foldable and are used directly.", R["rfd3"], R["mpnn"])},
    [("Paper · Science 2026", "https://doi.org/10.1126/science.aeh2982"),
     ("Code · RosettaCommons/foundry", "https://github.com/RosettaCommons/foundry"),
     ("AtomWorks and RF3 · bioRxiv 2025", "https://doi.org/10.1101/2025.08.14.670328"),
     ("Enzyme design pipelines", "https://github.com/baker-laboratory/Metallohydrolase_Enzyme_Design")],
    ["RFdiffusion3 designs proteins, RNA and DNA by diffusing free atoms rather than residue frames. Because "
     "every residue carries a fixed atom budget — 4 backbone and 10 sidechain atoms, padded with virtual atoms "
     "— an atomic motif can be specified without saying which sequence positions will carry it, which is what "
     "RFdiffusion2's frame representation made awkward.",
     "Architecturally it is the AlphaFold 3 diffusion module with the trunk removed. The reasoning is that "
     "design conditions are not a sequence: there is no evolutionary signal to extract, so the Pairformer goes "
     "from 48 layers to 2, the triangle updates go altogether, and the network lands at 168 M parameters "
     "against roughly 350 M for AF3. The denoiser itself is a transformer U-Net — distance-gated sparse "
     "attention, cross-attention pooling between atoms and tokens, coordinate updates on the way back up — and "
     "recycling now happens at every diffusion step instead of in the trunk.",
     "Conditioning comes in geometrically, with motif atoms placed in the noise cloud, and through "
     "classifier-free guidance. Fig. 2D is the trade-off drawn explicitly: as γ_{CFG} rises, adherence to the "
     "target secondary structure rises and codesignability falls. The step scale tunes diversity against "
     "designability the same way.",
     "Experimentally the paper reports zero-shot 96-construct campaigns giving active de novo "
     "phosphotriesterases with a carbamylated-lysine, two-metal active site, and zinc proteases against "
     "transthyretin."],
    [("design conditions", "motif atoms, ligands, length"),
     ("atomisation", "N_{res} × 14 atoms (23 with NA)"),
     ("conditioning trunk", "2 Pairformer layers"),
     ("noise", "x: N_{atom} × 3"),
     ("downsample", "atoms → tokens, sparse + cross-attention"),
     ("token transformer", "sparse attention over tokens"),
     ("upsample", "→ Δx: N_{atom} × 3")])

# ------------------------------------------------------------------------------------ BioEmu
DETAILS["bioemu"] = _cofold_details(
    {"input": P("one protein chain, 20 standard amino acids",
                "No ligands, no nucleic acids, no complexes. The model returns a distribution over backbone "
                "conformations of this one sequence, p_θ(x | S).", R["bioemu"]),
     "msasearch": P("MMseqs2 through the ColabFold server, default parameters",
                    "The MSA only feeds AlphaFold 2 below; BioEmu never sees it directly.",
                    R["colabfold"], R["bioemu"]),
     "evo": P("s: N_{res} × 384 · z: N_{res} × N_{res} × 128",
              "The Evoformer of pretrained AlphaFold 2 (model 3), with templates excluded and recycling "
              "disabled, run once with seed 0. Its weights are frozen throughout training; the single and pair "
              "embeddings 'for all proteins used in training and inference are pre-computed once and stored'. "
              "The supplement also trains an end-to-end replacement (4 MSA blocks and 48 Pairformer layers) and "
              "finds 'no strong justification to replace the AlphaFold2 evoformer embeddings'.",
              R["bioemu"], R["af2"]),
     "c": P("s_i: N_{res} × 384 · z_{ij}: N_{res}² × 128, from AF2",
            "The whole condition. Every diffusion step and every one of the typically 10⁴ samples reuse it, "
            "which is why sampling is cheap.", R["bioemu"]),
     "noise": P("N_{res} × (Cα ∈ ℝ³, Q ∈ SO(3)) at t = 1",
                "Positions follow a variance-preserving SDE with the cosine schedule of improved DDPM (s = 0.008), "
                "so the prior is a standard Gaussian. Orientations follow a geometric IGSO(3) schedule from "
                "σ = 0.02 to 2.33; the prior is uniform on SO(3). The two are noised independently per residue.",
                R["bioemu"], R["iddpm"], R["rsgm"], R["framediff"]),
     "cond": P("s: LayerNorm → Linear 384 → 512, + sinusoidal(t) · z: LayerNorm → Linear 128 → 256, + embedding "
               "of 64 relative-position buckets",
               "Algorithm 1, lines 1–2. The time step is added to the single features, the only place it enters. "
               "Relative positions use DiG's log-spaced buckets (exact within ±16, coarser out to 128), not AF2's "
               "clipped one-hot.", R["bioemu"], R["dig"]),
     "ipa": P("8 layers × 32 heads · width 512 · pair 256 · GELU MLP 512 → 1024 → 512",
              "Each layer: h += Dropout(IPA(LayerNorm(h), z, r, Q)), then a GELU MLP, pre-norm with residuals. "
              "The IPA follows AF2 Algorithm 22 with 4 query and 8 value points per head, plus a learned "
              "projection of z for the pair values, which AF2 does not have. Unlike AF2's structure module the "
              "frames are not updated between layers: all eight attend in the frames of the noisy input x_t. "
              "Attention holds 22.1 M of the 31.3 M parameters.", R["bioemu"], R["af2"], R["dig"]),
     "heads": P("two MLPs 512 → 512 → 3",
                "One head returns a translation, one a rotation in axis-angle form, both in the residue's own "
                "frame and therefore invariant to a global rotation. The translation is rotated back into the "
                "global frame by Q_i.", R["bioemu"]),
     "score": P("ŝ_r, ŝ_Q: N_{res} × 3 each",
                "For positions the network is trained to output score × σ_t, so dividing by σ_t gives the score; "
                "that is ε-prediction up to sign. The rotation output is scaled by the IGSO(3) score norm. "
                "Sampling uses DPM-Solver-2 from t = 0.99 to 0.001: 50 time points, 49 steps of two evaluations "
                "each, deterministic by default. The paper reports structures 'in as few as 30-50 denoising "
                "steps'.", R["bioemu"], R["dpmsolver"]),
     "out": P("10⁴ backbones per sequence, minutes to hours on one GPU",
              "Backbone atoms come from idealised residue frames. Side chains are added afterwards by H-Packer and "
              "can be relaxed with short MD. Samples with long bonds or clashes are filtered out by default.",
              R["bioemu"], R["hpacker"])},
    [("Paper · Science 2025", "https://doi.org/10.1126/science.adv9817"),
     ("Code · microsoft/bioemu", "https://github.com/microsoft/bioemu"),
     ("Preprint · bioRxiv 2024", "https://doi.org/10.1101/2024.12.05.626885"),
     ("Benchmarks · microsoft/bioemu-benchmarks", "https://github.com/microsoft/bioemu-benchmarks")],
    ["BioEmu is not a structure predictor but an emulator of equilibrium ensembles: for one protein chain it "
     "draws thousands of independent backbone conformations, aiming at the distribution molecular dynamics "
     "would visit, at a cost of minutes to hours on one GPU.",
     "The architecture is Distributional Graphormer's: AlphaFold 2, frozen, encodes the sequence once, and a "
     "31 M-parameter score model of eight invariant-point-attention layers denoises residue frames. Positions "
     "diffuse under a cosine VP-SDE, orientations under IGSO(3). Next to AF3 the split is the same — an "
     "expensive condition computed once, a cheap network called at every step — but nothing in the encoder is "
     "trained.",
     "What makes the samples diverse is the training data, not the network. Pretraining draws a sequence "
     "cluster from AFDB and then a random structure from it, while always feeding the sequence of the "
     "highest-pLDDT member, so one input maps to several structures. Models pretrained on the PDB or on "
     "high-pLDDT AFDB instead sample markedly less diverse conformations (Fig. S8). Fine-tuning then adds over "
     "200 ms of MD reweighted toward equilibrium, and 502,442 sequences with measured folding stabilities "
     "(MEGAscale) through property-prediction fine-tuning, which backpropagates through an 8-step sampler and trains only layers 1 "
     "and 8.",
     "The paper reports relative free energies within about 1 kcal/mol of millisecond-scale MD and of "
     "experimental stabilities. Checkpoints v1.0 (preprint), v1.1 (Science paper, default) and v1.2 (more MD "
     "and stability data, plus residue-type embeddings in every layer) share the architecture."],
    [("sequence", "N_{res} residues"),
     ("AF2 Evoformer, frozen", "s: N_{res} × 384 · z: N_{res}² × 128"),
     ("noise", "x_t: N_{res} × (Cα ∈ ℝ³, Q ∈ SO(3))"),
     ("input projections", "h: N_{res} × 512 · z: N_{res}² × 256"),
     ("8 IPA layers", "h: N_{res} × 512"),
     ("score heads", "→ ŝ_r, ŝ_Q: N_{res} × 3 each")])

DETAILS["bioemu2"] = _cofold_details(
    {"input": P("proteins, nucleic acids, ligands; an MSA; optionally a start structure and contacts",
                "BioEmu-2 widens BioEmu from one protein chain to all-atom complexes. The same weights serve "
                "three tasks: structure prediction, equilibrium sampling, and propagation of a given structure "
                "forward in time.", R["bioemu2"]),
     "emb": P("s^{inputs}: N_{tok} × 455 = 384 atom-encoder features + 33 residue type + 33 MSA profile + 1 "
              "deletion mean + 4 pocket classes",
              "As AF3's input embedder: a 3-block atom transformer pools reference-conformer atoms into tokens.",
              R["bioemu2"], R["af3"]),
     "mode": P("method token → s (384) and z (256) · contacts: threshold in 4–20 Å, Fourier-embedded → z",
               "The trunk is told what kind of data to imitate. Training labels each example by provenance "
               "(X-ray, cryo-EM, NMR, MD, AFDB, …); at inference, equilibrium sampling sets the token to MD "
               "and structure prediction to non-MD. Contact conditioning is Boltz-2's: a pair of tokens and a "
               "maximum distance, encoded into the pair initialisation.", R["bioemu2"], R["boltz2"]),
     "msa": P("4 blocks · MSA 128 ch · 8.6 M parameters",
              "Outer-product mean, pair-weighted averaging and triangle multiplication, with the triangle "
              "attention of AF3's MSA module removed.", R["bioemu2"], R["pairmixer"]),
     "pairmixer": P("z: N_{tok}² × 256 · 48 blocks · 75.6 M parameters (1.6 M per block)",
                    "Each block is triangle multiplication outgoing, then incoming, then a transition, all on z. "
                    "The single representation passes through every block unchanged: s is the input projection "
                    "plus its own recycled copy. Recycling runs 3 times at inference, so the trunk makes 4 "
                    "passes. The pair width is twice AF3's 128.", R["pairmixer"], R["bioemu2"]),
     "c": P("s: N_{tok} × 384 · z: N_{tok}² × 256, plus a 64-bin distogram head",
            "Computed once per system and mode and cached, also to disk for reuse. There is no confidence head: "
            "the only head on the trunk is a distogram.", R["bioemu2"]),
     "noise": P("N_{atom} × 3, σ_{max} = 160 σ_{data} = 2560 Å",
                "AF3's Karras schedule (ρ = 7, σ_{min} = 4 · 10^{−4} σ_{data}, σ_{data} = 16 Å) and AF3's EDM "
                "preconditioning, c_{noise} = ¼ log(σ / σ_{data}).", R["edm"], R["bioemu2"]),
     "cond": P("c: concat(s^{trunk}, s^{inputs}) → 768, + Fourier(σ) 256 → 768, + lag embedding · z: concat(z^{trunk}, "
               "rel. pos.) → 256, 2 transitions",
               "AF3's conditioning at width 768 instead of 384, plus the lag time Δt of a propagation step, "
               "embedded with damped harmonics over 32 log-spaced timescales and switched off for ordinary "
               "sampling. z and the atom-pair features are computed once per system; c is recomputed per step.",
               R["bioemu2"], R["af3"], R["ito"]),
     "ain": P("q: N_{atom} × 128 · atom pairs p: 16 ch in 32 × 128 windows",
              "Reference-conformer features (charge, element, atom name) plus a linear map of the noisy "
              "coordinates x_t. For propagation, a linear map of the start coordinates is added too, scaled by "
              "a learned gate that decays with Δt, so a long lag forgets the start. Atom pairs get the "
              "reference geometry and the trunk's z, as in AF3, but no atom-encoder layers run here.",
              R["bioemu2"], R["ito"]),
     "tin": P("a: N_{tok} × 768",
              "LayerNorm and a linear map of the trunk single s, plus a linear map of the noisy position of each "
              "token's centre atom. The token stream starts from the trunk, not from pooled atoms.",
              R["bioemu2"]),
     "aatt": P("4 heads · windows of 32 queries × 128 keys · atom-pair bias p · 0.87 M per layer",
               "Windowed attention and a SwiGLU MLP on the atom stream, AdaLN-Zero conditioned on c "
               "broadcast to atoms.", R["bioemu2"], R["af3"], R["dit"]),
     "tok": P("N_{tok} × 768 · 16 heads · pair bias from z (256 → 16) · gated output",
              "Full attention over tokens with AdaLN-Zero from c: x ← x + γ ⊙ op((1 + α) ⊙ LN(x) + β) around "
              "both the attention and the MLP. 13.6 M parameters per layer, 217 M over 16.",
              R["bioemu2"], R["dit"], R["af3"]),
     "amlp": P("SwiGLU 128 → 512 → 128", "", R["bioemu2"]),
     "tmlp": P("SwiGLU 768 → 3072 → 768 · 7.1 M per layer", "The largest single piece of each layer.",
               R["bioemu2"]),
     "coup": P("two SwiGLU MLPs on [token ‖ atom] = 896 ch, hidden 1792 · 11.5 M per layer, 184 M in total",
               "After both streams have updated themselves, each atom receives its token's features and each "
               "token receives the features of its centre atom; each mix is an AdaLN-gated MLP added as a "
               "residual. Atoms and tokens therefore exchange information in both directions in each of the sixteen layers, instead of once on the way "
               "in and once on the way out as in AF3.", R["bioemu2"]),
     "readout": P("token 768 → 384 broadcast to atoms, + atom 128 → 384 → LayerNorm → 3",
                  "The coordinate update F_θ. x̂ = c_{skip} x + c_{out} F_θ as in AF3.", R["bioemu2"],
                  R["edm"]),
     "xhat": P("N_{atom} × 3",
               "The sampler is AF3's (adapted from Boltz): 200 steps, churn γ_0 = 0.8 above σ = 1 Å, noise "
               "scale λ = 1.0, a random rotation and translation before every step, and the noisy structure "
               "Kabsch-aligned onto x̂ before the update. The step scale η is 1.5 for structure prediction, "
               "as in AF3, and 1.0 for equilibrium sampling, i.e. no sharpening. Optional Feynman–Kac steering "
               "with physical potentials (clashes, bond geometry, chirality) reweights and resamples particles.",
               R["bioemu2"], R["af3"], R["fksteer"]),
     "out": P("independent samples; a trajectory only via repeated propagation",
              "Equilibrium samples are i.i.d. draws, not a time series. Propagation draws endpoints at a lag Δt "
              "from a start structure (1 ns to 1 µs recommended); chaining such steps builds a trajectory. "
              "Physicality checks flag clashes and broken geometry per frame.", R["bioemu2"], R["ito"])},
    [("Code · microsoft/bioemu2", "https://github.com/microsoft/bioemu2"),
     ("Weights · Hugging Face", "https://huggingface.co/microsoft/bioemu2"),
     ("PairMixer · arXiv 2025", "https://arxiv.org/abs/2510.18870"),
     ("BioEmu · Science 2025", "https://doi.org/10.1126/science.adv9817")],
    ["BioEmu-2 was released as code and weights (bioemu2-preview) in October 2026, before any paper; "
     "everything on this card is read from the released code, config and checkpoint. It moves BioEmu from "
     "backbone frames of one chain to all atoms of proteins, nucleic acids and ligands, and adopts AF3's "
     "outer design: a trunk run once per target, an EDM denoiser over atom coordinates run 200 times.",
     "The weight sits in the denoiser. The trunk is a pair-only PairMixer — 4 MSA blocks and 48 blocks of "
     "triangle multiplication, 86 M parameters — while the denoiser has 425 M, five times as much; in OpenFold3 "
     "the ratio is 1.3. It is not AF3's atom encoder, "
     "token transformer and atom decoder in sequence: sixteen dual-stream layers carry an atom stream and a "
     "token stream side by side, each with its own attention and MLP, and couple them after every layer.",
     "One model, three tasks. A method token tells the trunk whether to imitate MD or experimental and "
     "predicted structures, and the sampler's step scale η is 1.0 for ensembles and 1.5 for single "
     "structures — the same η that AF3 uses to sharpen its samples. Propagation conditions the denoiser on "
     "a start structure and a lag time Δt, an implicit-transfer-operator model inside the same network.",
     "Training (model card): 189,745 PDB systems as preprocessed for Boltz-1, 7.2 M AFDB monomers, 775 k "
     "multi-conformation AFDB dimers, 50,651 Teddymer complexes, and Microsoft MD of CATH domains, dimers, "
     "heterodimers and PDBbind protein–ligand complexes. The card lists no confidence head and calls the "
     "sampling frequencies uncalibrated: they 'must not be interpreted as a calibrated Boltzmann probability'."],
    [("tokens", "N_{tok}; atoms N_{atom}"),
     ("input embedder", "s^{inputs}: N_{tok} × 455"),
     ("PairMixer trunk", "s: N_{tok} × 384 · z: N_{tok}² × 256"),
     ("noise", "x: N_{atom} × 3"),
     ("stream inputs", "q: N_{atom} × 128 · a: N_{tok} × 768"),
     ("16 dual-stream layers", "q: N_{atom} × 128 · a: N_{tok} × 768"),
     ("readout", "→ Δx: N_{atom} × 3")])
