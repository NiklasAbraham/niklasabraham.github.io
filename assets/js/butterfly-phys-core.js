// Physics of the butterfly wing drive: pure functions, no DOM (tested with node, drawn by butterfly-physics.js).
// SI units throughout. Every parameter of REF is an order-of-magnitude estimate for a cabbage-white-sized butterfly, not a measurement.
export const TAU = Math.PI * 2, G = 9.81, RHO = 1.2, NU = 1.5e-5;

// One wing side (fore + hind wing moving as one surface). Estimates, see the sources list of the post.
export const REF = {
  m: 80e-6,        // body mass, kg
  S: 5.0e-4,       // wing area per side, m^2
  R: 0.025,        // wing length (root to tip), m
  mw: 5e-6,        // wing mass per side, kg
  f: 12,           // wingbeat frequency, Hz
  phi: 1.1,        // stroke half-amplitude, rad (63 degrees)
  alpha: 45,       // mid-stroke angle of attack, degrees
  cnmax: 3.4,      // normal-force coefficient of a flat plate at 90 degrees
  r2: 0.55, r3: 0.62, rg: 0.5,  // second / third radius of the wing area, radius of gyration, in units of R
  fmr: 0.20,       // flight-muscle mass / body mass
  lin: 0.5e-3,     // inner lever arm, root to fulcrum, m
  Lm: 8e-3,        // flight-muscle length, m
  sigma: 250e3,    // maximum isometric stress, Pa
};

// Wing geometry-derived constants: second and third moments of area, inertia, drag-torque coefficient
export function wingModel(p) {
  const c = p.S / p.R;                                   // mean chord
  const S2 = p.S * (p.r2 * p.R) ** 2;                    // integral of c r^2 dr
  const S3 = p.S * (p.r3 * p.R) ** 3;                    // integral of c r^3 dr
  const a = (p.alpha * Math.PI) / 180;
  const CL = p.cnmax * Math.sin(a) * Math.cos(a), CD = p.cnmax * Math.sin(a) ** 2;
  const Iw = p.mw * (p.rg * p.R) ** 2;                   // wing inertia about the root
  const Ia = RHO * (Math.PI / 4) * c * c * (p.R ** 3) / 3; // added mass of the air: rho pi/4 integral of c^2 r^2 dr (c constant)
  const I = Iw + Ia;
  const Gam = 0.5 * RHO * CD * S3;                       // aerodynamic torque: Gam |theta'| theta'
  const th0 = 2 * p.phi;                                 // peak-to-peak stroke
  const N = I / (Gam * th0);                             // Weis-Fogh number (Lynch et al. 2024)
  const U = 2 * Math.PI * p.f * p.phi * p.r2 * p.R;      // peak speed of the wing's second-moment radius
  return { c, S2, S3, CL, CD, Iw, Ia, I, Gam, th0, N, U, Re: (U * c) / NU };
}

// Vertical force of both wings over one beat (quasi-steady, normal force resolved vertically), phase 0..1, theta = -phi cos(2 pi ph)
export function liftTrace(p, n = 200) {
  const w = wingModel(p), om = TAU * p.f, out = [];
  for (let i = 0; i <= n; i++) {
    const ph = i / n, thd = om * p.phi * Math.sin(TAU * ph);
    out.push({ ph, F: 2 * 0.5 * RHO * w.CL * thd * thd * w.S2, thd });
  }
  return out;
}
export function liftSummary(p) {
  const tr = liftTrace(p), w = wingModel(p);
  const mean = tr.slice(0, -1).reduce((s, q) => s + q.F, 0) / (tr.length - 1), peak = Math.max(...tr.map((q) => q.F));
  const weight = p.m * G;
  // mean F = (1/2) rho CL S2 om^2 phi^2 for both wings; the half-amplitude that carries the weight:
  const phiReq = Math.sqrt((2 * weight) / (RHO * w.CL * (TAU * p.f) ** 2 * w.S2));
  return { mean, peak, weight, ratio: mean / weight, phiReq, loading: weight / (2 * p.S), ...w };
}

