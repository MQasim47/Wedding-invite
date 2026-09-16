import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t } from "../utils/store.js";
import { icons } from "../utils/icons.js";

// Reads the calendar date directly from the ISO string's own date digits
// (see the matching comment in sections/hero.js) so it can't roll over to
// the next/previous day for a guest in a different timezone.
function weddingDateParts() {
  const match = config.weddingDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const [, y, m, d] = match;
  return { year: Number(y), month: Number(m) - 1, day: Number(d) };
}

// The single week (Sun-Sat) containing the wedding day — not the whole
// month grid. Days that spill into the previous/next month still show
// their real numbers (normal calendar-strip behavior).
function weekRow() {
  const { year, month, day } = weddingDateParts();
  const base = new Date(year, month, day);
  const startOffset = base.getDay();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(year, month, day - startOffset + i);
    days.push({ dayNum: d.getDate(), isWedding: i === startOffset });
  }
  return days;
}

export function createCalendarSection() {
  const monthLabel = el("p", { class: "calendar-month" });
  const weekRowEl = el("div", { class: "calendar-week-row" });

  function render() {
    const { month, year } = weddingDateParts();
    monthLabel.textContent = `${t().calendar.months[month]} ${year}`;
    weekRowEl.replaceChildren(
      ...weekRow().map((entry, i) =>
        el("div", { class: "calendar-week-day" }, [
          el("span", { class: "calendar-weekday" }, t().calendar.weekdays[i]),
          entry.isWedding
            ? el("span", { class: "calendar-day-heart" }, [
                el("span", { class: "calendar-day-heart-icon", html: icons.heartSolid }),
                el("span", { class: "calendar-day-heart-num" }, String(entry.dayNum)),
              ])
            : el("span", { class: "calendar-day-num" }, String(entry.dayNum)),
        ])
      )
    );
  }
  render();

  const node = el("section", { class: "section calendar", id: "calendar" }, [
    el("h2", { class: "section-title-serif" }, t().calendar.title),
    monthLabel,
    weekRowEl,
    el("div", { class: "lace-ribbon", "aria-hidden": "true" }),
  ]);

  function updateLang() {
    render();
    node.querySelector(".section-title-serif").textContent = t().calendar.title;
  }

  return { node, updateLang };
}
