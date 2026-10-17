// Fold a protein — the live steps (registered with fw-core.js): AlphaFold 3's sampler (SI Algorithm 18) run in
// the browser with the exact denoiser (posterior mean) for four antigen poses: the native one and three made-up
// rigid alternatives. The panel lives in the last columns of the model chapter's left-to-right strip
// (FW.model.strip): the 3D view is the hero — noisy input atoms and the denoiser's guess x̂, depth-cued,
// chain-coloured, the antigen tinted by the pose weights; below it a timeline of the noise schedule and the pose
// weights that doubles as the scrubber; on the right the controls, the weights now, and the folded samples.
(function () {
  'use strict';
  const FW = window.FW; if (!FW) return;
  const { rgba, esc } = FW.h;
  const INK = FW.C.ink, Q = FW.C.q, R = FW.C.r, MUTED = FW.C.muted;
  const CHAIN = [Q, INK, R];
  const POSE_COL = [R, FW.C.teal, FW.C.violet, FW.C.amber], POSE_NAME = ['native', 'alt 1', 'alt 2', 'alt 3'];
  const DEF = { n: 200, eta: 1.5, g0: 0.8 };
  const st = { seed: 1, traj: null, frame: 0, playing: false, samples: [], d: null, set: Object.assign({}, DEF), yaw: 0, pitch: 0.32, dragT: -1e9 };

  // ------------------------------------------------------------------ AF3 Algorithm 18 with an exact mixture denoiser
  function prng(seed) {
    let s = seed >>> 0, spare = null;
    const u = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    u.gauss = () => { if (spare !== null) { const v = spare; spare = null; return v; } let a, b, r; do { a = 2 * u() - 1; b = 2 * u() - 1; r = a * a + b * b; } while (r >= 1 || r === 0); const f = Math.sqrt(-2 * Math.log(r) / r); spare = b * f; return a * f; };
    return u;
  }
  // Karras schedule, ρ = 7, σ_data = 16 Å: 16·160 = 2560 Å down to 16·4e-4 = 0.0064 Å
  function schedule(n) { const a = Math.pow(160, 1 / 7), b = Math.pow(4e-4, 1 / 7), out = []; for (let i = 0; i <= n; i++) out.push(16 * Math.pow(a + i / n * (b - a), 7)); return out; }
  function denoise(x, sig) {
    const d = st.d, mu = d.mu, K = mu.length;
    if (K === 1) return { xh: Float64Array.from(mu[0]), w: [1] };
    const lw = mu.map((m) => { let s = 0; for (const i of d.ag_idx) for (let c = 0; c < 3; c++) { const v = x[3 * i + c] - m[3 * i + c]; s += v * v; } return -s / (2 * sig * sig); });
    const mx = Math.max(...lw), e = lw.map((v) => Math.exp(v - mx)), z = e.reduce((p, q) => p + q, 0), w = e.map((v) => v / z);
    const xh = new Float64Array(x.length);
    for (let k = 0; k < K; k++) if (w[k] > 1e-9) for (let t = 0; t < x.length; t++) xh[t] += w[k] * mu[k][t];
    return { xh, w };
  }
  function run(seed) {
    const { n, eta, g0 } = st.set, lam = 1.003, d = st.d;
    const sig = schedule(n), r = prng(seed * 7919 + (d.id === '1vii' ? 1 : 0)), N = d.n * 3;
    const x = new Float64Array(N); for (let t = 0; t < N; t++) x[t] = sig[0] * r.gauss();
    const f0 = denoise(x, sig[0]), frames = [{ sig: sig[0], xin: Float64Array.from(x), xh: f0.xh, w: f0.w }];
    for (let i = 1; i <= n; i++) {
      const gam = sig[i] > 1 ? g0 : 0, sh = sig[i - 1] * (1 + gam), add = lam * Math.sqrt(Math.max(sh * sh - sig[i - 1] * sig[i - 1], 0));
      const xt = new Float64Array(N); for (let t = 0; t < N; t++) xt[t] = x[t] + add * r.gauss();
      const { xh, w } = denoise(xt, sh);
      for (let t = 0; t < N; t++) x[t] = xt[t] + eta * (sig[i] - sh) * (xt[t] - xh[t]) / sh;
      frames.push({ sig: sh, xin: xt, xh, w });
    }
    frames.push({ sig: 0, xin: Float64Array.from(x), xh: Float64Array.from(x), w: frames[frames.length - 1].w });
    let pose = 0;
    if (d.mu.length > 1) { const ds = d.mu.map((m) => { let s = 0; for (const i of d.ag_idx) for (let c = 0; c < 3; c++) { const v = x[3 * i + c] - m[3 * i + c]; s += v * v; } return s; }); pose = ds.indexOf(Math.min(...ds)); }
    let commit = -1; for (let f = 0; f < frames.length; f++) if (Math.max(...frames[f].w) > 0.9) { commit = f; break; }
    return { frames, sig, n, pose, commit, seed };
  }

  // ------------------------------------------------------------------ helpers
  const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const mixRGB = (a, b, t) => a.map((v, k) => Math.round(v + (b[k] - v) * t));
  const css = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a == null ? 1 : a})`;
  const fmtS = (s) => (s <= 0 ? '0 Å' : (s >= 100 ? s.toFixed(0) : s >= 10 ? s.toFixed(1) : s >= 1 ? s.toFixed(2) : s >= 0.01 ? s.toFixed(3) : s.toFixed(4)) + ' Å');
  const chainRGB = (d, k) => hex(d.chains.length === 1 ? Q : CHAIN[k % 3]);
  function rAll(d) { if (d._rall) return d._rall; let m = d.R; (d.mu || []).forEach((mu) => { for (let i = 0; i < d.n; i++) m = Math.max(m, Math.hypot(mu[3 * i], mu[3 * i + 1], mu[3 * i + 2])); }); return (d._rall = m); }
  function projector(W, H, yaw, pitch, scale, cx, cy) {
    const ca = Math.cos(yaw), sa = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return (x, y, z) => { const X = x * ca + z * sa, Z = -x * sa + z * ca, Y = y * cp - Z * sp, Z2 = y * sp + Z * cp; return [cx + X * scale, cy - Y * scale, Z2]; };
  }
  // a depth-cued, chain-coloured Cα trace: segments binned into depth slabs, drawn far → near; each slab first
  // lays a white halo, then its colour, so near strands are outlined against far ones but joints stay continuous
  // Catmull-Rom through the projected Cα positions (projection is linear, so this equals smoothing in 3D)
  function subsegs(d, P, S) {
    const out = [], n = d.n, cr = (a, b, c, e, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - e) * t * t + (-a + 3 * b - 3 * c + e) * t * t * t);
    for (let i = 0; i < n - 1; i++) {
      if (d.chain_of[i] !== d.chain_of[i + 1]) continue;
      const p0 = i > 0 && d.chain_of[i - 1] === d.chain_of[i] ? P[i - 1] : P[i], p1 = P[i], p2 = P[i + 1], p3 = i + 2 < n && d.chain_of[i + 2] === d.chain_of[i] ? P[i + 2] : P[i + 1];
      let prev = p1;
      for (let k = 1; k <= S; k++) {
        const t = k / S, q = [0, 1, 2].map((c) => cr(p0[c], p1[c], p2[c], p3[c], t));
        out.push([prev, q, i]); prev = q;
      }
    }
    return out;
  }
  function drawTrace(g, d, X, pj, Rr, colOf, lw0, slabs) {
    const n = d.n, P = new Array(n), NS = slabs || 9;
    for (let i = 0; i < n; i++) P[i] = pj(X[3 * i], X[3 * i + 1], X[3 * i + 2]);
    const bins = Array.from({ length: NS }, () => []);
    for (const sg of subsegs(d, P, n < 120 ? 6 : 3)) {
      const f = Math.max(0, Math.min(0.999, ((sg[0][2] + sg[1][2]) / 2 / Rr + 1) / 2));
      bins[Math.floor(f * NS)].push(sg);
    }
    g.lineCap = 'round'; g.lineJoin = 'round';
    bins.forEach((segs, b) => {
      if (!segs.length) return;
      const f = (b + 0.5) / NS, w = lw0 * (0.6 + 0.75 * f);
      g.strokeStyle = '#ffffff'; g.lineWidth = w + lw0 * 0.8; g.beginPath();
      for (const [a, c] of segs) { g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); }
      g.stroke();
      const groups = new Map();
      for (const sg of segs) { const c = colOf(sg[2]), key = c.join(','); if (!groups.has(key)) groups.set(key, [c, []]); groups.get(key)[1].push(sg); }
      groups.forEach(([c, list]) => {
        g.strokeStyle = css(mixRGB(c, [248, 250, 253], 0.66 * (1 - f))); g.lineWidth = w; g.beginPath();
        for (const [a, e] of list) { g.moveTo(a[0], a[1]); g.lineTo(e[0], e[1]); }
        g.stroke();
      });
    });
  }

  // ------------------------------------------------------------------ the panel
  const PANEL = `<div class="fwl">
    <div class="fwl-main">
      <div class="fwl-view">
        <canvas class="fwl-cv" aria-label="the structure being sampled"></canvas>
        <div class="fwl-hud"><div class="fwl-k">08 · sampler · noise level <span class="nc">σ</span></div><div class="fwl-sig">—</div><div class="fwl-stepn"></div></div>
        <div class="fwl-badge" hidden></div>
        <div class="fwl-legend"></div>
        <div class="fwl-hint">drag to turn</div>
      </div>
      <div class="fwl-tl"><canvas class="fwl-tlc" aria-label="timeline: noise level and pose weights per step; drag to scrub"></canvas></div>
    </div>
    <aside class="fwl-side">
      <div class="fwl-k">09 · structure</div>
      <div class="fwl-btns"><button type="button" class="fwl-go">Fold a new one</button><button type="button" class="fwl-go8" title="fold eight seeds at once">×&thinsp;8</button></div>
      <details class="fwl-set"><summary>Sampler <span>AF3 defaults</span></summary>
        <label><span>step scale η</span><input type="range" data-k="eta" min="1" max="2" step="0.05"><output></output></label>
        <label><span>churn γ<sub>0</sub></span><input type="range" data-k="g0" min="0" max="1" step="0.05"><output></output></label>
        <label><span>steps</span><input type="range" data-k="n" min="10" max="200" step="10"><output></output></label>
        <button type="button" class="fwl-reset">reset to η 1.5 · γ₀ 0.8 · 200</button>
      </details>
      <div class="fwl-k">guess <span class="nc">x̂</span> built from</div>
      <div class="fwl-w"></div>
      <div class="fwl-k fwl-sk">Samples <span class="fwl-tally"></span></div>
      <div class="fwl-samp"></div>
    </aside></div>`;

  let ui = null;
  function q(sel) { return ui.root.querySelector(sel); }
  function fold(count) {
    const d = st.d; let tr = null;
    for (let k = 0; k < (count || 1); k++) {
      tr = run(st.seed);
      st.samples.push({ seed: st.seed, pose: tr.pose, id: d.id, fresh: true });
      st.seed += 1;
    }
    st.traj = tr; st.frame = 0; st.playing = true; st.playStart = performance.now();
    renderSamples(); showFrame(); drawTimeline();
  }
  function renderWeights(w) {
    const K = st.d.mu.length, box = q('.fwl-w');
    if (+box.dataset.k !== K) {
      box.dataset.k = K;
      box.innerHTML = (K === 1 ? ['fold'] : POSE_NAME).map((nm, k) => `<div class="fwl-wr"><i style="background:${K === 1 ? Q : POSE_COL[k]}"></i><b>${nm}</b><span class="fwl-bar"><em style="background:${K === 1 ? Q : POSE_COL[k]}"></em></span><span class="fwl-pct">–</span></div>`).join('');
    }
    box.querySelectorAll('.fwl-wr').forEach((row, k) => { const v = w ? w[k] : 1 / K; row.querySelector('em').style.width = (100 * v).toFixed(1) + '%'; row.querySelector('.fwl-pct').textContent = w ? Math.round(100 * v) + '%' : '–'; row.classList.toggle('on', !!w && v > 0.5); });
  }
  function renderSamples() {
    const d = st.d, list = st.samples.filter((s) => s.id === d.id), K = d.mu.length, box = q('.fwl-samp');
    const found = new Set(list.map((s) => s.pose)).size;
    q('.fwl-tally').textContent = list.length ? `${list.length} folded · ${K > 1 ? `${found}/4 poses` : 'one fold'}` : '';
    if (+box.dataset.k !== K || box.dataset.id !== d.id) {
      box.dataset.k = K; box.dataset.id = d.id;
      box.innerHTML = Array.from({ length: K }, (_, k) => `<div class="fwl-col"><canvas width="160" height="136"></canvas><span class="fwl-cn" style="color:${K === 1 ? Q : POSE_COL[k]}">${K === 1 ? 'the fold' : POSE_NAME[k]}</span><div class="fwl-dots"></div></div>`).join('');
      box.querySelectorAll('canvas').forEach((cv, k) => thumb(cv, k));
    }
    box.querySelectorAll('.fwl-col').forEach((col, k) => {
      const mine = list.filter((s) => s.pose === k);
      col.querySelector('.fwl-dots').innerHTML = mine.slice(-24).map((s) => `<i class="h${s.fresh ? ' new' : ''}" style="--c:${K === 1 ? Q : POSE_COL[k]}" title="seed ${s.seed}"></i>`).join('') + (mine.length > 24 ? `<span>+${mine.length - 24}</span>` : '');
      col.classList.toggle('hit', mine.length > 0);
    });
    list.forEach((s) => { s.fresh = false; });
    if (!list.length) box.classList.add('empty'); else box.classList.remove('empty');
  }
  // a still of pose k: the antibody in grey, the antigen in the pose colour
  function thumb(cv, k) {
    const d = st.d, g = cv.getContext('2d'), W = cv.width, H = cv.height, Rr = rAll(d);
    g.clearRect(0, 0, W, H);
    const pj = projector(W, H, 0.55, 0.32, Math.min(W, H) / (2.05 * Rr), W / 2, H / 2), X = d.mu[k] || d.mu[0], K = d.mu.length;
    drawTrace(g, d, X, pj, Rr, (i) => (K === 1 ? hex(Q) : d.chain_of[i] === d.chains.length - 1 ? hex(POSE_COL[k]) : [168, 178, 198]), 3.4, 4);
  }

  // ------------------------------------------------------------------ the 3D view
  function sizeCanvas(cv) {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(10, Math.round(r.width * dpr)), h = Math.max(10, Math.round(r.height * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return dpr;
  }
  function drawView(now) {
    const cv = ui.cv, g = ui.g, d = st.d, dpr = sizeCanvas(cv), W = cv.width, H = cv.height, Rr = rAll(d), K = d.mu.length;
    if (now - st.dragT > 2500) st.yaw += 0.0016;
    g.clearRect(0, 0, W, H);
    const tr = st.traj, fr = tr ? tr.frames[Math.max(0, Math.min(st.frame, tr.frames.length - 1))] : null, xh = fr ? fr.xh : d.mu[0];
    const scale = Math.min(W, H * 1.12) / (2.25 * Rr), cx = W / 2, cy = H * 0.52;
    const pj = projector(W, H, st.yaw, st.pitch, scale, cx, cy);
    // floor shadow
    g.save(); g.translate(cx, cy + Rr * scale * 0.98); g.scale(1, 0.16);
    const sg = g.createRadialGradient(0, 0, 0, 0, 0, Rr * scale * 0.95); sg.addColorStop(0, 'rgba(4,32,75,0.13)'); sg.addColorStop(1, 'rgba(4,32,75,0)');
    g.fillStyle = sg; g.beginPath(); g.arc(0, 0, Rr * scale * 0.95, 0, Math.PI * 2); g.fill(); g.restore();
    // the plausible antigen poses, faint
    if (K > 1) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      d.mu.forEach((mu, k) => {
        g.strokeStyle = css(hex(POSE_COL[k]), 0.2); g.lineWidth = 1.6 * dpr; g.beginPath();
        let prev = -2; for (const i of d.ag_idx) { const p = pj(mu[3 * i], mu[3 * i + 1], mu[3 * i + 2]); if (i === prev + 1) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); prev = i; }
        g.stroke();
      });
    }
    // the noisy input, pulled towards the guess so that it fits (factor shown in the legend)
    let shrink = 1;
    if (fr && fr.sig > 0) {
      shrink = Math.min(1, 14 / fr.sig);
      const pts = [];
      for (let i = 0; i < d.n; i++) { const a = 3 * i; pts.push([pj(xh[a] + (fr.xin[a] - xh[a]) * shrink, xh[a + 1] + (fr.xin[a + 1] - xh[a + 1]) * shrink, xh[a + 2] + (fr.xin[a + 2] - xh[a + 2]) * shrink), d.chain_of[i]]); }
      pts.sort((a, b) => a[0][2] - b[0][2]);
      for (const [p, ch] of pts) { const f = Math.max(0, Math.min(1, (p[2] / Rr + 1) / 2)); g.fillStyle = css(mixRGB(chainRGB(d, ch), [255, 255, 255], 0.3 + 0.35 * (1 - f)), 0.75); g.beginPath(); g.arc(p[0], p[1], (1.5 + 1.6 * f) * dpr, 0, Math.PI * 2); g.fill(); }
    }
    // the guess x̂; the antigen tinted by the pose weights
    const w = fr ? fr.w : (K > 1 ? [1, 0, 0, 0] : [1]);
    let agCol = hex(R);
    if (K > 1) { agCol = [0, 0, 0]; w.forEach((v, k) => { const c = hex(POSE_COL[k]); agCol = agCol.map((x, j) => x + v * c[j]); }); agCol = agCol.map(Math.round); }
    const ag = d.chains.length - 1;
    drawTrace(g, d, xh, pj, Rr, (i) => (K > 1 && d.chain_of[i] === ag ? agCol : chainRGB(d, d.chain_of[i])), Math.max(2.2, Math.min(d.n < 120 ? 7 : 4.4, W / (d.n < 120 ? 130 : 240))));
    // legend text that depends on the frame
    const lg = ui.legendNote;
    if (lg) lg.textContent = fr && fr.sig > 0 ? (shrink < 1 ? `dots: the noisy input x, drawn ${Math.round(1 / shrink)}× closer than it is` : 'dots: the noisy input x') : 'line: the guess x̂ — at the end, the new structure';
  }
  // ------------------------------------------------------------------ the timeline: σ per step, pose weights per step, playhead
  function drawTimeline() {
    const cv = ui.tl, g = ui.tg, dpr = sizeCanvas(cv), W = cv.width, H = cv.height, d = st.d, K = d.mu.length;
    g.clearRect(0, 0, W, H);
    const tr = st.traj, sig = tr ? tr.sig : schedule(st.set.n), n = sig.length - 1;
    const L = 84 * dpr, Rm = 14 * dpr, x = (i) => L + (W - L - Rm) * i / n;
    const s0 = 6 * dpr, s1 = H * 0.56, w0 = H * 0.66, w1 = H - 6 * dpr;
    const lmax = Math.log10(2560), lmin = Math.log10(0.0064), ys = (s) => s0 + (lmax - Math.log10(Math.max(s, 0.0064))) / (lmax - lmin) * (s1 - s0);
    g.font = `${13 * dpr}px "JetBrains Mono", ui-monospace, monospace`; g.textBaseline = 'middle'; g.fillStyle = MUTED; g.textAlign = 'right';
    g.fillText('2560 Å', L - 8 * dpr, s0 + 5 * dpr); g.fillText('0.006 Å', L - 8 * dpr, s1 - 4 * dpr);
    g.fillText(K > 1 ? 'pose w' : 'weight', L - 8 * dpr, (w0 + w1) / 2);
    // σ curve with fill
    g.beginPath(); g.moveTo(x(0), s1); for (let i = 0; i <= n; i++) g.lineTo(x(i), ys(sig[i])); g.lineTo(x(n), s1); g.closePath(); g.fillStyle = 'rgba(4,32,75,0.06)'; g.fill();
    g.beginPath(); for (let i = 0; i <= n; i++) (i ? g.lineTo : g.moveTo).call(g, x(i), ys(sig[i])); g.strokeStyle = INK; g.lineWidth = 1.8 * dpr; g.stroke();
    // churn switches off below 1 Å
    const i1 = sig.findIndex((s) => s <= 1); if (i1 > 0) { g.setLineDash([3 * dpr, 3 * dpr]); g.strokeStyle = 'rgba(4,32,75,0.35)'; g.lineWidth = 1 * dpr; g.beginPath(); g.moveTo(x(i1), s0); g.lineTo(x(i1), s1); g.stroke(); g.setLineDash([]); const lb = W < 700 * dpr ? '1 Å' : '1 Å · churn off', lw = g.measureText(lb).width, right = x(i1) + 6 * dpr + lw < W - Rm; g.textAlign = right ? 'left' : 'right'; g.fillStyle = MUTED; g.fillText(lb, x(i1) + (right ? 6 : -6) * dpr, s0 + 6 * dpr); }
    // pose weights as a stacked band
    g.fillStyle = 'rgba(4,32,75,0.05)'; g.fillRect(L, w0, W - L - Rm, w1 - w0);
    if (tr) {
      const F = tr.frames, nf = F.length - 1, xf = (f) => L + (W - L - Rm) * f / nf;
      for (let k = K - 1; k >= 0; k--) {
        g.beginPath();
        for (let f = 0; f <= nf; f++) { let c = 0; for (let j = 0; j <= k; j++) c += F[f].w[j] || 0; const yy = w1 - c * (w1 - w0); f ? g.lineTo(xf(f), yy) : g.moveTo(xf(f), yy); }
        g.lineTo(xf(nf), w1); g.lineTo(xf(0), w1); g.closePath(); g.fillStyle = K === 1 ? 'rgba(47,91,211,0.55)' : css(hex(POSE_COL[k]), 0.8); g.fill();
      }
      if (tr.commit > 0 && K > 1) {
        const cx = xf(tr.commit); g.strokeStyle = 'rgba(4,32,75,0.5)'; g.setLineDash([2 * dpr, 3 * dpr]); g.lineWidth = 1 * dpr; g.beginPath(); g.moveTo(cx, s0); g.lineTo(cx, w1); g.stroke(); g.setLineDash([]);
        const lab = `commits at σ ≈ ${fmtS(F[tr.commit].sig)}`; g.font = `600 ${13 * dpr}px Inter, system-ui, sans-serif`; g.fillStyle = INK; const tw = g.measureText(lab).width;
        const lx = Math.max(L + 4 * dpr, cx + 8 * dpr + tw > W - Rm ? cx - 8 * dpr - tw : cx + 8 * dpr); g.textAlign = 'left'; g.fillText(lab, lx, s1 - 12 * dpr);
      }
      // playhead
      const ph = xf(Math.min(st.frame, nf)); g.strokeStyle = R; g.lineWidth = 2 * dpr; g.beginPath(); g.moveTo(ph, 2 * dpr); g.lineTo(ph, H - 2 * dpr); g.stroke();
      const fs = F[Math.min(st.frame, nf)].sig; if (fs > 0) { g.fillStyle = '#fff'; g.strokeStyle = R; g.beginPath(); g.arc(ph, ys(fs), 5 * dpr, 0, Math.PI * 2); g.fill(); g.stroke(); }
    }
  }
  function showFrame() {
    const tr = st.traj; if (!tr) { renderWeights(null); return; }
    const f = Math.max(0, Math.min(st.frame, tr.frames.length - 1)), fr = tr.frames[f], done = f >= tr.frames.length - 1, K = st.d.mu.length;
    q('.fwl-sig').textContent = done ? '0 Å' : fmtS(fr.sig);
    q('.fwl-stepn').textContent = done ? `done · ${tr.n} steps` : `step ${Math.min(f, tr.n)} of ${tr.n}`;
    const b = q('.fwl-badge');
    b.hidden = !done;
    if (done) b.innerHTML = K > 1 ? `<i style="background:${POSE_COL[tr.pose]}"></i>new structure · antigen in pose <b style="color:${POSE_COL[tr.pose]}">${POSE_NAME[tr.pose]}</b>` : `<i style="background:${Q}"></i>new structure · the villin fold`;
    renderWeights(fr.w); drawTimeline();
  }
  function tick(now) {
    if (st.playing && st.traj) {
      const tot = st.traj.frames.length, f = Math.floor(Math.max(0, Math.min(1, (now - st.playStart) / 6500)) * (tot - 1));
      if (f !== st.frame) { st.frame = f; showFrame(); }
      if (f >= tot - 1) st.playing = false;
    }
    drawView(now);
  }
  function legend(d) {
    const K = d.mu.length;
    const chips = d.chains.map((c, k) => `<span><i style="background:${d.chains.length === 1 ? Q : k === d.chains.length - 1 && K > 1 ? 'linear-gradient(90deg,' + POSE_COL.join(',') + ')' : CHAIN[k % 3]}"></i>${esc(c.name.replace('light chain ', '').replace('heavy chain ', ''))}</span>`).join('');
    return `<div class="fwl-chips">${chips}</div>${K > 1 ? '<div>faint lines: the four antigen poses the data allows</div>' : ''}<div class="fwl-note"></div>`;
  }

  function mount(el, ctx, enter) {
    el.innerHTML = PANEL;
    ui = { root: el.querySelector('.fwl') };
    ui.cv = q('.fwl-cv'); ui.g = ui.cv.getContext('2d'); ui.tl = q('.fwl-tlc'); ui.tg = ui.tl.getContext('2d');
    st.d = ctx.data;
    if (st.lastId !== st.d.id) { st.traj = null; st.lastId = st.d.id; }
    q('.fwl-legend').innerHTML = legend(st.d); ui.legendNote = q('.fwl-note');
    q('.fwl-go').onclick = () => fold(1);
    q('.fwl-go8').onclick = () => fold(8);
    // sampler settings
    const fmt = { eta: (v) => (+v).toFixed(2), g0: (v) => (+v).toFixed(2), n: (v) => String(v) };
    const inputs = ui.root.querySelectorAll('.fwl-set input');
    const sync = () => inputs.forEach((inp) => { inp.value = st.set[inp.dataset.k]; inp.nextElementSibling.textContent = fmt[inp.dataset.k](inp.value); });
    sync();
    inputs.forEach((inp) => { inp.oninput = () => { st.set[inp.dataset.k] = +inp.value; inp.nextElementSibling.textContent = fmt[inp.dataset.k](inp.value); if (!st.traj) drawTimeline(); }; inp.onchange = () => fold(1); });
    q('.fwl-reset').onclick = () => { st.set = Object.assign({}, DEF); sync(); fold(1); };
    // scrub on the timeline
    let scrub = false;
    const toFrame = (ev) => { if (!st.traj) return; const r = ui.tl.getBoundingClientRect(), L = 84, u = (ev.clientX - r.left - L) / (r.width - L - 14); st.playing = false; st.frame = Math.round(Math.max(0, Math.min(1, u)) * (st.traj.frames.length - 1)); showFrame(); };
    ui.tl.addEventListener('pointerdown', (ev) => { scrub = true; ui.tl.setPointerCapture(ev.pointerId); toFrame(ev); });
    ui.tl.addEventListener('pointermove', (ev) => { if (scrub) toFrame(ev); });
    ui.tl.addEventListener('pointerup', () => { scrub = false; });
    // turn the structure by dragging
    let drag = null;
    ui.cv.addEventListener('pointerdown', (ev) => { drag = [ev.clientX, ev.clientY, st.yaw, st.pitch]; ui.cv.setPointerCapture(ev.pointerId); st.dragT = performance.now(); });
    ui.cv.addEventListener('pointermove', (ev) => { if (!drag) return; st.yaw = drag[2] + (ev.clientX - drag[0]) * 0.01; st.pitch = Math.max(-1.2, Math.min(1.2, drag[3] + (ev.clientY - drag[1]) * 0.01)); st.dragT = performance.now(); });
    ui.cv.addEventListener('pointerup', () => { drag = null; st.dragT = performance.now(); });
    const ro = new ResizeObserver(() => { drawTimeline(); }); ro.observe(ui.tl);
    renderWeights(null); renderSamples(); drawTimeline();
    if (enter === 'fold') fold(1);
    else if (enter === 'again' && st.samples.filter((s) => s.id === st.d.id).length < 4) fold(8);
    else if (st.traj) { st.frame = st.traj.frames.length - 1; st.playing = false; showFrame(); }
    ctx.raf((t) => { tick(t); });
    return () => ro.disconnect();
  }
  const live = (enter) => (el, ctx) => FW.model.strip(el, ctx, { focus: 'live', view: enter, fill: (host) => mount(host, ctx, enter) });
  FW.chapter({ id: 'live', title: 'Fold one yourself', kicker: 'Part 3 · live' });
  FW.step({ chapter: 'live', id: 'sampler', title: 'Sampler', caption: '200 steps, computed live', live: true,
    points: ['Every atom starts at random, spread 2560 Å. Each step adds a little noise, asks the denoiser for its guess <b>x̂</b> and moves towards it.', 'The band under the view shows the noise level σ falling and which antigen pose the guess is built from. Drag on it to scrub; drag the structure to turn it.'],
    principle: 'At high noise the guess is the average of all four poses — the antigen sits in between them. Somewhere around 10–50 Å it commits to one.',
    render: live('fold') });
  FW.step({ chapter: 'live', id: 'again', title: 'Fold again', caption: 'a new seed, another pose', live: true,
    points: ['Each fold starts from different random noise. Different starting noise can commit to a different antigen pose.', 'Fold again, or eight at once: the sample collection on the right shows which poses the samples reached.'],
    principle: 'The sampler draws from the distribution the denoiser describes: with four poses in it, repeated folds land in different ones. Try fewer steps, or η = 1 and γ₀ = 0, and watch the timeline.',
    render: live('again') });
})();
