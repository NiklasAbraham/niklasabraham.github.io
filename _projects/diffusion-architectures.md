---
layout: default
title: Diffusion Architecture Gallery
description: Fifteen diffusion models, from DDPM to AlphaFold 3, drawn in one visual language.
importance: 1
category: research
permalink: /projects/diffusion-architectures/
---
{%- assign models = site.data.diffusion_gallery -%}
{%- assign longread = '/projects/diffusion-architectures/explained/' | relative_url -%}
<div class="dg" data-contact="https://www.linkedin.com/in/niklas-abraham-05983b247" data-longread="{{ longread }}">

<header class="dg-hero dg-wide" id="dg-top">
  <p class="dg-eyebrow">Project · Architecture gallery · companion to the <a href="{{ longread }}">long read</a></p>
  <h1 class="dg-title">Diffusion models, drawn the same way</h1>
  <p class="dg-lede">
    Fifteen denoisers, from the DDPM U-Net to AlphaFold 3 and its open reproductions, drawn in one visual
    language. A block that does the same job looks the same in every drawing, so what changes from card to card
    is what changed between the models. The drawings show <em>what</em> each network is made of; the
    <a href="{{ longread }}">long read</a> explains <em>why</em>, with the ablations behind each choice.
  </p>
  <p class="dg-meta">Niklas Abraham · October 2026 · {{ models | size }} drawings · {{ models | where: "domain", "image" | size }} image models and {{ models | where: "domain", "bio" | size }} biomolecular ones, 2020–2026 · click any block for its shapes and sources</p>
  <div class="dg-note">
    <p><strong>A note before you start.</strong> I made these drawings while learning the material.
    Every number is checked against the paper, its supplementary information or the released
    code, and each block says where it comes from — but the drawings certainly still contain mistakes. If you
    find one, or think a drawing is misleading, please
    <a href="https://www.linkedin.com/in/niklas-abraham-05983b247" target="_blank" rel="noopener">drop me a message on LinkedIn</a>.
    Corrections are very welcome and will be credited. I am not affiliated with the authors or companies behind these models, and nothing here is endorsed by them; AlphaFold is a trademark of Google DeepMind.</p>
  </div>
  <a class="dg-readlink" href="{{ longread }}">
    <span class="dg-kind">long read</span>
    <strong>Diffusion denoisers, from the noise up</strong>
    <span class="dg-readlink-sub">What every denoiser computes, why each block in these drawings is there, and what the AlphaFold 3 family changed — with animations and derivations.</span>
    <span class="dg-readlink-go" aria-hidden="true">→</span>
  </a>
</header>

<section class="dg-wide dg-intro" id="dg-intro">
  <div class="dg-panel dg-skeleton">
    <header><span class="dg-kind warm">formula</span><h2>One interface, many networks</h2></header>
    <div class="dg-panel-body">
      <p>
        Every model here fits the same sampler-facing interface. In the EDM parameterisation the
        denoiser is
      </p>
      <p class="dg-eq">$$D_\theta(x, \sigma \mid c) = c_\text{skip}(\sigma)\, x + c_\text{out}(\sigma)\, F_\theta\big(c_\text{in}(\sigma)\, x,\ c_\text{noise}(\sigma) \mid c\big)$$</p>
      <p>
        What the cards show is <em>F</em><sub>θ</sub>: what it sees (<em>x</em> in pixels, latents, frames or atoms), how the noise
        level enters, and, above all, how the condition <em>c</em> gets in &mdash; added to a time embedding,
        read through cross-attention, mixed into a joint sequence, or computed by a whole folding trunk.
      </p>
    </div>
  </div>
  <div class="dg-panel dg-legend" aria-label="Legend">
    <header><span class="dg-kind">legend</span><h2>One colour per job</h2></header>
    <div class="dg-panel-body">
      <ul>
        <li><i class="sw attn"></i>attention</li>
        <li><i class="sw mlp"></i>MLP / transition</li>
        <li><i class="sw norm"></i>norm / modulation</li>
        <li><i class="sw conv"></i>convolution / ResBlock</li>
        <li><i class="sw pair"></i>pair representation</li>
        <li><i class="sw embed"></i>embedding / projection</li>
        <li><i class="sw latent"></i>autoencoder</li>
        <li><i class="sw cond"></i>conditioning</li>
        <li><i class="sw io"></i>input / output</li>
        <li><i class="sw diffsw"></i>new relative to the model named on the card</li>
        <li><i class="ln-sw cond-ln"></i>conditioning path</li>
        <li><i class="ln-sw res-ln"></i>residual</li>
        <li><i class="ln-sw skip-ln"></i>skip connection</li>
        <li><i class="rep-sw">× N</i>repeated N times</li>
      </ul>
    </div>
  </div>
