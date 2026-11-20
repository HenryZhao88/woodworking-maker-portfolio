import { test as base, expect } from "@playwright/test";

/** Every page.goto waits for the boot loader to finish, like a real visitor would. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (url, opts) => {
      const res = await goto(url, opts);
      await page.waitForSelector("html[data-loader-done]", { timeout: 20000, state: "attached" });
      return res;
    };
    await use(page);
  },
});
export { expect };
