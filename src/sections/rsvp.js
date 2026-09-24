import gsap from "gsap";
import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { icons } from "../utils/icons.js";
import { rpc } from "../utils/supabase.js";
import {
  getInvitationCode,
  getInvitationState,
  onInvitationChange,
  loadInvitation,
  loadRsvpDeadline,
  updateInvitationRsvp,
} from "../utils/invitation.js";
import { refreshScrollTriggers } from "../animations/scrollReveal.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function formatDeadline(deadline, lang) {
  const date = new Date(`${deadline}T00:00:00`);
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Guests can still RSVP through the whole calendar day of the deadline, in
// their own time zone. (The server closes at the end of that day anywhere on
// earth, so it never refuses a reply this still allows.)
function isDeadlinePassed(deadline) {
  return !!deadline && Date.now() > new Date(`${deadline}T23:59:59`).getTime();
}

// "1 guest" / "2 guests" / "2 personnes"
function guestCount(n) {
  const [one, many] = t().rsvp.guestUnit;
  return `${n} ${n === 1 ? one : many}`;
}

function fill(template, n) {
  return template.replace("{guests}", guestCount(n));
}

// The most guests this invitation may bring. A null authorized count (still
// being confirmed with the client) allows 1 — the server applies the same
// rule and refuses anything above it, whatever the request says.
function maxGuestsFor(invitation) {
  return Math.max(invitation.authorizedGuests ?? 1, 1);
}

// Supabase answers in well under a second, but keep the patient UX for a bad
// mobile connection: a "still sending" notice after SLOW_AFTER_MS, and a
// retryable error only after TIMEOUT_MS.
const SLOW_AFTER_MS = 8000;
const TIMEOUT_MS = 30000;

const SUBMIT_ERROR_KEYS = {
  network: "errorNetwork",
  timeout: "errorTimeout",
  rate_limited: "errorRateLimited",
  invalid_code: "errorInvalidCode",
  invalid_guest_count: "errorGuestCount",
};

