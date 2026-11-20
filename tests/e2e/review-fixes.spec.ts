import { test, expect } from "./fixtures";
import { scrollPin } from "./helpers";

const opacityOf = () => (s: string) => Number(getComputedStyle(document.querySelector(s)!).opacity);

test("C1: home title is fully opaque after Home → Spoon → Back", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  await expect(page.locator("[data-morph-ghost]")).toHaveCount(0, { timeout: 5000 });
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForTimeout(1500);
  const h1 = await page.evaluate(opacityOf(), 'main h1[data-flip-id="site-title-hero"]');
  expect(h1).toBe(1);
  const mains = await page.locator("main").evaluateAll((els) => els.filter((m) => m.checkVisibility()).map((m) => Number(getComputedStyle(m).opacity)));
  expect(mains).toEqual([1]);
});

test("C2: without WebGL2 (WebGL1 only) the site falls back instead of crashing", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error test override
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      if (type === "webgl2") return null;
      return orig.call(this, type, ...rest);
    };
  });
  const page = await ctx.newPage();
  await page.goto(`${baseURL}/wooden-spoon`);
  await page.waitForSelector("html[data-loader-done]", { state: "attached", timeout: 20000 });
  await expect(page.locator("html")).toHaveAttribute("data-quality", "fallback");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await ctx.close();
});

test("C3: pins stay in page order after crossing the 768px breakpoint and back", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await page.setViewportSize({ width: 700, height: 900 });
  await page.waitForTimeout(800);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1200);
  const [stripEnd, overallStart] = await page.evaluate(() => [
    Number(document.querySelector("[data-process]")!.getAttribute("data-pin-end")),
    Number(document.querySelector("[data-overall]")!.getAttribute("data-pin-start")),
  ]);
  expect(overallStart).toBeGreaterThan(stripEnd);
});

test("I4: lightbox closes and scroll unlocks when the route changes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  await expect(page.locator("[data-morph-ghost]")).toHaveCount(0, { timeout: 5000 });
  await scrollPin(page, "[data-process]", 0.02);
  await page.locator("[data-process] [data-photo]").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe("hidden");
});

test("I5: keyboard focus stays inside the open lightbox", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await page.locator("[data-photo]").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
  }
});

test("I6: a missing photo does not force the 15s loader cap", async ({ page }) => {
  await page.route(/process-05/, (r) => r.fulfill({ status: 404, body: "" }));
  const t0 = Date.now();
  await page.goto("/wooden-spoon");
  expect(Date.now() - t0).toBeLessThan(8000);
});
