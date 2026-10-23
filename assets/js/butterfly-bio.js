// The biology figures of the butterfly-wing long read: the animal taken apart (anatomy), the thorax cut open with its muscles and hinge (thorax)
// and the whole beating butterfly with its steering controls and the path of the wingtip (stroke). All three drive the same procedural 3D
// model (Butterfly in butterfly-core.js); the muscle timing is the burst pattern of the article (SPIKES), the shapes are schematic.
import { THREE, Viewer, Butterfly, PARTS, PALETTES, DEFAULT_P, A0, SPIKES, force, wingAngles, webgl, TAU, clamp } from './butterfly-core.js';
import { h, S, T, frame, param } from './butterfly-physics.js';

const INK = '#04204B', BLUE = '#0b4fc0', WARM = '#b4552f', TEAL = '#138374', MUTED = '#6b7280', RULE = '#c9d0dc', RED = '#c0392b';
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const chip = (label, on, fn) => { const b = h('button', { type: 'button', class: 'bx-chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: () => { const v = !b.classList.contains('on'); b.classList.toggle('on', v); b.setAttribute('aria-pressed', v); fn(v); } }, label); return b; };
function seg(options, current, onPick) {
  const wrap = h('span', { class: 'bx-seg' });
  const set = (v) => [...wrap.children].forEach((b) => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); });
  for (const [v, label] of options) wrap.append(h('button', { type: 'button', class: v === current ? 'on' : '', 'data-v': v, 'aria-pressed': v === current ? 'true' : 'false', onclick: () => { onPick(v); set(v); } }, label));
  return wrap;
}
const SPECIES = [['monarch', 'Monarch'], ['morpho', 'Blue morpho'], ['white', 'Cabbage white']];

// an SVG layer over the canvas; labels go into two columns (left and right of the animal), joined to their points by a leader line
function overlay(host) {
  const svg = S('svg', { class: 'bf-ov', style: 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none' }); host.append(svg);
  return {
    draw(view, items, sel) {
      const w = view.w || 1, hh = view.h || 1; svg.setAttribute('viewBox', `0 0 ${w} ${hh}`); svg.replaceChildren();
      const pts = items.map((it) => { const [x, y, z] = view.project(it.pos); return { ...it, x, y, vis: z < 1 }; }).filter((p) => p.vis);
      for (const side of [0, 1]) {
        const col = pts.filter((p) => (p.x > w / 2) === !!side).sort((a, b) => a.y - b.y);
        let last = 14;
        for (const p of col) {
          const ty = Math.max(last + 19, Math.min(hh - 10, p.y)); last = ty; const tx = side ? w - 10 : 10;
          const on = sel === p.id;
          svg.append(S('path', { d: `M${p.x},${p.y} L${side ? tx - 6 - p.text.length * 6.2 : tx + 6 + p.text.length * 6.2},${ty - 4}`, stroke: on ? WARM : '#8d97a8', 'stroke-width': on ? 1.6 : 1, fill: 'none', opacity: on ? 1 : 0.7 }));
          svg.append(S('circle', { cx: p.x, cy: p.y, r: on ? 4.5 : 3, fill: on ? WARM : '#fff', stroke: on ? '#fff' : INK, 'stroke-width': 1.3 }));
          svg.append(T(tx, ty, p.text, { s: 12, w: on ? 700 : 500, a: side ? 'end' : 'start', c: on ? WARM : INK }));
          svg.lastChild.setAttribute('class', 'bf-lt');
        }
      }
    },
  };
}

function scene(stage, opts, species = 'monarch') {
  const host = h('div', { class: 'bf-3d bf-hero-3d', style: 'position:relative' }); stage.append(host);
  const view = new Viewer(host, opts);
  view.scene.background = null; view.renderer.setClearColor(0xf8f6f1, 1);
  const bf = new Butterfly({ species }); view.scene.add(bf.group);
  return { host, view, bf };
}
const PAIR = { eyeL: 'eyeR', antL: 'antR', foreL: 'foreR', hindL: 'hindR' };

// ====================================================================================================
// 1. anatomy: the animal taken apart
// ====================================================================================================
export function figAnatomy(root) {
  const { ctrl, stage, legend } = frame(root, '3D · schematic');
  if (!webgl()) { stage.textContent = 'This figure needs WebGL, which this browser does not offer.'; return; }
  const { host, view, bf } = scene(stage, { pos: [3, 6.5, 12.5], target: [0, 0.3, 0], maxDist: 34, minDist: 4 });
  const ov = overlay(host);
  const st = { ex: 0, tgt: 0.0, sel: null, ph: 0.6, flap: false };
  bf.setCut(false); bf.explode(0); bf.update(st.ph);
  const info = h('div', { class: 'bf-info' }, 'Press ', h('b', {}, 'Take it apart'), ', then pick a part by its name, or click it in the picture.');
  const chips = h('div', { class: 'bf-chips' });
  const named = PARTS.filter((p) => p.name);
  const btn = {};
  const select = (k) => {
    st.sel = k; const p = PARTS.find((q) => q.k === k);
    info.replaceChildren(h('b', {}, p.name + '. '), p.info);
    for (const q in btn) btn[q].classList.toggle('on', q === k);
    const a = bf.partAnchor(k);
    const q = a.clone().multiplyScalar(0.55); view.goTo([q.x + 3, q.y + 6.5, q.z + 12.5], [q.x, q.y + 0.3, q.z], 700);
  };
  for (const p of named) { btn[p.k] = h('button', { type: 'button', class: 'bx-chip', onclick: () => select(p.k) }, p.name); chips.append(btn[p.k]); }
  ctrl.append(h('div', { class: 'bf-bar' },
    h('button', { type: 'button', class: 'bx-chip', onclick: function () { st.tgt = st.tgt > 0.5 ? 0 : 1; this.textContent = st.tgt > 0.5 ? 'Put it back together' : 'Take it apart'; this.classList.toggle('on', st.tgt > 0.5); exS.set(st.tgt); if (st.tgt > 0.5) view.goTo([3, 6.5, 12.5], [0, 0.3, 0], 900); } }, 'Take it apart'),
    seg(SPECIES, 'monarch', (v) => bf.setSpecies(v)),
    chip('Beat the wings', false, (v) => { st.flap = v; }),
    chip('See through the cuticle', false, (v) => bf.setSee(v))));
  const exS = param(ctrl, 'Explode', 0, 1.1, 0.01, 0, (v) => v.toFixed(2), (v) => { st.tgt = v; st.manual = true; });
  stage.after(info, chips);
  // pick by clicking: the part whose group contains the nearest mesh hit
  const rc = new THREE.Raycaster(); let down = null;
  host.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  host.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return; down = null;
    const r = host.getBoundingClientRect(); rc.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), view.camera);
    for (const w of [...bf.wings.fore, ...bf.wings.hind]) w.geo.computeBoundingSphere();
    const meshes = []; bf.group.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.visible) meshes.push(o); });
    const hit = rc.intersectObjects(meshes, false)[0]; if (!hit) return;
    for (const p of PARTS) { let o = hit.object; while (o) { if (o === bf.parts[p.k].g) { select(PAIR[p.k] || p.k); return; } o = o.parent; } }
  });
  let t = 0;
  view.tick = (dt) => {
    t += dt;
    st.ex += (st.tgt - st.ex) * Math.min(1, dt * 4);
    if (st.flap && !REDUCED) st.ph = (st.ph + dt * 0.5) % 1;
    bf.explode(st.ex); if (st.flap || t < 0.5) bf.update(st.ph);
    const items = [];
    if (st.ex > 0.15) for (const p of named) items.push({ id: p.k, text: p.name, pos: bf.partAnchor(p.k).applyMatrix4(bf.group.matrixWorld) });
    ov.draw(view, items, st.sel);
  };
  view.dirty = true;
}

