const D = __DATA__;
const stage = document.querySelector(".ct-stage");
const svg = stage.querySelector("svg");
const q = (name) => svg.querySelector(`[data-part="${name}"]`);
const roof = q("roof"), oilClip = q("oil-clip"), poleClip = q("pole-clip"), rails = q("rails"), rungs = q("rungs");
const wheels = q("wheels"), target = q("target"), tape = q("tape"), cursor = q("cursor");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const N = D.weeks.length;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dateText = (t) => `${Number(t.slice(8, 10))} ${MONTHS[Number(t.slice(5, 7)) - 1]} ${t.slice(0, 4)}`;
const yearOf = (t) => Number(t.slice(0, 4)) + (Number(t.slice(5, 7)) - 1) / 12 + (Number(t.slice(8, 10)) - 1) / 365;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const levelOf = (kb) => D.zLow + clamp(kb / D.working, 0, 1) * (D.zHigh - D.zLow);
const stockAt = (f) => {
  const i = clamp(Math.floor(f), 0, N - 1), j = Math.min(N - 1, i + 1), u = clamp(f - i, 0, 1);
  return D.stocks[i] * (1 - u) + D.stocks[j] * u;
};
const textOf = (i) => `${dateText(D.weeks[i])} · ${(D.stocks[i] / 1000).toFixed(1)} m bbl · ${Math.round((D.stocks[i] / D.working) * 100)} % of working capacity`;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const seg = (a, b) => { const p = iso(a, D.P), r = iso(b, D.P); return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${r[0].toFixed(1)} ${r[1].toFixed(1)}`; };
function ladder(level) {
  const wheelZ = level + D.trackTop + 0.6;
  const drop = D.hinge[2] - wheelZ;
  const run = Math.sqrt(Math.max(0, D.ladderLen ** 2 - drop ** 2));
  const foot = add([D.hinge[0], D.hinge[1], wheelZ], mul(D.inward, run));
  const r = [-1, 1].map((s) => [add(D.hinge, mul(D.across, (s * D.ladderW) / 2)), add(foot, mul(D.across, (s * D.ladderW) / 2))]);
  let rg = "";
  for (let i = 1; i < 18; i++) rg += seg(lerp(r[0][0], r[0][1], i / 18), lerp(r[1][0], r[1][1], i / 18));
  rails.setAttribute("d", seg(...r[0]) + seg(...r[1]));
  rungs.setAttribute("d", rg);
  const circ = (p, rr) => { const [x, y] = iso(p, D.P); return `M${(x - rr).toFixed(1)} ${y.toFixed(1)}a${rr} ${rr} 0 1 0 ${2 * rr} 0a${rr} ${rr} 0 1 0 ${-2 * rr} 0Z`; };
  wheels.setAttribute("d", r.map((x) => circ(x[1], 1.1) + circ(x[0], 0.8)).join(""));
}
let pos = D.latest, want = D.latest, shown = -1, frame = 0, last = 0, visible = false, touring = !still.matches, idle = 0, clock = 0;
function draw() {
  const kb = stockAt(pos);
  const level = levelOf(kb);
  const move = translateAlong(D.P, [0, 0, level]);
  roof.setAttribute("transform", move);
  oilClip.setAttribute("transform", move);
  if (poleClip) poleClip.setAttribute("transform", move);
  if (target) target.setAttribute("transform", translateAlong(D.P, [0, 0, D.zLow - level + (D.zHigh - D.zLow)]));
  if (tape && D.tape) tape.setAttribute("d", seg([D.tape[0], D.tape[1], D.zLow - level + D.zHigh + D.tape[3]], [D.tape[0], D.tape[1], D.tape[2]]));
  if (cursor) {
    const i0 = clamp(Math.floor(pos), 0, N - 1), i1 = Math.min(N - 1, i0 + 1), u = pos - i0;
    const yr = yearOf(D.weeks[i0]) * (1 - u) + yearOf(D.weeks[i1]) * u;
    cursor.setAttribute("transform", translateAlong(D.P, [((yr - D.strip.y0) / (D.strip.y1 - D.strip.y0)) * (D.strip.x1 - D.strip.x0), 0, 0]));
  }
  ladder(level);
  const i = Math.round(pos);
  if (i !== shown) {
    shown = i;
    const t = textOf(i);
    readout.textContent = t;
    stage.setAttribute("aria-valuenow", String(i));
    stage.setAttribute("aria-valuetext", t);
  }
}
// idle tour: scrub from the first week, hold at the April 2020 weeks, the 2026 low and the latest week
const legs = [];
{
  let from = 0;
  const holds = [[D.stops[0], 2.6], [D.stops[1], 2.2], [D.stops[2], 3], [D.stops[3], 4]];
  for (const [to, hold] of holds) { legs.push({ from, to, time: Math.max(1.2, Math.abs(to - from) / 95) }, { from: to, to, time: hold }); from = to; }
  legs.push({ from, to: 0, time: 1.6 }, { from: 0, to: 0, time: 0.8 });
}
const tourLength = legs.reduce((s, l) => s + l.time, 0);
function tourAt(t) {
  t %= tourLength;
  for (const l of legs) { if (t < l.time) { const u = t / l.time; const e = u * u * (3 - 2 * u); return l.from + (l.to - l.from) * e; } t -= l.time; }
  return 0;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  if (touring) { clock += dt; want = tourAt(clock); pos = want; }
  else { pos = still.matches ? want : pos + (want - pos) * (1 - Math.exp(-dt / 0.16)); if (Math.abs(want - pos) < 0.01) pos = want; }
  draw();
  frame = visible && (touring || pos !== want) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (to) => {
  if (touring) { touring = false; }
  want = clamp(to, 0, N - 1);
  clearTimeout(idle);
  idle = setTimeout(() => { if (!still.matches) { touring = true; clock = 0; legs[0].from = pos; run(); } }, 9000);
  run();
};
const weekAtYear = (y) => {
  let lo = 0, hi = N - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (yearOf(D.weeks[m]) < y) lo = m + 1; else hi = m; }
  return lo;
};
const fromPointer = (event) => {
  const box = svg.getBoundingClientRect();
  const vx = ((event.clientX - box.left) / box.width) * svg.viewBox.baseVal.width;
  const a = iso([D.strip.x0, D.strip.y, D.strip.z], D.P)[0], b = iso([D.strip.x1, D.strip.y, D.strip.z], D.P)[0];
  const share = clamp((vx - a) / (b - a), 0, 1);
  return weekAtYear(D.strip.y0 + share * (D.strip.y1 - D.strip.y0));
};
let dragging = false;
stage.addEventListener("pointerdown", (e) => { dragging = true; stage.setPointerCapture(e.pointerId); steer(fromPointer(e)); });
stage.addEventListener("pointermove", (e) => { if (dragging || e.pointerType === "mouse") steer(fromPointer(e)); });
stage.addEventListener("pointerup", () => { dragging = false; });
stage.addEventListener("pointercancel", () => { dragging = false; });
stage.addEventListener("keydown", (e) => {
  const here = Math.round(touring ? pos : want);
  const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 52, PageDown: -52 }[e.key];
  if (step !== undefined) { e.preventDefault(); steer(here + step); }
  else if (e.key === "Home") { e.preventDefault(); steer(0); }
  else if (e.key === "End") { e.preventDefault(); steer(N - 1); }
});
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "80px 0px" }).observe(stage);
draw();
const post = () => parent.postMessage({ oilFig: "cushing-tank", h: document.documentElement.scrollHeight }, "*");
addEventListener("load", post);
addEventListener("resize", post);
new ResizeObserver(post).observe(document.body);
window.__ct = { set: (i) => { touring = false; want = pos = i; draw(); }, tour: (t) => { touring = false; pos = want = tourAt(t); draw(); }, D };
