import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t } from "../utils/store.js";
import {
  DAMASK_ID,
  damaskPatternTransform,
  envelopeDamaskSVG,
  envelopeShadeSVG,
  envelopeFlapEdgeSVG,
  waxSealSVG,
} from "../utils/envelopeArt.js";

// Full-screen envelope gate. Returns the node plus every element the open
// animation (src/animations/envelope.js) needs to grab directly.
//
// Layer order, back to front: ivory paper + damask relief + grain, fold-seam
// shading, the pink liner (only visible once the flap lifts), golden glow,
// sparkles, the flap (its own copy of the damask, aligned to the same
// pattern), the wax seal, and the hint.
export function createEnvelopeSection() {
  const hint = el("p", { class: "envelope-hint" }, t().envelope.hint);

  const seal = el("div", { class: "envelope-seal" }, [
    el(
      "button",
      { class: "envelope-seal-btn", type: "button", "aria-label": t().envelope.hint },
      [fromHTML(waxSealSVG()), el("span", { class: "envelope-seal-initials notranslate", translate: "no" }, config.couple.initials)]
    ),
  ]);

  const liner = el("div", { class: "envelope-liner" });
  const glow = el("div", { class: "envelope-glow" });
  const sparkleCanvas = el("canvas", { class: "envelope-sparkle-canvas", "aria-hidden": "true" });
  const flash = el("div", { class: "envelope-flash", "aria-hidden": "true" });

  const flap = el("div", { class: "envelope-flap" }, [
    el("div", { class: "envelope-flap-face" }, [
      fromHTML(envelopeDamaskSVG()),
      el("div", { class: "envelope-grain" }),
      fromHTML(envelopeFlapEdgeSVG()),
    ]),
  ]);

  const box = el("div", { class: "envelope-box" }, [
    el("div", { class: "envelope-back" }, [fromHTML(envelopeDamaskSVG({ withDefs: true })), el("div", { class: "envelope-grain" })]),
    fromHTML(envelopeShadeSVG()),
    liner,
    glow,
    sparkleCanvas,
    flap,
    seal,
    hint,
  ]);

  const node = el("div", { class: "envelope-screen", "data-open": "false" }, [box, flash]);

  // Centre the damask on the envelope's axis. The pattern is aligned in
  // user space (not by stretching the SVG), so the tile keeps its scale and
  // stays crisp at any size; a ResizeObserver re-centres it on rotation or
  // when a mobile browser's toolbar changes the viewport height.
  const pattern = box.querySelector(`#${DAMASK_ID}`);
  const align = () => pattern.setAttribute("patternTransform", damaskPatternTransform(box.clientWidth, box.clientHeight));
  const observer = new ResizeObserver(align);
  observer.observe(box);

  return {
    node,
    sealBtn: seal.querySelector(".envelope-seal-btn"),
    flap,
    sealEl: seal,
    glowEl: glow,
    sparkleCanvas,
    flashEl: flash,
    hintEl: hint,
    disconnect: () => observer.disconnect(),
  };
}