// ====================================================================================================
// 2. the thorax cut open: two muscle sets, a roof that rocks, a hinge that bends
// ====================================================================================================
const TH_INFO = {
  notum: ['Roof (notum)', 'A shell of cuticle, thin and springy. Its edge carries the inner end of the wing root, so when the roof moves a fraction of a millimetre the wing turns by tens of degrees.'],
  dlm: ['Long muscles (DLM)', 'Run front to back. When they shorten the box gets shorter and its roof arches up; through the hinge the wings go down (power stroke).'],
  dvm: ['Vertical muscles (DVM)', 'Run from roof to floor. When they shorten they pull the roof down; the wings go up. Each set stretches the other, so no return muscle is needed.'],
  peg: ['Wing process (fulcrum)', 'A peg on the side wall that the wing base rests on. It is the fulcrum of the lever.'],
  link: ['Axillary plates', 'Small hard plates between the roof edge and the wing root. They bend and pivot; steering muscles pull on them to change the stroke.'],
  resilin: ['Resilin pad', 'Rubber-like protein in the hinge that stores a little elastic energy and gives it back; the hinge is a flexure, not a bearing.'],
  sternum: ['Floor (sternum)', 'The fixed anchor of the vertical muscles; the legs attach to it.'],
  gut: ['Gut', 'The food canal passes straight through the box between the muscles.'],
  nerve: ['Nerve cord', 'The ventral cord with the thoracic ganglia. The motor neurons that fire one burst per wingbeat start here.'],
};

