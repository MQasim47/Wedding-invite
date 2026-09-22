// SVG artwork for the envelope gate: the damask paper layers, the fold-seam
// shading, and the wax seal. Static, trusted markup only. Every colour comes
// from the theme's CSS custom properties (see the .envelope-* rules in
// main.css), so changing config.theme restyles all of it.

import { DAMASK_CELL_W, DAMASK_CELL_H, damaskPatternDefs, damaskEmblem } from "./damask.js";

export const DAMASK_ID = "env-damask";
// Pattern scale on screen. 1.2 puts one motif column at ~60% of a 390px
// phone width, so the crest and scrolls read at the same scale as the
// reference invitation.
export const DAMASK_SCALE = 1.2;

// patternTransform that centres one motif column on the envelope's vertical
// axis and puts a motif junction (not a crest) under the seal, so the
// pattern is mirror-symmetric about the seal at any viewport size.
export function damaskPatternTransform(width, height) {
  const s = DAMASK_SCALE;
  return `translate(${(width / 2 - (DAMASK_CELL_W / 2) * s).toFixed(2)} ${(height / 2 - DAMASK_CELL_H * s).toFixed(2)}) scale(${s})`;
}

// One full-size damask layer. Only the first (`withDefs`) carries the
// <pattern>; the flap's copy references it by id, so both stay aligned.
export function envelopeDamaskSVG({ withDefs = false } = {}) {
  return `<svg class="envelope-damask" aria-hidden="true" width="100%" height="100%" preserveAspectRatio="none">
    ${withDefs ? `<defs>${damaskPatternDefs(DAMASK_ID)}</defs>` : ""}
    <rect width="100%" height="100%" fill="url(#${DAMASK_ID})"/>
  </svg>`;
}

