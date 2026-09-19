import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { companionCoupleSVG, companionRingSVG } from "../utils/icons.js";

// Builds the floating companion illustration. Content depends on
// config.companion.type: "svg" (default) draws the built-in couple
// illustration, "image" renders a <img>, "lottie" lazy-loads lottie-web
// only when this type is actually selected so it costs nothing otherwise.
//
// DOM has two nested layers on purpose: the outer <button> is what
// show/hide-for-RSVP/fly-to-closing animate (opacity, x, y, scale), and
// the inner .companion-inner is what the continuous idle bob animates —
// keeping them on separate elements means the two animations never fight
// over the same GSAP-animated property on the same target.
export function createCompanionSection({ onTap } = {}) {
  if (!config.companion.enabled) return null;

  const artEl = el("span", { class: "companion-art" });
  // Gold ring matching the Wedding Party avatars — purely decorative, so it
  // sits behind/around .companion-art rather than inside it.
  const inner = el("span", { class: "companion-inner" }, [fromHTML(companionRingSVG()), artEl]);
  const heartsEl = el("span", { class: "companion-hearts", "aria-hidden": "true" });

  const node = el(
    "button",
    {
      class: "companion",
      type: "button",
      "aria-label": t().companion.label,
      "data-visible": "false",
      "data-position": config.companion.position || "bottom-left",
    },
    [inner, heartsEl]
  );

  const imgEl = loadArt(artEl);

  node.addEventListener("click", () => onTap?.());

  function show() {
    node.setAttribute("data-visible", "true");
  }

  function updateLang() {
    node.setAttribute("aria-label", t().companion.label);
    if (imgEl && config.companion.alt) {
      imgEl.alt = config.companion.alt[getLang()] || config.companion.alt.en;
    }
  }

  return { node, innerNode: inner, heartsEl, show, updateLang };
}

// Returns the created <img> element when type is "image" (so alt text can
// be kept in sync on language change), or undefined otherwise.
function loadArt(artEl) {
  const { type, src, alt } = config.companion;

  if (type === "image" && src) {
    const initialAlt = (alt && (alt[getLang()] || alt.en)) || "";
    const img = el("img", { src, alt: initialAlt, loading: "lazy", decoding: "async" });
    artEl.appendChild(img);
    return img;
  }

  if (type === "lottie" && src) {
    import("lottie-web/build/player/esm/lottie_light.min.js")
      .then((mod) => {
        const lottie = mod.default ?? mod;
        lottie.loadAnimation({
          container: artEl,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: src,
        });
      })
      .catch(() => {
        console.warn("[companion] Failed to load the Lottie file — falling back to the default illustration.");
        artEl.appendChild(fromHTML(companionCoupleSVG()));
      });
    return;
  }

  // "svg" (default), or a misconfigured lottie/image entry with no src.
  artEl.appendChild(fromHTML(companionCoupleSVG()));
}
