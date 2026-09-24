// Dev tool (not part of the shipped site) — drives the real page in a 390px
// Chromium viewport against the Vite dev server.
//
//   node scripts/rsvp-check.mjs mock <out-dir> [--only=codes,form,failures,slow,hang,deadline,lang]
//       Mocks Supabase (lookup RPC, submit RPC, settings) and checks every
//       invitation-code and RSVP state: no code / malformed / unknown /
//       lowercase+spaces, legacy ?guest=, lookup errors + retry, guest cap,
//       null cap, already-replied prefill, success + double submission,
//       every failure mode, slow + hang, the server closing the RSVP, the
//       deadline from settings, preferred_language vs the manual toggle, and
//       that a code never reaches a URL or the console. Prints PASS/FAIL per
//       check and saves 390px screenshots in EN and FR.
//
//   node scripts/rsvp-check.mjs live <code> [--lang=en|fr] [--submit=yes:<n>|no] [--out=<dir>]
//       Opens the page with ?i=<code> against the REAL Supabase project
//       (.env.local) and reports what it shows. With --submit, sends one
//       real reply through the real form — use a test invitation.
import { chromium } from "playwright";
import { spawn, execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const mode = args[0];
const flag = (name, fallback) => (args.find((a) => a.startsWith(`--${name}=`)) || `=${fallback}`).split("=").slice(1).join("=");
const root = fileURLToPath(new URL("..", import.meta.url));
const PORT = 5182;
const { i18n } = await import("../src/i18n.js");

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

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "apikey, authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "content-type": "application/json",
};
const json = (route, status, body) => route.fulfill({ status, headers: CORS, body: JSON.stringify(body) });
const raise = (route, name) => json(route, 400, { code: "P0001", details: null, hint: null, message: name });
const row = (over = {}) => ({ display_name: "Voisin blanc", authorized_guests: 2, rsvp_status: "pending", confirmed_guests: null, preferred_language: null, ...over });

