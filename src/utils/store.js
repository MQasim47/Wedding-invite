import { config } from "../config.js";
import { i18n, resolveInitialLanguage } from "../i18n.js";

// Minimal pub-sub store for the active language, so every section can
// re-render its text when the user toggles EN/FR in bilingual mode.
const listeners = new Set();
let currentLang = resolveInitialLanguage(config.language);

export function getLang() {
  return currentLang;
}

export function t() {
  return i18n[currentLang];
}

export function setLang(lang) {
  if (lang !== "en" && lang !== "fr") return;
  currentLang = lang;
  document.documentElement.setAttribute("lang", lang);
  listeners.forEach((fn) => fn(currentLang));
}

export function toggleLang() {
  setLang(currentLang === "en" ? "fr" : "en");
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
