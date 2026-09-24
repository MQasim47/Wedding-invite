import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";
import { icons } from "../utils/icons.js";

function resolveText(value, lang) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.en;
}

// Rolls up dress codes from every schedule item held at this venue index,
// deduplicated, so a card only shows each distinct dress code once. A
// structured dress code contributes just its `style` line here — the full
// block (heading, colours) lives on the timeline.
function dressCodesFor(venueIndex, lang) {
  const seen = new Set();
  const codes = [];
  config.schedule.forEach((item) => {
    if (item.venueIndex !== venueIndex || !item.dressCode) return;
    const text = resolveText(item.dressCode.style ?? item.dressCode, lang);
    if (!seen.has(text)) {
      seen.add(text);
      codes.push(text);
    }
  });
  return codes;
}

function buildVenueCard(venue, index) {
  const lang = getLang();

  const labelEl = venue.label ? el("p", { class: "venue-label" }, resolveText(venue.label, lang)) : null;
  const headingEl = el("h3", { class: "venue-name notranslate", translate: "no" }, resolveText(venue.heading, lang));
  const addressEl = el("p", { class: "venue-address notranslate", translate: "no" }, venue.address);
  const dressCodes = dressCodesFor(index, lang);
  const dressCodeEl = el("p", { class: "venue-dresscode" }, dressCodes.join(" · "));
  dressCodeEl.hidden = dressCodes.length === 0;

  const mapBtn = el(
    "a",
    {
      class: "btn btn-outline venue-map-btn",
      href: venue.mapsUrl,
      target: "_blank",
      rel: "noopener noreferrer",
    },
    [el("span", { style: "width:16px;height:16px;", html: icons.mapPin }), t().venue.openMaps]
  );

  const card = el("div", { class: "venue-card fade-up" }, [labelEl, headingEl, addressEl, dressCodeEl, mapBtn]);

  return { card, venue, index, labelEl, headingEl, dressCodeEl, mapBtn };
}

export function createVenueSection() {
  const built = config.venues.map(buildVenueCard);
  const cards = built.map((entry) => entry.card);
  // A lace ribbon divider between each venue card (not after the last one).
  const interleaved = cards.flatMap((card, i) =>
    i === 0 ? [card] : [el("div", { class: "lace-ribbon", "aria-hidden": "true" }), card]
  );
  const cardsWrap = el("div", {}, interleaved);

  const sectionTitle = el("h2", { class: "section-title-serif" }, t().venue.title);

  const node = el("section", { class: "section", id: "venue" }, [sectionTitle, cardsWrap]);

  function updateLang() {
    const lang = getLang();
    sectionTitle.textContent = t().venue.title;
    built.forEach(({ venue, index, labelEl, headingEl, dressCodeEl, mapBtn }) => {
      if (labelEl && venue.label) labelEl.textContent = resolveText(venue.label, lang);
      headingEl.textContent = resolveText(venue.heading, lang);
      const codes = dressCodesFor(index, lang);
      dressCodeEl.textContent = codes.join(" · ");
      dressCodeEl.hidden = codes.length === 0;
      mapBtn.lastChild.textContent = t().venue.openMaps;
    });
  }

  return { node, updateLang };
}
