import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { icons } from "../utils/icons.js";

export function createClosingSection() {
  const namesEl = el("h2", { class: "section-title" }, `${config.couple.partner1} & ${config.couple.partner2}`);
  const messageEl = el("p", { class: "closing-message" }, config.closingMessage[getLang()] || config.closingMessage.en);
  const footerEl = el("p", { class: "closing-footer" }, t().closing.footer);

  const node = el("section", { class: "section closing", id: "closing" }, [
    el("div", { class: "closing-seal", html: icons.heart }),
    namesEl,
    messageEl,
    el("footer", {}, [footerEl]),
  ]);

  function updateLang() {
    messageEl.textContent = config.closingMessage[getLang()] || config.closingMessage.en;
    footerEl.textContent = t().closing.footer;
  }

  return { node, updateLang };
}
