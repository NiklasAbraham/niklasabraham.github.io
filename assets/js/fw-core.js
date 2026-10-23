// Fold a protein — the walkthrough engine (/projects/diffusion-architectures/walkthrough/).
//
// CONTRACT (other files register chapters; load order: fw-core.js, fw-bio.js, fw-model.js, fw-film.js):
//   FW.chapter({ id, title, kicker })                       declare a chapter (order = call order)
//   FW.step({ chapter, id, title, caption, points: [html], principle: html, duration: ms, live: bool,
//             render(el, ctx) -> optional cleanup() })      add a step; steps play in registration order
//   render() draws into `el` (an absolutely positioned layer filling the stage, 1240 × 600 design units when
//   using FW.h.svg). ctx = { data, h: FW.h, C: FW.C, play() /* starts the .a/.pop/.grow/.draw build */,
//   later(ms, fn) /* timers cleaned up automatically */, raf(fn) /* frame loop, cleaned up */, autoplay: bool }
//   FW.h: SVG string helpers (text, rect, circle, line, path, ribbon, curve, vec, hvec, g, sheets, card, svg,
//   rnd, rgba, esc); FW.C: palette. FW.data: the example loaded from walkthrough_data.py.
//
// OPTIONAL additions (all backward compatible; nothing above changed):
//   FW.chapter({ ..., blurb: html, short: 'the biology' })  blurb: one sentence on the chapter title card shown
//                                                            between chapters; short: label on the chapter tabs
//   FW.step({ ..., narration: html })                        the line under the stage (default: points[0])
//   ctx.pause()   stop autoplay (e.g. when the reader starts using a live control)
//   ctx.next()    go to the next step          ctx.index / ctx.step   this step's position / definition
//   FW.go(i | id), FW.pause(), FW.playing()   drive the walkthrough from outside
//
// The engine owns: the intro screen (start with the biology / skip to the model, with a small folding preview),
// the chapter tabs in the masthead, the notes under the stage (the current step's title, points and principle; the
// step list #fwSteps is kept in the DOM, hidden, as the click target the model strip and deep links use),
// the player (play / pause, segmented per-step timer, restart), the chapter title cards, the narration line,
// keyboard (space, ← →), deep links (#step-<id>), crossfades between steps.
(function () {
  'use strict';
  const C = { ink: '#04204b', q: '#2f5bd3', r: '#b4552f', muted: '#5c6b86', paper: '#ffffff', teal: '#138374', violet: '#6a55c8', amber: '#c98a12' };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  C.line = rgba(C.ink, 0.16);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const A = (o) => { const c = ((o.cls || '') + ' ' + (o.an || '')).trim(); return (c ? ` class="${c}"` : '') + (o.d != null ? ` style="--d:${(+o.d).toFixed(2)}s"` : '') + (o.an === 'draw' ? ' pathLength="1"' : ''); };
  const OP = (o) => o.op == null ? '' : (o.an ? ` fill-opacity="${o.op}" stroke-opacity="${o.op}"` : ` opacity="${o.op}"`);
  function rnd(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const h = {
    rgba, esc, rnd, A, OP,
    text: (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 12}" fill="${o.fill || C.ink}" text-anchor="${o.anchor || 'start'}"${A(Object.assign({}, o, { cls: (o.mono ? 'mono ' : '') + (o.cls || '') }))}${o.w ? ` font-weight="${o.w}"` : ''}${OP(o)}${o.tr ? ` transform="${o.tr}"` : ''}>${esc(s)}</text>`,
    rect: (x, y, w, hh, fill, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${fill}"${A(o)}${o.rx != null ? ` rx="${o.rx}"` : ''}${o.stroke ? ` stroke="${o.stroke}"` : ''}${o.sw ? ` stroke-width="${o.sw}"` : ''}${OP(o)}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`,
    circle: (x, y, r, fill, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${A(o)}${o.stroke ? ` stroke="${o.stroke}"` : ''}${o.sw ? ` stroke-width="${o.sw}"` : ''}${OP(o)}/>`,
    line: (x1, y1, x2, y2, stroke, w, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w || 1}"${A(o)}${OP(o)}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cap ? ` stroke-linecap="${o.cap}"` : ''}/>`,
    path: (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}"${A(o)}${o.stroke ? ` stroke="${o.stroke}"` : ''}${o.sw ? ` stroke-width="${o.sw}"` : ''}${OP(o)}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cap ? ` stroke-linecap="${o.cap}"` : ''}${o.mk ? ' marker-end="url(#fwa)"' : ''}/>`,
  };
  h.ribbon = (x1, y1, h1, x2, y2, h2, fill, op, o = {}) => { const cx = (x1 + x2) / 2; let s = `<path d="M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2} L${x2},${y2 + h2} C${cx},${y2 + h2} ${cx},${y1 + h1} ${x1},${y1 + h1} Z" fill="${fill}"${A(o)}${op != null ? ` fill-opacity="${op}"` : ''}/>`; if (o.pulse) { const ya = y1 + h1 / 2, yb = y2 + h2 / 2; s += h.path(`M${x1},${ya} C${cx},${ya} ${cx},${yb} ${x2},${yb}`, { stroke: o.pulse, sw: 1.3, an: 'pulse', d: o.d, cap: 'round' }); } return s; };
  h.curve = (x1, y1, x2, y2, stroke, w, o = {}) => { const cx = (x1 + x2) / 2; return h.path(`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`, Object.assign({ stroke, sw: w || 1 }, o)); };
  h.vec = (x, y, w, hh, color, n, seed, o = {}) => { const r = rnd(seed); let s = ''; const ch = hh / n; for (let i = 0; i < n; i++) s += h.rect(x, (y + i * ch).toFixed(1), w, Math.max(ch - 0.6, 1).toFixed(1), color, { op: (0.18 + r() * 0.72).toFixed(2) }); return `<g${A(o)}>${h.rect(x, y, w, hh, 'none', { stroke: C.line, sw: 0.6 })}${s}</g>`; };
  h.hvec = (x, y, w, hh, color, n, seed, o = {}) => { const r = rnd(seed); let s = ''; const cw = w / n; for (let i = 0; i < n; i++) s += h.rect((x + i * cw).toFixed(1), y, Math.max(cw - 0.6, 1).toFixed(1), hh, color, { op: (0.18 + r() * 0.72).toFixed(2) }); return `<g${A(o)}>${h.rect(x, y, w, hh, 'none', { stroke: C.line, sw: 0.6 })}${s}</g>`; };
  h.g = (inner, o = {}) => `<g${A(o)}${OP(o)}${o.tr ? ` transform="${o.tr}"` : ''}>${inner}</g>`;
  h.sheets = (x, y, w, hh, n, step, d0) => { let s = ''; for (let i = n; i >= 1; i--) s += h.rect(x + i * step, y + i * step, w, hh, C.paper, { rx: 6, stroke: C.line, sw: 0.7, op: Math.max(0.25, 1 - i * 0.09).toFixed(2), an: d0 != null ? 'a' : null, d: d0 != null ? d0 + (n - i) * 0.05 : null }); return s; };
  h.card = (x, y, w, hh, o = {}) => h.rect(x, y, w, hh, C.paper, { rx: 6, stroke: C.line, sw: 0.9, an: o.an, d: o.d });
  h.DEFS = `<defs><marker id="fwa" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="${C.ink}"/></marker></defs>`;
  h.svg = (w, hh, inner, cls) => `<svg viewBox="0 0 ${w} ${hh}"${cls ? ` class="${cls}"` : ''} role="img">${h.DEFS}${inner}</svg>`;


  const chapters = [], steps = [];
  const FW = window.FW = { C, h, chapters, steps, data: null };
  FW.chapter = (c) => { chapters.push(c); };
  FW.step = (s) => { steps.push(Object.assign({ duration: 11000, points: [], principle: '' }, s)); };

  // ------------------------------------------------------------------ data
  FW.load = async (id) => {
    const root = document.getElementById('fw');
    const d = await (await fetch(root.dataset.base + id + '.json')).json();
    const raw = atob(d.dist); d.D = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) d.D[i] = raw.charCodeAt(i);
    const n = d.n, base = new Float64Array(n * 3);
    d.ca.forEach((p, i) => { base[3 * i] = p[0]; base[3 * i + 1] = p[1]; base[3 * i + 2] = p[2]; });
    d.mu = [base];
    if (d.poses) d.mu = d.poses.map((ag) => { const m = Float64Array.from(base); d.ag_idx.forEach((i, k) => { m[3 * i] = ag[k][0]; m[3 * i + 1] = ag[k][1]; m[3 * i + 2] = ag[k][2]; }); return m; });
    d.R = Math.max(...d.ca.map((p) => Math.hypot(p[0], p[1], p[2])));
    d.start = []; let i0 = 0; d.chains.forEach((c) => { d.start.push(i0); i0 += c.seq.length; });
    return d;
  };

  // ------------------------------------------------------------------ engine state
  const CARD_MS = 2300, LIVE_MS = 60000;
  const st = { i: -1, playing: false, cleanup: null, timers: [], rafs: [], layer: 0, elapsed: 0, last: 0, cardUntil: 0, visible: true, keys: [], ref: {} };
  let $ = (id) => document.getElementById(id), root = null;
  const pad = (n) => String(n).padStart(2, '0');
  const chapOf = (S) => chapters.find((c) => c.id === S.chapter) || { id: S.chapter, title: S.chapter || '', kicker: '' };
  const chapIdx = (id) => Math.max(0, chapters.findIndex((c) => c.id === id));
  const stepsOf = (id) => steps.map((s, i) => [s, i]).filter(([s]) => s.chapter === id);
  const firstOf = (chap) => Math.max(0, steps.findIndex((s) => s.chapter === chap));
  const shortOf = (c) => { const s = c.short || (c.kicker && c.kicker.includes('·') ? c.kicker.split('·').pop().trim() : c.title); return s.charAt(0).toUpperCase() + s.slice(1); };
  const capOf = (S) => String(S.caption || S.title || '').replace(/^Step\s+\d+\s*·\s*/i, '');
  const dur = (S) => (S.live ? LIVE_MS : S.duration);
  const mins = (list) => Math.max(1, Math.round(list.reduce((a, S) => a + dur(S), 0) / 60000));
  const fmt = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
  const ICON = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4L13 8z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.6" y="2.8" width="3" height="10.4" rx="0.8" fill="currentColor"/><rect x="9.4" y="2.8" width="3" height="10.4" rx="0.8" fill="currentColor"/></svg>',
  };

  function clearStep() {
    st.timers.forEach(clearTimeout); st.timers = [];
    st.rafs.forEach((r) => (r.dead = true)); st.rafs = [];
    if (st.cleanup) { try { st.cleanup(); } catch (e) { console.error(e); } }
    st.cleanup = null;
  }
  function ctxFor(el, i) {
    return {
      data: FW.data, h, C, autoplay: st.playing, index: i, step: steps[i],
      play: () => { el.classList.remove('play'); void el.offsetWidth; el.classList.add('play'); },
      later: (ms, fn) => { st.timers.push(setTimeout(fn, ms)); },
      raf: (fn) => { const tok = { dead: false }; st.rafs.push(tok); const loop = (t) => { if (tok.dead) return; if (fn(t) !== false) requestAnimationFrame(loop); }; requestAnimationFrame(loop); },
      pause: () => setPlaying(false),
      next: () => { if (st.i === i) go(i + 1, { card: st.playing }); },
    };
  }

  // ------------------------------------------------------------------ rendering a step
  function renderStep(i) {
    const S = steps[i];
    const layers = $('fwStage').querySelectorAll('.fw-layer');
    st.layer = 1 - st.layer;
    const el = layers[st.layer], old = layers[1 - st.layer];
    el.innerHTML = ''; el.className = 'fw-layer' + (S.live ? ' live' : '');
    try { st.cleanup = S.render(el, ctxFor(el, i)) || null; } catch (e) { console.error(e); el.innerHTML = `<p class="fw-err">${esc(e.message)}</p>`; }
    el.classList.add('on'); old.classList.remove('on');
    setTimeout(() => { if (!old.classList.contains('on')) { old.innerHTML = ''; old.className = 'fw-layer'; } }, 650);
    root.classList.toggle('is-live', !!S.live);
  }
  function showCard(c) {
    const card = $('fwCard'); if (!card) return;
    const list = stepsOf(c.id).map(([s]) => s), k = chapIdx(c.id);
    card.innerHTML = `<div class="fw-card-in">
      <p class="fw-card-k"><span>Part ${k + 1} of ${chapters.length}</span>${c.kicker ? esc(c.kicker.replace(/^Part\s*\d+\s*·\s*/i, '')) : ''}</p>
      <h3>${esc(c.title)}</h3>${c.blurb ? `<p class="fw-card-b">${c.blurb}</p>` : ''}
      <p class="fw-card-m">${list.length} step${list.length === 1 ? '' : 's'} · about ${mins(list)} min</p>
      <div class="fw-card-bar"><i></i></div></div>`;
    card.classList.remove('on'); void card.offsetWidth; card.classList.add('on');
  }
  function hideCard() { const card = $('fwCard'); if (card) card.classList.remove('on'); st.cardUntil = 0; }

  function go(i, opts = {}) {
    if (!steps.length) return;
    i = Math.max(0, Math.min(steps.length - 1, i));
    const prevChap = st.i >= 0 ? steps[st.i].chapter : null;
    clearStep(); hideCard();
    st.i = i; st.elapsed = 0; const S = steps[i];
    root.classList.add('started'); stopPreview();
    chrome(i, opts);
    if (opts.card && S.chapter !== prevChap && chapters.length > 1) {
      showCard(chapOf(S)); st.cardUntil = performance.now() + CARD_MS;
      st.timers.push(setTimeout(() => renderStep(i), CARD_MS - 420));
      st.timers.push(setTimeout(hideCard, CARD_MS));
    } else renderStep(i);
    if (!opts.noHash) { try { history.replaceState(null, '', '#step-' + st.keys[i]); } catch (e) { /* file:// */ } }
  }

  // ------------------------------------------------------------------ chrome (everything around the stage)
  function chrome(i, opts) {
    const S = steps[i], c = chapOf(S), r = st.ref;
    if ($('fwFigCap')) $('fwFigCap').innerHTML = `<b>Fig. ${i + 1}</b> · ${esc(capOf(S))}`;
    if ($('fwFigChap')) $('fwFigChap').textContent = c.kicker || c.title || '';
    if ($('fwCount')) $('fwCount').innerHTML = `${pad(i + 1)}<span> / ${pad(steps.length)}</span>`;
    if ($('fwPrin')) $('fwPrin').innerHTML = S.principle ? `<div class="lbl">The principle</div><div class="fw-prin-t">${S.principle}</div>` : '';
    const notes = $('fwNotes');
    if (notes) {
      notes.innerHTML = `<div class="fw-notes-l"><h3><span class="mono">${pad(i + 1)}</span>${esc(S.title)}${S.live ? ' <em class="fw-livetag">try it</em>' : ''}</h3>${S.points.length ? `<ul>${S.points.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}</div>`
        + (S.principle ? `<div class="fw-prin"><div class="lbl">The principle</div><div class="fw-prin-t">${S.principle}</div></div>` : '');
      notes.classList.remove('in'); void notes.offsetWidth; notes.classList.add('in');
    }
    const narr = $('fwNarr');
    if (narr) { narr.classList.remove('in'); narr.innerHTML = S.narration || S.points[0] || esc(capOf(S)); void narr.offsetWidth; narr.classList.add('in'); }
    $('fwPrev').disabled = i === 0; $('fwNext').disabled = i === steps.length - 1;
    const skip = $('fwSkip'); if (skip) skip.hidden = !(S.chapter === 'bio' && steps.some((s) => s.chapter === 'model'));
    // step list
    document.querySelectorAll('#fwSteps .fw-st').forEach((li) => { const k = +li.dataset.i; li.classList.toggle('on', k === i); li.classList.toggle('done', k < i); });
    document.querySelectorAll('#fwSteps .fw-chap').forEach((g) => {
      const list = stepsOf(g.dataset.c).map(([, k]) => k), last = list[list.length - 1];
      g.classList.toggle('on', g.dataset.c === S.chapter); g.classList.toggle('done', list.length > 0 && last < i);
      const m = g.querySelector('.fw-chap-m'); if (m) m.textContent = `${list.filter((k) => k < i).length + (g.dataset.c === S.chapter ? 1 : 0)} / ${list.length}`;
      g.querySelectorAll('.fw-chap-dots i').forEach((d, n) => { d.className = list[n] < i ? 'done' : list[n] === i ? 'on' : ''; });
    });
    const on = document.querySelector('#fwSteps .fw-st.on'), box = $('fwSteps');
    if (on && box && !opts.noScroll && box.scrollHeight > box.clientHeight + 4) {
      const top = on.offsetTop - 90; box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
    // segments and chapter tabs
    document.querySelectorAll('#fwSegs .fw-seg').forEach((b) => { const k = +b.dataset.i; b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); b.querySelector('i').style.width = k < i ? '100%' : '0%'; });
    document.querySelectorAll('#fwChaps .fw-ctab').forEach((b) => { b.classList.toggle('on', b.dataset.c === S.chapter); });
    r.seg = document.querySelector('#fwSegs .fw-seg.on i');
    r.stbar = on ? on.querySelector('.fw-st-bar i') : null;
    r.tab = document.querySelector(`#fwChaps .fw-ctab[data-c="${S.chapter}"] .bar i`);
    r.tabList = stepsOf(S.chapter).map(([, k]) => k);
    document.querySelectorAll('#fwChaps .fw-ctab').forEach((b) => { if (b.dataset.c === S.chapter) return; const list = stepsOf(b.dataset.c).map(([, k]) => k); b.querySelector('.bar i').style.width = (list.length && list[list.length - 1] < i ? 100 : 0) + '%'; b.classList.toggle('done', list.length > 0 && list[list.length - 1] < i); });
  }
  function setPlaying(p) {
    st.playing = !!p; root.classList.toggle('playing', st.playing);
    const b = $('fwPlay'); if (!b) return;
    b.classList.toggle('on', st.playing); b.setAttribute('aria-label', st.playing ? 'Pause' : 'Play');
    b.innerHTML = (st.playing ? ICON.pause : ICON.play) + `<span>${st.playing ? 'Pause' : 'Play'}</span>`;
  }
  function tick(t) {
    const dt = st.last ? Math.min(250, t - st.last) : 0; st.last = t;
    if (st.i >= 0) {
      const S = steps[st.i], r = st.ref;
      const running = st.playing && st.visible && !S.live && !(st.cardUntil && t < st.cardUntil);
      if (running) st.elapsed += dt;
      const frac = S.live ? 0 : Math.min(1, st.elapsed / S.duration);
      if (r.seg) r.seg.style.width = (S.live ? 100 : frac * 100) + '%';
      if (r.stbar) r.stbar.style.width = (S.live ? 100 : frac * 100) + '%';
      if (r.tab) { const n = r.tabList.length, k = r.tabList.indexOf(st.i); r.tab.style.width = ((k + (S.live ? 1 : frac)) / n * 100) + '%'; }
      const tm = $('fwTime');
      if (tm) { const txt = S.live ? 'live · explore, then →' : `${fmt(st.elapsed)} / ${fmt(S.duration)}`; if (tm.textContent !== txt) tm.textContent = txt; }
      if (running && frac >= 1) { if (st.i < steps.length - 1) go(st.i + 1, { card: true }); else setPlaying(false); }
    }
    requestAnimationFrame(tick);
  }

  // ------------------------------------------------------------------ building the list, the segments, the tabs
  function build() {
    const seen = {};
    st.keys = steps.map((s, i) => { const id = String(s.id || i + 1).replace(/[^\w-]+/g, '-'); seen[id] = (seen[id] || 0) + 1; return seen[id] > 1 ? `${id}-${seen[id]}` : id; });
    let list = '', segs = '', tabs = '';
    chapters.forEach((c, k) => {
      const mine = stepsOf(c.id); if (!mine.length) return;
      list += `<li class="fw-chap" data-c="${esc(c.id)}"><button type="button" class="fw-chap-h"><span class="fw-chap-k">${esc(c.kicker || 'Part ' + (k + 1))}</span><span class="fw-chap-t">${esc(c.title)}</span><span class="fw-chap-m mono">0 / ${mine.length}</span><span class="fw-chap-dots">${mine.map(() => '<i></i>').join('')}</span></button><ol class="fw-chap-steps">`;
      mine.forEach(([s, i]) => {
        list += `<li class="fw-st" data-i="${i}"><button type="button"><span class="b"><span class="num">${pad(i + 1)}</span><svg class="chk" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.4l3 3 6-6.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="t">${esc(s.title)}${s.live ? ' <em class="fw-livetag">live</em>' : ''}</span></button>`
          + `<div class="fw-st-body">${s.points.length ? `<ul>${s.points.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}<div class="fw-st-bar"><i></i></div>${s.principle ? `<div class="fw-st-prin"><div class="lbl">The principle</div><div class="fw-prin-t">${s.principle}</div></div>` : ''}</div></li>`;
      });
      list += '</ol></li>';
      segs += `<div class="fw-seggrp" data-c="${esc(c.id)}">${mine.map(([s, i]) => `<button type="button" class="fw-seg${s.live ? ' live' : ''}" data-i="${i}" title="${pad(i + 1)} · ${esc(s.title)}" aria-label="Step ${i + 1}: ${esc(s.title)}"><i></i></button>`).join('')}</div>`;
      tabs += `<button type="button" class="fw-ctab" data-c="${esc(c.id)}"><span class="n">${pad(k + 1)}</span><span class="t">${esc(shortOf(c))}</span><span class="bar"><i></i></span></button>`;
    });
    $('fwSteps').innerHTML = list;
    if ($('fwSegs')) $('fwSegs').innerHTML = segs;
    if ($('fwChaps')) $('fwChaps').innerHTML = tabs;
    $('fwSteps').querySelectorAll('.fw-st > button').forEach((b) => b.addEventListener('click', () => { setPlaying(false); go(+b.parentNode.dataset.i); }));
    $('fwSteps').querySelectorAll('.fw-chap-h').forEach((b) => b.addEventListener('click', () => { const c = b.parentNode.dataset.c; if (st.i >= 0 && steps[st.i].chapter === c) return; setPlaying(false); go(firstOf(c)); }));
    document.querySelectorAll('#fwSegs .fw-seg').forEach((b) => b.addEventListener('click', () => { setPlaying(false); go(+b.dataset.i); }));
    document.querySelectorAll('#fwChaps .fw-ctab').forEach((b) => b.addEventListener('click', () => { const wasPlaying = st.playing || st.i < 0; go(firstOf(b.dataset.c), { card: wasPlaying }); setPlaying(wasPlaying); }));
    // the intro's numbers come from the registered steps
    const bio = steps.filter((s) => s.chapter === 'bio'), rest = steps.filter((s) => s.chapter !== 'bio');
    const set = (id, txt) => { const e = $(id); if (e) e.textContent = txt; };
    set('fwMetaAll', `${steps.length} steps · about ${mins(steps)} minutes`);
    set('fwMetaBio', `${steps.length} steps · about ${mins(steps)} min`);
    set('fwMetaModel', `${rest.length} steps · about ${mins(rest)} min`);
    if (!bio.length && $('fwStartBio')) $('fwStartBio').hidden = true;
  }

  // ------------------------------------------------------------------ the intro's preview: a chain folding out of noise
  const pv = { on: false, t0: 0, eps: null, id: null };
  function stopPreview() { pv.on = false; }
  function startPreview() {
    const cv = $('fwPreview'); if (!cv || !FW.data) return;
    const d = FW.data, ctx = cv.getContext('2d'), r = rnd(7);
    if (pv.id !== d.id) { pv.eps = Float32Array.from({ length: d.n * 3 }, () => { let a, b, q; do { a = 2 * r() - 1; b = 2 * r() - 1; q = a * a + b * b; } while (q >= 1 || q === 0); return a * Math.sqrt(-2 * Math.log(q) / q); }); pv.id = d.id;
      pv.c = [0, 1, 2].map((a) => d.ca.reduce((q, p) => q + p[a], 0) / d.n); pv.R = Math.max(...d.ca.map((p) => Math.hypot(p[0] - pv.c[0], p[1] - pv.c[1], p[2] - pv.c[2]))); }
    const CH = d.chains.length === 1 ? [C.ink] : [C.q, C.ink, C.r];
    pv.on = true; pv.t0 = performance.now();
    const ease = (u) => 1 - Math.pow(1 - u, 3);
    const frame = (t) => {
      if (!pv.on) return;
      const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!W || !H) { requestAnimationFrame(frame); return; }
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const P = 9000, u = ((t - pv.t0) % P) / P;          // 0–0.12 noise, 0.12–0.62 denoise, 0.62–1 hold
      const k = u < 0.12 ? 0 : u < 0.62 ? ease((u - 0.12) / 0.5) : 1;
      const sig = 1.6 * Math.pow(1 - k, 2.2), ang = t / 7000, Rr = pv.R, s = Math.min(W, H) / (2.05 * Rr);
      const ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(0.32), stl = Math.sin(0.32);
      const pts = new Array(d.n);
      for (let i = 0; i < d.n; i++) {
        const p = d.ca[i], cx = pv.c, x0 = p[0] - cx[0] + sig * Rr * pv.eps[3 * i], y0 = p[1] - cx[1] + sig * Rr * pv.eps[3 * i + 1], z0 = p[2] - cx[2] + sig * Rr * pv.eps[3 * i + 2];
        const x = x0 * ca + z0 * sa, z = -x0 * sa + z0 * ca, y2 = y0 * ct - z * stl, z2 = y0 * stl + z * ct;
        pts[i] = [W / 2 + x * s, H / 2 - y2 * s, z2];
      }
      const lineA = Math.max(0, Math.min(1, (k - 0.35) / 0.5));
      if (lineA > 0) {
        const segs = [];
        for (let i = 0; i < d.n - 1; i++) if (d.chain_of[i] === d.chain_of[i + 1]) segs.push(i);
        segs.sort((a, b) => (pts[a][2] + pts[a + 1][2]) - (pts[b][2] + pts[b + 1][2]));
        ctx.lineCap = 'round';
        for (const i of segs) { const a = pts[i], b = pts[i + 1], dep = 0.5 + 0.5 * ((a[2] + b[2]) / 2 / Rr + 1) / 2; ctx.strokeStyle = CH[d.chain_of[i] % CH.length]; ctx.globalAlpha = lineA * Math.max(0.3, Math.min(1, dep)); ctx.lineWidth = (1.4 + 2.2 * dep) * Math.max(0.6, Math.min(1.4, W / 520)); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      }
      ctx.globalAlpha = 1 - 0.85 * lineA;
      for (let i = 0; i < d.n; i++) { ctx.fillStyle = CH[d.chain_of[i] % CH.length]; ctx.fillRect(pts[i][0] - 1.4, pts[i][1] - 1.4, 2.8, 2.8); }
      ctx.globalAlpha = 1;
      const lab = $('fwPreviewSig');
      if (lab) { const txt = k >= 1 ? 'structure' : `noise ${Math.round(sig / 1.6 * 100)} %`; if (lab.textContent !== txt) lab.textContent = txt; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------------ deep links
  function fromHash() {
    const m = /^#step-(.+)$/.exec(decodeURIComponent(location.hash || '')); if (!m) return -1;
    let k = st.keys.indexOf(m[1]);
    if (k < 0 && /^\d+$/.test(m[1])) k = Math.min(steps.length, +m[1]) - 1;
    return k;
  }

  // ------------------------------------------------------------------ start
  async function start() {
    root = $('fw'); if (!root) return;
    try { FW.data = await FW.load($('fwExample') ? $('fwExample').value : '1n8z'); } catch (e) { console.error(e); }
    build(); setPlaying(false);
    root.classList.add('ready');
    const begin = (chap) => { go(firstOf(chap), { card: true }); setPlaying(true); };
    if ($('fwStartBio')) $('fwStartBio').onclick = () => begin(steps.some((s) => s.chapter === 'bio') ? 'bio' : steps[0] && steps[0].chapter);
    if ($('fwStartModel')) $('fwStartModel').onclick = () => begin(steps.some((s) => s.chapter === 'model') ? 'model' : steps[0] && steps[0].chapter);
    if ($('fwSkip')) $('fwSkip').onclick = () => { go(firstOf('model'), { card: st.playing }); };
    $('fwPrev').onclick = () => { setPlaying(false); go(st.i - 1); };
    $('fwNext').onclick = () => { setPlaying(false); go(st.i + 1); };
    $('fwPlay').onclick = () => { if (st.i < 0) { go(0, { card: true }); setPlaying(true); return; } if (!st.playing && st.i === steps.length - 1 && !steps[st.i].live && st.elapsed >= steps[st.i].duration) { go(0, { card: true }); } setPlaying(!st.playing); };
    if ($('fwRestart')) $('fwRestart').onclick = () => { st.i = -1; go(0, { card: true }); setPlaying(true); };
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, select, textarea, [contenteditable]') || st.i < 0 || e.metaKey || e.ctrlKey || e.altKey) return;
      const r = $('fwStage').getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      if (e.key === 'ArrowRight') { setPlaying(false); go(st.i + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { setPlaying(false); go(st.i - 1); e.preventDefault(); }
      else if (e.key === ' ' || e.code === 'Space') { setPlaying(!st.playing); e.preventDefault(); }
    });
    document.addEventListener('keyup', (e) => { if ((e.key === ' ' || e.code === 'Space') && e.target.closest('#fw button')) e.preventDefault(); });
    if ($('fwExample')) $('fwExample').onchange = async (e) => { FW.data = await FW.load(e.target.value); if (st.i >= 0) go(st.i, { noScroll: true }); else startPreview(); };
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((en) => { st.visible = en.intersectionRatio > 0.3 && !document.hidden; }), { threshold: [0, 0.3, 0.6] }).observe($('fwStage'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) st.visible = false; else { const r = $('fwStage').getBoundingClientRect(); st.visible = r.bottom > 0 && r.top < innerHeight; } });
    window.addEventListener('hashchange', () => { const k = fromHash(); if (k >= 0 && k !== st.i) { setPlaying(false); go(k, { noHash: true }); } });
    // the step list is as tall as the figure next to it (wide screens), so the two read as one workbench
    const fig = root.querySelector('.fw-fig'), side = root.querySelector('.fw-side');
    const fit = () => { if (!fig || !side) return; side.style.maxHeight = innerWidth > 1100 ? Math.max(360, Math.min(fig.offsetHeight, innerHeight - 96)) + 'px' : ''; };
    if (fig && 'ResizeObserver' in window) new ResizeObserver(fit).observe(fig); window.addEventListener('resize', fit); fit();
    // contents rail: mark the section being read
    const toc = [...document.querySelectorAll('.fw-toc a[href^="#"]')];
    if (toc.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) toc.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id)); }), { rootMargin: '-80px 0px -65% 0px' });
      toc.forEach((a) => { const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) io.observe(t); });
    }
    FW.go = (x) => { const k = typeof x === 'number' ? x : st.keys.indexOf(String(x)); if (k >= 0) go(k); };
    FW.pause = () => setPlaying(false);
    FW.playing = () => st.playing;
    const k = fromHash();
    if (k >= 0) go(k, { noHash: true });
    else startPreview();
    requestAnimationFrame(tick);
  }
  document.addEventListener('DOMContentLoaded', start);
})();
