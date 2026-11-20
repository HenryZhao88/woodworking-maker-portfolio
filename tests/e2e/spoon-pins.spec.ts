import { test, expect } from "@playwright/test";
import { getProject } from "../../content/projects";
import { scrollPin } from "./helpers";

const spoon = getProject("wooden-spoon")!;

test("process heading present", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.getByRole("heading", { name: spoon.process!.heading })).toHaveCount(1);
});

test("filmstrip scrolls horizontally to the last process photo", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const last = page.locator('[data-process] img[src*="process-13"]');
  await scrollPin(page, "[data-process]", 0.02);
  const before = await last.boundingBox();
  expect(before!.x).toBeGreaterThan(1440);
  await scrollPin(page, "[data-process]", 1);
  const after = await last.boundingBox();
  expect(after!.x).toBeGreaterThanOrEqual(0);
  expect(after!.x + after!.width).toBeLessThanOrEqual(1440 + 1);
});

test("stage rail updates from first to last stage", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const current = page.locator("[data-stage-current]");
  await scrollPin(page, "[data-process]", 0.02);
  await expect(current).toHaveText("Blank & Layout");
  await scrollPin(page, "[data-process]", 0.99);
  await expect(current).toHaveText("Finishing");
});

test("survives resize to phone mid-section without horizontal overflow", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await scrollPin(page, "[data-process]", 0.5);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator('[data-process] img[src*="process-01"]')).toBeVisible();
});

test("overall views cycle through 3 photos while pinned", async ({ page }) => {
  await page.goto("/wooden-spoon");
  for (const [p, n] of [[0.1, 1], [0.5, 2], [0.92, 3]] as const) {
    await scrollPin(page, "[data-overall]", p);
    await expect(page.locator("[data-overall]")).toHaveAttribute("data-overall-active", String(n));
    const topSrc = await page.locator("[data-overall] [data-view]").evaluateAll((els) => {
      const best = els.map((e) => ({ e, o: Number(getComputedStyle(e).opacity) })).sort((a, b) => b.o - a.o)[0];
      return best.e.querySelector("img")!.getAttribute("src")!;
    });
    expect(topSrc).toContain(`overall-${n}`);
  }
});

test("detail dive shows each detail caption", async ({ page }) => {
  await page.goto("/wooden-spoon");
  for (const d of spoon.finished!.details) {
    await expect(page.getByText(d.caption!)).toHaveCount(1);
  }
});

test("strip skew settles back to zero after scrolling stops", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await scrollPin(page, "[data-process]", 0.2);
  const start = await page.evaluate(() => scrollY);
  for (let i = 1; i <= 8; i++) {
    await page.evaluate((y) => (window as any).__lenis.scrollTo(y, { immediate: true }), start + i * 220);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(2000);
  const skew = await page.locator("[data-track]").evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return Math.abs(m.c);
  });
  expect(skew).toBeLessThan(0.01);
});
