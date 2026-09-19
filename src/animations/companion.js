import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { icons } from "../utils/icons.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Wires up all of the companion's behavior once it exists in the DOM:
// a pop-in, idle bob, occasional heart particles, hiding while the RSVP
// section is in view, and flying to a larger centered spot beside the
// closing message. Under prefers-reduced-motion it's just shown statically
// — no bob, no particles, no fly-in.
export function initCompanionAnimations({ node, innerNode, heartsEl }) {
  if (!node) return;

  if (prefersReducedMotion) {
    gsap.set(node, { opacity: 1 });
    return;
  }

  gsap.from(node, { scale: 0.5, duration: 0.6, ease: "back.out(2)", delay: 0.1 });

  startIdleBob(innerNode);
  startHeartParticles(heartsEl);
  initRsvpHideTrigger(node);
  initClosingFlyIn(node);
}

function startIdleBob(innerNode) {
  if (!innerNode) return;
  // Slow and small — a photo reads oddly with the snappier bounce that
  // suited the flat cartoon illustration.
  gsap.to(innerNode, {
    y: -4,
    duration: 2.6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

function startHeartParticles(heartsEl) {
  if (!heartsEl) return;

  function spawnHeart() {
    const heart = document.createElement("span");
    heart.className = "companion-heart";
    heart.innerHTML = icons.heart;
    heartsEl.appendChild(heart);

    const drift = (Math.random() - 0.5) * 24;

    gsap.fromTo(
      heart,
      { opacity: 0, y: 0, x: 0, scale: 0.5 },
      {
        opacity: 1,
        y: -46 - Math.random() * 16,
        x: drift,
        scale: 0.9,
        duration: 1.8,
        ease: "power1.out",
        onComplete: () => {
          gsap.to(heart, { opacity: 0, duration: 0.3, onComplete: () => heart.remove() });
        },
      }
    );
  }

  gsap.timeline({ repeat: -1, repeatDelay: 4.5 }).call(spawnHeart);
}

// Hides (fade + slide) while the RSVP section is in view so it never
// covers a form input or the mobile keyboard. Yields to the closing
// fly-in if that's active (shouldn't normally overlap in a top-to-bottom
// scroll, but guards fast/rewound scrolling).
function initRsvpHideTrigger(node) {
  const rsvpEl = document.getElementById("rsvp");
  if (!rsvpEl) return;

  ScrollTrigger.create({
    trigger: rsvpEl,
    start: "top 85%",
    end: "bottom 15%",
    onEnter: () => setHiddenForRsvp(node, true),
    onEnterBack: () => setHiddenForRsvp(node, true),
    onLeave: () => setHiddenForRsvp(node, false),
    onLeaveBack: () => setHiddenForRsvp(node, false),
  });
}

function setHiddenForRsvp(node, hidden) {
  if (node.dataset.flying === "true") return;
  gsap.to(node, {
    opacity: hidden ? 0 : 1,
    x: hidden ? -30 : 0,
    duration: 0.35,
    ease: hidden ? "power1.in" : "power1.out",
    overwrite: "auto",
  });
  node.style.pointerEvents = hidden ? "none" : "";
}

// Flies from the bottom-left corner into a larger, centered position
// beside the closing message when that section enters, and returns to the
// corner if the user scrolls back up past it.
function initClosingFlyIn(node) {
  const closingEl = document.getElementById("closing");
  if (!closingEl) return;

  ScrollTrigger.create({
    trigger: closingEl,
    start: "top 70%",
    end: "bottom bottom",
    onEnter: () => flyToClosing(node),
    onLeaveBack: () => flyToCorner(node),
  });
}

function flyToClosing(node) {
  node.dataset.flying = "true";
  node.style.pointerEvents = "";
  // Lands upper-right and modestly scaled — the closing section's names
  // and wax-seal heart are a centered column, so the companion stays out
  // of their way by hugging the right edge near the top of the section
  // instead of drifting toward the middle.
  gsap.to(node, {
    opacity: 1,
    x: 210,
    y: -430,
    scale: 1.3,
    duration: 0.9,
    ease: "power2.out",
    overwrite: "auto",
  });
}

function flyToCorner(node) {
  node.dataset.flying = "false";
  gsap.to(node, {
    x: 0,
    y: 0,
    scale: 1,
    duration: 0.7,
    ease: "power2.inOut",
    overwrite: "auto",
  });
}
