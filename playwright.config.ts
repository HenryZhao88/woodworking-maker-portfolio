import { defineConfig, devices } from "@playwright/test";

const PORT = 4317;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
    // NO_WEBGL=1 runs the whole suite against the DOM fallback.
    launchOptions: process.env.NO_WEBGL ? { args: ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis"] } : {},
  },
  // The editor test rewrites source files (then restores them), which hot-reloads open pages, so it runs last, alone.
  projects: [
    { name: "site", testIgnore: /dev-editor/ },
    { name: "editor", testMatch: /dev-editor/, dependencies: ["site"] },
  ],
  webServer: {
    command: `node scripts/image-variants.mjs && npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
