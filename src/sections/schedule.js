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

function buildEvents() {
  return config.schedule.map((item, i) => {
    const side = i % 2 === 0 ? "left" : "right";
    return el("div", { class: "timeline-event", "data-side": side }, [
      el("span", { class: "timeline-event-icon", html: icons[item.icon] || icons.heart }),
      el("p", { class: "timeline-event-time" }, item.time),
      el("p", { class: "timeline-event-title" }, item.title[getLang()] || item.title.en),
    ]);
  });
}

export function createScheduleSection() {
  const eventsWrap = el("div", { class: "timeline-events" }, buildEvents());
  const svgWrap = fromHTML(buildCurveSVG(config.schedule.length));

  const node = el("section", { class: "section", id: "schedule" }, [
    el("h2", { class: "section-title-serif" }, t().schedule.title),
    el("div", { class: "timeline" }, [svgWrap, eventsWrap]),
  ]);

  function updateLang() {
    node.querySelector(".section-title-serif").textContent = t().schedule.title;
    eventsWrap.querySelectorAll(".timeline-event-title").forEach((elNode, i) => {
      elNode.textContent = config.schedule[i].title[getLang()] || config.schedule[i].title.en;
    });
  }

  return { node, updateLang };
}
