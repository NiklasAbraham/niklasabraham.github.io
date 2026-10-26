// A tiny face-list painter for the parts the kit has no primitive for: a cylinder shell with a window cut out of it,
// annular rings (pontoon, wind girder, ring wall, rim), sloped earth berms. Faces are painted back to front, each with
// its own fill and its own edges, so a concave part (a ring seen from above) still hides what lies behind it.
// Edges: between a visible and a hidden face (or a free edge) = outline; between two visible faces that turn more
// than ~28 deg = crease; between two faces of different groups that do not turn = seam (course welds, compartment
// bulkheads). Shading uses the kit's own light (G.toneOf), so mesh parts match the kit's prisms and lathes.
import * as k from "/home/niklas/.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "/home/niklas/.claude/skills/anatomy/kit/lathe.mjs";

const D2R = Math.PI / 180;
const key = (p) => p.map((v) => Math.round(v * 100)).join(",");

export function makeMesh(P) {
  const V = G.viewOf(P);
  const at = (p) => k.iso(p, P);
  const visible = (n) => G.dot3(n, V) > 1e-6;
  const toneOf = (n) => G.toneOf(n, P);
  const path = (pts, closed) => k.pathOf(pts.map(at), closed);

  // faces: { pts, n, grp, lines?: [{ pts, tone }] }
  function svg(faces, { edge = "mid", crease = "faint", seam = "faint", className = "", extra = () => "" } = {}) {
    const edges = new Map();
    faces.forEach((f, fi) => {
      f.vis = visible(f.n);
      f.pts.forEach((p, i) => {
        const q = f.pts[(i + 1) % f.pts.length];
        const a = key(p);
        const b = key(q);
        const id = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (!edges.has(id)) edges.set(id, []);
        edges.get(id).push(fi);
      });
    });
    const order = faces
      .map((f, fi) => ({ f, fi, d: G.dot3(f.pts.reduce((s, p) => G.add3(s, p), [0, 0, 0]).map((v) => v / f.pts.length), V) + (f.bias ?? 0) }))
      .filter(({ f }) => f.vis)
      .sort((a, b) => a.d - b.d);
    const out = [];
    let run = { cls: null, d: [], lines: [] };
    const flush = () => {
      if (run.d.length) out.push(`<path ${run.cls} d="${run.d.join("")}"/>`, ...run.lines);
      run = { cls: null, d: [], lines: [] };
    };
    for (const { f, fi } of order) {
      const tone = f.tone ?? toneOf(f.n);
      const cls = tone >= 4 ? `class="iso-top"` : `class="iso-shade" data-shade="${tone}"`;
      if (cls !== run.cls) flush();
      run.cls = cls;
      run.d.push(path(f.pts, true));
      const fout = [];
      const lines = { outline: [], crease: [], seam: [] };
      f.pts.forEach((p, i) => {
        const q = f.pts[(i + 1) % f.pts.length];
        const a = key(p);
        const b = key(q);
        const id = a < b ? `${a}|${b}` : `${b}|${a}`;
        const others = edges.get(id).filter((j) => j !== fi);
        if (f.free && f.free.includes(i)) return;
        if (!others.length || others.every((j) => !faces[j].vis)) {
          lines.outline.push(path([p, q]));
          return;
        }
        const o = faces[others.find((j) => faces[j].vis)];
        if (G.dot3(G.unit3(o.n), G.unit3(f.n)) < Math.cos(28 * D2R)) lines.crease.push(path([p, q]));
        else if (o.grp !== f.grp && (f.seamWith === undefined || f.seamWith(o))) lines.seam.push(path([p, q]));
      });
      if (lines.seam.length) fout.push(`<path class="iso-line" data-tone="${f.seamTone ?? seam}" d="${lines.seam.join("")}"/>`);
      if (lines.crease.length) fout.push(`<path class="iso-line" data-tone="${f.creaseTone ?? crease}" d="${lines.crease.join("")}"/>`);
      if (f.lines) for (const l of f.lines) fout.push(`<path class="iso-line" data-tone="${l.tone ?? "faint"}"${l.free ? ` data-free="${l.free === true ? "" : l.free}"` : ""} d="${path(l.pts, l.closed)}"/>`);
      if (lines.outline.length) fout.push(`<path class="iso-line" data-tone="${f.edgeTone ?? edge}" d="${lines.outline.join("")}"/>`);
      const x = extra(f);
      if (x) fout.push(x);
      run.lines.push(...fout);
    }
    flush();
    return `<g class="ct-mesh${className ? ` ${className}` : ""}">${out.join("")}</g>`;
  }

  // Geometry builders. Angles in degrees, measured from +x toward +y.
  const pt = (r, a, z) => [r * Math.cos(a * D2R), r * Math.sin(a * D2R), z];
  const radial = (a) => [Math.cos(a * D2R), Math.sin(a * D2R), 0];
  const span = (a0, a1, step) => {
    const n = Math.max(1, Math.round((a1 - a0) / step));
    return Array.from({ length: n + 1 }, (_, i) => a0 + ((a1 - a0) * i) / n);
  };

  // Wall of a cylinder (outward or inward facing) between angles and between heights; zs splits rows.
  function wall(r, zs, a0, a1, { step = 3, inward = false, grp = (zi) => `row${zi}`, skip = () => false } = {}) {
    const faces = [];
    const as = span(a0, a1, step);
    for (let zi = 0; zi < zs.length - 1; zi++) {
      for (let i = 0; i < as.length - 1; i++) {
        const [b, c] = [as[i], as[i + 1]];
        if (skip((b + c) / 2, zs[zi], zs[zi + 1])) continue;
        const mid = (b + c) / 2;
        const n = radial(mid);
        const pts = [pt(r, b, zs[zi]), pt(r, c, zs[zi]), pt(r, c, zs[zi + 1]), pt(r, b, zs[zi + 1])];
        faces.push({ pts: inward ? pts.reverse() : pts, n: inward ? G.mul3(n, -1) : n, grp: grp(zi, mid) });
      }
    }
    return faces;
  }
  // Flat annulus (top face if up, bottom if down) between radii.
  function annulus(r0, r1, z, a0, a1, { step = 3, up = true, grp = "ann", skip = () => false } = {}) {
    const faces = [];
    const as = span(a0, a1, step);
    for (let i = 0; i < as.length - 1; i++) {
      const [b, c] = [as[i], as[i + 1]];
      if (skip((b + c) / 2)) continue;
      faces.push({ pts: [pt(r0, b, z), pt(r1, b, z), pt(r1, c, z), pt(r0, c, z)], n: [0, 0, up ? 1 : -1], grp: typeof grp === "function" ? grp((b + c) / 2) : grp });
    }
    return faces;
  }
  // Sloped conical band (berm faces): from (r0, z0) to (r1, z1) round the axis.
  function cone(r0, z0, r1, z1, a0, a1, { step = 3, grp = "cone" } = {}) {
    const faces = [];
    const as = span(a0, a1, step);
    const dr = r1 - r0;
    const dz = z1 - z0;
    for (let i = 0; i < as.length - 1; i++) {
      const [b, c] = [as[i], as[i + 1]];
      const m = radial((b + c) / 2);
      // normal of the surface: perpendicular to (dr, dz) in the meridian plane, pointing up.
      let nr = dz;
      let nz = -dr;
      if (nz < 0) [nr, nz] = [-nr, -nz];
      const n = G.unit3([m[0] * nr, m[1] * nr, nz]);
      faces.push({ pts: [pt(r0, b, z0), pt(r0, c, z0), pt(r1, c, z1), pt(r1, b, z1)], n, grp });
    }
    return faces;
  }
  // Radial end cap of a ring sector at angle a (normal along the tangent, sign = side).
  function cap(r0, r1, z0, z1, a, sign, grp = "cap") {
    const t = [-Math.sin(a * D2R) * sign, Math.cos(a * D2R) * sign, 0];
    return { pts: [pt(r0, a, z0), pt(r1, a, z0), pt(r1, a, z1), pt(r0, a, z1)], n: t, grp };
  }
  // A ring with walls and top: rings of the roof, girder, ring wall, rim.
  function ring(r0, r1, z0, z1, a0 = 0, a1 = 360, opts = {}) {
    const full = Math.abs(a1 - a0 - 360) < 1e-9;
    const faces = [
      ...wall(r1, [z0, z1], a0, a1, { ...opts, grp: () => opts.grp ?? "ring" }),
      ...wall(r0, [z0, z1], a0, a1, { ...opts, inward: true, grp: () => opts.grp ?? "ring" }),
      ...annulus(r0, r1, z1, a0, a1, { ...opts, grp: opts.grp ?? "ring" }),
    ];
    if (!full) faces.push(cap(r0, r1, z0, z1, a0, -1), cap(r0, r1, z0, z1, a1, 1));
    return faces;
  }
  return { svg, wall, annulus, cone, cap, ring, pt, radial, span, path, at, V, visible };
}
