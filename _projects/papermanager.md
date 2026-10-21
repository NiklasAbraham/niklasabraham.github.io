---
layout: default
title: PaperManager
description: A self-hosted second brain for research papers. Drop in a PDF and get a summary, figures, references, interactive concept visualisations, a guided tour and a concept map across your projects, all in one Neo4j knowledge graph you can chat with.
importance: 0
category: software
permalink: /projects/papermanager/
og_image: https://niklas-abraham.de/assets/papermanager/og.jpg
---
{%- assign img = '/assets/papermanager/' | relative_url -%}
{%- assign repo = 'https://github.com/NiklasAbraham/PaperManager' -%}
{%- assign docs = 'https://niklasabraham.github.io/PaperManager/' -%}
<div class="pm" id="pm" data-hero="a">
<script>(function(){var r=document.getElementById('pm'),H='abcdef',T=['violet','teal','amber','rose','blue','graphite'],q=new URLSearchParams(location.search),h=(q.get('hero')||'').toLowerCase(),t=(q.get('theme')||'').toLowerCase();try{if(H.indexOf(h)<0||h.length!==1)h=localStorage.getItem('pm-hero')||'';if(T.indexOf(t)<0)t=localStorage.getItem('pm-theme')||'';}catch(e){}if(h.length===1&&H.indexOf(h)>=0)r.setAttribute('data-hero',h);if(T.indexOf(t)>=0)r.setAttribute('data-pm-theme',t);})();</script>

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
      <button type="button" data-set-hero="c" title="C · Silk infinity">C</button>
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
    </div>
  </div>
</div>

<div class="pm-heroes">

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

<!-- ============================================================ hero E: editorial -->
<section class="pm-hv pm-hv-e" data-hero="e" data-name="Editorial">
  <div class="pm-e-grid">
    <div class="pm-e-copy">
      <p class="pm-e-kicker">PaperManager, an open-source research tool</p>
      <h1 class="pm-e-title">A second brain for <em>research papers</em></h1>
      <p class="pm-e-lede">
        PaperManager turns a pile of PDFs into a knowledge graph you can read, search and talk to.
        Drop in a paper and it finds the metadata, writes a summary, pulls out figures and references,
        draws the ideas on each page as interactive visualisations, and maps how every paper in a
        project connects to the others.
      </p>
      <div class="pm-ctas pm-ctas-left">
        <a class="pm-btn pm-btn-primary" href="{{ repo }}"><i class="fab fa-github"></i> Code on GitHub</a>
        <a class="pm-btn" href="#setup"><i class="fas fa-rocket"></i> Set it up</a>
        <a class="pm-e-link" href="{{ docs }}">Documentation <span aria-hidden="true">→</span></a>
      </div>
    </div>
    <div class="pm-e-fan" tabindex="0" aria-label="Three screenshots: concept tour, interactive concept, project concept map">
      <figure class="pm-shot pm-e-card pm-e-1"><img src="{{ img }}tour.webp" width="1600" height="1000" loading="lazy" alt="Quick tour of the Feynman-Kac Correctors paper"><figcaption>Quick tour</figcaption></figure>
      <figure class="pm-shot pm-e-card pm-e-2"><img src="{{ img }}concept-map.webp" width="1600" height="1000" loading="lazy" alt="Concept map of 210 papers"><figcaption>Concept map</figcaption></figure>
      <figure class="pm-shot pm-e-card pm-e-3"><img src="{{ img }}concepts.webp" width="1600" height="1000" loading="lazy" alt="Interactive concept: the probability flow ODE next to its PDF page"><figcaption>Concepts</figcaption></figure>
    </div>
  </div>
</section>

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

</div>

<!-- ============================================================ why -->
<section class="pm-section pm-why">
  <div class="pm-section-head">
    <p class="pm-kicker">Why</p>
    <h2>Reading papers is the slow part of research</h2>
    <p>
      Reference managers store PDFs; they do not help you understand them or see how they fit
      together. I wanted one place where every paper I read is parsed, summarised, linked to its
      authors, topics and citations, and explained right next to the page I am on. PaperManager
      started as my own reading tool during my master's thesis and now holds a few hundred
      full-text papers and several thousand linked references.
    </p>
  </div>
</section>

