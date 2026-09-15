import gsap from "gsap";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const IDLE_SWAY_DEG = 1.5;
const IDLE_SWAY_SPEED = 0.7; // radians/sec fed into Math.sin — ~9s full cycle
const MAX_SCROLL_KICK_DEG = 4;
const SCROLL_KICK_SENSITIVITY = 0.05;
const KICK_DECAY = 0.9;

// Drops the pendant (chain + badge) in with a damped elastic swing, then
// hands off to a continuous idle sway + scroll-velocity kick. Only ever
// animates the .hero-pendant group's transform/opacity as a whole — chain
// links are static SVG, never animated individually.
export function animatePendant(pendantNode) {
  if (!pendantNode) return;

  if (prefersReducedMotion) {
    gsap.set(pendantNode, { opacity: 1, y: 0, rotation: 0, transformOrigin: "top center" });
    return;
  }

  gsap.set(pendantNode, { opacity: 0, y: -36, rotation: -16, transformOrigin: "top center" });

  gsap
    .timeline({ onComplete: () => startIdleSway(pendantNode) })
    .to(pendantNode, { opacity: 1, duration: 0.4, ease: "power1.out" }, 0)
    .to(pendantNode, { y: 0, duration: 0.9, ease: "power2.out" }, 0)
    .to(pendantNode, { rotation: 0, duration: 1.5, ease: "elastic.out(1, 0.4)" }, 0.05);
}

// Continuous slow sway (±1.5deg) plus a small, clamped kick driven by
// scroll velocity, blended into a single rotation value each frame so the
// two never fight over the same GSAP property.
function startIdleSway(pendantNode) {
  if (prefersReducedMotion) return;

  let lastScrollY = window.scrollY;
  let kick = 0;

  gsap.ticker.add((time) => {
    const idle = Math.sin(time * IDLE_SWAY_SPEED) * IDLE_SWAY_DEG;

    const scrollY = window.scrollY;
    const delta = scrollY - lastScrollY;
    lastScrollY = scrollY;
    kick = gsap.utils.clamp(
      -MAX_SCROLL_KICK_DEG,
      MAX_SCROLL_KICK_DEG,
      kick * KICK_DECAY + delta * SCROLL_KICK_SENSITIVITY
    );

    gsap.set(pendantNode, { rotation: idle + kick });
  });
}

// Sweeps a bright highlight across the chain every few seconds.
export function startChainShimmer(shimmerNode) {
  if (prefersReducedMotion || !shimmerNode) return;

  gsap.set(shimmerNode, { x: -30, opacity: 0 });
  gsap
    .timeline({ repeat: -1, repeatDelay: 3.5 })
    .to(shimmerNode, { opacity: 1, duration: 0.2 }, 0)
    .to(shimmerNode, { x: 230, duration: 1.1, ease: "power1.inOut" }, 0)
    .to(shimmerNode, { opacity: 0, duration: 0.2 }, "-=0.2");
}
