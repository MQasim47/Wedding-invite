import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { getLang } from "../utils/store.js";
import { pendantChainSVG } from "../utils/icons.js";

function splitLetters(text) {
  return [...text].map((ch) =>
    el("span", { class: "letter" }, ch === " " ? " " : ch)
  );
}

function dateText(lang) {
  return config.weddingDateDisplay[lang] || config.weddingDateDisplay.en;
}

function taglineText(lang) {
  return config.couple.tagline[lang] || config.couple.tagline.en;
}

export function createHeroSection() {
  const name1 = el("span", { class: "hero-name-1" }, splitLetters(config.couple.partner1));
  const amp = el("span", { class: "hero-ampersand" }, "&");
  const name2 = el("span", { class: "hero-name-2" }, splitLetters(config.couple.partner2));

  const taglineEl = el("p", { class: "hero-tagline" }, taglineText(getLang()));
  const dateEl = el("p", { class: "hero-date" }, dateText(getLang()));

  const chainsEl = fromHTML(pendantChainSVG());
  const badge = el("div", { class: "hero-badge" }, [
    el("div", { class: "hero-names", "aria-hidden": "true" }, [name1, amp, name2]),
  ]);
  const pendant = el("div", { class: "hero-pendant" }, [chainsEl, badge]);

  const node = el("section", { class: "section hero", id: "hero" }, [
    el("h1", { class: "hero-names sr-only" }, `${config.couple.partner1} & ${config.couple.partner2}`),
    pendant,
    taglineEl,
    dateEl,
  ]);

  function updateLang() {
    taglineEl.textContent = taglineText(getLang());
    dateEl.textContent = dateText(getLang());
  }

  return {
    node,
    updateLang,
    pendantNode: pendant,
    shimmerNode: chainsEl.querySelector(".pendant-shimmer"),
  };
}
