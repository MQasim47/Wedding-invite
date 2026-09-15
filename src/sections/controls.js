import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang, toggleLang } from "../utils/store.js";
import { icons } from "../utils/icons.js";

// Floating mute/unmute + language toggle buttons. Hidden until the
// envelope is opened (main.js flips data-visible once music can play).
// `audioAvailable` is false when music is disabled in config OR the
// configured audio file doesn't exist on disk — either way, no button.
export function createControls({ audioAvailable } = {}) {
  const musicBtn = audioAvailable
    ? el("button", {
        class: "control-btn music-btn",
        type: "button",
        "aria-label": t().music.pause,
        html: icons.unmute,
      })
    : null;

  const langBtn =
    config.language === "bilingual"
      ? el("button", { class: "control-btn lang-btn", type: "button" }, t().langToggle)
      : null;

  langBtn?.addEventListener("click", () => {
    toggleLang();
  });

  const node = el("div", { class: "floating-controls", "data-visible": "false" }, [musicBtn, langBtn].filter(Boolean));

  let isPlaying = false;

  function setMusicPlaying(playing) {
    isPlaying = playing;
    if (!musicBtn) return;
    musicBtn.innerHTML = playing ? icons.unmute : icons.mute;
    musicBtn.setAttribute("aria-label", playing ? t().music.pause : t().music.play);
  }

  function updateLang() {
    if (langBtn) langBtn.textContent = t().langToggle;
    if (musicBtn) musicBtn.setAttribute("aria-label", isPlaying ? t().music.pause : t().music.play);
  }

  function show() {
    node.setAttribute("data-visible", "true");
  }

  return { node, musicBtn, setMusicPlaying, updateLang, show };
}
