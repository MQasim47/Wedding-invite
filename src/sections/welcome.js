import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { getLang } from "../utils/store.js";

function buildLines() {
  const text = config.welcomeMessage[getLang()] || config.welcomeMessage.en;
  return text.split(". ").filter(Boolean).map((sentence, i, arr) => {
    const full = sentence.trim() + (i < arr.length - 1 ? "." : "");
    return el("span", { class: "line fade-up" }, full);
  });
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
