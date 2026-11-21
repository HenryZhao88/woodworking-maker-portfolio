import type { Project, ProjectImage } from "@/content/types";
import { PHOTO_SIZES } from "./photoSizes";

export type PreloadImage = { src: string; width: number; height: number; sizes: string };

/** Every photo once, in page order: what the closing mosaic shows. */
export function mosaicImages(p: Project): ProjectImage[] {
  const all = [
    ...(p.about ? [p.about.image] : []),
    ...(p.process?.stages.flatMap((s) => s.images) ?? []),
    ...(p.favorite ? [p.favorite.image] : []),
    ...(p.challenging ? [p.challenging.image] : []),
    ...(p.finished ? [...p.finished.overall, ...p.finished.details] : []),
  ];
  return all.filter((img, i) => all.findIndex((o) => o.src === img.src) === i);
}

/** Each (photo, sizes) pair a project page renders, so preloading requests exactly what the page will. */
export function pagePhotos(p: Project): PreloadImage[] {
  const pairs: [ProjectImage, string][] = [
    ...(p.about ? [[p.about.image, PHOTO_SIZES.about] as [ProjectImage, string]] : []),
    ...(p.process?.stages.flatMap((s) => s.images.map((i) => [i, PHOTO_SIZES.process] as [ProjectImage, string])) ?? []),
    ...(p.favorite ? [[p.favorite.image, PHOTO_SIZES.feature] as [ProjectImage, string]] : []),
    ...(p.challenging ? [[p.challenging.image, PHOTO_SIZES.feature] as [ProjectImage, string]] : []),
    ...(p.finished?.overall.map((i) => [i, PHOTO_SIZES.overall] as [ProjectImage, string]) ?? []),
    ...(p.finished?.details.map((i) => [i, PHOTO_SIZES.detail] as [ProjectImage, string]) ?? []),
    ...mosaicImages(p).map((i) => [i, PHOTO_SIZES.mosaic] as [ProjectImage, string]),
  ];
  const seen = new Set<string>();
  return pairs
    .filter(([i, sizes]) => !seen.has(i.src + "|" + sizes) && !!seen.add(i.src + "|" + sizes))
    .map(([i, sizes]) => ({ src: i.src, width: i.width, height: i.height, sizes }));
}

const pathOf = (p: Project) => `/${p.slug}`;

/** Photos of every other published page, fetched behind the first-visit loader. */
export function sitePreloads(projects: Project[], currentPath: string): PreloadImage[] {
  return projects.filter((p) => p.status === "published" && pathOf(p) !== currentPath).flatMap(pagePhotos);
}

/** Routes to prefetch (their code and data) so navigating there is instant. */
export function otherRoutes(projects: Project[], currentPath: string): string[] {
  return ["/", ...projects.map(pathOf)].filter((r) => r !== currentPath);
}
