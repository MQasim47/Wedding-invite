import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { waxSealHeartSVG } from "../utils/icons.js";

export function createClosingSection() {
  const watermark = el("div", { class: "closing-watermark", "aria-hidden": "true" }, t().closing.withLove);
  const withLoveEl = el("p", { class: "closing-with-love" }, t().closing.withLove);

  const name1 = el("span", { class: "closing-name notranslate", translate: "no" }, config.couple.partner1);
  const amp = el("span", { class: "closing-amp" }, "&");
  const name2 = el("span", { class: "closing-name notranslate", translate: "no" }, config.couple.partner2);
  const namesWrap = el("div", { class: "closing-names" }, [name1, amp, name2]);

  const sealEl = el("div", { class: "closing-seal" }, [fromHTML(waxSealHeartSVG())]);
  const waitingEl = el("p", { class: "closing-waiting" }, t().closing.waitingForYou);

  const messageEl = el("p", { class: "closing-message" }, config.closingMessage[getLang()] || config.closingMessage.en);
  const footerEl = el("p", { class: "closing-footer" }, t().closing.footer);

  const node = el("section", { class: "section closing", id: "closing" }, [
    watermark,
    withLoveEl,
    namesWrap,
    el("div", { class: "closing-heart-row" }, [sealEl, waitingEl]),
    messageEl,
    el("footer", {}, [footerEl]),
  ]);

  function updateLang() {
    watermark.textContent = t().closing.withLove;
    withLoveEl.textContent = t().closing.withLove;
    waitingEl.textContent = t().closing.waitingForYou;
    messageEl.textContent = config.closingMessage[getLang()] || config.closingMessage.en;
    footerEl.textContent = t().closing.footer;
  }

  return { node, updateLang, namesWrap, sealEl };
}
