---
layout: default
title: PaperManager
description: A self-hosted second brain for research papers. Drop in a PDF and get a summary, figures, interactive concept visualisations and a guided tour; then filter, search and chat with your whole library (the chat shows its searches, cites its sources and draws figures and 3D structures), write cited long-read reports, track costs, and explore who publishes what at 22 conference series. One Neo4j graph, your own keys.
importance: 0
category: software
permalink: /projects/papermanager/
og_image: https://niklas-abraham.de/assets/papermanager/og.jpg
---
{%- assign img = '/assets/papermanager/' | relative_url -%}
{%- assign repo = 'https://github.com/NiklasAbraham/PaperManager' -%}
{%- assign docs = 'https://niklasabraham.github.io/PaperManager/' -%}
<div class="pm" id="pm" data-hero="e">
<script>(function(){var r=document.getElementById('pm'),T=['violet','teal','amber','rose','blue','graphite'],q=new URLSearchParams(location.search),t=(q.get('theme')||'').toLowerCase();try{if(T.indexOf(t)<0)t=localStorage.getItem('pm-theme')||'';}catch(e){}if(T.indexOf(t)>=0)r.setAttribute('data-pm-theme',t);var a=(q.get('accent')||'').replace('#','');try{if(!/^[0-9a-fA-F]{6}$/.test(a))a=localStorage.getItem('pm-accent')||'';}catch(e){}if(/^[0-9a-fA-F]{6}$/.test(a))r.style.setProperty('--pm-accent','#'+a);})();</script>

{% comment %}
<!-- Design preview: pick a hero and a colour theme for this page (owner tool, not part of the content) -->
<div class="pm-switch" id="pm-switch" role="group" aria-label="Design preview">
  <button type="button" class="pm-switch-toggle" aria-expanded="true" aria-controls="pm-switch-body" title="Hide the design switcher">
    <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 2.5a7.5 7.5 0 0 1 0 15z"/></svg>
  </button>
  <div class="pm-switch-body" id="pm-switch-body">
    <span class="pm-switch-label">Hero</span>
    <div class="pm-switch-set">
      <button type="button" data-set-hero="a" title="A · Classic">A</button>
      <button type="button" data-set-hero="b" title="B · Banner">B</button>
      <button type="button" data-set-hero="c" title="C · Silk">C</button>
      <span class="pm-switch-sub" role="group" aria-label="Hero C versions">
        <button type="button" data-set-hero="c1" title="C1 · Knot">C1</button>
        <button type="button" data-set-hero="c2" title="C2 · Double helix">C2</button>
        <button type="button" data-set-hero="c3" title="C3 · Knowledge sphere">C3</button>
        <button type="button" data-set-hero="c4" title="C4 · Möbius">C4</button>
        <button type="button" data-set-hero="c5" title="C5 · Nautilus">C5</button>
        <button type="button" data-set-hero="c6" title="C6 · Citation tree">C6</button>
        <button type="button" data-set-hero="c7" title="C7 · Sphere (side)">C7</button>
      </span>
      <span class="pm-switch-mat" role="group" aria-label="Hero C material">
        <button type="button" data-set-mat="auto" title="Material: each version's own" style="--sw:conic-gradient(#d9d5ce 0 50%,#0a1020 0)"></button>
        <button type="button" data-set-mat="silver" title="Silver" style="--sw:linear-gradient(135deg,#f4f1ea,#9a9184)"></button>
        <button type="button" data-set-mat="champagne" title="Champagne" style="--sw:linear-gradient(135deg,#fff3d6,#b98b45)"></button>
        <button type="button" data-set-mat="ink" title="Ink" style="--sw:linear-gradient(135deg,#f7f4ec 50%,#111 50%)"></button>
        <button type="button" data-set-mat="iridescent" title="Iridescent" style="--sw:linear-gradient(135deg,#8f5cff,#2ed1c6,#ffc857)"></button>
        <button type="button" data-set-mat="glow" title="Glow (page colour)" style="--sw:radial-gradient(circle,var(--pm-accent),#0c0a14 75%)"></button>
        <button type="button" data-set-mat="aurora" title="Aurora (page colours)" style="--sw:linear-gradient(135deg,var(--pm-accent),var(--pm-accent-2),#ffc85c)"></button>
        <button type="button" data-set-mat="ice" title="Ice" style="--sw:linear-gradient(135deg,#e7edf3,#8cd6ff,#9a7bff)"></button>
        <button type="button" data-set-mat="night" title="Night" style="--sw:radial-gradient(circle,#7fe0ff,#6d5cff 45%,#070b18 80%)"></button>
      </span>
      <button type="button" data-set-hero="d" title="D · Knowledge constellation">D</button>
      <button type="button" data-set-hero="e" title="E · Editorial">E</button>
      <button type="button" data-set-hero="f" title="F · Annotated page">F</button>
    </div>
    <span class="pm-switch-name" aria-live="polite"></span>
    <span class="pm-switch-sep" aria-hidden="true"></span>
    <span class="pm-switch-label">Colour</span>
    <div class="pm-switch-set pm-switch-swatches">
      <button type="button" data-set-theme="violet" title="Violet" style="--sw:#7c3aed"></button>
      <button type="button" data-set-theme="teal" title="Teal" style="--sw:#0f9488"></button>
      <button type="button" data-set-theme="amber" title="Amber" style="--sw:#d97706"></button>
      <button type="button" data-set-theme="rose" title="Rose" style="--sw:#e11d48"></button>
      <button type="button" data-set-theme="blue" title="Blue" style="--sw:#2563eb"></button>
      <button type="button" data-set-theme="graphite" title="Graphite" style="--sw:#475569"></button>
      <label class="pm-switch-pick" title="Any colour" aria-pressed="false"><input type="color" value="#7c3aed" aria-label="Pick any accent colour"></label>
    </div>
  </div>
