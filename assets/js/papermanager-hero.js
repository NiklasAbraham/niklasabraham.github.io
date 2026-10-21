/* PaperManager project page: hero switcher, page colour themes and the canvas
 * heroes (C living infinity, D knowledge constellation, F annotated page).
 * No dependencies, nothing loaded from elsewhere. Canvases only animate while
 * their hero is selected and on screen, and draw one still frame when the
 * visitor prefers reduced motion. */
(function () {
  'use strict';
  var root = document.getElementById('pm');
  if (!root) return;

  var HEROES = ['a', 'b', 'c', 'd', 'e', 'f'];
  var THEMES = ['violet', 'teal', 'amber', 'rose', 'blue', 'graphite'];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var TAU = Math.PI * 2;

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  // ------------------------------------------------------------ viewport width without scrollbar
  function setVw() { root.style.setProperty('--pm-vw', document.documentElement.clientWidth + 'px'); }
  setVw();
  window.addEventListener('resize', setVw);

  // ------------------------------------------------------------ colours from the page variables
  function parse(c) {
    c = (c || '').trim();
    if (c[0] === '#') {
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      var n = parseInt(c.slice(1, 7), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var m = c.match(/[\d.]+/g);
    return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mix(p, q, k) { return [p[0] + (q[0] - p[0]) * k | 0, p[1] + (q[1] - p[1]) * k | 0, p[2] + (q[2] - p[2]) * k | 0]; }
  function colours() {
    var cs = getComputedStyle(root);
    var g = function (n) { return parse(cs.getPropertyValue(n)); };
    return {
      a: g('--pm-accent'), a2: g('--pm-accent-2'), ink: g('--pm-ink'), ink2: g('--pm-ink-2'),
      muted: g('--pm-muted'), panel: g('--pm-panel'), frame: g('--pm-frame'),
      bg: parse(getComputedStyle(document.body).backgroundColor),
      dark: document.documentElement.getAttribute('data-theme') === 'dark'
    };
  }

  // ------------------------------------------------------------ scene engine
  var scenes = [];
  function scene(canvas, make) {
    var ctx = canvas.getContext('2d');
    var st = { canvas: canvas, ctx: ctx, w: 0, h: 0, t: 0, C: colours(), mouse: null, small: false };
    var impl = make(st);
    var raf = 0, last = 0, vis = false, active = false;
    function size() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      var d = Math.min(window.devicePixelRatio || 1, 2);
      st.w = r.width; st.h = r.height; st.small = r.width < 640;
      canvas.width = Math.round(r.width * d);
      canvas.height = Math.round(r.height * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      if (impl.resize) impl.resize();
      return true;
    }
    function frame(now) {
      var dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      st.t += dt;
      if (impl.step) impl.step(dt);
      impl.draw();
      raf = requestAnimationFrame(frame);
    }
    function still() { if (st.w) { if (impl.still) impl.still(); else impl.draw(); } }
    function update() {
      var run = active && vis && !reduce.matches && !document.hidden;
      if (run && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      else if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!run && active) still();
    }
    new ResizeObserver(function () { if (size() && !raf) still(); }).observe(canvas);
    new IntersectionObserver(function (es) { vis = es[es.length - 1].isIntersecting; update(); }).observe(canvas);
    var s = {
      hero: canvas.closest('.pm-hv') ? canvas.closest('.pm-hv').getAttribute('data-hero') : '*',
      setActive: function (v) { active = v; if (v) size(); update(); },
      recolour: function () { st.C = colours(); if (!raf && active) still(); },
      update: update
    };
    scenes.push(s);
    return s;
  }
  document.addEventListener('visibilitychange', function () { scenes.forEach(function (s) { s.update(); }); });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { scenes.forEach(function (s) { s.update(); }); });

  function track(el, st) {
    el.addEventListener('pointermove', function (e) {
      var r = st.canvas.getBoundingClientRect();
      st.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    el.addEventListener('pointerleave', function () { st.mouse = null; });
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  // ============================================================ C: living infinity
  function infinity(st) {
    var parts = [], cards = [], a = 0, cx = 0, cy = 0, k = 1.25;
    var stations = [
      { u: 0.125, label: 'Read', sub: 'summary · figures', pulse: 0 },
      { u: 0.375, label: 'Understand', sub: 'concepts · tour', pulse: 0 },
      { u: 0.625, label: 'Connect', sub: 'graph · concept map', pulse: 0 },
      { u: 0.875, label: 'Ask', sub: 'knowledge chat', pulse: 0 }
    ];
    function P(u) {
      var t = u * TAU, s = Math.sin(t), c = Math.cos(t), d = 1 + s * s;
      return [cx + a * c / d, cy - k * a * s * c / d];
    }
    function seed() {
      parts = [];
      var n = Math.round(Math.min(900, Math.max(320, st.w * 1.4)));
      for (var i = 0; i < n; i++) {
        var g = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; // ~normal, -1..1
        parts.push({ u: Math.random(), sp: rand(0.028, 0.05), off: g, f: rand(0.6, 1.8), ph: rand(0, TAU), r: rand(0.9, 2.3), al: rand(0.45, 1) });
      }
      cards = [0, 0.25, 0.5, 0.75].map(function (u) { return { u: u + 0.06 }; });
    }
    return {
      resize: function () {
        var labelRoom = st.small ? 92 : 120;
        a = Math.min(st.w * 0.44, (st.h - labelRoom) / (0.707 * k));
        cx = st.w / 2; cy = st.h / 2 - (st.small ? 2 : 8);
        if (!parts.length) seed();
      },
      step: function (dt) {
        for (var i = 0; i < parts.length; i++) parts[i].u = (parts[i].u + parts[i].sp * dt) % 1;
        for (var j = 0; j < cards.length; j++) {
          var before = cards[j].u;
          cards[j].u = (cards[j].u + 0.03 * dt) % 1;
          stations.forEach(function (s) {
            var b = before, n = cards[j].u;
            if ((b < s.u && n >= s.u) || (b > n && (s.u > b || s.u <= n))) s.pulse = 1;
          });
        }
        stations.forEach(function (s) { s.pulse = Math.max(0, s.pulse - dt * 0.9); });
      },
      still: function () {
        stations[1].pulse = 0.6;
        this.draw();
      },
      draw: function () {
        var ctx = st.ctx, C = st.C, w = st.w, h = st.h, t = st.t;
        ctx.clearRect(0, 0, w, h);
        var spread = st.small ? 9 : 15;

        // halo + guide line
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (var i = 0; i <= 200; i++) { var p = P(i / 200); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
        ctx.strokeStyle = rgba(C.a, C.dark ? 0.09 : 0.06);
        ctx.lineWidth = spread * 2.8;
        ctx.stroke();
        ctx.strokeStyle = rgba(C.a, C.dark ? 0.35 : 0.28);
        ctx.lineWidth = 1;
        ctx.stroke();

        var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, a * 0.5);
        glow.addColorStop(0, rgba(C.a2, C.dark ? 0.22 : 0.12));
        glow.addColorStop(1, rgba(C.a2, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(cx - a, cy - a, a * 2, a * 2);

        // chevrons showing the direction of travel
        for (var cvi = 0; cvi < 8; cvi++) {
          var cu = (cvi / 8 + 0.0625 + t * 0.012) % 1, c0 = P(cu), c1 = P((cu + 0.003) % 1);
          var ca = Math.atan2(c1[1] - c0[1], c1[0] - c0[0]);
          ctx.save(); ctx.translate(c0[0], c0[1]); ctx.rotate(ca);
          ctx.strokeStyle = rgba(C.ink, C.dark ? 0.45 : 0.35); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(-3, -4.5); ctx.lineTo(2, 0); ctx.lineTo(-3, 4.5); ctx.stroke();
          ctx.restore();
        }

        // particles as short streaks along the flow
        if (C.dark) ctx.globalCompositeOperation = 'lighter';
        var m = st.mouse;
        for (var j = 0; j < parts.length; j++) {
          var q = parts[j];
          var p0 = P(q.u), p1 = P((q.u + 0.004) % 1);
          var tx = p1[0] - p0[0], ty = p1[1] - p0[1], L = Math.hypot(tx, ty) || 1;
          tx /= L; ty /= L;
          var o = q.off * spread * (0.75 + 0.25 * Math.sin(t * q.f + q.ph));
          var x = p0[0] - ty * o, y = p0[1] + tx * o;
          if (m) {
            var dx = x - m.x, dy = y - m.y, d = Math.hypot(dx, dy);
            if (d < 70) { var f = (1 - d / 70) * 22 / (d || 1); x += dx * f; y += dy * f; }
          }
          var col = mix(C.a, C.a2, (Math.cos(q.u * TAU) + 1) / 2);
          var len = 5 + q.sp * 200;
          ctx.strokeStyle = rgba(col, q.al * (1 - Math.abs(q.off) * 0.55));
          ctx.lineWidth = q.r;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - tx * len, y - ty * len);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';

        // stations
        var fs = st.small ? 11.5 : 13.5;
        stations.forEach(function (s, idx) {
          var p = P(s.u), up = p[1] < cy;
          var col = mix(C.a, C.a2, (Math.cos(s.u * TAU) + 1) / 2);
          if (s.pulse > 0) {
            ctx.beginPath();
            ctx.arc(p[0], p[1], 7 + (1 - s.pulse) * 22, 0, TAU);
            ctx.strokeStyle = rgba(col, s.pulse * 0.6);
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(p[0], p[1], 6.5, 0, TAU);
          ctx.fillStyle = rgba(C.bg, 1);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = rgba(col, 1);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p[0], p[1], 2.4, 0, TAU);
          ctx.fillStyle = rgba(col, 1);
          ctx.fill();

          var ly = up ? p[1] - (st.small ? 34 : 44) : p[1] + (st.small ? 26 : 32);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.font = '650 ' + fs + 'px Inter, system-ui, sans-serif';
          ctx.fillStyle = rgba(C.ink, 1);
          ctx.fillText((idx + 1) + '  ' + s.label, p[0], ly);
          ctx.font = (st.small ? 9.5 : 10.5) + 'px "JetBrains Mono", ui-monospace, monospace';
          ctx.fillStyle = rgba(C.muted, 1);
          ctx.fillText(s.sub, p[0], ly + (st.small ? 13 : 16));
        });

        // paper cards riding the loop
        var cw = st.small ? 18 : 26, ch = cw * 1.3;
        cards.forEach(function (c) {
          var p0 = P(c.u), p1 = P((c.u + 0.003) % 1);
          var ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
          // stage = last station passed
          var stage = Math.floor((((c.u - 0.125) % 1) + 1) % 1 * 4);
          var col = mix(C.a, C.a2, (Math.cos(c.u * TAU) + 1) / 2);
          ctx.save();
          ctx.translate(p0[0], p0[1]);
          ctx.rotate(Math.sin(ang) * 0.22);
          ctx.shadowColor = C.dark ? 'rgba(0,0,0,.55)' : 'rgba(15,23,42,.18)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 3;
          rr(ctx, -cw / 2, -ch / 2, cw, ch, 3);
          ctx.fillStyle = C.dark ? '#1c2029' : '#ffffff';
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = rgba(col, 0.9);
          ctx.lineWidth = 1;
          ctx.stroke();
          // text lines, highlighted progressively
          for (var l = 0; l < 4; l++) {
            var ly2 = -ch / 2 + ch * (0.24 + l * 0.17);
            ctx.fillStyle = l <= stage ? rgba(col, 0.85) : rgba(C.muted, 0.35);
            ctx.fillRect(-cw / 2 + cw * 0.16, ly2, cw * (l === 3 ? 0.44 : 0.68), Math.max(1.4, ch * 0.055));
          }
          ctx.restore();
        });
      }
    };
  }

  // ============================================================ D: knowledge constellation
  var CONCEPTS = ['Diffusion Models', 'Flow Matching', 'Score Matching', 'Memorization', 'AlphaFold3',
    'Protein Folding', 'Classifier-Free Guidance', 'Optimal Transport', 'Langevin Dynamics',
    'Equivariance', 'Molecular Dynamics', 'Latent Diffusion', 'Generative Models', 'Denoising'];

  function constellation(st) {
    var nodes = [], signals = [], linkR = 150, spawn = 0;
    function seed() {
      nodes = [];
      var n = Math.round(Math.max(34, Math.min(110, st.w * st.h / 13000)));
      var labels = CONCEPTS.slice(0, st.small ? 6 : CONCEPTS.length);
      for (var i = 0; i < n; i++) {
        var concept = i < Math.round(n * 0.3);
        var sp = rand(5, 13), dir = rand(0, TAU);
        nodes.push({
          x: rand(0, st.w), y: rand(0, st.h),
          bvx: Math.cos(dir) * sp, bvy: Math.sin(dir) * sp, vx: 0, vy: 0,
          concept: concept, r: concept ? rand(3, 7.5) : rand(2.2, 3.4),
          two: Math.random() < 0.4, label: concept && i < labels.length ? labels[i] : null, ph: rand(0, TAU)
        });
      }
      nodes.forEach(function (d) { d.vx = d.bvx; d.vy = d.bvy; });
    }
    return {
      resize: function () {
        linkR = st.small ? 95 : 150;
        if (!nodes.length) seed();
        nodes.forEach(function (d) { if (d.x > st.w + 40) d.x = rand(0, st.w); if (d.y > st.h + 40) d.y = rand(0, st.h); });
      },
      step: function (dt) {
        var m = st.mouse, W = st.w, H = st.h;
        for (var i = 0; i < nodes.length; i++) {
          var d = nodes[i];
          if (m) {
            var dx = m.x - d.x, dy = m.y - d.y, dist = Math.hypot(dx, dy);
            if (dist < 230 && dist > 24) { var f = (1 - dist / 230) * 70; d.vx += dx / dist * f * dt; d.vy += dy / dist * f * dt; }
          }
          d.vx += (d.bvx - d.vx) * 0.6 * dt;
          d.vy += (d.bvy - d.vy) * 0.6 * dt;
          d.x += d.vx * dt; d.y += d.vy * dt;
          if (d.x < -30) d.x = W + 30; else if (d.x > W + 30) d.x = -30;
          if (d.y < -30) d.y = H + 30; else if (d.y > H + 30) d.y = -30;
        }
        // signals travelling along links
        spawn -= dt;
        if (spawn <= 0 && signals.length < 7) {
          spawn = rand(0.25, 0.7);
          var a = nodes[(Math.random() * nodes.length) | 0], best = null, bd = linkR;
          nodes.forEach(function (b) { if (b !== a) { var dd = Math.hypot(a.x - b.x, a.y - b.y); if (dd < bd && Math.random() < 0.5) { bd = dd; best = b; } } });
          if (best) signals.push({ a: a, b: best, p: 0 });
        }
        signals = signals.filter(function (s) { s.p += dt / 1.3; return s.p < 1 && Math.hypot(s.a.x - s.b.x, s.a.y - s.b.y) < linkR * 1.2; });
      },
      draw: function () {
        var ctx = st.ctx, C = st.C, w = st.w, h = st.h, m = st.mouse, t = st.t;
        ctx.clearRect(0, 0, w, h);
        var i, j, a, b, d, al;
        ctx.lineWidth = 1;
        for (i = 0; i < nodes.length; i++) {
          a = nodes[i];
          for (j = i + 1; j < nodes.length; j++) {
            b = nodes[j];
            var dx = a.x - b.x, dy = a.y - b.y;
            if (Math.abs(dx) > linkR || Math.abs(dy) > linkR) continue;
            d = Math.sqrt(dx * dx + dy * dy);
            if (d > linkR) continue;
            al = (1 - d / linkR);
            var lc = (a.concept || b.concept) ? ((a.two || b.two) ? C.a2 : C.a) : C.muted;
            ctx.strokeStyle = rgba(lc, al * (a.concept && b.concept ? 0.6 : 0.34) * (C.dark ? 1.2 : 1));
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (m) {
          for (i = 0; i < nodes.length; i++) {
            a = nodes[i]; d = Math.hypot(a.x - m.x, a.y - m.y);
            if (d < 200) { ctx.strokeStyle = rgba(C.a, (1 - d / 200) * 0.5); ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(a.x, a.y); ctx.stroke(); }
          }
          ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, TAU); ctx.fillStyle = rgba(C.a, 0.9); ctx.fill();
        }
        signals.forEach(function (s) {
          var x = s.a.x + (s.b.x - s.a.x) * s.p, y = s.a.y + (s.b.y - s.a.y) * s.p;
          var g = ctx.createRadialGradient(x, y, 0, x, y, 7);
          g.addColorStop(0, rgba(C.a2, 0.9)); g.addColorStop(1, rgba(C.a2, 0));
          ctx.fillStyle = g; ctx.fillRect(x - 7, y - 7, 14, 14);
        });
        for (i = 0; i < nodes.length; i++) {
          a = nodes[i];
          if (a.concept) {
            var col = a.two ? C.a2 : C.a;
            var pr = a.r * (1 + 0.08 * Math.sin(t * 1.4 + a.ph));
            ctx.beginPath(); ctx.arc(a.x, a.y, pr * 2.6, 0, TAU); ctx.fillStyle = rgba(col, C.dark ? 0.16 : 0.1); ctx.fill();
            ctx.beginPath(); ctx.arc(a.x, a.y, pr, 0, TAU); ctx.fillStyle = rgba(col, 0.95); ctx.fill();
            if (a.label && a.x < w - 150 && a.x > 10) {
              ctx.font = '500 ' + (st.small ? 10.5 : 12) + 'px Inter, system-ui, sans-serif';
              ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
              ctx.fillStyle = rgba(C.ink2, 0.75);
              ctx.fillText(a.label, a.x + pr + 6, a.y);
            }
          } else {
            rr(ctx, a.x - a.r, a.y - a.r, a.r * 2, a.r * 2, 1.2);
            ctx.fillStyle = rgba(C.muted, C.dark ? 0.7 : 0.55); ctx.fill();
          }
        }
      }
    };
  }

  // ============================================================ F: annotated page
  // A PDF page is read and marked up: highlights, concept marks, a summary that
  // types itself, figures and tables lifted out, references, tour stops, and a
  // last small beat of concepts shared with earlier papers.
  var PAPERS = [
    { short: 'Karras et al. 2022', title: ['Elucidating the Design Space of', 'Diffusion-Based Generative Models'], fig: 'curve',
      summary: [['Contribution', 'A modular design space for diffusion models.'],
                ['Method', 'Heun sampler, network preconditioning and a new noise schedule.'],
                ['Result', 'State-of-the-art FID on CIFAR-10 and ImageNet-64.']],
      tour: ['Problem', 'Key equation', 'Sampler', 'Main result'],
      concepts: ['Diffusion models', 'Probability flow ODE', 'Heun sampler'] },
    { short: 'Lipman et al. 2023', title: ['Flow Matching for', 'Generative Modeling'], fig: 'paths',
      summary: [['Contribution', 'Simulation-free training of continuous normalising flows.'],
                ['Method', 'Regress the vector field of a fixed conditional probability path.'],
                ['Result', 'Optimal-transport paths train faster and sample in fewer steps.']],
      tour: ['Problem', 'Objective', 'OT paths', 'Results'],
      concepts: ['Flow Matching', 'Optimal transport', 'Probability flow ODE'] },
    { short: 'Abramson et al. 2024', title: ['Accurate structure prediction of', 'biomolecular interactions with AF3'], fig: 'ribbon',
      summary: [['Contribution', 'One model for proteins, nucleic acids, ligands and ions.'],
                ['Method', 'A Pairformer trunk and a diffusion module over atom coordinates.'],
                ['Result', 'Beats specialised docking tools on PoseBusters.']],
      tour: ['Problem', 'Architecture', 'Diffusion module', 'Benchmarks'],
      concepts: ['Diffusion models', 'Pairformer', 'Protein structure'] }
  ];
  // PaperManager's five highlight colours: key insight, evidence, context, question, follow-up
  var HL = [[250, 204, 21], [34, 197, 94], [59, 130, 246], [239, 68, 68], [168, 85, 247]];
  var ROWS = 24, PER = 12.5;
  // page rows: 0-1 title, 2 authors, 4-8 text, 9 equation, 10-11 text, 12-15 figure, 16-18 text, 19-20 table, 21-23 text
  var HIGHLIGHTS = [{ row: 5, c: 0, t: 1.0 }, { row: 7, c: 1, t: 1.5 }, { row: 10, c: 2, t: 2.0 }, { row: 17, c: 3, t: 2.5 }, { row: 22, c: 4, t: 3.0 }];
  var MARKS = [{ row: 6, t: 1.8 }, { row: 9, t: 2.4 }, { row: 13, t: 3.0 }];
  var PINS = [{ row: 4, t: 7.2 }, { row: 9, t: 7.6 }, { row: 13, t: 8.0 }, { row: 20, t: 8.4 }];
  var T_SUM = 1.2, CPS = 46, T_FIG = 4.6, T_TAB = 5.2, T_REF = 6.0, T_CON = 9.0;

  function annotate(st) {
    var T = 0, L = {};
    function layout() {
      var w = st.w, h = st.h;
      if (st.small) {
        L.pw = Math.min(230, w - 70); L.ph = L.pw * 1.25;
        L.px = (w - L.pw) / 2 - 10; L.py = 18;
        L.qx = 12; L.qy = L.py + L.ph + 22; L.qw = w - 24; L.qh = h - L.qy - 14;
        L.cols = 1;
      } else {
        L.ph = Math.min(h - 40, 420); L.pw = L.ph * 0.78;
        L.px = Math.max(36, w * 0.06); L.py = (h - L.ph) / 2;
        L.qx = L.px + L.pw + Math.max(40, w * 0.05); L.qy = L.py; L.qw = w - L.qx - Math.max(30, w * 0.04); L.qh = L.ph;
        L.cols = L.qw > 560 ? 2 : 1;
      }
      L.rh = (L.ph - 28) / ROWS;
    }
    function rowY(r) { return L.py + 16 + r * L.rh; }
    function since(t0, local) { return local - t0; }
    function prog(local, t0, d) { return Math.max(0, Math.min(1, (local - t0) / d)); }
    function wrap(ctx, text, maxW) {
      var words = text.split(' '), lines = [], cur = '';
      words.forEach(function (wd) {
        var tr = cur ? cur + ' ' + wd : wd;
        if (ctx.measureText(tr).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = tr;
      });
      if (cur) lines.push(cur);
      return lines;
    }

    function drawFig(ctx, kind, x, y, w, h, C, k) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = C.dark ? 'rgba(255,255,255,.03)' : 'rgba(15,23,42,.025)';
      ctx.fillRect(x, y, w, h);
      ctx.lineWidth = Math.max(1, w / 90);
      if (kind === 'curve') {
        ctx.strokeStyle = rgba(C.muted, 0.5);
        ctx.beginPath(); ctx.moveTo(x + w * 0.1, y + h * 0.12); ctx.lineTo(x + w * 0.1, y + h * 0.88); ctx.lineTo(x + w * 0.92, y + h * 0.88); ctx.stroke();
        [[C.a, 0.2], [C.a2, 0.45]].forEach(function (c) {
          ctx.strokeStyle = rgba(c[0], 0.9); ctx.beginPath();
          for (var i = 0; i <= 30; i++) { var u = i / 30, yy = y + h * (0.82 - 0.66 * (1 - Math.exp(-u * 4 * (1 - c[1])))); i ? ctx.lineTo(x + w * (0.12 + u * 0.78), yy) : ctx.moveTo(x + w * 0.12, yy); }
          ctx.stroke();
        });
      } else if (kind === 'paths') {
        for (var i = 0; i < 7; i++) {
          var y0 = y + h * (0.2 + i * 0.1), y1 = y + h * (0.5 + Math.sin(i * 1.7) * 0.3);
          ctx.strokeStyle = rgba(i % 2 ? C.a2 : C.a, 0.75);
          ctx.beginPath(); ctx.moveTo(x + w * 0.12, y0); ctx.bezierCurveTo(x + w * 0.45, y0, x + w * 0.55, y1, x + w * 0.88, y1); ctx.stroke();
        }
        ctx.fillStyle = rgba(C.muted, 0.6);
        for (var j = 0; j < 7; j++) { ctx.beginPath(); ctx.arc(x + w * 0.12, y + h * (0.2 + j * 0.1), Math.max(1.2, w / 70), 0, TAU); ctx.fill(); }
      } else {
        ctx.strokeStyle = rgba(C.a, 0.85); ctx.lineWidth = Math.max(1.4, w / 45);
        ctx.beginPath();
        for (var s = 0; s <= 60; s++) { var u2 = s / 60; var xx = x + w * (0.1 + u2 * 0.8), yy2 = y + h * (0.5 + 0.28 * Math.sin(u2 * 14) * Math.cos(u2 * 3)); s ? ctx.lineTo(xx, yy2) : ctx.moveTo(xx, yy2); }
        ctx.stroke();
        ctx.fillStyle = rgba(C.a2, 0.9);
        [[0.3, 0.3], [0.62, 0.7], [0.75, 0.35]].forEach(function (p) { ctx.beginPath(); ctx.arc(x + w * p[0], y + h * p[1], Math.max(1.5, w / 40), 0, TAU); ctx.fill(); });
      }
      ctx.restore();
      ctx.strokeStyle = rgba(C.muted, 0.3 * (k == null ? 1 : k)); ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
    function drawTable(ctx, x, y, w, h, C) {
      ctx.strokeStyle = rgba(C.muted, 0.45); ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.beginPath();
      for (var i = 1; i < 3; i++) { ctx.moveTo(x, y + h * i / 3); ctx.lineTo(x + w, y + h * i / 3); }
      for (var j = 1; j < 4; j++) { ctx.moveTo(x + w * j / 4, y); ctx.lineTo(x + w * j / 4, y + h); }
      ctx.strokeStyle = rgba(C.muted, 0.25); ctx.stroke();
      ctx.fillStyle = rgba(C.muted, 0.18); ctx.fillRect(x + 1, y + 1, w - 2, h / 3 - 1);
    }
    function figRect() { return { x: L.px + L.pw * 0.14, y: rowY(12) + 2, w: L.pw * 0.72, h: L.rh * 4 - 4 }; }
    function tabRect() { return { x: L.px + L.pw * 0.2, y: rowY(19) + 2, w: L.pw * 0.6, h: L.rh * 2 - 4 }; }

    // panel geometry: returns section boxes
    function sections(ctx) {
      var pad = st.small ? 12 : 18, x = L.qx + pad, y = L.qy + pad, W = L.qw - pad * 2;
      var S = {};
      var colW = L.cols === 2 ? (W - 26) * 0.56 : W;
      var x2 = L.cols === 2 ? x + colW + 26 : x, w2 = L.cols === 2 ? W - colW - 26 : W;
      ctx.font = '650 ' + (st.small ? 13 : 15) + 'px Inter, system-ui, sans-serif';
      var headLines = 1;
      PAPERS.forEach(function (pp) { headLines = Math.max(headLines, wrap(ctx, pp.title.join(' '), W).length); });
      S.head = { x: x, y: y, w: W, lines: headLines };
      S.sum = { x: x, y: y + (st.small ? 40 : 50) + (headLines - 1) * (st.small ? 17 : 19), w: colW };
      // summary height estimate for the one-column layout
      var sumH = 0;
      if (L.cols === 1) {
        ctx.font = (st.small ? 11.5 : 12.5) + 'px Inter, system-ui, sans-serif';
        PAPERS.forEach(function (pp) {
          var hgt = 0;
          pp.summary.forEach(function (it) { hgt += 14 + wrap(ctx, it[1], colW).length * (st.small ? 15 : 17) + 6; });
          sumH = Math.max(sumH, hgt);
        });
        sumH = Math.max(sumH, st.small ? 140 : 150);
      }
      var y2 = L.cols === 2 ? S.sum.y : S.sum.y + sumH + 10;
      S.figs = { x: x2, y: y2, w: w2 };
      var tw0 = Math.min(st.small ? 74 : 92, (w2 - 12) / 2);
      S.refs = { x: x2, y: y2 + 18 + tw0 * 0.62 + 30, w: w2 };
      S.tour = { x: x2, y: S.refs.y + (st.small ? 58 : 64), w: w2 };
      S.leg = { x: x, y: S.sum.y + 190, w: colW };
      // as many chip rows as the longest tour needs, so the concepts never overlap it
      ctx.font = '500 ' + (st.small ? 10 : 11) + 'px Inter, system-ui, sans-serif';
      var rowH = st.small ? 25 : 28, tourRows = 1;
      PAPERS.forEach(function (pp) {
        var cx0 = 0, rows = 1;
        pp.tour.forEach(function (name, i) {
          var need = ctx.measureText((i + 1) + '  ' + name).width + 16;
          if (cx0 + need > w2) { cx0 = 0; rows++; }
          cx0 += need + 6;
        });
        tourRows = Math.max(tourRows, rows);
      });
      S.con = { x: x2, y: S.tour.y + 18 + tourRows * rowH + 10, w: w2 };
      return S;
    }
    function thumbRect(S, i) {
      var tw = Math.min(st.small ? 74 : 92, (S.figs.w - 12) / 2), th = tw * 0.62;
      return { x: S.figs.x + i * (tw + 12), y: S.figs.y + 18, w: tw, h: th };
    }
    function label(ctx, C, text, x, y, state) {
      ctx.font = (st.small ? 9.5 : 10.5) + 'px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = rgba(C.muted, 1);
      ctx.fillText(text.toUpperCase(), x + 14, y + 10);
      // status: grey dot waiting, accent ring working, check done
      var cx = x + 4, cy = y + 6.5;
      if (state === 2) {
        ctx.strokeStyle = rgba(C.a, 1); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(cx - 3.5, cy); ctx.lineTo(cx - 1, cy + 2.6); ctx.lineTo(cx + 4, cy - 3); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, TAU);
        ctx.fillStyle = state === 1 ? rgba(C.a, 0.5 + 0.5 * Math.sin(T * 8)) : rgba(C.muted, 0.35); ctx.fill();
      }
    }
    function chip(ctx, C, text, x, y, col, k, filled) {
      ctx.font = '500 ' + (st.small ? 10 : 11) + 'px Inter, system-ui, sans-serif';
      var tw = ctx.measureText(text).width + 16, th = st.small ? 19 : 21;
      ctx.save(); ctx.globalAlpha *= k;
      ctx.translate(x, y + (1 - k) * 6);
      rr(ctx, 0, 0, tw, th, th / 2);
      ctx.fillStyle = filled ? rgba(col, 0.16) : 'transparent'; ctx.fill();
      ctx.strokeStyle = rgba(col, 0.6); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = rgba(C.ink, 0.9); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(text, 8, th / 2 + 0.5);
      ctx.restore();
      return tw;
    }

    function draw() {
      var ctx = st.ctx, C = st.C, w = st.w, h = st.h;
      ctx.clearRect(0, 0, w, h);
      var cyc = T % (PER * PAPERS.length), pi = Math.floor(cyc / PER), local = cyc - pi * PER;
      var P = PAPERS[pi];
      var fade = Math.min(1, local / 0.5) * (local > PER - 0.6 ? (PER - local) / 0.6 : 1);
      var paperBg = C.dark ? '#1d2029' : '#ffffff';

      ctx.save();
      ctx.globalAlpha = Math.max(0, fade);

      // ---------------- the page
      ctx.save();
      ctx.shadowColor = C.dark ? 'rgba(0,0,0,.5)' : 'rgba(15,23,42,.14)';
      ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
      rr(ctx, L.px, L.py, L.pw, L.ph, 5);
      ctx.fillStyle = paperBg; ctx.fill();
      ctx.restore();
      rr(ctx, L.px, L.py, L.pw, L.ph, 5);
      ctx.strokeStyle = rgba(C.muted, 0.22); ctx.lineWidth = 1; ctx.stroke();

      var tx = L.px + L.pw * 0.1, tw = L.pw * 0.8, fs = Math.max(8, L.pw * 0.04);
      ctx.fillStyle = rgba(C.ink, 0.95); ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(P.title[0], tx, rowY(0) + L.rh / 2);
      ctx.fillText(P.title[1], tx, rowY(1) + L.rh / 2);
      ctx.font = (fs * 0.85) + 'px Inter, system-ui, sans-serif';
      ctx.fillStyle = rgba(C.muted, 0.9);
      ctx.fillText(P.short.replace(' et al.', ' et al.,') , tx, rowY(2) + L.rh / 2);

      var lineH = Math.max(1.6, L.rh * 0.16);
      function textRow(r, frac) {
        var lw = tw * (frac || (0.92 - ((r * 37) % 13) / 100));
        // highlight under the line
        HIGHLIGHTS.forEach(function (hl) {
          if (hl.row !== r) return;
          var k = prog(local, hl.t, 0.45);
          if (k > 0) { ctx.fillStyle = rgba(HL[hl.c], C.dark ? 0.38 : 0.42); ctx.fillRect(tx - 2, rowY(r) + L.rh * 0.18, (lw + 4) * ease(k), L.rh * 0.64); }
        });
        ctx.fillStyle = rgba(C.ink2, 0.4);
        ctx.fillRect(tx, rowY(r) + L.rh / 2 - lineH / 2, lw, lineH);
      }
      [4, 5, 6, 7, 10, 16, 17, 21, 22].forEach(function (r) { textRow(r); });
      [8, 11, 18, 23].forEach(function (r) { textRow(r, 0.5); });
      // equation
      ctx.fillStyle = rgba(C.ink2, 0.5);
      ctx.font = 'italic ' + (fs * 1.05) + 'px "Newsreader", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(['dx = −σ̇(t) σ(t) ∇ log p(x; σ) dt', 'L = ‖ v(x, t) − u(x | x₁) ‖²', 'x ← x + Δt · D(x; σ)'][pi], L.px + L.pw / 2, rowY(9) + L.rh / 2);
      ctx.textAlign = 'left';
      // figure and table, dashed once extracted
      var fr = figRect(), tb = tabRect();
      drawFig(ctx, P.fig, fr.x, fr.y, fr.w, fr.h, C);
      drawTable(ctx, tb.x, tb.y, tb.w, tb.h, C);
      [[fr, T_FIG], [tb, T_TAB]].forEach(function (q) {
        if (local > q[1] + 0.9) {
          ctx.setLineDash([3, 3]); ctx.strokeStyle = rgba(C.a, 0.7); ctx.lineWidth = 1.2;
          ctx.strokeRect(q[0].x - 3, q[0].y - 3, q[0].w + 6, q[0].h + 6); ctx.setLineDash([]);
        }
      });
      // concept marks in the left margin
      MARKS.forEach(function (m, i) {
        var k = prog(local, m.t, 0.35);
        if (!k) return;
        var mx = L.px + L.pw * 0.05, my = rowY(m.row) + L.rh / 2, r = Math.max(5, L.rh * 0.42) * (0.6 + 0.4 * ease(k));
        if (k < 1) { ctx.beginPath(); ctx.arc(mx, my, r + (1 - k) * 12, 0, TAU); ctx.strokeStyle = rgba(C.a, (1 - k) * 0.7); ctx.lineWidth = 1.4; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fillStyle = rgba(C.a, 1); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '700 ' + (r * 1.15) + 'px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(String(i + 1), mx, my + 0.5); ctx.textAlign = 'left';
      });
      // tour pins in the right margin, joined by a dotted path
      var pinX = L.px + L.pw * 0.95, shown = [];
      PINS.forEach(function (p) { var k = prog(local, p.t, 0.35); if (k) shown.push({ y: rowY(p.row) + L.rh / 2, k: k }); });
      if (shown.length > 1) {
        ctx.setLineDash([2, 4]); ctx.strokeStyle = rgba(C.a2, 0.6); ctx.lineWidth = 1.2;
        ctx.beginPath(); shown.forEach(function (s, i) { i ? ctx.lineTo(pinX, s.y) : ctx.moveTo(pinX, s.y); }); ctx.stroke(); ctx.setLineDash([]);
      }
      shown.forEach(function (s, i) {
        var r = Math.max(6, L.rh * 0.48), yy = s.y - (1 - ease(s.k)) * 18;
        ctx.save(); ctx.globalAlpha *= s.k;
        ctx.beginPath(); ctx.arc(pinX, yy - r * 0.4, r, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(pinX, yy + r * 1.1); ctx.closePath();
        ctx.fillStyle = rgba(C.a2, 1); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '700 ' + (r * 1.05) + 'px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), pinX, yy - r * 0.4 + 0.5);
        ctx.restore();
      });

      // ---------------- the panel
      var S = sections(ctx);
      rr(ctx, L.qx, L.qy, L.qw, L.qh, 12);
      ctx.fillStyle = C.dark ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.75)'; ctx.fill();
      ctx.strokeStyle = rgba(C.muted, 0.22); ctx.lineWidth = 1; ctx.stroke();

      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.font = '650 ' + (st.small ? 13 : 15) + 'px Inter, system-ui, sans-serif';
      ctx.fillStyle = rgba(C.ink, 1);
      var hl2 = st.small ? 17 : 19;
      wrap(ctx, P.title.join(' '), S.head.w).forEach(function (ln, i) { ctx.fillText(ln, S.head.x, S.head.y + 14 + i * hl2); });
      ctx.font = (st.small ? 10 : 11) + 'px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = rgba(C.muted, 1);
      ctx.fillText(P.short + '  ·  paper ' + (pi + 1) + ' of ' + PAPERS.length, S.head.x, S.head.y + (st.small ? 30 : 34) + (S.head.lines - 1) * hl2);

      // highlight legend (wide panel only): PaperManager's five highlight kinds
      if (L.cols === 2) {
        var names = ['Key insight', 'Evidence', 'Context', 'Question', 'Follow-up'];
        var nh = 0; HIGHLIGHTS.forEach(function (hl) { if (local >= hl.t) nh++; });
        label(ctx, C, 'Highlights', S.leg.x, S.leg.y, nh === 0 ? 0 : nh < 5 ? 1 : 2);
        var lx = S.leg.x;
        HIGHLIGHTS.forEach(function (hl, i) {
          var k = prog(local, hl.t, 0.35);
          if (!k) return;
          lx += chip(ctx, C, names[hl.c], lx, S.leg.y + 18, HL[hl.c], ease(k), true) + 6;
        });
      }

      // summary, typed
      var budget = Math.max(0, (local - T_SUM) * CPS), total = 0;
      P.summary.forEach(function (it) { total += it[1].length; });
      label(ctx, C, 'Summary', S.sum.x, S.sum.y, budget <= 0 ? 0 : budget < total ? 1 : 2);
      var yy = S.sum.y + (st.small ? 26 : 30), lh = st.small ? 15 : 17;
      P.summary.forEach(function (it) {
        if (budget <= 0) return;
        ctx.font = '650 ' + (st.small ? 10.5 : 11.5) + 'px Inter, system-ui, sans-serif';
        ctx.fillStyle = rgba(C.a, 1);
        ctx.fillText(it[0], S.sum.x, yy);
        yy += lh - 2;
        var shownTxt = it[1].slice(0, Math.floor(budget));
        budget -= it[1].length;
        ctx.font = (st.small ? 11.5 : 12.5) + 'px Inter, system-ui, sans-serif';
        ctx.fillStyle = rgba(C.ink2, 1);
        var lines = wrap(ctx, shownTxt, S.sum.w);
        lines.forEach(function (ln, i) {
          ctx.fillText(ln, S.sum.x, yy);
          if (budget < 0 && i === lines.length - 1 && Math.sin(T * 9) > 0) {
            ctx.fillRect(S.sum.x + ctx.measureText(ln).width + 2, yy - (st.small ? 9 : 10), 1.5, st.small ? 11 : 12);
          }
          yy += lh;
        });
        yy += 6;
      });

      // figures and tables flying from the page into the panel
      label(ctx, C, 'Figures & tables', S.figs.x, S.figs.y, local < T_FIG ? 0 : local < T_TAB + 0.9 ? 1 : 2);
      [[fr, T_FIG, 0], [tb, T_TAB, 1]].forEach(function (q) {
        var k = prog(local, q[1], 0.9);
        if (!k) return;
        var e = ease(k), dst = thumbRect(S, q[2]), src = q[0];
        var x = src.x + (dst.x - src.x) * e, y = src.y + (dst.y - src.y) * e - Math.sin(e * Math.PI) * 40;
        var ww = src.w + (dst.w - src.w) * e, hh = src.h + (dst.h - src.h) * e;
        ctx.save();
        ctx.shadowColor = C.dark ? 'rgba(0,0,0,.5)' : 'rgba(15,23,42,.2)'; ctx.shadowBlur = 14 * Math.sin(e * Math.PI) + 4; ctx.shadowOffsetY = 4;
        ctx.fillStyle = paperBg; ctx.fillRect(x, y, ww, hh);
        ctx.restore();
        if (q[2] === 0) drawFig(ctx, P.fig, x, y, ww, hh, C); else drawTable(ctx, x, y, ww, hh, C);
        if (k === 1) {
          ctx.font = (st.small ? 9.5 : 10) + 'px Inter, system-ui, sans-serif'; ctx.fillStyle = rgba(C.muted, 1);
          ctx.fillText(q[2] === 0 ? 'Figure 1' : 'Table 1', dst.x, dst.y + dst.h + 13);
        }
      });

      // references
      var nref = Math.floor(Math.max(0, Math.min(1, (local - T_REF) / 1.1)) * 16);
      label(ctx, C, 'References', S.refs.x, S.refs.y, nref === 0 ? 0 : nref < 16 ? 1 : 2);
      for (var i = 0; i < nref; i++) {
        var rx = S.refs.x + i * (st.small ? 9 : 11), ry = S.refs.y + 26;
        rr(ctx, rx, ry - 6, st.small ? 6 : 8, st.small ? 8 : 10, 1.5);
        ctx.fillStyle = rgba(i % 5 === 2 ? C.a : C.muted, i % 5 === 2 ? 0.9 : 0.45); ctx.fill();
      }
      if (nref === 16) {
        ctx.font = (st.small ? 10 : 11) + 'px Inter, system-ui, sans-serif'; ctx.fillStyle = rgba(C.muted, 1);
        ctx.fillText('→ linked into the citation graph', S.refs.x, S.refs.y + 26 + (st.small ? 18 : 20));
      }

      // quick tour stops
      var nstop = 0; PINS.forEach(function (p) { if (local >= p.t) nstop++; });
      label(ctx, C, 'Quick tour', S.tour.x, S.tour.y, nstop === 0 ? 0 : nstop < PINS.length ? 1 : 2);
      var cxp = S.tour.x, cyp = S.tour.y + 18;
      P.tour.forEach(function (name, i) {
        var k = prog(local, PINS[i].t, 0.35);
        if (!k) return;
        ctx.font = '500 ' + (st.small ? 10 : 11) + 'px Inter, system-ui, sans-serif';
        var need = ctx.measureText((i + 1) + '  ' + name).width + 16;
        if (cxp + need > S.tour.x + S.tour.w) { cxp = S.tour.x; cyp += st.small ? 25 : 28; }
        cxp += chip(ctx, C, (i + 1) + '  ' + name, cxp, cyp, C.a2, ease(k), true) + 6;
      });

      // final small beat: concepts, shared with earlier papers
      var kc = prog(local, T_CON, 0.4);
      label(ctx, C, 'Concepts', S.con.x, S.con.y, kc ? 2 : 0);
      if (kc) {
        var cx2 = S.con.x, cy2 = S.con.y + 18;
        P.concepts.forEach(function (name, i) {
          var k = prog(local, T_CON + i * 0.25, 0.35);
          if (!k) return;
          var shared = null;
          for (var j = 0; j < pi; j++) if (PAPERS[j].concepts.indexOf(name) >= 0) { shared = PAPERS[j].short; break; }
          ctx.font = '500 ' + (st.small ? 10 : 11) + 'px Inter, system-ui, sans-serif';
          var need = ctx.measureText(name).width + 16;
          if (cx2 + need > S.con.x + S.con.w) { cx2 = S.con.x; cy2 += st.small ? 25 : 28; }
          cx2 += chip(ctx, C, name, cx2, cy2, shared ? C.a2 : C.a, ease(k), !!shared) + 6;
          if (shared && k === 1) {
            ctx.font = (st.small ? 9.5 : 10) + 'px Inter, system-ui, sans-serif'; ctx.fillStyle = rgba(C.a2, 1);
            ctx.fillText('↔ ' + shared, cx2 - need - 6 + 8, cy2 + (st.small ? 31 : 34));
          }
        });
      }
      ctx.restore();
    }

    return {
      resize: layout,
      step: function (dt) { T += dt; },
      draw: draw,
      still: function () { var keep = T; T = PER * 1 + 10.8; draw(); T = keep; }
    };
  }

  // ------------------------------------------------------------ wire up scenes
  var makers = { infinity: infinity, constellation: constellation, annotate: annotate };
  Array.prototype.forEach.call(root.querySelectorAll('canvas[data-scene]'), function (cv) {
    var make = makers[cv.getAttribute('data-scene')];
    if (!make) return;
    var s;
    var sc = scene(cv, function (st) {
      if (cv.getAttribute('data-scene') !== 'annotate') track(cv.closest('.pm-hv'), st);
      return make(st);
    });
    // a scene outside the heroes (the "what it does to a paper" section) runs whatever hero is
    // selected; it pauses by itself when off-screen or hidden (hero F hides the section)
    if (sc.hero === '*') { var on = sc.setActive; sc.setActive = function () { on(true); }; sc.setActive(); }
  });

  // ------------------------------------------------------------ switcher
  var sw = document.getElementById('pm-switch');
  var nameEl = sw && sw.querySelector('.pm-switch-name');

  function setHero(h, save) {
    // hero C has sub-versions C1-C7 (.pm[data-hero-c]); plain "c" keeps the current one
    var sub = '';
    if (/^c[1-7]$/.test(h)) { sub = h[1]; h = 'c'; }
    else if (h === 'c') sub = root.getAttribute('data-hero-c') || '1';
    if (HEROES.indexOf(h) < 0) h = 'a';
    root.setAttribute('data-hero', h);
    if (sub) root.setAttribute('data-hero-c', sub);
    if (sw) {
      Array.prototype.forEach.call(sw.querySelectorAll('[data-set-hero]'), function (b) {
        var v = b.getAttribute('data-set-hero');
        b.setAttribute('aria-pressed', v === h || (sub && v === 'c' + sub) ? 'true' : 'false');
      });
      var sec = root.querySelector(sub ? '.pm-cx-' + sub : '.pm-hv-' + h);
      if (nameEl && sec) nameEl.textContent = (h + sub).toUpperCase() + ' · ' + sec.getAttribute('data-name');
    }
    scenes.forEach(function (s) { s.setActive(s.hero === h); });
    if (save) { store('pm-hero', h + sub); setParam('hero', h + sub); }
  }
  function setTheme(t, save) {
    if (THEMES.indexOf(t) < 0) t = 'violet';
    root.setAttribute('data-pm-theme', t);
    if (sw) Array.prototype.forEach.call(sw.querySelectorAll('[data-set-theme]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-theme') === t ? 'true' : 'false');
    });
    if (save) { store('pm-theme', t); setParam('theme', t); custom = null; store('pm-accent', ''); setParam('accent', ''); }
    applyAccent();
  }

  // ------------------------------------------------------------ accent: presets, free picker, shared contract
  // Whatever sets the accent (preset, picker, URL, load), applyAccent() ends by publishing on .pm:
  //   --pm-accent (hex), --pm-accent-rgb ("124 58 237"), --pm-accent-h (degrees, no unit),
  //   --pm-accent-s / --pm-accent-l (with %), --pm-accent-soft, --pm-accent-ink (readable dark variant),
  // then dispatches document 'pm:accent' {detail: {hex, rgb, h, s, l}}; window.PMAccent.get() returns it.
  // A picked colour is clamped for UI use: white text stays readable on it in light mode, dark
  // text in dark mode. Presets keep their hand-picked light/dark pairs from the stylesheet.
  var custom = null, accentNow = null;
  var OWN = ['--pm-accent', '--pm-accent-soft', '--pm-accent-2', '--pm-accent-rgb', '--pm-accent-h', '--pm-accent-s', '--pm-accent-l', '--pm-accent-ink'];
  function hex(c) { return '#' + c.map(function (x) { return ('0' + Math.round(Math.max(0, Math.min(255, x))).toString(16)).slice(-2); }).join(''); }
  function toHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }
  function fromHsl(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))); };
    return [f(0), f(8), f(4)];
  }
  function lum(c) {
    var v = c.map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function derive(picked) {
    var q = toHsl(parse(picked)), h = q[0], s = Math.max(q[1], 20), l = q[2];
    if (isDark()) { // buttons carry dark text on the accent
      l = Math.max(55, Math.min(82, l));
      while (l < 90 && contrast(fromHsl(h, s, l), [20, 16, 31]) < 4.5) l += 2;
    } else { // buttons carry white text on the accent
      l = Math.max(22, Math.min(60, l));
      while (l > 18 && contrast(fromHsl(h, s, l), [255, 255, 255]) < 4.5) l -= 2;
    }
    return {
      accent: hex(fromHsl(h, s, l)),
      soft: hex(isDark() ? fromHsl(h, Math.min(s, 45), 16) : fromHsl(h, Math.min(s, 85), 96)),
      two: hex(fromHsl((h + 40) % 360, s, l))
    };
  }
  function applyAccent() {
    OWN.forEach(function (v) { root.style.removeProperty(v); });
    if (custom) {
      var d = derive('#' + custom);
      root.style.setProperty('--pm-accent', d.accent);
      root.style.setProperty('--pm-accent-soft', d.soft);
      root.style.setProperty('--pm-accent-2', d.two);
    }
    var cs = getComputedStyle(root), c = parse(cs.getPropertyValue('--pm-accent')).map(Math.round), q = toHsl(c);
    root.style.setProperty('--pm-accent', hex(c));
    root.style.setProperty('--pm-accent-soft', cs.getPropertyValue('--pm-accent-soft').trim());
    root.style.setProperty('--pm-accent-rgb', c.join(' '));
    root.style.setProperty('--pm-accent-h', String(q[0]));
    root.style.setProperty('--pm-accent-s', q[1] + '%');
    root.style.setProperty('--pm-accent-l', q[2] + '%');
    root.style.setProperty('--pm-accent-ink', hex(fromHsl(q[0], Math.min(q[1], 70), Math.min(q[2], 30))));
    accentNow = { hex: hex(c), rgb: c, h: q[0], s: q[1], l: q[2] };
    if (sw) {
      var pick = sw.querySelector('.pm-switch-pick');
      if (pick) {
        pick.setAttribute('aria-pressed', custom ? 'true' : 'false');
        pick.style.setProperty('--sw', custom ? '#' + custom : 'transparent');
        var inp = pick.querySelector('input');
        if (inp && custom) inp.value = '#' + custom;
      }
      if (custom) Array.prototype.forEach.call(sw.querySelectorAll('[data-set-theme]'), function (b) { b.setAttribute('aria-pressed', 'false'); });
    }
    scenes.forEach(function (s) { s.recolour(); });
    try { document.dispatchEvent(new CustomEvent('pm:accent', { detail: accentNow })); } catch (e) { /* very old browser */ }
  }
  window.PMAccent = { get: function () { return accentNow; } };
  function setCustom(v, save) {
    v = String(v || '').replace('#', '').toLowerCase();
    if (!/^[0-9a-f]{6}$/.test(v)) return;
    custom = v;
    applyAccent();
    if (save) { store('pm-accent', v); setParam('accent', v); }
  }
  function setParam(k, v) {
    try {
      var u = new URL(location.href);
      if (v) u.searchParams.set(k, v); else u.searchParams.delete(k);
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (e) { /* old browser */ }
  }

  if (sw) {
    sw.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-set-hero')) setHero(b.getAttribute('data-set-hero'), true);
      else if (b.hasAttribute('data-set-theme')) setTheme(b.getAttribute('data-set-theme'), true);
      else if (b.classList.contains('pm-switch-toggle')) {
        var collapsed = sw.classList.toggle('is-collapsed');
        b.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        b.title = collapsed ? 'Show the design switcher' : 'Hide the design switcher';
        store('pm-switch-collapsed', collapsed ? '1' : '0');
      }
    });
    if (load('pm-switch-collapsed') === '1') {
      sw.classList.add('is-collapsed');
      sw.querySelector('.pm-switch-toggle').setAttribute('aria-expanded', 'false');
    }
  }

  // free colour picker next to the presets
  var pickIn = sw && sw.querySelector('.pm-switch-pick input');
  if (pickIn) {
    pickIn.addEventListener('input', function () { setCustom(pickIn.value, false); });
    pickIn.addEventListener('change', function () { setCustom(pickIn.value, true); });
  }
  (function () {
    var a = '';
    try { a = new URLSearchParams(location.search).get('accent') || ''; } catch (e) { /* old browser */ }
    if (!/^#?[0-9a-fA-F]{6}$/.test(a)) a = load('pm-accent') || '';
    if (/^#?[0-9a-fA-F]{6}$/.test(a)) custom = a.replace('#', '').toLowerCase();
  })();

  setHero(root.getAttribute('data-hero') || 'a', false);
  setTheme(root.getAttribute('data-pm-theme') || 'violet', false);

  // site light/dark toggle
  new MutationObserver(function () { applyAccent(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
