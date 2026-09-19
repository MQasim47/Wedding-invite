// Inline SVG line-icon markup. Static, trusted strings only — never used
// with dynamic/user-supplied content, so innerHTML use here is safe.

export const icons = {
  rings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/></svg>`,
  glasses: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 15c0 3 2 5 4 5s4-2 4-5-1-6-4-6-4 3-4 6z"/><path d="M13 15c0 3 2 5 4 5s4-2 4-5-1-6-4-6-4 3-4 6z"/><path d="M11 6l2 2 2-2"/></svg>`,
  dinner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="13" r="7"/><path d="M5 2v6M7 2v6M5 8c0 1 .8 1.6 2 1.6S9 9 9 8M7 9.6V22M19 2c-2 .5-3 2.5-3 5s1 3 3 3M18.5 10v12"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20s-7-4.5-9.5-9C.8 7.5 2.5 4 6 4c2 0 3.5 1.2 4 2.5C10.5 5.2 12 4 14 4c3.5 0 5.2 3.5 3.5 7-2.5 4.5-9.5 9-9.5 9z"/></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  mute: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9v6h4l5 4V5L8 9H4z"/><line x1="16" y1="9" x2="21" y2="14"/><line x1="21" y1="9" x2="16" y2="14"/></svg>`,
  unmute: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7"/><path d="M19 6a9 9 0 010 12"/></svg>`,
  check: `<svg class="rsvp-success-check" viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"/><path d="M15 27l7 7 15-15"/></svg>`,
  divider: `<svg viewBox="0 0 80 24" fill="none" stroke="currentColor" stroke-width="1"><line x1="0" y1="12" x2="28" y2="12"/><circle cx="40" cy="12" r="4" fill="currentColor" stroke="none"/><line x1="52" y1="12" x2="80" y2="12"/></svg>`,
  heartOutlineDraw: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path class="heart-draw-path" d="M12 20s-7-4.5-9.5-9C.8 7.5 2.5 4 6 4c2 0 3.5 1.2 4 2.5C10.5 5.2 12 4 14 4c3.5 0 5.2 3.5 3.5 7-2.5 4.5-9.5 9-9.5 9z"/></svg>`,
  // Symmetric heart (even left/right lobes, centered in its own viewBox) —
  // unlike the hand-drawn `heart`/`heartOutlineDraw` outline above, this one
  // needs to be optically centered since the calendar wraps a day number
  // inside it via plain flexbox centering on the container.
  heartSolid: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
};

// Builds two V-shaped chains of interlocking oval links running from wide
// anchors near the top down to a pair of small rings at the badge's top
// corners, plus a shimmer overlay (a bright band GSAP later slides across
// via transform). Coordinates are in a fixed viewBox unit space — the
// element is scaled to whatever width CSS gives it, so this needs no
// knowledge of the actual rendered badge width.
export function pendantChainSVG() {
  const width = 200;
  const height = 46;
  const topLeftX = width * 0.14;
  const topRightX = width * 0.86;
  const bottomLeftX = width * 0.35;
  const bottomRightX = width * 0.65;
  const linkCount = 6;
  const linkW = 8;
  const linkH = 12;

  function buildLinks(x1, y1, x2, y2) {
    let links = "";
    for (let i = 0; i < linkCount; i++) {
      const tt = (i + 0.5) / linkCount;
      const x = x1 + (x2 - x1) * tt;
      const y = y1 + (y2 - y1) * tt;
      const angleDeg = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
      // Alternate a +90deg twist so neighboring links read as interlocked
      // ovals rather than a flat stack of identical ellipses.
      const rotate = angleDeg + (i % 2 === 0 ? 90 : 0);
      links += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${linkW / 2}" ry="${linkH / 2}" transform="rotate(${rotate.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="none" stroke="url(#pendant-gold)" stroke-width="2.2" />`;
    }
    return links;
  }

  return `<svg class="pendant-chains" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="pendant-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" class="chain-stop-light" />
        <stop offset="50%" class="chain-stop-mid" />
        <stop offset="100%" class="chain-stop-dark" />
      </linearGradient>
      <linearGradient id="pendant-shimmer-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fff" stop-opacity="0" />
        <stop offset="50%" stop-color="#fff" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <g>${buildLinks(topLeftX, 0, bottomLeftX, height)}</g>
    <g>${buildLinks(topRightX, 0, bottomRightX, height)}</g>
    <circle cx="${bottomLeftX}" cy="${height - 3}" r="3" fill="url(#pendant-gold)" />
    <circle cx="${bottomRightX}" cy="${height - 3}" r="3" fill="url(#pendant-gold)" />
    <g class="pendant-shimmer">
      <rect x="-16" y="-4" width="14" height="${height + 8}" fill="url(#pendant-shimmer-grad)" />
    </g>
  </svg>`;
}