</div>
{% endcomment %}

<div class="pm-heroes">

{% comment %}
Heroes A, B, C, D kept for later; the page shows hero E only.

<!-- ============================================================ hero A: classic -->
<section class="pm-hv pm-hv-a" data-hero="a" data-name="Classic">
  <header class="pm-hero">
    <h1 class="pm-title">A second brain for research papers</h1>
    <p class="pm-lede">
      PaperManager turns a pile of PDFs into a knowledge graph you can read, search and talk to.
      Drop in a paper and it finds the metadata, writes a summary, pulls out figures and references,
      draws the ideas on each page as interactive visualisations, and maps how every paper in a
      project connects to the others.
    </p>
    <div class="pm-ctas">
      <a class="pm-btn pm-btn-primary" href="{{ repo }}"><i class="fab fa-github"></i> Code on GitHub</a>
      <a class="pm-btn" href="#setup"><i class="fas fa-rocket"></i> Set it up</a>
      <a class="pm-btn" href="{{ docs }}"><i class="fas fa-book"></i> Documentation</a>
    </div>
    <p class="pm-meta">FastAPI · Neo4j · React · Claude · Docker &nbsp;·&nbsp; runs on your own machine with your own keys</p>
  </header>
  <figure class="pm-shot pm-shot-hero">
    <a href="{{ img }}concepts.webp"><img src="{{ img }}concepts.webp" width="1600" height="1000" fetchpriority="high"
      alt="PaperManager paper view: the EDM paper's PDF on the left, and on the right an animated visualisation of the probability flow ODE, generated for page 2"></a>
  </figure>
  <p class="pm-caption">Reading <em>Elucidating the Design Space of Diffusion-Based Generative Models</em>: the panel on the right animates the probability-flow ODE that page 2 describes.</p>
</section>

<!-- ============================================================ hero B: banner (port of 21st.dev ResponsiveHeroBanner) -->
<section class="pm-hv pm-hv-b pm-bleed" data-hero="b" data-name="Banner">
  <img class="pm-b-img" src="{{ img }}hero-banner.webp" width="2000" height="1125" alt="" loading="lazy" decoding="async">
  <div class="pm-b-shade" aria-hidden="true"></div>
  <div class="pm-b-inner">
    <div class="pm-b-copy">
      <h1 class="pm-b-title pm-fade-2">A second brain<br>for research papers</h1>
      <p class="pm-b-lede pm-fade-3">
        PaperManager turns a pile of PDFs into a knowledge graph you can read, search and talk to.
        Drop in a paper and it finds the metadata, writes a summary, pulls out figures and references,
        draws the ideas on each page as interactive visualisations, and maps how every paper in a
        project connects to the others.
      </p>
      <div class="pm-b-ctas pm-fade-4">
        <a class="pm-b-btn pm-b-btn-primary" href="{{ repo }}">Code on GitHub
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a>
        <a class="pm-b-btn" href="#pipeline">See it work
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4L12.8 8z"/></svg></a>
      </div>
    </div>
    <div class="pm-b-built">
      <p class="pm-b-built-label pm-fade-1">Built on open tools, with Claude</p>
      <div class="pm-b-marks pm-fade-2">
        <span class="pm-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path class="f" d="M13.2 4.8 7.6 13h4l-1 6.2L16.4 11h-4z"/></svg>FastAPI</span>
        <span class="pm-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5 12 6.5l6 10M6 16.5h12"/><circle class="f" cx="12" cy="6.5" r="3"/><circle class="f" cx="6" cy="16.5" r="3"/><circle class="f" cx="18" cy="16.5" r="3"/></svg>Neo4j</span>
        <span class="pm-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle class="f" cx="12" cy="12" r="1.8"/></svg>React</span>
        <span class="pm-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3 5.3 18.7"/></svg>Claude</span>
        <span class="pm-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12.5h17c1 0 2-1 2-2.4M3 12.5c.6 4 3.8 6.5 8.5 6.5 5 0 8-2.6 9.4-6.6"/><rect class="f" x="5" y="8.6" width="3" height="2.6" rx=".4"/><rect class="f" x="8.7" y="8.6" width="3" height="2.6" rx=".4"/><rect class="f" x="12.4" y="8.6" width="3" height="2.6" rx=".4"/><rect class="f" x="8.7" y="5.2" width="3" height="2.6" rx=".4"/><rect class="f" x="12.4" y="5.2" width="3" height="2.6" rx=".4"/></svg>Docker</span>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================ hero C: silk infinity -->
{% include papermanager-hero-c.html %}

<!-- ============================================================ hero D: knowledge constellation -->
<section class="pm-hv pm-hv-d pm-bleed" data-hero="d" data-name="Knowledge constellation">
  <canvas class="pm-canvas pm-d-canvas" data-scene="constellation" aria-hidden="true"></canvas>
  <div class="pm-d-copy">
    <h1 class="pm-d-title">A second brain<br>for research papers</h1>
    <p class="pm-lede">
      PaperManager turns a pile of PDFs into a knowledge graph you can read, search and talk to.
      Drop in a paper and it finds the metadata, writes a summary, pulls out figures and references,
      draws the ideas on each page as interactive visualisations, and maps how every paper in a
      project connects to the others.
    </p>
    <div class="pm-ctas">
      <a class="pm-btn pm-btn-primary" href="{{ repo }}"><i class="fab fa-github"></i> Code on GitHub</a>
      <a class="pm-btn" href="#setup"><i class="fas fa-rocket"></i> Set it up</a>
      <a class="pm-btn" href="{{ docs }}"><i class="fas fa-book"></i> Documentation</a>
    </div>
    <p class="pm-d-hint"><span class="pm-d-sq"></span> paper &nbsp; <span class="pm-d-ci"></span> concept <span class="pm-d-move">&nbsp;·&nbsp; move the pointer to pull the graph together</span></p>
  </div>
