// Procedural baroque damask for the envelope. Everything is built from two
// primitives — a serrated, bendable acanthus leaf and a tapered scroll stem
// that runs into a spiral curl — so the motif stays sharp at any size and
// takes its colours from the theme tokens (see damaskPatternDefs()).
//
// The motif is drawn once as the RIGHT half of a mirrored cell, then
// flipped for the left half, and placed on a half-drop repeat (two columns,
// the second offset by half a cell) inside a single SVG <pattern> tile.
//
// Cell coordinates: the motif axis is x = 0, y runs -130 (crest tip) to
// +130 (lower palmette tip). Static, trusted output only.
//
// Each motif is an ORDERED list of items ({ d } filled shapes, { d, vein }
// open lines, { dot } beads) so that a leaf's veins are painted right after
// its own fill — later leaves then cover earlier ones' veins instead of the
// veins all piling on top of every fill.

export const DAMASK_CELL_W = 180;
export const DAMASK_CELL_H = 260;
export const DAMASK_TILE_W = DAMASK_CELL_W * 2;
export const DAMASK_TILE_H = DAMASK_CELL_H;

const TAU = Math.PI * 2;
const rd = (n) => Math.round(n * 10) / 10;

function poly(pts, close = true) {
  return "M" + pts.map((p) => `${rd(p.x)} ${rd(p.y)}`).join("L") + (close ? "Z" : "");
}

// Serrated acanthus lobe. Local frame: base at (x, y), heading `angle`
// (radians, screen coordinates), `bend` curls the heading along its length
// (a positive bend curls clockwise on screen). `lobes` > 0 gives a
// sawtooth edge whose points face the tip; 0 gives a smooth pointed petal.
function leaf({ x, y, angle, len, wid, lobes = 3, bend = 0, phase = 0 }) {
  const n = Math.round(lobes * 6) + 8;
  const step = len / n;
  const centre = [];
  let px = x;
  let py = y;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const phi = angle + bend * s * s;
    if (i) {
      px += Math.cos(phi) * step;
      py += Math.sin(phi) * step;
    }
    centre.push({ x: px, y: py, phi, s });
  }
  const edge = (sign, ph) =>
    centre.map(({ x: cx, y: cy, phi, s }) => {
      const profile = Math.pow(Math.sin(Math.PI * Math.pow(s, 0.72)), 0.8);
      const saw = lobes ? 0.56 + 0.44 * Math.pow((((s * lobes + ph) % 1) + 1) % 1, 0.75) : 1;
      const w = wid * profile * saw;
      return { x: cx - Math.sin(phi) * w * sign, y: cy + Math.cos(phi) * w * sign };
    });
  const upper = edge(1, phase);
  const lower = edge(-1, phase + 0.35).reverse();
  return [{ d: poly([...upper, ...lower.slice(1)]) }, { d: poly(centre.slice(0, Math.round(n * 0.86)), false), vein: true }];
}

