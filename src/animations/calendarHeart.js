import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Pops every solid heart-with-day-number in (the primary date, plus any
// smaller second/third-day highlights) as the calendar scrolls into view.
export function animateCalendarHeart(sectionNode) {
  const hearts = sectionNode.querySelectorAll(".calendar-day-heart");
  if (!hearts.length) return;

  if (prefersReducedMotion) {
    gsap.set(hearts, { opacity: 1, scale: 1 });
    return;
  }

  gsap.set(hearts, { opacity: 0, scale: 0.4 });
  gsap.to(hearts, {
    opacity: 1,
    scale: 1,
    duration: 0.6,
    stagger: 0.12,
    ease: "back.out(2.2)",
    scrollTrigger: {
      trigger: sectionNode,
      start: "top 70%",
      toggleActions: "play none none reverse",
    },
  });
}
