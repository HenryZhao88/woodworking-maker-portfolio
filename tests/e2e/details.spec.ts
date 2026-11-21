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

for (const [w, h] of [[1440, 900], [390, 664]]) {
  test(`gold brackets sit exactly on the photo's corners (${w}x${h})`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/wooden-spoon");
    for (const n of [1, 2, 3] as const) {
      await scrollPin(page, "[data-details]", at[n]);
      await page.waitForTimeout(1600);
      const off = await page.evaluate(() => {
        const f = document.querySelector("[data-details] [data-detail-frame][data-active]")!;
        const p = f.querySelector("[data-photo]")!.getBoundingClientRect();
        const c = (k: string) => f.querySelector(`[data-corner="${k}"]`)!.getBoundingClientRect();
        // Outer corner of each bracket vs the photo corner: the 2px line sits just outside the edge.
        return [
          c("tl").left - p.left, c("tl").top - p.top,
          c("tr").right - p.right, c("tr").top - p.top,
          c("bl").left - p.left, c("bl").bottom - p.bottom,
          c("br").right - p.right, c("br").bottom - p.bottom,
        ].map((d) => Math.abs(Math.abs(d) - 2));
      });
      expect(Math.max(...off), `detail ${n}: ${off.join(",")}`).toBeLessThanOrEqual(1);
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

for (const width of [1440, 390]) {
  test(`rendered detail photo aligns with brackets with a scrollbar gutter (${width}px)`, async ({ page }) => {
    test.skip(process.env.NO_WEBGL === "1", "WebGL projection regression");
    const sharp = (await import("sharp")).default;
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/wooden-spoon");
    // Reproduce the reserved space used by classic scrollbars, including in headless Chromium.
    await page.addStyleTag({ content: "html { scrollbar-gutter: stable; }" });
    await expect.poll(() => page.locator('canvas[data-engine^="three.js"]').evaluate((c) => c.getBoundingClientRect().width)).toBeLessThan(width);
    for (const n of [1, 2, 3] as const) {
      await scrollPin(page, "[data-details]", at[n]);
      const photo = page.locator("[data-detail-frame][data-active] [data-photo]");
      await expect(photo).toHaveAttribute("data-gl-ready", "");
      await page.waitForTimeout(1600);
      const box = (await photo.boundingBox())!;
      // Sample away from the gold brackets: these photos have light backgrounds at both edges.
      const strip = await page.screenshot({ clip: { x: 0, y: Math.ceil(box.y + 30), width, height: 1 } });
      const { data, info } = await sharp(strip).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const bright = Array.from({ length: info.width }, (_, x) => x).filter((x) =>
        data[x * 3] > 70 && data[x * 3 + 1] > 70 && data[x * 3 + 2] > 70
      );
      expect(Math.abs(bright[0] - box.x), `detail ${n}: rendered left edge`).toBeLessThanOrEqual(1);
      expect(Math.abs(bright.at(-1)! + 1 - (box.x + box.width)), `detail ${n}: rendered right edge`).toBeLessThanOrEqual(1);
    }
  });
}
