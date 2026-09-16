import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Waits for the script font to actually be loaded (capped, so a slow/failed
// font fetch can never block the reveal forever) before the names are ever
// made visible — Android Chrome renders "Dalida"/"Aimé" as overlapping
// garbled glyphs for a frame or two while the script font swaps in.
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
// tagline. Runs once, right after the envelope opens.
export async function animateHero(heroNode) {
  const name1 = heroNode.querySelector(".hero-name-1");
  const name2 = heroNode.querySelector(".hero-name-2");
  const amp = heroNode.querySelector(".hero-ampersand");
  const tagline = heroNode.querySelector(".hero-tagline");

  if (prefersReducedMotion) {
    gsap.set([name1, name2], { visibility: "visible", clipPath: "inset(0 0 0 0)" });
    return;
  }

  await whenFontsReady();

  gsap.set([name1, name2], { visibility: "visible", clipPath: "inset(0 100% 0 0)" });
  gsap.set(amp, { opacity: 0, y: 10, scale: 0.7 });
  gsap.set(tagline, { opacity: 0, y: 12 });

  gsap
    .timeline({ delay: 0.1 })
    .to(name1, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power2.out" })
    .to(name2, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power2.out" }, "-=0.4")
    .to(amp, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, "-=0.5")
    .to(tagline, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.25");
}

// Everything else in the hero scene: the hall illustration's slow
// zoom/parallax as the guest scrolls past it, the hummingbird flying
// across the white space below it, and the two hanging floral clusters
// sliding in beside the badge with a gentle sway. Independent of
// animateHero() above so a font-load delay there never holds these up.
export function animateHeroExtras({ illustrationNode, hummingbirdNode, floralNodes }) {
  if (prefersReducedMotion) return;

  const inner = illustrationNode?.querySelector(".hero-illustration-inner");
  if (inner) {
    gsap.fromTo(
      inner,
      { scale: 1.12, yPercent: -4 },
      {
        scale: 1,
        yPercent: 2,
        ease: "none",
        scrollTrigger: {
          trigger: illustrationNode,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      }
    );
  }

  if (hummingbirdNode) {
    gsap.set(hummingbirdNode, { x: -40, y: 0, opacity: 0.9 });
    gsap.to(hummingbirdNode, {
      x: 140,
      y: -18,
      ease: "none",
      scrollTrigger: {
        trigger: hummingbirdNode,
        start: "top 90%",
        end: "top 30%",
        scrub: 0.5,
      },
    });
    // A light continuous flutter so it doesn't read as a static cutout
    // sliding sideways.
    gsap.to(hummingbirdNode, {
      y: "+=6",
      duration: 0.35,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  (floralNodes || []).forEach((floral, i) => {
    if (!floral) return;
    const fromX = floral.classList.contains("hero-floral-left") ? -40 : 40;
    gsap.set(floral, { opacity: 0, x: fromX, y: -20 });
    gsap
      .timeline({ delay: 0.4 + i * 0.2 })
      .to(floral, { opacity: 1, x: 0, y: 0, duration: 0.8, ease: "power2.out" })
      .call(() => {
        gsap.to(floral, {
          rotation: floral.classList.contains("hero-floral-left") ? 3 : -3,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          transformOrigin: "top center",
        });
      });
  });
}
