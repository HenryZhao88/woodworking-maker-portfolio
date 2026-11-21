// Makes the pre-sized WebP copies of every photo in public/projects that lib/imageLoader.ts points to.
// Runs before `dev` and `build`; skips copies that are already newer than their source photo.
import { readFileSync, readdirSync, statSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { deviceSizes, imageSizes, quality } = JSON.parse(readFileSync(join(root, "lib/imageWidths.json"), "utf8"));
const widths = [...imageSizes, ...deviceSizes];
const srcDir = join(root, "public/projects");
const outDir = join(root, "public/img/projects");

// Settings changed since the last run? Then every copy is remade.
const stampFile = join(outDir, ".settings.json");
const stamp = JSON.stringify({ widths, quality });
const fresh = existsSync(stampFile) && readFileSync(stampFile, "utf8") === stamp;

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const photos = walk(srcDir).filter((f) => /\.(jpe?g|png)$/i.test(f));

let made = 0;
const t0 = Date.now();
await Promise.all(
  photos.map(async (src) => {
    const rel = relative(srcDir, src).slice(0, -extname(src).length);
    const srcTime = statSync(src).mtimeMs;
    for (const w of widths) {
      const out = join(outDir, `${rel}-${w}.webp`);
      if (fresh && existsSync(out) && statSync(out).mtimeMs >= srcTime) continue;
      mkdirSync(dirname(out), { recursive: true });
      // rotate(): bake in EXIF orientation; never enlarge past the original.
      await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality }).toFile(out);
      made++;
    }
  })
);
mkdirSync(outDir, { recursive: true });
writeFileSync(stampFile, stamp);
console.log(`image variants: ${photos.length} photos x ${widths.length} widths, ${made} made (${Date.now() - t0}ms)`);