// Original hand-drawn flat-style couple illustration for the default
// companion type ("svg") — groom in a suit, bride in a veil and dress,
// holding hands, with a small heart above. Uses theme colors for the
// outfits so it always matches the site's palette; skin/hair tones are
// fixed neutral shades (not themeable, since they aren't part of the
// site's color system).
export function companionCoupleSVG() {
  return `<svg viewBox="0 0 120 120" aria-hidden="true">
    <ellipse cx="60" cy="112" rx="38" ry="5" fill="rgba(0,0,0,0.08)" />

    <!-- groom -->
    <path d="M28 108 Q26 66 42 62 Q58 66 56 108 Z" fill="var(--color-primary)" />
    <path d="M38 66 L42 74 L46 66 L44 62 L40 62 Z" fill="#fdfaf5" />
    <circle cx="42" cy="76" r="2.6" fill="var(--color-accent)" />
    <circle cx="42" cy="40" r="13" fill="#eab98a" />
    <path d="M29 37 Q30 25 42 25 Q54 25 55 37 Q47 30 42 30 Q37 30 29 37 Z" fill="#3a2a20" />

    <!-- bride -->
    <path d="M60 108 Q56 64 78 60 Q104 64 100 108 Q80 116 60 108 Z" fill="#fdfaf5" />
    <path d="M69 72 L75 108 M87 72 L81 108" stroke="var(--color-accent)" stroke-width="1" opacity="0.5" />
    <path d="M78 62 Q71 78 78 108 Q85 78 78 62 Z" fill="var(--color-accent)" opacity="0.18" />
    <ellipse cx="78" cy="34" rx="18" ry="21" fill="#ffffff" opacity="0.55" />
    <circle cx="78" cy="42" r="13" fill="#eab98a" />
    <path d="M65 39 Q66 27 78 27 Q90 27 91 39 Q83 32 78 32 Q73 32 65 39 Z" fill="#5a3a24" />

    <!-- joined hands -->
    <circle cx="59" cy="82" r="4.5" fill="#eab98a" />

    <!-- heart -->
    <path d="M59 50c-2.6-3.4-7.6-3.4-9.4-0.4-1.8 2.6 0 5.2 9.4 10.4 9.4-5.2 11.2-7.8 9.4-10.4-1.8-3-6.8-3-9.4 0.4z" fill="var(--color-accent)" />
  </svg>`;
}

