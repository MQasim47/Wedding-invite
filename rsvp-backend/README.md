# ⚠️ SUPERSEDED — Google Sheet RSVP backend (retired)

**The site no longer sends RSVPs here.** Since Phase 2 (September 2026),
replies go to the guest-system's Supabase database through the
`submit_rsvp` function, keyed by each guest's personal invitation code
(`?i=<code>`) — see "Personal invitation links" in the main
[README](../README.md).

This folder is kept only so the responses already collected in the Google
Sheet stay traceable to the code that wrote them. Don't delete it until
those responses have been reconciled with the guest-system dashboard.

- Don't redeploy `Code.gs` or point the site back at it.
- The Apps Script web app may still be live and would still accept a POST;
  once the old responses are exported, it can be disabled from
  Apps Script → Deploy → Manage deployments → Archive.
- [`SETUP.md`](./SETUP.md) describes how it was set up, for reference only.
