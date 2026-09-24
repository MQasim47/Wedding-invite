import { rpc, getSetting } from "./supabase.js";

// ============================================================================
// Personal invitation codes (?i=<code>), issued by the guest-system
// dashboard. The code is looked up once per page load through the
// get_invitation_by_public_code RPC, which only ever returns what the guest
// may see: display name, authorized guest count, RSVP status/count, and
// preferred language.
//
// Codes must never be logged, put in an error message, or sent anywhere but
// that RPC's POST body.
// ============================================================================

// Same alphabet as guest-system/src/lib/codes.ts (no I, L, O, 0, 1).
const CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;
const SESSION_KEY = "wedding-invite-code";

// Guests paste links from WhatsApp/SMS, so be forgiving about case and stray
// whitespace (including a trailing "%20").
export function normalizeCode(raw) {
  if (typeof raw !== "string") return null;
  const code = raw.replace(/\s+/g, "").toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

function readSession() {
  try {
    return normalizeCode(sessionStorage.getItem(SESSION_KEY) || "");
  } catch {
    return null;
  }
}

function writeSession(code) {
  try {
    if (code) sessionStorage.setItem(SESSION_KEY, code);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable (private mode etc.) — the URL still carries the code.
  }
}

// The URL is the source of truth: whenever ?i= is present it wins, and a
// malformed one clears whatever the session remembered. The session copy is
// only a fallback for when the query string is lost within the same tab, and
// is then written back into the URL so what the guest sees is what is used.
function resolveCode() {
  const url = new URL(window.location.href);
  if (url.searchParams.has("i")) {
    const code = normalizeCode(url.searchParams.get("i"));
    writeSession(code);
    return { present: true, code };
  }

  const stored = readSession();
  if (stored) {
    url.searchParams.set("i", stored);
    try {
      history.replaceState(history.state, "", url);
    } catch {
      // Not fatal — the code still works for this page view.
    }
    return { present: true, code: stored };
  }
  return { present: false, code: null };
}

const resolved = typeof window !== "undefined" ? resolveCode() : { present: false, code: null };

// Only the RSVP submission needs the raw code; nothing else should read it.
export function getInvitationCode() {
  return resolved.code;
}

// status:
//   "none"      no ?i= at all — the generic invitation
//   "loading"   lookup in flight
//   "found"     valid code; `invitation` is set
//   "not_found" ?i= present but malformed or unknown (never says which)
//   "error"     lookup failed (network, rate limit, ...); `errorKind` is set
let state = resolved.present ? { status: "loading" } : { status: "none" };
const listeners = new Set();

function setState(next) {
  state = next;
  listeners.forEach((fn) => fn(state));
}

export function getInvitationState() {
  return state;
}

export function onInvitationChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function toInt(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

// Whitelists and normalizes the RPC row — anything else it returns is dropped.
function toInvitation(row) {
  const status = ["pending", "accepted", "declined"].includes(row.rsvp_status) ? row.rsvp_status : "pending";
  return {
    displayName: typeof row.display_name === "string" ? row.display_name.trim().slice(0, 80) : "",
    authorizedGuests: toInt(row.authorized_guests),
    rsvpStatus: status,
    confirmedGuests: toInt(row.confirmed_guests),
    preferredLanguage: row.preferred_language === "en" || row.preferred_language === "fr" ? row.preferred_language : null,
  };
}

export async function loadInvitation() {
  if (!resolved.present) return state;
  if (!resolved.code) {
    // Malformed: same outcome as an unknown code, without spending a lookup.
    setState({ status: "not_found" });
    return state;
  }

  setState({ status: "loading" });
  try {
    const rows = await rpc("get_invitation_by_public_code", { p_code: resolved.code });
    if (Array.isArray(rows) && rows.length > 0 && rows[0]) {
      setState({ status: "found", invitation: toInvitation(rows[0]) });
    } else {
      writeSession(null);
      setState({ status: "not_found" });
    }
  } catch (err) {
    setState({ status: "error", errorKind: err?.kind || "server" });
  }
  return state;
}

// After a successful RSVP, reflect the saved answer without another lookup.
export function updateInvitationRsvp({ rsvpStatus, confirmedGuests }) {
  if (state.status !== "found") return;
  setState({ status: "found", invitation: { ...state.invitation, rsvpStatus, confirmedGuests } });
}

// The RSVP deadline lives in the guest-system `settings` table (read via the
// get_public_setting RPC) so the client can change it from the dashboard
// without a redeploy. Resolves to a
// "YYYY-MM-DD" string, or null if it's missing or couldn't be read (the
// server still enforces it on submission).
let deadlinePromise = null;
export function loadRsvpDeadline() {
  if (!deadlinePromise) {
    deadlinePromise = getSetting("rsvp_deadline")
      .then((value) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : null))
      .catch(() => null);
  }
  return deadlinePromise;
}