function catmull(pts, seg = 12) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < seg; k++) {
      const t = k / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
      out.push({ x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function resample(pts, ds) {
  const out = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1];
    const b = pts[i];
    let d = Math.hypot(b.x - a.x, b.y - a.y);
    while (carry + d >= ds) {
      const t = (ds - carry) / d;
      a = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      out.push(a);
      d = Math.hypot(b.x - a.x, b.y - a.y);
      carry = 0;
    }
    carry += d;
  }
  return out;
}

// A tapered stem through `anchors`, running into a spiral curl, with
// acanthus leaves sprouting from the outside of the curve (larger) and,
// on alternating stations, smaller ones from the inside.
function scroll({ anchors, curl, leafLen = [30, 12], spacing = 15, stemW = 2.6, leafScale = 1 }) {
  const pts = anchors.map(([x, y]) => ({ x, y }));
  if (curl) {
    const { cx, cy, r0, r1, a0, dir, turns } = curl;
    const count = Math.ceil(turns * 16);
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const r = r0 * Math.pow(r1 / r0, t);
      const a = a0 + dir * turns * TAU * t;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  }
  const line = resample(catmull(pts, 14), 1.5);
  const n = line.length;
  const tan = line.map((p, i) => {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(n - 1, i + 1)];
    return Math.atan2(b.y - a.y, b.x - a.x);
  });

  const left = [];
  const right = [];
  line.forEach((p, i) => {
    const u = i / (n - 1);
    const w = stemW * Math.pow(1 - u, 0.8) + 0.5;
    left.push({ x: p.x - Math.sin(tan[i]) * w, y: p.y + Math.cos(tan[i]) * w });
    right.push({ x: p.x + Math.sin(tan[i]) * w, y: p.y - Math.cos(tan[i]) * w });
  });

  const items = [];
  // Leaves first, stem over them, so the stem reads as growing through the
  // leaf bases rather than the leaves sitting on top of it.
  const stride = Math.round(spacing / 1.5);
  let station = 0;
  for (let i = 6; i < n - 6; i += stride, station++) {
    const u = i / (n - 1);
    const turn = Math.sin(tan[Math.min(n - 1, i + 5)] - tan[Math.max(0, i - 5)]);
    const side = Math.abs(turn) > 0.06 ? Math.sign(turn) : station % 2 ? 1 : -1;
    const len = (leafLen[0] + (leafLen[1] - leafLen[0]) * u) * leafScale;
    if (station % 2 === 0 && len > 10) {
      items.push(
        ...leaf({
          x: line[i].x,
          y: line[i].y,
          angle: tan[i] + side * 0.85,
          len: len * 0.55,
          wid: len * 0.16,
          lobes: 2,
          bend: -side * 0.9,
          phase: station * 0.5,
        })
      );
    }
    items.push(
      ...leaf({
        x: line[i].x,
        y: line[i].y,
        angle: tan[i] - side * 0.95,
        len,
        wid: len * 0.3,
        lobes: len > 20 ? 4 : 3,
        bend: side * 1.15,
        phase: station * 0.37,
      })
    );
  }
  items.push({ d: poly([...left, ...right.reverse()]) }, { d: poly(line, false), vein: true });
  const end = line[n - 1];
  items.push({ dot: [end.x, end.y, 2.6] });
  return items;
}

// Fleur-de-lis / palmette crest: a pointed centre petal, two hooked side
// petals, a band, and two small drooping lower leaves. Drawn symmetric
// (both sides emitted), tip at (0, tipY), growing down by `h`.
function crest(tipY, h) {
  const items = [];
  const base = tipY + h * 0.66;
  for (const s of [1, -1]) {
    items.push(
      ...leaf({
        x: s * 1.5,
        y: base + h * 0.05,
        angle: s > 0 ? Math.PI / 2 - 0.9 : Math.PI / 2 + 0.9,
        len: h * 0.3,
        wid: h * 0.075,
        lobes: 0,
        bend: s > 0 ? -0.8 : 0.8,
      })
    );
  }
  for (const s of [1, -1]) {
    items.push(
      ...leaf({
        x: s * 1.5,
        y: base,
        angle: s > 0 ? -Math.PI / 2 + 1.0 : -Math.PI / 2 - 1.0,
        len: h * 0.66,
        wid: h * 0.14,
        lobes: 0,
        bend: s > 0 ? 2.1 : -2.1,
      })
    );
  }
  items.push(...leaf({ x: 0, y: base, angle: -Math.PI / 2, len: h * 0.68, wid: h * 0.16, lobes: 0 }));
  items.push({ d: `M${rd(-h * 0.13)} ${rd(base - h * 0.02)}H${rd(h * 0.13)}V${rd(base + h * 0.05)}H${rd(-h * 0.13)}Z` });
  return items;
}

