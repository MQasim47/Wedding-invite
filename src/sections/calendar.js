import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t } from "../utils/store.js";
import { icons } from "../utils/icons.js";

function buildGrid() {
  const date = new Date(config.weddingDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const weddingDay = date.getDate();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(el("div", { class: "calendar-day", "aria-hidden": "true" }));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isWedding = day === weddingDay;
    const cell = el(
      "div",
      { class: "calendar-day", "data-wedding": isWedding ? "true" : "false" },
      [
        String(day),
        isWedding
          ? el("span", { class: "calendar-day-heart", html: icons.heartOutlineDraw })
          : null,
      ]
    );
    cells.push(cell);
  }
  return { cells, year, month };
}

export function createCalendarSection() {
  const monthLabel = el("p", { class: "calendar-month" });
  const dayGrid = el("div", { class: "calendar-grid" });

  function render() {
    const { cells, year, month } = buildGrid();
    monthLabel.textContent = `${t().calendar.months[month]} ${year}`;
    dayGrid.replaceChildren(
      ...t().calendar.weekdays.map((w) => el("div", { class: "calendar-weekday" }, w)),
      ...cells
    );
  }
  render();

  const node = el("section", { class: "section calendar", id: "calendar" }, [
    el("h2", { class: "section-title-serif" }, t().calendar.title),
    el("div", { class: "calendar-card" }, [monthLabel, dayGrid]),
  ]);

  function updateLang() {
    render();
    node.querySelector(".section-title-serif").textContent = t().calendar.title;
  }

  return { node, updateLang };
}
