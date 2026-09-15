import gsap from "gsap";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function burstParticles(container) {
  const count = prefersReducedMotion ? 0 : 18;
  const colors = ["var(--color-accent)", "var(--color-primary)"];

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.left = "50%";
    particle.style.top = "40%";
    particle.style.background = colors[i % 2];
    container.appendChild(particle);

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 60 + Math.random() * 90;

    gsap.fromTo(
      particle,
      { opacity: 1, scale: 0.6, x: 0, y: 0 },
      {
        opacity: 0,
        scale: 1.1,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 30,
        duration: 1 + Math.random() * 0.5,
        ease: "power2.out",
        onComplete: () => particle.remove(),
      }
    );
  }
}

// Idle pulse on the wax seal, run while the envelope is still closed.
export function idlePulse(sealBtn) {
  if (prefersReducedMotion) return null;
  return gsap.to(sealBtn, {
    scale: 1.06,
    duration: 1.1,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

// Plays the open sequence and resolves once the screen can be removed.
export function playOpenSequence({ screenNode, flap, sealBtn, particlesEl, hintEl, pulseTween }) {
  return new Promise((resolve) => {
    pulseTween?.kill();
    screenNode.setAttribute("data-open", "true");

    if (prefersReducedMotion) {
      screenNode.style.display = "none";
      resolve();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        screenNode.style.display = "none";
        resolve();
      },
    });

    tl.to(hintEl, { opacity: 0, duration: 0.25 }, 0)
      .to(sealBtn, { scale: 0, opacity: 0, duration: 0.35, ease: "back.in(2)" }, 0)
      .add(() => burstParticles(particlesEl), 0.1)
      .to(
        flap,
        {
          rotateX: -165,
          duration: 0.7,
          ease: "power2.inOut",
          transformPerspective: 800,
        },
        0.15
      )
      .to(
        screenNode,
        {
          opacity: 0,
          duration: 0.5,
          ease: "power1.in",
        },
        0.75
      );
  });
}
