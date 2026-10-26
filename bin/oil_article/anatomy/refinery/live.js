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
let dirty = true;
let frame = 0, last = 0, visible = false, clock = 0, touring = !still.matches, idle = 0;
const zOf = (pct) => glass.z0 + (Math.max(0.0001, pct) / DATA.scaleMax) * glass.h;

function liquid(entry, pct) {
  const h = Math.max(0.05, (pct / DATA.scaleMax) * glass.h);
  const c = cylinder(entry.g.gx, entry.g.gy, glass.r, glass.z0, h, P, 32);
  entry.body.setAttribute("d", c.fill);
  entry.top.setAttribute("d", c.top);
  // lit level mark across the scale plate, edge to edge
  const z = zOf(pct);
  const a = iso([entry.g.sx0, entry.g.face, z], P);
  const b = iso([entry.g.sx0 + 2, entry.g.face, z], P);
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
  svg.querySelectorAll(".it[data-pick]").forEach((g) => g.toggleAttribute("data-on", Number(g.dataset.pick) === pick));
  for (let j = 0; j < crudes.length; j++) branches(j).forEach((el) => el.toggleAttribute("data-on", j === pick));
  levers.forEach((L) => L.el.toggleAttribute("data-on", L.v.i === pick));
  say();
  if (user) describe();
  run();
}

