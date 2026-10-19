---
layout: default
title: Fold a protein, step by step
description: An interactive walkthrough from what a protein is to how an AlphaFold 3-style co-folding model predicts its structure. It plays by itself; the last part folds a structure live in your browser.
importance: 3
category: research
permalink: /projects/diffusion-architectures/walkthrough/
---
{%- assign g = '/projects/diffusion-architectures/' | relative_url -%}
{%- assign art = '/projects/diffusion-architectures/explained/' | relative_url -%}
<div class="fw" id="fw" data-base="{{ '/assets/diffusion-article/walkthrough/' | relative_url }}">

<header class="fw-mast">
  <div class="fw-mast-in">
    <a class="fw-word" href="#fw"><span class="dot" aria-hidden="true"></span><span class="w">Fold a protein</span><span class="s">step by step</span></a>
    <nav class="fw-chaps" id="fwChaps" aria-label="Chapters"></nav>
    <div class="fw-right">
      <div class="fw-field"><label for="fwExample">Example</label><select id="fwExample"><option value="1n8z">Antibody–antigen · 1N8Z</option><option value="1vii">One fold · villin 1VII</option></select></div>
    </div>
  </div>
</header>

<div class="fw-main">
  <figure class="fw-fig">
    <div class="fw-fighead">
      <span class="fw-figlabel" id="fwFigCap"></span>
      <span class="fw-figchap" id="fwFigChap"></span>
      <span class="fw-count mono" id="fwCount"></span>
    </div>
    <div class="fw-stage" id="fwStage">
      <div class="fw-layer"></div><div class="fw-layer"></div>
      <div class="fw-card" id="fwCard" aria-live="polite"></div>
      <div class="fw-intro" id="fwIntro">
        <div class="fw-intro-l">
          <p class="fw-eyebrow">Interactive walkthrough · <span id="fwMetaAll">about 15 minutes</span></p>
          <h1>How a string of letters becomes a protein structure</h1>
          <p class="fw-lede">Follow one prediction of an AlphaFold&nbsp;3-style co-folding model from the biology to the finished structure, step by step, and fold one yourself at the end.</p>
          <div class="fw-choices">
            <button type="button" class="fw-choice primary" id="fwStartBio"><span class="k">From the beginning</span><b>Start with the biology</b><span class="m" id="fwMetaBio"></span><span class="arr" aria-hidden="true">→</span></button>
            <button type="button" class="fw-choice" id="fwStartModel"><span class="k">Know what a protein is?</span><b>I know the biology — skip to the model</b><span class="m" id="fwMetaModel"></span><span class="arr" aria-hidden="true">→</span></button>
          </div>
          <p class="fw-hint">It plays by itself. <kbd>space</kbd> pauses, <kbd>←</kbd>&thinsp;<kbd>→</kbd> step through.</p>
        </div>
        <div class="fw-intro-r" aria-hidden="true">
          <canvas id="fwPreview"></canvas>
          <p class="fw-prev-cap"><span id="fwPreviewSig">noise</span><span>antibody–antigen complex · PDB 1N8Z</span></p>
        </div>
      </div>
    </div>
    <p class="fw-narr" id="fwNarr" aria-live="polite"></p>
    <div class="fw-player">
      <button type="button" class="fw-play" id="fwPlay" aria-label="Play"></button>
      <div class="fw-nav"><button type="button" id="fwPrev" aria-label="Previous step">←</button><button type="button" id="fwNext" aria-label="Next step">→</button></div>
      <div class="fw-segs" id="fwSegs"></div>
      <span class="fw-time mono" id="fwTime"></span>
      <button type="button" class="fw-skip" id="fwSkip" hidden>Skip the biology →</button>
      <button type="button" class="fw-restart" id="fwRestart" title="From the start" aria-label="From the start">↺</button>
    </div>
  </figure>
  <aside class="fw-side" aria-label="Steps">
    <ol class="fw-steps" id="fwSteps"></ol>
    <div class="fw-prin" id="fwPrin"></div>
  </aside>
</div>

<div class="fw-below">
<main class="fw-article">
  <nav class="fw-toc" aria-label="Contents"><div class="lbl">Contents</div>
    <a href="#fw-what">What this page is</a>
    <a href="#fw-bio"><span>1</span>The biology</a>
    <a href="#fw-model"><span>2</span>Inside the model</a>
    <a href="#fw-live"><span>3</span>Fold one yourself</a>
    <a href="#fw-real">What is computed here</a>
    <a href="#fw-next">Where to go next</a>
  </nav>
  <div class="fw-text" markdown="1">

<p class="eyebrow">Start here</p>
<h2 id="fw-what">What this page is</h2>