try {
  browser = await chromium.launch();

  // Opens the page at 390px, installs the Supabase mock (if given), opens
  // the envelope and returns once the page is scrollable.
  // lang: "en"/"fr" = a remembered manual toggle; null = none (browser locale decides).
  async function openPage({ query = "", lang = "en", locale = "en-US", now, supabase, openEnvelope = true } = {}) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale });
    const page = await context.newPage();
    const errors = [];
    const consoleLines = [];
    const urls = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => consoleLines.push(m.text()));
    page.on("request", (r) => urls.push(r.url()));
    if (lang) await page.addInitScript((l) => localStorage.setItem("wedding-lang", l), lang);
    if (now) await page.clock.install({ time: new Date(now) });
    const calls = { lookup: [], submit: [], settings: 0 };
    if (supabase) {
      await page.route("**/rest/v1/**", async (route) => {
        const req = route.request();
        if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
        const url = req.url();
        if (url.endsWith("/rpc/get_public_setting")) {
          calls.settings++;
          return supabase.settings ? supabase.settings(route) : json(route, 200, "2026-10-15");
        }
        if (url.endsWith("/rpc/get_invitation_by_public_code")) {
          calls.lookup.push(JSON.parse(req.postData()));
          return supabase.lookup ? supabase.lookup(route, calls.lookup.length) : json(route, 200, []);
        }
        if (url.endsWith("/rpc/submit_rsvp")) {
          calls.submit.push(JSON.parse(req.postData()));
          return supabase.submit ? supabase.submit(route, calls.submit.length) : json(route, 200, [{ rsvp_status: "accepted", confirmed_guests: 1 }]);
        }
        return route.abort("failed");
      });
    }
    await page.goto(`http://localhost:${PORT}/${query}`, { waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector(".envelope-seal-btn", { timeout: 60000 });
    if (openEnvelope) {
      await page.waitForTimeout(1200);
      await page.mouse.click(195, 422);
      await page.waitForFunction(() => getComputedStyle(document.querySelector(".envelope-screen")).display === "none", null, { timeout: 15000 });
      await page.waitForTimeout(400);
    }
    return { page, context, errors, consoleLines, urls, calls };
  }

  const visible = (page, sel) => page.locator(sel).first().isVisible().catch(() => false);
  const text = (page, sel) => page.locator(sel).first().innerText().catch(() => null);
  const statusText = (page) => text(page, ".rsvp-status:not([hidden])");
  const greeting = (page) => page.locator(".greeting").first().evaluate((n) => (n.hidden ? null : n.textContent.trim())).catch(() => null);
  const shot = (page, out, name) =>
    page.locator("#rsvp").scrollIntoViewIfNeeded().then(() => page.waitForTimeout(700)).then(() => page.locator("#rsvp").screenshot({ path: `${out}/${name}.png`, timeout: 15000 }))
      .catch((e) => console.log(`WARN  screenshot ${name} skipped: ${e.message.split("\n")[0]}`));
  const shotGreeting = (page, out, name) =>
    page.locator(".hero").first().scrollIntoViewIfNeeded().then(() => page.waitForTimeout(900)).then(() => page.screenshot({ path: `${out}/${name}.png`, fullPage: false, timeout: 15000 }))
      .catch((e) => console.log(`WARN  screenshot ${name} skipped: ${e.message.split("\n")[0]}`));
  async function waitForForm(page) {
    await page.waitForSelector("#rsvp form.rsvp-form:not([hidden])", { timeout: 10000 });
    await page.locator("#rsvp").scrollIntoViewIfNeeded();
  }
  async function submit(page, { yes = true, message = "" } = {}) {
    await page.locator(".attending-option").nth(yes ? 0 : 1).click();
    if (message) await page.fill("#rsvp-message", message);
    await page.locator(".rsvp-submit-btn").click();
  }

  if (mode === "mock") {
    const only = flag("only", "");
    const want = (name) => !only || only.split(",").includes(name);
    const out = args[1] && !args[1].startsWith("--") ? args[1] : fileURLToPath(new URL("../reference/current-state/", import.meta.url));
    await mkdir(out, { recursive: true });

    for (const lang of ["en", "fr"]) {
      const r = i18n[lang].rsvp;
      const dear = i18n[lang].greeting.dear;
      console.log(`\n=== ${lang.toUpperCase()} ===`);

      // ------------------------------------------------------------------ codes
      if (want("codes")) {
        {
          const { page, context, calls, errors } = await openPage({ lang, supabase: {} });
          await page.waitForTimeout(300);
          check("no ?i=: no greeting", (await greeting(page)) === null, String(await greeting(page)));
          check("no ?i=: 'use your personal link' line instead of the form", (await text(page, ".rsvp-notice-text")) === r.noCode && !(await visible(page, "form.rsvp-form")));
          check("no ?i=: no incomplete-link note", !(await visible(page, ".rsvp-notice-note")));
          check("no ?i=: no lookup request made", calls.lookup.length === 0);
          check("no ?i=: rest of the invitation still renders", (await page.locator(".section").count()) > 8 && (await visible(page, "#welcome")));
          await shot(page, out, `rsvp-no-code-${lang}`);
          check("no page errors", errors.length === 0, errors.join(" | "));
          await context.close();
        }
        {
          const { page, context, calls } = await openPage({ lang, query: "?i=abc", supabase: {} });
          check("malformed ?i=abc: generic state + incomplete-link note", (await text(page, ".rsvp-notice-text")) === r.noCode && (await text(page, ".rsvp-notice-note")) === r.incompleteLink);
          check("malformed ?i=abc: no lookup spent on it", calls.lookup.length === 0);
          await context.close();
        }
        {
          const { page, context, calls } = await openPage({ lang, query: "?i=ZZZZZZZZ", supabase: { lookup: (route) => json(route, 200, []) } });
          await page.waitForSelector(".rsvp-notice-note:not([hidden])");
          check("unknown ?i=: generic state + incomplete-link note, no error page", (await text(page, ".rsvp-notice-text")) === r.noCode && (await text(page, ".rsvp-notice-note")) === r.incompleteLink && (await visible(page, "#welcome")));
          check("unknown ?i=: no greeting", (await greeting(page)) === null);
          check("unknown ?i=: exactly one lookup", calls.lookup.length === 1);
          await shot(page, out, `rsvp-incomplete-link-${lang}`);
          await context.close();
        }
        {
          const { page, context, calls, consoleLines, urls } = await openPage({ lang, query: "?i=test2345%20%20", supabase: { lookup: (route) => json(route, 200, [row()]) } });
          await waitForForm(page);
          check("lowercase + trailing spaces: normalized before lookup", calls.lookup[0]?.p_code === "TEST2345", JSON.stringify(calls.lookup[0]));
          check(`found: greeting "${dear} Voisin blanc,"`, (await greeting(page)) === `${dear} Voisin blanc,`, await greeting(page));
          check("found: greeting name is notranslate", (await page.locator(".greeting .notranslate").count()) === 1);
          check("found: name pre-filled from the database, no name input", (await text(page, ".rsvp-guest-name")) === "Voisin blanc" && (await page.locator("#rsvp-name").count()) === 0);
          check("found: code kept in sessionStorage", (await page.evaluate(() => sessionStorage.getItem("wedding-invite-code"))) === "TEST2345");
          check("code never in a request URL", !urls.some((u) => /TEST2345/i.test(u) && !u.startsWith(`http://localhost:${PORT}/?`)), urls.filter((u) => /TEST2345/i.test(u)).join(" "));
          check("code never in the console", !consoleLines.some((l) => /TEST2345/i.test(l)));
          await shotGreeting(page, out, `greeting-${lang}`);
          await context.close();
        }
        {
          const { page, context } = await openPage({ lang, query: "?guest=Marie%20Curie", supabase: {} });
          check("legacy ?guest= (no code): greeting still shown", (await greeting(page)) === `${dear} Marie Curie,`, await greeting(page));
          check("legacy ?guest= (no code): no RSVP form", !(await visible(page, "form.rsvp-form")));
          await context.close();
        }
        {
          const { page, context } = await openPage({ lang, query: "?guest=Marie%20Curie&i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row({ display_name: "Chorale 4" })]) } });
          await waitForForm(page);
          check("?guest= and ?i= both present: the code wins", (await greeting(page)) === `${dear} Chorale 4,`, await greeting(page));
          await context.close();
        }
        {
          const { page, context } = await openPage({ lang, query: "?guest=Marie&i=ZZZZZZZZ", supabase: { lookup: (route) => json(route, 200, []) } });
          await page.waitForSelector(".rsvp-notice-note:not([hidden])");
          check("unknown code + ?guest=: falls back to the legacy name", (await greeting(page)) === `${dear} Marie,`, await greeting(page));
          await context.close();
        }
        {
          const { page, context, calls } = await openPage({
            lang,
            query: "?i=TEST2345",
            supabase: { lookup: (route, n) => (n === 1 ? route.abort("failed") : json(route, 200, [row()])) },
          });
          await page.waitForSelector(".rsvp-retry-btn:not([hidden])");
          check("lookup network failure: retryable message, not an error page", (await text(page, ".rsvp-notice-text")) === r.lookupError && (await visible(page, "#welcome")));
          await shot(page, out, `rsvp-lookup-error-${lang}`);
          await page.locator(".rsvp-retry-btn").click();
          await waitForForm(page);
          check("lookup retry: form appears", calls.lookup.length === 2);
          await context.close();
        }
        {
          const { page, context } = await openPage({ lang, query: "?i=TEST2345", supabase: { lookup: (route) => raise(route, "rate_limited") } });
          await page.waitForSelector(".rsvp-retry-btn:not([hidden])");
          check("lookup rate-limited: says so", (await text(page, ".rsvp-notice-text")) === r.errorRateLimited);
          await context.close();
        }
        {
          // sessionStorage fallback: the code survives the query string being lost in the same tab
          const { page, context } = await openPage({ lang, query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row()]) } });
          await waitForForm(page);
          await page.goto(`http://localhost:${PORT}/#rsvp`, { waitUntil: "commit" });
          await page.waitForSelector(".envelope-seal-btn");
          await page.waitForTimeout(800);
          check("same tab, query string lost: code restored from session into the URL", page.url().includes("i=TEST2345"), page.url());
          await page.goto(`http://localhost:${PORT}/?i=ZZZZZZZZ`, { waitUntil: "commit" });
          await page.waitForSelector(".envelope-seal-btn");
          await page.waitForTimeout(800);
          check("URL wins over session: a new ?i= replaces the stored code", (await page.evaluate(() => sessionStorage.getItem("wedding-invite-code"))) !== "TEST2345");
          await context.close();
        }
      }

      // ------------------------------------------------------------------- form
      if (want("form")) {
        {
          const { page, context, calls, errors } = await openPage({
            lang,
            query: "?i=TEST2345",
            supabase: {
              lookup: (route) => json(route, 200, [row({ authorized_guests: 2 })]),
              submit: async (route) => {
                await new Promise((res) => setTimeout(res, 4000)); // wide window to hammer the form in flight
                return json(route, 200, [{ rsvp_status: "accepted", confirmed_guests: 2 }]);
              },
            },
          });
          await waitForForm(page);
          await page.locator(".attending-option").nth(0).click();
          for (let i = 0; i < 4; i++) await page.locator(".stepper-btn").nth(1).click({ force: true }).catch(() => {});
          check("stepper capped at authorized_guests (2)", (await text(page, ".stepper-value")) === "2" && (await page.locator(".stepper-btn").nth(1).isDisabled()));
          check("seat limit shown", (await text(page, ".rsvp-guests-note"))?.includes("2"), await text(page, ".rsvp-guests-note"));
          await shot(page, out, `rsvp-form-${lang}`);
          await page.fill("#rsvp-message", "See you there");
          await page.locator(".rsvp-submit-btn").click();
          await page.waitForTimeout(300);
          const btn = page.locator(".rsvp-submit-btn");
          check("sending: button disabled + loading state", (await btn.isDisabled()) && (await btn.getAttribute("class")).includes("is-loading"));
          check("sending: fields locked", await page.locator("#rsvp-message").isDisabled());
          for (let i = 0; i < 3; i++) await page.locator("#rsvp-message").evaluate((n) => n.form.requestSubmit());
          await btn.click({ force: true, timeout: 2000 }).catch(() => {});
          await btn.dispatchEvent("click").catch(() => {});
          check("hammering during flight: still exactly one request", calls.submit.length === 1, `requests=${calls.submit.length}`);
          await page.waitForSelector(".rsvp-success:not([hidden]) .rsvp-change-btn", { timeout: 12000 });
          check("payload: code, attending, count, message — nothing else",
            JSON.stringify(calls.submit[0]) === JSON.stringify({ p_code: "TEST2345", p_attending: true, p_guest_count: 2, p_message: "See you there" }), JSON.stringify(calls.submit[0]));
          check("success state shown", (await text(page, ".rsvp-success:not([hidden]) .rsvp-success-title")) === r.successTitle);
          await page.waitForTimeout(900);
          await shot(page, out, `rsvp-success-${lang}`);
          await page.locator(".rsvp-change-btn").click();
          await waitForForm(page);
          check("change my reply: form comes back with the saved answer",
            (await page.locator(".attending-option").nth(0).getAttribute("aria-checked")) === "true" && (await text(page, ".stepper-value")) === "2" && (await text(page, ".rsvp-submit-btn")) === r.submitUpdate);
          check("no page errors", errors.length === 0, errors.join(" | "));
          await context.close();
        }
        {
          const { page, context, calls } = await openPage({
            lang,
            query: "?i=TEST2345",
            supabase: {
              lookup: (route) => json(route, 200, [row({ authorized_guests: 4, rsvp_status: "accepted", confirmed_guests: 3 })]),
              submit: (route) => json(route, 200, [{ rsvp_status: "declined", confirmed_guests: 0 }]),
            },
          });
          await waitForForm(page);
          check("already replied: previous answer shown", (await text(page, ".rsvp-form .rsvp-previous")) === r.previousAccepted.replace("{guests}", `3 ${i18n[lang].rsvp.guestUnit[1]}`), await text(page, ".rsvp-form .rsvp-previous"));
          check("already replied: form pre-filled (yes, 3) with an update button",
            (await page.locator(".attending-option").nth(0).getAttribute("aria-checked")) === "true" && (await text(page, ".stepper-value")) === "3" && (await text(page, ".rsvp-submit-btn")) === r.submitUpdate);
          await shot(page, out, `rsvp-already-replied-${lang}`);
          await page.locator(".attending-option").nth(1).click();
          await page.locator(".rsvp-submit-btn").click();
          await page.waitForSelector(".rsvp-success:not([hidden])");
          check("change to decline: sends attending=false, no count", calls.submit[0]?.p_attending === false && calls.submit[0]?.p_guest_count === null, JSON.stringify(calls.submit[0]));
          check("change: 'updated' confirmation", (await text(page, ".rsvp-success:not([hidden]) p:not(.rsvp-success-title)")) === r.successUpdated);
          await context.close();
        }
        {
          const { page, context, calls } = await openPage({ lang, query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row({ authorized_guests: null })]) } });
          await waitForForm(page);
          await page.locator(".attending-option").nth(0).click();
          check("null authorized_guests: no stepper, note shown", !(await visible(page, ".guest-stepper")) && (await text(page, ".rsvp-guests-note")) === r.guestsUnconfirmed);
          await shot(page, out, `rsvp-null-seats-${lang}`);
          await page.locator(".rsvp-submit-btn").click();
          await page.waitForSelector(".rsvp-success:not([hidden])");
          check("null authorized_guests: replies for 1", calls.submit[0]?.p_guest_count === 1);
          await context.close();
        }
        {
          const { page, context } = await openPage({ lang, query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row({ authorized_guests: 1 })]) } });
          await waitForForm(page);
          await page.locator(".attending-option").nth(0).click();
          check("authorized 1: no stepper, 'for 1 guest' note", !(await visible(page, ".guest-stepper")) && (await text(page, ".rsvp-guests-note")) === r.guestsSingle);
          await context.close();
        }
        {
          const { page, context, calls } = await openPage({ lang, query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row()]) } });
          await waitForForm(page);
          await page.locator(".rsvp-submit-btn").click();
          check("no answer chosen: field error, nothing sent", (await text(page, ".field-error")) === r.errorAttending && calls.submit.length === 0);
          await context.close();
        }
      }

      // --------------------------------------------------------------- failures
      if (want("failures")) {
        const cases = [
          ["network error", (route) => route.abort("failed"), "errorNetwork"],
          ["HTTP 500", (route) => route.fulfill({ status: 500, headers: CORS, body: "boom" }), "errorServer"],
          ["HTTP 200 non-JSON body", (route) => route.fulfill({ status: 200, headers: { ...CORS, "content-type": "text/html" }, body: "<html>x</html>" }), "errorServer"],
          ["rate limited", (route) => raise(route, "rate_limited"), "errorRateLimited"],
          ["invalid_code (deleted meanwhile)", (route) => raise(route, "invalid_code"), "errorInvalidCode"],
          ["tampered guest count rejected", (route) => raise(route, "invalid_guest_count"), "errorGuestCount"],
        ];
        for (const [label, handler, key] of cases) {
          const { page, context, consoleLines } = await openPage({ lang, query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row()]), submit: handler } });
          await waitForForm(page);
          await submit(page);
          await page.waitForSelector(".rsvp-status:not([hidden])", { timeout: 8000 });
          const txt = await statusText(page);
          check(`${label}: styled error, correct ${lang} message`, txt?.includes(r[key]), txt);
          check(`${label}: no fake success, form usable again`, (await page.locator(".rsvp-success").first().isHidden()) && (await page.locator(".rsvp-submit-btn").isEnabled()));
          check(`${label}: code not in the console`, !consoleLines.some((l) => /TEST2345/i.test(l)));
          if (label === "network error") await shot(page, out, `rsvp-error-${lang}`);
          await context.close();
        }
        {
          const { page, context } = await openPage({ lang, query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row()]), submit: (route) => raise(route, "rsvp_closed") } });
          await waitForForm(page);
          await submit(page);
          await page.waitForSelector(".rsvp-success:not([hidden]) .rsvp-success-title");
          check("server says rsvp_closed: closed message replaces the form", (await text(page, ".rsvp-success:not([hidden]) .rsvp-success-title")) === r.closedTitle && !(await visible(page, "form.rsvp-form")));
          await context.close();
        }
      }

      // ------------------------------------------------------------------- slow
      if (want("slow")) {
        const { page, context } = await openPage({
          lang,
          query: "?i=TEST2345",
          supabase: {
            lookup: (route) => json(route, 200, [row()]),
            submit: async (route) => {
              await new Promise((res) => setTimeout(res, 9500));
              return json(route, 200, [{ rsvp_status: "accepted", confirmed_guests: 1 }]);
            },
          },
        });
        await waitForForm(page);
        await submit(page);
        await page.waitForTimeout(8600);
        check("slow: 'still sending' notice after ~8s, button still locked", (await statusText(page))?.includes(r.slowNotice) && (await page.locator(".rsvp-submit-btn").isDisabled()), await statusText(page));
        await shot(page, out, `rsvp-slow-${lang}`);
        await page.waitForSelector(".rsvp-success:not([hidden])", { timeout: 6000 });
        check("slow: eventually succeeds and the notice is cleared", await page.locator(".rsvp-status").isHidden());
        await context.close();
      }

      // --------------------------------------------------------------- deadline
      for (const [label, now, expectForm] of !want("deadline") ? [] : [
        ["Oct 15 2026 23:30 (last hours)", "2026-10-15T23:30:00", true],
        ["Oct 16 2026 00:30 (just after)", "2026-10-16T00:30:00", false],
      ]) {
        const { page, context } = await openPage({ lang, now, query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row({ rsvp_status: "accepted", confirmed_guests: 2 })]) } });
        await page.waitForTimeout(600);
        const formShown = await visible(page, "form.rsvp-form");
        const closedShown = (await text(page, ".rsvp-success:not([hidden]) .rsvp-success-title")) === r.closedTitle;
        check(`deadline from settings @ ${label}: ${expectForm ? "form" : "closed"}`, formShown === expectForm && closedShown === !expectForm, `form=${formShown} closed=${closedShown}`);
        if (expectForm) check("deadline line uses the settings date", (await text(page, ".rsvp-deadline"))?.includes(lang === "fr" ? "15 octobre 2026" : "October 15, 2026"), await text(page, ".rsvp-deadline"));
        else {
          check("closed: shows their recorded reply", (await text(page, ".rsvp-success:not([hidden]) .rsvp-previous")) === r.closedAccepted.replace("{guests}", `2 ${r.guestUnit[1]}`));
          await shot(page, out, `rsvp-closed-${lang}`);
        }
        await context.close();
      }
      if (want("deadline") && lang === "en") {
        const { page, context } = await openPage({ lang, now: "2026-10-01T12:00:00", query: "?i=TEST2345", supabase: { settings: (route) => json(route, 200, "2026-09-30"), lookup: (route) => json(route, 200, [row()]) } });
        await page.waitForTimeout(600);
        check("deadline changed in settings (no redeploy): closes on the new date", (await text(page, ".rsvp-success:not([hidden]) .rsvp-success-title")) === r.closedTitle);
        await context.close();
      }
    }

    // --------------------------------------------------------------------- hang
    if (want("hang")) {
      const { page, context } = await openPage({ query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row()]), submit: () => {} } });
      await waitForForm(page);
      await submit(page);
      await page.waitForSelector(".rsvp-status[data-kind='error']", { timeout: 40000 });
      check("hang: gives up at 30s with a retryable error", (await statusText(page))?.includes(i18n.en.rsvp.errorTimeout) && (await page.locator(".rsvp-submit-btn").isEnabled()));
      await context.close();
    }

    // ----------------------------------------------------------------- language
    if (want("lang")) {
      console.log("\n=== language ===");
      {
        const { page, context } = await openPage({ lang: null, locale: "en-US", query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row({ preferred_language: "fr" })]) }, openEnvelope: false });
        await page.waitForFunction(() => document.documentElement.lang === "fr", null, { timeout: 8000 }).catch(() => {});
        check("preferred_language fr overrides an English browser", (await page.evaluate(() => document.documentElement.lang)) === "fr");
        check("…and the envelope hint follows it", (await text(page, ".envelope-hint")) === i18n.fr.envelope.hint);
        check("…without being remembered as a manual choice", (await page.evaluate(() => localStorage.getItem("wedding-lang"))) === null);
        await context.close();
      }
      {
        const { page, context } = await openPage({ lang: "en", locale: "fr-FR", query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row({ preferred_language: "fr" })]) } });
        await waitForForm(page);
        check("manual toggle (remembered EN) wins over preferred_language fr", (await page.evaluate(() => document.documentElement.lang)) === "en");
        await context.close();
      }
      {
        const { page, context } = await openPage({ lang: null, locale: "fr-FR", query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row({ preferred_language: null })]) } });
        await waitForForm(page);
        check("no preferred_language: browser guess (fr) kept", (await page.evaluate(() => document.documentElement.lang)) === "fr");
        await context.close();
      }
      {
        const { page, context } = await openPage({ lang: null, query: "?i=TEST2345", supabase: { lookup: (route) => json(route, 200, [row()]) } });
        await waitForForm(page);
        const tr = await page.evaluate(() => ({
          html: document.documentElement.getAttribute("translate"),
          meta: document.querySelector('meta[name="google"]')?.content,
          referrer: document.querySelector('meta[name="referrer"]')?.content,
        }));
        check("auto-translation still blocked (html translate=no + google notranslate)", tr.html === "no" && tr.meta === "notranslate", JSON.stringify(tr));
        check("referrer policy same-origin", tr.referrer === "same-origin");
        await context.close();
      }
    }

    console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
    process.exitCode = failures ? 1 : 0;
  } else if (mode === "live") {
    const code = args[1];
    if (!code || code.startsWith("--")) throw new Error("usage: rsvp-check.mjs live <code> [--lang=en|fr] [--submit=yes:<n>|no] [--out=<dir>]");
    const lang = flag("lang", "en");
    const submitArg = flag("submit", "");
    const out = flag("out", ".");
    const { page, context, errors, consoleLines } = await openPage({ lang, query: `?i=${encodeURIComponent(code)}` });
    await page.waitForSelector("#rsvp form.rsvp-form:not([hidden]), #rsvp .rsvp-notice:not([hidden]) .rsvp-notice-text, #rsvp .rsvp-success:not([hidden])", { timeout: 20000 });
    await page.waitForTimeout(1500);
    const before = {
      greeting: await greeting(page),
      form: await visible(page, "form.rsvp-form"),
      name: await text(page, ".rsvp-guest-name"),
      previous: await text(page, ".rsvp-form .rsvp-previous"),
      notice: await text(page, ".rsvp-notice:not([hidden]) .rsvp-notice-text"),
      note: await text(page, ".rsvp-notice-note:not([hidden])"),
      deadline: await text(page, ".rsvp-deadline"),
      maxNote: await text(page, ".rsvp-guests-note"),
    };
    let outcome = null;
    if (submitArg && before.form) {
      const [answer, n] = submitArg.split(":");
      await page.locator("#rsvp").scrollIntoViewIfNeeded();
      await page.locator(".attending-option").nth(answer === "no" ? 1 : 0).click();
      if (answer !== "no" && n) {
        await page.evaluate(() => { for (let i = 0; i < 10; i++) document.querySelectorAll(".stepper-btn")[0].click(); });
        for (let i = 1; i < Number(n); i++) await page.locator(".stepper-btn").nth(1).click().catch(() => {});
      }
      await page.fill("#rsvp-message", `Automated end-to-end test (${lang}) — safe to delete`);
      await page.locator(".rsvp-submit-btn").click();
      outcome = await Promise.race([
        page.waitForSelector(".rsvp-success:not([hidden]) .rsvp-change-btn", { timeout: 45000 }).then(async () => `success: ${await text(page, ".rsvp-success:not([hidden]) p:not(.rsvp-success-title)")}`),
        page.waitForSelector(".rsvp-status[data-kind='error']:not([hidden])", { timeout: 45000 }).then(async () => `error: ${await statusText(page)}`),
      ]);
    }
    console.log(JSON.stringify({ lang, ...before, submitted: submitArg || null, outcome, pageErrors: errors, codeInConsole: consoleLines.some((l) => l.toUpperCase().includes(code.trim().toUpperCase())) }, null, 2));
    await shot(page, out, `rsvp-live-${lang}`);
    await context.close();
  } else {
    console.error("usage: rsvp-check.mjs mock <out-dir> [--only=...] | live <code> [--lang=en|fr] [--submit=yes:<n>|no]");
    process.exitCode = 1;
  }
} finally {
  if (browser) await browser.close();
  killServerTree(server.pid);
}
