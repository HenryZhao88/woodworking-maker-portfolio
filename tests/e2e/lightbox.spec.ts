import { test, expect } from "./fixtures";
import { scrollPin } from "./helpers";

test("clicking a photo opens it full size; Escape closes and restores focus", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await scrollPin(page, "[data-process]", 0.02);
  const photo = page.locator('[data-process] [data-photo]').first();
  await photo.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("img")).toHaveAttribute("src", /process-01\.jpg$/);
  const box = await dialog.locator("img").boundingBox();
  expect(box!.height).toBeGreaterThan(900 * 0.7);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(photo).toBeFocused();
});

test("arrow keys move between photos", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await scrollPin(page, "[data-process]", 0.02);
  await page.locator('[data-process] [data-photo]').first().click();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog").locator("img")).toHaveAttribute("src", /process-02\.jpg$/);
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("dialog").locator("img")).toHaveAttribute("src", /process-01\.jpg$/);
});

test("photos are keyboard reachable and open with Enter", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const about = page.locator("[data-photo]").first();
  await about.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("page scroll is locked while open", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await scrollPin(page, "[data-process]", 0.02);
  await page.locator('[data-process] [data-photo]').first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => scrollY)).toBe(y0);
});

test("clicking the visible overall view opens that view", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await scrollPin(page, "[data-overall]", 0.5);
  await page.mouse.click(720, 450);
  await expect(page.getByRole("dialog").locator("img")).toHaveAttribute("src", /overall-2\.jpg$/);
});
