# Wedding Invitation — Alex & Sarah (placeholder)

A premium, mobile-first animated wedding invitation. Built with Vite + vanilla
JavaScript, GSAP (ScrollTrigger), and Lenis for smooth scrolling. All content
is placeholder data — see [Personalizing this site](#personalizing-this-site)
below for exactly what to change when real details arrive.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). Open it on your
phone too — this is a mobile-first design, and desktop just centers the same
phone-width column with a themed blurred background around it.

Build for production:

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Personalizing this site

**Everything content-related lives in two files.** You should never need to
touch component or animation code to update real details.

### `src/config.js` — all content

| Field | What to change |
|---|---|
| `language` | `"en"`, `"fr"`, or `"bilingual"` (adds an EN/FR toggle button) |
| `couple.partner1` / `partner2` / `initials` | Names and the initials shown on the wax seal |
| `weddingDate` | ISO date **with timezone offset**, e.g. `"2026-12-12T16:00:00+05:00"` — drives the countdown, calendar, and the downloadable `.ics` file |
| `timezoneLabel` | Just a label shown near the date (e.g. `"PKT"`) |
| `welcomeMessage` | The English/French welcome paragraph |
| `schedule` | Array of `{ time, title: { en, fr }, icon }` — `icon` must be one of the keys in `src/utils/icons.js` (`rings`, `glasses`, `dinner`, `heart`) |
| `venues` | Array of `{ name, address, mapsUrl }` — add a second object for a second venue, it renders automatically |
| `closingMessage` | Final sign-off message |
| `theme` | Hex colors — the entire site's palette flows from here |
| `music.enabled` / `music.src` | Toggle background music and its file path (see [Music](#music)) |
| `rsvp.enabled` | Set `false` to hide the RSVP section entirely |
| `rsvp.deadline` | `YYYY-MM-DD`, shown above the form |
| `rsvp.endpoint` | Your deployed Google Apps Script URL (see [RSVP setup](#rsvp-setup)) — leave empty for demo mode |
| `rsvp.maxGuests` | Upper bound on the guest-count stepper |
| `extras.gallery` / `dressCode` / `gifts` | Each has an `enabled` flag — set `true` and fill in the fields to show that section |
| `meta` | Page `<title>`, description, `ogImage` path, and `siteUrl` — these drive the SEO/Open Graph tags injected into `index.html` at build time |

### `src/i18n.js` — all UI strings

Button labels, form labels/errors, weekday/month names, etc. — anything that
isn't guest-specific content. Edit the `en` and `fr` objects; add a new
top-level language key (matching the same shape) to support a third language.

## Assets

Replace these placeholder files in `public/` — filenames must stay the same
unless you also update the matching path in `config.js`:

- `public/images/og-image.svg` — the link-preview image (WhatsApp, iMessage,
  Twitter/X, etc). **This is an SVG placeholder.** Most social platforms
  require a raster JPG/PNG for `og:image`, so before launch: open this file
  in a browser (or any SVG tool), export it as a **1200×630 JPG**, save it as
  `public/images/og-image.jpg`, and update `config.meta.ogImage` in
  `config.js` to `"/images/og-image.jpg"`.
- `public/favicon.svg` — the browser tab icon.
- The couple photo on the Hero section is currently a themed gradient
  placeholder (no file needed) — to add a real photo, add an `<img>` inside
  `.hero-photo-frame` in `src/sections/hero.js` pointing at a file you add
  under `public/images/`.
- `public/audio/` — see below.

### Music

No audio file ships with this project (to avoid any copyright issues). Add a
licensed/royalty-free track as `public/audio/placeholder.mp3` (or change
`config.music.src` to match your filename). Until a real file is added, the
envelope tap will silently fail to start music — the mute/unmute button still
works correctly once a real file is in place. Set `config.music.enabled =
false` to remove the button entirely.

## RSVP setup

The RSVP form posts to a free Google Apps Script + Google Sheets backend.
Full step-by-step instructions are in
[`rsvp-backend/SETUP.md`](./rsvp-backend/SETUP.md). Short version:

1. Create a Google Sheet.
2. Paste [`rsvp-backend/Code.gs`](./rsvp-backend/Code.gs) into its Apps Script editor.
3. Deploy it as a Web App ("Execute as: Me", "Who has access: Anyone").
4. Paste the resulting URL into `config.rsvp.endpoint`.

Until you do this, `rsvp.endpoint` is an empty string and the form runs in
**demo mode**: submissions show a success state but aren't actually sent, and
a warning is logged to the browser console.

## Personalized greeting (`?guest=`)

Append `?guest=Jane%20Doe` to the site URL to show "Dear Jane Doe," above the
welcome message — useful for per-guest invite links. The value is sanitized
and inserted as plain text (never HTML), so it's safe to generate these links
per guest.

## Testing checklist

Things worth manually re-checking after any content change:

- `?guest=Test` shows the personalized greeting.
- Language switching (`language: "en"`, `"fr"`, and `"bilingual"` with the
  toggle button) translates every section, including form labels and errors.
- RSVP demo mode: submit the form with `rsvp.endpoint` empty and confirm the
  success state and console warning appear.
- Countdown-after-date: temporarily set `weddingDate` to a past date and
  confirm the countdown circles are replaced by the "Just Married" message.
- `prefers-reduced-motion`: enable it in your OS/browser settings and confirm
  the site is still fully usable with animations minimized.

## Deploying to Vercel

This is a static Vite build — zero configuration needed.

1. Push this repo to GitHub (or any git provider).
2. In Vercel, "Add New Project" → import the repo. Framework preset "Vite" is
   auto-detected (build command `npm run build`, output directory `dist`).
3. Deploy. Update `config.meta.siteUrl` to the assigned (or custom) domain so
   Open Graph tags point at the right URL, then redeploy.

## Project structure

```
src/
  config.js        # all content — the single source of truth
  i18n.js           # all UI strings, per language
  main.js           # boots the app, assembles sections in order
  sections/         # one module per section — builds DOM only
  animations/       # GSAP timelines + ScrollTrigger, theme + smooth scroll setup
  utils/            # countdown, .ics generator, guest param, sanitize, icons, DOM helpers
  styles/           # theme.css (CSS variables) + main.css
public/
  images/, audio/   # replace placeholders here
rsvp-backend/
  Code.gs           # Google Apps Script — RSVP -> Google Sheet
  SETUP.md          # step-by-step deployment guide
```
