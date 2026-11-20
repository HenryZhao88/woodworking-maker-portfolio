import { test, expect } from "./fixtures";
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

test("WebGL photos stay clipped to their section (the zoomed detail never bleeds into the next section)", async ({ page }) => {
  const sharp = (await import("sharp")).default;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/wooden-spoon");
  const bottom = await page.locator('[data-gl-effect="dive"]').evaluate((el) => el.getBoundingClientRect().bottom + scrollY);
  await scrollToY(page, Math.round(bottom - 900 * 0.45)); // section ends 45% down the screen
  await page.waitForTimeout(1500);
  // A strip in the next section, away from its centered text.
  const png = await page.screenshot({ clip: { x: 1200, y: 650, width: 200, height: 200 } });
  const { channels } = await sharp(png).stats();
  const mean = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
  expect(mean, "next section background should stay dark walnut").toBeLessThan(60);
});

test("detail captions sit on a dark backdrop even when the photo behind them is light", async ({ page }) => {
  const sharp = (await import("sharp")).default;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/wooden-spoon");
  const block = page.locator("[data-dive]").first();
  const top = await block.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const h = await block.evaluate((el) => (el as HTMLElement).offsetHeight);
  await scrollToY(page, Math.round(top + h - 900 * 1.15)); // fully zoomed, caption showing
  await page.waitForTimeout(1500);
  const cap = block.locator("[data-dive-cap]");
  await cap.evaluate((el) => ((el as HTMLElement).style.color = "transparent"));
  await cap.evaluate((el) => ((el as HTMLElement).style.textShadow = "none"));
  const box = (await cap.boundingBox())!;
  const png = await page.screenshot({ clip: box });
  const { channels } = await sharp(png).stats();
  const mean = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
  expect(mean, "backdrop behind the caption").toBeLessThan(75);
});
