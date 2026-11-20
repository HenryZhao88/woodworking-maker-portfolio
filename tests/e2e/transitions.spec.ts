import { test, expect } from "./fixtures";

test("Home → Wooden Spoon morphs shared elements (no blank flash)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  // mid-flight: ghost elements carry the title/label across, and the screen is not blank-white
  await expect(page.locator("[data-morph-ghost]").first()).toBeAttached({ timeout: 2000 });
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 4, height: 4 } });
  expect(shot.length).toBeGreaterThan(0);
  const bright = await page.evaluate(() => {
    const c = getComputedStyle(document.body).backgroundColor;
    return c;
  });
  expect(bright).not.toBe("rgb(255, 255, 255)");
  await expect(page).toHaveURL(/\/wooden-spoon$/);
  await expect(page.locator("[data-morph-ghost]")).toHaveCount(0, { timeout: 4000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Wooden Spoon");
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(errors).toEqual([]);
});

test("direct load of /wooden-spoon renders the hero with no errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/wooden-spoon");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test("browser back returns to Home with the title visible", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(800);
  await page.getByRole("navigation").getByRole("link", { name: "Cutting Board", exact: true }).click();
  await expect(page).toHaveURL(/\/cutting-board$/);
  await expect(page.locator("[data-morph-ghost]")).toHaveCount(0, { timeout: 4000 });
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Maker Portfolio");
});

test("scene follows the route", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-scene", "home");
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-scene", "spoon");
});

test("modifier-clicks are not hijacked", async ({ page, context }) => {
  await page.goto("/");
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("navigation").getByRole("link", { name: "Cutting Board", exact: true }).click({ modifiers: ["Meta"] }),
  ]);
  await expect(page).toHaveURL(/\/$/);
  await popup.close();
});

test("first load has no hydration mismatch", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await page.waitForTimeout(1500);
  expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([]);
});

test("in-flight ghosts keep the source typography (captured before unmount)", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  await page.waitForTimeout(800); // past the fade-out, into the flight
  const sizes = await page.locator("[data-morph-ghost]").evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
  expect(sizes.length).toBeGreaterThan(0);
  expect(Math.max(...sizes)).toBeGreaterThan(60); // the hero title ghost is still display-size
});
