import gsap from "gsap";
import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { getGuestName } from "../utils/guestParam.js";
import { icons } from "../utils/icons.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function formatDeadline(lang) {
  const date = new Date(`${config.rsvp.deadline}T00:00:00`);
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Guests can still RSVP through the whole calendar day of the deadline.
function isDeadlinePassed() {
  return Date.now() > new Date(`${config.rsvp.deadline}T23:59:59`).getTime();
}

export function createRsvpSection() {
  if (!config.rsvp.enabled) return null;

  const sectionTitle = el("h2", { class: "section-title-serif" }, t().rsvp.title);

  if (isDeadlinePassed()) {
    const closedTitle = el("p", { class: "rsvp-success-title" }, t().rsvp.closedTitle);
    const closedMsg = el("p", {}, t().rsvp.closedMessage);
    const node = el("section", { class: "section", id: "rsvp" }, [
      sectionTitle,
      el("div", { class: "rsvp-success" }, [closedTitle, closedMsg]),
    ]);

    function updateLang() {
      sectionTitle.textContent = t().rsvp.title;
      closedTitle.textContent = t().rsvp.closedTitle;
      closedMsg.textContent = t().rsvp.closedMessage;
    }

    return { node, updateLang };
  }

  let attending = null; // "yes" | "no"
  let guestCount = 1;

  const deadlineEl = el("p", { class: "rsvp-deadline" });

  const nameLabel = el("label", { class: "field-label", for: "rsvp-name" }, t().rsvp.name);
  const nameInput = el("input", {
    class: "field-input",
    id: "rsvp-name",
    type: "text",
    autocomplete: "name",
    placeholder: t().rsvp.namePlaceholder,
  });
  const nameError = el("p", { class: "field-error" });

  // Honeypot — hidden from real users, bots often fill every field.
  const honeypot = el("input", {
    class: "honeypot-field",
    type: "text",
    name: "company",
    tabindex: "-1",
    autocomplete: "off",
    "aria-hidden": "true",
  });

  const attendingLabel = el("p", { class: "field-label" }, t().rsvp.attending);
  const yesBtn = el("button", { class: "attending-option", type: "button", "aria-pressed": "false" }, t().rsvp.attendingYes);
  const noBtn = el("button", { class: "attending-option", type: "button", "aria-pressed": "false" }, t().rsvp.attendingNo);
  const attendingGroup = el("div", { class: "attending-group" }, [yesBtn, noBtn]);
  const attendingError = el("p", { class: "field-error" });

  const guestsLabel = el("label", { class: "field-label" }, t().rsvp.guests);
  const guestValueEl = el("span", { class: "stepper-value" }, String(guestCount));
  const decBtn = el("button", { class: "stepper-btn", type: "button", "aria-label": "-" }, "−");
  const incBtn = el("button", { class: "stepper-btn", type: "button", "aria-label": "+" }, "+");
  const guestsWrap = el("div", { class: "field guests-field" }, [
    guestsLabel,
    el("div", { class: "guest-stepper" }, [decBtn, guestValueEl, incBtn]),
  ]);
  guestsWrap.hidden = true;

  const messageLabel = el("label", { class: "field-label", for: "rsvp-message" }, t().rsvp.message);
  const messageInput = el("textarea", {
    class: "field-textarea",
    id: "rsvp-message",
    placeholder: t().rsvp.messagePlaceholder,
  });

  const submitBtn = el("button", { class: "btn rsvp-submit-btn", type: "submit" }, t().rsvp.submit);
  const statusEl = el("p", { class: "rsvp-status", role: "status" });

  const form = el("form", { class: "rsvp-form", novalidate: "true" }, [
    el("div", { class: "field" }, [nameLabel, nameInput, nameError]),
    honeypot,
    el("div", { class: "field" }, [attendingLabel, attendingGroup, attendingError]),
    guestsWrap,
    el("div", { class: "field" }, [messageLabel, messageInput]),
    submitBtn,
    statusEl,
  ]);

  const successCheck = el("span", { html: icons.check });
  const successTitle = el("p", { class: "rsvp-success-title" }, t().rsvp.successTitle);
  const successMsg = el("p", {}, t().rsvp.successMessage);
  const successWrap = el("div", { class: "rsvp-success", hidden: true }, [successCheck, successTitle, successMsg]);

  const node = el("section", { class: "section", id: "rsvp" }, [
    sectionTitle,
    deadlineEl,
    form,
    successWrap,
  ]);

  function setAttending(value) {
    attending = value;
    yesBtn.setAttribute("aria-pressed", String(value === "yes"));
    noBtn.setAttribute("aria-pressed", String(value === "no"));
    guestsWrap.hidden = value !== "yes";
    attendingError.textContent = "";
  }

  yesBtn.addEventListener("click", () => setAttending("yes"));
  noBtn.addEventListener("click", () => setAttending("no"));

  decBtn.addEventListener("click", () => {
    guestCount = Math.max(1, guestCount - 1);
    guestValueEl.textContent = String(guestCount);
  });
  incBtn.addEventListener("click", () => {
    guestCount = Math.min(config.rsvp.maxGuests, guestCount + 1);
    guestValueEl.textContent = String(guestCount);
  });

  async function handleSubmit(evt) {
    evt.preventDefault();
    nameError.textContent = "";
    attendingError.textContent = "";
    statusEl.textContent = "";
    statusEl.removeAttribute("data-kind");

    const name = nameInput.value.trim();
    let hasError = false;

    if (!name) {
      nameError.textContent = t().rsvp.errorName;
      hasError = true;
    }
    if (!attending) {
      attendingError.textContent = t().rsvp.errorAttending;
      hasError = true;
    }
    if (honeypot.value.trim() !== "") {
      // Silently drop likely-bot submissions without revealing the trap.
      return;
    }
    if (hasError) return;

    const payload = {
      name,
      attending,
      guests: attending === "yes" ? guestCount : 0,
      message: messageInput.value.trim(),
      guestParam: getGuestName(),
      submittedAt: new Date().toISOString(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = t().rsvp.submitting;

    try {
      if (!config.rsvp.endpoint) {
        console.warn("[RSVP] Demo mode: no rsvp.endpoint configured in config.js — submission was not sent.", payload);
        await new Promise((resolve) => setTimeout(resolve, 600));
        statusEl.textContent = t().rsvp.demoNotice;
        statusEl.setAttribute("data-kind", "demo");
        showSuccess();
        return;
      }

      const response = await fetch(config.rsvp.endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      showSuccess();
    } catch (err) {
      statusEl.textContent = t().rsvp.errorGeneric;
      statusEl.setAttribute("data-kind", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = t().rsvp.submit;
    }
  }

  function showSuccess() {
    form.hidden = true;
    successWrap.hidden = false;
    const path = successCheck.querySelector(".rsvp-success-check path");
    const circle = successCheck.querySelector(".rsvp-success-check circle");
    if (!path || !circle) return;

    if (prefersReducedMotion) return;

    const pathLength = path.getTotalLength();
    const circleLength = circle.getTotalLength ? circle.getTotalLength() : 2 * Math.PI * 23;
    gsap.set(circle, { strokeDasharray: circleLength, strokeDashoffset: circleLength });
    gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    gsap.timeline()
      .to(circle, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" })
      .to(path, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out" }, "-=0.15");
  }

  form.addEventListener("submit", handleSubmit);

  function updateLang() {
    sectionTitle.textContent = t().rsvp.title;
    deadlineEl.textContent = `${t().rsvp.deadlinePrefix} ${formatDeadline(getLang())}.`;
    nameLabel.textContent = t().rsvp.name;
    nameInput.placeholder = t().rsvp.namePlaceholder;
    attendingLabel.textContent = t().rsvp.attending;
    yesBtn.textContent = t().rsvp.attendingYes;
    noBtn.textContent = t().rsvp.attendingNo;
    guestsLabel.textContent = t().rsvp.guests;
    messageLabel.textContent = t().rsvp.message;
    messageInput.placeholder = t().rsvp.messagePlaceholder;
    submitBtn.textContent = submitBtn.disabled ? t().rsvp.submitting : t().rsvp.submit;
    successTitle.textContent = t().rsvp.successTitle;
    successMsg.textContent = t().rsvp.successMessage;
  }

  deadlineEl.textContent = `${t().rsvp.deadlinePrefix} ${formatDeadline(getLang())}.`;

  return { node, updateLang };
}
