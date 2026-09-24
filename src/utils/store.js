import { config } from "../config.js";
import { i18n, resolveInitialLanguage, persistLanguage, getStoredLanguage } from "../i18n.js";

// Minimal pub-sub store for the active language, so every section can
// re-render its text when the user toggles EN/FR in bilingual mode.
const listeners = new Set();
let currentLang = resolveInitialLanguage(config.language);
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("lang", currentLang);
}

export function getLang() {
  return currentLang;
}

export function t() {
  return i18n[currentLang];
}

function switchLang(lang) {
  currentLang = lang;
  document.documentElement.setAttribute("lang", lang);
  listeners.forEach((fn) => fn(currentLang));
}

// A manual choice — remembered, and wins over everything on later visits.
export function setLang(lang) {
  if (lang !== "en" && lang !== "fr") return;
  persistLanguage(lang);
  switchLang(lang);
}

// The invitation's preferred_language from the guest system: overrides the
// browser guess, but never a language the guest picked with the toggle
// (now or on an earlier visit), and is not remembered as their choice.
export function applyPreferredLanguage(lang) {
  if (config.language !== "bilingual") return;
  if (lang !== "en" && lang !== "fr") return;
  if (getStoredLanguage() || lang === currentLang) return;
  switchLang(lang);
}

export function toggleLang() {
  setLang(currentLang === "en" ? "fr" : "en");
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
