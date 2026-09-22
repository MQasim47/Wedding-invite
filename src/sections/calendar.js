import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { icons } from "../utils/icons.js";

// Reads a config.weddingDays date ("YYYY-MM-DD") directly from its own
// digits (see the matching comment in sections/hero.js) so it can't roll
// over to the next/previous day for a guest in a different timezone.
function dateParts(iso) {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const [, y, m, d] = match;
  return { year: Number(y), month: Number(m) - 1, day: Number(d) };
}

// A calendar strip covering every date in config.weddingDays: starts on the
// Sun-Sat week containing the first (primary) day, and extends only as far
// as needed to also reach the last configured day — so a Saturday+Sunday
// weekend shows in one 8-cell strip, while a single day stays a plain
// 7-cell week, and a hypothetical third day further into the next week
// would extend it further still. `highlight` is the index into
// config.weddingDays for a matching cell, or -1.
function buildStrip() {
  const dates = config.weddingDays.map((d) => dateParts(d.date));
  const primary = dates[0];
  const primaryDate = new Date(primary.year, primary.month, primary.day);
  const weekStart = new Date(primary.year, primary.month, primary.day - primaryDate.getDay());
  const last = dates[dates.length - 1];
  const lastDate = new Date(last.year, last.month, last.day);
  const cellCount = Math.max(7, Math.round((lastDate - weekStart) / 86400000) + 1);

  const days = [];
  for (let i = 0; i < cellCount; i++) {
    const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    const highlight = dates.findIndex((hd) => hd.year === d.getFullYear() && hd.month === d.getMonth() && hd.day === d.getDate());
    days.push({ dayNum: d.getDate(), weekdayIndex: i % 7, highlight });
  }
  return days;
}

function heartCell(dayNum, isPrimary) {
  return el("span", { class: `calendar-day-heart${isPrimary ? "" : " calendar-day-heart--minor"}` }, [
    el("span", { class: "calendar-day-heart-icon", html: icons.heartSolid }),
    el("span", { class: "calendar-day-heart-num" }, String(dayNum)),
  ]);
}

export function createCalendarSection() {
  const monthLabel = el("p", { class: "calendar-month" });
  const weekRowEl = el("div", { class: "calendar-week-row" });
  const legendEl = el("div", { class: "calendar-legend" });

  function render() {
    const lang = getLang();
    const primary = dateParts(config.weddingDays[0].date);
    monthLabel.textContent = `${t().calendar.months[primary.month]} ${primary.year}`;

    weekRowEl.replaceChildren(
      ...buildStrip().map((entry) =>
        el("div", { class: "calendar-week-day" }, [
          el("span", { class: "calendar-weekday" }, t().calendar.weekdays[entry.weekdayIndex]),
          entry.highlight === -1
            ? el("span", { class: "calendar-day-num" }, String(entry.dayNum))
            : heartCell(entry.dayNum, entry.highlight === 0),
        ])
      )
    );

    // A short legend so it's obvious which heart is which — only needed
    // once there's more than one highlighted day to tell apart.
    legendEl.replaceChildren(
      ...(config.weddingDays.length > 1
        ? config.weddingDays.map((day, i) =>
            el("span", { class: `calendar-legend-item${i === 0 ? "" : " calendar-legend-item--minor"}` }, [
              el("span", { class: "calendar-legend-dot", html: icons.heartSolid }),
              el("span", {}, (day.shortLabel || day.heading)[lang] || (day.shortLabel || day.heading).en),
            ])
          )
        : [])
    );
  }
  render();

  const node = el("section", { class: "section calendar", id: "calendar" }, [
    el("h2", { class: "section-title-serif" }, t().calendar.title),
    monthLabel,
    weekRowEl,
    legendEl,
    el("div", { class: "lace-ribbon", "aria-hidden": "true" }),
  ]);

  function updateLang() {
    render();
    node.querySelector(".section-title-serif").textContent = t().calendar.title;
  }

  return { node, updateLang };
}
