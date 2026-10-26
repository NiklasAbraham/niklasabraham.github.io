// Live layer of the refinery figure. DATA comes from build.mjs (model.mjs numbers).
const DATA = __DATA__;
const readout = __READOUT__;
const { P, crudes, glass, glasses, valves } = DATA;
const stage = document.querySelector(".rf-stage");
const svg = stage.querySelector("svg");
const out = document.querySelector("[data-readout]");
const status = stage.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const liq = {};
for (const g of glasses) {
  const el = svg.querySelector(`.rf-liq[data-cut="${g.id}"]`);
  liq[g.id] = { g, body: el.querySelector(".rf-liq-body"), top: el.querySelector(".rf-liq-top"), mark: svg.querySelector(`[data-mark="${g.id}"]`), level: 0 };
}
const vr = (() => {
  const el = svg.querySelector('.rf-liq[data-cut="vr"]');
  return el ? { body: el.querySelector(".rf-liq-body"), edge: el.querySelector(".rf-liq-edge"), level: 0 } : null;
})();
const levers = valves.map((v) => ({ v, el: svg.querySelector(`[data-lever="${v.i}"]`), turn: 0 }));
const bands = [...svg.querySelectorAll(".rf-band")];
const branches = (i) => svg.querySelectorAll(`[data-flow="branch${i}"]`);
const flames = [...svg.querySelectorAll(".rf-flame")];

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const crudeRGB = crudes.map((c) => hex(c.color));
let tint = crudeRGB[0].slice();

let pick = 0;
let frame = 0, last = 0, visible = false, clock = 0, touring = !still.matches, idle = 0;
const zOf = (pct) => glass.z0 + (Math.max(0.0001, pct) / DATA.scaleMax) * glass.h;

function liquid(entry, pct) {
  const h = Math.max(0.05, (pct / DATA.scaleMax) * glass.h);
  const c = cylinder(entry.g.gx, entry.g.gy, glass.r, glass.z0, h, P, 32);
  entry.body.setAttribute("d", c.fill);
  entry.top.setAttribute("d", c.top);
  // lit level mark on the scale plate, from the plate edge out
  const z = zOf(pct);
  const a = iso([entry.g.sx0, entry.g.face, z], P);
  const b = iso([entry.g.sx0 - 1.6, entry.g.face, z], P);
  entry.mark.setAttribute("d", `M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}`);
}
function lever(L, turn) {
  // the lever lies across the pipe when shut (turn 0) and along it when open (turn 1)
  const ang = Math.PI / 2 - turn * Math.PI / 2;
  const [x, y, z] = L.v.top;
  const len = 6;
  const a = iso([x, y, z], P);
  const b = iso([x + len * Math.cos(ang), y + len * Math.sin(ang), z], P);
  L.el.setAttribute("d", `M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}`);
}

function target() { return crudes[pick]; }
function say() {
  const text = readout(target());
  if (out.textContent !== text) out.textContent = text;
}
function describe() {
  const c = target();
  status.textContent = `${c.name}, ${c.kind}: naphtha ${c.yields.naphtha}, jet ${c.yields.kero}, diesel ${c.yields.diesel}, residue ${c.yields.resid} weight percent.`;
}
function select(i, { user = true } = {}) {
  pick = (i + crudes.length) % crudes.length;
  bands.forEach((b) => b.toggleAttribute("data-on", Number(b.dataset.barrel) === pick));
  for (let j = 0; j < crudes.length; j++) branches(j).forEach((el) => el.toggleAttribute("data-on", j === pick));
  levers.forEach((L) => L.el.toggleAttribute("data-on", L.v.i === pick));
  say();
  if (user) describe();
  run();
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const k = calm ? 1 : 1 - Math.exp(-dt / 0.45);
  if (touring) {
    clock += dt;
    const want = Math.floor(clock / 3.6) % crudes.length;
    if (want !== pick) select(want, { user: false });
  }
  const c = target();
  let moving = false;
  for (const id of Object.keys(liq)) {
    const e = liq[id];
    const goal = c.yields[id];
    e.level += (goal - e.level) * k;
    if (Math.abs(goal - e.level) < 0.01) e.level = goal; else moving = true;
    liquid(e, e.level);
  }
  if (vr) {
    vr.level += (c.vr - vr.level) * k;
    if (Math.abs(c.vr - vr.level) < 0.01) vr.level = c.vr; else moving = true;
    const g = liq.resid.g;
    const h = Math.max(0.05, (vr.level / DATA.scaleMax) * glass.h);
    const cy = cylinder(g.gx, g.gy, glass.r, glass.z0, h, P, 32);
    vr.body.setAttribute("d", cy.fill);
    vr.edge.setAttribute("d", sideArc(g.gx, g.gy, glass.outer + 0.15, glass.z0 + h, P, 40));
  }
  const goal = crudeRGB[pick];
  tint = tint.map((v, i) => v + (goal[i] - v) * k);
  if (tint.some((v, i) => Math.abs(goal[i] - v) > 0.5)) moving = true;
  stage.style.setProperty("--crude", `rgb(${tint.map((v) => Math.round(v)).join(",")})`);
  levers.forEach((L) => {
    const want = L.v.i === pick ? 1 : 0;
    L.turn += (want - L.turn) * (calm ? 1 : 1 - Math.exp(-dt / 0.25));
    if (Math.abs(want - L.turn) < 0.002) L.turn = want; else moving = true;
    lever(L, L.turn);
  });
  // burners: a slow, small flicker
  if (!calm) {
    flames.forEach((f, i) => {
      const s = 1 + 0.07 * Math.sin(now / 170 + i * 1.7) + 0.04 * Math.sin(now / 97 + i * 2.9);
      f.style.transform = `scale(${(1 + 0.03 * Math.sin(now / 130 + i)).toFixed(3)},${s.toFixed(3)})`;
    });
  }
  const keepGoing = !calm && (touring || moving || flames.length > 0);
  frame = visible && (keepGoing || moving) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const hold = () => {
  touring = false;
  clearTimeout(idle);
  idle = setTimeout(() => { touring = !still.matches; clock = pick * 3.6 + 0.01; run(); }, 6000);
};
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

svg.querySelectorAll(".rf-hit").forEach((el) => {
  const i = Number(el.dataset.pick);
  el.addEventListener("pointerenter", () => { hold(); if (pick !== i) select(i); });
  el.addEventListener("click", () => { hold(); select(i); });
});
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") to = pick + 1;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = pick - 1;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = crudes.length - 1;
  if (to === null) return;
  event.preventDefault();
  hold();
  select(to);
});
if (still.matches) touring = false;
// first paint at the selected crude, already filled
for (const id of Object.keys(liq)) { liq[id].level = crudes[0].yields[id]; liquid(liq[id], liq[id].level); }
if (vr) vr.level = crudes[0].vr;
select(0, { user: false });
levers.forEach((L) => { L.turn = L.v.i === 0 ? 1 : 0; lever(L, L.turn); });

// tell the embedding post how tall this page is
const post = () => parent.postMessage({ oilFig: "refinery", h: document.documentElement.scrollHeight }, "*");
addEventListener("load", post);
addEventListener("resize", post);
post();
