# Wedding party photos

Square, face-centred, 480px WebP headshots, one per person, referenced from
`weddingParty` in `src/config.js`. Leave a member's `photo` empty to get a drawn
silhouette placeholder instead (`silhouetteAvatarSVG` in `src/utils/icons.js`).

## Adding a person

1. Drop the raw photo (JPG/PNG, any shape — portraits and cut-outs are fine) in
   `assets-source/wedding-party/`. That folder is gitignored on purpose: raw
   phone photos can carry GPS EXIF.
2. Find the face: `python scripts/detect-faces.py <name>` prints
   `{ cx, cy, face }` (OpenCV YuNet; setup is in the script's header). Add that
   line to `scripts/wedding-party-faces.json`. If the crop clips the crown of the
   head or the hair, add `"lift": 0.3` (higher = more headroom).
3. `npm run optimize:party` crops a square around the face, resizes to 480px,
   writes `<name>.webp` here (metadata stripped, transparency kept for cut-outs).
4. Add the person to `config.js` with `photo: "/images/wedding-party/<name>.webp"`.

Only the people listed in `wedding-party-faces.json` are processed. Franck,
Rodrigue, Irene and Lovelyn were cropped by hand earlier and are not overwritten.
