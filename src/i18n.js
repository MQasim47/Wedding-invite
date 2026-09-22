// ============================================================================
// i18n — all UI strings (not content, which lives in config.js) per language.
// Add a new language by adding a new top-level key with the same shape.
// ============================================================================

export const i18n = {
  en: {
    envelope: {
      hint: "(tap to open)",
    },
    greeting: {
      dear: "Dear",
    },
    welcome: {
      heading: "Dear guests!",
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
      name: "Full Name",
      namePlaceholder: "Your full name",
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
      errorGeneric: "Something went wrong. Please try again.",
      errorName: "Please enter your name.",
      errorAttending: "Please select an option.",
      demoNotice: "Demo mode — no data was actually sent.",
      closedTitle: "RSVP Closed",
      closedMessage: "Thank you for your interest — the RSVP deadline has passed. Please reach out to the couple directly if you'd like to let them know.",
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
    greeting: {
      dear: "Cher/Chère",
    },
    welcome: {
      heading: "Chers invités !",
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
      name: "NOM ET PRÉNOM",
      namePlaceholder: "Votre nom et prénom",
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
      errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
      errorName: "Veuillez saisir votre nom.",
      errorAttending: "Veuillez choisir une option.",
      demoNotice: "Mode démo — aucune donnée n'a été envoyée.",
      closedTitle: "RSVP clos",
      closedMessage: "Merci de votre intérêt — la date limite de confirmation est dépassée. N'hésitez pas à contacter directement les mariés.",
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

// Resolves the starting language. A fixed "en"/"fr" config always wins. For
// "bilingual", a language the guest previously toggled to (remembered in
// localStorage) wins; otherwise it's detected from the browser, defaulting
// to French only when navigator.language starts with "fr".
export function resolveInitialLanguage(configLanguage) {
  if (configLanguage !== "bilingual") {
    return configLanguage === "fr" ? "fr" : "en";
  }

  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    // localStorage unavailable (private mode, disabled storage, etc.) — fall
    // through to browser-language detection.
  }

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