<!-- ============================================================ features -->
<section class="pm-section" id="features">
  <div class="pm-section-head">
    <p class="pm-kicker">Features</p>
    <h2>What it does</h2>
  </div>

  <div class="pm-feature">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">1 · Get papers in</p>
      <h3>Drop a PDF, paste a link, or import a list</h3></div>
      <div class="pm-feature-body">
      <p>Every paper goes through the same pipeline:</p>
      <ul>
        <li><strong>Metadata</strong> from the DOI or arXiv id via Semantic Scholar and CrossRef, with fallbacks when a PDF has neither. You review it before anything is saved.</li>
        <li><strong>Duplicate check</strong> by DOI and title, so the same paper never ends up twice.</li>
        <li><strong>Summary, topics and tags</strong> written by Claude from the full text.</li>
        <li><strong>Figures, tables and references</strong> extracted with the Docling layout model; each reference becomes a node in the citation graph.</li>
      </ul>
      <p>Besides PDFs, it ingests arXiv, DOI, PubMed and bioRxiv links, bulk lists, literature searches and RSS feeds.</p>
    </div></div>
    <figure class="pm-shot"><a href="{{ img }}library.webp"><img src="{{ img }}library.webp" width="1600" height="1000" loading="lazy"
      alt="Library dashboard with paper, author, topic and tag counts, papers by year, top topics, recently added papers and venues"></a></figure>
  </div>

  <div class="pm-feature">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">2 · Read with help</p>
      <h3>Summary, figures and chat next to the PDF</h3></div>
      <div class="pm-feature-body">
      <p>
        Each paper opens in one view: abstract, PDF, figures, tables, summary, references,
        related papers, claims and metadata. The summary splits the paper into contribution,
        methods, inputs and outputs, with the maths typeset.
      </p>
      <p>
        Highlight passages in five colours (key insight, evidence, context, question, follow-up),
        keep markdown notes that link <code>@people</code> and <code>#topics</code> into the graph,
        and ask questions about the paper or about one figure. Export any paper as BibTeX or
        Markdown.
      </p>
    </div></div>
    <div class="pm-pair">
      <figure class="pm-shot"><a href="{{ img }}summary.webp"><img src="{{ img }}summary.webp" width="1600" height="1000" loading="lazy"
        alt="AI summary tab with sections for contribution and methods, including typeset formulas"></a></figure>
      <figure class="pm-shot"><a href="{{ img }}figures.webp"><img src="{{ img }}figures.webp" width="1600" height="1000" loading="lazy"
        alt="Figures tab listing the paper's extracted figures with captions and an Ask button for each"></a></figure>
    </div>
  </div>

  <div class="pm-feature">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">3 · Concepts</p>
      <h3>The ideas on each page, made visible</h3></div>
      <div class="pm-feature-body">
      <p>
        A scan reads every page and picks the ideas a picture would explain better than prose:
        a sampler, a loss, a scaling law. For each it generates a visualisation, which can be an
        animation, a formula broken into its parts, a plot of the paper's own numbers, or a
        short explanation. Marks on the PDF show where each one belongs; click a mark to open it.
      </p>
      <p>
        The animations run in a sandboxed frame, and plots carry data rather than code. The
        feature is adapted from the open-source project
        <a href="https://github.com/beltromatti/get-it">Get It.</a> by beltromatti (Apache-2.0).
      </p>
    </div></div>
    <figure class="pm-shot"><a href="{{ img }}concepts.webp"><img src="{{ img }}concepts.webp" width="1600" height="1000" loading="lazy"
      alt="Concepts tab: an animated vector field of the probability flow ODE next to the PDF page it explains"></a></figure>
  </div>

  <div class="pm-feature">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">4 · Quick tour</p>
      <h3>A guided path through a long paper</h3></div>
      <div class="pm-feature-body">
      <p>
        For a paper you do not have time to read end to end, the tour gives a one-paragraph
        overview, says which parts you can safely skip, and then walks you through 6 to 12 stops:
        the problem, the key equation, the main result. Each stop is anchored to a verbatim
        passage, so the PDF jumps to the right page and marks it. Step through with the arrow keys.
      </p>
    </div></div>
    <figure class="pm-shot"><a href="{{ img }}tour.webp"><img src="{{ img }}tour.webp" width="1600" height="1000" loading="lazy"
      alt="Tour tab for the Feynman-Kac Correctors paper: overview, what to skip, and stop 2 of 11 opened next to the equations on page 3"></a></figure>
  </div>

  <div class="pm-feature">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">5 · Project concept map</p>
      <h3>How a whole field fits together</h3></div>
      <div class="pm-feature-body">
      <p>
        Group papers into projects, and PaperManager maps them. For every paper a language model
        names its key concepts (methods, models, datasets, metrics, theories) and how they relate.
        Concepts are shared across papers, so the map shows which ideas a field is built on and
        which papers connect them.
      </p>
      <p>
        Node size counts papers, colour is the kind of concept, and citations between papers are
        drawn in. Filter by author, year or kind, or by how many papers share a concept. Here,
        210 thesis papers: image diffusion at the top, protein structure at the bottom.
      </p>
    </div></div>
    <figure class="pm-shot"><a href="{{ img }}concept-map.webp"><img src="{{ img }}concept-map.webp" width="1600" height="1000" loading="lazy"
      alt="Force-directed concept map of 210 papers, with concepts such as Diffusion Models, Flow Matching, Memorization, AlphaFold3 and Protein Folding coloured by kind"></a></figure>
  </div>

  <div class="pm-feature">
    <div class="pm-feature-text"><div class="pm-feature-head">
      <p class="pm-kicker">6 · Knowledge chat</p>
      <h3>Ask your whole library</h3></div>
      <div class="pm-feature-body">
      <p>
        The knowledge chat answers across papers and is laid out like a desk. Citations in an
        answer are links: click one and the paper opens beside the conversation with its summary,
        a link to the PDF and a jump into the library. Under each section of an answer it can
        draw <strong>concept cards</strong>, the same visualisations as on the PDF pages, and
        show molecules in 3D: <strong>structure cards</strong> load an entry from the PDB or an
        AlphaFold DB prediction (coloured by pLDDT), highlight chains and residues, and can be
        spun, surfaced and saved as an image.
      </p>
      <p>
        Scope a question with <code>@project:</code>, <code>@topic:</code>, <code>@tag:</code>,
        <code>@paper:</code>, <code>@person:</code>, or <code>@user:</code> to ask what a teammate
        has been reading. It pulls in full texts, follows the graph, runs its own graph queries
        and searches the web when the library is not enough. Any answer can start a new strand,
        so a side question does not lose the main thread. Choose the model per conversation:
        Claude through the API, Claude Code on a Claude subscription, or any OpenAI-compatible
        model through LiteLLM.
      </p>
    </div></div>
    <div class="pm-chat-demo" data-pm-chat-demo="{{ '/assets/pm-chat-demo/data/' | relative_url }}">
      <div class="pm-chat-demo-wait" aria-hidden="true"><span>Loading the live demo of the knowledge chat …</span></div>
      <noscript><style>.pm-chat-demo-wait { display: none; }</style><figure class="pm-shot"><img src="{{ img }}chat-preview.webp" width="1600" height="1000"
        alt="Knowledge chat comparing AlphaFold 2 and AlphaFold 3, with the cited AlphaFold 3 paper open in a pane beside the answer"></figure></noscript>
    </div>
    <p class="pm-caption">
      Real conversations over a library of public papers, replayed with the app's own components:
      pick an example, open a citation, step through a formula, pause an animation, turn a molecule.<br>
      Concept visualisations are adapted from <a href="https://github.com/beltromatti/get-it">Get It.</a> by beltromatti (Apache-2.0);
      structures are drawn with <a href="https://3dmol.csb.pitt.edu">3Dmol.js</a> (BSD-3-Clause).
    </p>
  </div>

  <div class="pm-grid">
    <div class="pm-card">
      <i class="fas fa-plug pm-icon"></i>
      <h3>MCP server</h3>
      <p>35 tools for Claude Desktop and Claude Code: search the library, read a paper, add notes and tags, upload PDFs, merge duplicates.</p>
    </div>
    <div class="pm-card">
      <i class="fas fa-project-diagram pm-icon"></i>
      <h3>Graph and Cypher</h3>
      <p>Everything lives in Neo4j. Browse papers, people, topics and projects as a graph, or query it directly in the built-in Cypher editor.</p>
    </div>
    <div class="pm-card">
      <i class="fas fa-search pm-icon"></i>
      <h3>Discovery</h3>
      <p>Literature search across arXiv, Semantic Scholar and PubMed, author tracking, RSS blogs and related-paper suggestions.</p>
    </div>
    <div class="pm-card">
      <i class="fas fa-lightbulb pm-icon"></i>
      <h3>Synthesis</h3>
      <p>Cross-paper synthesis, claim extraction and a research-gap finder that reads a whole project or tag at once.</p>
    </div>
    <div class="pm-card">
      <i class="fas fa-users pm-icon"></i>
      <h3>Teams</h3>
      <p>Admin-managed accounts, shared projects and per-user API keys, with JWT login and rate limiting.</p>
    </div>
    <div class="pm-card">
      <i class="fas fa-clone pm-icon"></i>
      <h3>Clean data</h3>
      <p>Duplicate detection and a merge manager, so citation stubs and uploaded PDFs resolve to one paper.</p>
    </div>
  </div>
