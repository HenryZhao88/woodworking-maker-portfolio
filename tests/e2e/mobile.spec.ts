import { devices } from "@playwright/test";
import { test, expect } from "./fixtures";
import { scrollToY, scrollPin } from "./helpers";

const { defaultBrowserType: _unused, ...iphone } = devices["iPhone 13"];
void _unused;
test.use({ ...iphone });

const luminance = async (png: Buffer) => {
  const sharp = (await import("sharp")).default;
  const { channels } = await sharp(png).stats();
  return (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
};

test("phone: scrolling the process never leaves a near-empty screen", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const [top, bottom] = await page.locator("[data-process]").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [r.top + scrollY, r.bottom + scrollY];
  });
  const vh = page.viewportSize()!.height;
  const worst: number[] = [];
  for (let i = 0; i <= 30; i++) {
    await scrollToY(page, Math.round(top + ((bottom - top - vh) * i) / 30));
    await page.waitForTimeout(500);
    // Share of the screen covered by photos that are actually showing (opacity and on-screen area).
    const cover = await page.evaluate(() => {
      const H = innerHeight;
      const W = innerWidth;
      let area = 0;
      document.querySelectorAll<HTMLElement>("[data-process] [data-card]").forEach((c) => {
        const r = c.getBoundingClientRect();
        const h = Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0));
        const w = Math.max(0, Math.min(r.right, W) - Math.max(r.left, 0));
        area += h * w * Number(getComputedStyle(c).opacity);
      });
      // Stage titles and captions count as content too.
      document.querySelectorAll<HTMLElement>("[data-process] [data-stage] > div:first-child").forEach((hd) => {
        const r = hd.getBoundingClientRect();
        area += Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0)) * W * 0.6;
      });
      return area / (W * H);
    });
    worst.push(cover);
  }
  expect(Math.min(...worst), `photo coverage per screen: ${worst.map((w) => w.toFixed(2)).join(" ")}`).toBeGreaterThan(0.25);
});

test("phone: the 'From every side' heading is not covered by the photo", async ({ page }) => {
  await page.goto("/wooden-spoon");
  for (const at of [0.05, 0.5, 0.95]) {
    await scrollPin(page, "[data-overall]", at);
    await page.waitForTimeout(900);
    const [headBottom, photoTop] = await page.evaluate(() => {
      const h = document.querySelector("#finished-h")!.getBoundingClientRect();
      const f = document.querySelector("[data-view][data-active] [data-photo]")!.getBoundingClientRect();
      return [h.bottom, f.top];
    });
    expect(photoTop, `view at ${at}`).toBeGreaterThanOrEqual(headBottom + 8);
  }
});

test("phone: a soft scrim sits behind the nav so text scrolling under it doesn't collide", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const lede = page.locator("main p").filter({ hasText: /\w{4,}/ }).first();
  const y = await lede.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await scrollToY(page, Math.round(y - 10)); // paragraph text right under the nav
  await page.waitForTimeout(900);
  const navBox = (await page.locator("body > header, header:has(nav)").first().boundingBox())!;
  // Sample a strip of the nav bar between the logo and the links, where only background/text-under-nav shows.
  const png = await page.screenshot({ clip: { x: 60, y: navBox.y + 4, width: 40, height: navBox.height - 8 } });
  expect(await luminance(png)).toBeLessThan(40);
});

test("phone: grid tiles arrive quickly instead of flying in from deep space", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const tile = page.locator("[data-tile]").first();
  const y = await tile.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const vh = page.viewportSize()!.height;
  await scrollToY(page, Math.round(y - vh * 0.78)); // tile top at 78% of the screen
  await page.waitForTimeout(1600);
  expect(Number(await tile.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.7);
});
