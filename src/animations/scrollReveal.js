import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Generic "fade up on scroll" for any element carrying the .fade-up class —
// used by welcome text lines, venue cards, timeline events, and more.
export function initScrollReveal(root) {
  if (prefersReducedMotion) return;

  const targets = root.querySelectorAll(".fade-up");
  targets.forEach((target, i) => {
    gsap.to(target, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: "power2.out",
      delay: (i % 4) * 0.06,
      scrollTrigger: {
        trigger: target,
        start: "top 88%",
        toggleActions: "play none none reverse",
      },
    });
  });
}