// Flat, elegant placeholder silhouette avatars for the Wedding Party
// section — used whenever a member has no `photo` set in config. Single
// flat tone (currentColor), hand-drawn paths, no downloaded imagery.
// `kind` is "bridesmaid" (soft flowing hair, rounded neckline) or
// "groomsman" (short hair, straight suit shoulders + collar notch).
export function silhouetteAvatarSVG(kind = "bridesmaid") {
  const isBridesmaid = kind === "bridesmaid";
  const hair = isBridesmaid
    ? `<path d="M32 46c-2-14 6-24 18-24s20 10 18 24c-3-3-7-5-9-3-1-9-6-14-9-14s-8 5-9 14c-2-2-6 0-9 3z" fill="currentColor" opacity="0.85" />
       <path d="M28 60c-1-9 2-16 6-19-2 6-2 13 1 19-3 1-5 1-7 0z" fill="currentColor" opacity="0.85" />
       <path d="M72 60c1-9-2-16-6-19 2 6 2 13-1 19 3 1 5 1 7 0z" fill="currentColor" opacity="0.85" />`
    : `<path d="M33 42c0-11 8-19 17-19s17 8 17 19c-3-4-8-6-17-6s-14 2-17 6z" fill="currentColor" opacity="0.85" />`;

  const body = isBridesmaid
    ? `<path d="M50 66c-15 0-27 9-27 26v8h54v-8c0-17-12-26-27-26z" fill="currentColor" />
       <path d="M50 66c-6 0-11 6-11 14 4 3 8 5 11 5s7-2 11-5c0-8-5-14-11-14z" fill="currentColor" opacity="0.7" />`
    : `<path d="M50 66c-14 0-26 8-26 24v10h20l2-10 4 6 4-6 2 10h20V90c0-16-12-24-26-24z" fill="currentColor" />
       <path d="M42 66l8 9 8-9" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6" />`;

  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="40" r="18" fill="currentColor" opacity="0.9" />
    ${hair}
    ${body}
  </svg>`;
}

// Thin gold ring around the floating companion's photo, matching the
// Wedding Party avatars' ring treatment (see ringSVG() in
// sections/weddingParty.js) so both read as the same design.
export function companionRingSVG() {
  return `<svg class="companion-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="companion-ring-circle" cx="50" cy="50" r="47" /></svg>`;
}

export function envelopePattern() {
  return `<svg viewBox="0 0 200 133" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="floral" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.4)" />
        <path d="M20 8c3 4 3 8 0 12-3-4-3-8 0-12z" fill="rgba(255,255,255,0.25)" />
        <path d="M8 20c4-3 8-3 12 0-4 3-8 3-12 0z" fill="rgba(255,255,255,0.25)" />
      </pattern>
    </defs>
    <rect width="200" height="133" fill="url(#floral)" />
  </svg>`;
}

