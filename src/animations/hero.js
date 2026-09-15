import gsap from "gsap";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Letter-by-letter reveal for the couple's names, plus a slow Ken Burns
// zoom on the photo placeholder. Runs once, right after the envelope opens.
export function animateHero(heroNode) {
  if (prefersReducedMotion) return;

  const letters = heroNode.querySelectorAll(".hero-names .letter");
  const amp = heroNode.querySelector(".hero-ampersand");
  const date = heroNode.querySelector(".hero-date");
  const photoFrame = heroNode.querySelector(".hero-photo-frame");
  const photo = heroNode.querySelector(".hero-photo-placeholder");

  gsap.set([letters, amp, date, photoFrame], { opacity: 0 });
  gsap.set(letters, { y: 16 });
  gsap.set(amp, { y: 10, scale: 0.7 });
  gsap.set(date, { y: 12 });
  gsap.set(photoFrame, { y: 20 });

  const tl = gsap.timeline({ delay: 0.15 });
  tl.to(letters, { opacity: 1, y: 0, duration: 0.5, stagger: 0.035, ease: "power2.out" })
    .to(amp, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, "-=0.3")
    .to(date, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2")
    .to(photoFrame, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.3");

  if (photo) {
    gsap.fromTo(
      photo,
      { scale: 1.15 },
      { scale: 1, duration: 8, ease: "sine.out" }
    );
  }
}
