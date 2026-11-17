import "./checkin.css";
import { config } from "../config.js";
import { applyTheme } from "../animations/theme.js";
import { el } from "../utils/dom.js";
import { rpc } from "../utils/supabase.js";
import { extractCode, normalizeCode, readPassCode, rememberPassCode, forgetPassCode } from "../utils/code.js";

// ============================================================================
// Door check-in: /checkin/?t=<door token>
//
// The guest scanned the QR on a staff phone at the entrance. That QR changes
// every 30 s and the server only accepts one from the last ~2 minutes, so
// this page can only check someone in while they're at the door.
//
// The guest's code comes from, in order: ?i= on this URL, the code this
// browser remembered from their personal link, or what they type. It is
// only ever sent in the POST body of door_guest_lookup / door_self_check_in.
// ============================================================================

applyTheme();

const STR = {
  en: {
    title: "Welcome",
    noToken: "Please scan the QR code shown at the entrance with your phone camera.",
    expired: "That door code has just expired. Please scan the code at the entrance again — it only takes a second.",
    askCode: "Enter your invitation code",
    askCodeHelp: "8 characters — printed under the QR on your pass, or the end of your invitation link (…?i=XXXXXXXX). You can also paste the whole link.",
    codeInvalid: "That doesn't look like an invitation code. Check the 8 characters and try again.",
    notFound: "We couldn't find that invitation code. Please check it, or ask a member of the welcome team.",
    continue: "Continue",
    checking: "One moment…",
    howMany: "How many of you are arriving now?",
    admits: (n) => (n === 1 ? "Your invitation is for 1 person." : `Your invitation is for up to ${n} people.`),
    checkIn: (n) => `Check in ${n} ${n === 1 ? "person" : "people"}`,
    notYou: "Not you? Use a different code",
    done: "You're checked in!",
    doneSub: (n, max) => `${n} of ${max} arrived. Enjoy the celebration!`,
    already: "You're already checked in",
    alreadySub: (n, max, time, staff) =>
      `${n} of ${max} checked in at ${time}${staff ? " by the welcome team" : ""}.`,
    alreadyMore: "If more of your party has just arrived, please see a member of the welcome team.",
    network: "No connection. Check your signal and try again, or show your pass to a member of the welcome team.",
    rateLimited: "Too many attempts from this network. Please wait a minute, or see a member of the welcome team.",
    server: "Something went wrong. Please try again, or show your pass to a member of the welcome team.",
    retry: "Try again",
    lang: "Français",
  },
  fr: {
    title: "Bienvenue",
    noToken: "Scannez le code QR présenté à l'entrée avec l'appareil photo de votre téléphone.",
    expired: "Ce code d'entrée vient d'expirer. Scannez à nouveau le code présenté à l'entrée, cela ne prend qu'une seconde.",
    askCode: "Saisissez votre code d'invitation",
    askCodeHelp: "8 caractères, imprimés sous le QR de votre pass ou à la fin de votre lien d'invitation (…?i=XXXXXXXX). Vous pouvez aussi coller le lien complet.",
    codeInvalid: "Ce n'est pas un code d'invitation valide. Vérifiez les 8 caractères et réessayez.",
    notFound: "Nous n'avons pas trouvé ce code. Vérifiez-le ou adressez-vous à l'équipe d'accueil.",
    continue: "Continuer",
    checking: "Un instant…",
    howMany: "Combien êtes-vous à arriver maintenant ?",
    admits: (n) => (n === 1 ? "Votre invitation est valable pour 1 personne." : `Votre invitation est valable jusqu'à ${n} personnes.`),
    checkIn: (n) => `Enregistrer ${n} personne${n === 1 ? "" : "s"}`,
    notYou: "Ce n'est pas vous ? Utiliser un autre code",
    done: "Vous êtes enregistré(e) !",
    doneSub: (n, max) => `${n} sur ${max} arrivé(s). Belle fête !`,
    already: "Vous êtes déjà enregistré(e)",
    alreadySub: (n, max, time, staff) =>
      `${n} sur ${max} enregistré(s) à ${time}${staff ? " par l'équipe d'accueil" : ""}.`,
    alreadyMore: "Si d'autres personnes de votre groupe viennent d'arriver, adressez-vous à l'équipe d'accueil.",
    network: "Pas de connexion. Vérifiez votre réseau et réessayez, ou montrez votre pass à l'équipe d'accueil.",
    rateLimited: "Trop de tentatives depuis ce réseau. Patientez une minute ou adressez-vous à l'équipe d'accueil.",
    server: "Une erreur s'est produite. Réessayez ou montrez votre pass à l'équipe d'accueil.",
    retry: "Réessayer",
    lang: "English",
  },
};

const root = document.getElementById("checkin");
const params = new URLSearchParams(window.location.search);
const token = (params.get("t") || "").trim();

let lang = (() => {
  try {
    const stored = localStorage.getItem("wedding-lang");
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    // ignore
  }
  return (navigator.language || "").toLowerCase().startsWith("fr") ? "fr" : "en";
})();
let langPicked = false;
let lastView = null;

function s() {
  return STR[lang];
}

