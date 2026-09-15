// Strips anything that isn't a plain readable name character. Used for the
// ?guest= URL param, which must never be inserted via innerHTML.
export function sanitizeGuestName(raw) {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim().slice(0, 60);
  // Letters (incl. accented), numbers, spaces, apostrophes, hyphens only.
  const cleaned = trimmed.replace(/[^\p{L}\p{N}\s'-]/gu, "");
  return cleaned.trim();
}
