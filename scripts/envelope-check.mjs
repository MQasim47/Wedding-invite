// Dev tool (not part of the shipped site) — starts the dev server, opens the
// page in a 390px-wide Chromium viewport and either screenshots the envelope
// (closed / mid-open / revealed) or profiles the open animation's frame times
// under CPU throttling.
//
//   node scripts/envelope-check.mjs shots <out-dir> [--fr]
//   node scripts/envelope-check.mjs perf [--throttle=4] [--runs=3] [--css="<rules>"]
//
// `--css` injects extra CSS before the tap, to A/B a single layer or effect
// (e.g. --css=".envelope-flap{filter:none!important}").
//
// `--root <dir>` runs the dev server from another checkout (e.g. a git
// worktree of an older commit, with node_modules linked in) so old and new
// can be compared with identical measurement code.
import { chromium } from "playwright";
import { spawn, execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const mode = args[0];
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};
const rootIdx = args.indexOf("--root");
const root = rootIdx >= 0 ? args[rootIdx + 1] : fileURLToPath(new URL("..", import.meta.url));
const outDir = args[1] && !args[1].startsWith("--") ? args[1] : fileURLToPath(new URL("../reference/current-state/", import.meta.url));
const PORT = 5181;

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

let browser;
try {
  browser = await chromium.launch();

  async function freshPage() {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    page.on("pageerror", (err) => console.error("[pageerror]", err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.error("[console.error]", msg.text());
    });
    if (args.includes("--fr")) await page.addInitScript(() => localStorage.setItem("wedding-lang", "fr"));
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
    const css = args.find((a) => a.startsWith("--css="));
    if (css) await page.addStyleTag({ content: css.slice(6) });
    return page;
  }

  if (mode === "shots") {
    await mkdir(outDir, { recursive: true });
    const suffix = args.includes("--fr") ? "-fr" : "";
    const page = await freshPage();
    await page.screenshot({ path: `${outDir}/env-1-closed${suffix}.png` });
    // A screenshot of this page takes a few hundred ms of real time, which
    // would push every "mid-open" frame well past its intended moment — so
    // grab the app's own GSAP instance (same dev-server module URL, hence the
    // same module) and scrub the open timeline to exact times instead.
    await page.click(".envelope-seal-btn", { force: true }); // idle pulse never "settles"
    await page.evaluate(async () => {
      const url = performance.getEntriesByType("resource").map((r) => r.name).find((n) => n.includes("deps/gsap.js"));
      const { default: gsap } = await import(url);
      const tl = gsap.globalTimeline.getChildren(false, false, true).find((c) => c.duration() > 2);
      tl.pause();
      window.__openTl = tl;
    });
    for (const [label, at] of [["2-flap-lifting", 0.42], ["3-glow-sparkles", 1.2], ["4-flash", 2.1]]) {
      // braces matter: returning the timeline would make Playwright try to
      // serialise the whole GSAP object graph back to Node.
      await page.evaluate((t) => { window.__openTl.time(t); }, at);
      await page.waitForTimeout(250); // let the sparkle canvas (real-time rAF) draw a few frames
      await page.screenshot({ path: `${outDir}/env-${label}${suffix}.png` });
    }
    await page.evaluate(() => { window.__openTl.play(); });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${outDir}/env-5-reveal${suffix}.png` });
    console.log(`Done. Screenshots in ${outDir}`);
  } else if (mode === "perf") {
    const rate = Number(flag("throttle", 4));
    const runs = Number(flag("runs", 3));
    const results = [];
    for (let i = 0; i < runs; i++) {
      const page = await freshPage();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate });
      await page.evaluate(() => {
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
      await page.waitForTimeout(400); // settle
      await page.evaluate(() => (window.__frames.length = 0));
      await page.click(".envelope-seal-btn", { force: true });
      await page.waitForTimeout(3200); // the whole open sequence (~2.6s) plus reveal
      const frames = await page.evaluate(() => {
        window.__stop = true;
        return window.__frames;
      });
      const sorted = [...frames].sort((a, b) => a - b);
      const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
      results.push({
        frames: frames.length,
        avg: frames.reduce((a, b) => a + b, 0) / frames.length,
        p95: pct(0.95),
        max: sorted[sorted.length - 1],
        over33: frames.filter((f) => f > 33.4).length,
        over50: frames.filter((f) => f > 50).length,
      });
      await page.context().close();
    }
    const f = (n) => n.toFixed(1);
    console.log(`CPU throttle ${rate}x, ${runs} runs (frame times in ms; >33 = below 30fps)`);
    results.forEach((r, i) => console.log(`  run ${i + 1}: frames=${r.frames} avg=${f(r.avg)} p95=${f(r.p95)} max=${f(r.max)} >33ms=${r.over33} >50ms=${r.over50}`));
    const median = (k) => {
      const v = results.map((r) => r[k]).sort((a, b) => a - b);
      return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
    };
    console.log(`  median: frames=${f(median("frames"))} avg=${f(median("avg"))} p95=${f(median("p95"))} max=${f(median("max"))} >33ms=${f(median("over33"))} >50ms=${f(median("over50"))}`);
    const mean = (k) => results.reduce((a, r) => a + r[k], 0) / results.length;
    console.log(`  mean:  frames=${f(mean("frames"))} avg=${f(mean("avg"))} p95=${f(mean("p95"))} max=${f(mean("max"))} >33ms=${f(mean("over33"))} >50ms=${f(mean("over50"))}`);
  } else {
    console.error("usage: envelope-check.mjs shots <out-dir> | perf [--throttle=4] [--runs=3]");
    process.exitCode = 1;
  }
} finally {
  if (browser) await browser.close();
  killServerTree(server.pid);
}
