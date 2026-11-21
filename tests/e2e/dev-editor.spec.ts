import fs from "node:fs";
import path from "node:path";
import { test, expect } from "./fixtures";

const caretToEnd = (el: import("@playwright/test").Locator) =>
  el.evaluate((n) => {
    (n as HTMLElement).focus();
    const r = document.createRange();
    r.selectNodeContents(n);
    r.collapse(false);
    const s = getSelection()!;
    s.removeAllRanges();
    s.addRange(r);
  });

const CONTENT = path.resolve(__dirname, "../../content/projects.ts");
const ABOUT = path.resolve(__dirname, "../../components/spoon/About.tsx");

test("local text editor: click text, type, save, and the source file changes", async ({ page }) => {
  const before = { content: fs.readFileSync(CONTENT, "utf8"), about: fs.readFileSync(ABOUT, "utf8") };
  try {
    await page.goto("/wooden-spoon");
    await page.getByRole("button", { name: "Edit text" }).click();
    await page.waitForLoadState("load");
    await expect(page.getByRole("button", { name: /^Save/ })).toBeVisible({ timeout: 15000 });

    // A string from the content file (with a gold highlight inside it).
    const lede = page.locator("main p", { hasText: "At the end of September" });
    await lede.click();
    await caretToEnd(lede);
    await page.keyboard.type(" Test edit.");
    // A label written straight into a component.
    const eyebrow = page.locator("main .eyebrow", { hasText: "About the project" });
    await eyebrow.click();
    await caretToEnd(eyebrow);
    await page.keyboard.type("!");
    await expect(page.getByRole("button", { name: "Save 2 changes" })).toBeVisible();
    await page.getByRole("button", { name: "Save 2 changes" }).click();
    await expect(page.getByText("Saved 2 changes")).toBeVisible({ timeout: 10000 });

    const content = fs.readFileSync(CONTENT, "utf8");
    expect(content).toContain("*a small crossbar that sticks out on both sides*. Test edit.");
    expect(fs.readFileSync(ABOUT, "utf8")).toContain("About the project!");
  } finally {
    fs.writeFileSync(CONTENT, before.content);
    fs.writeFileSync(ABOUT, before.about);
  }
});

test("the editor is not in the page unless running locally in edit mode", async ({ page }) => {
  await page.goto("/wooden-spoon");
  expect(await page.locator("[contenteditable=true]").count()).toBe(0);
});
