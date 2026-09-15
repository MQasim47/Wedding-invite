import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { getLang } from "../utils/store.js";

function buildLines() {
  const paragraphs = config.welcomeMessage[getLang()] || config.welcomeMessage.en;
  return paragraphs.map((paragraph) => el("span", { class: "line fade-up" }, paragraph));
}

export function createWelcomeSection() {
  const textWrap = el("p", { class: "welcome-text" }, buildLines());

  const node = el("section", { class: "section welcome", id: "welcome" }, [
    el("div", { class: "welcome-frame" }, [textWrap]),
  ]);

  function updateLang() {
    textWrap.replaceChildren(...buildLines());
  }

  return { node, updateLang };
}
