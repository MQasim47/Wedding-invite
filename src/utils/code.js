// Invitation code helpers shared by the invitation page and the door
// check-in page (/checkin/). Importing this has no side effects.
//
// Codes must never be logged, put in an error message, or sent anywhere but
// a database function's POST body.

// Same alphabet as guest-system/src/lib/codes.ts (no I, L, O, 0, 1).
const CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

// Guests paste links from WhatsApp/SMS, so be forgiving about case and stray
// whitespace (including a trailing "%20").
export function normalizeCode(raw) {
  if (typeof raw !== "string") return null;
  const code = raw.replace(/\s+/g, "").toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

// Accepts a bare code ("abcd 2345") or a whole pasted personal link.
export function extractCode(raw) {
  if (typeof raw !== "string") return null;
  const direct = normalizeCode(raw);
  if (direct) return direct;
  const match = raw.match(/[?&]i=([A-Za-z0-9]{8})(?![A-Za-z0-9])/);
  return match ? normalizeCode(match[1]) : null;
}

// The door check-in page usually opens in a fresh tab (the guest's camera
// app hands the URL to the browser), so the code is also remembered in
// localStorage once it has been confirmed valid — that is what lets "scan
// the door code" check them in without typing anything.
const PASS_KEY = "wedding-pass-code";

export function rememberPassCode(code) {
  try {
    if (code) localStorage.setItem(PASS_KEY, code);
  } catch {
    // storage unavailable (private mode) — they'll be asked for the code
  }
}

export function readPassCode() {
  try {
    return normalizeCode(localStorage.getItem(PASS_KEY) || "");
  } catch {
    return null;
  }
}

export function forgetPassCode() {
  try {
    localStorage.removeItem(PASS_KEY);
  } catch {
    // ignore
  }
}
