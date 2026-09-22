import { config } from "../config.js";
import { getLang } from "./store.js";

function toICSDate(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICS(text) {
  return String(text).replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}

function resolveText(value, lang) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.en;
}

// config.weddingDate is the ceremony start. With no explicit end time for
// the last event (the reception), the event runs through 11:59 PM the same
// day, in the same timezone offset weddingDate was given in.
function resolveEndDate(startISO) {
  const match = startISO.match(/^(\d{4}-\d{2}-\d{2})T.*?(Z|[+-]\d{2}:\d{2})$/);
  if (match) return new Date(`${match[1]}T23:59:00${match[2]}`);
  return new Date(new Date(startISO).getTime() + 8 * 60 * 60 * 1000);
}

// One VEVENT block for the main ceremony-through-reception day, spanning
// config.weddingDate through the end of that day, with every venue address
// included in the description.
function mainEvent(lang, stamp) {
  const start = new Date(config.weddingDate);
  const end = resolveEndDate(config.weddingDate);

  const summary = `${config.couple.partner1} & ${config.couple.partner2} — ${resolveText(
    { en: "Wedding", fr: "Mariage" },
    lang
  )}`;

  const location = config.venues.map((venue) => venue.address).join(" / ");

  // DESCRIPTION is always bilingual regardless of the guest's current UI
  // language (SUMMARY above stays single-language) — a guest who toggles to
  // FR just to browse the site but adds the event in EN (or vice versa)
  // should still get both languages in their calendar app.
  const bilingualSummary = `${config.couple.partner1} & ${config.couple.partner2} — Wedding / Mariage`;
  const bilingualAddressLines = config.venues.map(
    (venue) => `${resolveText(venue.heading, "en")} / ${resolveText(venue.heading, "fr")}: ${venue.address}`
  );
  const description = [bilingualSummary, ...bilingualAddressLines].join("\n");

  return [
    "BEGIN:VEVENT",
    `UID:${stamp}-0@wedding-invitation`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(summary)}`,
    `LOCATION:${escapeICS(location)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    "END:VEVENT",
  ];
}

// One VEVENT per extra schedule item that opts in with its own `icsStart`
// (see config.js — currently just the barbecue) — through end of that same
// day, at its own venue, with its own dress code in the description. Any
// future extra-day event gets a calendar entry automatically just by
// setting icsStart, no code change here.
function extraEvents(lang, stamp) {
  return config.schedule
    .filter((item) => item.icsStart)
    .map((item, i) => {
      const start = new Date(item.icsStart);
      const end = resolveEndDate(item.icsStart);
      const venue = config.venues[item.venueIndex];

      const summary = `${config.couple.partner1} & ${config.couple.partner2} — ${resolveText(item.title, lang)}`;
      const bilingualSummary = `${config.couple.partner1} & ${config.couple.partner2} — ${resolveText(item.title, "en")} / ${resolveText(item.title, "fr")}`;
      const addressLine = `${resolveText(venue.heading, "en")} / ${resolveText(venue.heading, "fr")}: ${venue.address}`;
      const description = [bilingualSummary, addressLine];
      if (item.dressCode) {
        description.push(`Dress code / Tenue: ${resolveText(item.dressCode, "en")} / ${resolveText(item.dressCode, "fr")}`);
      }

      return [
        "BEGIN:VEVENT",
        `UID:${stamp}-${i + 1}@wedding-invitation`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(start)}`,
        `DTEND:${toICSDate(end)}`,
        `SUMMARY:${escapeICS(summary)}`,
        `LOCATION:${escapeICS(venue.address)}`,
        `DESCRIPTION:${escapeICS(description.join("\n"))}`,
        "END:VEVENT",
      ];
    })
    .flat();
}

// Builds and downloads a .ics calendar file with one VEVENT per program day
// (the main ceremony/cocktail/reception day, plus one per extra-day event
// such as the barbecue), each with its own address and dress code. DTSTART/
// DTEND are emitted in UTC (toICSDate), so every event lands at the correct
// instant for a guest in any timezone.
export function downloadICS() {
  const lang = getLang();
  const stamp = Date.now();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    ...mainEvent(lang, stamp),
    ...extraEvents(lang, stamp),
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wedding-invitation.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
