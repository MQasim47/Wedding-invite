import gsap from "gsap";
import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t } from "../utils/store.js";
import { startCountdown } from "../utils/countdown.js";
import { downloadICS } from "../utils/ics.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function createCountdownSection() {
  const daysVal = el("span", { class: "countdown-value" }, "00");
  const hoursVal = el("span", { class: "countdown-value" }, "00");
  const minutesVal = el("span", { class: "countdown-value" }, "00");
  const secondsVal = el("span", { class: "countdown-value" }, "00");

  const daysLabel = el("span", { class: "countdown-label" }, t().countdown.days);
  const hoursLabel = el("span", { class: "countdown-label" }, t().countdown.hours);
  const minutesLabel = el("span", { class: "countdown-label" }, t().countdown.minutes);
  const secondsLabel = el("span", { class: "countdown-label" }, t().countdown.seconds);

  const grid = el("div", { class: "countdown-grid" }, [
    el("div", { class: "countdown-unit" }, [daysVal, daysLabel]),
    el("div", { class: "countdown-unit" }, [hoursVal, hoursLabel]),
    el("div", { class: "countdown-unit" }, [minutesVal, minutesLabel]),
    el("div", { class: "countdown-unit" }, [secondsVal, secondsLabel]),
  ]);

  const icsBtn = el("button", { class: "btn countdown-ics-btn", type: "button" }, t().countdown.addToCalendar);
  icsBtn.addEventListener("click", downloadICS);

  const marriedTitle = el("p", { class: "countdown-married-title" }, t().countdown.married);
  const marriedSub = el("p", { class: "countdown-married-sub" }, t().countdown.marriedSub);
  const marriedWrap = el("div", { class: "countdown-married", hidden: true }, [marriedTitle, marriedSub]);

  const sectionTitle = el("h2", { class: "section-title-serif" }, t().countdown.title);

  const node = el("section", { class: "section", id: "countdown" }, [
    sectionTitle,
    grid,
    marriedWrap,
    icsBtn,
  ]);

  let lastValues = null;

  function onTick({ done, days, hours, minutes, seconds }) {
    if (done) {
      grid.hidden = true;
      marriedWrap.hidden = false;
      return;
    }
    grid.hidden = false;
    marriedWrap.hidden = true;

    const next = { days, hours, minutes, seconds };
    if (!lastValues || lastValues.seconds !== seconds) {
      daysVal.textContent = String(days).padStart(2, "0");
      hoursVal.textContent = String(hours).padStart(2, "0");
      minutesVal.textContent = String(minutes).padStart(2, "0");
      secondsVal.textContent = String(seconds).padStart(2, "0");

      if (!prefersReducedMotion) {
        gsap.fromTo(
          secondsVal,
          { opacity: 0.3, y: -4 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power1.out" }
        );
      }
    }
    lastValues = next;
  }

  const stop = startCountdown(config.weddingDate, onTick);

  function updateLang() {
    sectionTitle.textContent = t().countdown.title;
    daysLabel.textContent = t().countdown.days;
    hoursLabel.textContent = t().countdown.hours;
    minutesLabel.textContent = t().countdown.minutes;
    secondsLabel.textContent = t().countdown.seconds;
    icsBtn.textContent = t().countdown.addToCalendar;
    marriedTitle.textContent = t().countdown.married;
    marriedSub.textContent = t().countdown.marriedSub;
  }

  return { node, updateLang, stop };
}
