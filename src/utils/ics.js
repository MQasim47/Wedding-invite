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

// Builds and downloads a .ics calendar file spanning the ceremony start
// through the end of the reception, with every venue address included in
// the description. DTSTART/DTEND are emitted in UTC (toICSDate), so the
// event lands at the correct instant for a guest in any timezone.
export function downloadICS() {
  const lang = getLang();
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

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@wedding-invitation`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(summary)}`,
    `LOCATION:${escapeICS(location)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    "END:VEVENT",
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
