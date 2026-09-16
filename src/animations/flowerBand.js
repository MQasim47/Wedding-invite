import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Slides the dahlia band in on scroll, then gives it a slow parallax
// (moves slightly slower than the page) as it passes through view.
export function animateFlowerBand(node) {
  if (!node || prefersReducedMotion) return;
  const inner = node.querySelector(".flower-band-inner");

  gsap.fromTo(
    node,
    { opacity: 0, scale: 0.96 },
    {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: node, start: "top 88%", toggleActions: "play none none reverse" },
    }
  );

  if (inner) {
    gsap.fromTo(
      inner,
      { yPercent: -12 },
      {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: node, start: "top bottom", end: "bottom top", scrub: 0.6 },
      }
    );
  }
}
