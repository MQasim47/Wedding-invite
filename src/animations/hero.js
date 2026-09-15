import gsap from "gsap";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Letter-by-letter reveal for the couple's names, then the tagline and
// date. Runs once, right after the envelope opens.
export function animateHero(heroNode) {
  if (prefersReducedMotion) return;

  const letters = heroNode.querySelectorAll(".hero-names .letter");
  const amp = heroNode.querySelector(".hero-ampersand");
  const tagline = heroNode.querySelector(".hero-tagline");
  const date = heroNode.querySelector(".hero-date");

  gsap.set([letters, amp, tagline, date], { opacity: 0 });
  gsap.set(letters, { y: 16 });
  gsap.set(amp, { y: 10, scale: 0.7 });
  gsap.set(tagline, { y: 10 });
  gsap.set(date, { y: 12 });

  gsap
    .timeline({ delay: 0.15 })
    .to(letters, { opacity: 1, y: 0, duration: 0.5, stagger: 0.035, ease: "power2.out" })
    .to(amp, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, "-=0.3")
    .to(tagline, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2")
    .to(date, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.25");
}
