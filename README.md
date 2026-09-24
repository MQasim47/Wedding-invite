# Wedding Invitation — Dalida & Aimé

A premium, mobile-first animated wedding invitation. Built with Vite + vanilla
JavaScript, GSAP (ScrollTrigger), and Lenis for smooth scrolling. See
[Personalizing this site](#personalizing-this-site) below for exactly what to
change to update content.

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
| `language` | `"en"`, `"fr"`, or `"bilingual"` (adds an EN/FR toggle button). In `"bilingual"` mode the starting language is whatever the guest last picked with the toggle (remembered in `localStorage`), else their invitation's `preferred_language` from the guest system (personal links only), else detected from their browser (`navigator.language` starting with `"fr"` → French, otherwise English) |
| `couple.partner1` / `partner2` / `initials` | Names and the initials shown on the wax seal |
| `couple.tagline` | Bilingual `{ en, fr }` line under the names on the Hero (e.g. "are getting married") |
| `couple.photo` | `{ src, alt: { en, fr }, position }` — the photo shown in the "Our Story" section. `src` must point at an **optimized** file under `public/images/couple/optimized/` (see [Couple photos](#couple-photos)); `position` is a CSS `object-position` value, tune it if the crop cuts off a face |
| `weddingDate` | ISO date **with timezone offset**, e.g. `"2026-12-05T15:00:00-05:00"` — this is the ceremony start. Drives the countdown and the `.ics` file (both timezone-correct for a guest in any timezone) and the calendar's highlighted day (read directly from this string's own date digits, not the browser's local time, so it can't roll over to the wrong day for a guest on the other side of the world) |
| `timezoneLabel` | Just a label (e.g. `"EST"`) — currently unused in the UI, kept for reference |
| `weddingDateDisplay` | Bilingual `{ en, fr }` literal string shown under the names on the Hero, e.g. `"Saturday · December 5, 2026"` / `"Samedi · 5 décembre 2026"` — update this alongside `weddingDate` if the date changes, it is not auto-derived |
| `welcomeMessage` | `{ en: string[], fr: string[] }` — one array entry per paragraph |
| `schedule` | Array of `{ time: { en, fr }, title: { en, fr }, icon, venueIndex, dressCode?, note? }`. `icon` must be one of the keys in `src/utils/icons.js` (`rings`, `glasses`, `dinner`, `heart`). `venueIndex` is the index into `venues` below — used to roll dress codes up onto the matching venue card. `time` should already be formatted per-language (12-hour "3:00 PM" for `en`, 24-hour "15h00" for `fr`) since it's shown as-is, not computed |
| `venues` | Array of `{ heading: { en, fr } \| string, label: { en, fr } \| null, address, mapsUrl }` — add a third object for a third venue, it renders automatically. `label` is an optional small caps kicker above the heading (e.g. "Reception") |
| `closingMessage` | Final sign-off message |
| `theme` | Hex colors — the entire site's palette flows from here |
| `music.enabled` / `music.tracks` | Toggle background music and its playlist (see [Music](#music)) |
| `rsvp.enabled` | Set `false` to hide the RSVP section entirely. The deadline and each guest's seat limit are **not** here — they live in the guest-system database (see [Personal invitation links](#personal-invitation-links-i)) |
| `extras.gallery` | `{ enabled, images: [{ src, alt: { en, fr }, position }] }` — `src` must point at an optimized file (see [Couple photos](#couple-photos)) |
| `extras.dressCode` / `extras.gifts` | Each has an `enabled` flag — set `true` and fill in the fields to show that section |
| `companion` | The floating couple illustration that follows scroll — see [Companion illustration](#companion-illustration) |
| `weddingParty` | `{ enabled, bridesmaids: [{ name, role: { en, fr }, photo, lead? }], groomsmen: [...] }` — an entry with `lead: true` (the Maid of Honor / Best Man) is shown larger with a double gold ring; the rest fill a 3-across grid (2-across if that avoids a lone member in the last row). Leave `photo` empty for a drawn silhouette placeholder; point it at an optimized file (see [Couple photos](#couple-photos)) to use a real photo |
| `meta` | Page `<title>`, description, `ogImage` path, and `siteUrl` — these drive the SEO/Open Graph tags injected into `index.html` at build time |

### `src/i18n.js` — all UI strings

Button labels, form labels/errors, weekday/month names, etc. — anything that
isn't guest-specific content. Edit the `en` and `fr` objects; add a new
top-level language key (matching the same shape) to support a third language.

## Assets

Replace these placeholder files in `public/` — filenames must stay the same
unless you also update the matching path in `config.js`:

- `public/images/og-image.jpg` — the link-preview image (WhatsApp, iMessage,
  Twitter/X, etc), 1200×630. Most social platforms don't render SVG for
  `og:image`, so this is a rasterized JPG (`config.meta.ogImage` already
  points at it). Its source design is `public/images/og-image.svg` — if the
  names/date change, edit the text in that SVG to match, then run
  `npm run generate:og` to re-rasterize it (uses `sharp`, already a
  devDependency — no screenshotting needed).
- `public/favicon.svg` — the browser tab icon.
- Couple photos — see [Couple photos](#couple-photos) below.
- `public/audio/` — see below.

### Music

`config.music.tracks` is a playlist — track 1 plays first, then track 2,
then it loops back to track 1. Files live in `public/audio/` (see the
README there). Playback starts on the envelope tap (a real user gesture, so
autoplay is never blocked) with a 2-second fade-in to ~70% volume, pauses
automatically when the tab is hidden and resumes if it was playing, and the
floating mute/unmute button lets guests pause manually at any time.

Every track listed is checked on disk at dev-server-start/build time: if any
is missing, the mute/unmute button doesn't render at all (no broken button,
no failed network request, no console error). Set `config.music.enabled =
false` to remove the button regardless of whether the files are present.

### Envelope artwork

The envelope gate is drawn entirely in code, from the theme colours — there
is no image asset to replace:

- `src/utils/damask.js` generates the baroque damask (serrated acanthus
  leaves, scroll stems ending in curls, a fleur-de-lis crest) as one SVG
  `<pattern>` tile on a half-drop repeat, so it stays sharp at any size.
- `src/utils/envelopeArt.js` builds the fold-seam shading, the flap edges and
  the wax seal (gradients for the bevel and gloss, an emblem, `D&A` on top).
- Colours come from `config.theme` (`accent`, `accentSoft`, `primary`,
  `primaryDeep`, `envelope` for the pink lining) via CSS custom properties on
  `.envelope-box` in `src/styles/main.css` — change the theme, not the art.

`node scripts/envelope-check.mjs shots <dir>` screenshots the envelope
(closed / mid-open / flash / reveal, add `--fr` for French) and
`node scripts/envelope-check.mjs perf --throttle=4` profiles the open
animation's frame times under CPU throttling.

## Couple photos

Raw JPG/PNG originals live in `assets-source/couple-photos/` — deliberately
**outside** `public/`, and gitignored (`.gitignore`). Vite copies everything
under `public/` verbatim into the production build, so raw phone photos
(which can carry GPS EXIF metadata) must never sit there, even if nothing on
the page links to them — anyone could still guess/crawl the URL. The site
only ever references the optimized copies.

To use new or replacement photos:

1. Drop the raw files into `assets-source/couple-photos/` (any filename,
   `.jpg`/`.jpeg`/`.png`).
2. Run `npm run optimize:photos`. This uses `sharp` (a devDependency) to
   write a WebP copy of each one into `public/images/couple/optimized/`
   (which **is** committed) — resized to a 1200px long edge, quality ~80,
   and with all metadata (EXIF/GPS/ICC) stripped. Re-run it any time you add
   or change a photo; it overwrites existing output files by name.
3. Point `config.couple.photo.src` (the "Our Story" section) and/or entries
   in `config.extras.gallery.images` at the new file(s) under
   `public/images/couple/optimized/`.
4. Write real `alt: { en, fr }` text for each — screen readers and SEO both
   depend on it.
5. Check the crop at 390px width. Both the "Our Story" frame and gallery
   items are `object-fit: cover` at a 4:5 aspect ratio; if a face gets cut
   off, set that image's `position` field (a CSS `object-position` value,
   e.g. `"center 15%"` to keep the top of the frame in view) rather than
   re-cropping the source file.

The gallery (`config.extras.gallery.enabled`) is swipeable (horizontal
scroll-snap) and every image lazy-loads (`loading="lazy"`).

## Companion illustration

A small couple illustration floats in the corner (`config.companion.position`,
default `"bottom-left"`), bobs gently, occasionally sends up a few heart
particles, tucks itself away while the RSVP section is in view so it never
covers the form or the keyboard, and flies into a larger centered spot
beside the closing message. Tapping it scrolls smoothly to RSVP.

```js
companion: {
  enabled: true,
  type: "svg",   // "svg" | "lottie" | "image"
  src: "",       // path to a .json/.lottie or .png/.webp file in public/images/
  position: "bottom-left",
},
```

- **`"svg"`** (default) — the built-in hand-drawn couple illustration
  (`companionCoupleSVG` in `src/utils/icons.js`), themed from `config.theme`.
  `src` is ignored for this type.
- **`"image"`** — set `src` to a PNG/WebP under `public/images/` (e.g.
  `"/images/couple.webp"`); it's rendered as a plain `<img>`.
- **`"lottie"`** — set `src` to a `.json`/`.lottie` file under `public/`.
  `lottie-web`'s light player is only ever imported when `type` is
  `"lottie"` (a lazy `import()`, code-split by Vite), so it adds zero weight
  to the bundle for the default `"svg"`/`"image"` types. If the file fails
  to load, it falls back to the default SVG illustration and logs a console
  warning.

Set `companion.enabled = false` to remove it entirely.

## Personal invitation links (`?i=`)

Every guest gets a personal link, `https://www.dalidaetaime.com/?i=<code>`,
generated by the guest-system dashboard (a separate repo and Supabase
project). The code is 8 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`;
input is case-insensitive and stray whitespace is ignored.

On load the site looks the code up through the
`get_invitation_by_public_code` database function, using the Supabase
**anon key only** (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, see
`.env.example`; on Vercel set both under Project Settings → Environment
Variables). That function returns only what a guest may see — display name,
authorized guest count, RSVP status and confirmed count, preferred language —
and is rate-limited per IP. The anon key cannot read the `invitations` table
directly. `vite.config.js` refuses to build with a key that isn't an anon key,
or (for `npm run build`) with the variables missing.

What the guest sees:

| Link | Greeting | RSVP |
|---|---|---|
| valid `?i=` | "Dear {display name}," / "Bonjour {display name}," | Form for that invitation: name from the database (not typed), guest count capped at `authorized_guests` (1 if it's still null, with a note), their current answer pre-filled if they already replied; submitting updates the same invitation |
| no `?i=` | none (or the legacy `?guest=` name) | The full invitation as before; the form is replaced by a line asking them to use their personal link |
| `?i=` not found / malformed | same as no code | Same, plus a quiet note that the link may be incomplete — never an error page, never a hint about which codes exist |

The French greeting is "Bonjour {name}," rather than "Cher/Chère": the names
are often partial or descriptive ("Voisin blanc", "fille Nadège", "Chorale 4")
and can't be gender-agreed.

The code is kept in `sessionStorage` for the tab, but the URL wins whenever it
has an `?i=`. It is only ever sent in the POST body of the two database
functions — never in a URL, log line, error message or Referer (`<meta
name="referrer" content="same-origin">`). There is no analytics on the site.

**RSVP.** Submissions go to the `submit_rsvp` database function, which
rejects a missing/unknown code, a guest count outside 1…`authorized_guests`
(whatever the request says), and anything after the deadline. It always
updates the invitation's own row, so a retry or a changed answer never
creates a second record. The deadline is `settings.rsvp_deadline`
(`YYYY-MM-DD`, read through the `get_public_setting` function), editable
from the dashboard: the form closes when the guest's
local clock passes 23:59 that day (the server closes at the end of that day
anywhere on earth, so it never refuses what the page still allows). There is
no demo mode — every failure (no connection, rate limit, server error, no
answer in 30 s) shows a styled, retryable error; the button locks while a
request is in flight, and a "still sending" notice appears after 8 s.

The old Google Sheet backend (`rsvp-backend/`) is retired and kept only for
its historical responses — see its README.

`node scripts/rsvp-check.mjs mock <dir>` exercises every state against a
mocked Supabase (EN and FR); `node scripts/rsvp-check.mjs live <code>` drives
the real form against the real database for one invitation code.

## Legacy greeting (`?guest=`)

Links sent before invitation codes existed used `?guest=Jane%20Doe`. They
still show "Dear Jane Doe," (sanitized, inserted as plain text), but can't
RSVP. When a link has both, the invitation code wins.

## Testing checklist

Things worth manually re-checking after any content change:

- `?i=<real code>` shows the guest's name and their RSVP form; `?i=` absent,
  malformed, or unknown shows the full invitation with the "use your personal
  link" line instead of the form (plus the incomplete-link note if present).
- `?guest=Test` (no code) still shows the legacy greeting.
- Language switching (`language: "en"`, `"fr"`, and `"bilingual"` with the
  toggle button) translates every section, including form labels, errors,
  event times (12h EN / 24h FR), dress codes, and venue cards.
- RSVP end to end: `node scripts/rsvp-check.mjs live <code>` against a test
  invitation, then confirm the row in the dashboard.
- RSVP-after-deadline: `node scripts/rsvp-check.mjs mock <dir> --only=deadline`
  (fakes the clock) — the form is replaced by the closed message in both
  languages.
- Countdown-after-date: temporarily set `weddingDate` to a past date and
  confirm the countdown circles are replaced by the "Just Married" message.
- Download the `.ics` file (Countdown section) and open it — confirm the
  event spans ceremony start → 11:59 PM, and both venue addresses appear in
  the description.
- `prefers-reduced-motion`: enable it in your OS/browser settings and confirm
  the site is still fully usable with animations minimized.
- At 390px width, check the "Our Story" photo and every gallery photo for
  cropped-off faces (see [Couple photos](#couple-photos)).

## Deploying to Vercel

This is a static Vite build — zero configuration needed.

1. Push this repo to GitHub (or any git provider).
2. In Vercel, "Add New Project" → import the repo. Framework preset "Vite" is
   auto-detected (build command `npm run build`, output directory `dist`).
   Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project
   Settings → Environment Variables — the build fails without them.
3. Deploy. Update `config.meta.siteUrl` to the assigned (or custom) domain so
   Open Graph tags point at the right URL, then redeploy.

## Project structure

```
src/
  config.js        # all content — the single source of truth
  i18n.js           # all UI strings, per language + language detection/persistence
  main.js           # boots the app, assembles sections in order
  sections/         # one module per section — builds DOM only
  animations/       # GSAP timelines + ScrollTrigger, theme + smooth scroll setup
  utils/            # invitation code + Supabase client, countdown, .ics, guest param, sanitize, icons, DOM helpers
  styles/           # theme.css (CSS variables) + main.css
scripts/
  optimize-photos.mjs     # public/images/couple/*.{jpg,png} -> couple/optimized/*.webp
  generate-og-image.mjs   # public/images/og-image.svg -> og-image.jpg
public/
  images/, audio/   # replace placeholders here
rsvp-backend/       # RETIRED Google Sheet backend, kept for its old responses
```