</section>

<nav class="dg-toolbar dg-wide" id="dg-toolbar" aria-label="Filter models">
  <div class="dg-seg" role="tablist">
    <button class="on" data-filter="all">All</button>
    <button data-filter="image">Images</button>
    <button data-filter="bio">Biomolecules</button>
  </div>
  <label class="dg-search">
    <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M13 13 L17.5 17.5"/></svg>
    <input type="search" placeholder="Search: adaLN, Pairformer, cross-attention…" aria-label="Search models">
  </label>
  <div class="dg-seg">
    <button class="on" data-view="grid">Gallery</button>
    <button data-view="table">Compare</button>
  </div>
</nav>

<section class="dg-timeline dg-wide" aria-label="Timeline">
  <div class="dg-axis"></div>
</section>

<section class="dg-grid dg-wide" data-view-panel="grid">
  {%- for m in models %}
  <article class="dg-card" id="{{ m.id }}" data-id="{{ m.id }}" data-domain="{{ m.domain }}" data-n="{% if forloop.index < 10 %}0{% endif %}{{ forloop.index }}" data-name="{{ m.name }}" data-year="{{ m.year }}"
           data-search="{{ m.name }} {{ m.org }} {{ m.backbone }} {{ m.conditioning }} {{ m.objective }} {{ m.space }} {{ m.novelty }} {{ m.notes | join: ' ' }}">
    <header class="dg-cardhead">
      <span class="dg-kind{% if m.domain == 'bio' %} warm{% endif %}">{% if forloop.index < 10 %}0{% endif %}{{ forloop.index }} · {% if m.domain == "bio" %}biomolecules{% else %}images{% endif %} · {{ m.year }}</span>
      <h2>{{ m.name }}</h2>
      <button class="dg-btn" type="button" data-zoom aria-label="Enlarge the {{ m.name }} drawing">⤢ enlarge</button>
    </header>
    <button class="dg-figure" aria-label="Explore {{ m.name }}: open the drawing with block details">
      {% include diffusion-gallery/{{ m.id }}.svg %}
    </button>
    <div class="dg-body">
      <p class="dg-org">{{ m.org }} · {% if m.url %}<a href="{{ m.url }}" target="_blank" rel="noopener">{{ m.paper }}</a>{% else %}{{ m.paper }}{% endif %}</p>
      <p class="dg-novelty">{{ m.novelty }}</p>
      <dl class="dg-facts">
        <div><dt>Backbone</dt><dd>{{ m.backbone }}</dd></div>
        <div><dt>Parameters</dt><dd>{{ m.params }}</dd></div>
        <div><dt>Conditioning</dt><dd>{{ m.conditioning }}</dd></div>
        <div><dt>Objective · steps</dt><dd>{{ m.objective }} · {{ m.steps }}</dd></div>
      </dl>
      {%- if m.vs %}
      <p class="dg-vs"><i aria-hidden="true"></i>Magenta outlines: new relative to {{ m.vs }}.</p>
      {%- endif %}
      <div class="dg-cardlinks">
        <button class="dg-explore" type="button">Explore {{ m.blocks | size }} blocks <span aria-hidden="true">→</span></button>
        {%- for l in m.links limit: 2 %}
        <a href="{{ l.url }}" target="_blank" rel="noopener">{{ l.label | split: ' · ' | first }} <span aria-hidden="true">↗</span></a>
        {%- endfor %}
      </div>
    </div>
  </article>
  {%- endfor %}
</section>

