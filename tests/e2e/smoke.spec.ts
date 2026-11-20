import { test, expect } from "@playwright/test";

test("home has Maker Portfolio title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Maker Portfolio/);
});
