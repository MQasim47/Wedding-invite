import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import {
  pendantChainSVG,
  badgeCartoucheSVG,
  hallIllustrationSVG,
  hummingbirdSVG,
  wisteriaClusterSVG,
  callaLilyClusterSVG,
} from "../utils/icons.js";

// Reads the date directly from the ISO string's own digits (see the same
// pattern/comment in sections/calendar.js) so the badge date doesn't shift
// a day for guests in a different timezone than weddingDate's own offset.
function weddingDateParts() {
  const match = config.weddingDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m) - 1;
  const day = Number(d);
  const weekday = new Date(year, month, day).getDay();
  return { year, month, day, weekday };
}

function taglineText(lang) {
  return config.couple.tagline[lang] || config.couple.tagline.en;
}

export function createHeroSection() {
  const name1 = el(
    "span",
    { class: "hero-name-1 name-reveal", style: "visibility: hidden;" },
    config.couple.partner1
  );
  const amp = el("span", { class: "hero-ampersand" }, "&");
  const name2 = el(
    "span",
    { class: "hero-name-2 name-reveal", style: "visibility: hidden;" },
    config.couple.partner2
  );

  const taglineEl = el("p", { class: "hero-tagline" }, taglineText(getLang()));

  const dateWeekday = el("span", { class: "hero-badge-date-part" });
  const dateDay = el("span", { class: "hero-badge-date-part hero-badge-date-day" });
  const dateMonth = el("span", { class: "hero-badge-date-part" });
  const dateLine = el("div", { class: "hero-badge-date" }, [
    dateWeekday,
    el("span", { class: "hero-badge-date-divider" }, "|"),
    dateDay,
    el("span", { class: "hero-badge-date-divider" }, "|"),
    dateMonth,
  ]);

  function renderBadgeDate() {
    const { month, day, weekday } = weddingDateParts();
    const dict = t();
    dateWeekday.textContent = dict.calendar.weekdaysFull[weekday];
    dateDay.textContent = String(day);
    dateMonth.textContent = dict.calendar.months[month];
  }
  renderBadgeDate();

  const chainsEl = fromHTML(pendantChainSVG());
  const badge = el("div", { class: "hero-badge" }, [
    fromHTML(badgeCartoucheSVG()),
    el("div", { class: "hero-badge-content" }, [
      el("div", { class: "hero-names", "aria-hidden": "true" }, [name1, amp, name2]),
      dateLine,
    ]),
  ]);
  const pendant = el("div", { class: "hero-pendant" }, [chainsEl, badge]);

  const wisteria = el("div", { class: "hero-floral hero-floral-left" }, [fromHTML(wisteriaClusterSVG())]);
  const callaLily = el("div", { class: "hero-floral hero-floral-right" }, [fromHTML(callaLilyClusterSVG())]);
  const hummingbird = el("div", { class: "hero-hummingbird" }, [fromHTML(hummingbirdSVG())]);

  const illustration = el("div", { class: "hero-illustration" }, [
    el("div", { class: "hero-illustration-inner" }, [fromHTML(hallIllustrationSVG())]),
    el("div", { class: "hero-lace-border" }),
  ]);

  const node = el("section", { class: "section hero", id: "hero" }, [
    el("h1", { class: "hero-names sr-only" }, `${config.couple.partner1} & ${config.couple.partner2}`),
    illustration,
    hummingbird,
    el("div", { class: "hero-badge-wrap" }, [wisteria, pendant, callaLily]),
    taglineEl,
  ]);

  function updateLang() {
    taglineEl.textContent = taglineText(getLang());
    renderBadgeDate();
  }

  return {
    node,
    updateLang,
    pendantNode: pendant,
    shimmerNode: chainsEl.querySelector(".pendant-shimmer"),
    illustrationNode: illustration,
    hummingbirdNode: hummingbird,
    floralNodes: [wisteria, callaLily],
  };
}
