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
      months: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ],
    },
    schedule: {
      title: "Wedding Day Schedule",
    },
    venue: {
      title: "Venue",
      openMaps: "Open in Google Maps",
    },
    countdown: {
      title: "Counting Down",
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
      hint: "(touchez pour ouvrir)",
    },
    greeting: {
      dear: "Cher/Chère",
    },
    story: {
      title: "Notre histoire",
    },
    weddingParty: {
      title: "Cortège nuptial",
      bridesmaids: "Demoiselles d'honneur",
      groomsmen: "Garçons d'honneur",
    },
    calendar: {
      title: "Réservez la date",
      weekdays: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
      months: [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
      ],
    },
    schedule: {
      title: "Déroulement de la journée",
    },
    venue: {
      title: "Lieu",
      openMaps: "Ouvrir dans Google Maps",
    },
    countdown: {
      title: "Compte à rebours",
      days: "Jours",
      hours: "Heures",
      minutes: "Minutes",
      seconds: "Secondes",
      married: "Jeunes mariés !",
      marriedSub: "Merci d'avoir célébré avec nous.",
      addToCalendar: "Ajouter au calendrier",
    },
    rsvp: {
      title: "RSVP",
      deadlinePrefix: "Merci de confirmer votre présence avant le",
      name: "Nom complet",
      namePlaceholder: "Votre nom complet",
      attending: "Serez-vous présent(e) ?",
      attendingYes: "Accepte avec joie",
      attendingNo: "Décline avec regret",
      guests: "Nombre d'invités",
      message: "Message (facultatif)",
      messagePlaceholder: "Laissez un mot pour les mariés...",
      submit: "Envoyer",
      submitting: "Envoi en cours...",
      successTitle: "Merci !",
      successMessage: "Votre réponse a bien été reçue.",
      errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
      errorName: "Veuillez entrer votre nom.",
      errorAttending: "Veuillez sélectionner une option.",
      demoNotice: "Mode démo — aucune donnée n'a été envoyée.",
      closedTitle: "RSVP clôturé",
      closedMessage: "Merci de votre intérêt — la date limite de confirmation est dépassée. N'hésitez pas à contacter directement les mariés.",
    },
    extras: {
      galleryTitle: "Galerie",
      dressCodeTitle: "Code vestimentaire",
      giftsTitle: "Cadeaux",
    },
    closing: {
      footer: "Fait avec amour",
    },
    music: {
      play: "Jouer la musique",
      pause: "Mettre en pause",
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