</section>
{% endcomment %}

<!-- ============================================================ hero E: editorial -->
<section class="pm-hv pm-hv-e" data-hero="e" data-name="Editorial">
  <div class="pm-e-grid">
    <div class="pm-e-copy">
      <p class="pm-e-kicker">PaperManager · open source · self-hosted</p>
      <h1 class="pm-e-title">Stop collecting papers. <em>Understand</em> them.</h1>
      <p class="pm-e-lede">
        Reference managers store your PDFs and leave the hard part to you. PaperManager reads
        them with you: a summary, the figures, an interactive picture of every difficult idea,
        a guided tour, and a chat that answers from your whole library and cites its sources.
      </p>
      <div class="pm-ctas pm-ctas-left">
        <a class="pm-btn pm-btn-primary" href="{{ repo }}"><i class="fab fa-github"></i> Code on GitHub</a>
        <a class="pm-btn" href="#chat"><i class="fas fa-comments"></i> See the chat</a>
        <a class="pm-e-link" href="{{ docs }}">Documentation <span aria-hidden="true">→</span></a>
      </div>
    </div>
    <div class="pm-e-fan" tabindex="0" aria-label="Three screenshots: interactive concept, quick tour, project concept map">
      <figure class="pm-shot pm-e-card pm-e-2"><img src="{{ img }}concepts.webp" width="1600" height="1000" loading="lazy" alt="Interactive concept: the probability flow ODE next to its PDF page"><figcaption>Concepts</figcaption></figure>
      <figure class="pm-shot pm-e-card pm-e-1"><img src="{{ img }}tour.webp" width="1600" height="1000" fetchpriority="high" alt="Quick tour of the Feynman-Kac Correctors paper"><figcaption>Quick tour</figcaption></figure>
      <figure class="pm-shot pm-e-card pm-e-3"><img src="{{ img }}concept-map.webp" width="1600" height="1000" loading="lazy" alt="Concept map of 210 papers"><figcaption>Concept map</figcaption></figure>
    </div>
  </div>
</section>

{% comment %}
<!-- ============================================================ hero F: page to graph -->
<section class="pm-hv pm-hv-f" data-hero="f" data-name="Annotated page">
  <header class="pm-hero pm-f-head">
    <p class="pm-eyebrow">Project · open source · self-hosted</p>
    <h1 class="pm-title">A second brain for research papers</h1>
    <p class="pm-lede">
      PaperManager turns a pile of PDFs into a knowledge graph you can read, search and talk to.
      Drop in a paper and it finds the metadata, writes a summary, pulls out figures and references,
      draws the ideas on each page as interactive visualisations, and maps how every paper in a
      project connects to the others.
    </p>
    <div class="pm-ctas">
      <a class="pm-btn pm-btn-primary" href="{{ repo }}"><i class="fab fa-github"></i> Code on GitHub</a>
      <a class="pm-btn" href="#setup"><i class="fas fa-rocket"></i> Set it up</a>
      <a class="pm-btn" href="{{ docs }}"><i class="fas fa-book"></i> Documentation</a>
    </div>
  </header>
  <div class="pm-f-stage">
    <div class="pm-f-bar" aria-hidden="true"><span></span><span></span><span></span><em>what PaperManager does to a page</em></div>
    <canvas class="pm-canvas" data-scene="annotate" role="img"
      aria-label="A paper's PDF page is read and annotated: colour-coded highlights sweep across lines, concept marks appear in the margin, a summary types itself beside the page, figures and tables are lifted into a side panel, references are collected, and quick-tour stops are pinned to the page."></canvas>
  </div>
</section>
{% endcomment %}

</div>

<!-- ============================================================ the problem -->
<section class="pm-section pm-problem" id="problem">
  <div class="pm-section-head">
    <p class="pm-kicker">The problem</p>
    <h2>Reading is the slow part of research, and the tools leave it to you</h2>
  </div>
  <div class="pm-grid pm-grid-3">
    <div class="pm-card">
      <span class="pm-pn">1</span>
      <h3>Storing is not understanding</h3>
      <p>Reference managers keep PDFs and citations. None of them explains the formula on page 4.</p>
    </div>
    <div class="pm-card">
      <span class="pm-pn">2</span>
      <h3>Four tools, no shared memory</h3>
      <p>The PDF reader, the notes app, the citation tool and the chatbot know nothing about each other.</p>
    </div>
    <div class="pm-card">
      <span class="pm-pn">3</span>
      <h3>Chatbots do not know your library</h3>
      <p>A PDF pasted into a chat covers one paper, is forgotten afterwards, and cannot say how it relates to the two hundred before it. You upload, explain and start again every time.</p>
    </div>
  </div>
  <p class="pm-solve"><strong>PaperManager puts it in one place.</strong> A single knowledge graph holds your papers, notes, highlights, concepts and citations. The chat, the search and the reports all read from it, so the next question starts where the last one ended.</p>
</section>

