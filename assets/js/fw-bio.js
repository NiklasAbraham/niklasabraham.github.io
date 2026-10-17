// Fold a protein — chapter 1, the biology (registered with fw-core.js). Ten steps for a reader who has never
// met a protein: what a protein is, amino acids, a sequence, folding, coordinates, binding, antibodies, why
// structures are predicted, the prediction task, and the case of several right answers (the bridge into the
// model chapter). Real data wherever possible: villin headpiece 1VII and trastuzumab Fv + HER2 domain IV 1N8Z,
// loaded with FW.load. Molecules are drawn on a canvas (depth-sorted tubes and beads), labels and diagrams in SVG.
// Below 700 px the stage switches to a portrait layout (520 × 860 design units, class fwb-tall).
(function () {
  'use strict';
  const FW = window.FW; if (!FW) return;
  const C = FW.C, esc = FW.h.esc, rgba = FW.h.rgba, A = FW.h.A;
  const INK = C.ink, MUTED = C.muted, BLUE = C.q, RUST = C.r, TEAL = C.teal, VIOLET = C.violet, AMBER = C.amber;
  const LINE = rgba(INK, 0.16);
  const CHAIN = [BLUE, INK, RUST];          // VL, VH, HER2 — the model chapter's chain colours
  const CONTACT = AMBER;                    // interface residues and CDR loops

  // ------------------------------------------------------------------ amino acids
  const CLS = {
    hyd: { c: AMBER, name: 'Oily', note: 'avoid water' },
    pol: { c: TEAL, name: 'Polar', note: 'like water' },
    pos: { c: BLUE, name: 'Positive', note: 'charge +' },
    neg: { c: RUST, name: 'Negative', note: 'charge −' },
    spc: { c: VIOLET, name: 'Special', note: 'tiny, rigid, linking' },
  };
  const AA = {
    A: ['Ala', 'Alanine', 'hyd'], V: ['Val', 'Valine', 'hyd'], L: ['Leu', 'Leucine', 'hyd'], I: ['Ile', 'Isoleucine', 'hyd'],
    M: ['Met', 'Methionine', 'hyd'], F: ['Phe', 'Phenylalanine', 'hyd'], W: ['Trp', 'Tryptophan', 'hyd'],
    S: ['Ser', 'Serine', 'pol'], T: ['Thr', 'Threonine', 'pol'], N: ['Asn', 'Asparagine', 'pol'], Q: ['Gln', 'Glutamine', 'pol'], Y: ['Tyr', 'Tyrosine', 'pol'],
    K: ['Lys', 'Lysine', 'pos'], R: ['Arg', 'Arginine', 'pos'], H: ['His', 'Histidine', 'pos'],
    D: ['Asp', 'Aspartate', 'neg'], E: ['Glu', 'Glutamate', 'neg'],
    G: ['Gly', 'Glycine', 'spc'], P: ['Pro', 'Proline', 'spc'], C: ['Cys', 'Cysteine', 'spc'],
  };
  const GROUPS = [['hyd', 'AVLIMFW'], ['pol', 'STNQY'], ['pos', 'KRH'], ['neg', 'DE'], ['spc', 'GPC']];
  const aaCol = (a) => (AA[a] ? CLS[AA[a][2]].c : MUTED);
  // heavy atoms per residue (backbone N, Cα, C, O included); one extra terminal oxygen per chain
  const HEAVY = { G: 4, A: 5, S: 6, C: 6, P: 7, T: 7, V: 7, D: 8, N: 8, I: 8, L: 8, M: 8, E: 9, Q: 9, K: 9, H: 10, F: 11, R: 11, Y: 12, W: 14 };
  const heavyAtoms = (seq) => [...seq].reduce((s, a) => s + (HEAVY[a] || 8), 1);

  // ------------------------------------------------------------------ small helpers
  const f1 = (v) => (+v).toFixed(1);
  const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
  const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
  const easeIO = (t) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOut = (t) => { t = clamp01(t); return 1 - Math.pow(1 - t, 3); };
  const lay = () => (window.matchMedia('(max-width: 700px)').matches ? { W: 520, H: 860, tall: true } : { W: 1240, H: 600, tall: false });
  function T(x, y, s, o = {}) {
    const op = o.op == null ? '' : (o.an ? ` fill-opacity="${o.op}"` : ` opacity="${o.op}"`);
    return `<text x="${f1(x)}" y="${f1(y)}" font-size="${o.size || 16}" fill="${o.fill || INK}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.w ? ` font-weight="${o.w}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}${A(Object.assign({}, o, { cls: (o.mono ? 'mono ' : '') + (o.cls || '') }))}${op}${o.attr || ''}>${o.raw ? s : esc(s)}</text>`;
  }
  const R_ = (x, y, w, h, fill, o = {}) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${fill}"${o.rx != null ? ` rx="${o.rx}"` : ''}${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}${o.op != null ? ` fill-opacity="${o.op}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${A(o)}${o.attr || ''}/>`;
  const Ci = (x, y, r, fill, o = {}) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}${o.op != null ? ` fill-opacity="${o.op}"` : ''}${A(o)}${o.attr || ''}/>`;
  const Ln = (x1, y1, x2, y2, stroke, w, o = {}) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${stroke}" stroke-width="${w || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cap ? ` stroke-linecap="${o.cap}"` : ''}${o.op != null ? ` stroke-opacity="${o.op}"` : ''}${A(o)}/>`;
  const Pa = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cap ? ` stroke-linecap="${o.cap}" stroke-linejoin="round"` : ''}${o.op != null ? ` stroke-opacity="${o.op}"` : ''}${o.mk ? ' marker-end="url(#fwb-arr)"' : ''}${A(o)}/>`;
  const G = (inner, o = {}) => `<g${A(o)}${o.tr ? ` transform="${o.tr}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}${o.attr || ''}>${inner}</g>`;
  function wrap(s, size, maxW) {
    const words = s.split(' '), out = []; let cur = '';
    const w = (t) => t.length * size * 0.53;
    words.forEach((wd) => { const nx = cur ? cur + ' ' + wd : wd; if (w(nx) > maxW && cur) { out.push(cur); cur = wd; } else cur = nx; });
    if (cur) out.push(cur); return out;
  }
  // the headline of every step: one idea, top left
  function head(L, title, sub, d0 = 0) {
    const x = L.tall ? 30 : 56, maxW = L.W - 2 * x;
    const ts = L.tall ? 31 : 30, ss = L.tall ? 20 : 17.5;
    let y = L.tall ? 58 : 64, s = '';
    wrap(title, ts, maxW).forEach((ln) => { s += T(x, y, ln, { size: ts, w: 720, ls: -0.4, an: 'a', d: d0 }); y += ts * 1.18; });
    y += L.tall ? 2 : -2;
    if (sub) wrap(sub, ss, L.tall ? maxW : 820).forEach((ln) => { s += T(x, y, ln, { size: ss, fill: MUTED, an: 'a', d: d0 + 0.12 }); y += ss * 1.35; });
    return { s, y };
  }
  const MARK = `<defs><marker id="fwb-arr" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="${INK}"/></marker></defs>`;
  const foot = (L, s) => T(L.tall ? 30 : 56, L.H - (L.tall ? 22 : 20), s, { size: L.tall ? 17 : 14, fill: MUTED, mono: true, an: 'a', d: 0.6 });
  // the stage: [svg under] [canvas] [svg over]; returns handles
  function stage(el, L, under, over) {
    el.classList.add('fwb'); if (L.tall) el.classList.add('fwb-tall');
    const sv = (inner, cls) => `<svg viewBox="0 0 ${L.W} ${L.H}" class="${cls}" role="img">${FW.h.DEFS}${inner}</svg>`;
    el.innerHTML = sv(under || '', 'fwb-under') + '<canvas class="fwb-cv"></canvas>' + sv(over || '', 'fwb-over');
    return { cv: el.querySelector('canvas'), over: el.querySelector('.fwb-over'), under: el.querySelector('.fwb-under') };
  }

  // ------------------------------------------------------------------ vectors, internal coordinates, alignment
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm3 = (a) => mul3(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
  const centroid = (P) => { const c = [0, 0, 0]; P.forEach((p) => { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }); return mul3(c, 1 / P.length); };
  const matVec = (R, p) => [R[0][0] * p[0] + R[0][1] * p[1] + R[0][2] * p[2], R[1][0] * p[0] + R[1][1] * p[1] + R[1][2] * p[2], R[2][0] * p[0] + R[2][1] * p[1] + R[2][2] * p[2]];
  const matMul = (A_, B) => A_.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const rotY = (a) => { const c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
  const rotX = (a) => { const c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; };
  const rotZ = (a) => { const c = Math.cos(a), s = Math.sin(a); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; };
  const angle3 = (a, b, c) => { const u = nrm3(sub3(a, b)), v = nrm3(sub3(c, b)); return Math.acos(Math.max(-1, Math.min(1, dot3(u, v)))); };
  function dihedral(a, b, c, d) {
    const b0 = sub3(a, b), b1 = nrm3(sub3(c, b)), b2 = sub3(d, c);
    const v = sub3(b0, mul3(b1, dot3(b0, b1))), w = sub3(b2, mul3(b1, dot3(b2, b1)));
    return Math.atan2(dot3(cross3(b1, v), w), dot3(v, w));
  }
  // NeRF: place d with |cd| = L, angle(b, c, d) = th, dihedral(a, b, c, d) = tau
  function place(a, b, c, L, th, tau) {
    const bc = nrm3(sub3(c, b)), n = nrm3(cross3(sub3(b, a), bc)), m = cross3(n, bc);
    const d2 = [-L * Math.cos(th), L * Math.sin(th) * Math.cos(tau), L * Math.sin(th) * Math.sin(tau)];
    return [0, 1, 2].map((k) => c[k] + d2[0] * bc[k] + d2[1] * m[k] + d2[2] * n[k]);
  }
  function internal(P) {
    const n = P.length, bl = [], th = [], tau = [];
    for (let i = 0; i < n - 1; i++) bl[i] = Math.hypot(...sub3(P[i + 1], P[i]));
    for (let i = 1; i < n - 1; i++) th[i] = angle3(P[i - 1], P[i], P[i + 1]);
    for (let i = 1; i < n - 2; i++) tau[i] = dihedral(P[i - 1], P[i], P[i + 1], P[i + 2]);
    return { bl, th, tau };
  }
  function build({ bl, th, tau }) {
    const n = bl.length + 1, P = [[0, 0, 0], [bl[0], 0, 0]];
    P.push([bl[0] - bl[1] * Math.cos(th[1]), bl[1] * Math.sin(th[1]), 0]);
    for (let j = 1; j < n - 2; j++) P.push(place(P[j - 1], P[j], P[j + 1], bl[j + 1], th[j + 1], tau[j]));
    return P;
  }
  // Horn's quaternion fit: the rotation that best maps centred X onto centred Y (power iteration, warm start)
  function fitRot(X, Y, q0) {
    const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < X.length; i++) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) S[a][b] += X[i][a] * Y[i][b];
    const [[xx, xy, xz], [yx, yy, yz], [zx, zy, zz]] = S;
    const N = [[xx + yy + zz, yz - zy, zx - xz, xy - yx], [yz - zy, xx - yy - zz, xy + yx, zx + xz], [zx - xz, xy + yx, -xx + yy - zz, yz + zy], [xy - yx, zx + xz, yz + zy, -xx - yy + zz]];
    let c = 0; N.forEach((r) => { c = Math.max(c, r.reduce((s, v) => s + Math.abs(v), 0)); });
    let q = q0 ? q0.slice() : [1, 0, 0, 0];
    for (let it = 0; it < 60; it++) {
      const nq = N.map((r, i) => r[0] * q[0] + r[1] * q[1] + r[2] * q[2] + r[3] * q[3] + c * q[i]);
      const l = Math.hypot(...nq) || 1; q = nq.map((v) => v / l);
    }
    const [w, x, y, z] = q;
    return { q, R: [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)]] };
  }
  // principal axes (Jacobi): rows = axes by decreasing spread; looking down the last one shows the most
  function pcaView(P) {
    const a = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; P.forEach((p) => { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) a[i][j] += p[i] * p[j]; });
    let V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let sweep = 0; sweep < 30; sweep++) for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
      if (Math.abs(a[p][q]) < 1e-9) continue;
      const th = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]), c = Math.cos(th), sn = Math.sin(th);
      const J = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; J[p][p] = c; J[q][q] = c; J[p][q] = sn; J[q][p] = -sn;
      const Jt = [0, 1, 2].map((i) => [0, 1, 2].map((j) => J[j][i]));
      const na = matMul(Jt, matMul(a, J)); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) a[i][j] = na[i][j];
      V = matMul(V, J);
    }
    const order = [0, 1, 2].sort((i, j) => a[j][j] - a[i][i]);
    const R = order.map((i) => [V[0][i], V[1][i], V[2][i]]);
    const det = R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) - R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) + R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0]);
    if (det < 0) R[2] = R[2].map((v) => -v);
    return R;
  }
  const centre = (P) => { const c = centroid(P); return P.map((p) => sub3(p, c)); };
  // Catmull–Rom subdivision of a Cα trace; ix[k] = residue index (float) of point k
  function spline(P, n = 4) {
    const pts = [], ix = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        pts.push([0, 1, 2].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
        ix.push(i + t);
      }
    }
    pts.push(P[P.length - 1]); ix.push(P.length - 1);
    return { pts, ix };
  }

  // ------------------------------------------------------------------ canvas renderer
  const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const WHITE = [255, 255, 255];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const FONT = (size, w = 600) => `${w} ${size}px Inter, system-ui, sans-serif`;
  function canvasCam(el, cv, L) {
    const g = cv.getContext('2d');
    return {
      g,
      fit() {
        const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return false;
        const dpr = Math.min(2, window.devicePixelRatio || 1), cw = Math.round(w * dpr), ch = Math.round(h * dpr);
        if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
        const s = Math.min(w / L.W, h / L.H), ox = (w - L.W * s) / 2, oy = (h - L.H * s) / 2;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch);
        g.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
        return true;
      },
    };
  }
  // view: rotation R, centre ctr (Å), screen centre (cx, cy), scale k (units per Å)
  function projector(R, ctr, cx, cy, k, D = 240) {
    return (p) => { const q = matVec(R, sub3(p, ctr)), s = D / (D - q[2]); return { x: cx + q[0] * k * s, y: cy - q[1] * k * s, z: q[2], s }; };
  }
  // depth-sorted drawing of segments (tubes) and spheres (beads); fog lightens the far side
  function draw3d(g, items, fog = 0.5, halo = 2.4) {
    let zmin = Infinity, zmax = -Infinity;
    items.forEach((it) => { if (it.z < zmin) zmin = it.z; if (it.z > zmax) zmax = it.z; });
    const span = Math.max(1e-6, zmax - zmin);
    items.sort((p, q) => p.z - q.z);
    for (const it of items) {
      const f = fog * (zmax - it.z) / span, col = mixc(it.c, WHITE, f), a = it.a == null ? 1 : it.a;
      if (a <= 0.003) continue;
      g.globalAlpha = a;
      if (it.t === 's') {
        g.beginPath(); g.moveTo(it.x1, it.y1); g.lineTo(it.x2, it.y2);
        if (it.halo !== false) { g.lineCap = 'butt'; g.strokeStyle = '#fff'; g.lineWidth = it.w + (it.h == null ? halo : it.h); g.stroke(); }
        g.lineCap = 'round'; g.strokeStyle = css(col); g.lineWidth = it.w; g.stroke();
      } else {
        g.beginPath(); g.arc(it.x, it.y, Math.max(0.5, it.r), 0, 2 * Math.PI);
        g.fillStyle = css(col); g.fill();
        g.lineWidth = it.sw || 2; g.strokeStyle = it.ring || '#fff'; g.stroke();
        if (it.txt && it.r > 7) { g.fillStyle = '#fff'; g.font = FONT(Math.round(it.r * 1.02), 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.txt, it.x, it.y + it.r * 0.06); }
      }
    }
    g.globalAlpha = 1;
  }
  function tubeItems(items, Q, ix, colOf, w, o = {}) {
    for (let i = 0; i < Q.length - 1; i++) {
      const a = Q[i], b = Q[i + 1];
      items.push({ t: 's', x1: a.x, y1: a.y, x2: b.x, y2: b.y, z: (a.z + b.z) / 2, w: w * (a.s + b.s) / 2, c: colOf(ix[i]), a: o.a, h: o.h });
    }
  }
  function label(g, x, y, s, o = {}) {
    g.font = FONT(o.size || 17, o.w || 650); g.textAlign = o.align || 'left'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,0.92)'; g.globalAlpha = o.a == null ? 1 : o.a;
    g.strokeText(s, x, y); g.fillStyle = o.c || INK; g.fillText(s, x, y); g.globalAlpha = 1;
    return g.measureText(s).width;
  }
  // a chain as beads (one per residue, with its letter) on a smooth tube
  const TUBE = rgbOf('#b9c1d1'), TUBE_H = rgbOf('#6f7d9b');
  function beadItems(items, X, pj, seq, kk, o = {}) {
    const sp = spline(X, 4), Qs = sp.pts.map(pj);
    for (let j = 0; j < Qs.length - 1; j++) {
      const i = Math.round(sp.ix[j]), a = o.shown ? o.shown(Math.ceil(sp.ix[j + 1])) : 1; if (a <= 0) continue;
      items.push({ t: 's', x1: Qs[j].x, y1: Qs[j].y, x2: Qs[j + 1].x, y2: Qs[j + 1].y, z: (Qs[j].z + Qs[j + 1].z) / 2 - 0.9, w: (o.tw || 0.8) * kk * (Qs[j].s + Qs[j + 1].s) / 2, c: o.tubeCol ? o.tubeCol(i) : TUBE, a, h: 2 });
    }
    X.forEach((p, i) => { const q = pj(p), sh = o.shown ? o.shown(i) : 1; if (sh <= 0) return; items.push({ t: 'b', x: q.x, y: q.y, z: q.z, r: (o.r || 1.3) * kk * q.s * sh, c: o.col(i), txt: seq[i], ring: o.ring ? o.ring(i) : '#fff', sw: o.sw ? o.sw(i) : 2 }); });
    return items;
  }
  // the projected point of P closest to (x, y): where a leader line should end
  function nearest(P, pj, x, y) { let best = null, bd = Infinity; P.forEach((p) => { const q = pj(p), dd = (q.x - x) ** 2 + (q.y - y) ** 2; if (dd < bd) { bd = dd; best = q; } }); return best; }
  function leader(g, x1, y1, x2, y2, c = INK, a = 1) {
    g.globalAlpha = a * 0.55; g.strokeStyle = c; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.globalAlpha = a; g.fillStyle = c; g.beginPath(); g.arc(x2, y2, 3.2, 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ data
  const cache = {};
  function prep(d) {
    d.P = d.ca.map((p) => p.slice());
    d.chainP = d.chains.map((c, k) => d.P.slice(d.start[k], d.start[k] + c.seq.length));
    d.seq = d.chains.map((c) => c.seq).join('');
    if (d.chains.length === 3) {
      // canonical view: antibody left, antigen right, heavy chain above light chain
      const cF = centroid(d.chainP[0].concat(d.chainP[1])), cH = centroid(d.chainP[2]);
      const e1 = nrm3(sub3(cH, cF)), vh = sub3(centroid(d.chainP[1]), centroid(d.chainP[0]));
      const e2 = nrm3(sub3(vh, mul3(e1, dot3(vh, e1)))), e3 = cross3(e1, e2);
      d.R0 = [e1, e2, e3]; d.cF = cF; d.cH = cH; d.ctr = mul3(add3(cF, cH), 0.5);
      d.e1 = e1;
      d.sp = d.chainP.map((P) => spline(P, 4));
      // CDR loops of trastuzumab (Kabat), found by sequence
      const cdr = [['L1', 0, 'RASQDVNTAVA'], ['L2', 0, 'SASFLYS'], ['L3', 0, 'QQHYTTPPT'], ['H1', 1, 'GFNIKDTYIH'], ['H2', 1, 'RIYPTNGYTRYADSVKG'], ['H3', 1, 'WGGDGFYAMDY']];
      d.cdr = cdr.map(([name, k, s]) => { const j = d.chains[k].seq.indexOf(s); return j < 0 ? null : { name, k, i0: d.start[k] + j, i1: d.start[k] + j + s.length - 1 }; }).filter(Boolean);
      d.isCdr = new Uint8Array(d.n); d.cdr.forEach((c) => { for (let i = c.i0; i <= c.i1; i++) d.isCdr[i] = 1; });
      if (d.poses) d.poseP = d.poses.map((ps) => ps.map((p) => p.slice()));
    }
    return d;
  }
  const get = (id) => cache[id] || (cache[id] = FW.load(id).then(prep));
  document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { if (document.getElementById('fw')) { get('1n8z'); get('1vii'); } }, 0); });
  // run fn(...data) once loaded; returns a cleanup for the step
  function withData(ids, fn) {
    const st = { dead: false, cleanup: null };
    Promise.all(ids.map(get)).then((ds) => { if (!st.dead) st.cleanup = fn(...ds) || null; }).catch((e) => console.error(e));
    return () => { st.dead = true; if (st.cleanup) st.cleanup(); };
  }
  // a frame loop with elapsed time in ms and an automatic canvas fit
  function loop(ctx, cam, fn) {
    let t0 = null;
    ctx.raf((t) => { if (t0 == null) t0 = t; if (!cam.fit()) return true; fn(t - t0); return true; });
  }

  // draw a complex (chains as smooth tubes); opts: alpha per chain, shift per chain (Å), extra items, cut (fraction drawn)
  function complexItems(d, pj, o = {}) {
    const items = [];
    d.sp.forEach((sp, k) => {
      const shift = (o.shift && o.shift[k]) || null, rot = (o.rot && o.rot[k]) || null;
      let pts = sp.pts;
      if (o.pose != null && k === 2) pts = o.posePts[o.pose];
      if (rot || shift) {
        const c0 = o.rotC || [0, 0, 0];
        pts = pts.map((p) => { let q = p; if (rot) q = add3(matVec(rot, sub3(q, c0)), c0); if (shift) q = add3(q, shift); return q; });
      }
      const nDraw = o.cut ? Math.max(0, Math.round(o.cut[k] * pts.length)) : pts.length;
      if (nDraw < 2) return;
      const Q = pts.slice(0, nDraw).map(pj), ix = sp.ix;
      const fade = (o.fade && o.fade[k]) || 0;
      const base = o.colOf ? (x) => o.colOf(k, d.start[k] + Math.round(x)) : () => rgbOf(o.chainCol ? o.chainCol[k] : CHAIN[k]);
      const colOf = fade ? (x) => mixc(base(x), WHITE, fade) : base;
      tubeItems(items, Q, ix, colOf, o.w || 7, { a: o.alpha ? o.alpha[k] : 1, h: o.halo });
    });
    return items;
  }

  // ================================================================== chapter
  FW.chapter({ id: 'bio', title: 'The biology in five minutes', kicker: 'Part 1 · the biology' });

  // ------------------------------------------------------------------ 1 · what a protein is
  FW.step({
    chapter: 'bio', id: 'protein', title: 'What a protein is', caption: 'a protein is a folded chain', duration: 12000,
    points: ['A protein is one long chain of small building blocks, the <b>amino acids</b> — usually a few hundred of them — folded into one precise 3D shape.',
      'The shape is the function. Here an <b>antibody</b> (blue and dark blue) grips <b>HER2</b> (orange), a receptor on some breast-cancer cells.'],
    principle: 'Sequence → shape → function. Everything on this page is about the middle arrow.',
    render(el, ctx) {
      const L = lay();
      const H = head(L, 'Proteins are chains, folded into machines', 'Three chains, 345 amino acids, every one in its place: an antibody bound to its target.');
      const { cv } = stage(el, L, H.s + foot(L, 'PDB 1N8Z · trastuzumab (Herceptin) Fv bound to HER2 domain IV · one tube per chain'));
      ctx.play();
      const cam = canvasCam(el, cv, L);
      return withData(['1n8z'], (d) => {
        const cx = L.tall ? 260 : 640, cy = L.tall ? 470 : 352, k = L.tall ? 5.0 : 7.3;
        const names = [['light chain', 'antibody'], ['heavy chain', 'antibody'], ['HER2', 'the target']];
        loop(ctx, cam, (ms) => {
          const g = cam.g, a = 0.32 * Math.sin(ms / 4200) - 0.1;
          const R = matMul(rotY(a), matMul(rotX(0.18), d.R0)), pj = projector(R, d.ctr, cx, cy, k);
          const grow = easeIO((ms - 300) / 3200);
          draw3d(g, complexItems(d, pj, { cut: [grow, grow, grow], w: L.tall ? 5.6 : 6.6 }), 0.55);
          // chain labels: antibody chains on the left, HER2 on the right
          const la = smooth((ms - 3000) / 700);
          if (la > 0) d.chainP.forEach((P, kk) => {
            const right = kk === 2, al = right ? 'left' : 'right';
            const spots = L.tall ? [[40, cy + 215, 'left'], [40, cy - 215, 'left'], [480, cy + 250, 'right']] : [[cx - 300, cy + 95, al], [cx - 300, cy - 120, al], [cx + 360, cy + 40, al]];
            const [lx, ly, aln] = spots[kk];
            const w = label(g, lx, ly - 10, names[kk][0], { size: L.tall ? 22 : 21, w: 700, c: CHAIN[kk], align: aln, a: la });
            label(g, lx, ly + 14, names[kk][1], { size: L.tall ? 18 : 16, w: 500, c: MUTED, align: aln, a: la });
            const sx = L.tall ? lx + (aln === 'left' ? w / 2 : -w / 2) : lx + (aln === 'left' ? -12 : 12), sy = L.tall ? ly + (ly > cy ? -34 : 30) : ly - 10;
            const e = nearest(P, pj, sx, sy);
            leader(g, sx, sy, e.x, e.y, CHAIN[kk], la);
          });
        });
      });
    },
  });

  // ------------------------------------------------------------------ 2 · amino acids
  // side chains drawn from Cα downwards (unit = one bond); bonds default to the previous atom, -1 = Cα
  const SIDE = {
    G: { atoms: [['H', 0, 1.0]], say: 'just a hydrogen' },
    A: { atoms: [['C', 0, 1]], say: 'small, oily' },
    L: { atoms: [['C', 0, 1], ['C', 0.87, 1.5], ['C', 0.87, 2.5], ['C', 1.74, 1, 1]], say: 'oily, branched' },
    F: { atoms: [['C', 0, 1], ['C', 0, 2], ['C', 0.87, 2.5], ['C', 0.87, 3.5], ['C', 0, 4], ['C', -0.87, 3.5], ['C', -0.87, 2.5]], ring: [6, 1], say: 'oily ring' },
    S: { atoms: [['C', 0, 1], ['O', 0.87, 1.5]], say: 'OH group: likes water' },
    D: { atoms: [['C', 0, 1], ['C', 0.87, 1.5], ['O', 0.87, 2.5], ['O', 1.74, 1, 1]], charge: ['−', 1.3, 1.95], say: 'negative charge' },
    K: { atoms: [['C', 0, 1], ['C', 0.87, 1.5], ['C', 0.87, 2.5], ['C', 1.74, 3], ['N', 1.74, 4]], charge: ['+', 2.45, 4.1], say: 'long arm, positive charge' },
  };
  const ATOM = { C: [INK, 12.5], O: [RUST, 12.5], N: [BLUE, 12.5], H: ['#ffffff', 9] };
  function sideChain(key, x0, y0, u, on) {
    const sc = SIDE[key], cls = CLS[AA[key][2]].c;
    const pts = sc.atoms.map(([e, x, y]) => [x0 + x * u, y0 + y * u]);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const rx = Math.max(...pts.map((p) => Math.abs(p[0] - cx))) + 34, ry = Math.max(...pts.map((p) => Math.abs(p[1] - cy))) + 30;
    let s = `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${cls}" fill-opacity="0.13"/>`;
    sc.atoms.forEach(([e, x, y, from], i) => {
      const p = pts[i], q = from != null ? (from === 1 ? pts[0] : pts[from]) : (i === 0 ? [x0, y0 - 0] : pts[i - 1]);
      const qq = from === 1 && key === 'L' ? pts[1] : from === 1 && key === 'D' ? pts[1] : q;
      s += Ln(qq[0], qq[1], p[0], p[1], INK, 4, { cap: 'round' });
    });
    if (sc.ring) s += Ln(pts[sc.ring[0]][0], pts[sc.ring[0]][1], pts[sc.ring[1]][0], pts[sc.ring[1]][1], INK, 4, { cap: 'round' });
    if (key === 'F') { const c = [x0, y0 + 3 * u]; s += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(u * 0.5)}" fill="none" stroke="${INK}" stroke-width="2" stroke-opacity="0.5"/>`; }
    sc.atoms.forEach(([e], i) => {
      const [col, r] = ATOM[e];
      s += Ci(pts[i][0], pts[i][1], r, col, { stroke: e === 'H' ? INK : '#fff', sw: e === 'H' ? 1.6 : 2.5 });
      if (e !== 'C') s += T(pts[i][0], pts[i][1] + 5, e, { size: 14, w: 700, anchor: 'middle', fill: e === 'H' ? INK : '#fff' });
    });
    if (sc.charge) { const [sg, x, y] = sc.charge; s += Ci(x0 + x * u, y0 + y * u, 12, '#fff', { stroke: cls, sw: 2 }) + T(x0 + x * u, y0 + y * u + 6.5, sg, { size: 20, w: 700, anchor: 'middle', fill: cls }); }
    return G(s, { cls: 'fwb-sc' + (on ? ' fwb-on' : ''), attr: ` data-k="${key}"` });
  }
  FW.step({
    chapter: 'bio', id: 'amino', title: 'Amino acids', caption: 'twenty building blocks', duration: 16000,
    points: ['There are <b>20</b> amino acids. All share the same <b>backbone</b>, which links into the chain; they differ only in the <b>side chain</b> hanging off it.',
      'Side chains are oily or water-loving, charged or not, small or bulky. Each has a one-letter code: <b>L</b> leucine, <b>K</b> lysine, <b>D</b> aspartate …'],
    principle: 'Twenty letters, one shared backbone. The side chains decide how the chain folds.',
    render(el, ctx) {
      const L = lay();
      const H = head(L, 'Twenty building blocks, one shared backbone', L.tall ? 'Same backbone, different side chain.' : 'Every amino acid has the same backbone; only the side chain differs.');
      const order = ['G', 'A', 'L', 'F', 'S', 'D', 'K'];
      // anatomy of one amino acid
      const ox = L.tall ? -46 : 0, oy = L.tall ? H.y - 112 : 44, u = 34;
      const N = [150 + ox, 236 + oy], Ca = [225 + ox, 276 + oy], Cc = [300 + ox, 236 + oy], O = [300 + ox, 168 + oy];
      const prev = [86 + ox, 276 + oy], next = [364 + ox, 276 + oy];
      let an = '';
      an += Ln(prev[0], prev[1], N[0], N[1], INK, 4, { dash: '2 7', cap: 'round', op: 0.4 }) + Ln(Cc[0], Cc[1], next[0], next[1], INK, 4, { dash: '2 7', cap: 'round', op: 0.4 });
      an += Ln(N[0], N[1], Ca[0], Ca[1], INK, 4.5, { cap: 'round' }) + Ln(Ca[0], Ca[1], Cc[0], Cc[1], INK, 4.5, { cap: 'round' });
      an += Ln(Cc[0] - 5, Cc[1], O[0] - 5, O[1], INK, 3.2) + Ln(Cc[0] + 5, Cc[1], O[0] + 5, O[1], INK, 3.2);
      [[N, BLUE, 'N'], [Ca, INK, 'Cα'], [Cc, INK, 'C'], [O, RUST, 'O']].forEach(([p, c, s]) => { an += Ci(p[0], p[1], 18, c, { stroke: '#fff', sw: 3 }) + T(p[0], p[1] + 5.5, s, { size: s === 'Cα' ? 14 : 16, w: 700, anchor: 'middle', fill: '#fff' }); });
      an += T(prev[0] - 6, prev[1] + 34, 'chain continues', { size: 14, fill: MUTED, anchor: 'start' });
      // bracket over the backbone
      const by = (L.tall ? 136 : 132) + oy;
      an += Pa(`M${N[0] - 20},${by + 8} V${by} H${Cc[0] + 20} V${by + 8}`, { stroke: INK, sw: 1.4, op: 0.5 });
      an += T((N[0] + Cc[0]) / 2, by - 12, 'backbone · identical in all 20', { size: 16, w: 650, anchor: 'middle' });
      let scs = ''; order.forEach((k, i) => { scs += sideChain(k, Ca[0], Ca[1] + 0, u, i === 0); });
      // name card of the current side chain
      const nx = 300 + ox + (L.tall ? 50 : 22), ny = 330 + oy;
      let names = '';
      order.forEach((k, i) => {
        const [three, full, cl] = AA[k];
        names += G(T(nx, ny, full, { size: 26, w: 750, fill: CLS[cl].c }) + T(nx, ny + 28, `${k} · ${three}`, { size: 16, mono: true, fill: MUTED }) + T(nx, ny + 56, SIDE[k].say, { size: 16 }), { cls: 'fwb-sc' + (i === 0 ? ' fwb-on' : ''), attr: ` data-k="${k}"` });
      });
      names = T(nx, ny - 36, 'side chain', { size: 14, mono: true, fill: MUTED, ls: 1 }) + names;
      // the twenty, grouped by property
      let grid = '';
      const tw = L.tall ? 46 : 62, gap = L.tall ? 6 : 9;
      const rows = [[0], [1], [2], [3], [4]];
      let gy = L.tall ? H.y + 348 : 128, n = 0;
      rows.forEach((row) => {
        let gx = L.tall ? 138 : 700;
        row.forEach((gi) => {
          const [cl, letters] = GROUPS[gi], c = CLS[cl].c;
          if (L.tall) grid += T(30, gy + tw / 2 + 7, CLS[cl].name, { size: 19, w: 700, fill: c, an: 'a', d: 0.4 + gi * 0.1 });
          else grid += T(540, gy + 28, CLS[cl].name, { size: 18, w: 700, fill: c, an: 'a', d: 0.4 + gi * 0.1 }) + T(540, gy + 50, CLS[cl].note, { size: 14.5, fill: MUTED, an: 'a', d: 0.45 + gi * 0.1 });
          const ty = gy;
          [...letters].forEach((a, j) => {
            const x = gx + j * (tw + gap);
            grid += G(R_(x, ty, tw, tw, c, { rx: 10, op: 0.1, stroke: rgba(c, 0.45), sw: 1.2 }) +
              G(R_(x - 3, ty - 3, tw + 6, tw + 6, c, { rx: 12 }), { cls: 'fwb-hl' }) +
              T(x + tw / 2, ty + tw * (L.tall ? 0.68 : 0.56), a, { size: L.tall ? 26 : 30, w: 750, anchor: 'middle', fill: c, cls: 'fwb-l' }) +
              (L.tall ? '' : T(x + tw / 2, ty + tw * 0.85, AA[a][0], { size: 14, anchor: 'middle', fill: MUTED, mono: true, cls: 'fwb-l3' })),
            { cls: 'fwb-tile', an: 'pop', d: 0.5 + n * 0.035, attr: ` data-k="${a}"` });
            n++;
          });
          gx += letters.length * (tw + gap);
        });
        gy += L.tall ? 58 : 87;
      });
      const intro = L.tall ? '' : '';
      stage(el, L, H.s + intro + G(an + scs + names, { an: 'a', d: 0.2 }) + grid);
      ctx.play();
      let i = 0;
      const show = () => {
        const k = order[i % order.length];
        el.querySelectorAll('.fwb-sc').forEach((s) => s.classList.toggle('fwb-on', s.dataset.k === k));
        el.querySelectorAll('.fwb-tile').forEach((s) => s.classList.toggle('fwb-on', s.dataset.k === k));
        i++; ctx.later(1900, show);
      };
      ctx.later(1500, show);
    },
  });

  // ------------------------------------------------------------------ 3 · a sequence
  FW.step({
    chapter: 'bio', id: 'sequence', title: 'The sequence', caption: 'a protein written as letters', duration: 12000,
    points: ['The order of amino acids is the <b>sequence</b>, written as a string of letters from one end of the chain (N) to the other (C).',
      'It is read straight off the gene, so it is cheap to know. Villin headpiece has 36 letters; our antibody example has three chains of 107, 120 and 118.'],
    principle: 'A protein is a string over a 20-letter alphabet. The string is the model’s input.',
    render(el, ctx) {
      const L = lay();
      const H = head(L, 'A protein is written as a string of letters', 'One letter per amino acid, in chain order — the gene spells it out directly.');
      stage(el, L, H.s); ctx.play();
      return withData(['1vii', '1n8z'], (v, d) => {
        const seq = v.chains[0].seq;
        let s = H.s;
        // villin as beads on a string
        const perRow = L.tall ? 12 : 36, sp = L.tall ? 38 : 30.6, r = L.tall ? 16.5 : 13.6;
        const x0 = L.tall ? 50 : 82, y0 = L.tall ? H.y + 70 : 214, rowH = L.tall ? 74 : 0;
        s += T(x0 - r, y0 - (L.tall ? 42 : 38), 'villin headpiece · 36 amino acids', { size: L.tall ? 20 : 18, w: 700, an: 'a', d: 0.2 });
        const pos = [...seq].map((a, i) => { const row = Math.floor(i / perRow), j = i % perRow, dir = row % 2 ? -1 : 1; return [x0 + (dir > 0 ? j : perRow - 1 - j) * sp, y0 + row * rowH]; });
        let path = `M${pos[0][0]},${pos[0][1]}`; for (let i = 1; i < pos.length; i++) {
          const [x, y] = pos[i], [px, py] = pos[i - 1];
          path += py === y ? ` L${x},${y}` : ` C${px + (L.tall ? (Math.floor((i - 1) / perRow) % 2 ? -46 : 46) : 0)},${py} ${x + (Math.floor((i - 1) / perRow) % 2 ? -46 : 46)},${y} ${x},${y}`;
        }
        s += Pa(path, { stroke: INK, sw: 2.5, op: 0.35, an: 'draw', d: 0.25 });
        [...seq].forEach((a, i) => {
          s += G(Ci(pos[i][0], pos[i][1], r, aaCol(a), { stroke: '#fff', sw: 2 }) + T(pos[i][0], pos[i][1] + r * 0.38, a, { size: r * 1.08, w: 700, anchor: 'middle', fill: '#fff' }), { an: 'pop', d: 0.3 + i * 0.03 });
          if (!L.tall && (i === 0 || (i + 1) % 5 === 0)) s += T(pos[i][0], pos[i][1] + r + 24, String(i + 1), { size: 14, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 0.5 + i * 0.03 });
        });
        const ends = L.tall ? [[pos[0], 'N'], [pos[35], 'C']] : [[pos[0], 'N'], [pos[35], 'C']];
        ends.forEach(([p, t], k) => { s += T(p[0] + (k ? (L.tall ? -r - 12 : r + 12) : -r - 12), p[1] + 6, t, { size: 18, w: 750, fill: MUTED, anchor: k ? (L.tall ? 'end' : 'start') : 'end', an: 'a', d: 1.2 }); });
        s += `<circle class="fwb-read" cx="${pos[0][0]}" cy="${pos[0][1]}" r="${r + 5}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
        // the three chains of the antibody example as barcodes
        const by0 = L.tall ? y0 + 3 * rowH + 40 : 330;
        s += T(L.tall ? 30 : 82, by0, 'Our example, one bar per amino acid', { size: L.tall ? 20 : 18, w: 700, an: 'a', d: 1.5 });
        const bw = L.tall ? 3.6 : 6.6, bx = L.tall ? 30 : 330, bh = L.tall ? 30 : 34;
        d.chains.forEach((c, k) => {
          const y = L.tall ? by0 + 30 + k * 92 : by0 + 34 + k * 64;
          const lab = ['antibody light chain', 'antibody heavy chain', 'HER2 domain IV'][k];
          s += T(L.tall ? 30 : 82, L.tall ? y + 12 : y + bh / 2 + 6, lab, { size: L.tall ? 18 : 17, w: 600, fill: CHAIN[k], an: 'a', d: 1.6 + k * 0.25 });
          const yb = L.tall ? y + 22 : y;
          let bars = ''; [...c.seq].forEach((a, i) => { bars += R_(bx + i * bw, yb, bw - (L.tall ? 0.8 : 1.4), bh, aaCol(a), { rx: 1 }); });
          s += G(bars, { an: 'grow', d: 1.7 + k * 0.25 });
          s += T(bx + c.seq.length * bw + 12, yb + bh / 2 + 6, String(c.seq.length), { size: L.tall ? 18 : 17, w: 700, mono: true, an: 'a', d: 2.2 + k * 0.25 });
        });
        // legend of the colours
        const lg = Object.keys(CLS).map((key) => [CLS[key].c, CLS[key].name.toLowerCase()]);
        let lx = L.tall ? 30 : 640; const ly = L.tall ? L.H - 46 : by0;
        lg.forEach(([c, t], k) => { s += G(R_(lx, ly - 13, 16, 16, c, { rx: 3 }) + T(lx + 24, ly + 1, t, { size: L.tall ? 17 : 15.5, fill: MUTED }), { an: 'a', d: 2.6 + k * 0.05 }); lx += (L.tall ? 32 : 34) + t.length * (L.tall ? 9 : 8.4); });
        el.querySelector('.fwb-under').innerHTML = FW.h.DEFS + s;
        el.classList.remove('play'); ctx.play();
        // a reading head runs along the sequence
        const ring = el.querySelector('.fwb-read');
        let i = 0; const step = () => { const p = pos[i % pos.length]; ring.setAttribute('cx', p[0]); ring.setAttribute('cy', p[1]); i++; ctx.later(i % pos.length === 0 ? 900 : 150, step); };
        ctx.later(1800, step);
      });
    },
  });

  // ------------------------------------------------------------------ 4 · folding (villin, from an extended chain to the native fold)
  function foldPlan(v) {
    const P = centre(v.P), n = P.length, nat = internal(P);
    const ext = { bl: nat.bl, th: nat.th.map(() => (150 * Math.PI) / 180), tau: nat.tau.map(() => Math.PI) };
    // helices of villin headpiece HP36 (residues 44–51, 55–59, 63–73 in PDB numbering; first residue is 41)
    const helix = new Int8Array(n); [[3, 10, 1], [14, 18, 2], [22, 32, 3]].forEach(([a, b, h]) => { for (let i = a; i <= b; i++) helix[i] = h; });
    const win = (i, j) => (helix[i] && helix[i] === helix[j] ? [0, 0.42] : [0.3, 1]);
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const at = (u) => {
      const th = nat.th.map((t, i) => { const [a, b] = win(i - 1, i + 1); const e = easeIO((u - a) / (b - a)); return ext.th[i] + (t - ext.th[i]) * e; });
      const tau = nat.tau.map((t, i) => { const [a, b] = win(i - 1, i + 2); const e = easeIO((u - a) / (b - a)); return ext.tau[i] + wrapA(t - ext.tau[i]) * e; });
      return centre(build({ bl: nat.bl, th, tau }));
    };
    return { P, n, at, helix };
  }
  FW.step({
    chapter: 'bio', id: 'fold', title: 'Folding', caption: 'the chain folds itself', duration: 16000,
    points: ['In water the chain folds by itself: <b>oily</b> side chains (amber) hide inside, water-loving ones stay on the surface.',
      'Local pieces coil into <b>helices</b> first, then pack together. Villin headpiece does this in a few microseconds, every time, into the same shape.'],
    principle: 'The sequence alone decides the shape — which is why predicting the shape from the sequence is possible at all.',
    render(el, ctx) {
      const L = lay();
      const H = head(L, 'The chain folds itself into its shape', L.tall ? 'Villin headpiece, real coordinates (PDB 1VII).' : 'Villin headpiece, 36 amino acids: three helices wrapped around an oily core. End state = real coordinates (PDB 1VII).');
      const { cv, over } = stage(el, L, H.s + foot(L, 'the path is drawn, not simulated; the final shape is PDB 1VII'));
      ctx.play();
      const cam = canvasCam(el, cv, L);
      return withData(['1vii'], (v) => {
        const plan = foldPlan(v), seq = v.chains[0].seq;
        const view = matMul(rotX(-0.25), pcaView(plan.P)), natView = plan.P.map((p) => matVec(view, p));
        let prev = null, q = null, kk = null;
        const cx = L.W / 2, cy = L.tall ? H.y + (L.H - H.y) / 2 - 10 : 345;
        const F_IDX = [6, 10, 17];
        const T0 = 1400, TF = 7600;
        loop(ctx, cam, (ms) => {
          const g = cam.g, u = clamp01((ms - T0) / TF);
          let X = plan.at(u);
          if (!prev) {
            const ax = sub3(X[X.length - 1], X[0]), ang = Math.atan2(ax[1], ax[0]);
            X = X.map((p) => matVec(rotZ(-ang), p));
          } else {
            const beta = smooth((u - 0.55) / 0.45);
            const Y = prev.map((p, i) => add3(mul3(p, 1 - beta), mul3(natView[i], beta)));
            const fr = fitRot(X, Y, q); q = fr.q; X = X.map((p) => matVec(fr.R, p));
          }
          prev = X;
          const spin = ms > T0 + TF ? rotY(0.55 * Math.sin((ms - T0 - TF) / 2600)) : rotY(0);
          const Xs = X.map((p) => matVec(spin, p));
          let ex = 0, ey = 0; Xs.forEach((p) => { ex = Math.max(ex, Math.abs(p[0])); ey = Math.max(ey, Math.abs(p[1])); });
          const kt = Math.min((L.W / 2 - (L.tall ? 50 : 70)) / (ex + 2), (L.tall ? 250 : 190) / (ey + 2), L.tall ? 15 : 16.5);
          kk = kk == null ? kt : kk + (kt - kk) * 0.06;
          const pj = projector([[1, 0, 0], [0, 1, 0], [0, 0, 1]], [0, 0, 0], cx, cy, kk, 200);
          const Q = Xs.map(pj), items = [];
          const shown = (i) => smooth((ms - 200 - i * 28) / 260);
          const coreOn = smooth((ms - T0 - TF - 1400) / 800);
          const helixOn = smooth((ms - T0 - TF * 0.3) / 1500);
          beadItems(items, Xs, pj, seq, kk, {
            shown, r: 1.36 - 0.3 * smooth((u - 0.5) / 0.5), tw: 0.75 + 0.25 * smooth((u - 0.5) / 0.5),
            tubeCol: (i) => (plan.helix[i] ? mixc(TUBE, TUBE_H, helixOn) : TUBE),
            col: (i) => { const c = rgbOf(aaCol(seq[i])); return coreOn > 0 && !F_IDX.includes(i) ? mixc(c, WHITE, 0.38 * coreOn) : c; },
            ring: (i) => (F_IDX.includes(i) && coreOn > 0 ? css(rgbOf(INK), coreOn) : '#fff'), sw: (i) => (F_IDX.includes(i) && coreOn > 0 ? 3 : 2),
          });
          draw3d(g, items, 0.42);
          // N and C labels while extended
          const ext = 1 - smooth((ms - T0) / 1200);
          if (ext > 0) {
            label(g, Q[0].x - 2.6 * kk, Q[0].y, 'N', { size: 20, w: 750, c: MUTED, align: 'right', a: ext * shown(0) });
            label(g, Q[Q.length - 1].x + 2.6 * kk, Q[Q.length - 1].y, 'C', { size: 20, w: 750, c: MUTED, a: ext * shown(35) });
          }
          // after folding: helices, then the core
          const hl = smooth((ms - T0 - TF + 200) / 700);
          if (hl > 0) {
            const mc = Q.reduce((s, p) => [s[0] + p.x / Q.length, s[1] + p.y / Q.length], [0, 0]);
            const maxR = Math.max(...Q.map((p) => Math.hypot(p.x - mc[0], p.y - mc[1])));
            [1, 2, 3].forEach((h) => {
              const idx = []; plan.helix.forEach((v2, i) => { if (v2 === h) idx.push(i); });
              const hx = idx.reduce((s, i) => s + Q[i].x, 0) / idx.length, hy = idx.reduce((s, i) => s + Q[i].y, 0) / idx.length;
              const dx = hx - mc[0], dy = hy - mc[1], dl = Math.hypot(dx, dy) || 1;
              const lx = mc[0] + (dx / dl) * (maxR + 52), ly = mc[1] + (dy / dl) * (maxR * 0.8 + 34);
              const sx = lx - (dx / dl) * 34, sy = ly - (dy / dl) * 16, ne = nearest(idx.map((i) => Xs[i]), pj, sx, sy);
              leader(g, sx, sy, ne.x, ne.y, INK, hl * (1 - 0.4 * coreOn));
              label(g, lx, ly, `helix ${h}`, { size: L.tall ? 21 : 20, w: 700, c: INK, align: 'center', a: hl * (1 - 0.4 * coreOn) });
            });
            if (coreOn > 0) {
              const fx = F_IDX.reduce((s, i) => s + Q[i].x, 0) / 3, fy = F_IDX.reduce((s, i) => s + Q[i].y, 0) / 3;
              const lx = L.tall ? L.W / 2 : cx + 300, ly = L.tall ? cy + 270 : cy + 130;
              const ne = nearest(F_IDX.map((i) => Xs[i]), pj, lx, ly); void fx; void fy;
              leader(g, lx - (L.tall ? 0 : 12), ly - (L.tall ? 30 : 0), ne.x, ne.y, AMBER, coreOn);
              label(g, lx, ly - (L.tall ? 12 : 10), 'oily core', { size: 21, w: 750, c: '#9a6a0c', align: L.tall ? 'center' : 'left', a: coreOn });
              label(g, lx, ly + (L.tall ? 14 : 16), 'three F (phenylalanine)', { size: L.tall ? 18 : 16, w: 500, c: MUTED, align: L.tall ? 'center' : 'left', a: coreOn });
            }
          }
          // time stamp
          const ph = ms < T0 ? 'unfolded chain' : u < 0.42 ? 'helices form' : u < 1 ? 'helices pack' : 'folded';
          over.querySelector('.fwb-ph') ? (over.querySelector('.fwb-ph').textContent = ph) : (over.innerHTML += T(L.tall ? 30 : 56, L.tall ? H.y + 6 : 150, ph, { size: L.tall ? 19 : 17, mono: true, fill: BLUE, cls: 'fwb-ph' }));
        });
      });
    },
  });

  // ------------------------------------------------------------------ 5 · a structure is coordinates
  FW.step({
    chapter: 'bio', id: 'coords', title: 'A structure is coordinates', caption: 'a structure is a list of numbers', duration: 13000,
    points: ['A structure is nothing more than a position <b>(x, y, z)</b> for every atom, in ångström (0.1 nm).',
      'This list of numbers is what a structure predictor has to output. Turning the molecule changes every number but not the structure.'],
    principle: 'The output is a 3 × N matrix: three numbers for each of the N atoms.',
    render(el, ctx) {
      const L = lay();
      const H = head(L, 'A structure is just a list of coordinates', L.tall ? 'Three numbers per atom.' : 'Three numbers per atom — the position in space, in ångström. This is what the model must produce.');
      const { cv, over } = stage(el, L, H.s);
      ctx.play();
      const cam = canvasCam(el, cv, L);
      return withData(['1vii'], (v) => {
        const seq = v.chains[0].seq, P = v.P, n = P.length;
        const heavy = heavyAtoms(seq);
        // the table
        const tx = L.tall ? 40 : 700, ty = L.tall ? H.y + 340 : 150, rh = L.tall ? 34 : 38, rows = L.tall ? 5 : 9;
        const cols = L.tall ? [tx, tx + 120, tx + 250, tx + 360, tx + 460] : [tx, tx + 120, tx + 270, tx + 400, tx + 520];
        let t = '';
        t += T(cols[0], ty, 'atom', { size: 15, mono: true, fill: MUTED, an: 'a', d: 0.3 }) + T(cols[2], ty, 'x', { size: 17, mono: true, w: 700, anchor: 'end', an: 'a', d: 0.3 }) + T(cols[3], ty, 'y', { size: 17, mono: true, w: 700, anchor: 'end', an: 'a', d: 0.3 }) + T(cols[4], ty, 'z', { size: 17, mono: true, w: 700, anchor: 'end', an: 'a', d: 0.3 });
        t += Ln(tx, ty + 12, cols[4] + 4, ty + 12, LINE, 1.2, { an: 'a', d: 0.3 });
        const top = ty + 22, mid = top + Math.floor(rows / 2) * rh;
        t += R_(tx - 12, mid, cols[4] - tx + 28, rh, BLUE, { rx: 8, op: 0.1, an: 'a', d: 0.5 });
        let body = '';
        P.forEach((p, i) => {
          const y = i * rh + rh * 0.68;
          body += `<g class="fwb-row" data-i="${i}">` + T(cols[0], y, `Cα ${String(i + 1).padStart(2, ' ')}`, { size: 17, mono: true, fill: MUTED, attr: ' xml:space="preserve"' }) + T(cols[1], y, seq[i], { size: 18, w: 750, fill: aaCol(seq[i]) }) +
            [0, 1, 2].map((k) => T(cols[k + 2], y, p[k].toFixed(2).replace('-', '−'), { size: 17, mono: true, anchor: 'end' })).join('') + '</g>';
        });
        t += `<clipPath id="fwbclip"><rect x="${tx - 14}" y="${top}" width="${cols[4] - tx + 40}" height="${rows * rh}"/></clipPath>`;
        t += `<g clip-path="url(#fwbclip)"><g class="fwb-tbl" style="transform: translateY(${top}px)">${body}</g></g>`;
        // fade top and bottom rows
        t += `<linearGradient id="fwbfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.28" stop-color="#fff" stop-opacity="0"/><stop offset="0.72" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>`;
        t += R_(tx - 14, top, cols[4] - tx + 40, rows * rh, 'url(#fwbfade)');
        // the matrix it adds up to
        const fy = top + rows * rh + (L.tall ? 50 : 56);
        t += T(tx, fy, `<tspan font-style="italic">x</tspan> ∈ ℝ<tspan dy="-13" font-size="19">3 × N</tspan>`, { size: 32, w: 600, raw: true, an: 'a', d: 1.2 });
        t += T(tx + (L.tall ? 190 : 200), fy - 9, `N = ${n} Cα atoms drawn here,`, { size: L.tall ? 17 : 16, fill: MUTED, an: 'a', d: 1.4 });
        t += T(tx + (L.tall ? 190 : 200), fy + 14, `N = ${heavy} with every heavy atom`, { size: L.tall ? 17 : 16, fill: MUTED, an: 'a', d: 1.5 });
        over.innerHTML = FW.h.DEFS + t;
        el.classList.remove('play'); ctx.play();
        const tbl = over.querySelector('.fwb-tbl');
        let cur = 0;
        const setRow = (i) => { cur = i; tbl.style.transform = `translateY(${top + (Math.floor(rows / 2) - i) * rh}px)`; over.querySelectorAll('.fwb-row').forEach((r) => r.classList.toggle('fwb-on', +r.dataset.i === i)); };
        setRow(0);
        let i = 0; const adv = () => { i = (i + 1) % n; setRow(i); ctx.later(i === 0 ? 1400 : 700, adv); };
        ctx.later(1600, adv);
        // the molecule with its axes
        const cx = L.tall ? L.W / 2 + 20 : 330, cy = L.tall ? H.y + 165 : 335, k = L.tall ? 9.2 : 13.5;
        const P0 = centre(P), view = matMul(rotX(-0.25), pcaView(P0));
        loop(ctx, cam, (ms) => {
          const g = cam.g, R = matMul(rotY(0.45 * Math.sin(ms / 3000)), view);
          const pj = projector(R, [0, 0, 0], cx, cy, k, 200), Q = P0.map(pj), items = [];
          beadItems(items, P0, pj, seq, k, { r: 1.1, tw: 1.0, col: (j) => (j === cur ? rgbOf(BLUE) : mixc(rgbOf(aaCol(seq[j])), WHITE, 0.4)), ring: (j) => (j === cur ? INK : '#fff'), sw: (j) => (j === cur ? 3 : 2) });
          draw3d(g, items, 0.35);
          // axes (they turn with the molecule: the numbers are in the molecule's frame)
          const ox = L.tall ? 64 : 110, oy = L.tall ? H.y + 90 : 515, al = L.tall ? 38 : 46;
          ['x', 'y', 'z'].forEach((nm, a) => {
            const e = [0, 0, 0]; e[a] = 1; const q = matVec(R, e), ex = ox + q[0] * al, ey = oy - q[1] * al;
            g.strokeStyle = MUTED; g.lineWidth = 2; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ex, ey); g.stroke();
            label(g, ox + q[0] * (al + 14), oy - q[1] * (al + 14), nm, { size: 16, w: 700, c: MUTED, align: 'center' });
          });
          // a pointer from the highlighted atom to its row
          const p = Q[cur];
          if (!L.tall) {
            const ry = mid + rh / 2;
            g.globalAlpha = 0.35; g.strokeStyle = BLUE; g.lineWidth = 1.5; g.setLineDash([3, 5]);
            g.beginPath(); g.moveTo(p.x + 1.6 * k + 4, p.y); g.bezierCurveTo(p.x + 140, p.y, tx - 140, ry, tx - 16, ry); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
          }
        });
      });
    },
  });

  // ------------------------------------------------------------------ 6 · proteins bind
  FW.step({
    chapter: 'bio', id: 'bind', title: 'Proteins bind', caption: 'proteins work in pairs and teams', duration: 12500,
    points: ['Most proteins do their job by <b>binding</b> other molecules: surfaces that fit each other like a hand in a glove.',
      'The contact is a small patch, the <b>interface</b>: here 38 of 345 amino acids (amber) sit within 8 Å of the partner.'],
    principle: 'A co-folding model predicts the chains together, interface included — not each chain on its own.',
    render(el, ctx) {
      const L = lay();
      const H = head(L, 'Proteins work by binding each other', L.tall ? 'The antibody grips HER2 at a small patch.' : 'The antibody (blue) finds HER2 (orange) and grips it at a small patch: the interface.');
      const { cv } = stage(el, L, H.s + foot(L, 'PDB 1N8Z · interface: Cβ atoms within 8 Å of the other side'));
      ctx.play();
      const cam = canvasCam(el, cv, L);
      return withData(['1n8z'], (d) => {
        const cx = L.tall ? 260 : 620, cy = L.tall ? 480 : 340, k = L.tall ? 4.9 : 6.2;
        const iface = []; d.iface.forEach((f, i) => { if (f) iface.push(i); });
        const ab = iface.filter((i) => d.chain_of[i] < 2), ag = iface.filter((i) => d.chain_of[i] === 2);
        loop(ctx, cam, (ms) => {
          const g = cam.g;
          const dock = easeOut((ms - 900) / 2600), off = (1 - dock) * 58, spin = (1 - dock) * 0.9;
          const a = ms > 3500 ? 0.26 * Math.sin((ms - 3500) / 3600) : 0;
          const R = matMul(rotY(a), matMul(rotX(0.18), d.R0)), pj = projector(R, d.ctr, cx, cy, k);
          const rot = matMul(matMul([[1, 0, 0], [0, 1, 0], [0, 0, 1]], rotX(spin)), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
          // rotate HER2 about its own centre around the binding axis, then shift it out along it
          const e1 = d.e1, Rax = axisRot(e1, spin);
          const items = complexItems(d, pj, { shift: [null, null, mul3(e1, off)], rot: [null, null, Rax], rotC: d.cH, w: L.tall ? 5.4 : 6.4, alpha: [1, 1, smooth(ms / 500)] });
          const ion = (j) => smooth((ms - 3700 - j * 26) / 300);
          iface.forEach((i, j) => {
            const p = pj(i >= d.start[2] ? add3(add3(matVec(Rax, sub3(d.P[i], d.cH)), d.cH), mul3(e1, off)) : d.P[i]);
            const s = ion(j); if (s > 0) items.push({ t: 'b', x: p.x, y: p.y, z: p.z + 2, r: 1.7 * k * p.s * s, c: rgbOf(CONTACT), sw: 1.8 });
          });
          draw3d(g, items, 0.55);
          const la = smooth((ms - 300) / 600);
          const cA = pj(d.cF), cH = pj(add3(d.cH, mul3(e1, off)));
          label(g, L.tall ? 40 : cx - 360, L.tall ? cy + 230 : cy + 170, 'antibody', { size: 22, w: 750, c: BLUE, a: la });
          label(g, L.tall ? 480 : cx + 380, L.tall ? cy - 240 : cy - 170, 'HER2', { size: 22, w: 750, c: RUST, align: 'right', a: la });
          const li = smooth((ms - 4600) / 600);
          if (li > 0) {
            const lx = L.tall ? 260 : cx + 250, ly = L.tall ? cy + 285 : cy + 150;
            const ic = nearest(iface.map((i) => d.P[i]), pj, L.tall ? lx : lx - 14, L.tall ? ly - 30 : ly - 10);
            leader(g, L.tall ? lx : lx - 14, L.tall ? ly - 30 : ly - 10, ic.x, ic.y, '#9a6a0c', li);
            label(g, lx, ly - 8, 'interface', { size: 22, w: 750, c: '#9a6a0c', align: L.tall ? 'center' : 'left', a: li });
            label(g, lx, ly + (L.tall ? 18 : 16), `${ab.length} + ${ag.length} amino acids in contact`, { size: L.tall ? 18 : 16, w: 500, c: MUTED, align: L.tall ? 'center' : 'left', a: li });
          }
          void rot; void cA; void cH;
        });
      });
    },
  });
  function axisRot(u, a) {
    const [x, y, z] = u, c = Math.cos(a), s = Math.sin(a), t = 1 - c;
    return [[t * x * x + c, t * x * y - s * z, t * x * z + s * y], [t * x * y + s * z, t * y * y + c, t * y * z - s * x], [t * x * z - s * y, t * y * z + s * x, t * z * z + c]];
  }

  // ------------------------------------------------------------------ 7 · antibodies
  // the Y: domains as rounded capsules; hinge at (0, 0); returns svg and anchor points (local units)
  function ySchematic() {
    const dw = 40, dl = 50, th = (32 * Math.PI) / 180, out = { s: '', pt: {} };
    const dom = (x, y, c, deg) => R_(x - dw / 2, y - dl / 2, dw, dl, c, { rx: 17, stroke: '#fff', sw: 2.5, attr: ` transform="rotate(${deg.toFixed(1)} ${f1(x)} ${f1(y)})"` });
    let s = '';
    [[-22, 42], [22, 42], [-22, 96], [22, 96]].forEach(([x, y]) => { s += dom(x, y, INK, 0); });
    let hinge = '', arms = '', loops = '';
    [-1, 1].forEach((sd) => {
      const dir = [sd * Math.sin(th), -Math.cos(th)], perp = [-dir[1], dir[0]], n = [-sd * perp[0], -sd * perp[1]];
      const B = [sd * 12, -10], at = (t, o) => [B[0] + dir[0] * t + n[0] * o, B[1] + dir[1] * t + n[1] * o];
      const deg = sd * 32;
      const hC = at(42, 21), lC = at(42, -21), hV = at(94, 21), lV = at(94, -21);
      arms += dom(hC[0], hC[1], INK, deg) + dom(lC[0], lC[1], BLUE, deg) + dom(hV[0], hV[1], INK, deg) + dom(lV[0], lV[1], BLUE, deg);
      const hb = at(17, 21); hinge += Ln(hb[0], hb[1], sd * 22, 17, INK, 3.2, { cap: 'round' });
      [hV, lV].forEach((c) => [-11, 0, 11].forEach((o) => {
        const p = [c[0] + dir[0] * 26 + n[0] * o, c[1] + dir[1] * 26 + n[1] * o];
        loops += Pa(`M${f1(p[0] - n[0] * 4)},${f1(p[1] - n[1] * 4)} Q${f1(p[0] + dir[0] * 13)},${f1(p[1] + dir[1] * 13)} ${f1(p[0] + n[0] * 4)},${f1(p[1] + n[1] * 4)}`, { stroke: CONTACT, sw: 3.4, cap: 'round' });
      }));
      out.pt[sd < 0 ? 'L' : 'R'] = { hV, lV, hC, lC, tip: at(124, 0) };
    });
    out.s = hinge + s + arms + loops;
    return out;
  }
  FW.step({
    chapter: 'bio', id: 'antibody', title: 'Antibodies', caption: 'the antibody, and where it touches', duration: 15000,
    points: ['An <b>antibody</b> is a Y of four chains: two heavy, two light. Its two arms end in identical binding tips.',
      'Each tip carries six loops, the <b>CDRs</b> (complementarity-determining regions). They vary from antibody to antibody and make the contact — the hardest part of the structure to predict.'],
    principle: 'The body makes billions of different antibodies, all with the same frame and different loops.',
    render(el, ctx) {
      const L = lay();
      const H = head(L, 'An antibody grips its target with six loops', L.tall ? 'The Y-shaped antibody, and its binding tip in 3D.' : 'Four chains form a Y. At the tip of each arm, six loops (CDRs) touch the target.');
      const ys = L.tall ? 1.2 : 1.32, yx = L.tall ? 150 : 250, yy = L.tall ? H.y + 175 : 352;
      const Y = ySchematic(), at = (p) => [yx + p[0] * ys, yy + p[1] * ys];
      let s = H.s;
      s += G(G(Y.s, { an: 'a', d: 0.2 }), { tr: `translate(${yx} ${yy}) scale(${ys})` });
      const lab = (x, y, t, c, anc, d, sz, w) => T(x, y, t, { size: sz || (L.tall ? 18 : 17), w: w || 650, fill: c, anchor: anc || 'start', an: 'a', d });
      const lV = at(Y.pt.L.lV), hS = at([-22, 96]), stem = at([22, 69]);
      s += L.tall ? lab(24, yy + 84, 'light', BLUE, 'start', 0.7) + lab(24, yy + 106, 'chain ×2', BLUE, 'start', 0.7) : lab(lV[0] - 20, lV[1] - 84, 'light chain ×2', BLUE, 'middle', 0.7);
      s += L.tall ? lab(stem[0] + 34, stem[1] + 6, 'heavy chain ×2', INK, 'start', 0.75) : lab(hS[0] - 34, hS[1] + 6, 'heavy chain ×2', INK, 'end', 0.75);
      if (!L.tall) s += lab(stem[0] + 34, stem[1] - 4, 'stem', INK, 'start', 0.85) + lab(stem[0] + 34, stem[1] + 18, 'signals to immune cells', MUTED, 'start', 0.9, 15, 400);
      const tip = at(Y.pt.R.tip);
      // zoom panel
      const pz = L.tall ? { x: 24, y: H.y + 326, w: 472, h: 366 } : { x: 560, y: 122, w: 640, h: 430 };
      s += R_(pz.x, pz.y, pz.w, pz.h, '#fff', { rx: 14, stroke: LINE, sw: 1.2, an: 'a', d: 1.3 });
      s += T(pz.x + 18, pz.y + 30, 'the tip in 3D · trastuzumab', { size: 15, mono: true, fill: MUTED, an: 'a', d: 1.4 });
      // zoom lines from the right arm's tip (approximate tip box in stage coordinates)
      const tipX = tip[0] - 6, tipY = tip[1] + 18;
      s += lab(tipX + (L.tall ? 56 : 4), tipY - (L.tall ? 40 : 88), 'binding tip', '#9a6a0c', L.tall ? 'start' : 'middle', 1.0) + lab(tipX + (L.tall ? 56 : 4), tipY - (L.tall ? 18 : 66), '6 loops (CDRs)', MUTED, L.tall ? 'start' : 'middle', 1.05, 15, 500);
      s += Pa(`M${tipX},${tipY - 20} L${pz.x},${pz.y + 14} M${tipX},${tipY + 20} L${pz.x},${pz.y + pz.h - 14}`, { stroke: INK, sw: 1, dash: '3 5', op: 0.35, an: 'a', d: 1.3 });
      if (L.tall) s = s.replace(`M${tipX},${tipY - 20} L${pz.x},${pz.y + 14} M${tipX},${tipY + 20} L${pz.x},${pz.y + pz.h - 14}`, `M${tipX - 20},${tipY} L${pz.x + 14},${pz.y} M${tipX + 20},${tipY} L${pz.x + pz.w - 14},${pz.y}`);
      s += Ci(tipX, tipY, ys * 34, 'none', { stroke: '#9a6a0c', sw: 1.6, an: 'a', d: 1.2, attr: ' stroke-dasharray="4 4"' });
      const { cv } = stage(el, L, s + (L.tall ? '' : foot(L, 'PDB 1N8Z · CDRs by Kabat definition')));
      ctx.play();
      const cam = canvasCam(el, cv, L);
      return withData(['1n8z'], (d) => {
        const cdrC = centroid(d.cdr.flatMap((c) => d.P.slice(c.i0, c.i1 + 1)));
        const ctr = add3(mul3(d.cF, 0.55), mul3(cdrC, 0.45));
        const cx = pz.x + pz.w * (L.tall ? 0.4 : 0.4), cy = pz.y + pz.h * 0.54, k = L.tall ? 5.0 : 7.4;
        loop(ctx, cam, (ms) => {
          const g = cam.g, on = smooth((ms - 1500) / 800), cdrOn = smooth((ms - 2600) / 900);
          if (on <= 0) return;
          g.save(); g.beginPath(); g.rect(pz.x + 1, pz.y + 40, pz.w - 2, pz.h - 42); g.clip();
          const a = 0.3 * Math.sin(ms / 3800);
          const R = matMul(rotY(a - 0.25), matMul(rotX(0.2), d.R0)), pj = projector(R, ctr, cx, cy, k);
          const items = complexItems(d, pj, {
            w: L.tall ? 5.2 : 6.6, alpha: [on, on, on], fade: [0, 0, 0.62],
            colOf: (kk, i) => (d.isCdr[i] && cdrOn > 0 ? mixc(rgbOf(CHAIN[kk]), rgbOf(CONTACT), cdrOn) : rgbOf(CHAIN[kk])),
          });
          draw3d(g, items, 0.5);
          g.restore();
          if (cdrOn > 0) {
            // CDR labels next to their loops, pushed away from the centre of the binding site
            const fc = pj(d.cF), pos = d.cdr.map((c) => ({ c, p: pj(centroid(d.P.slice(c.i0, c.i1 + 1))) }));
            const mid = pos.reduce((m, o) => [m[0] + o.p.x / pos.length, m[1] + o.p.y / pos.length], [0, 0]);
            pos.forEach((o) => {
              let dx = o.p.x - (mid[0] * 0.5 + fc.x * 0.5), dy = o.p.y - mid[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
              const lx = o.p.x + dx * 46, ly = o.p.y + dy * 40;
              leader(g, lx - dx * 14, ly - dy * 12, o.p.x, o.p.y, '#9a6a0c', cdrOn * 0.9);
              label(g, lx, ly, o.c.name, { size: 19, w: 750, c: '#9a6a0c', align: 'center', a: cdrOn });
            });
            label(g, pz.x + pz.w - 24, pz.y + pz.h * 0.5, 'HER2', { size: 20, w: 750, c: RUST, align: 'right', a: on * 0.85 });
            label(g, pz.x + 24, pz.y + pz.h * 0.33, 'heavy', { size: 17, w: 650, c: INK, a: on });
            label(g, pz.x + 24, pz.y + pz.h * 0.72, 'light', { size: 17, w: 650, c: BLUE, a: on });
          }
        });
      });
    },
  });

  // ------------------------------------------------------------------ 8 · why predict
  FW.step({
    chapter: 'bio', id: 'gap', title: 'Why predict structures', caption: 'sequences are cheap, structures are not', duration: 12000,
    points: ['Reading a sequence is fast and cheap; about <b>200 million</b> protein sequences are known (UniProt, 2026).',
      'Measuring a structure — X-ray crystallography, cryo-EM, NMR — takes months to years. About <b>250,000</b> are known (Protein Data Bank): one for every 800 sequences.'],
    principle: 'Most proteins will never be measured. Their structure has to be predicted from the sequence.',
    render(el, ctx) {
      const L = lay();
      const H = head(L, 'Sequences are cheap, structures are not', L.tall ? 'Known protein sequences vs. measured structures.' : 'Every dot is 250,000 known protein sequences. All the structures ever measured fill one dot.');
      let s = H.s;
      const cols = 29, rows = 28, n = 812, pitch = L.tall ? 13.4 : 14.2;
      const gx = L.tall ? (L.W - (cols - 1) * pitch) / 2 : 700, gy = L.tall ? H.y + 210 : 152;
      let dots = '';
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        if (i === 0) continue;
        dots += Ci(gx + c * pitch, gy + r * pitch, pitch * 0.33, INK, { op: 0.22 });
      }
      // build by rows
      let rowsSvg = '';
      const per = dots.split('/>').filter(Boolean).map((x) => x + '/>');
      for (let r = 0; r < rows; r++) rowsSvg += G(per.slice(Math.max(0, r * cols - 1), (r + 1) * cols - 1).join(''), { an: 'a', d: 0.5 + r * 0.035 });
      s += rowsSvg;
      s += Ci(gx, gy, pitch * 0.42, RUST, { an: 'pop', d: 2.0 });
      s += `<circle cx="${gx}" cy="${gy}" r="${pitch * 0.9}" fill="none" stroke="${RUST}" stroke-width="2" class="fwb-ping"/>`;
      // stats
      const sx = L.tall ? 30 : 56, sy = L.tall ? H.y + 34 : 230;
      if (!L.tall) {
        s += T(sx, sy, '200,000,000', { size: 54, w: 780, ls: -1.5, an: 'a', d: 0.4 }) + T(sx, sy + 32, 'protein sequences known · UniProt', { size: 18, fill: MUTED, an: 'a', d: 0.5 });
        s += T(sx, sy + 150, '250,000', { size: 54, w: 780, ls: -1.5, fill: RUST, an: 'a', d: 2.0 }) + T(sx, sy + 182, 'structures measured · Protein Data Bank', { size: 18, fill: MUTED, an: 'a', d: 2.1 });
        s += T(sx, sy + 210, 'each takes months to years in the lab', { size: 18, fill: MUTED, an: 'a', d: 2.2 });
        s += Pa(`M${gx - 14},${gy} C${gx - 80},${gy} ${sx + 330},${sy + 110} ${sx + 290},${sy + 120}`, { stroke: RUST, sw: 1.5, op: 0.6, an: 'draw', d: 2.3, dash: '3 5' });
        s += T(gx + (cols - 1) * pitch, gy + rows * pitch + 24, '1 dot = 250,000 sequences', { size: 15, mono: true, fill: MUTED, anchor: 'end', an: 'a', d: 1.6 });
      } else {
        s += T(sx, sy, '200,000,000', { size: 42, w: 780, ls: -1, an: 'a', d: 0.4 }) + T(sx, sy + 28, 'protein sequences known (UniProt)', { size: 18, fill: MUTED, an: 'a', d: 0.5 });
        s += T(sx, sy + 100, '250,000', { size: 42, w: 780, ls: -1, fill: RUST, an: 'a', d: 2.0 }) + T(sx, sy + 128, 'structures measured (PDB) · months each', { size: 18, fill: MUTED, an: 'a', d: 2.1 });
        s += T(gx, gy + rows * pitch + 14, '1 dot = 250,000 sequences', { size: 17, mono: true, fill: MUTED, an: 'a', d: 1.6 });
      }
      stage(el, L, s + foot(L, L.tall ? 'UniProtKB 2026_01 · PDB early 2026' : 'UniProtKB 2026_01: 203 million entries · PDB: ~250,000 entries'));
      ctx.play();
    },
  });

  // ------------------------------------------------------------------ 9 · the task
  FW.step({
    chapter: 'bio', id: 'task', title: 'The prediction task', caption: 'sequences in, coordinates out', duration: 13000,
    points: ['The input is the <b>sequences</b> of all chains, plus <b>related sequences</b> from other species aligned to them (an MSA): positions that mutate together tend to touch.',
      'The output is the coordinates of every atom of the whole complex, chains placed relative to each other.'],
    principle: 'Co-folding: one model predicts all chains together, from sequence to coordinates.',
    render(el, ctx) {
      const L = lay();
      const H = head(L, 'The task: sequences in, coordinates out', L.tall ? 'What a co-folding model is given, and what it returns.' : 'A co-folding model reads the chains’ sequences and returns every atom’s position.');
      let s = H.s;
      const { cv } = stage(el, L, s);
      const cam = canvasCam(el, cv, L);
      return withData(['1n8z'], (d) => {
        const x0 = L.tall ? 30 : 56, y0 = L.tall ? H.y + 30 : 168;
        const nShow = L.tall ? 18 : 22, cw = L.tall ? 13.6 : 13.2;
        s += T(x0, y0 - 12, 'INPUT', { size: 15, mono: true, fill: MUTED, ls: 1.5, an: 'a', d: 0.2 });
        d.chains.forEach((c, k) => {
          const y = y0 + 16 + k * (L.tall ? 62 : 62);
          s += G(T(x0, y + 4, ['light chain', 'heavy chain', 'HER2'][k], { size: L.tall ? 17 : 16, w: 700, fill: CHAIN[k] }) +
            T(x0, y + 30, c.seq.slice(0, nShow) + ' …', { size: L.tall ? 19 : 18, mono: true, fill: INK, ls: 0.6 }) +
            T(x0 + (nShow + 2.2) * cw + 18, y + 30, `${c.seq.length}`, { size: 16, mono: true, fill: MUTED }), { an: 'a', d: 0.3 + k * 0.15 });
        });
        // the MSA: the real heavy-chain start on top, variants below (schematic)
        const my = y0 + (L.tall ? 214 : 228);
        s += T(x0, my, L.tall ? '+ related sequences (MSA, schematic)' : '+ related sequences (MSA)', { size: L.tall ? 17 : 16, w: 700, fill: INK, an: 'a', d: 0.9 });
        const top = d.chains[1].seq.slice(0, nShow), rr = FW.h.rnd(17), letters = 'AVLIMFWSTNQYKRHDEGPC';
        const cons = new Set([3, 4, 5, 9, 14, 15, 16, 21]);
        for (let r = 0; r < 5; r++) {
          let line = '';
          [...top].forEach((a, j) => {
            const mut = r > 0 && !cons.has(j) && rr() < 0.32, b = mut ? letters[Math.floor(rr() * 20)] : a;
            line += `<tspan fill="${mut ? aaCol(b) : INK}" fill-opacity="${mut ? 1 : r ? 0.28 : 1}" font-weight="${mut ? 700 : 400}">${b}</tspan>`;
          });
          s += T(x0, my + 28 + r * (L.tall ? 25 : 24), line, { size: L.tall ? 19 : 18, mono: true, ls: 0.6, raw: true, an: 'a', d: 1.0 + r * 0.08 });
        }
        if (!L.tall) s += T(x0, my + 28 + 5 * 24 + 4, 'schematic: other species, same protein', { size: 14, fill: MUTED, mono: true, an: 'a', d: 1.4 });
        // the model box and the output
        const bx = L.tall ? 150 : 555, by = L.tall ? my + 174 : 236, bw = L.tall ? 220 : 170, bh = L.tall ? 64 : 128;
        const ax0 = L.tall ? L.W / 2 : 500;
        if (!L.tall) s += Pa(`M${ax0},${by + bh / 2} H${bx - 8}`, { stroke: INK, sw: 2, mk: true, an: 'draw', d: 1.6 }) + Pa(`M${bx + bw + 8},${by + bh / 2} H${bx + bw + 74}`, { stroke: INK, sw: 2, mk: true, an: 'draw', d: 2.4 });
        else s += Pa(`M${L.W / 2},${by - 34} V${by - 8}`, { stroke: INK, sw: 2, mk: true, an: 'draw', d: 1.6 }) + Pa(`M${L.W / 2},${by + bh + 6} V${by + bh + 30}`, { stroke: INK, sw: 2, mk: true, an: 'draw', d: 2.4 });
        s += G(R_(bx, by, bw, bh, INK, { rx: 16 }) + T(bx + bw / 2, by + bh / 2 - (L.tall ? 2 : 6), 'co-folding', { size: 21, w: 700, fill: '#fff', anchor: 'middle' }) + T(bx + bw / 2, by + bh / 2 + (L.tall ? 22 : 20), 'model', { size: 21, w: 700, fill: '#fff', anchor: 'middle' }), { an: 'pop', d: 1.9 });
        s += T(bx + bw / 2, by + bh + (L.tall ? 0 : 30), L.tall ? '' : 'Part 2 opens this box', { size: 15, fill: MUTED, anchor: 'middle', an: 'a', d: 2.1 });
        const ox = L.tall ? 30 : 840;
        s += T(ox, L.tall ? by + bh + 52 : 168 - 12, 'OUTPUT', { size: 15, mono: true, fill: MUTED, ls: 1.5, an: 'a', d: 2.4 });
        s += T(L.tall ? 30 : 1020, L.tall ? L.H - 16 : 540, `<tspan font-style="italic">x</tspan> ∈ ℝ<tspan dy="-11" font-size="16">3 × N</tspan><tspan dy="11" font-size="17" fill="${MUTED}" font-weight="400">   N = ${heavyAtoms(d.seq) + 2} atoms</tspan>`, { size: 26, w: 600, raw: true, anchor: L.tall ? 'start' : 'middle', an: 'a', d: 3.4, attr: ' xml:space="preserve"' });
        el.querySelector('.fwb-under').innerHTML = MARK + s;
        el.classList.remove('play'); ctx.play();
        const cx = L.tall ? L.W / 2 + 70 : 1020, cy = L.tall ? by + bh + 118 : 340, k = L.tall ? 1.8 : 3.9;
        loop(ctx, cam, (ms) => {
          const g = cam.g, grow = easeIO((ms - 2700) / 1800);
          if (grow <= 0) return;
          const R = matMul(rotY(0.5 * Math.sin(ms / 4000)), matMul(rotX(0.18), d.R0)), pj = projector(R, d.ctr, cx, cy, k);
          draw3d(g, complexItems(d, pj, { cut: [grow, grow, grow], w: L.tall ? 3.6 : 4.6, halo: 1.8 }), 0.55);
        });
      });
    },
  });

  // ------------------------------------------------------------------ 10 · more than one answer (the bridge)
  const POSE = [RUST, VIOLET, TEAL, AMBER];
  FW.step({
    chapter: 'bio', id: 'poses', title: 'More than one answer', caption: 'sometimes several shapes are right', duration: 15000,
    points: ['Some complexes have no single answer: flexible loops and weak contacts allow <b>several poses</b>, and the true answer is a distribution over them.',
      'A diffusion model is a generative model: each run starts from new random noise and returns one structure, so asking it many times gives many samples. Part 2 follows one of those runs through the model.'],
    principle: 'The goal is not one structure but the right <i>distribution</i> of structures.',
    render(el, ctx) {
      const L = lay();
      const H = head(L, 'Sometimes several answers are right', L.tall ? 'One antibody, four ways HER2 could sit on it.' : 'The same antibody, four ways HER2 could sit on it. Each run of a generative model returns one of them.');
      let s = H.s;
      // four small panels, one pose each
      const pw = L.tall ? 226 : 330, ph = L.tall ? 150 : 178, gap = L.tall ? 12 : 16;
      const px0 = L.tall ? 28 : 56, py0 = L.tall ? H.y + 18 : 168;
      const panels = [0, 1, 2, 3].map((p) => ({ p, x: px0 + (p % 2) * (pw + gap), y: py0 + Math.floor(p / 2) * (ph + gap) }));
      const names = ['measured', 'alternative 1', 'alternative 2', 'alternative 3'];
      panels.forEach((o) => {
        s += G(R_(o.x, o.y, pw, ph, '#fff', { rx: 12, stroke: LINE, sw: 1.2 }) + R_(o.x, o.y, pw, ph, 'none', { rx: 12, stroke: POSE[o.p], sw: 3, attr: ' class="fwb-frame"' }) +
          Ci(o.x + 20, o.y + 24, 6.5, POSE[o.p]) + T(o.x + 34, o.y + 30, names[o.p], { size: L.tall ? 17 : 16, w: 700, fill: o.p ? INK : RUST }) +
          (o.p === 0 ? T(o.x + pw - 14, o.y + 30, 'PDB 1N8Z', { size: 14, mono: true, fill: MUTED, anchor: 'end' }) : ''), { an: 'a', d: 0.3 + o.p * 0.15, attr: ` data-p="${o.p}"` });
      });
      if (!L.tall) s += T(px0, py0 + 2 * ph + gap + 30, 'Alternatives 1–3 are made up for this page: the antigen turned about the interface, still in contact, no clashes.', { size: 14.5, fill: MUTED, an: 'a', d: 0.9 });
      // the right side: two rows of samples
      const rx = L.tall ? 28 : 790, ry = L.tall ? py0 + 2 * ph + gap + 44 : 186, dsp = L.tall ? 38 : 32;
      s += T(rx, ry, 'Run the model 12 times:', { size: L.tall ? 20 : 19, w: 700, an: 'a', d: 1.2 });
      const want = [0, 1, 0, 2, 0, 3, 1, 0, 2, 0, 1, 0];
      const row = (y, arr, title, sub, c, d0) => {
        let r = T(rx, y, title, { size: L.tall ? 18 : 17, w: 700, fill: c, an: 'a', d: d0 }) + T(rx, y + 22, sub, { size: L.tall ? 16 : 15, fill: MUTED, an: 'a', d: d0 + 0.05 });
        arr.forEach((p, j) => { r += Ci(rx + 12 + j * dsp, y + 54, L.tall ? 13 : 11.5, POSE[p], { an: 'pop', d: d0 + 0.2 + j * 0.06 }); });
        return r;
      };
      s += row(ry + (L.tall ? 34 : 46), want, '12 samples', 'new starting noise each time, one structure each', INK, 1.6);
      s += T(rx, ry + (L.tall ? 150 : 176), 'Together the samples show which poses', { size: L.tall ? 16 : 15, fill: MUTED, an: 'a', d: 2.6 }) + T(rx, ry + (L.tall ? 172 : 198), 'are possible, and how often each comes up.', { size: L.tall ? 16 : 15, fill: MUTED, an: 'a', d: 2.65 });
      s += G(T(rx, ry + (L.tall ? 236 : 290), 'Part 2 → inside the model', { size: L.tall ? 18 : 18, w: 650, fill: BLUE }), { an: 'a', d: 4.8 });
      const { cv } = stage(el, L, s);
      ctx.play();
      const cam = canvasCam(el, cv, L);
      return withData(['1n8z'], (d) => {
        const posePts = d.poseP.map((P) => spline(P, 4).pts);
        const allC = centroid(d.poseP.flat().concat(d.chainP[0], d.chainP[1]));
        const k = L.tall ? 1.6 : 2.32;
        loop(ctx, cam, (ms) => {
          const g = cam.g, cur = ms < 1600 ? -1 : Math.floor((ms - 1600) / 1700) % 4;
          el.querySelectorAll('[data-p]').forEach((n) => n.classList.toggle('fwb-cur', +n.dataset.p === cur));
          const R = matMul(rotY(0.22 * Math.sin(ms / 4200) - 0.1), matMul(rotX(0.25), d.R0));
          panels.forEach((o) => {
            const on = smooth((ms - 400 - o.p * 150) / 500); if (on <= 0) return;
            g.save(); g.beginPath(); g.rect(o.x + 2, o.y + 40, pw - 4, ph - 42); g.clip();
            const pj = projector(R, allC, o.x + pw / 2 + (L.tall ? 4 : 8), o.y + ph / 2 + 22, k);
            const items = complexItems(d, pj, { w: L.tall ? 2.5 : 3.1, halo: 1.3, alpha: [on, on, 0], fade: [0.2, 0.2, 0] });
            tubeItems(items, posePts[o.p].map(pj), d.sp[2].ix, () => rgbOf(POSE[o.p]), L.tall ? 2.5 : 3.1, { a: on, h: 1.3 });
            draw3d(g, items, 0.45, 1.3);
            g.restore();
          });
        });
      });
    },
  });
})();
