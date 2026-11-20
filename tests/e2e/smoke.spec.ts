import { test, expect } from "./fixtures";

test("home has Maker Portfolio title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Maker Portfolio/);
});
