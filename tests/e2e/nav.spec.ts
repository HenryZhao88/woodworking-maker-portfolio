import { test, expect } from "@playwright/test";

test("nav shows pages in order", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation");
  const xs: number[] = [];
  for (const name of ["Home", "Wooden Spoon", "Cutting Board"]) {
    const box = await nav.getByRole("link", { name, exact: true }).boundingBox();
    expect(box, `${name} link visible`).not.toBeNull();
    xs.push(box!.x);
  }
  expect([...xs].sort((a, b) => a - b)).toEqual(xs);
});

test("cutting board link navigates", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("link", { name: "Cutting Board" }).click();
  await expect(page).toHaveURL(/\/cutting-board$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cutting Board");
});

test("home shows title and name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Maker Portfolio");
  await expect(page.getByText("Henry Zhao").first()).toBeVisible();
});
