import type { QualityTier } from "./quality";

/** GPU texture size for a photo: long edge capped per tier (real 12MP phone photos would otherwise eat ~49MB each). */
export function textureSize(w: number, h: number, tier: QualityTier): [number, number] {
  const cap = tier === "lite" ? 1280 : 2048;
  const s = Math.min(1, cap / Math.max(w, h));
  return [Math.round(w * s), Math.round(h * s)];
}
