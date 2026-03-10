---
layout: page
permalink: /thesis/
title: BSc Thesis
subtitle: Predicting β-Lactamase Resistance from Sequence Using Protein Language Models
nav: true
sort_menu: 3
---

<div class="row mt-3">
  <div class="col-sm-12">

    <h3>Overview</h3>
    <p>
      My bachelor's thesis was completed in September 2025 at the
      <a href="https://www.ibtb.uni-stuttgart.de/" target="_blank">Institute of Biochemistry and Technical Biochemistry</a>,
      University of Stuttgart, under the supervision of
      <a href="https://www.ibtb.uni-stuttgart.de/institut/team/Pleiss-00001/" target="_blank">Prof. Jürgen Pleiss</a>.
      The degree was awarded with a final grade of 1.9 (5th out of 22 in the cohort).
    </p>

    <h3>Thesis</h3>
    <p>
      The central question was whether the representation space of large pre-trained protein language models (PLMs)
      encodes enough biochemical information to predict antibiotic resistance phenotypes directly from amino acid
      sequence — without structural data, alignments, or hand-crafted features.
    </p>
    <p>
      Using β-lactamase enzymes as the target family, I built an end-to-end framework that pulls sequence data from
      curated databases (NCBI, CARD, UniProt), generates embeddings with ESM-2 and ESM-C, and trains lightweight
      classifiers to predict resistance phenotypes. A core contribution was the design and benchmarking of novel
      residue-level pooling strategies: <em>self-similarity weighted aggregation</em>, which up-weights residues
      whose local context diverges most from the global mean, and <em>biochemically informed positional weighting</em>,
      which assigns importance based on known functional site annotations. Both strategies yielded substantial
      gains over classical mean pooling and offered mechanistic insight into which parts of the sequence drive
      the model's predictions. This work directly informed the manuscript in preparation on geometric encoding
      of enzymatic mechanism in PLM representations (see <a href="/research/">Research</a>).
    </p>

    <div style="width:100%; margin: 1.5rem 0;">
      <a href="/assets/pdf/bachelor_thesis_niklas_abraham.pdf" target="_blank" class="btn btn-sm z-depth-0" role="button" style="margin-bottom: 0.75rem;">
        Download Thesis PDF
      </a>
      <div style="width:100%; height:780px; border:1px solid #ddd; border-radius:6px; overflow:hidden;">
        <iframe
          src="/assets/pdf/bachelor_thesis_niklas_abraham.pdf"
          width="100%"
          height="100%"
          style="border:none; display:block;">
        </iframe>
      </div>
    </div>

    <h3 style="margin-top: 2rem;">Presentation</h3>
    <p>
      The slides below were used for the final thesis defence. They give a concise walk-through of the
      motivation, methodology, key results, and outlook, and may be a quicker entry point than the full thesis.
    </p>

    <div style="width:100%; margin: 1.5rem 0;">
      <a href="/assets/pdf/presentation_niklas_abraham.pdf" target="_blank" class="btn btn-sm z-depth-0" role="button" style="margin-bottom: 0.75rem;">
        Download Presentation PDF
      </a>
      <div style="width:100%; height:600px; border:1px solid #ddd; border-radius:6px; overflow:hidden;">
        <iframe
          src="/assets/pdf/presentation_niklas_abraham.pdf"
          width="100%"
          height="100%"
          style="border:none; display:block;">
        </iframe>
      </div>
    </div>

  </div>
</div>
