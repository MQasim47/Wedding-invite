import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Stacked names (and ampersand) fade/stagger in, then the glossy wax-seal
// heart drops in with a bounce — all on scroll entrance.
export function animateClosing({ node, namesWrap, sealEl }) {
  if (!node) return;

  const names = namesWrap ? namesWrap.querySelectorAll(".closing-name, .closing-amp") : [];

  if (prefersReducedMotion) {
    gsap.set(names, { opacity: 1, y: 0 });
    if (sealEl) gsap.set(sealEl, { opacity: 1, y: 0 });
    return;
  }

  gsap.set(names, { opacity: 0, y: 20 });
  if (sealEl) gsap.set(sealEl, { opacity: 0, y: -60 });

  const trigger = { trigger: node, start: "top 65%", toggleActions: "play none none reverse" };

  gsap.to(names, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power2.out", scrollTrigger: trigger });

  if (sealEl) {
    gsap.to(sealEl, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "bounce.out",
      delay: 0.3,
      scrollTrigger: trigger,
    });
  }
}
