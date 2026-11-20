export type QualityTier = "full" | "lite" | "fallback";

/**
 * Henry's rule: full quality everywhere. Only ChromeOS (school Chromebooks) gets the lighter tier,
 * and only a missing WebGL drops to the DOM fallback. No runtime auto-downgrade.
 */
export function detectQuality(env: { userAgent: string; webgl: boolean }): QualityTier {
  if (!env.webgl) return "fallback";
  if (/\bCrOS\b/.test(env.userAgent)) return "lite";
  return "full";
}

export function tierSettings(t: QualityTier): { dprMax: number; particles: number; postFx: boolean } {
  switch (t) {
    case "full":
      return { dprMax: 2, particles: 2600, postFx: true };
    case "lite":
      return { dprMax: 1.25, particles: 900, postFx: false };
    case "fallback":
      return { dprMax: 1, particles: 0, postFx: false };
  }
}

export function hasWebGL(): boolean {
  try {
    // three.js r163+ requires WebGL2; WebGL1-only devices take the DOM fallback.
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext(); // release the probe context
    return !!gl;
  } catch {
    return false;
  }
}
