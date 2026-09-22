import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { getLang } from "../utils/store.js";
import { laceDoilySVG } from "../utils/icons.js";

function buildLines() {
  const paragraphs = config.welcomeMessage[getLang()] || config.welcomeMessage.en;
  return paragraphs.map((paragraph) => el("span", { class: "line fade-up" }, paragraph));
}

// No heading here by design (the client asked for "Dear guests!"/"Chers
// invités !" to be dropped) — the personalized "Dear {Name}," greeting in
// sections/greeting.js is a separate, earlier section and is unaffected.
export function createWelcomeSection() {
  const textWrap = el("p", { class: "welcome-text" }, buildLines());

  const node = el("section", { class: "section welcome", id: "welcome" }, [
    el("div", { class: "welcome-frame" }, [
      fromHTML(laceDoilySVG()),
      el("div", { class: "welcome-frame-content" }, [textWrap]),
    ]),
  ]);

  function updateLang() {
    textWrap.replaceChildren(...buildLines());
  }

  return { node, updateLang };
}
