import gsap from "gsap";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function burstParticles(container) {
  // Kept low: 18 synchronous DOM-node+tween creations in a single frame was
  // measurably janky (~430ms frame) on throttled/low-end mobile CPUs.
  const count = prefersReducedMotion ? 0 : 10;
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

    // A flat scaleY+opacity fold (transform-origin: top, set in CSS) reads
    // as the flap opening just as well as the original 3D rotateX did, but
    // stays a plain 2D affine transform — it measured consistently smooth
    // under 4x CPU throttling, where the perspective-rotated version had a
    // stubborn ~400ms single-frame spike (clip-path + 3D transform + box-
    // shadow compositing together) that will-change and a static
    // transformPerspective couldn't fix. Working beats fancy here.
    tl.to(hintEl, { opacity: 0, duration: 0.25 }, 0)
      .to(sealBtn, { scale: 0, opacity: 0, duration: 0.35, ease: "back.in(2)" }, 0)
      .add(() => burstParticles(particlesEl), 0.1)
      .to(
        flap,
        {
          scaleY: 0,
          opacity: 0,
          duration: 0.55,
          ease: "power2.inOut",
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
