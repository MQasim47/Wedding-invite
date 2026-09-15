import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { icons } from "../utils/icons.js";

// Builds a gentle S-curve SVG path spanning the events, so ScrollTrigger can
// draw it via stroke-dashoffset while the events alternate left/right.
function buildCurveSVG(count) {
  const segmentHeight = 140;
  const totalHeight = segmentHeight * count;
  const width = 200;
  let d = `M ${width / 2} 0`;
  for (let i = 0; i < count; i++) {
    const y1 = segmentHeight * i + segmentHeight * 0.5;
    const y2 = segmentHeight * (i + 1);
    const xOffset = i % 2 === 0 ? width * 0.8 : width * 0.2;
    d += ` Q ${xOffset} ${y1} ${width / 2} ${y2}`;
  }
  return `<svg class="timeline-svg" viewBox="0 0 ${width} ${totalHeight}" preserveAspectRatio="none">
    <path class="timeline-path" d="${d}" />
  </svg>`;
}

function buildEvent(item, i) {
  const side = i % 2 === 0 ? "left" : "right";
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

  return { node, item, timeEl, titleEl, dressCodeEl, noteEl };
}

function applyLang(entry) {
  const lang = getLang();
  const { item, timeEl, titleEl, dressCodeEl, noteEl } = entry;
  timeEl.textContent = item.time[lang] || item.time.en;
  titleEl.textContent = item.title[lang] || item.title.en;
  if (dressCodeEl) dressCodeEl.textContent = item.dressCode[lang] || item.dressCode.en;
  if (noteEl) noteEl.textContent = item.note[lang] || item.note.en;
}

export function createScheduleSection() {
  const entries = config.schedule.map(buildEvent);
  entries.forEach(applyLang);

  const eventsWrap = el("div", { class: "timeline-events" }, entries.map((entry) => entry.node));
  const svgWrap = fromHTML(buildCurveSVG(config.schedule.length));

  const sectionTitle = el("h2", { class: "section-title-serif" }, t().schedule.title);

  const node = el("section", { class: "section", id: "schedule" }, [
    sectionTitle,
    el("div", { class: "timeline" }, [svgWrap, eventsWrap]),
  ]);

  function updateLang() {
    sectionTitle.textContent = t().schedule.title;
    entries.forEach(applyLang);
  }

  return { node, updateLang };
}
