import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";

function createGallery() {
  const { gallery } = config.extras;
  if (!gallery.enabled || gallery.images.length === 0) return null;

  const items = gallery.images.map((src, i) =>
    el("div", { class: "gallery-item" }, [
      el("img", { src, alt: `Gallery photo ${i + 1}`, loading: "lazy", decoding: "async" }),
    ])
  );

  const title = el("h2", { class: "section-title-serif" }, t().extras.galleryTitle);
  const node = el("section", { class: "section", id: "gallery" }, [title, el("div", { class: "gallery-scroll" }, items)]);

  return { node, updateLang: () => (title.textContent = t().extras.galleryTitle) };
}

function createDressCode() {
  const { dressCode } = config.extras;
  if (!dressCode.enabled) return null;

  const title = el("h2", { class: "section-title-serif" }, t().extras.dressCodeTitle);
  const text = el("p", { class: "extras-text" }, dressCode.text[getLang()] || dressCode.text.en);
  const node = el("section", { class: "section", id: "dress-code" }, [title, text]);

  return {
    node,
    updateLang: () => {
      title.textContent = t().extras.dressCodeTitle;
      text.textContent = dressCode.text[getLang()] || dressCode.text.en;
    },
  };
}

function createGifts() {
  const { gifts } = config.extras;
  if (!gifts.enabled) return null;

  const title = el("h2", { class: "section-title-serif" }, t().extras.giftsTitle);
  const text = el("p", { class: "extras-text" }, gifts.text[getLang()] || gifts.text.en);
  const node = el("section", { class: "section", id: "gifts" }, [title, text]);

  return {
    node,
    updateLang: () => {
      title.textContent = t().extras.giftsTitle;
      text.textContent = gifts.text[getLang()] || gifts.text.en;
    },
  };
}

// Returns an array of { node, updateLang } for every enabled extra.
export function createExtrasSections() {
  return [createGallery(), createDressCode(), createGifts()].filter(Boolean);
}