The figure above follows one prediction of a co-folding model as a guided tour: it plays by itself, one step at a time, and you can pause, go back or jump to any step in the list. It starts with just enough biology to follow the model, walks through an OpenFold3-style network (OpenFold3 reproduces AlphaFold&nbsp;3's architecture) from left to right, and ends with a sampler you run yourself. The layout borrows from the [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) (Cho et al.). It is the third way into the same material: the [gallery]({{ g }}) draws fifteen diffusion models side by side, and the [long read]({{ art }}) explains every part with the papers' numbers.

<div class="fw-noteb" markdown="1">
**A note before you start.** I made this page while learning the material, and it will contain mistakes. If you find one, or a step is unclear, please [drop me a message on LinkedIn](https://www.linkedin.com/in/niklas-abraham-05983b247). Corrections are very welcome. I am not affiliated with the authors or companies behind these models, and nothing here is endorsed by them; AlphaFold is a trademark of Google DeepMind.
</div>

<p class="eyebrow">Part 1 · the biology</p>
<h2 id="fw-bio">The biology</h2>

A protein is a chain of amino acids, twenty kinds of building block strung together in an order written in the gene. The chain folds into a specific three-dimensional shape, and the shape decides what the protein does. The example is an antibody bound to the protein it recognises: the two variable domains of the antibody trastuzumab, from its light and heavy chain, and domain IV of the receptor HER2, 345 residues in three chains (PDB 1N8Z). The antibody touches HER2 with a few loops at its tip; where exactly those loops sit is what a structure predictor has to get right. The model is given the sequences, and for each chain an alignment of related sequences from other organisms (the MSA).

<p class="eyebrow">Part 2 · the model</p>
<h2 id="fw-model">Inside the model</h2>

Each residue becomes one **token**. The **trunk** turns the tokens and the MSA into a vector $$s_i$$ per token and a vector $$z_{ij}$$ per *pair* of tokens; its 48 Pairformer blocks rewrite every pair from the other two edges of every triangle it belongs to, and the whole trunk runs four times on its own output (recycling). The trunk runs **once**: its output, the condition $$c = (s, z)$$, is handed to the denoiser and stays fixed for all 200 denoiser calls. The **denoiser** takes noisy atom positions and the noise level and returns its guess of the clean structure, $$\hat x$$: an atom encoder, a 24-block token transformer in which $$z$$ biases every attention weight and $$s$$ scales and shifts every layer, and an atom decoder. The [long read]({{ art }}#pair) has the details.

<p class="eyebrow">Part 3 · live</p>
<h2 id="fw-live">Fold one yourself</h2>

The sampler starts from pure noise, far larger than the complex, and walks the noise level $$\sigma_t$$ down in 200 steps with AlphaFold&nbsp;3's recipe: add a little fresh noise (churn, $$\gamma_0$$), ask the denoiser for $$\hat x$$, and step towards it, overshooting by the step scale $$\eta = 1.5$$. Here the network is replaced by the *exact* denoiser of a toy distribution, four possible poses of the antigen (the crystal pose from 1N8Z and three invented alternatives), so you can watch it commit to one of them, somewhere between about 100 and 10&nbsp;Å; the timeline marks where. Fold again and a new seed starts from new noise; the sample collection shows which poses the runs reached. The villin example has a single stable fold, so every run ends in the same structure.

<p class="eyebrow">Honesty box</p>
<h2 id="fw-real">What is computed here, and what is not</h2>

<div class="fw-honest">
<div class="col real" markdown="1">
<p class="lbl">Computed live in your browser</p>

- **The sampler**: AlphaFold&nbsp;3's Algorithm 18, Karras schedule with $$\rho = 7$$, churn $$\gamma_0$$ above 1&nbsp;Å, noise scale $$\lambda = 1.003$$, step scale $$\eta$$.
- **The four-pose denoiser**: the exact posterior mean of a mixture of four poses, $$\hat x = \sum_k w_k \mu_k$$ with $$w_k \propto e^{-\lVert x - \mu_k \rVert^2 / 2\sigma^2}$$, on Cα atoms.
- **Real data**: sequences, chains, Cα coordinates and distance maps of PDB 1N8Z and 1VII.
</div>
<div class="col drawn" markdown="1">
<p class="lbl">Illustrated or made up</p>

- **The trunk's pair maps**: how $$z$$ evolves through the blocks is drawn to show the idea, not computed with OpenFold3's weights.
- **The MSA rows**: illustrative sequences, not a real alignment.
- **The three alternative poses**: rigid rotations of the antigen about the interface that stay bound and do not clash; only the native pose is real.
- **Not here at all**: OpenFold3's weights. A real model's denoiser is a trained network that approximates such an exact denoiser.
</div>
</div>

<p class="eyebrow">Read on</p>
<h2 id="fw-next">Where to go next</h2>

<div class="fw-next">
<a href="{{ g }}"><span class="k">Architecture gallery</span><b>Diffusion models, drawn the same way</b><span>Fifteen denoisers, DDPM to AlphaFold&nbsp;3, in one visual language.</span></a>
<a href="{{ art }}"><span class="k">Long read</span><b>Diffusion denoisers, from the noise up</b><span>Every part of this page explained, with the papers' numbers.</span></a>
</div>

  </div>
</main>
</div>
</div>
<script defer src="{{ '/assets/js/fw-core.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/fw-bio.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/fw-model.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/fw-live.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