<!-- ============================================================ see it work: reels (teardown reel 424, ConceptsPlots 110_reel_editor/epic_teardown_v.py) -->
<section class="pm-section pm-teardown" id="teardown">
  <div class="pm-section-head">
    <p class="pm-kicker">See it work</p>
    <h2>One paper, taken apart and tied into the library</h2>
    <p>The AlphaFold&nbsp;3 paper goes in: 24 pages split, 16 figures cut out, ten claims and 48 authors pulled from the text, all put back together as one card. Then twenty papers that cite it tie on, eight join a thesis project and 27 more on structure prediction line up behind its topic. Every title, count and link comes from the real library.</p>
  </div>
  <div class="pm-reels">
    <figure class="pm-film">
      <video src="{{ img }}teardown-af3.mp4" poster="{{ img }}teardown-af3-poster.webp" width="720" height="1280"
        controls playsinline preload="none"
        aria-label="Film, 36 seconds: the AlphaFold 3 paper is split into pages, figures, claims and authors, reassembled as a card, and then connected to the 20 library papers that cite it and 27 more on its topic"></video>
      <figcaption>Ingest and connect. 36 s, with sound.</figcaption>
    </figure>
    <figure class="pm-film">
      <video src="{{ img }}reel-chat.mp4" poster="{{ img }}reel-chat-poster.webp" width="1080" height="1920"
        controls playsinline preload="none"
        aria-label="Screen recording, 41 seconds: the PaperManager chat answers a question about AlphaFold 3. Tool calls find the paper, 28 library papers cite it and 16 figures are pulled in. A 3D structure of the SARS-CoV-2 spike spins, then the sources open."></video>
      <figcaption>Ask the library: graph queries, figures, a 3D structure and every source linked. 41 s, with sound.</figcaption>
    </figure>
    <figure class="pm-film">
      <video src="{{ img }}reel-search.mp4" poster="{{ img }}reel-search-poster.webp" width="1080" height="1920"
        controls playsinline preload="none"
        aria-label="Screen recording, 40 seconds: a search for protein binder design gives 83 results; filters for 2024, unread, with PDF and the tag de-novo-design narrow it to five papers."></video>
      <figcaption>1,173 papers, one query, four filters: the five you need. 40 s, with sound.</figcaption>
    </figure>
  </div>
  <p class="pm-caption">Rendered from PaperManager's own data and recorded in its own interface. Music in the two screen recordings: Kevin MacLeod (incompetech.com), CC BY 4.0.</p>
</section>

