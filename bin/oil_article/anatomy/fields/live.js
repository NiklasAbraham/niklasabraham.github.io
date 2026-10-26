const D = __DATA__;
const stage = document.querySelector(".fd-stage");
const svg = stage.querySelector("svg");
const q = (name) => svg.querySelector(`[data-part="${name}"]`);
const readout = document.querySelector("[data-readout]");
const chips = [...document.querySelectorAll("[data-pick]")];
const panels = [...document.querySelectorAll("[data-panel]")];
const owcClip = q("owc-ghawar"), waterZone = q("water-ghawar"), bore = q("boreflow"), fracs = q("fracs");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let sel = "ghawar", visible = false, frame = 0, last = 0, clock = 0, year = 0, touring = !still.matches, idle = 0, tourT = 0;

// Arps hyperbolic (illustrative fit, model.mjs): q(t) = qi / (1 + b Di t)^(1/b)
const arps = (t) => D.arps.qi / Math.pow(1 + D.arps.b * D.arps.Di * t, 1 / D.arps.b);
const BORE_W = 2.8; // px, the flow ribbon in the shale well at the start
const LOOP = 14; // seconds for one year of the shale well, plus a hold
const HOLD = 2.2;
const FRONT = 22; // seconds for one pass of the Ghawar water front
function pick(id, { user = false } = {}) {
  if (!D.fields.includes(id)) return;
  const changed = id !== sel;
  sel = id;
  stage.dataset.sel = id;
  chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.pick === id)));
  panels.forEach((p) => (p.hidden = p.dataset.panel !== id));
  if (id === "permian" && (changed || user)) {
    year = 0;
    pulse();
  }
  if (id !== "permian") readout.textContent = D.corner[id];
  if (user) {
    touring = false;
    clearTimeout(idle);
    idle = setTimeout(() => { if (!still.matches) { touring = true; tourT = 0; run(); } }, 12000);
  }
  run();
  post();
}
function pulse() {
  if (!fracs || still.matches) return;
  fracs.classList.remove("fd-go");
  void fracs.getBBox();
  fracs.classList.add("fd-go");
}
function draw(dt) {
  // Ghawar: the oil-water contact climbs slowly, then the pass fades and starts again
  if (owcClip) {
    clock += still.matches ? 0 : dt;
    const t = (clock % FRONT) / FRONT;
    const rise = Math.min(1, t / 0.86);
    const e = rise * rise * (3 - 2 * rise);
    owcClip.setAttribute("transform", translateAlong(D.P, [0, 0, D.owcRise * (still.matches ? 0.5 : e)]));
    const fade = t > 0.9 ? 1 - (t - 0.9) / 0.05 : t < 0.05 ? t / 0.05 : 1;
    waterZone.style.opacity = String(still.matches ? 1 : Math.max(0.35, Math.min(1, fade)));
  }
  // Permian: one year of the well, the flow ribbon thinning with the rate
  if (sel === "permian") {
    if (!still.matches) year += dt / LOOP;
    const t = Math.min(1, year);
    const qn = arps(t);
    if (bore) bore.style.strokeWidth = (BORE_W * Math.max(0.22, qn / D.arps.qi)).toFixed(2) + "px";
    if (still.matches) readout.textContent = D.corner.permian;
    else readout.textContent = `Permian well · month ${Math.min(12, Math.floor(t * 12) + 1)} · ${Math.round(qn)} b/d`;
    if (year > 1 + HOLD / LOOP) { year = 0; pulse(); }
  } else if (bore) bore.style.strokeWidth = (BORE_W * 0.6).toFixed(2) + "px";
}
// idle tour: each field in turn, the shale well for one full year
const TOUR = [["ghawar", 9], ["sverdrup", 8], ["permian", LOOP + HOLD]];
const TOUR_LEN = TOUR.reduce((s, [, t]) => s + t, 0);
function tourAt(t) {
  t %= TOUR_LEN;
  for (const [id, len] of TOUR) { if (t < len) return id; t -= len; }
  return "ghawar";
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  if (touring) { tourT += dt; const id = tourAt(tourT); if (id !== sel) pick(id); }
  draw(dt);
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } else if (still.matches) draw(0); };
chips.forEach((c) => c.addEventListener("click", () => pick(c.dataset.pick, { user: true })));
stage.addEventListener("click", (e) => { const g = e.target.closest("[data-field]"); if (g && g.dataset.field) pick(g.dataset.field, { user: true }); });
document.addEventListener("keydown", (e) => {
  if (!e.target.closest || !e.target.closest(".fd-chips")) return;
  const i = D.fields.indexOf(sel);
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (step) { e.preventDefault(); const id = D.fields[(i + step + 3) % 3]; pick(id, { user: true }); chips.find((c) => c.dataset.pick === id).focus(); }
});
if (still.matches) stage.classList.add("fd-still");
new IntersectionObserver((entries) => {
  const was = visible;
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) { if (!was && sel === "permian") pulse(); run(); }
}, { rootMargin: "60px 0px" }).observe(stage);
draw(0);
const post = () => parent.postMessage({ oilFig: "fields", h: Math.ceil(document.body.getBoundingClientRect().height) }, "*");
addEventListener("load", post);
addEventListener("resize", post);
new ResizeObserver(post).observe(document.body);
window.__fd = { pick: (id) => { touring = false; pick(id); }, year: (t) => { touring = false; year = t; draw(0); }, front: (s) => { clock = s; draw(0); }, D };
