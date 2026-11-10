// Irrawaddy rice boat long read (/blog/2026/irrawaddy-rice-boat/): the procedural 3D model of a laung-zat and its viewer.
// three.js is self-hosted in assets/vendor/three/ (MIT, no CDN). The model is schematic: the parts and how they sit
// together follow the museum models and the descriptions cited in the post; proportions are chosen, not measured.
// Units: metres. x along the boat (bow at -x, stern at +x), y up, z across (port side +z, towards the default camera).
import * as THREE from '../vendor/three/three.module.min.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
export { THREE };

export const L = 24, B = 4.4, D = 1.75; // length of the hull without the stem piece, beam, depth amidships (chosen)
const X = (s) => -L / 2 + s * L; // station s in [0,1], 0 = bow, 1 = stern
export const halfBeam = (s) => Math.max(0.1, (B / 2) * Math.pow(Math.sin(Math.PI * (0.015 + 0.97 * s)), 0.55));
export const bottomY = (s) => 0.55 * Math.pow(Math.abs(2 * s - 1), 4) + 0.9 * Math.pow(Math.max(0, 0.14 - s) / 0.14, 2);
export const sheerY = (s) => D + 0.7 * Math.pow(Math.max(0, 0.2 - s) / 0.2, 2) + 1.9 * Math.pow(Math.max(0, s - 0.74) / 0.26, 2.1);
export const WATER = 0.95; // loaded waterline (chosen)
const DECK = D - 0.15;

