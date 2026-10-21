/* PaperManager hero C: a silky infinity knot of fine fibres and dust, drawn
 * with plain WebGL2 (no library, nothing loaded from elsewhere).
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
 *   opts.noIntro   skip the "dust condenses into the knot" intro
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

  // ------------------------------------------------------------ the knot
  // A lemniscate of Bernoulli lifted into 3D (the two strands pass over and
  // under at the crossing), reparametrised by arc length; u in [0, 1) runs
  // once round. u = 0 is the right tip, u = 0.5 the left tip, the crossings
  // sit at u = 0.25 and 0.75.
  var CURVE_N = 2048;
  function buildCurve() {
    var A = 1.18, raw = [], len = [0], i;
    for (i = 0; i <= CURVE_N * 4; i++) {
      var t = i / (CURVE_N * 4) * TAU, s = Math.sin(t), c = Math.cos(t), den = 1 + s * s;
      raw.push([A * c / den, 1.08 * A * s * c / den + 0.05 * Math.sin(2 * t + 0.6), 0.3 * s + 0.06 * Math.sin(3 * t)]);
      if (i) {
        var p = raw[i - 1], q = raw[i];
        len.push(len[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]));
      }
    }
    var total = len[len.length - 1], P = new Float32Array(CURVE_N * 3), j = 0;
    for (i = 0; i < CURVE_N; i++) {
      var target = i / CURVE_N * total;
      while (len[j + 1] < target) j++;
      var k = (target - len[j]) / (len[j + 1] - len[j] || 1);
      for (var d = 0; d < 3; d++) P[i * 3 + d] = raw[j][d] + (raw[j + 1][d] - raw[j][d]) * k;
    }
    // frames: T along the curve, N in the "page" plane, B roughly towards the viewer
    var T = new Float32Array(CURVE_N * 3), N = new Float32Array(CURVE_N * 3), B = new Float32Array(CURVE_N * 3);
    for (i = 0; i < CURVE_N; i++) {
      var a = ((i + 1) % CURVE_N) * 3, b = ((i - 1 + CURVE_N) % CURVE_N) * 3;
      var tx = P[a] - P[b], ty = P[a + 1] - P[b + 1], tz = P[a + 2] - P[b + 2], tl = Math.hypot(tx, ty, tz);
      tx /= tl; ty /= tl; tz /= tl;
      var nx = -ty, ny = tx, nz = 0, nl = Math.hypot(nx, ny) || 1; // cross(z, T)
      nx /= nl; ny /= nl;
      var bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      T.set([tx, ty, tz], i * 3); N.set([nx, ny, nz], i * 3); B.set([bx, by, bz], i * 3);
    }
    return { P: P, T: T, N: N, B: B };
  }
  function sampleCurve(C, u, out) {
    var f = (u - Math.floor(u)) * CURVE_N, i0 = Math.floor(f) % CURVE_N, i1 = (i0 + 1) % CURVE_N, k = f - Math.floor(f);
    for (var d = 0; d < 3; d++) {
      out.p[d] = C.P[i0 * 3 + d] + (C.P[i1 * 3 + d] - C.P[i0 * 3 + d]) * k;
      out.t[d] = C.T[i0 * 3 + d] + (C.T[i1 * 3 + d] - C.T[i0 * 3 + d]) * k;
      out.n[d] = C.N[i0 * 3 + d] + (C.N[i1 * 3 + d] - C.N[i0 * 3 + d]) * k;
      out.b[d] = C.B[i0 * 3 + d] + (C.B[i1 * 3 + d] - C.B[i0 * 3 + d]) * k;
    }
  }
  function wrapDist(u, c) { var d = Math.abs(u - c) % 1; return Math.min(d, 1 - d); }
  // ribbon twist: none at the tips (broad face to the viewer), fast through the crossings
  function twist(u) { return TAU * u - 0.5 * Math.sin(2 * TAU * u) + 0.75; }
  function fray(u) { return Math.max(Math.exp(-Math.pow(wrapDist(u, 0) / 0.075, 2)), Math.exp(-Math.pow(wrapDist(u, 0.5) / 0.075, 2))); }
  function crossing(u) { return Math.max(Math.exp(-Math.pow(wrapDist(u, 0.25) / 0.09, 2)), Math.exp(-Math.pow(wrapDist(u, 0.75) / 0.09, 2))); }
  function ribbonW(u) { return 0.22 * (1 - 0.35 * crossing(u)) + 0.05 * Math.sin(TAU * 2 * u + 1.1) * Math.sin(TAU * 2 * u + 1.1); }
  var RIBBON_H = 0.042;

  function buildFibres(C, R, count, perLoop) {
    var pos = [], idx = [], fr = { p: [0, 0, 0], t: [0, 0, 0], n: [0, 0, 0], b: [0, 0, 0] };
    var data = [];
    var vert = 0;
    for (var f = 0; f < count; f++) {
      var seed = R(), kind = R(), u0, len, stray = false;
      if (kind < 0.02) { stray = true; u0 = R(); len = 0.1 + R() * 0.2; }
      else if (kind < 0.5) { u0 = (R() < 0.5 ? 0 : 0.5) + (R() - 0.5) * 0.12; len = 0.42 + R() * 0.18; }
      else { u0 = R(); len = 0.7 + R() * 0.3; }
      // place in an elliptical cross-section (denser to the middle)
      var r = Math.sqrt(R()), ang = R() * TAU;
      var a0 = r * Math.cos(ang), b0 = r * Math.sin(ang);
      if (stray) { a0 *= 1.4; b0 = (R() < 0.5 ? -1 : 1) * (1.5 + R() * 3); }
      var f1 = 1 + R() * 3, p1 = R() * TAU, f2 = 3 + R() * 6, p2 = R() * TAU, amp = 0.08 + R() * 0.18;
      var frayK = 0.2 + R() * 1.1, frayDir = gauss(R), frayLift = gauss(R);
      var n = Math.max(8, Math.ceil(len * perLoop)), start = vert;
      for (var i = 0; i < n; i++) {
        var s = i / (n - 1), u = u0 + len * s;
        sampleCurve(C, u, fr);
        var th = twist(u), ct = Math.cos(th), st = Math.sin(th);
        var W = ribbonW(u), H = RIBBON_H, fz = fray(u);
        // silky waviness: each fibre drifts slowly across the ribbon
        var a = a0 + amp * Math.sin(TAU * f1 * u + p1) + 0.03 * Math.sin(TAU * f2 * u + p2);
        var b = b0 + 0.5 * amp * Math.sin(TAU * f1 * u + p2);
        var spread = 1 + fz * frayK * 0.35;
        var la = a * W * spread + fz * fz * frayDir * 0.05, lb = b * H * (1 + fz * frayK * 2.5) + fz * fz * frayLift * 0.04;
        // wide axis and thin axis of the ribbon at u
        var wx = ct * fr.n[0] + st * fr.b[0], wy = ct * fr.n[1] + st * fr.b[1], wz = ct * fr.n[2] + st * fr.b[2];
        var hx = -st * fr.n[0] + ct * fr.b[0], hy = -st * fr.n[1] + ct * fr.b[1], hz = -st * fr.n[2] + ct * fr.b[2];
        var ox = la * wx + lb * hx, oy = la * wy + lb * hy, oz = la * wz + lb * hz;
        // fraying fibres also stretch outwards past the tips
        var out = fz * fz * (0.02 + 0.1 * seed) * Math.sign(fr.p[0]);
        ox += out;
        // ribbon normal: gradient of the cross-section ellipse (flat faces, rounded edges)
        var ga = a / (W * 6), gb = b / H;
        var nx = ga * wx + gb * hx, ny = ga * wy + gb * hy, nz = ga * wz + gb * hz, nl = Math.hypot(nx, ny, nz) || 1;
        var ao = 0.55 + 0.45 * Math.min(1, Math.abs(b) * 1.2 + 0.2 * r);
        pos.push(fr.p[0], fr.p[1], fr.p[2], ox, oy, oz, nx / nl, ny / nl, nz / nl, fr.t[0], fr.t[1], fr.t[2]);
        data.push(seed, s, fz, stray ? -ao : ao);
        if (i) idx.push(vert - 1, vert);
        vert++;
      }
    }
    // interleave: 12 floats geometry + 4 floats data
    var V = new Float32Array(vert * 16);
    for (var v = 0; v < vert; v++) {
      for (var k = 0; k < 12; k++) V[v * 16 + k] = pos[v * 12 + k];
      for (k = 0; k < 4; k++) V[v * 16 + 12 + k] = data[v * 4 + k];
    }
    return { V: V, I: new Uint32Array(idx), count: idx.length };
  }

  function buildParticles(C, R, dust, spheres, latent) {
    var out = [], fr = { p: [0, 0, 0], t: [0, 0, 0], n: [0, 0, 0], b: [0, 0, 0] };
    function onRibbon(u, rad) {
      sampleCurve(C, u, fr);
      var th = twist(u), ct = Math.cos(th), st = Math.sin(th), W = ribbonW(u), fz = fray(u);
      var ang = R() * TAU, a = Math.cos(ang) * rad * W * (1 + fz * 1.6), b = Math.sin(ang) * rad * RIBBON_H * (2.5 + fz * 10);
      var p = [];
      for (var d = 0; d < 3; d++) p.push(fr.p[d] + a * (ct * fr.n[d] + st * fr.b[d]) + b * (-st * fr.n[d] + ct * fr.b[d]));
      return p;
    }
    function push(p, dir, seed, size, type, loose) { out.push(p[0], p[1], p[2], dir[0], dir[1], dir[2], seed, size, type, loose); }
    function cloud(side) {
      // dust streaming off a tip: denser near it, wider and thinner further out
      var u = side > 0 ? 0 : 0.5;
      sampleCurve(C, u + (R() - 0.5) * 0.06, fr);
      var rr = Math.min(2.0, -Math.log(R() || 1e-6) * 0.58), sig = 0.025 + 0.11 * rr;
      var dir = [side * (1 + 0.1 * gauss(R)), 0.1 * gauss(R) - 0.06 * side, 0.14 * gauss(R)];
      var dl = Math.hypot(dir[0], dir[1], dir[2]);
      dir = [dir[0] / dl, dir[1] / dl, dir[2] / dl];
      return {
        p: [fr.p[0] + dir[0] * rr, fr.p[1] + dir[1] * rr + gauss(R) * sig * 0.8, fr.p[2] + dir[2] * rr + gauss(R) * sig],
        dir: dir, r: rr
      };
    }
    var i, u, q;
    for (i = 0; i < dust; i++) {
      var size = Math.exp(gauss(R) * 0.5) * 0.005, roll = R();
      if (roll < 0.32) { // clinging to the ribbon edges, mostly towards the tips
        u = R(); var tip = R() < 0.6;
        if (tip) u = (R() < 0.5 ? 0 : 0.5) + gauss(R) * 0.075;
        push(onRibbon(u, tip ? 0.95 + Math.abs(gauss(R)) * 0.4 : 0.85 + R() * 0.2), [0, 0, 0], R(), tip ? size : size * 0.7, 0, tip ? 0.35 : 0.6);
      } else { // streaming off the tips
        q = cloud(R() < 0.5 ? 1 : -1);
        push(q.p, q.dir, R(), size * (1.1 - 0.4 * Math.min(1, q.r)), 0, 1);
      }
    }
    for (i = 0; i < spheres; i++) {
      var rad = Math.exp(gauss(R) * 0.45) * 0.015;
      if (R() < 0.55) {
        u = (R() < 0.5 ? 0 : 0.5) + gauss(R) * 0.13;
        if (R() < 0.3) u = R();
        push(onRibbon(u, 1.0 + R() * 0.6), [0, 0, 0], R(), rad, 1, 0.3);
      } else {
        q = cloud(R() < 0.5 ? 1 : -1);
        push(q.p, q.dir, R(), rad * (1 - 0.45 * Math.min(1, q.r)), 1, 0.8);
      }
    }
    for (i = 0; i < latent; i++) { // hidden inside the ribbon; shows when a burst shatters the fibres
      push(onRibbon(R(), Math.sqrt(R()) * 0.9), [0, 0, 0], R(), Math.exp(gauss(R) * 0.4) * 0.006, 2, 0.9);
    }
    return { V: new Float32Array(out), count: out.length / 10 };
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
    'out vec3 vN; out vec3 vT; out vec3 vV; out float vAlpha; out float vAo; out float vE; out float vFray; out float vTone;',
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
    '  vAo = ao; vE = e; vFray = fz; vTone = 0.72 + 0.4 * h11(seed * 53.0);',
    '}'
  ].join('\n');

  var SHADE = [
    'uniform vec3 uLo, uMid, uHi, uAcc; uniform float uDark, uAlpha;',
    'const vec3 L1 = vec3(-0.45, 0.72, 0.53);',
    'const vec3 L2 = vec3(0.7, -0.15, 0.7);'
  ].join('\n');

  var FIBRE_FS = [
    '#version 300 es',
    'precision highp float;',
    SHADE,
    'in vec3 vN; in vec3 vT; in vec3 vV; in float vAlpha; in float vAo; in float vE; in float vFray; in float vTone;',
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
    '  c += uHi * spec * (0.55 + 0.45 * wrap) * vAo;',
    '  c = mix(c, mix(uLo, uAcc, 0.5), 0.07 * (1.0 - d));', // accent in the shadows
        // depth: far strands lighter and fainter
    '  c = min(c, uHi * 0.985);',
    '  float far = smoothstep(-0.6, 0.9, length(vV) - uFarRef);',
    '  float a = vAlpha * uAlpha * (0.85 - 0.25 * far);',
    '  o = vec4(c * a, a);',
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
    '  vec3 sand = vec3(0.78, 0.69, 0.55);',
    '  vec3 base = k < 0.28 ? mix(uMid, uHi, 0.75) : k < 0.6 ? mix(uMid, sand, 0.7) : k < 0.86 ? mix(uLo, sand, 0.5) : mix(uLo, uMid, 0.15);',
    '  base = mix(base, uAcc, 0.1 * step(0.95, fract(vSeed * 3.7)));',
    '  vec3 c = base * (0.35 + 0.75 * diff) + uHi * spec * (vType > 0.5 && vType < 1.5 ? 0.9 : 0.35) + uHi * rim * 0.12;',
    '  if (vSize < 3.0) c = base * (0.55 + 0.45 * diff);',
    '  float a = vAlpha * edge * uAlpha;',
    '  o = vec4(c * a, a);',
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
    var C = buildCurve(), R = rng(20251021);
    var fib = buildFibres(C, R, small ? 1300 : 2800, small ? 120 : 170);
    var pts = buildParticles(C, R, small ? 6000 : 16000, small ? 40 : 75, small ? 3000 : 9000);

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
    var W = 0, H = 0, dpr = 1, proj, aspect = 1, dist = 7;
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
      var src = container.closest('.pm') || container;
      var acc = parseColor(getComputedStyle(src).getPropertyValue('--pm-accent') || '#7c3aed');
      if (dark) {
        col = { lo: [0.16, 0.15, 0.14], mid: [0.55, 0.52, 0.48], hi: [0.97, 0.95, 0.91], acc: acc, dark: 1, far: 0 };
      } else {
        col = { lo: [0.22, 0.19, 0.155], mid: [0.64, 0.585, 0.51], hi: [1.0, 0.98, 0.94], acc: acc, dark: 0, far: 0 };
      }
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
      // fit: the knot plus most of its dust across, the loops top to bottom
      var halfW = W < 560 ? 1.72 : 2.6;
      dist = Math.max(halfW / (tn * aspect), 1.05 / tn);
      proj = perspective(fov, aspect, 0.1, 40);
      return true;
    }

    function view(time) {
      var ry = 0.32 * Math.sin(time * 0.11) + 0.1 * Math.sin(time * 0.047 + 1.0);
      var rx = 0.42 + 0.07 * Math.sin(time * 0.083 + 0.4);
      var rz = -0.1 + 0.035 * Math.sin(time * 0.06);
      return mul(translate(0, 0.04, -dist), mul(rotX(rx), mul(rotY(ry), rotZ(rz))));
    }

    function draw() {
      if (!W && !resize()) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.DEPTH_TEST);
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
        if (P.u.uDark) gl.uniform1f(P.u.uDark, col.dark);
        if (P.u.uAlpha) gl.uniform1f(P.u.uAlpha, 1.0);
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
    if (pm) new MutationObserver(recolour).observe(pm, { attributes: true, attributeFilter: ['data-pm-theme'] });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); alive = false; fallback(); });

    resize();
    update();
    container.classList.add('is-live');

    api.burst = function (x, y, s) { burst(x, y, s || 2); };
    api.setTime = function (v) { t = v; };
    api.now = function () { return t; };
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
      if (el.getAttribute('data-pm-hero-c') !== 'manual') init(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
