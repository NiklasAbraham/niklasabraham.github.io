// Reading aids for the long reads (/projects/diffusion-architectures/explained/, and the energy post with
// data-stations="off" and its own data-brand / data-brand-sub):
//  - a contents rail on the left, built from the article's own part and section headings, in the
//    style of the thesis slide decks; it marks the section you are in and, above the contents,
//    where that section sits in the model (the same stations as the route strips in the text);
//  - a menu button that opens the rail as an overlay on narrower screens;
//  - click-to-enlarge for every figure, render and drawing.
(function () {
  'use strict';
  const art = document.querySelector('article.da');
  if (!art) return;

  // section id -> stations of the model it is about (keys of _includes/da-route.html)
  const STATIONS = [
    ['input', 'Input', 'sequences, ligands, MSA'],
    ['trunk', 'Trunk', 'MSA module · Pairformer'],
    ['cond', 'Condition c', 's and z, once per target'],
    ['noise', 'Noise level σ', 'Fourier code'],
    ['denoiser', 'Denoiser', 'atoms → tokens → atoms'],
    ['sampler', 'Sampler', '200 steps'],
    ['out', 'Structures', 'the samples that come out'],
  ];
  const AT = {
    'noise-in-data-out': ['denoiser', 'sampler'], 'three-targets': ['denoiser'], sampling: ['sampler'],
    unet: ['denoiser'], 'noise-level': ['noise', 'denoiser'], attention: ['denoiser'], prompt: ['cond', 'denoiser'],
    latents: ['denoiser'], 'training-path': ['noise'], guidance: ['sampler', 'cond'], symmetry: ['input', 'denoiser'],
    pair: ['trunk'], trunk: ['trunk', 'cond'], atoms: ['denoiser'], rfdiffusion: ['denoiser'],
    af3: ['input', 'trunk', 'cond', 'noise', 'denoiser', 'sampler', 'out'], 'af3-sampler': ['sampler'],
    boltz1: ['trunk', 'denoiser', 'sampler'], boltz2: ['trunk', 'denoiser', 'sampler'],
    openfold3: ['trunk', 'denoiser'], protenix: ['trunk', 'denoiser'], esmfold2: ['input', 'trunk', 'denoiser'],
    'side-by-side': ['input', 'trunk', 'cond', 'noise', 'denoiser', 'sampler'], errata: ['denoiser', 'sampler'],
    map: [],
  };
  const LI = art.dataset.contact || '';

  // ---------------------------------------------------------------- the rail
  const heads = [...art.querySelectorAll('h2[id], p.da-part')];
  const rail = document.createElement('aside');
  rail.id = 'da-rail';
  rail.setAttribute('aria-label', 'Contents');
  let html = '<div class="rprog"><span></span></div>'
    + `<div class="tbrand">${art.dataset.brand || 'Diffusion denoisers'}</div><div class="tsub">${art.dataset.brandSub || 'from the noise up · a long read'}</div>`
    + (art.dataset.stations === 'off' ? '' : '<div class="tlabel">Where you are in the model</div><ol class="rmini">'
    + STATIONS.map(([k, t, s]) => `<li data-st="${k}"><b>${t}</b><i>${s}</i></li>`).join('') + '</ol>')
    + '<div class="tlabel">Contents</div><nav>';
  heads.forEach((h) => {
    if (h.classList.contains('da-part')) {
      const strong = h.querySelector('strong');
      const part = h.childNodes[0] ? h.childNodes[0].textContent.trim() : '';
      html += `<div class="rpart"><span>${part}</span>${strong ? strong.textContent : ''}</div>`;
    } else {
      const num = h.querySelector('.num');
      const title = [...h.childNodes].filter((n) => !(n.classList && n.classList.contains('num'))).map((n) => n.textContent).join('').trim();
      html += `<a href="#${h.id}" data-id="${h.id}"><span class="tn">${num ? num.textContent : ''}</span><span>${title}</span></a>`;
    }
  });
  html += '</nav>';
  if (LI) html += `<div class="tfoot">Found a mistake? <a href="${LI}" target="_blank" rel="noopener">Message me on LinkedIn</a>.</div>`;
  rail.innerHTML = html;
  document.body.appendChild(rail);

  const btn = document.createElement('button');
  btn.id = 'da-railbtn';
  btn.type = 'button';
  btn.setAttribute('aria-controls', 'da-rail');
  btn.setAttribute('aria-label', 'Contents');
  btn.innerHTML = '<i></i><i></i><i></i><span>Contents</span>';
  document.body.appendChild(btn);
  const veil = document.createElement('div');
  veil.id = 'da-veil';
  document.body.appendChild(veil);
  const setOpen = (o) => { document.body.classList.toggle('da-rail-open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); };
  btn.addEventListener('click', () => setOpen(!document.body.classList.contains('da-rail-open')));
  veil.addEventListener('click', () => setOpen(false));
  rail.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) setOpen(false); });

  const navbar = document.getElementById('navbar');
  const place = () => {
    const top = navbar ? navbar.getBoundingClientRect().bottom : 0;
    rail.style.top = Math.max(0, top) + 'px';
    btn.style.top = Math.max(0, top) + 12 + 'px';
  };
  place();
  window.addEventListener('resize', place);

  // ---------------------------------------------------------------- scrollspy
  const links = [...rail.querySelectorAll('nav a')];
  const minis = [...rail.querySelectorAll('.rmini li')];
  const prog = rail.querySelector('.rprog span');
  const h2s = heads.filter((h) => h.tagName === 'H2');
  let current = null;
  const spy = () => {
    const y = 140;
    let cur = h2s[0];
    for (const h of h2s) { if (h.getBoundingClientRect().top < y) cur = h; else break; }
    const r = art.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (y - r.top) / (r.height - window.innerHeight * 0.6)));
    prog.style.width = (frac * 100).toFixed(1) + '%';
    if (!cur || cur === current) return;
    current = cur;
    links.forEach((a) => a.classList.toggle('on', a.dataset.id === cur.id));
    const st = AT[cur.id] || [];
    minis.forEach((li) => li.classList.toggle('on', st.includes(li.dataset.st)));
    const on = rail.querySelector('nav a.on');
    if (on && !document.body.classList.contains('da-rail-open')) {
      const rr = rail.getBoundingClientRect(), ar = on.getBoundingClientRect();
      if (ar.top < rr.top + 80 || ar.bottom > rr.bottom - 40) rail.scrollTop += ar.top - rr.top - rr.height / 2;
    }
  };
  let ticking = false;
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; spy(); }); } }, { passive: true });
  spy();

  // ---------------------------------------------------------------- enlarge
  const box = document.createElement('div');
  box.id = 'da-zoom';
  box.innerHTML = '<div class="zbar"><span class="zt"></span><span class="zh">click the figure for full size · Esc to close</span><button type="button" class="zx" aria-label="Close">✕</button></div><div class="zstage"></div>';
  document.body.appendChild(box);
  const stage = box.querySelector('.zstage');
  const close = () => { box.classList.remove('open'); document.body.classList.remove('da-zoom-open'); stage.innerHTML = ''; };
  box.querySelector('.zx').addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); setOpen(false); } });
  stage.addEventListener('click', () => stage.classList.toggle('full'));
  const open = (fig) => {
    const src = fig.querySelector('.media-stage img, .da-svgstage svg');
    if (!src) return;
    const node = src.cloneNode(true);
    node.removeAttribute('loading');
    if (node.tagName.toLowerCase() === 'svg') {
      // fresh ids so the clone's arrow markers do not clash with the original's
      const sfx = '-z' + Math.random().toString(36).slice(2, 7);
      node.querySelectorAll('[id]').forEach((el) => {
        const old = el.id; el.id = old + sfx;
        node.querySelectorAll(`[marker-end="url(#${old})"]`).forEach((p) => p.setAttribute('marker-end', `url(#${old}${sfx})`));
      });
    }
    stage.innerHTML = '';
    stage.classList.remove('full');
    stage.appendChild(node);
    const t = fig.querySelector('.concept-title');
    box.querySelector('.zt').textContent = t ? t.textContent : '';
    box.classList.add('open');
    document.body.classList.add('da-zoom-open');
  };
  art.querySelectorAll('figure.concept-media, figure.concept-drawing').forEach((fig) => {
    if (fig.querySelector('video')) return;
    const b = fig.querySelector('[data-zoom]');
    if (b) b.addEventListener('click', () => open(fig));
    const target = fig.querySelector('.media-stage img, .da-svgstage svg');
    if (target) { target.style.cursor = 'zoom-in'; target.addEventListener('click', () => open(fig)); }
  });
})();
