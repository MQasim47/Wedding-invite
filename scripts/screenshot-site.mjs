// Dev tool (not part of the shipped site) — launches the dev server, opens
// the page in a 390px-wide Chromium viewport, opens the envelope, and
// screenshots the envelope sequence + every section. Used to compare our
// site against reference/ frames.
//
//   node scripts/screenshot-site.mjs <out-dir> [--reduced-motion]
//
// Requires `npm run dev` NOT already running on port 5180 (this script
// starts/stops its own instance).
import { chromium, devices } from "playwright";
import { spawn, execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outDir = process.argv[2] || fileURLToPath(new URL("../reference/current-state/", import.meta.url));
const reducedMotion = process.argv.includes("--reduced-motion");
// Real Android Chrome emulation (UA + viewport + touch + device scale) —
// the client reviews on an actual Pixel/Galaxy phone, not a resized desktop
// Chrome window, so this is what --mobile-emulation matches.
const mobileEmulation = process.argv.includes("--mobile-emulation");
const PORT = 5180;

// `shell: true` on Windows spawns npx -> node -> vite as a process tree;
// server.kill() only kills the shell, leaving vite (and the port) running.
// Kill the whole tree by PID on exit instead.
function killServerTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(-pid, "SIGKILL");
    }
  } catch {
    // already dead — fine.
  }
}

await mkdir(outDir, { recursive: true });

const server = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  stdio: "pipe",
  shell: true,
  detached: process.platform !== "win32",
});

await new Promise((resolve, reject) => {
  let out = "";
  const timeout = setTimeout(() => reject(new Error("dev server did not start in time:\n" + out)), 20000);
  server.stdout.on("data", (chunk) => {
    out += chunk.toString();
    if (out.includes("Local:") || out.includes("localhost")) {
      clearTimeout(timeout);
      resolve();
    }
  });
  server.stderr.on("data", (chunk) => (out += chunk.toString()));
});

// vite prints "ready" slightly before the port is actually accepting
// connections in some environments — small settle delay.
await new Promise((r) => setTimeout(r, 500));

let browser;
try {
  browser = await chromium.launch();
  const context = await browser.newContext({
    ...(mobileEmulation ? devices["Pixel 7"] : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }),
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  page.on("pageerror", (err) => console.error("[pageerror]", err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("[console.error]", msg.text());
  });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });

  const suffix = (mobileEmulation ? "-mobile" : "") + (reducedMotion ? "-reduced-motion" : "");

  // --- Envelope sequence -------------------------------------------------
  await page.screenshot({ path: `${outDir}/00-envelope-closed${suffix}.png` });

  // force: true — the seal has a continuous idle pulse (scale yoyo), so its
  // bounding box never "settles" by Playwright's actionability definition.
  // That's intentional UI, not a bug; a real tap doesn't care.
  await page.click(".envelope-seal-btn", { force: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/01-envelope-t300ms${suffix}.png` });

  await page.waitForTimeout(500); // now ~800ms since tap
  await page.screenshot({ path: `${outDir}/02-envelope-t800ms${suffix}.png` });

  await page.waitForTimeout(700); // now ~1500ms since tap
  await page.screenshot({ path: `${outDir}/03-envelope-t1500ms${suffix}.png` });

  await page.waitForTimeout(1500); // let the sequence fully settle into the hero
  await page.screenshot({ path: `${outDir}/04-hero-settled${suffix}.png` });

  // --- Sections ------------------------------------------------------------
  const sections = ["hero", "welcome", "story", "wedding-party", "calendar", "schedule", "venue", "countdown", "gallery", "rsvp", "closing"];

  for (const id of sections) {
    const el = await page.$(`#${id}`);
    if (!el) {
      console.warn(`[skip] #${id} not found on page`);
      continue;
    }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700); // let scroll-triggered reveals play
    await page.screenshot({ path: `${outDir}/section-${id}${suffix}.png` });
  }

  // --- Timeline scroll positions (for the traveling-heart comparison) -----
  // Re-measure the bounding box fresh on every iteration — box.y is
  // viewport-relative, so reusing one captured before the loop and adding
  // the (now-changed) window.scrollY on later iterations drifts further
  // off target each time.
  const timelineExists = (await page.$("#schedule .timeline")) !== null;
  if (timelineExists) {
    for (const [label, fraction] of [["25pct", 0.25], ["50pct", 0.5], ["75pct", 0.75]]) {
      const box = await page.$eval("#schedule .timeline", (el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, height: r.height };
      });
      await page.evaluate(
        ({ top, height, fraction }) => {
          window.scrollTo(0, window.scrollY + top - window.innerHeight / 2 + height * fraction);
        },
        { ...box, fraction }
      );
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${outDir}/timeline-${label}${suffix}.png` });
    }
  }

  console.log(`Done. Screenshots in ${outDir}`);
} finally {
  if (browser) await browser.close();
  killServerTree(server.pid);
}
