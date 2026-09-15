import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t } from "../utils/store.js";
import { icons } from "../utils/icons.js";

function buildVenueCard(venue) {
  return el("div", { class: "venue-card fade-up" }, [
    el("h3", { class: "venue-name" }, venue.name),
    el("p", { class: "venue-address" }, venue.address),
    el(
      "a",
      {
        class: "btn btn-outline venue-map-btn",
        href: venue.mapsUrl,
        target: "_blank",
        rel: "noopener noreferrer",
      },
      [el("span", { style: "width:16px;height:16px;", html: icons.mapPin }), t().venue.openMaps]
    ),
  ]);
}

export function createVenueSection() {
  const cardsWrap = el("div", {}, config.venues.map(buildVenueCard));

  const node = el("section", { class: "section", id: "venue" }, [
    el("h2", { class: "section-title-serif" }, t().venue.title),
    cardsWrap,
  ]);

  function updateLang() {
    node.querySelector(".section-title-serif").textContent = t().venue.title;
    cardsWrap.querySelectorAll(".venue-map-btn").forEach((btn) => {
      btn.lastChild.textContent = t().venue.openMaps;
    });
  }

  return { node, updateLang };
}
