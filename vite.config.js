import { defineConfig, loadEnv } from "vite";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Injects <meta>/<title> tags from src/config.js into index.html at both
// dev and build time, so config.js stays the single source of truth even
// for SEO/Open Graph tags that social crawlers read from static HTML.
function injectMetaFromConfig() {
  return {
    name: "inject-meta-from-config",
    async transformIndexHtml(html) {
      const { config } = await import("./src/config.js");
      const { title, description, ogImage, siteUrl } = config.meta;
      const absoluteOgImage = ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`;

      return html
        .replaceAll("__META_TITLE__", title)
        .replaceAll("__META_DESCRIPTION__", description)
        .replaceAll("__OG_IMAGE__", absoluteOgImage)
        .replaceAll("__SITE_URL__", siteUrl)
        .replaceAll("__THEME_COLOR__", config.theme.primary);
    },
  };
}

// The site talks to Supabase with the ANON key only. It ships in the
// browser bundle by design, so the one thing that must never happen is a
// privileged key ending up there: refuse to build unless the key is a
// legacy JWT whose role is "anon" (or a new-style publishable key). A
// production build also refuses to run without the URL and key at all —
// on Vercel that keeps the last good deployment live instead of shipping a
// site whose RSVP form can't work.
function checkSupabaseEnv(env, command) {
  const url = env.VITE_SUPABASE_URL || "";
  const key = env.VITE_SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    const msg = "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (.env.local locally, Project Settings → Environment Variables on Vercel).";
    if (command === "build") throw new Error(msg);
    console.warn(`[supabase] ${msg} The RSVP form will show a load error until they are.`);
    return;
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
    throw new Error("VITE_SUPABASE_URL must look like https://<project-ref>.supabase.co");
  }

  if (key.startsWith("sb_publishable_")) return;
  if (key.startsWith("sb_secret_")) throw new Error("VITE_SUPABASE_ANON_KEY is a SECRET key. Only the anon/publishable key may be used by this site.");

  let role = null;
  try {
    role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8")).role;
  } catch {
    // not a JWT — handled below
  }
  if (role !== "anon") {
    throw new Error(`VITE_SUPABASE_ANON_KEY must be the anon key (JWT role "anon"); got ${role ? `role "${role}"` : "something else"}. The service role key must never be used by this site.`);
  }
}

export default defineConfig(async ({ command, mode }) => {
  const { config } = await import("./src/config.js");
  checkSupabaseEnv(loadEnv(mode, process.cwd(), "VITE_"), command);

  // Checked on disk at build/dev-server-start time (not in the browser) so
  // the app never issues a request for a missing audio file at runtime —
  // that request would always show up as a failed-resource console error,
  // no matter how the rejection is caught in JS. Every track in the
  // playlist must exist, or the music button is hidden entirely.
  const tracks = config.music.tracks || [];
  const audioAvailable =
    config.music.enabled &&
    tracks.length > 0 &&
    tracks.every((track) => existsSync(resolve("public", track.replace(/^\/+/, ""))));

  return {
    plugins: [injectMetaFromConfig()],
    define: {
      __AUDIO_AVAILABLE__: JSON.stringify(audioAvailable),
    },
  };
});