// Fold-seam shading for the envelope body. The viewBox is a unit square
// stretched over the whole screen (preserveAspectRatio="none"), so the four
// seams are always exactly corner-to-corner-to-centre whatever the aspect
// ratio. The gradients run perpendicular to the two pocket seams to give
// the soft inner shadow the bottom panel casts on the side panels; the flap's
// own shadow is a drop-shadow on the flap itself (see .envelope-flap), so it
// lifts away with the flap instead of staying behind as a smudge.
export function envelopeShadeSVG() {
  const shade = "var(--envelope-shade)";
  // [seam midpoint, unit step into the panel that receives the shadow]
  const cast = (id, x, y, dx, dy, w, a) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${x + dx * w}" y2="${y + dy * w}">
      <stop offset="0" stop-color="${shade}" stop-opacity="${a}"/>
      <stop offset="1" stop-color="${shade}" stop-opacity="0"/>
    </linearGradient>`;

  return `<svg class="envelope-shade" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      ${cast("env-shade-c", 25, 75, -1, -1, 6, 0.09)}
      ${cast("env-shade-d", 75, 75, 1, -1, 6, 0.09)}
      <linearGradient id="env-pocket-lift" x1="0" y1="100" x2="0" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fff" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="0,0 50,50 0,100" fill="url(#env-shade-c)"/>
    <polygon points="100,0 50,50 100,100" fill="url(#env-shade-d)"/>
    <polygon points="0,100 50,50 100,100" fill="url(#env-pocket-lift)"/>
    <path class="seam-shadow" d="M0 0L50 50L100 0M0 100L50 50L100 100" vector-effect="non-scaling-stroke"/>
    <path class="seam-line" d="M0 0L50 50L100 0M0 100L50 50L100 100" vector-effect="non-scaling-stroke"/>
    <path class="seam-light" transform="translate(-0.18 -0.1)" d="M0 0L50 50M100 0L50 50" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

// Raised lower edges of the flap: a crisp seam line, a highlight just
// inside it, and a soft shadow line outside.
export function envelopeFlapEdgeSVG() {
  return `<svg class="envelope-flap-edge" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="env-flap-face" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0.38"/>
        <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="var(--envelope-shade)" stop-opacity="0.16"/>
      </linearGradient>
    </defs>
    <polygon points="0,0 100,0 50,100" fill="url(#env-flap-face)"/>
    <path class="flap-light" d="M0 0L50 100L100 0" transform="translate(0 -0.6)" vector-effect="non-scaling-stroke"/>
    <path class="flap-line" d="M0 0L50 100L100 0" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

// Deterministic, gently irregular closed outline — a pressed wax edge
// rather than a perfect circle or a regular scallop.
function waxEdge(cx, cy, r) {
  let d = "";
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = r + 1.7 * Math.sin(5 * a + 0.7) + 1.15 * Math.sin(9 * a + 2.1) + 0.6 * Math.sin(14 * a + 0.4);
    d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(2) + " " + (cy + rr * Math.sin(a)).toFixed(2);
  }
  return d + "Z";
}

// Glossy gold wax seal with rose-gold depth. Light comes from the top-left:
// every bevel is a linear gradient running highlight -> shadow along that
// diagonal, the recessed field is lit from the opposite side, and a couple of
// specular arcs sell the gloss. The initials are HTML text laid on top (see
// .envelope-seal-initials) so they stay crisp.
export function waxSealSVG() {
  const beads = Array.from({ length: 44 }, (_, i) => {
    const a = (i / 44) * Math.PI * 2;
    return [60 + 31.2 * Math.cos(a), 60 + 31.2 * Math.sin(a)];
  });
  const beadShadow = beads.map(([x, y]) => `<circle cx="${(x + 0.5).toFixed(2)}" cy="${(y + 0.6).toFixed(2)}" r="0.95"/>`).join("");
  const beadLight = beads.map(([x, y]) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="0.9"/>`).join("");

  return `<svg class="envelope-seal-shape" viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <filter id="seal-drop" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="3.6"/></filter>
      <filter id="seal-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.5"/></filter>
      <radialGradient id="seal-wax" cx="0.36" cy="0.3" r="0.85">
        <stop offset="0" style="stop-color:var(--seal-rose-hi)"/>
        <stop offset="0.5" style="stop-color:var(--seal-rose)"/>
        <stop offset="1" style="stop-color:var(--seal-rose-deep)"/>
      </radialGradient>
      <linearGradient id="seal-wax-edge" x1="0.12" y1="0.05" x2="0.9" y2="0.95">
        <stop offset="0" stop-color="#fff" stop-opacity="0.85"/>
        <stop offset="0.45" stop-color="#fff" stop-opacity="0"/>
        <stop offset="0.6" stop-color="#2a0f14" stop-opacity="0"/>
        <stop offset="1" stop-color="#2a0f14" stop-opacity="0.6"/>
      </linearGradient>
      <linearGradient id="seal-ring" x1="0.15" y1="0.1" x2="0.85" y2="0.9">
        <stop offset="0" style="stop-color:var(--seal-hi)"/>
        <stop offset="0.3" style="stop-color:var(--seal-gold)"/>
        <stop offset="0.65" style="stop-color:var(--seal-gold-mid)"/>
        <stop offset="1" style="stop-color:var(--seal-gold-deep)"/>
      </linearGradient>
      <linearGradient id="seal-rim-out" x1="0.1" y1="0.1" x2="0.9" y2="0.9">
        <stop offset="0" stop-color="#fff" stop-opacity="0.95"/>
        <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" style="stop-color:var(--seal-gold-deep)" stop-opacity="0.9"/>
      </linearGradient>
      <linearGradient id="seal-rim-in" x1="0.1" y1="0.1" x2="0.9" y2="0.9">
        <stop offset="0" style="stop-color:var(--seal-gold-deep)" stop-opacity="0.85"/>
        <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0.9"/>
      </linearGradient>
      <radialGradient id="seal-field" cx="0.6" cy="0.62" r="0.75">
        <stop offset="0" style="stop-color:var(--seal-hi)"/>
        <stop offset="0.55" style="stop-color:var(--seal-gold)"/>
        <stop offset="1" style="stop-color:var(--seal-gold-mid)"/>
      </radialGradient>
      <linearGradient id="seal-emblem-fill" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0.95"/>
        <stop offset="0.5" style="stop-color:var(--seal-hi)"/>
        <stop offset="1" style="stop-color:var(--seal-gold)"/>
      </linearGradient>
      <linearGradient id="seal-gloss" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      ${damaskEmblem("seal-emblem")}
    </defs>

    <ellipse cx="65" cy="69" rx="50" ry="49" fill="#2a0f14" opacity="0.42" filter="url(#seal-drop)"/>

    <path d="${waxEdge(60, 60, 53.5)}" fill="url(#seal-wax)"/>
    <path d="${waxEdge(60, 60, 53.5)}" fill="none" stroke="url(#seal-wax-edge)" stroke-width="2.2"/>
    <path d="${waxEdge(60, 60, 50.2)}" fill="none" stroke="url(#seal-wax-edge)" stroke-width="0.9" opacity="0.55"/>

    <circle cx="60" cy="60" r="41" fill="none" stroke="url(#seal-ring)" stroke-width="7.6"/>
    <circle cx="60" cy="60" r="44.9" fill="none" stroke="url(#seal-rim-out)" stroke-width="1.1"/>
    <circle cx="60" cy="60" r="37.1" fill="none" stroke="url(#seal-rim-in)" stroke-width="1.1"/>

    <circle cx="60" cy="60" r="36.4" fill="url(#seal-field)"/>
    <circle cx="60" cy="60" r="35" fill="none" stroke="var(--seal-gold-deep)" stroke-opacity="0.5" stroke-width="2.4" filter="url(#seal-soft)"/>
    <g fill="var(--seal-gold-deep)" fill-opacity="0.55">${beadShadow}</g>
    <g fill="#fff" fill-opacity="0.85">${beadLight}</g>

    <g transform="translate(60 61.5) scale(0.98)">
      <use href="#seal-emblem" transform="translate(1.1 1.4)" fill="var(--seal-gold-deep)" fill-opacity="0.55"/>
      <use href="#seal-emblem" transform="translate(-0.7 -0.8)" fill="#fff" fill-opacity="0.9"/>
      <use href="#seal-emblem" fill="url(#seal-emblem-fill)" stroke="var(--seal-gold-deep)" stroke-opacity="0.5" stroke-width="0.4" stroke-linejoin="round"/>
    </g>

    <path d="M22 50A40 40 0 0 1 46 24" fill="none" stroke="url(#seal-gloss)" stroke-width="3.2" stroke-linecap="round" opacity="0.8"/>
    <ellipse cx="33" cy="30" rx="6.5" ry="2.6" transform="rotate(-40 33 30)" fill="#fff" opacity="0.7"/>
    <path d="M97 78A40 40 0 0 1 76 98" fill="none" stroke="var(--seal-rose-hi)" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
  </svg>`;
}