// Scalloped wax-seal rim (a real wax seal's pressed edge, not a plain
// circle) in a warm peach/blush gradient. `initials` renders as separate
// HTML on top (see .envelope-seal-initials) so it stays crisp text, not
// baked into the SVG.
export function sealScallopSVG() {
  const bumps = 20;
  const cx = 50;
  const cy = 50;
  const rOuter = 44;
  const rInner = 40.5;
  let d = "";
  for (let i = 0; i <= bumps * 2; i++) {
    const angle = (i / (bumps * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = (cx + r * Math.cos(angle)).toFixed(2);
    const y = (cy + r * Math.sin(angle)).toFixed(2);
    d += (i === 0 ? "M" : "L") + x + "," + y + " ";
  }
  d += "Z";

  return `<svg class="envelope-seal-shape" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <radialGradient id="seal-blush" cx="35%" cy="28%" r="80%">
        <stop offset="0%" stop-color="var(--color-accent-soft)" />
        <stop offset="55%" stop-color="var(--color-accent)" />
        <stop offset="100%" stop-color="var(--color-primary-deep)" />
      </radialGradient>
    </defs>
    <path d="${d}" fill="url(#seal-blush)" />
  </svg>`;
}

// Debossed-looking floral vine spray for the envelope's side panels — a
// stem with alternating leaf pairs, drawn as a dark "pressed-in" stroke
// plus a light highlight fill on each leaf to fake an embossed relief
// (approximated with a paired drop-shadow in CSS rather than a full SVG
// lighting filter — simpler, and reads the same at this size).
export function envelopeVineSVG() {
  return `<svg class="envelope-vine-svg" viewBox="0 0 60 220" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.55">
      <path d="M30 6 C 27 50, 33 92, 27 132 S 31 190, 29 214" />
      <path d="M30 38 C 20 32, 10 34, 4 28" />
      <path d="M30 38 C 40 32, 50 34, 56 28" />
      <path d="M28 78 C 18 72, 8 74, 2 68" />
      <path d="M28 78 C 38 72, 48 74, 54 68" />
      <path d="M27 118 C 17 112, 7 114, 1 108" />
      <path d="M27 118 C 37 112, 47 114, 53 108" />
      <path d="M27 158 C 17 152, 8 156, 3 150" />
      <path d="M27 158 C 37 152, 47 156, 52 150" />
    </g>
    <g fill="currentColor" opacity="0.3">
      <circle cx="6" cy="26" r="4" /><circle cx="54" cy="26" r="4" />
      <circle cx="4" cy="66" r="4" /><circle cx="52" cy="66" r="4" />
      <circle cx="3" cy="106" r="4" /><circle cx="51" cy="106" r="4" />
      <circle cx="4" cy="148" r="4" /><circle cx="50" cy="148" r="4" />
    </g>
  </svg>`;
}

// Generic scalloped closed-curve path generator — an ellipse whose radius
// alternates between two values around its circumference, used for both
// the wax seal (rx === ry) and the welcome lace doily (rx !== ry).
// `archBoost` optionally pushes the topmost point out further, for the
// doily's small pointed arch at top-center.
function scallopPath(cx, cy, rx, ry, bumps, ampRatio, archBoost = 0) {
  let d = "";
  const steps = bumps * 2;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2 - Math.PI / 2;
    let r = i % 2 === 0 ? 1 : 1 - ampRatio;
    if (archBoost && Math.abs(angle + Math.PI / 2) < 0.18) r += archBoost;
    const x = (cx + rx * r * Math.cos(angle)).toFixed(2);
    const y = (cy + ry * r * Math.sin(angle)).toFixed(2);
    d += (i === 0 ? "M" : "L") + x + "," + y + " ";
  }
  return d + "Z";
}

// Burgundy scalloped/baroque cartouche behind the hero names badge — a
// rounded plaque with concave "ear" notches carved into each corner.
// Notches are drawn as circles filled to match the page background
// (simpler and lighter than a true SVG compositing cutout, and reads
// identically since the hero section sits on a flat, untextured cream
// background right where the badge lives).
export function badgeCartoucheSVG() {
  // primaryDeep, not primary: the badge carries cream text directly on top
  // (names, and the small DAY/MONTH date labels) — same reasoning as the
  // calendar heart icon below.
  return `<svg class="hero-badge-svg" viewBox="0 0 100 66" preserveAspectRatio="none" aria-hidden="true">
    <rect x="1.5" y="1.5" width="97" height="63" rx="13" ry="18" fill="var(--color-primary-deep)" />
    <circle cx="1.5" cy="1.5" r="8" fill="var(--color-background)" />
    <circle cx="98.5" cy="1.5" r="8" fill="var(--color-background)" />
    <circle cx="1.5" cy="64.5" r="8" fill="var(--color-background)" />
    <circle cx="98.5" cy="64.5" r="8" fill="var(--color-background)" />
  </svg>`;
}

// Beige/cream lace-doily frame behind the welcome message — fully
// scalloped border all the way around, like a real paper doily, with a
// small pointed arch at the top.
export function laceDoilySVG() {
  const outer = scallopPath(50, 52, 46, 48, 22, 0.09, 0.05);
  const inner = scallopPath(50, 52, 40, 42, 22, 0.07, 0.03);
  return `<svg class="welcome-doily-svg" viewBox="0 0 100 104" preserveAspectRatio="none" aria-hidden="true">
    <path d="${outer}" fill="#f6efe2" stroke="rgba(var(--color-accent-rgb), 0.55)" stroke-width="0.6" />
    <path d="${inner}" fill="none" stroke="rgba(var(--color-accent-rgb), 0.4)" stroke-width="0.4" />
  </svg>`;
}

// Small flying hummingbird — side profile, wings spread, iridescent body.
export function hummingbirdSVG() {
  return `<svg class="hummingbird-svg" viewBox="0 0 60 40" aria-hidden="true">
    <path d="M4 20c6-3 12-2 16 2 2-8 8-14 16-14-4 5-6 10-5 15 4-1 8 0 11 3-5 2-10 2-14 0-3 3-8 4-12 2 3 3 3 6 0 8-2-3-6-4-9-3 2-3 1-7-3-8-4-1-8-3-10-5z" fill="var(--color-accent)" />
    <circle cx="34" cy="17" r="1.6" fill="#2a1f1c" />
    <path d="M34 15c4-2 8-2 11 0-3 1-7 1-11 0z" fill="var(--color-accent)" opacity="0.7" />
  </svg>`;
}

// Cascading wisteria-style floral vine (pink/cream), for the hero badge's
// hanging florals.
export function wisteriaClusterSVG() {
  return `<svg class="hero-floral-svg" viewBox="0 0 100 200" aria-hidden="true">
    <path d="M50 0 C 48 40, 54 80, 48 120 S 52 170, 50 200" fill="none" stroke="var(--color-accent-soft)" stroke-width="2" opacity="0.7" />
    <g fill="#e9b8c8">
      ${[30, 55, 80, 105, 130, 150].map((y, i) => `<ellipse cx="${50 + (i % 2 === 0 ? -14 : 14)}" cy="${y}" rx="16" ry="9" transform="rotate(${i % 2 === 0 ? -18 : 18} ${50 + (i % 2 === 0 ? -14 : 14)} ${y})" opacity="${0.55 + (i % 3) * 0.12}" />`).join("")}
    </g>
    <g fill="#f7e3ea">
      ${[40, 65, 90, 115, 140].map((y, i) => `<circle cx="${50 + (i % 2 === 0 ? 6 : -6)}" cy="${y}" r="6" opacity="0.8" />`).join("")}
    </g>
  </svg>`;
}

// Bold magenta calla-lily cluster, for the hero badge's other hanging
// floral corner.
export function callaLilyClusterSVG() {
  const lily = (x, y, rot, scale) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})">
    <path d="M0 0 C -14 4, -16 22, -2 34 C 4 24, 4 10, 0 0 Z" fill="var(--color-primary-deep)" />
    <path d="M0 2 C -6 8, -6 18, 0 26" fill="none" stroke="var(--color-primary)" stroke-width="1.4" opacity="0.6" />
    <line x1="0" y1="0" x2="4" y2="30" stroke="var(--color-accent-soft)" stroke-width="2" />
  </g>`;
  return `<svg class="hero-floral-svg" viewBox="0 0 100 140" aria-hidden="true">
    ${lily(45, 10, -12, 1.5)}
    ${lily(65, 25, 14, 1.2)}
    ${lily(30, 35, -22, 1.1)}
    <path d="M50 0c-4 20-2 40 4 60" fill="none" stroke="var(--color-accent-soft)" stroke-width="2" opacity="0.6" />
  </svg>`;
}

// Simplified grand-hall illustration placeholder for the hero — arched
// doorway + balcony with a garland, a chandelier, rows of aisle chairs
// with topiary trees receding toward the back, an aisle runner, and a
// small embracing couple at the center. Cream/gold palette, hand-drawn
// flat shapes (loops generate the repeated chairs/topiary/garland dots
// rather than hand-placing each one). This is a placeholder standing in
// for a real commissioned illustration — see NOTES.md asset list.
export function hallIllustrationSVG() {
  function chair(x, y, scale) {
    return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="#8a7550" stroke-width="1.6">
      <path d="M-7 0 L-7 -14 Q0 -18 7 -14 L7 0" />
      <path d="M-7 0 L-7 10 M7 0 L7 10 M-5 0 L-5 10 M5 0 L5 10" />
      <ellipse cx="0" cy="-15" rx="6" ry="2.4" fill="#fff" stroke="none" opacity="0.85" />
    </g>`;
  }
  function topiary(x, y, scale) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">
      <rect x="-4" y="0" width="8" height="10" fill="#8a6a3f" />
      <path d="M0 -34 C-13 -20, -13 -4, 0 2 C13 -4, 13 -20, 0 -34 Z" fill="var(--color-accent-soft)" opacity="0.85" />
    </g>`;
  }
  const leftChairs = [0, 1, 2].map((i) => chair(70 - i * 16, 240 - i * 34, 1 - i * 0.22)).join("");
  const rightChairs = [0, 1, 2].map((i) => chair(330 + i * 16, 240 - i * 34, 1 - i * 0.22)).join("");
  const leftTopiary = [0, 1].map((i) => topiary(48 - i * 10, 214 - i * 46, 1 - i * 0.3)).join("");
  const rightTopiary = [0, 1].map((i) => topiary(352 + i * 10, 214 - i * 46, 1 - i * 0.3)).join("");
  const balusters = Array.from({ length: 24 }, (_, i) => {
    const x = 40 + i * 14;
    return `<line x1="${x}" y1="92" x2="${x}" y2="104" stroke="var(--color-accent-soft)" stroke-width="2" />`;
  }).join("");
  const garlandDots = Array.from({ length: 18 }, (_, i) => {
    const x = 130 + i * 8;
    const y = 78 + Math.sin(i * 0.9) * 3;
    return `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff" opacity="0.9" />`;
  }).join("");
  const chandelierArms = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    const x2 = 200 + Math.cos(angle) * 16;
    const y2 = 42 + Math.sin(angle) * 6 + 6;
    return `<line x1="200" y1="42" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--color-accent)" stroke-width="1.2" /><circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="2" fill="var(--color-accent-soft)" />`;
  }).join("");

  return `<svg class="hero-hall-svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <linearGradient id="hall-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f6e9cf" />
        <stop offset="100%" stop-color="#fbf3e4" />
      </linearGradient>
    </defs>
    <rect width="400" height="260" fill="url(#hall-bg)" />

    <!-- back wall + arched doorway -->
    <rect x="0" y="20" width="400" height="90" fill="#efdcb8" opacity="0.6" />
    <path d="M160 190 L160 90 A40 40 0 0 1 240 90 L240 190 Z" fill="#e3c98f" opacity="0.8" />
    <path d="M160 190 L160 90 A40 40 0 0 1 240 90 L240 190" fill="none" stroke="#8a6a3f" stroke-width="1.4" opacity="0.6" />

    <!-- balcony railing + garland -->
    <line x1="30" y1="104" x2="370" y2="104" stroke="#8a6a3f" stroke-width="2" />
    <line x1="30" y1="92" x2="370" y2="92" stroke="#8a6a3f" stroke-width="1.4" opacity="0.7" />
    ${balusters}
    ${garlandDots}

    <!-- chandelier -->
    <line x1="200" y1="0" x2="200" y2="42" stroke="var(--color-accent)" stroke-width="1.4" />
    <ellipse cx="200" cy="44" rx="10" ry="4" fill="var(--color-accent-soft)" />
    ${chandelierArms}

    <!-- aisle runner -->
    <path d="M170 260 L230 260 L212 190 L188 190 Z" fill="#f3e6c8" opacity="0.8" />

    ${leftTopiary}${rightTopiary}
    ${leftChairs}${rightChairs}

    <!-- couple, small and centered near the arch -->
    <g transform="translate(200 172)">
      <path d="M-10 40 Q-11 16 0 12 Q11 16 10 40 Z" fill="var(--color-primary)" />
      <circle cx="-4" cy="4" r="5.2" fill="#e3ac7c" />
      <path d="M-10 42 Q-9 10 -1 4 Q4 12 4 42 Z" fill="#fdfaf5" transform="translate(9 0)" />
      <circle cx="6" cy="4" r="5.2" fill="#e3ac7c" />
    </g>
  </svg>`;
}

