import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { icons } from "../utils/icons.js";

// Builds a gentle S-curve SVG path spanning the rows, so ScrollTrigger can
// draw it via stroke-dashoffset while events alternate left/right. A day
// heading passes straight through the centre of its segment (xOffset at the
// midline) rather than getting its own bump, so it reads as a divider ON
// the path instead of a break in the curve.
function buildCurveSVG(sides) {
  const segmentHeight = 140;
  const totalHeight = segmentHeight * sides.length;
  const width = 200;
  let d = `M ${width / 2} 0`;
  sides.forEach((side, i) => {
    const y1 = segmentHeight * i + segmentHeight * 0.5;
    const y2 = segmentHeight * (i + 1);
    const xOffset = side === "left" ? width * 0.8 : side === "right" ? width * 0.2 : width / 2;
    d += ` Q ${xOffset} ${y1} ${width / 2} ${y2}`;
  });
  return `<svg class="timeline-svg" viewBox="0 0 ${width} ${totalHeight}" preserveAspectRatio="none">
    <path class="timeline-path" d="${d}" />
  </svg>`;
}

function buildEvent(item, side) {
  const timeEl = el("p", { class: "timeline-event-time" });
  const titleEl = el("p", { class: "timeline-event-title" });
  const dressCodeEl = item.dressCode ? el("p", { class: "timeline-event-dresscode" }) : null;
  const noteEl = item.note ? el("p", { class: "timeline-event-note" }) : null;

  const node = el("div", { class: "timeline-event", "data-side": side }, [
    el("span", { class: "timeline-event-icon", html: icons[item.icon] || icons.heart }),
    timeEl,
    titleEl,
    dressCodeEl,
    noteEl,
  ]);

  return { kind: "event", node, item, timeEl, titleEl, dressCodeEl, noteEl };
}

// A centered divider row between days — shares the `.timeline-event` class
// (so it rides the same scroll-reveal animation and occupies one segment of
// the curve) but data-side="center" keeps it out of the left/right
// alternation and the curve running straight through its middle.
function buildDayHeading(day) {
  const headingEl = el("p", { class: "timeline-day-heading-text" });
  const node = el("div", { class: "timeline-event timeline-day-heading", "data-side": "center" }, [headingEl]);
  return { kind: "heading", node, day, headingEl };
}

function applyLang(entry) {
  const lang = getLang();
  if (entry.kind === "heading") {
    entry.headingEl.textContent = entry.day.heading[lang] || entry.day.heading.en;
    return;
  }
  const { item, timeEl, titleEl, dressCodeEl, noteEl } = entry;
  timeEl.textContent = item.time[lang] || item.time.en;
  titleEl.textContent = item.title[lang] || item.title.en;
  if (dressCodeEl) dressCodeEl.textContent = item.dressCode[lang] || item.dressCode.en;
  if (noteEl) noteEl.textContent = item.note[lang] || item.note.en;
}

// Groups config.schedule by `day` (an index into config.weddingDays),
// inserting a heading row whenever the day changes. Events keep alternating
// left/right in one continuous sequence across every day — only the actual
// event rows advance the alternation, so a heading never shifts which side
// the next event lands on.
function buildRows() {
  const rows = [];
  let sideIndex = 0;
  let lastDay = null;
  config.schedule.forEach((item) => {
    const dayIndex = item.day ?? 0;
    if (dayIndex !== lastDay) {
      rows.push(buildDayHeading(config.weddingDays[dayIndex]));
      lastDay = dayIndex;
    }
    rows.push(buildEvent(item, sideIndex % 2 === 0 ? "left" : "right"));
    sideIndex++;
  });
  return rows;
}

export function createScheduleSection() {
  const rows = buildRows();
  rows.forEach(applyLang);

  const eventsWrap = el("div", { class: "timeline-events" }, rows.map((entry) => entry.node));
  const svgWrap = fromHTML(buildCurveSVG(rows.map((entry) => entry.node.dataset.side)));
  const heart = el("div", { class: "timeline-heart", "aria-hidden": "true" }, [
    el("span", { html: icons.heartSolid }),
  ]);

  const sectionTitle = el("h2", { class: "section-title-serif" }, t().schedule.title);

  const node = el("section", { class: "section", id: "schedule" }, [
    sectionTitle,
    el("div", { class: "timeline" }, [svgWrap, eventsWrap, heart]),
  ]);

  function updateLang() {
    sectionTitle.textContent = t().schedule.title;
    rows.forEach(applyLang);
  }

  return { node, updateLang };
}
