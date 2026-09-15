import { defineConfig } from "vite";
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

export default defineConfig(async () => {
  const { config } = await import("./src/config.js");

  // Checked on disk at build/dev-server-start time (not in the browser) so
  // the app never issues a request for a missing audio file at runtime —
  // that request would always show up as a failed-resource console error,
  // no matter how the rejection is caught in JS.
  const audioPath = resolve("public", config.music.src.replace(/^\/+/, ""));
  const audioAvailable = config.music.enabled && existsSync(audioPath);

  return {
    plugins: [injectMetaFromConfig()],
    define: {
      __AUDIO_AVAILABLE__: JSON.stringify(audioAvailable),
    },
  };
});
