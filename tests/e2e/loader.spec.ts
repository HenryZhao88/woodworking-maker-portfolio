import { test, expect } from "@playwright/test";

test("loader shows on first load, then hands off once everything is ready", async ({ page }) => {
  const t0 = Date.now();
  await page.goto("/");
  await expect(page.locator("[data-loader]")).toBeVisible();
  await page.waitForSelector("html[data-loader-done]", { state: "attached", timeout: 16000 });
  const elapsed = Date.now() - t0;
  expect(elapsed).toBeGreaterThanOrEqual(2000); // minimum duration
  expect(elapsed).toBeLessThan(16000); // hard cap
  await expect(page.locator("[data-loader]")).toHaveCount(0, { timeout: 3000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("loader does not reappear on client-side navigation", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("html[data-loader-done]", { state: "attached", timeout: 16000 });
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  await expect(page).toHaveURL(/wooden-spoon/);
  await expect(page.locator("[data-loader]")).toHaveCount(0);
});

test("loader waits for spoon photos to be decoded before finishing", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await page.waitForSelector("html[data-loader-done]", { state: "attached", timeout: 16000 });
  const undecoded = await page.locator("main img").evaluateAll((els) => els.filter((e) => !(e as HTMLImageElement).complete || (e as HTMLImageElement).naturalWidth === 0).length);
  expect(undecoded).toBe(0);
});

test("a never-loading image cannot hang the loader past the hard cap", async ({ page }) => {
  await page.route("**/process-07*", () => {}); // never respond
  await page.goto("/wooden-spoon");
  await page.waitForSelector("html[data-loader-done]", { state: "attached", timeout: 17000 });
});

test("warm-up frame time is measured in sane units (ms per frame)", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("html[data-loader-done]", { state: "attached", timeout: 16000 });
  const ms = await page.evaluate(() => (window as unknown as { __bootStats: { warmupFrameMs?: number } }).__bootStats.warmupFrameMs);
  expect(ms).toBeGreaterThan(1);
  expect(ms).toBeLessThan(200);
});