// The on-axis pieces and the right-hand half (scrolls + calyx leaves). Built
// once: the envelope pattern and the page watermark both draw from it.
let motifCache = null;
function buildMotif() {
  if (motifCache) return motifCache;
  const axis = [];
  const half = [];

  // Lower palmette first (it sits behind the calyx), pointing down.
  axis.push(...crest(0, 54).map((it) => ({ ...it, flip: true })));

  // Diamond bead-chain between bud and lower palmette.
  axis.push({ d: "M0 56L7 68L0 80L-7 68Z" }, { dot: [0, 90, 2.2] }, { dot: [0, 98, 1.8] });

  // Top crest.
  axis.push(...crest(-128, 78));

  // Central bud — two nested serrated flames.
  axis.push(...leaf({ x: 0, y: 20, angle: -Math.PI / 2, len: 68, wid: 17.5, lobes: 4 }));
  axis.push(...leaf({ x: 0, y: 20, angle: -Math.PI / 2, len: 47, wid: 9.5, lobes: 3, phase: 0.5 }));
  axis.push({ dot: [0, -24, 2.4] }, { dot: [0, -10, 2] }, { dot: [0, 4, 1.7] });

  // Calyx leaves wrapping the bud.
  for (const [ang, len, bend, y] of [
    [-Math.PI / 2 + 0.5, 46, 0.55, 32],
    [-Math.PI / 2 + 1.05, 36, 0.8, 36],
  ]) {
    half.push(...leaf({ x: 4, y, angle: ang, len, wid: len * 0.27, lobes: 3, bend, phase: 0.2 }));
  }

  // Filler tendrils in the negative space beside the crest and bud.
  half.push(
    ...scroll({
      anchors: [[14, -6], [26, -24], [34, -46]],
      curl: { cx: 40, cy: -56, r0: 10, r1: 2.6, a0: 2.4, dir: 1, turns: 1.2 },
      leafLen: [18, 9],
      stemW: 1.6,
    }),
    ...scroll({
      anchors: [[12, 78], [24, 96], [30, 116]],
      curl: { cx: 24, cy: 122, r0: 8, r1: 2.4, a0: -0.4, dir: -1, turns: 1.2 },
      leafLen: [14, 8],
      stemW: 1.4,
    })
  );

  // Lower scroll: a smaller counterpart curling downward.
  half.push(
    ...scroll({
      anchors: [[4, 50], [22, 64], [46, 66], [62, 84]],
      curl: { cx: 46, cy: 100, r0: 22, r1: 4, a0: -0.55, dir: 1, turns: 1.4 },
      leafLen: [26, 11],
      stemW: 2.2,
    })
  );

  // Upper scroll: out from the calyx, over the shoulder and into a curl.
  half.push(
    ...scroll({
      anchors: [[4, 30], [24, 44], [50, 38], [68, 18]],
      curl: { cx: 50, cy: -8, r0: 26, r1: 4.5, a0: 0.42, dir: -1, turns: 1.5 },
      leafLen: [32, 12],
    })
  );

  motifCache = { axis, half };
  return motifCache;
}

function render(items) {
  return items
    .map((it) => {
      if (it.dot) return `<circle cx="${rd(it.dot[0])}" cy="${rd(it.dot[1])}" r="${it.dot[2]}"/>`;
      const p = `<path d="${it.d}"${it.vein ? ' fill="none"' : ""}/>`;
      return it.flip ? `<g transform="translate(0 126) scale(1 -1)">${p}</g>` : p;
    })
    .join("");
}

// The shared shape groups: one mirrored cell placed on the half-drop repeat
// (`#${id}-tile`, exactly one tile wide and tall — content that crosses the
// tile edge wraps because the second column is drawn at both y = 0 and y = H).
function damaskShapes(id) {
  const { axis, half } = buildMotif();
  const cellW = DAMASK_CELL_W;
  const cellH = DAMASK_CELL_H;
  const place = `<use href="#${id}-cell" x="${cellW / 2}" y="${cellH / 2}"/>
    <use href="#${id}-cell" x="${cellW * 1.5}" y="0"/>
    <use href="#${id}-cell" x="${cellW * 1.5}" y="${cellH}"/>`;

  return `
    <g id="${id}-half">${render(half)}</g>
    <g id="${id}-cell">
      <g>${render(axis)}</g>
      <use href="#${id}-half"/>
      <use href="#${id}-half" transform="scale(-1 1)"/>
    </g>
    <g id="${id}-tile">${place}</g>`;
}

