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

test("captions come into focus word by word (blurred, then sharp) and always show the real words", async ({ page }) => {
  await page.goto("/wooden-spoon");
  // Settle on detail 1 first (the pin's range can still shift while the page finishes laying out).
  await expect(async () => {
    await scrollPin(page, "[data-details]", at[1]);
    await expect(page.locator("[data-details]")).toHaveAttribute("data-detail-active", "1", { timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await page.waitForTimeout(1200);
  const cap = page.locator("[data-details] [data-detail-cap][data-active]");
  // Jump to detail 2 and record, from inside the page, the strongest word blur seen once it switches.
  const maxBlur = await page.evaluate(async () => {
    const el = document.querySelector<HTMLElement>("[data-details]")!;
    let max = 0;
    // Watch the words' inline styles: the starting blur is applied the instant a caption switches,
    // independent of how long the next frame takes on a busy machine.
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        const f = (r.target as HTMLElement).style.filter;
        max = Math.max(max, parseFloat(f.match(/blur\(([\d.]+)px\)/)?.[1] ?? "0"));
      }
    });
    el.querySelectorAll("[data-detail-cap] [data-word]").forEach((w) => mo.observe(w, { attributes: true, attributeFilter: ["style"] }));
    const end = Number(el.dataset.pinEnd), start = Number(el.dataset.pinStart);
    (window as unknown as { __lenis: { scrollTo: (y: number, o: object) => void } }).__lenis.scrollTo(start + (end - start) * 0.5, { immediate: true, force: true });
    const t0 = performance.now();
    while (performance.now() - t0 < 5000 && max <= 1) await new Promise((r) => setTimeout(r, 50));
    mo.disconnect();
    return max;
  });
  expect(maxBlur, "words start blurred").toBeGreaterThan(1);
  expect((await cap.textContent())?.replace(/\s+/g, " ").trim()).toBe(details[1].caption);
  await page.waitForTimeout(1600);
  const late = await cap.evaluate((el) => [...el.querySelectorAll<HTMLElement>("[data-word]")].map((w) => getComputedStyle(w).filter));
  expect(late.every((f) => f === "none" || /blur\(0px\)/.test(f)), `filters: ${late.join(",")}`).toBe(true);
});

test("the detail number rolls like an odometer inside a mask", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const mask = page.locator("[data-details] [data-detail-num]").locator("xpath=..");
  expect(await mask.evaluate((el) => getComputedStyle(el).overflow)).toMatch(/hidden|clip/);
  await scrollPin(page, "[data-details]", at[3]);
  await expect(page.locator("[data-details] [data-detail-num]")).toHaveText("03");
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
