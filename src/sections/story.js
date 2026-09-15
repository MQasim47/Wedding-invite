import { el } from "../utils/dom.js";
import { config } from "../config.js";
import { t, getLang } from "../utils/store.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The couple photo, in an elegant frame, between the welcome message and
// the calendar. Fades up via the generic .fade-up scroll reveal (see
// animations/scrollReveal.js) and separately zooms its image in from a
// slight over-scale via a small self-contained IntersectionObserver, so it
// doesn't touch the shared reveal animation used by every other section.
export function createStorySection() {
  const { photo } = config.couple;
  if (!photo || !photo.src) return null;

  const img = el("img", {
    src: photo.src,
    alt: photo.alt[getLang()] || photo.alt.en,
    loading: "lazy",
    decoding: "async",
    style: photo.position ? `object-position: ${photo.position};` : null,
  });
  const frame = el("div", { class: "story-photo-frame fade-up" }, [img]);
  const title = el("h2", { class: "section-title-serif" }, t().story.title);

  const node = el("section", { class: "section story", id: "story" }, [title, frame]);

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    frame.classList.add("in-view");
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          frame.classList.add("in-view");
          observer.unobserve(frame);
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(frame);
  }

  function updateLang() {
    title.textContent = t().story.title;
    img.alt = photo.alt[getLang()] || photo.alt.en;
  }

  return { node, updateLang };
}