<!-- ============================================================ features -->
<section class="pm-section" id="features">
  <div class="pm-section-head">
    <p class="pm-kicker">What it does</p>
    <h2>Add, find, read, ask, write</h2>
  </div>

  <div class="pm-feature" id="library">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">Add</p>
      <h3>Add a paper in seconds</h3></div>
      <div class="pm-feature-body">
      <p>Drop a PDF or paste an arXiv, DOI, PubMed or bioRxiv link. Metadata, duplicate check, summary, topics, figures and references are done for you. You check the details once, and nothing is saved before that.</p>
      <p>Every DOI and arXiv id in a reference list is looked up at doi.org and arXiv before you see it, with no AI involved. Ids that do not exist, or belong to another paper, are dropped, so a citation never links to the wrong paper.</p>
    </div></div>
    <figure class="pm-shot"><a href="{{ img }}library.webp"><img src="{{ img }}library.webp" width="1600" height="1000" loading="lazy"
      alt="Library landing page: one search bar with a filter button, Continue reading, Recently added papers and library counts"></a></figure>
  </div>

  <div class="pm-feature" id="search">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">Find</p>
      <h3>Find a paper by whatever you remember of it</h3></div>
      <div class="pm-feature-body">
      <p>One search box covers titles, authors, topics, tags, abstracts, summaries, your notes, your highlights, extracted claims and the full text. Every hit says where it matched. <em>Exact</em>, <em>Meaning</em> and <em>Hybrid</em> modes rank by words, by what the abstract means, or both. On 26 realistic queries the expected paper is in the top 3 for all 26.</p>
      <p>Narrow the list by date added (presets or a range), year, reading status, has PDF, text, note or highlights, rating, type, project, tag, topic and venue, and sort it new ways. The filters sit in the URL, so a filtered view can be bookmarked or shared. Browsing and filtering are two to three times faster than before.</p>
    </div></div>
    <figure class="pm-shot"><a href="{{ img }}search-filters.webp"><img src="{{ img }}search-filters.webp" width="1600" height="1000" loading="lazy"
      alt="Library search with the filter panel open: date added, year range, status, rating, project, tag, topic and venue filters above the result list"></a></figure>
  </div>

  <div class="pm-feature" id="read">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">Read</p>
      <h3>Understand a paper next to its PDF</h3></div>
      <div class="pm-feature-body">
      <p>The summary splits a paper into contribution, methods, inputs and outputs, with the maths typeset. Highlight in five colours, keep notes that link <code>@people</code> and <code>#topics</code> into the graph, and ask about the paper or a single figure.</p>
      <dl class="pm-defs" id="concepts">
        <dt>Concepts</dt>
        <dd>Every page is scanned for ideas a picture explains better than prose. Each becomes an animation, a formula taken apart, or a plot of the paper's own numbers, marked on the PDF where it belongs. Adapted from <a href="https://github.com/beltromatti/get-it">Get It.</a> by beltromatti (Apache-2.0); animations run in a sandboxed frame.</dd>
        <dt>Quick tour</dt>
        <dd>An overview, a list of what to skip, then 6 to 12 stops: the problem, the key equation, the main result. Each stop jumps the PDF to a verbatim passage.</dd>
        <dt>Concept map</dt>
        <dd>Group papers into a project and their key concepts are mapped and shared across papers: methods, models, datasets, metrics. The map in the top right shows 210 thesis papers.</dd>
      </dl>
    </div></div>
    <div class="pm-pair">
      <figure class="pm-shot"><a href="{{ img }}summary.webp"><img src="{{ img }}summary.webp" width="1600" height="1000" loading="lazy"
        alt="AI summary tab with sections for contribution and methods, including typeset formulas"></a></figure>
      <figure class="pm-shot"><a href="{{ img }}figures.webp"><img src="{{ img }}figures.webp" width="1600" height="1000" loading="lazy"
        alt="Figures tab listing the paper's extracted figures with captions and an Ask button for each"></a></figure>
    </div>
  </div>

  <div class="pm-feature pm-feature-chat" id="chat">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">Ask</p>
      <h3>A chat that already knows your library</h3></div>
      <div class="pm-feature-body">
      <p>Ask without attaching a file. The chat finds the paper, reads your highlight and the note you left on it, and answers with the page cited. Scope a question with <code>@project:</code>, <code>@topic:</code>, <code>@paper:</code>, <code>@person:</code> or <code>@user:</code>. Pick the model per conversation: Claude through the API or on a subscription, or any OpenAI-compatible model through LiteLLM.</p>
      <ul class="pm-list">
        <li><strong>You see the work.</strong> Each search, graph query and paper it reads shows as a row, and answers stream in live. Stop or retry any time.</li>
        <li><strong>Sources under every answer.</strong> A row of the papers it used, each a link that opens the paper beside the chat.</li>
        <li><strong>Figures and structures.</strong> Figure strips from the cited papers open in a lightbox. Protein cards load PDB entries, ligands by CCD or PubChem id, alignments and highlighted residues in 3D.</li>
        <li><strong>Maths you can copy.</strong> Formulas are typeset with KaTeX; one click copies the TeX.</li>
      </ul>
    </div></div>
    <div class="pm-chat-stage pm-bleed">
      <div class="pm-chat-pitch">
        <p class="pm-kicker">Recorded from a real PaperManager library</p>
        <p class="pm-chat-line">Ask your library. It answers with formulas, plots and proteins.</p>
      </div>
      <div class="pm-chat-show">
        <ol class="pm-chat-menu" id="pm-chat-menu" aria-label="Examples">
          <li><button type="button" class="pm-cm" data-pm-chat-tab="0" aria-selected="true">
            <span class="pm-cm-num">01</span><span class="pm-cm-head">Concept cards</span></button></li>
          <li><button type="button" class="pm-cm" data-pm-chat-tab="1" aria-selected="false">
            <span class="pm-cm-num">02</span><span class="pm-cm-head">Live animation</span></button></li>
          <li><button type="button" class="pm-cm" data-pm-chat-tab="2" aria-selected="false">
            <span class="pm-cm-num">03</span><span class="pm-cm-head">Protein in 3D</span></button></li>
          <li><button type="button" class="pm-cm" data-pm-chat-tab="3" aria-selected="false">
            <span class="pm-cm-num">04</span><span class="pm-cm-head">Cited answers</span></button></li>
          <li class="pm-chat-tag" aria-hidden="true">PaperManager · Knowledge Chat</li>
        </ol>
        <div class="pm-chat-frame"><div class="pm-chat-window" data-pm-chat-clip>
          <div class="pm-chat-demo" id="pm-chat-demo" data-framed data-pm-chat-menu="#pm-chat-menu" data-pm-chat-demo="{{ '/assets/pm-chat-demo/data/' | relative_url }}">{% include pm-chat-demo.html %}</div>
        </div></div>
        <div class="pm-chat-notes" id="pm-chat-notes" aria-live="polite">
          <p data-note="0"><strong>Concept cards.</strong> Asked about <em>Classifier-Free Diffusion Guidance</em>, the chat draws the guidance formula as a card you can step through, plus a plot of what the scale does. The maths is explained from the answer's own text.</p>
          <p data-note="1" hidden><strong>Live animation.</strong> Asked about <em>Flow Matching for Generative Modeling</em>, it animates noise flowing into data. A process becomes something you watch; pause it where it gets interesting.</p>
          <p data-note="2" hidden><strong>Protein in 3D.</strong> Asked about <em>AlphaFold 3</em>, it loads the SARS-CoV-2 spike. Turn it, zoom in, highlight chains and residues. Entries come from the PDB or AlphaFold DB, coloured by pLDDT for predictions.</p>
          <p data-note="3" hidden><strong>Cited answers.</strong> Asked about <em>Extracting Training Data from Diffusion Models</em>, it answers in a few lines and links the source. Click the citation and the paper opens beside the chat.</p>
        </div>
      </div>
    </div>
    <p class="pm-caption">
      Four papers from the library, one recorded question each, shown with the app's own components.
      Concept visualisations are adapted from <a href="https://github.com/beltromatti/get-it">Get It.</a> by beltromatti (Apache-2.0);
      structures are drawn with <a href="https://3dmol.csb.pitt.edu">3Dmol.js</a> (BSD-3-Clause).
    </p>

    <div class="pm-pair" style="margin-top:1.6rem">
      <figure class="pm-shot"><a href="{{ img }}chat-tools.webp"><img src="{{ img }}chat-tools.webp" width="1600" height="1000" loading="lazy"
        alt="Knowledge chat answer with tool-call rows showing what it searched and read, and a sources row of linked papers under the answer"></a></figure>
      <figure class="pm-shot"><a href="{{ img }}chat-structure.webp"><img src="{{ img }}chat-structure.webp" width="1600" height="1000" loading="lazy"
        alt="Knowledge chat answer with a 3D structure card of a protein with highlighted residues"></a></figure>
    </div>
  </div>

  <div class="pm-feature" id="reports">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">Write</p>
      <h3>Long-read reports from your own papers</h3></div>
      <div class="pm-feature-body">
      <p>Pick a project, tag or question and PaperManager writes a long report in the background: a plan, then section by section, drawn from your library, with a citation for each claim. Read it in the app and export it as HTML or Markdown. The citations link back to the papers.</p>
    </div></div>
    <figure class="pm-shot"><a href="{{ img }}report-view.webp"><img src="{{ img }}report-view.webp" width="1600" height="1000" loading="lazy"
      alt="A generated report open in PaperManager: headed sections with citations that link to library papers and export buttons"></a></figure>
  </div>

  <div class="pm-feature" id="conferences">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">Explore</p>
      <h3>See who publishes what, at every major conference</h3></div>
      <div class="pm-feature-body">
      <p>The Conferences tab reads the accepted papers of 22 conference series two ways. By institution: rank, full and fractional paper counts, the research-area mix against the whole conference, main collaborators and every paper. By topic: type one or paste an abstract, and see which universities and companies publish most on it and which papers are closest.</p>
      <p>One search box covers every loaded conference. Papers are found by title and by meaning; an author comes back with all their papers and the institution given on each; a topic shows papers per 1,000 at each conference and the change from one year to the next. On "diffusion models for protein structure", ICLR 2026 and NeurIPS 2025 hold about 12 close papers per 1,000, ACL and CoRL none; MIT and Tsinghua lead the universities, Google the companies.</p>
      <p>Papers already in your library are marked. One click adds a paper with its authors and affiliations.</p>
      <p class="pm-fine">NeurIPS, ICML, ICLR, AISTATS, UAI, COLT · CVPR, ICCV, ECCV, WACV · ACL, EMNLP, NAACL, COLM · AAAI, IJCAI · CoRL, RSS, ICRA, IROS · KDD, WWW. Paper lists come from the official conference sites and from <a href="https://github.com/papercopilot/paperlists">Paper Copilot</a>. Embeddings (<a href="https://huggingface.co/BAAI/bge-small-en-v1.5">bge-small-en-v1.5</a>) are computed on your own server; no API key is involved.</p>
    </div></div>
    <figure class="pm-shot"><a href="{{ img }}conferences.webp"><img src="{{ img }}conferences.webp" width="1600" height="1000" loading="lazy"
      alt="NeurIPS 2026 in the conference explorer: 6,024 accepted papers, the research-area mix of the conference as one bar, and the top universities and top companies by paper count"></a></figure>
    <div class="pm-pair" style="margin-top:1rem">
      <figure class="pm-shot"><a href="{{ img }}conferences-topic.webp"><img src="{{ img }}conferences-topic.webp" width="1600" height="1000" loading="lazy"
        alt="Search across all loaded conferences for diffusion models for protein structure: papers per 1,000 at each conference and the change from NeurIPS 2025 to 2026"></a></figure>
      <figure class="pm-shot"><a href="{{ img }}conferences-institution.webp"><img src="{{ img }}conferences-institution.webp" width="1600" height="1000" loading="lazy"
        alt="Institution card for the University of Oxford at NeurIPS 2026: rank, full and fractional paper counts, research areas against the conference and co-authoring institutions"></a></figure>
    </div>
  </div>

  <div class="pm-feature" id="graph">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">Go deeper</p>
      <h3>One graph you can browse, query and script</h3></div>
      <div class="pm-feature-body">
      <ul class="pm-list">
        <li><strong>Graph tool.</strong> Papers, people, topics and projects as a graph, with a query panel for your own Cypher. Results show as a graph and as a table.</li>
        <li><strong>MCP server.</strong> 42 tools for Claude Desktop and Claude Code: search, read, tag, upload PDFs, merge duplicates, check a list of cited DOIs against the library in one call.</li>
        <li><strong>Find papers.</strong> Literature search across arXiv, Semantic Scholar and PubMed, with author tracking and related-paper suggestions in the same place.</li>
        <li><strong>Clean data.</strong> Duplicate detection and a merge manager, so citation stubs and uploaded PDFs resolve to one paper.</li>
      </ul>
      <p>Navigation is four entries, Library, Projects, People and Chat, plus Explore, Tools and Account menus.</p>
    </div></div>
    <div class="pm-pair">
      <figure class="pm-shot"><a href="{{ img }}graph-query.webp"><img src="{{ img }}graph-query.webp" width="1600" height="1000" loading="lazy"
        alt="Graph tool with the query panel open: a Cypher query, its result drawn as a graph and listed as a table"></a></figure>
      <figure class="pm-shot"><a href="{{ img }}nav-explore.webp"><img src="{{ img }}nav-explore.webp" width="1600" height="1000" loading="lazy"
        alt="The Explore menu in the top navigation, next to Library, Projects, People and Chat"></a></figure>
    </div>
  </div>

  <div class="pm-feature pm-feature-team" id="team">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">Run it as a team</p>
      <h3>Know what it costs, and what to build next</h3></div>
      <div class="pm-feature-body">
      <p>Accounts are admin-managed, with shared projects, per-user API keys, JWT login and rate limiting. Three pages keep a shared install honest.</p>
    </div></div>
    <div class="pm-trio">
      <figure class="pm-shot"><a href="{{ img }}tokens.webp"><img src="{{ img }}tokens.webp" width="1600" height="1000" loading="lazy"
        alt="Tokens page: cost of LLM calls by feature, model and user"></a>
        <figcaption><strong>Tokens.</strong> Every LLM call is logged, with cost per feature, model and user.</figcaption></figure>
      <figure class="pm-shot"><a href="{{ img }}suggestions.webp"><img src="{{ img }}suggestions.webp" width="1600" height="1000" loading="lazy"
        alt="Suggestions page: improvement ideas with vote counts and status"></a>
        <figcaption><strong>Suggestions.</strong> The chat proposes an improvement as a chip. People vote; status is tracked.</figcaption></figure>
      <figure class="pm-shot"><a href="{{ img }}health.webp"><img src="{{ img }}health.webp" width="1600" height="1000" loading="lazy"
        alt="Health page: admin view of the database, providers and background jobs"></a>
        <figcaption><strong>Health.</strong> An admin view of the database, providers and background jobs.</figcaption></figure>
    </div>
  </div>