</section>

<!-- ============================================================ pipeline timeline -->
<section class="pm-section pm-tl-section" id="pipeline">
  <div class="pm-tl-head">
    <span class="pm-badge pm-badge-outline">Step by step</span>
    <h2>What happens when you add a paper</h2>
    <p>Most of the work runs while the paper waits in the upload queue, so saving it is quick. You check the details once; the rest happens on its own or when you ask for it.</p>
  </div>
  <ol class="pm-tl">
    <li class="pm-tl-item">
      <div class="pm-tl-rail"><span class="pm-tl-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 14v4.5c0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5V14"/></svg></span><span class="pm-tl-line" aria-hidden="true"></span></div>
      <div class="pm-tl-body">
        <div class="pm-tl-top"><span class="pm-tl-when">Instant</span><span class="pm-badge">Automatic</span></div>
        <h3>Drop a PDF or paste a link</h3>
        <p>Processing starts the moment the file lands in the upload queue, and nothing is saved yet. Links from arXiv, DOI, PubMed and bioRxiv work too, as do bulk lists.</p>
      </div>
    </li>
    <li class="pm-tl-item">
      <div class="pm-tl-rail"><span class="pm-tl-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg></span><span class="pm-tl-line" aria-hidden="true"></span></div>
      <div class="pm-tl-body">
        <div class="pm-tl-top"><span class="pm-tl-when">Seconds</span><span class="pm-badge">Automatic</span></div>
        <h3>Metadata and duplicate check</h3>
        <p>The DOI or arXiv id on the first page is looked up in Semantic Scholar, then CrossRef. Without one, a language model reads the first page, with simple heuristics as the last resort. A paper already in your library is flagged before you go any further.</p>
      </div>
    </li>
    <li class="pm-tl-item">
      <div class="pm-tl-rail"><span class="pm-tl-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 21 8l-9 4.5L3 8z"/><path d="m3 12 9 4.5 9-4.5M3 16l9 4.5 9-4.5"/></svg></span><span class="pm-tl-line" aria-hidden="true"></span></div>
      <div class="pm-tl-body">
        <div class="pm-tl-top"><span class="pm-tl-when">In the queue</span><span class="pm-badge">Automatic</span></div>
        <h3>Layout and analysis, done ahead</h3>
        <p>Docling finds the figures and tables, and the language models write the summary and suggest topics, claims, references, affiliations and tags. Results are cached by the PDF's hash; the queue row turns green when everything is ready.</p>
      </div>
    </li>
    <li class="pm-tl-item">
      <div class="pm-tl-rail"><span class="pm-tl-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m8 12.3 2.7 2.7L16 9.5"/></svg></span><span class="pm-tl-line" aria-hidden="true"></span></div>
      <div class="pm-tl-body">
        <div class="pm-tl-top"><span class="pm-tl-when">When you are ready</span><span class="pm-badge pm-badge-secondary">You confirm</span></div>
        <h3>Check the details</h3>
        <p>A form shows the metadata it found. Fix anything that is off, choose paper, book or lecture deck, and optionally change the instructions for the summary. Nothing is stored until you click Upload.</p>
      </div>
    </li>
    <li class="pm-tl-item">
      <div class="pm-tl-rail"><span class="pm-tl-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/></svg></span><span class="pm-tl-line" aria-hidden="true"></span></div>
      <div class="pm-tl-body">
        <div class="pm-tl-top"><span class="pm-tl-when">~10–20 s</span><span class="pm-badge">Automatic</span></div>
        <h3>Into your Drive and the graph</h3>
        <p>The PDF goes to your Google Drive and the paper becomes a node in Neo4j, or fills in a citation stub that was already there. Authors, topics and claims are linked, figure and table images are stored, and an embedding is added if you configured a model.</p>
      </div>
    </li>
    <li class="pm-tl-item">
      <div class="pm-tl-rail"><span class="pm-tl-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg></span><span class="pm-tl-line" aria-hidden="true"></span></div>
      <div class="pm-tl-body">
        <div class="pm-tl-top"><span class="pm-tl-when">After upload</span><span class="pm-badge pm-badge-secondary">You confirm</span></div>
        <h3>References, tags, project and people</h3>
        <p>Review the extracted references: each becomes a linked paper in the citation graph and is merged with the full paper if you add it later. Then accept tag suggestions, pick a project, and note who shared the paper with you.</p>
      </div>
    </li>
    <li class="pm-tl-item">
      <div class="pm-tl-rail"><span class="pm-tl-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.4"/><circle cx="5" cy="6.5" r="1.9"/><circle cx="19" cy="6.5" r="1.9"/><circle cx="12" cy="20" r="1.9"/><path d="M10 10.8 6.6 7.7M14 10.8l3.4-3.1M12 14.4v3.7"/></svg></span><span class="pm-tl-line" aria-hidden="true"></span></div>
      <div class="pm-tl-body">
        <div class="pm-tl-top"><span class="pm-tl-when">Every 10 min</span><span class="pm-badge">Automatic</span></div>
        <h3>Onto the project's concept map</h3>
        <p>A background sweep maps every new project paper once it has a summary: 6 to 15 key concepts and how they relate, shared with the other papers in the project.</p>
      </div>
    </li>
    <li class="pm-tl-item">
      <div class="pm-tl-rail"><span class="pm-tl-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 13.8 8.6 19 10.2 13.8 12 12 17l-1.8-5L5 10.2l5.2-1.6z"/><path d="m18.5 15.5.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg></span></div>
      <div class="pm-tl-body">
        <div class="pm-tl-top"><span class="pm-tl-when">On demand</span><span class="pm-badge pm-badge-outline">On demand</span></div>
        <h3>Concepts and a quick tour</h3>
        <p>While reading, click Find concepts to mark the ideas on each page that a picture explains best and generate their visualisations, or ask for a quick tour: 6 to 12 guided stops through the PDF, ready in about a minute.</p>
      </div>
    </li>
  </ol>
