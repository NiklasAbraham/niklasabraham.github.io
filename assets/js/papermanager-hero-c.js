/* PaperManager hero C: silky objects of fine fibres and dust, drawn with plain
 * WebGL2 (no library, nothing loaded from elsewhere). Three shapes, picked by
 * data-shape on the container: "trefoil" (C1, a knot), "helix" (C2, a double
 * helix with base pairs) and "orb" (C3, silk orbits round an inner graph of
 * pearls and threads).
 *
 * Near the pointer the fibres and the dust burst outward and spring back
 * (a damped impulse response per burst, evaluated in the vertex shader, so the
 * CPU only uploads a handful of uniforms per frame). A click or tap bursts
 * harder. Pauses off screen and in hidden tabs, caps the pixel ratio at 2, uses
 * fewer fibres on small screens, draws a single still frame for visitors who
 * prefer reduced motion, and swaps in a still image when WebGL is missing.
 *
 * Usage: any element with [data-pm-hero-c] containing a <canvas> is set up on
 * load; or call PMHeroC.init(container, opts) yourself.
 *   opts.preserve  keep the drawing buffer (for capturing a still image)
 *   opts.time      start at this scene time (seconds)
 *   opts.noIntro   skip the "dust condenses into the shape" intro
 *   opts.shape     overrides data-shape; opts.alpha (or data-alpha) fades the object
 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var MAX_BURSTS = 16;

  // ------------------------------------------------------------ small helpers
  function rng(seed) { // mulberry32: the same knot on every visit
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(R) { var u = R() || 1e-9, v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
  function smooth(e0, e1, x) { x = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return x * x * (3 - 2 * x); }
  function parseColor(c) {
    c = (c || '').trim();
    if (c[0] === '#') {
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      var n = parseInt(c.slice(1, 7), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    var m = c.match(/[\d.]+/g);
    return m && m.length >= 3 ? [m[0] / 255, m[1] / 255, m[2] / 255] : [0.49, 0.23, 0.93];
  }

  // column-major 4x4 matrices
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
  function rotZ(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
  function translate(x, y, z) { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); }

  // ------------------------------------------------------------ guides
  // Every shape is a set of guides: curves with a moving frame, along which a
  // bundle of fibres runs as a ribbon (wide axis / thin axis, optional twist),
  // plus emitters that stream dust off the shape and an optional dust halo.
  function v3(x, y, z) { return [x, y, z]; }
  function norm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  // f(v) -> [x,y,z] for v in [0,1]; hint(p, v) -> a vector roughly along the thin axis
  function guide(f, n, closed, hint, reparam) {
    var raw = [], len = [0], i, m = reparam ? n * 4 : n;
    for (i = 0; i <= m; i++) {
      raw.push(f(closed ? i / m : i / m));
      if (i) len.push(len[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1], raw[i][2] - raw[i - 1][2]));
    }
    var total = len[m], P = new Float32Array(n * 3), j = 0, cnt = closed ? n : n;
    for (i = 0; i < cnt; i++) {
      var k, a, b;
      if (reparam) {
        var target = (closed ? i / n : i / (n - 1)) * total;
        while (j < m - 1 && len[j + 1] < target) j++;
        k = (target - len[j]) / (len[j + 1] - len[j] || 1);
        a = raw[j]; b = raw[j + 1];
      } else {
        var fv = closed ? i / n * m : i / (n - 1) * m, j0 = Math.min(m - 1, Math.floor(fv));
        k = fv - j0; a = raw[j0]; b = raw[j0 + 1];
      }
      for (var d = 0; d < 3; d++) P[i * 3 + d] = a[d] + (b[d] - a[d]) * k;
    }
    var T = new Float32Array(n * 3), N = new Float32Array(n * 3), B = new Float32Array(n * 3);
    for (i = 0; i < n; i++) {
      var ia = closed ? (i + 1) % n : Math.min(n - 1, i + 1), ib = closed ? (i - 1 + n) % n : Math.max(0, i - 1);
      var tt = norm([P[ia * 3] - P[ib * 3], P[ia * 3 + 1] - P[ib * 3 + 1], P[ia * 3 + 2] - P[ib * 3 + 2]]);
      var p = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
      var nn = norm(cross(hint(p, i / (closed ? n : n - 1)), tt));
      var bb = cross(tt, nn);
      T.set(tt, i * 3); N.set(nn, i * 3); B.set(bb, i * 3);
    }
    return {
      P: P, T: T, N: N, B: B, n: n, closed: closed, length: total,
      width: function () { return 0.1; }, thick: 0.03,
      twist: function () { return 0; }, fray: function () { return 0; }, out: null,
      len: function (R) { return [R(), 0.5 + R() * 0.5]; }, weight: 1, stray: 0.02, res: 160, spread: 0.35
    };
  }
  function sampleGuide(g, u, out) {
    var f, i0, i1, k;
    if (g.closed) { f = (u - Math.floor(u)) * g.n; i0 = Math.floor(f) % g.n; i1 = (i0 + 1) % g.n; k = f - Math.floor(f); }
    else { f = Math.max(0, Math.min(1, u)) * (g.n - 1); i0 = Math.min(g.n - 2, Math.floor(f)); i1 = i0 + 1; k = f - i0; }
    for (var d = 0; d < 3; d++) {
      out.p[d] = g.P[i0 * 3 + d] + (g.P[i1 * 3 + d] - g.P[i0 * 3 + d]) * k;
      out.t[d] = g.T[i0 * 3 + d] + (g.T[i1 * 3 + d] - g.T[i0 * 3 + d]) * k;
      out.n[d] = g.N[i0 * 3 + d] + (g.N[i1 * 3 + d] - g.N[i0 * 3 + d]) * k;
      out.b[d] = g.B[i0 * 3 + d] + (g.B[i1 * 3 + d] - g.B[i0 * 3 + d]) * k;
    }
  }
  function wrapDist(u, c) { var d = Math.abs(u - c) % 1; return Math.min(d, 1 - d); }
  function frame() { return { p: [0, 0, 0], t: [0, 0, 0], n: [0, 0, 0], b: [0, 0, 0] }; }
  function pickGuide(S, R) {
    var r = R() * S.wsum;
    for (var i = 0; i < S.guides.length; i++) { r -= S.guides[i].weight; if (r <= 0) return S.guides[i]; }
    return S.guides[S.guides.length - 1];
  }
  // a point on (or just off) the ribbon surface: rad 0..1 inside, >1 outside
  function onRibbon(g, u, rad, R, fr) {
    sampleGuide(g, u, fr);
    var th = g.twist(u), ct = Math.cos(th), st = Math.sin(th), W = g.width(u), fz = g.fray(u);
    var ang = R() * TAU, a = Math.cos(ang) * rad * W * (1 + fz * 1.6), b = Math.sin(ang) * rad * g.thick * (2.5 + fz * 10);
    var p = [];
    for (var d = 0; d < 3; d++) p.push(fr.p[d] + a * (ct * fr.n[d] + st * fr.b[d]) + b * (-st * fr.n[d] + ct * fr.b[d]));
    return p;
  }

  function buildFibres(S, R, count, resK) {
    var V = [], idx = [], fr = frame(), vert = 0;
    S.guides.forEach(function (g) {
      var nf = Math.round(count * g.weight / S.wsum);
      for (var f = 0; f < nf; f++) {
        var seed = R(), stray = R() < g.stray, ul = g.len(R), u0 = ul[0], len = ul[1];
        if (stray) len *= 0.4;
        var r = Math.sqrt(R()), ang = R() * TAU;
        var a0 = r * Math.cos(ang), b0 = r * Math.sin(ang);
        if (stray) { a0 *= 1.4; b0 = (R() < 0.5 ? -1 : 1) * (1.5 + R() * 3); }
        var f1 = 1 + R() * 3, p1 = R() * TAU, f2 = 3 + R() * 6, p2 = R() * TAU, amp = (0.08 + R() * 0.18) * (g.wavy || 1);
        var frayK = 0.2 + R() * 1.1, frayDir = gauss(R), frayLift = gauss(R);
        var n = Math.max(8, Math.ceil(len * g.res * resK)), sc = g.closed ? 1 : 1;
        for (var i = 0; i < n; i++) {
          var s = i / (n - 1), u = u0 + len * s;
          sampleGuide(g, u, fr);
          var th = g.twist(u), ct = Math.cos(th), st = Math.sin(th);
          var W = g.width(u), H = g.thick, fz = g.fray(u);
          var uu = u * sc;
          var a = a0 + amp * Math.sin(TAU * f1 * uu + p1) + 0.03 * Math.sin(TAU * f2 * uu + p2);
          var b = b0 + 0.5 * amp * Math.sin(TAU * f1 * uu + p2);
          var spread = 1 + fz * frayK * g.spread;
          var la = a * W * spread + fz * fz * frayDir * 0.05 * g.spread * 3, lb = b * H * (1 + fz * frayK * 2.5) + fz * fz * frayLift * 0.04 * g.spread * 3;
          var wx = ct * fr.n[0] + st * fr.b[0], wy = ct * fr.n[1] + st * fr.b[1], wz = ct * fr.n[2] + st * fr.b[2];
          var hx = -st * fr.n[0] + ct * fr.b[0], hy = -st * fr.n[1] + ct * fr.b[1], hz = -st * fr.n[2] + ct * fr.b[2];
          var ox = la * wx + lb * hx, oy = la * wy + lb * hy, oz = la * wz + lb * hz;
          if (g.out && fz > 0) {
            var o = g.out(u, fr.p), k = fz * fz * (0.02 + 0.1 * seed);
            ox += o[0] * k; oy += o[1] * k; oz += o[2] * k;
          }
          var ga = a / (W * 6), gb = b / H;
          var nx = ga * wx + gb * hx, ny = ga * wy + gb * hy, nz = ga * wz + gb * hz, nl = Math.hypot(nx, ny, nz) || 1;
          var ao = 0.55 + 0.45 * Math.min(1, Math.abs(b) * 1.2 + 0.2 * r);
          V.push(fr.p[0], fr.p[1], fr.p[2], ox, oy, oz, nx / nl, ny / nl, nz / nl, fr.t[0], fr.t[1], fr.t[2], seed, s, fz, stray ? -ao : ao);
          if (i) idx.push(vert - 1, vert);
          vert++;
        }
      }
    });
    return { V: new Float32Array(V), I: new Uint32Array(idx), count: idx.length };
  }

  function buildParticles(S, R, c) {
    var out = [], fr = frame(), i, q;
    function push(p, dir, seed, size, type, loose) { out.push(p[0], p[1], p[2], dir[0], dir[1], dir[2], seed, size, type, loose); }
    var esum = 0;
    S.emitters.forEach(function (e) { esum += e.w; });
    function cloud() {
      var r = R() * esum, e = S.emitters[0];
      for (var k = 0; k < S.emitters.length; k++) { r -= S.emitters[k].w; if (r <= 0) { e = S.emitters[k]; break; } }
      var rr = Math.min(e.len * 4, -Math.log(R() || 1e-6) * e.len), sig = e.sig0 + e.sigK * rr;
      var dir = norm([e.dir[0] + gauss(R) * e.jit, e.dir[1] + gauss(R) * e.jit, e.dir[2] + gauss(R) * e.jit]);
      var box = e.box || [0, 0, 0];
      return {
        p: [e.p[0] + dir[0] * rr + gauss(R) * (sig + box[0]), e.p[1] + dir[1] * rr + gauss(R) * (sig + box[1]), e.p[2] + dir[2] * rr + gauss(R) * (sig + box[2])],
        dir: dir, r: rr / (e.len * 2)
      };
    }
    function cling(rad, tipBias) {
      var g = pickGuide(S, R), u = S.clingU ? S.clingU(g, R, tipBias) : R();
      return onRibbon(g, u, rad, R, fr);
    }
    var nCloud = esum > 0 ? c.dust * (1 - S.cling) : 0, nCling = c.dust - nCloud;
    for (i = 0; i < c.dust; i++) {
      var size = Math.exp(gauss(R) * 0.5) * 0.005 * (S.dustSize || 1);
      if (i < nCling) {
        var tip = R() < 0.6;
        push(cling(tip ? 0.95 + Math.abs(gauss(R)) * 0.4 : 0.85 + R() * 0.2, tip), [0, 0, 0], R(), tip ? size : size * 0.7, 0, tip ? 0.35 : 0.6);
      } else {
        q = cloud();
        push(q.p, q.dir, R(), size * (1.1 - 0.4 * Math.min(1, q.r)), 0, 1);
      }
    }
    for (i = 0; i < c.spheres; i++) {
      var rad = Math.exp(gauss(R) * 0.45) * 0.015 * (S.sphereSize || 1);
      if (esum === 0 || R() < 0.55) push(cling(1.0 + R() * 0.6, R() < 0.6), [0, 0, 0], R(), rad, 1, 0.3);
      else { q = cloud(); push(q.p, q.dir, R(), rad * (1 - 0.45 * Math.min(1, q.r)), 1, 0.8); }
    }
    if (S.pearls) S.pearls.forEach(function (p) { push(p, [0, 0, 0], R(), p[3] || Math.exp(gauss(R) * 0.2) * 0.02 * (S.pearlSize || 1), 1, 0.5); });
    if (S.halo) {
      for (i = 0; i < c.halo; i++) { q = S.halo(R); push(q.p, q.dir, R(), Math.exp(gauss(R) * 0.5) * 0.005 * (q.big ? 3 : 1), q.big ? 1 : 0, 1); }
    }
    for (i = 0; i < c.latent; i++) { // hidden inside the ribbons; shows when a burst shatters the fibres
      push(onRibbon(pickGuide(S, R), R(), Math.sqrt(R()) * 0.9, R, fr), [0, 0, 0], R(), Math.exp(gauss(R) * 0.4) * 0.006, 2, 0.9);
    }
    return { V: new Float32Array(out), count: out.length / 10 };
  }

  // ------------------------------------------------------------ shapes
  // C1: a trefoil knot, three ideas tied into one; each lobe frays into dust.
  function trefoil() {
    var s = 0.43;
    var g = guide(function (v) {
      var t = v * TAU;
      return [s * (Math.sin(t) + 2 * Math.sin(2 * t)), s * (Math.cos(t) - 2 * Math.cos(2 * t)), s * -1.1 * Math.sin(3 * t)];
    }, 3072, true, function () { return [0, 0, 1]; }, true);
    // lobe tips: the three points furthest from the centre
    var tips = [];
    for (var i = 0; i < g.n; i++) {
      var r0 = Math.hypot(g.P[i * 3], g.P[i * 3 + 1]);
      var ra = Math.hypot(g.P[((i + 1) % g.n) * 3], g.P[((i + 1) % g.n) * 3 + 1]), rb = Math.hypot(g.P[((i - 1 + g.n) % g.n) * 3], g.P[((i - 1 + g.n) % g.n) * 3 + 1]);
      if (r0 >= ra && r0 > rb) tips.push(i / g.n);
    }
    function near(u) { var m = 0; tips.forEach(function (c) { m = Math.max(m, Math.exp(-Math.pow(wrapDist(u, c) / 0.05, 2))); }); return m; }
    g.width = function (u) { return 0.17 + 0.05 * near(u); };
    g.thick = 0.04;
    g.twist = function (u) { return TAU * 1.5 * u + 0.4; };
    g.fray = near;
    g.out = function (u, p) { return norm([p[0], p[1], 0]); };
    g.len = function (R) { return [R(), 0.35 + R() * 0.65]; };
    g.res = 230;
    var emitters = tips.map(function (u) {
      var fr = frame(); sampleGuide(g, u, fr);
      return { p: fr.p.slice(), dir: norm([fr.p[0], fr.p[1], 0.1]), jit: 0.12, len: 0.42, sig0: 0.025, sigK: 0.11, w: 1 };
    });
    return {
      guides: [g], emitters: emitters, cling: 0.3, radius: 1.45,
      clingU: function (gg, R, tip) { return tip ? tips[Math.floor(R() * 3)] + gauss(R) * 0.045 : R(); },
      view: function (t) { return [0.16 + 0.08 * Math.sin(t * 0.07), 0.32 * Math.sin(t * 0.09 + 0.6), 0.25 + t * 0.045]; },
      counts: { fibres: [2600, 1200], dust: [15000, 6000], spheres: [80, 40], latent: [9000, 3000], halo: [0, 0] },
      layout: { wide: [0.0, 0.27, 0.43], tall: [0, 0.52, 0.74] }
    };
  }

  // C2: a double helix: two silk ribbons wound round each other, base pairs strung
  // between them as thin threads with pearls; both ends fray into dust.
  function helix() {
    var guides = [], emitters = [], L1 = 1.0, L2 = 3.2, r = 0.4, w = TAU / 1.7; // short to the left (the text), long off the right edge
    function frayEnds(u) { return Math.max(smooth(0.1, 0, u), smooth(0.9, 1, u)); }
    [0, Math.PI].forEach(function (ph) {
      var g = guide(function (v) {
        var x = -L1 + (L1 + L2) * v;
        return [x, r * Math.cos(w * x + ph), r * Math.sin(w * x + ph)];
      }, 1600, false, function (p) { return norm([0, p[1], p[2]]); }, true);
      g.width = function (u) { return 0.11 * (1 - 0.3 * frayEnds(u)); };
      g.thick = 0.035;
      g.twist = function () { return 0; };
      g.fray = frayEnds;
      g.out = function (u, p) { return [Math.sign(p[0]), 0, 0]; };
      g.len = function (R) { var a = R() * 0.6 - 0.1; return [Math.max(0, a), 0.35 + R() * 0.75]; };
      g.res = 260; g.weight = 5; g.spread = 0.5;
      guides.push(g);
    });
    // base pairs: short straight bundles across the axis
    var rungs = [];
    for (var x = -L1 + 0.32; x < L2 - 0.3; x += 0.17) {
      (function (x) {
        var a = [x, r * Math.cos(w * x), r * Math.sin(w * x)], b = [x, -a[1], -a[2]];
        var g = guide(function (v) { return [a[0], a[1] + (b[1] - a[1]) * v, a[2] + (b[2] - a[2]) * v]; }, 24, false,
          function () { return [1, 0, 0]; }, false);
        g.width = function () { return 0.014; };
        g.thick = 0.014;
        g.len = function (R) { var s0 = R() * 0.1; return [s0, 1 - s0 - R() * 0.1]; };
        g.res = 24; g.weight = 0.06; g.stray = 0; g.wavy = 0.3;
        guides.push(g);
        rungs.push(a, b);
      })(x);
    }
    [-1, 1].forEach(function (sd) {
      // the left end only sheds a little dust, downwards, away from the text column
      emitters.push(sd > 0 ? { p: [L2 * 0.97, 0, 0], dir: [1, 0, 0], jit: 0.18, len: 0.45, sig0: 0.08, sigK: 0.14, w: 1, box: [0, r * 0.6, r * 0.6] }
        : { p: [-L1 * 0.97, 0, 0], dir: [-0.3, -1, 0.2], jit: 0.25, len: 0.18, sig0: 0.06, sigK: 0.1, w: 0.3, box: [0, r * 0.5, r * 0.5] });
    });
    return {
      guides: guides, emitters: emitters, cling: 0.34, radius: 1.6,
      clingU: function (g, R, tip) { return tip ? (R() < 0.5 ? R() * 0.14 : 1 - R() * 0.14) : R(); },
      pearls: rungs, // a pearl at each end of every base pair
      view: function (t) { return [0.25 + 0.04 * Math.sin(t * 0.07), -0.35 + 0.12 * Math.sin(t * 0.06), 0.42, t * 0.22]; },
      counts: { fibres: [3000, 1400], dust: [12000, 5000], spheres: [50, 26], latent: [8000, 3000], halo: [0, 0] },
      layout: { wide: [0.5, 0.0, 0.9], tall: [0.12, 0.5, 1.3] }
    };
  }

  // C3: a knowledge sphere: silk ribbons orbiting on great circles round an inner
  // graph of pearls (papers) joined by fine threads (links), in a halo of dust.
  function orb(R0) {
    var guides = [], pearls = [], i, j;
    var RIB = 9;
    for (i = 0; i < RIB; i++) {
      // well spread ring axes (golden spiral)
      var y = 1 - 2 * (i + 0.5) / RIB, rr = Math.sqrt(1 - y * y), ph = i * 2.39996;
      var A = [Math.cos(ph) * rr, y, Math.sin(ph) * rr];
      var e1 = norm(cross(A, Math.abs(A[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), e2 = cross(A, e1);
      var rad = 0.94 + 0.12 * (i % 3) / 2, wob = 0.03 * R0(), wk = 2 + Math.floor(R0() * 3);
      (function (A, e1, e2, rad) {
        var g = guide(function (v) {
          var t = v * TAU, q = rad * (1 + wob * Math.sin(wk * t));
          return [q * (Math.cos(t) * e1[0] + Math.sin(t) * e2[0]), q * (Math.cos(t) * e1[1] + Math.sin(t) * e2[1]), q * (Math.cos(t) * e1[2] + Math.sin(t) * e2[2])];
        }, 1200, true, function (p) { return norm(p); }, true);
        g.width = function (u) { return 0.075 + 0.025 * Math.sin(TAU * 2 * u + rad * 9); };
        g.thick = 0.03;
        g.twist = function (u) { return 0.5 * Math.sin(TAU * u * 2 + rad * 5); };
        g.len = function (R) { return [R(), 0.4 + R() * 0.6]; };
        g.res = 240; g.weight = 1;
        guides.push(g);
      })(A, e1, e2, rad);
    }
    // the inner graph: nodes and their two or three nearest links
    var nodes = [];
    for (i = 0; i < 30; i++) {
      var d = norm([gauss(R0), gauss(R0), gauss(R0)]), r = 0.25 + 0.55 * Math.sqrt(R0());
      nodes.push([d[0] * r, d[1] * r, d[2] * r]);
    }
    var seen = {};
    nodes.forEach(function (a, ia) {
      var near = nodes.map(function (b, ib) { return [Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), ib]; })
        .sort(function (x, y) { return x[0] - y[0]; }).slice(1, 2 + (ia % 2) + 1);
      near.forEach(function (n) {
        var key = Math.min(ia, n[1]) + '-' + Math.max(ia, n[1]);
        if (seen[key]) return;
        seen[key] = 1;
        var b = nodes[n[1]], bend = [gauss(R0) * 0.06, gauss(R0) * 0.06, gauss(R0) * 0.06];
        var g = guide(function (v) {
          var k = Math.sin(Math.PI * v);
          return [a[0] + (b[0] - a[0]) * v + bend[0] * k, a[1] + (b[1] - a[1]) * v + bend[1] * k, a[2] + (b[2] - a[2]) * v + bend[2] * k];
        }, 32, false, function () { return [0, 1, 0.3]; }, false);
        g.width = function () { return 0.008; };
        g.thick = 0.008;
        g.len = function (R) { var s0 = R() * 0.08; return [s0, 1 - s0 - R() * 0.08]; };
        g.res = 32; g.weight = 0.035; g.stray = 0; g.wavy = 0.4;
        guides.push(g);
      });
      pearls.push(a);
    });
    return {
      guides: guides, emitters: [], cling: 1, radius: 1.2, pearls: pearls, pearlSize: 1.5,
      halo: function (R) {
        var d = norm([gauss(R), gauss(R), gauss(R)]), big = R() < 0.01, rr = 1.1 + Math.abs(gauss(R)) * (big ? 0.15 : 0.3);
        return { p: [d[0] * rr, d[1] * rr, d[2] * rr], dir: d, big: big };
      },
      view: function (t) { return [0.3 + 0.06 * Math.sin(t * 0.05), t * 0.06, 0.12 * Math.sin(t * 0.04)]; },
      counts: { fibres: [3000, 1400], dust: [3000, 1200], spheres: [40, 20], latent: [7000, 2500], halo: [9000, 3500] },
      layout: { wide: [0.0, 0.02, 0.86], tall: [0, 0.33, 0.92] }
    };
  }

  // C4: a Möbius strip: one continuous surface (read, understand, connect, ask);
  // one stretch of it unravels into dust.
  function mobius() {
    var g = guide(function (v) {
      var t = v * TAU;
      return [Math.cos(t), 0.86 * Math.sin(t), 0.08 * Math.sin(2 * t)];
    }, 2400, true, function () { return [0, 0, 1]; }, true);
    function unravel(u) { return Math.exp(-Math.pow(wrapDist(u, 0.6) / 0.05, 2)); }
    g.width = function (u) { return 0.36 * (1 - 0.15 * unravel(u)); };
    g.thick = 0.016;
    g.twist = function (u) { return Math.PI * u + 0.2; }; // a single half-twist
    g.fray = function (u) { return 0.8 * unravel(u); };
    g.out = function (u, p) { return norm([p[0], p[1], 0]); };
    g.len = function (R) { return [R(), 0.55 + R() * 0.45]; };
    g.res = 170; g.wavy = 0.5; g.spread = 0.45;
    var fr = frame(); sampleGuide(g, 0.6, fr);
    return {
      guides: [g], cling: 0.4, radius: 1.3,
      emitters: [{ p: fr.p.slice(), dir: norm([fr.p[0], fr.p[1], 0.3]), jit: 0.3, len: 0.35, sig0: 0.06, sigK: 0.14, w: 1 }],
      clingU: function (gg, R, tip) { return tip ? 0.6 + gauss(R) * 0.05 : R(); },
      view: function (t) { return [0.5 + 0.05 * Math.sin(t * 0.07), 0.25 * Math.sin(t * 0.06), -0.9 + t * 0.05]; },
      counts: { fibres: [3200, 1500], dust: [9000, 3500], spheres: [45, 24], latent: [8000, 3000], halo: [0, 0] },
      layout: { wide: [-0.5, 0.02, 0.6], tall: [0, 0.5, 0.86] }
    };
  }

  // C5: a nautilus: a golden spiral of silk that keeps growing, its chambers walled
  // by fine threads, papers strung along it as pearls that grow with it.
  function nautilus() {
    var b = Math.log((1 + Math.sqrt(5)) / 2) / (Math.PI / 2), T0 = 0.6, T1 = 3.1 * Math.PI, a = 1.3 / Math.exp(b * T1);
    function sp(th) { var r = a * Math.exp(b * th); return [r * Math.cos(th), r * Math.sin(th), 0.28 * (1 - (th - T0) / (T1 - T0)) - 0.1]; }
    var g = guide(function (v) { return sp(T0 + (T1 - T0) * v); }, 2400, false, function () { return [0, 0, 1]; }, true);
    var rad = []; for (var i = 0; i < g.n; i++) rad.push(Math.hypot(g.P[i * 3], g.P[i * 3 + 1]));
    function rAt(u) { return rad[Math.max(0, Math.min(g.n - 1, Math.round(u * (g.n - 1))))]; }
    g.width = function (u) { return 0.012 + 0.19 * rAt(u) / 1.3; };
    g.thick = 0.03;
    g.twist = function () { return 0; };
    g.fray = function (u) { return smooth(0.9, 1, u); };
    g.len = function (R) { var u0 = Math.pow(R(), 1.6) * 0.5; return [u0, Math.min(1 - u0, 0.4 + R() * 0.6)]; };
    g.res = 240; g.weight = 6; g.wavy = 0.6;
    var guides = [g], pearls = [];
    // chamber walls: gently bowed threads from one whorl to the next
    for (var th = T1 - 0.25; th > 2 * Math.PI + T0; th -= 0.42) {
      (function (th) {
        var p = sp(th), q = sp(th - 2 * Math.PI), m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
        var bow = norm([Math.cos(th + 0.5), Math.sin(th + 0.5), 0]), k = Math.hypot(p[0] - q[0], p[1] - q[1]) * 0.22;
        var w = guide(function (v) { var s = Math.sin(Math.PI * v) * k; return [p[0] + (q[0] - p[0]) * v + bow[0] * s, p[1] + (q[1] - p[1]) * v + bow[1] * s, p[2] + (q[2] - p[2]) * v]; },
          40, false, function () { return [0, 0, 1]; }, false);
        w.width = function () { return 0.04 * Math.hypot(p[0], p[1]); };
        w.thick = 0.008; w.res = 40; w.weight = 0.22 * Math.hypot(p[0], p[1]); w.stray = 0; w.wavy = 0.3;
        w.len = function (R) { var s0 = R() * 0.05; return [s0, 1 - s0 - R() * 0.05]; };
        guides.push(w);
      })(th);
    }
    // pearls along the spiral, growing outward
    for (var t = T0 + 0.7; t < T1 - 0.1; t += 0.33) { var p = sp(t), r = Math.hypot(p[0], p[1]); pearls.push([p[0], p[1], p[2] + 0.05, 0.008 + 0.03 * r]); }
    var end = sp(T1), tang = norm([end[0] - sp(T1 - 0.05)[0], end[1] - sp(T1 - 0.05)[1], 0]);
    return {
      guides: guides, cling: 0.45, radius: 0.85, pearls: pearls,
      emitters: [{ p: end, dir: norm([-1, 0.45, 0.2]), jit: 0.25, len: 0.26, sig0: 0.04, sigK: 0.1, w: 1 }],
      clingU: function (gg, R, tip) { return tip ? 1 - Math.abs(gauss(R)) * 0.08 : Math.pow(R(), 0.6); },
      view: function (t) { return [0.38 + 0.05 * Math.sin(t * 0.06), 0.3 * Math.sin(t * 0.07), 0.3 - t * 0.035]; },
      counts: { fibres: [3000, 1400], dust: [9000, 3500], spheres: [40, 22], latent: [7000, 2500], halo: [0, 0] },
      layout: { wide: [0.06, 0.35, 0.36], tall: [0.2, 0.46, 0.74] }
    };
  }

  // C6: a citation tree: one trunk of silk branching into finer and finer strands,
  // each strand ending in a pearl (papers citing papers), the tips shedding dust.
  function tree(R0) {
    var guides = [], pearls = [], emitters = [];
    function rot(d, ay, az) { // turn a direction up/down (ay) and in/out (az)
      var c = Math.cos(ay), s = Math.sin(ay), x = d[0] * c - d[1] * s, y = d[0] * s + d[1] * c;
      c = Math.cos(az); s = Math.sin(az);
      return norm([x * c - d[2] * s, y, x * s + d[2] * c]);
    }
    function branch(p0, d0, len, w, level) {
      var d1 = rot(d0, gauss(R0) * 0.22, gauss(R0) * 0.18), bend = gauss(R0) * 0.18 * len;
      var c1 = [p0[0] + d0[0] * len * 0.5 - d0[1] * bend, p0[1] + d0[1] * len * 0.5 + d0[0] * bend, p0[2] + d0[2] * len * 0.5];
      var p1 = [p0[0] + d1[0] * len, p0[1] + d1[1] * len, p0[2] + d1[2] * len];
      var g = guide(function (v) {
        var a = (1 - v) * (1 - v), b = 2 * v * (1 - v), c = v * v;
        return [a * p0[0] + b * c1[0] + c * p1[0], a * p0[1] + b * c1[1] + c * p1[1], a * p0[2] + b * c1[2] + c * p1[2]];
      }, 160, false, function () { return [0, 0.2, 1]; }, true);
      var w0 = w, w1 = w * 0.72, leaf = level >= 4;
      g.width = function (u) { return w0 + (w1 - w0) * u; };
      g.thick = Math.max(0.006, w * 0.16);
      g.twist = function (u) { return 0.6 * u * (level % 2 ? 1 : -1); };
      g.fray = leaf ? function (u) { return smooth(0.75, 1, u) * 0.6; } : function () { return 0; };
      g.len = function (R) { var s0 = R() * 0.04; return [s0, 1 - s0 - R() * (leaf ? 0.25 : 0.02)]; };
      g.res = 60 + 80 * len; g.weight = Math.pow(w, 1.25) * len * 6; g.stray = 0.01; g.wavy = 0.5; g.leaf = leaf;
      guides.push(g);
      if (leaf) {
        pearls.push([p1[0], p1[1], p1[2], 0.024 + R0() * 0.016]);
        if (R0() < 0.4) emitters.push({ p: p1, dir: d1, jit: 0.4, len: 0.14, sig0: 0.02, sigK: 0.12, w: 0.2 });
        return;
      }
      var n = level === 0 ? 3 : (R0() < 0.4 ? 3 : 2), fan = 0.42 + 0.08 * level;
      for (var i = 0; i < n; i++) {
        var f = n === 1 ? 0 : i / (n - 1) - 0.5;
        var start = [p1[0] - d1[0] * len * 0.06, p1[1] - d1[1] * len * 0.06, p1[2] - d1[2] * len * 0.06];
        branch(start, rot(d1, f * fan * 2 + gauss(R0) * 0.1, gauss(R0) * 0.4), len * (0.78 + R0() * 0.12), w * 0.62, level + 1);
      }
    }
    branch([-3.4, -1.0, 0], norm([1, 0.2, 0]), 2.3, 0.13, 0);
    return {
      guides: guides, emitters: emitters, cling: 0.5, radius: 1.75, pearls: pearls,
      clingU: function (g, R, tip) { return tip && g.leaf ? 0.8 + R() * 0.2 : R(); },
      view: function (t) { return [0.1 + 0.04 * Math.sin(t * 0.07), -0.12 + 0.12 * Math.sin(t * 0.06), 0.02 * Math.sin(t * 0.05)]; },
      counts: { fibres: [3400, 1500], dust: [7000, 2800], spheres: [30, 16], latent: [7000, 2500], halo: [0, 0] },
      layout: { wide: [0.3, -0.18, 0.62], tall: [0.25, 0.5, 0.95] }
    };
  }

  var SHAPES = { trefoil: trefoil, helix: helix, orb: orb, mobius: mobius, nautilus: nautilus, tree: tree };
  function makeShape(name) {
    var S = (SHAPES[name] || trefoil)(rng(77));
    S.wsum = 0;
    S.guides.forEach(function (g) { S.wsum += g.weight; });
    return S;
  }

  // ------------------------------------------------------------ shaders
  var COMMON = [
    '#version 300 es',
    'precision highp float;',
    'uniform mat4 uProj, uView;',
    'uniform float uTime, uAspect, uIntro, uPx, uPtScale;',
    'uniform vec4 uBurst[' + MAX_BURSTS + '];',
    'uniform vec3 uHover;',
    'float h11(float x){ return fract(sin(x * 91.7 + 3.1) * 43758.5453); }',
    // damped spring response to an impulse: fast out, back with a small overshoot
    'float spring(float t){ return (1.0 - exp(-16.0 * t)) * exp(-3.0 * t) * cos(4.2 * t); }',
    // push a view-space point away from bursts near its screen position
    'vec3 explode(vec3 vp, float seed, float loose, float kick, out float energy){',
    '  vec4 c = uProj * vec4(vp, 1.0);',
    '  vec2 p = c.xy / c.w; p.x *= uAspect;',
    '  float k = c.w / uProj[1][1];', // world units per screen unit at this depth
    '  vec2 push = vec2(0.0); float pz = 0.0; energy = 0.0;',
    '  float r1 = h11(seed), r2 = h11(seed + 7.3), r3 = h11(seed + 2.9);',
    '  vec2 jit = (vec2(r2, r3) - 0.5) * 0.5;',
    '  float fly = 1.0 + loose * r2 * 2.2 * kick;',
    '  for (int i = 0; i < ' + MAX_BURSTS + '; i++) {',
    '    vec4 b = uBurst[i];',
    '    if (b.w <= 0.0) continue;',
    '    float t = uTime - b.z;',
    '    if (t < 0.0 || t > 2.2) continue;',
    '    vec2 d = p - b.xy;',
    '    float dist = length(d);',
    '    float Ro = (0.06 + 0.085 * b.w) * (1.0 + 0.6 * t);',
    '    if (dist > Ro * 3.2) continue;',
    '    vec2 dir2 = normalize((dist > 1e-3 ? d / dist : vec2(cos(r1 * 6.283), sin(r1 * 6.283))) + jit * kick);',
    // clear a hole round the pointer and throw what was in it past the rim
    '    float clear = (max(0.0, Ro - dist) + Ro * 0.6 * exp(-dist * dist / (Ro * Ro * 2.2))) * (0.6 + 0.8 * r3);',
    '    float g = max(spring(t) * 1.8, -0.2);',
    '    push += dir2 * clear * g * fly;',
    '    pz += (r1 - 0.5) * clear * g * fly * 1.2;',
    '    energy += abs(g) * exp(-dist * dist / (Ro * Ro * 1.3));',
    '  }',
    '  if (uHover.z > 0.001) {', // the pointer parts the fibres like a finger through hair
    '    vec2 dh = p - uHover.xy; float dd = length(dh), Rh = 0.075 * uHover.z;',
    '    vec2 dir2 = normalize((dd > 1e-3 ? dh / dd : vec2(1.0, 0.0)) + jit * 0.4);',
    '    push += dir2 * (max(0.0, Rh - dd) + Rh * 0.6 * exp(-dd * dd / (Rh * Rh * 2.5))) * (1.0 + loose * r2);',
    '    energy += uHover.z * 0.7 * exp(-dd * dd / (Rh * Rh * 1.2));',
    '  }',
    '  float pl = length(push);',
    '  push *= 1.0 / (1.0 + pl / 0.55);',
    '  vec3 disp = vec3(push * k, pz * k * 0.5);',
    // intro: everything starts scattered and condenses
    '  if (uIntro > 0.0) {',
    '    vec3 rd = normalize(vec3(r1 - 0.5, r2 - 0.5, r3 - 0.5) + 1e-3);',
    '    disp += rd * uIntro * uIntro * (0.5 + 1.6 * r2) + vec3(0.0, -0.25, 0.0) * uIntro * r1;',
    '    energy += uIntro;',
    '  }',
    '  return disp;',
    '}'
  ].join('\n');

  var FIBRE_VS = COMMON + '\n' + [
    'layout(location=0) in vec3 aCenter;',
    'layout(location=1) in vec3 aOffset;',
    'layout(location=2) in vec3 aNormal;',
    'layout(location=3) in vec3 aTangent;',
    'layout(location=4) in vec4 aData;', // seed, s along fibre, fray, ao (negative = stray)
    'out vec3 vN; out vec3 vT; out vec3 vV; out float vAlpha; out float vAo; out float vE; out float vFray; out float vTone; out float vS; out float vG;',
    'void main(){',
    '  float seed = aData.x, s = aData.y, fz = aData.z, ao = abs(aData.w);',
    '  float breath = 1.0 + 0.07 * sin(uTime * 0.55 + aCenter.x * 2.2 + seed * 2.0) + 0.05 * sin(uTime * 0.9 + s * 9.0 + seed * 30.0) * fz;',
    '  vec3 wp = aCenter + aOffset * breath;',
    '  vec3 vp = (uView * vec4(wp, 1.0)).xyz;',
    '  float e; vp += explode(vp, seed * 101.0, 0.15 + fz, 0.6, e);',
    // fibres splay a little along their length while bursting
    '  vp += (uView * vec4(aNormal, 0.0)).xyz * sin(s * 31.0 + seed * 40.0) * min(e, 1.5) * 0.015;',
    '  gl_Position = uProj * vec4(vp, 1.0);',
    '  vN = (uView * vec4(aNormal, 0.0)).xyz;',
    '  vT = (uView * vec4(aTangent, 0.0)).xyz;',
    '  vV = -vp;',
    '  float taper = smoothstep(0.0, 0.14, s) * smoothstep(1.0, 0.86, s);',
    '  vAlpha = taper * (1.0 - 0.72 * fz) * (aData.w < 0.0 ? 0.45 : 1.0) * (1.0 - smoothstep(0.3, 0.85, e));',
    '  vAo = ao; vE = e; vFray = fz; vTone = 0.72 + 0.4 * h11(seed * 53.0); vS = s; vG = dot(wp, vec3(0.32, 0.22, 0.12)) + 0.5;',
    '}'
  ].join('\n');

  var SHADE = [
    'uniform vec3 uLo, uMid, uHi, uAcc, uAcc2, uDust; uniform float uDark, uAlpha, uMode, uSpec;',
    // violet -> teal -> gold, cycling (iridescent and aurora materials)
    'uniform vec3 uPa, uPb, uPc;',
    'vec3 pal3(float k){ k = fract(k) * 3.0;',
    '  return k < 1.0 ? mix(uPa, uPb, k) : k < 2.0 ? mix(uPb, uPc, k - 1.0) : mix(uPc, uPa, k - 2.0); }',
    'bool glowy(){ return (uMode > 1.5 && uMode < 2.5) || uMode > 3.5; }',
    'const vec3 L1 = vec3(-0.45, 0.72, 0.53);',
    'const vec3 L2 = vec3(0.7, -0.15, 0.7);'
  ].join('\n');

  var FIBRE_FS = [
    '#version 300 es',
    'precision highp float;',
    SHADE,
    'in vec3 vN; in vec3 vT; in vec3 vV; in float vAlpha; in float vAo; in float vE; in float vFray; in float vTone; in float vS; in float vG;',
    'out vec4 o;',
    'void main(){',
    '  vec3 N = normalize(vN), T = normalize(vT), V = normalize(vV);',
    '  if (dot(N, V) < 0.0) N = -N;', // the face we see
    '  vec3 L = normalize(L1), H = normalize(L + V);',
    '  float wrap = clamp(dot(N, L) * 0.7 + 0.3, 0.0, 1.0);',
    '  float fill = clamp(dot(N, normalize(L2)), 0.0, 1.0) * 0.25;',
    '  float th = dot(T, H);',
    '  float kk = sqrt(max(0.0, 1.0 - th * th));',
    '  float spec = pow(kk, 90.0) * 0.85 + pow(kk, 14.0) * 0.18;',
    '  float d = pow(wrap, 1.5) * vAo * vTone + fill;',
    '  vec3 c = mix(uLo, uMid, smoothstep(0.0, 0.85, d));',
    '  c = mix(c, uHi, smoothstep(0.55, 1.1, d) * 0.7);',
    '  c += uHi * spec * uSpec * (0.55 + 0.45 * wrap) * vAo;',
    // materials: 1 iridescent sheen, 2 glow from within, 3 aurora gradient along the fibres
    '  if (uMode > 0.5 && uMode < 1.5) { vec3 ir = pal3(dot(N, V) * 0.9 + vG * 0.8 + vS * 0.35); c = mix(c, c * (0.45 + 0.9 * ir) + ir * 0.12, 0.85) + ir * spec * 0.35; }',
    '  if (uMode > 1.5 && uMode < 2.5) { c = uMid * (0.2 + 0.7 * d) + uHi * spec * 1.1 + uAcc * 0.08; }',
    '  if (uMode > 3.5) { vec3 ir = pal3(dot(N, V) * 0.7 + vG * 0.9 + vS * 0.3); c = ir * (0.18 + 0.8 * d) + uHi * spec * 1.0; }',
    '  if (uMode > 2.5 && uMode < 3.5) { float f = clamp(vS * 0.55 + vG * 0.6 - 0.05, 0.0, 1.0); vec3 gr = f < 0.55 ? mix(uAcc, uAcc2, f / 0.55) : mix(uAcc2, uPc, (f - 0.55) / 0.45);',
    '    c = mix(c, gr * (0.3 + 0.85 * d) + uHi * spec * 0.45, 0.82); }',
    '  c = mix(c, mix(uLo, uAcc, 0.5), 0.07 * (1.0 - d));', // accent in the shadows
        // depth: far strands lighter and fainter
    '  c = min(c, uHi * 0.985);',
    '  float far = smoothstep(-0.6, 0.9, length(vV) - uFarRef);',
    '  float a = vAlpha * uAlpha * (0.85 - 0.25 * far);',
    '  if (glowy()) c *= 0.5;',
    '  o = vec4(c * a, glowy() ? a * 0.3 : a);',
    '}'
  ].join('\n').replace('uniform vec3 uLo', 'uniform float uFarRef; uniform vec3 uLo');

  var POINT_VS = COMMON + '\n' + [
    'layout(location=0) in vec3 aPos;',
    'layout(location=1) in vec3 aDir;',
    'layout(location=2) in vec4 aData;', // seed, radius, type, loose
    'out float vType; out float vSeed; out float vAlpha; out float vE; out float vSize;',
    'void main(){',
    '  float seed = aData.x, rad = aData.y, type = aData.z, loose = aData.w;',
    '  vec3 wp = aPos;',
    // dust streams slowly outward off the tips and fades in and out on a loop
    '  float ph = fract(uTime * (0.025 + 0.03 * seed) + seed * 13.0);',
    '  float life = loose > 0.9 ? sin(3.14159 * ph) : 1.0;',
    '  wp += aDir * (ph - 0.5) * 0.22 * step(0.9, loose);',
    '  wp += vec3(sin(uTime * 0.4 + seed * 50.0), cos(uTime * 0.33 + seed * 70.0), sin(uTime * 0.27 + seed * 90.0)) * 0.012;',
    '  vec3 vp = (uView * vec4(wp, 1.0)).xyz;',
    '  float e; vp += explode(vp, seed * 977.0, loose * 1.6 + 0.4, 1.35, e);',
    '  gl_Position = uProj * vec4(vp, 1.0);',
    '  float px = rad * 2.0 * (type > 0.5 && type < 1.5 ? 1.0 : uPtScale) * uProj[1][1] * uPx / gl_Position.w;',
    '  gl_PointSize = clamp(px, 1.0, 96.0);',
    '  vSize = px;',
    '  vAlpha = life * (px < 1.0 ? px * px : 1.0) * (type > 0.5 ? 1.0 : 0.85);',
    '  if (type > 1.5) vAlpha *= smoothstep(0.12, 0.6, e);',
    '  vType = type; vSeed = seed; vE = e;',
    '}'
  ].join('\n');

  var POINT_FS = [
    '#version 300 es',
    'precision highp float;',
    SHADE,
    'in float vType; in float vSeed; in float vAlpha; in float vE; in float vSize;',
    'out vec4 o;',
    'void main(){',
    '  vec2 q = gl_PointCoord * 2.0 - 1.0; q.y = -q.y;',
    '  float r2 = dot(q, q);',
    '  float edge = 1.0 - smoothstep(1.0 - 2.4 / max(vSize, 1.0), 1.0, sqrt(r2));',
    '  if (edge <= 0.0) discard;',
    '  vec3 N = vec3(q, sqrt(max(0.0, 1.0 - r2)));',
    '  vec3 L = normalize(L1), V = vec3(0.0, 0.0, 1.0), H = normalize(L + V);',
    '  float diff = clamp(dot(N, L) * 0.6 + 0.4, 0.0, 1.0);',
    '  float spec = pow(max(dot(N, H), 0.0), 36.0);',
    '  float rim = pow(1.0 - N.z, 3.0);',
    // palette: pearl, sand, taupe, graphite
    '  float k = fract(vSeed * 7.13);',
    '  if (vType > 0.5 && vType < 1.5) k *= 0.8;',
    '  vec3 sand = uDust;',
    '  vec3 base = k < 0.28 ? mix(uMid, uHi, 0.75) : k < 0.6 ? mix(uMid, sand, 0.7) : k < 0.86 ? mix(uLo, sand, 0.5) : mix(uLo, uMid, 0.15);',
    '  base = mix(base, uAcc, 0.1 * step(0.95, fract(vSeed * 3.7)));',
    '  vec3 c = base * (0.35 + 0.75 * diff) + uHi * spec * (vType > 0.5 && vType < 1.5 ? 0.9 : 0.35) + uHi * rim * 0.12;',
    '  if (vSize < 3.0) c = base * (0.55 + 0.45 * diff);',
    '  if (uMode > 0.5 && uMode < 1.5) c = mix(c, c * (0.5 + 0.8 * pal3(vSeed * 3.1 + N.x * 0.4)), 0.7);',
    '  if (uMode > 2.5 && uMode < 3.5) c = mix(c, pal3(vSeed * 0.66) * (0.5 + 0.6 * diff), 0.55);',
    '  if (uMode > 3.5) c = mix(pal3(vSeed * 0.9), uHi, spec * 0.8 + (vType > 0.5 && vType < 1.5 ? 0.25 : 0.1)) * (0.6 + 0.6 * diff);',
    '  if (uMode > 1.5 && uMode < 2.5) c = mix(uDust, uHi, spec + (vType > 0.5 && vType < 1.5 ? 0.3 : 0.0)) * (0.55 + 0.6 * diff);',
    '  float a = vAlpha * edge * uAlpha;',
    '  o = vec4(c * a, glowy() ? a * 0.4 : a);',
    '}'
  ].join('\n');

  function compile(gl, vs, fs) {
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src);
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var info = gl.getActiveUniform(p, i), name = info.name.replace(/\[0\]$/, '');
      u[name] = gl.getUniformLocation(p, info.name);
    }
    return { p: p, u: u };
  }

  // ------------------------------------------------------------ materials
  // Every material keeps its character but takes its hues from the page accent, so the colour
  // presets and the free picker recolour fibres, dust and pearls live (the ground follows in CSS).
  // -> { lo, mid, hi (fibre shade ramp), dust, mode (0 plain, 1 iridescent, 2 glow, 3 aurora,
  //      4 glowing iridescence), spec, pal (three hues for the sheen) }
  function rgb2hsl(c) {
    var r = c[0], g = c[1], b = c[2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return [h, s, l];
  }
  function hsl(h, s, l) {
    h = ((h % 360) + 360) % 360;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return [f(0), f(8), f(4)];
  }
  function mixc(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  var MAT_NAMES_ALL = ['silver', 'champagne', 'ink', 'iridescent', 'glow', 'aurora', 'ice', 'night'];
  function material(name, dark, acc, acc2) {
    var q = rgb2hsl(acc), h = q[0], S = Math.max(0.35, Math.min(0.9, q[1]));
    function C(dh, s, l) { return hsl(h + dh, s, l); }
    var m = { mode: 0, spec: 1, pal: [C(-70, 0.75, 0.66), C(0, 0.85, 0.62), C(70, 0.8, 0.62)] };
    switch (name) {
      case 'champagne': // metallic, in the accent hue (gold when the accent is amber)
        m.lo = C(0, 0.55, dark ? 0.08 : 0.12); m.mid = C(0, 0.55, dark ? 0.42 : 0.48); m.hi = C(6, 0.7, dark ? 0.86 : 0.9); m.dust = C(0, 0.5, 0.6);
        break;
      case 'ink': // near-black, accent-tinted highlights
        m.lo = C(0, 0.2, 0.035); m.mid = C(0, 0.15, 0.12); m.hi = C(0, 0.55, 0.55); m.dust = C(0, 0.12, 0.2); m.spec = 0.5;
        break;
      case 'iridescent': // a sheen that moves round the accent hue
        m.lo = mixc(dark ? [0.14, 0.14, 0.18] : [0.3, 0.3, 0.36], C(0, 0.3, 0.3), 0.25); m.mid = mixc(dark ? [0.6, 0.6, 0.68] : [0.74, 0.74, 0.8], C(0, 0.4, 0.75), 0.25);
        m.hi = [1, 1, 1]; m.dust = C(0, 0.35, 0.8); m.mode = 1;
        break;
      case 'glow': // lit from within, accent on a night ground
        m.lo = mixc(acc, [0, 0, 0], 0.7); m.mid = mixc(acc, [0.9, 0.9, 0.95], 0.15); m.hi = C(0, 0.6, 0.97); m.dust = mixc(acc, [0.9, 0.9, 0.95], 0.4); m.mode = 2;
        break;
      case 'aurora': // accent -> accent 2 -> a third hue along each fibre
        m.lo = dark ? [0.12, 0.12, 0.16] : [0.2, 0.2, 0.26]; m.mid = dark ? [0.56, 0.56, 0.64] : [0.66, 0.66, 0.72]; m.hi = [1, 1, 1];
        m.dust = C(0, 0.3, 0.75); m.mode = 3; m.pal = [acc, acc2, C(80, 0.85, 0.62)];
        break;
      case 'ice': // cool iridescence round the accent, on a pale ground
        m.lo = C(0, 0.25, dark ? 0.12 : 0.25); m.mid = C(0, 0.3, dark ? 0.58 : 0.76); m.hi = [1, 1, 1]; m.dust = C(0, 0.5, 0.75); m.mode = 1;
        m.pal = [C(-45, 0.85, 0.74), C(0, 0.8, 0.68), C(55, 0.75, 0.62)];
        break;
      case 'night': // the same sheen glowing on deep night
        m.lo = C(0, 0.4, 0.08); m.mid = C(0, 0.6, 0.7); m.hi = C(0, 0.3, 0.97); m.dust = C(0, 0.8, 0.78); m.mode = 4;
        m.pal = [C(-45, 0.9, 0.72), C(0, 0.85, 0.7), C(55, 0.8, 0.64)];
        break;
      default: { // silver: neutral, with a faint accent tint
        var t = 0.12;
        m.lo = mixc(dark ? [0.16, 0.15, 0.14] : [0.22, 0.19, 0.155], C(0, S, dark ? 0.15 : 0.2), t);
        m.mid = mixc(dark ? [0.55, 0.52, 0.48] : [0.64, 0.585, 0.51], C(0, S, 0.55), t);
        m.hi = dark ? [0.97, 0.95, 0.91] : [1.0, 0.98, 0.94];
        m.dust = mixc([0.78, 0.69, 0.55], C(0, S, 0.6), 0.2);
      }
    }
    return m;
  }

  // ------------------------------------------------------------ init
  function init(container, opts) {
    opts = opts || {};
    if (container.__pmHeroC) return container.__pmHeroC;
    var canvas = container.querySelector('canvas');
    if (!canvas) return null;
    var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

    function fallback() {
      container.classList.add('is-still');
      var img = container.querySelector('img[data-src]');
      if (img && !img.getAttribute('src')) img.setAttribute('src', img.getAttribute('data-src'));
    }

    var gl = null;
    try {
      gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: !!opts.preserve, powerPreference: 'high-performance' });
    } catch (e) { gl = null; }
    if (!gl) { fallback(); return null; }

    var progF, progP;
    try {
      progF = compile(gl, FIBRE_VS, FIBRE_FS);
      progP = compile(gl, POINT_VS, POINT_FS);
    } catch (e) {
      if (window.console) console.warn('PMHeroC:', e.message);
      fallback();
      return null;
    }

    var small = Math.min(window.innerWidth, screen.width || 9999) < 700;
    var S = makeShape(opts.shape || container.getAttribute('data-shape')), R = rng(20251021), Q = small ? 1 : 0;
    var fib = buildFibres(S, R, S.counts.fibres[Q], small ? 0.7 : 1);
    var pts = buildParticles(S, R, { dust: S.counts.dust[Q], spheres: S.counts.spheres[Q], latent: S.counts.latent[Q], halo: S.counts.halo[Q] });
    var alpha = +(opts.alpha || container.getAttribute('data-alpha') || 1);
    var layout = S.layout, lo = opts.layout || container.getAttribute('data-layout');
    if (lo) { lo = lo.split(';').map(function (x) { return x.split(',').map(Number); }); layout = { wide: lo[0], tall: lo[1] || S.layout.tall }; }

    // fibre buffers
    var vaoF = gl.createVertexArray();
    gl.bindVertexArray(vaoF);
    var bF = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bF);
    gl.bufferData(gl.ARRAY_BUFFER, fib.V, gl.STATIC_DRAW);
    [[0, 3, 0], [1, 3, 3], [2, 3, 6], [3, 3, 9], [4, 4, 12]].forEach(function (a) {
      gl.enableVertexAttribArray(a[0]);
      gl.vertexAttribPointer(a[0], a[1], gl.FLOAT, false, 64, a[2] * 4);
    });
    var iF = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iF);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, fib.I, gl.STATIC_DRAW);
    // particle buffers
    var vaoP = gl.createVertexArray();
    gl.bindVertexArray(vaoP);
    var bP = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bP);
    gl.bufferData(gl.ARRAY_BUFFER, pts.V, gl.STATIC_DRAW);
    [[0, 3, 0], [1, 3, 3], [2, 4, 6]].forEach(function (a) {
      gl.enableVertexAttribArray(a[0]);
      gl.vertexAttribPointer(a[0], a[1], gl.FLOAT, false, 40, a[2] * 4);
    });
    gl.bindVertexArray(null);
    fib.V = null; pts.V = null; // let the CPU copies go

    // ---------------------------------------------------------- state
    var W = 0, H = 0, dpr = 1, proj, aspect = 1, dist = 7, offX = 0, offY = 0;
    var t = opts.time || 0, raf = 0, last = 0, visible = false, alive = true;
    var intro = opts.noIntro ? 0 : 1;
    var bursts = new Float32Array(MAX_BURSTS * 4), bi = 0;
    var hover = { x: 0, y: 0, amt: 0, target: 0 }, lastEmit = { x: 9, y: 9, t: -9 };
    var col = {};
    var frames = 0, fpsT = 0;
    // adaptive quality: slow machines draw a random subset of the fibres at a lower pixel ratio
    var lod = 0, LODS = [[1, 2], [0.6, 1.5], [0.38, 1]], slow = 0, lodAt = 0, ran = 0;
    var api = { fps: 0 };

    function colours() {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      var src = container.closest('.pm') || container, cs = getComputedStyle(src);
      var acc = parseColor(cs.getPropertyValue('--pm-accent') || '#7c3aed');
      var acc2 = parseColor(cs.getPropertyValue('--pm-accent-2') || '#2563eb');
      var name = (src.getAttribute && src.getAttribute('data-cx-mat')) || container.getAttribute('data-mat') || 'silver';
      col = material(MAT_NAMES_ALL.indexOf(name) >= 0 ? name : 'silver', dark, acc, acc2);
      col.acc = acc; col.acc2 = acc2; col.dark = dark ? 1 : 0;
    }
    colours();

    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      dpr = Math.min(window.devicePixelRatio || 1, LODS[lod][1]);
      W = r.width; H = r.height; aspect = W / H;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      var fov = 26 * Math.PI / 180, tn = Math.tan(fov / 2);
      // place the object: layout = [x, y, size] in screen units; size is its radius as a
      // share of the half-height (landscape) or the half-width (portrait)
      var L = aspect >= 1 ? layout.wide : layout.tall;
      dist = S.radius / (L[2] * tn * (aspect >= 1 ? 1 : aspect));
      offX = L[0] * tn * dist * aspect; offY = L[1] * tn * dist;
      proj = perspective(fov, aspect, 0.1, 40);
      return true;
    }

    function view(time) {
      var r = S.view(time);
      var M = mul(translate(offX, offY, -dist), mul(rotX(r[0]), mul(rotY(r[1]), rotZ(r[2]))));
      if (r[3]) M = mul(M, rotX(r[3]));
      return S.pre ? mul(M, S.pre) : M;
    }

    function draw() {
      if (!W && !resize()) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.BLEND);
      var glow = col.mode === 2 || col.mode === 4; // additive light on a dark ground: no occlusion
      if (glow) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      if (glow) gl.disable(gl.DEPTH_TEST); else gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      var V = view(t);
      var easedIntro = intro > 0 ? intro * intro * (3 - 2 * intro) : 0;
      function common(P) {
        gl.useProgram(P.p);
        gl.uniformMatrix4fv(P.u.uProj, false, proj);
        gl.uniformMatrix4fv(P.u.uView, false, V);
        gl.uniform1f(P.u.uTime, t);
        gl.uniform1f(P.u.uAspect, aspect);
        gl.uniform1f(P.u.uIntro, easedIntro);
        gl.uniform1f(P.u.uPx, H * dpr * 0.5);
        if (P.u.uPtScale) gl.uniform1f(P.u.uPtScale, W < 560 ? 1.55 : 1);
        gl.uniform4fv(P.u.uBurst, bursts);
        gl.uniform3f(P.u.uHover, hover.x, hover.y, hover.amt);
        gl.uniform3fv(P.u.uLo, col.lo);
        gl.uniform3fv(P.u.uMid, col.mid);
        gl.uniform3fv(P.u.uHi, col.hi);
        gl.uniform3fv(P.u.uAcc, col.acc);
        if (P.u.uAcc2) gl.uniform3fv(P.u.uAcc2, col.acc2);
        if (P.u.uDust) gl.uniform3fv(P.u.uDust, col.dust);
        if (P.u.uMode) gl.uniform1f(P.u.uMode, col.mode);
        if (P.u.uSpec) gl.uniform1f(P.u.uSpec, col.spec);
        if (P.u.uPa) { gl.uniform3fv(P.u.uPa, col.pal[0]); gl.uniform3fv(P.u.uPb, col.pal[1]); gl.uniform3fv(P.u.uPc, col.pal[2]); }
        if (P.u.uDark) gl.uniform1f(P.u.uDark, col.dark);
        if (P.u.uAlpha) gl.uniform1f(P.u.uAlpha, alpha);
        if (P.u.uFarRef) gl.uniform1f(P.u.uFarRef, dist);
      }
      // fibres
      common(progF);
      gl.depthMask(true);
      gl.bindVertexArray(vaoF);
      gl.drawElements(gl.LINES, Math.floor(fib.count * LODS[lod][0] / 2) * 2, gl.UNSIGNED_INT, 0);
      // dust and spheres
      common(progP);
      gl.depthMask(false);
      gl.bindVertexArray(vaoP);
      gl.drawArrays(gl.POINTS, 0, pts.count);
      gl.depthMask(true);
      gl.bindVertexArray(null);
    }

    function frame(now) {
      raf = 0;
      if (!alive) return;
      var real = (now - last) / 1000, dt = Math.min(0.05, Math.max(0, real));
      last = now;
      // after a short warm-up, step the quality down while frames stay slow
      if (++ran > 20 && real < 0.5) {
        slow = slow * 0.95 + (real > 0.024 ? 1 : 0) * 0.05;
        if (slow > 0.6 && lod < LODS.length - 1 && t - lodAt > 2) { lod++; lodAt = t; slow = 0; resize(); }
      }
      t += dt;
      if (intro > 0) intro = Math.max(0, intro - dt / 2.4);
      hover.amt += (hover.target - hover.amt) * Math.min(1, dt * 6);
      draw();
      frames++;
      if (!fpsT) fpsT = now;
      if (now - fpsT >= 1000) { api.fps = Math.round(frames / (now - fpsT) * 10000) / 10; frames = 0; fpsT = now; }
      raf = requestAnimationFrame(frame);
    }

    function running() { return visible && !document.hidden && !reduce.matches && alive; }
    function update() {
      if (running()) {
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      } else {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        if (reduce.matches && visible) { intro = 0; if (!t) t = 14; draw(); }
      }
    }

    // ---------------------------------------------------------- pointer
    function ndc(e) {
      var r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width * 2 - 1) * (r.width / r.height), y: 1 - (e.clientY - r.top) / r.height * 2, inside: e.clientY >= r.top && e.clientY <= r.bottom };
    }
    function burst(x, y, strength) {
      bursts[bi * 4] = x; bursts[bi * 4 + 1] = y; bursts[bi * 4 + 2] = t; bursts[bi * 4 + 3] = strength;
      bi = (bi + 1) % MAX_BURSTS;
      lastEmit = { x: x, y: y, t: t };
    }
    function onMove(e) {
      if (reduce.matches) return;
      var p = ndc(e);
      if (!p.inside) { hover.target = 0; return; }
      hover.x = p.x; hover.y = p.y; hover.target = 1;
      var moved = Math.hypot(p.x - lastEmit.x, p.y - lastEmit.y), dtE = t - lastEmit.t;
      if (dtE > 0.09 && (moved > 0.07 || dtE > 0.6)) burst(p.x, p.y, Math.min(1.1, 0.45 + moved * 2.0));
    }
    function onDown(e) {
      if (reduce.matches) return;
      var p = ndc(e);
      if (!p.inside) return;
      hover.x = p.x; hover.y = p.y;
      burst(p.x, p.y, e.pointerType === 'touch' ? 2.6 : 2.4);
    }
    container.addEventListener('pointermove', onMove, { passive: true });
    container.addEventListener('pointerdown', onDown, { passive: true });
    container.addEventListener('pointerleave', function () { hover.target = 0; }, { passive: true });
    container.addEventListener('pointercancel', function () { hover.target = 0; }, { passive: true });

    // ---------------------------------------------------------- lifecycle
    if (window.ResizeObserver) new ResizeObserver(function () { if (resize() && !raf) update(); }).observe(canvas);
    else window.addEventListener('resize', function () { resize(); });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { visible = es[es.length - 1].isIntersecting; update(); }, { rootMargin: '80px' }).observe(canvas);
    } else visible = true;
    document.addEventListener('visibilitychange', update);
    if (reduce.addEventListener) reduce.addEventListener('change', update);
    var recolour = function () { colours(); if (!raf && visible) draw(); };
    new MutationObserver(recolour).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    var pm = container.closest('.pm');
    if (pm) new MutationObserver(recolour).observe(pm, { attributes: true, attributeFilter: ['data-pm-theme', 'data-cx-mat'] });
    document.addEventListener('pm:accent', recolour);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); alive = false; fallback(); });

    resize();
    update();
    container.classList.add('is-live');

    api.burst = function (x, y, s) { burst(x, y, s || 2); };
    api.setTime = function (v) { t = v; };
    api.now = function () { return t; };
    api.endIntro = function () { intro = 0; };
    api.freeze = function (on) { alive = !on; if (on && raf) { cancelAnimationFrame(raf); raf = 0; } if (!on) update(); };
    api.hover = function (x, y, a) { hover.x = x; hover.y = y; hover.amt = hover.target = a; };
    api.draw = draw;
    api.stats = function () { return { lines: Math.floor(fib.count * LODS[lod][0] / 2), points: pts.count, dpr: dpr, lod: lod, w: W, h: H }; };
    api.setLod = function (l) { lod = Math.max(0, Math.min(LODS.length - 1, l)); lodAt = t + 1e9; resize(); };
    container.__pmHeroC = api;
    return api;
  }

  window.PMHeroC = { init: init };
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-pm-hero-c]'), function (el) {
      if (el.getAttribute('data-pm-hero-c') === 'manual') return;
      // build a variant only once it is shown (the switcher hides the others)
      if (!window.IntersectionObserver) { init(el); return; }
      var io = new IntersectionObserver(function (es) {
        if (es[es.length - 1].isIntersecting && el.offsetWidth) { io.disconnect(); init(el); }
      });
      io.observe(el);
    });
  }
  // material swatches in the page's design switcher ([data-set-mat]); "auto" = each
  // variant's own default. Remembered like the other choices (?mat=ink, localStorage).
  var MAT_NAMES = ['silver', 'champagne', 'ink', 'iridescent', 'glow', 'aurora', 'ice', 'night'];
  function mats() {
    var pm = document.getElementById('pm');
    if (!pm) return;
    function mark() {
      var m = pm.getAttribute('data-cx-mat') || 'auto';
      Array.prototype.forEach.call(document.querySelectorAll('[data-set-mat]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-set-mat') === m ? 'true' : 'false');
      });
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-set-mat]');
      if (!b) return;
      var m = b.getAttribute('data-set-mat');
      if (MAT_NAMES.indexOf(m) >= 0) pm.setAttribute('data-cx-mat', m); else { m = 'auto'; pm.removeAttribute('data-cx-mat'); }
      try { localStorage.setItem('pm-cx-mat', m); } catch (er) { /* private mode */ }
      try {
        var u = new URL(location.href);
        if (m === 'auto') u.searchParams.delete('mat'); else u.searchParams.set('mat', m);
        history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      } catch (er) { /* old browser */ }
      mark();
    });
    mark();
  }
  function start() { auto(); mats(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
