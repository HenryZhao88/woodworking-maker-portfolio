import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import { projects } from "@/content/projects";
import { textureSize } from "@/lib/textureSize";

const PUBLIC = path.resolve(__dirname, "../../public");
const allImages = projects.flatMap((p) => [
  ...(p.about ? [p.about.image] : []),
  ...(p.process?.stages.flatMap((s) => s.images) ?? []),
  ...(p.favorite ? [p.favorite.image] : []),
  ...(p.challenging ? [p.challenging.image] : []),
  ...(p.finished ? [...p.finished.overall, ...p.finished.details] : []),
]);

describe("photo files match content/projects.ts", () => {
  for (const img of allImages) {
    it(`${img.src} exists with exact filename case and matching width/height`, () => {
      const file = path.join(PUBLIC, img.src);
      const dir = path.dirname(file);
      expect(fs.readdirSync(dir), "exact-case filename (Vercel is case-sensitive)").toContain(path.basename(file));
      expect(/\.(jpe?g|png|webp|avif)$/i.test(file), "browser-displayable format (not HEIC)").toBe(true);
      const dim = imageSize(fs.readFileSync(file));
      const rotated = (dim.orientation ?? 1) >= 5; // EXIF 5–8 = phone photo stored sideways
      const [w, h] = rotated ? [dim.height, dim.width] : [dim.width, dim.height];
      expect({ width: img.width, height: img.height }).toEqual({ width: w, height: h });
    });
  }
});

describe("textureSize", () => {
  it("caps the long edge at 2048 on full tier, keeping aspect", () => expect(textureSize(4032, 3024, "full")).toEqual([2048, 1536]));
  it("caps at 1280 on lite tier", () => expect(textureSize(3024, 4032, "lite")).toEqual([960, 1280]));
  it("never upscales", () => expect(textureSize(800, 600, "full")).toEqual([800, 600]));
});
