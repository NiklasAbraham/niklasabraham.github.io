---
layout: page
permalink: /research/
title: Research
years: [2026, 2025]
nav: true
sort_menu: 1
---
My research focuses on generative modelling for structural biology and machine learning methods for bioinformatics. Current interests include score-based diffusion, flow-matching, and protein language model representations, with the broader goal of accelerating computational tools for protein engineering and drug discovery.

### Publications
Below is a list of my publications in reversed chronological order. 

<div class="publications">

<br/>
{% for y in page.years %}
  <div class="row m-0 p-0" style="border-top: 1px solid #ddd; flex-direction: row-reverse;">
    <div class="col-sm-1 mt-2 p-0 pr-1">
      <h3 class="bibliography-year">{{y}}</h3>
    </div>
    <div class="col-sm-11 p-0">
      {% bibliography -f papers -q @*[year={{y}}]* %}
    </div>
  </div>
{% endfor %}
