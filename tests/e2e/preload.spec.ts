import { test as raw, expect as rawExpect } from "@playwright/test";
import { test, expect } from "./fixtures";

test("first visit to Home preloads every photo the spoon page will show (and prefetches the route)", async ({ page }) => {
  const fetched = new Set<string>();
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith("/img/")) fetched.add(u.pathname + u.search);
  });
  await page.goto("/"); // waits for the loader to hand off
  const duringLoader = new Set(fetched);
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  await expect(page).toHaveURL(/\/wooden-spoon$/);
  await expect(page.locator("[data-morph-ghost]")).toHaveCount(0, { timeout: 8000 });
  const shown = await page.locator("main img").evaluateAll((els) =>
    els.map((e) => {
      const u = new URL((e as HTMLImageElement).currentSrc);
      return u.pathname + u.search;
    })
  );
  expect(shown.length).toBeGreaterThan(20);
  const missing = shown.filter((s) => !duringLoader.has(s));
  expect(missing, "spoon photos not fetched during the first loader").toEqual([]);
});

raw("the loading screen shows an animated ASCII fire", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const fire = page.locator("[data-loader] canvas[data-fire][data-running]");
  await rawExpect(fire).toBeVisible({ timeout: 5000 });
  // Read the canvas pixels directly (instant), twice, a few frames apart.
  // Sample while the loader is still up (once it hands off, the fire is told to die out).
  const changed = await fire.evaluate(async (c) => {
    const canvas = c as HTMLCanvasElement;
    let prev = canvas.toDataURL();
    for (let i = 0; i < 8 && !document.documentElement.hasAttribute("data-loader-done"); i++) {
      await new Promise((r) => setTimeout(r, 70));
      const now = canvas.toDataURL();
      if (now !== prev) return true;
      prev = now;
    }
    return false;
  });
  rawExpect(changed, "fire frames should change").toBe(true);
});

test("photos are never downloaded twice: texture builds after a page change are served from the browser cache", async ({ page }) => {
  // Chrome's network log says, per request, whether it was answered from cache or went over the network.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  const fetches = new Map<string, string>();
  const fromNetwork = new Set<string>();
  let navigated = false;
  cdp.on("Network.requestWillBeSent", (e) => {
    if (navigated && e.type === "Fetch" && e.request.url.includes("/img/projects/")) fetches.set(e.requestId, e.request.url);
  });
  cdp.on("Network.responseReceived", (e) => {
    if (fetches.has(e.requestId) && !e.response.fromDiskCache && !e.response.fromPrefetchCache && !e.response.fromServiceWorker) fromNetwork.add(fetches.get(e.requestId)!);
  });
  await page.goto("/");
  navigated = true;
  await page.getByRole("navigation").getByRole("link", { name: "Wooden Spoon", exact: true }).click();
  await expect(page.locator("[data-photo][data-gl-ready]").first()).toBeAttached({ timeout: 15000 });
  await page.waitForTimeout(1500);
  expect(fetches.size, "texture builds read the photo bytes").toBeGreaterThan(0);
  expect([...fromNetwork], "photos downloaded again").toEqual([]);
});

