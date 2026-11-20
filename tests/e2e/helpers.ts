import type { Page } from "@playwright/test";

/** Jump to an absolute scroll position, through Lenis when it's active. */
export async function scrollToY(page: Page, y: number) {
  await page.evaluate((y) => {
    const l = (window as unknown as { __lenis?: { scrollTo: (y: number, o: object) => void } }).__lenis;
    if (l) l.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }, y);
  await page.waitForTimeout(700);
}

/** Scroll to a fraction (0..1) of a pinned section's scroll range (exposed as data-pin-start/end). */
export async function scrollPin(page: Page, selector: string, progress: number) {
  const el = page.locator(selector);
  await el.waitFor({ state: "attached" });
  await page.waitForFunction((s) => document.querySelector(s)?.hasAttribute("data-pin-end"), selector);
  const [start, end] = await el.evaluate((n) => [Number(n.getAttribute("data-pin-start")), Number(n.getAttribute("data-pin-end"))]);
  await scrollToY(page, start + (end - start) * progress);
}