// Builds the <defs> content: the shared shape groups plus the pattern tile.
// `id` prefixes every def. Colours come from CSS custom properties so the
// pattern follows the theme (--color-accent) — see .envelope-damask in
// main.css for the defaults of --damask-shade / --damask-lift.
export function damaskPatternDefs(id) {
  return `${damaskShapes(id)}
    <pattern id="${id}" width="${DAMASK_TILE_W}" height="${DAMASK_TILE_H}" patternUnits="userSpaceOnUse" data-damask-pattern>
      <use href="#${id}-tile" transform="translate(1.6 2)" fill="var(--damask-shade)" fill-opacity="0.42"/>
      <use href="#${id}-tile" transform="translate(-1 -1.2)" fill="#fff" fill-opacity="0.9"/>
      <use href="#${id}-tile" fill="var(--damask-lift)" stroke="var(--color-accent)" stroke-opacity="0.34" stroke-width="0.55" stroke-linecap="round" stroke-linejoin="round"/>
    </pattern>`;
}

// Small ornate emblem for the wax seal: a fleur-de-lis crest flanked by two
// acanthus leaves and a pair of curls, centred on (0, 0) within roughly
// ±30 units. Returns <g id="${id}"> (definitions only — the caller places
// and colours it with <use>, as the pattern tile does).
function emblemItems() {
  const axis = crest(-31, 47);
  const half = [
    ...leaf({ x: 3, y: 10, angle: -Math.PI / 2 + 0.95, len: 21, wid: 5.6, lobes: 3, bend: 0.7, phase: 0.2 }),
    ...scroll({
      anchors: [[3, 13], [13, 21], [25, 18]],
      curl: { cx: 25, cy: 10, r0: 8, r1: 1.9, a0: 1.5, dir: -1, turns: 1.25 },
      leafLen: [13, 6],
      spacing: 9,
      stemW: 1.3,
    }),
  ];
  return { axis, half };
}

export function damaskEmblem(id) {
  const { axis, half } = emblemItems();
  return `<g id="${id}-half">${render(half)}</g>
    <g id="${id}">${render(axis)}<use href="#${id}-half"/><use href="#${id}-half" transform="scale(-1 1)"/></g>`;
}

// The same emblem as ONE compound path (both halves, beads as tiny circles),
// for places that animate it: an animated <use> restyles every element of its
// shadow tree each frame, so a 90-element emblem is what makes it expensive.
export function damaskEmblemPath() {
  const { axis, half } = emblemItems();
  const mirror = (dd) => dd.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => `${-x} ${y}`);
  const shapes = [...axis, ...half].filter((it) => it.d);
  return (
    shapes.map((it) => it.d).join("") +
    half.filter((it) => it.d).map((it) => mirror(it.d)).join("") +
    [...axis, ...half].filter((it) => it.dot).map((it) => dotPath(it.dot)).join("") +
    half.filter((it) => it.dot).map((it) => dotPath([-it.dot[0], it.dot[1], it.dot[2]])).join("")
  );
}

// A filled circle as path data (so beads can join a compound path).
export function dotPath([x, y, r]) {
  return `M${rd(x - r)} ${rd(y)}a${r} ${r} 0 1 0 ${rd(2 * r)} 0a${r} ${r} 0 1 0 ${rd(-2 * r)} 0Z`;
}

// Swap x/y in every "x y" pair of a poly() path: a reflection across the
// y = x diagonal, which maps a top-edge arm onto the left edge.
const transpose = (d) => d.replace(/(-?[\d.]+) (-?[\d.]+)/g, "$2 $1");

