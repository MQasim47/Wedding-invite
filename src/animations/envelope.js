import gsap from "gsap";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function drawStar(ctx, x, y, size, alpha, color) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.beginPath();
  const outer = size;
  const inner = size * 0.34;
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 4) * i;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDot(ctx, x, y, size, alpha, color) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Gold sparkle fountain — a single canvas, a capped particle count (30),
// every per-frame update is just a position/opacity change (no per-frame
// path recomputation beyond the draw call itself). Particles spawn near
// the bottom point of the V the flap leaves behind and drift upward,
// spreading out as they rise, fading in then out — reads as a fountain
// caught mid-rise, matching the reference. Returns a stop function.
export function sparkleFountain(canvas) {
  if (prefersReducedMotion || !canvas) return () => {};

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, rect.width * dpr);
  canvas.height = Math.max(1, rect.height * dpr);
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const originX = w / 2;
  const originY = h * 0.5; // the V's apex — same height as the flap's clip-path point
  const COUNT = 30;
  const COLORS = ["#ffe9b0", "#fff4d6", "#ffd98a"];
  const TOTAL_DURATION = 2200;

  const particles = Array.from({ length: COUNT }, () => ({
    x: originX + (Math.random() - 0.5) * w * 0.22,
    vy: -(45 + Math.random() * 60),
    vx: (Math.random() - 0.5) * 16,
    size: 2 + Math.random() * 3.2,
    isStar: Math.random() < 0.45,
    delay: Math.random() * 900,
    maxLife: 1300 + Math.random() * 900,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  let raf = null;
  let start = null;

  function frame(ts) {
    if (start === null) start = ts;
    const elapsed = ts - start;
    ctx.clearRect(0, 0, w, h);

    particles.forEach((p) => {
      if (elapsed < p.delay) return;
      const t = elapsed - p.delay;
      if (t > p.maxLife) return;
      const dt = t / 1000;
      const spread = 1 + dt * 0.6; // fan out as they rise, like the widening V
      const x = originX + (p.x - originX) * spread + p.vx * dt;
      const y = originY + p.vy * dt;
      const lifeFrac = t / p.maxLife;
      const alpha = lifeFrac < 0.15 ? lifeFrac / 0.15 : lifeFrac > 0.7 ? Math.max(0, 1 - (lifeFrac - 0.7) / 0.3) : 1;
      if (p.isStar) drawStar(ctx, x, y, p.size * 1.7, alpha, p.color);
      else drawDot(ctx, x, y, p.size, alpha, p.color);
    });

    if (elapsed < TOTAL_DURATION) {
      raf = requestAnimationFrame(frame);
    }
  }

  raf = requestAnimationFrame(frame);

  return function stop() {
    if (raf) cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, w, h);
  };
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

// Plays the open sequence and resolves once the screen can be removed:
// the flap folds up and off-screen carrying the seal with it, a golden
// glow ramps up in the V it leaves behind, a sparkle fountain rises from
// the V's point, then a white wash covers the still-fading glow/sparkles
// before the whole screen fades to reveal the hero underneath.
export function playOpenSequence({ screenNode, flap, sealEl, glowEl, sparkleCanvas, flashEl, hintEl, pulseTween }) {
  return new Promise((resolve) => {
    pulseTween?.kill();
    screenNode.setAttribute("data-open", "true");

    if (prefersReducedMotion) {
      screenNode.style.display = "none";
      resolve();
      return;
    }

    let stopSparkles = () => {};

    const tl = gsap.timeline({
      onComplete: () => {
        stopSparkles();
        screenNode.style.display = "none";
        resolve();
      },
    });

    tl.to(hintEl, { opacity: 0, duration: 0.2 }, 0)
      // The flap and seal move together (yPercent tied to viewport height,
      // not the flap's own box) so the seal reads as riding along with it.
      .to([flap, sealEl], { y: "-70vh", duration: 0.7, ease: "power2.inOut" }, 0.1)
      .to(glowEl, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0.25)
      .add(() => {
        stopSparkles = sparkleFountain(sparkleCanvas);
      }, 0.35)
      .to(flashEl, { opacity: 0.96, duration: 0.35, ease: "power1.in" }, 1.95)
      .to(glowEl, { opacity: 0, duration: 0.3 }, 1.95)
      .to(screenNode, { opacity: 0, duration: 0.45, ease: "power1.in" }, 2.15);
  });
}
