import { test as raw } from "@playwright/test";
import { test, expect } from "./fixtures";
import { scrollToY } from "./helpers";

test.use({ reducedMotion: "reduce" });

test("reduced motion: every heading and photo is visible after scrolling through", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 700) await scrollToY(page, y);
  await page.waitForTimeout(1200);
  const hidden = await page.evaluate(() => {
    const bad: string[] = [];
    document.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main [data-photo]").forEach((el) => {
      let n: HTMLElement | null = el;
      while (n && n !== document.body) {
        const cs = getComputedStyle(n);
        if (cs.visibility === "hidden" || Number(cs.opacity) < 0.05 || cs.display === "none") {
          bad.push(`${el.tagName} ${el.textContent?.slice(0, 30) || el.getAttribute("aria-label")}`);
          break;
        }
        n = n.parentElement;
      }
    });
    document.querySelectorAll<HTMLElement>("[data-slat]").forEach((s) => {
      if (getComputedStyle(s).display !== "none" && getComputedStyle(s.parentElement!).display !== "none") bad.push("slat covering photo");
    });
    return bad;
  });
  expect(hidden).toEqual([]);
});

raw.describe("reduced motion, first paint", () => {
  raw.use({ reducedMotion: "reduce" });
  raw("no loading screen: the page is readable on first paint", async ({ page }) => {
  await page.goto("/", { waitUntil: "commit" });
  await page.waitForSelector("h1", { state: "attached" });
  // Before any script runs, the loader must already be out of the way.
  expect(await page.locator("[data-loader]").isVisible(), "loader covers the first paint").toBe(false);
  await expect(page.locator("html[data-loader-done]")).toBeAttached({ timeout: 3000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

for (const path of ["/", "/wooden-spoon"]) {
  test(`reduced motion: all text on ${path} is visible at once, without waiting for scroll`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(800);
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main p")]
        .filter((e) => {
          const cs = getComputedStyle(e);
          return e.getBoundingClientRect().height > 0 && (cs.visibility === "hidden" || Number(cs.opacity) < 0.05);
        })
        .map((e) => e.textContent?.trim().slice(0, 40))
    );
    expect(hidden).toEqual([]);
  });
}

test("reduced motion: no pinned section adds more than one viewport of scroll", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const extra = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".pin-spacer")].map((s) => s.offsetHeight - (s.firstElementChild as HTMLElement).offsetHeight)
  );
  const vh = await page.evaluate(() => innerHeight);
  extra.forEach((e) => expect(e).toBeLessThanOrEqual(vh));
});

test("reduced motion: navigation still works without the morph", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  await expect(page).toHaveURL(/wooden-spoon/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("photos are labelled buttons for assistive tech", async ({ page }) => {
  await page.goto("/wooden-spoon");
  const unlabeled = await page.locator("main [data-photo]").evaluateAll((els) => els.filter((e) => !e.getAttribute("aria-label")?.startsWith("View full size")).length);
  expect(unlabeled).toBe(0);
});

test("headings keep clean accessible names after letter-splitting", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Maker Portfolio" })).toBeVisible();
  await page.goto("/wooden-spoon");
  await expect(page.getByRole("heading", { level: 1, name: "Wooden Spoon" })).toBeVisible();
  const badAria = await page.locator("main p[aria-label], main span[aria-label]").count();
  expect(badAria).toBe(0);
});
