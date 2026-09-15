import "./styles/main.css";

import { config } from "./config.js";
import { onLangChange } from "./utils/store.js";
import { applyTheme } from "./animations/theme.js";
import { initSmoothScroll } from "./animations/smoothScroll.js";
import { idlePulse, playOpenSequence } from "./animations/envelope.js";
import { animateHero } from "./animations/hero.js";
import { animatePendant, startChainShimmer } from "./animations/pendant.js";
import { initScrollReveal } from "./animations/scrollReveal.js";
import { animateTimeline } from "./animations/timeline.js";
import { animateCalendarHeart } from "./animations/calendarHeart.js";
import { initCompanionAnimations } from "./animations/companion.js";
import { el } from "./utils/dom.js";

import { createEnvelopeSection } from "./sections/envelope.js";
import { createControls } from "./sections/controls.js";
import { createCompanionSection } from "./sections/companion.js";
import { createHeroSection } from "./sections/hero.js";
import { createGreetingSection } from "./sections/greeting.js";
import { createWelcomeSection } from "./sections/welcome.js";
import { createCalendarSection } from "./sections/calendar.js";
import { createScheduleSection } from "./sections/schedule.js";
import { createVenueSection } from "./sections/venue.js";
import { createCountdownSection } from "./sections/countdown.js";
import { createRsvpSection } from "./sections/rsvp.js";
import { createExtrasSections } from "./sections/extras.js";
import { createClosingSection } from "./sections/closing.js";

applyTheme();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const app = document.getElementById("app");
const lenis = initSmoothScroll();

// Lock scroll while the envelope gate is up.
document.documentElement.style.overflow = "hidden";
lenis?.stop();

const appShell = el("div", { class: "app-shell" });
const pageBg = el("div", { class: "page-bg" }, [appShell]);

const langUpdaters = [];
function registerSection(result) {
  if (!result) return;
  appShell.appendChild(result.node);
  if (result.updateLang) langUpdaters.push(result.updateLang);
  return result;
}

const heroSection = registerSection(createHeroSection());
registerSection(createGreetingSection());
registerSection(createWelcomeSection());
const calendarSection = registerSection(createCalendarSection());
const scheduleSection = registerSection(createScheduleSection());
registerSection(createVenueSection());
registerSection(createCountdownSection());
registerSection(createRsvpSection());
createExtrasSections().forEach(registerSection);
registerSection(createClosingSection());

// __AUDIO_AVAILABLE__ is a build-time constant (see vite.config.js) — true
// only when config.music.enabled AND the configured file actually exists on
// disk, so a missing file never triggers a runtime request/console error.
const audioAvailable = __AUDIO_AVAILABLE__;

const controls = createControls({ audioAvailable });
if (controls.updateLang) langUpdaters.push(controls.updateLang);

const companion = createCompanionSection({
  onTap: () => {
    const rsvpEl = document.getElementById("rsvp");
    if (!rsvpEl) return;
    if (lenis) {
      lenis.scrollTo(rsvpEl, { duration: 1.2 });
    } else {
      rsvpEl.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  },
});
if (companion?.updateLang) langUpdaters.push(companion.updateLang);

onLangChange(() => {
  langUpdaters.forEach((fn) => fn());
});

// --- Audio -----------------------------------------------------------
let audioEl = null;
if (audioAvailable) {
  audioEl = el("audio", { src: config.music.src, loop: "true", preload: "none" });
  audioEl.volume = 0.6;
  document.body.appendChild(audioEl);

  controls.musicBtn?.addEventListener("click", () => {
    if (!audioEl) return;
    if (audioEl.paused) {
      audioEl.play().catch(() => {});
    } else {
      audioEl.pause();
    }
  });
  audioEl.addEventListener("play", () => controls.setMusicPlaying(true));
  audioEl.addEventListener("pause", () => controls.setMusicPlaying(false));
}

// --- Envelope gate -----------------------------------------------------
const { node: envelopeNode, sealBtn, flap, particlesEl, hintEl } = createEnvelopeSection();
const pulseTween = idlePulse(sealBtn);

sealBtn.addEventListener(
  "click",
  () => {
    if (audioEl) {
      audioEl.play().catch(() => {
        console.warn("[audio] Autoplay was blocked; use the mute/unmute button to start music.");
      });
    }

    playOpenSequence({ screenNode: envelopeNode, flap, sealBtn, particlesEl, hintEl, pulseTween }).then(() => {
      document.documentElement.style.overflow = "";
      lenis?.start();
      controls.show();
      companion?.show();

      // Deferred a frame: this batch queries/measures across the whole page
      // (getTotalLength() on two SVG paths, several ScrollTrigger setups) —
      // running it in the same tick as the envelope's final paint caused a
      // measurable jank spike right as the screen was still compositing out.
      requestAnimationFrame(() => {
        if (heroSection) {
          animateHero(heroSection.node);
          animatePendant(heroSection.pendantNode);
          startChainShimmer(heroSection.shimmerNode);
        }
        initScrollReveal(appShell);
        if (scheduleSection) animateTimeline(scheduleSection.node);
        if (calendarSection) animateCalendarHeart(calendarSection.node);
        if (companion) {
          initCompanionAnimations({
            node: companion.node,
            innerNode: companion.innerNode,
            heartsEl: companion.heartsEl,
          });
        }
      });
    });
  },
  { once: true }
);

app.appendChild(pageBg);
app.appendChild(envelopeNode);
app.appendChild(controls.node);
if (companion) app.appendChild(companion.node);
