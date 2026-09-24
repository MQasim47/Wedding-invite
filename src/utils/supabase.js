// Minimal Supabase REST client (plain fetch, no SDK) for calling the
// guest-system's anon RPCs. Uses the ANON key only — it is public by design
// (it ships in this bundle) and every read/write goes through Row Level
// Security or a SECURITY DEFINER function. vite.config.js refuses to build with anything
// that isn't an anon key.
const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export class SupabaseError extends Error {
  // kind: "config" | "network" | "timeout" | "rate_limited" | "server",
  // or the exception name a function raised (e.g. "invalid_code",
  // "rsvp_closed", "invalid_guest_count"). Never carries request data —
  // callers must not be able to log a guest's code by logging an error.
  constructor(kind) {
    super(kind);
    this.kind = kind;
  }
}

async function request(path, { method = "GET", body, timeoutMs = 15000, signal } = {}) {
  if (!URL_BASE || !ANON_KEY) throw new SupabaseError("config");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });

  let response;
  try {
    response = await fetch(`${URL_BASE}${path}`, {
      method,
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      // The code is in the POST body, never the URL — and never sent as a
      // Referer either.
      referrerPolicy: "no-referrer",
      cache: "no-store",
    });
  } catch {
    throw new SupabaseError(controller.signal.aborted && !signal?.aborted ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }

  // A function can legitimately return JSON null (e.g. an unset setting),
  // so track "parsed" separately from the value.
  let data = null;
  let parsed = false;
  try {
    data = await response.json();
    parsed = true;
  } catch {
    // fall through — handled below
  }

  if (!response.ok) {
    // RAISE EXCEPTION 'name' in the guest-system functions arrives as
    // { code: "P0001", message: "name" }.
    const message = data && typeof data.message === "string" ? data.message : "";
    if (/^[a-z_]{3,40}$/.test(message)) throw new SupabaseError(message);
    throw new SupabaseError(response.status === 429 ? "rate_limited" : "server");
  }
  if (!parsed) throw new SupabaseError("server");
  return data;
}

// POST /rest/v1/rpc/<fn>. Arguments go in the body, so an invitation code
// never appears in a URL, a server access log path, or a Referer header.
export function rpc(fn, args, options) {
  return request(`/rest/v1/rpc/${fn}`, { method: "POST", body: args, ...options });
}

// Reads one public setting through the guest-system's get_public_setting
// RPC, which only answers for an allowlisted key (the settings table itself
// is admin-only). Resolves to the value string, or null if unset.
export async function getSetting(key, options) {
  const value = await rpc("get_public_setting", { p_key: key }, options);
  return typeof value === "string" ? value : null;
}
