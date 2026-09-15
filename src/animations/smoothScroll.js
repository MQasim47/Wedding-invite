import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Wires Lenis smooth scrolling into GSAP's ticker/ScrollTrigger. Returns the
// Lenis instance (or null when reduced motion is preferred) so callers can
// stop() it for the envelope gate and start() it again once opened.
export function initSmoothScroll() {
  if (prefersReducedMotion) return null;

  const lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