</section>

<!-- ============================================================ how it works -->
<section class="pm-section" id="how">
  <div class="pm-section-head">
    <p class="pm-kicker">How it works</p>
    <h2>One graph in the middle</h2>
    <p>
      A React app talks to a FastAPI backend. The backend keeps every paper, author, topic,
      tag, note, concept and citation as nodes and relationships in Neo4j. PDFs are stored in
      Google Drive. Language models are called for the steps that need them, and every prompt
      is a plain text file you can edit without restarting.
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
      <h3>An upload, step by step</h3>
      <p>Parse the PDF → find the DOI → fetch metadata → you confirm → store the PDF → create the paper node (or enrich an existing citation stub) → summary, topics, figures, references → concepts and concept map in the background.</p>
    </div>
    <div class="pm-card">
      <h3>Models where they fit</h3>
      <p>Claude writes summaries, answers chats and builds tours. A smaller model through LiteLLM handles bulk work such as the concept map. Without a GPU, Docling runs on the CPU inside the container.</p>
    </div>
    <div class="pm-card">
      <h3>Your data stays yours</h3>
      <p>Self-hosted: your database, your Drive, your API keys. Nothing is shared unless you add teammates.</p>
    </div>
  </div>
</section>

<!-- ============================================================ setup -->
<section class="pm-section" id="setup">
  <div class="pm-section-head">
    <p class="pm-kicker">Set it up</p>
    <h2>Run your own instance in about 20 minutes</h2>
    <p>
      Everything ships as one Docker image with the frontend and backend, plus Neo4j next to it.
      You need Git, Docker, a Google account (for Drive) and, for the AI features, an
      <a href="https://console.anthropic.com">Anthropic API key</a>. The full guide, including
      Heroku hosting and troubleshooting, is in the
      <a href="{{ docs }}self_hosting/">self-hosting guide</a>.
    </p>
  </div>

  <ol class="pm-steps">
    <li>
      <h3>Get the code and create your settings file</h3>