</section>

<!-- ============================================================ how it works -->
<section class="pm-section" id="how">
  <div class="pm-section-head">
    <p class="pm-kicker">How it works</p>
    <h2>One graph in the middle</h2>
    <p>
      A React app and Claude's MCP tools talk to one FastAPI backend. Every paper, author, topic,
      note, concept and citation is a node or relationship in Neo4j. PDFs live in local storage or
      Google Drive. Every prompt is a plain text file you can edit.
    </p>
  </div>

  <div class="pm-arch">
    <svg viewBox="0 0 960 330" role="img" aria-label="Architecture: browser and Claude MCP clients connect to the FastAPI backend, which uses Neo4j, Google Drive, language models, Docling and scholarly APIs">
      <defs><marker id="pm-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="a-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>
      <rect class="a-box" x="20" y="60" width="200" height="74" rx="10"/>
      <text class="a-t" x="120" y="92" text-anchor="middle">React frontend</text>
      <text class="a-s" x="120" y="113" text-anchor="middle">Vite · Tailwind · PDF viewer</text>
      <rect class="a-box" x="20" y="196" width="200" height="74" rx="10"/>
      <text class="a-t" x="120" y="228" text-anchor="middle">MCP clients</text>
      <text class="a-s" x="120" y="249" text-anchor="middle">Claude Desktop · Claude Code</text>
      <rect class="a-box a-hi" x="340" y="110" width="250" height="110" rx="12"/>
      <text class="a-t" x="465" y="150" text-anchor="middle">FastAPI backend</text>
      <text class="a-s" x="465" y="172" text-anchor="middle">ingestion · AI pipelines</text>
      <text class="a-s" x="465" y="191" text-anchor="middle">background jobs · MCP tools</text>
      <rect class="a-box" x="710" y="10" width="230" height="56" rx="10"/>
      <text class="a-t" x="825" y="35" text-anchor="middle">Neo4j</text>
      <text class="a-s" x="825" y="54" text-anchor="middle">the knowledge graph</text>
      <rect class="a-box" x="710" y="80" width="230" height="56" rx="10"/>
      <text class="a-t" x="825" y="105" text-anchor="middle">Google Drive</text>
      <text class="a-s" x="825" y="124" text-anchor="middle">PDFs and figures</text>
      <rect class="a-box" x="710" y="150" width="230" height="56" rx="10"/>
      <text class="a-t" x="825" y="175" text-anchor="middle">Language models</text>
      <text class="a-s" x="825" y="194" text-anchor="middle">Claude · LiteLLM (e.g. Gemma)</text>
      <rect class="a-box" x="710" y="220" width="230" height="56" rx="10"/>
      <text class="a-t" x="825" y="245" text-anchor="middle">Docling</text>
      <text class="a-s" x="825" y="264" text-anchor="middle">layout, figures, tables</text>
      <rect class="a-box" x="710" y="290" width="230" height="36" rx="10"/>
      <text class="a-s" x="825" y="313" text-anchor="middle">Semantic Scholar · CrossRef · arXiv</text>
      <path class="a-line" d="M220,97 C280,97 280,145 338,145" marker-end="url(#pm-arr)"/>
      <path class="a-line" d="M220,233 C280,233 280,185 338,185" marker-end="url(#pm-arr)"/>
      <path class="a-line" d="M590,140 C650,140 650,38 708,38" marker-end="url(#pm-arr)"/>
      <path class="a-line" d="M590,150 C650,150 650,108 708,108" marker-end="url(#pm-arr)"/>
      <path class="a-line" d="M590,165 C650,165 650,178 708,178" marker-end="url(#pm-arr)"/>
      <path class="a-line" d="M590,180 C650,180 650,248 708,248" marker-end="url(#pm-arr)"/>
      <path class="a-line" d="M590,195 C650,195 650,308 708,308" marker-end="url(#pm-arr)"/>
    </svg>
  </div>

  <div class="pm-grid" style="margin-top:1rem">
    <div class="pm-card">
      <h3>Models where they fit</h3>
      <p>Claude writes summaries, answers chats and builds tours. A smaller model handles bulk work such as the concept map. Without a GPU, Docling and the search embeddings (bge-small-en-v1.5) run on the CPU inside the container.</p>
    </div>
    <div class="pm-card">
      <h3>Your data stays yours</h3>
      <p>Your database, your storage, your API keys. Every LLM call is logged on the Tokens page. Nothing is shared unless you add teammates.</p>
    </div>
  </div>
