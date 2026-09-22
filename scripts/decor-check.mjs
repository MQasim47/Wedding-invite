// Dev tool (not part of the shipped site) — starts the dev server, opens the page
// in a 390px-wide Chromium viewport, taps the envelope, and then either takes
// screenshots, measures text contrast against what is actually rendered, or
// profiles scrolling under CPU throttling.
//
//   node scripts/decor-check.mjs shots <out-dir> [--fr] [--full] [--sections=a,b]
//   node scripts/decor-check.mjs contrast [--fr] [--json=<file>]
//   node scripts/decor-check.mjs perf [--throttle=4] [--runs=3]
//   node scripts/decor-check.mjs checks
//
// Shared options:
//   --decor=off        every config.decor flag false (the "before" look)
//   --decor=a,b        only those flags on (e.g. --decor=damaskWatermark)
//   --root <dir>       run the dev server from another checkout (e.g. a git
//                      worktree of an older commit with node_modules linked in)
//   --css="<rules>"   inject extra CSS after load, to A/B one effect
//   --width=390        viewport width
//   --reduced-motion   emulate prefers-reduced-motion: reduce
//
// The --decor override rewrites src/config.js as the dev server serves it, so
// no production code carries a testing hook.
import { chromium } from "playwright";
import { spawn, execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const args = process.argv.slice(2);
const mode = args[0];
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const rootIdx = args.indexOf("--root");
const root = rootIdx >= 0 ? args[rootIdx + 1] : fileURLToPath(new URL("..", import.meta.url));
const outDir = args[1] && !args[1].startsWith("--") ? args[1] : fileURLToPath(new URL("../reference/decor/", import.meta.url));
const WIDTH = Number(flag("width", 390));
const FR = args.includes("--fr");
const REDUCED = args.includes("--reduced-motion");
const DECOR = flag("decor", "");
const FLAGS = ["damaskWatermark", "cornerFlourishes", "monogram", "paperTexture"];
const PORT = 5182;

function killServerTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    else process.kill(-pid, "SIGKILL");
  } catch {
    // already dead
  }
}

const server = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
  cwd: root,
  stdio: "pipe",
  shell: true,
  detached: process.platform !== "win32",
});
await new Promise((resolve, reject) => {
  let out = "";
  const timeout = setTimeout(() => reject(new Error("dev server did not start in time:\n" + out)), 25000);
  server.stdout.on("data", (chunk) => {
    out += chunk.toString();
    if (out.includes("Local:") || out.includes("localhost")) {
      clearTimeout(timeout);
      resolve();
    }
  });
  server.stderr.on("data", (chunk) => (out += chunk.toString()));
});
await new Promise((r) => setTimeout(r, 500));

// Rewrites `flagName: true|false` inside the served config so a run can force
// individual decor flags without touching the source.
async function applyDecorOverride(context) {
  if (!DECOR) return;
  const on = new Set(DECOR === "off" ? [] : DECOR.split(","));
  await context.route(/\/src\/config\.js(\?.*)?$/, async (route) => {
    const res = await route.fetch();
    let body = await res.text();
    for (const f of FLAGS) body = body.replace(new RegExp(`${f}:\\s*(true|false)`), `${f}: ${on.has(f)}`);
    await route.fulfill({ response: res, body });
  });
}