<pre><code>git clone https://github.com/NiklasAbraham/PaperManager.git
cd PaperManager
cp .env.example .env</code></pre>
      <p>In <code>.env</code>, set at least these values and leave the rest at their defaults:</p>
<pre><code>NEO4J_PASSWORD=<span class="c"># any long random string</span>
JWT_SECRET_KEY=<span class="c"># output of: openssl rand -hex 32</span>
DEFAULT_USER_NAME=<span class="c"># your login name (owner and admin)</span>
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_DRIVE_FOLDER_ID=<span class="c"># from step 2</span>
DOCLING_MODE=local</code></pre>
      <p>Optional: point <code>LITELLM_ENDPOINT</code> at any OpenAI-compatible API (for example OpenRouter) to enable the Gemma model and the project concept map.</p>
    </li>
    <li>
      <h3>Connect Google Drive (once)</h3>
      <p>
        In the Google Cloud console, enable the Drive API, create an OAuth client of type
        <em>Desktop app</em> and save its JSON as <code>backend/credentials.json</code>. Create a
        Drive folder for the PDFs and copy its id into <code>.env</code>. Then sign in once:
      </p>
<pre><code>python3 -m venv .venv-drive
.venv-drive/bin/pip install google-auth-oauthlib google-api-python-client
.venv-drive/bin/python backend/scripts/setup_drive_oauth.py</code></pre>
    </li>
    <li>
      <h3>Start it</h3>
