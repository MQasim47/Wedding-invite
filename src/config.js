// ============================================================================
// CONFIG — the single source of truth for all wedding invitation content.
//
// To personalize this site with real details, edit ONLY this file and
// replace the placeholder assets in /public (images, audio, favicon).
// Never edit component/animation code to change content, text, or colors.
// ============================================================================

export const config = {
  // "en" | "fr" | "bilingual" — bilingual renders an EN/FR toggle button.
  language: "bilingual",

  couple: {
    partner1: "Alex",
    partner2: "Sarah",
    initials: "A&S",
  },

  // ISO 8601 with timezone offset. Drives the countdown, calendar, and .ics file.
  weddingDate: "2026-12-12T16:00:00+05:00",
  timezoneLabel: "PKT",

  welcomeMessage: {
    en: "Together with our families, we joyfully invite you to celebrate the beginning of our new chapter.",
    fr: "Avec nos familles, nous avons la joie de vous inviter à célébrer le début de notre nouvelle vie.",
  },

  schedule: [
    { time: "16:00", title: { en: "Ceremony", fr: "Cérémonie" }, icon: "rings" },
    { time: "18:00", title: { en: "Reception", fr: "Réception" }, icon: "glasses" },
    { time: "19:30", title: { en: "Dinner", fr: "Dîner" }, icon: "dinner" },
    { time: "23:00", title: { en: "Farewell", fr: "Fin de soirée" }, icon: "heart" },
  ],

  venues: [
    {
      name: "Grand Palace Hall",
      address: "123 Placeholder Street, City",
      mapsUrl: "https://maps.google.com/?q=Grand+Palace+Hall",
    },
    // Add a second object here (e.g. a separate reception venue) and the
    // Venue section will automatically render both as cards.
  ],

  closingMessage: {
    en: "We can't wait to celebrate with you",
    fr: "Nous avons hâte de célébrer avec vous",
  },

  theme: {
    primary: "#6B1E2E", // burgundy
    accent: "#C9A96E", // gold
    background: "#FBF7F2", // cream
    text: "#3A2A2A",
    envelope: "#8A9A7B", // sage
  },

  music: {
    enabled: true,
    src: "/audio/placeholder.mp3",
  },

  rsvp: {
    enabled: true,
    deadline: "2026-11-20",
    endpoint: "", // Google Apps Script web app URL — empty string = demo mode
    maxGuests: 6,
  },

  extras: {
    gallery: { enabled: false, images: [] },
    dressCode: { enabled: false, text: { en: "", fr: "" } },
    gifts: { enabled: false, text: { en: "", fr: "" } },
  },

  meta: {
    title: "Alex & Sarah — Wedding Invitation",
    description: "You're invited to our wedding on 12 December 2026",
    ogImage: "/images/og-image.jpg", // 1200x630 — regenerate from og-image.svg if names/date change, see README
    siteUrl: "https://example.vercel.app",
  },
};