// Splits ordered items into what a flat gold plate needs: `plates` (closed
// shapes, in painting order so later leaves cover earlier ones), `lines`
// (open veins) and `beads`.
function plate(items, mirror = false) {
  const flip = (d) => (mirror ? transpose(d) : d);
  return {
    shapes: items.filter((it) => it.d).map((it) => ({ d: flip(it.d), vein: !!it.vein })),
    beads: items.filter((it) => it.dot).map((it) => (mirror ? [it.dot[1], it.dot[0], it.dot[2]] : it.dot)),
  };
}

// Baroque corner bracket, drawn for a top-left corner in a 100 x 100 box
// whose origin is the corner itself. An acanthus scroll runs along the top
// edge into a curl, its mirror image runs down the left edge, and a small
// palmette of three pointed leaves closes the corner between them — the same
// leaf and scroll vocabulary as the damask. A bottom-right corner is this
// rotated 180 degrees.
export function damaskCorner() {
  const arm = scroll({
    anchors: [[20, 17], [35, 14.5], [52, 18], [67, 16]],
    curl: { cx: 66, cy: 30, r0: 14, r1: 3, a0: -Math.PI / 2 + 0.04, dir: 1, turns: 1.3 },
    leafLen: [21, 10],
    spacing: 17,
    stemW: 1.8,
  });
  const palm = [];
  for (const [angle, len, wid, bend] of [[Math.PI / 4, 30, 6.5, 0], [Math.PI / 4 - 0.5, 21, 4.4, -0.3], [Math.PI / 4 + 0.5, 21, 4.4, 0.3]]) {
    palm.push(...leaf({ x: 11, y: 11, angle, len, wid, lobes: 0, bend }));
  }
  palm.push({ dot: [11, 11, 3.2] });
  return [plate(arm), plate(arm, true), plate(palm)];
}

// Ornament for the monogram cartouche, in a frame centred on (0, 0) with the
// oval ring at roughly rx 44 / ry 54: a pair of acanthus scrolls sweeping up
// the outside of the ring from the bottom (`flank` is the right-hand one — the
// caller mirrors it) and a three-leaf palmette crowning the top (`crown`).
export function damaskCartouche() {
  const flank = scroll({
    anchors: [[5, 66], [26, 67], [47, 55], [58, 33], [60, 10]],
    curl: { cx: 68, cy: 8, r0: 8, r1: 2.4, a0: Math.PI, dir: 1, turns: 1.25 },
    leafLen: [20, 9],
    spacing: 16,
    stemW: 1.8,
  });
  const crown = [];
  for (const [angle, len, wid, bend] of [[-Math.PI / 2, 24, 6, 0], [-Math.PI / 2 - 0.72, 19, 4.6, -0.4], [-Math.PI / 2 + 0.72, 19, 4.6, 0.4]]) {
    crown.push(...leaf({ x: 0, y: -52, angle, len, wid, lobes: 0, bend }));
  }
  return { flank: plate(flank), crown: plate(crown) };
}

// A standalone, transparent, seamlessly tiling SVG of the envelope's damask
// (the very same motif and half-drop layout as its <pattern>), flat in one
// colour, for the page watermark. The opacity sits on a GROUP, not on the
// shapes: the motif is ~100 overlapping polygons, and per-shape alpha stacks
// wherever they overlap (measured: a 3.5% fill darkened its densest pixels by
// 10%, which is exactly where text contrast is lost). `scale` is the pattern scale on screen.
export function damaskTileSVG({ color, opacity, scale }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${DAMASK_TILE_W * scale}" height="${DAMASK_TILE_H * scale}" viewBox="0 0 ${DAMASK_TILE_W} ${DAMASK_TILE_H}">
    <defs>${damaskShapes("wm")}</defs>
    <g opacity="${opacity}"><use href="#wm-tile" fill="${color}"/></g>
  </svg>`;
}