</section>

<!-- ============================================================ setup -->
<section class="pm-section" id="setup">
  <div class="pm-section-head">
    <p class="pm-kicker">Set it up</p>
    <h2>Ask your coding agent to set it up</h2>
    <p>Open Claude Code, Codex or any coding agent on your computer and paste this:</p>
  </div>

  <div class="pm-agent-prompt">
    <pre><code id="pm-agent-prompt-text">Set up PaperManager for me by following
https://github.com/NiklasAbraham/PaperManager/blob/main/DEPLOY.md</code></pre>
    <button type="button" class="pm-btn pm-agent-copy" data-copy="#pm-agent-prompt-text"><i class="fas fa-copy"></i> Copy</button>
  </div>

  <p class="pm-agent-lede">
    <a href="{{ repo }}/blob/main/DEPLOY.md"><code>DEPLOY.md</code></a> is a runbook written for the
    agent. It works through it with you:
  </p>

  <ol class="pm-steps">
    <li>
      <h3>It checks your machine</h3>
      <p>Git and Docker must be installed, and Docker must be running. If not, it explains how to fix that and asks before installing anything.</p>
    </li>
    <li>
      <h3>It asks four questions</h3>
      <p>
        Your login name. Which AI account you have: <strong>Anthropic or OpenAI, one is enough</strong>.
        Where your PDFs live: on this computer, or in Google Drive. And an accent colour for the app.
      </p>
    </li>
    <li>
      <h3>It writes your settings and starts the app</h3>
      <p>
        Every answer goes into <code>.env</code>. With an Anthropic key, summaries, topics and the
        concept map run on Claude Haiku and chat runs on Claude. With an OpenAI key, everything runs
        on GPT-5 mini. The agent generates passwords and secrets itself; you paste your API key into
        the file, so it never passes through the chat.
      </p>
    </li>
    <li>
      <h3>You set your password, it checks everything</h3>
      <p>
        You type one command in your own terminal to choose a password. The agent then runs
        <code>check_setup.py</code>, which tests the database, sends one tiny message to your AI
        provider and checks the file storage. Then it hands you <strong>http://localhost:8080</strong>.
      </p>
    </li>
  </ol>

  <p class="pm-agent-lede">
    No GPU, LLM proxy or Google account needed. Plan for about 15 minutes, mostly the first Docker
    build. Every step in <code>DEPLOY.md</code> is also a plain command. Heroku, servers and Google
    Drive storage are in the
    <a href="{{ docs }}self_hosting/">self-hosting guide</a>.
  </p>
