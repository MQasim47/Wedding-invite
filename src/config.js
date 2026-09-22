// ============================================================================
// CONFIG — the single source of truth for all wedding invitation content.
//
// To personalize this site with real details, edit ONLY this file and
// replace the placeholder assets in /public (images, audio, favicon).
// Never edit component/animation code to change content, text, or colors.
// ============================================================================

export const config = {
  // "en" | "fr" | "bilingual" — bilingual renders an EN/FR toggle button and
  // auto-detects the guest's starting language from their browser, then
  // remembers their choice (see src/i18n.js resolveInitialLanguage).
  language: "bilingual",

  couple: {
    partner1: "Dalida",
    partner2: "Aimé",
    initials: "D&A",
    tagline: {
      en: "are getting married",
      fr: "se marient",
    },
    // Shown in the "Our Story" section, in an elegant frame. Points at the
    // optimized WebP copy produced by `npm run optimize:photos` — never the
    // raw original. `position` is a CSS object-position value, tuned per
    // photo so faces stay in frame when cropped to the frame's aspect ratio.
    photo: {
      src: "/images/couple/optimized/first-photo.webp",
      alt: {
        en: "Dalida and Aimé in elegant black formal wear",
        fr: "Dalida et Aimé en tenue formelle noire élégante",
      },
      position: "center",
    },
  },

  // ISO 8601 with timezone offset. Drives the countdown, calendar, and the
  // .ics file. This is the ceremony start time — the .ics event runs from
  // here through the end of the reception (see src/utils/ics.js).
  weddingDate: "2026-12-05T15:00:00-05:00",
  timezoneLabel: "EST",
  // Literal bilingual display strings (not derived from Intl formatting) so
  // the exact wording/punctuation is guaranteed on both languages.
  weddingDateDisplay: {
    en: "Saturday · December 5, 2026",
    fr: "samedi 5 décembre 2026",
  },

  welcomeMessage: {
    en: [
      "With hearts full of love and joy, we invite you to celebrate with us as we begin one of the most beautiful chapters of our lives together.",
      "Your presence will make our special day even more meaningful and unforgettable.",
    ],
    fr: [
      "Le cœur rempli d'amour et de joie, nous vous invitons à célébrer avec nous le début de l'un des plus beaux chapitres de notre vie.",
      "Votre présence rendra cette journée encore plus précieuse et inoubliable.",
    ],
  },

  // Each item can carry its own venue (via venueIndex, into the venues array
  // below), dress code, and an optional extra note — all shown in the
  // timeline, and dress codes are also rolled up under the matching venue
  // card in the Venue section.
  schedule: [
    {
      time: { en: "3:00 PM", fr: "15h00" },
      title: { en: "Wedding Ceremony", fr: "Cérémonie de mariage" },
      icon: "rings",
      venueIndex: 0,
      dressCode: { en: "Elegant Daytime Attire", fr: "Tenue de jour élégante" },
      note: {
        en: "Ladies: English-style hats encouraged",
        fr: "Mesdames : chapeaux à l'anglaise bienvenus",
      },
    },
    {
      time: { en: "4:30 PM", fr: "16h30" },
      title: { en: "Cocktail", fr: "Cocktail" },
      icon: "glasses",
      venueIndex: 0,
    },
    {
      time: { en: "8:00 PM", fr: "20h00" },
      title: { en: "Wedding Reception", fr: "Réception" },
      icon: "dinner",
      venueIndex: 1,
      dressCode: { en: "Formal Evening Attire", fr: "Tenue de soirée" },
    },
  ],

  // heading/label are bilingual (or a plain string when identical in both
  // languages). Index here is what schedule[].venueIndex points at.
  venues: [
    {
      heading: { en: "Ceremony & Cocktail", fr: "Cérémonie & Cocktail" },
      label: null,
      address: "11010 North Riding Rd, Upper Marlboro, MD 20772",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=11010+North+Riding+Rd+Upper+Marlboro+MD+20772",
    },
    {
      heading: { en: "DMV Events Center", fr: "DMV Events Center" },
      label: { en: "Reception", fr: "Réception" },
      address: "6545 Annapolis Rd, Hyattsville, MD 20784",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=DMV+Events+Center+6545+Annapolis+Rd+Hyattsville+MD+20784",
    },
  ],

  // Dedicated section between "Our Story" and the calendar. Leave `photo`
  // empty for a drawn silhouette placeholder — drop a real optimized photo
  // path in later (see couple.photo above for the pipeline). An entry with
  // `lead: true` (the Maid of Honor / Best Man) is shown larger, on a row of
  // its own with a double gold ring; everyone else sits in a grid beneath.
  // Add more entries as the client sends them; each needs a square
  // face-centered photo (see public/images/wedding-party/README.md).
  weddingParty: {
    enabled: true,
    bridesmaids: [
      { name: "Rita", role: { en: "Maid of Honor", fr: "Témoin de la mariée" }, photo: "/images/wedding-party/rita.webp", lead: true },
      { name: "Irene", role: { en: "Bridesmaid", fr: "Demoiselle d'honneur" }, photo: "/images/wedding-party/irene.webp" },
      { name: "Lovelyn", role: { en: "Bridesmaid", fr: "Demoiselle d'honneur" }, photo: "/images/wedding-party/lovelyn.webp" },
      { name: "Liliane", role: { en: "Bridesmaid", fr: "Demoiselle d'honneur" }, photo: "/images/wedding-party/liliane.webp" },
      { name: "Marie", role: { en: "Bridesmaid", fr: "Demoiselle d'honneur" }, photo: "/images/wedding-party/marie.webp" },
      { name: "Nadège", role: { en: "Bridesmaid", fr: "Demoiselle d'honneur" }, photo: "/images/wedding-party/nadege.webp" },
      { name: "Vanilla", role: { en: "Bridesmaid", fr: "Demoiselle d'honneur" }, photo: "/images/wedding-party/vanilla.webp" },
    ],
    groomsmen: [
      { name: "Franck", role: { en: "Best Man", fr: "Témoin du marié" }, photo: "/images/wedding-party/franck.webp", lead: true },
      { name: "Rodrigue", role: { en: "Groomsman", fr: "Garçon d'honneur" }, photo: "/images/wedding-party/rodrigue.webp" },
      { name: "Roger", role: { en: "Groomsman", fr: "Garçon d'honneur" }, photo: "/images/wedding-party/roger.webp" },
      { name: "Pecos", role: { en: "Groomsman", fr: "Garçon d'honneur" }, photo: "/images/wedding-party/pecos.webp" },
    ],
  },

  closingMessage: {
    en: "Two hearts, two lives, one promise forever.",
    fr: "Deux cœurs, deux vies, une seule promesse pour toujours.",
  },

  theme: {
    background: "#FFFCFA",
    surface: "#FCEFF3",
    text: "#3E2A2E",
    primary: "#D06C90", // clear, bright pink — fills, hearts, borders, ornaments, large script headings. Never white/small text — only ~3.3:1 against white.
    primaryDeep: "#9E3A60", // deeper pink — buttons/badges/fills carrying white or small text, links, pressed states
    accent: "#C9A227",
    accentSoft: "#E5CE9A",
    envelope: "#F2A8C0",
  },

  // Interior decoration — the envelope's damask-and-gold language carried
  // inside the invitation. Each piece is independent: set any of them to
  // false to switch it off (the page then looks exactly as it did before).
  decor: {
    damaskWatermark: true, // the envelope's damask as a very faint gold watermark behind the whole page
    cornerFlourishes: true, // ornate gold corner brackets that draw in on the major sections
    monogram: true, // the D&A crest: once above the names in the hero, once in the closing
    paperTexture: true, // an ivory paper grain, and a soft embossed shadow on frames and cards
    damaskOpacity: 0.04, // watermark strength: 0.03–0.05 stays a whisper
  },

  music: {
    // Plays track 1 first, then track 2, then loops back to track 1 —
    // starts on the envelope tap (a real user gesture, so autoplay is never
    // blocked) with a short fade-in. See vite.config.js for the build-time
    // check that hides the music button entirely if a listed file is
    // missing on disk.
    enabled: true,
    tracks: ["/audio/song-1.mp3", "/audio/song-2.mp3"],
  },

  rsvp: {
    enabled: true,
    deadline: "2026-10-15",
    endpoint: "", // Google Apps Script web app URL — empty string = demo mode
    maxGuests: 6,
  },

  extras: {
    gallery: {
      enabled: true,
      // Each item: { src, alt: { en, fr }, position }. `position` is a CSS
      // object-position value tuned per photo so faces stay in frame at
      // narrow viewport widths. Sources point at the optimized WebP copies
      // (see couple.photo above and README's photo pipeline section).
      images: [
        {
          src: "/images/couple/optimized/first-photo.webp",
          alt: { en: "Dalida and Aimé in elegant black formal wear", fr: "Dalida et Aimé en tenue formelle noire élégante" },
          position: "center",
        },
        {
          src: "/images/couple/optimized/couple-1.webp",
          alt: { en: "Aimé in a formal white tuxedo", fr: "Aimé en smoking blanc" },
          position: "center 12%",
        },
        {
          src: "/images/couple/optimized/couple-2.webp",
          alt: { en: "Dalida and Aimé in elegant white attire", fr: "Dalida et Aimé en tenue blanche élégante" },
          position: "center 15%",
        },
        {
          src: "/images/couple/optimized/couple-3.webp",
          alt: { en: "Dalida and Aimé in gold-embroidered attire", fr: "Dalida et Aimé en tenue brodée dorée" },
          position: "center 15%",
        },
        {
          src: "/images/couple/optimized/couple-4.webp",
          alt: { en: "Dalida and Aimé, close together", fr: "Dalida et Aimé, tout près l'un de l'autre" },
          position: "center 25%",
        },
        {
          src: "/images/couple/optimized/couple-5.webp",
          alt: { en: "Dalida and Aimé sharing a kiss in matching white outfits", fr: "Dalida et Aimé échangeant un baiser en tenues blanches assorties" },
          position: "center",
        },
        {
          src: "/images/couple/optimized/couple-6.webp",
          alt: { en: "Dalida and Aimé in matching white tees and caps", fr: "Dalida et Aimé en t-shirts blancs et casquettes assortis" },
          position: "center 15%",
        },
        {
          src: "/images/couple/optimized/couple-7.webp",
          alt: { en: "Dalida and Aimé in navy formal attire before a floral backdrop", fr: "Dalida et Aimé en tenue de soirée bleu marine devant un décor floral" },
          position: "center 15%",
        },
      ],
    },
    dressCode: { enabled: false, text: { en: "", fr: "" } },
    gifts: { enabled: false, text: { en: "", fr: "" } },
  },

  // A small floating couple avatar that follows scroll. "image" (the
  // current choice) shows a real cropped photo — `alt` is only used for
  // this type. "svg" draws a built-in flat-style bride & groom in the
  // theme colors instead (leave `src` empty) — switching back to it needs
  // no code change, just type: "svg" here. "lottie" + `src` loads a
  // Lottie JSON/.lottie file (lottie-web is only ever loaded when type is
  // "lottie"). See README for details.
  companion: {
    enabled: true,
    type: "image", // "svg" | "lottie" | "image"
    src: "/images/couple/optimized/companion.webp",
    alt: { en: "Dalida & Aimé", fr: "Dalida et Aimé" },
    position: "bottom-left",
  },

  meta: {
    title: "Dalida & Aimé — Wedding Invitation · Invitation de mariage",
    description: "You're invited to our wedding on December 5, 2026 · Vous êtes invité(e) à notre mariage le 5 décembre 2026",
    ogImage: "/images/og-image.jpg", // 1200x630 — regenerate with `npm run generate:og` if names/date change, see README
    siteUrl: "https://www.dalidaetaime.com",
  },
};
