import { el } from "../utils/dom.js";
import { t } from "../utils/store.js";
import { getGuestName } from "../utils/guestParam.js";
import { getInvitationState, onInvitationChange } from "../utils/invitation.js";
import { refreshScrollTriggers } from "../animations/scrollReveal.js";

// The name to greet, in priority order:
//   1. the invitation's display_name, when ?i=<code> is valid;
//   2. the legacy ?guest=Name param (links sent before invitation codes) —
//      also used when a code is present but can't be resolved;
//   3. nobody: no greeting at all.
// While a code is still being looked up nothing is shown, so a legacy name
// never flashes up before the real one replaces it.
function resolveName() {
  const state = getInvitationState();
  if (state.status === "loading") return "";
  if (state.status === "found" && state.invitation.displayName) return state.invitation.displayName;
  return getGuestName();
}

// Renders "Dear <Name>," / "Bonjour <Name>,". The name is inserted via
// textContent (never innerHTML), and marked notranslate so browser
// translation can't turn "Voisin blanc" into "White neighbour".
export function createGreetingSection() {
  const nameEl = el("span", { class: "notranslate", translate: "no" });
  const salutationEl = el("span");
  const textEl = el("p", { class: "greeting-name" }, [salutationEl, " ", nameEl, ","]);
  const node = el("section", { class: "section greeting fade-up" }, [textEl]);

  function render() {
    const name = resolveName();
    salutationEl.textContent = t().greeting.dear;
    nameEl.textContent = name;
    node.hidden = !name;
  }

  render();
  onInvitationChange(() => {
    render();
    refreshScrollTriggers();
  });

  return { node, updateLang: render };
}