// ------------------------------------------------------------------ textures drawn on canvas (no image files)
function canvasTex(w, hgt, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = hgt; const g = c.getContext('2d'); draw(g, w, hgt);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 4; return t;
}
let rnd = 7; const rand = () => { rnd = (rnd * 16807) % 2147483647; return (rnd - 1) / 2147483646; };
const TEX = {};
function textures() {
  if (TEX.hull) return TEX;
  // hull planks (strakes run along u = length); the lower strakes are darker with tar and wet
  TEX.hull = canvasTex(1024, 512, (g, w, h) => {
    const n = 18;
    for (let i = 0; i < n; i++) {
      const y0 = (i / n) * h, dist = Math.abs(i + 0.5 - n / 2) / (n / 2); // 0 at the keel, 1 at the sheer
      const l = 22 + 16 * dist + rand() * 6;
      g.fillStyle = `hsl(${24 + rand() * 6}, ${38 + rand() * 8}%, ${dist < 0.55 ? l * 0.62 : l}%)`; g.fillRect(0, y0, w, h / n);
      for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(30,16,6,${0.08 + rand() * 0.12})`; g.lineWidth = 1; const yy = y0 + rand() * (h / n); g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy + (rand() - 0.5) * 3); g.stroke(); }
      g.fillStyle = 'rgba(18,10,4,0.9)'; g.fillRect(0, y0, w, 2.2); // seam
      for (let x = rand() * 80; x < w; x += 70 + rand() * 30) { g.fillStyle = 'rgba(25,18,12,0.55)'; g.fillRect(x, y0 + 4, 3, 3); g.fillRect(x, y0 + h / n - 7, 3, 3); } // treenails
    }
  }, [1, 1]);
  // woven bamboo mat (deck house walls, the cargo cover, the helmsman's sunshade)
  TEX.mat = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8f7a4e'; g.fillRect(0, 0, w, h); const s = 16;
    for (let i = 0; i < w / s; i++) for (let j = 0; j < h / s; j++) {
      const over = (i + j) % 2 === 0, x = i * s, y = j * s;
      const grd = over ? g.createLinearGradient(x, y, x + s, y) : g.createLinearGradient(x, y, x, y + s);
      const base = 0.78 + rand() * 0.18;
      grd.addColorStop(0, `rgba(${110 * base | 0},${90 * base | 0},${55 * base | 0},1)`); grd.addColorStop(0.5, `rgba(${196 * base | 0},${170 * base | 0},${112 * base | 0},1)`); grd.addColorStop(1, `rgba(${110 * base | 0},${90 * base | 0},${55 * base | 0},1)`);
      g.fillStyle = grd; g.fillRect(x + 0.6, y + 0.6, s - 1.2, s - 1.2);
    }
  }, [6, 3]);
  // split-bamboo slats (the roof of the deck house)
  TEX.slat = canvasTex(256, 64, (g, w, h) => {
    for (let x = 0; x < w; x += 8) { const l = 26 + rand() * 14; g.fillStyle = `hsl(30, 40%, ${l}%)`; g.fillRect(x, 0, 7, h); g.fillStyle = `hsla(35, 45%, ${l + 18}%, 0.6)`; g.fillRect(x + 2, 0, 2, h); g.fillStyle = 'rgba(15,8,3,0.85)'; g.fillRect(x + 7, 0, 1, h); }
  }, [10, 1]);
  // deck planks
  TEX.deck = canvasTex(512, 128, (g, w, h) => {
    for (let y = 0; y < h; y += 16) { g.fillStyle = `hsl(28, 30%, ${30 + rand() * 9}%)`; g.fillRect(0, y, w, 16); g.fillStyle = 'rgba(15,8,3,0.8)'; g.fillRect(0, y, w, 1.5); }
  }, [6, 2]);
  // carved fretwork of the stern (alpha: holes cut out)
  TEX.fret = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#5a3a1e'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const cx = 64 + i * 128, cy = 64 + j * 128;
      g.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; const r = k % 2 ? 22 : 46; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill();
      g.beginPath(); g.arc(cx + 64, cy + 64, 9, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#d4a94a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  });
  return TEX;
}

const MAT = {};
function materials() {
  if (MAT.hull) return MAT;
  const T = textures();
  MAT.hull = new THREE.MeshStandardMaterial({ map: T.hull, roughness: 0.78, metalness: 0, side: THREE.DoubleSide });
  MAT.wood = new THREE.MeshStandardMaterial({ color: '#6e4826', roughness: 0.7 });
  MAT.dark = new THREE.MeshStandardMaterial({ color: '#3b2614', roughness: 0.75 });
  MAT.deck = new THREE.MeshStandardMaterial({ map: T.deck, roughness: 0.85, side: THREE.DoubleSide });
  MAT.mat = new THREE.MeshStandardMaterial({ map: T.mat, roughness: 0.9, side: THREE.DoubleSide });
  MAT.slat = new THREE.MeshStandardMaterial({ map: T.slat, roughness: 0.8, side: THREE.DoubleSide });
  MAT.gold = new THREE.MeshStandardMaterial({ color: '#d1a646', metalness: 0.85, roughness: 0.32 });
  MAT.fret = new THREE.MeshStandardMaterial({ map: T.fret, transparent: true, alphaTest: 0.4, roughness: 0.6, side: THREE.DoubleSide });
  const fw = T.fret.clone(); fw.repeat.set(0.9, 0.9); fw.needsUpdate = true;
  MAT.fretWing = new THREE.MeshStandardMaterial({ map: fw, transparent: true, alphaTest: 0.4, roughness: 0.55, metalness: 0.2, color: '#c79a52', side: THREE.DoubleSide });
  MAT.bamboo = new THREE.MeshStandardMaterial({ color: '#a88a4e', roughness: 0.55 });
  MAT.sail = new THREE.MeshStandardMaterial({ color: '#efe4cc', roughness: 0.95, side: THREE.DoubleSide });
  MAT.rope = new THREE.LineBasicMaterial({ color: '#6a5a44' });
  MAT.ropeMesh = new THREE.MeshStandardMaterial({ color: '#8c7552', roughness: 1 });
  MAT.water = new THREE.MeshStandardMaterial({ color: '#7fa6c9', transparent: true, opacity: 0.32, roughness: 0.15, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
  return MAT;
}

// a box between two points (spars, beams, posts)
function beam(a, b, r, mat, round = true) {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), len = A.distanceTo(Bv);
  const geo = round ? new THREE.CylinderGeometry(r, r, len, 10) : new THREE.BoxGeometry(r * 2, len, r * 2);
  const m = new THREE.Mesh(geo, mat); m.position.copy(A).add(Bv).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize()); m.castShadow = true; return m;
}
const line = (pts, mat) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p))), mat);

// ------------------------------------------------------------------ the parts
function makeHull() {
  const g = new THREE.Group(), NS = 90, M = 28, pos = [], uv = [], idx = [];
  for (let i = 0; i <= NS; i++) {
    const s = i / NS, hb = halfBeam(s), yb = bottomY(s), ys = sheerY(s);
    for (let j = 0; j <= M; j++) {
      const t = (j / M) * 2 - 1, a = Math.abs(t);
      const f = a < 0.45 ? (a / 0.45) * 0.8 : 0.8 + 0.2 * Math.sin(((a - 0.45) / 0.55) * Math.PI / 2);
      const gg = a < 0.45 ? 0.07 * (a / 0.45) ** 2 : 0.07 + 0.93 * Math.pow((a - 0.45) / 0.55, 1.2);
      pos.push(X(s), yb + (ys - yb) * gg, Math.sign(t) * hb * f); uv.push(s * 3, j / M);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, MAT.hull); m.castShadow = true; m.receiveShadow = true; g.add(m);
  // gunwale rubbing strakes along the sheer, both sides
  for (const side of [1, -1]) {
    const pts = []; for (let i = 0; i <= 60; i++) { const s = 0.02 + (i / 60) * 0.96; pts.push(new THREE.Vector3(X(s), sheerY(s) - 0.05, side * (halfBeam(s) + 0.04))); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.08, 6), MAT.dark); tube.castShadow = true; g.add(tube);
  }
  // the deck (planks over the hold) and the beams that carry it
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.74, 1), MAT.deck); deck.rotation.x = -Math.PI / 2; deck.scale.z = 1;
  const dGeo = new THREE.BufferGeometry(), dp = [], du = [], di = [], N = 50;
  for (let i = 0; i <= N; i++) { const s = 0.07 + (i / N) * 0.76, hb = halfBeam(s) * 0.96; dp.push(X(s), DECK, -hb, X(s), DECK, hb); du.push(s * 6, 0, s * 6, 2); }
  for (let i = 0; i < N; i++) { const a = i * 2; di.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  dGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dGeo.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2)); dGeo.setIndex(di); dGeo.computeVertexNormals();
  const dm = new THREE.Mesh(dGeo, MAT.deck); dm.receiveShadow = true; g.add(dm);
  return g;
}

function makeStem() {
  // the pointed stem piece of the bow: the bow is low (Yule 1858), the stem point turned up; gilded as on the museum model
  const sh = new THREE.Shape();
  sh.moveTo(0.7, 0); sh.quadraticCurveTo(-0.3, 0.2, -1.1, 1.6); sh.quadraticCurveTo(-1.7, 2.7, -1.25, 3.9);
  sh.quadraticCurveTo(-0.9, 2.6, -0.2, 1.9); sh.quadraticCurveTo(0.4, 1.4, 0.9, 1.25); sh.lineTo(0.7, 0);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 3, curveSegments: 24 });
  geo.translate(0, 0, -0.17);
  const m = new THREE.Mesh(geo, MAT.gold); m.castShadow = true;
  const g = new THREE.Group(); g.add(m); g.scale.setScalar(0.5); g.position.set(X(0.012), sheerY(0.012) - 0.45, 0);
  return g;
}

function makeWalkways() {
  // outrigger gangways along both gunwales: cross-beams run out over the side and carry planks; the crew walks them with the poles
  const g = new THREE.Group(), y = D + 0.05, out = 0.75;
  for (let s = 0.1; s <= 0.8; s += 0.035) {
    const hb = halfBeam(s); g.add(beam([X(s), y, -(hb + out)], [X(s), y, hb + out], 0.07, MAT.dark, false));
  }
  for (const side of [1, -1]) for (const k of [0.25, 0.5, 0.75, 1]) {
    const pts = []; for (let i = 0; i <= 30; i++) { const s = 0.1 + (i / 30) * 0.7; pts.push(new THREE.Vector3(X(s), y + 0.08, side * (halfBeam(s) + out * k))); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, k === 1 ? 0.06 : 0.09, 4), k === 1 ? MAT.dark : MAT.wood));
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export const MAST = { s: 0.28, h: 13.5, yard: 12.6, top: 22.5 };
// the stack of square sails: main course and five topsails, each on its own yard (half-width, height, yard height)
export const RIGS = {
  // Yule 1858: one bamboo yard paced at 130 ft (half-yard 65 ft), a mainsail of about 4,000 sq ft, and a small topsail
  yule: [[19.8, 9.4, 12.6], [6.2, 2.6, 15.8]],
  // Talbot Kelly 1908: "a curious combination of six or seven square sails" on bamboo yards curved slightly upwards
  kelly: [[9.2, 7.2, 12.6], [5.4, 2.2, 15.0], [4.4, 1.9, 17.1], [3.6, 1.6, 18.9], [2.9, 1.4, 20.5], [2.2, 1.2, 21.9]],
};
export const SAILS = RIGS.kelly;
function makeMast() {
  // bipod mast: "two bamboos lashed together at the top, their lower ends being made fast to the gunwale" (Talbot Kelly 1908); a topmast above
  const g = new THREE.Group(), x = X(MAST.s), hb = halfBeam(MAST.s) * 0.82;
  for (const side of [1, -1]) g.add(beam([x + 0.2, DECK, side * hb], [x, MAST.h, 0], 0.17, MAT.bamboo));
  g.add(beam([x, MAST.h - 0.8, 0], [x, MAST.top + 0.6, 0], 0.1, MAT.bamboo));
  for (let k = 0; k < 6; k++) g.add(beam([x, 2.4 + k * 2, -hb * (1 - (2.4 + k * 2 - DECK) / (MAST.h - DECK))], [x, 2.4 + k * 2, hb * (1 - (2.4 + k * 2 - DECK) / (MAST.h - DECK))], 0.05, MAT.dark)); // rungs
  const lash = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 6, 16), MAT.ropeMesh); lash.position.set(x, MAST.h - 0.4, 0); lash.rotation.y = Math.PI / 2; g.add(lash);
  return g;
}

function sailMesh(w, h, belly, segs = 16) {
  const geo = new THREE.PlaneGeometry(w, h, segs, segs), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) / (w / 2), v = 0.5 - p.getY(i) / h; p.setZ(i, belly * (1 - u * u) * Math.sin(Math.PI * Math.min(1, v * 0.9 + 0.1))); }
  geo.computeVertexNormals(); geo.rotateY(Math.PI / 2); // now spans z, bellies along -x (forward)
  const m = new THREE.Mesh(geo, MAT.sail); m.castShadow = true; return m;
}
function makeSails() {
  // two readings of the rig, one group each: Yule's single huge course with a small topsail (1855), and the stack of
  // six square sails that Talbot Kelly describes (1908). The yards are bamboo, hung so that they curve upwards.
  const g = new THREE.Group(), x = X(MAST.s) - 0.25, r = MAT.rope, rigs = {};
  for (const [name, list] of Object.entries(RIGS)) {
    const rg = new THREE.Group(), sails = []; g.add(rg);
    list.forEach(([hw, ht, y], i) => {
      const bow = (name === 'yule' && !i ? 0.11 : 0.06) * hw;
      const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, y + bow, -hw - 0.3), new THREE.Vector3(x, y - bow, 0), new THREE.Vector3(x, y + bow, hw + 0.3));
      const yd = new THREE.Mesh(new THREE.TubeGeometry(c, 32, i ? 0.06 : 0.13, 8), MAT.bamboo); yd.castShadow = true; rg.add(yd);
      const m = sailMesh(hw * 2, ht, i ? 0.35 : 1.4); m.position.set(x - 0.12, y - ht / 2, 0); rg.add(m); sails.push({ m, y, ht });
      // lifts: many halyards from the masthead carry the long flexible yard
      const n = i ? 2 : (name === 'yule' ? 7 : 4);
      for (const side of [1, -1]) for (let k = 1; k <= n; k++) { const f = k / n, yy = y + bow * (2 * f * f - 1); rg.add(line([[x, yy, side * hw * f], [x + 0.2, i ? y + 1.2 : MAST.h + 0.4, 0]], r)); }
      for (const side of [1, -1]) rg.add(line([[x, y + bow, side * hw], [X(0.88), sheerY(0.88) + 0.3, side * 0.8]], r)); // braces
    });
    const [hw0, ht0, y0] = list[0];
    const foot = beam([x - 0.3, y0 - ht0, -hw0 + 0.2], [x - 0.3, y0 - ht0, hw0 - 0.2], 0.07, MAT.bamboo); rg.add(foot);
    for (const side of [1, -1]) rg.add(line([[x - 0.3, y0 - ht0, side * (hw0 - 0.2)], [X(0.62), D + 0.1, side * (halfBeam(0.62) + 0.7)]], r)); // sheets
    rigs[name] = { group: rg, sails, foot, list };
  }
  g.userData.rigs = rigs;
  return g;
}

function makeRigging() {
  // standing rigging: forestay to the bow, backstay to the stern, shrouds, and the halyard of the main yard (the braces,
  // lifts and sheets belong to each rig and are drawn with the sails)
  const g = new THREE.Group(), x = X(MAST.s), r = MAT.rope;
  g.add(line([[x, MAST.top + 0.5, 0], [X(0.01), sheerY(0.01) + 0.9, 0]], r));
  g.add(line([[x, MAST.h, 0], [X(0.8), sheerY(0.8) + 0.6, 0]], r));
  for (const side of [1, -1]) g.add(line([[x, MAST.h - 0.5, 0], [X(MAST.s + 0.1), D + 0.1, side * (halfBeam(MAST.s + 0.1) + 0.6)]], r));
  g.add(line([[x, MAST.h + 0.6, 0], [x - 0.25, MAST.yard, 0], [x + 0.3, DECK + 0.4, 0.6]], r));
  return g;
}

function makeCabin() {
  // the forward deck house on the after half: woven mat walls under a curved roof of split bamboo
  const g = new THREE.Group(), s0 = 0.45, s1 = 0.58, x0 = X(s0), x1 = X(s1), len = x1 - x0, hb = halfBeam(0.5) * 0.8, hgt = 1.9;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(len, hgt, hb * 2), MAT.mat); wall.position.set((x0 + x1) / 2, DECK + hgt / 2, 0); wall.castShadow = wall.receiveShadow = true; g.add(wall);
  const R = 4.2, th = 2 * Math.asin((hb + 0.8) / R);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(R, R, len + 1.0, 32, 1, true, Math.PI / 2 - th / 2, th), MAT.slat);
  roof.rotation.z = Math.PI / 2; roof.position.set((x0 + x1) / 2, DECK + hgt + 0.55 - R, 0); roof.castShadow = true; g.add(roof);
  for (const xx of [x0 - 0.4, x1 + 0.4]) for (const side of [1, -1]) g.add(beam([xx, DECK, side * (hb + 0.1)], [xx, DECK + hgt + 0.35, side * (hb + 0.1)], 0.07, MAT.dark));
  return g;
}

function makeTilt() {
  // the crew's house: an arched roof of woven mat on hoops (the 'mat tilt' of the museum records), closed at the after end
  const g = new THREE.Group(), s0 = 0.595, s1 = 0.79, x0 = X(s0), x1 = X(s1), len = x1 - x0, hb = halfBeam(0.6) * 0.88, R = 3.2, th = 2 * Math.asin(Math.min(0.99, hb / R));
  const yc = DECK + 1.75 - R;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(R, R, len, 40, 1, true, Math.PI / 2 - th / 2, th), MAT.mat);
  roof.rotation.z = Math.PI / 2; roof.position.set((x0 + x1) / 2, yc, 0); roof.castShadow = roof.receiveShadow = true; g.add(roof);
  // after end closed by a mat panel cut to the arch
  const sh = new THREE.Shape(); const n = 24, y0 = R * Math.cos(th / 2);
  for (let i = 0; i <= n; i++) { const a = -th / 2 + (i / n) * th; const z = R * Math.sin(a), y = R * Math.cos(a) - y0; i ? sh.lineTo(z, y) : sh.moveTo(z, y); }
  const endP = new THREE.Mesh(new THREE.ShapeGeometry(sh), MAT.mat); endP.rotation.y = Math.PI / 2; endP.position.set(x1, yc + y0, 0); g.add(endP);
  // hoops (ribs) that hold the mat
  for (let k = 0; k <= 6; k++) {
    const geo = new THREE.TorusGeometry(R + 0.03, 0.05, 6, 40, th); geo.rotateZ(Math.PI / 2 - th / 2); geo.rotateY(Math.PI / 2);
    const arc = new THREE.Mesh(geo, MAT.dark); arc.position.set(x0 + (k / 6) * len, yc, 0); g.add(arc);
  }
  return g;
}

function makeStern() {
  // the high stern: the hull ends in a post that sweeps up and curls forward over the helmsman, with a carved wing on each side
  // (after P. Klier's photograph "Stern of Burmese paddy boat", Rangoon, late 1880s), and a gallery rail around the after deck
  const g = new THREE.Group(), x0 = X(1), y0 = sheerY(1) - 0.3, P = new THREE.Group(); P.position.set(x0, y0, 0); P.scale.setScalar(0.78); g.add(P);
  const post = new THREE.Shape();
  post.moveTo(-1.3, -0.9); post.quadraticCurveTo(0.6, -1.2, 1.0, 0.8); post.quadraticCurveTo(1.35, 2.8, 0.7, 4.0); post.quadraticCurveTo(0.2, 4.6, -0.5, 4.2);
  post.quadraticCurveTo(0.35, 3.4, 0.25, 1.4); post.quadraticCurveTo(0.0, 0.2, -1.3, -0.1); post.lineTo(-1.3, -0.9);
  const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(post, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 24 }), MAT.wood);
  pm.position.set(0, 0, -0.2); P.add(pm);
  // the stacked rolls at the head of the post
  for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.62, 12), MAT.gold); c.rotation.x = Math.PI / 2; c.position.set(0.85 - k * 0.12, 3.3 + k * 0.28, 0); P.add(c); }
  // carved wings: open fretwork sweeping from the head of the post down over the helmsman's seat
  const wing = new THREE.Shape();
  wing.moveTo(0.6, 3.9); wing.bezierCurveTo(-0.8, 4.3, -2.8, 3.2, -4.0, 0.9); wing.lineTo(-3.3, 0.6); wing.bezierCurveTo(-2.3, 2.3, -0.9, 3.0, 0.45, 2.9); wing.lineTo(0.6, 3.9);
  const wg = new THREE.ShapeGeometry(wing, 24);
  for (const side of [1, -1]) { const w = new THREE.Mesh(wg, MAT.fretWing); w.position.set(0, 0, side * 0.4); P.add(w); }
  const rim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0.6, 3.9], [-0.8, 4.0], [-2.4, 3.2], [-4.0, 0.9]].map(([a, b2]) => new THREE.Vector3(a, b2, 0))), 40, 0.09, 6), MAT.gold); P.add(rim);
  // gallery: a rail on turned balusters along both sides of the raised after deck
  for (const side of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const ss = 0.8 + (i / 12) * 0.15, x = X(ss), y = sheerY(ss), z = side * halfBeam(ss) * 0.95;
      pts.push(new THREE.Vector3(x, y + 0.75, z));
      const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.75, 6), MAT.wood); b2.position.set(x, y + 0.37, z); g.add(b2);
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.05, 6), MAT.gold));
  }
  // carved panels on the quarters: fretwork set into the topsides
  for (const side of [1, -1]) {
    const pnl = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.0), MAT.fret);
    const ss = 0.87; pnl.position.set(X(ss), sheerY(ss) - 0.6, side * (halfBeam(ss) + 0.02)); pnl.rotation.z = -0.3; g.add(pnl);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export const HELM = { s: 0.92 };
function makeHelm() {
  // the helmsman's raised seat on the after deck, with a woven mat sunshade on four posts
  const g = new THREE.Group(), s = HELM.s, x = X(s), y = sheerY(s) - 0.2;
  const plat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, halfBeam(s) * 2.0), MAT.deck); plat.position.set(x, y, 0); g.add(plat);
  const cx = x - 0.2, cz = 0.5, cy = y + 0.9;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.8), MAT.wood); seat.position.set(cx, cy, cz); g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.8), MAT.wood); back.position.set(cx + 0.45, cy + 0.5, cz); g.add(back);
  for (const dx of [-0.38, 0.38]) for (const dz of [-0.33, 0.33]) g.add(beam([cx + dx, y, cz + dz], [cx + dx, cy, cz + dz], 0.05, MAT.dark));
  for (const dz of [-0.4, 0.4]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), MAT.gold); arm.position.set(cx, cy + 0.35, cz + dz); g.add(arm); }
  // a small hipped roof over the seat, as in J. Jackson's photograph of about 1868
  const shade = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.7, 4, 1, false), MAT.mat); shade.rotation.y = Math.PI / 4; shade.position.set(x - 0.2, y + 2.8, 0.2); g.add(shade);
  const eave = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 2.2), MAT.dark); eave.position.set(x - 0.2, y + 2.45, 0.2); g.add(eave);
  for (const dx of [-1.0, 0.8]) for (const dz of [-0.85, 0.95]) g.add(beam([x - 0.2 + dx, y, 0.2 + dz], [x - 0.2 + dx, y + 2.45, 0.2 + dz], 0.05, MAT.dark));
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export const RUDDER = { s: 0.88 };
function makeRudder() {
  // the quarter rudder: a big blade on a long stock, hung on the port quarter in a rope collar; the tiller reaches the helmsman
  const g = new THREE.Group(), s = RUDDER.s, x = X(s), zq = halfBeam(s) + 0.35, yq = sheerY(s) - 0.3;
  const piv = new THREE.Group(); piv.position.set(x, yq, zq); g.add(piv);
  const rake = 0.42; piv.rotation.z = rake; // raked aft
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 5.2, 10), MAT.wood); stock.position.y = -1.2; piv.add(stock);
  const bl = new THREE.Shape(); bl.moveTo(-0.12, 0); bl.lineTo(1.25, -0.3); bl.quadraticCurveTo(1.55, -2.0, 1.1, -3.2); bl.lineTo(-0.15, -3.0); bl.lineTo(-0.12, 0);
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(bl, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 }), MAT.dark);
  blade.position.set(0, -1.6, -0.06); piv.add(blade);
  const tiller = beam([0, 1.3, 0], [-1.6, 1.6, -0.5], 0.06, MAT.wood); piv.add(tiller);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 6, 16), MAT.ropeMesh); collar.rotation.x = Math.PI / 2; piv.add(collar);
  const post = beam([x - 0.3, yq - 0.6, zq - 0.35], [x, yq + 0.15, zq], 0.09, MAT.dark); g.add(post); // the quarter post the collar is lashed to
  g.userData.piv = piv;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function makeCargo() {
  // the fore part holds the cargo, "covered by one or more strongly-made bamboo mats, strengthened by bamboo frame-work, which do
  // not rise above the gunwale and which serve as a deck" (British Burma Gazetteer 1880); rice bags show where a mat is drawn back
  const g = new THREE.Group(), y = D - 0.04;
  for (const [a, b] of [[0.09, 0.2], [0.2, 0.29], [0.37, 0.44]]) {
    const geo = new THREE.BufferGeometry(), dp = [], du = [], di = [], N = 12;
    for (let i = 0; i <= N; i++) { const s = a + (i / N) * (b - a), hb = halfBeam(s) * 0.97; dp.push(X(s), y, -hb, X(s), y, hb); du.push((i / N) * 3, 0, (i / N) * 3, 2.5); }
    for (let i = 0; i < N; i++) { const k = i * 2; di.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2)); geo.setIndex(di); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, MAT.mat); m.receiveShadow = true; g.add(m);
    for (let k = 0; k <= 3; k++) { const s = a + (k / 3) * (b - a); g.add(beam([X(s), y + 0.04, -halfBeam(s) * 0.95], [X(s), y + 0.04, halfBeam(s) * 0.95], 0.04, MAT.bamboo)); }
  }
  // the open hatch between the mats: bags of rice in the hold
  const bag = new THREE.MeshStandardMaterial({ color: '#cdbb8e', roughness: 1 });
  for (let i = 0; i < 3; i++) for (let j = -3; j <= 3; j++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 4, 8), bag); b.rotation.x = Math.PI / 2; b.position.set(X(0.3) + 0.35 + i * 0.6, D - 0.3 + (j % 2 ? 0.06 : 0), j * 0.48); b.castShadow = true; g.add(b); }
  return g;
}

function makePoles() {
  // long bamboo poles (quants) laid on the gangways, and two oars on the after deck
  const g = new THREE.Group(), bamboo = new THREE.MeshStandardMaterial({ color: '#b39557', roughness: 0.6 });
  for (const side of [1, -1]) for (let k = 0; k < 3; k++) {
    const z = side * (halfBeam(0.6) + 0.35 + k * 0.12), y = D + 0.2 + k * 0.02;
    const p = beam([X(0.42 + k * 0.03), y, z], [X(0.78 + k * 0.03), y, z], 0.05, bamboo); g.add(p);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), MAT.dark); tip.position.set(X(0.42 + k * 0.03), y, z); g.add(tip); // the padded shoulder end
  }
  return g;
}
export const OARS = { n: 6, s0: 0.12, s1: 0.36 };
function makeOars() {
  // sweeps for the run downstream ("twelve to sixteen", Talbot Kelly 1908), worked standing from the fore deck; each turns
  // about a thole on the gunwale, so the figure can lay them along the gangway (stowed) or put them out
  const g = new THREE.Group(), oars = [];
  for (const side of [1, -1]) for (let i = 0; i < OARS.n; i++) {
    const s = OARS.s0 + (i / (OARS.n - 1)) * (OARS.s1 - OARS.s0), piv = new THREE.Group();
    piv.position.set(X(s), sheerY(s) + 0.15, side * (halfBeam(s) + 0.05)); g.add(piv);
    const arm = new THREE.Group(); piv.add(arm);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 8.0, 8), MAT.wood); shaft.rotation.z = Math.PI / 2; shaft.position.x = 2.2; arm.add(shaft);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.32), MAT.wood); blade.position.x = 5.6; arm.add(blade);
    arm.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    oars.push({ piv, arm, side, i });
  }
  g.userData.oars = oars;
  return g;
}
function makeAnchor() {
  // the anchor (kyauk) "used to be a wood fork weighted with stone" (Ferrars 1900), and a coil of cable beside it
  const g = new THREE.Group(), x = X(0.06), y = sheerY(0.06) - 0.15;
  for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.42 - k * 0.07, 0.05, 6, 24), MAT.ropeMesh); t.rotation.x = Math.PI / 2; t.position.set(x + 0.9, y + k * 0.06, -0.4); g.add(t); }
  g.add(beam([x - 0.6, y + 0.1, 0.5], [x + 0.6, y + 0.1, 0.5], 0.07, MAT.dark));
  g.add(beam([x - 0.6, y + 0.1, 0.5], [x - 1.0, y + 0.1, 0.05], 0.06, MAT.dark));
  g.add(beam([x - 0.6, y + 0.1, 0.5], [x - 1.0, y + 0.1, 0.95], 0.06, MAT.dark));
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), new THREE.MeshStandardMaterial({ color: '#8b8a84', roughness: 0.95 })); stone.scale.set(1.3, 0.8, 1); stone.position.set(x - 0.1, y + 0.25, 0.5); g.add(stone);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// part key -> builder, the direction it moves when the boat is taken apart, and a point to hang its label on
const BUILD = [
  { k: 'hull', f: makeHull, ex: [0, 0, 0], at: [X(0.6), 0.6, halfBeam(0.6)] },
  { k: 'stem', f: makeStem, ex: [-3, 1.2, 0], at: [X(0) - 0.4, sheerY(0) + 0.9, 0] },
  { k: 'walk', f: makeWalkways, ex: [0, 1.6, 0], at: [X(0.55), D + 0.1, halfBeam(0.55) + 0.75] },
  { k: 'mast', f: makeMast, ex: [-1.5, 3, 0], at: [X(MAST.s), 8, 0.8] },
  { k: 'sails', f: makeSails, ex: [-3, 5, 0], at: [X(MAST.s) - 1.2, MAST.yard - 3.0, 4] },
  { k: 'rig', f: makeRigging, ex: [-1.5, 3, 0], at: [X(0.5), 9.6, 0] },
  { k: 'cargo', f: makeCargo, ex: [0, 1.2, 0], at: [X(0.25), D, 1.2] },
  { k: 'cabin', f: makeCabin, ex: [0, 3.2, 0], at: [X(0.51), DECK + 2.3, 1.5] },
  { k: 'tilt', f: makeTilt, ex: [0, 2.4, 0], at: [X(0.69), DECK + 1.8, 0.8] },
  { k: 'stern', f: makeStern, ex: [3.5, 1.5, 0], at: [X(1) + 0.7, sheerY(1) + 1.5, 0] },
  { k: 'helm', f: makeHelm, ex: [2.2, 3.2, -0.4], at: [X(HELM.s) - 0.2, sheerY(HELM.s) + 0.8, 0.5] },
  { k: 'rudder', f: makeRudder, ex: [1, -0.4, 3.6], at: [X(RUDDER.s) + 1.2, sheerY(RUDDER.s) - 2.4, halfBeam(RUDDER.s) + 0.5] },
  { k: 'poles', f: makePoles, ex: [0, 1.0, 0], at: [X(0.6), D + 0.25, halfBeam(0.6) + 0.5] },
  { k: 'oars', f: makeOars, ex: [0, 1.6, 1.6], at: [X(0.24), D + 0.25, halfBeam(0.24) + 3.0] },
  { k: 'anchor', f: makeAnchor, ex: [-1.8, 1.5, 0], at: [X(0.06) - 0.6, sheerY(0.06) + 0.2, 0.5] },
];

export class Boat {
  constructor() {
    materials();
    this.group = new THREE.Group(); this.parts = {};
    for (const b of BUILD) {
      const g = b.f(); const wrap = new THREE.Group(); wrap.add(g); this.group.add(wrap);
      this.parts[b.k] = { g: wrap, ex: new THREE.Vector3(...b.ex), at: new THREE.Vector3(...b.at), inner: g };
    }
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), MAT.water); this.water.rotation.x = -Math.PI / 2; this.water.position.y = WATER; this.water.visible = false; this.water.renderOrder = 2; this.group.add(this.water);
    this.sail = 1; this.e = 0; this.setRig('kelly'); this.setOars(0);
  }
  explode(e) { this.e = e; for (const k in this.parts) this.parts[k].g.position.copy(this.parts[k].ex).multiplyScalar(e); }
  // 1 = sails set, 0 = furled up to the yards
  setSail(f) {
    this.sail = f; const k = Math.max(0.04, f);
    for (const rg of Object.values(this.parts.sails.inner.userData.rigs)) {
      for (const q of rg.sails) { q.m.scale.set(1, k, 1); q.m.position.y = q.y - (q.ht / 2) * k; }
      rg.foot.position.y = rg.list[0][2] - rg.list[0][1] * k; rg.foot.visible = f > 0.3;
    }
  }
  setRig(name) { const rigs = this.parts.sails.inner.userData.rigs; for (const k in rigs) rigs[k].group.visible = k === name; this.rig = name; }
  // f: 0 = sweeps laid fore and aft along the gangway, 1 = out and working; ph is the phase of the stroke
  setOars(f, ph = 0) {
    for (const o of this.parts.oars.inner.userData.oars) {
      const c = Math.cos(ph * Math.PI * 2), sn = Math.sin(ph * Math.PI * 2);
      o.arm.rotation.order = 'YZX';
      o.arm.rotation.y = f * (o.side * -Math.PI / 2 + o.side * 0.3 * sn);
      o.arm.rotation.z = -f * (0.2 + 0.07 * c);
    }
  }
  steer(a) { this.parts.rudder.inner.userData.piv.rotation.y = a; }
  anchor(k) { return this.parts[k].at.clone().add(this.parts[k].ex.clone().multiplyScalar(this.e)); }
  highlight(k) {
    for (const key in this.parts) this.parts[key].g.traverse((o) => {
      if (!o.material || o.isLine) return;
      if (!o.userData.mat0) o.userData.mat0 = o.material;
      if (!k || key === k) { o.material = o.userData.mat0; return; }
      if (!o.userData.ghost) { const m = o.userData.mat0.clone(); m.transparent = true; m.opacity = 0.18; m.depthWrite = false; o.userData.ghost = m; }
      o.material = o.userData.ghost;
    });
  }
}

// ------------------------------------------------------------------ viewer: renderer, camera, orbit controls, loop (as in the butterfly post)
function makeEnv(renderer) {
  const sc = new THREE.Scene(), geo = new THREE.SphereGeometry(40, 48, 24), pos = geo.attributes.position, cols = [];
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 40, c = new THREE.Color(); if (y > 0) c.lerpColors(new THREE.Color('#f4f7ff'), new THREE.Color('#9fbfff'), Math.pow(y, 0.7)); else c.lerpColors(new THREE.Color('#efe6d4'), new THREE.Color('#8a7a5e'), Math.pow(-y, 0.7)); cols.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  sc.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const box = (w, h, p, c, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); sc.add(m); };
  box(18, 10, [14, 22, 16], '#fff6e8', 9); box(12, 14, [-24, 8, 6], '#dbe7ff', 5); box(24, 6, [0, 10, -26], '#ffffff', 4);
  const pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(sc, 0.03).texture; pm.dispose(); geo.dispose();
  return tex;
}
export class Viewer {
  constructor(host, { fov = 30, pos = [-14, 12, 40], target = [0, 5, 0], maxDist = 130, minDist = 8 } = {}) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); this.renderer.setClearColor(0xf8f6f1, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene(); this.scene.environment = makeEnv(this.renderer); this.scene.environmentIntensity = 0.8;
    this.camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.5, 400); this.camera.position.set(...pos);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...target); this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
    this.controls.minDistance = minDist; this.controls.maxDistance = maxDist; this.controls.enablePan = false; this.controls.maxPolarAngle = Math.PI * 0.62;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb9a98e, 0.45));
    const sun = new THREE.DirectionalLight(0xfff3e0, 2.4); sun.position.set(-12, 30, 18); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 80; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04; sun.shadow.radius = 4;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xbcd2ff, 0.8); rim.position.set(10, 8, -20); this.scene.add(rim);
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.14 })); this.ground.rotation.x = -Math.PI / 2; this.ground.position.y = -0.4; this.ground.receiveShadow = true; this.scene.add(this.ground);
    this.tick = null; this.visible = false; this.last = 0; this.tween = null;
    new ResizeObserver(() => this.resize()).observe(host);
    new IntersectionObserver((e) => { this.visible = e[e.length - 1].isIntersecting; if (this.visible) { this.last = performance.now(); this.loop(); } }).observe(host);
    this.resize();
  }
  resize() { const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.w = w; this.h = h; }
  goTo(pos, target, ms = 800) { this.tween = { t0: performance.now(), ms, p0: this.camera.position.clone(), q0: this.controls.target.clone(), p1: new THREE.Vector3(...pos), q1: new THREE.Vector3(...target) }; }
  project(v) { const p = v.clone().project(this.camera); return [(p.x * 0.5 + 0.5) * this.w, (-p.y * 0.5 + 0.5) * this.h, p.z]; }
  loop = () => {
    if (!this.visible) return;
    const now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    if (this.tween) { const k = Math.min(1, (now - this.tween.t0) / this.tween.ms), e = k * k * (3 - 2 * k); this.camera.position.lerpVectors(this.tween.p0, this.tween.p1, e); this.controls.target.lerpVectors(this.tween.q0, this.tween.q1, e); if (k >= 1) this.tween = null; }
    this.controls.update(); if (this.tick) this.tick(dt); this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  };
}
export const webgl = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } };
