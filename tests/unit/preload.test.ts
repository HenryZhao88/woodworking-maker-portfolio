import { describe, it, expect } from "vitest";
import { projects, getProject } from "@/content/projects";
import { pagePhotos, sitePreloads, otherRoutes, mosaicImages } from "@/lib/preload";
import { PHOTO_SIZES } from "@/lib/photoSizes";

const spoon = getProject("wooden-spoon")!;

describe("site preloading", () => {
  it("lists every photo the spoon page renders, with the sizes its section uses", () => {
    const list = pagePhotos(spoon);
    const has = (src: string, sizes: string) => list.some((p) => p.src === src && p.sizes === sizes);
    expect(has(spoon.about!.image.src, PHOTO_SIZES.about)).toBe(true);
    for (const st of spoon.process!.stages) for (const img of st.images) expect(has(img.src, PHOTO_SIZES.process)).toBe(true);
    expect(has(spoon.favorite!.image.src, PHOTO_SIZES.feature)).toBe(true);
    for (const v of spoon.finished!.overall) expect(has(v.src, PHOTO_SIZES.overall)).toBe(true);
    for (const d of spoon.finished!.details) expect(has(d.src, PHOTO_SIZES.detail)).toBe(true);
    for (const m of mosaicImages(spoon)) expect(has(m.src, PHOTO_SIZES.mosaic)).toBe(true);
    expect(new Set(list.map((p) => p.src + "|" + p.sizes)).size).toBe(list.length); // no duplicates
  });

  it("from Home, preloads the spoon page's photos and prefetches the other routes", () => {
    expect(sitePreloads(projects, "/").length).toBe(pagePhotos(spoon).length);
    expect(otherRoutes(projects, "/").sort()).toEqual(["/cutting-board", "/wooden-spoon"]);
  });

  it("on the spoon page itself, its photos are not preloaded twice", () => {
    expect(sitePreloads(projects, "/wooden-spoon")).toEqual([]);
    expect(otherRoutes(projects, "/wooden-spoon").sort()).toEqual(["/", "/cutting-board"]);
  });

  it("the mosaic shows each photo once even if two sections share it", () => {
    const srcs = mosaicImages(spoon).map((i) => i.src);
    expect(new Set(srcs).size).toBe(srcs.length);
  });
});