export function createRsvpSection() {
  if (!config.rsvp.enabled) return null;

  // Settled deadline: undefined while loading, then a "YYYY-MM-DD" string or
  // null (unknown — the form stays open and the server decides).
  let deadline;
  let closedByServer = false;
  let phase = "form"; // "form" | "success"
  let formFor = null; // the invitation object the form was last filled from

  let attending = null; // "yes" | "no"
  let guests = 1;
  let maxGuests = 1;
  let inFlight = false;
  let statusState = null; // { kind, key } — re-rendered on language change
  let submittedUpdate = false;

  // --- Always-present header ---------------------------------------------
  const sectionTitle = el("h2", { class: "section-title-serif" }, t().rsvp.heading);
  const deadlineEl = el("p", { class: "rsvp-deadline", hidden: true });

  // --- Notice (loading / no code / incomplete link / lookup error) --------
  const noticeText = el("p", { class: "rsvp-notice-text" });
  const noticeNote = el("p", { class: "rsvp-notice-note", hidden: true });
  const retryBtn = el("button", { class: "btn btn-outline rsvp-retry-btn", type: "button", hidden: true }, t().rsvp.retry);
  const noticeWrap = el("div", { class: "rsvp-notice", hidden: true }, [noticeText, noticeNote, retryBtn]);

  retryBtn.addEventListener("click", () => loadInvitation());

  // --- Closed --------------------------------------------------------------
  const closedTitle = el("p", { class: "rsvp-success-title" }, t().rsvp.closedTitle);
  const closedMsg = el("p", {}, t().rsvp.closedMessage);
  const closedReply = el("p", { class: "rsvp-previous", hidden: true });
  const closedWrap = el("div", { class: "rsvp-success", hidden: true }, [closedTitle, closedMsg, closedReply]);

  // --- Form ------------------------------------------------------------------
  const forLabel = el("p", { class: "field-label" }, t().rsvp.respondingFor);
  const forName = el("p", { class: "rsvp-guest-name notranslate", translate: "no" });
  const previousEl = el("p", { class: "rsvp-previous", hidden: true });

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

  const guestsLabel = el("p", { class: "field-label" }, t().rsvp.guests);
  const guestValueEl = el("span", { class: "stepper-value", "aria-live": "polite" }, "1");
  const decBtn = el("button", { class: "stepper-btn", type: "button", "aria-label": "-" }, "−");
  const incBtn = el("button", { class: "stepper-btn", type: "button", "aria-label": "+" }, "+");
  const stepper = el("div", { class: "guest-stepper" }, [decBtn, guestValueEl, incBtn]);
  const guestsNote = el("p", { class: "rsvp-guests-note" });
  const guestsWrap = el("div", { class: "field guests-field" }, [guestsLabel, stepper, guestsNote]);
  guestsWrap.hidden = true;

  const messageLabel = el("label", { class: "field-label", for: "rsvp-message" }, t().rsvp.message);
  const messageInput = el("textarea", {
    class: "field-textarea",
    id: "rsvp-message",
    maxlength: "1000",
    placeholder: t().rsvp.messagePlaceholder,
  });

  const submitBtn = el("button", { class: "btn rsvp-submit-btn", type: "submit" }, t().rsvp.submit);
  const statusText = el("span", { class: "rsvp-status-text" });
  const statusEl = el("div", { class: "rsvp-status", role: "status", hidden: true }, [
    el("span", { class: "rsvp-status-icon", html: icons.alert }),
    statusText,
  ]);

  const form = el("form", { class: "rsvp-form", novalidate: "true", hidden: true }, [
    el("div", { class: "field rsvp-for" }, [forLabel, forName, previousEl]),
    honeypot,
    el("div", { class: "field" }, [attendingLabel, attendingGroup, attendingError]),
    guestsWrap,
    el("div", { class: "field" }, [messageLabel, messageInput]),
    submitBtn,
    statusEl,
  ]);

  // --- Success ---------------------------------------------------------------
  const successCheck = el("span", { html: icons.check });
  const successTitle = el("p", { class: "rsvp-success-title" }, t().rsvp.successTitle);
  const successMsg = el("p", {}, t().rsvp.successMessage);
  const changeBtn = el("button", { class: "btn btn-outline rsvp-change-btn", type: "button" }, t().rsvp.changeReply);
  const successWrap = el("div", { class: "rsvp-success", hidden: true }, [successCheck, successTitle, successMsg, changeBtn]);

  // Decorative background typography only — stays the literal word "RSVP"
  // regardless of language (see NOTES.md Batch 4), not sourced from t().
  const watermark = el("div", { class: "rsvp-watermark notranslate", "aria-hidden": "true", translate: "no" }, "RSVP");

  const node = el("section", { class: "section rsvp-section", id: "rsvp" }, [
    watermark,
    sectionTitle,
    deadlineEl,
    noticeWrap,
    closedWrap,
    form,
    successWrap,
  ]);

  // --- Form state --------------------------------------------------------
  function renderGuests() {
    guestValueEl.textContent = String(guests);
    decBtn.disabled = inFlight || guests <= 1;
    incBtn.disabled = inFlight || guests >= maxGuests;
    // A single seat needs no stepper — just say so.
    stepper.hidden = maxGuests <= 1;
    const invitation = formFor;
    if (!invitation) return;
    if (invitation.authorizedGuests == null) guestsNote.textContent = t().rsvp.guestsUnconfirmed;
    else if (maxGuests <= 1) guestsNote.textContent = t().rsvp.guestsSingle;
    else guestsNote.textContent = fill(t().rsvp.guestsLimit, maxGuests);
  }

  function setAttending(value) {
    attending = value;
    yesBtn.setAttribute("aria-checked", String(value === "yes"));
    noBtn.setAttribute("aria-checked", String(value === "no"));
    guestsWrap.hidden = value !== "yes";
    attendingError.textContent = "";
  }

  function hasResponded(invitation) {
    return invitation.rsvpStatus === "accepted" || invitation.rsvpStatus === "declined";
  }

  function previousReplyText(invitation, closed) {
    const r = t().rsvp;
    if (invitation.rsvpStatus === "accepted") {
      return fill(closed ? r.closedAccepted : r.previousAccepted, Math.max(invitation.confirmedGuests ?? 1, 1));
    }
    if (invitation.rsvpStatus === "declined") return closed ? r.closedDeclined : r.previousDeclined;
    return "";
  }

  // Fills the form from the invitation: their name, their seat limit, and —
  // if they've already replied — their current answer, ready to change.
  function fillForm(invitation) {
    formFor = invitation;
    maxGuests = maxGuestsFor(invitation);
    forName.textContent = invitation.displayName;
    if (invitation.rsvpStatus === "accepted") {
      guests = Math.min(Math.max(invitation.confirmedGuests ?? 1, 1), maxGuests);
      setAttending("yes");
    } else if (invitation.rsvpStatus === "declined") {
      guests = 1;
      setAttending("no");
    } else {
      guests = 1;
      setAttending(null);
    }
    renderGuests();
    setStatus(null);
    renderFormText();
  }

  function renderFormText() {
    if (!formFor) return;
    const previous = previousReplyText(formFor, false);
    previousEl.textContent = previous;
    previousEl.hidden = !previous;
    submitBtn.textContent = inFlight ? t().rsvp.submitting : hasResponded(formFor) ? t().rsvp.submitUpdate : t().rsvp.submit;
  }

  decBtn.addEventListener("click", () => {
    guests = Math.max(1, guests - 1);
    renderGuests();
  });
  incBtn.addEventListener("click", () => {
    guests = Math.min(maxGuests, guests + 1);
    renderGuests();
  });
  yesBtn.addEventListener("click", () => setAttending("yes"));
  noBtn.addEventListener("click", () => setAttending("no"));

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
    form.setAttribute("aria-busy", String(sending));
    [messageInput, yesBtn, noBtn].forEach((c) => (c.disabled = sending));
    renderGuests();
    renderFormText();
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    // A second submit while one is in flight (Enter key, double tap) must not
    // start another request — the disabled button alone doesn't cover Enter.
    // Nor may a form that isn't showing (already sent, closed) go again.
    if (inFlight || form.hidden || !formFor) return;

    attendingError.textContent = "";
    setStatus(null);

    if (!attending) {
      attendingError.textContent = t().rsvp.errorAttending;
      return;
    }
    if (honeypot.value.trim() !== "") {
      // Silently drop likely-bot submissions without revealing the trap.
      return;
    }

    const code = getInvitationCode();
    if (!code) return; // unreachable: the form only shows for a found code

    const wasUpdate = hasResponded(formFor);
    setSending(true);
    const slowTimer = setTimeout(() => setStatus("slow", "slowNotice"), SLOW_AFTER_MS);

    let rows;
    try {
      // The server re-checks everything: the code, the deadline, and the
      // guest count against this invitation's authorized seats. The same
      // invitation row is updated every time, so a retry or a second
      // submission can never create a duplicate.
      rows = await rpc(
        "submit_rsvp",
        {
          p_code: code,
          p_attending: attending === "yes",
          p_guest_count: attending === "yes" ? guests : null,
          p_message: messageInput.value.trim() || null,
        },
        { timeoutMs: TIMEOUT_MS }
      );
    } catch (err) {
      clearTimeout(slowTimer);
      setSending(false);
      if (err.kind === "rsvp_closed") {
        closedByServer = true;
        setStatus(null);
        render();
        return;
      }
      // Never log the request: it carries the guest's code.
      console.error("[RSVP] submission failed:", err.kind);
      setStatus("error", SUBMIT_ERROR_KEYS[err.kind] || "errorServer");
      return;
    }

    clearTimeout(slowTimer);
    setStatus(null);
    setSending(false);

    const saved = Array.isArray(rows) ? rows[0] : null;
    submittedUpdate = wasUpdate;
    messageInput.value = "";
    phase = "success";
    updateInvitationRsvp({
      rsvpStatus: saved?.rsvp_status === "declined" ? "declined" : "accepted",
      confirmedGuests: Number.isInteger(saved?.confirmed_guests) ? saved.confirmed_guests : attending === "yes" ? guests : 0,
    });
    render();
    animateSuccess();
  }

  function animateSuccess() {
    const path = successCheck.querySelector(".rsvp-success-check path");
    const circle = successCheck.querySelector(".rsvp-success-check circle");
    if (!path || !circle || prefersReducedMotion) return;

    const pathLength = path.getTotalLength();
    const circleLength = circle.getTotalLength ? circle.getTotalLength() : 2 * Math.PI * 23;
    gsap.set(circle, { strokeDasharray: circleLength, strokeDashoffset: circleLength });
    gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    gsap.timeline()
      .to(circle, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" })
      .to(path, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out" }, "-=0.15");
  }

  changeBtn.addEventListener("click", () => {
    phase = "form";
    formFor = null; // refill from the saved answer
    render();
  });

  form.addEventListener("submit", handleSubmit);

  // --- Which view is showing -------------------------------------------------
  function showNotice(key, { noteKey = null, retry = false } = {}) {
    noticeText.textContent = t().rsvp[key];
    noticeNote.textContent = noteKey ? t().rsvp[noteKey] : "";
    noticeNote.hidden = !noteKey;
    retryBtn.hidden = !retry;
    retryBtn.textContent = t().rsvp.retry;
    noticeWrap.hidden = false;
  }

  function render() {
    const state = getInvitationState();
    const closed = closedByServer || isDeadlinePassed(deadline);

    deadlineEl.hidden = !deadline || closed;
    if (deadline) deadlineEl.textContent = `${t().rsvp.deadlinePrefix} ${formatDeadline(deadline, getLang())}.`;

    noticeWrap.hidden = true;
    closedWrap.hidden = true;
    form.hidden = true;
    successWrap.hidden = true;

    if (closed) {
      closedTitle.textContent = t().rsvp.closedTitle;
      closedMsg.textContent = t().rsvp.closedMessage;
      const reply = state.status === "found" ? previousReplyText(state.invitation, true) : "";
      closedReply.textContent = reply;
      closedReply.hidden = !reply;
      closedWrap.hidden = false;
    } else if (state.status === "none") {
      showNotice("noCode");
    } else if (state.status === "not_found") {
      showNotice("noCode", { noteKey: "incompleteLink" });
    } else if (state.status === "error") {
      showNotice(state.errorKind === "rate_limited" ? "errorRateLimited" : "lookupError", { retry: true });
    } else if (state.status === "loading" || deadline === undefined) {
      showNotice("loading");
    } else if (phase === "success") {
      successTitle.textContent = t().rsvp.successTitle;
      successMsg.textContent = submittedUpdate ? t().rsvp.successUpdated : t().rsvp.successMessage;
      changeBtn.textContent = t().rsvp.changeReply;
      successWrap.hidden = false;
    } else {
      if (formFor !== state.invitation) fillForm(state.invitation);
      form.hidden = false;
    }
    refreshScrollTriggers();
  }

  onInvitationChange(() => {
    // A successful submit updates the stored invitation; keep the form's
    // own copy in step so "Change my reply" and the labels stay current.
    if (phase === "success") formFor = null;
    render();
  });

  loadRsvpDeadline().then((value) => {
    deadline = value;
    render();
  });

  function updateLang() {
    sectionTitle.textContent = t().rsvp.heading;
    attendingLabel.textContent = t().rsvp.attending;
    forLabel.textContent = t().rsvp.respondingFor;
    yesBtn.lastChild.textContent = t().rsvp.attendingYes;
    noBtn.lastChild.textContent = t().rsvp.attendingNo;
    guestsLabel.textContent = t().rsvp.guests;
    messageLabel.textContent = t().rsvp.message;
    messageInput.placeholder = t().rsvp.messagePlaceholder;
    if (statusState) statusText.textContent = t().rsvp[statusState.key];
    renderGuests();
    renderFormText();
    // render() re-derives every other visible string (deadline, notice,
    // closed, success) — but must not refill the form, so formFor stays put.
    render();
  }

  render();

  return { node, updateLang };
}
