import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Generic "fade up on scroll" for any element carrying the .fade-up class —
// used by welcome text lines, venue cards, timeline events, and more.
//
// CSS keeps every .fade-up element visible by default (see main.css) — this
// only ever animates FROM a hidden state TO the visible one, and a fail-safe
// timeout below forces anything GSAP/ScrollTrigger missed back to visible.
// That combination is what stops the welcome text (and anything else using
// this) from ever getting stuck invisible: a scroll-reveal bug can at worst
// make something skip its entrance animation, never make it disappear.
export function initScrollReveal(root) {
  const targets = Array.from(root.querySelectorAll(".fade-up"));
  if (prefersReducedMotion || targets.length === 0) return;

  targets.forEach((target, i) => {
    gsap.fromTo(
      target,
      { opacity: 0, y: 24 },
      {
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
      }
    );
  });

  // Fail-safe: a mispositioned trigger (computed before fonts/images
  // finished loading, a Lenis desync, etc.) should never leave content
  // stuck invisible. Anything still hidden after a grace period is forced
  // visible outright.
  window.setTimeout(() => {
    targets.forEach((target) => {
      if (parseFloat(getComputedStyle(target).opacity) < 1) {
        gsap.set(target, { opacity: 1, y: 0, clearProps: "transform" });
      }
    });
  }, 2500);
}

// Re-measures every ScrollTrigger's start/end positions. Layout can shift
// after triggers are first set up (web fonts swapping in and reflowing
// text, images finishing decode, the envelope gate unlocking scroll) —
// without a refresh, triggers keep stale positions and may never fire.
export function refreshScrollTriggers() {
  ScrollTrigger.refresh();
}
