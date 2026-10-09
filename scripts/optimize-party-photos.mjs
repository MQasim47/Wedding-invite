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

// Cut-outs lifted from group shots can carry stray fragments of the people next
// to the subject (a sliver of shirt, a flower) floating in the transparent
// area. A photo can opt in with "despeckle": true in the JSON: every connected
// blob of opaque pixels except the main subject is made fully transparent, and
// "clearTop": N also wipes the first N rows.
async function despeckle(file, clearTop = 0) {
  const { data, info } = await sharp(file).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // A strip of the neighbouring photo along the top edge ("clearTop": rows to wipe)
  // is opaque and joined to the head, so blob filtering alone cannot remove it.
  for (let p = 0; p < w * clearTop; p++) data[p * 4 + 3] = 0;
  const label = new Int32Array(w * h);
  const areas = [0];
  const stack = [];
  for (let start = 0; start < w * h; start++) {
    if (label[start] || data[start * 4 + 3] < 128) continue;
    const id = areas.length;
    let area = 0;
    label[start] = id;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop();
      area++;
      const x = p % w;
      const y = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (!label[q] && data[q * 4 + 3] >= 128) {
            label[q] = id;
            stack.push(q);
          }
        }
      }
    }
    areas.push(area);
  }
  const main = areas.indexOf(Math.max(...areas.slice(1)));
  for (let p = 0; p < w * h; p++) if (label[p] !== main) data[p * 4 + 3] = 0;
  return sharp(data, { raw: info });
}

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

  const meta = await sharp(join(SRC_DIR, file)).rotate().metadata();
  // "padTop": transparent headroom added above a cut-out whose crown sits at the
  // very top edge, so the head does not touch the top of the circle.
  const padTop = box.padTop ?? 0;
  const { width } = meta;
  const height = meta.height + padTop;
  const side = Math.round(Math.min(box.face * CROP_PER_FACE, width, height));
  const clamp = (v, max) => Math.max(0, Math.min(v, max - side));
  const left = clamp(Math.round(box.cx - side / 2), width);
  const top = clamp(Math.round(box.cy + padTop - box.face * (box.lift ?? LIFT) - side / 2), height);

  let input = box.despeckle ? await despeckle(join(SRC_DIR, file), box.clearTop) : sharp(join(SRC_DIR, file)).rotate(); // bake in EXIF orientation before metadata is dropped
  if (padTop) {
    input = sharp(await input.extend({ top: padTop, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer());
  }
  await input
    .extract({ left, top, width: side, height: side })
    .resize(SIZE, SIZE)
    .webp({ quality: box.quality ?? QUALITY, alphaQuality: box.quality ? 80 : 90 })
    .toFile(join(OUT_DIR, `${name}.webp`));

  console.log(`✓ ${file} → ${name}.webp  (crop ${side}px at ${left},${top})`);
}
