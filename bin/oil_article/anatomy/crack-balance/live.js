// Live code for the crack balance. Inlined after the kit (iso, pathOf, cylinder, solidSvg, lineSvg, dotsSvg, sideArc,
// ring, translateAlong) and after `const C = {...}`, the constants and the data slice written by build.mjs.
// Everything sits in one block so no name clashes with the kit's top level.
{
  const P = C.P;
  const D = C.data;
  const N = D.t.length;
  const RAD = Math.PI / 180;

  // ---- small 3D helpers (the kit's lathe.mjs prismOf, ported so a tilted beam can be redrawn per frame) ----
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const unit = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cam = (() => { const a = P.azimuth * RAD, e = P.elevation * RAD; return { V: [Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e)], L: unit([-Math.sin(a), Math.cos(a), 1.2]) }; })();
  const BANDS = [0, 0.2, 0.42, 0.62];
  const band = (s) => { let t = 0; while (t < BANDS.length && s >= BANDS[t]) t++; return t; };
  const area = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
  const hull = (points) => {
    const s = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], hi = [];
    for (const p of s) { while (lo.length >= 2 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 1e-9) lo.pop(); lo.push(p); }
    for (let i = s.length - 1; i >= 0; i--) { const p = s[i]; while (hi.length >= 2 && x(hi[hi.length - 2], hi[hi.length - 1], p) <= 1e-9) hi.pop(); hi.push(p); }
    return [...lo.slice(0, -1), ...hi.slice(0, -1)];
  };
  // A prism of a convex polygon [u, v] in frame F = {o, a, u, v}, from s0 to s1 along F.a: kit tones, hull outline.
  function prism(F, polygon, s0, s1) {
    const ring = area(polygon) < 0 ? [...polygon].reverse() : polygon;
    const n = ring.length;
    const at = (s, [x, y]) => [0, 1, 2].map((k) => F.o[k] + F.a[k] * s + F.u[k] * x + F.v[k] * y);
    const low = ring.map((p) => iso(at(s0, p), P));
    const high = ring.map((p) => iso(at(s1, p), P));
    const buckets = [[], [], [], [], []];
    const seen = [];
    for (let j = 0; j < n; j++) {
      const [x0, y0] = ring[j], [x1, y1] = ring[(j + 1) % n];
      const normal = unit([0, 1, 2].map((k) => F.u[k] * (y1 - y0) - F.v[k] * (x1 - x0)));
      const visible = dot(normal, cam.V) > 1e-6;
      seen.push(visible);
      if (visible) buckets[band(dot(normal, cam.L))].push(pathOf([low[j], low[(j + 1) % n], high[(j + 1) % n], high[j]], true));
    }
    const ends = [[low, F.a.map((v) => -v)], [high, F.a]];
    const capSeen = ends.map(([, nrm]) => dot(nrm, cam.V) > 1e-6);
    ends.forEach(([pts, nrm], i) => capSeen[i] && buckets[band(dot(nrm, cam.L))].push(pathOf(pts, true)));
    const creases = [];
    for (let j = 0; j < n; j++) {
      const prev = (j - 1 + n) % n;
      if (seen[j] && seen[prev]) creases.push(pathOf([low[j], high[j]]));
      ends.forEach(([pts], i) => capSeen[i] && seen[j] && creases.push(pathOf([pts[j], pts[(j + 1) % n]])));
    }
    const h = pathOf(hull([...low, ...high]), true);
    return { fill: h, outline: h, crease: creases.join(""), top: buckets[4].join(""), shades: buckets.slice(0, 4).map((l) => l.join("")) };
  }
  const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // ---- the beam, rotated by theta about the pivot axis (+y); positive theta lowers the products (right) end ----
  const B = C.beam;
  function beamFrame(theta, y0 = 0) {
    const c = Math.cos(theta), s = Math.sin(theta);
    // u: along the beam (+x at rest), v: beam "up", a: the pivot axis (+y)
    return { o: [0, y0, B.zp], a: [0, 1, 0], u: [c, 0, -s], v: [s, 0, c] };
  }
  const onBeam = (theta, x, y, z) => { const c = Math.cos(theta), s = Math.sin(theta); return [x * c + z * s, y, B.zp - x * s + z * c]; };
  const riderX = (crack) => B.riderFrom + ((crack - C.scale[0]) / (C.scale[1] - C.scale[0])) * (B.riderTo - B.riderFrom);
  const knife = (theta, y0, y1) => prism(beamFrame(theta), [[0, -1.3], [1.3, 0], [0, 1.3], [-1.3, 0]], y0, y1);

  function beamSvg(theta, crack) {
    const F = beamFrame(theta);
    const out = [];
    out.push(solidSvg(knife(theta, -B.axleBack, -B.halfY), { tone: "mid" }));
    // tapered beam: flat top at +topZ, belly from -endZ at the tips to -midZ at the pivot
    const poly = [[-B.half, B.topZ], [-B.half, -B.endZ], [0, -B.midZ], [B.half, -B.endZ], [B.half, B.topZ]];
    // a groove line down the front face, parallel to the top edge, runs end face to end face
    const groove = pathOf([iso(onBeam(theta, -B.half, B.halfY, B.topZ - 1.6), P), iso(onBeam(theta, B.half, B.halfY, B.topZ - 1.6), P)]);
    out.push(solidSvg(prism(F, poly, -B.halfY, B.halfY), { tone: "mid", inner: lineSvg(groove, { tone: "faint" }) }));
    // graduation on the beam's top face, hanging from its front top edge: one tick per $5, long ticks at multiples of $20
    const minor = [], major = [];
    for (let c = C.scale[0]; c <= C.scale[1] + 1e-9; c += 5) {
      const x = riderX(c), big = c % 20 === 0;
      const d = pathOf([iso(onBeam(theta, x, B.halfY, B.topZ), P), iso(onBeam(theta, x, B.halfY - (big ? 2.6 : 1.4), B.topZ), P)]);
      (big ? major : minor).push(d);
    }
    out.push(lineSvg(minor.join(""), { tone: "lo" }), lineSvg(major.join(""), { tone: "mid" }));
    // screw dots at the end blocks
    out.push(dotsSvg([-B.half + 2.2, B.half - 2.2].map((x) => iso(onBeam(theta, x, 0, B.topZ), P)), { size: 0.45, tone: "mid" }));
    // the rider (poise): a red saddle on the right arm, sitting at the crack
    const x = riderX(crack);
    out.push(`<g class="cb-tint" style="--c:var(--cb-margin)">`);
    out.push(solidSvg(prism(F, rect(x - B.rider, x + B.rider, -1.2, B.topZ), B.halfY, B.halfY + 0.8), { tone: "hi", crease: "lo" }));
    out.push(solidSvg(prism(F, rect(x - B.rider, x + B.rider, B.topZ, B.topZ + 3.2), -B.halfY - 0.8, B.halfY + 0.8), { tone: "hi", crease: "lo" }));
    out.push(solidSvg(prism(F, rect(x - 0.9, x + 0.9, B.topZ + 3.2, B.topZ + 5.4), -1, 1), { tone: "hi", crease: "lo" }));
    out.push(`</g>`);
    // the rider's index line on its front face, top to bottom, reads the beam graduation
    out.push(lineSvg(pathOf([iso(onBeam(theta, x, B.halfY + 0.8, -1.2), P), iso(onBeam(theta, x, B.halfY + 0.8, B.topZ + 3.2), P)]), { tone: "hi" }));
    return out.join("");
  }

  function frontSvg(theta) {
    // the knife-edge axle where it shows in front of the beam and over the front cheek, then the pointer
    const out = [solidSvg(knife(theta, B.halfY, B.axleFront), { tone: "mid" })];
    out.push(C.hubSvg);
    const tip = [Math.sin(theta) * B.pointer, B.pointerY, B.zp + Math.cos(theta) * B.pointer];
    const tail = [-Math.sin(theta) * B.tail, B.pointerY, B.zp - Math.cos(theta) * B.tail];
    out.push(`<path class="iso-line" data-tone="lit" data-free="end" style="stroke-width:1.15" d="${pathOf([iso(tail, P), iso(tip, P)])}"/>`);
    const bob = iso(tail, P);
    out.push(`<circle class="cb-bob" cx="${bob[0].toFixed(1)}" cy="${bob[1].toFixed(1)}" r="1.5"/>`);
    out.push(dotsSvg([iso([0, B.pointerY, B.zp], P)], { size: 0.6, tone: "hi" }));
    return out.join("");
  }

  // ---- barrels: height in proportion to the price per barrel ----
  const BB = C.barrels;
  function barrelSvg(x, y, z, h, cls, crudeH) {
    const r = BB.r;
    const out = [`<g class="cb-tint" style="--c:var(${cls})">`];
    const paths = cylinder(x, y, r, z, h, P, 40, 0.5);
    const hoops = [1 / 3, 2 / 3].map((f) => sideArc(x, y, r, z + h * f, P, 28)).join("");
    out.push(solidSvg(paths, { tone: "hi", crease: "lo", inner: lineSvg(hoops, { tone: "lo" }) }));
    out.push(lineSvg(ring(x, y, r - 0.9, z + h, P, 32), { tone: "lo" }));
    out.push(dotsSvg([iso([x + r * 0.45, y - r * 0.2, z + h], P), iso([x - r * 0.5, y + r * 0.1, z + h], P)], { size: 0.55, tone: "hi" }));
    out.push(`</g>`);
    // on a product barrel, the red hoop marks the height of a barrel of crude: what is above it is the refinery's gap
    if (crudeH != null && crudeH < h - 0.3) out.push(lineSvg(sideArc(x, y, r, z + crudeH, P, 28), { tone: "red", className: "cb-gapline" }));
    return out.join("");
  }
  function panBarrels(side, v) {
    const pan = C.pans[side];
    const list = pan.spots.map((spot) => ({ ...spot, x: pan.x + spot.dx, y: spot.dy }));
    list.sort((a, b) => depthOf([a.x, a.y, 0], P) - depthOf([b.x, b.y, 0], P));
    return list.map((b) => {
      const price = b.kind === "crude" ? v.wti : b.kind === "gas" ? v.gas : v.ulsd;
      return barrelSvg(b.x, b.y, C.panTop, Math.max(0.6, price * C.hPerUsd), `--cb-${b.kind}`, b.kind === "crude" ? null : v.wti * C.hPerUsd);
    }).join("");
  }

  // ---- data at a fractional month index ----
  const value = (key, f) => { const i = Math.max(0, Math.min(N - 1, f)); const a = Math.floor(i), b = Math.min(N - 1, a + 1), t = i - a; return D[key][a] * (1 - t) + D[key][b] * t; };
  const at = (f) => ({ wti: value("wti", f), gas: value("gas", f), ulsd: value("ulsd", f), crack: value("crack", f) });
  const thetaOf = (crack) => crack * C.degPerUsd * RAD;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = (t) => `${MONTHS[Number(t.slice(5, 7)) - 1]} ${t.slice(0, 4)}`;

  // ---- page ----
  const stage = document.querySelector(".iso-stage");
  const svg = stage.querySelector("svg");
  const part = (name) => svg.querySelector(`[data-part="${name}"]`);
  const el = { beam: part("beam"), front: part("front"), cursor: part("cursor"), month: part("drum-month"), year: part("drum-year"),
    panBack: { L: part("pan-back-L"), R: part("pan-back-R") }, panFront: { L: part("pan-front-L"), R: part("pan-front-R") },
    barrels: { L: part("barrels-L"), R: part("barrels-R") } };
  const readout = document.querySelector("[data-readout]");
  const still = matchMedia("(prefers-reduced-motion: reduce)");

  let shown = -1, lastBarrels = "", lastTheta = NaN;
  function draw(f, theta) {
    const v = at(f);
    if (Math.abs(theta - lastTheta) > 1e-5 || lastBarrels !== f.toFixed(3)) {
      el.beam.innerHTML = beamSvg(theta, v.crack);
      el.front.innerHTML = frontSvg(theta);
      for (const side of ["L", "R"]) {
        const sx = side === "L" ? -1 : 1;
        const move = translateAlong(P, [sx * (B.arm * Math.cos(theta) - B.arm), 0, -sx * B.arm * Math.sin(theta)]);
        el.panBack[side].setAttribute("transform", move);
        el.panFront[side].setAttribute("transform", move);
      }
      lastTheta = theta;
    }
    if (lastBarrels !== f.toFixed(3)) {
      el.barrels.L.innerHTML = panBarrels("L", v);
      el.barrels.R.innerHTML = panBarrels("R", v);
      el.cursor.setAttribute("transform", translateAlong(P, [C.track.x0 + (f / (N - 1)) * (C.track.x1 - C.track.x0), 0, 0]));
      lastBarrels = f.toFixed(3);
    }
    const i = Math.round(f);
    if (i !== shown) {
      shown = i;
      const t = D.t[i];
      const [mo, yr] = monthName(t).toUpperCase().split(" ");
      el.month.textContent = mo;
      el.year.textContent = yr;
      const head = `${monthName(t)}${i === N - 1 ? " (to " + C.lastDay + ")" : ""}`;
      readout.innerHTML = `<span class="cb-r1">${head}</span><span class="cb-r2">crude $${Math.round(D.wti[i])} · gasoline $${Math.round(D.gas[i])} · diesel $${Math.round(D.ulsd[i])}</span><span class="cb-r3">crack $${D.crack[i].toFixed(1)}/bbl</span>`;
      stage.setAttribute("aria-valuenow", String(i));
      stage.setAttribute("aria-valuetext", `${monthName(t)}: crude $${Math.round(D.wti[i])}, gasoline $${Math.round(D.gas[i])}, diesel $${Math.round(D.ulsd[i])} per barrel; 3-2-1 crack $${D.crack[i].toFixed(1)} per barrel`);
    }
  }

  // ---- motion: the month index eases to its target, the beam swings to the crack on a damped spring ----
  const stops = C.stops; // month indices, ascending
  const RATE = 9; // tour pace, months per second
  const HOLD = 3.4, HOLD_LAST = 5.5, REWIND = 70;
  let f = still.matches ? N - 1 : 0, target = f;
  let theta = thetaOf(at(f).crack), omega = 0;
  let touring = !still.matches, phase = "run", hold = 0, nextStop = 0;
  let frame = 0, last = 0, visible = false, idleTimer = 0;

  function tour(dt) {
    if (phase === "hold") {
      hold -= dt;
      if (hold <= 0) phase = target >= N - 1 ? "rewind" : "run";
      return;
    }
    if (phase === "rewind") {
      target = Math.max(0, target - REWIND * dt);
      if (target === 0) { phase = "hold"; hold = 1.2; nextStop = 0; }
      return;
    }
    const goal = stops[nextStop] ?? N - 1;
    target = Math.min(goal, target + RATE * dt);
    if (target >= goal) { phase = "hold"; hold = goal === N - 1 ? HOLD_LAST : HOLD; nextStop++; }
  }
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const calm = still.matches;
    if (touring) tour(dt);
    f = calm ? target : f + (target - f) * (1 - Math.exp(-dt / (touring ? 0.05 : 0.22)));
    if (Math.abs(target - f) < 0.002) f = target;
    const want = thetaOf(at(f).crack);
    if (calm) { theta = want; omega = 0; }
    else {
      const k = 38, c = 2 * 0.62 * Math.sqrt(k); // a slightly underdamped beam: it swings once and settles
      for (let s = 0; s < 4; s++) { omega += ((want - theta) * k - omega * c) * dt / 4; theta += omega * dt / 4; }
      if (Math.abs(want - theta) < 1e-5 && Math.abs(omega) < 1e-5) { theta = want; omega = 0; }
    }
    draw(f, theta);
    const settled = !touring && f === target && omega === 0 && theta === want;
    frame = visible && !settled ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
  const resume = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => {
    if (still.matches) return;
    touring = true; phase = "run"; nextStop = stops.findIndex((s) => s > target + 0.5); if (nextStop < 0) nextStop = stops.length; run();
  }, 4500); };
  const steer = (next) => { touring = false; target = Math.max(0, Math.min(N - 1, next)); resume(); run(); };

  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
  const fromPointer = (event) => {
    const box = svg.getBoundingClientRect();
    const share = Math.max(0, Math.min(1, ((event.clientX - box.left) / box.width - 0.1) / 0.8));
    return share * (N - 1);
  };
  stage.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse" || event.buttons) steer(fromPointer(event)); });
  stage.addEventListener("pointerdown", (event) => { steer(fromPointer(event)); });
  stage.addEventListener("keydown", (event) => {
    const here = Math.round(target);
    const keys = { ArrowRight: here + 1, ArrowUp: here + 1, ArrowLeft: here - 1, ArrowDown: here - 1, PageUp: here + 12, PageDown: here - 12, Home: 0, End: N - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    steer(keys[event.key]);
  });
  draw(f, theta);
  window.__crack = { stops, N, go: (i) => { steer(i); }, state: () => ({ f, target, theta, touring }) };

  // the page lives in an iframe in the post: tell the parent how tall it is
  const post = () => parent !== window && parent.postMessage({ oilFig: "crack-balance", h: document.documentElement.scrollHeight }, "*");
  addEventListener("load", post);
  new ResizeObserver(post).observe(document.documentElement);
  post();
}
