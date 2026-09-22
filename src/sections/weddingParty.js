import { el, fromHTML } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { silhouetteAvatarSVG } from "../utils/icons.js";

// The lead (Maid of Honor / Best Man) gets a second, hairline ring outside the
// drawn one — static, so it simply fades in with the photo.
function ringSVG(isLead) {
  const outer = isLead ? `<circle class="party-ring-outer" cx="50" cy="50" r="49.6" />` : "";
  return `<svg class="party-ring" viewBox="0 0 100 100" aria-hidden="true">${outer}<circle class="party-ring-circle" cx="50" cy="50" r="47" /></svg>`;
}

// Columns for the members under a group's lead. Three across when the count
// divides evenly, else two when it does, so the last row is never a lone
// member; anything else falls back to three with the short row centred.
function columnsFor(count) {
  if (count % 3 === 0) return 3;
  if (count % 2 === 0) return 2;
  return Math.min(count, 3) || 1;
}

function buildMember(person, kind) {
  const isLead = person.lead === true;
  const photoInner = person.photo
    ? el("img", { src: person.photo, alt: person.name, loading: "lazy", decoding: "async" })
    : fromHTML(silhouetteAvatarSVG(kind));

  const photoWrap = el("div", { class: "party-photo-wrap" }, [fromHTML(ringSVG(isLead)), el("div", { class: "party-photo" }, [photoInner])]);

  const nameEl = el("p", { class: "party-name notranslate", translate: "no" }, person.name);
  const roleEl = el("p", { class: "party-role" }, person.role[getLang()] || person.role.en);

  const memberEl = el("div", { class: `party-member fade-up${isLead ? " party-member--lead" : ""}` }, [
    photoWrap,
    nameEl,
    roleEl,
  ]);

  return { memberEl, roleEl, person };
}

// Config-driven wedding party section, placed after "Our Story". A member
// with `lead: true` is featured on a row of its own; the rest fill a grid.
// Photos are drawn silhouette placeholders (see utils/icons.js) until real
// photos are added to config — swapping in a real photo needs no code change.
export function createWeddingPartySection() {
  const { weddingParty } = config;
  if (!weddingParty?.enabled) return null;

  const title = el("h2", { class: "section-title-serif" }, t().weddingParty.title);
  const bridesmaidsHeading = el("h3", { class: "party-group-title" }, t().weddingParty.bridesmaids);
  const groomsmenHeading = el("h3", { class: "party-group-title" }, t().weddingParty.groomsmen);

  const bridesmaidEntries = weddingParty.bridesmaids.map((p) => buildMember(p, "bridesmaid"));
  const groomsmenEntries = weddingParty.groomsmen.map((p) => buildMember(p, "groomsman"));

  const buildGrid = (entries) => {
    const rest = entries.filter((e) => !e.person.lead).length;
    return el(
      "div",
      { class: "party-grid", style: `--party-cols: ${columnsFor(rest)}` },
      entries.map((e) => e.memberEl)
    );
  };
  const bridesmaidsGrid = buildGrid(bridesmaidEntries);
  const groomsmenGrid = buildGrid(groomsmenEntries);

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
