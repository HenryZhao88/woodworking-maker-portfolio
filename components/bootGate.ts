"use client";
import { createReadinessGate } from "@/lib/loader";

/** What "fully loaded" means for the first visit. */
export const BOOT_KEYS = ["fonts", "images", "gl", "warmup"] as const;
export type BootKey = (typeof BOOT_KEYS)[number];

let gate: ReturnType<typeof createReadinessGate> | null = null;
export function bootGate() {
  if (!gate) gate = createReadinessGate([...BOOT_KEYS]);
  return gate;
}
export const markBoot = (key: BootKey) => bootGate().mark(key);

export const bootStats: { warmupFrameMs?: number } = {};
if (typeof window !== "undefined") (window as unknown as { __bootStats: typeof bootStats }).__bootStats = bootStats;

let done = false;
const listeners = new Set<() => void>();
export const isBootDone = () => done;
export function onBootDone(cb: () => void): () => void {
  if (done) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function finishBoot() {
  if (done) return;
  done = true;
  document.documentElement.setAttribute("data-loader-done", "");
  listeners.forEach((f) => f());
  listeners.clear();
}
