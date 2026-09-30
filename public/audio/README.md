# Background music

Playlist tracks live here and are listed in order in `config.music.tracks`
(`src/config.js`). Currently:

- `perfect.mp3` — "Perfect" (the only track; loops)

**`perfect.mp3` is trimmed — don't replace it with the full song.** The client
didn't want the instrumental opening, so the committed file starts at 0:20 of
the original (1.2 s before the vocal comes in) with a 0.5 s fade-in. It also
ends at 4:38 of the original, dropping the ~4 s of decay and silence at the end,
with a 1 s fade-out, so the loop repeats tightly. Encoded at 128 kbps to keep it
light on mobile data (~4.1 MB, 4:18). Because the cuts are in the file itself,
the loop restarts from the trimmed start. The untrimmed original is kept outside
the repo at `../audio-originals/perfect-original-untrimmed.mp3`. To regenerate:

```sh
ffmpeg -i perfect-original-untrimmed.mp3 -map 0:a \
  -af "atrim=start=20:end=278,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.5,afade=t=out:st=257:d=1" \
  -c:a libmp3lame -b:a 128k -ar 44100 -ac 2 perfect.mp3
```

(Keep the trim inside `-af` — with `-ss` as an output option the fade is applied
before the cut and gets thrown away.)

Music starts on the envelope tap (a real user gesture, so autoplay is never
blocked) with a 2-second fade-in. If any listed track is missing on disk,
`vite.config.js` hides the music button entirely at build time — no runtime
console error, no dead button.

To swap tracks, add the files here and update `config.music.tracks`. Nothing
else needs to change.
