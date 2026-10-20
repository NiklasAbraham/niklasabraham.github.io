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
<div class="pm">

<header class="pm-hero">
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
  <p class="pm-meta">FastAPI · Neo4j · React · Claude · Docker &nbsp;·&nbsp; runs on your own machine with your own keys</p>
</header>

<figure class="pm-shot pm-shot-hero">
  <a href="{{ img }}concepts.webp"><img src="{{ img }}concepts.webp" width="1600" height="1000"
    alt="PaperManager paper view: the EDM paper's PDF on the left, and on the right an animated visualisation of the probability flow ODE, generated for page 2"></a>
</figure>
<p class="pm-caption">Reading <em>Elucidating the Design Space of Diffusion-Based Generative Models</em>: the panel on the right animates the probability-flow ODE that page 2 describes.</p>

<!-- ============================================================ why -->
<section class="pm-section">
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
<section class="pm-section">
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
        <a href="https://github.com/beltromatti/get-it">Get It.</a> (Apache-2.0).
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
        The knowledge chat answers across papers. Scope a question with mentions:
        <code>@project:</code>, <code>@topic:</code>, <code>@tag:</code>, <code>@paper:</code>,
        or <code>@user:</code> to ask what a teammate has been reading. It pulls in full texts,
        follows the graph, can run its own graph queries, and can search the web when the library
        is not enough.
      </p>
      <p>
        Choose the model per conversation: Claude through the API, Claude Code on a Claude
        subscription, or any OpenAI-compatible model through LiteLLM.
      </p>
    </div></div>
    <figure class="pm-shot"><a href="{{ img }}chat.webp"><img src="{{ img }}chat.webp" width="1376" height="934" loading="lazy"
      alt="Knowledge chat answering how HippoRAG treats concept nodes during retrieval, with headings and bullet points"></a></figure>
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

<!-- ============================================================ how it works -->
<section class="pm-section">
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
