import { test, expect } from "./fixtures";

const fam = (page: import("@playwright/test").Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => getComputedStyle(el).fontFamily + "|" + getComputedStyle(el).fontStyle);

test("type system: Switzer for titles and text, Zodiak italic as the accent voice", async ({ page }) => {
  await page.goto("/");
  expect(await fam(page, "h1")).toMatch(/switzer/i);
  expect(await fam(page, "body")).toMatch(/switzer/i);
  expect(await fam(page, '[data-flip-id="site-title"]')).toMatch(/switzer.*\|normal/i);
  expect(await fam(page, '[data-testid="byline-name"]')).toMatch(/zodiak.*\|italic/i);
  await page.goto("/wooden-spoon");
  expect(await fam(page, "h1")).toMatch(/switzer/i);
  expect(await fam(page, "main h2")).toMatch(/zodiak.*\|italic/i);
  const html = await page.content();
  expect(html).not.toMatch(/fraunces/i);
});
