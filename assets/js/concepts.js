// Concept cards: the renderers of the thesis desk (050_system/src/components/concepts), without React.
// Animations run model-written canvas code in a sandboxed iframe (allow-scripts only, CSP without
// network), are started when first scrolled into view and paused while off screen.
// Adapted from Get It. (github.com/beltromatti/get-it, Apache-2.0) via PaperManager; changed: rewritten
// without React, iframe sandbox and CSP added, off-screen pausing. Licence text: /assets/js/LICENSE-get-it.txt
(function () {
  const CSP = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'";
  const DOC = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<style>html,body{margin:0;height:100%;background:#fff;overflow:hidden}canvas{display:block;width:100%;height:100%}</style>
</head><body><canvas id="c"></canvas><script>
(function () {
  var canvas = document.getElementById("c"), ctx = canvas.getContext("2d");
  var raf = 0, failed = false, draw = null, t0 = 0, last = 0, pausedAt = 0, paused = false;
  function report(where, e) {
    if (failed) return; failed = true; cancelAnimationFrame(raf);
    parent.postMessage({ type: "concept-anim-error", message: "Animation crashed " + where + ": " + (e && e.message ? e.message : String(e)) }, "*");
  }
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr); canvas.height = Math.floor(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function tick(now) {
    try { draw(ctx, innerWidth, innerHeight, (now - t0) / 1000, Math.min((now - last) / 1000, 0.1)); }
    catch (e) { report("mid-frame", e); return; }
    last = now; raf = requestAnimationFrame(tick);
  }
  window.addEventListener("resize", size);
  window.addEventListener("message", function (ev) {
    var d = ev.data || {};
    if (d.type === "concept-anim-pause" && draw && !paused) { paused = true; pausedAt = performance.now(); cancelAnimationFrame(raf); }
    if (d.type === "concept-anim-resume" && draw && paused && !failed) {
      paused = false; var gap = performance.now() - pausedAt; t0 += gap; last += gap; raf = requestAnimationFrame(tick);
    }
    if (d.type !== "concept-anim-run") return;
    cancelAnimationFrame(raf); failed = false; paused = false; size();
    try {
      var ret = new Function("api", "var ctx = api.ctx, width = api.width, height = api.height;\\n" + d.code)(
        { ctx: ctx, width: innerWidth, height: innerHeight });
      if (!ret || typeof ret.draw !== "function") throw new Error("setup_code did not return { draw }");
      draw = ret.draw;
    } catch (e) { report("at setup", e); return; }
    t0 = last = performance.now(); raf = requestAnimationFrame(tick);
  });
  window.addEventListener("error", function (e) { report("uncaught", e.error || e.message); });
  parent.postMessage({ type: "concept-anim-ready" }, "*");
})();
<\/script></body></html>`;

  const COLORS = ['#0B4FC0', '#B4552F', '#04204B', '#138374', '#6A47C2', '#8098BC'];

  function fail(fig, msg) {
    if (fig.querySelector('.concept-error')) return;
    const p = document.createElement('p');
    p.className = 'concept-error';
    p.textContent = msg;
    fig.querySelector('.concept-stage').after(p);
  }

  // ------------------------------------------------------------------ animations
  const frames = new Map(); // iframe.contentWindow -> {fig, code, frame, started, ready}
  window.addEventListener('message', (ev) => {
    const a = frames.get(ev.source);
    if (!a) return;
    if (ev.data && ev.data.type === 'concept-anim-ready') { a.ready = true; if (a.visible) start(a); }
    if (ev.data && ev.data.type === 'concept-anim-error') fail(a.fig, String(ev.data.message));
  });
  function start(a) {
    a.started = true;
    a.frame.contentWindow.postMessage({ type: 'concept-anim-run', code: a.code }, '*');
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      const a = e.target.__anim;
      a.visible = e.isIntersecting;
      if (!a.ready) continue;
      if (a.visible && !a.started) start(a);
      else a.frame.contentWindow.postMessage({ type: a.visible ? 'concept-anim-resume' : 'concept-anim-pause' }, '*');
    }
  }, { rootMargin: '80px' }) : null;

  function anim(fig, spec) {
    const frame = document.createElement('iframe');
    frame.className = 'concept-frame';
    frame.title = spec.title || 'animation';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('loading', 'lazy');
    frame.srcdoc = DOC;
    fig.querySelector('.concept-stage').appendChild(frame);
    const a = { fig, frame, code: spec.setup_code, ready: false, started: false, visible: !io };
    fig.__anim = a;
    frame.addEventListener('load', () => frames.set(frame.contentWindow, a));
    frames.set(frame.contentWindow, a);
    if (io) io.observe(fig);
    const r = fig.querySelector('[data-replay]');
    if (r) r.addEventListener('click', () => { const e = fig.querySelector('.concept-error'); if (e) e.remove(); if (a.ready) start(a); });
  }

  // ------------------------------------------------------------------ graphs
  function parseGraph(spec) {
    const data = JSON.parse(spec.data_json);
    if (spec.chart_type === 'bars') return { kind: 'bars', bars: data.bars.map((b) => ({ label: String(b.label), value: +b.value })) };
    const raw = spec.chart_type === 'points' ? [{ name: spec.title, points: data.points }] : data.series;
    return { kind: 'series', series: raw.map((s, i) => ({ name: s.name || '', color: /^#[0-9a-f]{3,8}$/i.test(s.color || '') ? s.color : COLORS[i % COLORS.length], points: s.points })) };
  }
  function graph(fig, spec) {
    const stage = fig.querySelector('.concept-stage');
    const c = document.createElement('canvas');
    c.className = 'concept-canvas';
    stage.appendChild(c);
    let data;
    try { data = parseGraph(spec); } catch (e) { fail(fig, 'Could not parse graph data: ' + e.message); return; }
    const render = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      if (!W || !H) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = W * dpr; c.height = H * dpr;
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const pad = { l: 52, r: 14, t: 30, b: data.kind === 'bars' ? 52 : 40 };
      const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
      const ink = '#04204B', muted = '#3D5F91';
      ctx.font = "11.5px 'JetBrains Mono', ui-monospace, monospace";
      const axisLabels = () => {
        ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(spec.x_label || '', pad.l + pw / 2, H - 6);
        ctx.save(); ctx.translate(13, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(spec.y_label || '', 0, 0); ctx.restore();
      };
      if (data.kind === 'bars') {
        const maxV = Math.max(...data.bars.map((b) => b.value), 0) || 1;
        const slot = pw / data.bars.length;
        ctx.strokeStyle = 'rgba(4,32,75,0.15)';
        ctx.beginPath(); ctx.moveTo(pad.l, pad.t + ph); ctx.lineTo(pad.l + pw, pad.t + ph); ctx.stroke();
        data.bars.forEach((b, i) => {
          const bh = (Math.max(b.value, 0) / maxV) * ph * 0.92;
          const x = pad.l + i * slot + slot * 0.18;
          ctx.fillStyle = COLORS[i % COLORS.length];
          ctx.fillRect(x, pad.t + ph - bh, slot * 0.64, bh);
          ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText(String(b.value), x + slot * 0.32, pad.t + ph - bh - 4);
          ctx.fillStyle = ink; ctx.textBaseline = 'top';
          // wrap the label onto two lines if needed
          const words = b.label.split(' '); let line = '', y = pad.t + ph + 5; const lines = [];
          for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > slot - 6 && line) { lines.push(line); line = w; } else line = t; }
          lines.push(line);
          lines.slice(0, 2).forEach((l) => { ctx.fillText(l, x + slot * 0.32, y); y += 14; });
        });
        axisLabels();
        return;
      }
      const all = data.series.flatMap((s) => s.points);
      let x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0]));
      let y0 = Math.min(...all.map((p) => p[1])), y1 = Math.max(...all.map((p) => p[1]));
      if (x0 === x1) { x0 -= 1; x1 += 1; }
      if (y0 === y1) { y0 -= 1; y1 += 1; }
      const py = (y1 - y0) * 0.06; y0 -= py; y1 += py;
      const sx = (x) => pad.l + ((x - x0) / (x1 - x0)) * pw;
      const sy = (y) => pad.t + ph - ((y - y0) / (y1 - y0)) * ph;
      const fmt = (v) => (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0) ? v.toExponential(1) : +v.toFixed(2) + '');
      ctx.strokeStyle = 'rgba(4,32,75,0.08)'; ctx.lineWidth = 1; ctx.fillStyle = muted;
      for (let i = 0; i <= 4; i++) {
        const y = y0 + ((y1 - y0) * i) / 4;
        ctx.beginPath(); ctx.moveTo(pad.l, sy(y)); ctx.lineTo(pad.l + pw, sy(y)); ctx.stroke();
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(fmt(y), pad.l - 5, sy(y));
      }
      for (let i = 0; i <= 5; i++) {
        const x = x0 + ((x1 - x0) * i) / 5;
        ctx.beginPath(); ctx.moveTo(sx(x), pad.t); ctx.lineTo(sx(x), pad.t + ph); ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(fmt(x), sx(x), pad.t + ph + 4);
      }
      for (const s of data.series) {
        ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = 2.2;
        if (spec.chart_type === 'points') {
          for (const [x, y] of s.points) { ctx.beginPath(); ctx.arc(sx(x), sy(y), 3, 0, Math.PI * 2); ctx.fill(); }
        } else {
          ctx.beginPath();
          s.points.forEach(([x, y], i) => (i ? ctx.lineTo(sx(x), sy(y)) : ctx.moveTo(sx(x), sy(y))));
          ctx.stroke();
        }
      }
      if (data.series.length > 1) {
        let lx = pad.l + 4;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        for (const s of data.series) {
          ctx.fillStyle = s.color; ctx.fillRect(lx, 12, 14, 3);
          ctx.fillStyle = ink; ctx.fillText(s.name, lx + 18, 14);
          lx += 30 + ctx.measureText(s.name).width;
        }
      }
      axisLabels();
    };
    if ('ResizeObserver' in window) new ResizeObserver(render).observe(stage);
    render();
  }

  document.querySelectorAll('figure.concept').forEach((fig) => {
    const el = fig.querySelector('script.concept-spec');
    if (!el) return;
    let spec;
    try { spec = JSON.parse(el.textContent); } catch (e) { return; }
    if (!spec) return;
    if (spec.type === '2d-anim') anim(fig, spec);
    else if (spec.type === 'graph') graph(fig, spec);
  });
})();

// Films from the figure kit: play while on screen, pause off screen, with a toggle.
(function () {
  const vids = [...document.querySelectorAll('video[data-film]')];
  if (!vids.length) return;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && !v.dataset.userPaused) v.play().catch(() => {});
    else v.pause();
  }), { threshold: 0.35 }) : null;
  vids.forEach((v) => {
    if (io) io.observe(v); else v.play().catch(() => {});
    const btn = v.closest('figure').querySelector('[data-film-toggle]');
    if (!btn) return;
    const label = () => { btn.textContent = v.paused ? '▶ play' : '❚❚ pause'; };
    v.addEventListener('play', label); v.addEventListener('pause', label);
    btn.addEventListener('click', () => {
      if (v.paused) { delete v.dataset.userPaused; v.play().catch(() => {}); }
      else { v.dataset.userPaused = '1'; v.pause(); }
    });
  });
})();
