import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { silhouetteAvatarSVG } from "../utils/icons.js";

function ringSVG() {
  return `<svg class="party-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="party-ring-circle" cx="50" cy="50" r="47" /></svg>`;
}

function buildMember(person, kind, isLead) {
  const photoInner = person.photo
    ? el("img", { src: person.photo, alt: person.name, loading: "lazy", decoding: "async" })
    : fromHTML(silhouetteAvatarSVG(kind));

  const photoWrap = el("div", { class: "party-photo-wrap" }, [fromHTML(ringSVG()), el("div", { class: "party-photo" }, [photoInner])]);

  const nameEl = el("p", { class: "party-name" }, person.name);
  const roleEl = el("p", { class: "party-role" }, person.role[getLang()] || person.role.en);

  const memberEl = el("div", { class: `party-member fade-up${isLead ? " party-member--lead" : ""}` }, [
    photoWrap,
    nameEl,
    roleEl,
  ]);

  return { memberEl, roleEl, person };
}

// Config-driven wedding party section, placed after "Our Story". Photos are
// drawn silhouette placeholders (see utils/icons.js) until real photos are
// added to config — swapping in a real photo needs no code change.
export function createWeddingPartySection() {
  const { weddingParty } = config;
  if (!weddingParty?.enabled) return null;

  const title = el("h2", { class: "section-title-serif" }, t().weddingParty.title);
  const bridesmaidsHeading = el("h3", { class: "party-group-title" }, t().weddingParty.bridesmaids);
  const groomsmenHeading = el("h3", { class: "party-group-title" }, t().weddingParty.groomsmen);

  const bridesmaidEntries = weddingParty.bridesmaids.map((p, i) => buildMember(p, "bridesmaid", i === 0));
  const groomsmenEntries = weddingParty.groomsmen.map((p, i) => buildMember(p, "groomsman", i === 0));

  const bridesmaidsGrid = el("div", { class: "party-grid" }, bridesmaidEntries.map((e) => e.memberEl));
  const groomsmenGrid = el("div", { class: "party-grid" }, groomsmenEntries.map((e) => e.memberEl));

  const node = el("section", { class: "section wedding-party", id: "wedding-party" }, [
    title,
    el("div", { class: "party-group" }, [bridesmaidsHeading, bridesmaidsGrid]),
    el("div", { class: "party-group" }, [groomsmenHeading, groomsmenGrid]),
  ]);

  function updateLang() {
    const lang = getLang();
    title.textContent = t().weddingParty.title;
    bridesmaidsHeading.textContent = t().weddingParty.bridesmaids;
    groomsmenHeading.textContent = t().weddingParty.groomsmen;
    bridesmaidEntries.forEach((entry) => {
      entry.roleEl.textContent = entry.person.role[lang] || entry.person.role.en;
    });
    groomsmenEntries.forEach((entry) => {
      entry.roleEl.textContent = entry.person.role[lang] || entry.person.role.en;
    });
  }

  return { node, updateLang };
}
