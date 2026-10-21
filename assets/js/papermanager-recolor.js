/*
 * PaperManager page: app screenshots follow the page's accent colour.
 *
 * The screenshots show PaperManager's violet UI. When the accent changes (document event
 * `pm:accent` with detail.hex, or window.PMAccent.get(), or ?accent=<hex> when neither exists),
 * every pixel whose hue lies in the violet band (252°–292°, feathered by 6°, not grey) is moved
 * to the accent's hue, its saturation scaled and its lightness re-anchored at the accent's, so
 * light tints stay light. Everything else (PDF pages, figures, greys, other colours) is left as
 * it is. Regions where violet is data, not UI (the concept map's node colours), are skipped.
 *
 * Which images: <img data-pm-recolor> anywhere in .pm, plus the app screenshots listed in SHOTS
 * (so the hero stacks need no markup); data-pm-recolor="off" opts out. The recoloured image
 * replaces the src as a blob: URL (same size, so layout does not move); for violet the original
 * comes back. Work runs in a worker (OffscreenCanvas), visible images first, the rest when they
 * come near the viewport.
 */
(function () {
  'use strict';
  var root = document.querySelector('.pm');
  if (!root || !window.Blob || !window.URL || !window.createImageBitmap) return;

  var SHOTS = /\/assets\/papermanager\/(concepts|tour|concept-map|library|summary|figures|chat-preview|chat|card[\w-]*)\.webp$/;
  // [x, y, w, h] as fractions of the image: leave these alone.
  var SKIP = {
    'concept-map.webp': [[0.16, 0.13, 0.84, 0.87], [0, 0.22, 0.16, 0.1], [0, 0.555, 0.16, 0.04]]
  };
  var VIOLET = '#7c3aed';

  /* ---------------------------------------------------------- colour maths */
  // The same mapping as the chat demo's accent.ts, written for a pixel loop.
  var KERNEL = function () {
    var REF_H = 262.1, REF_S = 0.832, REF_L = 0.58;
    function smooth(e0, e1, x) { var t = (x - e0) / (e1 - e0); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
    function hue2(p, q, t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
    }
    function recolor(px, w, h, acc, skips) {
      var dh = acc.h - REF_H, ks = acc.s / REF_S, al = acc.l;
      var cache = new Map();
      var rects = skips.map(function (r) {
        return [Math.floor(r[0] * w), Math.floor(r[1] * h), Math.ceil((r[0] + r[2]) * w), Math.ceil((r[1] + r[3]) * h)];
      });
      for (var y = 0; y < h; y++) {
        var row = y * w * 4;
        for (var x = 0; x < w; x++) {
          var i = row + x * 4, r = px[i], g = px[i + 1], b = px[i + 2];
          var max = r > g ? (r > b ? r : b) : (g > b ? g : b), min = r < g ? (r < b ? r : b) : (g < b ? g : b);
          if (max - min < 10 || b !== max) continue;           // grey, or blue is not the strongest channel: not violet
          var key = (r << 16) | (g << 8) | b, hit = cache.get(key);
          if (hit === undefined) {
            hit = -1;
            var R = r / 255, G = g / 255, B = b / 255, mx = max / 255, mn = min / 255, d = mx - mn, l = (mx + mn) / 2;
            var s = d / (1 - Math.abs(2 * l - 1));
            var hh = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
            hh = (hh * 60 + 360) % 360;
            var wt = smooth(246, 252, hh) * (1 - smooth(292, 298, hh)) * smooth(0.1, 0.22, s);
            if (wt > 0) {
              var L = l <= REF_L ? l * al / REF_L : al + (l - REF_L) * (1 - al) / (1 - REF_L);
              L = L < 0 ? 0 : L > 1 ? 1 : L;
              var S = Math.min(1, s * ks), H = ((hh + dh + 360) % 360) / 360;
              var q = L < 0.5 ? L * (1 + S) : L + S - L * S, p = 2 * L - q;
              var nr = Math.round(255 * hue2(p, q, H + 1 / 3)), ng = Math.round(255 * hue2(p, q, H)), nb = Math.round(255 * hue2(p, q, H - 1 / 3));
              hit = (Math.round(r + (nr - r) * wt) << 16) | (Math.round(g + (ng - g) * wt) << 8) | Math.round(b + (nb - b) * wt);
            }
            cache.set(key, hit);
          }
          if (hit < 0) continue;
          var skip = false;
          for (var k = 0; k < rects.length; k++) {
            var q2 = rects[k];
            if (x >= q2[0] && x < q2[2] && y >= q2[1] && y < q2[3]) { skip = true; break; }
          }
          if (skip) continue;
          px[i] = hit >> 16; px[i + 1] = (hit >> 8) & 255; px[i + 2] = hit & 255;
        }
      }
    }
    return recolor;
  };
  var recolor = KERNEL();

  function hexToHsl(hex) {
    var m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(String(hex || '').trim());
    if (!m) return null;
    var v = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
    var r = parseInt(v.slice(0, 2), 16) / 255, g = parseInt(v.slice(2, 4), 16) / 255, b = parseInt(v.slice(4, 6), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
    if (!d) return { hex: '#' + v.toLowerCase(), h: 0, s: 0, l: l };
    var s = d / (1 - Math.abs(2 * l - 1));
    var h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { hex: '#' + v.toLowerCase(), h: (h * 60 + 360) % 360, s: s, l: l };
  }
  function isViolet(a) { return Math.abs(a.h - 262.1) < 2 && Math.abs(a.s - 0.832) < 0.03 && Math.abs(a.l - 0.58) < 0.02; }

  /* ----------------------------------------------------------------- worker */
  var worker = null, jobs = {}, seq = 0;
  try {
    if (window.Worker && window.OffscreenCanvas) {
      var src = 'var recolor = (' + KERNEL.toString() + ')();\n' +
        'onmessage = function (e) { var d = e.data, t0 = performance.now();\n' +
        '  var c = new OffscreenCanvas(d.bitmap.width, d.bitmap.height), x = c.getContext("2d", { willReadFrequently: true });\n' +
        '  x.drawImage(d.bitmap, 0, 0); d.bitmap.close();\n' +
        '  var img = x.getImageData(0, 0, c.width, c.height); recolor(img.data, c.width, c.height, d.acc, d.skips);\n' +
        '  x.putImageData(img, 0, 0); var t1 = performance.now();\n' +
        '  c.convertToBlob({ type: "image/webp", quality: 0.92 }).then(function (blob) {\n' +
        '    postMessage({ id: d.id, blob: blob, ms: t1 - t0, total: performance.now() - t0 }); });\n' +
        '};';
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      worker.onmessage = function (e) { var j = jobs[e.data.id]; delete jobs[e.data.id]; if (j) j(e.data); };
      worker.onerror = function () { worker = null; };
    }
  } catch (e) { worker = null; }

  function run(bitmap, acc, skips) {
    if (worker) {
      return new Promise(function (resolve) {
        var id = ++seq; jobs[id] = resolve;
        worker.postMessage({ id: id, bitmap: bitmap, acc: { h: acc.h, s: acc.s, l: acc.l }, skips: skips }, [bitmap]);
      });
    }
    var t0 = performance.now(), c = document.createElement('canvas');
    c.width = bitmap.width; c.height = bitmap.height;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(bitmap, 0, 0);
    var img = x.getImageData(0, 0, c.width, c.height);
    recolor(img.data, c.width, c.height, acc, skips);
    x.putImageData(img, 0, 0);
    var t1 = performance.now();
    return new Promise(function (resolve) {
      c.toBlob(function (blob) { resolve({ blob: blob, ms: t1 - t0, total: performance.now() - t0 }); }, 'image/webp', 0.92);
    });
  }

  /* ------------------------------------------------------------------ images */
  var targets = [];
  root.querySelectorAll('img').forEach(function (img) {
    var mark = img.getAttribute('data-pm-recolor');
    if (mark === 'off') return;
    var u = img.getAttribute('src') || '';
    if (mark !== null || SHOTS.test(u.split('?')[0])) {
      var orig = img.currentSrc || img.src;
      img.setAttribute('data-pm-orig', orig.split('/').pop().split('?')[0]);
      targets.push({ img: img, orig: orig, done: VIOLET, near: false, blob: null });
    }
  });
  if (!targets.length) return;

  var accent = hexToHsl(VIOLET), queue = [], busy = false;
  var stats = window.PMRecolorStats = [];

  function restore(t) {
    if (t.blob) { t.img.src = t.orig; URL.revokeObjectURL(t.blob); t.blob = null; }
    t.done = accent.hex;
  }

  function pump() {
    if (busy) return;
    var t = queue.shift();
    if (!t) return;
    if (t.done === accent.hex || !t.near) { pump(); return; }
    if (isViolet(accent)) { restore(t); pump(); return; }
    busy = true;
    var want = accent, name = t.orig.split('/').pop().split('?')[0];
    fetch(t.orig).then(function (r) { return r.blob(); })
      .then(function (b) { return createImageBitmap(b); })
      .then(function (bmp) { return run(bmp, want, SKIP[name] || []); })
      .then(function (res) {
        if (want === accent) {
          var url = URL.createObjectURL(res.blob), old = t.blob;
          t.img.src = url; t.blob = url; t.done = want.hex;
          if (old) setTimeout(function () { URL.revokeObjectURL(old); }, 1000);
          stats.push({ image: name, accent: want.hex, pixelsMs: Math.round(res.ms), totalMs: Math.round(res.total) });
        }
      })
      .catch(function () { /* keep the original */ })
      .then(function () { busy = false; if (want !== accent && t.near) queue.push(t); pump(); });
  }

  function schedule() {
    var near = targets.filter(function (t) { return t.near && t.done !== accent.hex; });
    // On screen first, then the rest that is near.
    near.sort(function (a, b) {
      return Math.abs(a.img.getBoundingClientRect().top) - Math.abs(b.img.getBoundingClientRect().top);
    });
    queue = near;
    pump();
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var t = targets.find(function (x) { return x.img === e.target; });
      if (!t) return;
      t.near = e.isIntersecting;
      if (t.near && t.done !== accent.hex) { queue.push(t); pump(); }
    });
  }, { rootMargin: '600px 0px' });
  targets.forEach(function (t) { io.observe(t.img); });

  var timer = 0;
  function setAccent(hex) {
    var a = hexToHsl(hex);
    if (!a || a.hex === accent.hex) return;
    accent = a;
    clearTimeout(timer);
    timer = setTimeout(schedule, 120);
  }

  document.addEventListener('pm:accent', function (e) { if (e.detail && e.detail.hex) setAccent(e.detail.hex); });
  var initial = window.PMAccent && window.PMAccent.get && window.PMAccent.get();
  if (initial && initial.hex) setAccent(initial.hex);
  else if (!window.PMAccent) {
    var q = new URLSearchParams(location.search).get('accent');
    if (q) setAccent(q.charAt(0) === '#' ? q : '#' + q);
  }
})();
