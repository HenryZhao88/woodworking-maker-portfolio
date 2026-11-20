import { describe, it, expect } from "vitest";
import { detectQuality, tierSettings } from "@/lib/quality";

const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CROS = "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

describe("detectQuality", () => {
  it("full on macOS Chrome with WebGL", () => expect(detectQuality({ userAgent: MAC, webgl: true })).toBe("full"));
  it("full on Windows (weak hardware still gets full)", () => expect(detectQuality({ userAgent: WIN, webgl: true })).toBe("full"));
  it("lite on ChromeOS", () => expect(detectQuality({ userAgent: CROS, webgl: true })).toBe("lite"));
  it("fallback whenever WebGL is unavailable", () => {
    expect(detectQuality({ userAgent: MAC, webgl: false })).toBe("fallback");
    expect(detectQuality({ userAgent: CROS, webgl: false })).toBe("fallback");
  });
});

describe("tierSettings", () => {
  it("full caps DPR at 2", () => expect(tierSettings("full").dprMax).toBe(2));
  it("lite caps DPR at 1.25", () => expect(tierSettings("lite").dprMax).toBe(1.25));
  it("lite has fewer particles than full", () => expect(tierSettings("lite").particles).toBeLessThan(tierSettings("full").particles));
  it("fallback renders no particles", () => expect(tierSettings("fallback").particles).toBe(0));
});
