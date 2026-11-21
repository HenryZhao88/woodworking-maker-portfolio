import { test, expect } from "./fixtures";
import { scrollPin } from "./helpers";
import { getProject } from "../../content/projects";

const details = getProject("wooden-spoon")!.finished!.details;
const at = { 1: 0.12, 2: 0.5, 3: 0.9 } as const;

test("the inspection bench steps through details 01 → 02 → 03 as you scroll", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const section = page.locator("[data-details]");
  for (const n of [1, 2, 3] as const) {
    await scrollPin(page, "[data-details]", at[n]);
    await expect(section).toHaveAttribute("data-detail-active", String(n));
    await expect(section.locator("[data-detail-num]")).toHaveText(`0${n}`);
    await expect(section.locator(`[data-detail-cap][data-active]`)).toHaveText(details[n - 1].caption!, { timeout: 4000 });
  }
});

test("captions scramble through other letters before settling on the real text", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await scrollPin(page, "[data-details]", at[1]);
  await page.waitForTimeout(1500);
  await scrollPin(page, "[data-details]", at[2]); // scrollPin waits ~700ms; sample right after the switch
  const cap = page.locator("[data-details] [data-detail-cap][data-active]");
  const samples: string[] = [];
  for (let i = 0; i < 6; i++) {
    samples.push((await cap.textContent()) ?? "");
    await page.waitForTimeout(60);
  }
  await expect(cap).toHaveText(details[1].caption!, { timeout: 4000 });
  expect(samples.some((s) => s !== details[1].caption), `samples: ${samples.join(" | ")}`).toBe(true);
});

for (const [w, h] of [[1440, 900], [1000, 480], [390, 664]]) {
  test(`detail photo is shown whole and clear of the number and caption (${w}x${h})`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/wooden-spoon");
    for (const n of [1, 2, 3] as const) {
      await scrollPin(page, "[data-details]", at[n]);
      await page.waitForTimeout(1600);
      const r = await page.evaluate(() => {
        const box = (s: string) => document.querySelector(`[data-details] ${s}`)!.getBoundingClientRect();
        const photo = box("[data-detail-frame][data-active] [data-photo]");
        const num = box("[data-detail-num]");
        const cap = box("[data-detail-cap][data-active]");
        const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        return {
          inside: photo.left >= -1 && photo.top >= -1 && photo.right <= innerWidth + 1 && photo.bottom <= innerHeight + 1,
          numHit: hit(photo, num),
          capHit: hit(photo, cap),
        };
      });
      expect(r, `detail ${n}`).toEqual({ inside: true, numHit: false, capHit: false });
    }
  });
}

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("all three details and captions show as a static list", async ({ page }) => {
    await page.goto("/wooden-spoon");
    const section = page.locator("[data-details]");
    await section.scrollIntoViewIfNeeded();
    for (const d of details) await expect(section.getByText(d.caption!, { exact: true })).toBeVisible();
    await expect(section.locator("[data-detail-frame] [data-photo]")).toHaveCount(3);
  });
});