export function figThorax(root) {
  const { ctrl, stage, legend } = frame(root, '3D · schematic');
  if (!webgl()) { stage.textContent = 'This figure needs WebGL, which this browser does not offer.'; return; }
  const { host, view, bf } = scene(stage, { pos: [0.5, 1.3, 8.6], target: [0, 0.2, 0], maxDist: 22, minDist: 2.5 });
  const ov = overlay(host);
  const st = { ph: 0.0, run: !REDUCED, speed: 0.12, sel: null, labels: true };
  bf.setCut(true, 0);
  const info = h('div', { class: 'bf-info' }, 'The thorax is cut across the middle. The ', h('b', {}, 'red muscles'), ' brighten as they fire. Pick a part to read about it.');
  const chips = h('div', { class: 'bf-chips' });
  const btn = {};
  const select = (k) => { st.sel = k; info.replaceChildren(h('b', {}, TH_INFO[k][0] + '. '), TH_INFO[k][1]); for (const q in btn) btn[q].classList.toggle('on', q === k); };
  for (const k in TH_INFO) { btn[k] = h('button', { type: 'button', class: 'bx-chip', onclick: () => select(k) }, TH_INFO[k][0]); chips.append(btn[k]); }
  ctrl.append(h('div', { class: 'bf-bar' },
    h('button', { type: 'button', class: 'bx-chip' + (st.run ? ' on' : ''), onclick: function () { st.run = !st.run; this.classList.toggle('on', st.run); this.textContent = st.run ? 'Pause' : 'Play'; } }, st.run ? 'Pause' : 'Play'),
    seg(SPECIES, 'monarch', (v) => bf.setSpecies(v)),
    chip('See through the cuticle', false, (v) => bf.setSee(v)),
    chip('Labels', true, (v) => { st.labels = v; }),
    h('span', { class: 'bx-seg' },
      h('button', { type: 'button', onclick: () => view.goTo([0.5, 1.3, 8.6], [0, 0.2, 0], 800) }, 'Front'),
      h('button', { type: 'button', onclick: () => view.goTo([8.2, 1.6, 2.5], [0, 0.2, 0], 800) }, 'Side'),
      h('button', { type: 'button', onclick: () => view.goTo([0.5, 9, 3.5], [0, 0.2, 0], 800) }, 'Top'))));
  const phS = param(ctrl, 'Phase of the beat', 0, 1, 0.005, 0, (v) => v.toFixed(2), (v) => { st.ph = v; st.run = false; });
  param(ctrl, 'Cut position', -1.1, 1.1, 0.01, 0, (v) => (v >= 0 ? '+' : '') + v.toFixed(2), (v) => bf.setCut(true, v));
  // strip: muscle force (two sets) and wing elevation over one beat
  const W = 900, Hh = 118, L = 44, R = 12, Tp = 10, B = 90, X = (p) => L + p * (W - L - R), strip = S('svg', { class: 'bf-trace', viewBox: `0 0 ${W} ${Hh}`, role: 'img', 'aria-label': 'Activation of the two muscle sets and wing angle over one wingbeat' });
  const curve = (f) => { let d = ''; for (let i = 0; i <= 160; i++) { const p = i / 160; d += (i ? 'L' : 'M') + X(p).toFixed(1) + ',' + (B - f(p) * (B - Tp)).toFixed(1); } return d; };
  strip.append(S('line', { x1: L, x2: W - R, y1: B, y2: B, stroke: INK }),
    S('path', { d: curve((p) => force(p, 'dvm')), fill: 'none', stroke: RED, 'stroke-width': 2 }),
    S('path', { d: curve((p) => force(p, 'dlm')), fill: 'none', stroke: BLUE, 'stroke-width': 2 }),
    S('path', { d: curve((p) => 0.5 + 0.5 * Math.cos(TAU * p)), fill: 'none', stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }),
    T(L - 6, Tp + 10, 'on', { a: 'end', s: 10.5, c: MUTED }), T(L - 6, B, 'off', { a: 'end', s: 10.5, c: MUTED }),
    T(X(0.02), 104, 'beat starts: wings at the top', { s: 11, c: MUTED }), T(X(0.5), 104, 'wings at the bottom', { s: 11, c: MUTED, a: 'middle' }),
    T(W - R, 24, 'vertical muscles (DVM)', { a: 'end', s: 11.5, c: RED, w: 600 }), T(W - R, 40, 'long muscles (DLM)', { a: 'end', s: 11.5, c: BLUE, w: 600 }), T(W - R, 56, 'wing elevation (dashed)', { a: 'end', s: 11, c: MUTED }));
  const cur = S('line', { y1: Tp, y2: B, stroke: INK, 'stroke-width': 1.2 }); strip.append(cur);
  const scrub = (e) => { const r = strip.getBoundingClientRect(), p = clamp(((e.clientX - r.left) / r.width * W - L) / (W - L - R), 0, 1); st.ph = p; st.run = false; phS.set(p); };
  strip.addEventListener('pointerdown', (e) => { scrub(e); strip.setPointerCapture(e.pointerId); strip.onpointermove = scrub; }); strip.addEventListener('pointerup', () => { strip.onpointermove = null; });
  const read = h('div', { class: 'bf-read' }); legend.append(strip, read);
  stage.after(info, chips);
  view.tick = (dt) => {
    if (st.run) { st.ph = (st.ph + dt * st.speed) % 1; phS.set(st.ph); }
    const r = bf.update(st.ph);
    cur.setAttribute('x1', X(st.ph)); cur.setAttribute('x2', X(st.ph));
    read.innerHTML = `<span><b>DVM</b> ${(r.fD * 100).toFixed(0)} %</span><span><b>DLM</b> ${(r.fL * 100).toFixed(0)} %</span><span><b>wing elevation</b> ${(r.aR.elev * 180 / Math.PI).toFixed(0)}°</span><span><b>roof</b> ${r.dy >= 0 ? 'arched up' : 'pulled down'} ${Math.abs(r.dy * 100).toFixed(0)} % of a muscle width</span>`;
    const items = [];
    if (st.labels) { const A = bf.anchors(); for (const k in TH_INFO) if (A[k]) items.push({ id: k, text: TH_INFO[k][0], pos: A[k].clone().applyMatrix4(bf.group.matrixWorld) }); }
    ov.draw(view, items, st.sel);
  };
}