// Prescribed stroke theta = -phi cos(om t). The muscle torque (per wing) that produces it, with a linear spring of stiffness k at the hinge:
//   tau_m = I theta'' + k theta + c_s theta' + Gam |theta'| theta'
// returns arrays over one beat and the work integrals. rf = f / f0 sets k = I (2 pi f / rf)^2.
export function springWing(p, rf, gammaS = 0.1, n = 400) {
  const w = wingModel(p), om = TAU * p.f;
  const k = rf > 0 ? w.I * (om / rf) ** 2 : 0;
  const cs = (k * gammaS) / om;                          // structural loss modulus gamma: energy loss per cycle = pi gamma k theta^2
  const t = [], th = [], tIn = [], tEl = [], tAe = [], tM = [], pM = [];
  let Wpos = 0, Wnet = 0, Wae = 0, tauPeak = 0;
  for (let i = 0; i < n; i++) {
    const ph = i / n, s = Math.sin(TAU * ph), c = Math.cos(TAU * ph);
    const x = -p.phi * c, v = om * p.phi * s, a = om * om * p.phi * c;
    const ti = w.I * a, te = k * x, ta = w.Gam * Math.abs(v) * v + cs * v, tm = ti + te + ta, pw = tm * v;
    t.push(ph); th.push(x); tIn.push(ti); tEl.push(te); tAe.push(ta); tM.push(tm); pM.push(pw);
    Wpos += Math.max(pw, 0) / n; Wnet += pw / n; Wae += (w.Gam * Math.abs(v) * v * v) / n;
    tauPeak = Math.max(tauPeak, Math.abs(tm));
  }
  return { w, k, t, th, tIn, tEl, tAe, tM, pM, Pnet: Wnet, Ppos: Wpos, Pae: Wae, tauPeak, f0: rf > 0 ? p.f / rf : 0 };
}
// Ppos, Pnet, Pae are mean powers per wing in W: Ppos counts positive muscle power only (a muscle cannot bank negative work),
// Pnet is the mean of tau_m * theta' (what is dissipated), Pae the aerodynamic part of it.

// Hill-type muscle driven through a sinusoidal length change (a work loop). Force in units of F0, strain eps, rates in L0/s.
export const MUSCLE = { tauR: 0.006, tauD: 0.012, vmax: 20, K: 0.25, N: 1.5, wl: 0.3, sigma: 250e3, rho: 1060 };
function fv(v, m) { // force-velocity, v > 0 shortening (Hill hyperbola), v < 0 lengthening (rises to about 1.5-1.8)
  const x = v / m.vmax;
  if (x >= 0) return Math.max(0, (1 - x) / (1 + x / m.K));
  return m.N + ((m.N - 1) * (1 + x)) / (7.56 * m.K * x - 1);
}
// activation of one nerve impulse: difference of exponentials (rise tauR, decay tauD), summed over the burst, saturating at 1
function activation(t, spikes, m) {
  const tp = (m.tauR * m.tauD / (m.tauD - m.tauR)) * Math.log(m.tauD / m.tauR), pk = Math.exp(-tp / m.tauD) - Math.exp(-tp / m.tauR);
  let s = 0;
  for (const ts of spikes) { const d = t - ts; if (d > 0) s += (Math.exp(-d / m.tauD) - Math.exp(-d / m.tauR)) / pk; }
  return 1 - Math.exp(-s);
}
// eps(t) = -ea cos(2 pi f t): shortest at phase 0, longest at phase 0.5, so a burst near 0.5 starts as the muscle begins to shorten. A burst of nSpk impulses 4 ms apart starts at stimPhase.
// Returns the last cycle (pts, for the loop) and the specific power in W/kg of muscle: -closedintegral(F deps) * sigma / rho * f.
export function workLoop(f, stimPhase, nSpk = 2, ea = 0.05, m = MUSCLE, cycles = 5, nPer = 300) {
  const T = 1 / f, om = TAU * f, dt = T / nPer, spikes = [];
  for (let c = -2; c < cycles; c++) for (let j = 0; j < nSpk; j++) spikes.push(c * T + stimPhase * T + j * 0.004);
  const pts = [];
  for (let i = (cycles - 1) * nPer; i <= cycles * nPer; i++) {
    const t = i * dt, eps = -ea * Math.cos(om * t), vs = -ea * om * Math.sin(om * t); // vs > 0: shortening
    const a = activation(t, spikes, m), fl = Math.exp(-((eps / m.wl) ** 2));
    pts.push({ ph: (i - (cycles - 1) * nPer) / nPer, eps, vs, a, F: a * fl * fv(vs, m) });
  }
  let W = 0, Wp = 0; // work per unit F0 L0 (dimensionless): shortening under force is positive
  for (let i = 1; i < pts.length; i++) { const dw = -0.5 * (pts[i].F + pts[i - 1].F) * (pts[i].eps - pts[i - 1].eps); W += dw; Wp += Math.max(0, dw); }
  const spec = (W * m.sigma) / m.rho * f; // W/kg
  return { pts, W, Wp, spec, specPos: (Wp * m.sigma) / m.rho * f };
}
export function bestPhase(f, nSpk, ea, m = MUSCLE) {
  let best = { spec: -1e9, ph: 0 };
  for (let k = 0; k < 40; k++) { const r = workLoop(f, k / 40, nSpk, ea, m, 4, 160); if (r.spec > best.spec) best = { spec: r.spec, ph: k / 40 }; }
  return best;
}
