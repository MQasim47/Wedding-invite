import { el, fromHTML } from "../utils/dom.js";
import { dahliaBandSVG } from "../utils/icons.js";

// A dense dahlia-bloom band acting as a section divider between the
// countdown and RSVP — see reference frame_026_0s. Placeholder art (see
// utils/icons.js) standing in for a real photographic floral strip.
export function createFlowerBandSection() {
  const node = el("div", { class: "flower-band", "aria-hidden": "true" }, [
    el("div", { class: "flower-band-inner" }, [fromHTML(dahliaBandSVG())]),
  ]);
  return { node };
}
