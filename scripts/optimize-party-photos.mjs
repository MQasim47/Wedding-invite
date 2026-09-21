// Prep script — NOT run during `npm run build` (the raw photos are gitignored).
// Turns the photos in assets-source/wedding-party/ into the square, face-centred
// headshots the Wedding Party section shows in its gold ring:
//
//   npm run optimize:party
//
// Each photo is cropped around the face box recorded in
// scripts/wedding-party-faces.json ({ cx, cy, face } in source pixels, produced
// by scripts/detect-faces.py, an OpenCV YuNet face detector) — not the middle of the frame, because many of
// these are tall portraits or cut-outs with the subject off-centre. Only the
// photos listed there are processed, so headshots cropped by hand earlier
// (franck, rodrigue, irene, lovelyn) are never overwritten.
//
// Output: public/images/wedding-party/<name>.webp, 480x480, quality 82, EXIF/ICC
// stripped (sharp drops metadata unless .withMetadata() is called). Transparent
// PNG cut-outs keep their alpha, so they sit on the page like the existing ones.
import { readFile, readdir, mkdir } from "node:fs/promises";
import { extname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SRC_DIR = fileURLToPath(new URL("../assets-source/wedding-party/", import.meta.url));
const OUT_DIR = fileURLToPath(new URL("../public/images/wedding-party/", import.meta.url));
const FACES = JSON.parse(await readFile(new URL("./wedding-party-faces.json", import.meta.url), "utf8"));

const SIZE = 480;
const QUALITY = 82;
// Crop side as a multiple of the detected face width: enough hair and
// shoulders to read as a portrait inside a circle, without shrinking the face.
const CROP_PER_FACE = 2.7;
// The detector box runs brow-to-chin, so lift the window to keep the crown of
// the head in frame. A photo can override it with its own "lift" in the JSON
// (big hair, or a tight source where the default clips the crown).
const LIFT = 0.16;

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(SRC_DIR)).filter((f) => [".jpg", ".jpeg", ".png"].includes(extname(f).toLowerCase()));

for (const file of files) {
  const name = basename(file, extname(file));
  const box = FACES[name];
  if (!box) continue;

  const { width, height } = await sharp(join(SRC_DIR, file)).rotate().metadata();
  const side = Math.round(Math.min(box.face * CROP_PER_FACE, width, height));
  const clamp = (v, max) => Math.max(0, Math.min(v, max - side));
  const left = clamp(Math.round(box.cx - side / 2), width);
  const top = clamp(Math.round(box.cy - box.face * (box.lift ?? LIFT) - side / 2), height);

  await sharp(join(SRC_DIR, file))
    .rotate() // bake in EXIF orientation before metadata is dropped
    .extract({ left, top, width: side, height: side })
    .resize(SIZE, SIZE)
    .webp({ quality: QUALITY, alphaQuality: 90 })
    .toFile(join(OUT_DIR, `${name}.webp`));

  console.log(`✓ ${file} → ${name}.webp  (crop ${side}px at ${left},${top})`);
}
