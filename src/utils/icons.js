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
