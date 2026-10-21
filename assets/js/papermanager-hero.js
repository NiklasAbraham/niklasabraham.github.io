/* PaperManager project page: hero switcher, page colour themes and the canvas
 * heroes (C living infinity, D knowledge constellation, F page to graph).
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
      var dt = Math.min((now - last) / 1000, 0.05);
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
      hero: canvas.closest('.pm-hv').getAttribute('data-hero'),
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

  // ============================================================ F: page to graph
  var PAPERS = [
    { short: 'Karras et al. 2022', title: ['Elucidating the Design Space', 'of Diffusion-Based Models'], concepts: ['Diffusion Models', 'Probability flow ODE', 'Preconditioning', 'Heun sampler'] },
    { short: 'Lipman et al. 2023', title: ['Flow Matching for', 'Generative Modeling'], concepts: ['Flow Matching', 'Optimal Transport', 'Probability flow ODE', 'Diffusion Models'] },
    { short: 'Abramson et al. 2024', title: ['Accurate structure prediction', 'of biomolecular interactions'], concepts: ['Protein structure', 'Diffusion Models', 'Pairformer', 'Optimal Transport'] }
  ];
  var KEYLINES = [2, 6, 9, 13], NLINES = 16;
  var PER = 7.6, HOLD = 3.4, CYCLE = PER * PAPERS.length + HOLD;

  function pagegraph(st) {
    var T = 0, nodes = [], byName = {}, links = [], flights = [], done = {}, L = {};
    function layout() {
      var w = st.w, h = st.h;
      L.pw = Math.min(250, w * 0.33); L.ph = Math.min(h - 70, L.pw * 1.32);
      L.px = st.small ? 14 : Math.max(24, w * 0.09); L.py = (h - L.ph) / 2;
      L.gx0 = L.px + L.pw + (st.small ? 24 : 70); L.gx1 = w - (st.small ? 12 : 30);
      L.gcx = (L.gx0 + L.gx1) / 2; L.gcy = h / 2;
      var GW = L.gx1 - L.gx0;
      // papers sit at fixed anchors; shared concepts settle between them
      L.anchors = st.small
        ? [[L.gx0 + GW * 0.3, h * 0.2], [L.gx0 + GW * 0.72, h * 0.5], [L.gx0 + GW * 0.3, h * 0.8]]
        : [[L.gx0 + GW * 0.2, h * 0.26], [L.gx0 + GW * 0.78, h * 0.3], [L.gx0 + GW * 0.48, h * 0.76]];
    }
    function reset() { nodes = []; byName = {}; links = []; flights = []; done = {}; }
    function addNode(key, kind, label, x, y) {
      var n = { key: key, kind: kind, label: label, x: x, y: y, vx: 0, vy: 0, born: T, deg: 0, pulse: 1 };
      nodes.push(n); byName[key] = n; return n;
    }
    function lineY(i) { return L.py + L.ph * 0.25 + i * (L.ph * 0.7 / NLINES); }
    function scanY(local) { return L.py + L.ph * 0.2 + ease((local - 0.9) / 5) * L.ph * 0.76; }

    function events() {
      var cyc = T % CYCLE;
      if (cyc < 0.05 && done.cycleStart !== Math.floor(T / CYCLE)) { reset(); done.cycleStart = Math.floor(T / CYCLE); }
      var pi = Math.min(PAPERS.length - 1, Math.floor(cyc / PER));
      var local = cyc - pi * PER;
      var P = PAPERS[pi], tag = Math.floor(T / CYCLE) + ':' + pi;
      if (cyc >= PAPERS.length * PER) return;
      if (local > 0.6 && !done['p' + tag]) {
        done['p' + tag] = 1;
        var pn = addNode('paper:' + pi, 'paper', P.short, L.anchors[pi][0], L.anchors[pi][1]);
        pn.anchor = pi;
      }
      KEYLINES.forEach(function (li, ci) {
        var key = 'k' + tag + ':' + ci;
        if (!done[key] && scanY(local) >= lineY(li)) {
          done[key] = 1;
          flights.push({ from: [L.px + L.pw * 0.86, lineY(li)], name: P.concepts[ci], paper: 'paper:' + pi, p: 0 });
        }
      });
    }
    function land(f) {
      var paper = byName[f.paper];
      var c = byName['c:' + f.name];
      if (!c) {
        var ang = Math.atan2(paper.y - L.gcy, paper.x - L.gcx) + rand(-1.1, 1.1);
        c = addNode('c:' + f.name, 'concept', f.name, paper.x + Math.cos(ang) * 70, paper.y + Math.sin(ang) * 50);
      } else c.pulse = 1;
      c.deg++;
      links.push({ a: paper, b: c, born: T });
    }
    function physics(dt) {
      var i, j, a, b, dx, dy, d, f;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = b.x - a.x; dy = b.y - a.y;
          // labels are wide: measure distance in a squashed x so neighbours keep apart sideways
          d = Math.max(12, Math.hypot(dx / 2.2, dy));
          f = (st.small ? 700 : 1500) / (d * d);
          a.vx -= dx / d * f; a.vy -= dy / d * f; b.vx += dx / d * f; b.vy += dy / d * f;
        }
      }
      var rest = st.small ? 62 : 120;
      links.forEach(function (l) {
        dx = l.b.x - l.a.x; dy = l.b.y - l.a.y; d = Math.hypot(dx, dy) || 1;
        f = (d - rest) * 0.02;
        l.a.vx += dx / d * f; l.a.vy += dy / d * f; l.b.vx -= dx / d * f; l.b.vy -= dy / d * f;
      });
      nodes.forEach(function (n) {
        if (n.anchor != null) {
          var an = L.anchors[n.anchor];
          n.x += (an[0] - n.x) * 0.2; n.y += (an[1] - n.y) * 0.2; n.vx = n.vy = 0;
          return;
        }
        n.vx += (L.gcx - n.x) * 0.002; n.vy += (L.gcy - n.y) * 0.003;
        n.vx *= 0.86; n.vy *= 0.86;
        n.x += n.vx * dt * 60; n.y += n.vy * dt * 60;
        var pad = Math.max(n.kind === 'paper' ? 40 : 20, (n.hw || 0) + 4);
        n.x = Math.max(L.gx0 + pad, Math.min(L.gx1 - pad, n.x));
        n.y = Math.max(26, Math.min(st.h - 26, n.y));
        n.pulse = Math.max(0, n.pulse - dt * 1.2);
      });
    }
    function step(dt) {
      T += dt;
      events();
      flights = flights.filter(function (f) { f.p += dt / 0.95; if (f.p >= 1) { land(f); return false; } return true; });
      physics(dt);
    }

    function drawPage(ctx, C, pi, local, fade) {
      var P = PAPERS[pi], x = L.px, y = L.py, w = L.pw, h = L.ph;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate((1 - fade) * -14, 0);
      // stacked sheets behind
      for (var s = 2; s >= 1; s--) {
        rr(ctx, x + s * 5, y + s * 5, w, h, 6);
        ctx.fillStyle = C.dark ? '#191c24' : '#ffffff';
        ctx.globalAlpha = fade * (0.5 - s * 0.12);
        ctx.fill();
      }
      ctx.globalAlpha = fade;
      ctx.shadowColor = C.dark ? 'rgba(0,0,0,.5)' : 'rgba(15,23,42,.14)';
      ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
      rr(ctx, x, y, w, h, 6);
      ctx.fillStyle = C.dark ? '#1d2029' : '#ffffff';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = rgba(C.muted, 0.25); ctx.lineWidth = 1; ctx.stroke();

      var fs = Math.max(8, w * 0.046);
      ctx.fillStyle = rgba(C.ink, 0.95);
      ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(P.title[0], x + w * 0.09, y + h * 0.1);
      ctx.fillText(P.title[1], x + w * 0.09, y + h * 0.1 + fs * 1.3);

      var sy = scanY(local);
      for (var i = 0; i < NLINES; i++) {
        var ly = lineY(i), lw = w * (i % 5 === 4 ? 0.5 : 0.82 - ((i * 37) % 11) / 100);
        var key = KEYLINES.indexOf(i);
        if (i === 5 || i === 10) {
          // an equation and a figure block
          if (i === 5) {
            ctx.fillStyle = rgba(C.muted, 0.12);
            rr(ctx, x + w * 0.25, ly - 3, w * 0.5, h * 0.035, 3); ctx.fill();
          } else {
            ctx.strokeStyle = rgba(C.muted, 0.3);
            rr(ctx, x + w * 0.09, ly - 4, w * 0.82, h * 0.04, 3); ctx.stroke();
          }
          continue;
        }
        var hit = key >= 0 && sy >= ly;
        if (hit) {
          ctx.fillStyle = rgba(key % 2 ? C.a2 : C.a, 0.22);
          ctx.fillRect(x + w * 0.07, ly - 3, lw + w * 0.04, 8);
        }
        ctx.fillStyle = hit ? rgba(key % 2 ? C.a2 : C.a, 0.95) : rgba(C.muted, 0.32);
        ctx.fillRect(x + w * 0.09, ly, lw, 2.2);
      }
      // scan beam
      if (local > 0.9 && local < 6.2) {
        var g = ctx.createLinearGradient(0, sy - 26, 0, sy + 2);
        g.addColorStop(0, rgba(C.a, 0)); g.addColorStop(1, rgba(C.a, C.dark ? 0.28 : 0.16));
        ctx.fillStyle = g;
        ctx.fillRect(x + 1, sy - 26, w - 2, 28);
        ctx.fillStyle = rgba(C.a, 0.8);
        ctx.fillRect(x + 1, sy, w - 2, 1.5);
      }
      ctx.restore();
    }

    function draw() {
      var ctx = st.ctx, C = st.C, w = st.w, h = st.h;
      ctx.clearRect(0, 0, w, h);
      var cyc = T % CYCLE, pi = Math.min(PAPERS.length - 1, Math.floor(cyc / PER)), local = cyc - pi * PER;
      var endFade = cyc > CYCLE - 0.6 ? (CYCLE - cyc) / 0.6 : 1;
      var fade = Math.min(1, local / 0.5) * (pi < PAPERS.length - 1 && local > PER - 0.45 ? (PER - local) / 0.45 : 1) * endFade;
      drawPage(ctx, C, pi, cyc >= PAPERS.length * PER ? PER : local, Math.max(0, fade));

      ctx.save();
      ctx.globalAlpha = endFade;
      // links
      links.forEach(function (l) {
        var k = Math.min(1, (T - l.born) / 0.5);
        ctx.strokeStyle = rgba(C.a, 0.35 * k);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(l.a.x, l.a.y); ctx.lineTo(l.a.x + (l.b.x - l.a.x) * k, l.a.y + (l.b.y - l.a.y) * k); ctx.stroke();
      });
      // flights from the page to the graph
      flights.forEach(function (f) {
        var to = byName['c:' + f.name] || byName[f.paper];
        if (!to) return;
        var e = ease(f.p), x0 = f.from[0], y0 = f.from[1], x1 = to.x, y1 = to.y;
        var mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 50;
        var x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * mx + e * e * x1;
        var y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * my + e * e * y1;
        ctx.strokeStyle = rgba(C.a, 0.25);
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fillStyle = rgba(C.a, 1); ctx.fill();
      });
      // nodes
      var fs = st.small ? 10 : 12;
      nodes.forEach(function (n) {
        var k = ease(Math.min(1, (T - n.born) / 0.45));
        if (n.kind === 'paper') {
          ctx.font = '650 ' + fs + 'px Inter, system-ui, sans-serif';
          var tw = ctx.measureText(n.label).width + 18, th = fs + 12;
          n.hw = tw / 2;
          ctx.save(); ctx.translate(n.x, n.y); ctx.scale(k, k);
          rr(ctx, -tw / 2, -th / 2, tw, th, 6);
          ctx.fillStyle = rgba(C.ink, 0.92); ctx.fill();
          ctx.fillStyle = rgba(C.bg, 1); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(n.label, 0, 0.5);
          ctx.restore();
        } else {
          var r = (4.5 + n.deg * 2.2) * k, col = n.deg > 1 ? C.a2 : C.a;
          if (n.pulse > 0) { ctx.beginPath(); ctx.arc(n.x, n.y, r + (1 - n.pulse) * 18, 0, TAU); ctx.strokeStyle = rgba(col, n.pulse * 0.6); ctx.lineWidth = 1.5; ctx.stroke(); }
          ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.2, 0, TAU); ctx.fillStyle = rgba(col, 0.12); ctx.fill();
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, TAU); ctx.fillStyle = rgba(col, 1); ctx.fill();
          ctx.font = '500 ' + fs + 'px Inter, system-ui, sans-serif';
          n.hw = ctx.measureText(n.label).width / 2;
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillStyle = rgba(C.ink2, 0.9 * k);
          ctx.fillText(n.label, n.x, n.y + r + 5);
        }
      });
      ctx.restore();
      // legend
      ctx.font = (st.small ? 9.5 : 10.5) + 'px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = rgba(C.muted, 1);
      if (!st.small) ctx.fillText('a concept grows with every paper that shares it', w - 14, h - 12);
    }

    return {
      resize: function () { layout(); nodes.forEach(function (n) { n.x = Math.max(L.gx0, Math.min(L.gx1, n.x)); }); },
      step: step,
      draw: draw,
      still: function () {
        // reduced motion: run the story silently up to the third paper's end
        if (T < PER * 3 - 0.6) { reset(); T = 0; done = {}; while (T < PER * 3 - 0.6) step(1 / 30); }
        draw();
      }
    };
  }

  // ------------------------------------------------------------ wire up scenes
  var makers = { infinity: infinity, constellation: constellation, pagegraph: pagegraph };
  Array.prototype.forEach.call(root.querySelectorAll('canvas[data-scene]'), function (cv) {
    var make = makers[cv.getAttribute('data-scene')];
    if (!make) return;
    var s;
    scene(cv, function (st) {
      if (cv.getAttribute('data-scene') !== 'pagegraph') track(cv.closest('.pm-hv'), st);
      return make(st);
    });
  });

  // ------------------------------------------------------------ switcher
  var sw = document.getElementById('pm-switch');
  var nameEl = sw && sw.querySelector('.pm-switch-name');

  function setHero(h, save) {
    if (HEROES.indexOf(h) < 0) h = 'a';
    root.setAttribute('data-hero', h);
    if (sw) {
      Array.prototype.forEach.call(sw.querySelectorAll('[data-set-hero]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-set-hero') === h ? 'true' : 'false');
      });
      var sec = root.querySelector('.pm-hv-' + h);
      if (nameEl && sec) nameEl.textContent = h.toUpperCase() + ' · ' + sec.getAttribute('data-name');
    }
    scenes.forEach(function (s) { s.setActive(s.hero === h); });
    if (save) { store('pm-hero', h); setParam('hero', h); }
  }
  function setTheme(t, save) {
    if (THEMES.indexOf(t) < 0) t = 'violet';
    root.setAttribute('data-pm-theme', t);
    if (sw) Array.prototype.forEach.call(sw.querySelectorAll('[data-set-theme]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-theme') === t ? 'true' : 'false');
    });
    scenes.forEach(function (s) { s.recolour(); });
    if (save) { store('pm-theme', t); setParam('theme', t); }
  }
  function setParam(k, v) {
    try {
      var u = new URL(location.href);
      u.searchParams.set(k, v);
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

  setHero(root.getAttribute('data-hero') || 'a', false);
  setTheme(root.getAttribute('data-pm-theme') || 'violet', false);

  // site light/dark toggle
  new MutationObserver(function () { scenes.forEach(function (s) { s.recolour(); }); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
