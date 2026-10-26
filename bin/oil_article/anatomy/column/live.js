// Live layer of the column figure. DATA comes from build.mjs; the readout functions are model.mjs's own.
const DATA = __DATA__;
__MODEL__
const { P, rule, crudes, products } = DATA;
const stage = document.querySelector(".cs-stage");
const svg = stage.querySelector(".cs-art svg");
const out = document.querySelector("[data-readout]");
const status = stage.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const NS = "http://www.w3.org/2000/svg";
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const ORDER = ["feed", ...PRODUCTS.map((p) => p.id)];
const CW = (u, w, z) => [u * rule.E[0] + w * rule.VF[0], u * rule.E[1] + w * rule.VF[1], z];
const pt = (p) => iso(p, P).map((v) => v.toFixed(2)).join(" ");

let pick = "kero";
let crude = 0;

// rule height of a temperature (the column profile above the feed, from build.mjs)
function zOfT(T) {
  const L = DATA.zOfT;
  if (T >= L[0][1]) return L[0][0];
  for (let i = 1; i < L.length; i++) if (T >= L[i][1]) {
    const [z0, t0] = L[i - 1];
    const [z1, t1] = L[i];
    return z0 + ((z1 - z0) * (T - t0)) / (t1 - t0);
  }
  return L[L.length - 1][0];
}
const band = svg.querySelector("[data-band]");
const mark = svg.querySelector("[data-mark]");
const guide = svg.querySelector("[data-guide]");
function paintRule(id) {
  if (id === "feed") {
    const z = DATA.feedZ;
    band.setAttribute("d", "");
    mark.setAttribute("d", `M${pt(CW(rule.u0, rule.w, z))}L${pt(CW(rule.u1, rule.w, z))}`);
    guide.setAttribute("d", `M${pt(CW(rule.u1, rule.w, z))}L${pt(CW(DATA.colLeft, 0, z))}`);
    return;
  }
  const p = byId[id];
  const [lo, hi] = p.tbp;
  const tTop = DATA.zOfT[DATA.zOfT.length - 1][1];
  const tBot = DATA.zOfT[0][1];
  let zA;
  let zB;
  if (hi !== null && hi <= tTop) { zA = rule.top; zB = rule.z1; } // boils below the top tray: off the cool end
  else if (lo >= tBot) { zA = rule.z0; zB = rule.bot; } // boils above the flash zone: off the hot end
  else { zA = zOfT(Math.min(hi ?? tBot, tBot)); zB = zOfT(Math.max(lo, tTop)); }
  band.style.setProperty("--c", p.color);
  band.setAttribute("d", `M${pt(CW(rule.u0, rule.w, zA))}L${pt(CW(rule.u1, rule.w, zA))}L${pt(CW(rule.u1, rule.w, zB))}L${pt(CW(rule.u0, rule.w, zB))}Z`);
  const z = DATA.drawZ[id];
  mark.setAttribute("d", `M${pt(CW(rule.u0, rule.w, z))}L${pt(CW(rule.u1, rule.w, z))}`);
  guide.setAttribute("d", `M${pt(CW(rule.u1, rule.w, z))}L${pt(CW(DATA.colLeft, 0, z))}`);
}

function paintCrude() {
  const c = crudes[crude];
  for (const p of PRODUCTS) {
    const w = DATA.coreMax * Math.sqrt(Math.max(0.2, c.yields[p.id]) / DATA.yieldMax);
    svg.querySelectorAll(`.cs-core[data-core="${p.id}"]`).forEach((el) => el.style.setProperty("--w", `${w.toFixed(2)}px`));
  }
  stage.querySelectorAll(".cs-crude").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.crude) === crude)));
}

