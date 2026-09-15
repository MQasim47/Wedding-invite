import { config } from "../config.js";

function toICSDate(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICS(text) {
  return String(text).replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}

// Builds and downloads a .ics calendar file from config data.
export function downloadICS() {
  const start = new Date(config.weddingDate);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000); // 4hr default duration
  const venue = config.venues[0];
  const summary = `${config.couple.partner1} & ${config.couple.partner2} — Wedding`;
  const location = venue ? `${venue.name}, ${venue.address}` : "";

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
    `DESCRIPTION:${escapeICS(config.meta.description)}`,
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
