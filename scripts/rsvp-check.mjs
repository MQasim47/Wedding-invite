// Dev tool (not part of the shipped site) — drives the real RSVP form in a
// 390px Chromium viewport.
//
//   node scripts/rsvp-check.mjs mock <out-dir> [--only=states,hang,empty,deadline]
//       Mocks the endpoint and checks every state: success, network error,
//       HTTP 500, {ok:false}, non-JSON body, slow response, hang/timeout,
//       empty endpoint, double submission, and the deadline switch. Prints
//       PASS/FAIL per check and saves screenshots of the styled states in
//       EN and FR.
//
//   node scripts/rsvp-check.mjs live <endpoint-url> [--lang=en|fr] [--guest=Name]
//       Submits ONE real entry through the real form to the real endpoint
//       (no mocking) and reports what the page showed. Check the sheet
//       afterwards for the row.
import { chromium } from "playwright";
import { spawn, execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const mode = args[0];
const flag = (name, fallback) => (args.find((a) => a.startsWith(`--${name}=`)) || `=${fallback}`).split("=").slice(1).join("=");
const root = fileURLToPath(new URL("..", import.meta.url));
const PORT = 5182;
const TEST_ENDPOINT = "https://script.google.com/macros/s/MOCK/exec";

function killServerTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
    else process.kill(-pid, "SIGKILL");
  } catch {
    // already dead
  }
}

const server = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { cwd: root, stdio: "pipe", shell: true, detached: process.platform !== "win32" });
await new Promise((resolve, reject) => {
  let out = "";
  const timeout = setTimeout(() => reject(new Error("dev server did not start:\n" + out)), 25000);
  server.stdout.on("data", (c) => {
    out += c.toString();
    if (out.includes("Local:") || out.includes("localhost")) {
      clearTimeout(timeout);
      resolve();
    }
  });
  server.stderr.on("data", (c) => (out += c.toString()));
});
await new Promise((r) => setTimeout(r, 500));

let browser;
let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

