// SVG artwork for the invitation's interior decoration (see animations/decor.js
// for how it is placed and revealed). Everything is built from the envelope's
// own damask vocabulary — the same acanthus leaves and scrolls, the wax seal's
// emblem — and takes its colours from CSS custom properties (--decor-gold-*,
// defined in main.css from the theme), so config.theme restyles it too.
//
// The corner bracket and the monogram crest are each defined ONCE, as an SVG
// <symbol> in a hidden sprite; every placement is a light <svg><use/></svg>.
// Their draw-in is driven by two INHERITED properties set on the <use> —
// stroke-dashoffset (the outlines draw; every outline path carries
// pathLength="1") and fill-opacity (the gold fills fade in after).
//
// Inherited properties are restyled on every element of the <use>'s shadow tree
// each frame they animate, so each ornament is a handful of COMPOUND paths
// (one for all its fills, one for all its outlines, one for its beads) rather
// than one element per leaf: ~10 elements, not ~100.

import {
  DAMASK_TILE_W,
  DAMASK_TILE_H,
  damaskEmblemPath,
  damaskCorner,
  damaskCartouche,
  damaskTileSVG,
  dotPath,
} from "./damask.js";
import { DAMASK_SCALE } from "./envelopeArt.js";

export const CORNER_SIZE = 80; // viewBox units of the corner symbol
const CREST_W = 152;
const CREST_H = 168;

// A plate ({ shapes, beads } from damask.js) as three elements: every closed
// shape as one gold fill, every outline and vein as one drawn stroke, and the
// beads. Overlapping shapes of one plate share a winding, so the fill unions.
function goldPlate({ shapes, beads }) {
  const fill = shapes.filter((s) => !s.vein).map((s) => s.d).join("");
  const line = shapes.map((s) => s.d).join("");
  return (
    `<path class="d-fill" d="${fill}"/><path class="d-line" pathLength="1" d="${line}"/>` +
    (beads.length ? `<path class="d-bead" d="${beads.map(dotPath).join("")}"/>` : "")
  );
}

function ellipsePath(cx, cy, rx, ry) {
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
}

function crestSymbol(initials) {
  const { flank, crown } = damaskCartouche();
  const cx = CREST_W / 2;
  const cy = 80;
  // Beads set on the inside of the ring, like the seal's — one compound path.
  const beads = Array.from({ length: 34 }, (_, i) => {
    const a = (i / 34) * Math.PI * 2;
    return dotPath([cx + 37.6 * Math.cos(a), cy + 48.6 * Math.sin(a), 0.95]);
  }).join("");
  const emblem = damaskEmblemPath();

  return `<symbol id="decor-crest" viewBox="0 0 ${CREST_W} ${CREST_H}">
    <g transform="translate(${cx} ${cy})">
      ${goldPlate(flank)}
      <g transform="scale(-1 1)">${goldPlate(flank)}</g>
      ${goldPlate(crown)}
    </g>
    <path class="d-disc" d="${ellipsePath(cx, cy, 41, 51.5)}"/>
    <path class="d-ring" pathLength="1" d="${ellipsePath(cx, cy, 45, 55.5)}"/>
    <path class="d-hair" pathLength="1" d="${ellipsePath(cx, cy, 40.4, 50.9)}"/>
    <path class="d-beads" d="${beads}"/>
    <g transform="translate(${cx} ${cy - 15}) scale(0.8)">
      <path class="d-emblem-shade" transform="translate(1 1.3)" d="${emblem}"/>
      <path class="d-emblem-fill" pathLength="1" d="${emblem}"/>
    </g>
    <text class="d-initials" x="${cx}" y="${cy + 37}" text-anchor="middle">${initials.replace(/&/g, "&amp;")}</text>
  </symbol>`;
}

// The hidden sprite: gradients and the two symbols. It is 0x0 rather than
// display:none so its gradients still resolve.
export function decorSprite({ corner, crest, initials }) {
  return `<svg class="decor-sprite" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="decor-gold-plate" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style="stop-color:var(--decor-gold-plate-hi)"/>
        <stop offset="1" style="stop-color:var(--decor-gold-plate-lo)"/>
      </linearGradient>
      <linearGradient id="decor-gold-line" x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" style="stop-color:var(--decor-gold-hi)"/>
        <stop offset="0.45" style="stop-color:var(--decor-gold-mid)"/>
        <stop offset="1" style="stop-color:var(--decor-gold-deep)"/>
      </linearGradient>
      <radialGradient id="decor-disc" cx="0.4" cy="0.32" r="0.9">
        <stop offset="0" style="stop-color:var(--decor-disc-hi)"/>
        <stop offset="1" style="stop-color:var(--decor-disc-lo)"/>
      </radialGradient>
      <linearGradient id="decor-emblem-fill" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" style="stop-color:var(--decor-gold-hi)"/>
        <stop offset="0.5" style="stop-color:var(--decor-gold-mid)"/>
        <stop offset="1" style="stop-color:var(--decor-gold-deep)"/>
      </linearGradient>
      ${
        corner
          ? `<symbol id="decor-corner" viewBox="0 0 ${CORNER_SIZE} ${CORNER_SIZE}">${damaskCorner().map(goldPlate).join("")}</symbol>`
          : ""
      }
      ${crest ? crestSymbol(initials) : ""}
    </defs>
  </svg>`;
}

// corner: "tl" | "br" (the bottom-right one is the top-left rotated 180deg in CSS).
export function cornerSVG(corner) {
  return `<svg class="decor-corner decor-corner--${corner}" viewBox="0 0 ${CORNER_SIZE} ${CORNER_SIZE}" aria-hidden="true" focusable="false"><use href="#decor-corner"/></svg>`;
}

export function crestSVG() {
  return `<svg class="decor-crest" viewBox="0 0 ${CREST_W} ${CREST_H}" aria-hidden="true" focusable="false"><use href="#decor-crest"/></svg>`;
}

// The page watermark as an image URL: the envelope's damask tile, flat in the
// theme's gold at a few percent, at the envelope's pattern scale. A blob (not a
// data: URI) so the ~60 KB of path data never lands in a style attribute.
export function damaskWatermark({ color, opacity }) {
  const svg = damaskTileSVG({ color, opacity, scale: DAMASK_SCALE });
  return {
    url: URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })),
    width: DAMASK_TILE_W * DAMASK_SCALE,
    height: DAMASK_TILE_H * DAMASK_SCALE,
  };
}

// The paper grain: the envelope's fractal-noise recipe (see .envelope-grain in
// main.css), at about a tenth of its alpha and tinted warm (contrast is measured
// against the darkest speck) — one 180px tile.
export const PAPER_GRAIN_URL = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n' x='0' y='0' width='100%25' height='100%25'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='9' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.4  0 0 0 0 0.26  0 0 0 0.03 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`;
