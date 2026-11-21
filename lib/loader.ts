export const LOADER_HARD_CAP_MS = 15000;

/**
 * How long the loader stays up at minimum, scaled to the hardware so weaker machines get extra
 * buffer (Henry: "make the loading longer until you expect it will fully load"). Unknown signals
 * (e.g. Safari has no navigator.deviceMemory) count as strong.
 */
export function minLoaderDuration(hw: { cores?: number; memoryGB?: number; warmupFrameMs?: number }): number {
  const { cores, memoryGB, warmupFrameMs } = hw;
  // Frame-time bands sit above 16.7ms so an ordinary smooth 60Hz display is never penalised.
  if (warmupFrameMs !== undefined && warmupFrameMs > 24) return 4000;
  const mids = [cores !== undefined && cores <= 4, memoryGB !== undefined && memoryGB <= 4, warmupFrameMs !== undefined && warmupFrameMs > 18].filter(Boolean).length;
  if (mids >= 2) return 4000;
  if (mids === 1) return 3000;
  return 2000;
}

export function createReadinessGate(keys: string[]): { mark(key: string): void; ready: Promise<void>; progress(): number; isDone(key: string): boolean } {
  const pending = new Set(keys);
  let resolve!: () => void;
  const ready = new Promise<void>((r) => (resolve = r));
  if (pending.size === 0) resolve();
  return {
    mark(key: string) {
      if (!keys.includes(key)) throw new Error(`unknown readiness key: ${key}`);
      pending.delete(key);
      if (pending.size === 0) resolve();
    },
    ready,
    progress: () => (keys.length === 0 ? 1 : (keys.length - pending.size) / keys.length),
    isDone: (key: string) => !pending.has(key),
  };
}