// ---- the magnified tray ----
const dmove = stage.querySelector("[data-dmove]");
const dtitle = stage.querySelector("[data-dtitle]");
const dchem = stage.querySelector("[data-dchem]");
const detailArt = stage.querySelector(".cs-detail-art");
const tags = { light: stage.querySelector('[data-moltag="light"]'), heavy: stage.querySelector('[data-moltag="heavy"]') };
const paths = DATA.detail.paths.map((pts) => {
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
  return { pts, seg, total };
});
const along = (path, d) => {
  let left = Math.max(0, Math.min(path.total, d));
  for (let i = 0; i < path.seg.length; i++) {
    if (left <= path.seg[i]) { const f = left / path.seg[i]; const a = path.pts[i]; const b = path.pts[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
    left -= path.seg[i];
  }
  return path.pts[path.pts.length - 1];
};
const bubbles = [];
paths.forEach((path, i) => {
  for (let j = 0; j < 5; j++) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("class", "cs-dbub");
    c.setAttribute("r", (2.2 + ((i + j) % 3) * 0.7).toFixed(1));
    dmove.appendChild(c);
    bubbles.push({ c, path, phase: (j / 5 + i * 0.13) % 1 });
  }
});
function glyph(n, color) {
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "cs-mol");
  g.style.setProperty("--mc", color);
  const step = 6.2;
  const pts = Array.from({ length: n }, (_, i) => [(i - (n - 1) / 2) * step * 0.87, (i % 2 ? -1 : 1) * step * 0.25]);
  for (let i = 1; i < n; i++) {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", pts[i - 1][0].toFixed(1)); l.setAttribute("y1", pts[i - 1][1].toFixed(1));
    l.setAttribute("x2", pts[i][0].toFixed(1)); l.setAttribute("y2", pts[i][1].toFixed(1));
    g.appendChild(l);
  }
  for (const [x, y] of pts) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1)); c.setAttribute("r", "1.9");
    g.appendChild(c);
  }
  dmove.appendChild(g);
  return g;
}
let mols = null;
const trayOf = (id) => {
  if (id === "feed") return { title: "Tray 1, just above the flash zone", T: byId.hgo.drawT };
  const p = byId[id];
  if (p.where === "overhead") return { title: `Top tray, where ${p.name.toLowerCase()} leaves as vapour`, T: p.drawT };
  if (p.where === "bottom") return { title: "Bottom stripping tray, above the residue", T: p.drawT };
  return { title: `${p.name} draw tray`, T: p.drawT };
};
function paintDetail(id) {
  const t = trayOf(id);
  const chem = trayChem(t.T);
  const color = id === "feed" ? byId.hgo.color : byId[id].color;
  detailArt.style.setProperty("--dc", color);
  dtitle.textContent = `${t.title} · about ${Math.round(t.T)} °C`;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  dchem.textContent = `${cap(chem.light.name)} C${chem.light.n} boils at ${deg(chem.light.tb)} °C: stays in the vapour · ${chem.heavy.name} C${chem.heavy.n} boils at ${deg(chem.heavy.tb)} °C: condenses`;
  if (mols) { mols.light.g.remove(); mols.heavy.g.remove(); }
  mols = { light: { g: glyph(chem.light.n, "#c99a1e"), n: chem.light.n, name: chem.light.name }, heavy: { g: glyph(chem.heavy.n, "#4e3b2c"), n: chem.heavy.n, name: chem.heavy.name } };
  tags.light.textContent = `C${chem.light.n} · rises`;
  tags.heavy.textContent = `C${chem.heavy.n} · condenses`;
  frameDetail(clock);
}
// one cycle: both molecules ride a vapour bubble up the riser and out of the slots; then the light one goes on up,
// the heavy one stays in the liquid and drifts toward the weir
const CYCLE = 7;
function frameDetail(t) {
  for (const b of bubbles) {
    const d = (((t / 4.2 + b.phase) % 1) + 1) % 1;
    const [x, y] = along(b.path, d * b.path.total);
    b.c.setAttribute("cx", x.toFixed(1));
    b.c.setAttribute("cy", y.toFixed(1));
    b.c.setAttribute("opacity", (Math.min(1, d * 8, (1 - d) * 6)).toFixed(2));
  }
  if (!mols) return;
  const f = (((t / CYCLE) % 1) + 1) % 1;
  const pl = paths[1]; // right side of the first cap
  const ph = paths[3]; // right side of the second cap
  const slotAt = (path) => {
    let acc = 0;
    for (let i = 0; i < 4; i++) acc += path.seg[i];
    return acc + path.seg[4] * 0.6;
  };
  // light: whole path
  const dl = f * pl.total;
  const [lx, ly] = along(pl, dl);
  mols.light.g.setAttribute("transform", `translate(${lx.toFixed(1)} ${ly.toFixed(1)})`);
  mols.light.g.setAttribute("opacity", Math.min(1, f * 10, (1 - f) * 10).toFixed(2));
  // heavy: to the slot, then into the liquid and along it
  const sh = slotAt(ph);
  const g0 = Math.min(1, f / 0.55);
  let hx;
  let hy;
  if (f < 0.55) [hx, hy] = along(ph, g0 * sh);
  else {
    const [sx, sy] = along(ph, sh);
    const e = (f - 0.55) / 0.45;
    hx = sx + e * 40;
    hy = sy + (DATA.detail.deck - 8 - sy) * Math.min(1, e * 2.5);
  }
  mols.heavy.g.setAttribute("transform", `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`);
  mols.heavy.g.setAttribute("opacity", Math.min(1, f * 10, (1 - f) * 8).toFixed(2));
  // tags follow the molecules once they part
  const place = (tag, x, y, show) => {
    tag.style.left = `${((x / DATA.DW) * 100).toFixed(2)}%`;
    tag.style.top = `${((y / DATA.DH) * 100).toFixed(2)}%`;
    tag.toggleAttribute("data-show", show);
  };
  place(tags.light, lx, ly, f > 0.62 && f < 0.95);
  place(tags.heavy, hx, hy, f > 0.66 && f < 0.95);
}

