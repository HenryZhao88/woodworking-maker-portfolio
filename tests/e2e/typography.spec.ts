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

test("process stage names and the overall-view counter use Boska, upright", async ({ page }) => {
  await page.goto("/wooden-spoon");
  expect(await fam(page, "[data-stage] h3")).toMatch(/boska.*\|normal/i);
  expect(await fam(page, "[data-counter]")).toMatch(/boska.*\|normal/i);
});

test("no monospace UI text anywhere: nav and labels use Switzer in normal case", async ({ page }) => {
  for (const url of ["/", "/wooden-spoon"]) {
    await page.goto(url);
    const mono = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
        .filter((el) => /mono/i.test(getComputedStyle(el).fontFamily))
        .map((el) => `${el.tagName}.${el.className}: ${el.textContent!.trim().slice(0, 30)}`)
    );
    expect(mono, url).toEqual([]);
  }
  await page.goto("/");
  const link = page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true });
  expect(await link.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/switzer/i);
  expect(await link.evaluate((el) => getComputedStyle(el).textTransform)).toBe("none");
});
