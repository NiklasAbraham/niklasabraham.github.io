// Fold a protein — chapter 2, the model (registered with fw-core.js), drawn as ONE strip that runs left to right
// through both chapters, after the Transformer Explainer: tokens → embedding → MSA → pair map → Pairformer →
// c = (s, z) → denoiser → sampler → structure. The whole chain stays on screen; the current stage expands in place
// (accordion) while the stages before it compress into narrow labelled columns on the left and the stages after it
// on the right; the flow ribbons between columns stay attached and re-route while the columns slide. The strip DOM
// persists across steps (it is moved into each new engine layer), so every step change animates. fw-live.js puts
// the live sampler into the strip's last columns via FW.model.strip(). Expanded views are 860 × 600 design units,
// the overview columns 130 × 620; no text below 15 units (≈ 13 px at 1600 px wide).
// Honesty: maps between block 1 and 48 are illustrations; the MSA homolog rows are made up; the right-hand pair map
// and every sequence, chain and coordinate are the real PDB entry.
(function () {
  'use strict';
  const FW = window.FW; if (!FW) return;
  const { rect, circle, line, path, ribbon, curve, hvec, vec, g, sheets, svg, rnd, rgba, esc, A } = FW.h;
  const INK = FW.C.ink, Q = FW.C.q, R = FW.C.r, MUTED = FW.C.muted, PAPER = FW.C.paper;
  const LINE = rgba(INK, 0.16), FAINT = rgba(INK, 0.05), CHAIN = [Q, INK, R];
  const chainCol = (d, k) => (d.chains.length === 1 ? Q : CHAIN[k % 3]);
  const short = (c) => { const m = c.name.match(/\b(VL|VH)\b/); return m ? m[1] : c.name.split(' ')[0]; };

  // ------------------------------------------------------------------ text with sub/superscripts: z_{ij}, σ^{2}
  function rich(s, size) {
    const dv = (size * 0.3).toFixed(1);
    return esc(s).replace(/([_^])\{([^}]*)\}/g, (m, k, t) => `<tspan dy="${k === '_' ? dv : -dv}" font-size="${(size * 0.72).toFixed(1)}">${t}</tspan><tspan dy="${k === '_' ? -dv : dv}">​</tspan>`);
  }
  function T(x, y, s, o = {}) {
    const size = o.size || 16;
    const cls = ((o.mono ? 'mono ' : '') + (o.an || '')).trim();
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${o.fill || INK}" text-anchor="${o.anchor || 'start'}"` +
      (cls ? ` class="${cls}"` : '') + (o.d != null ? ` style="--d:${(+o.d).toFixed(2)}s"` : '') +
      (o.w ? ` font-weight="${o.w}"` : '') + (o.ls ? ` letter-spacing="${o.ls}"` : '') + (o.op != null ? ` fill-opacity="${o.op}"` : '') +
      (o.tr ? ` transform="${o.tr}"` : '') + `>${rich(s, size)}</text>`;
  }
  const tw = (s, size, mono, bold) => String(s).replace(/[_^]\{|\}/g, '').length * size * (mono ? 0.6 : bold ? 0.6 : 0.54);
  function head(title, sub) { return T(40, 60, title, { size: 28, w: 750, an: 'a', ls: '-0.01em' }) + T(40, 90, sub, { size: 17, fill: MUTED, an: 'a', d: 0.1 }); }
  function foot(s, d0) { return line(40, 556, 820, 556, LINE, 1, { an: 'a', d: d0 }) + T(40, 582, s, { size: 15, mono: true, fill: MUTED, an: 'a', d: d0 }); }
  function kicker(x, y, s, w, col, o = {}) { return g(T(x, y, s.toUpperCase(), { size: 16, mono: true, fill: col || MUTED, ls: '0.12em' }) + line(x, y + 12, x + w, y + 12, col ? rgba(col, 0.45) : LINE, 1.2), o); }
  function arrow(x1, y1, x2, y2, col, o = {}) { return curve(x1, y1, x2, y2, col || INK, o.sw || 1.4, Object.assign({ mk: true }, o)); }
  function img(url, x, y, w, hh, o = {}) { return `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${hh}" preserveAspectRatio="none"${o.px ? ' image-rendering="pixelated" style="image-rendering:pixelated"' : ''}${o.d != null ? ` style="--d:${o.d}s"` : ''}${o.an ? ` class="${o.an}"` : ''}/>`; }
  const mix = (a, b, t) => { const p = (hx) => [1, 3, 5].map((k) => parseInt(hx.slice(k, k + 2), 16)); const A1 = p(a), B1 = p(b); return '#' + A1.map((v, k) => Math.round(v + (B1[k] - v) * t).toString(16).padStart(2, '0')).join(''); };

  // ------------------------------------------------------------------ the pair map as an image (real or illustrated)
  const RAMP = [[0, [4, 32, 75]], [0.3, [47, 91, 211]], [0.66, [203, 214, 242]], [1, [251, 252, 254]]];
  function ramp(v) {
    const t = Math.max(0, Math.min(1, (v - 3.5) / 22));
    for (let k = 1; k < RAMP.length; k++) if (t <= RAMP[k][0]) { const [t0, a] = RAMP[k - 1], [t1, b] = RAMP[k], u = (t - t0) / (t1 - t0); return a.map((x, c) => Math.round(x + (b[c] - x) * u)); }
    return RAMP[RAMP.length - 1][1];
  }
  // the true map blurred over r residues (separable box blur, twice): an illustration of a half-trained read-out
  function blurD(d, r) {
    d._blur = d._blur || {}; if (d._blur[r]) return d._blur[r];
    const n = d.n; let A = Float32Array.from(d.D), B = new Float32Array(n * n);
    for (let pass = 0; pass < 2; pass++) for (let dir = 0; dir < 2; dir++) {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        let s = 0, c = 0;
        for (let k = -r; k <= r; k++) { const a = dir ? i : i + k, b = dir ? j + k : j; if (a < 0 || b < 0 || a >= n || b >= n) continue; s += A[a * n + b]; c++; }
        B[i * n + j] = s / c;
      }
      const T0 = A; A = B; B = T0;
    }
    return (d._blur[r] = A);
  }
  // p = 0: relative position only (other chain: no information); p = 1: the true map; in between, an illustration
  function mapVal(d, i, j, p) {
    const same = d.chain_of[i] === d.chain_of[j], rel = same ? Math.min(30, 3.8 * Math.abs(i - j)) : 30;
    if (p >= 1) return d.D[i * d.n + j];
    const a = Math.pow(p, 0.5), Bm = blurD(d, Math.max(1, Math.round((1 - p) * 8)));
    return (1 - a) * rel + a * Bm[i * d.n + j];
  }
  function mapImg(d, p, res) {
    const n = d.n, m = Math.max(8, Math.min(n, Math.round(res || n)));
    d._img = d._img || {}; const key = p + '/' + m; if (d._img[key]) return d._img[key];
    const cv = document.createElement('canvas'); cv.width = cv.height = m;
    const cx = cv.getContext('2d'), im = cx.createImageData(m, m), f = n / m;
    for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) {
      // area average of the n × n map over this output pixel
      const i0 = Math.floor(a * f), i1 = Math.max(i0 + 1, Math.floor((a + 1) * f)), j0 = Math.floor(b * f), j1 = Math.max(j0 + 1, Math.floor((b + 1) * f));
      const c = [0, 0, 0]; let cnt = 0;
      for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) {
        const col = p === 0 && d.chain_of[i] !== d.chain_of[j] ? [234, 237, 243] : ramp(mapVal(d, i, j, p));
        c[0] += col[0]; c[1] += col[1]; c[2] += col[2]; cnt++;
      }
      const o = 4 * (a * m + b); im.data[o] = c[0] / cnt; im.data[o + 1] = c[1] / cnt; im.data[o + 2] = c[2] / cnt; im.data[o + 3] = 255;
    }
    cx.putImageData(im, 0, 0);
    return (d._img[key] = cv.toDataURL());
  }
  function mapBox(d, p, x, y, size, o = {}) {
    let s = img(mapImg(d, p, size * 1.25), x, y, size, size, { px: d.n < size * 0.8 }) + rect(x, y, size, size, 'none', { stroke: LINE, sw: 1 });
    if (o.chains !== false && d.chains.length > 1) d.start.slice(1).forEach((s0) => { const u = (s0 / d.n * size).toFixed(1); s += line(x + +u, y, x + +u, y + size, PAPER, size > 150 ? 1.6 : 1, { op: 0.9 }) + line(x, y + +u, x + size, y + +u, PAPER, size > 150 ? 1.6 : 1, { op: 0.9 }); });
    return g(s, { an: o.an, d: o.d });
  }
  // compatibility: the old cell-grid map (other chapters may call FW.model.mapCells)
  function mapCells(d, x, y, size, m, block, o = {}) { return mapBox(d, Math.min(1, block / 48), x, y, size, o); }

  // ------------------------------------------------------------------ a depth-cued Cα trace (SVG)
  function protein(d, cx, cy, r, var_, o = {}) {
    const n = d.n, ang = o.ang != null ? o.ang : (var_ ? 1.1 : 0.55), tilt = o.tilt != null ? o.tilt : 0.32, NS = 7;
    const ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(tilt), st = Math.sin(tilt), sc = r / d.R, lw = o.lw || Math.max(1.4, r / 34);
    const P = d.ca.map((p) => { const x = p[0] * ca + p[2] * sa, z = -p[0] * sa + p[2] * ca; return [cx + x * sc, cy - (p[1] * ct - z * st) * sc, (p[1] * st + z * ct) / d.R]; });
    // smoothed (Catmull-Rom) sub-segments in depth slabs, far → near: a white halo per slab, then its colour per chain
    const bins = Array.from({ length: NS }, () => []), S = n < 120 ? 5 : 3, cr = (a, b, c, e, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - e) * t * t + (-a + 3 * b - 3 * c + e) * t * t * t);
    for (let i = 0; i < n - 1; i++) {
      if (d.chain_of[i] !== d.chain_of[i + 1]) continue;
      const p0 = i > 0 && d.chain_of[i - 1] === d.chain_of[i] ? P[i - 1] : P[i], p1 = P[i], p2 = P[i + 1], p3 = i + 2 < n && d.chain_of[i + 2] === d.chain_of[i] ? P[i + 2] : P[i + 1];
      let prev = p1;
      for (let k = 1; k <= S; k++) { const t = k / S, q = [0, 1, 2].map((c) => cr(p0[c], p1[c], p2[c], p3[c], t)); bins[Math.floor(Math.max(0, Math.min(0.999, ((prev[2] + q[2]) / 2 + 1) / 2)) * NS)].push([prev, q, d.chain_of[i]]); prev = q; }
    }
    const seg = (list) => list.map(([a, b]) => `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`).join('');
    let s = '';
    bins.forEach((list, b) => {
      if (!list.length) return;
      const f = (b + 0.5) / NS, w = lw * (0.65 + 0.7 * f);
      let sl = `<path d="${seg(list)}" fill="none" stroke="${PAPER}" stroke-width="${(w + lw * 0.9).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      d.chains.forEach((c, k) => { const mine = list.filter((q) => q[2] === k); if (mine.length) sl += `<path d="${seg(mine)}" fill="none" stroke="${mix(chainCol(d, k), '#f8fafd', 0.62 * (1 - f))}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`; });
      s += o.draw ? `<g${A({ an: 'a', d: o.draw + b * 0.12 })}>${sl}</g>` : sl;
    });
    return s;
  }
  function cloud(cx, cy, rx, ry, n, seed, o = {}) {
    const rr = rnd(seed); let s = '';
    for (let k = 0; k < n; k++) {
      let u, v; do { u = rr() * 2 - 1; v = rr() * 2 - 1; } while (u * u + v * v > 1);
      s += circle((cx + u * rx).toFixed(1), (cy + v * ry).toFixed(1), o.r || 2.6, o.col ? o.col[k % o.col.length] : MUTED, { op: (0.35 + rr() * 0.4).toFixed(2), an: o.an, d: o.an ? (o.d || 0) + k * 0.004 : null });
    }
    return s;
  }
  // representative tokens: per chain one plain residue and one interface residue (villin: six along the chain)
  function picks(d) {
    if (d._picks) return d._picks;
    const out = [];
    d.chains.forEach((c, k) => {
      const s0 = d.start[k], n = c.seq.length;
      if (d.chains.length === 1) { [0, 7, 14, 21, 28, n - 1].forEach((j) => out.push({ k, j, i: s0 + j, aa: c.seq[j], tag: `${j + 1}` })); return; }
      const ifc = []; for (let j = 0; j < n; j++) if (d.iface[s0 + j]) ifc.push(j);
      let plain = 4; while (d.iface[s0 + plain] && plain < n - 1) plain++;
      [plain, ifc.length ? ifc[Math.floor(ifc.length / 2)] : n - 1].forEach((j) => out.push({ k, j, i: s0 + j, aa: c.seq[j], tag: `${short(c)} ${j + 1}`, ifc: !!d.iface[s0 + j] }));
    });
    return (d._picks = out);
  }


  // ------------------------------------------------------------------ expanded views (860 × 600), built element by element
  const DW = 860, DH = 600;
  const V = {};
  V.tokens = (d) => {
    const K = d.chains.length, W = 780, multi = K > 1;
    let s = head('Sequence → tokens', multi ? `${d.n} residues in ${K} chains; each residue becomes one token` : `${d.n} residues; each residue becomes one token`);
    d.chains.forEach((c, k) => {
      const y = multi ? 148 + k * 128 : 250, L = c.seq.length, s0 = d.start[k], show = Math.min(L, multi ? 20 : 24), pitch = W / show, col = chainCol(d, k), dd = 0.25 + k * 0.35;
      let w0 = 0, best = -1;
      for (let a = 0; a + show <= L; a++) { let cnt = 0; for (let j = a; j < a + show; j++) cnt += d.iface[s0 + j]; if (cnt > best) { best = cnt; w0 = a; } }
      s += T(40, y, c.name, { size: 18, w: 700, fill: col, an: 'a', d: dd }) + T(40 + tw(c.name, 18, false, true) + 14, y, `residues ${w0 + 1}–${w0 + show}`, { size: 15, mono: true, fill: MUTED, an: 'a', d: dd });
      s += T(820, y, `${L} tokens`, { size: 15, mono: true, fill: MUTED, anchor: 'end', an: 'a', d: dd });
      for (let j = 0; j < show; j++) {
        const on = d.iface[s0 + w0 + j], x = 40 + j * pitch;
        s += rect(x.toFixed(1), y + 14, (pitch - 5).toFixed(1), 46, on ? rgba(R, 0.13) : rgba(col, 0.07), { rx: 7, stroke: on ? R : 'none', sw: 1.4, an: 'pop', d: dd + 0.15 + j * 0.02 });
        s += T((x + (pitch - 5) / 2).toFixed(1), y + 44, c.seq[w0 + j], { size: 20, w: 650, anchor: 'middle', fill: on ? R : INK, an: 'a', d: dd + 0.18 + j * 0.02 });
      }
      if (!multi) return;
      let st = ''; const cw = W / L;
      for (let j = 0; j < L; j++) st += rect((40 + j * cw).toFixed(1), y + 72, Math.max(cw - 0.4, 0.8).toFixed(1), 9, d.iface[s0 + j] ? R : rgba(col, 0.22));
      s += g(st, { an: 'a', d: dd + 0.7 }) + rect((40 + w0 * cw).toFixed(1), y + 68, (show * cw).toFixed(1), 17, 'none', { rx: 3, stroke: col, sw: 1.4, an: 'a', d: dd + 0.8 });
    });
    if (multi) s += rect(40, 517, 18, 18, rgba(R, 0.13), { rx: 4, stroke: R, sw: 1.4, an: 'a', d: 1.6 }) + T(68, 532, `interface: within 8 Å of the other side (${d.iface.reduce((p, q) => p + q, 0)} residues) — never given to the model`, { size: 16, an: 'a', d: 1.6 });
    s += foot(multi ? 'strip: the whole chain · box: the window above · a ligand: one token per atom' : 'one chain, no partner: one stable fold · a ligand: one token per heavy atom', 1.8);
    return svg(DW, DH, s);
  };
  V.embedding = (d) => {
    let s = head('Token → vectors', 'a vector s_{i} per token, a vector z_{ij} per pair of tokens');
    [['atoms', 'reference', 165], ['type', '1 of 32', 258], ['profile', 'from MSA', 350], ['s_{i}', '384', 462]].forEach(([t, u, x], k) => {
      s += T(x, 146, t, { size: 17, w: 700, anchor: 'middle', fill: k === 3 ? INK : MUTED, an: 'a', d: 0.25 + k * 0.45 }) + T(x, 166, u, { size: 15, mono: true, anchor: 'middle', fill: MUTED, an: 'a', d: 0.25 + k * 0.45 });
    });
    const P = picks(d).slice(0, 5), AAs = 'ARNDCQEGHILKMFPSTWYV';
    P.forEach((p, n) => {
      const y = 214 + n * 64, col = chainCol(d, p.k), rr = rnd(13 + AAs.indexOf(p.aa));
      s += T(66, y + 8, p.aa, { size: 26, w: 700, anchor: 'middle', fill: p.ifc ? R : col, an: 'a', d: 0.2 + n * 0.05 }) + T(66, y + 28, p.tag, { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 0.22 + n * 0.05 });
      let at = ''; const na = 4 + Math.floor(rr() * 5); let px = 132, py = y;
      for (let k = 0; k < na; k++) { const nx = 132 + k * 10, ny = y + (k < 3 ? 0 : (rr() - 0.5) * 22); if (k) at += line(px, py, nx, ny, MUTED, 1.4, { op: 0.6 }); at += circle(nx, ny, 3.6, k < 3 ? INK : MUTED, { op: 0.85 }); px = nx; py = ny; }
      s += g(at, { an: 'a', d: 0.35 + n * 0.06 });
      let oh = ''; const ti = Math.max(0, AAs.indexOf(p.aa));
      for (let k = 0; k < 32; k++) oh += rect(216 + k * 2.6, y - 12, 2, 24, k === ti ? INK : rgba(INK, 0.08));
      s += g(oh, { an: 'a', d: 0.75 + n * 0.06 });
      let pr = '';
      for (let k = 0; k < 20; k++) { const hh = k === ti ? 24 : Math.pow(rr(), 3) * 16; pr += rect(308 + k * 4.2, y + 12 - hh, 3.2, Math.max(hh, 1), k === ti ? INK : Q, { op: k === ti ? 1 : 0.55 }); }
      s += g(pr, { an: 'a', d: 1.2 + n * 0.06 });
      s += arrow(398, y, 414, y, MUTED, { sw: 1.2, an: 'draw', d: 1.5 + n * 0.05 }) + hvec(418, y - 12, 90, 24, INK, 20, 240 + n, { an: 'grow', d: 1.6 + n * 0.07 });
    });
    const x0 = 604, y0 = 232, S = 196;
    s += line(536, 126, 536, 530, LINE, 1, { an: 'a', d: 2 });
    s += T(690, 146, 'z_{ij} = Lin(s_{i}) + Lin(s_{j})', { size: 17, w: 700, anchor: 'middle', an: 'a', d: 2.1 }) + T(690, 168, '+ relpos(i, j)', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 2.1 });
    s += hvec(x0, y0 - 24, S, 14, INK, 32, 911, { an: 'grow', d: 2.2 }) + vec(x0 - 24, y0, 14, S, INK, 32, 912, { an: 'a', d: 2.25 });
    s += T(x0 + S + 8, y0 - 12, 's_{j}', { size: 17, w: 700, an: 'a', d: 2.2 }) + T(x0 - 32, y0 + S + 22, 's_{i}', { size: 17, w: 700, an: 'a', d: 2.25 });
    s += mapBox(d, 0, x0, y0, S, { an: 'a', d: 2.4 });
    const ci = 0.3 * S, cj = 0.72 * S;
    s += line(x0 + cj, y0 - 10, x0 + cj, y0 + ci, R, 1.4, { an: 'a', d: 2.8, dash: '3 3' }) + line(x0 - 10, y0 + ci, x0 + cj, y0 + ci, R, 1.4, { an: 'a', d: 2.8, dash: '3 3' }) + circle(x0 + cj, y0 + ci, 6, R, { an: 'pop', d: 2.9 });
    s += rect(568, 470, 16, 16, rgba(INK, 0.55), { rx: 3, an: 'a', d: 3 }) + T(592, 483, 'same chain: |i − j|', { size: 15, mono: true, fill: MUTED, an: 'a', d: 3 });
    s += rect(568, 496, 16, 16, '#eaedf3', { rx: 3, stroke: LINE, an: 'a', d: 3.1 }) + T(592, 509, 'other chain: nothing yet', { size: 15, mono: true, fill: MUTED, an: 'a', d: 3.1 });
    s += foot(`type, chain, position: real ${d.id.toUpperCase()} values · profile bars illustrative`, 3.2);
    return svg(DW, DH, s);
  };
  V.msa = (d) => {
    const k0 = d.chains.length - 1, c = d.chains[k0], s0 = d.start[k0], L = 16, rr = rnd(5), AAs = 'ACDEFGHIKLMNPQRSTVWY';
    let w0 = 0; for (let j = 0; j + L <= c.seq.length; j++) if (d.iface[s0 + j]) { w0 = Math.max(0, Math.min(c.seq.length - L, j - 3)); break; }
    let s = head('Evolution as evidence: the MSA', `related sequences of ${c.name} from other species, aligned`);
    const X = 150, Y = 176, PW = 30, PH = 36, rows = 9, colA = 3, colB = 11;
    s += rect(X + colA * PW - 2, Y - 6, PW + 1, rows * PH + 8, rgba(R, 0.08), { rx: 6, an: 'a', d: 1.3 }) + rect(X + colB * PW - 2, Y - 6, PW + 1, rows * PH + 8, rgba(R, 0.08), { rx: 6, an: 'a', d: 1.3 });
    for (let r = 0; r < rows; r++) {
      const y = Y + r * PH, flip = r > 0 && rr() < 0.5;
      s += T(X - 14, y + 22, r ? `species ${r}` : 'query', { size: 15, mono: true, fill: r ? MUTED : INK, anchor: 'end', w: r ? null : 650, an: 'a', d: 0.2 + r * 0.07 });
      for (let j = 0; j < L; j++) {
        const q = c.seq[w0 + j]; let ch = q;
        if (r && rr() < 0.26) ch = AAs[Math.floor(rr() * 20)];
        if (r && (j === colA || j === colB)) ch = flip ? (j === colA ? 'K' : 'E') : (j === colA ? 'E' : 'K');
        if (!r && j === colA) ch = 'E'; if (!r && j === colB) ch = 'K';
        const hot = j === colA || j === colB, diff = ch !== (j === colA ? 'E' : j === colB ? 'K' : q);
        s += rect(X + j * PW, y, PW - 4, PH - 5, !r ? rgba(INK, 0.1) : hot ? rgba(R, diff ? 0.22 : 0.1) : diff ? rgba(Q, 0.13) : FAINT, { rx: 5, an: 'pop', d: 0.3 + r * 0.07 + j * 0.008 });
        s += T(X + j * PW + (PW - 4) / 2, y + 21, ch, { size: 16, mono: true, anchor: 'middle', w: !r ? 700 : null, fill: hot ? R : diff ? Q : INK, an: 'a', d: 0.34 + r * 0.07 + j * 0.008 });
      }
    }
    const xa = X + colA * PW + PW / 2 - 2, xb = X + colB * PW + PW / 2 - 2;
    s += path(`M${xa},${Y - 10} C${xa},${Y - 42} ${xb},${Y - 42} ${xb},${Y - 10}`, { stroke: R, sw: 2, an: 'draw', d: 1.5 });
    s += T((xa + xb) / 2, Y - 42, 'E here comes with K there', { size: 16, fill: R, anchor: 'middle', w: 650, an: 'a', d: 1.7 });
    const mx = 680, my = 252, ms = 130, ia = 0.32, jb = 0.74;
    s += arrow(X + L * PW + 6, Y + 4.5 * PH, mx - 12, Y + 4.5 * PH, INK, { an: 'draw', d: 2.1 });
    s += T(mx + ms / 2, 200, 'outer product', { size: 17, w: 700, anchor: 'middle', an: 'a', d: 2.2 }) + T(mx + ms / 2, 222, 'averaged over rows', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 2.25 });
    s += mapBox(d, 0.3, mx, my, ms, { an: 'a', d: 2.3, chains: false });
    s += rect(mx + jb * ms - 7, my + ia * ms - 7, 14, 14, 'none', { stroke: R, sw: 2.4, rx: 3, an: 'pop', d: 2.7 }) + rect(mx + ia * ms - 7, my + jb * ms - 7, 14, 14, 'none', { stroke: R, sw: 2.4, rx: 3, an: 'pop', d: 2.75 });
    s += T(mx + ms / 2, my + ms + 30, 'a contact hint in z', { size: 16, w: 650, anchor: 'middle', fill: R, an: 'a', d: 2.8 }) + T(mx + ms / 2, my + ms + 52, 'for the pair (E, K)', { size: 15, mono: true, anchor: 'middle', fill: MUTED, an: 'a', d: 2.85 });
    s += foot(`query: real ${short(c)} residues ${w0 + 1}–${w0 + L} (E/K planted) · other rows illustrative`, 3);
    return svg(DW, DH, s);
  };
  V.pair = (d) => {
    const multi = d.chains.length > 1;
    let s = head('The pair map z', '128 numbers for every pair of tokens — shown as the distance they encode');
    s += T(135, 196, 'at the start', { size: 18, w: 700, anchor: 'middle', an: 'a', d: 0.2 }) + T(135, 216, 'relative position', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 0.25 });
    s += mapBox(d, 0, 40, 232, 190, { an: 'a', d: 0.35 });
    s += arrow(244, 327, 302, 327, INK, { sw: 1.8, an: 'draw', d: 1.2 }) + T(273, 312, '48 blocks', { size: 15, mono: true, anchor: 'middle', an: 'a', d: 1.3 }) + T(273, 352, '× 4', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 1.3 });
    const X = 372, Y = 168, S = 300;
    s += mapBox(d, 1, X, Y, S, { an: 'a', d: 1.5 });
    s += T(X + S / 2, Y - 14, 'after the trunk', { size: 18, w: 700, anchor: 'middle', an: 'a', d: 1.45 });
    if (multi) {
      d.chains.forEach((c, k) => {
        const a = d.start[k] / d.n * S, b = (d.start[k] + c.seq.length) / d.n * S, m = (a + b) / 2;
        s += T(X - 8, Y + m + 5, short(c), { size: 15, mono: true, w: 700, fill: chainCol(d, k), anchor: 'end', an: 'a', d: 1.8 }) + T(X + m, Y + S + 22, short(c), { size: 15, mono: true, w: 700, fill: chainCol(d, k), anchor: 'middle', an: 'a', d: 1.8 });
      });
      const k2 = d.start[d.chains.length - 1] / d.n * S;
      s += rect(X + k2, Y, S - k2, k2, 'none', { stroke: R, sw: 2.6, dash: '7 5', rx: 2, an: 'a', d: 2.3 }) + rect(X, Y + k2, k2, S - k2, 'none', { stroke: R, sw: 1.4, dash: '4 5', rx: 2, op: 0.6, an: 'a', d: 2.4 });
      s += T(X + S + 14, Y + k2 / 2 - 14, 'antibody ×', { size: 17, w: 700, fill: R, an: 'a', d: 2.5 }) + T(X + S + 14, Y + k2 / 2 + 6, 'antigen:', { size: 17, w: 700, fill: R, an: 'a', d: 2.5 }) + T(X + S + 14, Y + k2 / 2 + 28, 'the interface', { size: 15, fill: R, an: 'a', d: 2.55 });
    }
    let key = ''; for (let k = 0; k < 24; k++) { const c = ramp(4 + k / 23 * 26); key += rect(688 + k * 5.5, 440, 5.6, 14, `rgb(${c})`); }
    s += g(key + rect(688, 440, 132, 14, 'none', { stroke: LINE }) + T(688, 474, '4 Å', { size: 15, mono: true, fill: MUTED }) + T(820, 474, '30 Å+', { size: 15, mono: true, fill: MUTED, anchor: 'end' }), { an: 'a', d: 2.7 });
    s += foot(`right: the real ${d.id.toUpperCase()} Cβ distances (distogram target) · left: illustration`, 2.9);
    return svg(DW, DH, s);
  };
  V.triangle = (d) => {
    const n = 8, c = 34, x0 = 64, y0 = 176, i = 1, j = 5;
    let s = head('One triangle update', 'each pair (i, j) is rewritten from the other two edges of every triangle (i, j, k)');
    s += T(x0 + n * c / 2, y0 - 14, 'k →', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 0.3 });
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      const fill = a === i && b === j ? INK : a === i ? rgba(Q, 0.24) : a === j ? rgba(R, 0.2) : FAINT;
      s += rect(x0 + b * c, y0 + a * c, c - 4, c - 4, fill, { rx: 5, an: 'pop', d: 0.2 + (a + b) * 0.02 });
    }
    s += T(x0 - 12, y0 + i * c + 22, 'i', { size: 19, w: 700, anchor: 'end', fill: Q, an: 'a', d: 0.5 }) + T(x0 - 12, y0 + j * c + 22, 'j', { size: 19, w: 700, anchor: 'end', fill: R, an: 'a', d: 0.5 });
    s += T(x0 + j * c + c / 2 - 2, y0 + i * c + 21, 'ij', { size: 15, mono: true, w: 700, fill: PAPER, anchor: 'middle', an: 'a', d: 0.6 });
    const ksG = [0, 3, 4, 7], P = { i: [430, 244], j: [770, 244] }, KN = [[448, 420], [552, 466], [660, 466], [758, 420]];
    for (let k = 0; k < n; k++) {
      const dd = 1.2 + k * 0.38;
      s += rect(x0 + k * c - 3, y0 + i * c - 3, c + 2, c + 2, 'none', { rx: 6, stroke: Q, sw: 3, an: 'blink', d: dd });
      s += rect(x0 + k * c - 3, y0 + j * c - 3, c + 2, c + 2, 'none', { rx: 6, stroke: R, sw: 3, an: 'blink', d: dd });
      s += rect(x0 + k * c + 4, y0 + n * c + 8, c - 12, 6, INK, { rx: 3, an: 'pop', d: dd + 0.3 });
    }
    s += T(x0 + n * c / 2, y0 + n * c + 40, 'Σ over every k', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 1.4 });
    const P2 = picks(d), pi = P2.find((p) => p.ifc && p.k < d.chains.length - 1) || P2[1], pj = P2.slice().reverse().find((p) => p.ifc) || P2[P2.length - 1];
    s += line(P.i[0], P.i[1], P.j[0], P.j[1], INK, 4, { an: 'draw', d: 0.7, cap: 'round' }) + T((P.i[0] + P.j[0]) / 2, P.i[1] - 14, 'z_{ij}', { size: 19, w: 700, anchor: 'middle', an: 'a', d: 0.9 });
    KN.forEach((K, k) => {
      const dd = 1.2 + ksG[k] * 0.38;
      s += line(P.i[0], P.i[1], K[0], K[1], Q, 2, { an: 'draw', d: dd }) + line(P.j[0], P.j[1], K[0], K[1], R, 2, { an: 'draw', d: dd + 0.05 });
      s += circle(K[0], K[1], 15, PAPER, { stroke: INK, sw: 1.5, an: 'pop', d: dd - 0.1 }) + T(K[0], K[1] + 6, 'k', { size: 16, anchor: 'middle', an: 'a', d: dd - 0.1 });
    });
    [['i', pi, Q], ['j', pj, R]].forEach(([t, p, col]) => {
      s += circle(P[t][0], P[t][1], 20, PAPER, { stroke: col, sw: 2.4, an: 'pop', d: 0.5 }) + T(P[t][0], P[t][1] + 7, t, { size: 19, w: 700, anchor: 'middle', fill: col, an: 'a', d: 0.5 });
      s += T(P[t][0], P[t][1] - 32, `${p.aa} · ${p.tag}`, { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 0.55 });
    });
    s += T(603, 514, 'if i is near k and k is near j,', { size: 17, w: 650, anchor: 'middle', an: 'a', d: 4.4 }) + T(603, 538, 'then i cannot be far from j', { size: 17, w: 650, anchor: 'middle', an: 'a', d: 4.5 });
    s += foot('z_{ij} ← z_{ij} + g_{ij} ⊙ Linear(LN(Σ_{k} a_{ik} ⊙ b_{jk}))  · rows shown; then columns', 4.6);
    return svg(DW, DH, s);
  };
  V.pairformer = (d) => {
    let s = head('48 blocks, four passes', 'the same pair map, refined block after block (illustration)');
    const B = [[1, 'chain separation'], [12, 'first contacts'], [24, 'sharpening'], [48, 'full contact map']];
    B.forEach(([b, cap], k) => {
      const x = 40 + k * 201, dd = 0.25 + k * 0.55;
      s += sheets(x, 124, 176, 240, 3, 4, dd) + rect(x, 124, 176, 240, PAPER, { rx: 10, stroke: LINE, sw: 1, an: 'a', d: dd });
      s += T(x + 14, 150, `block ${b}`, { size: 17, w: 700, an: 'a', d: dd + 0.05 }) + T(x + 162, 150, 'of 48', { size: 15, mono: true, fill: MUTED, anchor: 'end', an: 'a', d: dd + 0.05 });
      s += mapBox(d, b === 48 ? 1 : b / 48, x + 14, 164, 148, { an: 'a', d: dd + 0.1 });
      s += T(x + 88, 346, cap, { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: dd + 0.15 });
      if (k < 3) s += arrow(x + 180, 238, x + 198, 238, INK, { an: 'draw', d: dd + 0.3 });
    });
    s += path('M731,372 C731,398 700,398 660,398 L170,398 C140,398 128,398 128,376', { stroke: R, sw: 1.8, dash: '6 5', mk: true, an: 'draw', d: 2.6 });
    s += T(430, 424, 'then the whole trunk runs again on its own output · 4 passes', { size: 16, fill: R, anchor: 'middle', w: 650, an: 'a', d: 2.7 });
    const zops = ['tri. mult. out', 'tri. mult. in', 'tri. attn. start', 'tri. attn. end', 'transition'], sops = ['attention + pair bias', 'transition'];
    const pills = (list, col, y, d0) => { let x = 40, r = ''; list.forEach((t, k) => { const w = tw(t, 15) + 24; r += rect(x, y, w, 30, rgba(col, 0.1), { rx: 15, stroke: rgba(col, 0.5), sw: 1, an: 'a', d: d0 + k * 0.08 }) + T(x + w / 2, y + 20, t, { size: 15, anchor: 'middle', fill: col, w: 600, an: 'a', d: d0 + k * 0.08 }); x += w + 8; }); return r; };
    s += T(40, 454, 'one block, on the pair map z', { size: 15, mono: true, fill: MUTED, an: 'a', d: 3 }) + pills(zops, INK, 462, 3);
    s += T(40, 514, 'then on the single track s', { size: 15, mono: true, fill: MUTED, an: 'a', d: 3.4 }) + pills(sops, Q, 522, 3.45);
    s += T(40, 582, 'illustration: maps between block 1 and 48 are drawn, not computed', { size: 15, mono: true, fill: MUTED, an: 'a', d: 3.6 });
    return svg(DW, DH, s);
  };
  // the real AF3 schedule (Karras, ρ = 7, σ_data 16 Å, 2560 Å → 0.0064 Å)
  function schedule(n) { const a = Math.pow(160, 1 / 7), b = Math.pow(4e-4, 1 / 7), out = []; for (let i = 0; i <= n; i++) out.push(16 * Math.pow(a + i / n * (b - a), 7)); return out; }
  const fmtS = (s) => (s >= 100 ? s.toFixed(0) : s >= 1 ? s.toFixed(1) : s >= 0.01 ? s.toFixed(3) : s.toFixed(4)) + ' Å';
  V.cond = (d) => {
    let s = head('The hand-over: c = (s, z)', 'computed once, then given unchanged to all 200 denoiser calls');
    s += rect(40, 150, 250, 320, PAPER, { rx: 12, stroke: INK, sw: 2, an: 'pop', d: 0.2 });
    s += T(165, 188, 'c = (s, z)', { size: 24, w: 750, anchor: 'middle', an: 'a', d: 0.3 });
    for (let k = 0; k < 12; k++) s += hvec(58, 210 + k * 15, 44, 11, INK, 10, 600 + k, { an: 'grow', d: 0.4 + k * 0.03 });
    s += mapBox(d, 1, 116, 210, 156, { an: 'a', d: 0.6 });
    s += T(80, 418, 's', { size: 18, w: 700, anchor: 'middle', an: 'a', d: 0.7 }) + T(80, 440, 'N × 384', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 0.7 });
    s += T(194, 418, 'z', { size: 18, w: 700, anchor: 'middle', an: 'a', d: 0.75 }) + T(194, 440, 'N × N × 128', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 0.75 });
    const sig = schedule(200), calls = [1, 2, 3, 50, 100, 150, 200], RH = 50, Y0 = 136;
    const sub = []; for (let i = 0; i < d.n; i += Math.max(1, Math.round(d.n / 100))) sub.push(i);
    const rr = rnd(21);
    calls.forEach((cn, k) => {
      const y = Y0 + k * (RH + 8), dd = 1 + k * 0.14, sg = sig[cn - 1];
      s += ribbon(290, 166 + k * 42, 28, 370, y + 6, RH - 12, INK, 0.06, { an: 'a', d: dd, pulse: k === 0 ? Q : null });
      s += rect(370, y, 450, RH, PAPER, { rx: 8, stroke: LINE, sw: 1, an: 'a', d: dd });
      s += T(386, y + 31, `call ${cn}`, { size: 16, mono: true, w: 700, an: 'a', d: dd + 0.04 }) + T(592, y + 31, `σ = ${fmtS(sg)}`, { size: 16, mono: true, fill: R, anchor: 'end', an: 'a', d: dd + 0.06 });
      let dots = ''; const bx0 = 604, bw = 206, by0 = y + 5, bh = RH - 10, cx = bx0 + bw / 2, cy = y + RH / 2, sc = 0.52;
      sub.forEach((i) => {
        const u = (rr() + rr() + rr() - 1.5) * 2, v = (rr() + rr() + rr() - 1.5) * 2;
        let px = cx + (d.ca[i][0] + u * sg) * sc - bx0, py = cy - (d.ca[i][1] + v * sg) * sc - by0;
        px = ((px % bw) + bw) % bw + bx0; py = ((py % bh) + bh) % bh + by0;
        dots += circle(px.toFixed(1), py.toFixed(1), 2.1, chainCol(d, d.chain_of[i]), { op: 0.75 });
      });
      s += g(dots, { an: 'a', d: dd + 0.1 });
    });
    s += T(707, Y0 - 12, 'noisy atoms it sees', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 1 });
    s += T(430, 580, 'from call to call only the noisy atoms and σ change', { size: 17, w: 650, anchor: 'middle', fill: R, an: 'a', d: 2.3 });
    return svg(DW, DH, s);
  };
  V.denoiser = (d) => {
    let s = head('Inside one denoiser call', 'atoms → tokens → atoms; out comes a guess x̂ of the clean structure');
    s += T(88, 168, 'noisy atoms', { size: 17, w: 700, anchor: 'middle', an: 'a', d: 0.2 }) + T(88, 190, 'x and σ', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 0.2 });
    s += cloud(88, 326, 44, 104, 80, 3, { an: 'pop', d: 0.3, r: 2.8, col: [Q, INK, R] });
    const AX = 196, AY = 214, AH = 240, na = 64, ah = AH / na;
    s += T(246, 168, 'atom encoder', { size: 17, w: 700, anchor: 'middle', an: 'a', d: 0.7 }) + T(246, 190, '3 blocks · local', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 0.7 });
    let at = ''; for (let k = 0; k < na; k++) at += rect(AX, (AY + k * ah).toFixed(1), 14, Math.max(ah - 0.8, 1).toFixed(1), Math.floor(k / 8) % 2 ? rgba(INK, 0.32) : rgba(INK, 0.16));
    s += g(at, { an: 'a', d: 0.8 });
    s += rect(AX - 3, AY + 24 * ah, 20, 16 * ah, rgba(Q, 0.35), { rx: 3, stroke: Q, sw: 1.6, an: 'pop', d: 1.1 });
    s += line(AX - 10, AY, AX - 10, AY + AH, MUTED, 1.4, { an: 'a', d: 1.2 }) + line(AX - 14, AY, AX - 6, AY, MUTED, 1.4, { an: 'a', d: 1.2 }) + line(AX - 14, AY + AH, AX - 6, AY + AH, MUTED, 1.4, { an: 'a', d: 1.2 });
    s += T(246, 478, '32 queries,', { size: 15, mono: true, fill: Q, w: 650, anchor: 'middle', an: 'a', d: 1.2 }) + T(246, 498, '128 keys', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 1.25 });
    let pl = '';
    for (let r = 0; r < 8; r++) { const ty = 222 + r * 28; pl += ribbon(AX + 14, AY + r * 8 * ah, 8 * ah, 288, ty, 14, Q, 0.12) + hvec(288, ty, 40, 14, INK, 8, 700 + r); }
    s += g(pl, { an: 'a', d: 1.5 });
    const TX = 352, TY = 210, TW = 206, TH = 236;
    s += T(TX + TW / 2, 168, 'token transformer', { size: 17, w: 700, anchor: 'middle', an: 'a', d: 1.8 }) + T(TX + TW / 2, 190, '24 blocks · 16 heads', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 1.8 });
    s += sheets(TX, TY, TW, TH, 5, 4, 1.85) + rect(TX, TY, TW, TH, PAPER, { rx: 10, stroke: Q, sw: 1.4, an: 'a', d: 1.9 });
    s += ribbon(328, 222, 210, TX + 10, TY + 14, 210, Q, 0.06, { an: 'a', d: 1.9 });
    for (let r = 0; r < 8; r++) s += hvec(TX + 12, TY + 16 + r * 27, 50, 13, INK, 10, 800 + r, { an: 'grow', d: 2 + r * 0.03 });
    const m = 8, rr = rnd(9);
    for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) {
      const i = Math.floor((a + 0.5) * d.n / m), j = Math.floor((b + 0.5) * d.n / m), v = d.D[i * d.n + j];
      const w = Math.max(0.08, Math.min(1, (0.25 + rr() * 0.25) + (1 - Math.min(v, 30) / 30) * 0.6));
      s += circle(TX + 80 + b * 16.5, TY + 22 + a * 27, 6, Q, { op: w.toFixed(2), an: 'pop', d: 2.2 + (a + b) * 0.025 });
    }
    s += T(TX + TW / 2, TY + TH + 22, 'width 768', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 2.3 });
    s += arrow(TX + 50, 540, TX + 50, TY + TH + 32, R, { sw: 2, an: 'draw', d: 2.6 }) + arrow(TX + 156, 540, TX + 156, TY + TH + 32, R, { sw: 2, an: 'draw', d: 2.7 });
    s += T(TX + 44, 530, 'z → bias', { size: 15, mono: true, fill: R, w: 650, anchor: 'end', an: 'a', d: 2.65 }) + T(TX + 164, 530, 's, σ → AdaLN', { size: 15, mono: true, fill: R, w: 650, an: 'a', d: 2.75 });
    let dc = '';
    for (let r = 0; r < 8; r++) dc += ribbon(TX + TW, TY + 16 + r * 27, 13, 634, AY + r * 8 * ah, 8 * ah, Q, 0.1);
    let at2 = ''; for (let k = 0; k < na; k++) at2 += rect(634, (AY + k * ah).toFixed(1), 14, Math.max(ah - 0.8, 1).toFixed(1), Math.floor(k / 8) % 2 ? rgba(INK, 0.32) : rgba(INK, 0.16));
    s += g(dc + at2, { an: 'a', d: 2.9 }) + T(632, 168, 'atom decoder', { size: 17, w: 700, anchor: 'middle', an: 'a', d: 2.9 }) + T(632, 190, '3 blocks', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 2.9 });
    s += arrow(654, 334, 680, 334, INK, { an: 'draw', d: 3.1 });
    s += T(756, 168, 'guess x̂', { size: 17, w: 700, anchor: 'middle', an: 'a', d: 3.2 });
    s += protein(d, 756, 330, 64, 0, { draw: 3.3, lw: 2.2 });
    s += T(756, 478, 'x̂ = D_{θ}(x, σ | c)', { size: 15, mono: true, anchor: 'middle', an: 'a', d: 4.1 });
    s += foot('one call per sampler step, 200 per structure · s and z also reach the atom encoder', 4.2);
    return svg(DW, DH, s);
  };
  const SL0 = 186, SL1 = 456;                           // the bias-strength slider track (design units)
  V.pairbias = (d) => {
    let s = head('How c steers: attention with a pair bias', 'every block and head adds a bias from z to its attention scores');
    const P = pbTokens(d), X = [144, 386, 628], Y = 262, PT = 34, Rr = 13;
    const titles = [['q · k / √d', 'from the noisy atoms'], ['+ b_{ij} = Linear(z_{ij})', 'from the trunk, fixed'], ['softmax', 'rows sum to 1']];
    titles.forEach(([t, u], k) => { s += T(X[k] + 2.5 * PT, 156, t, { size: 17, w: 700, anchor: 'middle', fill: k === 1 ? R : INK, an: 'a', d: 0.2 + k * 0.5 }) + T(X[k] + 2.5 * PT, 180, u, { size: 15, mono: true, fill: k === 1 ? R : MUTED, anchor: 'middle', an: 'a', d: 0.25 + k * 0.5 }); });
    P.forEach((p, a) => {
      s += T(X[0] - 22, Y + a * PT + 5, `${p.aa} ${p.tag}`, { size: 15, mono: true, fill: chainCol(d, p.k), anchor: 'end', an: 'a', d: 0.3 });
      for (let k = 0; k < 3; k++) for (let b = 0; b < 6; b++) s += `<circle class="pb pop" data-m="${k}" data-a="${a}" data-b="${b}" cx="${X[k] + b * PT}" cy="${Y + a * PT}" r="${Rr}" fill="${k === 1 ? R : k === 0 ? Q : INK}" fill-opacity="0.2" style="--d:${(0.4 + k * 0.5 + (a + b) * 0.02).toFixed(2)}s"/>`;
    });
    P.forEach((p, b) => { for (let k = 0; k < 3; k++) s += T(X[k] + b * PT, Y - 26, p.aa, { size: 15, mono: true, w: 700, fill: chainCol(d, p.k), anchor: 'middle', an: 'a', d: 0.35 + k * 0.5 }); });
    s += T(X[1] - 38, Y + 2.5 * PT + 9, '+', { size: 28, fill: MUTED, anchor: 'middle', an: 'a', d: 0.8 }) + T(X[2] - 38, Y + 2.5 * PT + 8, '→', { size: 24, fill: MUTED, anchor: 'middle', an: 'a', d: 1.3 });
    s += g(T(40, 524, 'bias strength', { size: 16, w: 700 }) + line(SL0, 519, SL1, 519, LINE, 4, { cap: 'round' }) + `<line class="pb-fill" x1="${SL0}" y1="519" x2="${SL0}" y2="519" stroke="${R}" stroke-width="4" stroke-linecap="round"/>` +
      `<circle class="pb-knob" cx="${SL0}" cy="519" r="11" fill="${PAPER}" stroke="${R}" stroke-width="2.5" style="cursor:grab"/>` + `<rect class="pb-hit" x="${SL0 - 14}" y="500" width="${SL1 - SL0 + 28}" height="38" fill="transparent" style="cursor:pointer"/>` +
      T(SL1 + 16, 524, '×0.0', { size: 16, mono: true, fill: R, w: 700 }).replace('<text ', '<text class="pb-val" '), { an: 'a', d: 1.6 });
    s += T(X[2] + 2.5 * PT, 500, 'change with a new noisy x', { size: 15, mono: true, fill: MUTED, anchor: 'middle', an: 'a', d: 1.7 });
    s += T(X[2] + 2.5 * PT, 528, '–', { size: 20, mono: true, w: 700, anchor: 'middle', an: 'a', d: 1.7 }).replace('<text ', '<text class="pb-tv" ');
    s += foot(`b: real Cβ distances of six ${d.id.toUpperCase()}${d.chains.length > 1 ? ' interface' : ''} residues · q · k drawn at random`, 1.9);
    return svg(DW, DH, s);
  };
  function pbTokens(d) {
    const out = [];
    if (d.chains.length > 1) {
      const ab = [], ag = [];
      for (let i = 0; i < d.n; i++) if (d.iface[i]) (d.chain_of[i] === d.chains.length - 1 ? ag : ab).push(i);
      const pickAb = [ab[Math.floor(ab.length * 0.15)], ab[Math.floor(ab.length * 0.5)], ab[Math.floor(ab.length * 0.85)]];
      const pickAg = pickAb.map((i) => ag.reduce((b, j) => (d.D[i * d.n + j] < d.D[i * d.n + b] ? j : b), ag[0]));
      const uniq = [...new Set(pickAg)]; for (let k = 0; uniq.length < 3 && k < ag.length; k++) if (uniq.indexOf(ag[k]) < 0) uniq.push(ag[k]);
      [...pickAb, ...uniq.slice(0, 3)].forEach((i) => out.push(i));
    } else [2, 8, 14, 20, 26, 32].forEach((i) => out.push(Math.min(i, d.n - 1)));
    return out.map((i) => { const k = d.chain_of[i], j = i - d.start[k]; return { i, k, j, aa: d.chains[k].seq[j], tag: d.chains.length > 1 ? `${short(d.chains[k])} ${j + 1}` : `${j + 1}` }; });
  }
  function pairbiasLive(host, ctx) {
    const d = ctx.data, P = pbTokens(d), n = P.length, svgEl = host.querySelector('svg');
    if (!svgEl) return null;
    const bias = P.map((p, a) => P.map((q, b) => (a === b ? 1 : 8 * Math.exp(-Math.max(0, d.D[p.i * d.n + q.i] - 4) / 3) - 1)));
    const rr = rnd(77), draw = () => P.map(() => P.map(() => (rr() + rr() + rr() - 1.5) * 2.2));
    let kk = 0, qa = draw(), qb = draw(), t0 = performance.now(), beta = 0, user = false, tvEMA = null;
    const circ = [...svgEl.querySelectorAll('circle.pb')], byM = [0, 1, 2].map((m) => circ.filter((c) => +c.dataset.m === m));
    const knob = svgEl.querySelector('.pb-knob'), fill = svgEl.querySelector('.pb-fill'), val = svgEl.querySelector('.pb-val'), tvT = svgEl.querySelector('.pb-tv');
    const setBeta = (b) => { beta = Math.max(0, Math.min(2, b)); const x = SL0 + beta / 2 * (SL1 - SL0); knob.setAttribute('cx', x); fill.setAttribute('x2', x); val.textContent = '×' + beta.toFixed(1); };
    const toX = (ev) => { const pt = svgEl.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; return pt.matrixTransform(svgEl.getScreenCTM().inverse()).x; };
    let drag = false;
    const hit = svgEl.querySelector('.pb-hit');
    const down = (ev) => { drag = true; user = true; setBeta((toX(ev) - SL0) / (SL1 - SL0) * 2); ev.preventDefault(); };
    const move = (ev) => { if (drag) setBeta((toX(ev) - SL0) / (SL1 - SL0) * 2); };
    const up = () => { drag = false; };
    [hit, knob].forEach((e) => e.addEventListener('pointerdown', down));
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    setBeta(0);
    const PERIOD = 1500, soft = (M) => M.map((row, a) => { const l = row.map((v, b) => v + beta * bias[a][b]), mx = Math.max(...l), ex = l.map((v) => Math.exp(v - mx)), z = ex.reduce((p, q) => p + q, 0); return ex.map((v) => v / z); });
    ctx.raf((now) => {
      const t = now - t0;
      if (!user) setBeta(t < 3200 ? 0 : Math.min(1.6, (t - 3200) / 2400 * 1.6));
      const ph = (t % PERIOD) / PERIOD, cyc = Math.floor(t / PERIOD); if (cyc !== kk) { kk = cyc; qa = qb; qb = draw(); }
      const e = ph < 0.5 ? 0 : (ph - 0.5) * 2, sm = e * e * (3 - 2 * e);
      const qk = qa.map((row, a) => row.map((v, b) => v + (qb[a][b] - v) * sm)), att = soft(qk);
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
        const k = a * n + b, v0 = qk[a][b], v1 = beta * bias[a][b];
        byM[0][k].setAttribute('fill-opacity', (0.12 + 0.8 * Math.min(1, Math.max(0, (v0 + 3) / 6))).toFixed(2));
        byM[1][k].setAttribute('fill-opacity', (0.06 + 0.88 * Math.min(1, Math.max(0, (v1 + 1.6) / 10))).toFixed(2));
        byM[2][k].setAttribute('fill-opacity', (0.06 + 0.94 * Math.min(1, att[a][b] * 1.6)).toFixed(2));
        byM[2][k].setAttribute('r', (5 + 9 * Math.sqrt(att[a][b])).toFixed(1));
      }
      // how far the attention pattern moves between two independent noisy inputs (mean total variation per row)
      const A1 = soft(qa), B1 = soft(qb); let tv = 0;
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) tv += Math.abs(A1[a][b] - B1[a][b]);
      tv /= 2 * n; tvEMA = tvEMA == null ? tv : tvEMA * 0.9 + tv * 0.1;
      if (t > 300) tvT.textContent = `${Math.round(tvEMA * 100)} %`;
    });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }

  // ------------------------------------------------------------------ overview columns (130 × 620 each)
  const MW = 130, MH = 620;
  const M = {};
  const mhead = (k, title, sub, col) => T(10, 40, String(k + 1).padStart(2, '0'), { size: 15, mono: true, fill: MUTED }) + T(10, 68, title, { size: 19, w: 750, fill: col || INK }) + T(10, 92, sub, { size: 15, mono: true, fill: MUTED });
  const rowsY = (d) => { const P = picks(d), ys = []; let y = 170; P.forEach((p, n) => { if (n && P[n - 1].k !== p.k) y += 18; ys.push(y); y += 52; }); return ys; };
  M.tokens = (d) => { const P = picks(d), ys = rowsY(d); let s = mhead(0, 'Tokens', `${d.n} of them`); P.forEach((p, n) => { s += rect(10, ys[n] - 14, 4, 28, chainCol(d, p.k), { rx: 2 }) + T(34, ys[n] + 9, p.aa, { size: 25, w: 750, anchor: 'middle', fill: p.ifc ? R : chainCol(d, p.k) }) + T(52, ys[n] + 6, p.tag, { size: 15, mono: true, fill: MUTED }); }); return s; };
  M.embedding = (d) => { const ys = rowsY(d); let s = mhead(1, 'Embedding', 's per token'); ys.forEach((y, n) => { s += hvec(12, y - 11, 106, 22, INK, 20, 31 + n); }); return s + T(10, ys[ys.length - 1] + 46, '384 numbers', { size: 15, mono: true, fill: MUTED }); };
  M.msa = () => { const rr = rnd(4); let s = mhead(2, 'MSA', 'evolution'); for (let r = 0; r < 12; r++) for (let j = 0; j < 11; j++) s += rect(12 + j * 10, 176 + r * 22, 8, 17, j === 2 || j === 8 ? rgba(R, r ? 0.35 : 0.6) : r ? rgba(Q, rr() < 0.25 ? 0.4 : 0.12) : rgba(INK, 0.5), { rx: 2 }); s += path('M27,170 C27,150 87,150 87,170', { stroke: R, sw: 1.6 }); return s + T(10, 470, '4 blocks', { size: 15, mono: true, fill: MUTED }); };
  M.pair = (d) => mhead(3, 'Pair map', 'z, N × N') + mapBox(d, 0, 10, 250, 110) + T(10, 392, 'at the start:', { size: 15, mono: true, fill: MUTED }) + T(10, 412, 'position only', { size: 15, mono: true, fill: MUTED });
  M.pairformer = (d) => mhead(4, 'Pairformer', '48 blocks') + sheets(10, 232, 110, 150, 5, 3) + rect(10, 232, 110, 150, PAPER, { rx: 8, stroke: LINE }) + mapBox(d, 1, 18, 254, 94) + T(10, 432, '× 4 passes', { size: 15, mono: true, fill: MUTED }) + T(10, 452, 'runs once', { size: 15, mono: true, fill: R });
  M.cond = (d) => mhead(5, 'c = (s, z)', 'hand-over') + rect(14, 250, 102, 102, PAPER, { rx: 10, stroke: INK, sw: 1.8 }) + vec(26, 264, 12, 74, INK, 12, 77) + img(mapImg(d, 1, 70), 46, 274, 58, 58) + T(10, 392, 'same for', { size: 15, mono: true, fill: R }) + T(10, 412, 'every call', { size: 15, mono: true, fill: R });
  M.denoiser = () => { let s = mhead(6, 'Denoiser', '200 calls') + rect(8, 180, 114, 270, PAPER, { rx: 10, stroke: INK, sw: 1.3 }); [['atom', 'encoder', 194, 60], ['token', 'transformer', 266, 104], ['atom', 'decoder', 382, 56]].forEach(([a, b, y, hh], k) => { s += rect(16, y, 98, hh, k === 1 ? rgba(Q, 0.1) : FAINT, { rx: 6, stroke: k === 1 ? Q : LINE }) + T(65, y + hh / 2 - 3, a, { size: 15, w: 600, anchor: 'middle' }) + T(65, y + hh / 2 + 15, b, { size: 15, w: 600, anchor: 'middle' }); }); return s; };
  M.sampler = (d) => { let s = mhead(7, 'Sampler', '2560 → 0 Å'); [[65, 230, 46, 70], [65, 330, 30, 46], [65, 410, 16, 26]].forEach(([cx, cy, rx, n], k) => { s += cloud(cx, cy, rx, rx * 0.8, n, 7 + k, { r: 2.4 }); if (k < 2) s += arrow(65, cy + rx * 0.85 + 4, 65, cy + rx * 0.85 + 22, R, { sw: 1.6 }); }); return s + T(10, 470, 'noise falls,', { size: 15, mono: true, fill: MUTED }) + T(10, 490, 'step by step', { size: 15, mono: true, fill: MUTED }); };
  M.structure = (d) => mhead(8, 'Structure', 'one sample') + protein(d, 65, 320, 56, 1, { lw: 1.7 });
  // where flow ribbons attach in each overview column (design units, top and bottom)
  const MPORT = { tokens: [150, 470], embedding: [150, 470], msa: [176, 436], pair: [250, 360], pairformer: [232, 382], cond: [250, 352], denoiser: [180, 450], sampler: [190, 440], structure: [262, 380] };
  const XPORT = [190, 500];          // expanded views: the band where ribbons attach (design units of 600)

  // ------------------------------------------------------------------ the strip: one persistent left-to-right chain
  const COLS = [
    { id: 'tokens', name: 'Tokens', step: 'tokens' }, { id: 'embedding', name: 'Embedding', step: 'embedding' }, { id: 'msa', name: 'MSA', step: 'msa' },
    { id: 'pair', name: 'Pair map', step: 'pair' }, { id: 'pairformer', name: 'Pairformer', step: 'triangle' }, { id: 'cond', name: 'c = (s, z)', step: 'cond' },
    { id: 'denoiser', name: 'Denoiser', step: 'denoiser' }, { id: 'sampler', name: 'Sampler', step: 'sampler' }, { id: 'structure', name: 'Structure', step: 'again' },
  ];
  const NC = COLS.length, LIVE = 7;
  const CW = 36, CG = 6, XG = 26, MG = 16;   // compact width, gap between compact columns, gap beside the open column, gap between overview columns
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let SX = null;                     // the strip, kept across steps

  function layout(W, focus) {
    const out = [];
    if (focus == null) { const w = (W - (NC - 1) * MG) / NC; for (let k = 0; k < NC; k++) out.push({ x: k * (w + MG), w, m: 'm' }); return out; }
    const fk = focus === 'live' ? LIVE : focus, last = focus === 'live' ? LIVE : NC - 1;
    let fixed = 0;
    for (let k = 0; k <= last; k++) { if (k !== fk) fixed += CW; if (k < last) fixed += (k === fk - 1 || k === fk) ? XG : CG; }
    const ew = W - fixed; let x = 0;
    for (let k = 0; k < NC; k++) {
      if (k > last) { out.push({ x: W, w: 0, m: 'h' }); continue; }
      const w = k === fk ? ew : CW; out.push({ x, w, m: k === fk ? 'x' : 'c' }); x += w + ((k === fk - 1 || k === fk) ? XG : CG);
    }
    return out;
  }
  // port (top, bottom in px) of a column in a given mode at a given size
  function portOf(k, mode, w, h) {
    if (mode === 'c' || mode === 'h') return [h * 0.44, h * 0.56];
    if (mode === 'x') { const sc = Math.min(w / DW, h / DH), oy = (h - DH * sc) / 2; return [oy + XPORT[0] * sc, oy + XPORT[1] * sc]; }
    const sc = Math.min(w / MW, h / MH), oy = (h - MH * sc) / 2, p = MPORT[COLS[k].id]; return [oy + p[0] * sc, oy + p[1] * sc];
  }
  function build(d) {
    const root = document.createElement('div'); root.className = 'fwx';
    root.innerHTML = `<div class="fwx-bar">${COLS.map((c, k) => `<button type="button" data-k="${k}"><span>${String(k + 1).padStart(2, '0')}</span>${esc(c.name)}</button>`).join('<i>→</i>')}</div>` +
      `<div class="fwx-body"><svg class="fwx-links"></svg><div class="fwx-prog"><i></i></div>` +
      COLS.map((c, k) => `<div class="fwx-col" data-k="${k}" data-id="${c.id}"><div class="fwx-c" title="${esc(c.name)}"><b>${String(k + 1).padStart(2, '0')}</b><span>${esc(c.name)}</span><i></i></div>` +
        `<div class="fwx-m">${svg(MW, MH, M[c.id](d), 'fwx-msvg')}</div><div class="fwx-x"></div></div>`).join('') + '</div>';
    const S = { root, d, dataId: d.id, cols: [...root.querySelectorAll('.fwx-col')], links: root.querySelector('.fwx-links'), prog: root.querySelector('.fwx-prog i'), body: root.querySelector('.fwx-body'), cur: null, focus: undefined, view: null, anim: 0 };
    S.cols.forEach((c, k) => { c.querySelector('.fwx-m svg').setAttribute('preserveAspectRatio', 'xMidYMid meet'); });
    const goto = (k) => { const i = FW.steps.findIndex((s) => s.id === COLS[k].step), b = document.querySelector(`#fwSteps li[data-i="${i}"] > button`); if (b) b.click(); };
    S.cols.forEach((c, k) => { c.querySelector('.fwx-c').addEventListener('click', () => goto(k)); c.querySelector('.fwx-m').addEventListener('click', () => goto(k)); });
    root.querySelectorAll('.fwx-bar button').forEach((b) => b.addEventListener('click', () => goto(+b.dataset.k)));
    return S;
  }
  function place(S, L, W, H, ports) {
    // columns
    L.forEach((c, k) => { const el = S.cols[k]; el.style.left = c.x.toFixed(1) + 'px'; el.style.width = Math.max(0, c.w).toFixed(1) + 'px'; });
    // ribbons between neighbours, in the gaps (they re-route every frame while the columns slide)
    let s = '';
    for (let k = 0; k < NC - 1; k++) {
      const a = L[k], b = L[k + 1]; if (b.w < 1 || a.w < 1) continue;
      const x1 = a.x + a.w, x2 = b.x, [a0, a1] = ports[k][1], [b0, b1] = ports[k + 1][0], cx = (x1 + x2) / 2;
      if (x2 - x1 < 0.5) continue;
      s += `<path d="M${x1},${a0} C${cx},${a0} ${cx},${b0} ${x2},${b0} L${x2},${b1} C${cx},${b1} ${cx},${a1} ${x1},${a1} Z" fill="${rgba(Q, 0.12)}"/>`;
      for (let q = 1; q < 4; q++) { const ya = a0 + (a1 - a0) * q / 4, yb = b0 + (b1 - b0) * q / 4; s += `<path d="M${x1},${ya} C${cx},${ya} ${cx},${yb} ${x2},${yb}" fill="none" stroke="${rgba(Q, 0.35)}" stroke-width="1"/>`; }
    }
    S.links.setAttribute('viewBox', `0 0 ${W} ${H}`); S.links.innerHTML = s;
  }
  function frameAt(S, from, to, e, W, H) {
    const L = to.map((c, k) => ({ x: from[k].x + (c.x - from[k].x) * e, w: from[k].w + (c.w - from[k].w) * e }));
    const ports = L.map((c, k) => {
      const pa = portOf(k, from[k].m, c.w, H), pb = portOf(k, to[k].m, c.w, H), mx = (u, v) => [u[0] + (v[0] - u[0]) * e, u[1] + (v[1] - u[1]) * e];
      const left = mx(pa, pb); return [left, left];
    });
    place(S, L, W, H, ports);
    return L.map((c, k) => ({ x: c.x, w: c.w, m: e < 1 ? to[k].m : to[k].m }));
  }
  // at the start of a move an opening column keeps showing its overview drawing; it switches to its detail at the end
  function setModes(S, L, phase) {
    S.cols.forEach((el, k) => {
      const m = L[k].m, open = m === 'x', had = el.classList.contains('is-x');
      el.classList.toggle('is-c', m === 'c'); el.classList.toggle('is-h', m === 'h');
      el.classList.toggle('is-m', m === 'm' || (open && phase === 'start' && !had));
      if (phase === 'end') { el.classList.toggle('is-x', open); if (open) el.classList.remove('is-m'); } else if (!open) el.classList.remove('is-x');
    });
  }
  function progress(S, L, focus) {
    const k = focus === 'live' ? LIVE : focus;
    S.root.querySelectorAll('.fwx-bar button').forEach((b) => { const j = +b.dataset.k; b.classList.toggle('on', k != null && (j === k || (focus === 'live' && j === NC - 1))); b.classList.toggle('done', k != null && j < k); });
    S.cols.forEach((el, j) => { el.classList.toggle('done', k != null && j < k); });
    if (S.narrow) { const on = S.root.querySelector('.fwx-bar button.on'); if (on) { const bar = S.root.querySelector('.fwx-bar'); bar.scrollTo({ left: on.offsetLeft - bar.clientWidth / 2 + on.clientWidth / 2, behavior: 'smooth' }); } }
  }
  // show `target` = { focus: null | column | 'live', view, fill(host) } — animating from wherever the strip is
  function strip(el, ctx, target) {
    const d = ctx.data;
    let S = SX, cont = S && S.root.isConnected && S.dataId === d.id;
    if (!cont) { if (S && S.root.parentNode) S.root.remove(); S = SX = build(d); }
    el.appendChild(S.root);
    if (cont) el.style.transition = 'none';                      // the strip itself is the transition
    const narrow = (el.closest('.fw-stage') || el).getBoundingClientRect().width < 900;
    S.narrow = narrow; S.root.classList.toggle('narrow', narrow);
    S.root.classList.toggle('ov', target.focus == null); S.root.classList.toggle('fx', target.focus != null); S.root.classList.toggle('lv', target.focus === 'live');
    const fk = target.focus === 'live' ? LIVE : target.focus;
    S.cols.forEach((c, k) => c.classList.toggle('focus', k === fk));
    const sameView = cont && S.focus === target.focus && S.view === target.view;
    const sameCol = cont && S.focus === target.focus;
    S.focus = target.focus; S.view = target.view;
    const token = ++S.anim;
    // the expanded content: fade the old one out, fill the new one once the column is wide
    let cleanup = null;
    const host = fk != null ? S.cols[fk].querySelector('.fwx-x') : null;
    S.cols.forEach((c, k) => { if (k !== fk) { const x = c.querySelector('.fwx-x'); c.classList.remove('is-x'); setTimeout(() => { if (S.anim === token && x.parentNode.classList.contains('is-x') === false) x.innerHTML = ''; }, 450); } });
    const fill = () => { if (!host || S.anim !== token) return; if (!(sameView && target.keep)) { host.innerHTML = ''; cleanup = target.fill(host) || null; } host.parentNode.classList.add('is-x'); ctx.play(); };
    const W = () => S.body.clientWidth || el.clientWidth, H = () => S.body.clientHeight || el.clientHeight;
    const to = layout(W(), target.focus);
    if (narrow) {
      S.cols.forEach((c) => { c.style.left = ''; c.style.width = ''; }); S.links.innerHTML = '';
      setModes(S, to, 'start'); progress(S, to, target.focus);
      if (host) { if (sameCol && !target.keep) host.parentNode.classList.remove('is-x'); ctx.later(sameCol ? 250 : 60, fill); } else ctx.play();
      S.cur = null;
      return () => { if (cleanup) cleanup(); el.style.transition = ''; };
    }
    const from = S.cur && cont ? S.cur : to.map((c) => ({ x: c.x, w: c.w, m: c.m }));
    setModes(S, to, 'start'); progress(S, to, target.focus);
    if (!cont && target.focus == null) {                           // first appearance: columns arrive left to right
      S.cols.forEach((c, k) => { c.style.opacity = '0'; c.style.transition = 'opacity .5s ease'; ctx.later(120 + k * 150, () => { c.style.opacity = ''; }); });
      S.links.style.opacity = '0'; S.links.style.transition = 'opacity .8s ease'; ctx.later(120 + NC * 150, () => { S.links.style.opacity = ''; });
    } else S.cols.forEach((c) => { c.style.opacity = ''; });
    const moving = from.some((c, k) => Math.abs(c.x - to[k].x) > 0.5 || Math.abs(c.w - to[k].w) > 0.5);
    const DUR = moving ? 950 : 0, t0 = performance.now();
    const pk = fk == null ? null : fk;
    const setProg = (L) => { if (pk == null) { S.prog.style.width = '0'; return; } const c = L[pk]; S.prog.style.width = (c.x + (target.focus === 'live' ? c.w : c.w / 2)).toFixed(1) + 'px'; };
    if (host && sameCol && !(sameView && target.keep)) host.parentNode.classList.remove('is-x');
    if (DUR) {
      ctx.raf((now) => { const t = Math.min(1, (now - t0) / DUR), e = easeIO(t); const L = frameAt(S, from, to, e, W(), H()); S.cur = L.map((c, k) => ({ x: c.x, w: c.w, m: to[k].m })); setProg(S.cur); if (t >= 1) { setModes(S, to, 'end'); fill(); } return t < 1; });
    } else { S.cur = frameAt(S, to, to, 1, W(), H()).map((c, k) => ({ x: c.x, w: c.w, m: to[k].m })); setProg(S.cur); setModes(S, to, 'end'); if (host) ctx.later(sameCol ? 280 : 30, fill); else ctx.play(); }
    if (!host && DUR) ctx.later(DUR, () => ctx.play());
    // keep the geometry right when the stage is resized
    const ro = new ResizeObserver(() => { if (S.anim !== token || S.narrow) return; const L2 = layout(W(), target.focus); S.cur = frameAt(S, L2, L2, 1, W(), H()).map((c, k) => ({ x: c.x, w: c.w, m: L2[k].m })); setProg(S.cur); });
    ro.observe(S.body);
    return () => { ro.disconnect(); if (cleanup) cleanup(); el.style.transition = ''; };
  }

  // ------------------------------------------------------------------ steps
  const MODEL_STEPS = [
    { id: 'overview', focus: null, title: 'The model in one picture', fig: 'one co-folding prediction, left to right',
      pts: ['The biology ended on a question: several binding poses can be plausible. A co-folding model produces one structure per run — and, started again from new noise, possibly another.', 'Sequences enter on the left, a structure leaves on the right. Columns 1–6 run once; the denoiser and sampler run 200 times.'],
      prin: 'This is OpenFold3’s architecture, which reproduces AlphaFold 3. Each step now opens one column; the rest of the chain stays in view.', dur: 9000 },
    { id: 'tokens', focus: 0, view: 'tokens', title: 'Tokens', fig: 'sequence → tokens',
      pts: ['Three chains: the antibody’s two variable domains and the domain of HER2 it binds — <b>345 residues</b>.', 'Each residue is one <b>token</b>, the unit everything after works on.'],
      prin: 'The model is never told where the interface is. The orange residues are what it has to find.' },
    { id: 'embedding', focus: 1, view: 'embedding', title: 'Embedding', fig: 'token → vectors',
      pts: ['Each token becomes a vector <b>s<sub>i</sub></b> from its residue type, its MSA profile and the atoms of a reference conformer.', 'Each pair gets a vector <b>z<sub>ij</sub></b>: s<sub>i</sub> and s<sub>j</sub>, plus where i and j sit along their chains.'],
      prin: 'Two representations start here: <b>s</b>, one vector per token, and <b>z</b>, one per pair. Between two chains, z knows nothing yet.' },
    { id: 'msa', focus: 2, view: 'msa', title: 'MSA', fig: 'evolution as evidence',
      pts: ['Related sequences from other species, aligned column by column.', 'Columns that change together hint at residues in contact; an outer product writes that into <b>z</b>.'],
      prin: 'Most of what the trunk knows comes from co-variation like this, not from physics.' },
    { id: 'pair', focus: 3, view: 'pair', title: 'Pair map', fig: 'one vector per pair',
      pts: ['<b>z</b> holds 128 numbers for every pair of tokens: 345 × 345 pairs here.', 'Read out as distances, it starts as little more than chain separation and should end as the contact map.'],
      prin: 'The interface lives in the off-diagonal block: antibody rows × antigen columns.' },
    { id: 'triangle', focus: 4, view: 'triangle', title: 'Triangle update', fig: 'Pairformer: one triangle update',
      pts: ['Each pair <b>(i, j)</b> is rewritten from the two other edges of every triangle <b>(i, j, k)</b>.', 'A sum over all k for every pair: N³ work, the expensive heart of the trunk.'],
      prin: 'If i is near k and k is near j, then i cannot be far from j. Local evidence becomes global geometry.' },
    { id: 'pairformer', focus: 4, view: 'pairformer', title: '48 blocks', fig: '48 blocks, four passes',
      pts: ['Triangle multiplications and triangle attentions on <b>z</b>, then attention on <b>s</b> with <b>z</b> as bias — 48 times, with fresh weights.', 'The whole trunk then runs again on its own output: four passes (“recycling”).'],
      prin: 'All of this runs <b>once per target</b>. The denoiser never runs the trunk again.' },
    { id: 'cond', focus: 5, view: 'cond', title: 'Condition c', fig: 'the hand-over',
      pts: ['The trunk’s output <b>c = (s, z)</b> is handed to the denoiser.', 'It is the same for all 200 calls. Only the noisy atoms and the noise level <b>σ</b> change.'],
      prin: 'Everything the model learned from sequence and evolution reaches the structure through this one hand-over.' },
    { id: 'denoiser', focus: 6, view: 'denoiser', title: 'Denoiser', fig: 'inside one denoiser call',
      pts: ['Noisy atoms in; local attention among atoms (32 queries see 128 keys); the atoms of each residue are pooled into one token.', 'A 24-block transformer over tokens, then back to atoms: out comes the guess <b>x̂</b>.'],
      prin: 'Ideally x̂ is the average of every clean structure compatible with the noisy input. That average is what the sampler steps towards.' },
    { id: 'pairbias', focus: 6, view: 'pairbias', title: 'Pair bias', fig: 'how c steers attention',
      pts: ['Attention scores come from two places: <b>q · k</b> from the noisy atoms, and a bias <b>b<sub>ij</sub></b> from the trunk’s pair map.', 'Drag the bias strength: the stronger the bias, the less the attention pattern changes with the noisy input.'],
      prin: 'This is how the trunk’s pair map reaches every attention layer of the denoiser: as an additive bias that does not change from call to call.', live: pairbiasLive, dur: 15000 },
  ];
  FW.chapter({ id: 'model', title: 'Inside the model', kicker: 'Part 2 · the model' });
  MODEL_STEPS.forEach((S) => FW.step({ chapter: 'model', id: S.id, title: S.title, caption: S.fig, points: S.pts, principle: S.prin, duration: S.dur || 13000,
    render: (el, ctx) => strip(el, ctx, { focus: S.focus, view: S.view, fill: (host) => { host.innerHTML = V[S.view](ctx.data); host.querySelector('svg').setAttribute('preserveAspectRatio', 'xMidYMid meet'); return S.live ? S.live(host, ctx) : null; } }) }));
  FW.model = { strip, protein, mapVal, mapCells, mapImg, mapBox, schedule, COLS };
})();