try {
  browser = await chromium.launch();

  // Opens the page at 390px, optionally rewriting config.rsvp.endpoint (mock
  // mode) and the clock, then opens the envelope and scrolls to the form.
  async function openRsvp({ endpoint, lang = "en", now, query = "" } = {}) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript((l) => localStorage.setItem("wedding-lang", l), lang);
    if (now) await page.clock.install({ time: new Date(now) });
    if (endpoint !== undefined) {
      await page.route("**/src/config.js*", async (route) => {
        const res = await route.fetch();
        const body = (await res.text()).replace(/endpoint:\s*"[^"]*"/, `endpoint: ${JSON.stringify(endpoint)}`);
        // the rewritten body has a different length — drop the stale length/encoding headers
        const { "content-length": _l, "content-encoding": _e, ...headers } = res.headers();
        await route.fulfill({ status: res.status(), headers, body });
      });
    }
    await page.goto(`http://localhost:${PORT}/${query}`, { waitUntil: "commit", timeout: 60000 });
    // not "load"/"networkidle": those wait on third-party requests (web fonts)
    // that can stall; the app itself is ready once the seal exists.
    await page.waitForSelector(".envelope-seal-btn", { timeout: 60000 });
    await page.waitForTimeout(1200); // let the seal pulse start and fonts settle
    await page.mouse.click(195, 422);
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".envelope-screen")).display === "none", null, { timeout: 15000 });
    await page.waitForTimeout(300);
    return { page, context, errors };
  }

  async function fillAndSubmit(page, { name = "Test Guest", yes = true, message = "See you there" } = {}) {
    await page.locator("#rsvp").scrollIntoViewIfNeeded();
    await page.fill("#rsvp-name", name);
    await page.locator(".attending-option").nth(yes ? 0 : 1).click();
    if (message) await page.fill("#rsvp-message", message);
    await page.locator(".rsvp-submit-btn").click();
  }

  const cors = { "access-control-allow-origin": "*", "content-type": "application/json" };
  const statusText = (page) => page.locator(".rsvp-status:not([hidden])").innerText().catch(() => null);
  // Non-fatal: a screenshot waits for web fonts, and a stalled third-party request
  // shouldn't fail a behavioural check.
  const shot = (page, out, name) => page.locator("#rsvp").screenshot({ path: `${out}/${name}.png`, timeout: 15000 }).catch((e) => console.log(`WARN  screenshot ${name} skipped: ${e.message.split("\n")[0]}`));

  if (mode === "mock") {
    const only = flag("only", "");
    const want = (name) => !only || only.split(",").includes(name);
    const out = args[1] || fileURLToPath(new URL("../reference/current-state/", import.meta.url));
    await mkdir(out, { recursive: true });

    for (const lang of want("states") ? ["en", "fr"] : []) {
      console.log(`\n=== ${lang.toUpperCase()} ===`);

      // --- success + payload contents + double submission ---
      {
        const { page, context, errors } = await openRsvp({ endpoint: TEST_ENDPOINT, lang, query: "?guest=Marie%20Curie" });
        const requests = [];
        await page.route(TEST_ENDPOINT, async (route) => {
          requests.push(JSON.parse(route.request().postData()));
          await new Promise((r) => setTimeout(r, 4000)); // wide window to hammer the form in flight
          await route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true }) });
        });
        await fillAndSubmit(page, { name: "Test Guest" });
        await page.waitForTimeout(300);
        const btn = page.locator(".rsvp-submit-btn");
        check("sending: button disabled while in flight", await btn.isDisabled());
        check("sending: button shows loading state + label", (await btn.getAttribute("class")).includes("is-loading") && (await btn.innerText()).length > 0, await btn.innerText());
        check("sending: fields locked", await page.locator("#rsvp-name").isDisabled());
        // hammer the form while the request is in flight: programmatic submits (what an
        // Enter key press does) and forced clicks on the disabled button
        for (let i = 0; i < 3; i++) await page.locator("#rsvp-name").evaluate((el) => el.form.requestSubmit());
        await btn.click({ force: true, timeout: 2000 }).catch(() => {});
        await btn.dispatchEvent("click").catch(() => {});
        check("hammering during flight: still exactly one request", requests.length === 1, `requests=${requests.length}`);
        await shot(page, out, `rsvp-sending-${lang}`);
        await page.waitForSelector(".rsvp-success:not([hidden])", { timeout: 12000 });
        check("double submission: exactly one request sent", requests.length === 1, `requests=${requests.length}`);
        const p = requests[0];
        check("payload has name/attending/guests/message/language/guestParam/submissionId",
          p.name === "Test Guest" && p.attending === "yes" && p.guests === 1 && p.message === "See you there" && p.language === lang && p.guestParam === "Marie Curie" && !!p.submissionId,
          JSON.stringify({ ...p, submittedAt: "…" }));
        check("success state shown", await page.locator(".rsvp-success:not([hidden])").isVisible());
        await page.waitForTimeout(900);
        await shot(page, out, `rsvp-success-${lang}`);
        check("no page errors", errors.length === 0, errors.join(" | "));
        await context.close();
      }

      // --- failure modes: each must show a styled error and never a success ---
      const failures_ = [
        ["network error", (route) => route.abort("failed"), "errorNetwork"],
        ["HTTP 500", (route) => route.fulfill({ status: 500, headers: cors, body: "boom" }), "errorServer"],
        ["HTTP 200 but {ok:false}", (route) => route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: false, error: "x" }) }), "errorServer"],
        ["HTTP 200 non-JSON body", (route) => route.fulfill({ status: 200, headers: { ...cors, "content-type": "text/html" }, body: "<html>Sign in</html>" }), "errorServer"],
      ];
      for (const [label, handler, key] of failures_) {
        const { page, context } = await openRsvp({ endpoint: TEST_ENDPOINT, lang });
        await page.route(TEST_ENDPOINT, handler);
        await fillAndSubmit(page);
        await page.waitForSelector(".rsvp-status:not([hidden])", { timeout: 8000 });
        const i18n = (await import("../src/i18n.js")).i18n[lang].rsvp;
        const txt = await statusText(page);
        check(`${label}: styled error shown, correct ${lang} message`, txt?.includes(i18n[key]), txt);
        check(`${label}: no fake success`, await page.locator(".rsvp-success").isHidden());
        check(`${label}: form usable again (button enabled, fields unlocked)`, (await page.locator(".rsvp-submit-btn").isEnabled()) && (await page.locator("#rsvp-name").isEnabled()));
        if (label === "network error") await shot(page, out, `rsvp-error-${lang}`);
        await context.close();
      }

      // --- retry after an error succeeds and reuses the same submissionId ---
      {
        const { page, context } = await openRsvp({ endpoint: TEST_ENDPOINT, lang });
        const ids = [];
        let n = 0;
        await page.route(TEST_ENDPOINT, async (route) => {
          ids.push(JSON.parse(route.request().postData()).submissionId);
          if (n++ === 0) return route.abort("failed");
          return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true }) });
        });
        await fillAndSubmit(page);
        await page.waitForSelector(".rsvp-status:not([hidden])");
        await page.locator(".rsvp-submit-btn").click();
        await page.waitForSelector(".rsvp-success:not([hidden])", { timeout: 8000 });
        check("retry after failure succeeds and reuses submissionId (backend dedupes)", ids.length === 2 && ids[0] === ids[1], ids.join(" / "));
        await context.close();
      }

      // --- slow response (9s): loading state persists, "still sending" notice appears, then success ---
      {
        const { page, context } = await openRsvp({ endpoint: TEST_ENDPOINT, lang });
        await page.route(TEST_ENDPOINT, async (route) => {
          await new Promise((r) => setTimeout(r, 9500));
          await route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true }) });
        });
        await fillAndSubmit(page);
        await page.waitForTimeout(8600);
        const i18n = (await import("../src/i18n.js")).i18n[lang].rsvp;
        check("slow: 'still sending' notice shown after ~8s while button stays disabled", (await statusText(page))?.includes(i18n.slowNotice) && (await page.locator(".rsvp-submit-btn").isDisabled()), await statusText(page));
        await shot(page, out, `rsvp-slow-${lang}`);
        await page.waitForSelector(".rsvp-success:not([hidden])", { timeout: 6000 });
        check("slow: eventually succeeds and the notice is cleared", await page.locator(".rsvp-status").isHidden());
        await context.close();
      }
    }

    // --- hang (no response ever): gives up at 30s with a retryable timeout error ---
    if (want("hang")) {
      const { page, context } = await openRsvp({ endpoint: TEST_ENDPOINT });
      await page.route(TEST_ENDPOINT, () => {}); // never fulfilled
      await fillAndSubmit(page);
      await page.waitForSelector(".rsvp-status[data-kind='error']", { timeout: 40000 }); // the client gives up at 30s (the 8s "still sending" notice comes first)
      const i18n = (await import("../src/i18n.js")).i18n.en.rsvp;
      check("hang: times out with a retryable error (not stuck loading, not success)", (await statusText(page))?.includes(i18n.errorTimeout) && (await page.locator(".rsvp-submit-btn").isEnabled()) && (await page.locator(".rsvp-success").isHidden()), await statusText(page));
      await context.close();
    }

    // --- empty endpoint: real error, never a fake success ---
    if (want("empty")) {
      const { page, context } = await openRsvp({ endpoint: "" });
      await fillAndSubmit(page);
      await page.waitForSelector(".rsvp-status:not([hidden])", { timeout: 5000 });
      check("empty endpoint: error shown, no demo-mode success", (await page.locator(".rsvp-success").isHidden()) && (await statusText(page)) !== null, await statusText(page));
      await context.close();
    }

    // --- deadline (2026-10-15): open through the whole day, closed after ---
    for (const [label, now, expectForm] of !want("deadline") ? [] : [
      ["Oct 15 2026 09:00 (deadline day)", "2026-10-15T09:00:00", true],
      ["Oct 15 2026 23:30 (last hours)", "2026-10-15T23:30:00", true],
      ["Oct 16 2026 00:30 (just after)", "2026-10-16T00:30:00", false],
      ["Dec 1 2026 (well after)", "2026-12-01T12:00:00", false],
    ]) {
      const { page, context } = await openRsvp({ now });
      const hasForm = (await page.locator("#rsvp form.rsvp-form").count()) > 0;
      const visibleTitles = await page.locator("#rsvp .rsvp-success-title:visible").allInnerTexts();
      const closedShown = visibleTitles.includes("RSVP Closed");
      check(`deadline @ ${label}: ${expectForm ? "form shown" : "closed message replaces form"}`, hasForm === expectForm && closedShown === !expectForm, `form=${hasForm} visibleTitles=${visibleTitles.join(",") || "-"}`);
      if (!expectForm && label.startsWith("Oct 16")) await shot(page, out, "rsvp-closed-en");
      await context.close();
    }
    if (want("deadline")) {
      const { page, context } = await openRsvp({ now: "2026-10-16T00:30:00", lang: "fr" });
      const t = await page.locator("#rsvp .rsvp-success-title").innerText();
      check("deadline (FR): closed message in French", t === "RSVP clos", t);
      await shot(page, out, "rsvp-closed-fr");
      await context.close();
    }

    console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
    process.exitCode = failures ? 1 : 0;
  } else if (mode === "live") {
    const endpoint = args[1];
    if (!endpoint || !endpoint.startsWith("https://")) throw new Error("usage: rsvp-check.mjs live <https endpoint url> [--lang=en|fr] [--guest=Name]");
    const lang = flag("lang", "en");
    const guest = flag("guest", "");
    const { page, context } = await openRsvp({ endpoint, lang, query: guest ? `?guest=${encodeURIComponent(guest)}` : "" });
    const stamp = new Date().toISOString();
    const responses = [];
    page.on("response", (r) => r.url().startsWith(endpoint.split("/exec")[0]) && responses.push(`${r.status()} ${r.url().slice(0, 60)}`));
    await fillAndSubmit(page, { name: `TEST ENTRY ${stamp}`, yes: true, message: `Automated end-to-end test (${lang}) — safe to delete` });
    const outcome = await Promise.race([
      page.waitForSelector(".rsvp-success:not([hidden])", { timeout: 45000 }).then(() => "success"),
      page.waitForSelector(".rsvp-status[data-kind='error']:not([hidden])", { timeout: 45000 }).then(async () => `error: ${await statusText(page)}`),
    ]);
    console.log({ outcome, submittedName: `TEST ENTRY ${stamp}`, lang, guest, responses });
    await page.screenshot({ path: `${args[2]?.startsWith("--") ? "." : args[2] || "."}/rsvp-live-${lang}.png`, fullPage: false }).catch(() => {});
    await context.close();
  } else {
    console.error("usage: rsvp-check.mjs mock <out-dir> | live <endpoint-url> [--lang=en|fr] [--guest=Name]");
    process.exitCode = 1;
  }
} finally {
  if (browser) await browser.close();
  killServerTree(server.pid);
}
