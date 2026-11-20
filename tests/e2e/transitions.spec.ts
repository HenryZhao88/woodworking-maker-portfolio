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

const titleLines = (page: import("@playwright/test").Page, sel: string) =>
  page.evaluate((s) => {
    const el = [...document.querySelectorAll<HTMLElement>(s)].sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
    if (!el) return -1;
    const cs = getComputedStyle(el);
    return Math.round(el.offsetHeight / (parseFloat(cs.fontSize) * parseFloat(cs.lineHeight === "normal" ? "1.2" : String(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)))));
  }, sel);

for (const width of [1280, 1440, 1512, 1920, 390]) {
  test(`spoon title is two lines on direct load and stays two lines (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/wooden-spoon");
    const sel = 'h1[data-flip-id="page-title"]';
    expect(await titleLines(page, sel)).toBe(2);
    await page.waitForTimeout(2500); // letter reveal done
    expect(await titleLines(page, sel)).toBe(2);
  });
}

test("the landing title ghost has the same line breaks as the real title (no jump on landing)", async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 900 });
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  await expect(page).toHaveURL(/\/wooden-spoon$/);
  await page.waitForFunction(() => [...document.querySelectorAll("[data-morph-ghost]")].some((g) => /Wooden/.test(g.textContent ?? "") && parseFloat(getComputedStyle(g).fontSize) > 60));
  const ghost = await titleLines(page, "[data-morph-ghost]");
  await expect(page.locator("[data-morph-ghost]")).toHaveCount(0, { timeout: 4000 });
  const real = await titleLines(page, 'h1[data-flip-id="page-title"]');
  await page.waitForTimeout(2000);
  expect(await titleLines(page, 'h1[data-flip-id="page-title"]')).toBe(real);
  expect(real).toBe(2);
  expect(ghost).toBe(2);
});

test("spoon title keeps its accessible name with the space", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.getByRole("heading", { level: 1, name: "Wooden Spoon", exact: true })).toBeVisible();
});
