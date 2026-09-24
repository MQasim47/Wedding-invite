> **SUPERSEDED — kept for reference only.** The site now sends RSVPs to the guest-system Supabase database, not this Google Sheet. See [README.md](./README.md).

# RSVP Backend Setup (Google Sheets + Apps Script)

This connects the RSVP form to a Google Sheet, with no server to host or pay for.

## 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like "Wedding RSVPs".
3. Leave it empty — the script creates the `RSVPs` tab and header row automatically on the first submission.

## 2. Add the script

1. In the spreadsheet, go to **Extensions → Apps Script**.
2. Delete any starter code in `Code.gs`.
3. Copy the entire contents of [`Code.gs`](./Code.gs) from this folder and paste it in.
4. Click the disk icon (or Ctrl/Cmd+S) to save the project. Give it a name like "RSVP Backend".

## 3. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Google will ask you to authorize the script — approve it (it only needs access to this spreadsheet).
6. Copy the **Web app URL** shown after deployment (it looks like `https://script.google.com/macros/s/XXXXXXXX/exec`).

## 4. Connect it to the site

Open `src/config.js` and paste the URL into:

```js
rsvp: {
  enabled: true,
  deadline: "2026-11-20",
  endpoint: "https://script.google.com/macros/s/XXXXXXXX/exec", // <- paste here
  maxGuests: 6,
},
```

That's it — the RSVP form will now write a new row to the `RSVPs` sheet on every submission: timestamp, name, attending, guest count, message, language (`en`/`fr`), the `?guest=` URL param if present, the time the guest pressed submit, and a submission id.

Opening the web app URL in a browser should show `{"ok":true,"service":"rsvp"}` — a quick way to confirm the deployment is live.

## Notes

- There is no demo mode. If `endpoint` is empty the form shows an error on submit; it never pretends to have saved anything. Every failure (no connection, HTTP error, a response that isn't `{"ok":true}`, or no answer within 30 seconds) shows an error and the guest can retry.
- If you ever change the script's code, you must create a **new deployment** (or use "Manage deployments → Edit → New version") for the changes to take effect at the same URL. **The current `Code.gs` adds the Language and Submission ID columns and duplicate protection — if you deployed an earlier version, redeploy as a new version.** It writes cells by header name, so an existing `RSVPs` sheet keeps its rows and simply gains the two new columns on the right.
- Retrying is safe: each attempt carries a `submissionId`, and if the backend has already stored that id it answers `{"ok":true,"duplicate":true}` instead of adding a second row.
- Guest text that starts with `=`, `+`, `-` or `@` is stored as literal text (with a hidden leading apostrophe) so it can't run as a spreadsheet formula.
- The request is sent with `Content-Type: text/plain` on purpose — Apps Script web apps can't respond to a CORS preflight request, so this avoids the browser sending one. The script parses the body as JSON regardless.
