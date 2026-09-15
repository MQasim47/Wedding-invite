import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Draws the curved SVG path as the user scrolls through the schedule
// section (scrub), and slides each event in from its alternating side.
export function animateTimeline(sectionNode) {
  const path = sectionNode.querySelector(".timeline-path");
  const events = sectionNode.querySelectorAll(".timeline-event");
  const timelineEl = sectionNode.querySelector(".timeline");

  if (prefersReducedMotion) {
    events.forEach((ev) => {
      ev.style.opacity = 1;
      ev.style.transform = "none";
    });
    return;
  }

  if (path) {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: timelineEl,
        start: "top 75%",
        end: "bottom 60%",
        scrub: 0.6,
      },
    });
  }

  events.forEach((event) => {
    const fromX = event.dataset.side === "left" ? -40 : 40;
    gsap.fromTo(
      event,
      { opacity: 0, x: fromX },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: event,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );
  });
}
