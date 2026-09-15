import { el } from "../utils/dom.js";
import { t } from "../utils/store.js";
import { getGuestName } from "../utils/guestParam.js";

// Renders "Dear <Name>," only when a sanitized ?guest= param is present.
// The name is inserted via textContent (never innerHTML).
export function createGreetingSection() {
  const guestName = getGuestName();
  if (!guestName) return null;

  const textEl = el("p", { class: "greeting-name" });
  textEl.textContent = `${t().greeting.dear} ${guestName},`;

  const node = el("section", { class: "section greeting fade-up" }, [textEl]);

  function updateLang() {
    textEl.textContent = `${t().greeting.dear} ${guestName},`;
  }

  return { node, updateLang };
}
