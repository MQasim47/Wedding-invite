import { sanitizeGuestName } from "./sanitize.js";

// Reads and sanitizes the ?guest=Name query parameter, if present.
export function getGuestName() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("guest");
  if (!raw) return "";
  return sanitizeGuestName(raw);
}
