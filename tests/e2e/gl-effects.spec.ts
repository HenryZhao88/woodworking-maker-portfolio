import { test, expect } from "./fixtures";
import { scrollToY } from "./helpers";

test("favorite photo dissolves in via wood-grain shader progress (--p 0 → 1)", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const media = page.locator('[data-gl-effect="grainMask"]');
  const top = await media.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await scrollToY(page, top - 900); // just entering
  const early = Number(await media.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--p") || "0"));
  await scrollToY(page, top + 200);
  await page.waitForTimeout(1200);
  const late = Number(await media.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--p")));
  expect(early).toBeLessThan(0.1);
  expect(late).toBeGreaterThan(0.9);
});

test("DOM slats are hidden when the WebGL layer handles the grain reveal", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.locator('[data-gl-effect="grainMask"] [data-photo]')).toHaveAttribute("data-gl-ready", "", { timeout: 15000 });
  await expect(page.locator("[data-slat]").first()).toBeHidden();
});

test("challenging photo stays a DOM wipe (not mirrored in WebGL)", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.locator('section[aria-labelledby="challenging-h"] [data-photo]')).not.toHaveAttribute("data-gl", "");
});

test("overall views and mosaic tiles expose fade sources for the planes", async ({ page }) => {
  await page.goto("/wooden-spoon");
  await expect(page.locator("[data-view][data-gl-fade]")).toHaveCount(3);
  expect(await page.locator("[data-tile][data-gl-fade]").count()).toBeGreaterThanOrEqual(19);
});

test("WebGL photos stay clipped to their section (the detail bench never bleeds into the next section)", async ({ page }) => {
  const sharp = (await import("sharp")).default;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/wooden-spoon");
  const bottom = await page.locator("section:has([data-details])").evaluate((el) => el.getBoundingClientRect().bottom + scrollY);
  await scrollToY(page, Math.round(bottom - 900 * 0.45)); // section ends 45% down the screen
  await page.waitForTimeout(1500);
  // A strip in the next section, away from its centered text.
  const png = await page.screenshot({ clip: { x: 1200, y: 650, width: 200, height: 200 } });
  const { channels } = await sharp(png).stats();
  const mean = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
  expect(mean, "next section background should stay dark walnut").toBeLessThan(60);
});

test("page change builds photo textures off the main thread, one decode at a time (no stutter during the morph)", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __dec: { active: number; max: number; total: number; draw2d: number; syncMs: number } };
    w.__dec = { active: 0, max: 0, total: 0, draw2d: 0, syncMs: 0 };
    const orig = window.createImageBitmap.bind(window);
    // @ts-expect-error test wrapper keeps the original signature
    window.createImageBitmap = async (...args: Parameters<typeof createImageBitmap>) => {
      w.__dec.active++;
      w.__dec.total++;
      w.__dec.max = Math.max(w.__dec.max, w.__dec.active);
      // Time the call itself: decoding an <img> source happens right here, blocking the main thread.
      const t0 = performance.now();
      const pending = orig(...args);
      w.__dec.syncMs += performance.now() - t0;
      try {
        return await pending;
      } finally {
        w.__dec.active--;
      }
    };
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (this: CanvasRenderingContext2D, ...a: unknown[]) {
      if (a[0] instanceof HTMLImageElement && /projects/.test(a[0].currentSrc)) w.__dec.draw2d++;
      // @ts-expect-error passthrough
      return draw.apply(this, a);
    } as typeof draw;
  });
  await page.goto("/");
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  await expect(page.locator("[data-photo][data-gl-ready]").first()).toBeAttached({ timeout: 15000 });
  await page.waitForTimeout(1500);
  const d = await page.evaluate(() => (window as unknown as { __dec: { max: number; total: number; draw2d: number; syncMs: number } }).__dec);
  expect(d.total, "textures were built").toBeGreaterThan(0);
  expect(d.syncMs, `main thread blocked by decodes across ${d.total} textures (ms)`).toBeLessThan(40);
  expect(d.max, "parallel decodes").toBe(1);
  expect(d.draw2d, "photos resized on the main thread").toBe(0);
});

test("a still page stops redrawing at full rate; scrolling redraws every frame", async ({ page }) => {
  test.skip(process.env.NO_WEBGL === "1", "WebGL only");
  await page.goto("/wooden-spoon");
  await page.waitForFunction(() => !!(window as unknown as { __glFrames?: object }).__glFrames, null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  // Count display frames and canvas redraws over the same window.
  const rate = (scroll: boolean) =>
    page.evaluate(async (scroll) => {
      const g = (window as unknown as { __glFrames: { renders: number } }).__glFrames;
      const lenis = (window as unknown as { __lenis: { scrollTo: (y: number, o: object) => void } }).__lenis;
      let frames = 0;
      const r0 = g.renders;
      const t0 = performance.now();
      await new Promise<void>((done) => {
        const f = () => {
          frames++;
          if (scroll) lenis.scrollTo(scrollY + 6, { immediate: true, force: true });
          if (performance.now() - t0 < 2000) requestAnimationFrame(f);
          else done();
        };
        requestAnimationFrame(f);
      });
      return { frames, renders: g.renders - r0 };
    }, scroll);
  const idle = await rate(false);
  // At rest only the backdrop changes, at 30fps: at most ~60 redraws in 2s, whatever the display rate.
  expect(idle.renders, `idle: ${JSON.stringify(idle)}`).toBeLessThanOrEqual(68);
  expect(idle.renders, "the backdrop still drifts").toBeGreaterThan(10);
  // Scroll among the process photos, so photo planes are on screen and must follow the page every frame.
  const y = await page.locator("[data-process] [data-card]").first().evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => (window as unknown as { __lenis: { scrollTo: (y: number, o: object) => void } }).__lenis.scrollTo(y - 200, { immediate: true, force: true }), y);
  await page.waitForTimeout(1500);
  const moving = await rate(true);
  expect(moving.renders, `scroll: ${JSON.stringify(moving)}`).toBeGreaterThan(moving.frames * 0.8);
});