</section>

<!-- ============================================================ contributions -->
<section class="pm-section" id="contributions">
  <div class="pm-section-head">
    <p class="pm-kicker">Contributions</p>
    <h2>Built with help from others</h2>
    <p>
      PaperManager is open source, and parts of it come from other people's pull requests.
      Thank you to everyone who has contributed.
    </p>
  </div>

  <ul class="pm-contrib">
    <li>
      <p class="pm-contrib-who">
        <a href="https://github.com/AntoineLuciano">Antoine Luciano</a>
        <span>· <a href="{{ repo }}/pull/36">pull request #36</a>, October 2026</span>
      </p>
      <h3>People: surname order, researcher CVs, duplicate finder</h3>
      <p>
        The People page now sorts by surname. A new <strong>CV</strong> tab builds a researcher's
        profile from OpenAlex, ORCID, Wikidata and their homepage (position, education, h-index,
        most cited works, photo), and checks it against the papers in your library, so a namesake
        is not mistaken for the author. A <strong>duplicate finder</strong> groups people listed
        more than once ("C. P. Robert" and "Christian P. Robert") and merges them, keeping the
        other spellings as aliases.
      </p>
    </li>
  </ul>

  <p class="pm-agent-lede">
    Want to add something? Open an issue or a pull request on
    <a href="{{ repo }}">GitHub</a>; merged work is credited here.
  </p>
</section>

<!-- ============================================================ stack -->
<section class="pm-section">
  <div class="pm-section-head">
    <p class="pm-kicker">Built with</p>
  </div>
  <div class="pm-chips">
    <span>Python 3.11</span><span>FastAPI</span><span>Neo4j 5</span><span>React 19</span><span>TypeScript</span>
    <span>Vite</span><span>Tailwind CSS</span><span>react-force-graph</span><span>Anthropic SDK</span><span>Claude Code</span>
    <span>LiteLLM</span><span>OpenAI SDK</span><span>Docling</span><span>bge-small-en-v1.5</span><span>FastMCP</span><span>Google Drive API</span><span>Docker</span><span>MkDocs</span>
  </div>
</section>

<section class="pm-end">
  <h2>Stop collecting. Start understanding.</h2>
  <p>PaperManager is open source. Issues, ideas and pull requests are welcome.</p>
  <div class="pm-ctas">
    <a class="pm-btn pm-btn-primary" href="{{ repo }}"><i class="fab fa-github"></i> NiklasAbraham/PaperManager</a>
    <a class="pm-btn" href="{{ docs }}"><i class="fas fa-book"></i> Read the docs</a>
    <a class="pm-btn" href="https://www.linkedin.com/in/niklas-abraham-05983b247"><i class="fab fa-linkedin"></i> Get in touch</a>
  </div>
</section>

</div>

<script defer src="{{ '/assets/js/papermanager-hero.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script type="module" src="{{ '/assets/pm-chat-demo/pm-chat-demo.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script>(function(){var m=document.getElementById('pm-chat-menu'),n=document.getElementById('pm-chat-notes');if(!m||!n||!window.MutationObserver)return;function sync(){var b=m.querySelector('[aria-selected="true"]');if(!b)return;var i=b.getAttribute('data-pm-chat-tab');Array.prototype.forEach.call(n.querySelectorAll('[data-note]'),function(p){p.hidden=p.getAttribute('data-note')!==i;});}new MutationObserver(sync).observe(m,{attributes:true,subtree:true,attributeFilter:['aria-selected']});sync();})();</script>
<script defer src="{{ '/assets/js/papermanager-recolor.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script>document.querySelectorAll('.pm-agent-copy').forEach(function(b){b.addEventListener('click',function(){var t=document.querySelector(b.getAttribute('data-copy'));if(!t||!navigator.clipboard)return;navigator.clipboard.writeText(t.textContent).then(function(){b.innerHTML='<i class="fas fa-check"></i> Copied';setTimeout(function(){b.innerHTML='<i class="fas fa-copy"></i> Copy';},1600);});});});</script>
