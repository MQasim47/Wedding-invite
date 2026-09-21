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

// Apps Script cold starts can take several seconds, so a slow response is
// normal — tell the guest we're still working after SLOW_AFTER_MS, and give up
// (with a retryable error) only after TIMEOUT_MS.
const SLOW_AFTER_MS = 8000;
const TIMEOUT_MS = 30000;

class RsvpError extends Error {
  constructor(kind) {
    super(kind);
    this.kind = kind; // "config" | "network" | "timeout" | "server"
  }
}

// One id per RSVP attempt, reused if the guest retries after a timeout: the
// backend ignores a second submission carrying an id it has already stored,
// so a request that landed after we stopped waiting can't create a duplicate row.
function newSubmissionId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function sendRsvp(payload) {
  const endpoint = config.rsvp.endpoint;
  if (!endpoint) {
    console.error("[RSVP] config.rsvp.endpoint is empty — nothing was sent. Set it to the Apps Script web app URL.");
    throw new RsvpError("config");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    // text/plain keeps this a "simple" request, so the browser skips the CORS
    // preflight that Apps Script web apps can't answer.
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    throw new RsvpError(controller.signal.aborted ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new RsvpError("server");

  // Apps Script answers HTTP 200 even when its own code fails, so the body's
  // `ok` flag is the real success signal.
  let body;
  try {
    body = await response.json();
  } catch {
    throw new RsvpError("server");
  }
  if (!body || body.ok !== true) {
    console.error("[RSVP] backend rejected the submission:", body);
    throw new RsvpError("server");
  }
}

export function createRsvpSection() {
  if (!config.rsvp.enabled) return null;

  const sectionTitle = el("h2", { class: "section-title-serif" }, t().rsvp.heading);

  if (isDeadlinePassed()) {
    const closedTitle = el("p", { class: "rsvp-success-title" }, t().rsvp.closedTitle);
    const closedMsg = el("p", {}, t().rsvp.closedMessage);
    const node = el("section", { class: "section", id: "rsvp" }, [
      sectionTitle,
      el("div", { class: "rsvp-success" }, [closedTitle, closedMsg]),
    ]);

    function updateLang() {
      sectionTitle.textContent = t().rsvp.heading;
      closedTitle.textContent = t().rsvp.closedTitle;
      closedMsg.textContent = t().rsvp.closedMessage;
    }

    return { node, updateLang };
  }

  let attending = null; // "yes" | "no"
  let guestCount = 1;
  let inFlight = false;
  let submissionId = newSubmissionId();
  let statusState = null; // { kind, key } — re-rendered on language change

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
  const yesBtn = el("button", { class: "attending-option", type: "button", role: "radio", "aria-checked": "false" }, [
    el("span", { class: "radio-dot" }),
    el("span", {}, t().rsvp.attendingYes),
  ]);
  const noBtn = el("button", { class: "attending-option", type: "button", role: "radio", "aria-checked": "false" }, [
    el("span", { class: "radio-dot" }),
    el("span", {}, t().rsvp.attendingNo),
  ]);
  const attendingGroup = el("div", { class: "attending-group", role: "radiogroup" }, [yesBtn, noBtn]);
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
  const statusText = el("span", { class: "rsvp-status-text" });
  const statusEl = el("div", { class: "rsvp-status", role: "status", hidden: true }, [
    el("span", { class: "rsvp-status-icon", html: icons.alert }),
    statusText,
  ]);

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

  // Decorative background typography only — stays the literal word "RSVP"
  // regardless of language (see NOTES.md Batch 4), not sourced from t().
  const watermark = el("div", { class: "rsvp-watermark notranslate", "aria-hidden": "true", translate: "no" }, "RSVP");

  const node = el("section", { class: "section rsvp-section", id: "rsvp" }, [
    watermark,
    sectionTitle,
    deadlineEl,
    form,
    successWrap,
  ]);

  function setAttending(value) {
    attending = value;
    yesBtn.setAttribute("aria-checked", String(value === "yes"));
    noBtn.setAttribute("aria-checked", String(value === "no"));
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

  const controls = [nameInput, messageInput, yesBtn, noBtn, decBtn, incBtn];

  // `key` is an i18n key under t().rsvp, so the message follows a language
  // switch while it's on screen. kind: "error" | "slow" | null (clear).
  function setStatus(kind, key) {
    statusState = kind ? { kind, key } : null;
    statusEl.hidden = !kind;
    if (!kind) {
      statusEl.removeAttribute("data-kind");
      statusText.textContent = "";
      return;
    }
    statusEl.setAttribute("data-kind", kind);
    statusEl.setAttribute("role", kind === "error" ? "alert" : "status");
    statusText.textContent = t().rsvp[key];
  }

  function setSending(sending) {
    inFlight = sending;
    submitBtn.disabled = sending;
    submitBtn.classList.toggle("is-loading", sending);
    submitBtn.textContent = sending ? t().rsvp.submitting : t().rsvp.submit;
    form.setAttribute("aria-busy", String(sending));
    controls.forEach((c) => (c.disabled = sending));
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    // A second submit while one is in flight (Enter key, double tap) must not
    // start another request — the disabled button alone doesn't cover Enter.
    // Nor may a form that has already been submitted successfully go again.
    if (inFlight || form.hidden) return;

    nameError.textContent = "";
    attendingError.textContent = "";
    setStatus(null);

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
      language: getLang(),
      guestParam: getGuestName(),
      submittedAt: new Date().toISOString(),
      submissionId,
    };

    setSending(true);
    const slowTimer = setTimeout(() => setStatus("slow", "slowNotice"), SLOW_AFTER_MS);

    try {
      await sendRsvp(payload);
    } catch (err) {
      clearTimeout(slowTimer);
      const key = { network: "errorNetwork", timeout: "errorTimeout", server: "errorServer" }[err.kind] || "errorGeneric";
      setSending(false);
      setStatus("error", key);
      return;
    }

    clearTimeout(slowTimer);
    setStatus(null);
    setSending(false);
    submissionId = newSubmissionId();
    showSuccess();
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
    sectionTitle.textContent = t().rsvp.heading;
    deadlineEl.textContent = `${t().rsvp.deadlinePrefix} ${formatDeadline(getLang())}.`;
    nameLabel.textContent = t().rsvp.name;
    nameInput.placeholder = t().rsvp.namePlaceholder;
    attendingLabel.textContent = t().rsvp.attending;
    yesBtn.lastChild.textContent = t().rsvp.attendingYes;
    noBtn.lastChild.textContent = t().rsvp.attendingNo;
    guestsLabel.textContent = t().rsvp.guests;
    messageLabel.textContent = t().rsvp.message;
    messageInput.placeholder = t().rsvp.messagePlaceholder;
    submitBtn.textContent = inFlight ? t().rsvp.submitting : t().rsvp.submit;
    if (statusState) statusText.textContent = t().rsvp[statusState.key];
    successTitle.textContent = t().rsvp.successTitle;
    successMsg.textContent = t().rsvp.successMessage;
  }

  deadlineEl.textContent = `${t().rsvp.deadlinePrefix} ${formatDeadline(getLang())}.`;

  return { node, updateLang };
}
