// ============================================================================
// i18n — all UI strings (not content, which lives in config.js) per language.
// Add a new language by adding a new top-level key with the same shape.
// ============================================================================

export const i18n = {
  en: {
    envelope: {
      hint: "(tap to open)",
    },
    // "Dear {name}," — names are often partial or descriptive ("Voisin
    // blanc", "Chorale 4"), so the salutation must read naturally in front
    // of any of them.
    greeting: {
      dear: "Dear",
    },
    story: {
      title: "Our Story",
    },
    weddingParty: {
      title: "Wedding Party",
      bridesmaids: "Bridesmaids",
      groomsmen: "Groomsmen",
    },
    calendar: {
      title: "Save the Date",
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      weekdaysFull: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      months: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ],
    },
    schedule: {
      title: "Wedding Weekend",
    },
    venue: {
      title: "Venue",
      openMaps: "Open in Google Maps",
    },
    countdown: {
      title: "Counting Down",
      heading: "Until the wedding:",
      days: "Days",
      hours: "Hours",
      minutes: "Minutes",
      seconds: "Seconds",
      married: "Just Married!",
      marriedSub: "Thank you for celebrating with us.",
      addToCalendar: "Add to Calendar",
    },
    rsvp: {
      title: "RSVP",
      heading: "RSVP",
      deadlinePrefix: "Kindly confirm your attendance by",
      respondingFor: "Replying for",
      attending: "Will you attend?",
      attendingYes: "Joyfully Accepts",
      attendingNo: "Regretfully Declines",
      guests: "Number of Guests",
      message: "Message (optional)",
      messagePlaceholder: "Leave a note for the couple...",
      submit: "Send RSVP",
      submitting: "Sending...",
      successTitle: "Thank You!",
      successMessage: "Your RSVP has been received.",
      slowNotice: "Still sending — thank you for your patience…",
      errorGeneric: "Something went wrong. Please try again.",
      errorNetwork: "We couldn't reach the server. Please check your connection and try again.",
      errorServer: "Something went wrong on our side, and your RSVP was not saved. Please try again in a moment.",
      errorTimeout: "This is taking longer than expected, so we stopped waiting. Please try again — your reply is only ever saved once.",
      errorRateLimited: "Too many attempts from this connection. Please wait a minute and try again.",
      errorInvalidCode: "We couldn't find your invitation. Please open the full personal link you were sent and try again.",
      errorGuestCount: "That number of guests isn't available on this invitation.",
      errorAttending: "Please select an option.",
      closedTitle: "RSVP Closed",
      closedMessage: "Thank you for your interest — the RSVP deadline has passed. Please reach out to the couple directly if you'd like to let them know.",
      // Invitation codes (?i=). No code, or one that can't be found, still
      // shows the whole invitation — only the form is replaced.
      loading: "Loading your invitation…",
      noCode: "To reply, please use the personal link you received with your invitation.",
      incompleteLink: "This link may be incomplete — please check that you opened the full link you were sent.",
      lookupError: "We couldn't load your reply form just now. Please check your connection and try again.",
      retry: "Try again",
      // {guests} is filled with a count and guestUnit, e.g. "2 guests".
      previousAccepted: "Your current reply: attending, {guests}. You can change it below.",
      previousDeclined: "Your current reply: not attending. You can change it below.",
      closedAccepted: "Your reply: attending, {guests}.",
      closedDeclined: "Your reply: not attending.",
      guestsLimit: "Up to {guests} on this invitation.",
      guestsSingle: "This invitation is for 1 guest.",
      guestsUnconfirmed: "The number of seats on this invitation is still being confirmed, so for now you can reply for 1 guest.",
      guestUnit: ["guest", "guests"],
      submitUpdate: "Update my reply",
      successUpdated: "Your reply has been updated.",
      changeReply: "Change my reply",
    },
    extras: {
      galleryTitle: "Gallery",
      dressCodeTitle: "Dress Code",
      giftsTitle: "Gifts",
    },
    closing: {
      withLove: "With love,",
      waitingForYou: "We're waiting for you!",
      footer: "Made with love",
    },
    music: {
      play: "Play music",
      pause: "Pause music",
    },
    companion: {
      label: "Scroll to RSVP",
    },
    langToggle: "FR",
  },

  fr: {
    envelope: {
      hint: "(appuyez pour ouvrir)",
    },
    // Gender-neutral on purpose: "Cher/Chère" can't be agreed with names
    // like "Chorale 4" or "fille Nadège". "Bonjour {name}," reads naturally
    // in front of any of them.
    greeting: {
      dear: "Bonjour",
    },
    story: {
      title: "NOTRE HISTOIRE",
    },
    weddingParty: {
      title: "CORTÈGE NUPTIAL",
      bridesmaids: "Demoiselles d'honneur",
      groomsmen: "Garçons d'honneur",
    },
    calendar: {
      title: "RÉSERVEZ LA DATE",
      weekdays: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
      weekdaysFull: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
      months: [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre",
      ],
    },
    schedule: {
      title: "WEEK-END DE MARIAGE",
    },
    venue: {
      title: "LIEUX",
      openMaps: "Ouvrir dans Google Maps",
    },
    countdown: {
      title: "COMPTE À REBOURS",
      heading: "Avant le mariage :",
      days: "Jours",
      hours: "Heures",
      minutes: "Minutes",
      seconds: "Secondes",
      married: "Jeunes mariés !",
      marriedSub: "Merci d'avoir célébré avec nous.",
      addToCalendar: "Ajouter au calendrier",
    },
    rsvp: {
      title: "RSVP",
      heading: "Confirmez votre présence",
      deadlinePrefix: "Merci de confirmer votre présence avant le",
      respondingFor: "Réponse pour",
      attending: "SEREZ-VOUS PRÉSENT(E) ?",
      attendingYes: "J'accepte avec joie",
      attendingNo: "Je décline à regret",
      guests: "Nombre de personnes",
      message: "MESSAGE (FACULTATIF)",
      messagePlaceholder: "Laissez un mot aux mariés…",
      submit: "Envoyer ma réponse",
      submitting: "Envoi en cours...",
      successTitle: "Merci !",
      successMessage: "Nous avons bien reçu votre réponse.",
      slowNotice: "Envoi toujours en cours — merci de votre patience…",
      errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
      errorNetwork: "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
      errorServer: "Une erreur est survenue de notre côté et votre réponse n'a pas été enregistrée. Veuillez réessayer dans un instant.",
      errorTimeout: "L'envoi prend plus de temps que prévu, nous avons donc arrêté d'attendre. Veuillez réessayer — votre réponse n'est jamais enregistrée deux fois.",
      errorRateLimited: "Trop de tentatives depuis cette connexion. Merci de patienter une minute avant de réessayer.",
      errorInvalidCode: "Nous n'avons pas trouvé votre invitation. Ouvrez le lien personnel complet que vous avez reçu, puis réessayez.",
      errorGuestCount: "Ce nombre de personnes n'est pas disponible pour cette invitation.",
      errorAttending: "Veuillez choisir une option.",
      closedTitle: "RSVP clos",
      closedMessage: "Merci de votre intérêt — la date limite de confirmation est dépassée. N'hésitez pas à contacter directement les mariés.",
      loading: "Chargement de votre invitation…",
      noCode: "Pour répondre, merci d'utiliser le lien personnel reçu avec votre invitation.",
      incompleteLink: "Ce lien est peut-être incomplet — vérifiez que vous avez bien ouvert le lien complet qui vous a été envoyé.",
      lookupError: "Impossible de charger le formulaire de réponse pour le moment. Vérifiez votre connexion et réessayez.",
      retry: "Réessayer",
      previousAccepted: "Votre réponse actuelle : présent(e), {guests}. Vous pouvez la modifier ci-dessous.",
      previousDeclined: "Votre réponse actuelle : absent(e). Vous pouvez la modifier ci-dessous.",
      closedAccepted: "Votre réponse : présent(e), {guests}.",
      closedDeclined: "Votre réponse : absent(e).",
      guestsLimit: "Jusqu'à {guests} pour cette invitation.",
      guestsSingle: "Cette invitation est valable pour 1 personne.",
      guestsUnconfirmed: "Le nombre de places de cette invitation est en cours de confirmation ; pour l'instant, vous pouvez répondre pour 1 personne.",
      guestUnit: ["personne", "personnes"],
      submitUpdate: "Mettre à jour ma réponse",
      successUpdated: "Votre réponse a bien été mise à jour.",
      changeReply: "Modifier ma réponse",
    },
    extras: {
      galleryTitle: "GALERIE",
      dressCodeTitle: "Code vestimentaire",
      giftsTitle: "Cadeaux",
    },
    closing: {
      withLove: "Avec amour,",
      waitingForYou: "Nous vous attendons !",
      footer: "FAIT AVEC AMOUR",
    },
    music: {
      play: "Écouter la musique",
      pause: "Couper le son",
    },
    companion: {
      label: "Défiler jusqu'au RSVP",
    },
    langToggle: "EN",
  },
};

const LANG_STORAGE_KEY = "wedding-lang";

// The language the guest explicitly toggled to on an earlier visit, if any.
// Only the manual toggle ever writes this (see persistLanguage).
export function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    // localStorage unavailable (private mode, disabled storage, etc.)
  }
  return null;
}

// Resolves the starting language. A fixed "en"/"fr" config always wins. For
// "bilingual", a language the guest previously toggled to (remembered in
// localStorage) wins; otherwise it's detected from the browser, defaulting
// to French only when navigator.language starts with "fr". An invitation's
// preferred_language, once looked up, overrides the browser guess but never
// a manual choice (see applyPreferredLanguage in utils/store.js).
export function resolveInitialLanguage(configLanguage) {
  if (configLanguage !== "bilingual") {
    return configLanguage === "fr" ? "fr" : "en";
  }

  const stored = getStoredLanguage();
  if (stored) return stored;

  const navLang = typeof navigator !== "undefined" ? navigator.language || "" : "";
  return navLang.toLowerCase().startsWith("fr") ? "fr" : "en";
}

// Remembers a guest's explicit language choice for their next visit.
export function persistLanguage(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Ignore — persistence is a nice-to-have, not a requirement.
  }
}
