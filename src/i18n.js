// ============================================================================
// i18n — all UI strings (not content, which lives in config.js) per language.
// Add a new language by adding a new top-level key with the same shape.
// ============================================================================

export const i18n = {
  en: {
    envelope: {
      hint: "Tap to open",
    },
    hero: {
      dateFormat: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
    },
    greeting: {
      dear: "Dear",
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
      deadlinePrefix: "Kindly respond by",
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
      hint: "Touchez pour ouvrir",
    },
    hero: {
      dateFormat: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
    },
    greeting: {
      dear: "Cher/Chère",
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
      deadlinePrefix: "Merci de répondre avant le",
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

// Resolves the active language: "bilingual" starts on "en" but can be toggled.
export function resolveInitialLanguage(configLanguage) {
  if (configLanguage === "bilingual") return "en";
  return configLanguage === "fr" ? "fr" : "en";
}
