import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t } from "../utils/store.js";
import { envelopePattern } from "../utils/icons.js";

// Full-screen envelope gate. Returns { node, sealBtn } — main.js wires the
// tap handler (which must also unlock audio playback) via animations/envelope.js.
export function createEnvelopeSection() {
  const hint = el("p", { class: "envelope-hint" }, t().envelope.hint);

  const seal = el("div", { class: "envelope-seal" }, [
    el(
      "button",
      { class: "envelope-seal-btn", type: "button", "aria-label": t().envelope.hint },
      config.couple.initials
    ),
  ]);

  const particles = el("div", { class: "envelope-particles", "aria-hidden": "true" });

  const box = el("div", { class: "envelope-box" }, [
    el("div", { class: "envelope-back" }, [fromHTML(envelopePattern())]),
    el("div", { class: "envelope-flap" }),
    seal,
    particles,
    hint,
  ]);

  const node = el("div", { class: "envelope-screen", "data-open": "false" }, [box]);

  return { node, sealBtn: seal.querySelector(".envelope-seal-btn"), flap: node.querySelector(".envelope-flap"), particlesEl: particles, hintEl: hint };
}