<section class="dg-table-wrap dg-wide" data-view-panel="table" hidden>
  <table class="dg-table">
    <thead>
      <tr><th>Model</th><th>Year</th><th>Works on</th><th>Backbone</th><th>Parameters</th><th>Conditioning</th><th>Objective</th><th>Steps</th></tr>
    </thead>
    <tbody>
      {%- for m in models %}
      <tr data-id="{{ m.id }}" data-domain="{{ m.domain }}">
        <th scope="row"><a href="#{{ m.id }}">{{ m.name }}</a></th>
        <td>{{ m.year }}</td><td>{{ m.space }}</td><td>{{ m.backbone }}</td><td>{{ m.params }}</td>
        <td>{{ m.conditioning }}</td><td>{{ m.objective }}</td><td>{{ m.steps }}</td>
      </tr>
      {%- endfor %}
    </tbody>
  </table>
</section>

<section class="dg-wide dg-readings" id="dg-readings">
  <p class="dg-part">After the gallery<strong>Three things the drawings make visible</strong></p>
  <div class="dg-three">
    <div>
      <h3>The U-Net dissolved</h3>
      <p>DDPM → ADM → SD 1 → SDXL keep the U shape and add attention. DiT drops it, U-ViT keeps only the long skips, SD3 and FLUX keep none of it.</p>
    </div>
    <div>
      <h3>The condition moved into the sequence</h3>
      <p>A class embedding added to time (ADM), then cross-attention to text (SD 1), then text tokens attended jointly with the image (MMDiT). The folding models go further: the condition is a full trunk that runs once and biases every attention logit.</p>
    </div>
    <div>
      <h3>Biomolecular denoisers are small next to their condition</h3>
      <p>In AlphaFold 3 and its reproductions the 48–64-block Pairformer does the expensive reasoning once; the 24-block token transformer only refines atoms.</p>
    </div>
  </div>
</section>

<footer class="dg-wide dg-sources" id="dg-sources">
  <h2>Sources and notes</h2>
  <p>
    Numbers for the image models come from the papers and official code linked in each card. Block and
    parameter counts for Boltz-2, OpenFold3, Protenix and ESMFold2 were read from the released checkpoints and
    code (Boltz 2.2.1, OpenFold3 0.4.3, Protenix 1.1.0, ESM 3.4.1); AlphaFold 3 follows the supplementary
    information. Diagrams are simplified: they keep every block that changes how information flows and omit
    dropout, initialisation and most widths.
  </p>
  <p>
    Inspired by Sebastian Raschka's <a href="https://sebastianraschka.com/llm-architecture-gallery/">LLM Architecture Gallery</a>
    and Elana Simon and Jake Silberg's <a href="https://elanapearl.github.io/blog/2024/the-illustrated-alphafold/">Illustrated AlphaFold</a>.
    Drawings are generated by <code>bin/diffusion_gallery/build.py</code>; corrections welcome on
    <a href="https://www.linkedin.com/in/niklas-abraham-05983b247" target="_blank" rel="noopener">LinkedIn</a>.
  </p>
  <ol class="dg-refs">
    {%- for m in models %}
    <li><strong>{{ m.name }}</strong> — {% if m.url %}<a href="{{ m.url }}">{{ m.paper }}</a>{% else %}{{ m.paper }}{% endif %}</li>
    {%- endfor %}
  </ol>
</footer>

<dialog class="dg-modal" aria-label="Model detail">
  <div class="dg-modal-inner">
    <div class="dg-modal-left">
      <div class="dg-modal-fig"><div class="dg-modal-svg"></div><div class="dg-tip" hidden></div></div>
      <div class="dg-insp" aria-live="polite"></div>
    </div>
    <aside class="dg-modal-side">
      <div class="dg-modal-nav">
        <button data-step="-1" aria-label="Previous model">←</button>
        <span class="dg-modal-count"></span>
        <button data-step="1" aria-label="Next model" autofocus>→</button>
        <button class="dg-png" aria-label="Download this drawing as a PNG" title="Download this drawing as a PNG">PNG</button>
        <button class="dg-close" aria-label="Close">✕</button>
      </div>
      <div class="dg-modal-body"></div>
    </aside>
  </div>
</dialog>

<script type="application/json" id="dg-data">{{ models | jsonify }}</script>
<script type="application/json" id="dg-gloss">{{ site.data.diffusion_gallery_gloss | jsonify }}</script>
</div>
<script defer src="{{ '/assets/js/diffusion-gallery.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/dg-rail.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
