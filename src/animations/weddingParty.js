import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Staggered scale+fade pop-in for each photo, with its gold ring drawing in
// right after — per group (bridesmaids, groomsmen), batched by scroll
// entrance so members already in view on load don't wait on one another.
export function animateWeddingParty(sectionNode) {
  if (!sectionNode) return;

  const grids = sectionNode.querySelectorAll(".party-grid");

  grids.forEach((grid) => {
    const wraps = Array.from(grid.querySelectorAll(".party-photo-wrap"));
    const rings = grid.querySelectorAll(".party-ring-circle");

    if (prefersReducedMotion || wraps.length === 0) {
      gsap.set(wraps, { opacity: 1, scale: 1, clearProps: "transform" });
      gsap.set(rings, { strokeDashoffset: 0 });
      return;
    }

    rings.forEach((ring) => {
      const length = ring.getTotalLength ? ring.getTotalLength() : 295;
      gsap.set(ring, { strokeDasharray: length, strokeDashoffset: length });
    });
    gsap.set(wraps, { opacity: 0, scale: 0.6 });

    ScrollTrigger.batch(wraps, {
      start: "top 88%",
      onEnter: (batch) => {
        gsap.to(batch, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)", stagger: 0.12 });
        batch.forEach((wrap, i) => {
          const ring = wrap.querySelector(".party-ring-circle");
          if (!ring) return;
          gsap.to(ring, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out", delay: 0.15 + i * 0.12 });
        });
      },
    });

    // Fail-safe to match the rest of the site's scroll-reveal behavior —
    // never leave a photo permanently invisible if its trigger is missed.
    window.setTimeout(() => {
      wraps.forEach((wrap) => {
        if (parseFloat(getComputedStyle(wrap).opacity) < 1) {
          gsap.set(wrap, { opacity: 1, scale: 1 });
          const ring = wrap.querySelector(".party-ring-circle");
          if (ring) gsap.set(ring, { strokeDashoffset: 0 });
        }
      });
    }, 3000);
  });
}