// Dense pink/gold dahlia-bloom band — a placeholder for a real
// photographic floral strip (see NOTES.md asset list), acting as a rich
// section divider before RSVP. Each "bloom" is a ring of overlapping
// petal ellipses around a dark center, tiled with jitter so the repeat
// isn't obvious at a glance.
export function dahliaBandSVG() {
  function bloom(cx, cy, r, tone) {
    const petals = 10;
    let out = "";
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      const px = cx + Math.cos(angle) * r * 0.55;
      const py = cy + Math.sin(angle) * r * 0.55;
      out += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${(r * 0.5).toFixed(1)}" ry="${(r * 0.32).toFixed(1)}" transform="rotate(${((angle * 180) / Math.PI).toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})" fill="${tone}" />`;
    }
    out += `<circle cx="${cx}" cy="${cy}" r="${r * 0.28}" fill="#2a0f14" opacity="0.8" />`;
    return out;
  }

  const tones = ["var(--color-accent)", "var(--color-accent-soft)", "var(--color-primary)", "var(--color-primary-deep)"];
  let blooms = "";
  const positions = [
    [40, 55, 34], [110, 35, 30], [175, 60, 36], [235, 30, 28], [300, 55, 34],
    [365, 32, 30], [70, 20, 24], [150, 22, 22], [265, 22, 24], [335, 20, 22],
  ];
  positions.forEach(([x, y, r], i) => {
    blooms += bloom(x, y, r, tones[i % tones.length]);
  });
  // A few metallic/glitter highlight flecks.
  const flecks = Array.from({ length: 14 }, () => {
    const x = (Math.random() * 400).toFixed(1);
    const y = (Math.random() * 90).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="1.4" fill="var(--color-accent-soft)" opacity="${(0.4 + Math.random() * 0.4).toFixed(2)}" />`;
  }).join("");

  return `<svg class="dahlia-band-svg" viewBox="0 0 400 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="90" fill="var(--color-primary-deep)" />
    ${blooms}
    ${flecks}
  </svg>`;
}

// Glossy 3D-look pink wax-seal heart for the closing section — a
// radial-gradient fill (light highlight upper-left, deep pink edges)
// plus a small white gloss ellipse overlay, standing in for the reference's
// raised/highlighted wax-seal heart rather than a flat outline icon.
export function waxSealHeartSVG() {
  return `<svg class="wax-seal-heart-svg" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <radialGradient id="wax-heart-grad" cx="34%" cy="28%" r="75%">
        <stop offset="0%" stop-color="var(--color-accent-soft)" />
        <stop offset="45%" stop-color="var(--color-primary)" />
        <stop offset="100%" stop-color="var(--color-primary-deep)" />
      </radialGradient>
    </defs>
    <path d="M50 88s-30-18.7-39.6-37.5C4.3 39.6 8.3 24 21 24c8.3 0 14.6 5 17.9 10.6C42.2 29 48.5 24 56.8 24c12.7 0 16.7 15.6 10.6 26.5C58.2 69.3 50 88 50 88z" fill="url(#wax-heart-grad)" />
    <ellipse cx="36" cy="38" rx="10" ry="6" fill="#fff" opacity="0.35" transform="rotate(-30 36 38)" />
  </svg>`;
}

// Two crossing corner-to-corner diagonals — the classic envelope-flap X
// seam. Drawn as an SVG with preserveAspectRatio="none" so the lines stay
// pinned exactly to the four corners at any box aspect ratio, and
// vector-effect="non-scaling-stroke" keeps the stroke a constant width
// despite the non-uniform scale that requires.
export function envelopeFoldLinesSVG() {
  return `<svg class="envelope-fold-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <line x1="0" y1="0" x2="100" y2="100" vector-effect="non-scaling-stroke" />
    <line x1="100" y1="0" x2="0" y2="100" vector-effect="non-scaling-stroke" />
  </svg>`;
}
