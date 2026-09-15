// Dev tool (not part of the shipped site) — launches the dev server, opens
// the page in a 390px-wide Chromium viewport, opens the envelope, and
// screenshots the envelope sequence + every section. Used to compare our
// site against reference/ frames.
//
//   node scripts/screenshot-site.mjs <out-dir> [--reduced-motion]
//
// Requires `npm run dev` NOT already running on port 5180 (this script
// starts/stops its own instance).
import { chromium } from "playwright";
import { spawn, execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outDir = process.argv[2] || fileURLToPath(new URL("../reference/current-state/", import.meta.url));
const reducedMotion = process.argv.includes("--reduced-motion");
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
    viewport: { width: 390, height: 844 },
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  page.on("pageerror", (err) => console.error("[pageerror]", err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("[console.error]", msg.text());
  });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });

  const suffix = reducedMotion ? "-reduced-motion" : "";

  // --- Envelope sequence -------------------------------------------------
  await page.screenshot({ path: `${outDir}/00-envelope-closed${suffix}.png` });

  await page.click(".envelope-seal-btn");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/01-envelope-t300ms${suffix}.png` });

  await page.waitForTimeout(500); // now ~800ms since tap
  await page.screenshot({ path: `${outDir}/02-envelope-t800ms${suffix}.png` });

  await page.waitForTimeout(700); // now ~1500ms since tap
  await page.screenshot({ path: `${outDir}/03-envelope-t1500ms${suffix}.png` });

  await page.waitForTimeout(1500); // let the sequence fully settle into the hero
  await page.screenshot({ path: `${outDir}/04-hero-settled${suffix}.png` });

  // --- Sections ------------------------------------------------------------
  const sections = ["hero", "welcome", "story", "calendar", "schedule", "venue", "countdown", "gallery", "rsvp", "closing"];

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
  const timeline = await page.$("#schedule .timeline");
  if (timeline) {
    const box = await timeline.boundingBox();
    if (box) {
      for (const [label, fraction] of [["25pct", 0.25], ["50pct", 0.5], ["75pct", 0.75]]) {
        await page.evaluate(
          ({ top, height, fraction }) => {
            window.scrollTo(0, top + window.scrollY - window.innerHeight / 2 + height * fraction);
          },
          { top: box.y, height: box.height, fraction }
        );
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${outDir}/timeline-${label}${suffix}.png` });
      }
    }
  }

  console.log(`Done. Screenshots in ${outDir}`);
} finally {
  if (browser) await browser.close();
  killServerTree(server.pid);
}
