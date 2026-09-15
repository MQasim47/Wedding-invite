// Prep script — NOT run automatically during `npm run build`, since the raw
// source photos are gitignored and won't exist in a fresh checkout/CI.
// Run manually whenever new/changed photos land in assets-source/couple-photos/:
//
//   npm run optimize:photos
//
// Converts every JPG/PNG in assets-source/couple-photos/ (kept OUTSIDE
// public/ deliberately — anything under public/ is copied verbatim into the
// production build by Vite, so raw phone photos with un-stripped GPS EXIF
// must never live there, even unlinked) to a WebP copy in
// public/images/couple/optimized/ — resized to a 1200px long edge, quality
// ~80, and with all metadata stripped. The site only ever references files
// under optimized/.
import { readdir, mkdir } from "node:fs/promises";
import { extname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SRC_DIR = fileURLToPath(new URL("../assets-source/couple-photos/", import.meta.url));
const OUT_DIR = fileURLToPath(new URL("../public/images/couple/optimized/", import.meta.url));
const MAX_DIMENSION = 1200;
const QUALITY = 80;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let entries;
  try {
    entries = await readdir(SRC_DIR, { withFileTypes: true });
  } catch {
    console.log(`No ${SRC_DIR} directory found — nothing to do.`);
    return;
  }
  const sources = entries.filter(
    (e) => e.isFile() && [".jpg", ".jpeg", ".png"].includes(extname(e.name).toLowerCase())
  );

  if (sources.length === 0) {
    console.log("No source photos found in assets-source/couple-photos/ — nothing to do.");
    return;
  }

  for (const entry of sources) {
    const srcPath = join(SRC_DIR, entry.name);
    const outName = `${basename(entry.name, extname(entry.name))}.webp`;
    const outPath = join(OUT_DIR, outName);

    await sharp(srcPath)
      .rotate() // bake in EXIF orientation before it gets stripped below
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY })
      // .withMetadata() is deliberately never called — sharp omits EXIF/ICC/
      // GPS metadata from the output by default.
      .toFile(outPath);

    console.log(`✓ ${entry.name} → optimized/${outName}`);
  }

  console.log(`\nDone. ${sources.length} photo(s) optimized.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
