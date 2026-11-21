import { test, expect } from "./fixtures";
import { scrollPin } from "./helpers";

for (const [w, h] of [[1000, 480], [1280, 640], [1440, 900], [1920, 1080], [768, 1024]]) {
  test(`'From every side' heading, photo and counter never overlap (${w}x${h})`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/wooden-spoon");
    for (const at of [0.05, 0.5, 0.95]) {
      await scrollPin(page, "[data-overall]", at);
      await page.waitForTimeout(1000);
      const r = await page.evaluate(() => {
        const head = document.querySelector("#finished-h")!.getBoundingClientRect();
        const photo = document.querySelector("[data-view][data-active] [data-photo]")!.getBoundingClientRect();
        const counter = document.querySelector("[data-counter]")!.parentElement!.getBoundingClientRect();
        return { headBottom: head.bottom, photoTop: photo.top, photoBottom: photo.bottom, counterTop: counter.top, counterRight: counter.right, vw: innerWidth };
      });
      expect(r.photoTop, `photo below heading at ${at}`).toBeGreaterThanOrEqual(r.headBottom + 8);
      expect(r.photoBottom, `photo above counter at ${at}`).toBeLessThanOrEqual(r.counterTop - 4);
      expect(r.counterRight, "counter fully on screen").toBeLessThanOrEqual(r.vw);
    }
  });
}
