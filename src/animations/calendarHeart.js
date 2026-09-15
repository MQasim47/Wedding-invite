import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Draws the heart outline over the wedding day cell as the calendar
// scrolls into view.
export function animateCalendarHeart(sectionNode) {
  const path = sectionNode.querySelector(".heart-draw-path");
  if (!path) return;

  if (prefersReducedMotion) {
    path.style.opacity = 1;
    return;
  }

  const length = path.getTotalLength();
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 });
  gsap.to(path, {
    strokeDashoffset: 0,
    duration: 1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: sectionNode,
      start: "top 70%",
    },
  });
}
