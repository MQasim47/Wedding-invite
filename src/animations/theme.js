import { config } from "../config.js";

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

// Applies config.theme as CSS custom properties on :root, so all colors in
// the site flow from config.js alone.
export function applyTheme() {
  const root = document.documentElement;
  const { primary, accent, background, text, envelope } = config.theme;
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--color-accent", accent);
  root.style.setProperty("--color-background", background);
  root.style.setProperty("--color-text", text);
  root.style.setProperty("--color-envelope", envelope);
  root.style.setProperty("--color-primary-rgb", hexToRgb(primary));
  root.style.setProperty("--color-accent-rgb", hexToRgb(accent));
}