// ====================================================================================================
// 3. the whole beat: four wings, steering, and the path the wingtip draws
// ====================================================================================================
export function figStroke(root) {
  const { ctrl, stage, legend } = frame(root, '3D · schematic');
  if (!webgl()) { stage.textContent = 'This figure needs WebGL, which this browser does not offer.'; return; }
  const { host, view, bf } = scene(stage, { pos: [0.5, 5.5, 13], target: [0, 0.3, -0.4], maxDist: 30, minDist: 4 });
  const P = { ...DEFAULT_P }, st = { ph: 0, run: !REDUCED, speed: 0.18, trail: true };
  bf.setCut(false); bf.explode(0);
  // wingtip trail: the farthest vertex of the right forewing, followed through the beat
  const w = bf.wings.fore[0]; let tipI = 0, best = -1;
  for (let i = 0; i < w.base.length / 3; i++) if (w.base[3 * i] > best) { best = w.base[3 * i]; tipI = i; }
  const NT = 160, tp = new Float32Array(NT * 3), tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  const trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: 0xb4552f })); trail.frustumCulled = false; view.scene.add(trail);
  const hist = []; let lastPh = -1;
  const resetTrail = () => { hist.length = 0; };
  const info = h('div', { class: 'bf-info' }, 'One beat is a wing sweep up and down with a small forward-and-back sweep and a twist. The ', h('b', {}, 'orange line'), ' is the path of the right wingtip.');
  ctrl.append(h('div', { class: 'bf-bar' },
    h('button', { type: 'button', class: 'bx-chip' + (st.run ? ' on' : ''), onclick: function () { st.run = !st.run; this.classList.toggle('on', st.run); this.textContent = st.run ? 'Pause' : 'Play'; } }, st.run ? 'Pause' : 'Play'),
    seg(SPECIES, 'monarch', (v) => bf.setSpecies(v)),
    chip('Wingtip path', true, (v) => { st.trail = v; trail.visible = v; }),
    h('span', { class: 'bx-seg' },
      h('button', { type: 'button', onclick: () => view.goTo([0.5, 5.5, 13], [0, 0.3, -0.4], 800) }, 'Above-front'),
      h('button', { type: 'button', onclick: () => view.goTo([0.2, 1.2, 12], [0, 0.3, 0], 800) }, 'From the front'),
      h('button', { type: 'button', onclick: () => view.goTo([12, 1.5, 0.5], [0, 0.3, 0], 800) }, 'From the side'))));
  const set = (k, v) => { P[k] = v; resetTrail(); };
  param(ctrl, 'Stroke amplitude', 10, 55, 1, 32, (v) => v + '°', (v) => set('amp', v * Math.PI / 180));
  param(ctrl, 'Fore-aft sweep', 0, 0.5, 0.01, 0.2, (v) => (v * 57.3).toFixed(0) + '°', (v) => set('sweep', v));
  param(ctrl, 'Twist (pitch)', 0, 0.9, 0.01, 0.45, (v) => (v * 57.3).toFixed(0) + '°', (v) => set('twist', v));
  param(ctrl, 'Figure-of-eight', 0, 1, 0.01, 0, (v) => (v * 100).toFixed(0) + ' %', (v) => set('mix', v));
  param(ctrl, 'Right wing amplitude', 0.3, 1.3, 0.01, 1, (v) => (v * 100).toFixed(0) + ' %', (v) => set('ampR', v));
  param(ctrl, 'Left wing amplitude', 0.3, 1.3, 0.01, 1, (v) => (v * 100).toFixed(0) + ' %', (v) => set('ampL', v));
  stage.after(info);
  const read = h('div', { class: 'bf-read' }); legend.append(read);
  const tmp = new THREE.Vector3();
  view.tick = (dt) => {
    if (st.run) st.ph = (st.ph + dt * st.speed) % 1;
    const r = bf.update(st.ph, P);
    if (st.run || hist.length === 0) {
      bf.group.updateMatrixWorld(true); w.mesh.updateMatrixWorld(true);
      tmp.set(w.geo.attributes.position.getX(tipI), w.geo.attributes.position.getY(tipI), w.geo.attributes.position.getZ(tipI)); w.mesh.localToWorld(tmp);
      hist.push(tmp.clone()); if (hist.length > NT) hist.shift();
      for (let i = 0; i < NT; i++) { const q = hist[Math.min(i, hist.length - 1)]; tp[3 * i] = q.x; tp[3 * i + 1] = q.y; tp[3 * i + 2] = q.z; }
      tg.attributes.position.needsUpdate = true; tg.setDrawRange(0, hist.length);
    }
    const asym = Math.abs(P.ampR - P.ampL);
    read.innerHTML = `<span><b>right wing</b> ${(r.aR.elev * 180 / Math.PI).toFixed(0)}°</span><span><b>left wing</b> ${(r.aL.elev * 180 / Math.PI).toFixed(0)}°</span><span><b>DVM</b> ${(r.fD * 100).toFixed(0)} %</span><span><b>DLM</b> ${(r.fL * 100).toFixed(0)} %</span>` + (asym > 0.05 ? `<span><i>unequal wings: the animal would roll</i></span>` : '');
  };
}

export const FIG_BIO = { anatomy: figAnatomy, thorax: figThorax, stroke: figStroke };