// ---- picking ----
function say() {
  const text = pick === "feed" ? feedReadout(crudes[crude]) : readout(byId[pick], crudes[crude]);
  if (out.textContent !== text) out.textContent = text;
  return text;
}
function select(id, { user = true } = {}) {
  pick = id;
  stage.querySelectorAll(".cs-chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pick === id)));
  stage.querySelectorAll(".cs-tag").forEach((b) => b.toggleAttribute("data-on", b.dataset.pick === id));
  svg.querySelectorAll(".it[data-flow], .it[data-pick]").forEach((g) => g.toggleAttribute("data-on", g.dataset.flow === id || g.dataset.pick === id || (id === "feed" && g.dataset.flow === "crude") || ((id === "gas" || id === "lnap") && g.dataset.flow === "overhead")));
  const liqKey = id === "gas" || id === "lnap" ? "top" : id;
  svg.querySelectorAll(".cs-liq").forEach((g) => g.toggleAttribute("data-on", g.dataset.liq === id || g.dataset.tray === liqKey));
  paintRule(id);
  paintDetail(id);
  const text = say();
  if (user) status.textContent = text;
}

// ---- motion: the magnified tray runs while visible; the drawing's own CSS motion pauses offscreen ----
let clock = 0;
let last = 0;
let frame = 0;
let visible = false;
let touring = !still.matches;
let tourClock = 0;
let idle = 0;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  if (!still.matches) {
    clock += dt;
    frameDetail(clock);
    if (touring) {
      tourClock += dt;
      if (tourClock > 5) { tourClock = 0; select(ORDER[(ORDER.indexOf(pick) + 1) % ORDER.length], { user: false }); }
    }
  }
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } };
const hold = () => {
  touring = false;
  clearTimeout(idle);
  idle = setTimeout(() => { touring = !still.matches; tourClock = 0; }, 9000);
};
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  stage.toggleAttribute("data-run", visible && !still.matches);
  if (visible) run();
}, { rootMargin: "80px 0px" }).observe(stage);

stage.addEventListener("click", (event) => {
  const crudeBtn = event.target.closest("[data-crude]");
  if (crudeBtn) { hold(); crude = Number(crudeBtn.dataset.crude); paintCrude(); say(); status.textContent = say(); return; }
  const el = event.target.closest("[data-pick]");
  if (el && stage.contains(el)) { hold(); select(el.dataset.pick); }
});
stage.addEventListener("pointerover", (event) => {
  const el = event.target.closest(".cs-tag, .it[data-pick]");
  if (el && el.dataset.pick !== pick && event.pointerType === "mouse") { hold(); select(el.dataset.pick); }
});
stage.addEventListener("keydown", (event) => {
  let to = null;
  const i = ORDER.indexOf(pick);
  if (event.key === "ArrowRight" || event.key === "ArrowDown") to = i + 1;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = i - 1;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = ORDER.length - 1;
  if (to === null || event.target.closest("button")) return;
  event.preventDefault();
  hold();
  select(ORDER[(to + ORDER.length) % ORDER.length]);
});
if (still.matches) touring = false;
paintCrude();
select("kero", { user: false });
frameDetail(5.6);

// tell the embedding post how tall this page is
const post = () => parent.postMessage({ oilFig: "column", h: Math.ceil(document.body.getBoundingClientRect().height) }, "*");
addEventListener("load", post);
addEventListener("resize", post);
post();
