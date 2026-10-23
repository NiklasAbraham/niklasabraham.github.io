// Fold a protein — chapter 3, the sampler as a film (registered with fw-core.js; replaces the old live sampler).
// One ray-traced PyMOL film of PDB 1N8Z sampled from noise (bin/fold_film/render.py): cartoon = the denoiser's guess
// x̂, beads = the noisy state x drawn at the network's input scale. Beside it the noise level σ and the step, read
// from fold.json at the video's current frame. The denoiser in the film is the exact posterior mean of four antigen
// poses (the crystal pose and three rigid alternatives), not OpenFold3's network.
(function () {
  'use strict';
  const FW = window.FW; if (!FW) return;
  const { esc } = FW.h;
  let META = null;
  const fmtS = (s) => (s >= 100 ? s.toFixed(0) : s >= 1 ? s.toFixed(1) : s >= 0.01 ? s.toFixed(3) : s.toFixed(4)) + ' Å';
  const phase = (s) => (s > 100 ? ['the guess x̂ is the average of all four poses', 'the antigen sits between them'] :
    s > 5 ? ['the guess commits to one pose', 'the beads gather around it'] :
      s > 0.05 ? ['the pose is fixed; side chains and loops settle', ''] : ['landed: one sample of the complex', 'started from other noise, it can land elsewhere']);

  function render(el, ctx) {
    const base = document.getElementById('fw').dataset.base;
    el.innerHTML = `<div class="fwf">
      <div class="fwf-v"><video muted loop playsinline preload="auto" poster="${base}fold.jpg" aria-label="Ray-traced film: the antibody–antigen complex 1N8Z condensing out of noise; the cartoon is the denoiser's guess, the beads are the noisy atoms.">
        <source src="${base}fold.webm" type="video/webm"><source src="${base}fold.mp4" type="video/mp4"></video></div>
      <div class="fwf-r">
        <p class="fwf-k">noise level <span class="lc">σ</span></p>
        <p class="fwf-sig mono">2560 Å</p>
        <p class="fwf-step mono">step 0 of 50</p>
        <svg class="fwf-sched" viewBox="0 0 260 90" preserveAspectRatio="none"></svg>
        <div class="fwf-ph"><b></b><span></span></div>
        <ul class="fwf-key">
          <li><i class="c"></i>cartoon: the guess x̂ at this step</li>
          <li><i class="b"></i>beads: the noisy atoms x, one per residue</li>
          <li><i class="h"></i>HER2 &nbsp;<i class="v"></i>antibody &nbsp;<i class="l"></i>its CDR loops</li>
        </ul>
        <p class="fwf-note">Rendered offline in PyMOL from the four-pose toy sampler (50 steps; AlphaFold&nbsp;3 uses 200).</p>
      </div></div>`;
    const v = el.querySelector('video'), sig = el.querySelector('.fwf-sig'), stp = el.querySelector('.fwf-step'), sch = el.querySelector('.fwf-sched'), ph = el.querySelector('.fwf-ph');
    let last = -1;
    const draw = (M) => {
      const S = M.sigma, n = S.length, lo = Math.log10(0.005), hi = Math.log10(2600);
      const y = (s) => 82 - (Math.log10(Math.max(s, 0.005)) - lo) / (hi - lo) * 74;
      let p = ''; S.forEach((s, i) => { p += (i ? 'L' : 'M') + (i / (n - 1) * 260).toFixed(1) + ',' + y(s).toFixed(1); });
      sch.innerHTML = `<path d="${p}" fill="none" stroke="#04204b" stroke-opacity=".35" stroke-width="1.5" vector-effect="non-scaling-stroke"/><path class="done" d="" fill="none" stroke="#b4552f" stroke-width="2.2" vector-effect="non-scaling-stroke"/><line class="now" x1="0" x2="0" y1="0" y2="90" stroke="#b4552f" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
      return { y, n, done: sch.querySelector('.done'), now: sch.querySelector('.now'), pts: S.map((s, i) => (i / (n - 1) * 260).toFixed(1) + ',' + y(s).toFixed(1)) };
    };
    let G = null;
    const update = () => {
      if (!META) return;
      if (!G) G = draw(META);
      const k = Math.max(0, Math.min(META.sigma.length - 1, Math.floor(v.currentTime * META.fps)));
      if (k === last) return; last = k;
      const s = META.sigma[k];
      sig.textContent = fmtS(s); stp.textContent = `step ${META.step[k]} of ${META.n_steps}`;
      G.done.setAttribute('d', 'M' + G.pts.slice(0, k + 1).join('L')); const x = (k / (G.n - 1) * 260).toFixed(1); G.now.setAttribute('x1', x); G.now.setAttribute('x2', x);
      const [a, b] = phase(s); if (ph.dataset.t !== a) { ph.dataset.t = a; ph.querySelector('b').textContent = a; ph.querySelector('span').textContent = b; }
    };
    (META ? Promise.resolve(META) : fetch(base + 'fold.json').then((r) => r.json()).then((m) => (META = m))).then(update).catch((e) => console.error(e));
    ctx.raf(() => { update(); });
    v.currentTime = 0;
    const p = v.play(); if (p && p.catch) p.catch(() => { /* autoplay refused: the poster stays, controls via click */ v.controls = true; });
    v.addEventListener('click', () => { if (v.paused) v.play(); else v.pause(); });
    ctx.play();
    return () => { try { v.pause(); } catch (e) { /* gone */ } };
  }

  FW.chapter({ id: 'film', title: 'Watch it fold', kicker: 'Part 3 · the sampler', short: 'the sampler',
    blurb: 'Every part from the last chapter, run 50 times in a row: a complex condensing out of noise.' });
  FW.step({ chapter: 'film', id: 'film', title: 'Watch it fold', caption: 'from noise to one structure, ray-traced', duration: 21000,
    points: ['The film starts from pure noise. At every step the denoiser makes a guess <b>x̂</b> (the cartoon) and the sampler moves the noisy atoms <b>x</b> (the beads) towards it.', 'At high noise the guess is the average of every pose the denoiser allows. Somewhere between about 100 and 10 Å it commits to one, and the rest of the run only refines it.'],
    principle: 'One run gives one structure. Started again from new noise, the same model can land in a different pose: that is the diversity a co-folding model has to keep.',
    render });
})();