let browser;
try {
  browser = await chromium.launch();

  async function freshPage({ throttle = 1 } = {}) {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: mode === "shots" ? 2 : 1, reducedMotion: REDUCED ? "reduce" : "no-preference" });
    await applyDecorOverride(context);
    const page = await context.newPage();
    page.on("pageerror", (err) => console.error("[pageerror]", err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("[console.error]", msg.text());
    });
    if (FR) await page.addInitScript(() => localStorage.setItem("wedding-lang", "fr"));
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
    const extraCss = args.find((a) => a.startsWith("--css="));
    if (extraCss) await page.addStyleTag({ content: extraCss.slice(6) });
    if (throttle > 1) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
      page.cdp = cdp;
    }
    return page;
  }

  async function openEnvelope(page) {
    await page.click(".envelope-seal-btn", { force: true }); // the seal's idle pulse never "settles"
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".envelope-screen")).display === "none", null, { timeout: 8000 });
    await page.waitForTimeout(800);
  }

  // Walk the whole page so every scroll-triggered reveal / stroke animation has
  // played, wait for lazy images, then stay at the bottom (triggers use
  // "play none none reverse", so scrolling back up would hide things again).
  async function scrollThrough(page) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= height; y += 260) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(110);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete), null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2600);
  }

  if (mode === "shots") {
    await mkdir(outDir, { recursive: true });
    const suffix = FR ? "-fr" : "-en";
    const page = await freshPage();
    await openEnvelope(page);
    await scrollThrough(page);
    // The floating companion/controls belong to the viewport, not the page.
    await page.addStyleTag({ content: ".companion,.floating-controls{visibility:hidden!important}" });
    if (args.includes("--full")) await page.screenshot({ path: `${outDir}/full${suffix}.png`, fullPage: true });
    const ids = flag("sections", "");
    for (const id of ids ? ids.split(",") : []) {
      const box = await page.evaluate((sel) => {
        const node = document.querySelector(sel);
        if (!node) return null;
        const r = node.getBoundingClientRect();
        return { x: 0, y: r.top + window.scrollY, width: r.width + r.left, height: r.height };
      }, `#${id}`);
      if (!box) {
        console.warn(`[skip] #${id} not found`);
        continue;
      }
      await page.screenshot({ path: `${outDir}/${id}${suffix}.png`, fullPage: true, clip: box });
    }
    console.log(`Done. Screenshots in ${outDir}`);
  }

  // ---- Text runs: every visible piece of text, its colour, size and page rect ----
  async function collectTextRuns(page) {
    return page.evaluate(() => {
      const parse = (c) => {
        const rgb = c.match(/rgba?\(([^)]+)\)/);
        if (rgb) {
          const p = rgb[1].split(/[ ,/]+/).filter(Boolean).map(Number);
          return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
        }
        const srgb = c.match(/color\(srgb ([^)]+)\)/);
        if (srgb) {
          const p = srgb[1].split(/[ /]+/).filter(Boolean).map(Number);
          return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p[3] ?? 1 };
        }
        return null;
      };
      // .rsvp-watermark / .closing-watermark are the existing decorative 7% script words, not readable text
      const skip = "script,style,.sr-only,.decor-sprite,.envelope-screen,.companion,.floating-controls,.rsvp-watermark,.closing-watermark,noscript,defs,symbol";
      const opacityOf = (node) => {
        let o = 1;
        for (let e = node; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
        return o;
      };
      const runs = [];
      const add = (node, text, rects, cs, colorStr) => {
        const color = parse(colorStr);
        if (!color || !rects.length) return;
        runs.push({
          text: text.slice(0, 48),
          color,
          opacity: opacityOf(node),
          size: parseFloat(cs.fontSize),
          weight: parseInt(cs.fontWeight, 10) || 400,
          rects: rects.map((r) => ({ x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height })),
        });
      };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode;
        const text = n.textContent.replace(/\s+/g, " ").trim();
        const p = n.parentElement;
        if (!text || !p || p.closest(skip)) continue;
        const cs = getComputedStyle(p);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
        add(p, text, rects, cs, cs.color);
      }
      document.querySelectorAll("input[placeholder],textarea[placeholder]").forEach((inp) => {
        const r = inp.getBoundingClientRect();
        if (r.width < 2) return;
        // A resizable <textarea>'s native resize-handle glyph (bottom-right,
        // ~16px, UA-drawn — CSS "color" can't touch it, so it survives the
        // transparency repaint below and would get sampled as "background",
        // producing a false worst-case pixel nowhere near the actual text.
        const resizable = inp.tagName === "TEXTAREA" && getComputedStyle(inp).resize !== "none";
        const rect = resizable
          ? { left: r.left, top: r.top, width: r.width, height: Math.max(20, r.height - 16) }
          : r;
        add(inp, inp.placeholder, [rect], getComputedStyle(inp), getComputedStyle(inp, "::placeholder").color);
      });
      return runs;
    });
  }

  const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratioOf = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  if (mode === "contrast") {
    const page = await freshPage();
    await openEnvelope(page);
    await scrollThrough(page);
    const runs = await collectTextRuns(page);
    // Repaint with every glyph transparent: what remains under each run is the
    // real background — page colour, watermark, grain, frames, decoration.
    // One restore is needed after the blanket rule: this codebase's icons use
    // fill="currentColor", which also reads the "color" property, so the
    // blanket rule doesn't just hide text — it also wipes any decorative
    // shape's own fill. Most icons sit beside text, so that's harmless, but
    // the calendar's heart icon sits BEHIND its day number, so wiping it
    // corrupts the "background" sampled for that number (a class selector +
    // !important beats the universal one on specificity, restoring it before
    // the screenshot). Actual in-SVG text (the crest's initials) is still
    // hidden via the dedicated svg text rule below.
    await page.addStyleTag({
      content:
        "*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}::placeholder{color:transparent!important;-webkit-text-fill-color:transparent!important}svg text{fill:transparent!important}.calendar-day-heart-icon,.calendar-day-heart-icon *{color:var(--color-primary-deep)!important}.companion,.floating-controls{visibility:hidden!important}",
    });
    await page.waitForTimeout(300);
    const shot = await page.screenshot({ fullPage: true });
    const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width;
    const H = info.height;

    const rows = [];
    for (const run of runs) {
      if (run.opacity < 0.05) continue; // not revealed (opacity 0) — nothing to read
      const alpha = run.color.a * run.opacity;
      const fgc = [run.color.r, run.color.g, run.color.b];
      let worst = Infinity;
      for (const r of run.rects) {
        // A 2px inward inset: right at a rect's edge, the grid can land on a
        // 1px antialiased seam (e.g. the curved boundary of a small icon
        // sitting behind a number, like the calendar's heart) which isn't
        // where the glyph's own ink actually sits — sampling it as
        // "background" produces a worst-case ratio nothing on screen shows.
        // Collapses to the rect's center instead of skipping it outright
        // when the rect is too small for the inset to leave a valid range.
        let x0 = Math.floor(r.x + 2);
        let x1 = Math.ceil(r.x + r.w - 2);
        let y0 = Math.floor(r.y + 2);
        let y1 = Math.ceil(r.y + r.h - 2);
        if (x1 < x0) x0 = x1 = Math.round(r.x + r.w / 2);
        if (y1 < y0) y0 = y1 = Math.round(r.y + r.h / 2);
        x0 = Math.max(0, x0);
        x1 = Math.min(W - 1, x1);
        y0 = Math.max(0, y0);
        y1 = Math.min(H - 1, y1);
        for (let y = y0; y <= y1; y += 2) {
          for (let x = x0; x <= x1; x += 2) {
            const i = (y * W + x) * 3;
            const bg = [data[i], data[i + 1], data[i + 2]];
            // the glyph colour as it actually appears: text colour at its alpha over this pixel
            const fg = [0, 1, 2].map((k) => alpha * fgc[k] + (1 - alpha) * bg[k]);
            worst = Math.min(worst, ratioOf(lum(...fg), lum(...bg)));
          }
        }
      }
      const large = run.size >= 24 || (run.size >= 18.66 && run.weight >= 700);
      rows.push({ text: run.text, ratio: Number(worst.toFixed(2)), size: Math.round(run.size), large, need: large ? 3 : 4.5 });
    }
    const failing = rows.filter((r) => r.ratio < r.need);
    console.log(`text runs measured: ${rows.length}  |  below WCAG AA: ${failing.length}  |  min ratio: ${Math.min(...rows.map((r) => r.ratio))}`);
    for (const r of failing) console.log(`  FAIL ${r.ratio} < ${r.need} (${r.size}px${r.large ? ", large" : ""}) "${r.text}"`);
    const json = flag("json", "");
    if (json) await writeFile(json, JSON.stringify(rows, null, 1));
  }

  // ---- Frame timing under CPU throttle ----
  if (mode === "perf") {
    const rate = Number(flag("throttle", 4));
    const nRuns = Number(flag("runs", 3));
    const stats = (frames) => {
      const sorted = [...frames].sort((a, b) => a - b);
      const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
      return {
        frames: frames.length,
        avg: frames.reduce((a, b) => a + b, 0) / frames.length,
        p95: pct(0.95),
        max: sorted[sorted.length - 1],
        over33: frames.filter((f) => f > 33.4).length,
        over50: frames.filter((f) => f > 50).length,
      };
    };
    const fmt = (r) => `frames=${r.frames} avg=${r.avg.toFixed(1)} p95=${r.p95.toFixed(1)} max=${r.max.toFixed(1)} >33ms=${r.over33} >50ms=${r.over50}`;
    const rec = (page) =>
      page.evaluate(() => {
        window.__frames = [];
        window.__stop = false;
        let last = performance.now();
        const tick = (t) => {
          window.__frames.push(t - last);
          last = t;
          if (!window.__stop) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    const take = (page) =>
      page.evaluate(() => {
        window.__stop = true;
        return window.__frames;
      });

    const open = [];
    const scroll = [];
    for (let i = 0; i < nRuns; i++) {
      const page = await freshPage({ throttle: rate });
      await rec(page);
      await page.waitForTimeout(400);
      await page.evaluate(() => (window.__frames.length = 0));
      await page.click(".envelope-seal-btn", { force: true });
      await page.waitForTimeout(3300);
      open.push(stats(await take(page)));

      await page.waitForTimeout(1200);
      await rec(page);
      await page.waitForTimeout(200);
      await page.evaluate(() => (window.__frames.length = 0));
      await page.cdp.send("Performance.enable");
      const metric = async () => Object.fromEntries((await page.cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
      const m0 = await metric();
      await page.mouse.move(200, 400);
      for (let k = 0; k < 75; k++) {
        await page.mouse.wheel(0, 120);
        await page.waitForTimeout(16);
      }
      await page.waitForTimeout(500);
      const m1 = await metric();
      const st = stats(await take(page));
      const d = (k) => ((m1[k] - m0[k]) * 1000) / 75; // ms of main-thread work per wheel step
      Object.assign(st, { task: d("TaskDuration"), script: d("ScriptDuration"), style: d("RecalcStyleDuration"), layout: d("LayoutDuration") });
      scroll.push(st);
      await page.context().close();
    }
    const median = (arr, k) => {
      const v = arr.map((r) => r[k]).sort((a, b) => a - b);
      return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
    };
    for (const [label, arr] of [
      ["open sequence", open],
      ["scroll (75 wheel steps, ~9000px)", scroll],
    ]) {
      console.log(`${label} — CPU throttle ${rate}x, ${nRuns} runs`);
      arr.forEach((r, i) => console.log(`  run ${i + 1}: ${fmt(r)}`));
      console.log(`  median: ${fmt(Object.fromEntries(Object.keys(arr[0]).map((k) => [k, median(arr, k)])))}`);
      if (arr[0].task !== undefined) console.log(`  main-thread ms per wheel step (median): task=${median(arr, "task").toFixed(1)} script=${median(arr, "script").toFixed(1)} style=${median(arr, "style").toFixed(1)} layout=${median(arr, "layout").toFixed(1)}`);
    }
  }

  // ---- Structural checks ----
  if (mode === "checks") {
    const page = await freshPage();
    const bgImage = () =>
      page.evaluate(() => {
        const b = document.querySelector(".decor-bg");
        return b ? getComputedStyle(b).backgroundImage : "(no .decor-bg)";
      });
    const live = () => page.evaluate(() => document.querySelector(".app-shell").classList.contains("decor-live"));
    console.log(`before tap:       decor-live=${await live()}  backdrop image=${(await bgImage()).slice(0, 40)}`);
    await page.click(".envelope-seal-btn", { force: true });
    await page.waitForTimeout(1500);
    console.log(`mid-open (1.5s):  decor-live=${await live()}  backdrop image=${(await bgImage()).slice(0, 40)}`);
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".envelope-screen")).display === "none", null, { timeout: 8000 });
    await page.waitForTimeout(400);

    // draw animation on the hero crest: sample the inherited dashoffset / fill-opacity
    const samples = await page.evaluate(async () => {
      const use = document.querySelector(".decor-crest use");
      if (!use) return ["(no crest)"];
      const out = [];
      for (let i = 0; i < 8; i++) {
        const cs = getComputedStyle(use);
        out.push(`${parseFloat(cs.strokeDashoffset).toFixed(2)}/${parseFloat(cs.fillOpacity).toFixed(2)}`);
        await new Promise((r) => setTimeout(r, 300));
      }
      return out;
    });
    console.log(`after reveal:     decor-live=${await live()}  backdrop image=${(await bgImage()).slice(0, 50)}...`);
    console.log(`hero crest draw, dashoffset/fill-opacity every 300ms: ${samples.join("  ")}`);

    await scrollThrough(page);
    const counts = await page.evaluate(() => ({
      corners: document.querySelectorAll(".decor-corner").length,
      cornersDrawn: document.querySelectorAll(".decor-corner.is-drawn").length,
      crests: document.querySelectorAll(".decor-crest").length,
      crestsDrawn: document.querySelectorAll(".decor-crest.is-drawn").length,
      sections: [...document.querySelectorAll(".decor-corner")].map((c) => c.parentElement.id),
    }));
    console.log(`corners drawn ${counts.cornersDrawn}/${counts.corners} in [${[...new Set(counts.sections)].join(", ")}]; crests drawn ${counts.crestsDrawn}/${counts.crests}`);

    // No ornament may touch text.
    const runs = await collectTextRuns(page);
    const boxes = await page.evaluate(() =>
      [...document.querySelectorAll(".decor-corner,.decor-crest")].map((n) => {
        const r = n.getBoundingClientRect();
        return { kind: n.classList.contains("decor-crest") ? "crest" : "corner", section: n.closest("section")?.id, x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height };
      })
    );
    let overlaps = 0;
    for (const b of boxes) {
      for (const run of runs) {
        for (const r of run.rects) {
          const ix = Math.min(b.x + b.w, r.x + r.w) - Math.max(b.x, r.x);
          const iy = Math.min(b.y + b.h, r.y + r.h) - Math.max(b.y, r.y);
          if (ix > 0 && iy > 0) {
            overlaps++;
            console.log(`  OVERLAP ${b.kind} in #${b.section} with "${run.text}" (${ix.toFixed(0)}x${iy.toFixed(0)}px)`);
          }
        }
      }
    }
    console.log(`ornaments vs text: ${boxes.length} ornaments, ${runs.length} text runs, ${overlaps} overlaps`);
    // The wisteria hangs off the badge at a % of its height; the crest makes the badge taller, so make sure it still clears the date row.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);
    const floral = await page.evaluate(async () => {
      const out = [];
      for (let i = 0; i < 8; i++) {
        const f = document.querySelector(".hero-floral-left").getBoundingClientRect();
        const dates = [...document.querySelectorAll(".hero-badge-date-part")].map((n) => n.getBoundingClientRect());
        const hit = dates.filter((d) => f.right > d.left && f.left < d.right && f.bottom > d.top && f.top < d.bottom).length;
        out.push({ floralBottom: Math.round(f.bottom), dateTop: Math.round(dates[0].top), overlap: hit });
        await new Promise((r) => setTimeout(r, 400));
      }
      return out;
    });
    console.log("wisteria box vs date row (8 samples over a sway):", floral.map((f) => `bottom ${f.floralBottom}/date ${f.dateTop}/overlap ${f.overlap}`).join("; "));
    const cs = await page.evaluate(() => {
      const use = document.querySelector(".decor-corner use");
      if (!use) return { dashoffset: "n/a", transition: "n/a" };
      return { dashoffset: getComputedStyle(use).strokeDashoffset, transition: getComputedStyle(use).transitionDuration };
    });
    console.log(`corner <use>: dashoffset=${cs.dashoffset} transition-duration=${cs.transition}`);
  }

  if (!["shots", "contrast", "perf", "checks"].includes(mode)) {
    console.error("usage: decor-check.mjs shots <out-dir> | contrast | perf | checks");
    process.exitCode = 1;
  }
} finally {
  if (browser) await browser.close();
  killServerTree(server.pid);
}
