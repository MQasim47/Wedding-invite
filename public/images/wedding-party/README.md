# Wedding party photos

Empty for now — the Wedding Party section renders drawn silhouette
placeholders (see `silhouetteAvatarSVG` in `src/utils/icons.js`) whenever a
member's `photo` field in `config.js` (`weddingParty.bridesmaids` /
`weddingParty.groomsmen`) is empty.

To add a real photo: optimize it the same way as the couple photos (WebP,
max 1200px, EXIF stripped — see `assets-source/couple-photos/` and `npm run
optimize:photos`), drop the output here, and set that member's `photo` to
`/images/wedding-party/<file>.webp`.
