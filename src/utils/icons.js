// Inline SVG line-icon markup. Static, trusted strings only — never used
// with dynamic/user-supplied content, so innerHTML use here is safe.

export const icons = {
  rings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/></svg>`,
  glasses: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 15c0 3 2 5 4 5s4-2 4-5-1-6-4-6-4 3-4 6z"/><path d="M13 15c0 3 2 5 4 5s4-2 4-5-1-6-4-6-4 3-4 6z"/><path d="M11 6l2 2 2-2"/></svg>`,
  dinner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3v8a2 2 0 004 0V3M8 11v10M16 3c-1.5 1-2 3-2 5 0 1.5.8 2.5 2 3v9"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20s-7-4.5-9.5-9C.8 7.5 2.5 4 6 4c2 0 3.5 1.2 4 2.5C10.5 5.2 12 4 14 4c3.5 0 5.2 3.5 3.5 7-2.5 4.5-9.5 9-9.5 9z"/></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  mute: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9v6h4l5 4V5L8 9H4z"/><line x1="16" y1="9" x2="21" y2="14"/><line x1="21" y1="9" x2="16" y2="14"/></svg>`,
  unmute: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7"/><path d="M19 6a9 9 0 010 12"/></svg>`,
  check: `<svg class="rsvp-success-check" viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"/><path d="M15 27l7 7 15-15"/></svg>`,
  divider: `<svg viewBox="0 0 80 24" fill="none" stroke="currentColor" stroke-width="1"><line x1="0" y1="12" x2="28" y2="12"/><circle cx="40" cy="12" r="4" fill="currentColor" stroke="none"/><line x1="52" y1="12" x2="80" y2="12"/></svg>`,
  heartOutlineDraw: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path class="heart-draw-path" d="M12 20s-7-4.5-9.5-9C.8 7.5 2.5 4 6 4c2 0 3.5 1.2 4 2.5C10.5 5.2 12 4 14 4c3.5 0 5.2 3.5 3.5 7-2.5 4.5-9.5 9-9.5 9z"/></svg>`,
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
