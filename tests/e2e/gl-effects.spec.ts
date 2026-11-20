import { test, expect } from "@playwright/test";
import { scrollToY } from "./helpers";

test("favorite photo dissolves in via wood-grain shader progress (--p 0 → 1)", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const media = page.locator('[data-gl-effect="grainMask"]');
  const top = await media.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await scrollToY(page, top - 900); // just entering
  const early = Number(await media.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--p") || "0"));
  await scrollToY(page, top + 200);
  await page.waitForTimeout(1200);
  const late = Number(await media.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--p")));
  expect(early).toBeLessThan(0.1);
  expect(late).toBeGreaterThan(0.9);
});

test("DOM slats are hidden when the WebGL layer handles the grain reveal", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.locator('[data-gl-effect="grainMask"] [data-photo]')).toHaveAttribute("data-gl-ready", "", { timeout: 15000 });
  await expect(page.locator("[data-slat]").first()).toBeHidden();
});

test("challenging photo stays a DOM wipe (not mirrored in WebGL)", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.locator('section[aria-labelledby="challenging-h"] [data-photo]')).not.toHaveAttribute("data-gl", "");
});

test("overall views and mosaic tiles expose fade sources for the planes", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.locator("[data-view][data-gl-fade]")).toHaveCount(3);
  expect(await page.locator("[data-tile][data-gl-fade]").count()).toBeGreaterThanOrEqual(19);
});