function formatTime(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function show(view) {
  lastView = view;
  document.documentElement.lang = lang;
  const langBtn = el("button", { type: "button", class: "checkin-lang" }, s().lang);
  langBtn.addEventListener("click", () => {
    lang = lang === "en" ? "fr" : "en";
    langPicked = true;
    show(lastView);
  });
  const header = el("header", { class: "checkin-header" }, [
    el("p", { class: "checkin-couple" }, `${config.couple.partner1} & ${config.couple.partner2}`),
    langBtn,
  ]);
  root.replaceChildren(header, el("div", { class: "checkin-body" }, view()));
}

function message(kind, text, extra = []) {
  return [el("p", { class: `checkin-msg checkin-msg--${kind}` }, text), ...extra];
}

function errorText(err) {
  const kind = err?.kind;
  if (kind === "network" || kind === "timeout") return s().network;
  if (kind === "rate_limited") return s().rateLimited;
  return s().server;
}

function retryButton(fn) {
  const b = el("button", { type: "button", class: "checkin-btn checkin-btn--ghost" }, s().retry);
  b.addEventListener("click", fn);
  return b;
}

function askForCode(problem) {
  show(() => {
    const input = el("input", {
      class: "checkin-input",
      type: "text",
      inputmode: "text",
      autocapitalize: "characters",
      autocomplete: "off",
      spellcheck: "false",
      maxlength: "200",
      "aria-label": s().askCode,
    });
    const form = el("form", { class: "checkin-form" }, [
      el("label", { class: "checkin-label" }, s().askCode),
      input,
      el("p", { class: "checkin-help" }, s().askCodeHelp),
      problem ? el("p", { class: "checkin-msg checkin-msg--warn" }, problem) : null,
      el("button", { type: "submit", class: "checkin-btn" }, s().continue),
    ]);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = extractCode(input.value);
      if (!code) return askForCode(s().codeInvalid);
      lookup(code);
    });
    setTimeout(() => input.focus(), 50);
    return [el("h1", { class: "checkin-title" }, s().title), form];
  });
}

function alreadyView(result) {
  return () => [
    el("div", { class: "checkin-badge checkin-badge--info" }, "✓"),
    el("h1", { class: "checkin-title" }, s().already),
    el("p", { class: "checkin-name notranslate", translate: "no" }, result.display_name || ""),
    el("p", {}, s().alreadySub(result.arrived, result.max_guests, formatTime(result.checked_in_at), result.checked_in_by_staff)),
    el("p", { class: "checkin-help" }, s().alreadyMore),
  ];
}

function adoptLanguage(preferred) {
  if (!langPicked && (preferred === "en" || preferred === "fr")) lang = preferred;
}

async function lookup(code) {
  show(() => message("info", s().checking));
  let result;
  try {
    result = await rpc("door_guest_lookup", { p_code: code, p_token: token });
  } catch (err) {
    return show(() => message("error", errorText(err), [retryButton(() => lookup(code))]));
  }

  switch (result?.status) {
    case "door_token_expired":
    case "door_token_invalid":
      // The code is fine to keep: the rescan will go straight through.
      rememberPassCode(code);
      return show(() => message("warn", s().expired));
    case "invalid_code":
      if (readPassCode() === code) forgetPassCode();
      return askForCode(s().notFound);
    case "already_checked_in":
      rememberPassCode(code);
      adoptLanguage(result.preferred_language);
      return show(alreadyView(result));
    case "ready":
      rememberPassCode(code);
      adoptLanguage(result.preferred_language);
      return confirmView(code, result);
    default:
      return show(() => message("error", s().server, [retryButton(() => lookup(code))]));
  }
}

function confirmView(code, info) {
  let count = Math.min(Math.max(info.suggested_guests || 1, 1), info.max_guests);
  show(() => {
    const choices = el("div", { class: "checkin-choices", role: "group", "aria-label": s().howMany });
    const submit = el("button", { type: "button", class: "checkin-btn" });
    const paint = () => {
      choices.replaceChildren(
        ...Array.from({ length: info.max_guests }, (_, i) => {
          const n = i + 1;
          const b = el("button", { type: "button", class: "checkin-choice", "aria-pressed": String(n === count) }, String(n));
          b.addEventListener("click", () => {
            count = n;
            paint();
          });
          return b;
        }),
      );
      submit.textContent = s().checkIn(count);
    };
    paint();
    submit.addEventListener("click", () => checkIn(code, info, count));

    const notYou = el("button", { type: "button", class: "checkin-link" }, s().notYou);
    notYou.addEventListener("click", () => {
      forgetPassCode();
      askForCode(null);
    });

    return [
      el("h1", { class: "checkin-title" }, s().title),
      el("p", { class: "checkin-name notranslate", translate: "no" }, info.display_name),
      el("p", { class: "checkin-help" }, s().admits(info.max_guests)),
      el("p", { class: "checkin-label" }, s().howMany),
      choices,
      submit,
      notYou,
    ];
  });
}

async function checkIn(code, info, count) {
  show(() => message("info", s().checking));
  let result;
  try {
    result = await rpc("door_self_check_in", { p_code: code, p_token: token, p_guest_count: count });
  } catch (err) {
    return show(() => message("error", errorText(err), [retryButton(() => checkIn(code, info, count))]));
  }

  switch (result?.status) {
    case "checked_in":
      return show(() => [
        el("div", { class: "checkin-badge" }, "✓"),
        el("h1", { class: "checkin-title" }, s().done),
        el("p", { class: "checkin-name notranslate", translate: "no" }, result.display_name),
        el("p", {}, s().doneSub(result.arrived, result.max_guests)),
        // Seating (Phase 3, part two) will be shown here.
      ]);
    case "already_checked_in":
      return show(alreadyView(result));
    case "door_token_expired":
    case "door_token_invalid":
      return show(() => message("warn", s().expired));
    case "invalid_code":
      forgetPassCode();
      return askForCode(s().notFound);
    case "invalid_guest_count":
      return confirmView(code, { ...info, max_guests: result.max_guests });
    default:
      return show(() => message("error", s().server, [retryButton(() => checkIn(code, info, count))]));
  }
}

// Start.
if (!token) {
  show(() => message("info", s().noToken));
} else {
  const fromUrl = params.has("i") ? normalizeCode(params.get("i") || "") : null;
  const code = fromUrl || readPassCode();
  if (code) lookup(code);
  else askForCode(null);
}
