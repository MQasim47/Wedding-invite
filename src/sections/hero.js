import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { pendantChainSVG } from "../utils/icons.js";

function splitLetters(text) {
  return [...text].map((ch) =>
    el("span", { class: "letter" }, ch === " " ? " " : ch)
  );
}

function formatDate(lang) {
  const date = new Date(config.weddingDate);
  const formatted = new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", t().hero.dateFormat).format(date);
  return formatted;
}

export function createHeroSection() {
  const name1 = el("span", { class: "hero-name-1" }, splitLetters(config.couple.partner1));
  const amp = el("span", { class: "hero-ampersand" }, "&");
  const name2 = el("span", { class: "hero-name-2" }, splitLetters(config.couple.partner2));

  const dateEl = el("p", { class: "hero-date" }, formatDate(getLang()));

  const chainsEl = fromHTML(pendantChainSVG());
  const badge = el("div", { class: "hero-badge" }, [
    el("div", { class: "hero-names", "aria-hidden": "true" }, [name1, amp, name2]),
  ]);
  const pendant = el("div", { class: "hero-pendant" }, [chainsEl, badge]);

  const node = el("section", { class: "section hero", id: "hero" }, [
    el("h1", { class: "hero-names sr-only" }, `${config.couple.partner1} & ${config.couple.partner2}`),
    pendant,
    dateEl,
    el("div", { class: "hero-photo-frame" }, [
      el("div", { class: "hero-photo-placeholder" }, "Couple photo placeholder — replace in /public/images"),
    ]),
  ]);

  function updateLang() {
    dateEl.textContent = formatDate(getLang());
  }

  return {
    node,
    updateLang,
    pendantNode: pendant,
    shimmerNode: chainsEl.querySelector(".pendant-shimmer"),
  };
}
