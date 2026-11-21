"use client";
import widths from "./imageWidths.json";

const ALL = [...widths.imageSizes, ...widths.deviceSizes];

/**
 * Photos are served as pre-sized static WebP files (made by scripts/image-variants.mjs) instead of
 * through the on-demand optimizer. A static file has no `Vary: Accept`, so the WebGL layer can re-read the
 * exact bytes an <img> already loaded straight from the browser cache and decode them off the main thread.
 */
export default function imageLoader({ src, width }: { src: string; width: number }): string {
  if (!/^\/projects\/.+\.(jpe?g|png)$/i.test(src)) return src;
  const w = ALL.includes(width) ? width : ALL.find((x) => x >= width) ?? Math.max(...ALL);
  return `/img${src.replace(/\.(jpe?g|png)$/i, "")}-${w}.webp`;
}
