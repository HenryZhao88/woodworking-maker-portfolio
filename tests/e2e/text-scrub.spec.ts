import { test, expect } from "./fixtures";
import { scrollToY } from "./helpers";

const wordOpacities = (page: import("@playwright/test").Page, text: string) =>
  page.evaluate((t) => {
    const p = [...document.querySelectorAll<HTMLElement>("main p")].find((el) => el.textContent?.includes(t))!;
    return [...p.querySelectorAll<HTMLElement>("[data-word]")].map((w) => Number(getComputedStyle(w).opacity));
  }, text);

test("story paragraphs light up word by word as you scroll through them", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const p = page.locator("main p", { hasText: "I drew the design" });
  const top = await p.evaluate((el) => el.getBoundingClientRect().top + scrollY);

  await scrollToY(page, Math.round(top - 900)); // paragraph just entering at the bottom
  await page.waitForTimeout(800);
  const early = await wordOpacities(page, "I drew the design");
  expect(early.length).toBeGreaterThan(10);
  expect(Math.max(...early)).toBeLessThan(0.5);

  await scrollToY(page, Math.round(top - 520)); // partway through: a lit part and a dim part
  await page.waitForTimeout(1000);
  const mid = await wordOpacities(page, "I drew the design");
  expect(mid[0]).toBeGreaterThan(0.9);
  expect(mid[mid.length - 1]).toBeLessThan(0.5);

  await scrollToY(page, Math.round(top - 100)); // well past: fully lit
  await page.waitForTimeout(1000);
  expect(Math.min(...(await wordOpacities(page, "I drew the design")))).toBeGreaterThan(0.95);
});
