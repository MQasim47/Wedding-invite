import "./styles/main.css";

import { config } from "./config.js";
import { onLangChange } from "./utils/store.js";
import { applyTheme } from "./animations/theme.js";
import { initSmoothScroll } from "./animations/smoothScroll.js";
import { idlePulse, playOpenSequence } from "./animations/envelope.js";
import { animateHero } from "./animations/hero.js";
import { initScrollReveal } from "./animations/scrollReveal.js";
import { animateTimeline } from "./animations/timeline.js";
import { animateCalendarHeart } from "./animations/calendarHeart.js";
import { el } from "./utils/dom.js";

import { createEnvelopeSection } from "./sections/envelope.js";
import { createControls } from "./sections/controls.js";
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

      if (heroSection) animateHero(heroSection.node);
      initScrollReveal(appShell);
      if (scheduleSection) animateTimeline(scheduleSection.node);
      if (calendarSection) animateCalendarHeart(calendarSection.node);
    });
  },
  { once: true }
);

app.appendChild(pageBg);
app.appendChild(envelopeNode);
app.appendChild(controls.node);