<pre><code>docker compose -f docker-compose.selfhost.yml up -d --build   <span class="c"># first build takes ~10 min</span>
docker compose -f docker-compose.selfhost.yml logs -f app      <span class="c"># wait for "Application startup complete"</span></code></pre>
    </li>
    <li>
      <h3>Create your account and open the app</h3>
<pre><code>docker compose -f docker-compose.selfhost.yml exec app python scripts/create_default_user.py</code></pre>
      <p>Then open <strong>http://localhost:8080</strong>, log in and drop in your first PDF.</p>
    </li>
    <li>
      <h3>Optional: connect Claude</h3>
      <p>
        Add the MCP server to Claude Desktop or Claude Code to search and annotate your library
        from a chat. To run chats, concepts and tours on a Claude Pro or Max subscription instead
        of the API, put a token from <code>claude setup-token</code> into
        <code>CLAUDE_CODE_OAUTH_TOKEN</code>. See the
        <a href="{{ docs }}user-guide/mcp-server/">MCP guide</a>.
      </p>
    </li>
  </ol>
</section>

<!-- ============================================================ stack -->
<section class="pm-section">
  <div class="pm-section-head">
    <p class="pm-kicker">Built with</p>
  </div>
  <div class="pm-chips">
    <span>Python 3.11</span><span>FastAPI</span><span>Neo4j 5</span><span>React 19</span><span>TypeScript</span>
    <span>Vite</span><span>Tailwind CSS</span><span>react-force-graph</span><span>Anthropic SDK</span><span>Claude Code</span>
    <span>LiteLLM</span><span>Docling</span><span>FastMCP</span><span>Google Drive API</span><span>Docker</span><span>MkDocs</span>
  </div>
</section>

<section class="pm-end">
  <h2>Try it, fork it, tell me what breaks</h2>
  <p>PaperManager is open source. Issues, ideas and pull requests are welcome.</p>
  <div class="pm-ctas">
    <a class="pm-btn pm-btn-primary" href="{{ repo }}"><i class="fab fa-github"></i> NiklasAbraham/PaperManager</a>
    <a class="pm-btn" href="{{ docs }}"><i class="fas fa-book"></i> Read the docs</a>
    <a class="pm-btn" href="https://www.linkedin.com/in/niklas-abraham-05983b247"><i class="fab fa-linkedin"></i> Get in touch</a>
  </div>
</section>

</div>

<script defer src="{{ '/assets/js/papermanager-hero.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/papermanager-hero-c.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script type="module" src="{{ '/assets/pm-chat-demo/pm-chat-demo.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
