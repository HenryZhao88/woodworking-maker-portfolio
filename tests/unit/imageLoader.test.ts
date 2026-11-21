import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import imageLoader from "../../lib/imageLoader";
import widths from "../../lib/imageWidths.json";
import { projects } from "../../content/projects";

const ALL = [...widths.imageSizes, ...widths.deviceSizes];

describe("imageLoader", () => {
  it("maps a project photo and a configured width to its pre-sized static WebP", () => {
    expect(imageLoader({ src: "/projects/wooden-spoon/process-01.jpg", width: 640 })).toBe("/img/projects/wooden-spoon/process-01-640.webp");
  });

  it("rounds an unlisted width up to the next generated size, and caps at the largest", () => {
    expect(imageLoader({ src: "/projects/a/b.jpg", width: 700 })).toBe("/img/projects/a/b-828.webp");
    expect(imageLoader({ src: "/projects/a/b.jpg", width: 9999 })).toBe(`/img/projects/a/b-${Math.max(...ALL)}.webp`);
  });

  it("leaves anything that is not a project photo alone", () => {
    expect(imageLoader({ src: "/og.png", width: 640 })).toBe("/og.png");
  });

  it("every photo used on the site has every generated size on disk", () => {
    const srcs = new Set<string>();
    JSON.stringify(projects, (_k, v) => {
      if (v && typeof v === "object" && typeof v.src === "string") srcs.add(v.src);
      return v;
    });
    expect(srcs.size).toBeGreaterThan(15);
    const missing = [...srcs].flatMap((src) =>
      ALL.map((w) => imageLoader({ src, width: w })).filter((url) => !existsSync(join(process.cwd(), "public", url)))
    );
    expect(missing).toEqual([]);
  });
});
