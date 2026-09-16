import "./styles/main.css";

import gsap from "gsap";
import { config } from "./config.js";
import { onLangChange } from "./utils/store.js";
import { applyTheme } from "./animations/theme.js";
import { initSmoothScroll } from "./animations/smoothScroll.js";
import { idlePulse, playOpenSequence } from "./animations/envelope.js";
import { animateHero, animateHeroExtras } from "./animations/hero.js";
import { animatePendant, startChainShimmer } from "./animations/pendant.js";
import { initScrollReveal, refreshScrollTriggers } from "./animations/scrollReveal.js";
import { animateTimeline } from "./animations/timeline.js";
import { animateCalendarHeart } from "./animations/calendarHeart.js";
import { animateWeddingParty } from "./animations/weddingParty.js";
import { initCompanionAnimations } from "./animations/companion.js";
import { el } from "./utils/dom.js";

import { createEnvelopeSection } from "./sections/envelope.js";
import { createControls } from "./sections/controls.js";
import { createCompanionSection } from "./sections/companion.js";
import { createHeroSection } from "./sections/hero.js";
import { createGreetingSection } from "./sections/greeting.js";
import { createWelcomeSection } from "./sections/welcome.js";
import { createStorySection } from "./sections/story.js";
import { createWeddingPartySection } from "./sections/weddingParty.js";
import { createCalendarSection } from "./sections/calendar.js";
import { createScheduleSection } from "./sections/schedule.js";
import { createVenueSection } from "./sections/venue.js";
import { createCountdownSection } from "./sections/countdown.js";
import { createRsvpSection } from "./sections/rsvp.js";
import { createExtrasSections } from "./sections/extras.js";
import { createClosingSection } from "./sections/closing.js";

applyTheme();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Scroll-triggered reveals (welcome text, venue cards, timeline events, …)
// compute their trigger positions from the current layout. That layout
// shifts as web fonts swap in and images finish decoding, so re-measure
// every ScrollTrigger whenever either happens — otherwise a trigger set up
// too early can end up permanently mispositioned and never fire.
if ("fonts" in document) {
  document.fonts.ready.then(() => refreshScrollTriggers()).catch(() => {});
}
window.addEventListener("load", () => refreshScrollTriggers());

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
registerSection(createStorySection());
const weddingPartySection = registerSection(createWeddingPartySection());
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
// Plays the configured playlist in order (track 1, then track 2, ...) and
// loops back to the start — a single <audio> element with its src swapped
// on "ended" rather than N elements, so only one track is ever buffered.
const MUSIC_VOLUME = 0.7;
let audioEl = null;
let trackIndex = 0;
let resumeAfterHidden = false;

if (audioAvailable) {
  const tracks = config.music.tracks;
  audioEl = el("audio", { src: tracks[0], preload: "metadata" });
  audioEl.volume = MUSIC_VOLUME;
  document.body.appendChild(audioEl);

  audioEl.addEventListener("ended", () => {
    trackIndex = (trackIndex + 1) % tracks.length;
    audioEl.src = tracks[trackIndex];
    audioEl.play().catch(() => {});
  });

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

  // Pause while the tab is hidden (backgrounded/switched away) and resume
  // only if it was actually playing before — never resurrect a track the
  // guest had deliberately paused.
  document.addEventListener("visibilitychange", () => {
    if (!audioEl) return;
    if (document.hidden) {
      resumeAfterHidden = !audioEl.paused;
      if (resumeAfterHidden) audioEl.pause();
    } else if (resumeAfterHidden) {
      resumeAfterHidden = false;
      audioEl.play().catch(() => {});
    }
  });
}

// --- Envelope gate -----------------------------------------------------
const { node: envelopeNode, sealBtn, flap, sealEl, glowEl, sparkleCanvas, flashEl, hintEl } = createEnvelopeSection();
const pulseTween = idlePulse(sealBtn);

sealBtn.addEventListener(
  "click",
  () => {
    if (audioEl) {
      audioEl.volume = 0;
      audioEl
        .play()
        .then(() => gsap.to(audioEl, { volume: MUSIC_VOLUME, duration: 2, ease: "sine.in" }))
        .catch(() => {
          audioEl.volume = MUSIC_VOLUME;
          console.warn("[audio] Autoplay was blocked; use the mute/unmute button to start music.");
        });
    }

    playOpenSequence({ screenNode: envelopeNode, flap, sealEl, glowEl, sparkleCanvas, flashEl, hintEl, pulseTween }).then(() => {
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
          animateHeroExtras(heroSection);
        }
        initScrollReveal(appShell);
        // The envelope gate held scroll locked (overflow:hidden + lenis.stop())
        // up to this point, so anything ScrollTrigger measured before now used
        // a stale layout — refresh once the page is actually scrollable, and
        // again shortly after once the unlock/companion-reveal reflow settles.
        refreshScrollTriggers();
        setTimeout(refreshScrollTriggers, 400);
        if (scheduleSection) animateTimeline(scheduleSection.node);
        if (calendarSection) animateCalendarHeart(calendarSection.node);
        if (weddingPartySection) animateWeddingParty(weddingPartySection.node);
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
