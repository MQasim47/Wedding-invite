// Prep script — rasterizes public/images/og-image.svg to the 1200×630 JPG
// that social platforms (WhatsApp, iMessage, Twitter/X...) actually read for
// og:image (most don't render SVG). Run again any time the SVG text changes:
//
//   npm run generate:og
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SVG_PATH = fileURLToPath(new URL("../public/images/og-image.svg", import.meta.url));
const OUT_PATH = fileURLToPath(new URL("../public/images/og-image.jpg", import.meta.url));

async function main() {
  const svg = await readFile(SVG_PATH);
  await sharp(svg).resize(1200, 630).jpeg({ quality: 90 }).toFile(OUT_PATH);
  console.log(`✓ Rendered ${SVG_PATH} → ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
