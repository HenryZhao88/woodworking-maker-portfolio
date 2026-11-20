import { test, expect } from "@playwright/test";
import { getProject } from "../../content/projects";

const spoon = getProject("wooden-spoon")!;

test("spoon page renders rubric section headings", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Wooden Spoon");
  for (const h of [spoon.about!.heading, spoon.favorite!.heading, spoon.challenging!.heading, spoon.impression!.heading]) {
    await expect(page.getByRole("heading", { name: h })).toHaveCount(1);
  }
});

test("spoon page includes every photo with alt text", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const srcs = await page.locator("main img").evaluateAll((els) => els.map((e) => (e as HTMLImageElement).alt.trim()));
  expect(srcs.length).toBeGreaterThanOrEqual(19);
  expect(srcs.every((a) => a.length > 0)).toBe(true);
});

test("photo frames keep the image's aspect ratio (no subject crop)", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const bad = await page.locator("main img[data-w]").evaluateAll((els) =>
    els
      .map((e) => {
        const img = e as HTMLImageElement;
        const r = { width: img.offsetWidth, height: img.offsetHeight };
        if (r.width < 2 || r.height < 2) return null;
        const want = Number(img.dataset.w) / Number(img.dataset.h);
        const got = r.width / r.height;
        return Math.abs(got - want) / want > 0.03 ? `${img.src} ${got.toFixed(2)} vs ${want.toFixed(2)}` : null;
      })
      .filter(Boolean)
  );
  expect(bad).toEqual([]);
});
