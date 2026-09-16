import gsap from "gsap";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Waits for the script font to actually be loaded (capped, so a slow/failed
// font fetch can never block the reveal forever) before the names are ever
// made visible — Android Chrome renders "Dalida"/"Aimé" as overlapping
// garbage glyphs for a frame or two while the script font swaps in.
function whenFontsReady() {
  if (!("fonts" in document)) return Promise.resolve();
  return Promise.race([
    document.fonts.ready.catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1200)),
  ]);
}

// Whole-word reveal for the couple's names (clip-path wipe, never split into
// per-letter spans — that breaks script-font ligature/connector shaping,
// which is what caused the garbled "DhasLidhas"-style rendering), then the
// tagline and date. Runs once, right after the envelope opens.
export async function animateHero(heroNode) {
  const name1 = heroNode.querySelector(".hero-name-1");
  const name2 = heroNode.querySelector(".hero-name-2");
  const amp = heroNode.querySelector(".hero-ampersand");
  const tagline = heroNode.querySelector(".hero-tagline");
  const date = heroNode.querySelector(".hero-date");

  if (prefersReducedMotion) {
    gsap.set([name1, name2], { visibility: "visible", clipPath: "inset(0 0 0 0)" });
    return;
  }

  await whenFontsReady();

  gsap.set([name1, name2], { visibility: "visible", clipPath: "inset(0 100% 0 0)" });
  gsap.set(amp, { opacity: 0, y: 10, scale: 0.7 });
  gsap.set([tagline, date], { opacity: 0, y: 12 });

  gsap
    .timeline({ delay: 0.1 })
    .to(name1, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power2.out" })
    .to(name2, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power2.out" }, "-=0.4")
    .to(amp, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, "-=0.5")
    .to(tagline, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.25")
    .to(date, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.3");
}