// ---- burner flames: a WebGL layer over the drawing, masked to the firebox window ----
const LIGHT = (stage.closest("[data-theme]")?.getAttribute("data-theme") ?? "dark") === "light" ? 1 : 0;
const F = DATA.fire;
const FRAGMENT = `
uniform float uLight;
uniform float uCalm;
const float FY=${F.face.toFixed(2)};
const float FT=${F.wall.toFixed(2)};
const vec4 WIN=vec4(${F.win.map((v) => v.toFixed(2)).join(",")});
const float BY=${F.y.toFixed(2)};
const float BZ=${F.floor.toFixed(2)};
const float HF=${F.height.toFixed(2)};
const float WF=${F.width.toFixed(2)};
const float SEAM=${F.seam.toFixed(3)};
float opening(vec2 vb,float y){vec3 p=onWallY(vb,y);float s=pixelOf()*.6;return window(p.x,WIN.x+SEAM,WIN.y-SEAM,s)*window(p.z,WIN.z+SEAM,WIN.w-SEAM,s);}
// blackbody-ordered stops: dull red, red, orange, yellow, pale
vec3 ramp(float e){
  vec3 c=mix(vec3(.45,.09,.05),vec3(.78,.12,.03),smoothstep(0.,.25,e));
  c=mix(c,vec3(.95,.40,.06),smoothstep(.2,.5,e));
  c=mix(c,vec3(1.,.78,.14),smoothstep(.45,.75,e));
  return mix(c,vec3(1.,.94,.80),smoothstep(.72,1.,e));
}
float flame(vec2 vb,float x,float seed,float t){
  vec2 b=project(vec3(x,BY,BZ));
  vec2 up=project(vec3(x,BY,BZ+1.))-b;
  vec2 rt=project(vec3(x-${F.perp[1].toFixed(4)},BY+${F.perp[0].toFixed(4)},BZ))-b;
  vec2 d=vb-b;
  float h=dot(d,up)/dot(up,up);
  float u=dot(d,rt)/dot(rt,rt);
  float q=clamp(h/HF,0.,1.);
  float lick=(fbm2(vec2(u*.35+seed,h*.18-t*2.3))-.5)*2.2*q;
  float sway=sin(t*1.7+seed*3.)*.35*q*q;
  float w=WF*pow(max(1.-q,0.),.55)*(1.+.25*sin(h*.5-t*6.+seed))*smoothstep(-.5,1.5,h);
  float r=abs(u-lick-sway)/max(w,.05);
  float body=1.-smoothstep(.55,1.,r);
  float heat=mix(1.,.15,smoothstep(.0,1.,q))*(1.-.35*fbm2(vec2(u*.6-seed,h*.3-t*3.1)));
  float fade=smoothstep(-.4,.5,h)*(1.-smoothstep(.75,1.,h/HF+ .15*(fbm2(vec2(seed,t*1.3))-.5)));
  float core=(1.-smoothstep(0.,.55,r))*(1.-smoothstep(.0,.45,q));
  return body*fade*(heat*.8+core*.6)*mix(1.,1.3-.6*smoothstep(0.,1.,r),uLight);
}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  float m=opening(vb,FY)*opening(vb,FY-FT);
  if(m<.0001){gl_FragColor=vec4(0.);return;}
  float t=uTime;
  float e=0.;
  ${F.xs.map((x, i) => `e+=flame(vb,${x.toFixed(2)},${(i * 1.37 + 0.4).toFixed(2)},t);`).join("\n  ")}
  e=1.-exp(-1.6*e);
  vec3 c=ramp(e);
  vec4 dark=vec4(c*e,max(c.r*e,max(c.g*e,c.b*e)));
  float a=.96*(1.-exp(-3.*e));
  vec4 light=vec4(c*a,a);
  vec4 o=mix(dark,light,uLight)*m;
  float n=(hash12(gl_FragCoord.xy+fract(t*.61)*91.)+hash12(gl_FragCoord.yx*1.37+fract(t*.37)*57.)-1.)/255.;
  o=max(o+n*smoothstep(0.,1.5/255.,o.a),0.);
  o.rgb=min(o.rgb,vec3(o.a));
  gl_FragColor=o;
}`;
const canvas = stage.querySelector(".rf-gl");
const layer = canvas && typeof glLayer === "function" ? glLayer({ canvas, fragment: FRAGMENT, view: [DATA.W, DATA.H], camera: DATA.camera, uniforms: [], fixed: { uLight: LIGHT } }) : null;
if (layer) stage.setAttribute("data-gl", "");
let fireClock = 0.8;

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
  let moving = dirty;
  for (const id of Object.keys(liq)) {
    const e = liq[id];
    const goal = c.yields[id];
    if (e.level !== goal) { moving = true; e.level += (goal - e.level) * k; if (Math.abs(goal - e.level) < 0.01) e.level = goal; }
  }
  if (vr && vr.level !== c.vr) { moving = true; vr.level += (c.vr - vr.level) * k; if (Math.abs(c.vr - vr.level) < 0.01) vr.level = c.vr; }
  const goal = crudeRGB[pick];
  if (tint.some((v, i) => v !== goal[i])) { moving = true; tint = tint.map((v, i) => (Math.abs(goal[i] - v) < 0.5 ? goal[i] : v + (goal[i] - v) * k)); }
  levers.forEach((L) => {
    const want = L.v.i === pick ? 1 : 0;
    if (L.turn !== want) { moving = true; L.turn += (want - L.turn) * (calm ? 1 : 1 - Math.exp(-dt / 0.25)); if (Math.abs(want - L.turn) < 0.002) L.turn = want; }
  });
  // SVG work only while something in it changes
  if (moving) {
    for (const id of Object.keys(liq)) liquid(liq[id], liq[id].level);
    if (vr) {
      const g = liq.resid.g;
      const h = Math.max(0.05, (vr.level / DATA.scaleMax) * glass.h);
      const cy = cylinder(g.gx, g.gy, glass.r, glass.z0, h, P, 32);
      vr.body.setAttribute("d", cy.fill);
      vr.edge.setAttribute("d", sideArc(g.gx, g.gy, glass.outer + 0.15, glass.z0 + h, P, 40));
    }
    stage.style.setProperty("--crude", `rgb(${tint.map((v) => Math.round(v)).join(",")})`);
    levers.forEach((L) => lever(L, L.turn));
    dirty = false;
  }
  // the fire never rests: shader (or the SVG fallback's flicker) runs while visible
  if (!calm) fireClock += dt;
  if (layer) layer.draw({}, fireClock);
  else if (!calm) flames.forEach((f, i) => {
    const s = 1 + 0.07 * Math.sin(now / 170 + i * 1.7) + 0.04 * Math.sin(now / 97 + i * 2.9);
    f.style.transform = `scale(${(1 + 0.03 * Math.sin(now / 130 + i)).toFixed(3)},${s.toFixed(3)})`;
  });
  frame = visible && (!calm || moving) ? requestAnimationFrame(tick) : 0;
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
addEventListener("resize", () => { post(); dirty = true; run(); });
post();
