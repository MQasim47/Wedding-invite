import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { laceDoilySVG } from "../utils/icons.js";

function buildLines() {
  const paragraphs = config.welcomeMessage[getLang()] || config.welcomeMessage.en;
  return paragraphs.map((paragraph) => el("span", { class: "line fade-up" }, paragraph));
}

export function createWelcomeSection() {
  const heading = el("h2", { class: "welcome-heading" }, t().welcome.heading);
  const textWrap = el("p", { class: "welcome-text" }, buildLines());

  const node = el("section", { class: "section welcome", id: "welcome" }, [
    el("div", { class: "welcome-frame" }, [
      fromHTML(laceDoilySVG()),
      el("div", { class: "welcome-frame-content" }, [heading, textWrap]),
    ]),
  ]);

  function updateLang() {
    heading.textContent = t().welcome.heading;
    textWrap.replaceChildren(...buildLines());
  }

  return { node, updateLang };
}
