import { config } from "../config.js";
import { fromHTML } from "../utils/dom.js";
import { DAMASK_CELL_W } from "../utils/damask.js";
import { DAMASK_SCALE } from "../utils/envelopeArt.js";
import { decorSprite, cornerSVG, crestSVG, damaskWatermark, PAPER_GRAIN_URL } from "../utils/decorArt.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The major sections that carry corner flourishes, and the corners used: two
// opposite ones (top-left, bottom-right) rather than all four.
const FLOURISH_SECTIONS = ["welcome", "story", "wedding-party", "venue", "rsvp", "closing"];

// Interior decoration: the envelope's damask-and-gold language carried inside
// the invitation. Every piece is behind a flag in config.decor. Nothing here
// paints while the envelope is up — the markup is created now (so layout is
// settled) but hidden, and reveal() switches it on once the envelope has gone.
//
//   damaskWatermark  the envelope's damask tile, flat gold at ~4%, as a
//                    background layer under everything
//   paperTexture     an ivory paper grain on that same layer, plus a soft
//                    emboss on frames and cards (CSS, gated by .decor-paper)
//   cornerFlourishes ornate acanthus brackets, drawn in as they scroll into view
//   monogram         the D&A crest in the hero and the closing
//
// The watermark and grain live on ONE element that is the app shell's first
// child, so they can only ever sit behind the sections' own content.
export function initDecor({ appShell, heroSection, closingSection }) {
  const flags = config.decor || {};
  const { damaskWatermark: wantWatermark, paperTexture: wantPaper, cornerFlourishes: wantCorners, monogram: wantCrest } = flags;
  if (!(wantWatermark || wantPaper || wantCorners || wantCrest)) return { reveal() {} };

  if (wantCorners || wantCrest) {
    appShell.prepend(
      fromHTML(decorSprite({ corner: wantCorners, crest: wantCrest, initials: config.couple.initials }))
    );
  }

  if (wantCorners) {
    for (const id of FLOURISH_SECTIONS) {
      const section = appShell.querySelector(`#${id}`);
      if (section) section.prepend(fromHTML(cornerSVG("tl")), fromHTML(cornerSVG("br")));
    }
  }

  if (wantCrest) {
    const wrap = () => {
      const node = fromHTML(`<div class="decor-crest-wrap"></div>`);
      node.appendChild(fromHTML(crestSVG()));
      return node;
    };
    const names = heroSection?.node.querySelector(".hero-badge-content");
    if (names) {
      names.prepend(wrap());
      heroSection.node.classList.add("has-crest"); // the hanging florals re-anchor for the taller badge
    }
    const closing = closingSection?.node;
    if (closing) closing.querySelector(".closing-with-love")?.before(wrap());
  }

  let backdrop = null;
  if (wantWatermark || wantPaper) {
    backdrop = fromHTML(`<div class="decor-bg" aria-hidden="true"></div>`);
    appShell.prepend(backdrop);
  }

  // Centre one motif column on the page's axis, as the envelope does, so the
  // watermark is mirror-symmetric about the middle at any width.
  let tile = null;
  function paintBackdrop() {
    const layers = [];
    const sizes = [];
    const positions = [];
    if (wantPaper) {
      layers.push(PAPER_GRAIN_URL);
      sizes.push("180px 180px");
      positions.push("0 0");
    }
    if (wantWatermark) {
      tile ??= damaskWatermark({
        color: getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || config.theme.accent,
        opacity: flags.damaskOpacity ?? 0.04,
      });
      layers.push(`url("${tile.url}")`);
      sizes.push(`${tile.width}px ${tile.height}px`);
      positions.push(`${(appShell.clientWidth / 2 - (DAMASK_CELL_W / 2) * DAMASK_SCALE).toFixed(1)}px 0`);
    }
    backdrop.style.backgroundImage = layers.join(",");
    backdrop.style.backgroundSize = sizes.join(",");
    backdrop.style.backgroundPosition = positions.join(",");
  }

  function reveal() {
    appShell.classList.add("decor-live");
    if (wantPaper) appShell.classList.add("decor-paper");

    if (backdrop) {
      paintBackdrop();
      if (wantWatermark) new ResizeObserver(paintBackdrop).observe(appShell);
    }

    const drawn = appShell.querySelectorAll(".decor-corner, .decor-crest");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      drawn.forEach((node) => node.classList.add("is-drawn"));
      return;
    }
    // Draw each ornament as it scrolls into view (the bottom-right corner of a
    // section draws when the reader gets there, not when the section starts).
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-drawn");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    drawn.forEach((node) => observer.observe(node));
  }

  return { reveal };
}
