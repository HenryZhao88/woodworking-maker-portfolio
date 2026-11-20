import { describe, it, expect } from "vitest";
import { minLoaderDuration, createReadinessGate, LOADER_HARD_CAP_MS } from "@/lib/loader";

describe("minLoaderDuration", () => {
  it("strong machine → 2000ms", () => expect(minLoaderDuration({ cores: 8, memoryGB: 8, warmupFrameMs: 10 })).toBe(2000));
  it("one mid signal (4 cores) → 3000ms", () => expect(minLoaderDuration({ cores: 4, memoryGB: 8, warmupFrameMs: 10 })).toBe(3000));
  it("one mid signal (4GB) → 3000ms", () => expect(minLoaderDuration({ cores: 8, memoryGB: 4, warmupFrameMs: 10 })).toBe(3000));
  it("a smooth 60Hz display (16.7ms frames) counts as strong", () => expect(minLoaderDuration({ cores: 8, memoryGB: 8, warmupFrameMs: 16.7 })).toBe(2000));
  it("one mid signal (20ms frames, ~50fps) → 3000ms", () => expect(minLoaderDuration({ cores: 8, memoryGB: 8, warmupFrameMs: 20 })).toBe(3000));
  it("slow frames alone (>24ms) → 4000ms", () => expect(minLoaderDuration({ cores: 8, memoryGB: 8, warmupFrameMs: 25 })).toBe(4000));
  it("two weak signals → 4000ms", () => expect(minLoaderDuration({ cores: 2, memoryGB: 2, warmupFrameMs: 10 })).toBe(4000));
  it("all weak → 4000ms", () => expect(minLoaderDuration({ cores: 2, memoryGB: 2, warmupFrameMs: 30 })).toBe(4000));
  it("unknown signals (Safari has no deviceMemory) count as strong", () => expect(minLoaderDuration({})).toBe(2000));
  it("hard cap is 15s", () => expect(LOADER_HARD_CAP_MS).toBe(15000));
});

describe("createReadinessGate", () => {
  it("resolves only after every key is marked", async () => {
    const g = createReadinessGate(["fonts", "gl"]);
    let done = false;
    void g.ready.then(() => (done = true));
    g.mark("fonts");
    await Promise.resolve();
    expect(done).toBe(false);
    g.mark("gl");
    await g.ready;
    expect(done).toBe(true);
  });

  it("marking an unknown key throws", () => {
    const g = createReadinessGate(["fonts"]);
    expect(() => g.mark("nope")).toThrow(/unknown readiness key: nope/);
  });

  it("marking twice is harmless and progress reports fraction done", () => {
    const g = createReadinessGate(["a", "b", "c", "d"]);
    g.mark("a");
    g.mark("a");
    expect(g.progress()).toBe(0.25);
  });
});
