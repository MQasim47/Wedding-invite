import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t } from "../utils/store.js";
import { sealScallopSVG, envelopeVineSVG, envelopeFoldLinesSVG } from "../utils/icons.js";

// Full-screen envelope gate. Returns the node plus every element the open
// animation (src/animations/envelope.js) needs to grab directly.
export function createEnvelopeSection() {
  const hint = el("p", { class: "envelope-hint" }, t().envelope.hint);

  const seal = el("div", { class: "envelope-seal" }, [
    el(
      "button",
      { class: "envelope-seal-btn", type: "button", "aria-label": t().envelope.hint },
      [fromHTML(sealScallopSVG()), el("span", { class: "envelope-seal-initials" }, config.couple.initials)]
    ),
  ]);

  const glow = el("div", { class: "envelope-glow" });
  const sparkleCanvas = el("canvas", { class: "envelope-sparkle-canvas", "aria-hidden": "true" });
  const flash = el("div", { class: "envelope-flash", "aria-hidden": "true" });
  const foldLines = fromHTML(envelopeFoldLinesSVG());

  const vineLeft = el("div", { class: "envelope-vine envelope-vine-left" }, [fromHTML(envelopeVineSVG())]);
  const vineRight = el("div", { class: "envelope-vine envelope-vine-right" }, [fromHTML(envelopeVineSVG())]);

  const flap = el("div", { class: "envelope-flap" });

  const box = el("div", { class: "envelope-box" }, [
    el("div", { class: "envelope-back" }),
    foldLines,
    vineLeft,
    vineRight,
    glow,
    sparkleCanvas,
    flap,
    seal,
    hint,
  ]);

  const node = el("div", { class: "envelope-screen", "data-open": "false" }, [box, flash]);

  return {
    node,
    sealBtn: seal.querySelector(".envelope-seal-btn"),
    flap,
    sealEl: seal,
    glowEl: glow,
    sparkleCanvas,
    flashEl: flash,
    hintEl: hint,
  };
}
