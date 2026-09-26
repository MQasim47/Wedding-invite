# Background music

Playlist tracks live here and are listed in order in `config.music.tracks`
(`src/config.js`). Currently:

- `perfect.mp3` — "Perfect" (the only track; loops)

Music starts on the envelope tap (a real user gesture, so autoplay is never
blocked) with a 2-second fade-in. If any listed track is missing on disk,
`vite.config.js` hides the music button entirely at build time — no runtime
console error, no dead button.

To swap tracks, add the files here and update `config.music.tracks`. Nothing
else needs to change.
