// Interactive figures of the Irrawaddy rice boat long read (/blog/2026/irrawaddy-rice-boat/). Each <figure data-rb="..."> is filled
// when the page loads: "boat" is the 3D model taken apart (boat-model.js), "river" the SVG of the trip up and down the Irrawaddy.
// Part texts live in PARTS below; the post's prose cites the sources. Nothing is loaded from outside the site.
import { THREE, Boat, Viewer, webgl, MAST, HELM, L, halfBeam, sheerY } from './boat-model.js';

const NS = 'http://www.w3.org/2000/svg';
const INK = '#04204B', BLUE = '#0b4fc0', WARM = '#b4552f', TEAL = '#138374', MUTED = '#6b7280';
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function h(tag, attrs, ...kids) {
  const svg = tag.startsWith('svg:');
  const e = svg ? document.createElementNS(NS, tag.slice(4)) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.setAttribute('class', v);
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
const S = (tag, attrs, ...kids) => h('svg:' + tag, attrs, ...kids);
const T = (x, y, txt, o = {}) => S('text', { x, y, 'font-size': o.s || 12, fill: o.c || INK, 'text-anchor': o.a || 'start', 'font-weight': o.w || 400, 'font-family': 'Inter, system-ui, sans-serif', class: o.cls }, txt);

function frame(root, kind) {
  root.classList.add('concept', 'bx', 'rb');
  const title = root.dataset.title, cap = root.dataset.caption;
  root.innerHTML = '';
  const ctrl = h('div', { class: 'bx-ctrl' }), stage = h('div', { class: 'bx-stage' }), legend = h('div', { class: 'bx-legend' });
  root.append(h('header', {}, h('span', { class: 'concept-kind' }, kind), h('span', { class: 'concept-title' }, title)), ctrl, stage, legend);
  if (cap) root.append(h('figcaption', {}, cap));
  return { ctrl, stage, legend };
}
function seg(options, current, onPick) {
  const wrap = h('span', { class: 'bx-seg' });
  const set = (v) => [...wrap.children].forEach((b) => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); });
  for (const [v, label] of options) wrap.append(h('button', { type: 'button', class: v === current ? 'on' : '', 'data-v': v, 'aria-pressed': v === current ? 'true' : 'false', onclick: () => { onPick(v); set(v); } }, label));
  wrap.set = set; return wrap;
}
const chip = (label, on, fn) => { const b = h('button', { type: 'button', class: 'bx-chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: () => { const v = !b.classList.contains('on'); b.classList.toggle('on', v); b.setAttribute('aria-pressed', v); fn(v); } }, label); return b; };

// ====================================================================================================
// the parts: name, Burmese or English term where one is attested, and what it does
// ====================================================================================================
export const PARTS = [
  { k: 'hull', name: 'Hull', info: 'Built up from a dugout: one log of thingan (Hopea odorata) hollowed through a slot, soaked, warmed over a slow fire and levered open until its beam doubled; long planks were then built on above it and the seam luted with bee-dammar. Larger hulls copied this shape in teak planking. Long, narrow, with a low fine bow and a stern that rises high.' },
  { k: 'stem', name: 'Bow and stem', info: 'The bow is low, with fine hollow lines, ending in a pointed stem that turns up. Its solid head is carved; on the museum model it is gilded.' },
  { k: 'walk', name: 'Poling gallery', info: 'A gallery of large bamboos, about two feet wide, along each side from stem to stern. Against the current the crew planted bamboo poles in the river bed, set the upper end in the hollow above the collarbone, leaned forward and walked aft along it.' },
  { k: 'mast', name: 'Shear mast', info: 'Two spars lashed together at the head, a pair of shears, standing on two posts that rise from the keel-log, so that the mast can be lowered or taken out. Above the main yard the two run into one as a topmast, and wooden rungs between them make a ladder.' },
  { k: 'sails', name: 'Square sails', info: 'A bamboo yard, hung from the masthead so that it bows upwards, carries a cotton square sail on rings like a curtain. Yule paced one yard at 130 feet with about 4,000 square feet of sail; Talbot Kelly saw six or seven square sails stacked. Either way they draw only with the wind behind.' },
  { k: 'rig', name: 'Rigging', info: 'Stays to the bow and stern, shrouds, and the halyard. Many lifts from the masthead carry the long, flexible yard; braces swing it and sheets hold the foot of the sail.' },
  { k: 'cargo', name: 'Cargo hold', info: 'The fore part held the cargo, rice in bags or paddy in bulk, under strong bamboo mats on a bamboo frame that lay flush with the gunwale and served as a deck.' },
  { k: 'cabin', name: 'Deck house', info: 'Mat walls under a roof of split bamboo, on the after half of the boat. The crew lived and cooked here, on a hearth that was a shallow box of earth or ashes.' },
  { k: 'tilt', name: 'Mat house', info: 'An arched roof of woven bamboo mat on hoops, the "mat tilt" of the museum records, over the after part of the house. Light, cheap and mended from the bank.' },
  { k: 'stern', name: 'High stern', info: 'The stern rises ten to fifteen feet above the water and sweeps forward over the helmsman, its sides carved in open scrollwork. In large boats this curve had to be built up from several pieces; a canoe gets it in one.' },
  { k: 'helm', name: "Steersman's seat", info: 'A high, elaborately carved bench or chair on the after deck, under a small roof. From here the steersman sees over the houses and the cargo to the shoals ahead.' },
  { k: 'rudder', name: 'Quarter rudder', info: 'A large paddle lashed to the port quarter, some feet out from the side, with a short tiller across the steersman\'s bench. It needed a constant pull, and the same arrangement steered Egyptian and Roman ships.' },
  { k: 'poles', name: 'Poles', info: 'Long bamboo poles for the poling gallery: the way upstream when the wind fails, and the way off a sandbank.' },
  { k: 'oars', name: 'Sweeps', info: 'Long oars worked by men standing on the fore deck. Coming down with the current the boat was rowed, with twelve to sixteen oars; going up, the oars came in and the sails went up. Press "coming down" to see them out.' },
  { k: 'anchor', name: 'Anchor and cable', info: 'The anchor (kyauk) was a wooden fork weighted with a stone, later of European pattern. Boats anchored at night and waited out bad weather.' },
];

function overlay(host) {
  const svg = S('svg', { class: 'rb-ov', style: 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none' }); host.append(svg);
  return {
    draw(view, items, sel) {
      const w = view.w || 1, hh = view.h || 1; svg.setAttribute('viewBox', `0 0 ${w} ${hh}`); svg.replaceChildren();
      const pts = items.map((it) => { const [x, y, z] = view.project(it.pos); return { ...it, x, y, vis: z < 1 && x > 0 && x < w && y > 0 && y < hh }; }).filter((p) => p.vis);
      for (const side of [0, 1]) {
        const col = pts.filter((p) => (p.x > w / 2) === !!side).sort((a, b) => a.y - b.y);
        let last = 6;
        for (const p of col) {
          const ty = Math.max(last + 19, Math.min(hh - 8, p.y)); last = ty; const tx = side ? w - 10 : 10;
          const on = sel === p.id, tw = p.text.length * 6.6;
          svg.append(S('path', { d: `M${p.x},${p.y} L${side ? tx - 6 - tw : tx + 6 + tw},${ty - 4}`, stroke: on ? WARM : '#8d97a8', 'stroke-width': on ? 1.6 : 1, fill: 'none', opacity: on ? 1 : 0.75 }));
          svg.append(S('circle', { cx: p.x, cy: p.y, r: on ? 4.5 : 3, fill: on ? WARM : '#fff', stroke: on ? '#fff' : INK, 'stroke-width': 1.3 }));
          svg.append(T(tx, ty, p.text, { s: 12.5, w: on ? 700 : 500, a: side ? 'end' : 'start', c: on ? WARM : INK, cls: 'rb-lt' }));
        }
      }
    },
  };
}

const VIEWS = {
  quarter: { pos: [-36, 15, 50], target: [0, 8, 0] },
  side: { pos: [0, 11, 84], target: [0, 8, 0] },
  bow: { pos: [-34, 9, 20], target: [-2, 5, 0] },
  stern: { pos: [26, 7, 18], target: [7, 3, 0] },
  above: { pos: [0.1, 46, 8], target: [0, 2, 0] },
  helm: { pos: [L / 2 - 3.2, sheerY(HELM.s) + 2.3, 0.5], target: [-L / 2, 3, 0] },
};

// ====================================================================================================
// 1. the boat in 3D, taken apart
// ====================================================================================================
function figBoat(root) {
  const { ctrl, stage, legend } = frame(root, '3D · schematic');
  if (!webgl()) { stage.textContent = 'This figure needs WebGL, which this browser does not offer.'; return; }
  const host = h('div', { class: 'rb-3d' }); stage.append(host);
  const view = new Viewer(host, VIEWS.quarter);
  const boat = new Boat(); view.scene.add(boat.group);
  const ov = overlay(host);
  const st = { ex: 0, tgt: 0, sel: null, sail: 1, sailTgt: 1, oar: 0, oarTgt: 0, ph: 0, labels: true, steer: 0, t: 0, sway: !REDUCED };
  const info = h('div', { class: 'rb-info' }, 'Pick a part by its name, or click it in the picture. ', h('b', {}, 'Take it apart'), ' moves the parts away from the hull.');
  const chips = h('div', { class: 'rb-chips' }), btn = {};
  const select = (k) => {
    st.sel = st.sel === k ? null : k; const p = PARTS.find((q) => q.k === k);
    if (st.sel) info.replaceChildren(h('b', {}, p.name + '. '), p.info); else info.replaceChildren('Pick a part by its name, or click it in the picture.');
    for (const q in btn) btn[q].classList.toggle('on', q === st.sel);
    boat.highlight(st.sel);
  };
  for (const p of PARTS) { btn[p.k] = h('button', { type: 'button', class: 'bx-chip', onclick: () => select(p.k) }, p.name); chips.append(btn[p.k]); }
  const apart = h('button', { type: 'button', class: 'bx-chip', onclick: () => { st.tgt = st.tgt > 0.5 ? 0 : 1; apart.textContent = st.tgt > 0.5 ? 'Put it together' : 'Take it apart'; apart.classList.toggle('on', st.tgt > 0.5); } }, 'Take it apart');
  const views = seg([['quarter', 'three-quarter'], ['side', 'side'], ['bow', 'bow'], ['stern', 'stern'], ['above', 'above'], ['helm', "helmsman's view"]], 'quarter', (v) => view.goTo(VIEWS[v].pos, VIEWS[v].target, 900));
  const steer = h('input', { type: 'range', class: 'bx-range', min: -35, max: 35, value: 0, step: 1, 'aria-label': 'tiller angle' });
  steer.addEventListener('input', () => { st.steer = (+steer.value * Math.PI) / 180; });
  ctrl.append(h('div', { class: 'rb-bar' }, apart, views,
    seg([['up', 'going up: sails'], ['down', 'coming down: sweeps']], 'up', (v) => { st.sailTgt = v === 'up' ? 1 : 0; st.oarTgt = v === 'up' ? 0 : 1; }),
    seg([['kelly', 'six sails (Talbot Kelly, 1908)'], ['yule', 'one great sail (Yule, 1855)']], 'kelly', (v) => boat.setRig(v)),
    chip('Waterline', false, (v) => { boat.water.visible = v; }),
    chip('Labels', true, (v) => { st.labels = v; }),
    h('label', { class: 'rb-steer' }, h('span', { class: 'bx-lbl' }, 'tiller'), steer)));
  stage.after(info, chips);
  // pick by clicking
  const rc = new THREE.Raycaster(); let down = null;
  host.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  host.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return; down = null;
    const r = host.getBoundingClientRect(); rc.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), view.camera);
    const meshes = []; boat.group.traverse((o) => { if (o.isMesh && o.visible && o !== boat.water) meshes.push(o); });
    const hits = rc.intersectObjects(meshes, false);
    for (const hit of hits) { if (hit.object.material && hit.object.material.opacity < 0.5 && st.sel) continue; for (const k in boat.parts) { let o = hit.object; while (o) { if (o === boat.parts[k].g) { select(k); return; } o = o.parent; } } }
  });
  view.tick = (dt) => {
    st.t += dt;
    st.ex += (st.tgt - st.ex) * Math.min(1, dt * 3.5); boat.explode(st.ex);
    st.sail += (st.sailTgt - st.sail) * Math.min(1, dt * 2.5); boat.setSail(st.sail);
    st.oar += (st.oarTgt - st.oar) * Math.min(1, dt * 2.0); if (!REDUCED && st.oar > 0.5) st.ph = (st.ph + dt * 0.35) % 1; boat.setOars(st.oar, st.ph);
    boat.steer(st.steer + (st.sway ? 0.03 * Math.sin(st.t * 0.7) : 0));
    const items = st.labels ? PARTS.map((p) => ({ id: p.k, text: p.name, pos: boat.anchor(p.k) })) : [];
    ov.draw(view, items, st.sel);
  };
  root.__boat = boat; root.__view = view; root.__st = st;
}

// ====================================================================================================
// 2. the river: up with the monsoon wind, down with the current (schematic map)
// ====================================================================================================
// towns along the Irrawaddy, approximate latitude / longitude (schematic map, not a survey)
const TOWNS = [
  { n: 'Bhamo', lat: 24.26, lon: 97.23 }, { n: 'Mandalay', lat: 21.98, lon: 96.08 }, { n: 'Pakokku', lat: 21.33, lon: 95.08 },
  { n: 'Magwe', lat: 20.15, lon: 94.93 }, { n: 'Prome (Pyay)', lat: 18.82, lon: 95.22 }, { n: 'Henzada', lat: 17.64, lon: 95.46 },
  { n: 'Rangoon (Yangon)', lat: 16.84, lon: 96.17 }, { n: 'Bassein (Pathein)', lat: 16.78, lon: 94.73 },
];
// the main stream as a polyline of lat/lon points (rough trace)
const RIVER = [[25.4, 97.4], [24.26, 97.23], [23.6, 96.4], [22.95, 96.0], [21.98, 96.08], [21.6, 95.75], [21.33, 95.08], [20.9, 94.85], [20.15, 94.93], [19.5, 94.95], [18.82, 95.22], [18.2, 95.25], [17.64, 95.46], [17.2, 95.3], [16.6, 95.2], [16.1, 95.1], [15.8, 95.0]];
const DELTA = [[[17.64, 95.46], [17.0, 95.8], [16.84, 96.17], [16.4, 96.3]], [[17.2, 95.3], [16.78, 94.73], [16.2, 94.4]], [[16.6, 95.2], [16.0, 95.6]]];

function figRiver(root) {
  const { ctrl, stage, legend } = frame(root, 'map · schematic');
  const W = 900, H = 560, lat0 = 15.6, lat1 = 25.6, lon0 = 93.6, lon1 = 98.2;
  const P = (lat, lon) => [60 + ((lon - lon0) / (lon1 - lon0)) * 380, 20 + ((lat1 - lat) / (lat1 - lat0)) * (H - 40)];
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'rb-svg', role: 'img', 'aria-label': 'Schematic map of the Irrawaddy: boats sail up with the monsoon wind and drift down with the current' });
  stage.append(svg);
  const st = { season: 'wet', ph: 0, run: !REDUCED };
  const pick = seg([['wet', 'south-west monsoon (May to October)'], ['dry', 'north-east monsoon (November to April)']], 'wet', (v) => { st.season = v; draw(); });
  ctrl.append(pick);
  const read = h('div', { class: 'rb-read' }); legend.append(read);
  const pathD = (pts) => pts.map(([a, b], i) => { const [x, y] = P(a, b); return (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); }).join(' ');
  const riverPts = RIVER.map(([a, b]) => P(a, b));
  const lens = [0]; for (let i = 1; i < riverPts.length; i++) lens.push(lens[i - 1] + Math.hypot(riverPts[i][0] - riverPts[i - 1][0], riverPts[i][1] - riverPts[i - 1][1]));
  const at = (f) => { const d = f * lens[lens.length - 1]; let i = 1; while (i < lens.length - 1 && lens[i] < d) i++; const k = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1); return [riverPts[i - 1][0] + k * (riverPts[i][0] - riverPts[i - 1][0]), riverPts[i - 1][1] + k * (riverPts[i][1] - riverPts[i - 1][1])]; };
  let boatUp, boatDown;
  function draw() {
    svg.replaceChildren();
    svg.append(S('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }));
    svg.append(S('path', { d: `M40,${P(16.25, 93.6)[1]} C200,${P(15.9, 94.6)[1]} 300,${P(16.3, 96.0)[1]} 520,${P(16.2, 97.5)[1]} L520,${H - 6} L40,${H - 6} Z`, fill: '#eef3fa' }));
    svg.append(T(70, H - 16, 'Andaman Sea', { s: 12, c: MUTED }));
    for (const d of DELTA) svg.append(S('path', { d: pathD(d), stroke: '#8fb3dc', 'stroke-width': 2.2, fill: 'none' }));
    svg.append(S('path', { d: pathD(RIVER), stroke: '#5d8fcf', 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    svg.append(T(P(23.3, 95.4)[0] - 30, P(23.3, 95.4)[1], 'Irrawaddy', { s: 13, c: BLUE, w: 600 }));
    // the dry zone, where rice was short, and the delta, where it grew
    const [dx, dy] = P(21.6, 94.1); svg.append(S('ellipse', { cx: dx + 70, cy: dy + 10, rx: 95, ry: 70, fill: 'rgba(180,85,47,0.08)', stroke: WARM, 'stroke-dasharray': '4 4' }));
    svg.append(T(dx - 10, dy - 66, 'dry zone (Upper Burma)', { s: 11.5, c: WARM, w: 600 }));
    const [ex, ey] = P(16.9, 95.2); svg.append(S('ellipse', { cx: ex, cy: ey, rx: 85, ry: 42, fill: 'rgba(19,131,116,0.08)', stroke: TEAL, 'stroke-dasharray': '4 4' }));
    svg.append(T(ex - 40, ey + 58, 'rice delta (Lower Burma)', { s: 11.5, c: TEAL, w: 600 }));
    for (const t of TOWNS) { const [x, y] = P(t.lat, t.lon); svg.append(S('circle', { cx: x, cy: y, r: 3.6, fill: INK })); svg.append(T(x + 8, y + 4, t.n, { s: 12, w: t.n.startsWith('Mandalay') || t.n.startsWith('Rangoon') ? 700 : 400 })); }
    // the wind
    const wet = st.season === 'wet';
    for (let k = 0; k < 5; k++) {
      const x0 = 590 + (k % 2) * 70, y0 = 150 + k * 58;
      svg.append(S('path', { d: wet ? `M${x0},${y0 + 40} l50,-50` : `M${x0 + 50},${y0 - 10} l-50,50`, stroke: wet ? BLUE : MUTED, 'stroke-width': 2, fill: 'none', 'marker-end': 'url(#rbArrow)', opacity: 0.8 }));
    }
    svg.append(S('defs', {}, S('marker', { id: 'rbArrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' }, S('path', { d: 'M0,0 L10,5 L0,10 z', fill: wet ? BLUE : MUTED }))));
    svg.append(T(560, 100, wet ? 'wind from the south-west: up the valley' : 'wind from the north-east: down the valley, light', { s: 12.5, c: wet ? BLUE : MUTED, w: 600 }));
    const lines = wet
      ? ['Going up: in the monsoon strong winds blow up the river.', 'Six or seven square sails, of use only before the wind,', 'drive the boat against the current. Rice from the delta', 'went up to the dry zone and the royal capital.']
      : ['Coming down: twelve to sixteen oars and the current; the', 'sails stay furled. At low water the river is shallow and full', 'of shifting sandbanks, so a flat bottom and a shallow draught', 'matter more than speed.'];
    lines.forEach((l, i) => svg.append(T(560, 470 + i * 18, l, { s: 12, c: INK })));
    boatUp = S('g', {}); boatDown = S('g', {});
    const icon = (g, sail) => { g.append(S('path', { d: 'M-12,0 Q0,6 12,0 L10,-3 L-10,-3 Z', fill: '#6e4826' })); if (sail) g.append(S('rect', { x: -7, y: -17, width: 14, height: 12, fill: '#efe4cc', stroke: '#8a7a5e', 'stroke-width': 0.8 })); };
    icon(boatUp, true); icon(boatDown, false);
    svg.append(boatUp, boatDown);
    read.replaceChildren(h('span', {}, 'sea to Bhamo: ', h('b', {}, '689 miles (1,109 km)'), ', open to steamers all year in 1923'), h('span', {}, 'rise from low water to flood at Mandalay and Prome: ', h('b', {}, '9.7 to 11.4 m')), h('span', {}, 'map and boats: ', h('i', {}, 'schematic')));
    place();
  }
  function place() {
    const wet = st.season === 'wet';
    const fUp = 0.25 + 0.6 * (1 - st.ph), fDn = 0.2 + 0.7 * st.ph;
    const [ux, uy] = at(fUp), [dx, dy] = at(fDn);
    boatUp.setAttribute('transform', `translate(${ux + 16},${uy})`); boatUp.style.opacity = wet ? 1 : 0.15;
    boatDown.setAttribute('transform', `translate(${dx - 16},${dy})`); boatDown.style.opacity = wet ? 0.35 : 1;
  }
  draw();
  let last = performance.now();
  const loop = (now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; if (st.run) { st.ph = (st.ph + dt * 0.04) % 1; place(); } requestAnimationFrame(loop); };
  if (!REDUCED) requestAnimationFrame(loop);
}

const FIG = { boat: figBoat, river: figRiver };
for (const el of document.querySelectorAll('figure[data-rb]')) { const f = FIG[el.dataset.rb]; if (f) try { f(el); } catch (e) { console.error(e); el.textContent = 'This figure could not be drawn.'; } }
