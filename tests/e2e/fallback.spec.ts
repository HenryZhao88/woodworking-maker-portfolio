import { chromium } from "@playwright/test";
import { test, expect } from "./fixtures";

test("without WebGL, photos stay visible DOM images and nothing errors", async ({ baseURL }) => {
  const browser = await chromium.launch({ args: ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${baseURL}/wooden-spoon`);
  await page.waitForSelector("html[data-loader-done]", { state: "attached", timeout: 20000 });
  await expect(page.locator("html")).toHaveAttribute("data-quality", "fallback");
  await expect(page.locator("canvas")).toHaveCount(0);
  const hidden = await page.locator("main [data-photo] img").evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity === "0").length);
  expect(hidden).toBe(0);
  expect(errors).toEqual([]);
  await browser.close();
});

test("with WebGL, photos are mirrored as GL planes", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.locator("html")).toHaveAttribute("data-quality", /full|lite/);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("[data-unfold] [data-photo]")).toHaveAttribute("data-gl-ready", "", { timeout: 15000 });
});

test("ChromeOS user agent gets the lite tier", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" });
  const page = await ctx.newPage();
  await page.goto(`${baseURL}/`);
  await expect(page.locator("html")).toHaveAttribute("data-quality", "lite");
  await ctx.close();
});

test("lost WebGL context falls back to DOM photos", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("[data-unfold] [data-photo]")).toHaveAttribute("data-gl-ready", "", { timeout: 15000 });
  await page.evaluate(() => {
    const gl = document.querySelector("canvas")!.getContext("webgl2") as WebGL2RenderingContext;
    gl.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await expect(page.locator("html")).toHaveAttribute("data-quality", "fallback");
  const hidden = await page.locator("main [data-photo] img").evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity === "0").length);
  expect(hidden).toBe(0);
});
