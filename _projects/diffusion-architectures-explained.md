---
layout: default
title: Diffusion denoisers, from the noise up
description: A concept-first guide to the denoiser architectures in the diffusion gallery, from DDPM to AlphaFold 3, Boltz, OpenFold3, Protenix and ESMFold2, with animations.
importance: 2
category: research
permalink: /projects/diffusion-architectures/explained/
---
{%- assign g = '/projects/diffusion-architectures/' | relative_url -%}
<article class="da" markdown="1" data-contact="https://www.linkedin.com/in/niklas-abraham-05983b247">

<p class="da-eyebrow">Project · Long read · companion to the <a href="{{ g }}">architecture gallery</a></p>
<h1 class="da-title">Diffusion denoisers, from the noise up</h1>
<p class="da-lede">What every diffusion network has to compute; the building blocks the image models introduced, with the ablations that justified each one; and the AlphaFold 3 family model by model — what Boltz, OpenFold3, Protenix and ESMFold2 actually changed.</p>
<p class="da-meta">Niklas Abraham · October 2026 · about 110 minutes · 25 animations, 1 film, 2 renders, 3 figures, 14 drawings, 10 derivations, 9 graphs</p>

<div class="da-note" markdown="1">
**A note before you start.** I wrote this while learning the material. Every number is checked against the paper, its supplementary information or the released code, and I say where it comes from — but a text this long certainly still contains mistakes. If you find one, or think an explanation is wrong or misleading, please [drop me a message on LinkedIn](https://www.linkedin.com/in/niklas-abraham-05983b247). Corrections are very welcome and will be credited.
</div>

The [architecture gallery]({{ g }}) draws seventeen diffusion models side by side, and the [step-by-step walkthrough]({{ '/projects/diffusion-architectures/walkthrough/' | relative_url }}) lets you fold one structure yourself, left to right through an OpenFold3-style model. The drawings show *what* each network is made of; this article explains *why*, and what the papers measured when they made each choice. It has four parts:

1. **What every denoiser computes.** The task, which is the same for all fourteen models, and the three equivalent ways of writing down its output.
2. **Building blocks, learned on images.** U-Nets, the noise-level pathway, attention, text conditioning, latents and patches, the training path, and guidance — each with the ablation numbers from the paper that introduced it.
3. **From pixels to atoms.** Symmetry, the pair representation, the MSA, the trunk, recycling, atoms and tokens, and RFdiffusion as the first protein denoiser built from a structure predictor.
4. **The AlphaFold 3 family, model by model.** AlphaFold 3 in full, then Boltz-1, Boltz-2, OpenFold3, Protenix and ESMFold2 against it, a side-by-side table, and the places where the papers disagree with their own code.

**The thread.** One question runs through all four parts: *how does a model turn pure noise into the structure of a molecular complex?* The strip below is the path a single prediction takes through AlphaFold 3 and its relatives. It comes back at the start of every part and at the key sections, with the station the text is about marked; on a wide screen the rail on the left shows the same stations as you scroll.

{% include da-route.html note="One prediction, start to end. The trunk runs once per target and hands its output c to the denoiser; the denoiser and the sampler step then run together 200 times, with the same c every time. Click a station to jump to the section about it." %}

Each section ends with the gallery models in which the concept appears. Animations start when they scroll into view and loop; **↻ replay** restarts one. Formula cards give the result first and then derive it line by line. Numbers are quoted with the table or page they come from; where a paper only shows a plot, I say so.

<nav class="da-toc" markdown="0">
<span class="lbl">Contents</span>
<ol>
<li><a href="#noise-in-data-out">Noise in, data out</a></li>
<li><a href="#three-targets">Three ways to say the same thing</a></li>
<li><a href="#sampling">From a denoiser to samples</a></li>
<li><a href="#unet">Convolutions and the U-Net</a></li>
<li><a href="#noise-level">Telling the network the noise level</a></li>
<li><a href="#attention">Attention</a></li>
<li><a href="#prompt">Reading a prompt</a></li>
<li><a href="#latents">Latents and patches</a></li>
<li><a href="#training-path">Choosing the path and where to train on it</a></li>
<li><a href="#guidance">Guidance</a></li>
<li><a href="#symmetry">Coordinates have no up</a></li>
<li><a href="#pair">The pair representation, the Pairformer and the MSA</a></li>
<li><a href="#trunk">The trunk, recycling and the denoiser</a></li>
<li><a href="#atoms">Atoms and tokens</a></li>
<li><a href="#rfdiffusion">RFdiffusion: a structure predictor turned denoiser</a></li>
<li><a href="#af3">AlphaFold 3 in full</a></li>
<li><a href="#af3-sampler">AlphaFold 3's sampler</a></li>
<li><a href="#boltz1">Boltz-1</a></li>
<li><a href="#boltz2">Boltz-2</a></li>
<li><a href="#openfold3">OpenFold3</a></li>
<li><a href="#protenix">Protenix, v1 and v2</a></li>
<li><a href="#esmfold2">ESMFold2</a></li>
<li><a href="#side-by-side">Side by side</a></li>
<li><a href="#errata">Where papers and code disagree</a></li>
<li><a href="#map">Concept map and reading list</a></li>
</ol>
</nav>

<p class="da-part">Part I<strong>What every denoiser computes</strong></p>

{% include da-route.html at="denoiser,sampler" note="Where we are: the two stations every diffusion model has — a denoiser that guesses the clean sample from a noisy one, and a sampler that turns those guesses into a trajectory. Everything after Part I is about how the denoiser is built and what it is told." %}

<h2 id="noise-in-data-out"><span class="num">01</span>Noise in, data out</h2>

A diffusion model connects the data distribution to a distribution that is trivial to sample. Take a clean sample $$x_0$$ — an image, or the coordinates of every atom in a protein complex — and add Gaussian noise of standard deviation $$\sigma$$:

$$x_\sigma = x_0 + \sigma\,\varepsilon, \qquad \varepsilon \sim \mathcal N(0, I).$$

For small $$\sigma$$ the sample is barely touched. Once $$\sigma$$ is much larger than the spread of the data, every sample looks like a draw from the same wide isotropic Gaussian, and nothing about the data survives. Generation runs this path backwards: draw pure noise at a large $$\sigma_\text{max}$$ and remove it in small steps until $$\sigma = 0$$.

{% include concept.html id="a01_noising" %}

The network that makes the backward walk possible is the **denoiser**. It receives the noisy sample and the noise level and returns a guess of the clean sample, $$\hat x = D_\theta(x, \sigma)$$. Training is plain regression: take a training example, noise it at a random $$\sigma$$, ask the network for the original, and penalise the squared error.

{% include concept.html id="f01_edm" %}

The third line of that derivation is the one to remember. A squared error is minimised by a conditional mean, so the best possible denoiser does **not** return a plausible sample. It returns the *average* of all clean samples that could have produced the noisy input. What that average looks like depends entirely on $$\sigma$$:

{% include concept.html id="a02_denoiser_guess" %}

At high noise the input carries almost no information and the average is close to the mean of the whole dataset: a blurred, featureless guess. At intermediate noise the guess commits to a region — which crescent in the toy example, which object in an image, which fold for a protein. At low noise only fine detail is left to fix. One network has to do all three jobs, and the noise level tells it which one it is doing. That is why every architecture in the gallery has a dedicated pathway for $$\sigma$$ ([section 5](#noise-level)).

The fourth line connects the denoiser to the **score**, the gradient of the log-density of the noised data. The score is all a sampler needs, so learning to denoise and learning to generate are the same problem. Karras et al. (2022) made this separation explicit: "from the viewpoint of the sampler, $$D_\theta$$ is simply a black box" (EDM, §3). Everything in this article is about what goes inside that box.

### Preconditioning

The formula card also shows EDM's **preconditioning**. The network $$F_\theta$$ does not output $$\hat x$$ directly; its output is mixed with the input through weights that depend on $$\sigma$$:

{% include concept.html id="g01_precond" %}

At low noise $$c_\text{skip} \approx 1$$: the answer is mostly the input itself, and the network only predicts a small correction. At high noise $$c_\text{skip} \to 0$$ and the network output *is* the answer. $$c_\text{in}$$ makes the network's input unit-variance, $$c_\text{out}$$ makes its effective target unit-variance, and $$c_\text{skip}$$ is chosen to amplify the network's errors as little as possible. Only $$c_\text{noise} = \tfrac14 \ln\sigma$$ was "chosen empirically".

How much does it matter? In EDM's training ablation (Table 2, configuration D), preconditioning left most results "largely unchanged" but rescued the variance-exploding model at 64 × 64: FFHQ FID fell from 41.62 to 3.39, AFHQv2 from 15.04 to 3.81. The paper's own summary is that its main benefit is robustness. That robustness is why the co-folding models adopted it wholesale: AlphaFold 3 trains one network on noise levels from 2560 Å down to below a hundredth of an ångström, more than five orders of magnitude, with $$\sigma_\text{data} = 16$$ Å.

So the denoiser's whole job is one regression, written in EDM's preconditioned form. Before building one, it helps to see that "predict the clean sample" is only one of three equivalent ways to state what it outputs — and that the AlphaFold 3 family chose that one on purpose.
{: .da-bridge}

<h2 id="three-targets"><span class="num">02</span>Three ways to say the same thing</h2>

Not every model predicts the clean sample. DDPM and Stable Diffusion 1 and XL predict the **noise** $$\varepsilon$$ that was added. SD3 and FLUX predict a **velocity** along a straight path from data to noise. AlphaFold 3 and its successors predict the clean structure. Given the noisy input and the noise level, any one of the three determines the other two.

{% include concept.html id="a03_targets" %}

{% include concept.html id="f02_targets" %}

The choice matters for optimisation, not for what can be represented, and the evidence is subtler than the folklore. DDPM's Table 2 is usually cited as "ε-prediction wins". Read it carefully: on the true variational bound with fixed variances, predicting ε (FID 13.51) and predicting the posterior mean (13.22) are a tie. The jump to 3.17 came from switching to the *unweighted* $$L_\text{simple}$$ loss, which "down-weight[s] loss terms corresponding to small t" — a change in where the loss looks, not in the parameterisation. DDPM also tried predicting $$x_0$$ and found "worse sample quality early in our experiments".

RFdiffusion went the other way, on purpose: "Although Ho et al. found better performance in generative modeling of images when predicting the noise … we reasoned that by predicting $$x^{(0)}$$ we could better leverage the inductive biases of RoseTTAFold pre-trained for structure prediction" (SM 2.5). It never trained an ε variant to compare. AlphaFold 3 predicts $$\hat x$$ through EDM preconditioning, which interpolates between the two regimes automatically. A structure predictor naturally outputs structures; making the denoiser output one too lets it inherit that skill.

<div class="da-in-gallery">In the gallery:
<a href="{{ g }}#ddpm">DDPM · ε</a><a href="{{ g }}#sd1">SD 1 · ε</a><a href="{{ g }}#sd3">SD3 · v</a><a href="{{ g }}#flux">FLUX · v</a><a href="{{ g }}#af3">AF3 · x̂</a><a href="{{ g }}#rfdiffusion">RFdiffusion · x̂₀</a>
</div>

Whatever it predicts, a denoiser on its own answers a single question: which clean sample lies behind this noisy one? Turning those answers into a finished sample is the job of the second station on the route, the sampler.
{: .da-bridge}

<h2 id="sampling"><span class="num">03</span>From a denoiser to samples</h2>

Sampling turns the denoiser into a trajectory. The simplest version integrates the **probability-flow ODE**, a deterministic equation whose solution carries every noise sample to a data sample and whose marginals match the noised data at every $$\sigma$$. Each integration step costs one network evaluation, so the number of steps is the main cost of sampling.

{% include concept.html id="a04_sampling_paths" %}

How many steps a model needs depends on how curved its trajectories are and how well the solver follows them. The milestones, with the numbers the papers report:

- **DDPM** ran 1000 ancestral steps, chosen "so that the number of neural network evaluations needed during sampling matches previous work".
- **Improved DDPM** learned the reverse variance and found "100 sampling steps is sufficient to achieve near-optimal FIDs"; ADM then sampled ImageNet with 250 strided steps or 25 DDIM steps (FID 4.59 versus 5.44 at 256 × 256, guided).
- **EDM** replaced Euler with Heun's second-order method, spaced the steps with $$\rho = 7$$ and set $$\sigma(t) = t$$. On CIFAR-10 that cut the network evaluations needed from 256 to 35 for the VP model and from 8192 to 27 for the VE model, "7.3× for VP, 300× for VE" (Table 3).
- **Rectified flow** trains on straight lines between data and noise. On CIFAR-10 an adaptive solver needed 127 evaluations against 140 for the VP ODE on the same network (Table 1a); repeated "reflow" plus distillation then gets one-step FID to 4.85. SD3 samples in about 28–50 Euler steps, and step distillation takes FLUX.1 [schnell] to 1–4.
- **The co-folding models** all ship with 200 steps of a stochastic sampler; ESMFold2 starts lower and uses 68 (or 10 in its released config). [Section 17](#af3-sampler) looks at that sampler in detail.

One consequence of the deterministic ODE: the sample is a function of the starting noise alone. All diversity has to come from where you start, or from noise injected along the way.

With the task and the sampler in place, everything that follows is about what sits inside the denoiser box. The image models built that box first, one component at a time, and measured each one — so that is where we start.
{: .da-bridge}

<p class="da-part">Part II<strong>Building blocks, learned on images</strong></p>

{% include da-route.html at="denoiser,noise" note="Where we are: inside the denoiser box. The image models invented its parts — the network body, how it is told the noise level, attention, and how a condition gets in — and the co-folding models reuse every one of them." %}

<h2 id="unet"><span class="num">04</span>Convolutions and the U-Net</h2>

The first diffusion denoisers were convolutional U-Nets, borrowed from image segmentation. A 3 × 3 convolution only sees a pixel's immediate neighbours. Stack convolutions and halve the resolution a few times, and each cell at the bottom sees most of the image. The decoder then upsamples back to full resolution, and **skip connections** carry each encoder level's features straight across to the matching decoder level, where they are concatenated on the channel axis.

{% include concept.html id="a05_unet" %}

That shape fits the denoising task well. The output has the same shape as the input. At low noise the network has to reproduce fine local detail, which the skips supply without squeezing it through the bottleneck. At high noise it needs global context, which the bottleneck supplies.

**DDPM (2020)** used a U-Net "similar to an unmasked PixelCNN++ … with group normalization throughout": four resolutions from 32 × 32 to 4 × 4 for CIFAR-10, two Wide-ResNet blocks per resolution, and self-attention at 16 × 16 only. The CIFAR model has 35.7 M parameters, the LSUN and CelebA-HQ models 114 M. Dropout of 0.1 mattered: without it, CIFAR samples were "reminiscent of the overfitting artifacts in an unregularized PixelCNN++".

**Score-SDE (2021)** searched 144 combinations of GAN-era tricks on top of that U-Net — anti-aliased resampling, rescaling skips by $$1/\sqrt2$$, BigGAN residual blocks, four blocks per resolution, progressive growing — and produced the NCSN++ and DDPM++ backbones that EDM and rectified flow later reused unchanged.

**Improved DDPM (2021)** added four attention heads, attention at 16 and 8, and a new way of injecting time (next section), and showed FID following a power law in compute as width grew from 30 M to 270 M parameters.

**ADM (2021)** is where the U-Net was tuned systematically, and its ablation is worth seeing in full:

{% include concept.html id="g07_adm_ablation" %}

On ImageNet 128 at 700k steps the baseline reached FID 15.33. BigGAN-style residual blocks that do their own up- and downsampling were the largest single gain (−1.20). Attention at 32, 16 and 8 instead of 16 alone gave −0.72; more heads −0.54; depth over width −0.21 but slower in wall-clock time, so it was not adopted. Rescaling residuals by $$1/\sqrt2$$ — the trick Score-SDE had adopted — made FID *worse* by 0.16 and was dropped. Everything adopted together brought 15.33 to 12.19. A second table found 64 channels per attention head best for wall-clock time. The same change helping in one paper and hurting in another is a recurring theme: any claim that "X helps" needs the model and dataset attached.

**Latent diffusion (2022)** kept the ADM U-Net and replaced each self-attention layer with a small transformer block (self-attention, MLP, cross-attention; [section 7](#prompt)). **SDXL (2023)** made the U-Net three times larger (2.6 B parameters) but redistributed it: "we omit the transformer block at the highest feature level, use 2 and 10 blocks at the lower levels, and remove the lowest level (8× downsampling) in the UNet altogether". Attention cost grows with the square of the number of positions, so moving it down the U is the cheap way to add capacity.

<div class="da-in-gallery">In the gallery:
<a href="{{ g }}#ddpm">DDPM</a><a href="{{ g }}#adm">ADM</a><a href="{{ g }}#sd1">SD 1</a><a href="{{ g }}#sdxl">SDXL</a><a href="{{ g }}#uvit">U-ViT (skips only)</a>
</div>

A U-Net gives the network a body that sees fine detail and wide context at once. But the same body has to behave differently at every noise level, so the next question is how it is told which one it is at.
{: .da-bridge}

<h2 id="noise-level"><span class="num">05</span>Telling the network the noise level</h2>

{% include da-route.html at="noise" note="The noise level is the one input that changes at every step; this section is about how the denoiser is told it." %}

Because the same network denoises at every $$\sigma$$, it needs to know which $$\sigma$$ it is looking at. Every model turns the noise level (or time step) into an embedding vector — a sinusoidal or Fourier encoding passed through a small MLP — and feeds that vector into every block. The interesting part is *how*, and it changed four times:

- **Add it.** DDPM: "Diffusion time $$t$$ is specified by adding the Transformer sinusoidal position embedding into each residual block". A per-channel bias.
- **Scale and shift.** Improved DDPM changed $$\operatorname{GroupNorm}(h + v)$$ to $$\operatorname{GroupNorm}(h)(w + 1) + b$$, with $$w, b$$ computed from the embedding; ADM named it adaptive group norm and measured it: FID 13.06 with AdaGN against 15.08 with DDPM's addition (Table 3). The class label is added to the time embedding first, so the same pathway carries both.
- **Scale, shift and gate.** DiT's adaLN-Zero regresses, per block, a shift and scale after each LayerNorm and a gate $$\alpha$$ on each residual branch. The gates are initialised to zero, "this initializes the full DiT block as the identity function".
- **Make it a token.** U-ViT appends the time step to the input sequence; on CIFAR-10 "the first way that treats time as a token performs better than AdaLN" (plot only, no numbers in the text).

{% include concept.html id="a06_modulation" %}

DiT compared four ways of conditioning a transformer at the same compute, and the result is unusually clean:

{% include concept.html id="g06_dit_cond" %}

Putting $$t$$ and the class in as extra tokens gave FID 35.24 after 400k steps; a cross-attention layer to them 26.14 at 15 % more compute; adaLN 25.21; adaLN-Zero 19.47. "At 400K training iterations, the FID achieved with the adaLN-Zero model is nearly half that of the in-context model." The zero initialisation alone accounts for most of the gap to plain adaLN.

All of these are *global*: the same scale and shift is applied at every position. DiT notes adaLN is "the only conditioning mechanism that is restricted to apply the same function to all tokens." Modulation can tell a block which regime it is in, but not *where* something should go. That needs attention.

The co-folding models use the same mechanism. AlphaFold 3 embeds $$\tfrac14 \log(\hat t/\sigma_\text{data})$$ with 256 random Fourier features, adds it to the single representation from the trunk, and conditions every block of its token transformer on the result through adaptive LayerNorm with adaLN-Zero-style output gates (sigmoid, bias initialised to −2).

### The noise level as a code of 256 numbers

That one sentence hides a small design worth unpacking, because the noise level is the only thing that tells the denoiser which of its three jobs from [section 1](#noise-in-data-out) it is doing. AlphaFold 3's Algorithm 22 is two lines long: draw 256 frequencies $$w_k$$ and 256 phases $$b_k$$ from a standard normal distribution once, before training, and never change them; then turn the noise level into the vector of 256 numbers

$$n_k = \cos\big(2\pi(w_k u + b_k)\big), \qquad u = \tfrac14 \ln(\hat t / \sigma_\text{data}).$$

Three things happen here, in order.

**The noise level is put on a log scale.** Sampling runs from 2560 Å down to 0.0064 Å, a factor of 400,000. On the scale $$u$$ that becomes the interval from 1.27 to −1.96, centred on the size of a typical complex ($$\sigma_\text{data} = 16$$ Å sits at $$u = 0$$). Equal steps in $$u$$ are equal *ratios* of noise, which is the natural unit: going from 1000 to 500 Å changes the task about as much as going from 2 to 1 Å. The factor ¼ is EDM's $$c_\text{noise}$$, chosen empirically.

**The scalar is turned into waves.** Each feature is a cosine of $$u$$ with its own random frequency. A feature with a small $$\lvert w_k \rvert$$ is a slow wave that does little more than tell high noise from low noise; one with a large $$\lvert w_k \rvert$$ oscillates several times across the schedule and tells neighbouring noise levels apart. Why not feed $$u$$ in directly? A network that receives a single number finds it hard to make its behaviour change quickly with that number: small networks are biased towards smooth, low-frequency functions of their inputs. Tancik et al. (2020) showed that a fixed random Fourier mapping of a low-dimensional input removes this bias, and Song et al.'s score-based models used the same "Gaussian Fourier features" for the noise level. DDPM's sinusoidal embedding of the time step, borrowed from the Transformer's position encoding, is the deterministic cousin.

{% include concept.html id="c07_fourier_anim" %}

**The code has a resolution.** How different are the codes of two noise levels? Averaging the product of two features over the random frequencies gives a closed form: the similarity of the codes of $$\sigma$$ and $$r\sigma$$ is about $$e^{-\pi^2 (\ln r)^2 / 8}$$. It is one half for a factor of 2.1 and below one percent for a factor of 10. In effect the code splits the schedule into about a dozen overlapping noise regimes, each of which the network can treat differently, without anyone having to say where one regime ends and the next begins.

{% include concept.html id="c03_fourier" %}

{% include concept.html id="c04_fourier_kernel" %}

The code then goes through a LayerNorm and a learned linear layer and is *added* to every token's single conditioning $$s_i$$, alongside the trunk's own single representation. From there it reaches all 24 blocks of the token transformer through adaptive LayerNorm, so every layer gets its own scale, shift and gate for the current noise regime. Note what is *not* learned: the frequencies. Only the layers after the cosines are trained.

{% include media.html src="fig_fourier_noise2.webp" kind="figure" title="The noise-level code, computed" caption="(1) Four of the 256 features against σ, slow and fast waves, with the training distribution of noise levels shaded. (2) How similar the codes of two noise levels are, against their ratio: half at a factor of 2.1, unrelated beyond a factor of 5. (3) The 200 sampling steps against the range that covers 95 % of training noise levels." wide=true %}

Panel 3 is worth a second look. AlphaFold 3 trains on noise levels drawn from a log-normal around 4.8 Å, so 95 % of its training examples have $$\sigma$$ between 0.25 and 91 Å. The sampler, however, spends 91 of its 200 steps above 91 Å. The noise code still distinguishes those levels, but the network has been trained on them rarely — one reason ESMFold2 could simply drop every level above 256 Å, which it reports "did not degrade performance" ([section 17](#af3-sampler)).

<div class="da-in-gallery">In the gallery:
<a href="{{ g }}#ddpm">DDPM · additive</a><a href="{{ g }}#adm">ADM · AdaGN</a><a href="{{ g }}#dit">DiT · adaLN-Zero</a><a href="{{ g }}#uvit">U-ViT · token</a><a href="{{ g }}#af3">AF3 · AdaLN(s)</a>
</div>

Modulation tells every position the same thing: which regime the network is in. To let positions exchange information depending on what they contain, the denoisers needed attention.
{: .da-bridge}

<h2 id="attention"><span class="num">06</span>Attention</h2>

A convolution mixes a fixed neighbourhood with fixed weights. **Attention** lets every position decide, from its content, which other positions to read. Each token emits a query; every token offers a key and a value; the query's similarity to each key, passed through a softmax, sets how much of each value it receives.

{% include concept.html id="a07_attention" %}

{% include concept.html id="f03_attention" %}

The price is the $$N \times N$$ weight matrix. DiT-XL/2 attends over 256 tokens, so each of its 16 heads computes 65,536 weights per layer; attending over the 65,536 pixels of a 256 × 256 image directly would need over four billion. [Section 8](#latents) is about how image models avoid that.

Attention also brought a stability problem at scale. SD3 found that at high resolution "mixed precision training can become unstable and the loss diverges", with attention logits growing without bound in the last transformer blocks of a 2 B model. Normalising queries and keys with RMSNorm before the dot product fixed it and allowed bf16 training; the alternative, full precision, was "a ∼2× performance drop". FLUX inherits the same QK-norm.

The last line of the formula card is the version the co-folding models use. A bias $$B_{ij}$$, computed from the pair representation of the trunk, is added to every attention logit. It lets the geometry the trunk has inferred decide which residues attend to which — a third way for the condition to enter, besides modulation and tokens.

Attention between the positions of one image is half the story. The other half is how a condition — a class, a prompt, or for proteins a whole trunk — gets into those positions.
{: .da-bridge}

<h2 id="prompt"><span class="num">07</span>Reading a prompt: cross-attention and joint attention</h2>

A class label is a single vector and fits through the modulation pathway. A text prompt is a sequence: "a red fox in snow" needs the network to know which words go where.

**Cross-attention (latent diffusion, 2022).** The U-Net's positions provide queries; a text encoder's token features provide keys and values: $$Q = W_Q \varphi(z_t)$$, $$K = W_K \tau_\theta(y)$$, $$V = W_V \tau_\theta(y)$$. The LDM paper trained its own 32-layer BERT-tokenised transformer jointly with a 1.45 B U-Net on LAION-400M; Stable Diffusion 1 replaced it with a frozen CLIP ViT-L text encoder (77 tokens × 768). With classifier-free guidance at $$s = 1.5$$ the LDM text model reached MS-COCO FID 12.63, close to GLIDE's 12.24 at a quarter of the parameters (Table 2).

**Two encoders (SDXL).** OpenCLIP ViT-bigG and CLIP ViT-L, "where we concatenate the penultimate text encoder outputs along the channel-axis", giving a 77 × 2048 context; the pooled bigG embedding also joins the time embedding.

**Text as tokens (U-ViT).** CLIP token features enter the sequence and are attended in every layer: "texts and images interact at every layer in our U-ViT, which is more frequent than U-Net that only interact at cross attention layer." On MS-COCO, U-ViT-S/2 (Deep) reached FID 5.48 against 7.32 for the authors' own cross-attention U-Net.

**Joint attention (SD3's MMDiT, 2024).** Text and image tokens are both carried through the network: "we use two separate sets of weights for the two modalities … equivalent to having two independent transformers for each modality, but joining the sequences of the two modalities for the attention operation." Text now reads the image as much as the image reads the text. In SD3's comparison on CC12M, MMDiT "significantly outperforms" the cross-attention variant and a vanilla DiT over the concatenated sequence; a third set of weights gave "only a small gain" (Fig. 4, plotted only). SD3 uses three text encoders: CLIP-L and OpenCLIP bigG penultimate features, concatenated and zero-padded to 4096 channels, plus T5-XXL, 154 tokens in all. T5 can be dropped at inference: without it, human raters still preferred the result 50 % of the time on aesthetics but only 38 % on typography.

**Double and single stream (FLUX.1).** FLUX.1 runs MMDiT-style double-stream blocks, then "we concatenate them and apply 38 single stream blocks to the image and text tokens"; the single-stream blocks use "fused feed-forward blocks" in which attention and MLP read the same input in parallel, after ViT-22B. The FLUX.1 Kontext paper does not state the number of double-stream blocks; the released code uses 19.

{% include concept.html id="a08_cross_vs_joint" %}

The pooled text embedding still goes through modulation, alongside the time step: global information by adaLN, token-level information by attention. The co-folding models have exactly the same split, with the trunk's single representation in AdaLN and its pair representation as attention bias.

<div class="da-in-gallery">In the gallery:
<a href="{{ g }}#sd1">SD 1 · cross</a><a href="{{ g }}#sdxl">SDXL · cross</a><a href="{{ g }}#uvit">U-ViT · tokens</a><a href="{{ g }}#sd3">SD3 · joint</a><a href="{{ g }}#flux">FLUX · joint + single</a>
</div>

By now the denoiser reads its condition in every layer. What remained expensive was the number of positions it attends over, and the image models found two ways to cut it.
{: .da-bridge}

<h2 id="latents"><span class="num">08</span>Latents and patches</h2>

Most of the numbers in an image encode texture that a decoder can restore. **Latent diffusion** trains an autoencoder once, with a perceptual loss and a patch-based adversarial loss, and runs diffusion only in its latent space. The paper's study of the downsampling factor $$f$$ is the key evidence: "small downsampling factors for LDM-{1,2} result in slow training progress, whereas overly large values of $$f$$ cause stagnating fidelity … LDM-{4-16} strike a good balance … a significant FID gap of 38 between pixel-based diffusion (LDM-1) and LDM-8 after 2M training steps." On class-conditional ImageNet the latent model needed 271 V100-days against ADM's 962 and reached FID 3.60 against 4.59 (Table 18). Stable Diffusion's $$f = 8$$ autoencoder maps a 3 × 512 × 512 image to a 4 × 64 × 64 latent, 48 times fewer numbers; the decoder runs once after the last denoising step.

The latent's channel count turned out to be a bottleneck for large models. SD3 compared 4, 8 and 16 channels at $$f = 8$$: reconstruction FID 2.41, 1.56 and 1.06 (Table 3). The 16-channel latent "needs more model capacity" — the gap to 8 channels only closed at depth 22. FLUX's autoencoder also has 16 channels and reconstructs better again (PSNR 31.1 against SD3's 29.6 and SDXL's 25.9).

**Patches** shrink the problem once more. DiT cuts the 4 × 32 × 32 latent of a 256 × 256 image into 2 × 2 patches and treats each as one token: 256 tokens. Patch size became DiT's compute knob: "halving p will quadruple T, and thus at least quadruple total transformer Gflops", while "changing p has no meaningful impact on downstream parameter counts." At fixed size XL, patches of 8, 4 and 2 gave FID 106.4, 43.0 and 19.5 at 400k steps with the same 675 M parameters. Across all models the correlation between forward-pass Gflops and FID was −0.93: "scaling model Gflops is actually the key to improved performance." DiT-XL/2 reached FID 2.27 on ImageNet 256 with guidance, at 118.6 Gflops against ADM's 1120.

{% include concept.html id="a09_latent_patch" %}

{% include concept.html id="g02_tokens" %}

U-ViT reached the same conclusion from another direction: "a small patch size like 2 is required for a good performance", because "the noise prediction task in diffusion models is low-level and requires small patches". Its ablations found the U-Net's long skip connections "crucial while the down-sampling and up-sampling operators in CNN-based U-Net are not always necessary"; at matched compute (≈133 GFLOPs) U-ViT beat a 646 M-parameter U-Net, FID 2.29 against 2.66 with guidance.

Later models refine rather than replace the recipe: SD3 uses 2D frequency position embeddings on 2 × 2 patches; FLUX packs 2 × 2 latent patches into 64-channel tokens and replaces additive position embeddings with three-axis rotary embeddings.

<div class="da-in-gallery">In the gallery:
<a href="{{ g }}#sd1">SD 1 · latent</a><a href="{{ g }}#dit">DiT · patches</a><a href="{{ g }}#uvit">U-ViT</a><a href="{{ g }}#sd3">SD3</a><a href="{{ g }}#flux">FLUX</a>
</div>

The architecture is now complete. What remains is where along the noise path the network practises, and how often — a choice with effects as large as any block.
{: .da-bridge}

<h2 id="training-path"><span class="num">09</span>Choosing the path, and where to train on it</h2>

Architecture is half the story; the other half is which noise levels the network is trained on and how often. Every paper in the gallery changed this, and the effects are as large as the architectural ones.

- **DDPM**: $$T = 1000$$, $$\beta_t$$ linear from $$10^{-4}$$ to 0.02, timesteps uniform.
- **Improved DDPM**: the linear schedule "falls towards zero much faster, destroying information more quickly than necessary"; a cosine schedule cut ImageNet-64 FID from 31.3 to 27.0 (Table 1). It is not universal: "for ImageNet 256×256, the linear schedule worked better".
- **EDM**: sample $$\ln\sigma \sim \mathcal N(-1.2, 1.2^2)$$ and weight the loss by $$1/c_\text{out}^2$$, because "a significant reduction is possible only at intermediate noise levels". With non-leaky augmentation this gave CIFAR-10 FID 1.79 at 35 network evaluations.
- **SD3**: rectified flow with **logit-normal** timestep sampling, chosen from 61 formulations (ε and v with linear and cosine schedules, uniform rectified flow, EDM variants, and families of logit-normal and heavy-tailed "mode" densities). Ranked across 24 settings, rf/lognorm(0, 1) came first at 1.54; the LDM default eps/linear 2.88; uniform rectified flow 5.67; EDM's own (−1.2, 1.2) last at 15.58 (Table 1). "Only rectified flow formulations with modified timestep sampling perform better than the LDM-Linear."

{% include concept.html id="f07_rf_timesteps" %}

{% include concept.html id="g05_logitnormal" %}

SD3 also shifts the timestep density towards noise at high resolution — "since higher resolutions have more pixels, we need more noise to destroy their signal" — with a shift of 3 at 1024². AlphaFold 3 makes the same kind of choice for atoms: its training noise is $$\hat t = \sigma_\text{data} \exp(-1.2 + 1.5\,\mathcal N(0,1))$$, log-normal around 0.3 × 16 Å ≈ 5 Å, so most of its training happens where only local geometry is uncertain.

Training decides how good the denoiser is at each noise level. Guidance, the last image-model idea, decides how strongly the sampler should follow the condition — and it is the first place where the trade between faithfulness and diversity is made explicit.
{: .da-bridge}

<h2 id="guidance"><span class="num">10</span>Guidance</h2>

A conditional denoiser follows its condition only loosely: the conditional distribution of images given "a fox" is broad. Guidance sharpens it, and both papers that introduced it measured the cost.

**Classifier guidance (ADM).** A separate classifier trained on noisy images ("the downsampling trunk of the UNet model with an attention pool at the 8x8 layer") adds $$s\,\Sigma\, \nabla \log p_\phi(y \mid x_t)$$ to each reverse step. On ImageNet 256, guiding the conditional model at $$s = 1$$ cut FID from 10.94 to 4.59; recall fell from 0.63 to 0.52, and at $$s = 10$$ to 0.32 (Table 4). "Classifier guidance improves precision at the cost of recall, thus introducing a trade-off in sample fidelity versus diversity."

**Classifier-free guidance (Ho and Salimans).** Train the same network with the condition dropped some of the time and extrapolate between its conditional and unconditional predictions: "it is only a one-line change of code during training … and during sampling". On ImageNet 128 the best FID (2.43) came at a small weight; at large weight, FID rose again to 21.53 while Inception score kept climbing to 422 (Table 2). The paper's text says FID decreases monotonically with the weight; its own tables show a U-shape. Dropping the label 10 % or 20 % of the time worked equally well; 50 % was worse everywhere.

{% include concept.html id="a10_guidance" %}

{% include concept.html id="f04_cfg" %}

With weight $$w > 1$$ the sampler targets $$p(x)\,p(c \mid x)^w$$ instead of $$p(x \mid c)$$: samples concentrate where the condition is most certain. The guidance weight is a dial between following the condition closely and sampling the full conditional distribution. None of the co-folding models in this article uses guidance.

That completes the denoiser as the image models built it. Moving from pixels to atoms changes three things: the data has no grid and no fixed orientation, the condition becomes a learned trunk instead of a text encoder, and the output lives at two scales, atoms and residues. The next four sections take them in that order.
{: .da-bridge}

<p class="da-part">Part III<strong>From pixels to atoms</strong></p>

{% include da-route.html at="input,trunk,cond" note="Where we are: the left half of the path. Atoms replace pixels, and a large trunk turns sequences and evolution into the condition c that the denoiser reads at every step. This is where the Pairformer lives." %}

{% include media.html src="fig_antibody_pairmap.webp" kind="figure" title="One complex, three views: sequences, structure, pair map" caption="The running example of this part: the variable domains of the antibody trastuzumab bound to domain IV of HER2 (PDB 1N8Z). (1) What the model is given: three sequences (plus an alignment of related sequences for each); marked are the residues that end up touching the other side. (2) What it has to produce: the 3D structure. (3) In between, the object Part III is about: the pair map, the distance between every pair of residues. The trunk builds a learned version of this matrix, its distogram head is trained to predict exactly these distances, and the antibody–antigen contacts sit in the off-diagonal interface block." wide=true %}

<h2 id="symmetry"><span class="num">11</span>Coordinates have no up</h2>

For a biomolecular model the sample is a set of atom positions, $$x \in \mathbb R^{3 \times N}$$. There is no pixel grid, so convolutions and patches have nothing to act on, and there is no canonical orientation: a protein rotated by any angle and moved anywhere is the same protein. A denoiser should give the same answer, rotated along, however the input is posed.

{% include concept.html id="a11_symmetry" %}

There are two ways to get there. **Equivariant** networks build the symmetry into every layer. RFdiffusion represents each residue as a rigid frame — a Cα position and a rotation — and denoises with RoseTTAFold's SE(3)-equivariant structure track ([section 15](#rfdiffusion)). **Augmentation** leaves the network unconstrained and shows it many poses instead. AlphaFold 3's diffusion module "employ[s] very limited spatial inductive bias, simply embedding the positions with a single matrix multiplication"; it applies a random rotation and translation to the structure at every training example and at every sampling step, and learns approximate equivariance from data. Every reproduction in the gallery keeps that choice. Boltz-1 and ESMFold2 add one more trick at sampling time: before each step they Kabsch-align the noisy structure onto the denoiser's prediction, removing any rigid-body drift between the two.

The jump from AlphaFold 2 to 3 is the jump between these two philosophies:

{% include concept.html id="b04_af2_vs_af3" %}

AlphaFold 2's structure module moved residue frames with invariant point attention and predicted side chains as torsion angles: one deterministic answer. AlphaFold 3 "instead model[s] the system as a collection of atoms, which each have independent global coordinates without any rigid constraints between them" — which is what lets one network handle ligands, nucleic acids and modified residues — and "this is a generative training procedure that produces a distribution of answers."

<div class="da-in-gallery">In the gallery:
<a href="{{ g }}#rfdiffusion">RFdiffusion · frames, SE(3)</a><a href="{{ g }}#af3">AF3 · augmentation</a><a href="{{ g }}#esmfold2">ESMFold2 · + 3D RoPE</a>
</div>

Augmentation settles how the denoiser sees coordinates. What it should be told about them comes from the trunk, and the trunk's central object is the pair representation.
{: .da-bridge}

<h2 id="pair"><span class="num">12</span>The pair representation, the Pairformer and the MSA</h2>

{% include da-route.html at="trunk" note="We are in the trunk, which runs once per target. Its Pairformer builds the pair representation z that the denoiser later reads as attention biases." %}

What determines a structure is the relations between residues: which are in contact, at what distance, in what orientation. AlphaFold 2 made those relations a first-class object: a **pair representation** $$z_{ij}$$, one feature vector for every pair of tokens, alongside a single representation $$s_i$$ per token. Pair features are updated by **triangle operations**: to update $$z_{ij}$$, combine $$z_{ik}$$ and $$z_{jk}$$ over every third token $$k$$. If $$i$$ is close to $$k$$ and $$k$$ is close to $$j$$, then $$i$$ cannot be far from $$j$$; the triangle updates let the network enforce that kind of consistency.

{% include concept.html id="a12_pair_triangle" %}

### What has to be consistent: geometry, not biology

AlphaFold 3's supplementary information motivates the triangle operations in one sentence: they establish "a direct communication between the edges that connect 3 nodes … This allows the network to easily detect inconsistencies in its current belief about the spatial relationship and to update them accordingly" (SI §3.4). Consistent about *what*? Distances, or also properties like "this residue is part of the active site"?

The architecture itself does not say. $$z_{ij}$$ is 128 learned numbers per pair, and nothing in the network fixes what they mean. What they come to mean is set by what reads them during training, and every reader is geometric:

- a **distogram head** predicts, from $$z_{ij}$$ alone, a distribution over the distance between the representative atoms of tokens $$i$$ and $$j$$ (Cβ for amino acids, a ring carbon for nucleotides, the atom itself for ligands), trained with a cross-entropy loss;
- the **diffusion module** reads $$z$$ as attention biases and is trained to place atoms ([section 14](#atoms));
- the **confidence head** reads $$z$$ to predict distance and alignment errors.

So the pressure on $$z$$ is to hold whatever helps predict where tokens are relative to each other, and the consistency the triangles enforce is spatial. The cleanest version of the idea: relative positions compose. If $$z_{ik}$$ encoded the displacement from $$i$$ to $$k$$ and $$z_{kj}$$ the one from $$k$$ to $$j$$, then for *every* third token $$k$$

$$x_j - x_i = (x_k - x_i) + (x_j - x_k),$$

and a pair update that averages such compositions over $$k$$ could only make the estimate of $$x_j - x_i$$ more consistent. Distances obey the weaker triangle inequality, $$d_{ij} \le d_{ik} + d_{kj}$$. Neither rule is built in; the network learns its own soft version in 128 channels.

Biology enters as *evidence*, not as something that has to agree around triangles. Residue types, charges and, above all, co-evolution from the MSA ("these two positions mutate together, so they are probably in contact") are written into $$z$$ early; the triangles then propagate the geometric consequences. "Residue 37 is in the active site" is not a pairwise statement and nothing checks it around a triangle. "Residue 37 is close to residue 102, and 102 is close to the ligand atom" is, and it implies that 37 is near the ligand. A mechanistic study of ESMFold, a close relative, measured exactly this division of labour: in early blocks the pair representation picks up biochemical features such as charge from the sequence; in late blocks a *linear* read-out of $$z_{ij}$$ predicts the Cα distance with $$R^2 \approx 0.9$$, and scaling $$z$$ up or down makes the predicted protein expand or contract ([Lu et al., 2026](https://arxiv.org/abs/2602.06020)). That study probes ESMFold, not AlphaFold 3, and $$z$$ can of course carry more than distances — but its *purpose* in all these models is to be a geometric blueprint.

### Triangle multiplication, slowly

The first two operations of every Pairformer block are triangle multiplications. Take one pair $$(i, j)$$. For every third token $$k$$ there is a triangle $$i, j, k$$ whose other two edges are $$(i, k)$$ and $$(j, k)$$. The update reads both, multiplies them channel by channel, sums the products over all $$k$$, and adds the result — normalised, projected and gated — to $$z_{ij}$$:

$$z_{ij} \leftarrow z_{ij} + g_{ij} \odot W_o\,\mathrm{LN}\Big(\sum_{k} a_{ik} \odot b_{jk}\Big).$$

Here $$a$$ and $$b$$ are two gated linear projections of the (normalised) pair representation, so $$a_{ik}$$ is "what edge $$i \to k$$ contributes" and $$b_{jk}$$ "what edge $$j \to k$$ contributes". The trick is in the sum. Fix one of the 128 channels and collect $$a$$ for that channel into an $$N \times N$$ matrix $$A$$, and $$b$$ into $$B$$. Then the sum is the matrix product $$A B^\top$$: entry $$(i, j)$$ is the dot product of row $$i$$ of $$A$$ with row $$j$$ of $$B$$. It is large when $$i$$ and $$j$$ "say the same thing" about many third tokens — for instance, when both are in contact with the same set of residues.

{% include concept.html id="c05_trimul_anim" %}

That is the whole operation. There are two variants:

- **outgoing** combines the edges *leaving* $$i$$ and $$j$$, $$\sum_k a_{ik} \odot b_{jk}$$ (rows of the pair map);
- **incoming** combines the edges *arriving* at $$i$$ and $$j$$, $$\sum_k a_{ki} \odot b_{kj}$$ (columns).

The pair map is not symmetric — $$z_{ij}$$ and $$z_{ji}$$ are separate vectors, edges of a *directed* graph — so the two variants see different information. Incoming is simply outgoing applied to the transposed map.

{% include concept.html id="c01_tri_mult" %}

{% include da-svg.html file="triangle_mult.svg" title="Which entries feed one pair" caption="Top: the pair map; the dark cell (i, j) is rewritten from row i (blue) and row j (orange) for outgoing, from columns i and j for incoming, one product per third token k (outlined: one k). Bottom: the same as triangles — every third token k closes one, and the update sums over all of them." wide=true %}

Why should a matrix product of learned features help? A toy example makes it concrete. Take a 64-residue chain and keep only the information "these two residues are within 8 Å" — a contact map, the kind of thing co-evolution provides. Two simple operations on that map already recover most of the missing geometry. Counting shared neighbours, $$\sum_k A_{ik} A_{jk}$$ with $$A$$ the contact map, is exactly a one-channel outgoing update; pairs that share many neighbours turn out to be close even when they are not in contact themselves. And replacing (sum, product) by (minimum, sum) turns the same pattern into the triangle inequality, $$d_{ij} \le \min_k (d_{ik} + d_{kj})$$; applied a few times it bounds *every* distance from the contacts alone.

{% include media.html src="fig_triangle_toy2.webp" kind="figure" title="Why triangles: contacts become distances" caption="A toy chain of 64 residues. (1) Only contacts below 8 Å are known. (2) Applying the triangle inequality a few times bounds every distance; (3) the truth, for comparison. (4) Counting shared neighbours — a one-channel triangle multiplication — predicts how far apart two residues are even when they are not in contact. An analogy: the network learns its own update rule, in 128 channels." wide=true %}

Two more facts matter. The operation is **global after two steps**: if one entry $$z_{ab}$$ changes, the outgoing update changes everything in row and column $$a$$, and the incoming update that follows changes every entry of the map. And it is **cubic**: $$N^2$$ pairs each summing over $$N$$ third tokens, in 128 channels. For 1,000 tokens that is $$1.3 \times 10^{11}$$ multiply–adds per update, 96 updates per pass through the Pairformer.

{% include da-svg.html file="receptive.svg" title="How far one change travels" caption="Which entries of the pair map can change when a single entry z_ab changes. One outgoing plus one incoming update already reach all of it." wide=true %}

### Triangle attention

The next two operations do the same job with attention instead of a fixed sum. Pair $$(i, j)$$ attends over all pairs $$(i, k)$$ that start at the same token (4 heads, 32 channels each), and the *third* edge of each triangle, $$(j, k)$$, adds a learned bias to the attention logit:

$$a^h_{ijk} = \operatorname{softmax}_k\Big(\tfrac{1}{\sqrt{32}}\, q^{h\top}_{ij} k^h_{ik} + b^h_{jk}\Big), \qquad z_{ij} \leftarrow z_{ij} + \textstyle\sum_k a^h_{ijk} v^h_{ik} \text{ (gated, all heads)}.$$

The second variant attends over the pairs $$(k, j)$$ that end at the same token, with $$(k, i)$$ as the bias edge. The difference from multiplication: multiplication weights every $$k$$ by a fixed product of features, while attention lets the pair *choose* which third tokens to listen to, steered by the edge that closes the triangle. The AlphaFold 2 paper describes the multiplicative update as originally developed as a cheaper, more symmetric replacement for triangle attention, and reports that the combination of both is more accurate than either alone. It is also the most expensive operation in the model in practice: the attention weights are an $$N \times N \times N$$ tensor per head, 8 GB in bf16 for 1,000 tokens if held at once, which is why every implementation chunks it or uses fused kernels. ESMFold2 found it unnecessary at matched compute and dropped it.

{% include da-svg.html file="triangle_attn.svg" title="Triangle attention: keys, values and the bias edge" caption="Starting node (left): pair (i, j) attends over row i (blue: keys and values), each weight shifted by the third edge in row j (dashed orange). Ending node (right): over column j, shifted by column i. Below, the same as triangles; the dashed edge only biases, it is not read." wide=true %}

Where do the first pair features come from? Mostly from evolution. A **multiple sequence alignment** stacks the sequences of related proteins; positions that are in contact tend to mutate together. AlphaFold 3's MSA module turns that co-variation into pair features with an outer-product mean over the alignment's rows, and passes information back with pair-weighted averaging (8 heads) instead of AlphaFold 2's row attention.

{% include concept.html id="b02_msa_opm" %}

The numbers, from AlphaFold 3's supplementary information: up to 16,384 alignment rows, of which up to 8,191 are paired across chains by species; a 4-block MSA module with $$c_m = 64$$; a 2-block template embedder; then the **Pairformer**, 48 blocks of triangle multiplication (outgoing and incoming), triangle attention (starting and ending node, 4 heads), pair transition, single attention with pair bias (16 heads) and single transition, on $$s$$ with $$c_s = 384$$ and $$z$$ with $$c_z = 128$$. Unlike AlphaFold 2's Evoformer, information flows only from pair to single: the MSA is gone from the trunk after the MSA module. The triangle operations cost $$\mathcal O(N^3)$$ in the number of tokens, which makes the Pairformer the expensive part of the model.

### One Pairformer block, end to end

Put together, one Pairformer block (AlphaFold 3's Algorithm 17) is seven residual updates in a fixed order — five on the pair track, then two on the single track:

1. **triangle multiplication, outgoing** — every pair hears from the edges leaving its two tokens;
2. **triangle multiplication, incoming** — and from the edges arriving at them;
3. **triangle attention, starting node** — every pair chooses which edges at its first token to listen to;
4. **triangle attention, ending node** — and at its second token;
5. **pair transition** — a feed-forward layer (SwiGLU, 128 → 512 → 128) on each pair on its own, which mixes channels but not pairs;
6. **single attention with pair bias** — 16-head attention over tokens, where $$z_{ij}$$ adds one number per head to the logit of token $$i$$ attending to token $$j$$;
7. **single transition** — a feed-forward layer on each token.

*Residual* means each step adds a correction to what is already there ($$z \leftarrow z + f(z)$$) instead of replacing it, so 48 blocks refine one picture gradually rather than redrawing it 48 times. During training the first four steps use a dropout whose mask is shared along rows (or, for the ending-node attention, along columns) of the pair map, a regulariser inherited from AlphaFold 2.

{% include da-svg.html file="pairformer_block.svg" title="One Pairformer block, simplified" caption="Read from the bottom up. Five residual updates on the pair track, the first four cubic in the number of tokens; then two on the single track, which reads z only through the attention bias. Nothing flows from s back into z. The block repeats 48 times with separate weights." wide=true %}

{% include concept.html id="c06_pairformer_block_anim" %}

{% include concept.html id="c02_pairformer_block" %}

The order is the design. The pair track goes first and the single track then *reads* it through the attention bias, but nothing flows back: there is no step that writes $$s$$ into $$z$$. AlphaFold 2's Evoformer had one (the outer-product mean); AlphaFold 3 moved it into the MSA module before the Pairformer. Within the Pairformer the pair map is the main object, and the single representation is a by-product read off it. That is also how the result is used downstream: the denoiser gets $$z$$ as attention biases and $$s$$ through adaptive LayerNorm, at every one of its 200 calls.


What does it cost? Per block, the four triangle operations need about $$1{,}500\,N^3$$ floating-point operations against roughly $$10^6\, N^2$$ for all the linear layers together; the cubic part dominates above about 700 tokens. Measured on an H100 for complexes of 2,157 tokens, triangle attention alone takes 22 % of Boltz-2's total GPU time and 46 % of OpenFold3's.

The successors disagree about how much of this is needed. Boltz-2 deepens the Pairformer to 64 blocks. Protenix-v2 doubles the pair width to $$c_z = 256$$. ESMFold2 removes the single track and triangle attention altogether: "we find that the removal of sequence-wise residual stream does not degrade performance, and that triangle attention is unnecessary when models are compute matched." It replaces the MSA with a 6-billion-parameter protein language model and keeps the MSA optional.

The Pairformer produces s and z, but only once per target. The next section is the hand-over: how the trunk's output becomes the condition c that the denoiser reads at every one of its steps.
{: .da-bridge}

<h2 id="trunk"><span class="num">13</span>The trunk, recycling and the denoiser</h2>

{% include da-route.html at="trunk,cond" note="The hand-over: the trunk's output c = (s, z) is computed once and then given to the denoiser, unchanged, at every one of its 200 calls." %}

In AlphaFold 3 the diffusion module is a head on a large **trunk**. The trunk embeds the input (sequences, ligands, an MSA, templates), runs the MSA module and the Pairformer, and then feeds its own output back through itself — **recycling** — before handing over $$c = (s, z)$$. AlphaFold 3's Algorithm 1 defaults to 4 cycles, its timing table uses 10; Boltz-2 uses 4 passes by default, Protenix 10. In training, gradients flow only through the last pass.

{% include concept.html id="b01_recycling" %}

That happens once per target. The denoiser $$D_\theta(x, \sigma \mid c)$$ then runs 200 steps for every sample, receiving the same $$c$$ at every step.

{% include concept.html id="a13_trunk_loop" %}

{% include concept.html id="g03_params" %}

The split resembles a text-to-image model, where the text encoder also runs once per prompt. The difference is in how much of the answer the condition already contains. A CLIP embedding of "a fox" says nothing about where the fox stands. The trunk's pair representation is trained, among other things, to predict a distogram — a distribution over the distance between every pair of tokens — so by the time the denoiser starts, $$c$$ already encodes most of the geometry. The denoiser's job is closer to *rendering* a structure the trunk has worked out than to generating one from scratch.

The same split shapes training. Running the trunk is expensive and the denoiser is cheap, so AlphaFold 3 reuses one trunk pass for 48 independently noised copies of each structure (32 in fine-tuning): 12,288 denoiser training examples per optimiser step at batch size 256.

{% include concept.html id="b07_multiplicity" %}

<div class="da-in-gallery">In the gallery:
<a href="{{ g }}#af3">AF3</a><a href="{{ g }}#boltz2">Boltz-2</a><a href="{{ g }}#openfold3">OpenFold3</a><a href="{{ g }}#protenix">Protenix</a><a href="{{ g }}#esmfold2">ESMFold2 · LM instead of MSA</a>
</div>

We have followed the condition up to the denoiser's door. Inside, the denoiser has to turn tens of thousands of noisy atom positions into a better guess, and it does so at two resolutions.
{: .da-bridge}

<h2 id="atoms"><span class="num">14</span>Atoms and tokens</h2>

{% include da-route.html at="denoiser,enc,tok,dec" note="Inside one denoiser call: atoms in, tokens in the middle, atoms out." %}

A co-folding model has to place every atom, but attention over tens of thousands of atoms is too expensive. AlphaFold 3 works at two resolutions. A **token** is a standard residue or nucleotide; modified residues and all ligands are tokenised per atom. The denoiser's **atom encoder** (3 blocks, 4 heads, 128 channels per atom and 16 per atom pair) runs attention between atoms in local windows — blocks of 32 query atoms see 128 neighbouring key atoms — and averages each token's atoms into a 768-channel token vector. The **token transformer** (24 blocks, 16 heads) attends globally over tokens, with AdaLN from $$s$$ and pair bias from $$z$$. The **atom decoder** (3 blocks) broadcasts tokens back to atoms, runs local attention again, and predicts a position update for every atom.

{% include concept.html id="a14_atoms_tokens" %}

### Is the transformer sandwiched between an encoder and a decoder?

Yes. Inside every call of the denoiser the order is fixed: **atom encoder → token transformer → atom decoder**, with skip connections from the encoder to the decoder.

1. The **atom encoder** (3 blocks) works on atoms. It builds per-atom features from the reference conformer and the trunk's single representation, per-atom-pair features from reference distances and the trunk's pair representation, adds the noisy coordinates through one linear layer — the only place the structure itself enters — and runs local attention. Then it averages each token's atoms into one 768-number token vector.
2. The **token transformer** (24 blocks) works on tokens and sees the whole complex at once, with the pair biases and the AdaLN modulation described above.
3. The **atom decoder** (3 blocks) copies each token vector back to that token's atoms, adds the encoder's atom features through the skip connection, runs local attention again and outputs a position update for every atom.

The "bread" is thin: the encoder and decoder have about one million parameters each, the token transformer 198 million (in the PyTorch reproductions), and the token transformer takes 70–90 % of a denoiser call's GPU time. Two things are easy to confuse here. The trunk with its Pairformer is *not* the encoder: it runs once per target, outside the denoiser. And AlphaFold 3 has a second atom encoder at the very start of the trunk, the same algorithm without noisy coordinates, which turns the input atoms into the first token features.

{% include da-svg.html file="denoiser_sandwich.svg" title="One denoiser call, simplified" caption="Read from the bottom up. The noisy atom positions enter once, through the encoder; the token transformer in the middle does almost all of the work, steered by the pair bias from z and the AdaLN modulation from s and the noise level; the decoder turns tokens back into a position update for every atom. Two skip connections: atom features from the encoder to the decoder, and the noisy input itself to the output." wide=true %}


This is the U-Net idea in a different form: local detail at the fine level, global reasoning at the coarse level, and a path back down.

### Inside one token-transformer block

The token transformer is where the denoiser does its work, so it is worth opening one of its 24 blocks. It has the shape of a DiT block ([section 5](#noise-level)) with one addition, and every part of it is a place where the condition $$c$$ enters.

{% include da-svg.html file="token_block.svg" title="One token-transformer block" caption="Read from the bottom up. Two residual sub-layers, each wrapped in AdaLN before and a gate after; both are steered by the single conditioning s (orange, dashed), and the attention also by the pair representation z (right). The block repeats 24 times with separate weights." wide=true %}

Follow one token vector $$a_i$$ (768 numbers) through the block:

1. **Adaptive LayerNorm.** $$a_i$$ is normalised, then scaled and shifted by amounts computed from $$s_i$$: $$\operatorname{AdaLN}(a, s) = \sigma(W_1 \bar s) \odot \operatorname{LN}(a) + W_2 \bar s$$. Because $$s$$ carries the trunk's view of token $$i$$ *and* the Fourier code of the noise level, this is where the block learns to behave differently at 500 Å and at 0.5 Å.
2. **Attention with pair bias.** The normalised vectors attend to each other, 16 heads of 48 channels, over all tokens of the complex — next figure.
3. **Gate and add.** The attention output is multiplied by a gate $$\sigma(W s_i + b)$$ whose bias starts at −2, so every block begins close to doing nothing, and added back: $$a \leftarrow a + \text{gate} \odot \text{attention}$$.
4. **Transition.** The same three steps around a SwiGLU feed-forward layer (768 → 1536 → 768), which works on each token separately.

{% include da-svg.html file="attn_pair_bias.svg" title="Attention with pair bias, inside" caption="Per head: queries, keys and values are linear maps of the normalised token vectors; the logit of token i attending to token j is the content term q_i · k_j / √48 plus a bias computed from the trunk's z_ij. Softmax over j, a weighted sum of values, a sigmoid gate, and the 16 heads are concatenated and projected back to 768." wide=true %}

The pair bias is the important line. The content term $$q_i \cdot k_j$$ says "token $$j$$ looks like what token $$i$$ is looking for", computed from the current, noisy state. The bias $$b^h_{ij}$$ says "the trunk thinks $$i$$ and $$j$$ belong together", computed once from $$z$$ and identical at every step. The two are simply added before the softmax. Where the trunk is confident, the bias dominates and attention follows the trunk's map whatever the noisy input says; where it is not, the content term decides. How much the denoiser listens to $$x$$ and how much to $$c$$ is decided, head by head and layer by layer, in this sum.

The same operation, with a plain LayerNorm instead of AdaLN and without the output gate, is the single attention of every Pairformer block ([section 12](#pair)). The trunk and the denoiser use one attention mechanism; they differ in what goes in.

### The atom encoder and decoder

The atom transformers on either side of the token transformer are the same block type at a different scale: 3 blocks each, 4 heads, 128 channels per atom instead of 768 per token, and *local* attention.

{% include da-svg.html file="atom_windows.svg" title="Local attention between atoms" caption="Atoms are processed in blocks of 32; each block attends to the 128 atoms around it (shaded), with a bias p_lm built from the reference conformer and from z of the atoms' tokens. The encoder then averages each token's atoms into one token vector; the decoder copies token vectors back and runs the same windows again." wide=true %}

Local attention is what makes atoms affordable: a complex of 1,000 residues has about 8,000 atoms, and full attention between them would need 64 million weights per head and layer; windows of 128 need one million. The windows are defined on the order of atoms in the input, which follows the sequence, so they capture covalent neighbours and the residue's own side chain, not spatial neighbours — those are the token transformer's job. ESMFold2 keeps the idea with a sliding window of 128 atoms, drops the atom-pair bias and adds rotary position encodings computed from the reference conformer. ESMFold2 keeps the hierarchy but changes both levels. Its atom attention drops the 32 × 128 blocks and the explicit atom-pair tensor — "a key bottleneck of the diffusion module" — for a sliding window of 128 atoms with FlashAttention and rotary position encodings computed from each molecule's reference conformer, and its token transformer has 12 blocks instead of 24.

Before the AlphaFold 3 family, one model had already turned a structure predictor into a denoiser, and it anticipates the architecture of Part IV.
{: .da-bridge}

<h2 id="rfdiffusion"><span class="num">15</span>RFdiffusion: a structure predictor turned denoiser</h2>

{% include da-svg.html dir="diffusion-gallery" file="rfdiffusion.svg" title="RFdiffusion at a glance" caption="The gallery's drawing of RFdiffusion. The interactive version, with shapes and sources for every block, is in the gallery." %}

RFdiffusion (Watson et al., 2023) came before AlphaFold 3 and solves a different problem — designing new protein backbones rather than predicting the structure of given sequences — but it established the move the co-folding models later made: start from a network that already knows what proteins look like, and teach it to denoise.

- **State.** One rigid frame per residue: the Cα position and the N–Cα–C orientation. Translations are noised with DDPM-style Gaussian noise ($$T = 200$$, linear $$\beta$$ from 0.01 to 0.07 on coordinates scaled by 1/4); orientations with Brownian motion on SO(3), whose marginal is the IGSO(3) distribution. The sequence is masked; ProteinMPNN designs it afterwards.
- **Network.** The three-track RoseTTAFold (1D, 2D pair, 3D structure with SE(3)-equivariant layers), "fine-tuned with minimal architectural changes", from the final RoseTTAFold weights, without recycling. Converged in 5 epochs, 3 days on 8 A100s.
- **Pretraining is decisive.** Trained for the same time from random weights, the model had zero design success; from RoseTTAFold weights it worked ($$z = 23.0$$, $$p = 3.1\times10^{-117}$$, Extended Data Fig. 1). "Without pre-training … RFdiffusion outputs bear little resemblance to proteins."
- **Self-conditioning.** The previous step's prediction $$\hat x^{(0)}$$ is fed back through the template track: $$z = 11.4$$, $$p = 6.1\times10^{-30}$$ over 800 designs per condition, and successive predictions become more coherent.
- **Loss.** Unaligned frame MSE instead of AlphaFold's FAPE, because "unlike FAPE, m.s.e. loss is not invariant to the global reference frame and therefore promotes continuity of the global coordinate frame between timesteps."
- **Sampling.** 200 steps by default; a 100-residue design can be made in 15 steps (about 11 s) with over 60 % in-silico success.
- **Conditioning.** Motifs fixed in the input, hotspot flags for binders, secondary structure and block adjacency for fold control — new channels added with zero-initialised weights, so that "the model gives exactly the same output as unmodified RF with the initial weights".

One detail of its sampler is worth noting. RFdiffusion can scale down the noise added at each reverse step. Doing so "improves design quality, at the expense of design diversity": in 17 of 23 motif-scaffolding problems success was higher with no noise at all, while the number of distinct structural clusters fell (Extended Data Fig. 1i). A colder sampler trades diversity for success, the same trade as guidance.

<div class="da-in-gallery">In the gallery:
<a href="{{ g }}#rfdiffusion">RFdiffusion</a>
</div>

Every piece is now on the table. Part IV assembles them — first AlphaFold 3 in full, then each successor — and asks at every station what changed.
{: .da-bridge}

<p class="da-part">Part IV<strong>The AlphaFold 3 family, model by model</strong></p>

{% include da-route.html note="Where we are: the whole path at once. AlphaFold 3 first, every station in full; then each successor, and which stations it changed." %}

<h2 id="af3"><span class="num">16</span>AlphaFold 3 in full</h2>

{% include da-svg.html dir="diffusion-gallery" file="af3.svg" title="AlphaFold 3 at a glance" caption="The gallery's drawing of AlphaFold 3. Trunk on the left, run once per target; denoiser on the right, run at every step. The interactive version, with shapes and sources for every block, is in the gallery." %}

Abramson et al., *Nature* 2024 (Google DeepMind and Isomorphic Labs). The baseline everything else in this part is measured against.

**Input.** Proteins, DNA, RNA, ligands (SMILES or CCD codes), ions and modifications. Every atom gets a reference conformer from RDKit; per-atom features pass through a 3-block atom transformer into per-token features. Genetic search over UniRef90, UniProt, BFD, MGnify and others gives up to 16,384 MSA rows; up to 4 single-chain templates. No other conditioning; a separate model fine-tuned with pocket features was used for pocket-specified ligand benchmarks.

**Trunk.** As in [section 12](#pair): 4 MSA blocks, 2 template blocks, 48 Pairformer blocks, $$c_s = 384$$, $$c_z = 128$$, recycled. The paper does not state a parameter count; Protenix quotes "about 386 million" for the whole model.

**Diffusion module.** Conditioning (pair: trunk pair plus relative position, two transitions; single: trunk single plus input features plus a Fourier embedding of the noise level, two transitions), a 3-block atom encoder, a 24-block token transformer with 16 heads at width 768, a 3-block atom decoder, wrapped in EDM preconditioning with $$\sigma_\text{data} = 16$$ Å.

**Training.**

{% include concept.html id="f06_af3_loss" %}

| Stage | Crop (tokens) | Diffusion copies | Samples | Days on 256 A100 | Notes |
|---|---|---|---|---|---|
| initial | 384 | 48 | ≈ 20 M | ≈ 10 | bond loss off |
| fine-tune 1 | 640 | 32 | ≈ 1.5 M | ≈ 3 | bond loss on, smooth lDDT off |
| fine-tune 2 | 768 | 32 | ≈ 1.5 M | ≈ 5 | |
| fine-tune 3 | 768 | 32 | ≈ 1.8 M | ≈ 2 | PAE head only |

Data: PDB entries before 30 September 2021 (2019 for the PoseBusters model), mixed with AlphaFold 2 predictions of ≈ 41 M MGnify proteins (weight 0.495), disordered-region distillation from AlphaFold-Multimer, and AF3-predicted RNA and transcription-factor complexes. The disorder distillation matters: without it, the model hallucinates compact structure in disordered regions.

**Confidence.** A 4-block Pairformer reads the trunk outputs plus the distances of a predicted structure and outputs pLDDT (50 bins per atom), PAE and PDE (64 bins each) and a resolved flag. The structure it is trained on comes from a 20-step **mini-rollout** of the sampler, run without gradients, so the head learns how wrong the denoiser's own samples are.

{% include concept.html id="b05_confidence_rollout" %}

Samples are ranked by $$0.8\,\text{ipTM} + 0.2\,\text{pTM} + 0.5\,\text{disorder} - 100\,\text{clash}$$. The default protocol is 5 model seeds × 5 diffusion samples, top-1 by that score.

**Results.** PoseBusters V2 ligands within 2 Å: 80.5 %. Protein–antibody DockQ > 0.23: 62.9 % at 1,000 seeds against 29.6 % for AlphaFold-Multimer 2.3. On the independent FoldBench, antibody–antigen 47.9 %, protein–protein 72.9 %, protein–ligand 64.9 % (as recomputed in the Protenix-v1 report). Antibody success climbs from about 40 % at one seed to about 60 % at 1,000.

**Stated limitation.** "Multiple random seeds for either the diffusion head or the overall network do not produce an approximation of the solution ensemble."

That is the network. What it produces depends just as much on how it is sampled, so before the successors, AlphaFold 3's sampler gets a section of its own.
{: .da-bridge}

<h2 id="af3-sampler"><span class="num">17</span>AlphaFold 3's sampler</h2>

{% include da-route.html at="sampler" note="The sampler step wraps every denoiser call: it adds noise, asks the denoiser, and moves towards its answer." %}

AlphaFold 3 samples with a stochastic variant of EDM's sampler (SI Algorithm 18), with Euler steps rather than Heun's. Each step first applies a random rotation and translation, then *raises* the noise level slightly and injects fresh noise (churn), then takes an Euler step toward the denoiser's prediction. Two constants make it unusual: the injected noise is scaled by $$\lambda = 1.003$$, and the Euler step by $$\eta = 1.5$$, so each step overshoots toward the prediction.

{% include concept.html id="b08_af3_step" %}

{% include concept.html id="f05_sampler" %}

{% include concept.html id="g04_schedule" %}

{% include media.html film="abag_putty_noise" title="A sampling trajectory on a real complex" caption="An AF3-style stochastic sampler (Algorithm 18's constants, 50 steps here) run on the antibody–antigen complex above, one seed. The tube is the noisy state itself; its width is how far each residue still is from the denoiser's prediction, so the chain thins as σ falls. Simulated with a mock sampler; no trained network is involved." %}

Compare the churn with EDM's. EDM caps $$\gamma$$ at $$\sqrt2 - 1 \approx 0.41$$ and tunes it per dataset; with EDM's own training on CIFAR-10 "any amount of stochastic sampling was detrimental". AlphaFold 3 uses $$\gamma_0 = 0.8$$ above $$\sigma = 1$$ Å, so each churned step injects more new noise than is already present, and then over-steps by 1.5. Over-stepping toward the denoiser's output is equivalent to scaling up the score: a low-temperature bias. The sampler is deliberately set to prefer the most likely structure over a faithful draw from the model's distribution. That is a reasonable choice for structure prediction, where one good structure is the goal. It also means that a lack of diverse samples can come from the sampler, not only from the network.

How the successors set these constants:

| | $$\gamma_0$$ | $$\gamma_\text{min}$$ | $$\lambda$$ | $$\eta$$ | $$s_\text{min}$$ | $$\rho$$ | start | steps |
|---|---|---|---|---|---|---|---|---|
| AlphaFold 3 | 0.8 | 1.0 | 1.003 | 1.5 | 4 × 10⁻⁴ | 7 | 2560 Å | 200 |
| Boltz-1 (code) | 0.605 | 1.107 | 0.901 | 1.638 | 4 × 10⁻⁴ | 8 | 2560 Å | 200 |
| Boltz-2 | 0.8 | 1.0 | 1.003 | 1.5 | 10⁻⁴ | 7 | 2560 Å | 200 |
| OpenFold3 (code) | 0.8 | 1.0 | 1.003 | 1.5 | 4 × 10⁻⁴ | 7 | 2560 Å | 200 |
| Protenix v1 | 0.8 | 1.0 | 1.003 | 1.5 | 4 × 10⁻⁴ | 7 | 2560 Å | 200 |
| ESMFold2 (paper) | 0.8 | 1.0 | 1.003 | 1.5 | 4 × 10⁻⁴ | 7 | 256 Å | 68 |

Boltz-2's table caption says it: "with the exception of sigma min we opted for AlphaFold3's default hyperparameters". ESMFold2 is the one model that questioned the schedule. It discards every level above 256 Å, the "initial high-noise portion of the schedule where $$\sigma \gg \sigma_\text{data}$$ and the signal-to-noise ratio is negligible … effectively wasted computation", which removes a third of the steps; "we observed no benefit of increased sampling steps."

AlphaFold 3 was released without training code, and its weights only on request for non-commercial use, so others rebuilt it. Each reproduction is a set of decisions about the stations we have seen; read them against the route.
{: .da-bridge}

<h2 id="boltz1"><span class="num">18</span>Boltz-1</h2>

Wohlwend, Corso, Passaro et al., MIT, November 2024: the first fully open (MIT-licensed) reproduction, with training code, weights and data. It starts from the AlphaFold 3 supplementary information and states its changes as "changes to the flow of the representations in the architecture and the diffusion training and inference procedures":

- **Residuals in the token transformer.** On AF3's Algorithm 23, which as printed has no residual around attention: "it lacks residual connections that may make backpropagation more complex." Boltz-1 adds them. Every later reproduction does the same ([section 24](#errata)).
- **Loss weight** changed to EDM's $$(\hat t^2 + \sigma_\text{data}^2)/(\hat t\,\sigma_\text{data})^2$$.
- **MSA module reordered** (pair-weighted averaging, MSA transition, outer-product mean, triangle updates, pair transition) and a new **dense taxonomy pairing** algorithm for multimer MSAs from ColabFold searches.
- **No templates**, "due to their limited impact on the performance of large models".
- **Pocket conditioning in the same model**: a one-hot token feature marking binder and pocket residues, revealed in 30 % of training iterations — one model instead of AF3's separate fine-tune.
- **Kabsch alignment during sampling** of the noisy structure onto the prediction before each step. The authors' reasoning: "one can define simple functions that would achieve zero rigid aligned MSE loss during training, but completely fail to sample realistic poses at inference time." They also note it was "not critical" for the final model.
- **Caching**: all attention biases of the denoiser and the atom-level representations depend on neither structure nor noise level, so they are computed once and shared across samples and steps.
- **Confidence**: a full copy of the trunk (48-layer Pairformer) initialised from the trunk weights and fed an aggregate of the denoiser's activations along the trajectory — accurate but expensive.
- **Training**: 68k steps at batch 128, crops of 384 then 512 tokens, PDB plus ≈ 270k OpenFold distillation structures; the authors estimate about a quarter of AF3's compute. The sampler constants in the released code (table above) are tuned rather than AF3's.

Boltz-1 reproduced AlphaFold 3. Boltz-2 kept its denoiser unchanged and changed what goes into the condition.
{: .da-bridge}

<h2 id="boltz2"><span class="num">19</span>Boltz-2</h2>

{% include da-svg.html dir="diffusion-gallery" file="boltz2.svg" title="Boltz-2 at a glance" caption="The gallery's drawing of Boltz-2. Trunk on the left, run once per target; denoiser on the right, run at every step; magenta outlines mark what differs from AlphaFold 3. The interactive version, with shapes and sources for every block, is in the gallery." %}

Passaro, Corso, Wohlwend et al., MIT and Recursion, June 2025. Same denoiser — "We used the same denoising module as Boltz-1", trained in float32 "due to instabilities observed at lower precision" — but nearly everything around it changes. The stated goal: "to expose Boltz-2 not only to single equilibrium points from crystal structures but also to local fluctuations and global structural ensembles."

**Trunk.** 64 Pairformer blocks instead of 48 (197 M parameters in the released checkpoint), trained in bfloat16 with fused triangle kernels and crops up to 768 tokens. A B-factor head on the trunk's single representation. Non-canonical residues stay single tokens.

**Denoiser.** 294 M parameters against 203 M in OpenFold3 and Protenix, at the same depth and width. The difference sits in the token transformer (283 M against 198 M); in the code its AdaLN conditions on a 768-channel single representation rather than 384. All per-layer pair biases are precomputed once per target and cached.

**New conditioning.**
- **Method**: a one-hot of X-ray, cryo-EM, NMR, molecular dynamics, or distillation source, on every token. Asking for "MD" doubles structural diversity on mdCATH, mean pairwise $$1 - \text{lDDT}$$ from 0.06 to 0.12 — against 0.32 for the real MD ensembles.
- **Multimeric templates**, 0–4 per chain, optionally enforced during sampling.
- **Contacts and pockets** as pair features, with a distance threshold between 4 and 20 Å.

**Data.** PDB before 1 June 2023 — later than everyone else, which makes Boltz-2 temporally leaky on benchmarks built after 2021 — plus AFDB distillation, Boltz-1 distillation, and molecular dynamics from MISATO (11,235 systems), ATLAS (1,284) and mdCATH (5,270). For MD data the trunk's distogram target aggregates the conformers while the denoiser sees one random conformer per iteration. Training in four stages with crops of 384, 512, 640, 768 tokens; 32 diffusion copies per trunk pass.

**Steering (Boltz-2x).** Feature conditioning alone is soft — "the model sometimes takes samples that do not respect these conditions" — so Boltz-2 adds inference-time **steering potentials** from Boltz-1x: physical penalties (clashes, bond lengths and angles, chirality, stereochemistry, planarity) plus contact and template potentials, applied as gradient steps on the prediction and combined with Feynman–Kac resampling of particles. Physical validity on its PDB-2024 test set rises from 0.38 to 0.94.

{% include concept.html id="b03_steering" %}

**Confidence and affinity.** An 8-block confidence Pairformer (25 M parameters) replaces Boltz-1's full trunk copy, ranking by $$(4\,\overline{\text{pLDDT}} + \text{ipTM})/5$$. And an **affinity module**: the trunk's pair representation, restricted to protein–ligand and intra-ligand pairs and combined with the distogram of the best predicted pose, goes through its own Pairformer and two heads — binding probability and an IC50-like affinity — as an ensemble of two models. On a four-target FEP+ subset it reached Pearson 0.66 against FEP+'s 0.78, at about 20 GPU-seconds per ligand.

{% include concept.html id="b06_affinity" %}

**Results.** On its 2,315-target PDB-2024 set: protein–protein DockQ > 0.23 0.73 (AF3 0.76), ligand–protein lDDT 0.68 (AF3 0.73). On its antibody benchmark 0.37 against AF3's 0.49. Its own limitation: "the model still often fails to capture large conformational changes, such as those that can be induced by binding."

Where Boltz changed the model, OpenFold3 set out to reproduce AlphaFold 3 as written — which makes it the clearest test of what the supplementary information actually specifies.
{: .da-bridge}

<h2 id="openfold3"><span class="num">20</span>OpenFold3</h2>

{% include da-svg.html dir="diffusion-gallery" file="openfold3.svg" title="OpenFold3 at a glance" caption="The gallery's drawing of OpenFold3. Trunk on the left, run once per target; denoiser on the right, run at every step; magenta outlines mark what differs from AlphaFold 3. The interactive version, with shapes and sources for every block, is in the gallery." %}

The OpenFold Consortium's reproduction, released under Apache 2.0 with training code and the full training and distillation data. Its preview-2 report has no architecture section; everything architectural below is read from the code.

- **Architecture**: AF3's widths and depths ($$c_s = 384$$, $$c_z = 128$$, 48 Pairformer blocks, 24 × 16 × 768 token transformer), 368 M parameters in total, denoiser 203 M. The token transformer carries the comment "Differs from SI, residual connection added". The conditioning is recomputed at every denoiser call, and a `use_conditioning` flag can switch the trunk input off entirely.
- **Training**: AF3's SI hyperparameters on 256 H100s, 155k steps over three stages, each stopped at an apparent maximum of the selection metric. "Unlike AF3, we did not perform an additional fine-tuning stage 3 but instead trained the PAE confidence head from the start." Distillation: ≈ 13 M MGnify monomers predicted twice with OpenFold weights, plus ≈ 125k RNA structures.
- **Sampler**: AF3's Algorithm 18 with AF3's constants. From v0.4.5, a `pocket_sampling` mode re-noises a chosen sample to $$\sigma \approx 2.4$$ Å and re-enters the loop.
- **Results**: FoldBench protein–protein ≈ 0.71 (AF3 0.73). On AF3's antibody set, ranked acceptable success goes from 0.21 at one seed to 0.37 at 1,000, while the *oracle* (best sample, not best-ranked) reaches 0.72. The report's reading: "the underlying generator … is capable of producing high-quality samples, but can fail to select them in the confidence-based ranking step." And: "no reproduction has fully matched AF3's performance on all modalities."
- **OpenBind** (August 2026) retrains on the PDB through June 2025 and fixes several reproduction bugs, including moving a pair LayerNorm "to match the AF3 SI".

Protenix took the same goal further: it documented, one by one, the places where the supplementary information and a working model diverge, and then went beyond AlphaFold 3 with v1 and v2.
{: .da-bridge}

<h2 id="protenix"><span class="num">21</span>Protenix, v1 and v2</h2>

{% include da-svg.html dir="diffusion-gallery" file="protenix.svg" title="Protenix at a glance" caption="The gallery's drawing of Protenix. Trunk on the left, run once per target; denoiser on the right, run at every step; magenta outlines mark what differs from AlphaFold 3. The interactive version, with shapes and sources for every block, is in the gallery." %}

ByteDance's PyTorch reproduction, Apache 2.0 up to v1.

**Protenix (2024)** documented the AlphaFold 3 SI most carefully, including a table of its typos ([section 24](#errata)). Its changes: residuals in the token transformer ("the model does not converge well if residual connection is missing"), EDM's loss weight, the corrected Euler step, zero-initialised AdaLN and recycling layers that "help prevent dimensional collapse in the network weights", and extra normalisation in the confidence head because its loss "does not converge as effectively when implemented exactly as described". No templates and no RNA MSA; training on 192 GPUs for about two weeks.

**Protenix-v1 (February 2026)** claims to be "the first fully open-source structure prediction model to attain superior performance to AlphaFold3 while strictly adhering to the same training data cutoff, model size, and inference budget." It adds templates — "template features lead to more stable model activations during training" — and RNA MSAs, keeps AF3's sizes (368 M parameters; denoiser 203 M with cached conditioning), runs 10 recycles, and trains on ≈ 13 M distilled MGnify structures. On FoldBench, recomputed on the common set of targets all models predicted, antibody–antigen success is 52.3 % against AF3's 48.8 %; protein–protein 72.7 against 71.7; protein–DNA lower, 69.1 against 75.9. The report also shows how noisy such numbers are: the 95 % interval of a single 5 × 5 run spans 49.3–56.3 %.

Two details matter for diversity. First, what a "seed" changes: in Protenix-v1 each seed resubsamples the MSA depth uniformly and, with probability 0.4, applies dropout to the recycled pair representation — so seeds vary the *condition*, not only the starting noise. Second, the payoff: antibody success rises from 36.0 % at one seed to 47.7 % at 80. The authors name "distillation of these high-quality sampling signals into the base model" as future work.

**Protenix-v2 (April 2026)** widens the pair track ($$c_z = 256$$, $$c_m = 128$$; 464 M parameters), trains with 64 diffusion copies, and adds training-free guidance during sampling — chirality, planarity, torsions, distances and a Vina steric term — which raises ligand success with physical validity from 48.4 % to 61.1 % for v1 and to 60.5 % for v2. It claims antibody gains of 9–13 points over v1, and that "Protenix-v2 at only 5 seeds already exceeds the performance of Protenix-v1 at 1000 seeds". Its weights are proprietary.

All the reproductions so far keep AlphaFold 3's trunk. ESMFold2 is the one that replaces it.
{: .da-bridge}

<h2 id="esmfold2"><span class="num">22</span>ESMFold2</h2>

{% include da-svg.html dir="diffusion-gallery" file="esmfold2.svg" title="ESMFold2 at a glance" caption="The gallery's drawing of ESMFold2. Trunk on the left, run once per target; denoiser on the right, run at every step; magenta outlines mark what differs from AlphaFold 3. The interactive version, with shapes and sources for every block, is in the gallery." %}

Candido, Hayes, Derry et al. (Biohub), June 2026, MIT-licensed. The most different member of the family:

- **Trunk**: a frozen 6-billion-parameter ESM C language model encodes each chain; all 80 layers are mixed into a 256-channel pair representation. A **pair-only** stack of 48 layers (triangle multiplication and transitions, no single track, no triangle attention) runs as a contractive recurrence, $$z_{t+1} = \operatorname{PairLayers}(\bar A \odot z_t + \bar B\, \operatorname{LN}(u_t))$$ with eigenvalues of $$\bar A$$ in (0, 1), in place of recycling: 1–6 loops in training, 10 in the paper's benchmarks. The MSA is optional (4 layers, depth ≤ 1,024).
- **Denoiser**: 12 token-transformer blocks at width 768 (120 M of 131.5 M parameters), conditioned on input features and the noise level only — no trunk single representation — with pair bias from $$z$$; sliding-window atom attention with 3D RoPE and no atom-pair tensor.
- **Training**: 30 % PDB and 70 % AlphaFold-database distillation in every stage; 256 H100s for 127 hours. Smooth lDDT in the first stage only: "vital for global folding accuracy, but detrimental for all-atom quality".
- **Sampler**: AF3's constants from 256 Å, 68 steps in the paper; per-step Kabsch alignment.
- **Results**: FoldBench antibody–antigen 50 % from sequence alone and 53 % with an MSA, against AF3's 47 %; protein–protein 76 % with MSA against 73 %. 1.3× faster than AF3 at 1,024 residues.

On seeds: "We observed MSA input diversity to be critical for inference-time scaling of ESMFold2." Antibody success rises from 49 % at one seed to 65 % at 1,024, and each seed redraws the trunk's initial state, the language-model dropout and the MSA subsample. A smaller variant needed 10 % input masking per seed because "simply applying ESMC dropout to ESMFold2-Fast resulted in poor scaling".

Six models, one route. The table puts them next to each other, station by station.
{: .da-bridge}

<h2 id="side-by-side"><span class="num">23</span>Side by side</h2>

| | AlphaFold 3 | Boltz-1 | Boltz-2 | OpenFold3 | Protenix-v1 | ESMFold2 |
|---|---|---|---|---|---|---|
| Licence (weights) | academic | MIT | MIT | Apache 2.0 | Apache 2.0 | MIT |
| PDB cutoff | 2021-09-30 | 2021-09-30 | 2023-06-01 | 2021-09-30 | 2021-09-30 | 2021-09-30 |
| Trunk input | MSA, templates | MSA | MSA, multimer templates | MSA, templates | MSA, RNA MSA, templates | ESM C 6B, optional MSA |
| Extra conditioning | — | pocket | method, pocket, contacts | pocket (later) | — | — |
| Pair stack | 48 Pairformer | 48 | 64 | 48 | 48 | 48 pair-only, looped |
| Token transformer | 24 × 16 × 768, no residual as printed | 24, residual | 24 × 16 × 768, residual | 24 × 16 × 768, residual | 24 × 16 × 768, residual | 12 × 16 × 768, residual |
| Atom attention | 32 × 128 blocks, pair bias | same | same | same | same | sliding 128, 3D RoPE |
| Denoiser parameters | not stated | not stated | 294 M | 203 M | 203 M | 131.5 M |
| Total parameters | ≈ 386 M (per Protenix) | not stated | 521 M | 368 M | 368 M | — (plus 6 B LM) |
| Diffusion copies in training | 48 / 32 | not stated | 32 | 48 | not stated | 48 / 32 |
| Sampler | AF3 | tuned constants, Kabsch | AF3, σ_min 10⁻⁴, Kabsch | AF3 | AF3 | AF3 from 256 Å, Kabsch |
| Steering | — | (1x) | physics, contacts, templates, FK | pocket re-noise | TFG (from v2 release) | — |
| Confidence | 4 Pairformer | full trunk copy | 8 Pairformer + affinity | 4 Pairformer | 4 Pairformer | 4 pair layers |
| FoldBench Ab–Ag | 47.9 % | 34.4 % | — | — | 52.3 % | 53 % (MSA) |

Antibody numbers come from different reports with different target sets and seed protocols; compare within a row of one report, not across reports. The FoldBench values for AF3, Boltz-1 and Protenix-v1 are from the Protenix-v1 report; ESMFold2's is its own. All parameter counts except AF3's were read from the released checkpoints.

A table hides how much interpretation went into each row. The next section collects the places where the papers and the code disagree.
{: .da-bridge}

<h2 id="errata"><span class="num">24</span>Where papers and code disagree</h2>

Reproducing AlphaFold 3 meant reading its supplementary information line by line, and the reproductions found that it does not always describe a model that trains. Collected from the reports and from reading the released code:

1. **No residual around attention.** AF3's Algorithm 23 as printed computes $$b = \operatorname{AttentionPairBias}(a)$$ and then $$a \leftarrow b + \operatorname{Transition}(a)$$. Boltz-1, Protenix, OpenFold3 and ESMFold2 all add a residual; Protenix reports that training does not converge without it.
2. **Loss weight.** The SI prints $$(\hat t^2 + \sigma_\text{data}^2)/(\hat t + \sigma_\text{data})^2$$; Boltz-1, Protenix and ESMFold2 use EDM's $$(\hat t^2 + \sigma_\text{data}^2)/(\hat t\,\sigma_\text{data})^2$$, and Protenix calls the printed form a typo.
3. **The Euler step.** Algorithm 18, line 9 uses the pre-churn coordinates where the noisy ones belong; Protenix corrects it "to align with the Euler step".
4. **More typos** listed by Protenix: a double residual around the MSA module, a symmetry-ID comparison that should test the entity, a missing mean in the alignment, and wrong distance bins in the confidence head (whose bins the implementations then choose differently anyway).
5. **Recycles.** AF3's Algorithm 1 defaults to 4; its timings use 10; Protenix infers AF3 "likely used at least 10".
6. **Boltz-2's sampler constants.** The checkpoint stores $$\lambda = \eta = 1.0$$ (from confidence training, which samples the step scale between 1.0 and 1.5); the command-line tool overrides them with 1.003 and 1.5. Code that loads the checkpoint directly gets the former. Every released Boltz-2 version uses $$\gamma_0 = 0.8$$.
7. **ESMFold2 has three samplers**: the paper's (stochastic, 68 steps), the released config's (10 steps, below the paper's own statement that sampling "does not converge below 11 steps"), and an undocumented deterministic class default.
8. **What a seed means** is undefined in AF3. In Protenix-v1 it resamples MSA depth and pair dropout; in ESMFold2 the trunk's initial state, language-model dropout and MSA subsample. Seed-scaling curves therefore sample a mixture over conditions, not $$p(x \mid c)$$ at a fixed condition.

None of this changes the picture of the architecture, but it does mean that "AF3's sampler" or "Boltz-2's defaults" are not single well-defined objects, which matters as soon as one measures sampling behaviour.

The map below lists every concept with the models it appears in, as a way back into the article, followed by the papers to read next.
{: .da-bridge}

<h2 id="map"><span class="num">25</span>Concept map and reading list</h2>

| Concept | Where it appears |
|---|---|
| ε-prediction | DDPM, ADM, SD 1, SDXL, U-ViT, DiT |
| velocity, rectified flow | SD3, FLUX.1 |
| x̂ with EDM preconditioning | AlphaFold 3, Boltz, OpenFold3, Protenix, ESMFold2; RFdiffusion predicts x̂₀ on frames |
| convolutional U-Net | DDPM, ADM, SD 1, SDXL |
| noise level by addition / AdaGN / adaLN / token | DDPM / ADM / DiT, SD3, FLUX, AF3 family / U-ViT |
| cross-attention to text | SD 1, SDXL |
| joint attention over text and image | SD3, FLUX.1 |
| latent space | SD 1, SDXL, DiT, SD3, FLUX.1 (U-ViT either) |
| tuned timestep sampling | EDM (log-normal σ), SD3 (logit-normal t), AF3 (log-normal σ) |
| guidance | ADM (classifier), SD 1, SDXL, DiT, U-ViT, SD3 (classifier-free); distilled in FLUX.1 [dev]; none in co-folding |
| steering potentials | Boltz-2x, Protenix (TFG), RFdiffusion (external potentials) |
| SE(3)-equivariant layers | RFdiffusion |
| pair representation, triangle updates | RFdiffusion (2D track), AF3 family; ESMFold2 without triangle attention |
| trunk once, denoiser every step | AF3, Boltz, OpenFold3, Protenix, ESMFold2 |
| atom ↔ token hierarchy | AF3, Boltz, OpenFold3, Protenix, ESMFold2 |

<div class="da-refs" markdown="1">
**Image models**

- Ho, Jain & Abbeel, [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239), 2020.
- Song et al., [Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456), 2021.
- Nichol & Dhariwal, [Improved Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2102.09672), 2021.
- Dhariwal & Nichol, [Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233), 2021.
- Ho & Salimans, [Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598), 2022.
- Rombach et al., [High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752), 2022.
- Karras et al., [Elucidating the Design Space of Diffusion-Based Generative Models](https://arxiv.org/abs/2206.00364), 2022.
- Liu, Gong & Liu, [Flow Straight and Fast: Rectified Flow](https://arxiv.org/abs/2209.03003), 2022.
- Peebles & Xie, [Scalable Diffusion Models with Transformers](https://arxiv.org/abs/2212.09748), 2023.
- Bao et al., [All are Worth Words: A ViT Backbone for Diffusion Models](https://arxiv.org/abs/2209.12152), 2023.
- Podell et al., [SDXL](https://arxiv.org/abs/2307.01952), 2023.
- Esser et al., [Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206), 2024.
- Black Forest Labs, [FLUX.1 Kontext](https://arxiv.org/abs/2506.15742), 2025.
- Tancik et al., [Fourier Features Let Networks Learn High Frequency Functions in Low Dimensional Domains](https://arxiv.org/abs/2006.10739), 2020.

**Biomolecular models**

- Watson et al., [De novo design of protein structure and function with RFdiffusion](https://www.nature.com/articles/s41586-023-06415-8), 2023.
- Abramson et al., [Accurate structure prediction of biomolecular interactions with AlphaFold 3](https://www.nature.com/articles/s41586-024-07487-w), 2024.
- Wohlwend et al., [Boltz-1](https://doi.org/10.1101/2024.11.19.624167), 2024.
- Passaro et al., [Boltz-2](https://doi.org/10.1101/2025.06.14.659707), 2025.
- [OpenFold3](https://github.com/aqlaboratory/openfold-3) (code, data and technical report).
- ByteDance, [Protenix](https://doi.org/10.1101/2025.01.08.631967), 2025, and [Protenix code](https://github.com/bytedance/Protenix).
- Candido et al., ESMFold2, 2026 ([code and weights](https://huggingface.co/biohub/ESMFold2)).

- Lu et al., [Mechanisms of AI Protein Folding in ESMFold](https://arxiv.org/abs/2602.06020), 2026.

**Explainers**

- Elana Simon & Jake Silberg, [The Illustrated AlphaFold](https://elanapearl.github.io/blog/2024/the-illustrated-alphafold/) — the best visual walk through AF3's trunk.
- Lilian Weng, [What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/)
- Sebastian Raschka, [LLM Architecture Gallery](https://sebastianraschka.com/llm-architecture-gallery/) — the inspiration for the gallery.
</div>

Facts in this article were collected from the papers, their supplementary information and the released code, with the table or page they come from. The animations were drafted with a concept-visualisation pipeline adapted from [Get It.](https://github.com/beltromatti/get-it) and checked frame by frame; the numbers inside them are illustrative unless a caption says otherwise.

<div class="da-note" markdown="1">
**There will be mistakes.** This is a learning project, written while I read these papers, and it has not been reviewed by the authors of any of them. I am not affiliated with the authors or companies behind these models, and nothing here is endorsed by them; AlphaFold is a trademark of Google DeepMind. If you spot an error — a wrong number, a misread algorithm, an explanation that does not hold — please [drop me a message on LinkedIn](https://www.linkedin.com/in/niklas-abraham-05983b247). I will fix it and credit you.
</div>

</article>
<script defer src="{{ '/assets/js/concepts.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/da-guide.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
