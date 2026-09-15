import { defineConfig } from "vite";

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

export default defineConfig({
  plugins: [injectMetaFromConfig()],
});
