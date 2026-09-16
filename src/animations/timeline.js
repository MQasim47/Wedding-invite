import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Draws the curved SVG path as the user scrolls through the schedule
// section (scrub), moves a heart marker along that same path in lockstep
// (so it always sits right at the drawn tip — reads as the path drawing
// itself just ahead of the heart), fades each event in, and draws its icon
// in as the heart approaches.
export function animateTimeline(sectionNode) {
  const path = sectionNode.querySelector(".timeline-path");
  const heart = sectionNode.querySelector(".timeline-heart");
  const events = sectionNode.querySelectorAll(".timeline-event");
  const timelineEl = sectionNode.querySelector(".timeline");

  if (prefersReducedMotion) {
    events.forEach((ev) => {
      ev.style.opacity = 1;
      ev.style.transform = "none";
    });
    // The heart's whole point is riding the path as you scroll — with no
    // motion at all it would just sit at its default top-left corner,
    // which reads as a stray misplaced icon rather than a marker. The
    // fully-drawn curve + icons already carry the timeline without it.
    if (heart) heart.style.display = "none";
    if (path) path.style.strokeDashoffset = "0";
    return;
  }

  const scrollRange = { trigger: timelineEl, start: "top 72%", end: "bottom 58%", scrub: 0.5 };

  if (path) {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(path, { strokeDashoffset: 0, ease: "none", scrollTrigger: scrollRange });
  }

  if (heart && path) {
    gsap.set(heart, { opacity: 1 });
    gsap.to(heart, {
      motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
      ease: "none",
      scrollTrigger: scrollRange,
    });
  }

  events.forEach((event) => {
    const fromX = event.dataset.side === "left" ? -40 : 40;
    const iconShapes = event.querySelectorAll(".timeline-event-icon svg path, .timeline-event-icon svg circle");
    const drawableShapes = Array.from(iconShapes).filter((shape) => typeof shape.getTotalLength === "function");

    drawableShapes.forEach((shape) => {
      const shapeLength = shape.getTotalLength();
      gsap.set(shape, { strokeDasharray: shapeLength, strokeDashoffset: shapeLength });
    });

    const trigger = {
      trigger: event,
      start: "top 85%",
      toggleActions: "play none none reverse",
    };

    gsap.fromTo(event, { opacity: 0, x: fromX }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", scrollTrigger: trigger });

    if (drawableShapes.length) {
      gsap.to(drawableShapes, {
        strokeDashoffset: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: trigger,
      });
    }
  });

  // Fail-safe: force everything visible if a trigger is ever missed.
  window.setTimeout(() => {
    events.forEach((event) => {
      if (parseFloat(getComputedStyle(event).opacity) < 1) {
        gsap.set(event, { opacity: 1, x: 0 });
        event.querySelectorAll(".timeline-event-icon svg path, .timeline-event-icon svg circle").forEach((shape) => {
          gsap.set(shape, { strokeDashoffset: 0 });
        });
      }
    });
  }, 4000);
}
