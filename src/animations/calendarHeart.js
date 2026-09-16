import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Pops the solid heart-with-day-number in as the calendar scrolls into view.
export function animateCalendarHeart(sectionNode) {
  const heart = sectionNode.querySelector(".calendar-day-heart");
  if (!heart) return;

  if (prefersReducedMotion) {
    gsap.set(heart, { opacity: 1, scale: 1 });
    return;
  }

  gsap.set(heart, { opacity: 0, scale: 0.4 });
  gsap.to(heart, {
    opacity: 1,
    scale: 1,
    duration: 0.6,
    ease: "back.out(2.2)",
    scrollTrigger: {
      trigger: sectionNode,
      start: "top 70%",
      toggleActions: "play none none reverse",
    },
  });
}
